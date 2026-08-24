"""No planned span may ever fail to reach the masker.

**The worst failure shape this product has.** A span that is planned but not
masked is never verified and therefore never reported — while D4's pre-flight
has already counted it and the customer has already paid on that number. A
loud failure refunds; this one delivers a document with the promise quietly
broken.

E-16 found one cause: a block quote is recognised by the indentation opening
its first line, `_PARA_BREAK` puts that whitespace in the separator BEFORE the
paragraph, and when a block quote opens a chunk that separator is the gap
BETWEEN chunks — so the chunk began four characters after the span did and the
containment test missed it.

**This test is deliberately not about block quotes.** It asserts the invariant
itself — everything planned gets masked — over documents that place an
indented quotation at every paragraph position across a chunk boundary, so any
future cause of the same class fails here whatever the mechanism.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "apps" / "web" / "engine"))

import uc_chunk                                             # noqa: E402
from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_wordcount import count_words                        # noqa: E402

TIERS = ("structure", "quotes")

FILLER = (
    "The committee met on a Tuesday and the minutes record nothing of what "
    "was said before the vote was taken, which several members later said "
    "was the whole difficulty with the way the thing had been arranged."
)
BLOCK = (
    "    No member present could say who had ordered the second survey,\n"
    "    who had signed for the deposit, or where the first survey was\n"
    "    filed. The clerk's ledger shows the sum leaving and nothing back."
)
QUOTED = (
    'The chair replied that the reserve had been "spent twice and accounted '
    'for once" (Smith, 2019, p. 47), which nobody in the room disputed.'
)


def _masked_spans(doc: str) -> list[dict]:
    """Every span the masker actually received, through the real path."""
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
    assert out == doc, "reassembly is not byte-identical"
    return seen


@pytest.mark.parametrize("position", range(1, 13))
def test_no_planned_span_is_ever_left_unmasked(position, monkeypatch):
    """An indented quotation walked across every paragraph slot.

    With TARGET_WORDS at 60 the chunk boundary moves as `position` grows, so
    one of these puts the block quote first in its chunk — the case that was
    silently unfrozen — and the rest are ordinary.
    """
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    monkeypatch.setattr("uc_chunk.TARGET_WORDS", 60)

    paras = [FILLER] * position + ["The minority report recorded:", BLOCK,
                                   QUOTED] + [FILLER] * 2
    doc = "\n\n".join(paras)

    planned = plan_freeze(doc, TIERS)
    masked = _masked_spans(doc)

    assert planned, "fixture broken: nothing planned"
    planned_words = sum(count_words(s["text"]) for s in planned)
    masked_words = sum(count_words(s["text"]) for s in masked)
    assert masked_words == planned_words, (
        f"{planned_words - masked_words} words were planned as frozen and "
        f"never reached the masker (position {position}). The pre-flight "
        "counts them, the customer pays for them, and nothing reports it."
    )
    # `BLOCK.strip()` rather than `BLOCK`, and the difference is the fix
    # working. When a block quote opens a chunk, its first line's indentation
    # sits in the separator BETWEEN chunks, so the frozen span is clipped to
    # the chunk and starts at the first word. The separator supplies the
    # indentation again at reassembly — which the `out == doc` assertion in
    # `_masked_spans` proves on every one of these documents.
    joined = "\n".join(s["text"] for s in masked)
    assert BLOCK.strip() in joined, (
        f"the block quote was not masked at position {position}")


def test_the_preflight_number_is_the_number_delivered(monkeypatch):
    """One detector, one number — the trap this project has hit three times."""
    monkeypatch.delenv("UC_LAYER_B_FREEZE", raising=False)
    monkeypatch.setattr("uc_chunk.TARGET_WORDS", 60)

    doc = "\n\n".join([FILLER] * 3 + ["The minority report recorded:", BLOCK,
                                      QUOTED] + [FILLER] * 2)
    shown = freeze_fraction(doc, TIERS)
    delivered = sum(count_words(s["text"]) for s in _masked_spans(doc))
    assert delivered == shown["frozen_words"], (shown, delivered)
