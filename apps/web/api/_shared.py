"""Shared plumbing for the un-claude engine's HTTP functions.

The engine is a vendored copy of guillaumemeyer/watermarks-remover and lives in
apps/web/engine. See that folder's PROVENANCE.md for the licence and version.
"""
from __future__ import annotations

import base64, hmac, json, os, sys
from datetime import datetime, timezone
from pathlib import Path

ENGINE = Path(__file__).resolve().parent.parent / "engine"
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

MAX_BYTES = 5 * 1024 * 1024   # 5 MB ceiling on any single upload

# The word ceiling, and the reasoning behind the number, live in uc_policy.py.

# The engine is a back room, not a public counter. Only our own site may call it.
# /api/clean with layer_b spends real money on every request, so an unauthenticated
# endpoint is an open tap on Jon's AI Gateway balance.
# .strip() matters more than it looks. `openssl rand -hex 32` prints a trailing
# newline, and a value pasted with one would be stored with it. HTTP headers
# cannot carry a newline, so the sending side would drop it and the two would
# never match, with nothing in either log to say why.
ENGINE_KEY = os.environ.get("UC_ENGINE_KEY", "").strip()
IS_PRODUCTION = os.environ.get("VERCEL_ENV") == "production"


def authorised(headers) -> bool:
    """True if this request carries our shared key.

    Fails CLOSED in production. A missing UC_ENGINE_KEY on Vercel breaks the
    endpoint loudly rather than silently leaving it open, which is 07-runbook's
    own lesson: a correct config file is not a loaded one. Locally the key is
    optional so development needs no setup.
    """
    if not ENGINE_KEY:
        # Fails closed in production, and says so, because "no key configured"
        # and "wrong key supplied" otherwise look identical from outside.
        if IS_PRODUCTION:
            print("UC_ENGINE_KEY is not set on this function", file=sys.stderr)
        return not IS_PRODUCTION

    supplied = str(headers.get("x-uc-key") or "").strip()
    if hmac.compare_digest(supplied, ENGINE_KEY):
        return True

    # Lengths only. Never the values. Enough to tell "nothing was sent" from
    # "something was sent and did not match".
    print(
        f"engine key mismatch: configured={len(ENGINE_KEY)} supplied={len(supplied)}",
        file=sys.stderr,
    )
    return False

# A closed set of messages. An open error string puts raw upstream text in front
# of a user, which is the defect still open as 06 row 13. See 04 entry 15.
ERRORS = {
    "bad_json":       "That request could not be read. Please try again.",
    "no_file":        "No file or text was sent.",
    "bad_base64":     "The file could not be decoded.",
    "too_large":      "That file is larger than 5 MB. Try a smaller one.",
    "bad_format":     "That file type is not supported. Use text, a Word document, PNG or JPG.",
    "too_many_words": "That is longer than 10,000 words, which is the most the rewrite can do in one go. Split it and run it in parts.",
    "layer_b_failed": "The rewrite could not be completed. Nothing was charged. Try again.",
    "engine_error":   "Something went wrong with that file. Nothing was charged.",
    "unauthorised":   "That request was not authorised.",
}

_engine_module = None


def engine():
    """The vendored engine's own request handlers, imported once."""
    global _engine_module
    if _engine_module is None:
        import server  # noqa: PLC0415 — deliberately lazy, it is a heavy import
        _engine_module = server
    return _engine_module


def fail(code: str, status: int = 400) -> tuple[int, dict]:
    return status, {"ok": False, "code": code,
                    "error": ERRORS.get(code, ERRORS["engine_error"])}


# The product's policy — which four types, and how many words — lives in
# engine/uc_policy.py so that BOTH ways into this engine enforce the same thing.
# These functions used to be defined here, which meant the live site enforced
# them and the local development server did not, so every local test of file
# handling proved nothing about production. See uc_policy.py's docstring.
from uc_policy import (  # noqa: E402
    ACCEPTED_EXTS,
    MAX_WORDS,
    accepted,
    over_word_limit,
    safe_name,
)

