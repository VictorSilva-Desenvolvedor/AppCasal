#!/usr/bin/env python3
"""Testes unitários: python3 -m unittest scripts/test_swarm.py -v"""
import json
import random
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import aggregate as agg  # noqa: E402
import population as pop  # noqa: E402


class TestPopulation(unittest.TestCase):
    def test_deterministic_with_seed(self):
        self.assertEqual(pop.generate(50, 6, 7), pop.generate(50, 6, 7))

    def test_size_and_unique_ids(self):
        p = pop.generate(120, 10, 1)
        ids = [x["id"] for x in p["personas"]]
        self.assertEqual(len(ids), 120)
        self.assertEqual(len(set(ids)), 120)

    def test_negative_quota_enforced(self):
        segs = [{"name": "otimistas", "weight": 1, "patience": [0.8, 1.0],
                 "tech_literacy": [0.8, 1.0], "attitudes": ["enthusiast"]}]
        p = pop.generate(100, 8, 3, segments=segs)
        negatives = sum(pop.is_negative(x) for x in p["personas"])
        self.assertGreaterEqual(negatives, 25)

    def test_rule_agent_share(self):
        p = pop.generate(100, 8, 3)
        self.assertEqual(sum(x["policy"] == "rule" for x in p["personas"]), 20)

    def test_ab_balanced_per_segment(self):
        segs = [{"name": "a", "weight": 0.5}, {"name": "b", "weight": 0.5}]
        p = pop.generate(200, 10, 5, mode="ab", segments=segs)
        for s in ("a", "b"):
            members = [x for x in p["personas"] if x["segment"] == s]
            na = sum(x["variant"] == "A" for x in members)
            self.assertLessEqual(abs(na - (len(members) - na)), 1)

    def test_every_persona_has_archetype_and_both_variants_executed(self):
        p = pop.generate(80, 8, 9, mode="ab")
        arch_ids = {a["id"] for a in p["archetypes"]}
        self.assertTrue(all(x["archetype"] in arch_ids for x in p["personas"]))
        self.assertEqual({a["variant"] for a in p["archetypes"]}, {"A", "B"})
        self.assertEqual(sum(a["size"] for a in p["archetypes"]), 80)

    def test_archetypes_capped_by_n(self):
        self.assertLessEqual(len(pop.generate(3, 12, 1)["archetypes"]), 3)

    def test_devices_match_target(self):
        for target, devices in pop.DEVICES.items():
            p = pop.generate(30, 4, 2, target=target)
            self.assertTrue(all(x["device"] in devices for x in p["personas"]))

    def test_invalid_target(self):
        with self.assertRaises(ValueError):
            pop.generate(10, 2, 1, target="tv")

    def test_give_up_after_range(self):
        self.assertEqual(pop.give_up_after(0.0), 3)
        self.assertEqual(pop.give_up_after(1.0), 15)


def _write_trace(folder, agent_id, outcome, steps, stuck_at=None, error=None):
    rows = [{"step": 1, "action": "click", "screen": "/home", "progress": True, "error": error}]
    rows.append({"final": True, "outcome": outcome, "steps": steps, "stuck_at": stuck_at,
                 "debrief": {"facil": 2, "frustracao": "botão escondido"}})
    (folder / f"{agent_id}.jsonl").write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")


class TestAggregate(unittest.TestCase):
    def test_load_final_and_errors(self):
        with tempfile.TemporaryDirectory() as d:
            _write_trace(Path(d), "p0001", "abandon", 9, "/pay", error="HTTP 500")
            r = agg.load_final(Path(d) / "p0001.jsonl")
            self.assertEqual(r["outcome"], "abandon")
            self.assertEqual(r["errors"][0]["error"], "HTTP 500")

    def test_load_final_missing_raises(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "x.jsonl"
            f.write_text(json.dumps({"step": 1}), encoding="utf-8")
            with self.assertRaises(ValueError):
                agg.load_final(f)

    def test_rule_agent_abandons_when_impatient(self):
        rng = random.Random(0)
        persona = {"policy": "rule", "give_up_after": 4}
        self.assertEqual(agg.project_outcome(persona, {"outcome": "success", "steps": 10}, rng), "abandon")
        self.assertEqual(agg.project_outcome(persona, {"outcome": "success", "steps": 3}, rng), "success")

    def test_bootstrap_delta(self):
        rng = random.Random(0)
        res = agg.bootstrap_delta([0] * 50, [1] * 50, rng)
        self.assertEqual(res["delta"], 1.0)
        self.assertIsNone(agg.bootstrap_delta([], [1], rng))

    def test_end_to_end(self):
        population = pop.generate(60, 6, 4, mode="ab")
        with tempfile.TemporaryDirectory() as d:
            for i, arch in enumerate(population["archetypes"]):
                ok = arch["variant"] == "B" or i % 2 == 0
                _write_trace(Path(d), arch["representative"], "success" if ok else "abandon",
                             5, None if ok else "/checkout")
            results = {f.stem: agg.load_final(f) for f in Path(d).glob("*.jsonl")}
        report = agg.aggregate(population, results, seed=1)
        self.assertEqual(report["executed"], len(population["archetypes"]))
        self.assertEqual(report["executed"] + report["projected"], 60)
        self.assertEqual(report["missing_archetypes"], [])
        self.assertIn("ab", report)
        self.assertGreater(report["ab"]["delta"], 0)
        self.assertEqual(report["friction"][0]["screen"], "/checkout")

    def test_missing_archetypes_reported(self):
        population = pop.generate(20, 4, 4)
        report = agg.aggregate(population, {}, seed=1)
        self.assertEqual(len(report["missing_archetypes"]), len(population["archetypes"]))


if __name__ == "__main__":
    unittest.main()
