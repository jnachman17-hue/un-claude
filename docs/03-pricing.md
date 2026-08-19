# un-claude: Pricing, Unit Economics and Billing

**Written 19 August 2026, phase 3.** This session read the documents, read the
code, ran the engine's own chunking module locally, listed the live Vercel
configuration, and researched the market and Stripe. It wrote no code and
touched no other file.

**Everything measured is labelled measured. Everything estimated is labelled
estimated in the same sentence.** `CLAUDE.md` section 4.

---

## 1. The answer in one paragraph

**This product has almost no cost of goods.** Two of its three layers call no
model and finish in about 40 milliseconds. The third costs six hundredths of a
penny per thousand words. The whole engine build and every test run against it
has cost **22.7 cents in total, measured**. At any price this market will bear,
gross margin is above 97 percent even on the worst case the code can produce.

**So cost does not set the price here, and pretending otherwise would waste the
session.** The binding constraints are three fixed costs that have nothing to do
with running the tool: Stripe's 30 cent fixed fee per sale, Stripe's 15 dollar
dispute fee, and Vercel's 20 dollar a month Pro plan, which becomes mandatory
the moment the site takes money. Those three decide the minimum pack size, the
refund policy, and the break even point. Everything else is a conversion
question.

---

## 2. Read this first if you are the landing page session

**Three things are live defects and one is a design landmine.** All four were
found this session while establishing what can be metered. **Reported, not
fixed. This session does not edit code.**

> **CORRECTION, 19 August 2026, session 7, Track 1. Three of the four items in
> this section are stale, all in the harmless direction. Corrected rather than
> deleted, because the arithmetic downstream of them is still sound.**
>
> - **2a is fixed.** `UC_ENGINE_KEY` is set. The engine is locked to our own site
>   and was verified from outside. It is not returning 401 to every call.
> - **2b is fixed.** The crash on inputs under about 350 words was found and
>   fixed in session 5.
> - **Section 14 item 5 says `06` row 37 does not exist. It exists now** and
>   carries the free-allowance question.
> - **2c and 2d still stand.** `UC_LAYER_B_RETRIES` is still unset, so the
>   default of 8 is still live, and `accounts.public_data` is still user-writable
>   and still the one place a credit balance cannot go.
>
> **Nothing in sections 3 to 6 changes.** The model cost was measured directly
> against the gateway and does not depend on any of the above.

### 2a. The engine is almost certainly returning 401 to every call

`apps/web/api/_shared.py` requires a shared password in `UC_ENGINE_KEY` and
**fails closed in production**: if the variable is missing, every request to
`/api/scan` and `/api/clean` is refused.

**`UC_ENGINE_KEY` is not set on Vercel.** Verified by listing the production
environment variables. The eight that exist are the four `WATERMARKS_REWRITE_*`
settings, the Supabase service role key, the site URL, and the two Supabase
public keys. **The engine key is not among them, and neither is the copy that
`apps/web/lib/engine/client.ts` reads.**

**Unconfirmed against the running site.** I tried to prove it with a live call
to `/api/scan` and the command was blocked by a permission rule, so this is read
from configuration rather than observed. **Jon or the landing page session should
confirm it directly before building against the endpoint**, because the symptom
is the site's own honest error message, "Something went wrong. Nothing was
charged", which looks like a bug in the interface rather than a missing setting.

**The fix is one variable, set in two places:** the Vercel project settings, for
Production and Preview, marked Sensitive. It has to be the same value for the
Python function and for the Next.js client, because that is the point of a
shared password.

### 2b. Layer B crashes on short pastes. Verified by running it

**This is the conversion event failing on the most common input.**

`apps/web/engine/uc_chunk.py` calls its inner `one()` function on line 106,
inside the `if len(chunks) == 1:` branch, **before that function is defined on
line 118.** In Python that raises an error rather than running.

**Measured, this session, with a fake rewriter so no model was called and nothing
was spent:**

```
input words: 80
chunks split_paragraphs returns: 1
RAISED: UnboundLocalError - cannot access local variable 'one' where it is not
        associated with a value
model calls made: 0
```

**When it triggers:** any text that fits in one chunk. That is anything under
roughly 350 words, **and any single paragraph of any length**, because the
splitter never breaks a paragraph.

**What the user sees.** `server.py` catches it and turns it into a layer B
failure, which the site renders as "The rewrite could not be completed. Nothing
was charged. Please try again." **Trying again will never work.** Nothing is
charged, so no money is lost, but the paid layer is unavailable on short text.

**Why it was not caught:** every proof in `ENGINE.md` section 9 used documents of
1,260 words and up, which always split into several chunks. The multi chunk path
works. I ran it: a 2,880 word document produced 12 chunks, 12 model calls, and
100 percent of the words back.

**It has been present since commit `c3329ae`** and survived four later commits to
that file.

### 2c. The retry multiplier is eight, not three

`ENGINE.md` section 6 says `UC_LAYER_B_RETRIES` is 3 in production. **It is not
set on Vercel at all**, so the code default applies, and the code default is 8.

**Measured this session.** A 2,880 word document, 12 chunks, with a rewriter that
always drops one number:

| Case | Model calls | Multiplier |
|---|---|---|
| Rewrite preserves everything | 12 | 1x |
| Rewrite drops one figure per chunk | **96** | **8x** |

Nothing surfaces this. The usage record does not count model calls, does not
count tokens, and does not count retries. **The cost of a document is invisible
today and the worst case is eight times what the documentation says it is.**

The good news is in section 4c: even 8x, the money involved is pennies.

### 2d. The credit balance must NOT live in `public_data`

**This is the expensive one to get wrong, and it would be an easy mistake.**

The database has exactly one table, `public.accounts`, with a `public_data`
column designed for extra per user data. It looks like the obvious place for a
balance. **It is the one place a balance must never go.**

