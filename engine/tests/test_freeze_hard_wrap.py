"""A wrapped quotation is still a quotation — and the pattern cannot run away.

**The gap.** `_QUOTE` used to forbid a newline inside a quotation, so a
hard-wrapped document — a `.txt` upload, a plain-text email, anything out of a
terminal editor — had NO quotation protection at all, silently, while the
identical text pasted from Word had full protection. un-claude accepts `.txt`
uploads and `.txt` is routinely wrapped.

**The risk this walks toward, and why these tests are mostly adversarial.** A
quote pattern that crosses newlines can swallow paragraphs of ordinary prose
the moment a document contains one unbalanced quotation mark. That is the
Sources-latch failure shape that nearly killed the freeze: a 221-word essay
came back **56.1% frozen, 12 runs of 12**. Three bounds prevent it and each
has a test below — no blank line, no more than `_MAX_WRAPPED_LINES` breaks,
and the 600-character ceiling — plus non-greedy matching, so a quotation ends
at the first closing mark and never a later one.
"""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "apps" / "web" / "engine"))

from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_spans import _MAX_WRAPPED_LINES, detect_protected_spans  # noqa: E402

TIERS = ("structure", "quotes")


def hard_wrap(doc: str, cols: int = 72) -> str:
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


def test_a_hard_wrapped_document_freezes_the_same_as_the_pasted_one():
    """The whole point. Before this, wrapping took the freeze from 48.6% to
    20.0% on this document and nothing said so."""
    plain = freeze_fraction(CITED, TIERS)
    wrapped = freeze_fraction(hard_wrap(CITED), TIERS)
    assert wrapped["frozen_words"] == plain["frozen_words"], (plain, wrapped)
    assert wrapped["spans"] == plain["spans"]


def test_a_citation_broken_across_lines_still_freezes_with_its_quote():
    """A wrap breaks the citation too: «(Smith, 2019, p.\\n47)»."""
    wrapped = hard_wrap(CITED)
    assert "p.\n47" in wrapped or "2019,\n" in wrapped or "(Smith,\n" in wrapped
    frozen = [s["text"] for s in plan_freeze(wrapped, TIERS)
              if s["kind"] == "quote"]
    assert any("Smith, 2019" in f for f in frozen), frozen


# --------------------------------------------------------------------------
# THE RUNAWAY. Each of these documents is built to break the pattern.
# --------------------------------------------------------------------------

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
    "minutes' author later called an oversight of the clerk's."
)


def test_one_unbalanced_quotation_mark_does_not_blow_up_the_freeze():
    """THE TEST THE BRIEF DEMANDS.

    The Sources-latch failure this guards against froze 56.1% of an ordinary
    essay. A stray opening mark here must cost a few words, not the document.
    """
    for label, doc in (("unwrapped", UNBALANCED),
                       ("wrapped", hard_wrap(UNBALANCED))):
        ff = freeze_fraction(doc, TIERS)
        assert ff["fraction"] < 0.15, (label, ff)
        spans = plan_freeze(doc, TIERS)
        for s in spans:
            assert len(s["text"]) <= 600, (label, s["text"][:120])


def test_many_stray_marks_across_many_paragraphs_freeze_nothing():
    doc = "\n\n".join(
        f'Paragraph {i} says "the thing that was said in paragraph {i} and '
        "then the sentence simply carries on for a while without ever "
        "closing the quotation at all."
        for i in range(1, 7)
    )
    ff = freeze_fraction(doc, TIERS)
    assert ff["frozen_words"] == 0, ff


def test_a_blank_line_always_ends_a_quotation():
    """A paragraph break is the hard stop. Without it, one stray mark reaches
    the next stray mark however far away it is."""
    doc = ('He began by saying "the first paragraph opens a quotation here\n\n'
           'and the second paragraph closes it over here" much later on.')
    quotes = [s for s in detect_protected_spans(doc) if s["kind"] == "quote"]
    assert quotes == [], quotes


def test_a_quotation_may_not_span_more_than_the_line_cap():
    inner = "\n".join(f"line number {i} of the quoted passage" for i in range(20))
    doc = f'The clerk read out "{inner}" and then sat down again.'
    assert inner.count("\n") > _MAX_WRAPPED_LINES
    quotes = [s for s in detect_protected_spans(doc) if s["kind"] == "quote"]
    assert quotes == [], quotes


def test_rejecting_an_over_long_run_does_not_swallow_a_later_quotation():
    """The reason the cap is applied by rescanning rather than by skipping.

    An over-long run begins at a real quotation mark. Dropping the match and
    resuming after its END would take any genuine quotation starting inside
    it with it.
    """
    long_run = "\n".join(f"line number {i} of the run" for i in range(20))
    doc = (f'The clerk read out "{long_run} and then said '
           '"this one is an ordinary quotation" before sitting down.')
    quotes = [s["text"] for s in detect_protected_spans(doc)
              if s["kind"] == "quote"]
    assert any("this one is an ordinary quotation" in q for q in quotes), quotes


def test_the_600_character_ceiling_still_holds():
    inner = "word " * 200          # 1,000 characters, one line
    doc = f'The report said "{inner.strip()}" and nothing else.'
    quotes = [s for s in detect_protected_spans(doc) if s["kind"] == "quote"]
    assert quotes == [], "a 1,000-character run must not be a quotation"


def test_the_corpus_is_unmoved_by_the_change_when_it_is_not_wrapped():
    """Nothing about an ordinary pasted document may change."""
    docs = sorted((ROOT / "lab" / "docs").glob("ladder_*.txt"))
    assert docs, "corpus missing"
    for p in docs:
        text = p.read_text()
        ff = freeze_fraction(text, TIERS)
        wrapped = freeze_fraction(hard_wrap(text), TIERS)
        assert wrapped["frozen_words"] == ff["frozen_words"], p.name