def read_request(raw: bytes):
    """Decode a request body into (bytes, filename, options), or an error tuple."""
    try:
        body = json.loads(raw or b"{}")
    except Exception:
        return fail("bad_json")
    if not isinstance(body, dict) or not body.get("file"):
        return fail("no_file")
    try:
        data = base64.b64decode(body["file"], validate=True)
    except Exception:
        return fail("bad_base64")
    if len(data) > MAX_BYTES:
        return fail("too_large", 413)
    name = safe_name(body.get("name") or "paste.txt")
    # An empty file is refused as "nothing was sent" rather than as a bad format,
    # because that is what it is, and because every downstream guard divides by a
    # length at some point.
    if not data:
        return fail("no_file")
    if not accepted(name, data):
        print(f"refused: name={Path(name).suffix.lower()!r} bytes={len(data)}", file=sys.stderr)
        return fail("bad_format")
    opts = body.get("options")
    return data, name, (opts if isinstance(opts, dict) else {})


# Every usage line starts with this word so one grep finds all of them and
# nothing else. Deliberately not a word that appears anywhere else in the logs.
USAGE_TAG = "UC_USAGE"

# The layer B figures worth keeping, in the order a person would want to read
# them. Anything the engine reports that is not in this list is dropped rather
# than logged blindly, so the line stays one line.
_LAYER_B_FIGURES = (
    "chunks", "attempts", "retries", "model_calls", "calls_without_usage",
    "prompt_tokens", "completion_tokens", "total_tokens", "cost_usd",
)

# What the browser is allowed to see. Token counts and cost are OUR unit
# economics on a public site, so they go to the log and not into the response.
# Nothing in the site reads this block; it is kept for support and debugging.
_PUBLIC_FIELDS = (
    "endpoint", "kind", "extension", "bytes_in", "words_in", "words_out",
    "seconds", "ok", "layer_b_used", "layer_b_model",
)


def _word_count(raw: bytes | None) -> int | None:
    """Words in a piece of UTF-8, counted the same way the engine counts them.

    len(text.split()) is exactly what uc_chunk uses for its length guard, so the
    two numbers can be compared without having to wonder whether they mean the
    same thing.
    """
    if raw is None:
        return None
    try:
        return len(raw.decode("utf-8", errors="surrogateescape").split())
    except Exception:
        return None


# One credit buys this many words. 04 entry 67.
CREDIT_WORDS = 1000


