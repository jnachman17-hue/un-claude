# un-claude.com — Launch Checklist

**The single live picture of what is done and what is left.**

**THE CONDUCTOR IS THIS FILE'S ONLY WRITER.** If you are a working session, do
not edit this file. Write `docs/session-notes/<your-topic>.md` and the conductor
will read it, verify it, and update this. Several sessions appending to one file
is the one thing git cannot merge, and it has already caused problems here.

**Last updated 21 Aug 2026** — after W4 (SEO) landed, with W1 and W2 still
running. Every claim below was re-checked with a real run, not inherited.

**Sources:** `HANDOFF-2026-08-21-launch.md` (the inventory and the reasoning),
`CURRENT-HANDOFF.md` (rewritten by the Stripe session),
`session-notes/stripe-setup.md` §16 (the go-live procedure).

---

## Status key

**DONE** finished with a real run behind it · **OPEN** nothing is stopping it ·
**BLOCKED** blocker named · **JON** only Jon can do it · **RUNNING** in progress

---

# ★ LAUNCHED — 22 August 2026

**The site is live and can take money.** Verified by the conductor, not reported:

```
POST https://un-claude.com/api/checkout  ->  401 {"ok":false,"error":"signed_out"}
```

401 to an anonymous request is the correct answer and proves the Stripe key is
found and the route is running. It was **503 `checkout_unavailable`** twenty
minutes earlier — see E16.

| Step | State |
|---|---|
| 1. Live key into Vercel | **DONE** (after the rename in E16) |
| 2. Production webhook + its own signing secret | **DONE** |
| 3. EU card block | **SKIPPED** — needs paid Radar, see C8 |
| 4. Deploy | **DONE** |
| 5. **Prove the live path with a real purchase** | **DONE — verified on the live ledger** |

**Also live and verified:** the US-only terms, the old "currently free" sentence
**gone (zero occurrences)**, the homepage canonical, the title template
(`Pricing · Un-Claude`), and `mistral/mistral-medium` as the rewrite model.

---

# ★ WHAT IS LEFT, IN ORDER

| # | Item | Whose | Note |
|---|---|---|---|
| 1 | ~~Buy the Starter pack~~ | **DONE 22 Aug** | Real card, real money. **Verified by the conductor on the live database, not reported:** exactly **one** purchase row on the entire ledger (`id 486, +10`), carrying `pi_3U74cIHwIcwEXjEP0HaPlfow` and a `stripe_event_id`, and **all four ledger invariants PASS** across 61 rows and 5 conversions. |
| 1a | ~~Refund yourself~~ | **DONE 22 Aug — verified** | `id 489, -10 money_refund`. **Removed exactly 10 and left the 3 signup credits untouched** — which is the live proof of the worst bug the Stripe audit found: `charge.amount_refunded` is a *running total* and was being read as the current refund, so two partial refunds on one pack would have eaten credits belonging to other purchases. **All four invariants still pass, 62 rows.** The complete money path — purchase, credit, refund, debit — is now proven on real money. |
| 2 | **Search Console — now the next thing** | **Jon** | Unblocked by the deploy. W4's five-step walkthrough. |
| 3 | **Measure on production** | Jon/session | W1's one open item. Every timing so far is local — no HTTP, no base64, no cold start. **Production will be slower.** |
| 4 | **Push to GitHub** | **Jon** | **109 commits exist only on this laptop while the site is live.** |
| 5 | W7 UI notes, paused | session | Five items, plus the mobile zoom now that the workbench is free. |
| 6 | `/pricing` canonical | session | The ninth of nine. W1 has released the file. |
| 7 | **F1 Fable audit** | Jon triggers | The final gate. |

---

## SESSIONS RUNNING RIGHT NOW

| Session | Scope | Territory | Status |
|---|---|---|---|
| **W1** | Engine correctness **+ the word/credit counter** | `engine/**`, `api/*.py`, **`workbench/**`, `lib/engine/client.ts`** | **IN FLIGHT** — 2 commits landed, scope widened by Jon |
| **W2** | Legal + checkout consent | legal pages, pricing, `buy-button.tsx`, checkout route | **IN FLIGHT** — the America-only reversal landed |
| **W3** | ~~Word counter + disclosure~~ | — | **SCRAPPED 21 Aug by Jon.** Both items resolved elsewhere — see B6 and C4. |
| **W4** | SEO | `root-metdata.ts`, 3 page metadata | **DONE — verified by conductor** |
| **W5** | Docs merge | `docs/04`, `docs/07` | **DONE — verified by conductor** |

**The workbench is no longer free.** W1's scope was widened to take the word and
credit counter, and it currently holds `workbench.tsx`, `credits.ts`,
`encode.ts`, `marked-text.tsx` and `lib/engine/client.ts` alongside the engine.
**Nothing else may touch the workbench until W1 reports done.** Still no overlap
with W2, which holds only the legal pages, pricing, `buy-button.tsx` and the
checkout route — verified against the working tree.

