#!/usr/bin/env python3
"""Layer B optional rewrite hook for statistical (token-sampling) watermarks.

Backends:
  print-prompt       — emit prompt only (default; CI-safe, no model)
  ollama             — POST to Ollama /api/chat
  openai-compatible  — POST to OpenAI-style /v1/chat/completions

Env (optional):
  WATERMARKS_REWRITE_BACKEND
  WATERMARKS_REWRITE_BASE_URL
  WATERMARKS_REWRITE_MODEL
  WATERMARKS_REWRITE_API_KEY      (env-only; never pass keys on argv)
  WATERMARKS_REWRITE_ALLOW_REMOTE (set to 1 to allow non-loopback endpoints)

Security notes:
  - Only http(s) endpoints are accepted; redirects are refused outright so an
    Authorization header (API key) can never be re-sent to an unvalidated host.
  - Non-loopback endpoints are denied unless WATERMARKS_REWRITE_ALLOW_REMOTE=1
    (or --allow-remote) is set explicitly.
"""

from __future__ import annotations

import argparse
import itertools
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import cleaned_path, eprint, read_text_input, write_text_output
from text_detectors import MarkLLMTextDetector, run_all_text_detectors
from text_unicode import clean_text

DEFAULT_MARKLLM_MODEL = "facebook/opt-1.3b"

PROMPTS = {
    "unclaude_retry": (
        "Rewrite the text so that almost none of the original phrasing survives.\n\n"
        "YOUR PREVIOUS ATTEMPT DROPPED THESE AND THAT IS THE ONE UNFORGIVABLE "
        "MISTAKE: {MISSING}\n"
        "Every one of them must appear in your new version, exactly as written in "
        "the original. Check your version against this list before you finish.\n\n"
        "RULES\n"
        "1. Every fact must survive character-for-character: numbers, amounts, "
        "percentages, dates, and the names of people, companies and places. THIS "
        "OUTRANKS EVERY OTHER RULE. If you cannot rewrite around a fact without "
        "losing it, keep more of the original wording.\n"
        "2. Your version must be about as long as the original. Do not condense or "
        "summarise. Losing length is how facts get lost.\n"
        "3. Subject to rules 1 and 2, avoid reusing runs of more than three "
        "consecutive words from the original.\n"
        "4. Keep every claim. Add nothing, remove nothing.\n"
        "5. Copy numbers and dates in exactly the form the original used, in both "
        "directions. Words stay words, digits stay digits.\n"
        "6. Output only the rewritten text, with no preamble or commentary."
        "\n\n---\n{TEXT}"
    ),
    "unclaude": (
        "Rewrite the text so that almost none of the original phrasing survives.\n\n"
        "RULES\n"
        "1. Every fact must survive character-for-character: numbers, amounts, "
        "percentages, dates, and the names of people, companies and places. Copy them "
        "exactly. Never change, drop, round, or approximate one. "
        "THIS RULE OUTRANKS EVERY OTHER RULE. If you cannot rewrite the words around "
        "a fact without losing the fact, then keep more of the original wording and "
        "move on. Dropping a number to avoid repeating words is always the wrong "
        "trade. Before you finish, re-read your version and check that every number "
        "and every name from the original is present.\n"
        "2. Subject to rule 1, do not reuse any run of more than three "
        "consecutive words from the original. This includes the words immediately "
        "around each fact. Rewrite the framing of every fact, not just the sentences "
        "between them.\n"
        "3. Keep every claim exactly as asserted. Add nothing and remove nothing.\n"
        "3a. YOUR VERSION MUST BE ABOUT AS LONG AS THE ORIGINAL, within roughly one "
        "tenth. Do not condense, summarise, tighten, or trim. If the original is "
        "wordy, your version stays wordy. If it labours a point across three "
        "sentences, yours labours it across three sentences too. Shortening is not "
        "an improvement here and it is the most common way facts get lost.\n"
        "4. Vary sentence length on purpose. Mix short sentences with long ones. Do not "
        "let every sentence come out a similar length.\n"
        "5. Copy every number and date in EXACTLY the form the original used, in both "
        "directions. Words stay words: 'eighteen percent' stays 'eighteen percent', "
        "never '18%'. Digits stay digits: '2028' stays '2028', never 'two thousand "
        "twenty-eight'; '$4.2 million' stays '$4.2 million'. Dates keep their exact "
        "original format: '3 December' stays '3 December', never 'third December'.\n"
        "6. Use ordinary phrasing. Prefer a plain common word over an unusual synonym. "
        "Never reach for an odd construction just to avoid the original wording: write "
        "'five-year deal', never 'semi-decade pact'.\n"
        "7. Output only the rewritten text, with no preamble or commentary."
        "\n\n---\n{TEXT}"
    ),
    "paraphrase": (
        "Rewrite the following text so that it uses substantially different wording at "
        "the token level. Change clause order, connectors, and transition words; vary "
        "sentence boundaries and length; and replace both content words and function "
        "words where meaning allows. Preserve all facts, numbers, names, and technical "
        "identifiers. Do not add or remove claims. Output only the rewritten text.\n\n---\n{TEXT}"
    ),
    "humanize": (
        "Rewrite the following text so it reads as if a human wrote it from scratch. "
        "Vary sentence rhythm and length, replace formulaic AI-style transitions and "
        "filler with concrete natural phrasing, and use plain, varied wording. Preserve "
        "all facts, numbers, names, and technical identifiers. Do not add or remove "
        "claims. Output only the rewritten text.\n\n---\n{TEXT}"
    ),
    "code": (
        "Rewrite the natural-language parts of this code — comments, docstrings, and "
        "string literals — using different wording. Rename local variables, function "
        "parameters, and private helper names to semantically equivalent names. Preserve "
        "program behavior, public API names, and all values that affect output. Output "
        "only the rewritten code.\n\n---\n{TEXT}"
    ),
    "backtranslate_out": (
        "Translate the following text to {LANG}. Output only the translation.\n\n---\n{TEXT}"
    ),
    "backtranslate_back": (
        "Translate the following text to {ORIGINAL_LANG}. Preserve meaning; use natural "
        "phrasing. Output only the translation.\n\n---\n{TEXT}"
    ),
    "structural_outline": (
        "Extract a bullet outline of all claims and structure from the text "
        "(no full sentences). Output only the outline.\n\n---\n{TEXT}"
    ),
    "structural_write": (
        "Write a complete document from this outline in natural, varied human prose. "
        "Avoid formulaic transitions. Do not omit any bullet. Output only the document."
        "\n\n---\n{TEXT}"
    ),
}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9]+", text.lower())


