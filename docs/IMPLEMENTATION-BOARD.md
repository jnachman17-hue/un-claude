# THE BOARD — the one live to-do list

**Updated 24 August 2026.** `LAUNCH-CHECKLIST.md` and `POST-AUDIT-PLAN.md` are
**superseded**; this is the only file to update. **The conductor is its only
writer** — worker sessions write `docs/session-notes/<topic>.md`.

---

# ★★★ 24 AUGUST, 14:30 — JON'S QUESTION BROKE THE QUOTATION DETECTOR

**Jon asked how the tool can possibly tell a sourced quotation from invented
dialogue when both sit inside quotation marks. It largely cannot, and the
measurement below is the proof. This is E-16, and it outranks everything else
in Lane A.**

## Jon's two rulings this session

| # | Ruling |
|---|---|
| **D5 — CLOSED** | **Revert to `mistral/mistral-small`.** Deepseek is 8x slower, rewrites less hard in every measured cell, and failed 3 of 24 against mistral's 0 of 29. The freeze made deepseek's advantage redundant |
| **D6/E-8 — ORDERED** | **Measure the real word maximum and publish it.** The 10,000 on the pricing page is a config value nobody has verified. Nothing has ever run past ~520 words |

## ★★ E-16 — THE ATTRIBUTION CUE FIRES ON ORDINARY NOVEL DIALOGUE

**Run against the shipping detector, no model involved.**

**Test 1 — fourteen adversarial sentences.** 13 of 14 behaved as `uc_spans`
documents. The fourteenth is the tell:

```
"You always do this to me," she argued, slamming the door behind her.
    -> FROZEN
```

**Test 2 — one realistic novel sentence per verb in `_ATTRIBUTION`:**

```
FICTION DIALOGUE LINES TESTED: 20   (none should ever freeze)
WRONGLY FROZEN: 17
```

argued · warned · noted · observed · claimed · stated · declared · remarked ·
insisted · acknowledged · concluded · reported · asserted · maintained ·
contended · cautioned · emphasised — **every one of these is both a citation
verb and a standard fiction dialogue tag.** Only `said`, `asked` and `replied`
stayed free.

**Test 3 — the product-level number. Two stories, same length, same content,
differing ONLY in which dialogue tags the author chose:**

| Story | Words | Frozen |
|---|---|---|
| A — `said` / `asked` / `replied` | 124 | **0.0%** |
| B — `insisted` / `observed` / `argued` / `concluded` | 123 | **14.6%** (18 words, 4 quote spans) |

**Both are 100% invented dialogue. Neither should freeze one word.**

## ★ THIS ALSO UNDERMINES E-9's D2 DEMO — and nobody was being dishonest

E-9 section 5.3 reports the short story freezing **0 spans of 193 words** and
presents it as D2 working. **That result is real but not general: their test
story uses only `said`, `asked` and `replied`** — three of the four verbs the
detector excludes. **The demo passed because of the story's word choices, not
because the rule works.** Story B above is the same demo with different tags.

**Consequence, in D2's own terms:** invented dialogue is the MOST watermarked
text in a document — the model chose every word inside those marks. Freezing it
hands the customer back the most marked part untouched and charges for a
rewrite. **That is precisely the catastrophe D2's reasoning was written to
prevent, and the shipped cue walks into it whenever a novelist writes "she
insisted" instead of "she said".**

## ★ THE FIX I RECOMMEND — the subject of the verb, not the verb

**Academic attribution names a source. Fiction uses a pronoun.** Checked
against the samples above:

| | Subject | Sample |
|---|---|---|
| **All 17 false positives** | `she` / `he` | "she argued", "he concluded" |
| **All 5 true positives** | a named source | "Smith puts it", "Orwell wrote", "the 2019 review", "The committee concluded", "Acton observed" |

**17 of 17 fixed, 0 of 5 broken, on this sample.** So: **a reportive verb whose
subject is a bare pronoun is not attribution.** The citation-shape path stays as
an independent trigger, so `(Smith, 2019)` and `p. 47` keep freezing regardless.

**It also fixes the known epistolary false positive** — *«she wrote: "…"»* has a
pronoun subject and becomes free.

**Residual it accepts, and D2 says this is the cheap direction:** *«As she wrote
in her 1987 essay, "…"»* stops freezing, because a bare year is not a citation
shape. Being wrong toward free costs a few reworded phrases.

**NOT YET BUILT. The numbers above are the conductor's measurement, not a
session's. A session must build it, re-run all three tests, and add a fiction
corpus to the freeze suite.**

---

# ★★★ 24 AUGUST, 13:40 — PUSHED, DEPLOYED, AND VERIFIED LIVE

**Jon authorised the push. Seven commits, `99be2ea..b72b1aa`.** The push itself
triggered a production build — **confirmed: this repo is git-connected and every
push deploys.** That is the mechanism that put the freeze live by accident this
morning, and it is now written down.

## The same paste that failed 20 minutes ago, now on the live site

**Before (13:02, production):** *"The rewrite could not be completed."*
**After (13:38, production):** delivered. The artefact, not a measurement:

```
IN   ## Start Times and Attendance
     The committee met in March to consider the proposal, and delegates from
     eleven districts attended the session. As Smith puts it, "the change in
     start time did more for attendance than any intervention we had
     previously funded" (p. 47). The minutes were circulated the following
     week and no formal objection was recorded by any member of the review
     panel.

OUT  ## Start Times and Attendance
     The panel convened during March to weigh the plan, with representatives
     from eleven regions present at the gathering. In Smith's words, "the
     change in start time did more for attendance than any intervention we
     had previously funded" (p. 47). Those notes went out the next week, and
     not one person on the oversight board logged a formal complaint.
```

**The heading is character-for-character. The 17 words inside the quotation
marks are character-for-character. The attribution verb around it changed
("As Smith puts it" → "In Smith's words") and everything else is reworded.**
The receipt reported 69% replaced, 98% length kept, 2/2 figures carried.

**E-9 is closed. The freeze works on production.**

## ★ NEW LANE D ITEM — C-3 JUST GOT WORSE, and the freeze caused it

The live receipt now prints: **"The longest stretch of your original wording
left is 10 words in a row."** The site claims **a hard three-word ceiling**
(C-3, which was already wrong at 6). **It is now 10, and structurally so** — the
freeze deliberately returns whole quotations intact, so a frozen span is by
design a long unbroken run of the customer's words. **The three-word claim is no
longer merely inaccurate; the product is now built to violate it.** C-3 cannot
be fixed by re-measuring — the sentence has to change.

## ★★ THE MODEL: MY RECOMMENDATION IS GO BACK TO `mistral/mistral-small`

**The failure was OURS, not deepseek's, and it is fixed.** But the model
question is separate, and every axis I can measure now favours mistral —
**because the freeze did not exist when the bake-off ran.**

**Speed. 85 delivered runs, E-9's campaigns:**

| Model | median | worst |
|---|---|---|
| **mistral-small** | **3.9s** | **11.2s** |
| deepseek-v3.2 | **31.2s** | **191.5s** |

On the 517-word essay alone: mistral 4.7s median, deepseek 37.5s median and
**191.5s worst — 80% of the site's 240-second abort, on half a page.**
Production corroborates: 478 words took **64.982s**. This is not one bad hour;
it held across two independent measurement sets all day.

