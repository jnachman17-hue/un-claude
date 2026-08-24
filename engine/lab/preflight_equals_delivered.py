"""The D4 pre-flight number must be the number the rewrite actually masks.

One detector, one number. This project has shipped two implementations of one
number three times and been bitten every time, so it is proved here rather
than asserted: the pre-flight fraction a visitor is shown before paying is
compared against the words the masker actually replaced, counted from inside
`rewrite_long` with a model that returns its input untouched.

No model, no money.

Run:  python engine/lab/preflight_equals_delivered.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "apps" / "web" / "engine"))
os.environ["UC_LAYER_B_FREEZE"] = "1"
os.environ["UC_FREEZE_TIERS"] = "structure,quotes"

import uc_chunk                                   # noqa: E402
from uc_freeze import freeze_fraction             # noqa: E402
from uc_wordcount import count_words              # noqa: E402

TIERS = ("structure", "quotes")


def masked_words(doc: str) -> tuple[int, int]:
    """Words the masker actually replaced, and how many spans."""
    seen: list[dict] = []
    original = uc_chunk.mask_chunk

    def spy(chunk, spans, ids):
        seen.extend(spans)
        return original(chunk, spans, ids)

    uc_chunk.mask_chunk = spy
    try:
        out, _info = uc_chunk.rewrite_long(
            doc, lambda c, attempt=0, missing=None, usage_out=None: (c, {}))
    finally:
        uc_chunk.mask_chunk = original
    assert out == doc, "reassembly is not byte-identical — stop and look"
    return sum(count_words(s["text"]) for s in seen), len(seen)


def main() -> int:
    docs = [(p.stem, p.read_text()) for p in
            sorted((HERE / "docs").glob("*.txt"))]
    print(f"{'document':<18}{'words':>7}{'pre-flight':>12}{'delivered':>11}"
          f"{'spans':>8}{'agree':>7}")
    print("-" * 63)
    bad = 0
    for name, doc in docs:
        ff = freeze_fraction(doc, TIERS)
        got, spans = masked_words(doc)
        agree = got == ff["frozen_words"]
        bad += not agree
        print(f"{name:<18}{ff['words']:>7}{ff['frozen_words']:>12}{got:>11}"
              f"{spans:>8}{'yes' if agree else 'NO':>7}")
    print()
    print("DISAGREEMENTS:", bad)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