Read from `20241219010757_schema.sql`: the migration grants `update` on that
table to every signed in user, and the `accounts_update` policy lets a user
update their own row. The `protect_account_fields` trigger blocks changes to
`id` and `email` and to nothing else. **A signed in user can therefore write
whatever they like into their own `public_data`, including their own credit
balance.**

Read from the schema, not tested against the live database.

**What is needed instead:** a new table the user can read and cannot write, with
all writes going through the service role key. Detail in section 10.

### 2e. What the paywall needs to be shaped like

The interface decisions below are the ones that are expensive to change later.
**Full detail in section 11.** The short version:

| Thing | Answer |
|---|---|
| The unit shown to a user | **Credits. 1 credit = 100 words** |
| Where the limit bites | **Cleaning, never scanning.** Scanning stays free and unlimited, signed in or out. This is `04` entry 43 and the economics agree with it |
| When the price is shown | **Before the button is pressed.** Input words are known in advance, so the button can name its own cost |
| Overflow | **Refuses and says the number.** Never truncates, never partially spends. `04` entry 16 |
| Files with no text | **A flat 3 credits**, not a word count |
| The wallet screen before payments exist | Balance, ledger, and "credits do not expire". **No disabled Buy button** |

---

## 3. What it costs us to run. Measured

### 3a. The engine's total lifetime spend

**Measured live this session** against the AI Gateway, which is the service that
bills for the rewriting model:

```
{"balance":"14.77336888","total_used":"0.22663112"}
```

**Twenty two and a half cents.** That is every model call ever made by this
project: the five model bake off, the chunk size experiments across 28 rewrites,
five full document rewrites up to 5,047 words, and every live test since.

### 3b. Per operation

| Operation | Model cost | Vercel cost | Time |
|---|---|---|---|
| `/api/scan` | **Nothing** | **$0.0000021** | ~40ms |
| `/api/clean`, no layer B | **Nothing** | **$0.0000021** | ~40ms |
| `/api/clean` with layer B | **$0.00059 per 1,000 words** | **$0.00002 per 1,000 words** | 6s at 500 words, 22s at 5,000 |

**The model figure is measured** and recorded in `ENGINE.md` section 8 as 0.06
cents per thousand words. **I checked the arithmetic independently and it holds.**
Mistral Small is published at $0.10 per million input tokens and $0.30 per
million output tokens. At 350 word chunks with a 200 token prompt, a thousand
words is about 1,908 input tokens and 1,336 output tokens, which is $0.00059.
That is 0.059 cents. The measured and the calculated agree.

**The Vercel figures are calculated from Vercel's published rates**, not measured
from an invoice, and the active CPU component is estimated because we have no
per function CPU measurement. Method in section 4a.

---

## 4. The cost centres that are not the model, with the arithmetic

The brief was right to ask. Four of the five turn out not to matter, and saying
so precisely is more useful than hedging.

### 4a. Vercel function cost. Real, and about 3 percent of the model bill

**How Vercel bills, in plain English.** Three meters run at once. **Active CPU**
is time your code is actually computing, billed per CPU hour, and **it pauses
while the function waits for a network reply.** **Provisioned Memory** is the
memory reserved for the function, billed per gigabyte hour, and **it keeps
running during that wait.** **Invocations** is a flat charge per request.

Our function is configured in `apps/web/vercel.json` at **1 GB of memory and a
60 second ceiling.**

Vercel's published rates for Washington D.C. (`iad1`), the default US region, as
of their 16 June 2026 documentation:

| Meter | Rate |
|---|---|
| Active CPU | $0.128 per hour |
| Provisioned Memory | $0.0106 per GB hour |
| Invocations | $0.60 per million |

**A 5,000 word layer B run, 22 seconds, almost all of it waiting on the model:**

| Component | Arithmetic | Cost |
|---|---|---|
| Provisioned memory | 1 GB x 22s / 3600 x $0.0106 | $0.0000648 |
| Active CPU, estimated at 1 second | 1s / 3600 x $0.128 | $0.0000356 |
| Invocation | $0.60 / 1,000,000 | $0.0000006 |
| **Total** | | **$0.000101** |

**One hundredth of a cent.** The model cost for the same document is 0.30 cents.
**Vercel compute is about 3 percent of the model bill.** The brief's hypothesis
that it might be the bigger number is wrong, and the reason is the design of the
billing: layer B is almost entirely waiting, and waiting does not burn CPU.

**The one second of active CPU is an estimate**, not a measurement. Layer A over
5,000 characters takes about 40 milliseconds, and base64 decoding plus chunk
splitting plus reassembly is the same order. One second is deliberately
pessimistic, probably by a factor of three or more. **Even at ten seconds of CPU
the total would be $0.00042, still a seventh of the model cost.**

**A free scan costs $0.0000021.** That is **467,000 scans per dollar.**

### 4b. The hard ceiling on any single request, which is the useful number

The 60 second cap in `vercel.json` bounds everything. With 8 workers and roughly
6 seconds per model call, at most about 80 chunk calls can fit in one request.
At 350 words each, that is 28,000 words of model input.

**Estimated worst case for one `/api/clean` request: about 1.7 cents of model
spend and 0.03 cents of Vercel.** Under two cents, and no configuration change
can exceed it without also raising `maxDuration`.

**That is the number to remember when someone worries about abuse.** No single
request can cost more than two cents, whatever is pasted into it.

### 4c. Retries. Invisible, eight times over, and still cheap

Section 2c has the measurement. What it does to money:

| Per 1,000 words | Model | Vercel | Total |
|---|---|---|---|
| Typical, no retries | $0.00059 | $0.00002 | **$0.00061** |
| **Worst case, 8 retries on every chunk** | $0.00474 | $0.00002 | **$0.00476** |

