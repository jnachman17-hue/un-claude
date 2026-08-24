"""Measure THE FREEZE (E-9) on real model output, through the live gateway.

Exactly the wiring server.py uses — rewrite_long, then repair — on both
candidate models, across three freeze arms:

    off        UC_LAYER_B_FREEZE=0
    structure  headings only
    both       headings + attributed quotations + references (D1, shipping)

Reports, with denominators:
  * the cost in trigram overlap per arm (the thing to watch — W10 published
    +0.016 structure / +0.079 both on a 541-word essay of this shape);
  * frozen spans returned character-for-character, counted per run;
  * a short story full of dialogue coming back REWRITTEN (D2's demo);
  * a mask-heavy chunk whose good rewrite is NOT refunded (rule 2's demo);
  * fallbacks, retries, and any guard that fired.

EVERY RUN LIVES IN ITS OWN SUBPROCESS WITH A HARD 240-SECOND WALL CLOCK —
the same ceiling the site enforces on the engine. Learned the hard way in
this session: a gateway call can hang far past its 45-second socket timeout
(urllib's timeout is per socket operation, and a connection that drips
resets it), and the first version of this script sat 15+ minutes on two
ESTABLISHED connections with no way to abandon them from inside the
process. Rows are appended to freeze_runs/results.jsonl as they finish, so
a hang loses one run, not the campaign.

Spends real money. Prints gateway usage per run.

Usage:
    python freeze_measure.py            # the full campaign
    python freeze_measure.py one <doc> <arm> <model> <run>   # internal
"""

from __future__ import annotations

import json
import os
import re
import statistics
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "apps" / "web" / "engine"
sys.path.insert(0, str(ENGINE))

for line in (ROOT / ".env.engine.local").read_text().splitlines():
    if line.startswith("AI_GATEWAY_API_KEY="):
        os.environ["WATERMARKS_REWRITE_API_KEY"] = line.split("=", 1)[1].strip()

os.environ.setdefault("WATERMARKS_REWRITE_BASE_URL", "https://ai-gateway.vercel.sh")
os.environ.setdefault("WATERMARKS_REWRITE_BACKEND", "openai-compatible")

MODELS = ("mistral/mistral-small", "deepseek/deepseek-v3.2")
ARMS = {
    "off": {"UC_LAYER_B_FREEZE": "0", "UC_FREEZE_TIERS": "structure,quotes"},
    "structure": {"UC_LAYER_B_FREEZE": "1", "UC_FREEZE_TIERS": "structure"},
    "both": {"UC_LAYER_B_FREEZE": "1", "UC_FREEZE_TIERS": "structure,quotes"},
}

OUTDIR = Path(__file__).parent / "freeze_runs"
ROWS = OUTDIR / "results.jsonl"
WALL_CLOCK = 240        # seconds; the site's own abort ceiling

# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

