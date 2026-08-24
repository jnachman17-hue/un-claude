"""What un-claude accepts, and how much of it — in ONE place.

WHY THIS FILE EXISTS. There are two ways into this engine and until 21 August
2026 they disagreed about everything:

  * PRODUCTION goes browser -> /api/tool/clean (Next) -> /api/clean, which is
    the Vercel Python function in apps/web/api. That path reads _shared.py.
  * LOCAL DEVELOPMENT goes browser -> /api/tool/clean -> the standalone
    server.py on port 8765, because .env.local sets UC_ENGINE_URL to it.

They are different implementations. So an allowlist added to _shared.py alone
was enforced in production and NOT locally, which means every local test of file
handling would have proved nothing about the live site. That is the worst kind of
gap: testing that reassures without checking.

The policy now lives here and both read it.

WHY IT IS OPT-IN FOR THE STANDALONE SERVER. server.py is also the vendored
upstream engine's own server, and the upstream test suite drives it over real
HTTP with formats this product does not sell — `test_clean_markdown_container`
posts a `.md` and expects it to work. Enforcing product policy there
unconditionally would fail tests that are correct about the engine and merely
irrelevant to the product. So the standalone server applies this only when
UC_PRODUCT_POLICY is set, which the local development engine sets and the test
suite does not. The Vercel functions always apply it.
"""
from __future__ import annotations

import os
from pathlib import Path

#: True when the standalone server should behave like the live site.
POLICY_ON = os.environ.get("UC_PRODUCT_POLICY", "").strip().lower() in ("1", "true", "yes", "on")

# THE FOUR THINGS: pasted text, a Word document, a PNG, a JPG.
# `.txt` is here because pasted text arrives as `paste.txt` — the browser has no
# separate text path, so refusing `.txt` would refuse every paste.
ACCEPTED_EXTS = (".txt", ".docx", ".png", ".jpg", ".jpeg")

# The most words one rewrite will accept. Mirrored in the interface as MAX_WORDS
# in the workbench's credits.ts, which refuses before the button; this is what
# actually enforces it.
MAX_WORDS = int(os.environ.get("UC_MAX_WORDS", "10000"))

_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
_JPEG_MAGIC = b"\xff\xd8\xff"
_ZIP_MAGIC = (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")


def contents_match(ext: str, data: bytes) -> bool:
    """Does the file's own content agree with the name it arrived under?

    A .png renamed to .docx is the case this catches. Without it the engine
    classifies by extension first, hands PNG bytes to the Word document reader,
    and the user gets whatever that does — which nobody had ever looked at.
    """
    if ext == ".png":
        return data.startswith(_PNG_MAGIC)
    if ext in (".jpg", ".jpeg"):
        return data.startswith(_JPEG_MAGIC)
    if ext == ".docx":
        # A .docx is a zip, and specifically a zip with a Word document in it.
        # The second half matters: .xlsx, .pptx, .odt and .epub are all zips too,
        # and all of them are containers the engine would happily open.
        return data.startswith(_ZIP_MAGIC) and b"word/document.xml" in data
    if ext == ".txt":
        # Text is the one case with no magic number, so the test is negative:
        # it must not be one of the binaries we DO recognise, and it must not
        # carry NUL bytes, which no real UTF-8 text does.
        if data.startswith(_PNG_MAGIC) or data.startswith(_JPEG_MAGIC):
            return False
        if data.startswith(_ZIP_MAGIC) or data[:5] == b"%PDF-":
            return False
        return b"\x00" not in data[:8192]
    return False


def accepted(name: str, data: bytes) -> bool:
    """True if this is one of the four things un-claude accepts, and really is it."""
    ext = Path(name).suffix.lower()
    return ext in ACCEPTED_EXTS and contents_match(ext, data)


def safe_name(name: str) -> str:
    """The bare filename, with any directory part thrown away.

    A browser never sends a path, so a name carrying one is either an oddity or
    somebody trying their luck. Measured before this existed: a file named
    `../../etc/passwd.txt` was ACCEPTED by the front door, reached the engine,
    and died inside `server._tmp_path` with `ValueError: unsafe filename`, which
    was reported to the user as "That file type is not supported" — the wrong
    sentence for the wrong problem. Nothing was ever written outside the temp
    directory; `_tmp_path` refused first, which is what it is for.

    Taking the basename is friendlier than refusing: `../../etc/passwd.txt`
    becomes `passwd.txt` and cleans normally, which is what the person almost
    certainly wanted.
    """
    bare = str(name).replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not bare or bare in (".", ".."):
        return "paste.txt"
    return bare[:255]


def word_count(raw: bytes | None) -> int:
    """Words, counted exactly the way uc_chunk's length guard counts them."""
    if raw is None:
        return 0
    try:
        return len(raw.decode("utf-8", errors="surrogateescape").split())
    except Exception:
        return 0


def over_word_limit(name: str, data: bytes, layer_b: bool) -> bool:
    """Is this a rewrite that is longer than the rewrite will take?

    Only the rewrite has a word ceiling, and only text reaches the rewrite: a
    .docx, a .png and a .jpg get metadata and layer A, which are instant and free
    however large the file is, so capping them by words would refuse work that
    costs nothing to do.
    """
    if not layer_b or Path(name).suffix.lower() != ".txt":
        return False
    return word_count(data) > MAX_WORDS


# One credit buys this many words. 04 entry 67.
CREDIT_WORDS = 1000


def billing_estimate(kind: str | None, raw: bytes | None) -> dict:
    """What this job costs in credits, worked out BEFORE it runs.

    04 entry 16 and entry 67: the price has to be knowable before somebody
    commits to paying it, never discovered afterwards. That is only possible if
    the free scan — which costs $0.0000021 and is never charged — comes back
    carrying the number. The browser holds only base64 for an uploaded file, so
    this is the ONLY place the word count exists before the paid run.

    Two cases and one rule between them, which is the whole of the pricing:

      * Anything with words in it is charged by its words, one credit per
        thousand, ROUNDED UP, minimum one.
      * Anything without words is a flat one credit whatever its size, because
        stripping metadata from a 4 MB photograph and a 40 KB one is the same
        forty milliseconds of work.

    `limit` and `over_limit` ride along so the interface can refuse an
    over-length document before the button rather than after a long wait.
    """
    if kind == "text":
        words = word_count(raw)
        # Ceiling division without importing math, and 0 words still costs 1:
        # an empty job is refused earlier, so reaching here means real input.
        credits = max(1, -(-words // CREDIT_WORDS))
        estimate = {"credits": credits, "words": words, "basis": "words",
                    "limit": MAX_WORDS, "over_limit": words > MAX_WORDS}
        # THE D4 PRE-FLIGHT: what fraction of this document the freeze will
        # return exactly as sent, computed BEFORE anyone pays, by the same
        # plan the rewrite itself runs — one implementation, so the number
        # shown is the number delivered. Free: no model call, regex only.
        # Fail-soft: a pre-flight that cannot be computed must never block a
        # price estimate. The interface half (the Continue/Cancel prompt,
        # louder above 60%) is Lane C's — D4's wording is fixed on the board.
        try:
            from uc_freeze import freeze_enabled, freeze_fraction

            if freeze_enabled():
                estimate["freeze"] = freeze_fraction(
                    raw.decode("utf-8", errors="surrogateescape"))
        except Exception:  # noqa: S110 — the estimate must survive
            pass
        return estimate
    return {"credits": 1, "words": None, "basis": "flat",
            "limit": None, "over_limit": False}
