# CURRENT HANDOFF

**Added at the top 6 September 2026, at the end of the `/how-it-works` rethink.**

**I did not rewrite this file, deliberately.** Everything below the rule is the
E-16 session's handoff from 24 August, it belongs to Lane A, and it still names
a blocking item (the AI Gateway key's budget) that I have no way to check from a
copy and layout session. **Wiping another lane's resumption context to make room
for mine is not a trade worth making.** If the gateway item is closed, whoever
closed it should delete that half.

---

## 6 SEPTEMBER, LATER: the arrival briefing. Committed locally. NOT pushed.

**Ruling: `04` entry 161. The research it rests on: `06`, "Anthropic's checker
is LIVE".**

A watermark briefing now meets every visitor to the home page who did not
arrive from a search engine. Four beats, one small animation, dismissible four
ways, once per visitor. **It does not push a purchase, it pushes a scan**, and
the CTA scrolls to the tool.

**★ THE THING TO UNDERSTAND BEFORE TOUCHING IT.** Google treats a mobile
interstitial shown on arrival from search as an intrusive interstitial, and it
is a ranking signal. **Two things keep this safe and both are load-bearing: it
never renders for a search referrer, and it renders nothing on the server.**
The search rule is in its own file, `search-referrer.ts`, purely so it can be
run: `node --experimental-strip-types` against it, 22 cases, all passing. **If
that file is ever inlined back into the component, the rule stops being
provable.**

**Proved:** homepage prerender unchanged at 1,264 words, `<h1>` intact, route
still `○`, and none of the briefing's copy in the crawlable HTML.

**★ TWO THINGS FOR JON.**

1. **`claude-band.tsx` now understates the case.** It says Anthropic's checker
   is "imminent". The file checker is live and free, and the text detector is
   in private preview. The briefing says the sharper version. **They should
   agree, and the band is the one that is wrong.**
2. **The messaging skill still says the detection API is "not callable yet".**
   That is a claims file and the rewording is his. `06`.

**Measurement is built in and it matters more than usual.** `briefing_shown`
and `briefing_dismissed` (with how it was closed and a bucketed dwell) exist
because this feature could plausibly halve conversions or double them. **The
search-suppressed traffic is a free control group.** If almost every dismissal
is a backdrop tap under two seconds, the honest response is to delete it.

---

## 6 SEPTEMBER: /how-it-works, split in two. Committed locally. NOT pushed.

**Full detail: `docs/session-notes/how-it-works-rethink.md`. The ruling is `04`
entry 160. The open questions are in `06`.**

**What landed.** The page is now three symmetric panels plus a new sequential
section, "How the rewrite works", carrying seven beats and two animations built
from CSS and React state with no new dependency. Panel 3 went from 1,189px to
610px. The four ENGINE_RULES cards dissolved into the sequence and nothing in
them was lost. The mobile "+" disclosure came off this page.

**★ THE ONE THING LEFT IS TEN SECONDS OF ATTENTION.** Bring a browser window to
the front, open `/how-it-works`, scroll to "How the rewrite works", and watch
whether the four numbered badges light 1, 2, 3, 4 on their own. **Autoplay on
entry is the only claim in this work that rests on reading rather than on
running**, and the reason is proven to be the environment: every browser
available to that session reported `document.visibilityState === "hidden"`, and
in that state **a freshly created IntersectionObserver on an element sitting in
the middle of the viewport fires nothing.** Pressing Replay runs the identical
code path and was proved twice.

**The page itself has been looked at**, through the connected Chrome, at 1296px
and at 500px, including the pipeline animation caught mid-sequence. The in-app
Browser pane never drew anything; `07-runbook.md` now has that whole failure
written up, including the workaround for measuring through it.

**★ THE SECOND THING, AND IT IS JON'S: THE PAGE IS TALLER.** 4,140px to 4,828px
on desktop and 5,553px to 8,103px on a phone, against an explicit "in less
space". Everything the brief called broken got smaller; the total did not,
because the page gained a section it did not have. **The cut I would make is
folding beat 6 into "Where proof stands"**, worth about 200px desktop and 350px
phone, and it costs the sequence its ending. `06` has the argument.

**Proved, from a real build:** route still `○ /how-it-works`, 1,456 prerendered
words against a 1,247 baseline, `<h1>` intact, and every word inside the
animated components present in the static HTML. `tsc --noEmit` exit 0. **The
August indexing failure did not repeat.**

---

## THE E-16 HANDOFF, 24 AUGUST 2026, LANE A. Left as it was.

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