**Eight times a very small number is still a very small number.** The worst case
per thousand words is under half a cent.

**But it should be recorded anyway**, for two reasons that are not about this
month's bill. It is the only cost in the product that scales with something other
than input size, so it is the only one that could surprise us. And it is a
quality signal: a rising retry rate means the rewriting model is getting worse at
holding onto facts, which is a product problem before it is a cost problem.

### 4d. Stripe. The largest single cost in the business

**This is the cost centre that actually matters,** and it has nothing to do with
the tool.

Stripe's published US rate, checked this session: **2.9 percent plus 30 cents**
per successful domestic card charge. International cards add 1.5 percent.
Currency conversion adds 1 percent. **A dispute costs $15, and responding to one
costs a further $15.** On a refund, **the original processing fee is not
returned.**

| Sale | Stripe takes | We keep | Percentage lost |
|---|---|---|---|
| $3 | $0.387 | $2.61 | **12.9%** |
| $5 | $0.445 | $4.56 | **8.9%** |
| $9 | $0.561 | $8.44 | **6.2%** |
| $15 | $0.735 | $14.27 | **4.9%** |
| $24 | $0.996 | $23.00 | **4.2%** |
| $60 | $2.04 | $57.96 | **3.4%** |

**The 30 cents is the whole reason not to sell a small pack.** It is 10 percent
of a $3 sale and 0.5 percent of a $60 one.

**And the $15 dispute fee is worse than the percentage.** A single disputed $9
purchase costs us the $9, plus $15, plus the $0.56 already paid, for a net loss
of about $24.50. **That is the revenue of three sales, destroyed by one.** Section
9 is built around this number.

### 4e. Vercel Pro. A fixed cost that arrives the day we charge anybody

**Vercel's Hobby plan does not permit commercial use.** Their own Hobby plan
documentation restricts it to non commercial personal use, and multiple current
summaries of their terms state that a project generating revenue must be on Pro.

**Pro is $20 per month per seat.** One seat. **$240 a year, before a single
sale.** Break even is roughly two and a half small packs a month.

**Jon should check which plan the `un-claude` project is currently on.** I could
not: the command that would have shown it was blocked by a permission rule.

**Pro also changes the free tier arithmetic in our favour.** Hobby includes 4
hours of active CPU, 360 GB hours of memory and 1 million invocations. Pro bills
on demand against a monthly usage credit. At 467,000 scans per dollar, neither
plan's compute is a constraint we will hit before the Stripe fees matter.

### 4f. File uploads. Not a cost centre at all

`_shared.py` caps any upload at **5 MB** and the file is held in a temporary
folder for the length of the request and then deleted. **Nothing is stored.**
There is no storage bill, no retention question, and no bandwidth beyond the
upload itself, which falls under Vercel's Fast Data Transfer allowance of 1 TB.

**5 MB is 200,000 uploads per terabyte.** Not a constraint.

**The real file cost is legal and operational, not financial**, and it is already
recorded as `06` row 20: accepting files from strangers with no scanning and no
size defence beyond the cap.

### 4g. The free tier. Not a cost problem. Entirely a conversion problem

**This is the most important reframe in the document.**

A free user running layer B on 1,000 words costs us $0.00061, or six hundredths
of a cent. **An abuser who clears their cookies and does that a hundred times a
day costs six cents a day**, or forty eight cents a day at the eight retry worst
case.

**Ten thousand abusive sessions a day would cost about six dollars.** We would
have a traffic problem worth celebrating long before we had a cost problem.

**So `04` entry 16's warning that anonymous budgets are IP tracked and bypassable
is correct and its consequence is not what it looks like.** Bypassing the free
tier does not cost us money. It costs us the sale. **The free tier should be
sized to convert, not to contain cost**, and every argument in section 8 follows
from that.

---

## 5. What the market charges, and what each one actually sells

All prices read from the vendors' own pricing pages this session, 19 August 2026,
except where the source is named as secondary.

| Tool | What it is | Unit sold | Published price | Per 1,000 words |
|---|---|---|---|---|
| **QuillBot** | Paraphraser | **A monthly seat.** Unlimited paraphrasing | $19.95/mo, $99.95/yr | Not measurable. Unlimited |
| **GPTZero** | AI detector | **Words per month, subscription** | Premium $12.99/mo annual, Professional $24.99/mo annual | ~$0.10 at the Essential tier |
| **Originality.ai** | AI detector | **Credits, 1 credit = 100 words, monthly subscription** | Pro $14.95/mo for 2,000 credits | **$0.075** |
| **Undetectable.ai** | Humanizer | **Words per month, subscription** | $9.99/mo for 10,000 words, $60/yr for the same | **$1.00 monthly, $0.50 annual** |
| **thehumanizeai.pro** | Humanizer | **Words per month, annual only** | Starter $69.99/yr for 20,000/mo, Pro $129.99/yr for 200,000/mo | **$0.29 Starter, $0.054 Pro** |
| **ai-text-humanizer.com** | Humanizer | **Words, monthly OR one time prepaid** | $19.99/mo for 50,000 words. **$69.99 once for 150,000 words, valid 24 months** | **$0.40 monthly, $0.47 prepaid** |
| **HumanizerTech** | Humanizer | **Credits, one time, never expire** | Minimum 2,000 credits for $4.00 | Credit to word ratio not published |

**GPTZero's word allowances come from secondary sources**, several of them
competitor blogs, because their pricing page did not render for a fetch. The
plan prices are corroborated by an independent pricing tracker. **Treat the word
figures as indicative.**

### What this tells us

**Everyone sells words. Nobody sells files, and nobody sells operations.** Jon's
instinct on the unit is the market's answer too.

**Detectors sell words at $0.075 to $0.10 per thousand. Rewriters sell them at
$0.29 to $1.00 per thousand.** The gap is real and it is about cost: scanning is
cheap for them too, rewriting is not.

