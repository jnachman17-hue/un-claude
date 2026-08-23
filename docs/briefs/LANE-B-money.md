MODEL: Opus 5, high effort. This is the only lane losing real money on a
live site while you read this.

READ FIRST, IN THIS ORDER
1. CLAUDE.md in full. Section 4 governs — a run, not an assertion — and
   it is strict here because every claim is about money.
2. docs/session-notes/f1-audit.md, the CRITICAL section and finding 0a,
   0c, 0d. Your findings are reproduced there with real output.
3. docs/session-notes/stripe-setup.md and payments-tested.md for how the
   payment path was built and what was already proven about it.

TERRITORY: apps/web/lib/server/credits.ts, apps/web/app/api/stripe/**,
apps/web/app/api/checkout/route.ts, apps/web/scripts/**, and
apps/web/supabase/migrations/ (new files only).

DO NOT TOUCH: apps/web/engine/**, apps/web/api/*.py, the workbench, the
marketing or legal pages, app/auth/**. Other lanes hold those.

**MIGRATIONS: write the file, hand Jon the exact SQL, and STOP. Nobody
applies migrations except Jon. Nothing behind an unapplied migration is
done.**

**THE SITE IS LIVE AND TAKING REAL MONEY.** Do not deploy. Do not push.
Do not alter production data except through clearly labelled throwaway
accounts you delete afterwards.

═══════════════════════════════════════
M-1 — THE REFUND IS WRONG IN BOTH DIRECTIONS. Do this first.
═══════════════════════════════════════
One mistake, two opposite losses, both reproduced on the live database.

**Direction one — it confiscates credits the customer paid for.** Buy
credits, use them, buy more, then ask for the first purchase back inside
the thirty days the site offers. **The second purchase's credits are
taken instead.** The customer paid for them, never used them, never asked
for them back, and ends with nothing.

**Direction two — it gives the money back and recovers almost nothing.**
Buy ten, spend fourteen, ask for a full refund: the customer gets the
whole $4.99 back and **one** credit is recovered. They keep nine credits'
worth of work they were refunded for, and **nothing records it.**

**THE FIX: clamp against what remains of THAT PAYMENT, not against the
account balance. And write the shortfall down** — today it exists
nowhere, so nobody can even count what it cost.

Reproduce both directions before changing anything, and paste the ledger
rows. Then prove both are closed the same way.

═══════════════════════════════════════
M-2 — FREE CREDITS ARE MINTABLE FOREVER
═══════════════════════════════════════
Delete the account, sign up again on the same email, collect another five
credits. Repeat without limit. **The record that prevents it lives on the
credit ledger, and the deletion cascade takes it with everything else.**

Key the dedupe to something account deletion does not touch. Think about
where that record belongs so it survives deletion **without** keeping
personal data the privacy policy says is deleted — a hash rather than an
address is the obvious shape, and the privacy policy must still be true
afterwards. **If your fix changes what is retained, say so plainly and
hand the copy change to Jon; the legal pages are not yours.**

═══════════════════════════════════════
M-3 — A NEW CUSTOMER'S WALLET SAYS "0 CREDITS" AND OFFERS TO SELL SOME
═══════════════════════════════════════
The grants are minted only when someone visits the tool, so a customer who
signs up and opens their wallet first sees "0 credits · Get credits".
Mint them at signup.

═══════════════════════════════════════
M-4 — RECORD WHAT A RUN COSTS
═══════════════════════════════════════
**The column exists, the engine returns the figure, the privacy policy
already promises it is stored, and nothing writes it.** So the privacy
policy currently describes a record the database never makes. Write it.

═══════════════════════════════════════
M-5 — THE REFUND TOOL LIES ABOUT WHAT IS OWED
═══════════════════════════════════════
`stripe-refund-check.mjs` reports money owed on a payment that has already
been refunded in full. It is the tool Jon would use to decide whether to
send someone money. Fix it and prove it against a payment you know the
state of.

═══════════════════════════════════════
M-6 — A DROPPED CONNECTION CHARGES AND NEVER REFUNDS
═══════════════════════════════════════
A customer whose connection drops mid-job is charged, and watched for
eight minutes against a known three-minute refund window, never refunded.
Find where the refund path depends on the client still being connected.

═══════════════════════════════════════
HOW TO TEST WITHOUT SPENDING MONEY
═══════════════════════════════════════
**NO PURCHASES. Nobody enters card details.** Fund throwaway accounts by
inserting ledger rows in the same append-only shape the grants use, then
delete the account — deletion cascades and takes the rows with it,
verified many times. **Label every test account** so it cannot be mistaken
for a customer. **The dev credit bypass MUST be OFF** — with it on nothing
is charged and none of the real path runs.

There are real customer rows on this ledger now. **Do not touch anything
you did not create.**

═══════════════════════════════════════
FINISHING
═══════════════════════════════════════
Jon is not a programmer and cannot check this by reading code. Every fix
needs the **before and after ledger rows pasted in full.** For M-1, show
both directions failing and then both passing.

Re-run `node scripts/verify-guest-merge.mjs` at the end — it checks the
four ledger invariants and it is cheap.

A step you skipped is a step that failed. Say which.

Write docs/session-notes/lane-b-money.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed — sessions share one git index. Never
`git add -A`, `git add .` or `git commit -a`. Do NOT deploy or push.