---

# A. STRIPE — BUILT AND TESTED, NOT LIVE

| ID | Item | Status | Note |
|---|---|---|---|
| A1 | **Stripe build + test** | **DONE** | 12 suites pass. A real browser purchase credits a real account; **the same webhook delivered 3 times produces exactly one ledger row**; refunds including repeated partials; a lost dispute reclaims credits while an open one correctly does not; 12 payment-API attack cases refused; forged, tampered and replayed webhooks all refused. |
| A2 | **Stripe account activated** | **DONE** | Read from the API: `charges_enabled`, `payouts_enabled`, `details_submitted` all true, no outstanding requirements. Individual/sole proprietor, US. DBA "Un-Claude". Descriptor `UN-CLAUDE.COM`. |
| A3 | **Both migrations applied** | **DONE** | `20260821150000_stripe_purchases.sql`, `20260821160000_refund_cumulative.sql`. |
| A4 | **Prices cannot drift** | **DONE** | No Stripe Products or Prices exist by design. Line items are built from `pricing-data.ts`, so page and card come from one file. The browser sends a **pack id, never a price**. |
| A5 | **Production is safely disarmed** | **DONE — re-verified by the conductor** | `vercel env ls production` shows **no `STRIPE_*` variables at all.** The live site cannot charge anyone. This is the correct state while the terms still say the service is free. |
| A6 | **Virtual mailbox activation** | **NOT A BLOCKER** | Form 1583 and notary outstanding, but a real receipt was fetched and checked: neither address, neither postcode, nor Jon's legal name appears. Stripe wants the support address as a **setting only**. Receipt reads "Receipt from Un-Claude" / unclaudeapp@gmail.com. |

**Stripe's territory is now FREE.** `app/api/**`, `credits.ts`, the workbench and
the pricing page are released. That unblocks B6, C2, C3 and C4.

---

# B. THE ENGINE — the long pole, and still untouched

Brief in `HANDOFF-2026-08-21-launch.md` Part 8. **All four paths it names exist —
conductor verified.** Territory `apps/web/engine/**`, `apps/web/api/*.py`.

