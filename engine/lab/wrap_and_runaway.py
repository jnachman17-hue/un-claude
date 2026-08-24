"""Job 3: what the hard-wrap fix recovers, and proof it cannot run away.

The whole corpus, wrapped and unwrapped, before and after. No model.

THE RISK THIS MEASURES. A quote pattern that crosses newlines can swallow
paragraphs of ordinary prose the moment a document contains one unbalanced
quotation mark. That is the Sources-latch failure shape that nearly killed the
freeze — a 221-word essay came back 56.1% frozen, 12 runs of 12 — so the
adversarial documents below matter more than the friendly ones.

Run:  python engine/lab/wrap_and_runaway.py
"""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "apps" / "web" / "engine"))

from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_wordcount import count_words                        # noqa: E402

TIERS = ("structure", "quotes")


def hard_wrap(doc: str, cols: int = 72) -> str:
    """What a .txt file looks like. Indented blocks are left alone."""
    out = []
    for para in doc.split("\n\n"):
        if para.startswith(("    ", "\t", ">")):
            out.append(para)
        else:
            out.append("\n".join(textwrap.wrap(para, cols)) or para)
    return "\n\n".join(out)


CITED = (
    "The Fairmont Review\n\n"
    "The committee met in September and the minutes were circulated a week "
    'later. As Smith puts it, "the change in start time did more for '
    'attendance than any intervention we had previously funded" '
    "(Smith, 2019, p. 47).\n\n"
    "The dissent was blunt. The chair replied that the reserve had been "
    '"spent twice and accounted for once by officers who knew better" and '
    "nobody in the room disputed it."
)

#: ADVERSARIAL. One unbalanced quotation mark, and apostrophes everywhere.
UNBALANCED = (
    "An Ordinary Essay\n\n"
    "The auditor's report was late again, and the committee's patience had "
    'run out well before the deadline passed. Somebody wrote "see the '
    "appendix in the margin and nobody could say who, or when, or why the "
    "sum didn't balance.\n\n"
    "It wasn't the first time the clerk's ledger had gone missing, nor the "
    "second, and the chair's temper was not improved by the discovery of "
    "the third.\n\n"
    "The vote was taken. Nobody's name was recorded against it, which the "
    "minutes' author later called an oversight of the clerk's.\n\n"
    "The registrar's office kept its own copy, which nobody thought to ask "
    "for until the following spring, by which time it too had gone."
)

#: ADVERSARIAL. Quotation marks opened and never closed, several times.
MANY_STRAYS = "\n\n".join(
    f'Paragraph {i} says "the thing that was said in paragraph {i} and then '
    f"the sentence simply carries on for a while without ever closing the "
    f"quotation at all, which is what a stray mark looks like."
    for i in range(1, 7)
)


def main() -> int:
    docs = [(p.stem, p.read_text()) for p in sorted((HERE / "docs").glob("*.txt"))]
    docs += [("CITED sample", CITED),
             ("UNBALANCED (adversarial)", UNBALANCED),
             ("MANY STRAYS (adversarial)", MANY_STRAYS)]

    print("FROZEN FRACTION — every corpus document, unwrapped and hard-wrapped")
    print("A runaway shows up as a large number in a document that should")
    print("freeze little. Watch the two adversarial rows.\n")
    print(f"{'document':<26}{'words':>7}{'unwrapped':>11}{'wrapped':>10}"
          f"{'longest span':>14}")
    print("-" * 68)
    worst = 0.0
    for name, doc in docs:
        wrapped = hard_wrap(doc)
        a = freeze_fraction(doc, TIERS)
        b = freeze_fraction(wrapped, TIERS)
        spans = plan_freeze(wrapped, TIERS)
        longest = max((count_words(s["text"]) for s in spans), default=0)
        if "adversarial" in name.lower():
            worst = max(worst, b["fraction"])
        print(f"{name:<26}{a['words']:>7}{a['fraction'] * 100:>10.1f}%"
              f"{b['fraction'] * 100:>9.1f}%{longest:>12} words")

    print()
    print(f"WORST ADVERSARIAL FROZEN FRACTION: {worst * 100:.1f}%")
    print("(the Sources-latch failure this guards against was 56.1%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