**Subscription is the default and one time packs exist at the edges.** The two
that sell prepaid credits are the small independents, and both make
non expiry or long validity a selling point.

**Free tiers on the rewriting side are granted once, not reset.** thehumanizeai.pro
gives 500 words one time. ai-text-humanizer gives 500 words total.
Undetectable.ai gives a 250 word trial. HumanizerTech gives 500 credits on
signup. **Only the detectors reset monthly**, and their marginal cost is near zero,
which is the same position we are in on scanning and the opposite of our position
on rewriting.

### Two things this market does that we must not copy

**The undetectability guarantee.** Undetectable.ai promises a refund if their
output is flagged. ai-text-humanizer promises a Turnitin bypass or your money
back. **We cannot make that promise for layer B and must not imitate it.** No
public detector for a statistical text watermark exists, so there is no
adjudicator. A guarantee nobody can evaluate is a guarantee we lose every time it
is claimed, and it would be dishonest under `04` entry 23 before it was expensive.

**Marketing the word "bypass".** Every tool in the humanizer column leads with
bypassing detection. Section 12 explains why that specific word is the single
biggest risk to the payment account, and why we get to avoid it without losing
anything.

---

## 6. The recommendation. PROPOSED, awaiting Jon's ruling

**Read sections 3 and 4 before this one.** These numbers are set by what the
market bears and what converts, not by cost, because cost is a rounding error.

### 6a. The unit

**One unit for everything: a credit. 1 credit buys 100 words.**

**Why one unit and not two.** `04` entry 39 rules that there is one work box and
the tool routes itself: the user never chooses a layer. **A price that varies by
something the user cannot choose reads as arbitrary.** Two units, words for text
and files for files, would mean teaching two things and showing two balances.

**Why 100 words and not 1,000.** Rounding up. At 1,000 words per credit, a
200 word paste spends a whole credit and the user notices. At 100 words the
granularity is fine enough that nobody feels short changed, and it matches
Originality.ai, which is the closest thing this market has to a standard.

**Why Jon's worry about files is right in substance and wrong in mechanism.** He
said per file pricing probably fails because files vary enormously. **They do
vary, and it does not matter, because our cost does not scale with file size.**
Stripping metadata from a 4 MB photograph and from a 40 KB one is the same 40
millisecond operation. So a flat charge per file is defensible in a way a flat
charge per document of text would not be.

| Input | Charge |
|---|---|
| Pasted text | **1 credit per 100 words, rounded up** |
| A Word document | **Same as text, by the words inside it. Minimum 3 credits** |
| A PNG or JPG | **A flat 3 credits.** No text, so metadata only |
| A scan, any input | **Free. Always. No credits, signed in or out** |

### 6b. The packs

| Pack | Credits | Words | Price | Per 1,000 words |
|---|---|---|---|---|
| **Small** | 250 | 25,000 | **$9** | $0.36 |
| **Standard** | 900 | 90,000 | **$24** | $0.27 |
| **Large** | 3,000 | 300,000 | **$60** | $0.20 |

**The arithmetic behind every one of those.**

| Pack | Price | Stripe fee | **Net to us** | Cost to fulfil, typical | **Cost to fulfil, worst case** | Margin at worst case |
|---|---|---|---|---|---|---|
| Small | $9 | $0.561 | **$8.44** | $0.015 | **$0.119** | **98.6%** |
| Standard | $24 | $0.996 | **$23.00** | $0.055 | **$0.428** | **98.1%** |
| Large | $60 | $2.04 | **$57.96** | $0.184 | **$1.427** | **97.5%** |

**"Worst case" means every word in the pack goes through layer B and every chunk
is retried the full eight times.** That has never been observed. It is the
arithmetic ceiling of what the code as deployed can spend, at $0.00476 per
thousand words from section 4c. **Typical is the same calculation with no
retries.**

**Why these prices.**

**$0.20 to $0.36 per thousand words puts us under every rewriting tool in section
5 except thehumanizeai.pro's largest annual tier.** We undercut Undetectable.ai
by a factor of three at the entry level and ai-text-humanizer by a little at
every level, while selling something they do not have: two layers that are
provable.

**$9 is the floor and the reason is Stripe, not us.** Below about $5 the 30 cent
fixed fee passes 6 percent and the dispute maths gets ugly: one $15 dispute
against a $5 pack destroys the margin on five sales. **$9 keeps Stripe at 6.2
percent and makes a dispute cost the revenue of about three sales rather than
six.**

**The discount ladder is real but shallow, 36 cents down to 20 cents.** Steeper
would be free money to give away, since cost is not the constraint, but shallow
keeps the small pack from looking like a punishment, and the small pack is where
almost every first purchase will happen.

**The number most worth changing after launch is $9.** It is the only one with a
conversion rate attached to it, and we will know within a fortnight.

### 6c. What this means for the business

At the Small pack, **$8.44 net per sale against $240 a year of Vercel Pro**:

| Sales per month | Net revenue | Vercel Pro | Result |
|---|---|---|---|
| 3 | $25.32 | $20 | **Break even** |
| 20 | $168.80 | $20 | $148.80 |
| 100 | $844.00 | $20 | $824.00 |

**Fulfilment cost does not appear in that table because at 100 small packs a
month, all fully consumed at the eight retry worst case, it is $11.90.** It never
becomes the thing that matters.

---

## 7. DECISION points, in the format `04-decision-log.md` uses

**All PROPOSED. None ruled. Fold into `04` once Jon rules.**

### P1. The unit is a credit, and one credit buys 100 words

**Proposed ruling.** One unit across text, Word documents and images. Scanning is
never charged.