#: ~520 words, about one fifth quotation and reference list — the shape W10
#: priced at +0.016 (structure) and +0.079 (both tiers).
ESSAY = """School Start Times and the Attendance Problem

Introduction

Few education reforms are as cheap on paper as moving the first bell an hour later, and few have produced such a stubborn gap between what the research says and what districts actually do. The case examined here is the mid-sized district of Fairmont, which moved its high school start from 7:25 to 8:30 in autumn 2019 and then spent three years arguing about what the change had achieved. The argument matters well beyond one district, because the costs of the change were real and immediate while the benefits arrived slowly and unevenly, which is exactly the pattern that makes school boards lose their nerve.

The Evidence

The strongest single result in the literature remains the attendance effect. As Smith puts it, "the change in start time did more for attendance than any intervention we had previously funded, including the two years we spent on automated parent messaging" (p. 47). That sentence has been quoted in a dozen board meetings since, usually by people who have read nothing else in the study it comes from, and it holds up: attendance in Fairmont rose in each of the three years after the change, and rose fastest among the students who had been missing the most school.

The sleep researchers point the same way. Harrison's survey of four campuses concluded:

    The students did not use the later start to stay up later. Median
    bedtime moved by eleven minutes; median waking time moved by
    fifty-one. The hour went to sleep, not to screens.

The transport ledger tells the other half of the story. Fairmont runs its buses in two tiers, and the later high school bell pushed the second tier into the same window as the elementary runs. The district bought four buses and hired seven drivers, and the transport line rose by about 11 percent in the first year. None of that shows up in the attendance figures, and all of it shows up in the budget meetings.

What the Critics Get Right

The honest criticism is not that the reform fails but that its benefits are unevenly distributed. Students who drive themselves gained the most sleep; students on the earliest bus routes gained the least, and some of them now arrive home after dark in winter. A reform sold as universal turned out to be regressive in one specific and fixable way, and the districts that copied Fairmont without copying its route redesign imported the problem wholesale.

Conclusion

The attendance result is real, the sleep result is real, and the transport cost is real. The only dishonest position is the one that mentions two of the three. Districts weighing the change should price the buses first, because the buses are the part that arrives on the first morning and never goes away.

Sources

Smith, J. A., & Jones, R. B. (2019). Later start times and adolescent attendance. Journal of School Health, 89(4), 331-339.

Harrison, M. (2020). The sleeping campus: Start times and adolescent rest. Princeton University Press.

Okonkwo, A. (2021). Sleep debt in rural districts. Sleep Research Quarterly, 12(2), 88-104."""

#: ~190 words of invented dialogue. D2: none of it may freeze, and it must
#: come back rewritten.
STORY = """The barn door had been open since morning and nobody would say why. Ruth counted the dogs twice and came up one short both times.

"We can't stay here another night," she said, watching the road. "They know the bridge is out, and they know we know it."

"Then we move at dark," Marcus replied. He was already rolling the tarpaulin. "You take the dogs around the long field. I follow with the cart and the lamps off."

"And if the water's over the ford?" she asked. "You saw it at noon. It was over the stones at noon."

"Then we get wet," he said, and that was the whole of the plan, the same as it had always been with him, weather first and worry after.

Ruth went up to the loft for the last of the seed potatoes and stood a moment at the little window. The road was empty all the way to the elm line. Whatever had taken the dog had left the geese alone, which made no sense unless it walked on two legs, and she had stopped believing in hungry strangers the night the bridge went out."""

#: ~114 words, roughly 70% of them one attributed quotation and one block
#: quote — the mask-heavy shape whose GOOD rewrite both earlier designs
#: refunded (rule 2's breaking case).
MASK_HEAVY = """The auditor's verdict took one paragraph. She wrote that the committee had "acted without malice and without competence in equal measure, spending eleven months and the whole contingency reserve on a bridge survey that the county had already completed twice, most recently in the spring before the war memorial fund was raided for the deposit."

The minutes recorded, in full:

    No member present could say who had ordered the second survey,
    who had signed for the deposit, or where the first survey was
    filed. The clerk's ledger shows the sum leaving and nothing
    arriving.

Nobody resigned over it, which told the village everything it needed to know about how the next one would go."""

DOCS = {"essay": ESSAY, "story": STORY, "mask_heavy": MASK_HEAVY}

#: E-16 job 2: the document-size ladder, built by make_ladder_docs.py. Essay
#: shaped at every rung — headings, attributed quotations with citations,
#: introduced block quotes, a reference list — so "freeze ON" means something
#: at 29 chunks. The existing docs/doc_*.txt corpus freezes 0% and would have
#: measured latency with no mask in play at all.
LADDER = ("ladder_500", "ladder_1000", "ladder_2000", "ladder_3000",
          "ladder_5000", "ladder_7500", "ladder_10000")


def _doc(name: str) -> str:
    if name in DOCS:
        return DOCS[name]
    return (Path(__file__).parent / "docs" / f"{name}.txt").read_text()