**Rewrite depth — and this reverses the bake-off's assumption.** Overlap on the
text that is NOT frozen (lower = more of the customer's wording actually
replaced = more of the job done), from `results.jsonl`:

| doc · arm | mistral-small | deepseek |
|---|---|---|
| essay · both | **0.0372** | 0.0885 |
| essay · structure | **0.0628** | 0.0846 |
| story · both | **0.0262** | 0.0838 |
| story · off | **0.0524** | 0.1518 |
| mask_heavy · both | **0.0000** | 0.0167 |

**Mistral-small rewrites harder in every single cell** — up to 3x more on the
story. Deepseek leaves more of the customer's original wording standing, which
is the opposite of what layer B is for.

**Reliability with the freeze on:** mistral-small **0 failures in 29** frozen-arm
runs; deepseek **3 in ~24** (one restore failure, two eight-attempt timeouts).

**Why the bake-off said the opposite, and why that is not a contradiction.** The
bake-off's case was *"deepseek avoids most of the defect list instead of needing
machinery to mask it — quotations mostly intact where the mistrals destroyed
every one."* **We then built the machinery. D1 ruled both tiers ship, E-9 shipped
them, and mistral-small returned 132 of 132 spans byte-exact.** The freeze
protects headings and quotations on ANY model, so deepseek's headline advantage
is now largely redundant — while its 8x speed penalty is not.

