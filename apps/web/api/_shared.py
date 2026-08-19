"""Shared plumbing for the un-claude engine's HTTP functions.

The engine is a vendored copy of guillaumemeyer/watermarks-remover and lives in
apps/web/engine. See that folder's PROVENANCE.md for the licence and version.
"""
from __future__ import annotations

import base64, json, sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parent.parent / "engine"
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))

MAX_BYTES = 5 * 1024 * 1024   # 5 MB ceiling on any single upload

# A closed set of messages. An open error string puts raw upstream text in front
# of a user, which is the defect still open as 06 row 13. See 04 entry 15.
ERRORS = {
    "bad_json":       "That request could not be read. Please try again.",
    "no_file":        "No file or text was sent.",
    "bad_base64":     "The file could not be decoded.",
    "too_large":      "That file is larger than 5 MB. Try a smaller one.",
    "bad_format":     "That file type is not supported. Use text, a Word document, PNG or JPG.",
    "layer_b_failed": "The rewrite could not be completed. Nothing was charged. Try again.",
    "engine_error":   "Something went wrong with that file. Nothing was charged.",
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
    opts = body.get("options")
    return data, str(body.get("name") or "paste.txt"), (opts if isinstance(opts, dict) else {})


def usage_record(name: str, data: bytes, layer_b: dict | None, seconds: float) -> dict:
    """What this operation consumed.

    Recorded from the first line of code so the pricing session can price from
    real numbers rather than guesses. 04 entry 22, 06 row 18.
    """
    return {
        "bytes_in": len(data),
        "extension": Path(name).suffix.lower() or ".txt",
        "seconds": round(seconds, 3),
        "layer_b_used": bool(layer_b),
        "layer_b_model": (layer_b or {}).get("model"),
    }


def json_response(h, status: int, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(body)))
    h.end_headers()
    h.wfile.write(body)
