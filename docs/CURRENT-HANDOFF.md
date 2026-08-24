# Un-Claude: Current Handoff

---

# 24 AUGUST 2026, LANE B: THE FOUR MIGRATIONS ARE APPLIED

**Jon ran all four. Every one succeeded, and the proofs pass.** Direction one of
the refund bug now removes nothing and records a $4.99 loss instead of
confiscating a second purchase; one address collects 5 free credits instead of
15; a new wallet reads 3 instead of 0. Output in `session-notes/lane-b-money.md`.

**Three things are still outstanding:**

| | |
|---|---|
| **1. A deploy** | Half of M‑2, all of M‑4's writer, and all of M‑6 live in code that is not on un-claude.com. **Until then one address can still mint free credits through the site**, because the deployed grant code does not know about the new record |
| **2. One more migration** | `20260823120400_lock_down_money_tables.sql`. The two new tables arrived deletable — `grant` does not narrow Supabase's default privileges, only `revoke` does. Changes no data |
| **3. The privacy sentence** | Now actually owed. `POLICY-CHANGES-PENDING.md` has the wording |

**After the deploy, watch the logs for `CLIENT GONE:` for a day.** `06` row 89.

---

## What follows is the pre-run version, kept as the record of what was wrong

# 23 AUGUST 2026, LANE B: FOUR MIGRATIONS ARE WRITTEN AND NOT APPLIED

**Jon has to run these. Nothing behind them is fixed until he does.** Full
detail, with the live ledger rows behind every one, is in
`session-notes/lane-b-money.md`.

**Each file is wrapped in a transaction: it applies whole or does nothing. If it
errors, nothing has changed.** Paste into the Supabase SQL editor in this order:

| # | File | Fixes |
|---|---|---|
| 1 | `20260823120000_refund_attribution.sql` | A refund takes credits out of a **different purchase** the customer paid for — and, the other way round, gives back $4.99 and recovers one credit with nothing recording the rest |
| 2 | `20260823120100_grant_claims_survive_deletion.sql` | Free credits can be minted from one address **without limit**: delete, re-register, collect five more |
| 3 | `20260823120200_mint_signup_grant_at_signup.sql` | A new customer's wallet says **"0 credits · Get credits"**. Needs 2 applied first |
| 4 | `20260823120300_record_run_cost.sql` | The privacy policy says we record what a run cost. Nothing ever has, and on the ledger nothing ever could |

**Then prove 1 and 2, one command each. Both fail today.**

    cd apps/web
    node scripts/verify-refund-attribution.mjs
    node scripts/verify-grants-survive-deletion.mjs

**Migrations 2 and 4 also need a deploy, and 2 is the one to be careful about.**
Applying it makes the database refuse a second helping of free credits, but the
site's own grant code — the version currently deployed — does not know about the
new record and would still mint them. Until the deploy, the free-credit hole is
open and `verify-grants-survive-deletion.mjs` will still fail its second check.
**Migrations 1 and 3 are complete on their own and need no deploy.**

**One privacy sentence is owed once migration 2 is applied.** Wording is drafted
in `POLICY-CHANGES-PENDING.md`; the legal pages were not touched.