PLAN = [
    ("essay", "off", 4),
    ("essay", "structure", 4),
    ("essay", "both", 4),
    ("story", "off", 3),
    ("story", "both", 3),
    ("mask_heavy", "both", 4),
]


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def trigram_overlap(src: str, out: str) -> float:
    a, b = _tokens(src), _tokens(out)
    tri_a = set(zip(a, a[1:], a[2:]))
    tri_b = set(zip(b, b[1:], b[2:]))
    if not tri_a:
        return 0.0
    return len(tri_a & tri_b) / len(tri_a)


def unfrozen_overlap(src: str, out: str) -> float:
    """Overlap with every would-freeze span removed from BOTH sides.

    The raw overlap counts the frozen words as 'surviving wording', but by
    D2's reasoning those spans carry little watermark — the model had no
    choice inside them — so the honest measure of spent aggressiveness is
    how much of the UNFROZEN text's wording changed. Comparable across arms:
    the same spans are stripped whether the freeze was on or off.
    """
    from uc_freeze import plan_freeze

    src_rest, out_rest = src, out
    for s in plan_freeze(src, ("structure", "quotes")):
        src_rest = src_rest.replace(s["text"], " § ")
        out_rest = out_rest.replace(s["text"], " § ")
    return trigram_overlap(src_rest, out_rest)


# ---------------------------------------------------------------------------
# One run, in its own process
# ---------------------------------------------------------------------------


def run_one(doc_name: str, arm: str, model: str, run: int) -> int:
    from rewrite_text import rewrite as layer_b_rewrite
    from uc_chunk import rewrite_long
    from uc_freeze import plan_freeze
    from uc_repair import repair_rewrite

    doc = _doc(doc_name)
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

    t0 = time.time()
    failure = None
    out = info = None
    try:
        out, info = rewrite_long(doc, _one)
        out, _repair_stats = repair_rewrite(doc, out)
    except Exception as e:  # noqa: BLE001 — recorded, reported
        failure = f"{type(e).__name__}: {e}"
    row = {
        "doc": doc_name, "arm": arm, "model": model, "run": run,
        "seconds": round(time.time() - t0, 1),
        "cost_usd": ((info or {}).get("usage") or {}).get("cost_usd", 0.0),
        "failure": failure,
    }
    if not failure:
        tiers = tuple(os.environ["UC_FREEZE_TIERS"].split(","))
        row["overlap"] = round(trigram_overlap(doc, out), 4)
        row["overlap_unfrozen"] = round(unfrozen_overlap(doc, out), 4)
        if arm != "off":
            spans = plan_freeze(doc, tiers)
            ok = sum(1 for s in spans
                     if out.count(s["text"]) >= max(1, doc.count(s["text"])))
            row["spans_verbatim"] = f"{ok}/{len(spans)}"
            freeze = info.get("freeze", {})
            row["fallbacks"] = len(freeze.get("chunks_fallback", []))
        row["retries"] = (info.get("usage") or {}).get("retries", 0)
        row["masks_reinserted"] = (info.get("usage") or {}).get(
            "masks_reinserted", 0)
        if run == 1:
            tag = f"{doc_name}_{arm}_{model.split('/')[-1]}"
            (OUTDIR / f"{tag}_out.txt").write_text(out)
    print(json.dumps(row, ensure_ascii=False))
    return 0


# ---------------------------------------------------------------------------
# The campaign
# ---------------------------------------------------------------------------


