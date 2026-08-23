# Workflow B — F1, the full audit

**Everything, end to end, as a real user and against the real backend.** Finds
anything broken, wrong, fragile or frictional, and prevents future problems.
**This workflow writes no code.** It produces verified findings.

## The 14 dimensions

| # | Dimension |
|---|---|
| 1 | **The money path** — checkout session creation, webhook handling, all six events, idempotency, refunds, disputes |
| 2 | **Ledger integrity** — the ledger, Stripe and Supabase must agree with each other |
| 3 | **Auth and accounts** — signup, signin, guest merge, deletion cascade, password reset, the different-device gap (H1) |
| 4 | **The engine on production** — every accepted file type, every size, real timings. **Absorbs B11: nothing has ever been measured on production** |
| 5 | **The workbench as a real user** — every state, every error, desktop and phone |
| 6 | **Security** — the forged `uc-guest` cookie (E13), rate limits, injection, the payment API surface |
| 7 | **Copy and the claims boundary** — CLAUDE.md §7. Does anything present layer B as provable? |
| 8 | **Legal consistency** — do the pages still agree with the code after the US-only ruling (entry 115)? |
| 9 | **SEO and metadata** — post-deploy reality |
| 10 | **Accessibility** — never started (G1) |
| 11 | **Performance** — Core Web Vitals, cold starts |
| 12 | **Friction and conversion** — the visitor's actual journey |
| 13 | **Error handling and failure modes** — what a customer sees when something breaks, and whether they are charged |
| 14 | **Operations** — no Sentry (E1), no scheduled ledger backup (E2) |

## Verification, and it is the point

**Every finding gets three independent skeptics prompted to REFUTE it.**
Majority-refute kills it. **A finding that cannot be reproduced against the live
site dies**, regardless of how good the reasoning looks.

**Why this is non-negotiable here.** Five claims today were true in test or in
source and false in production: the phantom `noindex` twice, the never-deployed
payment path, an `sk_live` grep that matched a comment warning, and a Radar tier
that only exists in test mode. **This project's characteristic failure is a
confident finding that was never probed against reality.**

## Money rules

- **NO PURCHASES.** Nobody enters card details. Verify the payment path up to,
  but not including, the card form.
- **Fund test accounts by inserting ledger rows** in the same append-only shape
  the grants use, then delete the account — deletion cascades, verified.
- **Label every test account** so it is distinguishable from a real customer.
- **Read the AI Gateway balance at the start and the end and report the exact
  spend.** Budget guidance: roughly $2–5 of a ~$14 balance.
- **The dev credit bypass must be OFF** for anything about money or size.

## Do not break the live site

It is taking real money. Read, probe and measure. **Do not deploy, do not push,
do not change configuration, do not alter production data** beyond the labelled
throwaway accounts described above.
