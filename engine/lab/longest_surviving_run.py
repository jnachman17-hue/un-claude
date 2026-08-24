"""The longest unbroken run of the customer's own wording in the output.

**A number to hand back to Lane D, not a change to make.** The site says
*"a hard three-word ceiling on surviving sequences"* and *"no more than three
in a row come through"*. Freezing every quotation and its citation makes that
sentence further from true, and it was already untrue before this session.

The site's own receipt CANNOT show how untrue: `lib/engine/receipt.ts`
measures run lengths `[3, 4, 5, 6, 8, 10]` and reports the largest with any
survivor, so **10 is the biggest number it can ever print.** This measures the
run without a ceiling, using the receipt's own word normalisation so the two
numbers are comparable.

Run:  python engine/lab/longest_surviving_run.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "apps" / "web" / "engine"))

from uc_freeze import plan_freeze                            # noqa: E402

TIERS = ("structure", "quotes")
#: `lib/engine/receipt.ts` — lower-cased, punctuation to spaces, apostrophes
#: and hyphens kept.
_WORD = re.compile(r"[^\w\s'-]", re.UNICODE)


def words(text: str) -> list[str]:
    return _WORD.sub(" ", text.lower()).split()


def longest_run(src: str, out: str) -> tuple[int, str]:
    """Longest run of consecutive source words appearing in the output."""
    a, b = words(src), words(out)
    seen: set[str] = set()
    # index the output by every start position, walking forward greedily
    out_join = " " + " ".join(b) + " "
    best, best_text = 0, ""
    i = 0
    while i < len(a):
        lo, hi = 1, len(a) - i
        # binary search the longest run starting at i that appears in `out`
        while lo <= hi:
            mid = (lo + hi) // 2
            gram = " " + " ".join(a[i:i + mid]) + " "
            if gram in out_join:
                lo = mid + 1
            else:
                hi = mid - 1
        run = hi
        if run > best:
            best, best_text = run, " ".join(a[i:i + run])
        i += 1
        del seen
        seen = set()
    return best, best_text


def main() -> int:
    runs_dir = HERE / "freeze_runs"
    docs_dir = HERE / "docs"
    rows = []
    for out_file in sorted(runs_dir.glob("ladder_*_both_*_out.txt")):
        stem = out_file.stem                       # ladder_5000_both_model_out
        doc_name = "_".join(stem.split("_")[:2])
        src_path = docs_dir / f"{doc_name}.txt"
        if not src_path.exists():
            continue
        src, out = src_path.read_text(), out_file.read_text()
        n, text = longest_run(src, out)
        frozen = plan_freeze(src, TIERS)
        longest_frozen = max((len(words(s["text"])) for s in frozen), default=0)
        model = stem.replace(f"{doc_name}_both_", "").replace("_out", "")
        rows.append((doc_name, model, n, longest_frozen, text))

    print("LONGEST UNBROKEN RUN OF THE CUSTOMER'S OWN WORDING, in the")
    print("delivered document. The site claims a hard ceiling of three.")
    print("The site's own receipt cannot print above 10.\n")
    print(f"{'document':<14}{'model':<16}{'longest run':>12}"
          f"{'longest frozen span':>21}")
    print("-" * 64)
    for doc, model, n, lf, _t in rows:
        print(f"{doc:<14}{model:<16}{n:>12}{lf:>21}")

    if rows:
        worst = max(rows, key=lambda r: r[2])
        print()
        print(f"WORST: {worst[2]} words, {worst[0]} on {worst[1]}")
        print(f"  {worst[4][:300]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