| ID | Item | Status | Blocks | Note |
|---|---|---|---|---|
| B1 | **Formatting is destroyed** | **FIXED — W1, pending final verification** | F1, money | The biggest one. Hits everyone who pastes more than a paragraph. Cause unknown — `uc_chunk` chunking, the rewrite round-trip, clean-path normalisation, or the copy button. **W1 found four causes, and the biggest was not on the brief's list of three** — a flattened display in `marked-text.tsx:73`, i.e. the paragraphs survived the engine and were lost on screen. The other three: the chunker's spacing, the rewrite round-trip, and a bad last re-roll. |
| B2 | **No file type tested end to end** | **IN FLIGHT — W1, commit landed, unverified** | F1, money | Does a `.docx` still open in Word afterwards? A corrupted output is worse than an uncleaned one. **See the correction below — this is bigger than the brief says.** |
| B2a | **No extension allowlist on the clean route — NEW, conductor's finding** | **OPEN** | B2 | `ACCEPTED_FILES = '.txt,.md,.docx,.png,.jpg,.jpeg'` is only the **file-picker hint**. The clean route validates the extension **nowhere**. The engine handles ~24 extensions, and the Stripe audit's own `.csv` undercharge proves other types get through. **So the brief's "seven input paths" is wrong.** `.pdf` is in the engine's `CONTAINER_EXTS` while `04` entry 26 says PDF is deliberately unsupported — nobody knows what a PDF upload does today. |
| B3 | **The two size ceilings** | **RESOLVED — W1, measured** | G2 | **An honest limit at 10,000 words, and the site's abort raised from 120s to 240s so the limit is actually reachable — both, because the first is not true without the second.** Measured: 10,464 words in 78.7s. **Time does not track length, it tracks how many retries the fact guard demands**, so 7,848 words took *longer* than 10,464 — meaning **any promise about how long a document of size N takes would be false.** Cost corrected to 0.21 cents/1,000 words; ENGINE.md's "~0.06 typical" was a best case read as a typical. |
| B4 | ~~Pricing arbitrage~~ | **DISPROVEN — W1, tested on the real ledger** | — | **There is no arbitrage.** Same 2,616-word document, dev bypass off, real ledger: pasted charged 3, uploaded as `.txt` charged 1 with no rewrite, and **the same `.txt` with the rewrite actually requested charged 3 — exactly what the paste cost.** The route prices by words whenever a rewrite runs, whatever the file is called. The Stripe audit's fix holds. **The 1-credit case is not cheap work, it is different work** — which is B7. |
| B7 | **THE WORST ONE: text files and Word files are backwards** | **IN FLIGHT — W1, with full permission** | **money, launch** | One line, `workbench.tsx:358`, decides whether an upload is writing or a picture, and it is **wrong for both, in opposite directions.** A `.txt` user is told *"An image carries no text"* — while the panel lists the zero-width space it just found — and **the rewrite never runs, though they paid.** A `.docx` says *"Rewriting"* for a file only stripped of metadata. **Reverses the earlier "file types and arbitrage are all clean" answer Jon was given.** |
| B7a | **R1 — the `.txt` half is a PRICING CHANGE and needs Jon's word** | **RULING NEEDED** | B7 | The `.docx` half costs nothing and changes no price. **The `.txt` half changes what a customer is charged**: 1 flat credit today, up to 10 by the word if it behaves like a paste. W1 originally refused to touch it for exactly this reason. **Jon has since given W1 full permission, so this could now be decided by a session rather than by Jon — that is the one thing to watch.** |
| B8 | **The browser's price uses an extension list the server deleted** | **OPEN — W1 may absorb** | — | `credits.ts:costFor` still tests `/\.(txt\|md\|markdown\|text)$/`. `.md` was in the browser's list and not the server's, so a `.md` was **quoted more than it was charged** — the safe direction — and `.md` is now refused at the door anyway. Read from source, not run. |
| B9 | **A file with no AI in it still loses its author, silently** | **IN FLIGHT — W1** | — | A `.docx` with `dc:creator` "Jon Nachman" and no AI markings scans as **nothing found** and comes back with the name deleted. A JPEG lost its Exif the same way. **Not a lie** — the panel says "no AI metadata", which is true — but the file changed and nothing said so. W1 recommends keep stripping and say so. A `keep_non_ai_metadata` option already exists that nothing sends. |
| B10 | **Five interface defects, reported and not fixed** | **IN FLIGHT — W1, now owns the workbench** | — | **U1** a refused file keeps its price and a live Sanitise button · **U2** "click anywhere to paste" never lands the cursor, so the next keystroke goes nowhere · **U3** you cannot select the scanned text and trying **wipes the scan** — the other half of the formatting complaint · **U4** a decorative glow makes the hero scrollable (no demonstrated user path) · **U5** the live counter is caught mid-flip in 5 of 9 screenshots. |
| B11 | **Nothing has been measured on production** | **OPEN — blocked by the deploy** | F1 | Jon forbade deploying, so **the deployed code is not W1's code.** All timings are local against the real engine, with money checked against the real production database. They carry **no HTTP, no base64, no cold start — production will be slower.** |
| B12 | **A brand-new account gets 5 credits, and nobody confirmed that is intended** | **RULING NEEDED — R3** | — | An account that was **never a guest** received both `+2 anon_grant` and `+3 signup_grant`. Same total as guesting first then signing up, so it looks consistent rather than wrong. W1 flagged it as an observation, not a finding. Confirm it is intended. |
| B13 | **`.md` was dropped from the accepted types — was that approved?** | **RULING NEEDED — R2** | — | `ACCEPTED_FILES` went from `.txt,.md,.docx,.png,.jpg,.jpeg` to `.txt,.docx,.png,.jpg,.jpeg`. A product scope reduction. W1's reasoning is that `.md` is a container to the engine and never got the rewrite anyway, so it was selling something it did not deliver — but **Jon should say yes to it rather than inherit it.** |
| B5 | **Retry exhaustion / the fact guard** | **PARTLY RESOLVED — W1** | — | **Nothing fails because of it.** It costs roughly **four times the money and time** a clean run needs. The obvious repair was built, measured, and came out a wash, so it was not shipped. Needs a proper number parser as its own small task. |
| B6 | **Word counter freezes on a stale number** | **FIXED — W1, pending final verification** | — | Delete 10,000 words, box empty, still reads "10,524 words". **A price display that lies.** **The hypothesis was half right.** W1 confirmed `workbench.tsx:1465` and found a **second site at :557** that the conductor's read missed. Both fixed. |

**Do not edit `ENGINE_TEXT_EXTS` or the engine's `TEXT_EXTS` without running
`verify-pricing-matches-engine.mjs`.** It guards a 100x undercharge. It passes today.

---

# C. LEGAL AND POLICY

**Rewritten 22 Aug after decision 115 — Jon removed the market instead of
satisfying the law.** Credits are sold to **US customers only**, the UK/EU
consumer regime is parked, and the checkout ceremony is Stripe's own single
checkbox. That closes four items and opens four new ones.

