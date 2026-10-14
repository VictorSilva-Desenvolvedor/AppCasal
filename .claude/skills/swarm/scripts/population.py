#!/usr/bin/env python3
"""Gera população de personas sintéticas, agrupa em arquétipos e divide em A/B.

Uso:
  python3 population.py --n 100 --archetypes 12 --seed 42 --mode ab \
      --target web --segments segments.json --out run/population.json
"""
import argparse
import json
import math
import random
from pathlib import Path

NEGATIVE_QUOTA = 0.25
RULE_AGENT_SHARE = 0.20
ATTITUDES = ["enthusiast", "neutral", "skeptic", "hostile"]
NEGATIVE_ATTITUDES = {"skeptic", "hostile"}
DEVICES = {
    "web": ["desktop", "mobile_web", "tablet"],
    "mobile": ["android_low", "android_mid", "iphone"],
    "desktop": ["1366x768", "1920x1080"],
}
ACCESSIBILITY = ["none"] * 8 + ["low_vision", "motor"]
FIRST_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabi", "Hugo",
               "Iara", "João", "Kátia", "Lucas", "Marta", "Nilo", "Olga", "Paulo",
               "Quésia", "Rafa", "Sônia", "Tiago", "Úrsula", "Vera", "Wagner", "Yara"]
DEFAULT_SEGMENTS = [{"name": "geral", "weight": 1.0}]


def give_up_after(patience: float) -> int:
    """Passos sem progresso tolerados antes de desistir."""
    return round(3 + patience * 12)


def is_negative(p: dict) -> bool:
    return p["attitude"] in NEGATIVE_ATTITUDES or p["patience"] < 0.3 or p["tech_literacy"] < 0.25


def _uniform(rng, bounds, default=(0.0, 1.0)):
    lo, hi = bounds if bounds else default
    return rng.uniform(lo, hi)


def pick_segment(rng, segments):
    total = sum(s["weight"] for s in segments)
    r = rng.uniform(0, total)
    acc = 0.0
    for s in segments:
        acc += s["weight"]
        if r <= acc:
            return s
    return segments[-1]


def make_persona(rng, idx, segment, target):
    p = {
        "id": f"p{idx:04d}",
        "name": rng.choice(FIRST_NAMES),
        "segment": segment["name"],
        "age": int(_uniform(rng, segment.get("age"), (16, 80))),
        "tech_literacy": round(_uniform(rng, segment.get("tech_literacy")), 2),
        "patience": round(_uniform(rng, segment.get("patience")), 2),
        "goal_focus": round(_uniform(rng, segment.get("goal_focus")), 2),
        "ocean": {k: round(rng.random(), 2) for k in "OCEAN"},
        "device": rng.choice(DEVICES[target]),
        "accessibility": [rng.choice(ACCESSIBILITY)],
        "attitude": rng.choice(segment.get("attitudes", ATTITUDES)),
        "policy": "llm",
        "variant": "-",
    }
    p["give_up_after"] = give_up_after(p["patience"])
    return p


def enforce_negative_quota(rng, personas, quota=NEGATIVE_QUOTA):
    """Garante que ao menos `quota` da população seja cética/impaciente/low-tech."""
    needed = math.ceil(len(personas) * quota) - sum(is_negative(p) for p in personas)
    candidates = [p for p in personas if not is_negative(p)]
    rng.shuffle(candidates)
    for p in candidates[:max(0, needed)]:
        p["attitude"] = rng.choice(sorted(NEGATIVE_ATTITUDES))
        p["patience"] = round(rng.uniform(0.0, 0.29), 2)
        p["give_up_after"] = give_up_after(p["patience"])
    return personas


def assign_rule_agents(rng, personas, share=RULE_AGENT_SHARE):
    for p in rng.sample(personas, round(len(personas) * share)):
        p["policy"] = "rule"
    return personas


