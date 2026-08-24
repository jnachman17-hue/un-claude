"""Measure the REPAIR pass on real model output. Lane A step 2 evidence.

Runs real rewrites through the live gateway with the exact wiring server.py
uses, then repairs each output and reports:

  * which marks the model put in (em dashes, curly punctuation, markdown,
    spelled-out years) and what repair did to each;
  * the cost in trigram overlap — the fraction of the input's three-word
    sequences still present — before and after repair. W10's strict version
    measured median +0.0000; this must be at least as cheap.

Spends real money. Prints the gateway usage of every run.
"""

from __future__ import annotations

import itertools
import json
import os
import re
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "apps" / "web" / "engine"
sys.path.insert(0, str(ENGINE))

# The gateway key, exactly as the runbook reads it.
for line in (ROOT / ".env.engine.local").read_text().splitlines():
    if line.startswith("AI_GATEWAY_API_KEY="):
        os.environ["WATERMARKS_REWRITE_API_KEY"] = line.split("=", 1)[1].strip()

os.environ.setdefault("WATERMARKS_REWRITE_BASE_URL", "https://ai-gateway.vercel.sh")
os.environ.setdefault("WATERMARKS_REWRITE_BACKEND", "openai-compatible")

from rewrite_text import rewrite as layer_b_rewrite  # noqa: E402
from uc_chunk import rewrite_long  # noqa: E402
from uc_repair import EM_DASH, repair_rewrite  # noqa: E402

MODELS = ("mistral/mistral-small", "mistral/mistral-medium")
RUNS_PER_CELL = int(os.environ.get("REPAIR_RUNS", "3"))

DOCS = {
    "quarterly report (376w)": (ROOT / "engine/lab/docs/doc_1000.txt")
    .read_text()
    .split("\n\n")[0:6],
    "essay with quote and years (214w)": [
        "The coffee houses of London were never only about coffee. Within "
        "sixty years of the first one opening in 1652, there were coffee "
        "houses in every ward of the city, and each had its own crowd: "
        "shippers at one, poets at another, stockjobbers at a third. The "
        "stockjobbers were expelled from the Royal Exchange in 1698 and "
        "simply carried on trading in the coffee houses for the next eighty "
        "years.",
        'As one historian put it, "the coffee house was the internet of its '
        'age," a place where news, rumour and price information moved faster '
        "than anywhere else in Europe. It's hard to overstate how new this "
        "was. A merchant's apprentice could sit beside a member of parliament "
        "and hear the same news at the same moment.",
        "The lesson for 2028 is not that technology repeats, but that the "
        "spaces where information pools decide who profits from it. That was "
        "true in 1698 and it's true now.",
    ],
}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def trigram_overlap(src: str, out: str) -> float:
    """The fraction of the original's three-word sequences still present."""
    a, b = _tokens(src), _tokens(out)
    tri_a = set(zip(a, a[1:], a[2:]))
    tri_b = set(zip(b, b[1:], b[2:]))
    if not tri_a:
        return 0.0
    return len(tri_a & tri_b) / len(tri_a)


def count_marks(text: str) -> dict:
    return {
        "em_dash": text.count(EM_DASH),
        "curly_apos": text.count("’") + text.count("‘"),
        "curly_quote": text.count("“") + text.count("”"),
        "md_asterisk": text.count("*"),
        "md_heading_lines": len(re.findall(r"(?m)^#{1,6}[ \t]", text)),
    }


def one_factory(model: str, usage_pool: list):
    base_temp = 1.0

    def _one(chunk: str, attempt: int = 0, missing=None, usage_out=None):
        temp = max(0.2, base_temp - 0.2 * attempt)
        return layer_b_rewrite(
            chunk,
            backend="openai-compatible",
            model=model,
            base_url=os.environ["WATERMARKS_REWRITE_BASE_URL"],
            api_key=os.environ["WATERMARKS_REWRITE_API_KEY"],
            strength=("unclaude_retry:" + ", ".join(missing)) if missing else "unclaude",
            lang="French",
            original_lang="English",
            timeout=45.0,
            layer_a_after=False,
            temperature=temp,
            candidates=1,
            allow_remote=True,
            reasoning_effort=None,
            usage_out=usage_out,
        )

    return _one


def main() -> int:
    deltas: list[float] = []
    total_cost = 0.0
    results = []
    for doc_name, paras in DOCS.items():
        src = "\n\n".join(paras)
        for model in MODELS:
            for run in range(1, RUNS_PER_CELL + 1):
                t0 = time.time()
                try:
                    out, info = rewrite_long(src, one_factory(model, []))
                except Exception as e:
                    print(f"FAILED {doc_name} {model} run {run}: {type(e).__name__}: {e}")
                    continue
                seconds = time.time() - t0
                cost = (info.get("usage") or {}).get("cost_usd", 0.0)
                total_cost += cost
                repaired, stats = repair_rewrite(src, out)
                row = {
                    "doc": doc_name,
                    "model": model,
                    "run": run,
                    "seconds": round(seconds, 1),
                    "cost_usd": cost,
                    "marks_in_src": count_marks(src),
                    "marks_in_raw": count_marks(out),
                    "marks_after_repair": count_marks(repaired),
                    "repair_stats": stats,
                    "overlap_raw": round(trigram_overlap(src, out), 4),
                    "overlap_repaired": round(trigram_overlap(src, repaired), 4),
                }
                row["overlap_delta"] = round(
                    row["overlap_repaired"] - row["overlap_raw"], 4)
                deltas.append(row["overlap_delta"])
                results.append(row)
                print(json.dumps(row, ensure_ascii=False))
                # Keep one full before/after pair for the note.
                if run == 1:
                    tag = f"{doc_name.split()[0]}_{model.split('/')[-1]}"
                    outdir = Path(__file__).parent / "repair_runs"
                    outdir.mkdir(exist_ok=True)
                    (outdir / f"{tag}_raw.txt").write_text(out)
                    (outdir / f"{tag}_repaired.txt").write_text(repaired)

    if deltas:
        print("\nSUMMARY")
        print(f"  runs                    {len(deltas)}")
        print(f"  overlap delta median    {statistics.median(deltas):+.4f}")
        print(f"  overlap delta mean      {statistics.mean(deltas):+.4f}")
        print(f"  overlap delta max       {max(deltas):+.4f}")
        print(f"  gateway cost total      ${total_cost:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