| ID | Item | Status | Note |
|---|---|---|---|
| C1 | **Terms & privacy reconciliation** | **DONE — verified** | The two sentences that would have gone false are in the present tense. Verified in source: the terms now read "We sell credits to customers in the United States only." |
| C2 | ~~Checkout consent ceremony~~ | **CLOSED — built, proven, then deleted the same day** | The full UK/EU waiver ceremony was built and working: consent dialog, unticked express-consent checkbox, a pay button stating the amount, a consent flag the checkout route refused to proceed without, and the consent written onto the Stripe payment as metadata. **Entry 115 deleted all of it** — with no EU market there is no right to waive. Jon: *"just make them acknowledge they have read the T&C."* Now Stripe's own `consent_collection` checkbox and nothing on our side. **The deleted work survives in commit `b965e88` and `legal-applied-stripe.md` — that is the starting point if Europe is ever opened, not a fresh session.** |
| C2a | ~~Durable-medium limb~~ | **CLOSED with C2** | Moot: no statutory right in scope to lose. |
| C3 | **Refund policy** | **DONE — ruled 115a** | **Kept**, because the 40-to-1 arithmetic is sound and it is now the *only* refund route a US customer has. **But no longer advertised** — Jon: *"only people that are really fed up would go looking."* Discoverable in three places, none of them a tile: small print under the packs, the last FAQ, and in full in the terms. **It did not leave the pricing page** — Stripe's website checklist expects a visible refund policy, so hidden is fine and absent is an account risk. |
| C7 | **Governing law: California** | **DONE — closes D1** | Verified in source. Named because Jon operates there, not as a preference: a California court applies California law to a California trader whatever the contract says, so naming a friendlier state buys nothing and reads as evasive. **His legal name and address are deliberately not published**, on his instruction. |
| C8 | **US-only enforcement — BLOCKED BY A PAID STRIPE FEATURE** | **JON — decision, and the launch does not wait for it** | **Run live 22 Aug and it failed:** `StripeInvalidRequestError: This Radar feature is not enabled.` on the first write. Reading the list worked (`rsl_1U6J25…`); writing to it did not. **Editing Radar value lists is part of Radar for Fraud Teams, a paid add-on**, and it is not enabled on the live account. **This reverses a documented claim.** `legal-applied-stripe.md` §6.2 states the rule needs "no dashboard work and no paid Radar tier" — **true in test mode, false in live**, because Stripe grants Radar's paid features free in test. Exactly the "true on a laptop, false in production" shape W2 itself named. **Nothing is in a broken state:** it reported `before: 0 (empty)` and died on the first write, and an unenforced list does nothing anyway. **Conductor's recommendation: launch without it.** Entry 115 already ruled the restriction contractual, what matters is whether Jon *directs activities* at the market, the terms sentence is itself that evidence, and **no page, comment or receipt claims cards are refused** — so skipping the block makes nothing false. The script is written, idempotent and proven in test; the day Radar is enabled it is one command. |
| C9 | **GDPR did not go away — NEW, and nobody should later assume it did** | **OPEN** | Restricting **sales** does not restrict **use**. The free tool stays open worldwide, European visitors will keep pasting text into it, and **UK/EU GDPR still applies to that processing.** The privacy policy, the controller question and the supervisory-authority question are **untouched by entry 115.** What went away is only the consumer-contract half. |
| C10 | **Arbitration clause + class action waiver — NEW** | **JON — needs a lawyer** | With US-only sales this is now **the highest-value legal addition available**, and it was not attempted because it is drafting work. Related: the "as is, without warranties" disclaimer **got stronger by accident** — weak against a UK consumer, broadly enforceable against a US one — so research item 9E drops down the list. |
| C11 | **US state sales tax — NEW, parked with a trigger** | **PARKED** | Not VAT and it does not vanish with the EU. Economic-nexus thresholds are roughly **$100,000 or 200 transactions in a single state**, so it bites at nothing like current volume. Revisit at those numbers. |
| C12 | **`legal-research.md` was written against the wrong country** | **DONE — flagged in place** | It drafted the trader as a **UK** sole trader throughout while the Stripe account is a **US** individual. Its UK conclusions must not be reused. W5 put a warning header on the file naming the superseded sections (1, 2, 3f, 5, 9A/9B). Verified. |
| C5 | **Essay-mill advertising constraint into `unclaude-messaging`** | **OPEN** | Advertising such a service to students is a **separate offence** from the essay-mill offence itself. A hard constraint on marketing. Still not in the skill. |
| C4 | **Disclosure line at the tool's button** | **DECLINED by Jon, 21 Aug — do not re-propose** | The privacy policy already discloses that the rewrite leaves for an AI model, so section 2D's line was a trust idea and **not a legal requirement**. Declining it exposes nothing. |
| C6 | Deferred legal decisions | **MOSTLY CLOSED by 115** | EU VAT, the EU trader address and the model cancellation form are all gone with the market. **No entity will be formed — settled.** MoR and ICO registration fall away with EU sales; C11 replaces them. |

# D. SEO

**W4 landed and the conductor re-verified every claim independently** — source
read, and curl run against the build. All confirmed. Two handoff conclusions
remain closed as non-defects.

