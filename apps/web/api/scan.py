"""POST /api/scan  -> what is hidden in this file. Read only, free, no model call.

Deliberately NOT named inspect.py: that would shadow Python's built-in `inspect`
module, which the engine's dependencies import.
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

from _shared import (  # noqa: E402
    authorised,
    billing_estimate,
    engine,
    fail,
    json_response,
    read_request,
    strip_server_paths,
    usage_record,
)


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 — the name Vercel requires
        if not authorised(self.headers):
            return json_response(self, *fail("unauthorised", 401))
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
        # Our own filesystem out of the reply before the browser ever sees it.
        strip_server_paths(payload)
        # What the job will cost, worked out here because this is the only place
        # that has both the decoded bytes and the format. 06 row 72: credits are
        # priced in words, the browser holds only base64 for a file, and nothing
        # in the scan reply carried a word count. Without this the interface
        # cannot tell anyone the price before they commit to paying it.
        payload["billing"] = billing_estimate(payload.get("kind"), data)
        payload["usage"] = usage_record(
            "scan", name, data, payload, time.time() - started, headers=self.headers)
        json_response(self, 200, payload)
