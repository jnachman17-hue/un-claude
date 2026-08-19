"""Measure Layer B rewrites: cost, speed, fact survival, and wording overlap.

Run:  python3 engine/lab/measure.py

Nothing here claims to measure watermark removal. No detector exists, so that
number cannot be produced by anyone. See docs/01-build-spec.md section 2a.
"""
from __future__ import annotations

import io, json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions"
MODELS_URL = "https://ai-gateway.vercel.sh/v1/models"


def api_key() -> str:
    for line in io.open(ROOT / ".env.engine.local", encoding="utf-8"):
        if line.startswith("AI_GATEWAY_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no AI_GATEWAY_API_KEY in .env.engine.local")


# ---------------------------------------------------------------- the prompts

REPO_PROMPT = (
    "Rewrite the following text so that it uses substantially different wording at "
    "the token level. Change clause order, connectors, and transition words; vary "
    "sentence boundaries and length; and replace both content words and function "
    "words where meaning allows. Preserve all facts, numbers, names, and technical "
    "identifiers. Do not add or remove claims. Output only the rewritten text."
)

OURS_PROMPT = (
    "Rewrite the text so that almost none of the original phrasing survives.\n\n"
    "RULES\n"
    "1. Every fact must survive character-for-character: numbers, amounts, "
    "percentages, dates, and the names of people, companies and places. Copy them "
    "exactly. Never change, drop, round, or approximate one.\n"
    "2. Apart from those facts themselves, do not reuse any run of more than three "
    "consecutive words from the original. This includes the words immediately "
    "around each fact. Rewrite the framing of every fact, not just the sentences "
    "between them.\n"
    "3. Keep every claim exactly as asserted. Add nothing and remove nothing.\n"
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
)

PROMPTS = {"repo": REPO_PROMPT, "ours": OURS_PROMPT}


# ------------------------------------------------------------------- measures

WORD = re.compile(r"[A-Za-z0-9$%.,'-]+")

def words(t: str) -> list[str]:
    return [w.strip(".,;:'\"").lower() for w in WORD.findall(t) if w.strip(".,;:'\"")]

def shingle_overlap(a: str, b: str, n: int) -> float:
    """Fraction of the original's n-word runs that reappear verbatim in b."""
    wa, wb = words(a), words(b)
    if len(wa) < n:
        return 0.0
    sa = [tuple(wa[i:i + n]) for i in range(len(wa) - n + 1)]
    sb = set(tuple(wb[i:i + n]) for i in range(len(wb) - n + 1))
    return sum(1 for s in sa if s in sb) / len(sa)

def longest_run(a: str, b: str) -> int:
    wa, wb = words(a), words(b)
    sb = set()
    for n in range(1, min(len(wb), 40) + 1):
        for i in range(len(wb) - n + 1):
            sb.add(tuple(wb[i:i + n]))
    best = 0
    for n in range(1, min(len(wa), 40) + 1):
        hit = any(tuple(wa[i:i + n]) in sb for i in range(len(wa) - n + 1))
        if hit:
            best = n
        else:
            break
    return best

