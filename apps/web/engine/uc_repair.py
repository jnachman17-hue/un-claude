"""REPAIR: take back out of a rewrite what the model put in.

Lane A step 2 (docs/briefs/LANE-A-engine.md). Measured over 228 real stored
outputs in W10: 214 of 228 carried punctuation or markup the customer never
typed — 819 curly apostrophes, 644 markdown asterisks, 359 em dashes, 98 curly
quotes. A tool that removes AI watermarks and then hands back a document
carrying the most recognisable visible AI tells is undoing its own job.

JON'S RULING SETS THE TARGET, AND IT IS NOT "STRIP EVERYTHING". It is: do not
return a document that looks more machine-written than the one that arrived.
Three different treatments, deliberately not collapsed into one:

  * MARKDOWN THE INPUT NEVER HAD — REMOVE IT. A `**bold**` arriving in a
    document as literal asterisks is corruption of the file, not a style
    choice. Strict — but each rule is disabled the moment the input itself
    uses that markup, because then it is the customer's own.
  * APOSTROPHES AND QUOTE MARKS — MATCH THE INPUT. If they typed straight
    apostrophes, return straight apostrophes. This restores their text rather
    than imposing a preference, so it only ever runs when the input carries
    none of the curly form. (The reverse direction — a customer who typed
    curly getting straight ones back — is left alone: converting ' to ' by
    machine cannot tell an apostrophe from a closing quote.)
  * EM DASHES — DO NOT INFLATE. Jon: "some are okay. We don't need a strict
    zero em dashes rule." The budget is the input's own count. A document
    that arrives with em dashes comes back with em dashes; a document that
    arrives with none does not come back with ninety-five. Only mid-line
    dashes are ever converted — a dash opening a line is dialogue punctuation
    (French among others), not the parenthetical tell that was measured.

Plus one restoration: A YEAR THE MODEL SPELLED OUT GOES BACK TO DIGITS.
Rule 5a of the rewrite prompt already forbids "sixteen ninety-eight" for 1698
and the model does it anyway (measured: 9 of 10 runs on mistral-small). When
the input had the digits, the output lost them, and the spelled form appears
only in the output, the digits are put back.

EVERYTHING HERE IS DETERMINISTIC, MODEL-FREE AND INPUT-CONDITIONAL. No rule
fires unless the input proves the mark is not the customer's own.
"""

from __future__ import annotations

import re

EM_DASH = "—"

# --------------------------------------------------------------------------
# Markdown the input never had
# --------------------------------------------------------------------------

#: **bold** — content must sit on one line and start/end on non-space.
_BOLD = re.compile(r"\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*")
#: *italic* — same shape, and never half of a ** pair. Excludes list markers
#: ("* item" has a space after the asterisk) and arithmetic ("3 * 4").
_ITALIC = re.compile(r"(?<!\*)\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)")
#: A markdown heading marker at the start of a line.
_HEADING = re.compile(r"(?m)^(#{1,6})[ \t]+")


def _strip_markdown(src: str, out: str, stats: dict) -> str:
    if not _BOLD.search(src):
        out, n = _BOLD.subn(r"\1", out)
        stats["markdown_bold_removed"] = n
    if not _ITALIC.search(src):
        out, n = _ITALIC.subn(r"\1", out)
        stats["markdown_italic_removed"] = n
    if not _HEADING.search(src):
        out, n = _HEADING.subn("", out)
        stats["markdown_headings_removed"] = n
    return out


# --------------------------------------------------------------------------
# Apostrophes and quote marks — match the input
# --------------------------------------------------------------------------

_CURLY_SINGLE = ("‘", "’")   # ' '
_CURLY_DOUBLE = ("“", "”")   # " "


def _match_input_quotes(src: str, out: str, stats: dict) -> str:
    if not any(ch in src for ch in _CURLY_SINGLE):
        n = sum(out.count(ch) for ch in _CURLY_SINGLE)
        for ch in _CURLY_SINGLE:
            out = out.replace(ch, "'")
        stats["curly_apostrophes_straightened"] = n
    if not any(ch in src for ch in _CURLY_DOUBLE):
        n = sum(out.count(ch) for ch in _CURLY_DOUBLE)
        for ch in _CURLY_DOUBLE:
            out = out.replace(ch, '"')
        stats["curly_quotes_straightened"] = n
    return out


# --------------------------------------------------------------------------
# Em dashes — do not inflate past the input's own count
# --------------------------------------------------------------------------

