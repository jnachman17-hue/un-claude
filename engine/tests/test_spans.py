"""THE SAFETY NET: the chunk plumbing must never lose a byte on its own.

Lane A step 1 (docs/briefs/LANE-A-engine.md, W10 phase 0). Every measurement of
what a model does to a document is meaningless if the machinery around the model
loses text by itself. So: take every test document, split it into chunks and
reassemble it WITH NO MODEL INVOLVED AT ALL, and assert the result is
byte-identical to the input.

Three levels, strongest last:

  1. `_split_blocks` alone: paragraphs + separators + lead + tail must weave
     back into the exact input.
  2. `_plan_chunks` on top: chunk texts + their trailing separators must join
     back into the exact input.
  3. `rewrite_long` end to end with an identity rewrite function (the "model"
     returns its input unchanged): the delivered document must be byte-identical
     and `structure_kept` must be True.

WHY BYTE-IDENTITY AND NOT A SUBSTRING COUNT. W10's verifier caught a variant
reporting "64 of 64 block quotes returned" while four of them sat un-indented at
the end of the document. A substring count proves the words appear somewhere; it
does not prove they appear once, in the right place, with the right indentation.

Invisible characters are BUILT FROM ESCAPES, never typed or shelled in
(docs/07-runbook.md: writing them through a shell command destroys them).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from uc_chunk import (  # noqa: E402
    _plan_chunks,
    _split_blocks,
    _weave,
    rewrite_long,
)

# ---------------------------------------------------------------------------
# The corpus. One entry per category of thing a customer's document contains,
# from the twelve categories in docs/session-notes/rewrite-intelligence.md,
# plus the whitespace edge cases that only a byte-identity check can see.
# ---------------------------------------------------------------------------


def _long_essay(paragraphs: int = 12, words_per: int = 60) -> str:
    """A multi-chunk document (> TARGET_WORDS), deterministic, no model."""
    para = " ".join(
        f"Sentence {i} of this paragraph carries ordinary prose and the number {i * 7}."
        for i in range(1, words_per // 12 + 1)
    )
    return "\n\n".join(f"Paragraph {n}. {para}" for n in range(1, paragraphs + 1))


CORPUS: dict[str, str] = {
    # ordinary prose
    "single paragraph": "Just one paragraph, nothing else.",
    "two paragraphs": "First paragraph.\n\nSecond paragraph.",
    "long multi-chunk essay": _long_essay(),
    # quotations (category 4.1)
    "direct quotation": (
        'Orwell warned that political language is designed "to make lies sound '
        'truthful and murder respectable," and the warning still applies.\n\n'
        "The rest of the essay continues here."
    ),
    "block quote, indented": (
        "The report said, in full:\n\n"
        "    The market did not fail. The market did exactly what an\n"
        "    unregulated market does, and the people who designed it knew.\n\n"
        "That conclusion was never challenged."
    ),
    "sic marker": "Their reccomendation [sic] was drafted before the evidence was heard.",
    # citations and references (4.3)
    "reference list": (
        "Sources\n\n"
        "Smith, J. A., & Jones, R. B. (2019). Later start times and adolescent "
        "attendance. Journal of School Health, 89(4), 331-339.\n\n"
        "Harrison, M. (2020). The sleeping campus. Princeton University Press.\n\n"
        "Okonkwo, A. (2021). Sleep debt in rural districts. Sleep Research "
        "Quarterly, 12(2), 88-104."
    ),
    # numbers and dates (4.2)
    "numbers and units": (
        "The mill ran for sixty years before the family sold it in 1698.\n\n"
        "Only 8 of the 23 councils replied; the response rate was 34.8 percent, "
        "or p = .015 against the [1,3-5] baseline."
    ),
    # code (4.6) — a fenced block WITH a blank line inside it
    "code fence with blank line": (
        "The hot path is seven lines:\n\n"
        "```python\n"
        "for row in rows:\n"
        "    totals[row.key] = totals.get(row.key, 0) + row.amount\n"
        "\n"
        "print(totals)\n"
        "```\n\n"
        "Those seven lines are the whole of the hot path."
    ),
    # headings and structure (4.7)
    "headings": (
        "Introduction\n\nThe essay begins.\n\nSources\n\nThe essay discusses its "
        "sources here as ordinary prose.\n\nConclusion\n\nThe essay ends."
    ),
    "numbered list": (
        "Steps:\n\n1. First step.\n2. Second step.\n3. Third step.\n\nDone."
    ),
    # URLs (4.8)
    "urls and emails": (
        "See https://arxiv.example.org/abs/2401.09876 for the paper.\n\n"
        "Write to author@example.org with questions."
    ),
    # non-English (4.9)
    "french": (
        "Le financement constitue le second axe de la controverse.\n\n"
        "La sélection à l'entrée reste le point le plus inflammable du dossier."
    ),
    "russian": "Канал имени Москвы соединяет две реки.\n\nЭто важный маршрут.",
    "chinese": "这是一段中文文本，用来测试分块机制。\n\n第二段也在这里。",
    "japanese": "これは日本語の段落です。分割の仕組みを試します。\n\n二番目の段落です。",
    "thai": "นี่คือย่อหน้าภาษาไทยสำหรับทดสอบ\n\nย่อหน้าที่สอง",
    # equations (4.11) — a lone display equation as its own paragraph
    "equation as last paragraph": (
        "The growth follows the compound rule.\n\n"
        "P(t) = P0 * (1 + r)^t\n\n"
        "Equation (1) gives a projected population of about 5700."
    ),
    # tables (4.12) — rows separated by blank lines, as pasting from PDF produces
    "table with blank lines between rows": (
        "| Cohort | Invited | Completed |\n\n"
        "| One | 2400 | 311 |\n\n"
        "| Two | 3150 | 892 |"
    ),
    "csv block": "name,count,rate\nalpha,1,0.5\nbeta,2,0.7",
    # whitespace shapes — the cases a substring count cannot see
    "triple blank line": "A\n\n\n\nB",
    "spaces inside separator": "A\n\n   \n\nB",
    "tabs inside separator": "A\n\n\t\n\nB",
    "leading newlines": "\n\nFirst.\n\nSecond.",
    "trailing newlines": "First.\n\nSecond.\n\n\n",
    "leading spaces-only line": "   \n\nA real paragraph.",
    "trailing spaces-only line": "A real paragraph.\n\n   ",
    "spaces-only line both ends": "  \n\nMiddle paragraph.\n\n \t ",
    "indented paragraphs": "    First, indented.\n\n\tSecond, tabbed.",
    "soft-wrapped paragraph": "One line\nwrapped inside\nthe same paragraph.\n\nNext.",
    "crlf line endings": "First.\r\n\r\nSecond.\r\nStill second.",
    "no-break space in separator": "A\n\n \n\nB",
    # invisible characters, built from escapes (07-runbook)
    "zero width characters": (
        "This paragraph carries a zero​width space and a joiner‍ here.\n\n"
        "And a ﻿BOM-like mark plus an ⁠invisible word joiner."
    ),
    "bidi marks": "English text‎ with marks‏ kept.\n\nSecond؜ paragraph.",
    # the customer's own horizontal rule, mid-document (not at a chunk edge)
    "horizontal rule mid-document": "Before the rule.\n\n---\n\nAfter the rule.",
}


def _reassemble_from_blocks(text: str) -> str:
    lead, paras, seps, tail = _split_blocks(text)
    return lead + _weave(paras, seps) + tail


def _reassemble_from_plan(text: str) -> str:
    """Exactly the join `rewrite_long` performs, with the chunks untouched."""
    lead, paras, seps, tail = _split_blocks(text)
    plan = _plan_chunks(paras, seps)
    if not plan:
        return text
    chunks = [_weave(c["paras"], c["inner"]) for c in plan]
    return (
        lead
        + "".join(
            c + (plan[i]["after"] if i < len(plan) - 1 else "")
            for i, c in enumerate(chunks)
        )
        + tail
    )


def _identity(chunk: str, attempt: int = 0, missing=None, usage_out=None):
    """The no-model 'rewrite': hands every chunk back unchanged."""
    return chunk, {"model": "identity", "backend": "none"}


# ---------------------------------------------------------------------------
# Level 1: split and weave
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", sorted(CORPUS))
def test_split_blocks_reassembles_byte_identical(name):
    text = CORPUS[name]
    assert _reassemble_from_blocks(text) == text


# ---------------------------------------------------------------------------
# Level 2: the chunk plan
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", sorted(CORPUS))
def test_chunk_plan_reassembles_byte_identical(name):
    text = CORPUS[name]
    assert _reassemble_from_plan(text) == text


# ---------------------------------------------------------------------------
# Level 3: the whole of rewrite_long, no model anywhere
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", sorted(CORPUS))
def test_rewrite_long_identity_is_byte_identical(name):
    text = CORPUS[name]
    out, info = rewrite_long(text, _identity)
    assert out == text


@pytest.mark.parametrize("name", sorted(CORPUS))
def test_rewrite_long_identity_keeps_structure(name):
    text = CORPUS[name]
    _out, info = rewrite_long(text, _identity)
    assert info["structure_kept"] is True


def test_rewrite_long_identity_on_whitespace_only_document():
    text = "   \n \n  "
    out, _info = rewrite_long(text, _identity)
    assert out == text


# ---------------------------------------------------------------------------
# The customer's own horizontal rule at a CHUNK EDGE. strip_edge_separator
# exists to remove the prompt's own `---` showing through at the edge of a
# model reply — but when the customer's chunk itself begins or ends with a
# rule, stripping it deletes their text. The identity rewrite proves which.
# ---------------------------------------------------------------------------


def test_customer_rule_at_document_start_survives_identity():
    text = "---\n\nThe document opens with the customer's own rule."
    out, _info = rewrite_long(text, _identity)
    assert out == text


def test_customer_rule_at_document_end_survives_identity():
    text = "The document closes with the customer's own rule.\n\n---"
    out, _info = rewrite_long(text, _identity)
    assert out == text