| ID | Item | Status | Note |
|---|---|---|---|
| D1–D3 | Search Console property · sitemap · robots.txt | **DONE** | Sitemap 200, robots correct. |
| D4 | ~~noindex blocking Google~~ | **NOT A DEFECT** | No `noindex` anywhere. Stale 15 Aug crawl. **Do not hunt for it.** |
| D5 | ~~Temporary redirects~~ | **NOT A DEFECT** | All 308 permanent. |
| D9 | **Title template** | **DONE — verified** | One field in `root-metdata.ts` fixed **every page site-wide**, including four W4 never touched. Verified: `/pricing` "Pricing · Un-Claude", `/privacy-policy`, `/terms-of-service`, `/cookie-policy` all now carry the brand where they were bare words. Homepage uses an absolute title so the brand is not appended twice. |
| D10 | **Meta descriptions over length** | **DONE for the pages W4 owned** | Verified by measuring the served strings: homepage **162 → 145**, `/how-it-works` **181 → 151**, `/mission` 136 unchanged. Claims were checked, not just character counts. |
| D11 | **Legal pages' descriptions** | **DONE — by W2, verified** | Each of the three now has its own description instead of inheriting the product one: terms 143, privacy 152, cookie 144. |
| D6 | **Canonical tags** | **DONE — 8 of 9, verified** | **Verified against a running build:** `/`, `/how-it-works`, `/mission`, `/capabilities`, `/contact`, and all three legal pages each name their own address. **`/pricing` is the ninth and is the one accepted gap** — W1 is rewriting its copy for the `.txt` ruling, and one missing canonical costs less than two sessions in one file. Pick it up after W1 lands. |
| D14 | **Never set a canonical at the root** | **STANDING RULE** | W4 refused to set a canonical in `root-metdata.ts` and **was right to.** A root canonical leaks the homepage's address onto every page that does not set its own, so those six would each claim to *be* the homepage. **A wrong canonical is worse than a missing one.** The fix is six per-page tags. Four of those files are W2's right now. |
| D13 | **`/capabilities` description** | **DONE — verified, 171 → 151** | Measured before and after against the served page. The trim cut words rather than caveats — "what we will put our name to" became "what we stand behind". |
| D7 | **Search Console walkthrough** | **PARKED — written, waiting on E15** | **W4 delivered it in full** at the end of `session-notes/seo-canonicals-and-titles.md`: five numbered steps, named buttons, expected text. **Deliberately not done yet** — doing it before the deploy makes Google re-crawl the old build and recreates the exact stale-data trap that produced the phantom noindex. |
| D8 | Inspect `www.`, confirm "Page with redirect" | **JON — folded into D7 step 3** | — |
| D12 | Structured data | **OPEN** | W4 skipped it deliberately rather than rush it at session end. Additive, not a defect. |

# E. OPERATIONS