#: A mid-line em dash with its horizontal padding. [^\S\n] is "whitespace that
#: is not a newline", so a dash opening or closing a line never matches.
_MIDLINE_DASH = re.compile(
    r"(?<=[^\s—])[^\S\n]*—[^\S\n]*(?=[^\s—])"
)


def _bound_em_dashes(src: str, out: str, stats: dict) -> str:
    allowed = src.count(EM_DASH)
    have = out.count(EM_DASH)
    stats["em_dashes_in_source"] = allowed
    stats["em_dashes_in_rewrite"] = have
    if have <= allowed:
        stats["em_dashes_converted"] = 0
        return out
    excess = have - allowed
    matches = list(_MIDLINE_DASH.finditer(out))
    # Convert from the end of the document backwards, so the document keeps
    # its earliest dashes — and so the offsets of the untouched matches stay
    # valid while later ones are replaced.
    converted = 0
    for m in reversed(matches):
        if converted >= excess:
            break
        out = out[: m.start()] + " - " + out[m.end() :]
        converted += 1
    stats["em_dashes_converted"] = converted
    return out


# --------------------------------------------------------------------------
# A year spelled out against rule 5a goes back to digits
# --------------------------------------------------------------------------

_UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight",
          "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
          "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
         "eighty", "ninety"]

_J = r"[\s-]+"          # how spelled numbers join: space or hyphen
_AND = r"(?:and[\s-]+)?"


def _words_0_99(n: int) -> str | None:
    """A regex fragment for n spelled out, or None when n is 0."""
    if n == 0:
        return None
    if n < 20:
        return _UNITS[n]
    tens, unit = divmod(n, 10)
    if unit == 0:
        return _TENS[tens]
    return _TENS[tens] + _J + _UNITS[unit]


def _year_patterns(year: int) -> list[str]:
    """Every ordinary English spelling of `year`, as regex fragments."""
    pats: list[str] = []
    century, rest = divmod(year, 100)
    # The pair style: "sixteen ninety-eight", "nineteen oh five",
    # "nineteen hundred", "twenty twenty-eight".
    if 10 <= century <= 99:
        head = _words_0_99(century)
        if head:
            if rest == 0:
                pats.append(head + _J + "hundred")
            elif rest < 10:
                pats.append(head + _J + r"(?:oh|o|aught)" + _J + _UNITS[rest])
            else:
                tail = _words_0_99(rest)
                pats.append(head + _J + tail)
    # The long style: "two thousand and twenty-eight",
    # "one thousand nine hundred and eighty-four".
    thousands, below = divmod(year, 1000)
    if 1 <= thousands <= 2:
        head = _UNITS[thousands] + _J + "thousand"
        hundreds, tail_n = divmod(below, 100)
        parts = [head]
        if hundreds:
            parts.append(_AND + _UNITS[hundreds] + _J + "hundred")
        if tail_n:
            parts.append(_AND + _words_0_99(tail_n))
        if below == 0:
            pats.append(head)
        else:
            pats.append(_J.join(p for p in parts))
    return pats


_YEAR_DIGITS = re.compile(r"\b(1[0-9]{3}|20[0-9]{2})\b")


def _restore_years(src: str, out: str, stats: dict) -> str:
    restored: list[str] = []
    for year_str in sorted(set(_YEAR_DIGITS.findall(src))):
        if re.search(r"\b" + year_str + r"\b", out):
            continue                       # the digits survived; nothing to do
        for fragment in _year_patterns(int(year_str)):
            pattern = re.compile(r"\b" + fragment + r"\b", re.IGNORECASE)
            if pattern.search(src):
                # The customer spelled it out themselves somewhere; putting
                # digits back could overwrite their own words. Leave it.
                continue
            fixed, n = pattern.subn(year_str, out)
            if n:
                out = fixed
                restored.append(year_str)
    if restored:
        stats["years_restored"] = sorted(set(restored))
    return out


# --------------------------------------------------------------------------
# The whole repair pass
# --------------------------------------------------------------------------


def repair_rewrite(src: str, out: str) -> tuple[str, dict]:
    """Repair `out`, a model rewrite of `src`. Returns (repaired, stats).

    `src` is the text the model was given. Every rule conditions on it, so
    nothing the customer's own document carries is ever "repaired" away.
    """
    stats: dict = {}
    repaired = _strip_markdown(src, out, stats)
    repaired = _match_input_quotes(src, repaired, stats)
    repaired = _bound_em_dashes(src, repaired, stats)
    repaired = _restore_years(src, repaired, stats)
    stats["changed"] = repaired != out
    return repaired, stats
