"""Count words in a way that works in Chinese, Japanese and Thai.

Lane A step 3 (W10 §4.9). Every word count in the engine used to be
`len(text.split())`, which counts SPACES — and Chinese, Japanese and Thai do
not put spaces between words. A 101-character Japanese paragraph counted as
"1 word", fell under every floor, and was silently refused the rewrite.

THE RULE, STATED SO IT CAN BE CHECKED:

  * A CJK character (Chinese ideographs, Japanese kana, full-width forms)
    counts as ONE word each. Real Chinese and Japanese words average a little
    under two characters, so this overcounts slightly — deliberately, because
    every consumer of this number is a safety margin (chunk sizes, truncation
    ratios) where overcounting the input is the safe direction, and because
    the same rule is applied to both sides of every ratio, so the bias
    cancels.
  * Thai, Lao, Khmer and Myanmar scripts have no dictionary-free word
    boundary at all; their characters count as one word per FOUR characters
    (Thai words average about four characters). An approximation, and an
    honest one: the alternative in production today is "1".
  * Everything else is split on whitespace, exactly as before. English
    documents count identically to the old rule.

WHERE THIS IS AND IS NOT USED. It drives the ENGINE-INTERNAL numbers: chunk
planning, the truncation guard's ratio, and the leak guard's expansion ratio.
It deliberately does NOT drive billing, the 10,000-word ceiling, or the
16-word rewrite floor — those decide what a customer is charged and what runs,
they are wired to the old counter in uc_policy.py and server.py, and changing
them is Jon's call, recorded in the session note.

Ranges are written as escapes, not literal characters, so they can be checked
against the Unicode charts by eye (07-runbook: never trust invisible or
unfamiliar characters typed into source).
"""

from __future__ import annotations

import re

#: Scripts whose every character is (approximately) a word.
_CJK = (
    "\u3040-\u30ff"            # hiragana + katakana
    "\u3400-\u4dbf"            # CJK unified ideographs extension A
    "\u4e00-\u9fff"            # CJK unified ideographs
    "\uf900-\ufaff"            # CJK compatibility ideographs
    "\uff66-\uff9d"            # half-width katakana
    "\U00020000-\U0002a6df"    # CJK unified ideographs extension B
)
#: Scripts with no space between words and longer words: about 4 chars each.
_SEQUENTIAL = (
    "\u0e01-\u0e5b"            # Thai letters and marks
    "\u0e81-\u0edf"            # Lao
    "\u1000-\u109f"            # Myanmar
    "\u1780-\u17dd"            # Khmer
)

_CJK_RE = re.compile(f"[{_CJK}]")
_SEQ_RE = re.compile(f"[{_SEQUENTIAL}]")
_STRIP_RE = re.compile(f"[{_CJK}{_SEQUENTIAL}]")


def count_words(text: str) -> int:
    """Words in `text`, counted so that no script counts as zero."""
    if not text:
        return 0
    cjk = len(_CJK_RE.findall(text))
    seq = len(_SEQ_RE.findall(text))
    rest = _STRIP_RE.sub(" ", text)
    return cjk + (seq + 3) // 4 + len(rest.split())