**Reasoning.** `04` entry 39 removes the user's ability to choose a layer, so a
per layer price is unpriceable. Cost varies enormously between layers and the
user cannot see or control which runs, so charging for the job rather than the
layer is both simpler and more honest. 100 words rather than 1,000 because
rounding up a short paste to a whole credit is the kind of small unfairness
people remember. Matches Originality.ai's unit, which is the nearest thing to a
market standard.

### P2. Packs at $9, $24 and $60. No subscription at launch

**Proposed ruling.** Three one time credit packs. **No recurring plan of any
kind**, revisited only when repeat purchase data exists.

**Reasoning.** **The buyer here is event driven.** Someone discovers their
document carries a mark, cleans it, and leaves. That is not a habit and a
subscription sold against it produces cancellations, refund requests and
disputes. **Disputes are the thing that can lose the payment account**, which is
a far larger risk than the recurring revenue foregone. The category sells
subscriptions because the category sells habitual rewriting; we sell a fix for a
one time discovery. **Revisit the day the data shows a meaningful share of buyers
returning for a second pack inside 30 days.**

### P3. Credits do not expire

**Proposed ruling.** Purchased credits never expire. If the account is deleted
they go with it, and the interface says so before deletion.

**Reasoning.** **The liability is negligible**: a million unredeemed words is
about 60 cents of exposure at the typical rate. **The legal question dissolves.**
The US Credit CARD Act sets a five year floor for gift certificates and prepaid
cards; whether a service credit falls inside that is genuinely unsettled, and
state unclaimed property rules add a second unsettled question. **Not expiring
means neither question ever has to be answered.** It removes a whole class of
support complaint, and against a market of monthly resetting subscriptions it is
a real selling point that costs nothing.

**The precedents both ways:** Originality.ai expires purchased top ups after 24
months, ai-text-humanizer's prepaid pack lasts 24 months, and HumanizerTech's pay
as you go credits never expire. **We take the generous end because we can afford
to and they cannot.**

### P4. The free allowance is granted once, not reset

**Proposed ruling.**

| Who | Allowance | Roughly |
|---|---|---|
| **Anyone, signed out or in** | **Unlimited scanning, forever** | Free hook, `04` entry 43 |
| **Signed out** | **10 credits, once per browser** | 1,000 words of cleaning |
| **On creating an account** | **20 credits, once** | 2,000 more words |

**Reasoning, and both sides were argued.**

**For a daily reset.** It is friendlier, it produces a habit, and it turns a
bypasser into a returning visitor. It costs nothing: even ten thousand abusive
sessions a day is about six dollars.

**For a single grant, which wins.** `04` entry 16 records that anonymous budgets
are IP tracked and bypassable, and section 4g shows the consequence is not cost
but lost sales. **A daily reset makes bypass unnecessary: the user simply waits.
There is then no moment at which anybody ever has to decide to pay.** A single
grant creates that moment. And the market agrees: every rewriting tool checked
grants once, and only the detectors reset, because scanning costs them nothing.
**We reset the thing that costs nothing too. That is exactly what unlimited free
scanning is.**

**Why 1,000 words signed out and not 500 like the market.** Our differentiator is
showing the marks in place, and it needs enough text to be impressive. 1,000
words costs us six hundredths of a cent.

**Why 2,000 more on signup and not 5,000.** A standard essay is about 2,500
words. **2,000 is deliberately just short of it**, so a real document runs out
and the decision to buy arrives while the user is engaged rather than after they
have finished. **Cost per signup at the eight retry worst case is under a
penny.**

### P5. All three layers cost the same per credit

**Proposed ruling.** One price. Layer A and metadata are charged the same as
layer B.

**Reasoning, and it was argued both ways.**

**For pricing them differently.** It is cost reflective and honest: two of them
are free to run. It would let layer A be a loss leader and the margin on the
cheap layers is the highest in the product.

**For one price, which wins, and the argument is `04` entry 39 rather than
economics.** **The tool routes itself and the user never picks a layer**, so
there is no control for a differential price to attach to. A charge that varies
by something invisible and unchosen reads as arbitrary, and explaining it would
mean putting the three layer table into the checkout, which is the opposite of
what entry 39 decided. **We charge for the job.**

**This confirms `04` entry 43**, where Jon ruled that layers A and metadata are
monetised too and observed that their margin is the highest in the product. He is
right, and the reason is stronger than margin: they are the two layers we can
actually prove worked.

**The exception that must exist.** An image runs metadata only, in 40
milliseconds. Charging it by any word measure is impossible and charging it a lot
would be indefensible. **A flat 3 credits.**

### P6. A failed operation refunds credits. Money refunds are generous by policy

**Proposed ruling.** Two different things, both called refund, kept apart.

**Operation refund.** Credits are debited when the work is committed and returned
in full if it fails. **Never touches Stripe.** Every failure path already tells
the user "Nothing was charged", so the ledger must make that sentence true.

**Money refund.** **Unspent credits refunded at the price paid, no questions
asked, within 30 days.** Spent credits are not refunded.

**Reasoning.** The operation refund is `04` entry 16's surviving mechanic and it
is not negotiable. The generous money refund is **dispute prevention, and the
arithmetic is decisive**: refunding a $9 purchase costs us $0.561, because Stripe
does not return the processing fee. **A disputed $9 purchase costs about $24.50.**
Every refund we grant instead of fighting saves about $24. **On a product whose
fulfilment cost is a rounding error, a no questions refund policy is the cheapest
insurance available**, and it is also the thing that keeps the Stripe account's
dispute rate low, which is what keeps the account.

---

## 8. What the pricing page may actually say

**Read `ENGINE.md` section 2 before writing a word of this.** `06` row 23 is still
formally open and Jon has not ruled on the site's overall claim.

