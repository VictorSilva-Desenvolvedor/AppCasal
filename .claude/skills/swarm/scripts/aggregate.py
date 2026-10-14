#!/usr/bin/env python3
"""Agrega traces dos arquétipos executados e projeta para a população inteira.

Uso:
  python3 aggregate.py --population run/population.json --traces run/traces --out run/report.json
"""
import argparse
import json
import random
from collections import Counter, defaultdict
from pathlib import Path


def load_final(trace_path: Path) -> dict:
    """Retorna a linha final (final=true) de um trace JSONL, com contagem de erros."""
    final, errors = None, []
    for line in trace_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if row.get("final"):
            final = row
        elif row.get("error"):
            errors.append({"step": row.get("step"), "screen": row.get("screen"), "error": row["error"]})
    if final is None:
        raise ValueError(f"trace sem linha final: {trace_path}")
    final["errors"] = errors
    return final


def project_outcome(persona: dict, arch_result: dict, rng: random.Random) -> str:
    """Projeta o resultado de um arquétipo para uma persona não executada.
    - agente de regra: abandona se o arquétipo precisou de mais passos que sua paciência.
    - agente LLM não executado: herda o resultado, com 10% de ruído para abandono."""
    outcome = arch_result["outcome"]
    if persona["policy"] == "rule":
        if outcome == "success" and arch_result.get("steps", 0) > persona["give_up_after"]:
            return "abandon"
        return outcome
    if outcome == "success" and rng.random() < 0.10:
        return "abandon"
    return outcome


def bootstrap_delta(a: list, b: list, rng: random.Random, iters=2000):
    """Delta de taxa de sucesso (B - A) com IC95% por bootstrap."""
    if not a or not b:
        return None
    rate = lambda xs: sum(xs) / len(xs)
    deltas = sorted(rate(rng.choices(b, k=len(b))) - rate(rng.choices(a, k=len(a))) for _ in range(iters))
    return {"delta": round(rate(b) - rate(a), 3),
            "ci95": [round(deltas[int(0.025 * iters)], 3), round(deltas[int(0.975 * iters)], 3)]}


def aggregate(population: dict, results: dict, seed: int = 0) -> dict:
    rng = random.Random(seed)
    arch_by_id = {a["id"]: a for a in population["archetypes"]}
    arch_result = {}
    for arch in population["archetypes"]:
        if arch["representative"] in results:
            arch_result[arch["id"]] = results[arch["representative"]]
    missing = [a["id"] for a in population["archetypes"] if a["id"] not in arch_result]

    seg = defaultdict(lambda: {"n": 0, "success": 0, "abandon": 0, "error": 0, "steps": []})
    stuck = Counter()
    stuck_segments = defaultdict(Counter)
    by_variant = defaultdict(list)
    projected = 0
    for p in population["personas"]:
        r = arch_result.get(p["archetype"])
        if r is None:
            continue
        if p["id"] in results:
            outcome = results[p["id"]]["outcome"]
        else:
            outcome = project_outcome(p, r, rng)
            projected += 1
        s = seg[p["segment"]]
        s["n"] += 1
        s[outcome] += 1
        s["steps"].append(r.get("steps", 0))
        if outcome != "success":
            screen = r.get("stuck_at") or "desconhecido"
            stuck[screen] += 1
            stuck_segments[screen][p["segment"]] += 1
        if p["variant"] in ("A", "B"):
            by_variant[p["variant"]].append(1 if outcome == "success" else 0)

    total_n = sum(s["n"] for s in seg.values()) or 1
    funnel = {name: {"n": s["n"],
                     "success_rate": round(s["success"] / s["n"], 3),
                     "abandon_rate": round(s["abandon"] / s["n"], 3),
                     "error_rate": round(s["error"] / s["n"], 3),
                     "avg_steps": round(sum(s["steps"]) / len(s["steps"]), 1)}
              for name, s in sorted(seg.items())}
    friction = [{"screen": scr, "share": round(c / total_n, 3),
                 "segments": dict(stuck_segments[scr].most_common(3))}
                for scr, c in stuck.most_common(5)]
    debriefs = [{"agent": aid, "archetype": next((a for a, r in arch_result.items() if r is res), None),
                 **res.get("debrief", {})} for aid, res in results.items() if res.get("debrief")]
    bugs = [{"agent": aid, **e} for aid, res in results.items() for e in res.get("errors", [])]
    report = {"mode": population["mode"], "target": population["target"],
              "n": population["n"], "executed": len(results), "projected": projected,
              "missing_archetypes": missing, "funnel": funnel, "friction": friction,
              "bugs": bugs, "debriefs": debriefs}
    if population["mode"] == "ab":
        report["ab"] = bootstrap_delta(by_variant["A"], by_variant["B"], rng)
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--population", type=Path, required=True)
    ap.add_argument("--traces", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=Path("run/report.json"))
    ap.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()
    population = json.loads(a.population.read_text(encoding="utf-8"))
    results = {f.stem: load_final(f) for f in sorted(a.traces.glob("*.jsonl"))}
    report = aggregate(population, results, a.seed)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("executed", "projected", "funnel", "friction")},
                     ensure_ascii=False, indent=2))
    if report["missing_archetypes"]:
        print(f"ATENÇÃO: arquétipos sem trace: {report['missing_archetypes']}")


if __name__ == "__main__":
    main()