| ID | Item | Status | Note |
|---|---|---|---|
| E11 | **Vercel Pro** | **DONE — 22 Aug** | Hobby forbade commercial use and the live pricing page already advertised a sale, so the site was arguably in violation before a single charge, with a paused deployment as the penalty. Closed. |
| E11a | ~~Pro raises the function ceiling~~ | **CLOSED — the conductor's flag was wrong** | The plan decision and the size-ceiling decision are connected and nobody has connected them. **The plan was never the binding constraint, so Pro changes nothing here.** W1 found the real ceiling was **the site's own abort in `lib/engine/client.ts` at 120s** — past it the browser was told "unreachable", the credit was correctly refunded, **and the Python function carried on running and being billed for a result nobody would ever receive.** Raising Vercel's cap to 300s "bought nothing". Worst case is now 225s against a 300s cap, so the 10,000-word limit stands on either plan. |
| E12 | **Production wiring** | **BLOCKED by C1, E11** | ~10 min + ~20 verifying. Live key into **Vercel env, never a file**. A **production** webhook at `https://un-claude.com/api/stripe/webhook` on all six events, **with its own signing secret** — reusing the `stripe listen` one makes every real payment fail silently. Procedure: `stripe-setup.md` §16. **Do not improvise it.** |
| E15 | ~~The deploy~~ | **DONE — 22 Aug** | The live site serves a build from **before** all of today's work. Deploys ship the **working tree, not git**, so a deploy while W1/W2/W3 have edits on disk pushes their half-finished work live. Deploy only when every session has stopped. **This gates D7, and it gates any user seeing any of it.** |
| E16 | **The key was named `Stripe_Secret_Key`, the code reads `STRIPE_SECRET_KEY`** | **FIXED — 22 Aug** | Environment variable names are case-sensitive, so the key was never found and the first live deploy returned **503 `checkout_unavailable`** on every checkout. **Caught by probing the live endpoint before spending money, not by reading anything.** The failure was safe and loud: `hasStripe()` returned false, the route refused cleanly, and the button said "Card payments are briefly unavailable. Nothing was charged." **The guard earned its keep.** Fixed by removing and re-adding under the exact name, then redeploying — env changes do not reach a deployment that already exists. |
| E17 | **Never answer Y to "Pull development environment variables into .env.local?"** | **RUNBOOK** | It overwrites `apps/web/.env.local`, which holds three variables that **exist nowhere in Vercel** — `UC_ENGINE_URL`, `UC_ENGINE_SCAN_PATH`, `UC_ENGINE_CLEAN_PATH` — plus the `sk_test_` key and the `stripe listen` secret that make local testing possible without real money. The file is gitignored, so **there is no committed copy to restore from.** |
| E14 | **The "one port per session" rule is wrong — NEW, from W4** | **OPEN, belongs in the runbook** | Next.js 16 enforces **one dev server per build directory** via `.next/dev/lock`, scoped to the project folder and **not to the port**. Sessions share one working tree, so only the first session to start a dev server can have one, whatever port the others ask for. `HANDOFF-2026-08-21-launch.md` Part 0 rule 7 says to use a distinct port per session; that does not work and will waste a session's time. W4 worked around it by curling a peer's server on 3000 — valid, same tree, read-only. |
| E1 | **Sentry not wired** | **JON approves dep** | Account created, never connected. **If the site breaks at 3am nobody finds out until Jon looks.** |
| E2 | **Ledger backups — Vercel Pro does NOT provide these** | **JON — decision needed** | **Correcting a wrong premise before it becomes a plan: nothing bought on 22 Aug backs up the database.** The ledger lives in **Supabase**; Vercel never sees it. The "7 days" is **Supabase Pro, $25/mo** — daily backups, 7-day retention — which Jon declined earlier. **What Pro *did* unlock is the mechanism, not the backup: Cron Jobs.** |
| E2a | **Purchases are reconstructible from Stripe — now confirmed on real data** | **CONFIRMED 22 Aug** | Verified in migration `20260821150000`: every purchase row carries **`stripe_payment_intent_id`**, under a unique index. So if the ledger were lost tomorrow, **every purchase is reconstructible from Stripe.** What is genuinely unrecoverable is free grants and how much each person has already spent. That is a real loss but it is **not** the total-loss-of-the-money-record this board has been calling it. |
| E2b | **The cheap path, and its honest caveat** | **OPEN — needs Jon's dependency approval** | `backup-credit-ledger.mjs` works but writes to the **local disk**, so it cannot simply be pointed at a Vercel Cron — a function's filesystem vanishes when it exits. It needs rewriting as a route that writes to **Vercel Blob**, which is a dependency (`@vercel/blob`) and therefore Jon's call under CLAUDE.md §5. **The caveat that must not be lost: restoring a CSV into an append-only ledger guarded by a trigger is an untested path, and a backup nobody has restored from is a hope rather than a backup.** Whatever is built, restore it once on a throwaway account before calling it done. |
| E3 | **Session notes merged** | **DONE — verified** | **W5 merged 19 notes into decision-log entries 115–127 and deleted them**, holding back the five that live sessions are still reading (`limits`, `payments-tested`, `stripe-setup`, `legal-research`, `legal-reconciliation`) with a pointer line added at the top of each. Verified: 4,700 lines removed, 667 added, and the `legal-research.md` header correctly names the sections entry 115 superseded. **The conductor removes those five once W1 and W2 finish.** |
| E4 | ~~Uncommitted working tree~~ | **DONE — 21 Aug** | Was the highest operational risk on the board. Five commits: the Stripe path, the icon fix, the density cuts, the records, the vendored skills. **Six session notes had never been committed at all**, including the entire legal research and the go-live procedure. Tree is clean. **Local is 76 commits ahead of origin — nothing is pushed.** Secret-scanned before committing: no keys, only placeholders and a public Turnstile site key. |
| E13 | **Forged `uc-guest` cookie can move 2 credits — open by choice** | **OPEN** | A forged cookie can name another user's anonymous account and take up to 2 credits. Needs a UUID that is never published. Recorded in `docs/06` with a revisit trigger. Deliberately not fixed. |
| E5 | `proxy.ts` excludes `/api/*` | **OPEN** | API routes skip middleware, so there is no natural home for a site-wide rule. Architectural, not urgent. |
| E6 | Vercel log retention unverified | **JON — easier now** | Blocks one sentence in the privacy policy. **Pro changes the retention figure**, so whatever was true on Hobby is no longer the number to write down. Read the current value off the dashboard. |
| E7 | DMARC `rua=` reporting | **OPEN** | Needs a real mailbox on the domain. DMARC itself is live at `p=reject`. |
| E8 | Root SPF record | **OPEN** | Optional; DKIM already carries alignment. |
| E9 | Contact form is `mailto:` | **JON** | A real send needs a mailer dependency. |
| E10 | `verify-guest-merge.mjs` only runs from `scripts/` | **OPEN** | Harness bug, not product. Trivial. |

