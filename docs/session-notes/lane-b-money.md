# Lane B — the money path, 23 August 2026

**Six findings from `f1-audit.md`, all of them about money. Every one was
reproduced on the live database before anything was changed, and the actual
ledger rows are pasted below.**

**Nothing was deployed. Nothing was pushed. No purchase was made and nobody
entered card details.** Every account used here has an address beginning
`lane-b-money-` and every one was deleted afterwards. The ledger held 93 rows
when this session started and holds 93 now.

---

## READ THIS FIRST: four of the six are not finished

**Four migrations are written and NOT APPLIED.** A migration is a change to the
database itself, and nobody applies one but Jon. Until he does, three of the six
findings are still live on the site exactly as the audit found them.

**Each file is wrapped in a transaction, which means it either applies whole or
does nothing at all. If it errors, nothing has changed.** Paste them into the
Supabase SQL editor in this order:

| # | File | What it changes | Fixes |
|---|---|---|---|
| 1 | `20260823120000_refund_attribution.sql` | Refunds take back only what that payment has left, and write down what they could not recover | **M‑1** |
| 2 | `20260823120100_grant_claims_survive_deletion.sql` | Free credits go to an inbox once, in a record deleting the account cannot reach | **M‑2** |
| 3 | `20260823120200_mint_signup_grant_at_signup.sql` | The signup credits exist before the customer opens their wallet | **M‑3** |
| 4 | `20260823120300_record_run_cost.sql` | Somewhere the cost of a run can actually be written | **M‑4** |

**File 3 needs file 2 first.** The others are independent.

### Two of them are only half of the fix, and applying them alone is not enough

| Fix | Migration | Deploy |
|---|---|---|
| **M‑1** refunds | **enough on its own.** The whole correction is inside the database function the webhook already calls | not needed |
| **M‑2** free credits | needed | **also needed** — see below |
| **M‑3** the wallet reading 0 | **enough on its own.** The grant is minted by the database | not needed |
| **M‑4** run cost | needed | **also needed.** The code that writes the row is in the site |

**Why M‑2 needs both, spelled out because getting this wrong would leave the
hole open while looking closed.** The migration makes the *database* refuse a
second helping — so the grant minted at signup is correctly withheld on a
re-registration. But the site's own grant code is what runs when somebody uses
the tool, and **the deployed version of it does not know about `grant_claims`
yet.** It would mint the credits the trigger had just refused. Until the deploy,
`verify-grants-survive-deletion.mjs` will still fail its second check, and that
is the script telling the truth rather than a fault in it.

**Then prove them, one command each:**

```bash
cd apps/web && node scripts/verify-refund-attribution.mjs
```

```bash
cd apps/web && node scripts/verify-grants-survive-deletion.mjs
```

Both fail today and both should pass afterwards. They build the situation on
throwaway accounts, run the real code, print every ledger row, and delete the
accounts whether they pass or fail.

**Two of the six are finished and need nothing from Jon: M‑5 and M‑6.**

---

## M‑1. The refund was wrong in both directions

**One mistake. `refund_purchase` worked out how many credits it was allowed to
take back by looking at THE WHOLE ACCOUNT BALANCE**, which is not the same thing
as what is left of the payment being refunded.

### Direction one, reproduced live: it took credits from the wrong purchase

Buy a pack, use it up, buy another, then ask for the first one back inside the
thirty days the site offers.

```
  before the refund: balance 10
      delta  reason            payment                  cents  words
       +2  anon_grant        -                            -      -
       +3  signup_grant      -                            -      -
      +10  purchase          pi_LANEB_A_mt6h6j31        499      -
      -15  spend             -                            -  15000
      +10  purchase          pi_LANEB_B_mt6h6j31        499      -
    SUM = 10

  Stripe refunds pack A in full ($4.99).
  credits removed by that refund: 10
  balance after: 0
      delta  reason            payment                  cents  words
       +2  anon_grant        -                            -      -
       +3  signup_grant      -                            -      -
      +10  purchase          pi_LANEB_A_mt6h6j31        499      -
      -15  spend             -                            -  15000
      +10  purchase          pi_LANEB_B_mt6h6j31        499      -
      -10  money_refund      pi_LANEB_A_mt6h6j31        499      -
    SUM = 0
```