def _bigrams(tokens: list[str]) -> set[tuple[str, str]]:
    return set(itertools.pairwise(tokens))


def _lexical_divergence(original: str, candidate: str) -> float:
    """Bigram Jaccard distance: 0.0 identical, 1.0 fully different."""
    a = _tokens(original)
    b = _tokens(candidate)
    if not a and not b:
        return 0.0
    if not a or not b:
        return 1.0
    ba = _bigrams(a)
    bb = _bigrams(b)
    union = ba | bb
    if not union:
        return 0.0
    return 1.0 - len(ba & bb) / len(union)


def _select_candidate(original: str, candidates: list[str]) -> tuple[str, list[float]]:
    """Pick the most lexically diverged rewrite, gently guarding extreme length drift."""
    scores: list[float] = []
    for cand in candidates:
        score = _lexical_divergence(original, cand)
        if original:
            ratio = len(cand) / len(original)
            if ratio > 2.0 or ratio < 0.5:
                score -= 0.15
        scores.append(score)
    best_idx = max(range(len(candidates)), key=lambda i: scores[i])
    return candidates[best_idx], scores


def _env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def _flag_env(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


_LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


def _check_remote(base_url: str, allow_remote: bool) -> None:
    """Enforce the rewrite-endpoint allowlist.

    Default-deny: only loopback endpoints are accepted. Anything else requires
    an explicit opt-in (--allow-remote / WATERMARKS_REWRITE_ALLOW_REMOTE=1),
    and non-http(s) schemes (e.g. file://) are always refused.
    """
    u = urlparse(base_url)
    if u.scheme not in ("http", "https"):
        raise SystemExit(
            f"error: rewrite base URL must be http(s), got scheme '{u.scheme}': {base_url}"
        )
    host = u.hostname or ""
    if host in _LOOPBACK_HOSTS:
        return
    if not allow_remote:
        raise SystemExit(
            "error: rewrite base URL host is not loopback "
            f"('{host}'); refusing to send content off-machine. "
            "Set WATERMARKS_REWRITE_ALLOW_REMOTE=1 or pass --allow-remote to override."
        )
    eprint(
        f"warning: rewrite base URL host is '{host}' (not localhost); "
        "content will leave this machine"
    )


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Refuse HTTP redirects.

    urllib's default handler re-sends the request headers on 301/302/303,
    which would forward the Authorization header (API key) to an unvalidated
    host behind the localhost allowlist. Any 3xx now surfaces as HTTPError.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, msg, headers, fp)


