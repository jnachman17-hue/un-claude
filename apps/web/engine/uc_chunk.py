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

TARGET_WORDS = 700       # per chunk; well inside any model's output limit
MIN_RATIO = 0.70         # Jon's ruling: we are a watermark remover, not a
                         # summariser. Anything under 70% of the input length is
                         # a failed rewrite, not a short one.
# Chunks at once. Higher is faster but trips provider rate limits on a free
# credit balance. Tunable without a code change so it can be raised the moment
# paid credits are in place.
MAX_WORKERS = int(os.environ.get("UC_LAYER_B_WORKERS", "3"))
RETRIES = int(os.environ.get("UC_LAYER_B_RETRIES", "4"))  # per chunk
BACKOFF = 2.5            # seconds, multiplied each attempt, plus jitter


class TruncatedRewrite(RuntimeError):
    """The model returned materially less text than it was given."""


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
                return i, out, info
            except TruncatedRewrite:
                raise                      # a short rewrite is not retryable
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


def _guard(src: str, out: str, index: int) -> None:
    src_n, out_n = len(src.split()), len((out or "").split())
    if src_n and out_n / src_n < MIN_RATIO:
        where = "the document" if index < 0 else f"chunk {index + 1}"
        raise TruncatedRewrite(
            f"{where} came back at {out_n} words from {src_n} "
            f"({out_n / src_n:.0%} of the original); the rewrite was cut short and has "
            "been rejected rather than returned"
        )
