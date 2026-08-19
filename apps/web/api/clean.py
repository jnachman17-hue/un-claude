"""POST /api/clean  -> remove what is hidden, return the cleaned file.

Without options, this is Layer A plus metadata: instant, no model call, free.
With {"options": {"layer_b": true}} it also rewrites the text first, which costs
money and takes seconds.

This docstring used to say "Layer B is signed-in only. 04 entry 22." Entry 22
says no such thing: it rules that all three layers ship free with tight limits
and no way to pay. Nothing anywhere enforced signing in, and layer B is reachable
today without an account. The claim is removed rather than left as a rule that
exists only as a comment. 06 row 57.
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

from _shared import authorised, engine, fail, json_response, read_request, usage_record  # noqa: E402

ALLOWED = {"layer_b", "nfkc", "aggressive_homoglyphs", "keep_non_ai_metadata"}


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 — the name Vercel requires
        if not authorised(self.headers):
            return json_response(self, *fail("unauthorised", 401))
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
            # A failed layer B run still spent money, and spent MORE of it than a
            # successful one: every chunk retries up to eight times and every
            # attempt is billed. The engine attaches what it spent to the error
            # so the costliest requests are not the ones recording nothing.
            # 06 row 48.
            usage_record("clean", name, data, None, time.time() - started,
                         ok=False, code=code,
                         layer_b_usage=getattr(e, "usage", None),
                         headers=self.headers)
            return json_response(self, *fail(code))
        except Exception as e:
            usage_record("clean", name, data, None, time.time() - started,
                         ok=False, code="engine_error",
                         layer_b_usage=getattr(e, "usage", None),
                         headers=self.headers)
            return json_response(self, *fail("engine_error", 500))
        payload["usage"] = usage_record(
            "clean", name, data, payload, time.time() - started, headers=self.headers)
        json_response(self, 200, payload)