---

# F. THE FINAL GATE

| ID | Item | Status | Blocked by |
|---|---|---|---|
| F1 | **Fable 5 ultracode audit of the whole money path** | **BLOCKED** | **A5→E12, B1, B2, B3, C1, C2** |

End to end: documents, large text, credits, payments, accounts, signups, edge
cases — with the ledger, Vercel and Supabase all agreeing. **Must be last**: it
can only test credits against a real Stripe. **Must not be where expensive
problems are first found** — it is the right place to catch an off-by-one, the
wrong place to discover 10,000-word documents need background processing.

---

# G. NEVER STARTED

| ID | Item | Status | Note |
|---|---|---|---|
| G1 | Accessibility pass | **OPEN** | Site-wide — **collides with everything. Must run alone.** |
| G2 | File-size-limit behaviour + its copy | **BLOCKED by B3** | Cannot write the copy before the limit is known. |
| G3 | Analytics funnel instrumentation | **OPEN** | Nothing measures H1 either. |
| G4 | Concurrent-user stress test | **OPEN** | Folds into F1. |

---

# H. DECISIONS WAITING ON JON

| ID | Decision |
|---|---|
| H1 | **The different-device email gap.** Guest credits earned on a laptop, confirmation email opened **on a phone** with no guest cookie, merge cannot fire, **credits stranded silently.** Not a bug — it is how people read email. The most likely real-world failure left in the funnel, and nothing measures it. |
| H2 | Approve the Sentry dependency → E1 |
| H3 | Schedule the ledger backup → E2 |
| H4 | Rule on the pricing arbitrage → B4 |
| H5 | Contact form: real mailer or `mailto:`? → E9 |
| H6 | **Vercel Pro** → E11. A paused deployment takes the whole site offline. |
| H7 | **Approve the terms wording** → C1. The only thing between here and revenue. |

**Ratified:** guest credits carry over **once, ever.**

---

# WHY THE ENGINE GATES THE MONEY — the conductor's recommendation

The terms fix, Vercel Pro and the wiring are all that stand between today and a
working checkout. It is tempting to do those three and open the doors.

**Don't, and here is the concrete reason.** The moment real money moves, a
student pasting a 5,000-word essay is spending real credits on a path that
**has never once executed in production** (B3). And if it does succeed, B1 says
it comes back with the formatting destroyed — a document they paid for and now
have to rebuild by hand.

That is a refund generator, a dispute generator and a reputation problem, all
arriving in the first week when they cost the most. A dispute costs ~$24.50
against a ~$0.56 refund.

**So the engine work is not parallel nice-to-have. It is on the critical path to
revenue, and it is the longest unstarted item on the board.**

---

# RISKS BEING TRACKED

1. **Nothing above 2,000 words has ever run in production (B3).** The product's
   core case is a student with a long document. That case is unproven, and it is
   about to become a paid case.
2. **The ledger has no backup (E2).** The one unrecoverable failure mode. The
   script that fixes it is written and simply not scheduled.
3. **Nothing is watching production (E1).** No Sentry.
4. **Vercel Hobby is already in violation (E11).** `/pricing` advertises a sale
   today. The penalty is the whole site going dark.
5. **Nothing is pushed (E4).** 76 commits exist only on this machine. Pushing is
   Jon's call, but the laptop is currently the only copy.

---

# CHANGE LOG

- **21 Aug, created.** Built from the launch handoff. Re-verified the live-site
  claims with curl. Three corrections: D10 undercounted, D11 is wrong, and the
  uncommitted tree (E4) was a risk the handoff never mentioned.
