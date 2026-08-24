"""Does this rewrite actually derive from the customer's text?

Written 22 August 2026 after a customer received a rewrite of the engine's own
prompt instead of their document. See docs/session-notes/prompt-leak.md.

The existing guards ask whether the rewrite kept the facts (`_guard_facts`) and
whether it kept the length (`_guard`). NEITHER ASKS WHETHER IT IS THE CUSTOMER'S
TEXT AT ALL, and that is the gap this module fills.

WHAT THE MEASUREMENTS SAID, because two of the obvious ideas do not work.

  * AN INPUT-OVERLAP FLOOR CANNOT SEPARATE THEM. Across 360 measured runs the
    fraction of the input's distinctive words surviving into a GOOD rewrite fell
    as low as 0.08, while a LEAKED output reached 0.14. The ranges overlap, so a
    floor set anywhere between them refunds paying customers for work that
    succeeded. Not used.
  * RESEMBLANCE TO THE PROMPT IS ALMOST USELESS ON ITS OWN, because the model
    does not copy the prompt, it REWRITES the prompt — which is exactly what it
    was asked to do. The output Jon was shown scored 0.03 bigram overlap against
    the prompt it came from. Verbatim echo is kept below only because a hit is
    certain proof; it is not relied on to catch anything.

WHAT DOES WORK IS LENGTH. Every leak is the model answering, explaining, or
inventing, and all three run long. Across 240 rewrites of ordinary prose the
output never exceeded 1.35x its input; across 155 confirmed defects the median
was over 6x and the worst was 212x. The ceiling below sits above every good
rewrite observed and under almost every bad one.

Measured over 720 recorded rewrites on both models: 152 of 155 confirmed defects
caught, and ZERO false positives on the 240 rewrites of ordinary prose. That
second number is the one that matters — see docs/session-notes/prompt-leak.md
section 4.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# HOW MUCH LONGER THAN ITS INPUT A REWRITE MAY COME BACK.
#
# The prompt already demands the rewrite stay within roughly one tenth of the
# original (rule 3a), so this is not a new rule, it is the first enforcement of
# an existing one.
#
# 1.5 AND 8 ARE MEASURED, NOT PICKED. The worst of 240 good rewrites came back
# at 1.35x, so 1.35 with no slack would sit exactly on the highest good result
# with no headroom at all and one more sample would break it. 1.5 with 8 words
# of slack clears every good run measured and still does most of the catching on
# its own: 128 of 155 confirmed defects, with the phrase checks below taking the
# total to 152. The slack exists because on a very short input a couple of words
# swing the ratio wildly: a four word paste coming back as nine words is
# ordinary, not a leak.
MAX_EXPANSION = 1.5
EXPANSION_SLACK = 8

# THE ONE-SIDEDNESS IS DELIBERATE. Coming back SHORT is already a hard failure in
# uc_chunk._guard, and it is a different defect (truncation) with a different
# remedy. This module only asks about growth.


class LeakSuspected(RuntimeError):
    """The output does not plausibly derive from the input.

    Raised so the caller retries and, if retries run out, fails the job. A
    suspect rewrite is never returned: a refund is a far better outcome for a
    customer than receiving our prompt.
    """


# Phrases that only occur when the model is talking ABOUT the task instead of
# doing it. Every one was observed in a real leaked output; none fired on any of
# the 240 good rewrites measured.
#
# KEPT NARROW AND TASK-SPECIFIC ON PURPOSE. A guard that fires on good output is
# worse than no guard, because it refunds a customer whose work actually
# succeeded. Two rules keep it honest:
#
#   * Every phrase names OUR job — rewriting, the rules, the preamble. A bare
#     "I am sorry" or "Please provide the form" is ordinary in somebody's letter
#     or instruction sheet, so neither is here. An earlier draft matched refusals
#     and requests at the start of the output; it caught "I am sorry for what
#     happened that day, she wrote" and was cut for it.
#   * A phrase already present in the CUSTOMER'S OWN TEXT is never treated as
#     ours (see `check_leak`). If they sent it, getting it back is the product
#     working.
_META = re.compile(
    r"""(?ix)
      \b(
        here \s* ['’]? s \s+ (?: your | my | the ) \s+ (?: rewritten | revised | new | fresh )
      | here \s+ is \s+ (?: your | my | the ) \s+ (?: rewritten | revised | new | fresh )
      | (?: a | my | the ) \s+ fresh \s+ take
      | (?: i | we ) \s* ['’]? (?: ll | ve | m ) \s+ (?: now \s+ )? rewrit
      | (?: i | we ) \s+ (?: can | cannot | can \s* ['’]? t | will | would ) \s+
        (?: not \s+ )? (?: provide | give ) \s+ (?: a | the | you ) \s+ rewrit
      | (?: unable | refuse ) \s+ to \s+ assist \s+ with \s+ (?: that | this ) \s+ request
      | can \s* ['’]? t \s+ assist \s+ with \s+ (?: that | this ) \s+ request
      | you \s* ['’]? d? \s+ like \s+ (?: me \s+ )? to \s+ (?: rewrite | rephrase | paraphrase )
      | (?: paste | provide | share ) \s+ (?: the | your ) \s+ (?: \w+ \s+ ){0,2}
        (?: text | paragraph | passage ) \s+ you \s* ['’]? d? \s+ like
      | the \s+ rewrite \s+ follows \s+ all \s+ rules
      | adher (?: ing | es ) \s+ (?: strictly \s+ )? to \s+ (?: all \s+ )? (?: the \s+ )? (?: given \s+ )? rules
      | (?: no | without ) \s+ preamble \s+ or \s+ commentary
      | original \s+ phrasing \s+ survives
      | (?: consecutive | original ) \s+ words \s+ from \s+ the \s+ original
      | preserved \s+ exactly \s+ as \s+ a \s+ fact
      | rule \s+ \d+ [a-z]? \s* [:,]
      | this \s+ is \s+ too \s+ short \s+ compared \s+ to \s+ the \s+ original
      | let \s+ me \s+ expand \s+ it
      )""",
)

def strip_edge_separator(out: str, src: str | None = None) -> tuple[str, bool]:
    """Remove a bare `---` line at the very start or end of the output.

    The prompt uses a horizontal rule to separate its rules from the text, so a
    stray one at the edge of a rewrite is a fingerprint of that boundary rather
    than the customer's own punctuation.

    STRIPPED, NOT REJECTED. Measured at 1.7% of good rewrites (2 of 120), so
    failing the job over it would refund real customers over a cosmetic blemish.
    Only the edges are touched; a rule the customer put INSIDE their document
    stays exactly where they put it.

    WHEN `src` IS GIVEN, AN EDGE THE CUSTOMER'S OWN CHUNK CARRIES A RULE ON IS
    LEFT ALONE. Before this, a document whose chunk began or ended with the
    customer's own `---` had it deleted even when the model returned it
    faithfully — test_spans.py proved it with no model involved. Same principle
    as `check_leak`: a phrase already present in the customer's own text is
    never treated as ours.
    """
    _rule = r"\s*-{3,}\s*"
    src_lines = (src or "").split("\n") if src else []
    src_starts = bool(src_lines) and re.fullmatch(_rule, src_lines[0]) is not None
    src_ends = bool(src_lines) and re.fullmatch(_rule, src_lines[-1]) is not None
    lines = (out or "").split("\n")
    changed = False
    while not src_starts and lines and re.fullmatch(_rule, lines[0]):
        lines.pop(0)
        changed = True
    while not src_ends and lines and re.fullmatch(_rule, lines[-1]):
        lines.pop()
        changed = True
    return ("\n".join(lines).strip("\n") if changed else out), changed


def _prompt_ngrams(n: int = 6) -> set[str]:
    """Distinctive word runs from the live prompts, for verbatim-echo detection.

    Derived from the prompt text at import rather than hardcoded, so editing a
    prompt cannot leave this checking for phrases that no longer exist.
    """
    from rewrite_text import PROMPTS

    grams: set[str] = set()
    for template in PROMPTS.values():
        body = template.split("\n\n---\n")[0]
        body = re.sub(r"\{[A-Z_]+\}", " ", body)
        words = re.findall(r"[a-z]+", body.lower())
        for i in range(len(words) - n + 1):
            grams.add(" ".join(words[i : i + n]))
    return grams


_PROMPT_NGRAMS = _prompt_ngrams()


def _echoes_prompt(src: str, out: str) -> str | None:
    """A word run lifted verbatim from our prompt that was not in the input."""
    src_words = " ".join(re.findall(r"[a-z]+", src.lower()))
    out_words = re.findall(r"[a-z]+", (out or "").lower())
    for i in range(len(out_words) - 5):
        gram = " ".join(out_words[i : i + 6])
        if gram in _PROMPT_NGRAMS and gram not in src_words:
            return gram
    return None


def check_leak(src: str, out: str) -> str | None:
    """Return why `out` looks like something other than a rewrite of `src`.

    None means it passed. The order is cheapest and most certain first.
    """
    src_n = len(src.split())
    out_n = len((out or "").split())

    if src_n and out_n > src_n * MAX_EXPANSION + EXPANSION_SLACK:
        return (
            f"came back at {out_n} words from {src_n} "
            f"({out_n / src_n:.1f}x the original); a rewrite stays about the "
            "same length, so this is not the text that was sent"
        )
    hit = _META.search(out or "")
    if hit and not _META.search(src or ""):
        return f"contains commentary about the rewriting task: {hit.group(0).strip()!r}"
    gram = _echoes_prompt(src, out)
    if gram:
        return f"repeats a phrase from the engine's own instructions: {gram!r}"
    return None