def billing_estimate(kind: str | None, raw: bytes | None) -> dict:
    """What this job costs in credits, worked out BEFORE it runs.

    04 entry 16 and entry 67: the price has to be knowable before somebody
    commits to paying it, never discovered afterwards. That is only possible if
    the free scan — which costs $0.0000021 and is never charged — comes back
    carrying the number.

    Two cases and one rule between them, which is the whole of the pricing:

      * Anything with words in it is charged by its words, one credit per
        thousand, ROUNDED UP, minimum one.
      * Anything without words is a flat one credit whatever its size, because
        stripping metadata from a 4 MB photograph and a 40 KB one is the same
        forty milliseconds of work.

    CONTAINERS ARE FLAT, AND THAT IS A WORKING POSITION RATHER THAN A RULING.
    06 row 74: layer B runs only when kind == "text", so a .docx gets metadata
    and layer A and never reaches the model. Charging it by its words would be
    charging for a rewrite it does not receive. Flat is the option that cannot
    overcharge, so it is the one to be wrong in. Jon rules on 06 row 74.
    """
    if kind == "text":
        words = _word_count(raw) or 0
        # Ceiling division without importing math, and 0 words still costs 1:
        # an empty job is refused earlier, so reaching here means real input.
        credits = max(1, -(-words // CREDIT_WORDS))
        # The limit rides on the free scan so the interface can say "too long"
        # BEFORE anyone commits to paying, which is the same rule as the price
        # itself: 04 entry 16, nothing discovered afterwards.
        return {"credits": credits, "words": words, "basis": "words",
                "limit": MAX_WORDS, "over_limit": words > MAX_WORDS}
    return {"credits": 1, "words": None, "basis": "flat",
            "limit": None, "over_limit": False}


def usage_record(
    endpoint: str,
    name: str,
    data: bytes,
    payload: dict | None,
    seconds: float,
    *,
    ok: bool = True,
    code: str | None = None,
    layer_b_usage: dict | None = None,
    headers=None,
) -> dict:
    """What this operation consumed, written down where it can be read later.

    04 entry 22 promised words, tokens and retries so the pricing session could
    price from real numbers rather than guesses. This function recorded none of
    the three, and every run before this fix is evidence that cannot be got
    back. 06 row 48.

    It returns the public subset for the HTTP response AND writes the full line
    to the log, so a caller cannot compute the numbers and forget to keep them.

    THIS IS A LOG LINE, NOT A DATABASE. Vercel's runtime logs are kept for a
    short window, so this stops the loss rather than ending it. The durable
    ledger needs a migration, and every migration belongs to Track 1.
    """
    payload = payload or {}
    report = payload.get("report") or {}
    layer_b = report.get("layer_b") or {}
    kind = payload.get("kind")

    # Words only mean something for text. A PNG has bytes, not words, and a
    # made-up word count on one would be worse than no word count at all.
    is_text = kind == "text" or (kind is None and Path(name).suffix.lower() in ("", ".txt", ".md"))
    cleaned_bytes = None
    if is_text and payload.get("cleaned"):
        try:
            cleaned_bytes = base64.b64decode(payload["cleaned"], validate=True)
        except Exception:
            cleaned_bytes = None

    record: dict = {
        "at": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "endpoint": endpoint,
        "ok": ok,
        "kind": kind,
        "extension": Path(name).suffix.lower() or ".txt",
        "bytes_in": len(data),
        "words_in": _word_count(data) if is_text else None,
        "words_out": _word_count(cleaned_bytes),
        "seconds": round(seconds, 3),
        "layer_b_used": bool(layer_b) or bool(layer_b_usage),
        "layer_b_model": layer_b.get("model"),
    }
    if code:
        record["code"] = code

    # On a successful run the figures ride inside the engine's own report. On a
    # failed one they are attached to the error, because a failure retries up to
    # eight times per chunk and is the most expensive thing this engine does.
    figures = layer_b.get("usage") or layer_b_usage or {}
    if figures:
        record["layer_b"] = {k: figures[k] for k in _LAYER_B_FIGURES if k in figures}

    # Vercel stamps every request with an id. Carrying it makes this line
    # joinable to the platform's own log of the same request.
    if headers is not None:
        request_id = headers.get("x-vercel-id")
        if request_id:
            record["request_id"] = str(request_id)[:120]

    _emit(record)
    return {k: record[k] for k in _PUBLIC_FIELDS if k in record}


def _emit(record: dict) -> None:
    """One line of JSON to stdout. Never raises.

    A logging failure must not turn a successful clean into a failed request for
    the user waiting on it.
    """
    try:
        print(USAGE_TAG + " " + json.dumps(record, ensure_ascii=False, default=str),
              flush=True)
    except Exception:      # noqa: S110 — see the docstring
        pass


# Keys the engine puts in a report that describe OUR SERVER rather than the
# user's file. They are of no use to a browser and they name the temp directory
# layout of the machine the function runs on.
#
# Found 21 August 2026: every image and container scan came back carrying
#   "path": "/var/folders/5r/rqsn.../T/wm-inspect-vjlp3as1/clean.docx"
# because `_inspect_payload` returns its report whole. `_clean_payload` already
# pops its own `input`/`output` keys; the inspect side popped nothing.
def strip_server_paths(payload: dict) -> dict:
    """Take our own filesystem back out of anything the browser is about to see."""
    report = payload.get("report")
    if isinstance(report, dict):
        report.pop("path", None)
        stylometry = report.get("stylometry")
        if isinstance(stylometry, dict):
            stylometry.pop("path", None)
    return payload


def json_response(h, status: int, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(body)))
    h.end_headers()
    h.wfile.write(body)
