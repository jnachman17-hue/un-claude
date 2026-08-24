"""The protected-span detector and its deterministic checks. REPORT ONLY.

Lane A step 4 (W10 phase 2). This module finds the spans of a customer's
document that must survive a rewrite unchanged — quotations, headings,
reference entries, web addresses, code, tables, equations — and afterwards
counts how many actually did. It is the first instrument that can measure, on
a real customer's document, what W10 could only measure on documents the
agents wrote themselves.

**NOTHING IN THIS MODULE RAISES OR CHANGES OUTPUT.** It detects and it
counts, and the counts ride in the report. The masking machinery (board E-9)
lives in `uc_freeze.py` and `uc_chunk.py`; it CONSUMES this detector — by
rule 1 of the E-9 brief the freeze must never grow detection of its own,
because a second detector is how the Sources latch comes back.

**THE "SOURCES" LATCH IS FIXED BY CONSTRUCTION.** W10's adversarial verifier
broke the previous design with a heading that says "Sources" over ordinary
prose: the detector treated everything after it as a reference list and never
stopped, freezing 56.1% of a 221-word essay, 12 of 12 runs. Here, a paragraph
after such a heading counts as a reference entry ONLY if it looks like one —
a bracketed year, a DOI, a URL, a page range, a publisher — and the section
ends at the first paragraph that does not. The same essay now yields zero
reference entries (locked in engine/tests/test_spans_detector.py).

**WHAT "RETURNED VERBATIM" MEANS, PRECISELY.** A span is counted as returned
when its text appears character-for-character in the output at least as many
times as it appeared in the input. That is a presence-and-count test, not a
position test: it does not prove the span sits in the right place or kept its
indentation. W10's verifier faulted a design for quietly promoting exactly
this test to byte-identity; the report says which one it is.
"""

from __future__ import annotations

import re

from uc_wordcount import count_words

# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

#: Inline quotation: straight or curly double quotes around at least a few
#: words. Single quotes are NOT detected — apostrophes make them unreliable.
_QUOTE = re.compile(r'"([^"\n]{12,600})"|“([^”\n]{12,600})”')

#: A CITATION SHAPE: "(2019)", "(Smith, 2019, p. 47)", "p. 47".
#:
#: This used to be one of two ways a quotation could earn protection. It is
#: now something else entirely — see `_citation_run` below, which extends a
#: quotation's frozen span to cover the citation printed beside it (Jon's
#: ruling, 24 August 2026: "we preserve the text and quotations, and citations
#: around it on either side").
#:
#: KNOWN BOUND, reported rather than widened: the year must begin 19 or 20, so
#: `(1887)` is not recognised. Widening it to any four digits would also catch
#: page ranges, sums of money, years in ordinary prose and equation numbers,
#: every one of which would then drag the text beside it into the freeze.
#: See docs/session-notes/freeze-every-quotation.md.
_CITATION = re.compile(r"\([^()\n]{0,60}(?:19|20)\d\d[^()\n]{0,25}\)|\bpp?\.\s*\d+")

#: THE ATTRIBUTION CUE IS GONE. Deleted 24 August 2026 on Jon's ruling, and
#: the deletion is the point rather than a side effect.
#:
#: For two sessions this module tried to tell a sourced quotation from a
#: novel's invented dialogue, so that only the first would freeze. E-9 keyed
#: on reportive verbs; E-16 replaced that with a position-and-subject test
#: after measuring that 35 of 45 ordinary novel dialogue lines were being
#: frozen. Both rules failed on ordinary text, and not through carelessness —
#: the two things are grammatically identical:
#:
#:     "Power tends to corrupt," Acton observed.      <- real
#:     "Mind the second stair," Aldous observed.      <- fiction
#:
#: Quote, comma, capitalised name, reportive verb, in both. The difference is
#: that Acton published and Aldous is a character, which is world knowledge
#: and not syntax. Jon's ruling: "any quotation is frozen and kept across the
#: board. There's no delineation between novel dialogue and real quotation."
#:
#: The cost was measured before the change and it is small on the documents
#: this product is for: under two points of extra frozen text on every
#: academic document in the corpus, and large only for dialogue-heavy fiction,
#: which D4's pre-flight already discloses before any money changes hands.
#:
#: What is gone with it: the reportive-verb list, the attributive-position
#: test, the pronoun-subject test, and the attributed/unattributed split on
#: every span. This project found three silent freeze defects in two days; a
#: deleted code path cannot harbour a fourth.

