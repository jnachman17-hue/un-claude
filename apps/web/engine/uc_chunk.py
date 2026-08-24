"""Chunked Layer B: rewrite a long document without losing any of it.

Written 19 August 2026 after a live test showed a 3,367 word document coming back
as 348 words, reported as success. See docs/TRACK-A-NOTES.md.

Two rules this module exists to enforce, both from 04 entry 22:
  * overflow rejects, never truncates
  * a failed rewrite refunds, so a partial result must raise rather than return
"""
from __future__ import annotations

import os
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor

from uc_leakguard import LeakSuspected, check_leak, strip_edge_separator

# Words per chunk. Smaller chunks carry fewer facts each, so each one is more
# likely to survive intact, and more of them run in parallel anyway. Measured:
# at 700 words, half of long documents were rejected for dropping a number.
TARGET_WORDS = int(os.environ.get("UC_LAYER_B_CHUNK_WORDS", "350"))
MIN_RATIO = 0.70         # Jon's ruling: we are a watermark remover, not a
                         # summariser. Anything under 70% of the input length is
                         # a failed rewrite, not a short one.
# Chunks at once. Raised from 3 to 8 on 19 Aug 2026: at 3 the deployed engine
# took 56.2 seconds on a 5,047 word document against Vercel's 60 second ceiling,
# four seconds of headroom. At 8 the same document takes about 22 seconds. The
# earlier limit of 3 existed only because a free credit balance was being rate
# limited, and paid credits are now in place.
MAX_WORKERS = int(os.environ.get("UC_LAYER_B_WORKERS", "8"))
RETRIES = int(os.environ.get("UC_LAYER_B_RETRIES", "8"))  # per chunk
# Extra attempts a chunk may spend PURELY on getting its paragraphs back, when
# the facts already survived. Deliberately tiny and deliberately separate from
# RETRIES: a re-roll for structure costs a model call and seconds against the
# function ceiling, so it is capped at one by default rather than sharing the
# fact guard's budget of eight. Set to 0 to turn structure re-rolls off.
STRUCTURE_RETRIES = int(os.environ.get("UC_LAYER_B_STRUCTURE_RETRIES", "1"))

# HOW LONG THE WHOLE REWRITE MAY SPEND RETRYING, in seconds.
#
# ENGINE.md section 10 lists this as improvement zero and it is now measured.
# The retry ceiling was a COUNT and nothing connected it to a clock, so a
# number-dense document could spend its entire budget retrying and then fail
# with nothing to show. Measured on a 10,464 word document: 34 chunks, 149
# model calls, eight chunks burning all eight attempts each, 95 seconds, 2.5
# cents spent, and the request failed. A failed run is the most expensive
# thing this engine does and it is the one the customer is refunded for.
#
# 180 SECONDS IS NOT AN ARBITRARY NUMBER, IT IS THE MIDDLE OF THREE CEILINGS.
# The site aborts its own call to the engine at 240 seconds
# (lib/engine/client.ts), and Vercel kills the function at 300 (vercel.json).
# This budget stops NEW retries; a model call already in flight has its own
# 45 second timeout on top, so the true worst case is 180 + 45 = 225 seconds —
# inside the site's abort with 15 seconds to spare and inside Vercel's cap with
# 75. Past the site's abort the browser is told the service is unreachable, the
# credit is refunded, and the engine carries on running and billing for work
# nobody will ever see, so being the smaller number matters.
#
# This was 100 while the site's abort was 120. Both were raised together on
# 21 August 2026; raising either alone does nothing, which is the mistake
# `limits.md` made when it raised Vercel's cap from 60 to 300 and left the
# site giving up at 120.
DEADLINE = float(os.environ.get("UC_LAYER_B_DEADLINE", "180"))
BACKOFF = 2.5            # seconds, multiplied each attempt, plus jitter


class TruncatedRewrite(RuntimeError):
    """The model returned materially less text than it was given."""


class FactsLost(RuntimeError):
    """The model dropped numbers that were in the input.

    Carries the dropped values so the retry can name them back to the model.
    """

    def __init__(self, message: str, missing: list[str] | None = None):
        super().__init__(message)
        self.missing = missing or []


