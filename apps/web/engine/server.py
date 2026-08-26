#!/usr/bin/env python3
"""HTTP service exposing the watermarks-remover cleaning pipeline.

Stdlib-only. The agent skill and any web app can call it over HTTP instead of
running the CLI scripts locally.

Endpoints:
    GET  /health         -> {"ok": true, "version": ...}
    GET  /capabilities   -> which optional tools / pixel backends are present
    GET  /openapi.json   -> dynamically generated OpenAPI 3.0.3 spec
    POST /inspect        -> {"file": <base64>, "name": "x.png"} -> findings JSON
    POST /detect         -> {"file": <base64>, "name": "x.txt"} -> watermark detector reports
    POST /clean          -> {"file": <base64>, "name": "x.png", "options": {...}}
                         -> {"cleaned": <base64>, "report": {...}}
    POST /inspect/batch  -> {"files": [{"file": <base64>, "name": "x.png"}, ...]}
                         -> {"results": [{"name", "ok", "kind", "report", "suspicious"}, ...]}
    POST /detect/batch   -> {"files": [{"file": <base64>, "name": "x.txt"}, ...]}
                         -> {"results": [{"name", "ok", "kind", "detections", "report"}, ...]}
    POST /clean/batch    -> {"files": [{"file": <base64>, "name": "x.png", "options": {...}}, ...]}
                         -> {"results": [{"name", "ok", "kind", "cleaned", "report"}, ...]}

Batch endpoints loop the same single-file pipeline as /inspect, /detect, and /clean; a
per-file failure (unknown format, oversized name, bad option) shows up as
that entry's "ok": false with an "error" string and never aborts the rest of
the batch. Capped at WATERMARKS_MAX_BATCH_FILES entries per request (default
50) — the existing MAX_BODY_BYTES envelope cap still bounds total payload
size the same as a single-file request.

Hardening mirrors the CLIs: input size caps, binary-as-text guard, atomic
writes, loopback-only bind by default, optional bearer API key. Run it as an
unprivileged user (the Docker image does). Intended for a trusted network;
expose through a reverse proxy if reachable from untrusted clients.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import os
import sys
import tempfile
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

from av_meta import clean_av, inspect_av
from common import (
    MAX_INPUT_BYTES,
    eprint,
    looks_binary,
    which,
)
from container_meta import clean_container, inspect_container
from format_dispatch import classify_bytes
from uc_policy import POLICY_ON, accepted as _product_accepts
from uc_policy import billing_estimate as _billing_estimate
from uc_policy import over_word_limit as _over_word_limit
from uc_policy import safe_name as _product_safe_name
from image_meta import clean_image, inspect_image, run_synthid_score
from score_stylometry import score_text_stylometry
from text_detectors import detector_status, run_all_text_detectors, run_text_detectors
from rewrite_text import rewrite as layer_b_rewrite
from text_unicode import clean_text, inspect_text

VERSION = os.environ.get("WATERMARKS_SERVER_VERSION", "dev")

# Optional bearer token: when set, every request must send
# `Authorization: Bearer <key>`. Empty means no auth (default).
API_KEY = os.environ.get("WATERMARKS_SERVER_API_KEY", "").strip()

# Body cap for the JSON envelope. Base64 inflates by 4/3, so the decoded file
# stays well under MAX_INPUT_BYTES for the same cap.
MAX_BODY_BYTES = MAX_INPUT_BYTES + (MAX_INPUT_BYTES >> 1)

# Per-request file count cap for /inspect/batch and /clean/batch. MAX_BODY_BYTES
# already bounds total payload size; this bounds worst-case CPU/thread time from
# a request packing many tiny files into one call.
MAX_BATCH_FILES = int(os.environ.get("WATERMARKS_MAX_BATCH_FILES", "50"))

ALLOWED_CLEAN_OPTIONS = {
    "nfkc": bool,
    "aggressive_homoglyphs": bool,
    "keep_non_ai_metadata": bool,
    "also_layer_a_text": bool,
    "remove_pixel": str,
    "strip_all_metadata": bool,
    "detect_before": bool,
    "detect_after": bool,
    "layer_b": bool,
}


def _json_ok(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def capabilities() -> dict[str, Any]:
    return {
        "version": VERSION,
        "tools": {
            "c2patool": which("c2patool") is not None,
            "exiftool": which("exiftool") is not None,
            "qpdf": which("qpdf") is not None,
        },
        "pixel_backends": {
            "ctrlregen": bool(os.environ.get("NOAI_WATERMARK_DIR")),
            "diffusion": bool(os.environ.get("MARKDIFFUSION_DIR")),
        },
        "scorers": {
            "synthid": bool(os.environ.get("REVERSE_SYNTHID_DIR")),
            "synthid_http": bool(os.environ.get("WATERMARKS_SYNTHID_SCORER_URL")),
            "stylometry": True,
        },
        "text_detectors": detector_status(),
        "harnesses": {
            "markllm": bool(os.environ.get("MARKLLM_DIR")),
        },
    }


# OpenAPI generation. The spec is built from this single declarative table
# plus live runtime values (version, auth, allowed options), so it can never
# drift from the endpoints the handler actually serves. Served at /openapi.json.


def _schema(**props: Any) -> dict[str, Any]:
    return props


def _file_request(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    schema: dict[str, Any] = {
        "type": "object",
        "required": ["file"],
        "properties": {
            "file": {
                "type": "string",
                "description": "Base64-encoded file bytes",
                "example": "SGVsbG8gd29ybGQ=",
            },
            "name": {
                "type": "string",
                "description": "Original filename (extension drives format routing)",
                "example": "notes.md",
            },
        },
    }
    if extra:
        schema["properties"].update(extra["properties"])
        schema["required"] = schema["required"] + extra.get("required", [])
    return schema


def _clean_request_schema() -> dict[str, Any]:
    options: dict[str, Any] = {}
    for key, kind in ALLOWED_CLEAN_OPTIONS.items():
        if kind is bool:
            options[key] = _schema(type="boolean")
        else:
            options[key] = _schema(type="string")
    return _file_request(
        {
            "properties": {
                "options": _schema(type="object", properties=options, additionalProperties=False)
            },
        }
    )


_OPENAPI_PATHS: dict[str, dict[str, Any]] = {
    "/health": {
        "get": {
            "summary": "Liveness and version",
            "responses": {
                "200": _schema(
                    type="object",
                    properties={"ok": _schema(type="boolean"), "version": _schema(type="string")},
                )
            },
        }
    },
    "/capabilities": {
        "get": {
            "summary": "Which optional tools and heavy backends are available",
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "version": _schema(type="string"),
                        "tools": _schema(
                            type="object",
                            properties={
                                k: _schema(type="boolean") for k in ("c2patool", "exiftool", "qpdf")
                            },
                        ),
                        "pixel_backends": _schema(
                            type="object",
                            properties={
                                k: _schema(type="boolean") for k in ("ctrlregen", "diffusion")
                            },
                        ),
                        "scorers": _schema(
                            type="object",
                            properties={
                                "synthid": _schema(type="boolean"),
                                "synthid_http": _schema(type="boolean"),
                                "stylometry": _schema(type="boolean"),
                            },
                        ),
                        "harnesses": _schema(
                            type="object", properties={"markllm": _schema(type="boolean")}
                        ),
                        "text_detectors": _schema(
                            type="object",
                            additionalProperties=_schema(type="boolean"),
                        ),
                    },
                )
            },
        }
    },
    "/openapi.json": {
        "get": {
            "summary": "This OpenAPI 3.0.3 document, generated dynamically",
            "responses": {
                "200": _schema(type="object", description="An OpenAPI 3.0.3 document"),
            },
        }
    },
    "/inspect": {
        "post": {
            "summary": "Inspect a file for AI provenance marks (text / image / container auto-routed)",
            "requestBody": _schema(
                required=True,
                content={
                    "application/json": _schema(
                        schema=_file_request(
                            {
                                "properties": {
                                    "detect": _schema(
                                        type="boolean",
                                        description=(
                                            "Also run configured text watermark detectors "
                                            "(opt-in; may call vendor APIs and send text "
                                            "to them)"
                                        ),
                                    )
                                },
                                "required": [],
                            }
                        )
                    )
                },
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "kind": _schema(type="string", enum=["text", "image", "container", "av"]),
                        "suspicious": _schema(type="boolean"),
                        "report": _schema(type="object"),
                    },
                )
            },
        }
    },
    "/clean": {
        "post": {
            "summary": "Clean a file; returns the cleaned bytes and an actions/stats report",
            "requestBody": _schema(
                required=True,
                content={"application/json": _schema(schema=_clean_request_schema())},
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "kind": _schema(type="string", enum=["text", "image", "container", "av"]),
                        "cleaned": _schema(
                            type="string", description="Base64-encoded cleaned file bytes"
                        ),
                        "report": _schema(type="object"),
                    },
                )
            },
        }
    },
    "/detect": {
        "post": {
            "summary": "Run watermark detectors on a file (text: vendor/statistical; image: SynthID score)",
            "requestBody": _schema(
                required=True,
                content={"application/json": _schema(schema=_file_request())},
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "kind": _schema(type="string", enum=["text", "image", "container", "av"]),
                        "detections": _schema(type="array", items=_schema(type="object")),
                    },
                )
            },
        }
    },
    "/inspect/batch": {
        "post": {
            "summary": f"Inspect up to {MAX_BATCH_FILES} files in one request",
            "requestBody": _schema(
                required=True,
                content={
                    "application/json": _schema(
                        schema=_schema(
                            type="object",
                            required=["files"],
                            properties={"files": _schema(type="array", items=_file_request())},
                        )
                    )
                },
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "results": _schema(
                            type="array",
                            items=_schema(
                                type="object",
                                properties={
                                    "name": _schema(type="string"),
                                    "ok": _schema(type="boolean"),
                                    "kind": _schema(
                                        type="string",
                                        enum=["text", "image", "container", "av", "unknown"],
                                    ),
                                    "suspicious": _schema(type="boolean"),
                                    "report": _schema(type="object"),
                                    "error": _schema(type="string"),
                                },
                            ),
                        ),
                    },
                )
            },
        }
    },
    "/detect/batch": {
        "post": {
            "summary": f"Run watermark detectors on up to {MAX_BATCH_FILES} files in one request",
            "requestBody": _schema(
                required=True,
                content={
                    "application/json": _schema(
                        schema=_schema(
                            type="object",
                            required=["files"],
                            properties={"files": _schema(type="array", items=_file_request())},
                        )
                    )
                },
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "results": _schema(
                            type="array",
                            items=_schema(
                                type="object",
                                properties={
                                    "name": _schema(type="string"),
                                    "ok": _schema(type="boolean"),
                                    "kind": _schema(
                                        type="string",
                                        enum=["text", "image", "container", "av"],
                                    ),
                                    "detections": _schema(
                                        type="array", items=_schema(type="object")
                                    ),
                                    "report": _schema(type="object"),
                                    "error": _schema(type="string"),
                                },
                            ),
                        ),
                    },
                )
            },
        }
    },
    "/clean/batch": {
        "post": {
            "summary": f"Clean up to {MAX_BATCH_FILES} files in one request",
            "requestBody": _schema(
                required=True,
                content={
                    "application/json": _schema(
                        schema=_schema(
                            type="object",
                            required=["files"],
                            properties={
                                "files": _schema(type="array", items=_clean_request_schema())
                            },
                        )
                    )
                },
            ),
            "responses": {
                "200": _schema(
                    type="object",
                    properties={
                        "ok": _schema(type="boolean"),
                        "results": _schema(
                            type="array",
                            items=_schema(
                                type="object",
                                properties={
                                    "name": _schema(type="string"),
                                    "ok": _schema(type="boolean"),
                                    "kind": _schema(
                                        type="string", enum=["text", "image", "container", "av"]
                                    ),
                                    "cleaned": _schema(type="string"),
                                    "report": _schema(type="object"),
                                    "error": _schema(type="string"),
                                },
                            ),
                        ),
                    },
                )
            },
        }
    },
}

_ERROR_SCHEMA = _schema(
    type="object",
    properties={"ok": _schema(type="boolean", enum=[False]), "error": _schema(type="string")},
)
_COMMON_ERRORS = {
    "400": {
        "description": "Bad request",
        "content": {"application/json": {"schema": _ERROR_SCHEMA}},
    },
    "401": {
        "description": "Missing/invalid bearer token",
        "content": {"application/json": {"schema": _ERROR_SCHEMA}},
    },
    "404": {"description": "Not found", "content": {"application/json": {"schema": _ERROR_SCHEMA}}},
    "413": {
        "description": "Request body too large",
        "content": {"application/json": {"schema": _ERROR_SCHEMA}},
    },
    "500": {
        "description": "Internal error",
        "content": {"application/json": {"schema": _ERROR_SCHEMA}},
    },
}


def openapi_spec() -> dict[str, Any]:
    paths: dict[str, Any] = {}
    for path, ops in _OPENAPI_PATHS.items():
        for method, op in ops.items():
            responses = dict(_COMMON_ERRORS)
            for status, body in op["responses"].items():
                responses[status] = {
                    "description": "Success",
                    "content": {"application/json": {"schema": body}},
                }
            paths.setdefault(path, {})[method] = {
                "summary": op["summary"],
                "responses": responses,
                **((op.get("requestBody") and {"requestBody": op["requestBody"]}) or {}),
            }

    spec: dict[str, Any] = {
        "openapi": "3.0.3",
        "info": {
            "title": "watermarks-remover service",
            "version": VERSION,
            "description": "Strip multi-vendor AI provenance marks (Unicode, C2PA/EXIF/XMP, containers). "
            "Files are passed base64-encoded in JSON; cleaned bytes come back base64-encoded.",
        },
        "paths": paths,
    }
    if API_KEY:
        spec["components"] = {
            "securitySchemes": {
                "bearerAuth": {"type": "http", "scheme": "bearer"},
            }
        }
        spec["security"] = [{"bearerAuth": []}]
    return spec


def _safe_name(name: str) -> str:
    """Reduce a client-supplied filename to a bare basename safe for temp use.

    CodeQL (uncontrolled data in path expression): a name like '../../x'
    would otherwise let the write below escape the request temp dir. Fold
    Windows separators too, and fall back to a neutral name for '.', '..' or
    empty results.
    """
    base = Path(name.replace("\\", "/")).name
    if base in ("", ".", ".."):
        return "input"
    return base


def _tmp_path(tmpdir: Path, *parts: str) -> Path:
    """Join *parts* under *tmpdir* and refuse anything that escapes it.

    Defense-in-depth for the CodeQL "uncontrolled data in path expression"
    findings: even if a caller slips a separator through, the write can never
    land outside the request temp dir.
    """
    path = tmpdir.joinpath(*parts)
    if path.parent != tmpdir:
        raise ValueError("unsafe filename")
    return path


def _decode_input(body: dict[str, Any]) -> tuple[bytes, str]:
    raw = body.get("file")
    if not isinstance(raw, str):
        raise ValueError("missing string field 'file' (base64-encoded bytes)")
    name = body.get("name")
    if name is not None and not isinstance(name, str):
        raise ValueError("'name' must be a string")
    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("'file' is not valid base64") from None
    return data, _safe_name(name or "")


def _parse_clean_options(options: Any) -> dict[str, Any]:
    if options is None:
        return {}
    if not isinstance(options, dict):
        raise ValueError("'options' must be an object")
    for key, value in options.items():
        if key not in ALLOWED_CLEAN_OPTIONS:
            raise ValueError(f"unknown option: {key}")
        expected_type = ALLOWED_CLEAN_OPTIONS[key]
        if not isinstance(value, expected_type):
            type_name = "boolean" if expected_type is bool else "string"
            raise ValueError(f"option {key!r} must be a {type_name}")
    return options


def _batch_items(
    body: dict[str, Any],
) -> list[tuple[str, bytes, dict[str, Any], str | None]]:
    """Decode a batch request's 'files' array into (name, data, options, error) tuples.

    A malformed individual entry (bad base64, unknown option) becomes an error
    string paired with that entry rather than raising, so one bad file never
    aborts the rest of the batch. Only 'files' itself being missing, empty, or
    over MAX_BATCH_FILES raises — that is a malformed request, not a per-file
    problem.
    """
    files = body.get("files")
    if not isinstance(files, list):
        raise ValueError("missing array field 'files'")
    if not files:
        raise ValueError("'files' must not be empty")
    if len(files) > MAX_BATCH_FILES:
        raise ValueError(f"'files' exceeds the {MAX_BATCH_FILES}-file batch limit")

    items: list[tuple[str, bytes, dict[str, Any], str | None]] = []
    for entry in files:
        if not isinstance(entry, dict):
            items.append(("", b"", {}, "each entry in 'files' must be an object"))
            continue
        try:
            data, name = _decode_input(entry)
        except ValueError as e:
            fallback_name = entry.get("name") if isinstance(entry.get("name"), str) else ""
            items.append((fallback_name, b"", {}, str(e)))
            continue
        try:
            options = _parse_clean_options(entry.get("options"))
        except ValueError as e:
            items.append((name, b"", {}, str(e)))
            continue
        items.append((name, data, options, None))
    return items


def _inspect_payload(data: bytes, name: str, run_detect: bool) -> dict[str, Any]:
    kind = classify_bytes(data, Path(name).suffix)
    if kind == "unknown":
        return {
            "ok": True,
            "kind": "unknown",
            "report": {"note": "unrecognized format; use a filename with a known extension"},
            "suspicious": False,
        }
    with tempfile.TemporaryDirectory(prefix="wm-inspect-") as tmp:
        path = _tmp_path(Path(tmp), name or "input")
        path.write_bytes(data)
        if kind == "text":
            if looks_binary(data):
                raise ValueError(
                    "refusing to inspect bytes that look like a binary container as text"
                )
            raw_text = data.decode("utf-8", errors="surrogateescape")
            report = inspect_text(raw_text).to_dict()
            s_rep = score_text_stylometry(raw_text, path=name or "<text>")
            report["stylometry"] = s_rep.to_dict()
            if run_detect:
                report["text_detectors"] = run_all_text_detectors(raw_text)
        elif kind == "image":
            report = inspect_image(path).to_dict()
        elif kind == "av":
            report = inspect_av(path).to_dict()
        else:
            report = inspect_container(path).to_dict()
    detected_wm = any(
        entry.get("available") and entry.get("is_watermarked")
        for entry in report.get("text_detectors") or []
    )
    suspicious = (
        bool(report.get("suspicious_total"))
        or bool(report.get("has_c2pa") or report.get("has_ai_metadata"))
        or bool(report.get("stylometry", {}).get("score", 0.0) >= 0.65)
        or detected_wm
    )
    return {"ok": True, "kind": kind, "report": report, "suspicious": suspicious}


def _detect_payload(data: bytes, name: str) -> dict[str, Any]:
    kind = classify_bytes(data, Path(name).suffix)
    with tempfile.TemporaryDirectory(prefix="wm-detect-") as tmp:
        path = _tmp_path(Path(tmp), name or "input")
        path.write_bytes(data)
        if kind == "text":
            if looks_binary(data):
                raise ValueError(
                    "refusing to detect bytes that look like a binary container as text"
                )
            raw_text = data.decode("utf-8", errors="surrogateescape")
            detections: list[dict[str, Any]] = run_all_text_detectors(raw_text)
            s_rep = score_text_stylometry(raw_text, path=name or "<text>")
            detections.append({"detector": "stylometry", "available": True, **s_rep.to_dict()})
            return {"ok": True, "kind": kind, "detections": detections}
        elif kind == "image":
            score = run_synthid_score(path)
            if score is None:
                score = {
                    "detector": "synthid",
                    "available": False,
                    "error": (
                        "no SynthID scorer configured (set "
                        "WATERMARKS_SYNTHID_SCORER_URL or REVERSE_SYNTHID_DIR)"
                    ),
                }
            else:
                score.setdefault("detector", "synthid")
            detections = [score]
            return {"ok": True, "kind": kind, "detections": detections}
        elif kind == "av":
            return {
                "ok": True,
                "kind": kind,
                "detections": [],
                "report": inspect_av(path).to_dict(),
            }
        else:
            detections = []
            report = inspect_container(path).to_dict()
            return {
                "ok": True,
                "kind": kind,
                "detections": detections,
                "report": report,
            }


# THE SHORTEST PASTE LAYER B WILL TOUCH, in words.
#
# 16 IS MEASURED. Every defective rewrite seen end to end had an input of 15
# words or fewer; 144 runs over the 16 to 32 word band, on both models, produced
# no defect and no guard rejection at all. An earlier draft of this used 25,
# which measured identically on the leak and refused the entire 16 to 24 band
# for nothing — the corpus that suggested it simply had no examples in that
# range. Refusing work that succeeds is the expensive mistake here.
LAYER_B_MIN_WORDS = int(os.environ.get("UC_LAYER_B_MIN_WORDS", "16"))


def _layer_b_failure(message: str, cause: BaseException) -> ValueError:
    """The user-facing error for a failed rewrite, carrying what the run cost.

    A failed layer B run is the most expensive request this engine can make:
    every chunk retries up to eight times and every attempt is billed. Without
    this the costliest requests would be the ones recording nothing at all.
    06 row 48.

    The message is our own text. Upstream error text never reaches a user.
    """
    error = ValueError(message)
    error.usage = getattr(cause, "usage", {}) or {}
    return error


def _clean_payload(data: bytes, name: str, options: dict[str, Any]) -> dict[str, Any]:
    kind = classify_bytes(data, Path(name).suffix)
    if kind == "unknown":
        raise ValueError(
            "unrecognized file format; use a filename with a known extension "
            "(e.g. notes.txt) or a supported image/container name"
        )

    with tempfile.TemporaryDirectory(prefix="wm-clean-") as tmp:
        tmpdir = Path(tmp)
        src = _tmp_path(tmpdir, name or "input")
        src.write_bytes(data)
        if kind == "text":
            if looks_binary(data):
                raise ValueError(
                    "refusing to clean bytes that look like a binary container as text"
                )
            text = data.decode("utf-8", errors="surrogateescape")
            layer_b_report: dict[str, Any] | None = None
            words_in = len(text.split())

            detect_before = bool(options.get("detect_before"))
            detect_after = bool(options.get("detect_after"))
            detector_reports: dict[str, Any] = {}
            if detect_before:
                # ON THE ORIGINAL. This used to run after the rewrite had
                # already replaced `text`, so "before" was measured on the
                # rewritten document.
                detector_reports["before"] = run_text_detectors(text)

            # LAYER A RUNS FIRST, ON WHAT THE CUSTOMER ACTUALLY SENT.
            #
            # It used to run AFTER the rewrite, which destroys zero-width
            # characters as collateral — so the one layer this product can
            # prove reported removing nothing from a document that arrived
            # carrying two. Reproduced live on 24 August 2026: two zero-width
            # characters in, "removed_count": 0 out. The rewrite now receives
            # the cleaned text, and `stats` describes the customer's own
            # document. A second, quiet pass after the rewrite (below) catches
            # anything the model itself emits; its counts are reported
            # separately and never mixed into the customer's evidence.
            cleaned, stats = clean_text(
                text,
                nfkc=bool(options.get("nfkc")),
                aggressive_homoglyphs=bool(options.get("aggressive_homoglyphs")),
            )

            if options.get("layer_b") and words_in < LAYER_B_MIN_WORDS:
                # TOO SHORT TO REWRITE, SO IT IS NOT SENT TO A MODEL AT ALL.
                #
                # Added 22 August 2026 by Jon's ruling, after the prompt-leak
                # session. A statistical watermark is not present, let alone
                # detectable, in a handful of words, so a rewrite here buys the
                # customer nothing and costs a model call. Worse, it is where
                # every leak lives: measured end to end, EVERY defective output
                # had an input of 15 words or fewer, and 144 runs across the 16
                # to 32 word band produced none at all.
                # See docs/session-notes/prompt-leak.md section 7.
                #
                # SKIPPED, NOT FAILED, and the difference matters. Failing would
                # refund the customer but hand back nothing — and layers A and
                # metadata work perfectly well on a short paste. They still run
                # below. The customer keeps the two PROVABLE layers and is told
                # plainly why the third did not run.
                layer_b_report = {
                    "skipped": "input_too_short",
                    "min_words": LAYER_B_MIN_WORDS,
                    "words_in": words_in,
                    "words_out": words_in,
                    "chunks": 0,
                    "figures_to_check": [],
                    "reason": (
                        f"The rewrite needs at least {LAYER_B_MIN_WORDS} words "
                        f"and this is {words_in}. Hidden characters and file "
                        "data were still removed."
                    ),
                }
            elif options.get("layer_b"):
                # Layer B rewrites with a NON-Anthropic, NON-Google model. Rewriting
                # Claude text with Claude re-applies the watermark at full strength.
                # Configured entirely by environment variable so the model is one
                # swappable setting. See docs/TRACK-A-NOTES.md and 04 entry 23.
                try:
                    from uc_chunk import TruncatedRewrite, rewrite_long

                    base_temp = float(
                        os.environ.get("WATERMARKS_REWRITE_TEMPERATURE", "1.0"))

                    def _one(chunk: str, attempt: int = 0, missing=None,
                             usage_out=None):
                        # Cool by 0.2 per retry, floor 0.2. A creative first pass,
                        # then progressively closer to the source until the facts
                        # survive.
                        #
                        # usage_out is uc_chunk's per-chunk accumulator. It goes
                        # DOWN into the call rather than coming back from it, so
                        # a call that raises still leaves its tokens and cost
                        # behind. 06 row 48.
                        temp = max(0.2, base_temp - 0.2 * attempt)
                        return layer_b_rewrite(
                        chunk,
                        backend=os.environ.get(
                            "WATERMARKS_REWRITE_BACKEND", "openai-compatible"),
                        model=os.environ.get("WATERMARKS_REWRITE_MODEL"),
                        base_url=os.environ.get("WATERMARKS_REWRITE_BASE_URL"),
                        api_key=os.environ.get("WATERMARKS_REWRITE_API_KEY"),
                        strength=("unclaude_retry:" + ", ".join(missing))
                        if missing else "unclaude",
                        lang="French",
                        original_lang="English",
                        timeout=float(os.environ.get("WATERMARKS_REWRITE_TIMEOUT", "45")),
                        layer_a_after=False,   # the Layer A pass below does this
                        temperature=temp,
                        candidates=1,
                        allow_remote=True,
                        # Unset (the default) omits the parameter, exactly as
                        # before. "none" asks a reasoning model to skip its
                        # chain of thought — without it such a model thinks
                        # for minutes on a rewrite, which is the likeliest
                        # reason two models "timed out" in the last bake-off.
                        # One env var, so trying a reasoning model is a
                        # Vercel setting and not a code change.
                        reasoning_effort=os.environ.get(
                            "WATERMARKS_REWRITE_REASONING_EFFORT") or None,
                        usage_out=usage_out,
                    )

                    # Chunked and parallel. A single call silently truncates any
                    # document past roughly 2,000 words: a 3,367 word test came
                    # back as 348 words reported as success. 04 entry 22 forbids
                    # truncation outright, so a short result raises instead.
                    #
                    # THE REWRITE RECEIVES THE CLEANED TEXT. Layer A already
                    # ran above, on the original, and `stats` is its evidence.
                    out, layer_b_report = rewrite_long(cleaned, _one)

                    # The model can emit invisible characters of its own. A
                    # second, quiet pass takes them out — reported under
                    # `after_rewrite`, never mixed into the customer's own
                    # layer A evidence above.
                    out, post_stats = clean_text(
                        out,
                        nfkc=bool(options.get("nfkc")),
                        aggressive_homoglyphs=bool(
                            options.get("aggressive_homoglyphs")),
                    )
                    if post_stats.get("removed_count") or post_stats.get(
                            "replaced_count"):
                        stats["after_rewrite"] = post_stats

                    # REPAIR: take back out of the rewrite what the model put
                    # in — markdown the input never had, curly punctuation the
                    # customer never typed, em dashes past the input's own
                    # count, and years spelled out against rule 5a. Every rule
                    # conditions on the customer's own text, is deterministic,
                    # and costs no model call. See uc_repair.py.
                    from uc_repair import repair_rewrite

                    out, repair_stats = repair_rewrite(cleaned, out)
                    layer_b_report["repair"] = repair_stats
                    # A restored year can retire a flagged figure: the guard
                    # listed it as missing from the rewrite, and the repair
                    # just put it back.
                    if repair_stats.get("years_restored") and layer_b_report.get(
                            "figures_to_check"):
                        from uc_chunk import _numbers

                        layer_b_report["figures_to_check"] = [
                            m for m in layer_b_report["figures_to_check"]
                            if m not in _numbers(out)
                        ]
                    # REPORT ONLY: which of the document's protected spans —
                    # quotations, headings, references, addresses, code,
                    # tables, equations — came back from the rewrite
                    # unchanged. The freeze is OFF, nothing raises, nothing
                    # about the output changes; this is the first measurement
                    # of how often a real customer's quotation is rewritten.
                    # See uc_spans.py. `structure_kept` rides along so the
                    # one flag the engine computes and nothing reads is now
                    # in the block a reader of this report will actually
                    # open.
                    from uc_spans import check_protected_spans

                    protection = check_protected_spans(cleaned, out)
                    protection["structure_kept"] = bool(
                        layer_b_report.get("structure_kept", True))
                    layer_b_report["protection"] = protection
                    cleaned = out
                except TruncatedRewrite as e:
                    raise _layer_b_failure(
                        f"layer B rewrite failed: truncated: {e}", e) from e
                except Exception as e:  # never leak upstream text to a user
                    raise _layer_b_failure(
                        f"layer B rewrite failed: {type(e).__name__}", e) from e
            if detect_after:
                detector_reports["after"] = run_text_detectors(cleaned)
            cleaned_bytes = cleaned.encode("utf-8", errors="surrogateescape")
            report: dict[str, Any] = {"kind": "text", "stats": stats, "length": len(cleaned)}
            if layer_b_report is not None:
                report["layer_b"] = {
                    **layer_b_report,
                    "verified": False,
                    "note": (
                        "Layer B is best effort. No public detector exists for any "
                        "vendor's text watermark, so nobody can verify removal, "
                        "including us."
                    ),
                }
            if detector_reports:
                report["text_detectors"] = detector_reports
        elif kind == "image":
            ext = Path(name).suffix
            if not ext:
                from image_meta import detect_format

                fmt_name = detect_format(data)
                ext = f".{fmt_name}" if fmt_name != "unknown" else ".png"
            dest = _tmp_path(tmpdir, f"out{ext}")
            strip_all = not bool(options.get("keep_non_ai_metadata"))
            if "strip_all_metadata" in options:
                strip_all = bool(options["strip_all_metadata"])
            remove_pixel = options.get("remove_pixel")
            if remove_pixel not in (None, "ctrlregen", "diffusion"):
                raise ValueError("remove_pixel must be one of: ctrlregen, diffusion")
            result = clean_image(
                src,
                dest,
                strip_all_metadata=strip_all,
                remove_pixel=remove_pixel,
            )
            if bool(options.get("detect_before")) and result.get("synthid_before") is None:
                result["synthid_before"] = run_synthid_score(src)
            if bool(options.get("detect_after")) and result.get("synthid_after") is None:
                result["synthid_after"] = run_synthid_score(dest)
            cleaned_bytes = dest.read_bytes()
            report = {"kind": "image", **result}
        elif kind == "av":
            dest = _tmp_path(tmpdir, f"out{Path(name).suffix or '.bin'}")
            strip_all = not bool(options.get("keep_non_ai_metadata"))
            if "strip_all_metadata" in options:
                strip_all = bool(options["strip_all_metadata"])
            result = clean_av(src, dest, strip_all_metadata=strip_all)
            cleaned_bytes = dest.read_bytes()
            report = {"kind": "av", **result}
        else:
            ext = Path(name).suffix
            container_fmt = None
            if not ext:
                from container_meta import detect_container_format

                container_fmt = detect_container_format(Path("input"), data)
                ext_map = {
                    "svg": ".svg",
                    "pdf": ".pdf",
                    "docx": ".docx",
                    "xlsx": ".xlsx",
                    "pptx": ".pptx",
                    "odt": ".odt",
                    "epub": ".epub",
                    "html": ".html",
                    "markdown": ".md",
                }
                ext = ext_map.get(container_fmt, "")
            dest = _tmp_path(tmpdir, f"out{ext}")
            result = clean_container(
                src,
                dest,
                fmt=container_fmt,
                also_layer_a_text=bool(options.get("also_layer_a_text", True)),
            )
            cleaned_bytes = dest.read_bytes()
            report = {"kind": "container", **result}
        report.pop("input", None)
        report.pop("output", None)

    # THE NAME IS A WATERMARK TOO, and it is the one a person reads first.
    #
    # `ChatGPT Image Aug 25, 2026, 03_14_22 PM.png` came back from this engine
    # with its C2PA record gone and its name intact, which makes the invisible
    # work irrelevant to anybody who hands the file to a marker. Jon's ruling,
    # 25 August 2026: take the tool's name off the front and keep the rest.
    #
    # IT IS DECIDED HERE AND NOWHERE ELSE. The browser only renders the name it
    # is given, so there is one implementation of it rather than two that drift
    # — the trap this project has walked into three times. See uc_filename.py
    # for the list and the reasoning, and note that this renames NOTHING on
    # disk: it is the name the answer suggests, and the bytes are untouched.
    from uc_filename import strip_tool_name

    rename = strip_tool_name(name)
    if rename["changed"]:
        report["filename"] = rename

    return {
        "ok": True,
        "kind": kind,
        "cleaned": base64.b64encode(cleaned_bytes).decode("ascii"),
        "report": report,
        "download_name": rename["name"],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = f"watermarks-remover/{VERSION}"

    def log_message(self, fmt: str, *args: object) -> None:
        eprint(f"{self.address_string()} - {fmt % args}")

    def _authorized(self) -> bool:
        if not API_KEY:
            return True
        header = self.headers.get("Authorization", "")
        return header == f"Bearer {API_KEY}"

    def _read_json(self) -> dict[str, Any] | None:
        raw = self.headers.get("Content-Length")
        if raw is None or not raw.isdigit():
            return None
        length = int(raw)
        if length > MAX_BODY_BYTES:
            return None
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError, OSError):
            return None
        if not isinstance(body, dict):
            return None
        return body

    def _respond(self, status: int, payload: dict[str, Any]) -> None:
        data = _json_ok(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if not self._authorized():
            self._respond(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "unauthorized"})
            return
        if path == "/health":
            self._respond(HTTPStatus.OK, {"ok": True, "version": VERSION})
        elif path == "/capabilities":
            self._respond(HTTPStatus.OK, {"ok": True, **capabilities()})
        elif path == "/openapi.json":
            self._respond(HTTPStatus.OK, openapi_spec())
        else:
            self._respond(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if not self._authorized():
            self._respond(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "unauthorized"})
            return
        if path not in (
            "/inspect",
            "/clean",
            "/detect",
            "/inspect/batch",
            "/detect/batch",
            "/clean/batch",
        ):
            self._respond(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})
            return
        body = self._read_json()
        if body is None:
            raw_len = self.headers.get("Content-Length")
            oversized = raw_len is not None and raw_len.isdigit() and int(raw_len) > MAX_BODY_BYTES
            self._respond(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE if oversized else HTTPStatus.BAD_REQUEST,
                {"ok": False, "error": "invalid request body"},
            )
            return
        try:
            if path == "/inspect/batch":
                self._handle_inspect_batch(body)
            elif path == "/detect/batch":
                self._handle_detect_batch(body)
            elif path == "/clean/batch":
                self._handle_clean_batch(body)
            else:
                data, name = _decode_input(body)
                if path == "/inspect":
                    self._handle_inspect(data, name, body)
                elif path == "/detect":
                    self._handle_detect(data, name)
                else:
                    self._handle_clean(data, name, body)
        except ValueError as e:
            self._respond(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(e)})
        except Exception as e:
            eprint(f"error handling {path}: {e!r}")
            self._respond(
                HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": "internal error"}
            )

    def _product_gate(self, name: str, data: bytes, layer_b: bool = False) -> str | None:
        """The live site's own front-door rules, applied here too.

        LOCAL DEVELOPMENT TALKS TO THIS SERVER AND PRODUCTION DOES NOT. .env.local
        points UC_ENGINE_URL at this process, while the deployed site calls the
        Vercel functions in apps/web/api. Those functions enforce the four
        accepted types and the word ceiling; this server did not, so anything
        tested locally behaved differently from the live site — a test that
        reassures without checking.

        Off unless UC_PRODUCT_POLICY is set, because this is also the vendored
        engine's own server and its test suite drives it with formats this
        product does not sell (a .md, for one). The local development engine sets
        the flag; the test suite does not.

        Returns (code, message), or None to proceed.

        THE CODE MATTERS AS MUCH AS THE MESSAGE. The site maps the engine's code
        to its own sentence and falls back to "Something went wrong" for anything
        it does not recognise, so a refusal without a code reaches the user as a
        generic failure. Measured: an over-length document was refused correctly
        and refunded correctly, and the person was told "Something went wrong.
        Nothing was charged" instead of being told to split their document.
        """
        if not POLICY_ON:
            return None
        if not data:
            return ("no_file", "no file or text was sent")
        if not _product_accepts(name, data):
            return ("bad_format", "that file type is not supported; "
                                  "use text, a Word document, PNG or JPG")
        if _over_word_limit(name, data, layer_b):
            return ("too_many_words",
                    "that is longer than 10,000 words, which is the most the "
                    "rewrite can do in one go")
        return None

    def _handle_inspect(self, data: bytes, name: str, body: dict[str, Any]) -> None:
        refusal = self._product_gate(name, data)
        if refusal:
            return self._respond(HTTPStatus.BAD_REQUEST,
                                 {"ok": False, "code": refusal[0], "error": refusal[1]})
        run_detect = body.get("detect") is True
        payload = _inspect_payload(data, name, run_detect)
        # The price rides on the free scan, exactly as it does on the Vercel
        # function. Without this the standalone server answered with no
        # `billing` block and the interface priced every uploaded file at zero
        # words, so a 3,000 word .txt showed "1 credit" locally and 4 in
        # production. api/scan.py does the same thing for the same reason.
        payload["billing"] = _billing_estimate(payload.get("kind"), data)
        return self._respond(HTTPStatus.OK, payload)

    def _handle_inspect_batch(self, body: dict[str, Any]) -> None:
        items = _batch_items(body)
        run_detect = body.get("detect") is True
        results = []
        for name, data, _options, error in items:
            if error is not None:
                results.append({"name": name, "ok": False, "error": error})
                continue
            try:
                payload = _inspect_payload(data, name, run_detect)
            except ValueError as e:
                results.append({"name": name, "ok": False, "error": str(e)})
                continue
            results.append({"name": name, **payload})
        self._respond(HTTPStatus.OK, {"ok": True, "results": results})

    def _handle_detect(self, data: bytes, name: str) -> None:
        self._respond(HTTPStatus.OK, _detect_payload(data, name))

    def _handle_detect_batch(self, body: dict[str, Any]) -> None:
        items = _batch_items(body)
        results = []
        for name, data, _options, error in items:
            if error is not None:
                results.append({"name": name, "ok": False, "error": error})
                continue
            try:
                payload = _detect_payload(data, name)
            except ValueError as e:
                results.append({"name": name, "ok": False, "error": str(e)})
                continue
            results.append({"name": name, **payload})
        self._respond(HTTPStatus.OK, {"ok": True, "results": results})

    def _handle_clean(self, data: bytes, name: str, body: dict[str, Any]) -> None:
        options = _parse_clean_options(body.get("options"))
        refusal = self._product_gate(name, data, bool(options.get("layer_b")))
        if refusal:
            return self._respond(HTTPStatus.BAD_REQUEST,
                                 {"ok": False, "code": refusal[0], "error": refusal[1]})
        self._respond(HTTPStatus.OK, _clean_payload(data, name, options))

    def _handle_clean_batch(self, body: dict[str, Any]) -> None:
        items = _batch_items(body)
        results = []
        for name, data, options, error in items:
            if error is not None:
                results.append({"name": name, "ok": False, "error": error})
                continue
            try:
                payload = _clean_payload(data, name, options)
            except ValueError as e:
                results.append({"name": name, "ok": False, "error": str(e)})
                continue
            results.append({"name": name, **payload})
        self._respond(HTTPStatus.OK, {"ok": True, "results": results})


def main() -> int:
    global API_KEY  # noqa: PLW0603 — CLI overrides env
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--host", default=os.environ.get("WATERMARKS_SERVER_HOST", "127.0.0.1"))
    p.add_argument(
        "--port", type=int, default=int(os.environ.get("WATERMARKS_SERVER_PORT", "8765"))
    )
    p.add_argument("--api-key", default=API_KEY, help="require this bearer token (default: none)")
    p.add_argument("-V", "--version", action="store_true", help="print version and exit")
    args = p.parse_args()

    if args.version:
        print(VERSION)
        return 0

    API_KEY = args.api_key

    if args.host not in ("127.0.0.1", "localhost", "::1"):
        eprint(f"warning: binding {args.host} — intended for a trusted network only")
    if API_KEY:
        eprint("API key required for requests")
    else:
        eprint("warning: no API key set — only bind to loopback or a trusted network")

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    eprint(f"watermarks-remover service {VERSION} on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        eprint("shutting down")
        server.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