def main() -> int:
    OUTDIR.mkdir(exist_ok=True)
    from uc_freeze import freeze_fraction

    print("PRE-FLIGHT (D4) — the fraction each document would freeze:", flush=True)
    for name, doc in DOCS.items():
        both = freeze_fraction(doc, ("structure", "quotes"))
        structure = freeze_fraction(doc, ("structure",))
        print(f"  {name:11s} both={both['fraction']:.3f} "
              f"structure={structure['fraction']:.3f} spans={both['spans']}",
              flush=True)

    rows: list[dict] = []
    with ROWS.open("a") as sink:
        for doc_name, arm, runs in PLAN:
            for model in MODELS:
                for run in range(1, runs + 1):
                    env = {**os.environ, **ARMS[arm]}
                    try:
                        proc = subprocess.run(
                            [sys.executable, __file__, "one",
                             doc_name, arm, model, str(run)],
                            env=env, capture_output=True, text=True,
                            timeout=WALL_CLOCK,
                        )
                        line = proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else ""
                        row = json.loads(line) if line.startswith("{") else {
                            "doc": doc_name, "arm": arm, "model": model,
                            "run": run, "failure":
                                f"subprocess: {proc.stderr.strip()[-200:]}"}
                    except subprocess.TimeoutExpired:
                        row = {"doc": doc_name, "arm": arm, "model": model,
                               "run": run, "seconds": WALL_CLOCK,
                               "failure": f"wallclock_timeout_{WALL_CLOCK}s "
                                          "(a gateway call hung past its 45s "
                                          "socket timeout)"}
                    rows.append(row)
                    sink.write(json.dumps(row, ensure_ascii=False) + "\n")
                    sink.flush()
                    print(json.dumps(row, ensure_ascii=False), flush=True)

    print("\nSUMMARY — mean trigram overlap per cell (lower = more rewritten)",
          flush=True)
    for doc_name in ("essay", "story", "mask_heavy"):
        for model in MODELS:
            line = f"  {doc_name:11s} {model.split('/')[-1]:14s}"
            shown = False
            for arm in ("off", "structure", "both"):
                cell = [r["overlap"] for r in rows
                        if r["doc"] == doc_name and r["arm"] == arm
                        and r["model"] == model and "overlap" in r]
                if cell:
                    line += f"  {arm}={statistics.mean(cell):.4f} (n={len(cell)})"
                    shown = True
            if shown:
                print(line, flush=True)

    print("\nSPANS RETURNED CHARACTER-FOR-CHARACTER (frozen arms)", flush=True)
    for doc_name in ("essay", "mask_heavy"):
        for model in MODELS:
            for arm in ("structure", "both"):
                cells = [r for r in rows
                         if r["doc"] == doc_name and r["arm"] == arm
                         and r["model"] == model and "spans_verbatim" in r]
                if cells:
                    oks = sum(int(r["spans_verbatim"].split("/")[0]) for r in cells)
                    total = sum(int(r["spans_verbatim"].split("/")[1]) for r in cells)
                    fb = sum(r.get("fallbacks", 0) for r in cells)
                    print(f"  {doc_name:11s} {model.split('/')[-1]:14s} {arm:9s} "
                          f"{oks}/{total} spans, {fb} chunk fallbacks, "
                          f"{len(cells)} runs", flush=True)

    failures = [r for r in rows if r.get("failure")]
    print(f"\nFAILED RUNS: {len(failures)} of {len(rows)}", flush=True)
    for r in failures:
        print(f"  {r['doc']} {r['arm']} {r['model']} run {r['run']}: "
              f"{r['failure']}", flush=True)
    total_cost = sum(r.get("cost_usd") or 0.0 for r in rows)
    print(f"\ngateway cost total (successful-run accounting)  ${total_cost:.6f}",
          flush=True)
    return 0


# ---------------------------------------------------------------------------
# E-16 JOB 2 — the ladder: which model, and how big a document
# ---------------------------------------------------------------------------

LADDER_MODELS = ("mistral/mistral-small", "mistral/mistral-medium",
                 "deepseek/deepseek-v3.2")
LADDER_ROWS = OUTDIR / "ladder.jsonl"
LADDER_RUNS = 3