**Pack A's credits were already spent, so the clamp found pack B's and took
those.** The customer paid $4.99 for pack B, never used it, never asked for it
back, and ends with nothing. The refund row even carries pack A's payment id.

### Direction two, reproduced live: it gave the money back and recovered one credit

```
  before the refund: balance 1
       +2  anon_grant
       +3  signup_grant
      +10  purchase          pi_LANEB_C_mt6h6j31        499
      -14  spend                                              14000
    SUM = 1

  Stripe refunds the whole $4.99.
  credits removed by that refund: 1
  balance after: 0
```

**The customer gets the entire $4.99 back and keeps nine credits' worth of work
they were just refunded for, and nothing anywhere records the nine.**

### The fix, and the one rule it rests on

**Credits are spent oldest first.** That is the whole rule. The free credits
arrive first and are used up first; a purchase is only eaten into once
everything granted before it has gone. So for the payment being refunded:

- what it sold, less what has already been refunded against it → what it still
  stands for;
- everything granted before it, less refunds already taken against *those*
  payments → the queue ahead of it;
- spending fills that queue from the front, and anything beyond it came out of
  this payment.

**What is left of one payment can never be more than the whole balance, so the
old zero-balance floor still holds and is kept as a second guard.** Nothing can
now reach into another purchase.

**And the shortfall is written down**, in a new `refund_shortfalls` table, with
the cash value beside it. Under direction one it records 10 credits and $4.99
recovered by nothing. Under direction two, 9 credits and $4.49. That number
existed nowhere before, which is why nobody could count what refunds had cost.

**The table deliberately keeps the record after the account is deleted** — the
link to the person is dropped, the loss stays countable. Reading it:

```bash
cd apps/web && node scripts/read-refund-shortfalls.mjs
```

**NOT DONE UNTIL THE MIGRATION IS APPLIED.** Today the verification script fails
four checks, which is the output above.

---

## M‑5. The refund tool told Jon to pay out money that was already refunded

**Finished. Nothing needed from Jon.**

Run against the only real purchase the site has ever taken — a $4.99 pack bought
and refunded in full — the tool printed:

```
BALANCE NOW      1 credits
SPENT (lifetime) 2 credits
ALREADY REFUNDED 10 credits

>> REFUNDABLE    1 of 10 credits
>> THAT IS       $0.50 of $4.99
```

It printed the already-refunded figure and then never subtracted it. And the
balance it worked from includes free grant credits, so the one credit it offered
to hand 50 cents back for was a signup gift the customer never paid for.

**The same payment now reads:**

```
THIS PAYMENT
  bought                  10 credits
  already refunded        10 credits
  since spent              0 credits
  ------------------------------
>> STILL THERE TO TAKE BACK  0 of 10 credits
>> SO REFUND AT MOST         $0.00 of $4.99

!! THIS PAYMENT HAS ALREADY BEEN REFUNDED IN FULL. There is nothing
   left to give back. Refunding again would be a second payment out
   of your pocket for the same sale.
```

### It was worse than the audit said, and this is the part worth reading

Both tools were run against the same throwaway account holding direction one's
ledger — pack A spent, pack B untouched — and asked about pack A.

**The old tool:**

```
BALANCE NOW      10 credits
SPENT (lifetime) 15 credits

>> REFUNDABLE    10 of 10 credits
>> THAT IS       $4.99 of $4.99

OK: fully unspent and inside the window. A full refund in Stripe
    matches the policy exactly.
```

