# The two-week read on removing the signup grant, 30 September 2026

**Read-only on the data. One code change, to the dashboard, explained in §7.**
Sources: `credit_ledger` and `accounts` (Supabase, service key, paginated);
every live Stripe charge and checkout session; PostHog with the dashboard's own
filters (real host, automation excluded, Jon's city and IPs excluded).

**The change:** 04 entries 165 and 166, shipped 21 September 18:22 UTC. Free
tier went from 2 guest credits + 3 on signup (5 total) to 2 guest credits and
nothing on signup.

---

## 0. First, the question Jon asked about method, answered plainly

**It was not an A/B test and no experiment was running.** Nothing was split,
nobody was randomised, and no holdout exists. The change was made on a
measured before-picture and shipped to everybody at once, so everything below
is a **sequential comparison**: this fortnight against last fortnight, with
whatever else changed in the world baked in.

**What was measured on 21 September to warrant it** (`session-notes/
pricing-investigation-21-sept.md`), and it was behavioural, not statistical:

- Five of six buyers ever were essay people (jobs of 2,000 to 7,500 words)
  against a site median job of 171 words.
- A first job of one credit converted at 4%; a first job of an essay converted
  at 31%.
- **The decisive observation: when the essay did not fit in the free credits,
  2 of 2 bought. When it fit, 9 of 11 cleaned it free and never came back.**
- After signup the allowance reached 5 credits, which covers a 5,000 word
  essay, so the product was giving its best prospect the exact job they came
  for, free.

**That was a mechanism argument on single-digit counts, and it was labelled as
one at the time.** The prediction was narrow: wall the essay and some of those
people will buy instead of leaving.

---

## 1. The windows

Exactly matched, 8.98 days either side of the deploy:

```
BEFORE  2026-09-12 18:54 UTC  ->  2026-09-21 18:22 UTC
AFTER   2026-09-21 18:22 UTC  ->  2026-09-30 17:49 UTC
```

**The migration is confirmed applied.** 479 ledger rows and 207 new accounts
since the deploy, **zero `signup_grant` rows**; the most recent one ever is
15:12 UTC on 21 September, before Jon ran it. The after-cohort's free-credit
distribution is `{0: 2, 2: 207}` where the before-cohort's ran `{0,1,2,3,4,5}`.
**This closes the one item `CURRENT-HANDOFF.md` left open.**

---

## 2. The headline table

Percentages are of unique visitors. "People" are distinct browsers.
Purchases are from **Stripe**, not PostHog, because `purchase_completed` is
known-broken (the funnel marks it so: persistence is `memory`, so the visitor
id that started checkout does not survive the return from Stripe).

| | Before | After | Change | p |
|---|---|---|---|---|
| **Unique visitors** | **334** | **361** | +8.1% | |
| Ran a scan | 169 (50.6%) | 199 (55.1%) | +4.5pp | |
| Sanitised something | 117 (35.0%) | 141 (39.1%) | +4.0pp | 0.31 |
| **Reached a paid moment** | **62 (18.6%)** | **98 (27.1%)** | **+8.6pp** | **0.009** |
| Viewed /pricing | 34 (10.2%) | 45 (12.5%) | +2.3pp | |
| Started checkout | 3 (0.9%) | 3 (0.8%) | −0.1pp | 1.00 |
| **Purchased (Stripe)** | **2 (0.60%)** | **3 (0.83%)** | **+0.23pp** | **1.00** |
| **Gave an email** | **33 (9.9%)** | **10 (2.8%)** | **−7.1pp** | **<0.001** |
| Revenue | $49.98 | $39.97 | −20% | |
| **Revenue per visitor** | **$0.150** | **$0.111** | **−26%** | |

"Reached a paid moment" = saw the paywall **or** the empty-balance panel.

---

## 3. What is proven, what is not, and the difference matters

### PROVEN: the mechanism fires. More people meet the wall.

**18.6% → 27.1% of visitors, p = 0.009.** This is the change doing exactly what
it was built to do, and it is the only headline number with a real p-value
behind it. It is also **mechanically guaranteed** by a smaller allowance, so it
is a check that the change took, not evidence that it works.

### PROVEN: the email harvesting stopped. 9.9% → 2.8%, p < 0.001.

Intended. Entry 165 retired the list. Worth stating because it is the one
thing this change definitely cost, and if Jon ever reverses his mind on email,
this is the price of having waited.

### NOT PROVEN, AND NOT PROVABLE HERE: the conversion improvement.

**0.60% → 0.83% is p = 1.00.** Two purchases against three. The 95% intervals
are [0.2–2.2%] and [0.3–2.4%] and they overlap almost completely.

**The arithmetic of what it would take.** To call a 0.60% → 0.83% difference
at 80% power and 5% significance needs **about 21,000 visitors per arm**. At
roughly 40 visitors a day that is **over 500 days per arm.** 

**So this specific question cannot be answered by waiting.** Not in a
fortnight, not in a quarter. Anyone who reports "conversion improved 38%" off
2 versus 3 purchases is reading noise.

### WORSE, AND WORTH WATCHING: what people do when they see the offer.

| | Before | After | p |
|---|---|---|---|
| Saw the **wall**, clicked its button | 14/24 = **58.3%** | 4/30 = **13.3%** | **0.001** |
| Saw the **empty panel**, clicked it | 7/48 = **14.6%** | 1/81 = **1.2%** | **0.004** |
| Reached a paid moment, viewed /pricing | 34/62 = 54.8% | 45/98 = 45.9% | 0.33 |

**These are the two most statistically solid results in the whole read and they
point the wrong way.** The button did not change position, size or colour. It
changed from "Create a free account" to "Get credits", and the click rate fell
by three quarters.

**This is not a surprise. It was predicted.** The 4 September measurement said
it in as many words: *"When a free offer at that moment converts at 8%,
replacing it with a paid one converts worse, not better."* It was right.

**What it means, carefully.** A click on a free offer and a click on a price
are not the same act and cannot be compared as if they were. The old 58% was
people taking free money. The honest reading is: **the wall is now doing real
selling work for the first time, and it converts like a real sales moment, not
like a giveaway.** The number to care about is what comes out the far end, and
that is the purchase count, which is too small to read.

---

## 4. The strongest evidence, and it is not statistical

**Every buyer since the change, from the ledger:**

```
=== 8f72df55 ===  27 Sept
   anon_grant +2  ->  2 jobs of 564w  ->  balance 0  ->  purchase $9.99 (Plus)
   -> had 0 credits in hand; ran 2 free jobs first

=== f1da71ce ===  28 Sept
   adjustment +2 (guest credits carried in)  ->  purchase $4.99 (Starter)
   ->  spend -4, text 3,722 words
   -> had 2 credits in hand; ran ZERO free jobs first

=== d29bdf8d ===  30 Sept
   adjustment +2 (guest credits carried in)  ->  purchase $24.99 (Pro)
   ->  spend -3, text 2,704 words
   -> had 2 credits in hand; ran ZERO free jobs first
```

**Two of the three bought without running a single free job, and then
immediately ran an essay that cost more than 2 credits.** Their jobs cost 4 and
3 credits. **Under the old structure both would have fitted inside the 5 free
credits and both essays would have been done for nothing.**

**That is the predicted mechanism, observed twice, in individual rows.** It is
causal in a way the aggregate cannot be: these are not people who converted
better on average, they are people who met a specific wall that did not exist
nine days earlier and paid to get past it.

**It is still only two people.** It is evidence the mechanism is real, not
evidence of its size.

**And the `adjustment +2` on both is the new checkout flow working as designed**
(entry 166): a guest's credits carried into the account created at checkout.

---

## 5. The thing that should worry Jon: revenue per visitor is down 26%

**$0.150 → $0.111.** More purchases, less money, because the pack mix moved:

| | Before | After |
|---|---|---|
| Packs bought | Pro, Pro | Starter, Plus, Pro |
| Average order | **$24.99** | **$13.32** |

**With two sales against three this is not a finding.** But there is a
mechanism that would make it real, and it should be watched rather than
dismissed: **the old free tier filtered who ever reached a price.** Only
somebody whose need exceeded five free credits got there, and that is a heavy
user, who buys a big pack. The new wall catches lighter users too, and a
lighter user buys the cheapest pack.

**If that is what is happening, the change trades fewer large sales for more
small ones, and whether that is good depends on a number nobody has yet: how
many of the small-pack buyers come back.** One of the five buyers before the
change bought three times.

**The metric to track from here is revenue per visitor, not conversion rate.**
Conversion rate treats a $4.99 sale and a $24.99 sale as the same event and
this change appears to move the mix between them.

---

## 6. Traffic quality: the confounders from 4 September are stable this time

The 21 September read could not attribute its result because desktop share,
the arrival briefing and a Google Ads campaign all moved at once. **This time
the mix held:**

| | Before | After |
|---|---|---|
| Desktop | 271 (81%) | 307 (85%) |
| Mobile | 63 (19%) | 54 (15%) |
| Direct | 229 | 254 |
| Google | 47 | 63 |

Weekly trend of visitors reaching a paid moment, whole life of the site:

```
week of   visitors  hit limit  %      signups %
08-23        347         4    1.2%       0.6%
08-30        317        43   13.6%       3.2%
09-06        293        46   15.7%       6.1%
09-13        237        39   16.5%       8.4%
09-20        312        78   25.0%   <- change lands mid-week
09-27        139        42   30.2%       2.2%   (partial week, 4 days)
```

**There was a mild upward drift before the change (13.6 → 16.5%), and then a
step (16.5 → 25 → 30%).** The step is aligned with the deploy and is much
larger than the drift.

---

## 7. A dashboard bug, found on the way, and fixed

**The operator dashboard has been reporting all-time figures from 57% of the
ledger.** `database.mjs` made one request carrying `limit=5000`; Supabase caps
a PostgREST response at 1,000 rows whatever the limit says. Once the ledger
passed a thousand rows, every all-time number quietly became a number about
the most recent thousand, and because the read is ordered `id.desc` it was the
**oldest** history that vanished. Measured:

```
dashboard-style request, limit=5000  ->  1000 rows
content-range header                 ->  0-999/1745
true total by paginating             ->  1745 rows
```

**The true total was in a header the code was already receiving and discarding.**

**What Jon was being shown, against the truth:**

| | Dashboard said | Actually |
|---|---|---|
| Jobs run, all time | 535 | **932** |
| Customer purchases | 5, $69.95 | **11, $134.89** |
| Customers who bought | 5 | **9** |
| Guests who never registered | 364 | **607** |
| Credits sold | 245 | **440** |

**Fixed** by paginating, the same loop `backup-credit-ledger.mjs` has always
used, with a `MAX_PAGES` guard that throws rather than returning a partial
total. **It was wrong in the plausible direction, which is why it survived.**

**Ledger and Stripe now reconcile exactly:** 12 purchase rows in the ledger
plus the one 17 September buyer who deleted their account (whose rows cascaded
away, `07`) = 13 succeeded Stripe charges, all time.

---

## 8. The measurement gap that is now in the way

**`paywall_shown` does not record how big the refused job was.** It carries
`input_kind` and `file_type` and nothing else. So the single most decision-
relevant number in this whole question — **how many people were refused an
essay, and how far over the line they were** — cannot be counted. It has to be
inferred from three buyers' ledger rows.

**The fix is two properties, `needed` and `have`, on an event that already has
both numbers in hand** (`workbench.tsx` passes them to the wall to print the
sentence). That would turn the next read from "three anecdotes" into "of N
people refused a job, M were refused an essay, K bought".

**Recommended before anything else is decided.** It costs one line and it is
the difference between reading rows and counting.

---

## 9. Where this leaves the decision

**Keep the change.** Nothing argues for reverting it: the mechanism is real
and observed, the cost (the email list) was a deliberate ruling, and the one
statistically solid negative — the click rate on the offer — is measuring a
free giveaway against a price and was predicted.

**Do not claim it improved conversion.** That is unproven and, at this traffic,
unprovable by waiting. Anyone reporting a 38% lift is reading 2 against 3.

**Three things to do, in order:**

1. **Add `needed` and `have` to `paywall_shown`.** §8. One line, and it makes
   the next read countable.
2. **Track revenue per visitor, not conversion rate.** §5. It is the only
   headline number that would catch the pack-mix risk, and it is currently
   down 26% on numbers too small to trust.
3. **Decide the question by mechanism, not by p-value.** The honest test is
   narrow and answerable: *of people refused an essay-sized job, what share
   buy?* That population is small enough to read one row at a time and it is
   the population the change was aimed at. It needs the event property first.

**What would actually change the answer:** more traffic. Every statistical
question here is blocked on volume, not on time.
