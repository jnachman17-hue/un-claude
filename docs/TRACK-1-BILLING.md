# Track 1: Pricing, Stripe and credits

**Jon's stated priority.** The product works and cannot take money.

---

## Read these, in this order, before anything

| # | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` | The rules. Jon is not a programmer, cannot review code, and an assertion that something works carries no weight |
| 2 | `docs/TRACK-RULES.md` | **File ownership. Four sessions are running in parallel** |
| 3 | This file | |
| 4 | **`docs/03-pricing.md`** | **The whole cost picture, measured. Sections 3 and 4 first, then 6.** Written by a session that read the gateway live |
| 5 | `docs/06-...` rows **49, 51, 52, 53**, then 18, 37, 47 | Everything billing is blocked on or must avoid |
| 6 | `docs/04-decision-log.md` entries **16, 22, 43, 49** | The rulings that already constrain pricing |
| 7 | `apps/web/engine/ENGINE.md` sections 6 and 8 | Real costs, and the warning that section 6 does not describe production |
| 8 | `apps/web/AGENTS.md` | **Before writing Next.js code.** This version differs from what you remember |

---

## What exists

**Nothing.** No Stripe account, no products, no ledger, no checkout.

**What is already built and must be respected:** a paywall screen that fires
without calling the engine, and a free-use counter in `free-uses.ts` that is
browser storage and trivially reset. Both are in
`_components/workbench/`, **which TRACK 3 owns.** You will need changes there.
Ask Jon rather than editing it.

**Costs, measured rather than estimated.** The engine's entire lifetime spend is
22 cents. Scanning and layer A cost nothing. Layer B costs about 0.06 cents per
thousand words typical, **and up to eight times that**, because retries default to
8 and nobody set the variable. A single request cannot exceed roughly two cents
because of the 60 second ceiling.

**The cost centre is Stripe, not compute.** 2.9% plus 30 cents, where the 30 cents
is 12.9% of a 3 dollar sale. A dispute costs 15 dollars plus 15 to contest plus
the sale. **That single number should drive the refund policy.**

---

## What this session has to achieve

1. **Get the pricing decision out of Jon.** Four questions, and two of them block
   everything: credits only with no subscription at launch, and the entry pack
   price. Then: how generous the signup allowance is, and whether there is a money
   back window. `03-pricing.md` section 6 has a recommendation and the arithmetic.
2. **Stripe account, as an individual.** A US sole proprietor with no EIN uses
   their SSN. **Everything with Jon's identity or bank details in it is his alone
   to enter. Never ask for it and never handle it.**
3. **Write the business description with care.** `06` row 53. It is the highest
   leverage sentence in the whole process.
4. **A refund policy page.** `06` row 52. Stripe expects terms, a refund policy and
   a contact address. Two of three exist.
5. **The credit ledger.** `06` row 49: **it must not live in
   `accounts.public_data`.** Every signed-in user can update that table.
6. **Checkout, webhooks, metering, and the paywall wired to real credits.**
7. **Confirm the Vercel plan.** `06` row 51. Hobby forbids commercial use.

---

## What you must not do

**Do not edit `_components/workbench/**`.** Track 3 owns it. The gate belongs
there and you will need it changed; ask.

**Do not ship a payments change without the policy edits in the SAME commit.**
`06` row 46 and the tables in `07`. Terms "Payment", privacy "What we store",
privacy "Who else is involved", and a governing law section that is deliberately
absent because there is no legal entity. **A terms page saying the service is free
while it charges is a false statement in a legal document.**

**Do not price from guesses about usage.** `usage_record()` records no words,
tokens or retries, so there is no usage history and there never will be for the
period already run. `06` row 48. **Track 3 is fixing it. If real numbers matter to
the decision, wait for that fix rather than inventing a baseline.**

---

## Sequencing that saves a week

**Stripe verification is not on the critical path.** Products, prices, checkout,
webhooks, the ledger and the whole metering path can be built and tested in the
sandbox with test cards before Stripe says anything. Only the first real payment
waits. **Create the account early so the clock runs in the background.**