# THE NUMBER READER. Rewritten 21 August 2026, and it has now been got wrong
# THREE times, so read this before touching it and re-run the table that proves
# it (docs/session-notes/engine-limits.md, part 5).
#
# Its job is to answer one question: what numeric VALUES does this text contain?
# It compares values, never spellings, so a model writing "eighteen percent" for
# "18 percent" is not a loss and does not cost a retry.
#
# THE THREE MISTAKES, IN ORDER, BECAUSE EACH ONE WAS A REPAIR OF THE LAST.
#
#   1. "thirty-four" resolved to 30 AND 4 rather than 34, so the guard rejected
#      six chunks in eight on entirely false grounds.
#   2. The repair added 34 to the set and LEFT 30 AND 4 IN IT, so a source saying
#      "thirty-four" demanded a 30 in the output and an output written "34" — the
#      natural thing for a model to do — looked like a dropped figure.
#   3. Scale words were not read at all. "thirty thousand" resolved to 30 and
#      "30,000" to 30000, so a model doing exactly what rule 5 of the prompt asks
#      looked like it had dropped a figure. Measured on a 10,464 word document:
#      126 of 149 attempts ended in the fact guard, eight chunks burned all eight
#      retries, and the run cost about four times what a clean one needs.
#
# An earlier attempt at mistake 3 was BUILT AND THEN REJECTED, because measuring
# it showed it cured "thirty thousand" and broke "two thousand five hundred" —
# it multiplied but could not add. A change that measures as a wash is worse than
# no change. This version does both, and is measured against 29 real rewrite
# pairs: the old reader is wrong on 5 of them, this one on none.
#
# The algorithm is the ordinary way English numbers are read. Values accumulate
# into `current`; "hundred" multiplies it; a scale word banks it into `total` and
# starts again; anything that is not part of a number flushes what has been
# built. The combining rule is the real English one — a smaller value joins a
# larger one only when the larger is a round hundred or more, or when a tens word
# is followed by a unit ("thirty four"). That is what keeps "nineteen eighty
# four" as 19 and 84 rather than 103.
_UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
    "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30,
    "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80,
    "ninety": 90,
}
_SCALES = {"thousand": 1000, "million": 1000000,
           "billion": 1000000000, "trillion": 1000000000000}

#: A run of digits (commas and one decimal point allowed), or a word.
_TOKEN = re.compile(r"\d[\d,]*(?:\.\d+)?|[a-z]+")


def _format_value(value: float | int) -> str:
    """One spelling per value, so two texts can be compared as sets."""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, int):
        return str(value)
    return repr(value).rstrip("0").rstrip(".")


def _numbers(text: str) -> set[str]:
    """Every numeric value present, however it is written."""
    out: set[str] = set()
    current: float = 0
    total: float = 0
    have = False

    def flush() -> None:
        nonlocal current, total, have
        if have:
            out.add(_format_value(total + current))
        current = total = 0
        have = False

    for token in _TOKEN.findall(text.lower().replace("-", " ")):
        if token[0].isdigit():
            # A figure written in digits ends whatever came before it. A scale
            # word after it still applies: "30 thousand" is 30000.
            flush()
            raw = token.replace(",", "")
            current = float(raw) if "." in raw else int(raw)
            have = True
        elif token in _UNITS:
            value = _UNITS[token]
            joins = have and (
                # "two hundred and five", "one thousand and one"
                (current > 0 and current % 100 == 0 and value < 100)
                or (current == 0 and total > 0 and value < 1000)
                # "thirty four" is 34; "nineteen eighty four" is 19 and 84
                or (20 <= current <= 90 and current % 10 == 0 and 1 <= value <= 9)
            )
            if joins:
                current += value
            else:
                flush()
                current, have = value, True
        elif token == "hundred":
            # A bare "hundred" with nothing before it is 100, so that "a hundred"
            # and "one hundred" agree rather than costing a retry.
            current = (current or 1) * 100
            have = True
        elif token in _SCALES:
            total += (current or 1) * _SCALES[token]
            current = 0
            have = True
        elif token == "and":
            # Only meaningful inside a number ("a hundred and twenty"). Between
            # two unrelated figures the words on either side flush anyway.
            continue
        else:
            flush()
    flush()
    return out