**That is the advice that causes direction one.** It tells Jon a payment whose
credits are entirely gone is fully unspent, and refunding on it confiscates a
different purchase.

**The new tool, same account, same payment:**

```
THIS PAYMENT
  bought                  10 credits
  already refunded         0 credits
  since spent             10 credits
  ------------------------------
>> STILL THERE TO TAKE BACK  0 of 10 credits
>> SO REFUND AT MOST         $0.00 of $4.99

!! THEY HAVE SPENT 10 credits OF THIS PAYMENT. Refunding the
   full $4.99 in Stripe will take back only 0 credits,
   because the rest is work that has already been done.
```

**It now asks the same question the database asks**, so the number it prints in
advance is the number that will actually come back.

---

## M‑2. Free credits could be minted from one address without limit

Three rounds of delete-and-register on one address, on the live database:

```
  address lane-b-money-mint-mt6hhe22@un-claude.com

round 1: balance 5   [+2 anon_grant, +3 signup_grant]
round 2: balance 5   [+2 anon_grant, +3 signup_grant]
round 3: balance 5   [+2 anon_grant, +3 signup_grant]

  credits collected per round: 5, 5, 5
  total free credits minted from ONE address: 15
```

**The guard against this was a column on the credit ledger, and deleting an
account cascades the ledger away.** The guard was deleted along with the thing
it was guarding against — and the product ships a "Delete your Account" button,
so no tools are needed.

**The fix: a `grant_claims` table with no link to any account at all**, holding a
hash of the address rather than the address. Nothing about it can be reached by
the deletion cascade, because nothing about it points at an account.

**It covers the welcome grant as well as the signup grant.** The audit named the
3-credit signup grant. But the 2-credit welcome grant has no per-network cap on
a *real* account, so closing only the first would have left 2 credits per
re-registration mintable without limit. An anonymous browser account is
untouched: it has no address to key on and stays capped per-IP and behind
Turnstile exactly as before.

**Everyone who already has their credits is recorded when the migration runs**,
so accounts that exist today are covered too and not given one free pass.

**What it costs an honest person:** somebody who deletes their account by mistake
and registers again gets no second helping of free credits.

### This changes what survives a deletion, and the privacy page has to say so

**Jon's copy to write, not mine. The legal pages are not this lane's.**

What is kept after an account is deleted, and only this: **a 64-character
fingerprint of the address, which grant it was, the date, and a count of how many
times that inbox has asked again.** The address itself is not stored and cannot
be read back out of the fingerprint — but a fingerprint **can be checked against
a guess**, so it is not the same as keeping nothing, and the page should not
imply it is. It carries no name, no account, no balance and no history.

**A suggested shape, for Jon to rewrite in his own voice:** *"If you delete your
account we keep one thing: a scrambled fingerprint of your email address, so the
free credits that come with signing up cannot be collected over and over. It
cannot be turned back into your address, and it is not attached to your name, your
history or anything you did here."*

---

## M‑3. A new customer's wallet said "0 credits" and offered to sell them some

The sign-up page promises three free credits. The first page a customer opens
after confirming their email said **0 credits · Get credits**. Later, if they
found the tool, it became 5.

**The cause: the free credits were minted by the tool, and the wallet page never
calls it.** The signup grant is now paid in the database the moment the email is
confirmed, before any page can be looked at. The wallet page reads the balance
directly and needs no change at all.

**Only the signup grant, and this is deliberate.** The welcome grant is withheld
from someone who used the tool as a guest first, because their guest account was
already paid it. Whether a new account is such a conversion **is not knowable at
the moment it is created** — the browser's cookie is what says so, and no
database can see a cookie. Paying the welcome grant there would pay it to
converting accounts too, which is the 7-credits-against-a-ratified-5 defect
`guest-merge-double-runs.md` exists to record.

**So the wallet reads 3 at signup — exactly what the sign-up page promised — and
5 once the tool is first used.** "0 credits · Get credits" never appears.