**What deepseek still uniquely offers post-freeze:** near-zero injected marks
(E-1's repair already handles this — 359 em dashes → 0) and zero fabricated
sources observed (partly covered, since reference entries now freeze).

**RECOMMENDATION: set `WATERMARKS_REWRITE_MODEL` back to
`mistral/mistral-small`, then re-run E-10's bake-off WITH THE FREEZE ON before
ruling.** The original bake-off answered a question that no longer exists.
**Also still outstanding: D5's open-weight licence check, never done.**

---

# ★★★ 24 AUGUST, 13:20 — DEEPSEEK IS LIVE, AND PRODUCTION IS FAILING A 64-WORD PASTE

**Jon authorised one real rewrite on production to read the live model. It
failed, and chasing the failure answered three questions at once.**

## 1. THE MODEL IS `deepseek/deepseek-v3.2`. Confirmed from production's own log.

`vercel logs un-claude.com` — a successful customer run at 19:25:23Z:

```
UC_USAGE {"endpoint": "clean", "ok": true, "words_in": 478, "words_out": 480,
          "seconds": 64.982, "layer_b_used": true,
          "layer_b_model": "deepseek/deepseek-v3.2",
          "layer_b": {"chunks": 2, "attempts": 4, "retries": 2, ...}}
```

**D5's switch is live.** Jon confirms he changed `WATERMARKS_REWRITE_MODEL`
only, not the key, and topped the gateway up separately.

**Note the second number: 64.982 seconds for 478 words** — against the
interface's own promise, *"This can take about 10 seconds."* The site aborts at
240. **A Lane D item and an E-8 ceiling input, both created by the switch.**

## 2. ★ THE LIVE RUN FAILED — the real customer path, on an ordinary paste

64 words, one heading, one attributed quotation, driven through the actual
interface as an anonymous guest. The visitor saw:

> **"The rewrite could not be completed. Nothing was charged. Please try again."**

```
UC_USAGE {"endpoint": "clean", "ok": false, "code": "layer_b_failed",
          "words_in": 64, "seconds": 16.778,
          "layer_b": {"chunks": 1, "attempts": 2, "retries": 1,
                      "model_calls": 2, "cost_usd": 0.00020118}}
```

**Two honest positives inside the failure:** the customer was *not* charged, so
D3's refund path works on production; and the blind attempt plus one informed
retry is exactly the bound Lane A ruled.

## 3. ★★ THE A/B THAT SETTLES IT — the unpushed commit is the fix

The log does not say *why* it failed, and the answer decides whether the push
is the fix or deepseek simply has to go. **So I ran both versions against the
same document, on deepseek, through the live gateway, minutes apart.**

`origin/main` is `99be2ea`. `efff100` (the informed retry) **is** an ancestor of
it — live. `4288e95` (`_reinsert_lost_masks`) **is not** — not live. I copied
`apps/web/engine` and checked out `origin/main`'s `uc_chunk.py` and
`uc_freeze.py` over it, so one copy is byte-for-byte what production runs.

```
PRODUCTION CODE (no reinsertion repair) — 5 runs, deepseek, freeze ON
  run 1: FAILED  FreezeRestoreFailed: 64 of 64 words came back unrewritten…
  run 2: FAILED  FreezeRestoreFailed: 64 of 64 words came back unrewritten…
  run 3: FAILED  FreezeRestoreFailed: 64 of 64 words came back unrewritten…
  run 4: FAILED  FreezeRestoreFailed: 64 of 64 words came back unrewritten…
  run 5: FAILED  FreezeRestoreFailed: 64 of 64 words came back unrewritten…

LOCAL CODE (with the unpushed repair) — 5 runs, same document, same model
  run 1: DELIVERED  heading_intact=True quote_intact=True retries=0 fallbacks=0
  run 2: DELIVERED  heading_intact=True quote_intact=True retries=0 fallbacks=0
  run 3: DELIVERED  heading_intact=True quote_intact=True retries=0 fallbacks=0
  run 4: DELIVERED  heading_intact=True quote_intact=True retries=0 fallbacks=0
  run 5: DELIVERED  heading_intact=True quote_intact=True retries=0 fallbacks=0
```

**0 of 5 against 5 of 5. Not intermittent — deterministic for this document
shape on this model.** `64 of 64 words` is the single-chunk case E-9's note
names: one chunk, so any fallback is 100%, so it always refunds.

**Conclusion: the five unpushed commits are the fix, and the fix is proven.**
The push is no longer housekeeping — **production is deterministically failing
a short heading-plus-quotation paste until it happens.**

## 4. What this changes on the board

- **PUSH IS NOW THE TOP ITEM.** Not "maybe we push."
- **D5 is answered by accident: deepseek is already live.** It was not ruled in; it was switched on. Post-push it delivers 5 of 5 on this shape, so the switch is survivable — **but 65 seconds for 478 words is unresolved and belongs to E-8/D6.**
- **The open-weight licence check D5 required has still not been done.**
- **New Lane D item (C-14):** the interface says *"about 10 seconds"*; production measured 65.

---

# ★★★ 24 AUGUST, 12:55 — E-9 VERIFIED BY THE CONDUCTOR

**E-9 is complete and its note is honest.** I re-ran or recomputed every
headline number from its raw logs rather than reading its summary. **It also
found and fixed the defect I flagged at 12:10, and credited it.**

## What I verified by running it

| Claim | How I checked | Result |
|---|---|---|
| Suite `800 passed, 1 skipped` | `.venv/bin/python -m pytest` | **CONFIRMED — 800 passed, 1 skipped in 16.40s** |
| Tests cover the DEPLOYED tree | `test_freeze.py:27` → `SCRIPTS = ROOT.parent/"apps"/"web"/"engine"` | **CONFIRMED.** The lab tests import the shipping code, not a copy |
| "132 of 132 spans byte-exact" | Summed `spans_verbatim` in `results.jsonl` | **CONFIRMED — 6/6×7 + 11/11×6 + 3/3×8 = 132.** Exact |
| "Zero chunk fallbacks" | 48 rows scanned | **CONFIRMED — 0 rows with fallbacks** |
| Reinsertion repair: 14/14, 84/84, 0 retries | `reinsert_check_mistral.jsonl` | **CONFIRMED — 14 runs, 0 failures, 0 fallbacks, 84/84 spans, 0 retries** |
| Five named tests exist | grep | **CONFIRMED**, all five |
| The repair is committed | `git show HEAD:…uc_chunk.py` | **CONFIRMED** — `_reinsert_lost_masks`, commit `4288e95` |

## The one number I could NOT verify

**"The repair engaged in 3 of 6 runs, reinserting 9 deleted placeholders."**
`freeze_measure.py:238` writes `masks_reinserted`, but **no saved row on disk
carries that field** — `reinsert_check_mistral.jsonl` has no such key. Those
instrumented runs appear to have gone to console only. **The claim it supports
(14/14 delivered, 84/84 spans) IS verified; the mechanism-was-exercised
evidence is not on disk.** Not a defect — a gap in the record.

## ★ THE MODEL: I COULD NOT VERIFY IT, AND HERE IS EVERY DOOR I TRIED

Jon changed something in Vercel and asked whether deepseek is live. **Unproven.**

- `vercel env pull --environment=production` → `WATERMARKS_REWRITE_MODEL="[SENSITIVE]"`. Marked sensitive; the CLI will not decrypt it. *(Pulled file deleted immediately.)*
- Vercel MCP `get_runtime_logs` → **403 Forbidden**, as did `list_deployments`
- `vercel logs un-claude.com` → last 100 lines are page requests. **No rewrite has run on production recently**, so `layer_b_model` appears nowhere
- `run_costs` records `cost_usd` and `model_calls` but **not the model name** (migration `20260823120300`), so the ledger cannot answer it either

**The only remaining probe is one real rewrite on production** — `layer_b_model`
is in `_shared.py`'s `_PUBLIC_FIELDS`, so a run returns it. Costs 1 credit and a
fraction of a cent. **Not run: it writes to the live database, so it is Jon's
call.**

**Two facts that matter more than the answer:**
1. **A Vercel variable changes nothing until the next deployment.** Deploys have been continuous, so a change made this morning is almost certainly in effect — but "almost certainly" is not verified.
2. **`WATERMARKS_REWRITE_MODEL` and `WATERMARKS_REWRITE_API_KEY` are different variables.** Changing the key does not change the model. The gateway balance moved $5.44 → $15.39, which reads like a top-up, not a model switch.

## ★ D5 SHOULD NOT SWITCH TODAY — E-9's own final campaign says so

Recomputed from `results.jsonl` (48 rows, campaign 2, the post-fix record):

| Model | Frozen-arm failures |
|---|---|
| **mistral-small** | **0** |
| **deepseek-v3.2** | **3** — one `FreezeRestoreFailed` refunding a whole job, two `chunk failed after 8 attempts: TimeoutError` |

Plus `reinsert_check_mistral.jsonl`: **mistral-small, 14 more runs, 0 failures.**
**So mistral-small is 0 failures in 29 frozen-arm runs; deepseek is 3 in ~24.**
E-9 section 5.6 adds deepseek's latency today: median 26.1s, max 74.2s on a
2-chunk run, against the bake-off's 3.1s and the site's 240s abort.

**One day, one region — but the bake-off that recommended deepseek did not
measure it with the freeze on. This did.**

## ★ MY EARLIER RECOMMENDATION IS WITHDRAWN

At 12:10 I recommended switching the freeze OFF in production. **E-9's fix
lands the numbers somewhere else, so that is no longer my advice.** The freeze
should stay on and **the five unpushed commits should be pushed**, because the
reinsertion repair is the thing that turns the live failure rate into the
measured one. Production today has the freeze WITHOUT its fix.

---

# ★★★ 24 AUGUST, 12:10 — THE CONDUCTOR WAS WRONG ABOUT THE DEPLOY, AND THE FREEZE IS LIVE

**Everything in this block was RUN, not read. Three of these correct the handoff.**

## 1. "Nothing is deployed" is false. There have been ten production deploys.

`npx vercel ls --prod`, 24 Aug 12:08 — ten Production deployments **Ready** in
roughly the last ninety minutes, the most recent **five minutes ago**:

```
5m  ● Ready  Production   un-claude-recobr1t7
7m  ● Ready  Production   un-claude-dq75e7rur
37m ● Ready  Production   un-claude-1lm40kpjp
58m ● Ready  Production   un-claude-ndhn8v05l
1h  ● Ready  Production   (six more)
```

`git status -sb` says **`main...origin/main [ahead 1]`** — everything except the
last E-9 commit is pushed. Confirmed on the live site: `/contact` and `/pricing`
serve **`support@un-claude.com`** and no gmail address anywhere.

**So the handoff's "immediate sequence" — *E-9 lands → verify → deploy, the
deploy is the unlock* — describes a blocker that does not exist.** The route
session's cost leak, CJK, the address and the analytics funnel are all live.

## 2. ★ E-9's freeze is LIVE IN PRODUCTION while E-9 is still measuring it

**Proved by a free scan against `https://un-claude.com/api/tool/scan`** — no
login, no model call, no credit. A 119-word probe document came back with:

```json
"billing": {
  "credits": 1, "words": 119,
  "freeze": { "fraction": 0.2269, "frozen_words": 27,
              "spans": { "heading": 3, "quote": 1, "reference": 1 } }
}
```

`uc_freeze.py` defaults `UC_LAYER_B_FREEZE` to `"1"` and `UC_FREEZE_TIERS` to
`"structure,quotes"`, and **`vercel env ls production` contains no
`UC_LAYER_B_FREEZE`**, so the default stands: **the freeze is on, both tiers,
for real customers, right now.**

**E-9 is still running.** `engine/lab/freeze_runs/campaign2.log` was written at
12:04 and `lab/freeze_measure.py` is a live process. **A deploy shipped the
working tree while a session had unfinished engine work on disk — the exact rule
the handoff states.**

## 3. ★ E-9's OWN live campaign records the freeze failing whole jobs

64 recorded runs across two campaigns, **$0.0192 total**. Five failures. **Four
are the identical arithmetic, on both models and both tiers:**

```
FreezeRestoreFailed: 339 of 517 words came back unrewritten because protected
spans could not be restored verifiably (66%, past the 33% threshold); the job
fails rather than deliver this as a rewrite
```

| Document | Freeze | Failures |
|---|---|---|
| essay | **off** | **0 of 16** |
| essay | structure | **3 of 16** |
| essay | both | **2 of 12** (one a timeout) |
| story / mask_heavy | on | 0 of 14 |

**The cause, confirmed in the code that produced the number.**
`uc_chunk.py:798` records a fallback as `{"chunk": i+1, "words":
count_words(chunks[i])}` — **the whole chunk's words, not the frozen span's** —
and `enforce_refund_threshold` compares that sum against the whole document.
Chunks target **350 words** (`TARGET_WORDS`).

**Therefore: in any document under roughly 1,050 words, one chunk falling back
is automatically past the one-third threshold and refunds the entire job.** On
the measured essay the structure tier freezes **3.3%** of the words — six
headings — and a single restore hiccup returns **66%** and fails everything.

The function's own docstring says *"One chunk falling back is handed back and
explained, no refund — the customer received the work."* **The arithmetic
contradicts the docstring on every document under four chunks.** A college essay
is 500–1,500 words: this fires on the core customer.

**This is the third time a guard would have fired on good work.** Unlike the
first two it was caught by measurement before anyone complained — but it is live
while being caught. **DECISION OWED BY JON: see the top of the session.**

## 4. M-6 — step 2's failure branch is RULED OUT

`apps/web/vercel.json` carries `"app/api/tool/clean/route.ts": {
"supportsCancellation": true }`, and **ten production builds went Ready with it
in place.** So the build did not reject the `functions` pattern for an App
Router route, and the board's instruction to *"take the two lines out"* does not
apply. **Step 3 — the free `verify-connection-drop-refund.mjs` run — is now the
open question and is unblocked.**

---

# ★★ WHERE THINGS STAND — 24 AUGUST

**Migration 5 applied and DEPLOYED by Jon. Lanes B, C and E are live.**

**Verified in production by the conductor:**
```
x-frame-options            DENY
x-content-type-options     nosniff
referrer-policy            strict-origin-when-cross-origin
permissions-policy         camera=(), microphone=(), geolocation=()
content-security-policy    absent — deliberately, see Lane E
/favicon.ico               200      (was 404, and was 97% of the log)
```
*Migration 5's lockdown was not verified by the conductor — the probe returned a
malformed-request 400 rather than a permission answer. Applied per Jon.*

**So three lanes of fixes are now real.** The refund clamps to the payment and
writes the shortfall down, free credits are once per inbox, the header count
tells the truth, the file-size message can fire, the redirect is closed.

## Verified in production after the deploy — Lane B re-ran them

| Check | Result |
|---|---|
| Free credits once per inbox, **through the real route** | **PASS.** 5, 0, 0 across three rounds driving the live site with a real session. **It was 5, 5, 5 that morning** |
| The run-cost writer | **PASS.** The first `run_costs` row this product has ever written. **The privacy policy has claimed this since it was written; as of that row it is true** |
| A delivered job is charged and not refunded | **PASS on production.** So the dangerous failure — everything refunding — is ruled out |
| **A dropped connection refunds** | **FAIL. See M-6 below** |
| Wallet pagination against real rows | still unproven |
| The webhook end to end | still unproven |

## ★ M-6 IS INERT ON VERCEL — the fix shipped and does nothing

Measured on production minutes after the deploy, connection dropped at 3s:

```
250 credits taken, nothing delivered, no refund — exactly as before.
run_costs row written for that spend, which proves execution REACHED the
refund check. request.signal.aborted was simply false.
```

**The code is dead, not wrong.** Vercel request cancellation is **opt-in**:
`request.signal` only ever aborts for functions declaring `supportsCancellation`
in `vercel.json`. **Confirmed by the conductor** — `apps/web/vercel.json` has a
`functions` block covering `api/*.py` **and nothing else**, and the clean route
is an App Router handler at `app/api/tool/clean/route.ts`, outside that glob.

**Why Lane B did not just switch it on, and all three reasons are good:**
1. `vercel.json` was not that lane's file.
2. **It is not established the switch can even reach an App Router route** —
   Vercel's own examples target `api/**` and `pages/api/**`.
3. Vercel warns work after a disconnect may not complete without `waitUntil`,
   which needs `@vercel/functions` — **a dependency, so Jon's call.**

**The experiment is cheap: one config entry, one deploy, one re-run of a script
that already exists and costs nothing** (a paste the engine refuses for free).
If the refund row appears, no dependency is needed. If not, `waitUntil` is the
next question. **BLOCKED: a deploy would ship Lane A's in-progress engine edits.
It waits for a quiet tree.** `06` row 89.

# ★ LANE STATUS

| Lane | State | What is left |
|---|---|---|
| **B — money** | **5 of 6 live and verified. M-6 is inert** | **M-6: one config entry + a deploy + a free re-run, blocked on a quiet tree** · the privacy sentence, owed |
| **C — workbench** | **10 of 10 DONE AND LIVE** | Verify pagination against real rows · three handoffs, below |
| **E — security** | **4 of 5 DONE AND LIVE** | **CSP still open** — needs a per-request nonce · **S-5 belongs to Lane A** |
| **A — engine** | **ALL SIX STEPS DONE.** Not deployed | A model switch (Jon) · E-12 · the freeze · a deploy |
| **D — copy** | **briefed, not started** | Seven wording fixes. The four enforcement promises are now unblocked by Lane A's measurements |

## What each lane could NOT prove — carry these forward

- **B:** the webhook was never exercised end to end; `refund_purchase` was called
  directly. M-2's *site* path, M-4's writer and M-6's fix are all **in code that
  is not live**, so three fixes are unproven in production.
- **C:** **no screen reader was run** — W-8 is markup and computed tree only. The
  wallet was **never opened as a real signed-in customer** (no local Supabase),
  so the pagination query has not run against real rows. W-1's spend used a
  **stubbed** reply, so no real credit moved.
- **E:** the tool could not be exercised locally at all — `UC_ENGINE_URL` points
  at a Python engine that was not running.

## Handoffs the lanes raised for each other

| To | What |
|---|---|
| **Lane E** | `/auth/sign-in` still has no `main` landmark and no skip link — the tenth page in the audit's table, the only one Lane C could not reach |
| **Lane B** | The "words cleaned" counter can be made real by summing `words_in` on the ledger. Needs a route Lane B owns, and gives the counter back the motion W-7 cost it |
| **Lane D** | The pricing page says *"One Word document or picture, any size."* The browser now refuses at 3.2 MB **with a message naming the number.** Direct contradiction |
| **Lane A** | **Our cost per run is sent to every browser.** `api/_shared.py` carefully keeps cost out of `usage`, then the same figures ride along inside `report.layer_b.usage`, which `strip_server_paths` does not touch. Anyone can open the network tab and read what a run costs us |
| **Lane A or Jon** | **S-5's real home is `engine/score_stylometry.py`, not the workbench.** The conductor's brief named the wrong file. Lane E audited it anyway and **found more than one bad phrase** |

---

# ★ CONDUCTOR'S CORRECTIONS TO ITS OWN WORK

- **Lane E's brief pointed at the wrong file for S-5.** The AI-marker list is in
  `engine/score_stylometry.py`, which that lane's territory explicitly excluded.
  The session did the audit half anyway and handed back measurements. **The error
  cost a fix; the finding survived.**
- **The analytics finding was wrong** (recorded earlier): a probe that could not
  have detected what it ruled out.

---

# ★ PART 1 — DECISIONS — ALL SETTLED 23 AUGUST

| # | Decision | **JON'S RULING** |
|---|---|---|
| **D1** | Ship the quotation freeze, or only the cheap structure tier? | **SHIP BOTH.** Cost is not the question. |
| **D2** | A quoted run with no attribution cue — freeze it or leave it? | **FREEZE ATTRIBUTED, LEAVE UNATTRIBUTED FREE** — and the reasoning is Jon's, not the workflow's. See below. |
| **D3** | When the freeze fails: refund, or hand back the chunk unrewritten? | **BOTH — hand back the chunk, explain, and refund — WITH A THRESHOLD.** One chunk failing: hand back and explain, no refund, because they received the work. A meaningful share failing: refund the job. Without the threshold, a customer who can reliably trip the freeze gets nine-tenths of a rewritten document *and* their money back — the same free-tier shape as the mintable credits. **Explain in every case. CHANGES `04` entry 22.** |
| **D4** | Tell the visitor what fraction will be frozen before they pay? | **YES, with a Continue/Cancel, and a louder prompt above 60%.** Wording below. |
| **D5** | Which model? | **DECIDE AFTER THE ENGINE LANE SHIPS. OPEN-WEIGHT ONLY** — no frontier models. **But the field tested was too narrow**: six models, four completing, all picked when cost was the constraint. Capability is the constraint now. **A wider bake-off is its own item — see E-10.** |
| **D6** | The advertised size ceiling | **Do not set the number yet.** W9 measured 6,000 completing at 196s against a 240s cut-off and 7,500+ failing — **but W10's chunk fix took one document 61% cheaper and job failures from 2-of-8 to 0-of-8.** Ship E-3, re-measure, then publish. |
| **D7** | `support@un-claude.com` on the site | Waits on the forwarding test email arriving. |

## D2's reasoning, in Jon's terms — record this in `04`

**A statistical watermark is embedded through the model's word choices.** That
signal can only exist where the model had a choice.

**Inside a genuine quotation the model had no choice** — it reproduced fixed text
from a source. So there is little or no watermark there to begin with, and
freezing it costs almost nothing real. The trigram number rises; what it measures
in those spans is largely irrelevant. **This is a stronger argument for the freeze
than the cost-benefit one the workflow made.**

**It inverts for invented dialogue.** Ask a model for a short story and it chooses
every word inside the quotation marks — full discretion, so that dialogue is
watermarked like the narration, arguably more, since dialogue is where a model's
tells concentrate. **Freezing it hands back the most watermarked part of the
document untouched, and charges for a rewrite.**

**So the test is: did the model have discretion over these words?** The attribution
cue ("Smith wrote", "according to") is the machine-readable proxy for *these words
came from outside*. Not a guess about importance.

## D4's exact wording — do not improvise it

> **We will return about 42% of this document exactly as you sent it.**
> That's text we've protected from being reworded — quotations, references and
> similar — so it comes back character for character. The other 58% gets the
> full rewrite.
>
> **Continue** · **Cancel**

**Two things it must NOT say.** Not *"to keep quotations verbatim"* — the machine
knows what it froze, not that it found a quotation, and the Sources latch would
have said that about an essay containing none. And **not that it reduces watermark
removal** — by D2's own reasoning the frozen spans carry little watermark, so that
warning understates the product, and it is unprovable in either direction anyway.
**Layer B is unverifiable; that cuts both ways.**

# ★ PART 2 — THE LANES

## LANE A — ENGINE. The biggest, and it has hard internal sequencing.
**Territory:** `apps/web/engine/**`, `apps/web/api/*.py`
**Blocked by:** nothing — D1–D5 are settled. **One session at a time — never parallel inside this lane.**

| ID | Work | Source | Note |
|---|---|---|---|
| **E-0** | **The safety net, before any other code.** `test_spans.py`: split every test document and reassemble it **with no model involved**, assert byte-identical. | W10 phase 0 | One agent's version passes 52/52 and caught a failure a substring count cannot see. |
| **E-1** | **REPAIR — free, and it fixes the AI tell the product exists to remove.** Strip markdown the customer never typed, restore their straight apostrophes and hyphens, put digits back where the model spelled a year out. | W10 phase 1 + **W9 1b** | Measured over 228 real outputs: curly apostrophe 819→0, markdown asterisk 644→0, em dash **359→0**. Cost: median **+0.0000**. **A tool that removes AI watermarks and then inserts 359 em dashes is undoing its own job.** |
| **E-2** | **REPORT — free, changes no output.** Ship the detector and five checks with the freeze **OFF**, nothing raising. | W10 phase 2 | First real measurement of how often a *customer's* quotation is rewritten. Every number so far comes from documents the agents wrote themselves. |
| **E-3** | **FIX — six things provably wrong today.** Move the invisible-character pass **before** the rewrite; word counting for Chinese/Japanese/Thai; four number-reader bugs; never end a chunk on a lone equation/table; stitch torn code fences; bound every new retry at one. | W10 phase 3 | **Today the rewrite runs first and destroys zero-width characters as collateral, so layer A reports removing nothing from a document that arrived carrying two.** The chunk fix alone: 61% cheaper, job failures 2/8 → 0/8. |
| **E-4** | **The output guard.** Reject a result opening with a line about rules, or carrying a bare `---` the input never had. Refund rather than return it. | **W9** | **The prompt leak is NOT closed** — 3 runs in 7 still return the model discussing its own rules. Same defect as the stray divider. |
| **E-5** | **Don't charge for a rewrite that didn't run.** Under 16 words, and for a whitespace-only box, the customer pays and the panel says "Rewritten · Measured, not estimated" with 0% replaced. | **W9** | Interface half is LANE C. |
| **E-6** | **Honest length + loss reporting.** Documents come back 6–14% longer reported as "Length 114% kept"; on repetitive text **22–29% silently deleted**. | **W9** | Pairs with E-7. |
| **E-7** | **Surface `structure_kept`.** The engine already computes it and **no file anywhere reads it.** | W10 rank 13 | *"The engine knew the equation had been deleted and told nobody."* |
| **E-8** | **Re-measure the ceiling and publish an honest number.** | W9 + D6 | After E-3. |
| **E-10** | **A wider open-weight bake-off.** Enumerate what the gateway actually offers and test credible candidates against W10's existing harness. **Measure timeouts (2 of 6 timed out last time) and SPEED — the ceiling is time, not money, so a better-but-slower model shrinks the document size that can be served.** After E-3. | D5 | Open weights only. |
| **E-9** | **FREEZE — its own session, and NOT YET.** Masking machinery: tolerant restore, mask numbers via the engine's own number reader, verify step, per-chunk masking and fallback. | W10 phase 4 | **See PART 3. This does not ship on the numbers the plan published.** |

## LANE B — MONEY. Start first. The only lane losing real money today.
**Territory:** `lib/server/credits.ts`, `app/api/stripe/**`, `app/api/checkout`, migrations
**Blocked by:** nothing.

| ID | Work | Note |
|---|---|---|
| **M-1** | **The refund is wrong in BOTH directions and one change fixes both.** Refund a purchase while another sits unused → it takes **the other one's** credits. Refund a spent purchase → full money back, almost nothing recovered, shortfall recorded nowhere. **Clamp against what remains of *that payment*, and write the shortfall down.** | **CRITICAL.** Real money, ordinary path, live today. |
| **M-2** | **Free credits are mintable on repeat.** Delete the account, sign up again on the same address, collect five more, forever — the dedupe record lives on the ledger and the deletion cascade takes it. Key it to something deletion does not touch. | **HIGH.** No ceiling on cost. |
| **M-3** | Mint the grants at signup, so a new wallet doesn't read "0 credits · Get credits". | MEDIUM |
| **M-4** | Write the cost column the privacy policy already promises is stored. | MEDIUM |
| **M-5** | The refund tool tells Jon money is owed on a payment already refunded in full. | HIGH |
| **M-6** | A dropped connection charges the customer and does not refund. | MEDIUM |
| — | **Any migration goes to Jon to apply. Nobody else applies migrations.** | |

## LANE C — WORKBENCH AND WALLET.
**Territory:** `_components/workbench/**`, header, wallet, `app/home/**`
**Blocked by:** nothing. **Coordinate with E-5/E-7 at merge.**

| ID | Work |
|---|---|
| **W-1** | Header credit count frozen at page load, disagrees with the chip (6d) |
| **W-2** | Header credit chip wraps onto two lines (6e) |
| **W-3** | Move the file-size check into the browser at ~3.2 MB — **the polite message already written can never fire**, Vercel rejects the upload first |
| **W-4** | Credit check runs before the file check, so a customer is told to pay for a job that will then be refused |
| **W-5** | Wallet renders every ledger row, no pagination — 82 rows is already 210 KB |
| **W-6** | Credit history prints UTC dates, so the Americas see tomorrow |
| **W-7** | "Words cleaned" counter goes backwards on reload |
| **W-8** | Accessibility: `role="status"` on working/finished/failed, a name on the paste box and file input, a `<main>` landmark, a skip link |
| **W-9** | Per-page share tags — nine pages, one line each |
| **W-10** | Show the short-paste skip reason, and the pre-flight freeze percentage (D4) |

## LANE D — CLAIMS AND COPY. Cheapest work here, and it protects what the site is sold on.
**Territory:** `app/(marketing)/**` copy, FAQ, legal pages. **NOT the workbench.**
**Blocked by:** nothing. **Loads `unclaude-messaging`.**

| ID | Work |
|---|---|
| **C-1** | Four "enforced rather than promised" FAQ claims — **three fail against the product's own receipt** |
| **C-2** | "Upload a file and you get all three" — no accepted type gets all three |
| **C-3** | "A hard three-word ceiling" — the site's own receipt printed **6** |
| **C-4** | "100% of detectable marks removed" — 15 found, 12 removed, 3 kept on purpose |
| **C-5** | "Nine classes checked" — one of the nine finds nothing |
| **C-6** | News logos: a link behind them, or take them down |
| **C-7** | Account-deletion warning names teams and subscriptions that don't exist, never mentions credits |
| **C-8** | `support@un-claude.com` everywhere (4 files) — **waits on D7** |
| **C-9** | The advertised size ceiling — **waits on D6 and E-8** |

**Every fix here brings a claim DOWN to what is true. None goes up.**

## LANE E — SECURITY AND INFRASTRUCTURE.
**Territory:** `app/auth/**`, `proxy.ts`/middleware, headers config
**Blocked by:** nothing.

| ID | Work |
|---|---|
| **S-1** | **Open redirect** — any `un-claude.com` link can land a visitor on any site, signed out. One condition on `/auth/callback`. Skeptics downgraded it to medium *because the domain is days old* — **which is exactly why it is cheap now** |
| **S-2** | Five of the six standard browser security headers absent, including on sign-in |
| **S-3** | Three different auth failures all say "please ensure you have a working internet connection". Two real cases and a **Resend it** button |
| **S-4** | `/favicon.ico` 404s — **97% of the production log is that one error**, making the log unreadable |
| **S-5** | The scanner's AI-marker list fires on the three ordinary words "in the world" |

---

# ★ PART 3 — WHAT MUST NOT SHIP YET

**E-9, the freeze, does not ship on the numbers W10 published.** Its own
adversarial verifier broke it with a false positive bad enough to destroy a
document.

**The "Sources" latch.** The detector treats any line reading *Sources*,
*References*, *Bibliography* or *Works cited* as the start of a reference list
**and never stops** — from there to the end of the document, every paragraph of
five words or more is frozen.

A 221-word history essay whose only unusual feature was a section headed
"Sources" containing **ordinary analytical prose** came back **56.1% frozen**,
delivered at 0.55–0.58 trigram overlap, **12 of 12 runs.** The customer pays for
a rewrite and gets their own essay back.

**And a second, structural one.** Both masking designs put the customer's real
text back *before* the engine's existing guards run — but those guards are handed
**the masked chunk**. Against the committed code, a flawless rewrite produced
`FactsLost` (complaining about the mask number itself) and a mask-heavy chunk
produced `LeakSuspected` → retry → **fail the job and refund a customer whose
rewrite was perfect.** **That is the W8 mistake exactly: a guard that fires on
good work.**

---

# ★ PART 4 — WHAT NOBODY CAN SOLVE

**Stated plainly so it never gets promised.**

- **Whether a statistical watermark was removed is not measurable** — not here,
  not by anyone. Every number in W10 measures *how much of the original wording
  came back*. **Layer B stays best effort.** This is the site's existing position
  and nothing found changes it.
- **Rank 4 — a technical term, hedge or legal standard restated wrongly.** *"Beyond
  a reasonable doubt"* survived **1 of 40 runs**, coming back as *"with absolute
  certainty"* — the opposite of the rule. **Not findable by a program**, and the
  customer cannot see it.
- **Rank 10 — invented facts and sources.** 19–23 of 149 runs. Not findable.
- **Rank 2's actual fix is not in the plan** — only the report. *"Sixty years"* →
  *"sixty decades"* still passes the fact guard afterwards, because `60` is still
  in the text and that is all the guard checks.
- **Nothing in W10 ran past 2,172 words or 8 chunks**, while a 10,464-word
  document is 34 chunks. **Mask loss at that size is unknown and must not be
  assumed to scale linearly.**

---

# ★ PART 5 — SEQUENCING

**Now, in parallel — three lanes, no shared files, no decisions needed:**
**LANE B (money, start first)** · **LANE D (claims)** · **LANE E (security)**

**Also now:** LANE C, if you want a fourth running.

**Then, once D1–D5 are ruled:** LANE A as a single session, in order
**E-0 → E-1 → E-2 → E-3**, then re-measure for D6/E-8.

**Then, and only then:** E-9 in its own session, with the Sources latch and the
guard-ordering defect fixed first and re-verified.

**Rationale:** E-1 is free, ships immediately, and fixes the defect where the
product inserts the very marks it exists to remove. E-2 costs nothing and tells
us for the first time how often this happens to real customers. Both land before
anything spends a point of rewrite aggressiveness.

---

# ★ EVERYTHING STILL OUTSTANDING — 24 August

**Roughly 36 items. Two lanes untouched, plus stragglers.** Lanes B, C and E
between them closed 20; none of what follows was touched by them.

## LANE A — ENGINE. Untouched, largest, and it owns the worst defects.
**One session at a time, in order.** D1–D5 are settled, so it is unblocked.

| ID | Item | From |
|---|---|---|
| **E-0** | The reassembly safety net, before any other code | W10 |
| **E-1** | **REPAIR — strip the AI tells the tool itself adds.** 359 em dashes → 0 across 228 real outputs, at median **+0.0000** cost | W10 + W9 |
| **E-2** | **REPORT — detector on, freeze off.** First measurement of how often a *real customer's* quotation is rewritten | W10 |
| **E-3** | **FIX — six things provably wrong**, including running layer A **before** the rewrite. Today the rewrite destroys zero-width characters first, so layer A reports finding nothing in a document that arrived carrying two | W10 |
| **E-4** | **The output guard.** The prompt leak is **not closed** — 3 runs in 7 return the model discussing its own rules | W9 |
| **E-6** | Honest length and loss reporting — "114% kept" while 22–29% is silently deleted | W9 |
| **E-7** | **Surface `structure_kept`.** The engine computes it and **no file anywhere reads it** | W10 |
| **E-8** | Re-measure the ceiling and publish an honest number (D6) | W9 |
| **E-10** | The wider open-weight bake-off (D5) | W10 |
| **E-11** | **S-5 — the AI-marker list flags "in the world".** Lane E found the real file is `engine/score_stylometry.py` and **found more than one bad phrase** | W9 + Lane E |
| **E-12** | **Our cost per run rides to every browser** inside `report.layer_b.usage`, which `strip_server_paths` does not touch | Lane B |
| **E-13** | A failed attempt burns 6–21 cents of model spend and the error invites a retry | W9 |
| **E-14** | A date vanished and the field designed to flag it came back empty | W9 |
| **E-9** | **FREEZE — LAST, and not on the published numbers.** See PART 3 | W10 |

## LANE D — COPY AND CLAIMS. Untouched. Split in two.

**D-NOW — wording only, ship any time:**

| ID | Item |
|---|---|
| **C-4** | "100% of detectable marks removed" — 15 found, 12 removed, **3 kept on purpose** because stripping Arabic/Hebrew direction marks would corrupt real documents. **The engineering is right; the sentence is wrong.** The honest version is a better line |
| **C-2** | "Upload a file and you get all three" — no accepted type gets all three |
| **C-7** | The delete-account warning names teams and subscriptions that do not exist, and never mentions credits |
| **C-10** | The pricing page says *"One Word document or picture, any size"* — **the browser now refuses at 3.2 MB with a message naming the number.** Direct contradiction, created by Lane C |
| **C-11** | The pricing page quotes 1 credit for a file and charges 5 |
| **C-12** | A Word document is told "the picture itself is untouched" |
| **C-13** | **The privacy sentence, now genuinely owed** — `POLICY-CHANGES-PENDING.md`. Migration 2 changed what is retained |

**D-AFTER-ENGINE — cannot be written honestly until Lane A lands:**

| ID | Item |
|---|---|
| **C-1** | The four "enforced rather than promised" FAQ claims — **three fail against the product's own receipt.** Most of this is not fixable by rewording; *"it will not change your facts"* cannot be softened into something both true and worth saying |
| **C-3** | "A hard three-word ceiling" — the receipt printed 6 |
| **C-5** | "Nine classes checked" — one of the nine finds nothing |
| **C-9** | The advertised size ceiling (D6) |

## STRAGGLERS — no lane owns these yet

| ID | Item | Note |
|---|---|---|
| **X-1** | **CSP** | Needs a per-request nonce and a deploy to test. Lane E was right to defer it |
| **X-2** | `/auth/sign-in` has no `main` landmark or skip link | The one page Lane C could not reach |
| **X-3** | **VoiceOver** | The one accessibility finding nobody has resolved. Ten minutes with a real screen reader |
| **X-4** | 483 KB of script draws the page; the served HTML is a menu and a footer | Performance |
| **X-5** | The confirmation email link shows a raw Supabase domain | **Not a misconfiguration** — a custom auth domain is a paid Supabase add-on. Jon's call |
| **X-6** | **Sentry** | Still nothing watching production. `cd apps/web && npx @sentry/wizard@latest -i nextjs` |
| **X-7** | The `support@un-claude.com` forwarder | Waiting on the test email arriving |
| **X-8** | Test-data cleanup | Backup first, delete auth users not ledger rows, explicit ID list |
| **X-9** | **Restore the backup once** | A backup nobody has restored from is a hope |

## JON ONLY

| Item |
|---|
| Verify the five unproven-in-production rows above |
| The upstream-lineage decision — press phase 2 is blocked on it |
| Approve the Sentry dependency |

---

# ★★ LANE A LANDED — 24 August. What it changes.

**All six steps done. Nothing deployed.** `762 passed, 1 skipped` on the engine
suite (baseline was 523), pricing drift guard 3/3, do-not-touch list untouched.

## What shipped

- **The safety net caught two real text losses in the committed plumbing**
  before any model was involved. Both fixed. That is the whole reason it went
  first.
- **Repair** strips the AI tells the tool was adding, at **median +0.0000**
  trigram cost, measured on 12 real gateway runs — and to Jon's rule, not to
  zero.
- **Layer A now runs BEFORE the rewrite.** Verified live both ways:
  `removed_count: 0` before, `removed_count: 2` with both characters named
  after. **The one provable layer was being measured after something else had
  already destroyed its evidence.**
- **The report instrument caught the flagship defect — a rewritten Orwell
  quotation — on its first live run.**
- Chunks never end on a lone equation, torn code fences are stitched, the
  number reader is regression-locked, no new retries, and **the stylometry
  scanner stopped accusing ordinary English.**

## ★ THE BAKE-OFF — Jon's idea, and it paid for itself

**160 measured runs, 17 model configurations, one 5,047-word scale test.**

**Recommendation: `deepseek/deepseek-v3.2`**, replacing both the live
`mistral-small` and the standing recommendation of `mistral-medium`.

> *"It avoids most of the defect list instead of needing machinery to mask
> it — quotations mostly intact where the mistrals destroyed every one,
> headings 20/24 kept, references untouched, near-zero injected marks, zero
> fabricated sources observed — while still rewriting within ~0.06 overlap of
> medium at scale, at the same speed, at a sixth of medium's cost."*

**Kimi K3 was tested and rejected** — time ceiling and cost. K2 near-copies at
scale. Anything glm timed out or did not rewrite.

**This is why the bake-off belonged in the middle.** Every quotation the model
leaves alone is masking machinery nobody has to build.

## ★ THE FREEZE IS NOW MUCH SMALLER — and both blockers are resolved

- **The Sources latch is ALREADY FIXED, by construction.** `uc_spans.py` now
  requires a paragraph to *look* like a reference entry — a bracketed year, a
  DOI, a URL, a page range — and the section ends at the first that does not.
  **The verifier's breaking essay now yields zero reference entries.**
- **The guard-ordering fix is one sentence, written down:** every guard
  compares customer text to customer text, never the masked pair. Restore
  first, then guard.
- **The quotation tier's workload shrinks by most of an order of magnitude**
  with the model switch — from 6-of-8 quotes rewritten to 4-of-16, and two of
  those four were boundary shifts rather than rewordings.
- The structure tier is still clearly needed: **even deepseek renames ~1 in 6
  headings.**

---

# ★ WHAT LANE A LEFT — new work and new decisions

## Jon's, and nothing proceeds without them

| # | Decision | Note |
|---|---|---|
| **D5** | **Switch to `deepseek/deepseek-v3.2`** | One Vercel env var, no code change. **ONE CHECK FIRST: confirm the v3.2 checkpoint is published open-weight.** DeepSeek's releases are MIT, but **a licence cannot be proved from an API** and the ruling is open weights only. |
| **D8** | **The CJK pricing question — one coupled decision, not three** | Today a Chinese/Japanese/Thai document counts as **~1 word**, bills **1 credit**, passes the 10,000-word gate **at any size**, and is then silently skipped by the 16-word floor. Fixing any one alone breaks another: the floor alone runs rewrites the gate never priced (200,000 Chinese characters = 1 credit, ~170 chunks of model calls); billing alone charges for a rewrite the floor still skips. **And the browser's counter must change in the same release or the price shown is not the price charged — the two-implementations trap this project has hit three times.** |
| **D9** | ~~The upstream-lineage decision~~ | **RULED 24 Aug: NO PUBLIC ATTRIBUTION. Do not reopen.** The MIT licence permits commercial use, requires only that the copyright notice be kept, and `UPSTREAM-LICENSE` keeps it. A visible website credit is **not required**, and Jon has ruled against volunteering one. **Press phase 2 is unblocked** — the drafts simply do not raise it. *Recorded facts so nobody re-derives them: `rewrite_text.py` came from upstream (595 lines then, 753 now — 184 added, 26 removed) and `text_unicode.py`, `clean_text.py` and `container_meta.py` are unchanged since the copy. What is original is the production layer — `uc_chunk`, `uc_policy`, `uc_leakguard`, `uc_repair`, `uc_spans`, `uc_wordcount`. Engine source files are **404 from the web** and the upstream name and URL appear in no response — verified. The one borrowed paragraph that did reach every browser is being rewritten by the route session.* |

## New work items

| ID | Item | Owner |
|---|---|---|
| **E-12** | **The cost leak — diagnosed exactly, cannot be fixed in the engine.** A run's payload carries `cost_usd` and token counts to every browser inside `report.layer_b.usage`. **Stripping it in Python would feed nulls to the live run-cost writer and silently break the promise the privacy policy makes.** The only correct place is `app/api/tool/clean/route.ts`, **after** `recordRunCost(...)` and before `Response.json`. | a small route session |
| **E-9** | **The freeze.** Its own session, both prerequisites now written down, workload much smaller than W10 measured | after the model switch |
| **E-15** | **Non-English is untested on deepseek.** W10 measured French coming back half-translated 16 of 20 on mistral-small. **Unknown for the new model, and CJK has never been rewritten once.** | before advertising either |

## Two operational facts worth keeping

- **Timed-out reasoning calls bill invisibly.** A call abandoned at 45 seconds
  keeps generating and billing on the server and reports no usage block back.
  Own-accounting said $0.13; the gateway said **$1.91**. Recorded in `07`.
- **Gateway balance is now $5.44**, and the live site shares this key.

---

# ★★ ROUTE SESSION LANDED — 24 August. One correction to the conductor.

**Three of four done. The fourth cannot be tested from a laptop.**

| Item | State |
|---|---|
| **The cost leak** | **CLOSED, proved in both directions** — the browser reply no longer carries `cost_usd` or token counts, **and** a `run_costs` row is still written with real numbers. The position was the whole fix. |
| **CJK refused at the door** | **DONE**, and the premise corrected — see below |
| **The borrowed note** | **REPLACED** in this product's own words |
| **M-6, the cancellation switch** | **WRITTEN, SCHEMA-VALID, UNPROVEN.** Its only test is a deploy |

## ★ THE CORRECTION — and the conductor had this wrong

**I told Jon the CJK hole was exploitable today: paste unlimited Chinese, get
unlimited rewriting for one credit. That is not true, and the session proved it
by running one through the real engine:**

```
characters: 2380   space-counted words: 1
{ "skipped": "input_too_short", "min_words": 16, "words_in": 1 }
```

**One space-counted word is under the 16-word floor, so no model is ever
called.** So:

- **The LIVE defect is the customer paying a credit for a rewrite that never
  runs** — the "paying and not receiving" failure, pointed at the customer
  rather than at us.
- **Our 170-chunk exposure is LATENT.** It becomes real the moment anyone wires
  an honest word counter into that floor — **which is exactly what Lane A
  recommends in `06`.**

**This makes refusing more right, not less** — it fixes a live customer-facing
defect *and* closes the hole before the change that would open it. **But the
urgency is not "we are bleeding money today", and the conductor said it was.**

## Two things it flagged honestly

- **A file outside its territory had to move.** `lib/engine/types.ts` —
  `LayerBUsage` required `model_calls`, so the stripped reply no longer
  type-checked. **The money fields are now optional, with the reason written
  down**, rather than a cast that would leave the type claiming a field that is
  not there. `tsc --noEmit` clean.
- **A refusal gap:** Korean is in the refused set. **Lao, Khmer, Burmese and
  Tibetan are not**, and they have the same no-spaces property.

---

# ★ M-6 — FOUR STEPS FOR JON, IN ORDER

**Do not deploy from a dirty tree.** The email-and-analytics session is live now.

1. **Wait for a quiet tree.**
2. **Deploy, and watch the build.** If it fails with *"the pattern defined in
   `functions` doesn't match any Serverless Functions"*, **the switch does not
   reach an App Router route — take the two lines out, that is the answer.**
3. **Run one free test** — `UC_SITE=https://un-claude.com node scripts/verify-connection-drop-refund.mjs`.
   No model call, costs nothing. **A refund row means M-6 is closed.**
4. **If no refund row: STOP.** `waitUntil` needs `@vercel/functions`, a new
   dependency, and that is Jon's call.

---

# ★ TWO NEW ITEMS — 24 August

## P4 — THE "CREDITS ARE SLOW" BANNER CAN NEVER APPEAR (customer-facing, money)

**Found by the email-and-analytics session, measured rather than reasoned.**

A buyer whose credits are slow sits on **"Payment received. Adding your credits
now…" indefinitely.** The banner is meant to retry ten times over ~15 seconds and
then say *"refresh, and if they are still missing, email us"*. **It tries once and
stops forever.**

**Why:** `purchase-banner.tsx` schedules its retry inside an effect whose
dependencies are `[status, purchaseLanded, gaveUp, router]`. **`router.refresh()`
changes none of them**, so the effect never re-runs and no second timer is
scheduled. The file's own comment — *"this re-runs when refresh() produces a new
render"* — describes behaviour React does not have.

**Measured** against `/dev/purchase?purchase=success&landed=0`: one refresh, then
silence for 60+ seconds, banner text unchanged.

**This is the moment a customer has paid and is not yet served.** The support
address in that banner is now correct and no one can ever read it. **Pre-existing,
not caused by that session.** Territory: `app/home/_components/purchase-banner.tsx`.

## P5 — THE PRESS DRAFTS NEED REWRITING, NOT PATCHING

Nine drafts exist in `docs/session-notes/press-emails-phase-2.md`. **Jon is
unhappy with them and the conductor agrees.** The research and the personalisation
are good; **the shape is wrong.**

**They explain the product where they should offer a story.** Three paragraphs of
layer-by-layer description before any reason to care — the product page pasted
into an email. **A reporter's question is not "what does it do", it is "what is
the story".**

**Four specific faults:**
- **No news hook.** The Anthropic announcement produced fifteen named bylines in
  twelve days and the emails do not mention it. *Why now?* is unanswered.
- **The ask is doubled and apologetic** — *"Interview if useful, or I can just
  give you access."* Two offers dilute each other and "if useful" invites a no.
- **Jon is invisible.** *"I run it"* is four words. **A solo developer building
  the first consumer tool in a category the big labs created IS the story**, and
  it is thrown away.
- **The honesty is buried in paragraph five.** In a category full of tools
  claiming proof, *"here is the part I cannot prove"* is the opening move, not
  the caveat.

**What to keep:** the article-specific openings, and `verified: false` **in the
API payload rather than as fine print** — the strongest line in the set.

**Direction:** news peg → who Jon is → the one thing that makes him different →
**one** offer. Technical detail in a single sentence; the rest waits to be asked.

**Also still open from that session:** the Sharma sequencing flag, and a contact
caveat — **Belanger's published address is a personal Gmail**, self-published for
contact, not a masthead address. Jon should know before sending.