- **21 Aug, updated after the Stripe close-out.** Stripe build/test moved to
  DONE and its territory released, unblocking B6, C2, C3, C4. Added E11 (Vercel
  Pro) and E12 (production wiring) — **neither was in the original handoff, and
  E11 is a launch blocker.** Added E13 (forged guest cookie, open by choice) and
  B2a (no extension allowlist — the brief's "seven input paths" is wrong).
  Re-verified: the live terms still say the service is free; production has no
  `STRIPE_*` variables. E4 closed — the tree is committed.
- **21 Aug, after W4 landed.** Verified W4 independently rather than filing its
  note: read the source, then measured the served titles, canonicals and
  description lengths against a running build. **Every claim held.** Its title
  template demonstrably fixed four pages it never edited. Recorded three things
  its note surfaced honestly: D6 is only 3 of 9 pages and **deliberately so**
  (D14 — a root canonical would make six pages each claim to be the homepage,
  and a wrong canonical is worse than a missing one), `/capabilities` is still
  171 characters (D13), and the handoff's one-port-per-session rule does not
  work (E14 — Next.js locks per build directory, not per port). Added E15: the
  deploy is its own critical-path item, because **nothing done today is on the
  internet yet**. Added C2a from W2's own admission that the durable-medium
  limb is only partly closed. W4 left its work uncommitted; the conductor
  committed it by explicit path after confirming the staged set contained no
  engine or legal files.
- **21 Aug, W3 scrapped by Jon.** Its two items did not disappear, they moved.
  The word counter (B6) was absorbed into W1, whose scope Jon widened to include
  the workbench — so the workbench is now **held**, not free, and the checklist
  records that before something else walks into it. The disclosure line (C4) was
  declined outright. **Checked rather than just filed:** the privacy policy
  already discloses the rewrite leaving for an AI model, so section 2D's line
  was a trust idea and not a legal requirement, and declining it exposes
  nothing. Recorded as do-not-re-propose because a declined suggestion with no
  reasoning attached is exactly what a future session re-raises.
- **22 Aug, after W5 and the America-only ruling.** Verified W5 rather than
  filing it: 19 notes merged into entries 115–127 and deleted, the five that
  live sessions still read held back with pointer headers, and the stale
  `legal-research.md` correctly flagged down to the section number. Section C
  rewritten around **decision 115** — Jon closed the UK/EU consumer question by
  **removing the market**, so the whole consent ceremony was built, proven and
  then deleted the same day. Four items closed, four opened: **nothing enforces
  the US-only term** (C8, a dashboard job), **GDPR still applies to the free
  tool worldwide** because restricting sales does not restrict use (C9),
  arbitration is now the highest-value US addition (C10), and US state sales tax
  replaces EU VAT with a nexus trigger (C11). Also corrected the conductor's own
  word-counter hypothesis: half right, and W1 found a second site it missed.
- **22 Aug, Vercel Pro bought.** E11 closed. Corrected a premise before it became
  a plan: **Vercel Pro backs up no database.** The ledger is in Supabase and
  Vercel never sees it; the "7 days" Jon had in mind is Supabase Pro at $25/mo.
  What Pro actually unlocked is the **mechanism** — Cron Jobs — not the backup.
  Added E2a, which lowers the stakes honestly: every purchase row carries its
  Stripe payment intent id, so **purchases are reconstructible from Stripe** and
  only free grants and spent balances are truly unrecoverable. Added E2b with
  the caveat that matters more than the schedule — restoring a CSV into an
  append-only ledger is an untested path, and an untested restore is not a
  backup. Flagged **E11a as urgent**: W1 measured the size ceiling on Hobby and
  the plan changed underneath it while it is still running.
- **22 Aug, the EU card block failed live.** `This Radar feature is not enabled.`
  Editing Radar value lists needs Radar for Fraud Teams, which is paid and not
  enabled. **This reverses `legal-applied-stripe.md` §6.2's "no paid Radar tier"
  claim, which was verified in test mode where Stripe grants those features
  free.** Third instance today of the same failure shape. Recommended launching
  without it: entry 115 made the restriction contractual, and no page claims
  cards are refused, so nothing becomes false. **The launch sequence continues
  without step 3.**
- **22 Aug, W6 landed.** Canonicals now cover **8 of 9 pages**, `/capabilities`
  is 151 characters, and `/pricing` remains the one deliberate gap until W1 lets
  go of it. Verified against a running build rather than taken on report — the
  diff was six lines across five files with nothing outside its territory.
  **W6 left its work uncommitted and wrote no session note**, both required by
  its brief; the conductor committed it by explicit path after confirming the
  staged set contained none of W1's in-flight engine, workbench or pricing files.
- **22 Aug — LAUNCHED.** Steps 1, 2 and 4 done; step 3 skipped for the paid
  Radar tier; **step 5 not yet done.** The first deploy shipped with checkout
  dead: the Vercel variable was named `Stripe_Secret_Key` and the code reads
  `STRIPE_SECRET_KEY`. Caught by probing the live endpoint rather than trusting
  the deploy, and fixed before a single real card was used. Recorded as E16, and
  E17 records the `.env.local` overwrite prompt that nearly took the local test
  keys with it.
- **22 Aug — first real purchase, verified.** $4.99, 10 credits. Checked against
  the live database rather than taken on report: **exactly one purchase row on
  the whole ledger**, so the webhook idempotency that was proven three times in
  test mode held on its first real delivery. The row carries both a live
  `stripe_payment_intent_id` and a `stripe_event_id`, which **confirms E2a on
  real data** — a lost ledger could rebuild its purchases from Stripe. All four
  invariants pass. **The refund path is still unproven in live mode (1a).**
- **22 Aug — the refund path proven too.** `id 489, -10 money_refund`, removing
  exactly ten and leaving the three signup credits alone. That is the live proof
  of the most dangerous defect the Stripe audit caught: `amount_refunded` is a
  running total, and reading it as the current refund would have taken credits
  from other purchases. **The whole money path is now proven on real money, not
  in test mode.** Four invariants still pass across 62 rows.
