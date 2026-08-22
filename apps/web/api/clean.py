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

from _shared import (  # noqa: E402
    authorised,
    engine,
    fail,
    json_response,
    over_word_limit,
    read_request,
    strip_server_paths,
    usage_record,
)

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

        # THE WORD CEILING, REFUSED BEFORE A SINGLE MODEL CALL IS MADE.
        #
        # Only the rewrite has a word ceiling, and only text reaches the
        # rewrite: a .docx, a .png and a .jpg get metadata and layer A, which
        # are instant and free however large the file is, so capping them by
        # words would refuse work that costs nothing to do.
        #
        # This must stay AHEAD of the engine call. A document past the limit
        # would otherwise run for a minute or more, be cut off by the site's
        # own 120 second abort, be refunded, and still be billed to us by the
        # model provider for every chunk it managed to finish. Refusing in
        # milliseconds costs nobody anything.
        if over_word_limit(name, data, bool(opts.get("layer_b"))):
            usage_record("clean", name, data, None, time.time() - started,
                         ok=False, code="too_many_words", headers=self.headers)
            return json_response(self, *fail("too_many_words"))

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
        # Our own filesystem out of the reply before the browser ever sees it.
        strip_server_paths(payload)
        payload["usage"] = usage_record(
            "clean", name, data, payload, time.time() - started, headers=self.headers)
        json_response(self, 200, payload)