def _per_candidate_detections(
    candidates: list[str],
    markllm_detector: MarkLLMTextDetector | None,
) -> list[list[dict]]:
    """Run every configured text detector on each rewrite candidate.

    Fail-soft: a detector that is unconfigured, times out, or errors yields
    an ``available: False`` entry and never fails the rewrite. The MarkLLM
    harness is only included when ``markllm_detector`` is given (i.e. the
    caller passed --markllm-scheme); other detectors (e.g.
    gemini-synthid-text) are key-gated by their own environment.
    """
    detections: list[list[dict]] = []
    for cand in candidates:
        try:
            detections.append(
                run_all_text_detectors(
                    cand,
                    markllm=markllm_detector,
                    include_markllm=markllm_detector is not None,
                )
            )
        except Exception as e:  # defensive: the registry contract is fail-soft
            detections.append([{"available": False, "error": f"candidate detection failed: {e}"}])
    return detections


def build_prompt(strength: str, text: str, *, lang: str, original_lang: str) -> str:
    if strength == "unclaude":
        return PROMPTS["unclaude"].format(TEXT=text)
    if strength.startswith("unclaude_retry:"):
        missing = strength.split(":", 1)[1] or "(unknown)"
        return PROMPTS["unclaude_retry"].format(TEXT=text, MISSING=missing)
    if strength == "paraphrase":
        return PROMPTS["paraphrase"].format(TEXT=text)
    if strength == "humanize":
        return PROMPTS["humanize"].format(TEXT=text)
    if strength == "code":
        return PROMPTS["code"].format(TEXT=text)
    if strength == "backtranslate":
        # single combined instruction for print-prompt / one-shot backends
        return (
            f"Translate the text to {lang}, then translate that result back to "
            f"{original_lang}. Preserve all facts, numbers, and names. "
            f"Output only the final {original_lang} text.\n\n---\n{text}"
        )
    if strength == "structural":
        return (
            "First extract a bullet outline of all claims (no full sentences). "
            "Then write a complete document from that outline in natural, varied human "
            "prose without omitting any bullet. Output only the final document.\n\n---\n"
            f"{text}"
        )
    raise ValueError(f"unknown strength: {strength}")


