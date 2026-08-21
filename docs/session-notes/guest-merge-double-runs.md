# The guest merge runs twice, and mints credits

**21 August 2026, session 10.** Written the moment it was found, before any fix.

Sign-up itself is fixed (the parallel session's foreign-key work). With sign-up
working, the guest merge ran for the first time in this project's history, and
`mergeGuestInto` is wrong in two independent ways. Both create credits out of
nothing. Both are reachable by anyone, not just by a test.

---

## What Jon saw

He started as a guest with 2 credits, ran one scan (leaving 1), then signed up.
He expected 4 (1 carried over + 3 signup grant). He got **5**.

He was right and the number is wrong.

---

## The proof: the ledger, unedited

`cd apps/web/scripts && node read-ledger.mjs 40`

    225     b135917b            +2  anon_grant        -             -          -  17:41:18
    226     b135917b            -1  spend             clean         text     366  17:41:18
    227     2ba951be            +3  signup_grant      -             -          -  17:42:06
    231     b135917b            -1  adjustment        transfer_out  -          -  17:42:06
    232     b135917b            -1  adjustment        transfer_out  -          -  17:42:07
    233     2ba951be            +1  adjustment        transfer_in   -          -  17:42:07
    234     2ba951be            +1  adjustment        transfer_in   -          -  17:42:07

`b135917b` is the guest, `2ba951be` is the account Jon created.

There are **two** `transfer_out` rows and **two** `transfer_in` rows. There
should be one of each.

Balances that follow from those rows:

    guest   b135917b:  +2 -1 -1 -1  =  -1     <-- NEGATIVE
    account 2ba951be:  +3 +1 +1     =   5     <-- what Jon saw

The run before Jon's shows the same thing, plus a third row type:

    193     bebe4415            +2  anon_grant        -             -          -  17:29:38
    194     bebe4415            -1  spend             clean         text      74  17:29:38
    201     9d1df8e6            +3  signup_grant      -             -          -  17:40:13
    205     bebe4415            -1  adjustment        transfer_out  -          -  17:40:13
    206     bebe4415            -1  adjustment        transfer_out  -          -  17:40:13
    207     9d1df8e6            +1  adjustment        transfer_in   -          -  17:40:13
    208     9d1df8e6            +1  adjustment        transfer_in   -          -  17:40:13
    209     9d1df8e6            +2  anon_grant        -             -          -  17:40:59

    guest   bebe4415:  +2 -1 -1 -1     =  -1
    account 9d1df8e6:  +3 +1 +1 +2     =   7

Seven. That account is holding 7 credits against a ratified maximum of 5.

---

## Defect 1. The merge is not idempotent, and it races with itself

`mergeGuestInto` in `apps/web/lib/server/credits.ts:340` is:

  1. read the guest's remaining balance
  2. if it is positive, write `-remaining` to the guest
  3. write `+remaining` to the account

Nothing anywhere says "this transfer has already happened". Two requests that
arrive together both complete step 1 before either reaches step 2, so both see
`remaining = 1`, and both do the transfer.

**Why two requests arrive together.** The merge lives in `GET /api/credits`,
and two separate components each fetch that route on page load:

  - `apps/web/app/(marketing)/_components/site-header-account-section.tsx:84`
  - `apps/web/app/(marketing)/_components/workbench/credits.ts:89`

This is not a development-mode artefact and it will not go away in production.
It is two real components doing their job. The one-second gap between rows 231
and 232 is those two mounts.

**It is worse than doubling.** The transfer scales with how many concurrent
requests carry the guest cookie. Nothing caps it at two.

**The guest going negative is the same bug seen from the other end.** Step 2
writes `-remaining` with no check that the guest can still afford it.

### Why the grants do not have this bug

Because they are protected in the database, not in application code.
`20260820210000_welcome_grant.sql:37` and `20260819180000_credit_ledger.sql:186`
create partial unique indexes that permit at most one `anon_grant` and one
`signup_grant` row per account, and `grantOnce` catches the resulting 23505
unique-violation. Concurrency cannot beat that, because the database decides.

**The transfer has no equivalent index.** That asymmetry is the whole defect.

---

## Defect 2. The conversion flag depends on a cookie the same route deletes

Row 209 is the evidence: `9d1df8e6` is a real, signed-in account, and it was
paid a 2-credit `anon_grant` 46 seconds after it signed up.

`apps/web/app/api/credits/route.ts` decides whether this is a conversion by
reading the `uc-guest` cookie, and then, sixteen lines later, deletes that
cookie. So:

  - **First call.** Cookie present, `isConversion` true, welcome grant correctly
    skipped, merge runs, cookie deleted.
  - **Any later call.** Cookie gone, `isConversion` false, and the account is
    paid the welcome grant it was deliberately denied a moment earlier.

The `security-audit.md` finding 2 comment in `credits.ts` says this path is
closed and names the exact failure it prevents — "7 credits instead of the
ratified 5". Row 209 is 7 credits. The guard is written against the right
threat and rests on a fact that expires.

**Jon's account has not drifted to 7 yet only because it has not been reloaded
since.** The next `/api/credits` call after the cookie deletion propagates will
pay it. This is a prediction, not an observation, and it is checkable by
reloading and re-reading the ledger.

---

## Both are exploitable, not just wrong

Neither needs a race to be provoked deliberately. Sign up with a guest cookie
set, fire several balance checks at once, and the account gains `remaining`
credits per request. Then reload once more and collect the welcome grant on top.
Credits are the thing being sold.

---

## The fix, and its status

**APPLIED to the hosted database 21 August 2026, and verified below.**

`apps/web/supabase/migrations/20260821140000_guest_conversion_once.sql`, run by
Jon in the Supabase SQL editor. Code changes in `apps/web/lib/server/credits.ts`
and `apps/web/app/api/credits/route.ts`.

**A new table, `guest_conversions`, is the whole idea.** One row per conversion,
`guest_id` primary key and `account_id` unique. The transfer claims that row
BEFORE it moves anything, so the second of two racing calls loses and returns
zero. Its existence is also the durable answer to "was this a conversion",
replacing the cookie that the same request deletes.

**Why a table and not a partial unique index on the ledger,** which was the
first thing tried and is the pattern the grants already use: an index stops the
double but cannot fix defect 2. A guest who spent everything converts with ZERO
credits and writes no ledger row at all, because `credit_ledger.delta` carries
`check (delta <> 0)`. There would be nothing to remember the conversion by.

**The transfer moved into `merge_guest_credits`,** a locking SQL function, for
the same reason `spend_credits` exists: the check and the write must be one
indivisible step, and no amount of care in TypeScript makes them one.

**The merge now runs BEFORE the grants** in `route.ts`. That ordering is the fix
for defect 2: merging first writes the permanent record, so the grant decision
reads a fact instead of a disappearing one.

**A third hole closed on the way.** `account_id unique` means one account
receives one conversion ever. Without it, signing out, collecting a fresh guest
welcome grant and signing back in merged it across every time, repeatable at
will. Nobody had noticed it. The ceiling is now the 2 credits already ratified
as the gaming ceiling in `credits.ts`.

---

## Verification

**The repair.** Six rows deleted: 206, 208, 232, 234 (duplicate transfers) and
209, 235 (welcome grants paid to converted accounts). Predicted by a read-only
dry run against the live ledger before the migration was pasted, and the
prediction matched exactly.

Row 235 deserves its own sentence, because it was a PREDICTION THAT CAME TRUE.
This note originally said Jon's account "has not drifted to 7 yet only because
it has not been reloaded since". He reloaded. Row 235 is the welcome grant that
landed, taking it to 7, exactly as defect 2 said it would.

**`node apps/web/scripts/verify-guest-merge.mjs`, after the migration:**

    guest bebe4415  ->  account 9d1df8e6   carried 1
        193   +2  anon_grant
        194   -1  spend          (text, 74 words)
        205   -1  adjustment     transfer_out
               0  = guest balance now
        201   +3  signup_grant
        207   +1  adjustment     transfer_in
               4  = ACCOUNT BALANCE NOW

    guest b135917b  ->  account 2ba951be   carried 1
        225   +2  anon_grant
        226   -1  spend          (text, 366 words)
        231   -1  adjustment     transfer_out
               0  = guest balance now
        227   +3  signup_grant
        233   +1  adjustment     transfer_in
               4  = ACCOUNT BALANCE NOW

    1. no doubled transfers            PASS
    2. no negative balances            PASS
    3. every transfer has a record     PASS
    4. no welcome grant after convert  PASS

    All four hold. 47 ledger rows, 2 conversion(s) on record.

Four is the number the design says. Both accounts hold it.

**The guard, probed directly against the live database.** Ten simultaneous
`merge_guest_credits` calls on an already-converted pair:

    returned: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    merge(a real account named as the "guest") -> 0
    merge(a guest id that does not exist)      -> 0

    ledger rows before: 47
    ledger rows after:  47
    NOTHING WAS WRITTEN. Correct.

**WHAT THIS DOES NOT YET PROVE, stated plainly.** Those ten calls exercise the
ALREADY-CONVERTED branch. The FRESH race — two calls arriving when no conversion
record exists yet, which is the original bug — has not been executed, because it
needs a real guest session and a real signup. It is guarded by the row locks and
the unique constraints, which is reasoning, not a run.

The end-to-end test closes it, and closes it well, because the two page
components firing at once IS the fresh race: scan once as a guest (2 -> 1), sign
up, then reload repeatedly. The balance must be 4 and must stay 4.
