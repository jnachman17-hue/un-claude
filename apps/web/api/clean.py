"""POST /api/clean  -> remove what is hidden, return the cleaned file.

Without options, this is Layer A plus metadata: instant, no model call, free.
With {"options": {"layer_b": true}} it also rewrites the text first, which costs
money and takes seconds. Layer B is signed-in only. 04 entry 22.
"""
from __future__ import annotations

# Vercel bundles each function separately and does NOT put the function's own
# folder on Python's import path, so a plain `from _shared import ...` fails at
# runtime with ModuleNotFoundError even though the file sits right beside this
# one. Both paths must be added explicitly, before any local import.
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
for _p in (str(_HERE), str(_HERE.parent / "engine")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import time                                        # noqa: E402
from http.server import BaseHTTPRequestHandler     # noqa: E402

from _shared import engine, fail, json_response, read_request, usage_record  # noqa: E402

ALLOWED = {"layer_b", "nfkc", "aggressive_homoglyphs", "keep_non_ai_metadata"}


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 — the name Vercel requires
        started = time.time()
        parsed = read_request(self.rfile.read(int(self.headers.get("Content-Length") or 0)))
        if isinstance(parsed[0], int):
            return json_response(self, *parsed)
        data, name, opts = parsed
        opts = {k: v for k, v in opts.items() if k in ALLOWED}
        srv = engine()
        try:
            payload = srv._clean_payload(data, name, opts)
        except ValueError as e:
            code = "layer_b_failed" if "layer B" in str(e) else "bad_format"
            return json_response(self, *fail(code))
        except Exception:
            return json_response(self, *fail("engine_error", 500))
        lb = (payload.get("report") or {}).get("layer_b")
        payload["usage"] = usage_record(name, data, lb, time.time() - started)
        json_response(self, 200, payload)
