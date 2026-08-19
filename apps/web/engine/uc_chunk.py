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


_NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")
_WORDNUM = {
    "zero":"0","one":"1","two":"2","three":"3","four":"4","five":"5","six":"6",
    "seven":"7","eight":"8","nine":"9","ten":"10","eleven":"11","twelve":"12",
    "thirteen":"13","fourteen":"14","fifteen":"15","sixteen":"16",
    "seventeen":"17","eighteen":"18","nineteen":"19","twenty":"20","thirty":"30",
    "forty":"40","fifty":"50","sixty":"60","seventy":"70","eighty":"80","ninety":"90",
}


_TENS = {"twenty":20,"thirty":30,"forty":40,"fifty":50,
         "sixty":60,"seventy":70,"eighty":80,"ninety":90}


def _numbers(text: str) -> set[str]:
    """Every numeric value present, however written. Digits and number-words.

    Compares values rather than spellings, so a model writing 'eighteen percent'
    for '18 percent' is not a loss.

    COMPOUNDS MATTER AND HAVE NOW BEEN GOT WRONG TWICE, IN OPPOSITE DIRECTIONS.

    First time: 'thirty-four' resolved to 30 and 4 and not to 34, so the guard
    rejected six chunks in eight on entirely false grounds.

    Second time, fixed here 19 August 2026: the repair added 34 to the set but
    LEFT 30 AND 4 IN IT. So a source saying 'thirty-four' demanded that the
    output contain 30, and an output written as '34' — the natural thing for a
    model to do — looked like a dropped figure. Measured on a real 674 word
    document: ten model calls where three were needed, seven of them retries
    chasing numbers that were never lost, 38 seconds against a 60 second
    ceiling, and four times the documented cost per thousand words.

    A tens word immediately followed by a unit word is now consumed as ONE
    value. 'thirty-four' is 34 and nothing else. 'thirty percent and four
    people' is still 30 and 4, because those two words are not adjacent.
    """
    out = {m.replace(",", "").rstrip("0").rstrip(".") if "." in m.replace(",", "")
           else m.replace(",", "") for m in _NUM.findall(text)}
    toks = re.findall(r"[a-z]+", text.lower().replace("-", " "))
    i = 0
    while i < len(toks):
        word = toks[i]
        if word in _TENS and i + 1 < len(toks) and toks[i + 1] in _WORDNUM:
            unit = int(_WORDNUM[toks[i + 1]])
            if 1 <= unit <= 9:
                out.add(str(_TENS[word] + unit))
                i += 2          # the ten and the unit are one number, not two
                continue
        if word in _WORDNUM:
            out.add(_WORDNUM[word])
        i += 1
    return out


def split_paragraphs(text: str) -> list[str]:
    """Group paragraphs into chunks of roughly TARGET_WORDS, never splitting one."""
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[list[str]] = []
    current: list[str] = []
    count = 0
    for p in paras:
        n = len(p.split())
        if current and count + n > TARGET_WORDS:
            chunks.append(current)
            current, count = [], 0
        current.append(p)
        count += n
    if current:
        chunks.append(current)
    return ["\n\n".join(c) for c in chunks] or [text]


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
    chunks = split_paragraphs(text)

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
        last_err = None
        usage = usages[i]
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
                if attempt < RETRIES - 1:
                    time.sleep(BACKOFF * (attempt + 1) + random.uniform(0, 1.0))
                continue
            try:
                _guard(chunks[i], out, i)           # length: still a hard failure
            except TruncatedRewrite as e:
                last_err = e
                if attempt < RETRIES - 1:
                    time.sleep(0.4)
                    continue
                raise
            try:
                _guard_facts(chunks[i], out, i)     # facts: advisory, keep the best
                return i, out, info, [], usage
            except FactsLost as e:
                if best_out is None or len(e.missing) < len(best_missing):
                    # The info of the attempt actually being kept. This used to
                    # return an empty dict here, which threw away the model name
                    # and every figure belonging to the run that was returned.
                    best_out, best_info, best_missing = out, info, e.missing
                if attempt < RETRIES - 1:
                    time.sleep(0.4)
                    continue
        if best_out is not None:
            return i, best_out, best_info, best_missing, usage
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
            _, out, info, missing, _usage = one(0)
            info = dict(info or {})
            # words_in and words_out used to be set on the multi-chunk path only,
            # so they were absent on anything under roughly 350 words, which is
            # very nearly every paste. API.md section 12 documented that absence
            # as a fact. They are now on both paths. 06 row 48.
            info.update(chunks=1, parallel=False,
                        words_in=len(text.split()), words_out=len(out.split()),
                        usage=totals(),
                        figures_to_check=[m for m in missing if m not in _numbers(out)])
            return out, info

        with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(chunks))) as pool:
            at_risk: list[str] = []
            for i, out, info, missing, _usage in pool.map(one, range(len(chunks))):
                results[i], infos[i] = out, (info or {})
                at_risk.extend(missing)

        joined = "\n\n".join(r for r in results if r is not None)
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
                      figures_to_check=still_missing)
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
