# un-claude.com — Launch Checklist

**The single live picture of what is done and what is left.**

**THE CONDUCTOR IS THIS FILE'S ONLY WRITER.** If you are a working session, do
not edit this file. Write `docs/session-notes/<your-topic>.md` and the conductor
will read it, verify it, and update this. Several sessions appending to one file
is the one thing git cannot merge, and it has already caused problems here.

**Last updated 21 Aug 2026** — after the Stripe session closed out. Every live
claim below was re-checked with a real run, not inherited.

**Sources:** `HANDOFF-2026-08-21-launch.md` (the inventory and the reasoning),
`CURRENT-HANDOFF.md` (rewritten by the Stripe session),
`session-notes/stripe-setup.md` §16 (the go-live procedure).

---

## Status key

**DONE** finished with a real run behind it · **OPEN** nothing is stopping it ·
**BLOCKED** blocker named · **JON** only Jon can do it · **RUNNING** in progress

---

# ★ THE CRITICAL PATH TO TAKING MONEY

Four things, in this order. Nothing else on this page blocks revenue.

| # | ID | Item | Status | Owner |
|---|---|---|---|---|
| 1 | **C1** | Terms & privacy reconciliation | **OPEN — the only real work** | session drafts, **Jon approves** |
| 2 | **E11** | Vercel Pro | **JON** | Jon |
| 3 | **E12** | Production wiring, ~10 min | **BLOCKED by C1, E11** | Jon |
| 4 | **F1** | The Fable 5 audit | **BLOCKED** | Jon triggers |

**The conductor's position: do not open checkout before the engine work lands.**
See "Why the engine gates the money" at the bottom.

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
| B1 | **Formatting is destroyed** | **OPEN** | F1, money | The biggest one. Hits everyone who pastes more than a paragraph. Cause unknown — `uc_chunk` chunking, the rewrite round-trip, clean-path normalisation, or the copy button. **Find before fixing.** |
| B2 | **No file type tested end to end** | **OPEN** | F1, money | Does a `.docx` still open in Word afterwards? A corrupted output is worse than an uncleaned one. **See the correction below — this is bigger than the brief says.** |
| B2a | **No extension allowlist on the clean route — NEW, conductor's finding** | **OPEN** | B2 | `ACCEPTED_FILES = '.txt,.md,.docx,.png,.jpg,.jpeg'` is only the **file-picker hint**. The clean route validates the extension **nowhere**. The engine handles ~24 extensions, and the Stripe audit's own `.csv` undercharge proves other types get through. **So the brief's "seven input paths" is wrong.** `.pdf` is in the engine's `CONTAINER_EXTS` while `04` entry 26 says PDF is deliberately unsupported — nobody knows what a PDF upload does today. |
| B3 | **The two size ceilings** | **OPEN** | F1, money, G2 | Localhost 10,000 words fails with **nothing timing it out** = engine defect. Production: **nothing above 2,000 words has ever run.** Measure, then recommend one of raise the cap / background work / honest limit. |
| B4 | **Pricing arbitrage** | **OPEN → then Jon** | H4 | 10k pasted = 10 credits; the same text as `.txt` = 1. Verify it is real; the ruling is Jon's. A session must **not** quietly change the pricing rule. |
| B5 | **Retry exhaustion at 1,000 words** | **OPEN** | — | `uc_chunk`'s retry loop sometimes gives up. Both known cases refunded correctly. Never investigated. |
| B6 | **Word counter freezes on a stale number** | **OPEN — unblocked by Stripe closing** | — | Delete 10,000 words, box empty, still reads "10,524 words". **A price display that lies.** *Conductor's untested hypothesis:* `workbench.tsx:1465` reads `countWords(loaded.text \|\| text)`, so a non-empty `loaded.text` wins forever once set. Read, not run — verify it. |

**Do not edit `ENGINE_TEXT_EXTS` or the engine's `TEXT_EXTS` without running
`verify-pricing-matches-engine.mjs`.** It guards a 100x undercharge. It passes today.

---

# C. LEGAL AND POLICY

| ID | Item | Status | Blocks | Note |
|---|---|---|---|---|
| C1 | **Terms & privacy reconciliation** | **OPEN — unblocked, and it is the money blocker** | E12, F1 | **Re-verified live today:** the terms still read *"The service is currently free to use and no payment method is collected"* and *"go on sale when card checkout opens."* **Both become false statements in a binding legal document on the first charge.** Three edits queued: that sentence, a payment-security line for Stripe's website checklist, and terms for the 2+3 free-credit promotion. Draft in `legal-research.md` §9A–9H. **Jon approves the text.** |
| C2 | **Checkout consent ceremony** | **OPEN — unblocked** | F1 | A legal requirement, not a nicety. The 30-day refund does **not** satisfy the UK/EU statutory withdrawal right. Needs express consent + a pay button stating the amount ("Pay $9.99", never "Continue") + durable-medium confirmation (the Stripe receipt covers it). **Cheap now, expensive to retrofit.** |
| C3 | **Refund on the pricing page** | **OPEN — unblocked** | — | The live terms already promise it word for word. Refund ≈ $0.56, dispute ≈ $24.50. **Must never be labelled "your right to cancel"** — the voluntary policy and the statutory right are two different things. |
| C4 | **Disclosure line at the tool's button** | **OPEN — unblocked** | — | "Your text is processed and deleted, never stored. The optional rewrite sends it to an AI model to be rewritten." The people who care most are the ones who never sign up. |
| C5 | **Essay-mill advertising constraint into `unclaude-messaging`** | **OPEN** | — | The offence does not cover this product, but **advertising such a service to students is a separate offence.** A hard constraint on marketing. Put it in the skill so it binds all future copy. |
| C6 | Deferred legal decisions | **JON** | — | Name and address handled inside the Stripe chat. **No entity will be formed — settled.** Remaining: MoR, VAT for EU sales, ICO registration. |