_URL = re.compile(r"https?://[^\s<>\"\)\]]+|\bwww\.[^\s<>\"\)\]]+")
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")

_HEADING_WORDS = 8
_TERMINAL = (".", "!", "?", ";", ",")

#: The section headings that open a reference list.
_REF_HEADING = re.compile(
    r"^\s*#{0,6}\s*(?:sources|references|bibliography|works\s+cited|"
    r"reference\s+list)\s*:?\s*$",
    re.IGNORECASE,
)
#: What a real reference entry looks like: at least one of these shapes.
_REF_SHAPES = (
    re.compile(r"[\(\[](?:19|20)\d\d[a-z]?[\)\]]"),          # (2019) / [2019]
    re.compile(r"\bdoi\s*:|\bdoi\.org/", re.IGNORECASE),     # a DOI
    re.compile(r"https?://"),                                # a URL
    re.compile(r"\b\d+\s*\(\d+\)\s*,\s*\d+\s*[-–]\s*\d+"),   # 12(2), 88-104
    re.compile(r"\bpp?\.\s*\d+"),                            # p. 47 / pp. 88-104
    re.compile(r"\b(?:University\s+Press|Journal\s+of|vol\.\s*\d+)", re.IGNORECASE),
)

_SIC = re.compile(r"\S+\s*\[sic\]", re.IGNORECASE)

_PARA_SPLIT = re.compile(r"(\n[^\S\n]*(?:\n[^\S\n]*)+)")


def _paragraphs(text: str) -> list[str]:
    """Paragraphs with their first line's indentation intact.

    The separator pattern's trailing [^\\S\\n]* swallows the horizontal
    whitespace that opens the next paragraph — which is exactly the byte a
    block quote is recognised by. It is put back here.
    """
    parts = _PARA_SPLIT.split(text)
    paras, seps = parts[0::2], parts[1::2]
    for i, sep in enumerate(seps):
        m = re.search(r"[^\S\n]+$", sep)
        if m and i + 1 < len(paras):
            paras[i + 1] = m.group(0) + paras[i + 1]
    return paras


def _looks_like_reference(para: str) -> bool:
    return any(shape.search(para) for shape in _REF_SHAPES)


def _is_heading(para: str) -> bool:
    stripped = para.strip()
    if not stripped or "\n" in stripped:
        return False
    if re.match(r"^#{1,6}\s+\S", stripped):
        return True
    if stripped.endswith(_TERMINAL):
        return False
    words = stripped.split()
    if len(words) > _HEADING_WORDS:
        return False
    # A lone short line: a heading if it has no sentence shape. Require at
    # least one letter so a bare number or rule is not a "heading".
    return any(c.isalpha() for c in stripped)


def _is_table(para: str) -> bool:
    lines = [line for line in para.strip().split("\n") if line.strip()]
    if len(lines) >= 1 and all(line.lstrip().startswith("|") for line in lines):
        return True
    if len(lines) >= 2:
        counts = [line.count(",") for line in lines]
        if min(counts) >= 2 and max(counts) == min(counts):
            return True                                     # CSV-shaped block
    return False


def _is_block_quote(para: str) -> bool:
    lines = [line for line in para.split("\n") if line.strip()]
    if not lines:
        return False
    if all(line.startswith("> ") for line in lines):
        return True
    return all(line.startswith(("    ", "\t")) for line in lines)


def _is_equation(para: str) -> bool:
    stripped = para.strip()
    if "\n" in stripped or count_words(stripped) > 20:
        return False
    symbols = sum(1 for c in stripped if c in "=+^_/\\<>{}()[]|×·±√∑∫≤≥≈≠")
    letters = sum(1 for c in stripped if c.isalpha())
    if "=" in stripped and symbols >= 2:
        return True
    return symbols >= 4 and symbols * 3 >= letters


