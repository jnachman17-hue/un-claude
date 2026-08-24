"""E-16 job 2: the ladder, read back as one table.

Usage:  python engine/lab/ladder_report.py [rows.jsonl ...]
Default: freeze_runs/ladder_fixed.jsonl
"""

from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ORDER = ["ladder_500", "ladder_1000", "ladder_2000", "ladder_3000",
         "ladder_5000", "ladder_7500", "ladder_10000"]
MODELS = ["mistral/mistral-small", "mistral/mistral-medium",
          "deepseek/deepseek-v3.2"]
WALL = 240


def load(paths: list[Path]) -> list[dict]:
    rows = []
    for p in paths:
        for line in p.read_text().splitlines():
            line = line.strip()
            if line.startswith("{"):
                rows.append(json.loads(line))
    return [r for r in rows if r.get("doc", "").startswith("ladder_")]


def main() -> int:
    paths = [Path(a) for a in sys.argv[1:]] or [HERE / "freeze_runs" / "ladder_fixed.jsonl"]
    rows = load(paths)
    by: dict[tuple, list[dict]] = {}
    for r in rows:
        by.setdefault((r["model"], r["doc"]), []).append(r)

    print("SECONDS BY MODEL BY DOCUMENT SIZE — freeze ON, both tiers")
    print("worst = the slowest run in the cell. The site aborts at 240s.\n")
    head = (f"{'model':<16}{'words':>7}{'chunks':>7}{'n':>3}{'median':>8}"
            f"{'worst':>8}{'failed':>8}{'spans back':>12}{'retries':>8}"
            f"{'cost/run':>10}")
    print(head)
    print("-" * len(head))
    for m in MODELS:
        for d in ORDER:
            cell = by.get((m, d))
            if not cell:
                continue
            secs = [r["seconds"] for r in cell if r.get("seconds")]
            ok = [r for r in cell if not r.get("failure")]
            sv = [r["spans_verbatim"] for r in ok if "spans_verbatim" in r]
            a = sum(int(x.split("/")[0]) for x in sv)
            b = sum(int(x.split("/")[1]) for x in sv)
            w = cell[0].get("words", 0)
            print(f"{m.split('/')[-1]:<16}{w:>7}{-(-w // 350):>7}{len(cell):>3}"
                  f"{statistics.median(secs):>8.1f}{max(secs):>8.1f}"
                  f"{len(cell) - len(ok):>5}/{len(cell)}"
                  f"{f'{a}/{b}':>12}"
                  f"{sum(r.get('retries', 0) for r in ok):>8}"
                  f"{statistics.mean([r.get('cost_usd') or 0 for r in ok]) if ok else 0:>10.5f}")
        print()

    print("=" * 78)
    print("FAILURES, EVERY ONE")
    print("=" * 78)
    fails = [r for r in rows if r.get("failure")]
    if not fails:
        print("  none")
    for r in fails:
        print(f"  {r['model'].split('/')[-1]:<16}{r['doc']:<14}run {r['run']}  "
              f"{r['seconds']}s")
        print(f"      {r['failure'][:150]}")

    print()
    print("=" * 78)
    print("THE WALL: where each model crosses 240 seconds")
    print("=" * 78)
    for m in MODELS:
        worst_seen = []
        for d in ORDER:
            cell = by.get((m, d))
            if not cell:
                continue
            secs = [r["seconds"] for r in cell if r.get("seconds")]
            worst_seen.append((d, cell[0].get("words", 0),
                               statistics.median(secs), max(secs)))
        if not worst_seen:
            continue
        crossed = [x for x in worst_seen if x[3] >= WALL]
        top = worst_seen[-1]
        print(f"  {m.split('/')[-1]:<16}", end="")
        if crossed:
            print(f"worst run crosses 240s at {crossed[0][0]} "
                  f"({crossed[0][1]} words)")
        else:
            print(f"NEVER crossed. Largest measured {top[1]} words: "
                  f"median {top[2]:.1f}s, worst {top[3]:.1f}s "
                  f"({top[3] / WALL:.0%} of the wall)")

    total = sum(r.get("cost_usd") or 0.0 for r in rows)
    print(f"\nown-accounting cost across {len(rows)} runs: ${total:.4f}")
    print("(own accounting misses abandoned calls entirely — the gateway "
          "balance is the number that counts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