**Two of the six findings are finished and need nothing:** the refund tool no
longer tells Jon to pay out on an already-refunded payment (it was worse than the
audit said — on a spent pack it advised *"fully unspent, a full refund matches
the policy exactly"*), and a job whose customer disconnects now gives the credit
back.

**Watch the first deploy for one thing:** the connection-drop refund logs
`CLIENT GONE:` every time it fires. A run of those against jobs that plainly
succeeded would mean it is firing wrongly — and that would refund everything.
`06` row 89.

## The section below this one is from 21 August and has gone stale

**It says production carries no Stripe variables and "the live site physically
cannot charge anyone".** That is no longer true — the site is live and taking
real money. Lane B did not verify production's environment and has not edited
that section; **read it as history, not as the current state.**

---

**Rewritten 21 August 2026, end of session 11 — the Stripe session.**

---

## THE HEADLINE: STRIPE IS BUILT, TESTED END TO END, AND NOT DEPLOYED

**Three things stand between here and taking real money, and only one of them is
work.** Everything else on the payment path has a run behind it.

| # | Remaining | Whose |
|---|---|---|
| **1** | **Terms and privacy reconciliation.** The live terms still say *"The service is currently free to use and no payment method is collected."* **That becomes a false statement in a binding legal document on the first charge.** | Drafted by a session, **approved by Jon** |
| **2** | **Vercel Pro.** Hobby forbids commercial use, and Vercel's own definition includes *"advertising the sale of a product or service"* — /pricing already qualifies. Enforcement is a **paused deployment**, whole site offline | **Jon** |
| **3** | **Production wiring.** ~10 min plus ~20 min verifying. Last step, depends on nothing | Jon runs it, procedure written |

**Procedure for 3 is `session-notes/stripe-setup.md` section 16. Do not improvise
it** — the trap is that production needs its OWN webhook signing secret, and
reusing the local one makes every real payment fail silently.

---

## What is true right now

| | |
|---|---|
| **Stripe account** | **ACTIVATED.** `charges_enabled`, `payouts_enabled`, `details_submitted` all true, nothing outstanding |
| **Production** | **NO `STRIPE_*` env vars at all.** The live site physically cannot charge anyone. This is the correct safe state |
| **Deployed** | Nothing from this session. un-claude.com serves an older build |
| **Pushed** | Nothing. Local is ahead of `origin/main` |
| **Migrations** | `20260821150000_stripe_purchases` and `20260821160000_refund_cumulative` are **both applied** |

---

## What was proven, and how to re-prove it

**Twelve suites, all passing.** `session-notes/payments-tested.md` has the
output. All read-only unless noted.

    cd apps/web
    node scripts/verify-stripe-migration.mjs        # 10 checks
    node scripts/verify-stripe-webhook.mjs          # 6 forgery cases, no server needed
    node scripts/verify-payment-edges.mjs           # 12 refusals
    node scripts/verify-pricing-matches-engine.mjs  # price vs engine drift
    node scripts/stripe-refund-check.mjs <pi|email> # BEFORE refunding anyone

    cd apps/e2e
    node stripe-purchase.mjs starter                # a real browser purchase

**The two that write:** `verify-refund-flow.mjs` issues test refunds and
`verify-dispute-flow.mjs` closes a test dispute. Both refuse to run on a live
key.

**The headline result: the same webhook delivered three times produces exactly
one ledger row.** Stripe guarantees at-least-once delivery, so this will happen
in production.

---

## READ THIS BEFORE TOUCHING CREDITS OR THE ENGINE

**An adversarial audit found two CRITICAL bugs in code that predates Stripe.**
Both are fixed. Both are the kind that come back.

1. **`/api/tool/clean` read the guest cookie to decide "is this a conversion?"**
   — and `/api/credits` deletes that cookie on merge, so every converting user
   was paid the +2 welcome grant they had just been correctly denied. **The same
   defect was fixed in one route and missed in the other.** It now reads
   `hasConverted()`. Regression test: `apps/e2e/conversion-regression.mjs`.

2. **The clean route's "text file" list did not match the engine's.**
   `essay.csv` bought an unlimited rewrite for 1 credit; `.md` was charged
   per-word for a rewrite the engine never runs. **`verify-pricing-matches-engine.mjs`
   now guards this. Run it if you edit either list.**

---

## Standing cautions, carried forward

- **Turnstile refuses automated browsers, and that is correct.** The E2E scripts
  sign in with an admin-issued one-time token through `/auth/confirm`, the
  product's own arrival path. **Do not disable the captcha to make a test pass** —
  the anonymous-grant cap is sized on the assumption it is enforced.
- **The Browser preview pane cannot do mobile on this site.** Use
  `apps/e2e/mobile-probe.mjs` / `mobile-shots.mjs`, which drive the installed
  Chrome. **Do NOT run `npx playwright install`.**
- **Next.js 16 refuses a second dev server from the same directory**, whatever
  port. `.claude/launch.json`'s `web-b`/`web-c` entries append the port AFTER a
  pipe, so it reaches `pino-pretty` rather than `next` — they do not work.
- **Never write a `/` immediately followed by `*` inside a SQL comment.**
  Postgres nests block comments and it swallows the rest of the file.
- **Stage commits by explicit path.** Other sessions are live in this folder.

---

## Open, recorded, deliberately not fixed

**A forged `uc-guest` cookie can name another user's anonymous account** and move
up to 2 credits across. It needs an account UUID that is never published
anywhere. Rated LOW by the audit. **In `06` with a revisit trigger** — the guest
merge has been broken three separate ways already, and changing it again to
close a hole requiring a secret is a bad trade this week.

**The virtual mailbox is NOT a blocker.** A real receipt was fetched and checked:
Jon's name and both addresses are absent. Stripe requires the support address as
a setting, not on the receipt. Worth finishing; not gating.