**Recorded as open in `06`:** the number still moves from 3 to 5. Closing that
means telling a conversion from a cold signup at account-creation time, which is
a different piece of work.

---

## M‑4. The privacy policy describes a record the database could never make

The policy says the credit history records *"what the run cost us to perform"*.
The column exists, the engine returns the figure, and nothing has ever written
it.

**It could never have written it, and that is the finding.** The credit is spent
*before* the engine runs — that is what stops two racing requests both spending
the last credit — and the cost is only known *after*. Filling the column in would
mean updating the spend row. Run against the live database today:

```
row 2735 cost_usd before: null
UPDATE result: REFUSED -> permission denied for table credit_ledger
direct DELETE result: REFUSED -> permission denied for table credit_ledger
rows left after deleting the account: 0
```

**That refusal is correct and must not be relaxed.** Supabase's free plan takes no
backups, so an append-only ledger is the only protection the credit history has.
`cost_usd` was simply put somewhere it could never be written.

**The fix: a `run_costs` row alongside the spend, written after the run**, with
the spend telling us which ledger row it belongs to. The ledger stays exactly as
it is. Free scan-and-strip runs are written too, with a cost of zero, so a run
that cost nothing can be told from a figure that went missing.

**NOT DONE UNTIL THE MIGRATION IS APPLIED, and it also needs a deploy** — the
code that writes the row is in the site, not the database. Applying the
migration alone changes nothing and breaks nothing.

---

## M‑6. A dropped connection charged the customer and never refunded

**Finished, with one thing for the first deploy to watch.**

### Where the dependency actually was, and it is not where it looks

**The refund does not die with the connection.** Measured on the live site: a job
whose client dropped at three seconds still wrote its refund row a second later.

```
>>> connection dropped by the client at 3000ms
client saw: AbortError after 3004ms: This operation was aborted
  +8s  balance 405  spend rows 1  operation_refund rows 1
  ...
  +75s balance 405  spend rows 1  operation_refund rows 1
```

**So the handler keeps running long after the browser has gone.** What depended
on the client was **the definition of failure**. The only thing that triggered a
refund was the *engine* saying no. Nothing ever asked whether the answer reached
anybody. **A dropped connection is a delivery failure, not an engine failure, so
it took the success path and the credit stayed spent.**

Reproduced on the live site, same day, same account shape — a job that succeeds
while nobody is listening:

```
>>> connection dropped by the client at 3000ms
client saw: AbortError after 3012ms: This operation was aborted
  +8s  balance 155  spend rows 1  operation_refund rows 0
  +75s balance 155  spend rows 1  operation_refund rows 0

final ledger:
     +400  adjustment
       +2  anon_grant
       +3  signup_grant
     -250  spend                                   250000 words
    SUM = 155
```

**250 credits taken, nothing delivered, no refund.**

**Nothing in either run reached a model.** The failing runs used a paste far over
the 10,000-word limit, which the engine refuses in milliseconds "before it spends
a penny" — its own words. The succeeding runs asked for the free layers only.

### The fix, proved in both directions

The route now asks whether anybody received the answer, and refunds if not. Run
against the real route:

```
=== client STAYS connected — there must be NO refund ===
  +75s  balance 155  spend rows 1  operation_refund rows 0
     -250  spend   250000 words
    SUM = 155

=== the same job, connection drops at 2s ===
client saw: AbortError after 2009ms: This operation was aborted
  +75s  balance 405  spend rows 1  operation_refund rows 1
     -250  spend             250000 words
     +250  operation_refund
    SUM = 405
```

**The cost of the run is written down before the credit is handed back**, on
purpose: if the rewrite ran we really did pay for it, and refunding does not undo
that. Recording it and then refunding is what makes the loss countable rather
than invisible.

### The one thing to watch on the first deploy