| May say | May not say |
|---|---|
| The prices, the packs, what a credit buys | Any success rate, percentage or score for layer B |
| **Credits never expire** | **Any guarantee about detection**, and specifically no money back if flagged |
| **Unlimited free scanning, no account needed** | "Undetectable", "bypass", "guaranteed" |
| That invisible characters and file metadata are found, listed and removed, and shown in full | That layer A removes Claude's watermark. Anthropic adds no hidden characters |
| That the rewriting layer is best effort, explained once and properly | That a statistical watermark was removed. **Nobody can verify that, including us** |
| Word documents, PNG, JPG, pasted text | **PDFs.** Not accepted in version one |
| **A failed operation costs nothing** | Office documents specifically, until `06` row 31 is closed with a real file |

**The sentence that carries the most weight, and it is a genuine competitive
advantage rather than a disclaimer:**

> Two of the three checks are provable, and we show you the proof. The third is
> best effort and we say so.

**No competitor in section 5 can write that sentence**, because none of them
returns the exact position of what it found. `sample_offsets` is the product's
strongest honest claim and it belongs on the pricing page as much as on the
landing page.

**One thing the pricing page must not do is imitate the guarantee.** Section 5
explains why. It is worth repeating here because a copywriter looking at the
competition will reach for it automatically.

---

## 9. Refunds against a credit balance. How it works

**Two mechanisms, and confusing them is how a balance goes wrong.**

### 9a. The operation refund. A ledger reversal, not a payment

| Step | What happens |
|---|---|
| 1 | Input words are counted. **The price is known before anything runs.** `04` entry 16 |
| 2 | If the balance is short, **refuse and say the number.** Never truncate, never partially spend |
| 3 | Debit the balance, writing a ledger row that names the operation |
| 4 | Run the job |
| 5 | On failure, **write an equal and opposite ledger row referencing the debit** |

**Three rules that make it correct.**

**Never delete or edit a ledger row.** A refund is a new row that points at the
row it reverses. The balance is the sum of the rows. **An append only ledger is
the only structure where a wrong balance can be explained afterwards**, which
matters more here than usual because Jon cannot read the code that produced it.

**One idempotency key per operation.** The 22 second layer B call will sometimes
be retried by a browser or a network. **The same operation key must never debit
twice.** A unique constraint in the database, not a check in the code.

**The refund must not depend on the browser still being there.** A user who
closes the tab during a 22 second rewrite must still get their credits back. That
means the refund is written by the server that started the work, in the same
request, not by anything the browser sends afterwards.

### 9b. The money refund. A Stripe operation

| | |
|---|---|
| What is refunded | **Unspent credits, at the price paid** |
| Window | **30 days** |
| What it costs us | **The Stripe fee is not returned.** $0.561 on a $9 pack |
| What the alternative costs | **A dispute is $15, plus the $15 to contest it, plus the sale** |

**The ledger has to record which credits came from which purchase**, otherwise
"refund the unspent portion" is not computable. This is a design consequence of
the refund policy and it has to be in the table from the first migration, not
added later.

---

## 10. What building this in Stripe actually involves

**No code in this section. What has to exist, and honestly which parts are hard.**

### An afternoon each

| Piece | What it is |
|---|---|
| **Stripe account** | Sign up, verify. Section 12. No code |
| **Product and Price objects** | Three prices, one per pack, created in the Stripe dashboard. **Not in code**, so changing a price later is not a deployment |
| **Checkout Session** | One server side call that creates a hosted payment page and redirects to it. **Stripe hosts the card form, so no card details ever touch our site**, which removes almost all of the compliance burden |
| **Success and cancel pages** | Two routes. The success page must **not** be what grants credits. See below |

### A day or two each

| Piece | What it is | Why it takes longer |
|---|---|---|
| **The ledger table** | A new Supabase migration | **Section 2d.** It must be a table the user can read and cannot write. Every write goes through the service role key, which the site already has configured. Getting the row level security right is the whole job |
| **The webhook** | One route Stripe calls when a payment completes | **This is where credits are granted, not the success page.** A user can close the browser before redirecting back, and a redirect URL can be forged. **The webhook is the only trustworthy signal that money moved** |
| **Signature verification** | Checking the webhook really came from Stripe | Small, and skipping it means anyone who finds the URL can grant themselves credits |
| **Idempotency** | The same Stripe event must never credit twice | **Stripe retries webhooks by design.** Solved by a unique constraint on the Stripe event id in the ledger. Easy to build, easy to forget, and the failure mode is giving away credits |

### Genuinely hard, and neither is a payments problem

**The metering path.** Debit before, refund on failure, atomically, against an
operation that can take 22 seconds and can be abandoned halfway. **Every race
condition in this product lives here**, and there is no user visible symptom when
it goes wrong except a balance that is quietly incorrect. This deserves more care
than the Stripe integration does.

**The anonymous free tier.** How a signed out allowance is tracked so it cannot
be refilled by opening a private window. **`04` entry 43 flags this as open, and
the row it points at, `06` row 37, does not exist in the file.** It is not a
Stripe problem and Stripe cannot help with it. Section 4g argues it is a
conversion problem rather than a cost one, which changes what a good answer looks
like: **the goal is to make bypassing feel like more effort than paying $9, not
to make it impossible.**

### What does not need building

**Subscriptions, invoices, proration, dunning, tax.** All of it is avoided by
P2's ruling that there is no recurring plan. **That is a large part of why credits
rather than a subscription is the right first move**, quite apart from the buyer
argument: it removes the entire hardest half of billing from the launch.

---

## 11. What the paywall must be shaped like

**For the landing page session, which is building this now without payments
behind it.** These are the decisions that are expensive to change later.

### 11a. The states

