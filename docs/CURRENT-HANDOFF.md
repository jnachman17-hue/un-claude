# Un-Claude: Current Handoff

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
