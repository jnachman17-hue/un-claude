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

#: The attribution cue near a quotation — D2's machine-readable proxy for
#: "these words came from outside", which is the thing that matters.
#:
#: NARROWED FOR THE FREEZE (board E-9, D2). The first version of this list
#: included the narrative dialogue tags — said, asked, replied, told — and
#: they are exactly the verbs a short story is full of: every line of invented
#: dialogue reads «"...," she said». D2's own reasoning rules the case: the
#: model chose every word of that dialogue, so it is the MOST watermarked part
#: of the document, and freezing it would hand it back untouched after
#: charging for a rewrite. So the cue is now the REPORTIVE verbs — the ones
#: essays use to put words in a named source's mouth — plus "according to"
#: and a citation shape like (2019) or p. 47. A journalist's «the minister
#: said "..."» is deliberately NOT attributed under this rule: being wrong
#: toward free costs a few reworded phrases; being wrong toward frozen hands
#: back a paid-for rewrite undone. Those are not the same size (Jon, D2).
_ATTRIBUTION = re.compile(
    r"\b(?:wrote|writes|writing|puts?\s+it|according\s+to|"
    r"argued?|argues|warn(?:ed|s)?|not(?:es|ed)|described?|describes|"
    r"cautioned|observed?|observes|claim(?:ed|s)?|stated?|states|declared?|"
    r"termed|concluded?|reported?|reports|asserted?|asserts|"
    r"maintained?|maintains|contend(?:ed|s)?|remark(?:ed|s)?|"
    r"emphasi[sz]e[sd]?|acknowledged?|acknowledges|insist(?:ed|s)?)\b",
    re.IGNORECASE,
)
#: A citation shape near the quote is attribution even with no verb:
#: "(2019)", "(Smith, 2019, p. 47)", "p. 47".
_CITATION = re.compile(r"\([^()\n]{0,60}(?:19|20)\d\d[^()\n]{0,25}\)|\bpp?\.\s*\d+")
#: How far around the quote to look for the cue, in characters.
_CUE_WINDOW = 120
_SENTENCE_END = re.compile(r"[.!?]")

#: CORRECTED FOR E-16. Narrowing the verb list (E-9) was not enough: seventeen
#: of the surviving verbs are also standard fiction dialogue tags, so «"You
#: never once asked me," she argued» froze — invented dialogue, the most
#: watermarked text in the document, handed back untouched after the customer
#: paid for a rewrite. That is precisely the catastrophe D2 exists to prevent.
#: Measured on 45 fiction lines: the shipped rule froze 35 of them.
#:
#: Two things separate real attribution from a dialogue tag, and neither is
#: the verb:
#:
#:   * POSITION. Attribution INTRODUCES its quotation — «Orwell wrote that
#:     "..."», «As Smith puts it, "..."». A dialogue tag FOLLOWS it — «"...,"
#:     she argued». The trailing-tag path is therefore gone entirely; it was
#:     the source of every one of the 35.
#:   * SUBJECT. Attribution names a source ("Smith", "The committee", "the
#:     2019 review"). Fiction takes a bare pronoun ("she argued"). A reportive
#:     verb whose subject is a bare pronoun does not attribute.
#:
#: A citation shape stays an INDEPENDENT trigger, subject and position
#: irrelevant, because it is the strongest evidence a real source exists.
#:
#: What this deliberately lets through, in the cheap direction (D2: being
#: wrong toward free costs a few reworded phrases; being wrong toward frozen
#: hands back a paid-for rewrite undone — those are not the same size):
#:   * an UNCITED trailing attribution — «"...," wrote Orwell in 1946» — a
#:     bare year is not a citation shape, so it no longer freezes;
#:   * attribution carried by a pronoun — «The auditor... She wrote that
#:     "..."» — which also, on purpose, frees epistolary fiction;
#:   * a pre-quote tag on a NAMED character — «Marcus concluded, "..."» —
#:     textually identical to «The committee concluded, "..."».
#: Measured residual after this change: 2 of 45 fiction lines, 2 of 30
#: attribution shapes. See docs/session-notes/e16-detector-and-ceiling.md.

#: A bare pronoun subject is a dialogue tag, not an attribution.
_PRONOUN_SUBJECTS = frozenset({
    "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them",
})
#: Words that stand between a subject and its verb without being the subject:
#: auxiliaries, negation, and the connectives that open a clause. Adverbs are
#: handled separately — a LOWERCASE word ending in -ly is skipped, a
#: capitalised one is not, because Kelly and Molly are subjects.
_SUBJECT_SKIP = frozenset({
    "had", "has", "have", "having", "was", "were", "is", "are", "am", "be",
    "been", "being", "would", "will", "could", "should", "may", "might",
    "must", "did", "does", "do", "not", "never", "also", "then", "once",
    "again", "later", "already", "still", "even", "only", "just", "so",
    "and", "but", "who", "which", "that", "however", "further",
})
_SUBJECT_WORD = re.compile(r"[A-Za-z][\w'’-]*")


def _subject_before(text: str, verb_start: int) -> str:
    """The word doing the reporting, auxiliaries and adverbs stepped over."""
    for m in reversed(list(_SUBJECT_WORD.finditer(text[:verb_start]))):
        word = re.split(r"['’]", m.group(0))[0]      # she'd -> she
        low = word.lower()
        if not low or low in _SUBJECT_SKIP:
            continue
        if word.islower() and low.endswith("ly"):
            continue
        return word
    return ""


def _quote_attributed(pre: str, post: str) -> bool:
    """Does a real source put these words in this document? (D2, E-16.)

    True when a reportive verb INTRODUCES the quote — before it, no sentence
    boundary in between — and the subject of that verb is a named source
    rather than a bare pronoun. A citation shape near the quote attributes on
    its own, whatever the wording around it. Nothing that FOLLOWS a quotation
    attributes it: that position is where fiction puts its dialogue tags, and
    reading it as attribution froze 35 of 45 fiction lines.
    """
    for vm in _ATTRIBUTION.finditer(pre):
        if _SENTENCE_END.search(pre[vm.end():]):
            continue                       # the verb belongs to an earlier
                                           # sentence, not to this quote
        if _subject_before(pre, vm.start()).lower() in _PRONOUN_SUBJECTS:
            continue                       # a dialogue tag, not attribution
        return True
    return bool(_CITATION.search(pre) or _CITATION.search(post))

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
        spans.append({
            "kind": "quote",
            "text": inner,
            "start": m.start(),
            "attributed": _quote_attributed(
                text[max(0, m.start() - _CUE_WINDOW): m.start()],
                text[m.end(): m.end() + _CUE_WINDOW],
            ),
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
            # D2's cue for a block quote lives in the text INTRODUCING it —
            # "As the report concluded:" — so the window looks backward. A
            # preceding line ending in a colon is the standard typographic
            # signal that an indented block is quoted source material, and it
            # counts as a cue here; fiction almost never introduces invented
            # text that way.
            lead_in = text[max(0, start - _CUE_WINDOW): start]
            spans.append({
                "kind": "block_quote",
                "text": para,
                "start": start,
                "attributed": bool(
                    _quote_attributed(lead_in, "")
                    or lead_in.rstrip().endswith(":")
                ),
            })
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