| State | What the user sees |
|---|---|
| **Signed out, under the limit** | The tool. A quiet indication of what is left, in credits |
| **Signed out, at the limit** | **Scan still completes and is never blurred.** Result and cleaned output blurred, with a prompt to create an account for 20 more credits. `04` entry 43 |
| **Signed in, has balance** | The tool, the balance, and the cost of this operation before the button is pressed |
| **Signed in, balance too small for this input** | **Refuses before running.** "This needs 34 credits and you have 12." Never a partial run, never a truncated document. `04` entry 16 |
| **Signed in, zero balance** | Same blur, prompt to buy. **Before payments exist, this says credits are coming rather than showing a dead button** |
| **Purchase pending** | A state that must exist because a webhook can arrive seconds after the redirect. "Payment received, credits arriving." Never a zero balance shown as if the purchase failed |
| **Operation refunded** | The balance returns and **the ledger shows the reversal.** Every failure message already says "Nothing was charged" and the wallet has to prove it |

### 11b. The wallet screen before payments exist

`apps/web/app/home/page.tsx` already says the right thing. What it should become:

- **The balance, in credits, with the word count beside it.** "20 credits, about 2,000 words"
- **The ledger.** Every debit and every refund, with what it was spent on
- **"Credits do not expire"**, stated plainly, because it is a selling point
- **Not a disabled Buy button.** A sentence saying packs are coming

### 11c. Things that would be expensive to guess wrong

| Guess | Why it costs |
|---|---|
| Putting the balance in `accounts.public_data` | **The user can edit it.** Section 2d |
| Counting the limit in operations rather than credits | Teaches one unit then switches it at the moment of purchase. `04` entry 16's original reasoning, and it survives |
| Charging for a scan | Kills the free hook, which is Jon's own framing of the funnel |
| Showing the cost only after the operation | The price must be known before committing. `04` entry 16 |
| Blurring the scan as well as the result | `04` entry 43 rules the opposite, and the economics agree: scanning costs us $0.0000021 |
| Truncating an input that exceeds the balance | `04` entries 16 and 22, and `04` entry 30 for the same reason inside the engine |
| A guarantee in the copy | Section 5. There is no adjudicator for layer B |

---

## 12. Stripe timing, risk, and what Jon starts this week

### 12a. What is verified, and what could not be found

**An individual with no registered company can take payments.** Stripe's own
support documentation confirms a US sole proprietor without an employer
identification number selects the option saying the business does not have one,
and uses their Social Security number instead. **No company is required.**

**What Stripe collects for an individual:** legal name, date of birth, home
address, Social Security number, and a bank account for payouts. Secondary
sources indicate the last four digits initially, with full number or photo
identification requested if automated checks fail. **The last four versus full
number detail is from secondary sources, not from Stripe's own page, which did
not state it.**

**Timing: Stripe publishes no timeframe and I did not find one.** Their own
activation documentation says you can test in a sandbox immediately after
creating an account, and that live mode requires verifying the business, and that
they will contact you if anything else is needed. **It does not say how long.**
Reporting that honestly is better than repeating a number from a content farm.

**One fact that does bound it usefully:** Stripe's documentation states that
after activating a live service, **the business origin country cannot be changed**
without creating a new account. So the country answer matters and is worth
getting right first time.

### 12b. Does this product attract extra scrutiny? Honestly: some, and the copy decides it

**I read Stripe's Prohibited and Restricted Businesses list this session. This
category is not named anywhere in it.** Not watermark removal, not AI detection
evasion, not academic writing, not essay assistance.

**Three entries a risk reviewer could reach for, quoted from the list:**

| Entry | How it could be argued |
|---|---|
| "Document falsification services" | **The weakest fit.** We alter a document's hidden metadata, we do not falsify a document. But the phrase is broad and a reviewer reading fast might land on it |
| "Any other businesses that Stripe considers unfair, deceptive, or predatory towards consumers" | **The real risk, because it is a catch all with no definition.** It is judged on how the site presents itself |
| "Any other products or services that directly infringe or facilitate infringement upon the trademark, patent, copyright, trade secrets, proprietary, or privacy rights of any third party" | **Does not fit.** C2PA provenance is not an intellectual property right of the person who generated a file |

**The empirical answer, which matters more than the policy reading.** Tools in
exactly this category are running on Stripe today. One of them, Natural Write,
states publicly on its own site that its payments are handled by Stripe.
**The category is evidently not automatically refused.**

**My honest judgement, and Jon should have it plainly.** **There is a real
possibility of extra questions, and the thing that decides it is the wording on
the site rather than what the software does.** Two accurate descriptions of
un-claude:

> A tool that finds and removes hidden metadata, invisible characters and
> provenance data from documents and images.

> A tool that helps you bypass AI detection.

**Both are true. The first describes a data hygiene utility. The second describes
something a payments risk team is trained to look at twice.** The competitors who
lead with the second wording are the ones taking the risk, and `04` entry 37
already gives Jon room here: marketing may be enticing and ambiguous while
stopping short of false claims.

**This is not a recommendation to hide anything.** It is the observation that we
have an unusually strong honest description available, because two of our three
layers do something provable and technical that has nothing to do with detection.
**Lead with the true thing that is also the safe thing.**

**Also on the record already, and it belongs in the same conversation:** `06` row
21 records that stripping C2PA may attract regulation, and that it should not be
learned about from a payment processor. **That row's trigger fires here.**

### 12c. The sequence for this week, in order

**Everything in this list involving Jon's identity, bank details or signature is
his alone. I will never ask for those details and never enter them.**