# A paragraph break: a newline, then at least one more newline, with only
# spaces or tabs allowed in between. A single newline inside a paragraph is a
# soft wrap and is NOT a break.
#
# WHY THE SEPARATORS ARE CAPTURED RATHER THAN DISCARDED. This module used to
# split on r"\n\s*\n" without a capturing group and rejoin every paragraph with
# a flat "\n\n". That threw away the document's real spacing before the model
# ever saw it: three blank lines became one, an indented block lost its indent,
# and the leading and trailing whitespace of the whole document disappeared.
# The separators are now kept and put back exactly where they were.
_PARA_BREAK = re.compile(r"(\n[^\S\n]*(?:\n[^\S\n]*)+)")


def _split_blocks(text: str) -> tuple[str, list[str], list[str], str]:
    """Take a document apart into (lead, paragraphs, separators, tail).

    `lead` and `tail` are the document's own leading and trailing whitespace,
    held aside so the model never sees them and cannot eat them. `separators`
    holds the exact run of newlines that sat between each pair of paragraphs, so
    len(separators) == len(paragraphs) - 1 and the original text is recoverable
    character for character by interleaving the two.
    """
    body = text.strip("\n")
    lead = text[: len(text) - len(text.lstrip("\n"))]
    tail = text[len(text.rstrip("\n")) :] if text.strip("\n") else ""
    parts = _PARA_BREAK.split(body)
    paras, seps = parts[0::2], parts[1::2]
    # A whitespace-only "paragraph" — a line of spaces at the edge of the
    # document — is FOLDED into the whitespace either side of it rather than
    # dropped. This used to drop it and flatten every separator to "\n\n",
    # which silently deleted the customer's own bytes: test_spans.py caught
    # "   \n\nA" coming back as "A" with no model anywhere near it.
    i = 0
    while i < len(paras):
        if paras[i].strip():
            i += 1
            continue
        blob = paras.pop(i)
        if not paras:
            # It was the only paragraph; the whole body is whitespace.
            lead = lead + blob
        elif i == 0:
            lead = lead + blob + seps.pop(0)
        elif i == len(paras):
            tail = seps.pop(i - 1) + blob + tail
        else:
            seps[i - 1] = seps[i - 1] + blob + seps.pop(i)
    return lead, paras, seps, tail


def _plan_chunks(paras: list[str], seps: list[str]) -> list[dict]:
    """Group paragraphs into chunks of roughly TARGET_WORDS, never splitting one.

    Each chunk carries the separators that belong INSIDE it and the one that
    follows it, so the exact spacing can be rebuilt after the rewrite.
    """
    groups: list[list[int]] = []
    current: list[int] = []
    count = 0
    for index, para in enumerate(paras):
        n = len(para.split())
        if current and count + n > TARGET_WORDS:
            groups.append(current)
            current, count = [], 0
        current.append(index)
        count += n
    if current:
        groups.append(current)

    plan: list[dict] = []
    for group in groups:
        inner = [seps[i] for i in group[:-1]]
        after = seps[group[-1]] if group[-1] < len(seps) else ""
        plan.append({
            "paras": [paras[i] for i in group],
            "inner": inner,
            "after": after,
        })
    return plan


def _weave(paras: list[str], seps: list[str]) -> str:
    """Paragraphs and their separators back into one string."""
    out = []
    for i, para in enumerate(paras):
        out.append(para)
        if i < len(seps):
            out.append(seps[i])
        elif i < len(paras) - 1:
            out.append("\n\n")
    return "".join(out)


def _restore(rewritten: str, inner: list[str], wanted: int) -> tuple[str, bool]:
    """Put the chunk's original paragraph spacing back onto the model's output.

    Returns (text, structure_kept). When the model returned the same number of
    paragraphs it was given, the original separators go back exactly and the
    answer is True. When it merged or split paragraphs there is no honest way to
    align the two, so its own layout is kept unchanged and the answer is False —
    surfaced in the report rather than papered over. Guessing where a paragraph
    break belongs in somebody's document is not something this engine does.
    """
    parts = _PARA_BREAK.split(rewritten)
    paras = [p for p in parts[0::2] if p.strip()]
    if len(paras) == wanted:
        return _weave(paras, inner), True
    return rewritten, False


def split_paragraphs(text: str) -> list[str]:
    """Group paragraphs into chunks of roughly TARGET_WORDS, never splitting one.

    Kept as the plain-text view of `_plan_chunks` for callers and tests that
    only want the chunk boundaries.
    """
    _lead, paras, seps, _tail = _split_blocks(text)
    plan = _plan_chunks(paras, seps)
    return [_weave(c["paras"], c["inner"]) for c in plan] or [text]


