"""Chunk planning: fences never straddle a boundary, chunks never end fragile.

W10 measured both defects with real model runs:
  * a blank line inside a code block became a chunk boundary, each half saw an
    orphaned fence, and the whole job failed 3 of 5 runs (§4.6);
  * a display equation that ENDS a chunk was deleted outright 14 of 30 runs;
    the identical document with the equation mid-chunk, 1 of 30 (§4.11).

These tests prove the plan itself, with no model anywhere: where the
boundaries fall is deterministic.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_chunk import (  # noqa: E402
    _fragile,
    _plan_chunks,
    _split_blocks,
    _weave,
    split_paragraphs,
)


def _filler(words: int, tag: str = "filler") -> str:
    return " ".join(f"{tag}{i}" for i in range(words))


# ---------------------------------------------------------------------------
# Code fences
# ---------------------------------------------------------------------------


def test_fence_with_blank_line_is_one_paragraph():
    text = (
        "Intro prose.\n\n"
        "```python\nfor row in rows:\n    pass\n\nprint(totals)\n```\n\n"
        "Outro prose."
    )
    _lead, paras, _seps, _tail = _split_blocks(text)
    assert len(paras) == 3
    assert paras[1].count("```") == 2          # the whole fence, stitched


def test_fence_never_straddles_a_chunk_boundary():
    # Enough prose to force multiple chunks, with the fence at what would be
    # a boundary.
    text = (
        _filler(340) + "\n\n"
        "```python\nfirst half\n\nsecond half\n```\n\n"
        + _filler(340)
    )
    for chunk in split_paragraphs(text):
        assert chunk.count("```") % 2 == 0, "a chunk holds an odd fence"


def test_runaway_fence_is_bounded():
    # One stray fence marker must not fold the whole document into one chunk.
    text = "```\n\n" + "\n\n".join(_filler(300, f"p{i}x") for i in range(8))
    chunks = split_paragraphs(text)
    assert len(chunks) > 1


# ---------------------------------------------------------------------------
# Fragile paragraphs
# ---------------------------------------------------------------------------


def test_fragile_recognises_the_w10_equation():
    assert _fragile("P(t) = P0 * (1 + r)^t")
    assert _fragile("E = mc^2")


def test_fragile_recognises_table_rows_and_placeholders():
    assert _fragile("| Cohort | Invited | Completed |")
    assert _fragile("| One | 2400 | 311 |\n| Two | 3150 | 892 |")
    assert _fragile("[[HEADING10]]")


def test_fragile_leaves_prose_and_headings_alone():
    assert not _fragile("Introduction")
    assert not _fragile("The results were clear (see 2024) and final.")
    assert not _fragile("A plain paragraph of ordinary prose, no symbols.")


def test_chunk_never_ends_on_an_equation():
    # The equation lands exactly at a chunk boundary; the plan must carry it
    # into the next chunk rather than end on it.
    text = (
        _filler(345) + "\n\n"
        "P(t) = P0 * (1 + r)^t\n\n"
        "Equation (1) gives a projected population of about 5700.\n\n"
        + _filler(345)
    )
    _lead, paras, seps, _tail = _split_blocks(text)
    plan = _plan_chunks(paras, seps)
    assert len(plan) > 1
    for chunk in plan[:-1]:
        assert not _fragile(chunk["paras"][-1]), (
            "a chunk ends on a fragile paragraph: " + chunk["paras"][-1][:60]
        )
    # The equation is still in the document, exactly once.
    joined = "".join(
        _weave(c["paras"], c["inner"]) + c["after"] for c in plan
    )
    assert joined.count("P(t) = P0 * (1 + r)^t") == 1


def test_split_table_rows_travel_together():
    # Rows separated by blank lines (the paste-from-PDF shape), landing on a
    # boundary: the rows must not be split across two chunks.
    rows = "| Cohort | Invited |\n\n| One | 2400 |\n\n| Two | 3150 |"
    text = _filler(340) + "\n\n" + rows + "\n\n" + _filler(340)
    chunks = split_paragraphs(text)
    carrying = [c for c in chunks if "| Cohort |" in c]
    assert len(carrying) == 1
    assert "| Two | 3150 |" in carrying[0], "the table was cut across chunks"


def test_document_ending_on_equation_is_allowed():
    # Nothing follows it, so there is nothing to join it to; the plan keeps it.
    text = _filler(50) + "\n\nE = mc^2"
    chunks = split_paragraphs(text)
    assert chunks[-1].endswith("E = mc^2")