def _http_json(url: str, payload: dict, headers: dict[str, str], timeout: float) -> dict:
    if urlparse(url).scheme not in ("http", "https"):
        raise ValueError(f"refusing non-http(s) rewrite endpoint: {url}")
    body = json.dumps(payload).encode("utf-8")
    # S310: URL scheme is restricted to http/https just above.
    req = urllib.request.Request(  # noqa: S310
        url,
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    opener = urllib.request.build_opener(_NoRedirect())
    with opener.open(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def call_ollama(base_url: str, model: str, prompt: str, timeout: float, temperature: float) -> str:
    url = base_url.rstrip("/") + "/api/chat"
    data = _http_json(
        url,
        {
            "model": model,
            "stream": False,
            "messages": [{"role": "user", "content": prompt}],
            "options": {"temperature": temperature},
        },
        {},
        timeout,
    )
    msg = data.get("message") or {}
    content = msg.get("content")
    if not content:
        raise RuntimeError(f"ollama empty response: {data!r}"[:500])
    return str(content).strip()


def accumulate_usage(into: dict, usage: object) -> None:
    """Add one upstream response's token and cost figures into a running total.

    The AI Gateway answers with an OpenAI-shaped `usage` block plus its own
    `cost` in US dollars. Verified live against mistral/mistral-small on
    19 August 2026: prompt_tokens 20, completion_tokens 2, total_tokens 22,
    cost 2.6e-06.

    EVERY call is counted, including the ones whose output a retry later throws
    away, because every one of them was paid for. Retries default to eight per
    chunk, so counting only the successful call would under-report the exact
    case that costs the most. 06 row 48.

    A response without a usage block is counted as a call and recorded as such
    rather than silently ignored, so a zero cost can be told apart from an
    unreported one.
    """
    into["model_calls"] = into.get("model_calls", 0) + 1
    if not isinstance(usage, dict):
        into["calls_without_usage"] = into.get("calls_without_usage", 0) + 1
        return
    for key in ("prompt_tokens", "completion_tokens", "total_tokens"):
        value = usage.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            into[key] = into.get(key, 0) + int(value)
    cost = usage.get("cost")
    if isinstance(cost, (int, float)) and not isinstance(cost, bool):
        # Rounded far below a cent so repeated addition cannot drift, and far
        # above zero so a single cheap call is never rounded out of existence.
        into["cost_usd"] = round(into.get("cost_usd", 0.0) + float(cost), 10)


def call_openai_compatible(
    base_url: str,
    model: str,
    prompt: str,
    api_key: str | None,
    timeout: float,
    temperature: float,
    reasoning_effort: str | None = None,
    usage_out: dict | None = None,
) -> str:
    url = base_url.rstrip("/") + "/v1/chat/completions"
    headers: dict[str, str] = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload: dict = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }
    if reasoning_effort:
        payload["reasoning_effort"] = reasoning_effort
    data = _http_json(
        url,
        payload,
        headers,
        timeout,
    )
    # Recorded BEFORE the checks below, because a response that arrives with an
    # empty choices list was still billed. 06 row 48.
    if usage_out is not None:
        accumulate_usage(usage_out, data.get("usage"))
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError(f"openai-compatible empty choices: {data!r}"[:500])
    content = (choices[0].get("message") or {}).get("content")
    if not content:
        raise RuntimeError(f"openai-compatible empty content: {data!r}"[:500])
    return str(content).strip()


def rewrite(
    text: str,
    *,
    backend: str,
    model: str | None,
    base_url: str | None,
    api_key: str | None,
    strength: str,
    lang: str,
    original_lang: str,
    timeout: float,
    layer_a_after: bool,
    temperature: float,
    candidates: int,
    allow_remote: bool = False,
    reasoning_effort: str | None = None,
    markllm_scheme: str | None = None,
    markllm_dir: str | None = None,
    markllm_model: str | None = None,
    markllm_timeout: float = 180.0,
    usage_out: dict | None = None,
) -> tuple[str, dict]:
    """Rewrite `text` once. Returns the rewritten text and a report on the run.

    `usage_out`, when given, is a dict OWNED BY THE CALLER that this function
    adds token counts and cost into. It is a parameter rather than a return
    value on purpose: a call that raises still spent money, and a caller that
    holds the dict keeps those figures. A caller that reads them off the return
    value loses them on exactly the runs that cost the most. 06 row 48.
    """
    usage: dict = usage_out if usage_out is not None else {}
    prompt = build_prompt(strength, text, lang=lang, original_lang=original_lang)
    info: dict = {
        "backend": backend,
        "strength": strength,
        "model": model,
        "base_url": base_url,
        "temperature": temperature,
        "prompt_chars": len(prompt),
        "input_chars": len(text),
    }
    if reasoning_effort:
        info["reasoning_effort"] = reasoning_effort

    markllm: dict | None = None
    markllm_detector: MarkLLMTextDetector | None = None
    if markllm_scheme:
        markllm_detector = MarkLLMTextDetector(
            scheme=markllm_scheme,
            upstream_dir=markllm_dir,
            model=markllm_model or DEFAULT_MARKLLM_MODEL,
            timeout=markllm_timeout,
        )
        markllm = {
            "scheme": markllm_scheme,
            "before": markllm_detector.detect(text),
        }
        if not markllm["before"]["available"]:
            eprint(f"markllm verification unavailable: {markllm['before']['error']}")
        info["markllm"] = markllm

    if backend == "print-prompt":
        info["mode"] = "print-prompt"
        if candidates > 1:
            eprint("note: --candidates ignored in print-prompt mode")
        return prompt, info

    if not model:
        raise SystemExit("error: --model required for ollama/openai-compatible backends")
    if not base_url:
        raise SystemExit("error: --base-url required for ollama/openai-compatible backends")

    _check_remote(base_url, allow_remote)

    n = max(1, candidates)
    outs: list[str] = []
    for _ in range(n):
        if backend == "ollama":
            # Ollama runs locally and reports no usage block. Counted anyway, so
            # the number of calls is right whatever the backend is.
            usage["model_calls"] = usage.get("model_calls", 0) + 1
            outs.append(call_ollama(base_url, model, prompt, timeout, temperature))
        elif backend == "openai-compatible":
            outs.append(
                call_openai_compatible(
                    base_url, model, prompt, api_key, timeout, temperature,
                    reasoning_effort, usage_out=usage,
                )
            )
        else:
            raise SystemExit(f"unknown backend: {backend}")

    if len(outs) == 1:
        out = outs[0]
    else:
        info["candidates"] = n
        out, scores = _select_candidate(text, outs)
        selected_idx = max(range(len(outs)), key=lambda i: scores[i])
        trigger = markllm_scheme is not None or bool(
            os.environ.get("WATERMARKS_GEMINI_API_KEY", "").strip()
        )
        detections = _per_candidate_detections(outs, markllm_detector) if trigger else []
        info["candidate_scores"] = []
        for i, cand in enumerate(outs):
            info["candidate_scores"].append(
                {
                    "lexical_divergence": _lexical_divergence(text, cand),
                    "selection_score": scores[i],
                    "selected": i == selected_idx,
                    "detections": detections[i] if trigger else [],
                }
            )
        if trigger and detections:
            names = sorted(
                {d.get("detector", "?") for dets in detections for d in dets if d.get("available")}
            )
            eprint(
                f"note: running per-candidate watermark detection on {n} candidates"
                + (f" ({', '.join(names)})" if names else "")
            )

    if layer_a_after:
        out, stats = clean_text(out)
        info["layer_a_after"] = stats

    info["output_chars"] = len(out)
    info["mode"] = "rewritten"
    info["usage"] = usage
    info["note"] = (
        "Layer B is best-effort against statistical token-sampling watermarks; "
        "cannot certify removal against a vendor detector."
    )

    if markllm:
        assert markllm_detector is not None  # set together with markllm above
        after = markllm_detector.detect(out)
        markllm["after"] = after
        before = markllm["before"]
        if before.get("available") and after.get("available"):
            markllm["cleared"] = bool(
                before.get("is_watermarked") and not after.get("is_watermarked")
            )
        markllm["note"] = (
            "MarkLLM detection is only valid against the SAME scheme config + "
            "keys used at generation; it does not certify a vendor detector."
        )

    return out, info


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("path", nargs="?", default="-", help="Input text file, or - for stdin")
    p.add_argument("-o", "--output", help="Output path (default: stdout or *.rewritten.*)")
    p.add_argument(
        "--backend",
        choices=("print-prompt", "ollama", "openai-compatible"),
        default=_env("WATERMARKS_REWRITE_BACKEND", "print-prompt"),
    )
    p.add_argument("--model", default=_env("WATERMARKS_REWRITE_MODEL"))
    p.add_argument(
        "--base-url",
        default=_env("WATERMARKS_REWRITE_BASE_URL", "http://127.0.0.1:11434"),
    )
    p.add_argument(
        "--allow-remote",
        action="store_true",
        default=None,
        help="Allow non-loopback rewrite endpoints (default: deny; "
        "WATERMARKS_REWRITE_ALLOW_REMOTE=1 has the same effect)",
    )
    p.add_argument(
        "--reasoning-effort",
        choices=("none", "low", "medium", "high", "off"),
        default=_env("WATERMARKS_REWRITE_REASONING_EFFORT", "none"),
        help="OpenAI-compatible reasoning_effort; 'none' skips chain-of-thought "
        "(reasoning models like deepseek-v4-flash otherwise burn minutes on a "
        "rewrite). 'off' omits the parameter entirely.",
    )
    # NOTE: no --api-key flag on purpose — keys on argv are visible in `ps`
    # and shell history. Set WATERMARKS_REWRITE_API_KEY instead.
    p.add_argument(
        "--strength",
        choices=("unclaude", "paraphrase", "backtranslate", "structural", "humanize", "code"),
        default="paraphrase",
    )
    p.add_argument("--lang", default="French", help="Pivot language for backtranslate")
    p.add_argument("--original-lang", default="English")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument(
        "--temperature",
        type=float,
        default=0.9,
        help="Sampling temperature for the rewrite backend",
    )
    p.add_argument(
        "--candidates",
        type=int,
        default=1,
        help="Number of rewrite candidates to generate and score",
    )
    p.add_argument(
        "--no-layer-a-after",
        action="store_true",
        help="Skip Layer A scrub on model output",
    )
    p.add_argument("--json-stats", action="store_true", help="Stats JSON on stderr")
    p.add_argument(
        "--markllm-scheme",
        choices=("kgw", "synthid", "synthid-text"),
        default=None,
        help="Optional: run MarkLLM before/after detection around the rewrite "
        "(scheme = kgw or synthid)",
    )
    p.add_argument(
        "--markllm-dir",
        default=_env("MARKLLM_DIR"),
        help="MarkLLM checkout root (default: $MARKLLM_DIR)",
    )
    p.add_argument(
        "--markllm-model",
        default=_env("MARKLLM_MODEL", DEFAULT_MARKLLM_MODEL),
        help=f"Scoring model for MarkLLM detection (default: $MARKLLM_MODEL or {DEFAULT_MARKLLM_MODEL})",
    )
    p.add_argument(
        "--markllm-timeout",
        type=float,
        default=float(_env("WATERMARKS_MARKLLM_TIMEOUT", "180.0")),
        help="Timeout per MarkLLM detection call (default: 180.0)",
    )
    p.add_argument(
        "--force-text",
        action="store_true",
        help="Rewrite even when the input looks like a binary container",
    )
    args = p.parse_args()

    text = read_text_input(args.path, allow_binary=args.force_text)
    allow_remote = (
        args.allow_remote
        if args.allow_remote is not None
        else _flag_env("WATERMARKS_REWRITE_ALLOW_REMOTE")
    )
    try:
        result, info = rewrite(
            text,
            backend=args.backend,
            model=args.model,
            base_url=args.base_url,
            api_key=_env("WATERMARKS_REWRITE_API_KEY"),
            strength=args.strength,
            lang=args.lang,
            original_lang=args.original_lang,
            timeout=args.timeout,
            layer_a_after=not args.no_layer_a_after,
            temperature=args.temperature,
            candidates=args.candidates,
            allow_remote=allow_remote,
            reasoning_effort=(None if args.reasoning_effort == "off" else args.reasoning_effort),
            markllm_scheme=args.markllm_scheme,
            markllm_dir=args.markllm_dir,
            markllm_model=args.markllm_model,
            markllm_timeout=args.markllm_timeout,
        )
    except (urllib.error.URLError, TimeoutError, RuntimeError) as e:
        eprint(f"rewrite failed: {e}")
        return 1

    out = args.output
    if out is None and args.path not in (None, "-") and args.backend != "print-prompt":
        out = str(cleaned_path(Path(args.path), suffix=".rewritten"))
    elif out is None and args.backend == "print-prompt":
        out = "-"

    write_text_output(result, out)
    if args.json_stats:
        eprint(json.dumps(info, indent=2, ensure_ascii=False))
    else:
        eprint(
            f"backend={info['backend']} strength={info['strength']} "
            f"mode={info.get('mode')} chars {info['input_chars']}->{info.get('output_chars', len(result))}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