def gateway_refuses() -> str | None:
    """One bare probe. Returns the refusal text if the key is out of budget.

    THE TRAP THIS EXISTS FOR (E-16). The spend limit is on the KEY and the
    credits endpoint does not show it: E-16 saw `balance $14.99` while the key
    stood at `total_used $10.005` against a $10.00 cap, and every model
    returned HTTP 402. Worse, the engine retries eight times, so ONE refusal
    was recorded as `chunk N failed after 8 attempts: HTTPError` and read as a
    bad model. Two of E-16's reported model failures were this.
    """
    import urllib.error
    import urllib.request

    body = json.dumps({"model": "mistral/mistral-small",
                       "messages": [{"role": "user", "content": "ok"}],
                       "max_tokens": 2}).encode()
    req = urllib.request.Request(
        os.environ["WATERMARKS_REWRITE_BASE_URL"] + "/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {os.environ['WATERMARKS_REWRITE_API_KEY']}",
                 "Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=30).read()
        return None
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read()[:300].decode(errors='replace')}"
    except Exception as e:                      # noqa: BLE001
        return f"{type(e).__name__}: {e}"


def credits() -> str:
    import urllib.request
    req = urllib.request.Request(
        os.environ["WATERMARKS_REWRITE_BASE_URL"] + "/v1/credits",
        headers={"Authorization": f"Bearer {os.environ['WATERMARKS_REWRITE_API_KEY']}"})
    try:
        return urllib.request.urlopen(req, timeout=30).read().decode()
    except Exception as e:                      # noqa: BLE001
        return f"unreadable: {e}"


