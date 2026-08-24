"""Does any planned freeze span fail to reach the masker? (E-16 job 4.)

THE FAILURE SHAPE THIS HUNTS is the worst one this product has: a span that is
planned — so D4's pre-flight counts it and the customer pays on that number —
but never masked, therefore never verified, therefore never reported. A loud
failure refunds. This one delivers.

E-16 found one cause (a block quote opening a chunk, whose indentation falls
in the between-chunks separator) and reported a second it had not chased: on
`ladder_3000`, 87 of 90 spans came back in every run, identically. Identical
across runs rules out the model.

Method, E-16 §1.7: plan the spans, walk the chunk boundaries, print every span
that lands in no chunk at all. No model, no money.

Run:  python engine/lab/orphan_spans.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "apps" / "web" / "engine"))
os.environ["UC_LAYER_B_FREEZE"] = "1"
os.environ["UC_FREEZE_TIERS"] = "structure,quotes"

import uc_chunk                                  # noqa: E402
from uc_freeze import plan_freeze                # noqa: E402

TIERS = ("structure", "quotes")


def orphans(text: str):
    """(planned, assigned, [spans that land in no chunk])."""
    lead, paras, seps, _tail = uc_chunk._split_blocks(text)
    plan = uc_chunk._plan_chunks(paras, seps)
    chunks = [uc_chunk._weave(c["paras"], c["inner"]) for c in plan]
    spans = plan_freeze(text, TIERS)

    assigned: set[int] = set()
    offset = len(lead)
    for i, chunk in enumerate(chunks):
        a, b = offset, offset + len(chunk)
        offset = b + len(plan[i]["after"])
        for j, s in enumerate(spans):
            start, end = s["start"], s["end"]
            if end <= a or start >= b or end > b:
                continue
            if start < a and text[start:a].strip():
                continue
            assigned.add(j)
    lost = [s for j, s in enumerate(spans) if j not in assigned]
    return len(spans), len(assigned), lost, len(chunks)


def main() -> int:
    bad = 0
    print(f"{'document':<18}{'chunks':>7}{'planned':>9}{'masked':>8}{'ORPHANED':>10}")
    print("-" * 52)
    for p in sorted((HERE / "docs").glob("*.txt")):
        text = p.read_text()
        planned, assigned, lost, nchunks = orphans(text)
        bad += len(lost)
        print(f"{p.stem:<18}{nchunks:>7}{planned:>9}{assigned:>8}{len(lost):>10}")
        for s in lost:
            print(f"      {s['kind']} at {s['start']}: {s['text'][:64]!r}")
    print()
    print(f"TOTAL ORPHANED SPANS: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
