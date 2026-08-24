# CURRENT HANDOFF

**Rewritten 24 August 2026 at the end of the E-16 session.** Full detail:
`docs/session-notes/e16-detector-and-ceiling.md`.

---

## BLOCKING, AND JON'S ALONE

**The AI Gateway key's budget is exhausted. Every model returns HTTP 402.**

```
{"error":{"message":"API key budget exceeded. Current spend: $10.00,
limit: $10.00. ...","type":"quota_for_entity_exceeded"}}
```

**Every written record says the live site shares this key, so layer B on
production is very likely failing right now.** Layers A and metadata do not
touch the gateway and are unaffected. Production's own environment could not
be read to confirm it — the permission layer refuses, as it refused E-9.

**The trap, now recorded in `07`: the limit is on the KEY, and the credits
endpoint does not show it.** It reports `balance 14.99` with
`total_used 10.005` — fifteen dollars of balance, none of it spendable.
**Read `total_used`, not `balance`, before spending on anything.**

**Nothing that touches a model can run until the budget is raised.**

---

## WHAT LANDED THIS SESSION, LOCALLY, NOT PUSHED

Pushes track main and deploy continuously, so all of this reaches production
on the next push. **That is Jon's call.**

**1. Job 1 — a dialogue tag is not an attribution (decision log 142).**
The freeze was taking 35 of 45 ordinary novel dialogue lines, because
seventeen of E-9's reportive verbs are also fiction dialogue tags. Two
identical stories differing only in their tags froze 0.0% and 33.6%; both now
freeze 0.0%. The E-9 essay is unchanged at 23.6%. Locked by a test that reads
the live cue pattern and fails if any verb on it has no dialogue line proving
it does not freeze a novel.

**2. Two freeze repairs, both found by running past 520 words for the first
time — the gap E-9 closed with.**

- **A block quote that opens a chunk was never frozen at all, silently.** Its
  indentation falls in the between-chunks separator, so the containment test
  missed it by four characters: never masked, never verified, never reported.
  4 of 18 block quotes rewritten on a 9,946-word essay, every run, while the
  run reported success. **The D4 pre-flight had already counted them as
  frozen and the customer had already paid on that number.**
- **The mask repair un-indented the block quote beside it**, turning a
  recoverable chunk into a refunded job.

**Suite: 809 passed, 1 skipped** (E-9 baseline 800 + 1).

---

## JOB 2 IS INCOMPLETE

Measured before the cap: `mistral-small` and `mistral-medium` across the full
ladder, 463 to 9,946 words, n=3 per rung. **`deepseek` has no ladder
measurement** — the cap landed on its first run. **All of it is on the
pre-fix engine except one run.**

**Model, recommended: stay on `mistral/mistral-small`.** 0 failures in 21
runs, 21.1s median at 9,946 words, and 7.5x cheaper than medium, which failed
genuinely once and showed no advantage anywhere.

**Word limit, recommended: 8,000, down from the advertised 10,000.** Latency
is set by waves of 8 parallel calls, not by words. 8,000 words is 3 waves;
10,000 is 4. **At the worst per-wave time this project has recorded in
production (~65s), 3 waves is 195s and fits inside the 240s abort; 4 waves is
260s and does not.** This is a number, not a sentence — **the copy is Lane
D's and was deliberately not written.**

---

## NEXT, IN ORDER

1. **Raise the key's budget** (blocking, Jon).
2. **Re-run the ladder on the corrected engine, including deepseek.**
   `python engine/lab/freeze_measure.py ladder`, read with
   `python engine/lab/ladder_report.py`. Written, tested, ready.
3. **Chase the second deterministic span shortfall** — `ladder_3000` returns
   87 of 90 spans in every run, identically. Same shape as the bug already
   fixed: silent and repeatable. Costs nothing to reproduce.
4. **Decide the hard-wrap question** (`06`): a hard-wrapped document gets no
   quote protection at all, silently.
5. **Recalculate `docs/03-pricing.md` §4b**, whose "no request can cost more
   than two cents" rests on a 60-second cap that `vercel.json` now sets to 300.