def detect_protected_spans(text: str) -> list[dict]:
    """Every span of `text` that must come back from a rewrite unchanged.

    Returns dicts of {kind, text, start}. Kinds: quote, block_quote, heading,
    reference, url, email, code, table, equation, sic.
    Detection only — nothing here decides what happens to a span.

    There is no `attributed` field any more. Every quotation is a quotation
    (Jon, 24 August 2026); the engine no longer guesses whose words they are.
    """
    spans: list[dict] = []

    for m in _QUOTE.finditer(text):
        inner = m.group(1) or m.group(2)
        spans.append({"kind": "quote", "text": inner, "start": m.start()})

    for m in _URL.finditer(text):
        spans.append({"kind": "url", "text": m.group(0), "start": m.start()})
    for m in _EMAIL.finditer(text):
        spans.append({"kind": "email", "text": m.group(0), "start": m.start()})
    for m in _SIC.finditer(text):
        spans.append({"kind": "sic", "text": m.group(0), "start": m.start()})

    # Fenced code: everything between a pair of ``` markers.
    for m in re.finditer(r"```[^\n]*\n(.*?)```", text, re.DOTALL):
        spans.append({"kind": "code", "text": m.group(1), "start": m.start()})

    # Paragraph-shaped spans. Shape checks run MOST SPECIFIC FIRST — a table
    # row and a display equation are both short lines that would otherwise
    # pass for headings.
    offset = 0
    in_reference_section = False
    for para in _paragraphs(text):
        start = text.find(para, offset)
        offset = start + len(para)
        stripped = para.strip()
        if not stripped:
            continue
        if _is_table(para):
            spans.append({"kind": "table", "text": stripped, "start": start})
            in_reference_section = False
            continue
        if _is_block_quote(para):
            # EVERY block quote, not only an introduced one. The old test
            # asked whether the preceding line ended in a colon, which is the
            # same species of guess Jon's ruling abolishes: it decided from
            # the introduction whether indented text was quoted material.
            # Indenting a paragraph IS the typographic statement that it is
            # quoted, and the engine now takes it at its word.
            #
            # The price, measured and accepted: indented text that is not a
            # quotation — an address block, a poem, unfenced code — freezes
            # too. On a 45-word document with an indented address that is
            # 2.2% frozen becoming 24.4%. D4's pre-flight shows the customer
            # that number before they pay.
            spans.append({"kind": "block_quote", "text": para, "start": start})
            in_reference_section = False
            continue
        if _is_equation(para):
            spans.append({"kind": "equation", "text": stripped, "start": start})
            in_reference_section = False
            continue
        if _is_heading(para):
            spans.append({"kind": "heading", "text": stripped, "start": start})
            # THE LATCH, CORRECTED: a Sources-like heading OPENS a candidate
            # reference section; every following paragraph must itself look
            # like a reference entry, and the section ENDS at the first one
            # that does not.
            in_reference_section = bool(_REF_HEADING.match(stripped))
            continue
        if in_reference_section and _looks_like_reference(para):
            spans.append({"kind": "reference", "text": stripped, "start": start})
            continue
        in_reference_section = False       # ordinary prose: the latch releases
        if _looks_like_reference(para) and re.match(r"^[A-Z][\w'’-]+,\s", stripped):
            # A reference entry outside any Sources section — the author-year
            # shape ("Smith, J. A. (2019).") plus a reference shape.
            spans.append({"kind": "reference", "text": stripped, "start": start})

    return spans


# ---------------------------------------------------------------------------
# The deterministic checks — run AFTER a rewrite, report only
# ---------------------------------------------------------------------------


def check_protected_spans(src: str, out: str) -> dict:
    """How the detected spans of `src` fared in `out`. Counts, never actions.

    "Returned verbatim" = the span's text appears character-for-character in
    the output at least as many times as in the input. Presence and count,
    not position: see the module docstring.
    """
    spans = detect_protected_spans(src)
    found: dict[str, int] = {}
    verbatim: dict[str, int] = {}
    changed: dict[str, int] = {}
    examples: list[dict] = []

    for span in spans:
        kind = span["kind"]
        found[kind] = found.get(kind, 0) + 1
        intact = out.count(span["text"]) >= max(1, src.count(span["text"]))
        if intact:
            verbatim[kind] = verbatim.get(kind, 0) + 1
        else:
            changed[kind] = changed.get(kind, 0) + 1
            if len(examples) < 5:
                examples.append({
                    "kind": kind,
                    "before": span["text"][:160],
                })

    return {
        "mode": "report_only",
        "spans_found": found,
        "returned_verbatim": verbatim,
        "changed": changed,
        "examples_changed": examples,
        "note": (
            "Report only: these counts change nothing about the rewrite. "
            "'Returned verbatim' means the span appears character-for-"
            "character in the output as often as in the input; it does not "
            "prove position or indentation."
        ),
    }
