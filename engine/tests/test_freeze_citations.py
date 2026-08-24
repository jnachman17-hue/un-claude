"""The citation printed beside a quotation freezes with it.

Jon, 24 August 2026: *"We preserve the text and quotations, and citations
around it on either side."*

**Why this is not a nicety.** Before it, the masker handed the model exactly
this — the quotation protected and its source left loose:

    As Smith puts it, [[11]] (p. 47). The minutes were circulated later.
    The review found that [[11]] (Jones, 2019, p. 12). No objection.

The model was free to renumber the page, shift the year or rename the author,
and W10 measured invented authors in 23 of 41 runs on this model family. **A
rewritten citation attached to a correctly preserved quotation is worse than
either error alone: it reads as authoritative and it is wrong.**
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "apps" / "web" / "engine"))

from uc_freeze import plan_freeze                            # noqa: E402
from uc_spans import detect_protected_spans                  # noqa: E402

TIERS = ("structure", "quotes")


def _quotes(text):
    return [s["text"] for s in plan_freeze(text, TIERS) if s["kind"] == "quote"]


# --------------------------------------------------------------------------
# The citation comes with the quotation
# --------------------------------------------------------------------------


def test_a_citation_after_the_quote_freezes_with_it():
    text = ('The review found "attendance rose in every quartile" '
            "(Smith, 2019, p. 47). No objection was recorded.")
    assert _quotes(text) == [
        '"attendance rose in every quartile" (Smith, 2019, p. 47)']


def test_a_citation_before_the_quote_freezes_with_it():
    # Jon said "on either side", so the search runs backwards as well.
    text = ('Smith (2019): "the change did more for attendance than '
            'anything" was the verdict of the panel.')
    assert _quotes(text) == [
        '(2019): "the change did more for attendance than anything"']


def test_a_bare_page_reference_counts_as_a_citation():
    text = 'As Smith puts it, "the change did more for attendance" (p. 47).'
    assert _quotes(text) == ['"the change did more for attendance" (p. 47)']

    ranged = 'The report said "the market did not fail at all" pp. 88-104 now.'
    assert _quotes(ranged) == ['"the market did not fail at all" pp. 88-104']


def test_the_sentence_period_outside_the_bracket_stays_free():
    """A DECISION, pinned so it is visible rather than accidental.

    «"..." (Weber, 1922).» freezes up to the closing bracket and no further.
    A full stop carries no source information, it belongs to the sentence
    rather than to the citation, and leaving it free lets the model punctuate
    its own sentence.
    """
    text = ('Weber called it "the iron cage of rationality" (Weber, 1922). '
            "The chapter ends there.")
    frozen = _quotes(text)
    assert frozen == ['"the iron cage of rationality" (Weber, 1922)']
    assert not frozen[0].endswith(".")


# --------------------------------------------------------------------------
# The ways this could silently LOSE a quotation
# --------------------------------------------------------------------------


def test_a_citation_between_two_quotes_never_costs_the_second_one():
    """THE REGRESSION THIS NEARLY SHIPPED WITH, and it is silent.

    A citation standing between two quotations is adjacent to both. The first
    version of this feature let both claim it, so the two spans overlapped —
    and `plan_freeze` drops an overlapping span, which means the second
    quotation was simply not frozen. Nothing would have reported it: the
    pre-flight would have counted it, the customer would have paid for it,
    and the model would have rewritten it.
    """
    text = ('He said "the first of the two sayings" (Smith, 2019) '
            '"the second of the two sayings" (Jones, 2020).')
    frozen = _quotes(text)
    assert len(frozen) == 2, frozen
    assert "the first of the two sayings" in frozen[0]
    assert "the second of the two sayings" in frozen[1]
    # and the citation went to exactly one of them
    assert frozen[0].count("(Smith, 2019)") == 1
    assert frozen[1].count("(Smith, 2019)") == 0


def test_every_quotation_survives_a_run_of_cited_quotes():
    text = " ".join(
        f'The panel wrote "finding number {w} of the series" (Author{i}, 201{i}).'
        for i, w in enumerate(["one", "two", "three", "four", "five"], start=1)
    )
    detected = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    frozen = _quotes(text)
    assert len(detected) == 5
    assert len(frozen) == 5, frozen
    for i in range(1, 6):
        assert any(f"(Author{i}, 201{i})" in f for f in frozen), i


# --------------------------------------------------------------------------
# What must NOT be dragged in
# --------------------------------------------------------------------------


def test_a_citation_with_no_quotation_near_it_does_not_freeze():
    """Jon's ruling is about citations AROUND quotations.

    Freezing every parenthetical year in every document is a larger change
    than he asked for, so it is deliberately not done.
    """
    text = ("The committee met in 2019 (Smith, 2019) and then adjourned for "
            "the summer recess entirely.")
    assert plan_freeze(text, TIERS) == []


def test_prose_between_the_quote_and_the_citation_breaks_the_adjacency():
    text = ('The review found "attendance rose in every quartile" after a '
            "long and careful study (Smith, 2019).")
    assert _quotes(text) == ['"attendance rose in every quartile"']


def test_a_block_quote_already_covers_the_citation_inside_it():
    text = ("The minutes recorded, in full:\n\n"
            '    The chairman called the figures "an invention of the press\n'
            "    office\" (p. 12) and then sat down without another word.\n\n"
            "Nobody objected.")
    spans = plan_freeze(text, TIERS)
    blocks = [s for s in spans if s["kind"] == "block_quote"]
    assert len(blocks) == 1
    assert "(p. 12)" in blocks[0]["text"]
    # the inline quote inside it is not separately frozen — the outer mask
    # already protects it, and nested masks corrupt the restore
    assert [s for s in spans if s["kind"] == "quote"] == []


def test_a_bare_nineteenth_century_year_is_not_recognised():
    """KNOWN BOUND, pinned so widening it is a deliberate act.

    `_CITATION` only matches years beginning 19 or 20, so `(1887)` is not a
    citation shape and does not freeze with the quotation beside it. Widening
    the pattern to any four digits would also catch page ranges, sums of
    money, equation numbers and years in ordinary prose — each of which would
    then drag the text beside it into the freeze.
    """
    text = ('He returned from "the long campaign in the south" (1887) with '
            "nothing at all to show for it.")
    assert _quotes(text) == ['"the long campaign in the south"']
