"""Rewrite depth that a repetitive corpus cannot inflate.

WHY THIS EXISTS. `trigram_overlap` compares SETS of trigrams across the whole
document, so in a corpus with repeated phrasing a trigram that survives in any
one section counts as surviving for the document. The ladder is built from one
template with different facts per section, and its internal repetition grows
with length:

    ladder_500    4.3% of trigrams are repeats
    ladder_10000 83.5%

so whole-document overlap climbs up the ladder whether or not the model is
rewriting less. Between models AT ONE RUNG the metric is fine — same document,
same repetition. ACROSS rungs it is not, and the difference has to be measured
rather than asserted.

This aligns the rewrite to its source PARAGRAPH BY PARAGRAPH and averages the
per-paragraph overlap. A paragraph is ~60 words and not internally repetitive,
so a phrase surviving in section 12 can no longer be credited to section 1.

Run:  python engine/lab/depth_by_paragraph.py
"""

from __future__ import annotations

import re
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "apps" / "web" / "engine"))
sys.path.insert(0, str(HERE))

from freeze_measure import trigram_overlap, _doc          # noqa: E402
from uc_freeze import plan_freeze                          # noqa: E402

LADDER = ("ladder_500", "ladder_1000", "ladder_2000", "ladder_3000",
          "ladder_5000", "ladder_7500", "ladder_10000")
MODELS = ("mistral-small", "mistral-medium", "deepseek-v3.2")


def _paras(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def depth(src: str, out: str) -> tuple[float, int]:
    """Mean per-paragraph trigram overlap, frozen spans stripped from both."""
    for s in plan_freeze(src, ("structure", "quotes")):
        src = src.replace(s["text"], " § ")
        out = out.replace(s["text"], " § ")
    a, b = _paras(src), _paras(out)
    if len(a) != len(b):
        # The model merged or split paragraphs; align what we can from the top
        # and say how many pairs the number rests on rather than guessing.
        n = min(len(a), len(b))
        a, b = a[:n], b[:n]
    scores = [trigram_overlap(x, y) for x, y in zip(a, b)
              if len(x.split()) >= 12]
    return (statistics.mean(scores) if scores else float("nan"), len(scores))


def main() -> int:
    print("REWRITE DEPTH, PER PARAGRAPH (lower = more rewritten)")
    print("Whole-document overlap is in the ladder table; this one is the")
    print("cross-rung-comparable version. n = paragraph pairs compared.\n")
    print(f"{'doc':<16}" + "".join(f"{m:>22}" for m in MODELS))
    print("-" * (16 + 22 * len(MODELS)))
    for name in LADDER:
        row = f"{name:<16}"
        try:
            src = _doc(name)
        except FileNotFoundError:
            continue
        for model in MODELS:
            f = HERE / "freeze_runs" / f"{name}_both_{model}_out.txt"
            if not f.exists():
                row += f"{'not measured':>22}"
                continue
            d, n = depth(src, f.read_text())
            row += f"{f'{d:.3f}  (n={n})':>22}"
        print(row)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