def ladder(models=LADDER_MODELS, docs=LADDER, runs=LADDER_RUNS) -> int:
    """Every model up the ladder, freeze ON, until it crosses the site's wall.

    A model's ladder STOPS at the first rung whose median crosses 240 seconds
    — the site aborts there, so the rungs above it are unreachable for that
    model and paying to measure them proves nothing. The stop is printed, not
    silent: a bounded campaign that does not say what it skipped reads as
    coverage it does not have.
    """
    OUTDIR.mkdir(exist_ok=True)
    from uc_freeze import freeze_fraction
    from uc_wordcount import count_words

    print(f"gateway credits BEFORE  {credits()}", flush=True)
    refusal = gateway_refuses()
    if refusal:
        print(f"\nSTOP — the gateway refuses before the campaign begins:\n"
              f"  {refusal}\nNothing was run.", flush=True)
        return 2

    print("THE LADDER (freeze ON, both tiers)", flush=True)
    for name in docs:
        text = _doc(name)
        ff = freeze_fraction(text, ("structure", "quotes"))
        print(f"  {name:<16}{ff['words']:>6} words  "
              f"{-(-ff['words'] // 350):>3} chunks  "
              f"frozen {ff['fraction'] * 100:>5.1f}%  spans={ff['spans']}",
              flush=True)
    print(flush=True)

    rows: list[dict] = []
    with LADDER_ROWS.open("a") as sink:
        for model in models:
            for name in docs:
                cell: list[dict] = []
                for run in range(1, runs + 1):
                    env = {**os.environ, **ARMS["both"]}
                    t0 = time.time()
                    try:
                        proc = subprocess.run(
                            [sys.executable, __file__, "one",
                             name, "both", model, str(run)],
                            env=env, capture_output=True, text=True,
                            timeout=WALL_CLOCK,
                        )
                        line = (proc.stdout.strip().splitlines() or [""])[-1]
                        row = json.loads(line) if line.startswith("{") else {
                            "doc": name, "arm": "both", "model": model,
                            "run": run, "seconds": round(time.time() - t0, 1),
                            "failure": f"subprocess: {proc.stderr.strip()[-300:]}"}
                    except subprocess.TimeoutExpired:
                        row = {"doc": name, "arm": "both", "model": model,
                               "run": run, "seconds": WALL_CLOCK,
                               "failure": f"wallclock_timeout_{WALL_CLOCK}s"}
                    row["words"] = count_words(_doc(name))
                    cell.append(row)
                    rows.append(row)
                    sink.write(json.dumps(row, ensure_ascii=False) + "\n")
                    sink.flush()
                    print(json.dumps(row, ensure_ascii=False), flush=True)

                    # A refusal looks exactly like a bad model once the retry
                    # loop has turned it into eight failures. Ask the gateway
                    # directly rather than guessing, and stop the campaign.
                    if "HTTPError" in (row.get("failure") or ""):
                        refusal = gateway_refuses()
                        if refusal:
                            print(f"\nSTOP — the gateway is refusing, this is "
                                  f"NOT the model:\n  {refusal}\n"
                                  f"Campaign abandoned after {len(rows)} runs.",
                                  flush=True)
                            print(f"gateway credits AFTER  {credits()}",
                                  flush=True)
                            return 2

                secs = [r["seconds"] for r in cell if r.get("seconds")]
                med = statistics.median(secs) if secs else WALL_CLOCK
                timeouts = sum(1 for r in cell
                               if "wallclock_timeout" in (r.get("failure") or ""))
                if med >= WALL_CLOCK or timeouts >= 2:
                    print(f"\nSTOP — {model} crossed the site's 240s wall at "
                          f"{name} (median {med}s, {timeouts}/{len(cell)} "
                          f"timed out). NOT MEASURED for this model: "
                          f"{[d for d in docs[docs.index(name) + 1:]]}",
                          flush=True)
                    break

    print("\n" + "=" * 78, flush=True)
    print("SECONDS BY MODEL BY DOCUMENT SIZE (freeze ON, both tiers)", flush=True)
    print("=" * 78, flush=True)
    hdr = f"{'model':<18}{'doc':<15}{'words':>6}{'n':>3}{'median':>9}{'worst':>8}{'fail':>6}{'spans':>10}{'depth':>8}"
    print(hdr, flush=True)
    for model in models:
        for name in docs:
            cell = [r for r in rows if r["model"] == model and r["doc"] == name]
            if not cell:
                continue
            secs = [r["seconds"] for r in cell if r.get("seconds")]
            ok = [r for r in cell if not r.get("failure")]
            oks = sum(int(r["spans_verbatim"].split("/")[0]) for r in ok
                      if "spans_verbatim" in r)
            tot = sum(int(r["spans_verbatim"].split("/")[1]) for r in ok
                      if "spans_verbatim" in r)
            depth = [r["overlap_unfrozen"] for r in ok if "overlap_unfrozen" in r]
            print(f"{model.split('/')[-1]:<18}{name:<15}"
                  f"{cell[0].get('words', 0):>6}{len(cell):>3}"
                  f"{statistics.median(secs) if secs else 0:>9.1f}"
                  f"{max(secs) if secs else 0:>8.1f}"
                  f"{len(cell) - len(ok):>4}/{len(cell)}"
                  f"{f'{oks}/{tot}':>10}"
                  f"{statistics.mean(depth) if depth else float('nan'):>8.3f}",
                  flush=True)

    cost = sum(r.get("cost_usd") or 0.0 for r in rows)
    print(f"\nown-accounting cost across {len(rows)} runs  ${cost:.6f}  "
          "(the gateway balance is the number that counts)", flush=True)
    fails = [r for r in rows if r.get("failure")]
    print(f"FAILED RUNS: {len(fails)} of {len(rows)}", flush=True)
    for r in fails:
        print(f"  {r['model']} {r['doc']} run {r['run']}: {r['failure'][:160]}",
              flush=True)
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "ladder":
        rest = sys.argv[2:]
        raise SystemExit(ladder(
            models=tuple(rest[0].split(",")) if len(rest) > 0 and rest[0] else LADDER_MODELS,
            docs=tuple(rest[1].split(",")) if len(rest) > 1 and rest[1] else LADDER,
            runs=int(rest[2]) if len(rest) > 2 else LADDER_RUNS,
        ))
    if len(sys.argv) > 1 and sys.argv[1] == "one":
        raise SystemExit(run_one(sys.argv[2], sys.argv[3],
                                 sys.argv[4], int(sys.argv[5])))
    raise SystemExit(main())
