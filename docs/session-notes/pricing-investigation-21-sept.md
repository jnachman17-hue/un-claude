# Pricing investigation, 21 September 2026: the free allowance, the packs, and who actually pays

**Read-only. Nothing in the database, Stripe or PostHog was written or changed.
Every figure below is pasted from a query run this session, not summarised.**
Sources: `credit_ledger`, `accounts`, `run_costs`, `grant_claims` (Supabase,
service key); every live charge and checkout session (Stripe, the dashboard's
read key); the event funnel (PostHog, the dashboard's filters: real host only,
automation excluded, Jon's city and IPs excluded).

**Jon's questions.** (1) Is the 20 September purchase visible? (2) Is 2 + 3 free
credits still the right allowance, or should the wall come sooner? (3) Over half
of revenue is the $24.99 pack; should there be a $100 pack?

---

## 1. The purchases, reconciled against Stripe

Every live Stripe charge, oldest first, against the ledger:

```
date (UTC)           amount  refunded status     in ledger?   account   pack
2026-08-22 02:25:46  $  4.99  $  4.99 succeeded  yes          3c559e2e  starter   (Jon's own test, refunded)
2026-08-24 15:06:54  $  4.99  $  0.00 succeeded  yes          253db4db  starter
2026-09-01 10:55:08  $  4.99  $  0.00 succeeded  yes          253db4db  starter
2026-09-05 16:42:03  $  9.99  $  0.00 succeeded  yes          f1d8c43d  plus
2026-09-05 18:39:22  $ 24.99  $  0.00 succeeded  yes          b8fe94d0  pro
2026-09-07 06:03:56  $  9.99  $  0.00 succeeded  yes          c47528fd  plus
2026-09-08 16:27:00  $  9.99  $  0.00 succeeded  yes          34d64e7a  plus
2026-09-11 13:26:24  $  4.99  $  0.00 succeeded  yes          253db4db  starter
2026-09-17 18:22:35  $ 24.99  $  0.00 succeeded  ** NO **     92a92031  pro
2026-09-21 03:07:09  $ 24.99  $  0.00 succeeded  yes          acca1779  pro

succeeded: 10 | gross $124.90 | refunded $4.99 | net $119.91
```

**The 20 September purchase is visible**: 21 September 03:07 UTC (20 September
8:07pm Pacific), $24.99, 100 credits, account `acca1779`, Stripe event
`evt_1UHxZTHwIcwEXjEPcqFktXAH`, credits granted. **This also closes entry 164's
open verification**: the correct webhook endpoint survived the deletion of the
Blotter one, because two purchases since (17th and 21st) were both credited.

**The invisible purchase is confirmed and explained.** 17 September, $24.99,
account `92a92031`. Stripe has the charge; the ledger has no row for it:

```
account row exists: false
ledger rows for it: 0
ledger rows pointing at a missing account: 0
```

`credit_ledger.account_id` is `references accounts (id) on delete cascade`, so
deleting the account deleted its purchase row too. **The ledger therefore
under-reports revenue by $24.99 and always will for any buyer who deletes their
account. Stripe is the record of money; the ledger is the record of credits.**
Recorded in `07`.

**Customer money, all time:** 9 purchases by 7 people, $119.91 gross.
By count: 3 starter, 3 plus, 3 pro. By dollars: starter $14.97 (12%), plus
$29.97 (25%), **pro $74.97 (63%)**. So "over half is the $25 pack" is true in
dollars and not in count: three people at $24.99 are 63% of revenue.

**Checkout is not where the money leaks.** 45 checkout sessions all time, of
which 31 were the 23 August lane B tests (throwaway accounts, all since
deleted) and 4 are unexplained (below). Of the 11 real customer sessions, 10
paid. **One real person has ever abandoned checkout** (27 August, plus pack).

**Four checkout sessions on 4 September at $5.00 with no `pack_id` metadata are
not this site's code.** Un-Claude's packs are $4.99/$9.99/$24.99 and every
session it creates carries `pack_id`. They sit one day before Stripe's first
Blotter-webhook failure (entry 164). More evidence for the "another project was
using this Stripe account" suspicion; not investigated, because `CLAUDE.md`
section 3.

---

## 2. What free users actually take

**The ledger's shape.** 667 jobs all time. 609 cost one credit (91%). Median
job 171 words; 90th percentile 973 words, still one credit. So one credit is one
job for almost everybody.

```
spends by credits charged: { 1: 609, 2: 40, 3: 8, 4: 5, 5: 3, 8: 2 }
words per job: median 171 | 75th 422 | 90th 973 | 95th 1371 | max 7557
```

**Guests (413 real, never signed up, 2 free credits):**

```
net credits spent:  0 → 21 people   1 → 251 people (61%)   2 → 141 people (34%)
jobs run:           0 → 20   1 → 277   2 → 112   3 → 3   4 → 1
```

**Six in ten guests use exactly one credit and leave with one unspent.** Of the
116 guests who ran a second job, the second paste had a median of 105 words and
came a median of 3 minutes after the first. That is somebody trying the tool
twice in one sitting, not somebody with a second document.

**Registered, never bought (71 people, 3 to 5 free credits):**

```
net credits spent:  0 → 8   1 → 28   2 → 12   3 → 13   4 → 7   5 → 3
balance now:        0 → 12  1 → 11   2 → 20   3 → 9    4 → 15  5 → 4
reached zero: 12 of 71.   signed up and never ran a job: 7.
```

**The allowance is not what stops most people; most people stop themselves
with credits in hand.** 59 of 71 registered non-buyers still hold credits.

---

## 3. Who pays. Every buyer's ledger, in full

```
=== buyer 253db4db ===
  08-24 14:01 signup_grant +3 bal 3
  08-24 14:17 spend -1 bal 2   text 281w
  08-24 14:42 spend -1 bal 1   text 182w
  08-24 14:59 spend -1 bal 0   text 100w
  08-24 15:06 purchase +10     $4.99
  ... 10 more one-credit jobs of 21 to 386 words ...
  09-01 10:55 purchase +10     $4.99
  ... 8 jobs, two of them 1,001 and 1,038 words ...
  09-11 13:26 purchase +10     $4.99
  ... 4 jobs ...               balance now 6

=== buyer f1d8c43d ===
  09-03 14:28 signup_grant +3 bal 3
  09-03 14:29 spend -1 bal 2   text 480w
  09-05 16:38 spend -1 bal 1   file
  09-05 16:42 purchase +25     $9.99      (had 1; next job needed 3)
  09-05 16:43 spend -3 bal 23  text 2037w
  09-08 18:40 spend -4 bal 18  text 3776w

=== buyer b8fe94d0 ===
  09-05 18:36 signup_grant +3, adjustment +1  bal 4
  09-05 18:39 purchase +100    $24.99     (had 4; 3 minutes after signup)
  09-05 18:41 spend -8 bal 96  text 7557w
  09-05 18:45 operation_refund +8 bal 104 ← THE JOB FAILED. Never returned.

=== buyer c47528fd ===
  09-07 06:02 signup_grant +3, adjustment +1  bal 4
  09-07 06:03 purchase +25     $9.99      (had 4; 1 minute after signup)
  09-07 06:04 spend -8 bal 21  text 7490w. Never returned.

=== buyer 34d64e7a ===
  09-08 15:41 signup_grant +3, adjustment +1  bal 4
  09-08 15:43 spend -3 bal 1   text 2920w
  09-08 16:27 purchase +25     $9.99      (had 1)
  09-08 four more jobs of 1,996 to 4,633 words. balance 13

=== buyer acca1779 ===
  09-21 01:17 signup_grant +3, adjustment +2  bal 5
  09-21 01:17 spend -3 bal 2   text 2304w
  09-21 03:07 purchase +100    $24.99     (had 2)
  09-21 03:11 spend -1 bal 101 text 584w
```

Summarised:

```
buyer     signup→1st buy  credits in hand  biggest job  pack(s)                 bought  used since  unused now
253db4db      65 min             0            1038w     starter+starter+starter    30        24           6
f1d8c43d    2.1 days             1            3776w     plus                       25         8          18
b8fe94d0       3 min             4            7557w     pro                       100         0         104
c47528fd       1 min             4            7490w     plus                       25         8          21
34d64e7a      45 min             1            4633w     plus                       25        13          13
acca1779     110 min             2            2304w     pro                       100         1         101

credits sold to visible buyers: 305 | used since buying: 54 (18%) | unspent: 251
```

**Four things this table says, and each is the whole answer to one of Jon's
questions.**

1. **Five of six buyers are essay people.** Their jobs are 2,000 to 7,500
   words. The site's median job is 171 words. The customer is not the typical
   visitor.
2. **Four of six bought with free credits still in hand.** They bought because
   the document in front of them cost more than they had ("needs 8, have 4"),
   not because the balance reached zero. **The overflow refusal is the buying
   moment**, exactly as entry 67 predicted.
3. **Five of six bought within two hours of signing up**, two of them within
   three minutes. The purchase is in-session.
4. **82% of credits sold are unspent.** Nobody has used more than 30 credits.
   The two Pro buyers used 0 and 1 of 100.

---

## 4. The first job after signing up decides everything

77 real registered accounts. Their first job after signing up, and whether they
went on to buy:

```
first job              people   bought
1 credit                 49        2
2 credits                 8        0
3+ credits (2,000+ w)    13        4      ← 31%
no job at all             7        0
```

**A first job of one credit converts at 4%. A first job of an essay converts at
31%.** Among the 13 essay signups: the two whose essay did not fit in their free
credits (7,557 and 7,490 words against 4 credits) **both bought**. Of the 11
whose essay did fit, 9 cleaned it free and left:

```
4226ecb6 free 5  first job 3821w (4 cr)  jobs 1  balance 1
5f74134b free 5  first job 2474w (3 cr)  jobs 1  balance 2
86ecaa85 free 5  first job 2577w (3 cr)  jobs 1  balance 2
dfce3364 free 5  first job 3984w (4 cr)  jobs 1  balance 1
85c7890e free 4  first job 3370w (4 cr)  jobs 1  balance 0
4f02a2ed free 3  first job 3535w (4 cr)  jobs 1  balance 1
40f79b8c free 5  first job 4476w (5 cr)  jobs 1  balance 0
d6614f99 free 5  first job 4768w (5 cr)  jobs 1  balance 5  (job failed, refunded)
b8c8383e free 5  first job 2376w (3 cr)  jobs 1  balance 2
```

**Every one of them did exactly one job: the essay they came with.** Entry 97's
design was "first essay free, second essay paid". **The data says there is no
second essay.** There is one essay, and whether it is free or paid is decided by
whether it fits in the free allowance. After signup the allowance is 3 plus
whatever guest credits were unspent, so up to 5 credits, which covers a 5,000
word essay. That is the leak.

---

## 5. The funnel, before and after the 4 September change

Entry 159 moved the offer and showed guests a price. PostHog, same filters as
the dashboard (people = distinct browsers):

```
                          before 21 Aug–4 Sep (15 days)   after 5–21 Sep (17 days)
visited                          646                            650
scanned own document             130                            304
pressed Sanitise                  93                            238
got a result                      92                            222
ran out (out_of_credits_shown)    34                             92
  of which guests                 30                             80
paywall_shown                      7                             46
paywall_signup_clicked             3                             30
signup_started                    11                             52
checkout_started                   2                              8
paid (Stripe, customers)           2                              7
```

Guest out-of-credits clicks after the change: **10 took the free road, 1 took
the buy road**, of 80 shown. The guest panel's buy road is 1 in 80.

**The purchase jump cannot be attributed to the 4 September change alone**, and
that has to be said plainly. Three other things changed in the "after" window:

- **Desktop share went from 51% to 82%** (before: 315 mobile / 330 desktop;
  after: 119 mobile / 531 desktop). Essay people paste from a laptop.
- The arrival briefing shipped on 6 September (entry 161).
- Google Ads campaign 2 ran from 6 September at $10 a day (entry 162).

What is safe to say: with the same number of visitors, twice as many scanned,
two and a half times as many sanitised, and three and a half times as many paid.

---

## 6. Two things found on the way that are not pricing

**Big jobs fail.** Two of the five jobs over 4,000 words all time were refunded:

```
2026-09-05 18:45  +8  7557w  run_costs: none   (registered, the $24.99 Pro buyer)
2026-09-19 23:27  +5  4768w  run_costs: none   (registered)
```

No `run_costs` row for either, so the run never reached the point where cost is
recorded. **A 40% failure rate on the exact document size that pays for this
product, and one of the two was a customer's first and only job after paying
$24.99.** They never came back. Not investigated here; it needs its own session
on the engine side.

**Deleting an account deletes its purchase records.** Above, section 1, and
`07`.

---

## 7. The recommendation, for Jon's ruling

**On the free allowance: cut it so that no essay fits. Guest 1, signup +1.**
Total after signup is at most 2 credits, and a 2,000 word document costs 3.
Every essay is refused at the first paste ("needs 3, have 1"), and again after
signing up ("needs 3, have 2"), and the guest panel already carries the price
(entry 159). Snippet people still get one free job to see the tool work, and a
second by signing up; 61% of guests never use a second anyway.

What it costs: the 116 guests a month (28%) who currently run a second free
snippet meet the signup wall on it instead. They convert to purchases at about
0.2%, so the revenue at risk is nil; the risk is to word of mouth. Emails may go
up rather than down, since the paywall-to-signup click rate is 65%.

What it could gain: on this month's traffic, 9 essay signups got their essay
free. At the 31% conversion essay people show overall, that is about 3 sales a
month; at the 2 of 2 seen when the essay did not fit, up to 9. Against a base of
7 sales in 17 days, **that is between "meaningful" and "doubling", and the
honest statement is that n is far too small to know which.** Run it for two
weeks, and read purchases per essay-sized first paste, not purchases per
visitor.

**Why not guest 2, signup 0.** Same ceiling, no extra guest wall, but it removes
the free offer from the signup panel and the email flow with it. Entry 97 point 5
valued the email and nothing since has overturned that.

**Why not guest 2, signup +1 (total 3).** It lets the 2,000 to 2,999 word essay
through free, and that band is 5 of the 13 essays seen. The standard college
essay is exactly the document that must be walled.

**On the $100 pack: no, and the data argues the opposite way.** 251 of 305
credits sold are unspent. The two Pro buyers used 0 and 1 of 100. The Pro pack
is already a lifetime supply for everyone who has bought it. The one heavy user
(30 credits in four weeks) chose the cheapest pack all three times. **Nobody in
this data would have bought a $100 pack**, and entry 64's reason for deferring a
lifetime pass (it caps the highest-intent buyer and makes the subscription
irrational) stands. **The trigger for revisiting is the first buyer to exhaust a
Pro pack.** There are none.

**On the subscription (entry 64's "asap").** One of seven buyers has bought
twice. Entry 64's trigger was "a meaningful share of buyers returning for a
second pack inside 30 days". One in seven is not that yet.

**Leave the three packs alone.** Pro buyers overbuy against a "Save 50%" badge
and that is money; the checkout converts 10 of 11; the leak is upstream.
