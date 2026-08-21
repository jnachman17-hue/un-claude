# Sign-up, the merge and the wallet: what is proven and what is not

**21 August 2026, session 10.** Jon asked for these three verified. Two of the
three could be, one could not, and the one that could not turned up the more
interesting finding.

---

## Why the browser test Jon asked for could not be run

**Two independent blockers, either one sufficient.**

1. **Captcha protection is back on**, correctly, at Jon's instruction. With it
   on, this machine cannot create even a guest session, so no browser flow of
   any kind runs locally. Confirmed rather than assumed:
   `signInAnonymously` returns `captcha_failed` right now.
2. **Completing a sign-up means creating an account and entering a password.**
   That is a line I hold and do not cross, whoever asks. It also needs a real
   email round trip that only Jon can complete.

**And the live site is not a substitute.** `un-claude.com` returns 200 but is
running the old code: its sign-up page still serves the repeat-password field
removed tonight. Local is 46 commits ahead of `origin/main` and nothing from
tonight is deployed. A sign-up there would be a test of last week's build.

---

## PROVEN: the 3-credit signup grant

    id  account    delta  reason
    53  f17969e2     +3   signup_grant     2026-08-21T04:13:21

**One row, ever, and it is the right shape.** The grant has fired for real
against the hosted ledger. The per-account index has held: exactly one.

## PROVEN: the wallet's data

The two queries `app/home/page.tsx` runs, executed against that account:

    credit_balance rpc  -> 5
    history rows        -> 2

    5 credits
    About 5,000 words of sanitising. Credits never expire.

    History
      Account credits   +3   2026-08-21
      Welcome credits   +2   2026-08-21

**That is the ratified 2 + 3 = 5, and the reason labels resolve correctly.**

**What this does NOT prove:** that the page renders. Reaching /home needs a
real signed-in session, which is blocked by both constraints above. The data
half is proven, the pixels are not. **/home has still never been looked at on
a phone.**

---

## NOT PROVEN, AND THE FINDING WORTH READING: the guest merge has never run

    adjustment rows in the entire ledger: 0

**`mergeGuestInto` has never executed. Not once, in the product's life.**

**It is not evidence of a bug, and it is not evidence of correctness either.**
The merge deliberately writes nothing when the guest has nothing left, and
every guest account that has ever converted was already at zero: Jon's two
guests spent both welcome credits before he signed up. So the function has
never had anything to move, and every line of it after that early return is
untested against the real database.

**Why that matters more than an ordinary untested path.** This is the code that
decides whether a visitor who signs up mid-job keeps the credits they already
had. If the cookie is not written, or the transfer throws, the visitor
silently loses credits at the exact moment they did what we asked. There is no
error path for it: `mergeGuestInto` either moves the balance or returns 0, and
0 looks identical to "there was nothing to move".

**And tonight's conversion behaviour is newer than the one row we have.** The
parallel session changed `ensureGrants` today so a converting guest no longer
receives the welcome grant a second time (`isConversion`, from the security
audit's double-grant finding). Row 53's account holds 5 because it was granted
+2 AND +3 under the OLD rule. **Under the current code that path has never run
at all.**

---

## The five minutes that would close all of it

Only Jon can do the authenticating half. The division is clean:

1. **Jon turns captcha protection off.**
2. **I run a guest sanitise that leaves one credit unspent**, and confirm the
   `uc-guest` cookie is actually written (`app/api/tool/clean/route.ts` line
   176 writes it; that is read, not proven).
3. **Jon signs up on that same browser**, with his own email.
4. **I read the ledger** and report: whether a `signup_grant` of 3 landed,
   whether two `adjustment` rows appeared carrying the leftover credit across,
   whether the welcome grant was correctly NOT paid a second time, and what
   the final balance is.
5. **Jon turns captcha protection back on.**

**Step 4 is the whole point and it is thirty seconds of reading**
`apps/web/scripts/read-ledger.mjs`.

Until that runs, the honest statement is: **the signup grant works, the
wallet's data is correct, and what happens to a visitor's leftover credits
when they sign up is unknown.**