| # | Step | Who | When |
|---|---|---|---|
| 1 | **Create the Stripe account.** Free, reversible, and it starts whatever clock exists | **Jon, alone** | **Today** |
| 2 | **Verify as an Individual.** Name, date of birth, home address, Social Security number | **Jon, alone** | **Today** |
| 3 | **Write the business description carefully.** The single highest leverage sentence in the process. Section 12b | Jon, drafted here if he wants | **Today, with step 2** |
| 4 | **Add the payout bank account** | **Jon, alone** | This week |
| 5 | **Turn on two factor authentication.** Stripe's own account checklist puts this first | **Jon, alone** | This week |
| 6 | **Decide the statement descriptor.** 5 to 22 characters, what appears on a customer's card statement. **An unrecognised descriptor is a leading cause of disputes**, and a dispute costs $15 | Jon decides, we implement | This week |
| 7 | Confirm which Vercel plan the project is on, and move to Pro before the first sale | **Jon** | Before launch |
| 8 | Terms of service, refund policy and a contact address on the site | Landing page session | **Before activation**, see below |
| 9 | Everything else, built and tested in Stripe's sandbox | Billing session | In parallel, no waiting |

**Step 8 is the one most likely to be discovered late.** Stripe's account
checklist points at a website payment best practices checklist, and the standard
expectations are a clear description of what is sold, prices in the customer's
currency, contact details, terms of service, and a refund or cancellation policy.
**Those are pages, not code, and they are the landing page session's work.**
Raising it now costs nothing. Discovering it in week four costs a week.

### 12d. What can be done before verification clears, and what cannot

| Can be done in the sandbox, today | Cannot |
|---|---|
| Create Products and Prices | **Take a single real payment** |
| Build and test the entire Checkout flow with test cards | Receive a payout |
| Build and test the webhook, including signature verification | |
| Build the ledger table and the metering path | |
| Test refunds, failed payments, and duplicate webhooks | |

**So verification is not on the critical path for the build**, only for the first
sale. **The whole billing system can be finished before Stripe says yes.** That
is exactly the parallelism Jon asked for.

**One thing worth knowing about the fallback.** If Stripe declines, the usual
alternatives are merchant of record services like Paddle or Lemon Squeezy, which
handle sales tax as well as payments. **Their acceptable use policies are
generally stricter than Stripe's, not looser**, so being declined by Stripe makes
them less likely rather than more. **Not researched in depth this session and it
should not be, until there is a reason.**

---

## 13. Questions Jon has to answer before a price is final

**Four, and the first two block.**

| # | Question | Why it blocks | My recommendation |
|---|---|---|---|
| **1** | **Does he accept credits only, with no subscription at launch?** | It decides the whole build. A subscription roughly doubles the billing work and adds cancellations, proration and dunning | **Yes, credits only.** P2 |
| **2** | **Is $9 the right entry price, or does he want $5?** | Everything else scales off it, and it is the only number with real conversion risk | **$9.** Section 6b. $5 loses 8.9 percent to Stripe and makes one dispute cost five sales |
| 3 | Is 2,000 free words on signup too generous? | It costs under a penny per signup, so this is purely a judgement about where the buying decision should sit | **Keep 2,000.** It stops just short of a standard essay. P4 |
| 4 | Does he want a money back window at all, and is 30 days right? | It is a policy he owns, not a technical choice | **Yes, 30 days, unspent credits only.** A refund costs $0.56 and a dispute costs about $24.50. P6 |

**Two more that are his call and do not block the build.**

- **What the site says it does**, `06` row 23, which is still formally open. Section 12b argues it is now also the largest single factor in whether Stripe says yes.
- **Whether to publish the attribution to the upstream engine** on the site. `PROVENANCE.md` notes the MIT licence does not require it and that it is planned. **Not a pricing question, but a customer looking at a paid product will find the repository, and finding it ourselves first is better than being shown it.**

---

## 14. What I think is wrong in the existing documents

**Six things. Three are defects in code, two are documents disagreeing with
reality, one is a missing row.**

| # | Where | What is wrong | How I know |
|---|---|---|---|
| 1 | `apps/web/engine/uc_chunk.py` | **Layer B crashes on any single chunk input**, meaning any text under about 350 words or any single paragraph | **Ran it.** Output in section 2b. No model called, nothing spent |
| 2 | Vercel production settings | **`UC_ENGINE_KEY` is not set**, and `_shared.py` fails closed, so the engine should be refusing every call | Listed the production environment variables. **Not confirmed against the running site**: the live call I tried was blocked by a permission rule |
| 3 | `ENGINE.md` section 6 | Says `UC_LAYER_B_RETRIES` is **3** in production. **It is not set at all** and the code default is **8**. The worst case cost multiplier is 8x, not 3x | Listed the environment variables, read the code, **measured 96 calls where 12 were expected** |
| 4 | `apps/web/api/_shared.py` | **`usage_record()` does not record words**, and records no tokens and no retries. `04` entry 22 promised "words in, file size in, and model tokens used for layer B" so the pricing session would not price from guesses. **Words exist inside the layer B block when layer B ran, and nowhere at all on the free path.** Tokens and retries are recorded nowhere | Read the code |
| 5 | `06-assumptions-and-open-questions.md` | **Row 37 does not exist.** `04` entry 43 points at it for how a free allowance is tracked, which is the hardest unsolved question in billing | Searched the file |
| 6 | `apps/web/supabase/.../schema.sql` | Not wrong, but a trap: **`public_data` is user writable** and is the obvious place to put a balance. Section 2d | Read the migration |

**Number 4 is the one that affects this session directly.** It was supposed to
prevent exactly the situation of pricing from estimates. **The numbers in this
document are still sound**, because the model cost was measured directly against
the gateway and the arithmetic cross checks, but **the per request record that
would let us watch the cost move is not there.** Adding a word count, a model call
count and a retry count to that function is small, and it is still impossible to
backfill.

**One thing I want to be clear I am not saying.** `04` entry 16's mechanics are
correct and this document builds on them rather than reopening them. Input is
billed not output, a failure refunds, overflow rejects. **All three survive
contact with the real numbers**, and the third one is now also enforced inside the
engine by `04` entry 30, which is a stronger position than it was.