def assign_variants(personas, mode):
    """A/B estratificado por segmento: alterna A/B dentro de cada segmento."""
    if mode != "ab":
        return personas
    counters = {}
    for p in personas:
        c = counters.get(p["segment"], 0)
        p["variant"] = "A" if c % 2 == 0 else "B"
        counters[p["segment"]] = c + 1
    return personas


def _vector(p):
    return [p["tech_literacy"], p["patience"], p["goal_focus"], min(p["age"], 80) / 80,
            *p["ocean"].values(), 1.0 if p["attitude"] in NEGATIVE_ATTITUDES else 0.0]


def _dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def kmeans(vectors, k, rng, iters=25):
    centroids = [list(v) for v in rng.sample(vectors, k)]
    labels = [0] * len(vectors)
    for _ in range(iters):
        labels = [min(range(k), key=lambda c: _dist(v, centroids[c])) for v in vectors]
        for c in range(k):
            members = [v for v, l in zip(vectors, labels) if l == c]
            if members:
                centroids[c] = [sum(col) / len(members) for col in zip(*members)]
    return labels, centroids


def build_archetypes(rng, personas, k):
    """Agrupa personas LLM em k arquétipos; o representante é o mais próximo do centróide.
    Em modo A/B o agrupamento é feito por variante para que cada uma tenha executados."""
    archetypes = []
    groups = {}
    for p in personas:
        groups.setdefault(p["variant"], []).append(p)
    k_per_group = max(1, k // len(groups))
    for variant, members in sorted(groups.items()):
        llm = [p for p in members if p["policy"] == "llm"] or members
        kk = min(k_per_group, len(llm))
        labels, centroids = kmeans([_vector(p) for p in llm], kk, rng)
        for c in range(kk):
            cluster = [p for p, l in zip(llm, labels) if l == c]
            if not cluster:
                continue
            rep = min(cluster, key=lambda p: _dist(_vector(p), centroids[c]))
            arch_id = f"arch_{len(archetypes) + 1:02d}"
            archetypes.append({"id": arch_id, "representative": rep["id"],
                               "variant": variant, "size": len(cluster)})
            for p in cluster:
                p["archetype"] = arch_id
        # agentes de regra (e sobras) herdam o arquétipo mais próximo da mesma variante
        group_archs = [a for a in archetypes if a["variant"] == variant]
        by_id = {p["id"]: p for p in personas}
        for p in members:
            if "archetype" not in p:
                best = min(group_archs, key=lambda a: _dist(_vector(p), _vector(by_id[a["representative"]])))
                p["archetype"] = best["id"]
                best["size"] += 1
    return archetypes


def generate(n, k, seed, mode="explore", target="web", segments=None):
    if target not in DEVICES:
        raise ValueError(f"target inválido: {target}")
    if n < 1 or k < 1:
        raise ValueError("n e archetypes devem ser >= 1")
    rng = random.Random(seed)
    segments = segments or DEFAULT_SEGMENTS
    personas = [make_persona(rng, i + 1, pick_segment(rng, segments), target) for i in range(n)]
    enforce_negative_quota(rng, personas)
    assign_rule_agents(rng, personas)
    assign_variants(personas, mode)
    archetypes = build_archetypes(rng, personas, min(k, n))
    return {"seed": seed, "mode": mode, "target": target, "n": n,
            "archetypes": archetypes, "personas": personas}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--archetypes", type=int, default=12)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--mode", choices=["explore", "ab", "regression"], default="explore")
    ap.add_argument("--target", choices=sorted(DEVICES), default="web")
    ap.add_argument("--segments", type=Path)
    ap.add_argument("--out", type=Path, default=Path("run/population.json"))
    a = ap.parse_args()
    segments = json.loads(a.segments.read_text(encoding="utf-8")) if a.segments else None
    pop = generate(a.n, a.archetypes, a.seed, a.mode, a.target, segments)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(pop, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(pop['personas'])} personas, {len(pop['archetypes'])} arquétipos → {a.out}")
    for arch in pop["archetypes"]:
        print(f"  {arch['id']} [{arch['variant']}] executar: {arch['representative']} (representa {arch['size']})")


if __name__ == "__main__":
    main()
