"""POST /api/scan  -> what is hidden in this file. Read only, free, no model call.

Deliberately NOT named inspect.py: that would shadow Python's built-in `inspect`
module, which the engine's dependencies import.
"""
from __future__ import annotations

import json, time
from http.server import BaseHTTPRequestHandler

from _shared import engine, fail, json_response, read_request, usage_record


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 — the name Vercel requires
        started = time.time()
        parsed = read_request(self.rfile.read(int(self.headers.get("Content-Length") or 0)))
        if isinstance(parsed[0], int):
            return json_response(self, *parsed)
        data, name, _opts = parsed
        srv = engine()
        try:
            payload = srv._inspect_payload(data, name, False)
        except ValueError:
            return json_response(self, *fail("bad_format"))
        except Exception:
            return json_response(self, *fail("engine_error", 500))
        payload["usage"] = usage_record(name, data, None, time.time() - started)
        json_response(self, 200, payload)
