MODEL: Opus 5, high effort. Four small items in files no other lane owns.
**All lanes are finished, so the tree is quiet and you may be the only
session running — check `git status` before you start and say what you
found.**

READ FIRST
1. **CLAUDE.md in full.** Section 4 governs: a run, not an assertion.
2. `docs/session-notes/lane-a-engine.md` §3.8 — the cost leak, diagnosed
   exactly, including why it could not be fixed there.
3. `docs/session-notes/lane-b-money.md` — the M-6 section at the top.
4. `docs/IMPLEMENTATION-BOARD.md`.

TERRITORY:
  `apps/web/app/api/tool/clean/route.ts`
  `apps/web/app/api/tool/scan/route.ts`
  `apps/web/vercel.json`
  `apps/web/engine/text_unicode.py` — **ONE STRING, item 4 only**
  `apps/web/scripts/**` for verification scripts

DO NOT TOUCH: `lib/server/credits.ts`, `app/api/stripe/**`,
`app/api/checkout`, the workbench, the marketing or legal pages,
`app/auth/**`, the rest of `apps/web/engine/**`,
`docs/IMPLEMENTATION-BOARD.md`.

**THE SITE IS LIVE AND TAKING REAL MONEY. Do NOT deploy. Do NOT push.**
Jon deploys, and item 2 needs one.

═══════════════════════════════════════════════
1 — THE COST LEAK. Four lines, and the position matters more than the code.
═══════════════════════════════════════════════
**Every rewrite sends our own unit economics to the customer's browser:**

```
"usage": { "model_calls": 1, "prompt_tokens": 813, "completion_tokens": 49,
           "total_tokens": 862, "cost_usd": 9.6e-05, ... }
```

It rides inside `report.layer_b.usage`. `strip_server_paths` removes only
`path`, and the route forwards the whole report. Anyone opening the
network tab can read what a run costs us.

**THE POSITION IS THE WHOLE FIX, AND GETTING IT WRONG BREAKS A LIVE
FEATURE.** `recordRunCost(ledgerId, result)` in `lib/server/credits.ts`
reads exactly these figures from exactly this spot, server-side. It is
Lane B's M-4 and it wrote **the first `run_costs` row this product has
ever produced** on 24 August — which is what finally made a sentence in
the privacy policy true.

So: strip the figures **AFTER `recordRunCost(...)` has been called and
BEFORE the final `Response.json`.** Strip them anywhere earlier — or in
the Python engine — and the writer gets nulls and the policy silently
becomes a lie again.

**Prove it two ways:** the browser response no longer carries `cost_usd`
or token counts, **and** a `run_costs` row is still written for the same
run, with real numbers in it.

═══════════════════════════════════════════════
2 — M-6: DOES VERCEL'S CANCELLATION SWITCH REACH AN APP ROUTER ROUTE?
═══════════════════════════════════════════════
**A dropped connection charges the customer and never refunds. The fix
already shipped and is inert.** Lane B measured it on production: 250
credits taken, nothing delivered, no refund. A `run_costs` row was
written a few lines *above* the refund check, which proves execution
reached it — `request.signal.aborted` was simply **false**.

**The cause:** Vercel request cancellation is **opt-in**. `request.signal`
only aborts for functions declaring `supportsCancellation`.
`apps/web/vercel.json` has a `functions` block covering **`api/*.py` and
nothing else**, and the clean route is an App Router handler at
`app/api/tool/clean/route.ts`, outside that glob.

**This is an EXPERIMENT, not a known fix.** Vercel's own examples target
`api/**` and `pages/api/**`. **It is not established the switch can reach
an App Router route at all.**

Add the declaration, hand Jon the deploy, and then **re-run Lane B's
existing test** — it drops a connection on a job the engine refuses for
free, so it costs nothing. **If the refund row appears, done, and no
dependency is needed.**

**If it does NOT appear, STOP.** The next step would be `waitUntil` from
`@vercel/functions`, **a new dependency, and CLAUDE.md section 5 makes
that Jon's call.** Write it up; do not install it.

═══════════════════════════════════════════════
3 — REFUSE CJK AT THE DOOR. Jon's ruling.
═══════════════════════════════════════════════
**Chinese, Japanese and Thai do not put spaces between words, and the
word counter counts spaces.** So a 200,000-character Chinese document
counts as roughly **one word**: it bills **1 credit**, sails through the
10,000-word gate, and would cost us around **170 chunks of model calls.**

**That is a billing hole, not a language gap.** Anyone who notices can
paste unlimited text for one credit.

**Jon's ruling: refuse those scripts with a plain message rather than
price them.** It closes the hole completely — no pricing maths, no gate
change, and no browser counter to keep in sync, which is the
two-implementations trap this project has hit three times.

- **Refuse BEFORE any credit is checked or charged**, so nobody is asked
  to pay for a job that will be refused. That ordering defect was already
  fixed once; do not reintroduce it.
- Detect by **Unicode script range**, and be careful: a mostly-English
  essay quoting one Chinese phrase must NOT be refused. Refuse only when
  the document is substantially CJK. **Say what threshold you chose and
  why, and show it passing an English document containing a Chinese
  quotation.**
- The message is visitor-facing copy, so the `unclaude-messaging` skill
  applies. Plain, no blame, and honest that it is a limit rather than a
  failure.
- **The free SCAN should still work** — layers A and metadata are
  script-independent. Only the paid rewrite is refused.

═══════════════════════════════════════════════
4 — ONE STRING: REPLACE THE BORROWED NOTE
═══════════════════════════════════════════════
`apps/web/engine/text_unicode.py:554` contains a paragraph beginning
*"Load-bearing invisibles are preserved by default during cleaning…"*.

**It is the upstream project's own wording, unchanged, and it is sent to
every user's browser on every scan** — confirmed against production.
It is not displayed on screen, but it is in the response.

**Rewrite it in this product's own voice. Same meaning, our words.** It
explains that some invisible characters are deliberately kept because
removing them would corrupt Arabic, Hebrew and other scripts — which is
true, correct, and worth saying well.

**Change that one string and nothing else in that file.**

═══════════════════════════════════════════════
FINISHING
═══════════════════════════════════════════════
Jon is not a programmer. **Show the real before and after** — for item 1
the actual response body with the figures gone and the ledger row still
written; for item 3 both a refused CJK document and an accepted English
one containing Chinese.

**Item 2 may end as "the switch does not reach this route".** That is a
result, not a failure. Say so plainly and stop.

A step you skipped is a step that failed. Say which, at the top.

Write `docs/session-notes/route-session.md`.

Before EVERY commit run `git diff --cached --name-only`. Never
`git add -A`, `git add .` or `git commit -a`. **Do NOT deploy or push.**
