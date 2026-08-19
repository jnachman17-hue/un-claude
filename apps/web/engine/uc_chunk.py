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
TARGET_WORDS = int(os.environ.get("UC_LAYER_B_CHUNK_WORDS", "700"))
MIN_RATIO = 0.70         # Jon's ruling: we are a watermark remover, not a
                         # summariser. Anything under 70% of the input length is
                         # a failed rewrite, not a short one.
# Chunks at once. Higher is faster but trips provider rate limits on a free
# credit balance. Tunable without a code change so it can be raised the moment
# paid credits are in place.
MAX_WORKERS = int(os.environ.get("UC_LAYER_B_WORKERS", "3"))
RETRIES = int(os.environ.get("UC_LAYER_B_RETRIES", "8"))  # per chunk
BACKOFF = 2.5            # seconds, multiplied each attempt, plus jitter


class TruncatedRewrite(RuntimeError):
    """The model returned materially less text than it was given."""


class FactsLost(RuntimeError):
    """The model dropped numbers that were in the input."""


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

    COMPOUNDS MATTER AND WERE MISSED ONCE. 'thirty-four' must resolve to 34, not
    to 30 and 4. Without that, the guard rejected six chunks in eight and every
    single number it flagged was a false positive.
    """
    out = {m.replace(",", "").rstrip("0").rstrip(".") if "." in m.replace(",", "")
           else m.replace(",", "") for m in _NUM.findall(text)}
    toks = re.findall(r"[a-z]+", text.lower().replace("-", " "))
    for i, w in enumerate(toks):
        if w in _WORDNUM:
            out.add(_WORDNUM[w])
        if w in _TENS:
            out.add(str(_TENS[w]))
            if i + 1 < len(toks) and toks[i + 1] in _WORDNUM:
                unit = int(_WORDNUM[toks[i + 1]])
                if 1 <= unit <= 9:
                    out.add(str(_TENS[w] + unit))
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


def rewrite_long(text: str, rewrite_fn) -> tuple[str, dict]:
    """Rewrite `text` in chunks, in parallel, and verify nothing went missing.

    `rewrite_fn(chunk) -> (rewritten, info)` does one chunk.
    Raises TruncatedRewrite if any chunk, or the whole, comes back too short.
    """
    chunks = split_paragraphs(text)
    if len(chunks) == 1:
        out, info = rewrite_fn(chunks[0])
        _guard(chunks[0], out, 0)
        _guard_facts(chunks[0], out, 0)
        info = dict(info or {})
        info.update(chunks=1, parallel=False)
        return out, info

    results: list[str | None] = [None] * len(chunks)
    infos: list[dict] = [{}] * len(chunks)

    def one(i: int):
        last = None
        for attempt in range(RETRIES):
            try:
                out, info = rewrite_fn(chunks[i])
                _guard(chunks[i], out, i)
                _guard_facts(chunks[i], out, i)
                return i, out, info
            except (TruncatedRewrite, FactsLost) as e:
                # Corrected 19 Aug 2026. This used to raise immediately, on the
                # reasoning that a short rewrite is a real answer rather than a
                # failure. That was wrong: the model samples randomly, so the
                # same chunk often comes back full length on a second attempt.
                # Observed live, a 5,047 word document failed once and succeeded
                # on an identical retry. Retrying costs a fraction of a cent and
                # saves the user a rejection they cannot act on.
                last = e
                if attempt == RETRIES - 1:
                    raise
                time.sleep(0.5)
                continue
            except Exception as e:         # rate limits and transient failures are
                last = e
                if attempt < RETRIES - 1:
                    time.sleep(BACKOFF * (attempt + 1) + random.uniform(0, 1.0))
        raise RuntimeError(f"chunk {i + 1} failed after {RETRIES} attempts: "
                           f"{type(last).__name__}") from last

    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(chunks))) as pool:
        for i, out, info in pool.map(one, range(len(chunks))):
            results[i], infos[i] = out, (info or {})

    joined = "\n\n".join(r for r in results if r is not None)
    _guard(text, joined, -1)
    merged = dict(infos[0])
    merged.update(chunks=len(chunks), parallel=True,
                  words_in=len(text.split()), words_out=len(joined.split()))
    return joined, merged


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
        raise FactsLost(f"{where} dropped {len(missing)} numbers: "
                        f"{sorted(missing)[:6]}")


def _guard(src: str, out: str, index: int) -> None:
    src_n, out_n = len(src.split()), len((out or "").split())
    if src_n and out_n / src_n < MIN_RATIO:
        where = "the document" if index < 0 else f"chunk {index + 1}"
        raise TruncatedRewrite(
            f"{where} came back at {out_n} words from {src_n} "
            f"({out_n / src_n:.0%} of the original); the rewrite was cut short and has "
            "been rejected rather than returned"
        )