FACT_PATTERNS = [
    r"\$[\d,]+(?:\.\d+)?(?:\s?million|\s?billion)?",   # money
    r"\b\d+(?:\.\d+)?\s?percent\b",                     # percentages spelled
    r"\b\d+(?:\.\d+)?%",                                # percentages symbol
    r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b",
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b",
    r"\b(?:19|20)\d{2}\b",                              # years
    r"\b\d{2,}\b",                                      # bare numbers 2+ digits
]
NAME = re.compile(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b")

def extract_facts(t: str) -> list[str]:
    out = []
    for p in FACT_PATTERNS:
        out += re.findall(p, t)
    out += NAME.findall(t)
    seen, uniq = set(), []
    for f in out:
        k = f.lower().strip()
        if k not in seen:
            seen.add(k); uniq.append(f.strip())
    return uniq

def fact_survival(src: str, out: str) -> tuple[int, int, list[str]]:
    facts = extract_facts(src)
    lo = out.lower()
    missing = [f for f in facts if f.lower() not in lo]
    return len(facts) - len(missing), len(facts), missing


# ------------------------------------------------------------------ the calls

def prices() -> dict:
    with urllib.request.urlopen(MODELS_URL, timeout=30) as r:
        d = json.load(r)
    out = {}
    for m in d.get("data", []):
        p = m.get("pricing") or {}
        try:
            out[m["id"]] = (float(p.get("input", 0)), float(p.get("output", 0)))
        except (TypeError, ValueError):
            pass
    return out

def call(model: str, system: str, text: str, key: str, timeout: int = 180) -> dict:
    body = {
        "model": model,
        "messages": [{"role": "system", "content": system},
                     {"role": "user", "content": text}],
        "temperature": 1.0,
    }
    req = urllib.request.Request(
        GATEWAY, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.load(r)
    d["_elapsed"] = time.time() - t0
    return d


# ----------------------------------------------------------------- the runner

MODELS = [
    "alibaba/qwen3.7-flash",
    "openai/gpt-oss-20b",
    "mistral/mistral-small",
    "deepseek/deepseek-v4-flash",
    "meta/llama-3.1-8b",
]

def main() -> int:
    key = api_key()
    src = io.open(ROOT / "engine/lab/sample.txt", encoding="utf-8").read().strip()
    price = prices()
    src_words = len(words(src))
    results = []

    print(f"Source: {src_words} words, {len(extract_facts(src))} facts detected\n")

    for model in MODELS:
        for pname, prompt in PROMPTS.items():
            label = f"{model}  [{pname}]"
            try:
                d = call(model, prompt, src, key)
            except urllib.error.HTTPError as e:
                print(f"{label:<48} FAILED HTTP {e.code}: {e.read().decode()[:120]}")
                continue
            except Exception as e:
                print(f"{label:<48} FAILED {type(e).__name__}: {str(e)[:120]}")
                continue

            out = (d["choices"][0]["message"]["content"] or "").strip()
            u = d.get("usage", {}) or {}
            pin, pout = u.get("prompt_tokens", 0), u.get("completion_tokens", 0)
            reasoning = ((u.get("completion_tokens_details") or {}).get("reasoning_tokens")
                         or 0)
            pi, po = price.get(model, (0.0, 0.0))
            cost = pin * pi + pout * po
            kept, total, missing = fact_survival(src, out)
            r = dict(model=model, prompt=pname, out=out,
                     tokens_in=pin, tokens_out=pout, reasoning=reasoning,
                     cost=cost, secs=d["_elapsed"],
                     facts_kept=kept, facts_total=total, facts_missing=missing,
                     ov2=shingle_overlap(src, out, 2), ov3=shingle_overlap(src, out, 3),
                     ov4=shingle_overlap(src, out, 4), ov5=shingle_overlap(src, out, 5),
                     longest=longest_run(src, out), out_words=len(words(out)))
            results.append(r)
            print(f"{label:<48} ok  {d['_elapsed']:5.1f}s  "
                  f"facts {kept}/{total}  overlap3 {r['ov3']*100:5.1f}%  "
                  f"${cost:.6f}")

    io.open(ROOT / "engine/lab/results.json", "w", encoding="utf-8").write(
        json.dumps(results, indent=2))

    print("\n" + "=" * 104)
    print(f"{'model':<28} {'prompt':<6} {'facts':>7} {'2-gram':>7} {'3-gram':>7} "
          f"{'4-gram':>7} {'5-gram':>7} {'run':>4} {'sec':>6} {'cents/1k':>9}")
    print("=" * 104)
    for r in results:
        per1k = (r["cost"] / max(src_words, 1)) * 1000 * 100
        flag = "" if r["facts_kept"] == r["facts_total"] else "  <-- LOST FACTS"
        print(f"{r['model']:<28} {r['prompt']:<6} "
              f"{r['facts_kept']:>3}/{r['facts_total']:<3} "
              f"{r['ov2']*100:>6.1f}% {r['ov3']*100:>6.1f}% {r['ov4']*100:>6.1f}% "
              f"{r['ov5']*100:>6.1f}% {r['longest']:>4} {r['secs']:>6.1f} "
              f"{per1k:>8.4f}{flag}")
    print("=" * 104)
    print("\nfacts   = source facts still present in the output, character for character")
    print("n-gram  = fraction of the original's n-word runs that survive verbatim (lower is better)")
    print("run     = longest run of consecutive original words found in the output")
    print("NOTE: none of these is a watermark score. No detector exists.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