def _merge_usage(total: dict, part: dict) -> dict:
    """Add one chunk's usage figures into the document total.

    Every value is a count or an amount of money, so adding them is the whole of
    it. Kept as plain addition rather than anything cleverer so a figure cannot
    be lost by a key this function has not been taught about.
    """
    for key, value in part.items():
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            total[key] = total.get(key, 0) + value
    if "cost_usd" in total:
        total["cost_usd"] = round(total["cost_usd"], 10)
    return total


def rewrite_long(text: str, rewrite_fn) -> tuple[str, dict]:
    """Rewrite `text` in chunks, in parallel, and verify nothing went missing.

    `rewrite_fn(chunk, attempt, missing, usage_out) -> (rewritten, info)` does
    one chunk. `usage_out` is a dict this function owns and the callee adds token
    counts and cost into; it is passed down rather than returned back so the
    figures survive a call that raises.

    Raises TruncatedRewrite if any chunk, or the whole, comes back too short.
    """
    deadline = time.monotonic() + DEADLINE
    lead, paragraphs, separators, tail = _split_blocks(text)
    plan = _plan_chunks(paragraphs, separators)
    if not plan:
        # Nothing but whitespace. There is no rewrite to do and no structure to
        # lose, so hand it straight back rather than sending blanks to a model.
        return text, {"chunks": 0, "parallel": False, "words_in": 0, "words_out": 0,
                      "usage": {"chunks": 0, "retries": 0}, "figures_to_check": [],
                      "paragraphs_in": 0, "paragraphs_out": 0, "structure_kept": True}
    chunks = [_weave(c["paras"], c["inner"]) for c in plan]

    results: list[str | None] = [None] * len(chunks)
    infos: list[dict] = [{} for _ in chunks]
    # One accumulator per chunk. Each thread writes only its own index, so the
    # totals need no lock, and they are readable from here even if a chunk
    # raises part way through its retries.
    usages: list[dict] = [{} for _ in chunks]

    def one(i: int):
        """Best effort, then report. Never throw away a usable rewrite.

        Corrected 19 Aug 2026 after measurement. This used to reject the whole
        document if any chunk dropped a number. That is arithmetic suicide: with
        fifteen chunks at 95% each, the document only survives 46% of the time,
        and half of all long documents were refused.

        Measured with best-effort-and-report instead: 100% of numbers preserved
        on every document tested, 90 to 96% of the words, nothing refused. The
        rejection was discarding good work over a figure that usually appeared
        elsewhere in the document anyway.

        The length guard below still rejects outright. A truncated document is
        useless; a document with two figures flagged for checking is not.
        """
        best_out = None
        best_info: dict = {}
        best_missing: list[str] = []
        best_kept = False
        structure_rerolls = 0
        last_err = None
        usage = usages[i]
        wanted = len(plan[i]["paras"])
        inner = plan[i]["inner"]
        for attempt in range(RETRIES):
            # Counted before the call, so an attempt that raises is still an
            # attempt. `attempts` is the retry story and `model_calls`, filled in
            # by the callee, is the billing one. They are equal at one candidate
            # per attempt and are recorded separately rather than assumed equal.
            usage["attempts"] = attempt + 1
            try:
                out, info = rewrite_fn(chunks[i], attempt, best_missing, usage)
            except Exception as e:
                last_err = e
                if attempt < RETRIES - 1 and time.monotonic() < deadline:
                    time.sleep(BACKOFF * (attempt + 1) + random.uniform(0, 1.0))
                    continue
                break
            try:
                _guard(chunks[i], out, i)           # length: still a hard failure
            except TruncatedRewrite as e:
                last_err = e
                if attempt < RETRIES - 1 and time.monotonic() < deadline:
                    time.sleep(0.4)
                    continue
                # A SHORT LAST ATTEMPT USED TO KILL THE WHOLE DOCUMENT, even
                # when this chunk was already holding a perfectly good rewrite
                # from an earlier attempt that had merely dropped a figure.
                # That is the failure Jon saw at 10,000 words and it gets more
                # likely the longer the document is: 34 chunks with 8 rolls
                # each is 272 chances for one of them to come back short, and
                # any single one of them ended the request.
                #
                # This does not soften 04 entry 22. Nothing truncated is ever
                # returned — `best_out` passed the same length guard when it
                # was recorded. The only change is that a good rewrite already
                # in hand is no longer discarded because a later roll was bad.
                if best_out is not None:
                    return i, best_out, best_info, best_missing, usage, best_kept
                raise
            # The chunk's own paragraph spacing goes back on here, before any
            # guard reads it, so every path below returns the restored text.
            out, kept = _restore(out, inner, wanted)
            # A bare `---` at either edge is the prompt's own separator showing
            # through. Removed rather than rejected: it turned up in 1.7% of
            # perfectly good rewrites, and refunding a customer over a stray
            # punctuation mark would be worse than the mark. The chunk's own
            # text rides along so an edge rule the CUSTOMER typed is kept.
            out, _stripped = strip_edge_separator(out, src=chunks[i])
            # IS THIS EVEN THE CUSTOMER'S TEXT? Nothing above asks. The length
            # guard catches a rewrite that came back too SHORT and the fact guard
            # catches one that dropped a number, but a response that is our own
            # prompt rewritten, or an answer to the customer's question, or an
            # invented document, passes both. That is what reached a customer on
            # 22 August 2026. This runs BEFORE `best_out` can be recorded below,
            # so a suspect rewrite can never become the fallback that gets
            # returned when a later attempt fails.
            leak = check_leak(chunks[i], out)
            if leak:
                last_err = LeakSuspected(
                    f"chunk {i + 1} {leak}")
                if attempt < RETRIES - 1 and time.monotonic() < deadline:
                    time.sleep(0.4)
                    continue
                # Retries exhausted. A suspect rewrite is NEVER returned, so this
                # falls through to whatever clean attempt is already in hand and
                # otherwise raises, which refunds. 04 entry 22.
                break
            try:
                _guard_facts(chunks[i], out, i)     # facts: advisory, keep the best
                if kept or structure_rerolls >= STRUCTURE_RETRIES or attempt >= RETRIES - 1:
                    return i, out, info, [], usage, kept
                # Facts survived but paragraphs did not. The model merged or split
                # something, and because the rewrite is non-deterministic another
                # roll usually lands it. One roll, then take whichever is better
                # and move on: a merged paragraph is a blemish, not a reason to
                # spend the request's whole time budget.
                structure_rerolls += 1
                if best_out is None or (best_missing == [] and not best_kept):
                    best_out, best_info, best_missing, best_kept = out, info, [], kept
                if time.monotonic() >= deadline:
                    return i, out, info, [], usage, kept
                time.sleep(0.4)
                continue
            except FactsLost as e:
                # Fewer dropped figures wins. Where two attempts dropped the same
                # number of figures, the one that kept the paragraphs wins — a
                # free tie-break on retries that were happening anyway, which is
                # why structure never triggers a model call of its own.
                better = (
                    best_out is None
                    or len(e.missing) < len(best_missing)
                    or (len(e.missing) == len(best_missing) and kept and not best_kept)
                )
                if better:
                    # The info of the attempt actually being kept. This used to
                    # return an empty dict here, which threw away the model name
                    # and every figure belonging to the run that was returned.
                    best_out, best_info, best_missing, best_kept = out, info, e.missing, kept
                if attempt < RETRIES - 1 and time.monotonic() < deadline:
                    time.sleep(0.4)
                    continue
                break
        if best_out is not None:
            return i, best_out, best_info, best_missing, usage, best_kept
        raise RuntimeError(
            f"chunk {i + 1} failed after {RETRIES} attempts: "
            f"{type(last_err).__name__}") from last_err

    # A single chunk needs no pool, and this call has to come AFTER `one` is
    # defined. It used to sit above the definition, where `one` is a local name
    # that has not been assigned yet, so every document short enough to be one
    # chunk raised UnboundLocalError and layer B failed outright. Under roughly
    # 350 words is one chunk, which is very nearly every paste a visitor makes
    # into the box on the landing page.
    def totals() -> dict:
        """Every chunk's usage added together, plus the two derived counts.

        Safe to call on a half-finished run: a chunk that never started
        contributes an empty dict rather than a wrong number.
        """
        total: dict = {}
        for part in usages:
            _merge_usage(total, part)
        total["chunks"] = len(chunks)
        # Attempts beyond the first for each chunk. Reported separately because
        # eight attempts spread over four chunks and eight attempts on one chunk
        # cost about the same and mean very different things.
        total["retries"] = sum(max(0, u.get("attempts", 0) - 1) for u in usages)
        return total

    try:
        if len(chunks) == 1:
            _, out, info, missing, _usage, kept = one(0)
            out = lead + out + tail
            info = dict(info or {})
            # words_in and words_out used to be set on the multi-chunk path only,
            # so they were absent on anything under roughly 350 words, which is
            # very nearly every paste. API.md section 12 documented that absence
            # as a fact. They are now on both paths. 06 row 48.
            info.update(chunks=1, parallel=False,
                        words_in=len(text.split()), words_out=len(out.split()),
                        usage=totals(),
                        figures_to_check=[m for m in missing if m not in _numbers(out)],
                        paragraphs_in=len(paragraphs),
                        paragraphs_out=len(_split_blocks(out)[1]),
                        structure_kept=bool(kept))
            return out, info

        with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(chunks))) as pool:
            at_risk: list[str] = []
            all_kept = True
            for i, out, info, missing, _usage, kept in pool.map(one, range(len(chunks))):
                results[i], infos[i] = out, (info or {})
                at_risk.extend(missing)
                all_kept = all_kept and kept

        # Chunks are rejoined with the separator that ACTUALLY sat between them,
        # not a flat blank line. The chunk boundary is always a paragraph
        # boundary, so this half of the document's spacing is exact whatever the
        # model does inside a chunk.
        joined = lead + "".join(
            (r if r is not None else "") + (plan[i]["after"] if i < len(plan) - 1 else "")
            for i, r in enumerate(results)
        ) + tail
        _guard(text, joined, -1)
        merged = dict(infos[0])
        # Figures the rewrite could not be shown to preserve inside their own chunk.
        # Most reappear elsewhere in the document; they are surfaced so a user can
        # check rather than hidden. 06 row 27: the panel shows what was checked.
        still_missing = sorted(
            {m for m in at_risk if m not in _numbers(joined)}, key=lambda x: (-len(x), x))
        # `merged` starts as chunk one's info and therefore carries chunk one's
        # usage. Overwriting it with the document total is not optional: leaving
        # it would report one chunk's tokens as the whole document's.
        merged.update(chunks=len(chunks), parallel=True,
                      words_in=len(text.split()), words_out=len(joined.split()),
                      usage=totals(),
                      figures_to_check=still_missing,
                      paragraphs_in=len(paragraphs),
                      paragraphs_out=len(_split_blocks(joined)[1]),
                      structure_kept=bool(all_kept))
        return joined, merged
    except Exception as failure:
        # A failed layer B run is the most expensive thing this engine can do:
        # every chunk retries up to RETRIES times and every attempt is billed.
        # The exception is re-raised unchanged so the caller's own branches still
        # work; the figures ride along on it. 06 row 48.
        try:
            failure.usage = totals()
        except Exception:      # noqa: S110 — an exception that refuses an
            pass               # attribute must not replace the real failure
        raise


def _guard_facts(src: str, out: str, index: int) -> None:
    """Every number in the input must appear in the output.

    Jon's standing requirement: this tool removes marks and preserves everything
    else. A rewrite that quietly drops a figure is worse than one that fails,
    because the user cannot see it happen. Measured on a 5,047 word document,
    unguarded chunks lost between 16 and 47 of 206 numbers per run.
    """
    missing = _numbers(src) - _numbers(out)
    # single digits are noise: they appear inside words, dates and ordinals
    missing = {m for m in missing if len(m) > 1}
    if missing:
        where = "the document" if index < 0 else f"chunk {index + 1}"
        ordered = sorted(missing, key=lambda x: (-len(x), x))
        raise FactsLost(
            f"{where} dropped {len(missing)} numbers: {ordered[:6]}", ordered[:12])


def _guard(src: str, out: str, index: int) -> None:
    src_n, out_n = len(src.split()), len((out or "").split())
    if src_n and out_n / src_n < MIN_RATIO:
        where = "the document" if index < 0 else f"chunk {index + 1}"
        raise TruncatedRewrite(
            f"{where} came back at {out_n} words from {src_n} "
            f"({out_n / src_n:.0%} of the original); the rewrite was cut short and has "
            "been rejected rather than returned"
        )
