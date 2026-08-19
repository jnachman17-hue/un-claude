"""POST /api/clean  -> remove what is hidden, return the cleaned file.

Without options, this is Layer A plus metadata: instant, no model call, free.
With {"options": {"layer_b": true}} it also rewrites the text first, which costs
money and takes seconds. Layer B is signed-in only. 04 entry 22.
"""
from __future__ import annotations

import json, time
from http.server import BaseHTTPRequestHandler

from _shared import engine, fail, json_response, read_request, usage_record

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
