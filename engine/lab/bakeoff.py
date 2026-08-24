"""The open-weight model bake-off. Lane A step 5, board E-10, decision D5.

Runs every candidate through the REAL engine path (rewrite_long, the real
prompt, the real guards, 45s per-call timeout exactly as production) against
four documents built to carry the W10 defect list, and measures with step 4's
instrument:

  * how much of the defect list the model simply does not do — quotations,
    headings and references returned verbatim (uc_spans), and per-document
    sentinel strings (names, terms of art, figures) surviving byte-for-byte;
  * trigram overlap, the product's core measure (lower = more rewritten);
  * SPEED — the ceiling is time, not money: per-run seconds against the 45s
    call timeout and the site's 240s abort;
  * timeouts and failures;
  * cost per run, for the record rather than as a deciding factor.

DELIBERATE DEPARTURES FROM PRODUCTION, both bounded and both stated: retries
are capped at 2 (UC_LAYER_B_RETRIES) so a timing-out model costs minutes, not
hours — a model that needs the third-to-eighth retry is already losing; and
models run one after another while a document set runs in parallel.

Results stream to bakeoff_results.jsonl (one JSON line per run) so a killed
session keeps everything finished. Spends real money; prints the gateway's
own cost figures.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "apps" / "web" / "engine"
sys.path.insert(0, str(ENGINE))

# Bounded retries BEFORE uc_chunk is imported (it reads the env at import).
os.environ.setdefault("UC_LAYER_B_RETRIES", "2")
os.environ.setdefault("UC_LAYER_B_DEADLINE", "150")

for line in (ROOT / ".env.engine.local").read_text().splitlines():
    if line.startswith("AI_GATEWAY_API_KEY="):
        os.environ["WATERMARKS_REWRITE_API_KEY"] = line.split("=", 1)[1].strip()
BASE_URL = "https://ai-gateway.vercel.sh"

from rewrite_text import rewrite as layer_b_rewrite  # noqa: E402
from uc_chunk import _numbers, rewrite_long  # noqa: E402
from uc_repair import repair_rewrite  # noqa: E402
from uc_spans import check_protected_spans  # noqa: E402

RESULTS = Path(__file__).parent / "bakeoff_results.jsonl"
RUNS_PER_DOC = int(os.environ.get("BAKEOFF_RUNS", "2"))

# The candidates. Open-weight families only (D5: no frontier models). The two
# mistrals are the incumbent and the standing recommendation; kimi-k2 and a
# glm are retests of the two models that "timed out" in the engine-limits
# bake-off; kimi-k3 is Jon's named candidate.
MODELS = [
    "mistral/mistral-small",            # current production model
    "mistral/mistral-medium",           # engine-limits recommendation
    "mistral/mistral-large-3",
    "meta/llama-4-maverick",
    "deepseek/deepseek-v3.2",
    "deepseek/deepseek-v4-flash",
    "zai/glm-4.7-flashx",
    "zai/glm-5",
    "moonshotai/kimi-k2",
    "moonshotai/kimi-k3",               # Jon: "Investigate Kimi k3"
    "minimax/minimax-m2.5",
    "nvidia/nemotron-3-super-120b-a12b",
    "alibaba/qwen3-next-80b-a3b-instruct",
    "xiaomi/mimo-v2.5",
]

# ---------------------------------------------------------------------------
# The four documents. Single-chunk on purpose (< 350 words), so this measures
# THE MODEL and not the chunk plumbing, which step 3 already fixed and tested.
# ---------------------------------------------------------------------------

DOC_A_QUOTES = (
    "Political language has not improved since Orwell described it. Orwell "
    "warned that such language is designed \"to make lies sound truthful and "
    "murder respectable,\" and the warning has outlived every government it "
    "was aimed at. As Smith (2019) puts it, \"the change in start time did "
    "more for attendance than any intervention we had previously funded\" "
    "(p. 47).\n\n"
    "The committee's report was blunter still:\n\n"
    "    The market did not fail. The market did exactly what an\n"
    "    unregulated market does, and the people who designed it knew\n"
    "    that when they built it.\n\n"
    "Their reccomendation [sic] was drafted before the evidence was heard, "
    "and the sign outside the hearing room still read \"no entry after dark "
    "on weekdays\" while the votes were counted inside. Nobody who attended "
    "disputed the sequence of events afterwards, and the minutes record no "
    "objection from any member present."
)

DOC_B_STRUCTURE = (
    "Introduction\n\n"
    "The essay argues that school start times moved attendance more than any "
    "funded intervention of the last decade, and that the evidence for this "
    "was in plain sight for years before anyone acted on it.\n\n"
    "Sources\n\n"
    "The evidence discussed here comes from district records and from two "
    "published studies, and the records are the stronger of the two because "
    "nobody collected them with a hypothesis in mind. They were attendance "
    "ledgers first and evidence second.\n\n"
    "Method\n\n"
    "Attendance was compared across three districts for two years either "
    "side of the schedule change, using the districts' own ledgers. See "
    "https://example.org/start-times for the full dataset.\n\n"
    "Conclusion\n\n"
    "Later starts moved attendance; funding did not.\n\n"
    "References\n\n"
    "Smith, J. A., & Jones, R. B. (2019). Later start times and adolescent "
    "attendance. Journal of School Health, 89(4), 331-339.\n\n"
    "Harrison, M. (2020). The sleeping campus. Princeton University Press."
)

DOC_C_NUMBERS = (
    "The mill ran for sixty years before the family sold it, and the "
    "cottages beside it stood for eighty years more. Stockjobbers were "
    "expelled from the Exchange in 1698 and traded in the coffee houses "
    "until 1778.\n\n"
    "Only 8 of the 23 councils replied to the survey, a response rate of "
    "34.8 percent, and the difference was not significant (p = .015). The "
    "3rd of June deadline was moved to 7:45 pm after Chapter IV of the "
    "regulations was invoked. The restoration cost $4.2 million, of which "
    "30,000 pounds came from the parish fund, and the work must finish by "
    "2028. None of the figures in the ledger were disputed at the annual "
    "meeting, and the auditors signed the accounts without qualification "
    "for the ninth year in a row."
)

DOC_D_TERMS = (
    "Uppsala University in Sweden asks for a language certificate, while "
    "Chulalongkorn University in Thailand is the cheapest of the four "
    "options considered here. The corporate cases are different again: "
    "McDonald's standardised its menu where IKEA localised its catalogue, "
    "and both decisions were profitable.\n\n"
    "In a criminal trial the prosecution must prove every element of the "
    "offence beyond a reasonable doubt, a standard that does not soften "
    "however serious the charge. The cell cultures were grown in vitro "
    "before any animal work began, and the trial enrolled only patients "
    "with type 2 diabetes. The study reported a 95 percent confidence "
    "interval that did not cross zero, which the authors treated as "
    "evidence that the effect was real, not as proof of it. Reviewers "
    "accepted the distinction without comment, which is how it should be."
)

#: Strings that must come back byte-for-byte, per document. These probe the
#: defect ranks a program cannot find in the wild (terms of art, names) but
#: CAN measure when it wrote the document itself.
SENTINELS = {
    "A_quotes": [
        "to make lies sound truthful and murder respectable,",
        "the change in start time did more for attendance than any "
        "intervention we had previously funded",
        "reccomendation",
    ],
    "B_structure": [
        "Introduction",
        "Method",
        "Conclusion",
        "https://example.org/start-times",
        "Journal of School Health",
        "Princeton University Press",
    ],
    "C_numbers": ["1698", "34.8", "$4.2 million", "2028", "7:45"],
    "D_terms": [
        "Uppsala University",
        "Chulalongkorn University",
        "McDonald's",
        "IKEA",
        "beyond a reasonable doubt",
        "in vitro",
        "type 2",
    ],
}
DOCS = {
    "A_quotes": DOC_A_QUOTES,
    "B_structure": DOC_B_STRUCTURE,
    "C_numbers": DOC_C_NUMBERS,
    "D_terms": DOC_D_TERMS,
}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def trigram_overlap(src: str, out: str) -> float:
    a, b = _tokens(src), _tokens(out)
    tri_a = set(zip(a, a[1:], a[2:]))
    tri_b = set(zip(b, b[1:], b[2:]))
    return len(tri_a & tri_b) / len(tri_a) if tri_a else 0.0


def _one_factory(model: str):
    def _one(chunk: str, attempt: int = 0, missing=None, usage_out=None):
        temp = max(0.2, 1.0 - 0.2 * attempt)
        return layer_b_rewrite(
            chunk,
            backend="openai-compatible",
            model=model,
            base_url=BASE_URL,
            api_key=os.environ["WATERMARKS_REWRITE_API_KEY"],
            strength=("unclaude_retry:" + ", ".join(missing)) if missing else "unclaude",
            lang="French",
            original_lang="English",
            timeout=45.0,                       # production's per-call ceiling
            layer_a_after=False,
            temperature=temp,
            candidates=1,
            allow_remote=True,
            reasoning_effort=os.environ.get("BAKEOFF_REASONING") or None,
            usage_out=usage_out,
        )
    return _one


def run_cell(model: str, doc_name: str, run: int) -> dict:
    src = DOCS[doc_name]
    row: dict = {"model": model, "doc": doc_name, "run": run,
                 "reasoning": os.environ.get("BAKEOFF_REASONING") or "default"}
    t0 = time.time()
    try:
        raw, info = rewrite_long(src, _one_factory(model))
    except Exception as e:
        row.update(ok=False, error=f"{type(e).__name__}: {e}"[:200],
                   seconds=round(time.time() - t0, 1),
                   cost_usd=(getattr(e, "usage", {}) or {}).get("cost_usd", 0.0))
        return row
    seconds = time.time() - t0
    usage = info.get("usage") or {}
    repaired, repair_stats = repair_rewrite(src, raw)
    protection = check_protected_spans(src, repaired)
    injected = {
        "em_dashes": max(0, raw.count("—") - src.count("—")),
        "curly": sum(raw.count(c) for c in "’‘“”"),
        "md_asterisks": raw.count("*") if "*" not in src else 0,
        "md_headings": len(re.findall(r"(?m)^#{1,6}[ \t]", raw)),
    }
    sentinels = {s: (s in repaired) for s in SENTINELS[doc_name]}
    row.update(
        ok=True,
        seconds=round(seconds, 1),
        cost_usd=usage.get("cost_usd", 0.0),
        model_calls=usage.get("model_calls", 0),
        retries=usage.get("retries", 0),
        overlap=round(trigram_overlap(src, repaired), 4),
        figures_missing=sorted(
            m for m in (_numbers(src) - _numbers(repaired)) if len(m) > 1),
        injected=injected,
        spans_changed=protection["changed"],
        spans_found=protection["spans_found"],
        sentinels_lost=[s for s, kept in sentinels.items() if not kept],
        structure_kept=info.get("structure_kept"),
        words_ratio=round(
            (info.get("words_out") or 0) / max(1, info.get("words_in") or 1), 2),
    )
    return row


def main() -> int:
    models = sys.argv[1:] or MODELS
    done = set()
    if RESULTS.exists():
        for line in RESULTS.read_text().splitlines():
            try:
                r = json.loads(line)
                done.add((r["model"], r["doc"], r["run"], r.get("reasoning", "default")))
            except Exception:
                pass
    reasoning = os.environ.get("BAKEOFF_REASONING") or "default"
    with RESULTS.open("a") as sink:
        for model in models:
            cells = [
                (doc, run)
                for run in range(1, RUNS_PER_DOC + 1)
                for doc in DOCS
                if (model, doc, run, reasoning) not in done
            ]
            if not cells:
                print(f"### {model}: already complete, skipped")
                continue
            print(f"### {model} ({len(cells)} runs)")
            t0 = time.time()
            with ThreadPoolExecutor(max_workers=4) as pool:
                for row in pool.map(lambda c: run_cell(model, *c), cells):
                    sink.write(json.dumps(row, ensure_ascii=False) + "\n")
                    sink.flush()
                    tag = "ok " if row.get("ok") else "FAIL"
                    print(f"  {tag} {row['doc']:12s} run {row['run']} "
                          f"{row.get('seconds', '?')}s "
                          f"${row.get('cost_usd', 0):.5f} "
                          f"ov={row.get('overlap', '-')} "
                          f"lost={row.get('sentinels_lost', row.get('error', ''))}")
            print(f"  model wall-clock {time.time() - t0:.0f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