---

# D. SEO

**Two handoff conclusions were wrong and are closed. Re-verified with curl today.**

| ID | Item | Status | Note |
|---|---|---|---|
| D1–D3 | Search Console property · sitemap · robots.txt | **DONE** | Sitemap **200**. Robots correct. Re-verified. |
| D4 | ~~noindex blocking Google~~ | **NOT A DEFECT** | **Zero `noindex` on any live page.** Search Console's data was a 15 Aug crawl. **Do not hunt for it.** |
| D5 | ~~Temporary redirects~~ | **NOT A DEFECT** | All **308 permanent**. Re-verified. |
| D6 | **No canonical tag anywhere** | **OPEN** | Self-referencing per page — each page its own URL, **not** all pointing at the homepage. |
| D7 | Re-crawl: Test Live URL, then Request Indexing | **BLOCKED by D6** | Jon. This is the actual fix for D4. |
| D8 | Inspect `www.`, confirm "Page with redirect" | **JON** | Search Console action. |
| D9 | **Titles lose the brand off the homepage** | **OPEN** | Homepage is "Un-Claude · AI Watermark Remover"; `/pricing` is bare "Pricing". Needs a title template. |
| D10 | **Meta descriptions over length** | **OPEN** | **The handoff undercounted.** `/how-it-works` 181, homepage 162, `/pricing` 158, three legal pages 162 each. Google truncates near 155–160. |
| D11 | **Legal pages' descriptions are wrong, not missing** | **OPEN** | **The handoff is wrong about this.** They all inherit the site default, so Terms describes itself as "Scan text and files free for hidden AI watermarks…". **Give this to the legal session, not the SEO session — same files.** |
| D12 | Structured data | **OPEN** | Additive. Lowest priority. |

---

# E. OPERATIONS

| ID | Item | Status | Note |
|---|---|---|---|
| E11 | **Vercel Pro — NEW, not in the original handoff** | **JON — a launch blocker** | Hobby **forbids commercial use**, and Vercel's definition includes "advertising the sale of a product or service" — `/pricing` already qualifies today. Enforcement is a **paused deployment: the whole site goes offline**, usually after an email. *Conductor could not read the plan tier from the CLI; Jon must confirm in the dashboard.* |
| E12 | **Production wiring** | **BLOCKED by C1, E11** | ~10 min + ~20 verifying. Live key into **Vercel env, never a file**. A **production** webhook at `https://un-claude.com/api/stripe/webhook` on all six events, **with its own signing secret** — reusing the `stripe listen` one makes every real payment fail silently. Procedure: `stripe-setup.md` §16. **Do not improvise it.** |
| E1 | **Sentry not wired** | **JON approves dep** | Account created, never connected. **If the site breaks at 3am nobody finds out until Jon looks.** |
| E2 | **No database backups** | **JON** | Accepted risk. Pro ($25/mo) and PITR ($100/mo) declined. **The ledger is the one unrecoverable failure in this system.** `backup-credit-ledger.mjs` works and is **not scheduled.** |
| E3 | **25 session notes await merging** | **OPEN** | `CURRENT-HANDOFF.md` is now **fresh** (Stripe session rewrote it). Decision log at entry 114. Zero collision risk. |
| E4 | ~~Uncommitted working tree~~ | **DONE — 21 Aug** | Was the highest operational risk on the board. Five commits: the Stripe path, the icon fix, the density cuts, the records, the vendored skills. **Six session notes had never been committed at all**, including the entire legal research and the go-live procedure. Tree is clean. **Local is 76 commits ahead of origin — nothing is pushed.** Secret-scanned before committing: no keys, only placeholders and a public Turnstile site key. |
| E13 | **Forged `uc-guest` cookie can move 2 credits — open by choice** | **OPEN** | A forged cookie can name another user's anonymous account and take up to 2 credits. Needs a UUID that is never published. Recorded in `docs/06` with a revisit trigger. Deliberately not fixed. |
| E5 | `proxy.ts` excludes `/api/*` | **OPEN** | API routes skip middleware, so there is no natural home for a site-wide rule. Architectural, not urgent. |
| E6 | Vercel log retention unverified | **JON** | Blocks one privacy sentence. Read it off the dashboard. |
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