**Those two runs were on a development server, not on Vercel.** What was proved
*on production* is the load-bearing half — that the handler outlives the
connection. Whether the browser's disconnect is visible to the code in the same
way on Vercel is the one thing a deploy has to confirm.

**The failure to watch for is the opposite one.** If a disconnect were ever
reported falsely, every job would be refunded and the product would be free. It
logs `CLIENT GONE:` loudly every time it fires, so the first day after a deploy
answers it: a run of those lines against jobs that plainly succeeded is the
signal, and `read-ledger.mjs` shows a refund beside every spend if it happens.

---

## What could not be proved, said plainly

**The four migrations have never been run.** There is no Postgres on this
machine, Docker is not installed, and applying anything to the live database is
Jon's alone. So the SQL in them has been read and checked but never executed.
Two static checks that this project has been bitten by before were run and both
pass on all four files: block comments balance, and quotes balance.

```
20260823120000_refund_attribution.sql            open=3 close=3  BALANCED
20260823120100_grant_claims_survive_deletion.sql open=8 close=8  BALANCED
20260823120200_mint_signup_grant_at_signup.sql   open=4 close=4  BALANCED
20260823120300_record_run_cost.sql               open=3 close=3  BALANCED
```

**M‑1, M‑2, M‑3 and M‑4 are therefore not done.** The verification scripts are
written so that the answer arrives as output rather than as an opinion.

**Nothing was deployed**, so the M‑4 and M‑6 code changes are not live either.

**The webhook was not exercised end to end.** `refund_purchase` was called
directly, as the audit called it, rather than through a real Stripe refund —
which would have needed the dev server and `stripe listen`, and another lane
holds the dev server today. The webhook's own arithmetic above that call is
unchanged and was already proved in `payments-tested.md`.

---

## Found in passing, not fixed, not this lane's to fix

**Our own cost per run is being sent to every browser.** `api/_shared.py`
carefully keeps token counts and cost out of the `usage` block it returns —
"our unit economics on a public site" — and then the same figures ride to the
browser anyway inside `report.layer_b.usage`, which `strip_server_paths` does not
touch. Anybody who opens the network tab on a rewrite can read what it cost us.
**`engine/` and `api/*.py` are another lane's.** Recorded in `06`.

**The ledger's `cost_usd`, `model_calls`, `retries`, `total_tokens`, `seconds`
and `layer_b` columns can never be filled in.** They are on an append-only table
and describe something that is only known afterwards. `run_costs` replaces them.
They are left in place rather than dropped, because dropping columns on a live
table with no backups is not worth the saving.

---

## Files

| File | What |
|---|---|
| `supabase/migrations/20260823120000_refund_attribution.sql` | M‑1. **Unapplied** |
| `supabase/migrations/20260823120100_grant_claims_survive_deletion.sql` | M‑2. **Unapplied** |
| `supabase/migrations/20260823120200_mint_signup_grant_at_signup.sql` | M‑3. **Unapplied** |
| `supabase/migrations/20260823120300_record_run_cost.sql` | M‑4. **Unapplied** |
| `lib/server/credits.ts` | Grants claimed once per inbox; spend returns its row id; `recordRunCost` |
| `app/api/tool/clean/route.ts` | Writes the run's cost; refunds a job nobody received |
| `scripts/stripe-refund-check.mjs` | M‑5, corrected |
| `scripts/verify-refund-attribution.mjs` | Proves M‑1, both directions |
| `scripts/verify-grants-survive-deletion.mjs` | Proves M‑2 |
| `scripts/read-refund-shortfalls.mjs` | What refunds have cost beyond the money |
| `scripts/_lane-b-throwaway.mjs` | Labelled throwaway accounts, and the guard that stops any of this touching a customer |

**Commits:** `76ec287`, `97d26c1`, `875da3d`.

**The clean route is shared with another lane today.** Only this lane's hunks are
in these commits; their file-format work was left in the working tree untouched.
