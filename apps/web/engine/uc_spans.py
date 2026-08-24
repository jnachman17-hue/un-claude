"""The protected-span detector and its deterministic checks. REPORT ONLY.

Lane A step 4 (W10 phase 2). This module finds the spans of a customer's
document that must survive a rewrite unchanged — quotations, headings,
reference entries, web addresses, code, tables, equations — and afterwards
counts how many actually did. It is the first instrument that can measure, on
a real customer's document, what W10 could only measure on documents the
agents wrote themselves.

**THE FREEZE IS OFF AND NOTHING HERE RAISES.** Nothing in this module changes
one character of any output, fails any job, or costs any model call. It
counts, and the counts ride in the report. The masking machinery (W10 phase 4
/ board E-9) is a separate session and must not ship yet — see the board,
PART 3.

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

#: The attribution cue near a quotation — D2's machine-readable proxy for
#: "these words came from outside", which is the thing that matters.
_ATTRIBUTION = re.compile(
    r"\b(?:said|says|say|wrote|writes|writing|puts?\s+it|according\s+to|"
    r"argued?|argues|warn(?:ed|s)?|not(?:es|ed)|described?|describes|"
    r"cautioned|observed?|observes|claim(?:ed|s)?|stated?|states|declared?|"
    r"asked|replied|told|calls?|called|termed|adds?|added|concluded?|"
    r"reported?|reports)\b",
    re.IGNORECASE,
)
#: How far around the quote to look for the cue, in characters.
_CUE_WINDOW = 120

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

    Returns dicts of {kind, text, start, attributed?}. Kinds: quote,
    block_quote, heading, reference, url, email, code, table, equation, sic.
    Detection only — nothing here decides what happens to a span.
    """
    spans: list[dict] = []

    for m in _QUOTE.finditer(text):
        inner = m.group(1) or m.group(2)
        window = text[max(0, m.start() - _CUE_WINDOW): m.end() + _CUE_WINDOW]
        spans.append({
            "kind": "quote",
            "text": inner,
            "start": m.start(),
            "attributed": bool(_ATTRIBUTION.search(window)),
        })

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
    attributed = unattributed = 0

    for span in spans:
        kind = span["kind"]
        found[kind] = found.get(kind, 0) + 1
        if kind == "quote":
            if span.get("attributed"):
                attributed += 1
            else:
                unattributed += 1
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
        "quotes_attributed": attributed,
        "quotes_unattributed": unattributed,
        "examples_changed": examples,
        "note": (
            "Report only: these counts change nothing about the rewrite. "
            "'Returned verbatim' means the span appears character-for-"
            "character in the output as often as in the input; it does not "
            "prove position or indentation."
        ),
    }
