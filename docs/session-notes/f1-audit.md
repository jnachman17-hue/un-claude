# F1 — the full audit of the live site

**Run 22–23 August 2026.** un-claude.com was live and taking real money throughout.
Nothing was bought, nothing was deployed, no configuration was changed, and no
production data was touched except throwaway accounts whose email begins
`f1-audit-`. Those are deleted at the end of this note.

**How to read this.** Every finding below carries the actual output it came from,
pasted in, so it can be judged without reading any code. Where something could not
be reproduced, that is said in the finding rather than left out.

**Two words used throughout.** *Layer A* is the invisible characters — real
characters that sit between your words and display as nothing. *Layer B* is the
rewrite, which changes the wording to break the statistical watermark. Layer A and
the file metadata are provable. **Layer B is best effort and nothing below claims
otherwise** — no public detector exists, so nobody can check whether a statistical
watermark was removed, including us.


## WHERE THINGS ARE IN THIS NOTE

It is long, because every finding carries its evidence. Read the first two sections and
the last one and you have the whole thing.

1. **The short version** — twelve lines, and what to do first.
2. **Every finding, in one table** — the complete list by severity.
3. **What was found** — the findings in full, worst first, with the real output.
4. **What passed** — the things that are right, recorded so nobody re-investigates them.
5. **What was measured** — production numbers that did not exist before this run.
6. **What this audit could not cover** — the gaps, named.
7. **What to do, in order** — sixteen items, ranked by what protects a customer soonest.

Everything after that is the working detail behind those seven, one subject per section.

---

## THE SHORT VERSION

**Start here, because it takes real money from a real customer.** Buy credits, use them,
buy more, then ask for the first purchase back inside the thirty days the site offers —
and **the second purchase's credits are taken instead.** The customer has paid for them,
never used them, never asked for them back, and ends with nothing. Reproduced on the
live database, step by step, below.

**And second: the product is being given away free at four addresses, on your money.**
Every deploy leaves a permanent public URL. Twenty exist. Four of them run the paid
rewrite for anyone — no account, no credits, no charge — and bill the AI Gateway. There
is no rate limit because there is no account, and no spend cap because there is no
credit check. **This is the one item in this report with no ceiling on what it can
cost.** Vercel's Deployment Protection closes all four and every future one; it is a
settings switch, not code.

**Two more with no ceiling, and they share the shape.** Any free account can upload any
file of any type and size to a **public** bucket served from your Supabase — **and
deleting the account does not delete the file**, which the privacy policy says it does.
And free credits can be minted over and over from one email address: delete the account,
sign up again, collect another five, because the record that stops it lives on the
ledger and the deletion cascade takes it with everything else. **Three findings in this
report spend your money with nothing counting, and all three are settings or a single
condition rather than engineering.**

**One thing is badly wrong and it is the thing the product is sold on.** The rewrite
invents quotations. Give it a direct quote from a named person and it hands back
different words, still inside quotation marks, still attributed to that person. Three
times out of three. For a student that is a misquoted source — an academic misconduct
problem caused by the tool they paid to protect them, and invisible to them.

**The tool adds the signature it exists to remove.** Every document comes back with em
dashes and curly apostrophes it did not go in with — eight runs out of eight in my own
testing, and the engine agent measured 95 em dashes added to a 10,000-word essay that
had none. Those are among the most commonly cited tells for spotting AI writing. The
scan does not look for them, because it only checks invisible characters and these are
visible. **This is the cheapest thing on the whole list to fix and close to the most
valuable.**

**The advertised size is roughly twice what works.** The site sells 10,000 words. On
production 6,000 completes in 196 seconds against a 240-second cut-off; 7,500, 8,500
and 9,900 all fail after about three and a half minutes. The customer waits and gets
nothing. Their credits do come back.

**Three ways the site takes money for nothing.** A paste under 16 words is charged a
credit, comes back byte for byte identical, and the screen says "Rewritten · Measured,
not estimated". A box containing a single space is charged too. And if a customer's
connection drops mid-job they are charged and — watched for eight minutes against a
known three-minute refund window — not refunded.

**One security hole worth closing while it is cheap.** Any link beginning
`https://un-claude.com/` can be made to land the visitor on any other website, signed
out, no account needed. Three skeptics reproduced it and then talked me down from
"high" to "medium", on the grounds that a phishing link is only worth what the domain's
reputation is worth and this domain is two days old. **They are right, and it is still
one line of code — cheapest now, before the name is worth stealing.**

**The prompt leak is not fixed, and it is the same defect as a stray divider line
appearing in people's documents.** On odd input, three runs in seven come back beginning
*"The following text has been rewritten while strictly adhering to the provided
rules:"* — the model talking about its instructions, handed to the customer as their
document, for a credit. The structural fix from W8 did ship and did reduce it. **It did
not close it, and the board should not mark it done.**

**Several claims are wrong in ways a curious visitor can disprove in ten seconds** —
"100% of detectable marks removed", "a hard three-word ceiling" (the site's own receipt
printed 6), "nine classes checked" (one of the nine finds nothing), "upload a file and
you get all three" (no file type gets all three). On a site whose whole argument is
that its claims survive checking, these are the expensive ones.

**And the news logos need a link or need to go.** Nine national mastheads scroll across
the homepage under 13-pixel grey type with nothing behind them.

**Now the good news, and it is substantial.** The two layers this product can actually
prove both work, and I tested them properly rather than taking them on trust. The
scanner found 15 of 15 planted invisible characters. A JPEG carrying a real C2PA
content-credential block had it found, named, removed, and confirmed absent in the
returned bytes. A Word document came back uncorrupted with every word intact and its
author name gone, and the panel told the truth about what it did and did not do. The
money boundary holds — no browser can change the price. Six simultaneous jobs against
one balance never overspent. The ledger passes every integrity check. **And the pricing
is comfortable: even the cheapest pack against the most expensive work returns
twenty-seven times what the job costs to run.**

---

# EVERY FINDING, IN ONE TABLE

The report below grew as the audit ran, so findings are numbered in one section,
lettered in another, and a few have sections of their own. **This table is the whole
list in one place.** Everything marked "conductor" was reproduced by hand against the
live site with the output pasted in.

| # | severity | finding | verified by |
|---|---|---|---|
| 0 | **CRITICAL** | Four old deployment URLs give the paid rewrite away free, with no account and no charge, on Jon's gateway key | agent, then conductor across all 20 URLs |
| 0a | **CRITICAL** | Refunding one purchase confiscates the credits of a different purchase the customer paid for | gap agent, then conductor |
| 0b | **HIGH** | Any free account can upload any file to a public bucket — and deleting the account does not delete it, against the privacy policy | gap agent + conductor |
| 0c | **HIGH** | Free credits can be minted repeatedly from one email — deleting the account destroys the record that prevents it | conductor, 3 rounds |
| 0d | MEDIUM | A new customer's wallet says "0 credits" and offers to sell them some; the grants are minted only when they visit the tool | conductor |
| 1 | **CRITICAL** | A 9,900-word document fails after 3½ minutes; the site advertises 10,000 | conductor, twice |
| 1b | **HIGH** | The tool inserts em dashes, curly apostrophes and markdown asterisks the customer never typed | conductor, 8 of 8 and 3 of 3 |
| 2 | **HIGH** | The rewrite invents quotations and leaves them attributed to a named person | conductor, 3 of 3 runs |
| 3 | MEDIUM | Any `un-claude.com` link can redirect to any website, signed out *(skeptics downgraded from high)* | conductor + 3 skeptics |
| 4 / C | **HIGH** | A paste under 16 words is charged a credit, returns identical text, and the screen says "Rewritten" | conductor + agent |
| A | MEDIUM | If Cloudflare is blocked the visitor hits an unrecoverable dead end that blames their internet *(downgraded)* | conductor + 3 skeptics |
| B | MEDIUM | The delete-account warning names teams and subscriptions that do not exist and never mentions credits *(reframed by a skeptic)* | conductor + 3 skeptics |
| E | **HIGH** | Any file over 3.2 MB fails; the site's own size message can never fire | conductor + agent |
| M | **HIGH** | "Upload a file and you get all three" — no accepted file type gets all three | conductor + 2 agents |
| N | **HIGH** | The site promises a three-word ceiling; its own receipt printed 6 | conductor |
| — | **HIGH** | Three of the four "enforced rather than promised" FAQ claims fail against the product's own receipt | conductor |
| — | **HIGH** | The prompt leak is not fixed — 3 runs in 7 return the model discussing its own rules, and this is also the `---` divider | conductor + 3 skeptics |
| — | **HIGH** | The refund tool says money is owed on a payment already refunded in full | conductor + skeptic |
| 5 | MEDIUM | The rewrite returns documents 6–14% longer and calls it "Length 114% kept" | conductor, 8 runs |
| 6 | MEDIUM | On repetitive text the rewrite silently deleted 22–29% of the document | conductor, twice |
| 7 | MEDIUM | A date vanished; the field designed to flag that came back empty | conductor |
| 8 | MEDIUM | The credit history prints dates in UTC, so the Americas see tomorrow | conductor |
| 9 | MEDIUM | The "words cleaned" counter goes backwards on reload | conductor, 4 loads |
| 10 | MEDIUM | The pricing page quotes 1 credit for a file and charges 5 | conductor |
| 11 | MEDIUM | Sixteen news logos under "The story, as covered by:" with no link to anything | conductor + agent |
| D | MEDIUM | The served page is a menu and a footer; 483 KB of script draws the rest | conductor |
| G | MEDIUM | Every page's link preview shows the homepage | conductor, 9 pages |
| H | KNOWN (6d) | Header credit count and workbench chip disagree on screen — already on the board, now photographed | conductor, screenshot |
| L | MEDIUM | The only support channel is a `mailto:` that does nothing without a mail app | conductor |
| O | MEDIUM | "Nine classes checked" — the lookalike-letter class finds nothing | conductor |
| — | MEDIUM | A dropped connection charges the customer and does not refund | conductor, watched 8 min |
| — | MEDIUM | The credit check runs before the file check, so you can be told to pay for a job that will be refused | conductor |
| — | MEDIUM | A whitespace-only paste is charged a credit | conductor |
| — | MEDIUM | The domain has no MX records, so `support@un-claude.com` cannot exist | conductor |
| — | MEDIUM | No page has a main landmark or a skip link | conductor, 10 pages |
| — | UNRESOLVED | After a scan the result is wrapped in a button — the computed tree does not support the strongest reading; needs VoiceOver | agent, partly refuted by conductor |
| — | MEDIUM | Little announces working, finished or failed — the status line carries no role | conductor |
| 12 | LOW | The file input is in the tab order with no name; the paste box has only a placeholder | conductor |
| 13 | KNOWN (6e) | The header credit chip wraps onto two lines — already on the board, now photographed | conductor, both widths |
| I | LOW | A Word document is told "the picture itself is untouched" | conductor |
| Q | LOW | The privacy policy describes a cost record the database never writes | agent + conductor |
| — | LOW | "100% of detectable marks removed" — 15 found, 12 removed, 3 kept on purpose | conductor |

**And what passed** — the price boundary, the failure refund, the 10,000-word refusal,
Word-document integrity, layer A detection, the C2PA metadata layer, concurrency, the
ledger's integrity, every internal link, and the speed of the site itself. Those are in
"WHAT PASSED" and in the two layer sections, with their evidence.

---

# WHAT WAS FOUND — worst first

Everything in this section was run by the conductor against https://un-claude.com or
the live database, and the output pasted below is the real output.

---

## CRITICAL

### 0. Old copies of the site are still on the internet and give the paid product away free

**What this is.** Every deploy leaves its own permanent public address. Twenty of them
exist for this project. **Four of those twenty run the paid rewrite for anybody, with no
account, no sign-in, no credits, and no charge** — on Jon's AI Gateway key.

**Tested with no cookie and no account of any kind:**

```
*** FREE REWRITE, NO ACCOUNT ***   https://un-claude-1h60qtg8l-....vercel.app
401 no_session                     https://un-claude-1xm7lx76f-....vercel.app
*** FREE REWRITE, NO ACCOUNT ***   https://un-claude-4yocntf4w-....vercel.app
401 no_session                     https://un-claude-6z6ij2eee-....vercel.app
   ... (twelve more correctly refusing) ...
*** FREE REWRITE, NO ACCOUNT ***   https://un-claude-c70s83ies-....vercel.app
*** FREE REWRITE, NO ACCOUNT ***   https://un-claude-jwa231z8d-....vercel.app
401 no_session                     https://un-claude.com          <- the real site is fine
```

**One of them, in full:**

```
HTTP 200
ok            : true
credits block : (none — nobody was charged)
model used    : mistral/mistral-medium | gateway: https://ai-gateway.vercel.sh
cost to Jon   : $0.0001556

INPUT : The scope of urban transport policy has grown markedly across the last two...
OUTPUT: Over the past twenty years, the reach of policies governing urban transportation
        has expanded significantly. Because of this, the committee determined that...

gateway balance before: $9.754154
gateway balance after : $9.721069
>> a stranger just spent $0.0331 of Jon's money, for free
```

**Why this is the worst thing in this report.** Every other finding costs a customer
some friction or costs Jon a few cents. **This one has no ceiling.** There is no
account, so there is no per-account rate limit; no credit check, so there is no spend
cap; and the address works forever. Anyone who finds one — and deployment URLs turn up
in build logs, in browser history, in link previews, and can simply be tried — has an
unmetered tap into the paid model on Jon's card.

**A rough sense of scale.** A 6,000-word rewrite costs about 5.6 cents. The gateway
balance is about $10. **A script doing nothing clever would drain it in under an hour**,
and what happens after that depends on how the account is topped up.

**These are old builds** — the live site and sixteen of the twenty correctly return
`401 no_session`, so the sign-in requirement was added at some point and these four
predate it. **They were never turned off, because nothing turns them off.**

**Fix sketch, and it is a settings change rather than code.** Vercel has Deployment
Protection, which puts every preview and retired deployment behind authentication while
leaving the real domain public. Turning it on closes all four at once and every future
one automatically. **I did not change it** — configuration is out of this audit's
territory — but it is one switch and it should be the first thing done after reading
this.

**Credit where it is due, and a lesson.** The operations agent found this. I very nearly
dismissed it: I tested three retired URLs, all three refused, and I was about to record
it as not reproducing. **It only appears in four of twenty.** A sample of three was not
a test, it was a coin toss — which is the same mistake in the opposite direction from
the ones this audit exists to catch.

---

### 0a. Refunding one purchase takes the credits out of a different purchase (CRITICAL)

**A gap-filling agent found this and I reproduced it on the live database. It is the
most serious money defect in this report.**

**The path is ordinary, not exotic: buy, use it up, buy again, then ask for the first
one back inside the thirty days the site offers.**

```
1. signs up                          balance 5
2. buys pack A, $4.99, 10 credits    balance 15
3. sanitises 15,000 words            balance 0
4. buys pack B, $4.99, 10 credits    balance 10   <- paid for, untouched
5. Stripe refunds pack A only        rpc HTTP 200, removed 10 credits
                                     balance 0    <-- pack B is gone

the customer's ledger:
    +2  anon_grant
    +3  signup_grant
   +10  purchase       pi_..._A
   -15  spend
   +10  purchase       pi_..._B
   -10  money_refund   pi_..._A      <- tagged to pack A, took pack B's credits
   SUM = 0
```

**The customer paid $4.99 for pack B, never used it, never asked for it back, and has
nothing.** The refund row even carries pack A's payment intent, so the ledger says the
money came from a purchase whose credits were already spent.

**The cause, and it is one word in the wrong place.** `refund_purchase` clamps what it
removes against **the whole account balance** rather than against what remains of *that
purchase*. When pack A's credits are already spent, the clamp finds pack B's and takes
those instead.

**The clamp itself is deliberate and correct** — the function's own comment explains
that a negative balance "would refuse every job including the free scan, show the
customer a number nobody can explain, and leave them no way out except buying their way
back to zero". That reasoning is sound. **The mistake is which pool it clamps against.**

**This is the same family as the bug the board believes it fixed.** `LAUNCH-CHECKLIST`
item 1a records the Stripe audit catching that `charge.amount_refunded` is a running
total, "so two partial refunds on one pack would have eaten credits belonging to other
purchases". **That shape was fixed. This one — spend the pack, buy another, refund the
first — was not.**

**Fix sketch.** Clamp against the credits still attributable to that payment intent, not
against the account. If the customer has already spent what they are refunding, the
honest answer is to remove nothing and record the shortfall, not to take somebody else's
credits — which is a second finding the same agent raised: a full refund on spent credits
returns all the money and takes back only the leftovers, with nothing anywhere saying so.

---

### 0b. Anyone with a free account gets public file hosting on your Supabase (HIGH)

**Nobody in the audit looked at Supabase Storage.** A completeness critic pointed at it
and it turned out to be worth the look.

**The live project has one bucket, and it is public with no limits of any kind:**

```
bucket: account_image | PUBLIC: true | size limit: null | allowed mime types: null
objects: 0
```

**`size limit: null` and `allowed mime types: null` mean exactly what they say.** Tested
as an ordinary signed-in customer using their own session token — not the service key,
which would have proved nothing:

```
upload a TEXT file as a customer  -> HTTP 200
read it back with NO credentials  -> HTTP 200  content-type: text/plain
                                     "F1 AUDIT test upload as an ordinary customer."
```

**So a free account is a public file host.** The control that feeds it is the "Upload a
Profile Picture" box on the settings page — part of the starter-kit boilerplate (finding
B), on a product that **never displays a profile picture anywhere**.

**Two costs, and the second is the one that matters.** The obvious one is storage: no
size cap, so an account can upload as much as it likes and Jon pays. The worse one is
that **anything uploaded is served publicly from Jon's project URL** — so the site can
be used to host whatever somebody wants hosted, and free accounts take a minute to make.

**And deleting your account does not delete what you uploaded.** This is the half that
touches the privacy policy, and it was reproduced end to end:

```
customer uploads a file        -> HTTP 200
public URL responds            -> HTTP 200
the account is DELETED         -> HTTP 200   (the same call the settings button makes)
   accounts row afterwards     -> []          gone
   auth user afterwards        -> 404         gone

the uploaded file AFTER the account is deleted:
   HTTP 200 | content-type: text/plain
   "F1 AUDIT — pretend this is a photograph of the customer. DELETE ME."
   *** STILL PUBLIC. The account is gone and the file is not. ***
```

**Read that as the customer.** They uploaded a photograph of their face as a profile
picture. Later they deleted their account specifically to have their data removed. Their
email, their name and their whole credit history really are gone — **and the photograph
of their face is still sitting at a permanent public web address that anyone with the
link can open.**

**The privacy policy promises otherwise**, and the deletion cascade this audit verified
elsewhere is genuinely thorough — it takes the account row, the auth user and every
ledger row. **It simply does not know about storage.**

**The audit's own files were deleted immediately and the bucket is back to zero
objects.**

**Fix sketch, and it is settings rather than code.** Set a MIME allowlist of image types
and a size limit on the bucket — or, since nothing in the product shows a profile
picture, remove the upload control and the bucket together. That is the cleaner answer:
the whole feature is inherited boilerplate that this product does not use.

---

### 0c. Free credits can be minted over and over from one email address (HIGH)

**A completeness critic asked whether anyone had deleted an account and signed up again
with the same address. Nobody had.**

**Three rounds, same email, delete and recreate each time:**

```
round 1: balance 5   rows ["signup_grant 3", "anon_grant 2"]
round 2: balance 5   rows ["signup_grant 3", "anon_grant 2"]
round 3: balance 5   rows ["signup_grant 3", "anon_grant 2"]
```

**Five credits every time.** There is a dedupe index designed to stop the signup grant
repeating for an address that has already had it — `20260821120300_signup_grant_email_
dedupe.sql`. It works by looking for an existing grant row **on the ledger**, and
deleting the account cascades those rows away. **The guard is deleted along with the
thing it was guarding against.**

**And the product ships the button.** "Delete your Account" is live on the settings page
(finding B). A person does not need any tools: delete, sign up again, collect five more.

**Stated precisely, because the path matters.** I deleted and recreated through the
admin API, which is faster than a person could go. A real user would click the button
and then re-register through the normal flow, which still requires clicking a
confirmation email — **a delay, not an obstacle, since it is the same inbox every time.**

**What it costs.** Five credits is 5,000 words, which is two to five cents of model
spend. Slow by hand; unbounded by script.

**This is the third finding in this report with no ceiling on it** — alongside the
retired deployments (0) and the public bucket (0b). They share a shape: **things that
spend Jon's money with nothing counting.**

**Fix sketch.** Key the dedupe on something that outlives the account — a `granted_
emails` table that deletion does not cascade, holding a hash of the address rather than
the address itself.

---

### 0d. A new customer's first look at their wallet says "0 credits" (MEDIUM)

**Another critic gap: nobody had fetched `/home` for an account that had not already
called `/api/credits`.** That is precisely what a new customer does — sign up, confirm
the email, go and look at their account.

**Live, on a brand-new confirmed account that had done nothing else:**

```
ledger rows before anything : 0
GET /home                   : HTTP 200
what the wallet says        : "Your credits · 0 credits · About 0 words of sanitising.
                               Credits never expire. · Get credits"
ledger rows after /home     : 0

then GET /api/credits       : {"ok":true,"balance":5}
ledger rows after that      : 2  ["signup_grant 3", "anon_grant 2"]
```

**The free credits are minted lazily by `/api/credits`, and `/home` never calls it.** So
the wallet shows zero until the customer happens to visit the tool.

**Read the sequence as the customer.** The sign-up page promised **3 free credits**. The
first page they open after confirming their email says **0 credits** and offers a **Get
credits** button. Later, if they find the tool, it becomes **5**.

**Three different numbers about their money, in the first two minutes, and the middle
one is the one that asks them to pay.** That is the worst possible moment for it: they
have just committed, and the product's first act is to tell them they have nothing.

**Fix sketch.** Mint the grants when the account is created, or have `/home` call the
same code path `/api/credits` does before it renders.

---

### 1. A 9,900-word document fails, and 9,900 is inside the limit the site advertises

**What a student sees.** I pasted my dissertation chapter. It said "Rewriting" for
three and a half minutes. Then it said the rewrite could not be completed and to try
again. I got my credits back, so I have not lost money — but I have lost four
minutes and I still do not know whether this site can do the thing I came for.

**Tried twice. Failed twice.**

```
THE 10,000-WORD CASE ON PRODUCTION — never run before.
words in: 9900 | base64 chars: 89168 | balance before: 25
HTTP 400 | WALL CLOCK 227.8 seconds
BODY: {"ok":false,"code":"layer_b_failed","message":"The rewrite could not be
       completed. Nothing was charged. Please try again."}
```

```
words in: 9900 | base64 chars: 89168
HTTP 400 | WALL CLOCK 198.1 seconds
BODY: {"ok":false,"code":"layer_b_failed","message":"The rewrite could not be
       completed. Nothing was charged. Please try again."}
```

**The credit really did come back — the live ledger, not a report:**

```
id 1041    -10 spend            words_in=  9900   2026-08-23T06:24:24Z
id 1072    +10 operation_refund words_in=     -   2026-08-23T06:27:41Z
```

**Why this is the worst thing on the list.** The pricing page sells the Pro pack as
*"A dissertation, with room to spare"* and its calculator goes up to 100,000 words.
The engine cannot finish 9,900. The one case the product is sold on is the case that
does not work.

**It is also slow enough to be its own problem.** 198 and 228 seconds. The site
gives up at 240. There is no margin, and the time is not caused by length — it is
caused by how many times the internal fact-check demands a retry, which is why a
smaller document can take longer than a bigger one.

**Fix sketch.** Either lower the advertised limit to a size that actually completes,
or split long documents into jobs that are submitted and collected rather than waited
on. The current limit is a promise the engine cannot keep.

---

## HIGH

### 1b. The tool that removes AI signatures inserts the most famous one

**What a student sees.** Their teacher says the long dash is how she spots ChatGPT.
Their essay had none. It comes back with several, and every apostrophe has changed
shape.

**Eight live runs of my own, two different documents. Every single one:**

```
input -> output                          em-dash      curly apostrophe
varied2500 -> run 1                       0 -> 6            0 -> 18
varied2500 -> run 2                       0 -> 9            0 -> 22
varied2500 -> run 3                       0 -> 7            0 -> 22
varied2500 -> run 4                       0 -> 7            0 -> 22
varied2500 -> run 5                       0 -> 7            0 -> 16
essay      -> run 1                       0 -> 5            0 ->  6
essay      -> run 2                       0 -> 7            0 ->  6
essay      -> run 3                       0 -> 10           0 ->  7
```

**Zero going in. Never zero coming out. Eight times out of eight.**

**One of them, from my own run, in full:**

> "...notes imply she did not. Public sentiment eventually aligned with the contested
> appraisal**—**but only after a wait of close to two years."

**The engine agent measured how it scales**, and it scales with length: 100 words → 1
em dash, 1,000 → 6, 2,500 → 16, 5,000 → 34, **10,000 → 95**.

**And it does the same thing with formatting.** The agent reported markdown asterisks
being injected; I could not reproduce that on flowing prose and then worked out why —
**it needs the document to have a heading.** Given one, it happens every time:

```
input : a plain-text heading, "The Case for Slower Committees", no formatting anywhere,
        0 asterisks in the whole document

run 1 : asterisks 4 (1 bold span)   first line: "**Why Committees Should Slow Down**"
run 2 : asterisks 4 (1 bold span)   "**Why Committees Should Move More Deliberately**"
run 3 : asterisks 4 (1 bold span)   "**Why Committees Should Move More Deliberately**"
```

**Three out of three.** The student's heading comes back wrapped in literal asterisk
characters. Pasted into Word or Google Docs those are not formatting — they are two
stars sitting either side of the title, to be deleted by hand.

**Why this belongs near the top.** The product exists to remove the marks that identify
writing as machine-made. The em dash and the curly apostrophe are among the most
commonly cited stylistic tells in the public conversation about spotting AI writing —
**I have not measured how many teachers actually use them, and this note does not claim
to**, but they are the marks the discussion is about, and the tool is adding them every
time, in proportion to how much the customer paid.

**What is measured, and is not a matter of opinion:** the customer's document goes in
with none and comes back with several, and **nothing in the product tells them.** The
scan checks invisible characters; an em dash is visible, so it is not looked for, and
the receipt does not mention punctuation at all.

**It is also the cheapest thing on this list to fix**: a post-pass that maps em dashes
back to the punctuation the customer used, restores straight apostrophes, and strips
markdown the input never had. It changes no meaning and needs no model.

---

### 2. The rewrite invents quotations and leaves them attributed to a real person

**What a student sees.** Nothing. That is the problem. The quotation marks are still
there, the name is still there, the sentence reads well — and the words inside the
quotation marks are not the words the source wrote.

**Three runs out of three, on the live site. The input, once:**

> Scholars have long disagreed about the purpose of the university essay. Marsh
> (2024) put it bluntly: **"The essay is no longer a private act of thinking, but a
> negotiation with a machine."** Others resist that framing. As Okonkwo notes, **"we
> have been negotiating with our tools since the first printing press, and the essay
> survived."**

**What came back:**

```
RUN 1  quote1_survived=false  quote2_survived=false  charged=1
  ...In a direct assessment from 2024, Marsh declared, "Writing an essay now means
  engaging with an algorithm rather than simply working through ideas alone."
  ...Okonkwo counters by pointing out, "Humanity has always adapted its methods to
  new instruments—even the printing press didn't erase the essay."

RUN 2  quote1_survived=false  quote2_survived=false  charged=1
  ...In stark terms, Marsh's 2024 assessment declared, "Essays are no longer
  solitary reflections—they've become exchanges with an algorithm."
  ...Okonkwo counters by arguing, "Humanity has always adapted to its instruments,
  from the printing press onward, and essays endured regardless."

RUN 3  quote1_survived=false  quote2_survived=false  charged=1
  ...Marsh (2024) declared that essays are "now a back-and-forth with an algorithm
  rather than a solitary reflection."
```

**This is worse than the board records it.** `LAUNCH-CHECKLIST` item 6f says the
rewrite "alters quoted text". What it actually does is **produce a new, fluent,
plausible quotation and leave it in quotation marks under the original name**. A
student cannot spot that by reading. A marker who checks the source finds a quote
that does not exist, and the consequence lands on the student.

**Fix sketch.** Protect spans inside quotation marks and pass them through the
rewrite untouched. There is no quote handling anywhere in the engine today.

---

### 3. Any un-claude.com link can be made to send a visitor to any other website
*(I first called this HIGH. Three skeptics reproduced it and argued it down to MEDIUM,
and they were right — the reasoning is below.)*

**What a student sees.** A link that starts `https://un-claude.com/`, so they trust
it, and a browser that lands somewhere else entirely. If that somewhere else is a
copy of the sign-in page, they type their password into it.

**Live, signed out, no account needed:**

```
next=https://example.com/         HTTP/2 307  location: https://example.com/
next=//example.com                HTTP/2 307  location: //example.com
next=https://evil.example/phish   HTTP/2 307  location: https://evil.example/phish
next=/home                        HTTP/2 307  location: /home
```

**Why it is medium and not high, in the skeptics' words rather than mine.** All three
reproduced it. The consequence skeptic then made the point I had missed: *"The callback
carries no token to the attacker's site (the code is exchanged server-side), so nothing
leaks; this is purely a phishing dressing — and un-claude.com is a two-day-old domain
with ~40 accounts, so its name buys a phisher almost nothing today."* **A phishing link
is worth what the domain's reputation is worth, and this domain has none yet.** That
will change, which is the argument for fixing it now while it is one line.

**Fix sketch.** `/auth/callback` should only ever redirect to a path on this site.
Reject anything with a scheme or a leading `//`.

---

### 4. A short paste is charged a credit and nothing at all is done to it

**What a student sees.** The first thing anyone does is paste one sentence to check
the tool works. It takes a credit and hands back exactly what they typed.

**The whole transaction, live:**

```
balance BEFORE : 36
HTTP           : 200
charged        : 1  balance in response: 35
report.stats   : {"input_length":39,"output_length":39,"removed":{},"replaced":{},
                  "removed_count":0,"replaced_count":0,"nfkc_changed":false}
layer_b        : {"skipped":"input_too_short","min_words":16,"words_in":8,
                  "reason":"The rewrite needs at least 16 words and this is 8.
                            Hidden characters and file data were still removed."}
INPUT  bytes   : 39 "A short note about nothing much at all."
OUTPUT bytes   : 39 "A short note about nothing much at all."
IDENTICAL      : true
balance AFTER  : 35
newest ledger row: {"id":895,"delta":-1,"reason":"spend","endpoint":"clean",
                    "words_in":8,"cost_usd":null}
```

Nothing was removed. Nothing was rewritten. It cost us nothing to run — `cost_usd`
is empty. The customer paid a credit.

**Being precise about what is new here, because a skeptic killed the agent's version
of this finding for being a restatement of P2 — and it was right to.** The board's P2
already records both halves of the silence: *"the engine returns a `reason` string that
nothing in the workbench renders"*, and *"pricing is unchanged on both branches of the
cost expression — checked, not assumed"*. **So the charge is known and was accepted.**

**What is new is that the interface does not stay silent — it says the opposite.**
Reproduced by hand in a real browser on the live site, signed in, with a six-word paste.
**This is the panel, verbatim:**

```
Statistical watermark
The exact sequence of your words
REWRITTEN
Rewritten. The longest stretch of your original wording left is 6 words in a row.
The mark rides only on unbroken stretches of your original words.

WHAT THE REWRITE CHANGED          Measured, not estimated
REPLACED      0%    of your wording
LONGEST RUN   6     words of your original left in a row
LENGTH        100%  of the original kept
RETURNED      6     words handed back
```

**Read the two halves against each other.** The headline says **REWRITTEN**. The numbers
underneath say **0% of the wording was replaced** and **100% of the length kept** — which
is the truth, sitting directly beneath the claim it contradicts, under a label that says
*"Measured, not estimated"*.

**And it breaks the three-word promise in the same breath.** The site says *"a hard
three-word ceiling on surviving sequences"*. This panel reports **6 words surviving in a
row** — which on a six-word document is the entire thing, untouched.

P2 describes a product that is **correct and silent**. The live product is **correct
and wrong on screen** — it charges, does nothing, and reports the rewrite as done and
measured. That is a different and worse thing, and it is the half worth acting on.

**It goes further than short pastes. One space costs a credit.**

```
an empty string              HTTP 400  no_file        balance 26 -> 26   (correctly refused)
a single space               HTTP 200  charged 1      balance 26 -> 25   input " "  output " "
spaces and newlines only     HTTP 200  charged 1      balance 25 -> 24   identical in and out
one word "Hello"             HTTP 200  charged 1      balance 24 -> 23   identical in and out
```

An empty box is guarded. **A box containing one space is not.** A customer who taps
the box, brushes the space bar and presses the button pays a credit for a space. With
five free credits, a stranger can burn the lot on nothing and never learn why.

**Fix sketch.** Either do not charge when the rewrite is skipped, or show the reason
and say plainly that only layer A ran. Charging silently is the worst of the three.
And the guard that already refuses an empty string should refuse a blank one too.

---
## MEDIUM

### 5. The rewrite hands back a longer document than you gave it, and calls that a feature

**What a student sees.** An essay with a 2,500-word limit comes back at 2,800.
Three hundred words over, and they would be marked down for it. The receipt on
screen says **"Length 114% — of the original kept"**, which reads like good news.

**Measured on the live site. Same 2,553-word input, five runs:**

| run | words in | words out | change |
|---|---|---|---|
| 1 | 2,553 | 2,698 | +5.7% |
| 2 | 2,553 | 2,833 | +11.0% |
| 3 | 2,553 | 2,763 | +8.2% |
| 4 | 2,553 | 2,784 | +9.0% |
| 5 | 2,553 | 2,748 | +7.6% |

**It depends on size.** At 730 words the length is roughly held (−8%, +4%, −3%
across three runs). Above about 2,000 words it runs consistently long. A separate
agent measured +14% at both 2,484 and 5,106 words.

**Fix sketch.** The existing guard only catches output that is far too long. A
tighter ceiling near the input length, and a receipt that says "300 words longer
than you gave us" instead of "114% kept", would both help.

---

### 6. On repetitive text the rewrite quietly deleted a third of the document

**What a student sees.** Nothing warns them. The document is simply shorter.

**Live, a 4,800-word text file:**

```
CHARGED       : 5 credits
usage         : {"words_in":4800,"words_out":3398,"seconds":82.587,"ok":true}
paragraphs in/out: 1 / 154   structure_kept: false
```

**1,402 words gone, and the engine knew.** `structure_kept: false` is the engine's
own verdict on its own output, and it returned the result anyway without telling
anyone.

**Settled properly, because an agent reported the same loss at 5,000 words and I needed
to know whether it was about repetition or about size.** It is about repetition. Varied
academic prose was run at the same length:

```
5,025 words of varied prose  ->  5,679 words back   =  +13.0%    21.6 s   $0.021
4,800 words of repetitive text ->  3,398 words back  =  -29.2%    83.4 s   $0.025
6,000 words of repetitive text ->  4,670 words back  =  -22.2%   196.3 s   $0.056
```

**Ordinary writing is never shortened — it grows.** Repetitive writing collapses, and it
is also three to nine times slower and dearer to run.

**Why that matters for a real customer.** A student's essay is ordinary prose and will
come back longer (finding 5, and the reason it matters is word limits). But a
**bibliography, a glossary, a reference list, a table of results or a survey
instrument** is repetitive, and there is no floor stopping the rewrite from deleting a
quarter of it. Those are things students upload.

**And it means one of the agents' findings needs reading carefully.** Dimension 13
reports "loses up to a quarter of the essay" from a 5,000-word run. That run used
synthetic repetitive text, as mine did. **On an actual essay the number goes the other
way**, and the finding is right about the mechanism and wrong about which documents it
hits.

---

### 7. A number vanished from the document, and the field designed to flag that was empty

**What a student sees.** Nothing. A date is simply missing from one sentence.

**Live, on a 2,553-word document containing ten mentions of the year 1974:**

```
FIGURES THAT LOST OCCURRENCES (in -> out):
    1974 : 10 -> 9

The engine's own receipt reported: figuresIn 53, figuresKept 47, figuresToCheck []
```

The engine counted 53 figures going in and 47 surviving. `figuresToCheck` — the
field whose entire job is to tell the customer which numbers to go and verify — came
back **empty**. The tool noticed and said nothing.

**And the 53/47 pair turns out to be worthless as evidence, which a skeptic established
while trying to refute a different finding.** It ran a document containing **no digits
at all** through the live site and the receipt came back reporting `figuresIn: 21,
figuresKept: 18` — three figures lost from a document that has no figures.

```
receipt {"wordsIn":1000,"wordsOut":1037,"figuresIn":21,"figuresKept":18,"figuresToCheck":[]}
digits in the input document: 0
```

**So the counter is not counting figures**, and neither its alarms nor its all-clears
mean what the panel says they mean. That resolves the discrepancy I hit — my own run
reported 53 in and 47 kept on a document containing ten occurrences of one number.

**What survives, and it is the part that matters:** a year really did disappear from the
customer's document, independently counted, and nothing on the receipt or the screen
said so. **The mechanism meant to catch exactly that is reporting numbers it cannot
justify.**

---

### 8. The credit history shows tomorrow's date

**What a student sees.** They buy credits on Saturday evening and their history says
Sunday. If they ever match it against a bank statement, the dates do not line up.

**Live, on the wallet page, against the real timestamp in the database:**

```
DB row: [{"id":534,"delta":40,"reason":"adjustment",
          "created_at":"2026-08-23T01:54:18.516286+00:00"}]
Local (America/Los_Angeles): 8/22/2026, 6:54:18 PM
Displayed on /home:          "Aug 23, 2026"
```

The transaction happened at 6:54pm on the 22nd in California. The page says the 23rd.
The date is being printed in UTC instead of the customer's own time zone, so everyone
in the Americas sees tomorrow's date on anything done after late afternoon.

This is the money-display defect family again — the same one as the frozen header
count (6d) and the word counter that lied (B6). It is on the page that is a
financial record.

---

### 9. The "words cleaned" figure goes backwards when you reload the page

**Four consecutive fresh loads of the homepage:**

```
load 1:  2,783,981
load 2:  2,784,460
load 3:  2,783,987   <-- 473 lower than the load before it
load 4:  2,784,148
```

**This is not a complaint about the counter existing.** Decision 71 ruled that a
seeded figure rising on a clock is acceptable and why, and that ruling governs. The
finding is narrower: the component's own documentation states that it is *"anchored
to a fixed instant, not to page load"* and that *"a counter that restarts on refresh
is the tell that gives fake ones away."* On the live site it does restart on refresh.
It fails the one honesty property it was built to have, on a site whose whole
argument is that it does not overclaim.

---

### 10. The pricing page quotes one credit for a file and charges five

**What a student sees.** The page says files are one credit each whatever their
size. They upload a term paper as a `.txt` and are charged five.

**Live, a 4,800-word `.txt`:**

```
pricing page says: "One Word document or picture, any size" = 1 credit,
                   "Files are one credit each whatever their size"
CHARGED       : 5 credits
usage         : {"kind":"text","extension":".txt","words_in":4800,"layer_b_used":true}
```

**Both halves of the page are on the same page.** Further down, the FAQ gets it
right: *"One credit sanitises 1,000 words of text, whether you paste it in or upload
it as a .txt file."* But the summary bullets at the top and the caption under the
calculator say the opposite, and the summary is what people read.

This follows from Jon's ruling B7a — make `.txt` behave exactly like a paste — which
is the right call. The copy was updated in four places and these two were missed.

---

### 11. Sixteen news organisations' logos, and not one link to an article

**What a visitor sees.** Under the line **"The story, as covered by:"** a scrolling
band of CNN, ABC News and Forbes. It is the standard "as featured in" trust badge,
and it will be read as press coverage of un-claude.

**Live, from the homepage HTML — no link, no citation, no date:**

```html
<img src="/images/outlets/cnn.svg"    alt="CNN">
<img src="/images/outlets/abc.svg"    alt="ABC News">
<img src="/images/outlets/forbes.svg" alt="Forbes">
```

**Sixteen logo files are shipped and every one serves 200 on the live site:**
`abc, axios, cnet, cnn, forbes, fortune, guardian, npr, nyt, register, techcrunch,
wired, wsj`. Nine of them scroll past in the marquee.

**And it is far more prominent than the description suggests.** In a full-width
screenshot of the live homepage the logos — CNET, THE WALL STREET JOURNAL, The
Guardian, WIRED, The New York Times, CNN — run edge to edge at roughly 40 pixels
tall across the whole viewport. The qualifying line above them, *"The story, as
covered by:"*, is 13-pixel grey type. On a phone, scrolling, nobody reads the
13-pixel line.

**Why this is a finding and not a matter of taste.** The charitable reading — that
these outlets covered *AI watermarking*, not us — is defensible, and it is probably
what was meant. But a reader cannot check it, because nothing links anywhere. On a
site that now takes money from Americans, showing named companies' trademarks under
a coverage line with no article behind it is an implied endorsement, and that is a
category regulators recognise.

**The contrast makes the point.** The same homepage cites Anthropic properly — the
word "Anthropic" links to `anthropic.com/news/claude-text-watermark`, which returns
200. The site knows how to source a claim. It did not source this one.

---
## LOW

### 12. Someone using a screen reader meets an unnamed button on the way to the tool

**Live, from the homepage.** The file-upload control is one pixel square, invisible
on screen, **in the keyboard tab order**, and has no name of any kind:

```
{ "tag": "INPUT", "type": "file", "class": "sr-only",
  "width": 1, "height": 1, "tabIndex": 0,
  "aria-label": null, "labels": 0, "hidden": false }
```

A blind student tabbing through the page reaches it and is told nothing about what it
is. The paste box next to it has no label either — only a placeholder, which
disappears the moment they start typing:

```
{ "tag": "TEXTAREA", "aria-label": null, "aria-labelledby": null,
  "labels": 0, "aria-describedby": null,
  "placeholder": "Paste your text here, or drop a file anywhere in this box." }
```

These two controls **are** the product. Accessibility was never started (G1), so this
is a first look rather than a pass — a real pass needs a screen reader, which this
audit did not have.

---

### 13. The credit chip in the top bar breaks onto two lines (KNOWN — 6e, confirmed not new)

Confirmed live at both desktop and phone width, signed in: the pill reads "35" on one
line and "credits" underneath. This is `LAUNCH-CHECKLIST` 6e, still open, now with
live evidence at both widths. It is the first thing a paying customer sees.

---

# WHAT PASSED — checked, not assumed

These were probed against the live site and were correct. They are here because a
clean result that nobody records gets re-investigated next month.

### The money boundary holds
A browser cannot move the price. Every tampered request still came back at $4.99:

```
honest starter   HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered price   HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered qty     HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered urls    HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
```
`price_cents`, `amount`, `unit_amount`, `currency`, `quantity: 1000`, `credits: 99999`,
`success_url` and `cancel_url` were all injected and all ignored. The returned address
is `checkout.stripe.com` every time. **No card form was opened and nothing was paid.**

### "A failed operation costs nothing" is true
Proven on the live ledger, on a run that really did fail:
```
id 1041    -10 spend            words_in= 9900   06:24:24Z
id 1072    +10 operation_refund words_in=    -   06:27:41Z
```

### The 10,000-word limit is real, fast and free
```
words in: 10064
HTTP 400 | WALL CLOCK 0.8 seconds
{"ok":false,"code":"too_many_words","message":"That is longer than 10,000 words,
 which is the most the rewrite can do in one go. Split it and run it in parts."}
balance after: 25   (unchanged)
```
Clear, honest, actionable, and it costs the customer nothing to find out.

### A Word document comes back as a valid Word document
A 3,000-word `.docx`, uploaded to the live site and the returned bytes opened:
```
zip integrity (None = ok): None
members: ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'docProps/core.xml']
words in output document.xml: 3000
actions: ["scrub docProps/core.xml field dc:creator",
          "scrub docProps/core.xml field cp:lastModifiedBy"]
```
Every one of the 3,000 words survived unchanged and the author name was removed. **A
corrupted document would be worse than an uncleaned one, and it is not corrupted.**

### Every API route refuses the methods it should

```
                         GET  OPTIONS  PUT  DELETE
/api/credits             200    204    405   405     (GET is correct — it is a read)
/api/checkout            405    204    405   405
/api/tool/scan           405    204    405   405
/api/tool/clean          405    204    405   405
/api/stripe/webhook      405    204    405   405
```

Nothing answers a method it has no business answering.

### The development pages are not exposed
`/dev/credits` and `/dev/states` both return `307` on the live site. A 404 page
returns a real 404 status. `GET /api/tool/scan` returns 405.

### The one claim the homepage sources, it sources correctly
`anthropic.com/news/claude-text-watermark` → HTTP 200.

### An impatient student cannot be charged twice

A completeness critic asked whether anyone had clicked anything twice in a browser.
Nobody had. Tested at phone width, signed in, tapping Sanitise twice:

```
150 ms after the first tap the button is:
   [{"text":"Rewriting","disabled":true,"pointerEvents":"none"}]
second tap: blocked — the element is not clickable
requests actually sent to /api/tool/clean: 1
```

**One request, one charge.** An agent found that two identical requests 120 ms apart are
both charged **at the API**, which is true — but the interface disables the button
before a second tap can land, so a real customer cannot reach it.

### And these, each with its evidence in its own section further down

- **Layer A detection: 15 planted invisible characters, 15 found.** The scanner works.
- **The metadata layer, end to end on a real C2PA block** — found, named, removed, and
  confirmed absent in the returned bytes, without either external tool being installed.
- **Six simultaneous jobs against one balance never overspent**, and the ledger summed
  to exactly zero.
- **The whole live ledger passes every integrity check** — no negative balances, no
  zero-delta rows, no duplicate payment intents.
- **A first visit sets no cookies at all**, which is what justifies having no consent
  banner.
- **Every internal link on the site works** — all ten.
- **Every page is fast**: a Vercel cache hit, brotli-compressed, under 250 ms.
- **Every redirect is a permanent 308** and every sitemap URL answers 200.
- **Canonicals and titles are correct on all nine pages.**
- **Six deliberately malformed files were refused cleanly and free of charge**, with a
  message that names the way out — including `.pdf`, which closes an open board item.
- **Almost everything the board lists as "awaiting deploy" is already live** — P1, P2,
  B7, B7a, W7 and D6, tested one at a time.

---

# WHAT WAS MEASURED — production numbers that did not exist before

`LAUNCH-CHECKLIST` B11 has been open since the start: every timing this project held
was taken on a laptop, with no network, no base64 and no cold start, against a
different model. These are the real ones, taken through https://un-claude.com.

| words in | result | wall clock | credits | what it cost us |
|---|---|---|---|---|
| 8 | rewrite skipped, text unchanged | ~1 s | 1 | $0 |
| 40 (`.txt`) | rewritten | ~1 s | 1 | — |
| 47 (paste) | rewritten | 3.1 s | 1 | $0.00045 |
| 730 | rewritten, 3 chunks | ~8 s | 1 | — |
| 2,553 | rewritten, 8 chunks, 1–3 retries | 14.3 s | 3 | $0.0094 |
| 3,000 (`.docx`) | metadata only, **no rewrite** | 0.8 s | 1 | $0 |
| 4,800 (`.txt`) | rewritten, 2 retries | 83.4 s | 5 | $0.0248 |
| 9,900 | **FAILED** | 198 s / 228 s | 0 (refunded) | — |
| 10,064 | refused, correctly | 0.8 s | 0 | $0 |

**The margin is healthy and nobody had the number.** 4,800 words cost $0.0248 to run
and sold for 5 credits — $2.50 at the Starter price, $1.25 at Pro. That is between
50 and 100 times cost.

**Time does not track length, it tracks retries.** 2,553 words took 14 seconds; 4,800
took 83. The difference is how many times the internal fact-check demanded another go.
So no promise about how long a document of a given size will take can be true.

**A Word document never gets the rewrite** — `layer_b_used: false`, confirmed twice
live. **And the interface says so properly, which I initially doubted and then went
and checked.** A 3,000-word `.docx` was uploaded through the real file picker on the
live site, and the panel reads:

```
Statistical watermark        NOT REWRITTEN
  A Word document is cleaned of its metadata and its hidden characters. Its
  wording is not rewritten, so a statistical mark in the writing itself would
  stay. Paste the text instead to have it rewritten.

Metadata                     2 REMOVED
  Stripped, and the file was re-read afterwards to confirm nothing was left.
  1615 bytes in, 1593 out.
  Removed - scrub docProps/core.xml field dc:creator
  Removed - scrub docProps/core.xml field cp:lastModifiedBy
```

It also correctly identified the file as Claude's: *"This file names Claude as its
maker, in a signed record anyone can read with a free tool."* **That is item B7 fixed,
deployed and working**, told plainly at the moment of the upload with the remedy
attached. It is the best-written thing in the product.

---
# WHAT THIS AUDIT COULD NOT COVER, AND WHY

A step that was skipped is a step that failed. These are the gaps, stated plainly.

### Live Stripe could not be read at all
The Stripe key on this laptop is a **test-mode** key. The live key exists only inside
Vercel, and the command to read it was **blocked by this machine's permission
system**. I did not work around it.

**What that means concretely.** Nothing below could be checked: which webhook events
are actually configured on the live Stripe endpoint; whether the live charge and
refund records match the ledger; whether a second partial refund on one payment
behaves; anything about disputes. Everything about Stripe in this note is either
observed **through un-claude.com itself** (which does use the live key) or read from
the ledger's own copies of the Stripe identifiers.

**This is the exact trap that produced the Radar failure on 22 August** — a feature
that works in test mode because Stripe gives paid features away there, and is absent
in live. Any Stripe conclusion drawn from this laptop is worthless. If Jon wants the
live reconciliation done, it needs either the live key made readable or a check run
by him from the Stripe dashboard.

### Nobody used a screen reader
Finding 12 is read from the live page's own markup and computed styles. It is
accurate as far as it goes and it is not an accessibility pass. Colour contrast,
focus order, announcement of the "Rewriting" state and everything that needs a real
assistive technology were **not** tested.

### The card form was never opened
By instruction, and correctly. The payment path was verified up to the point where
Stripe's page begins and no further. That leg was already proven with real money on
22 August and checked against the live ledger.

### The browser pane could not be given to the agents
The in-app browser is one shared window for the whole session, so fourteen agents
could not each drive it. Everything visual in this note was done by the conductor by
hand, plus phone-width rendering through the repo's own Chrome harness. The agents
worked from the served HTML, the JavaScript bundles and the live API.

### The divider defect could not be reproduced by the conductor
One agent found the tool's internal `---` divider line scattered through finished
documents — 7 of them in a 2,484-word essay, 14 in a 5,106-word one — and quoted the
bytes. **The mechanism is real and confirmed in the engine's source**: `\n\n---\n` is
the literal boundary between the instructions and the customer's text in the prompt,
so the model can copy it into its answer.

**I could not reproduce it in 13 live runs** across eight different shapes of input:
730, 2,553 and 4,800 words of ordinary prose; real essay prose; punctuation soup; a
document of bare headings; numbers only; and a plain control. Zero dividers, and zero
occurrences of the prompt's own language, in every one.

**THIS WAS LATER SETTLED — see the section "The prompt leak and the divider are the
same defect".** I was looking for it on the wrong kind of input. On odd input it appears
in **3 runs out of 7**, always alongside the model announcing that it has "rewritten
[the text] while strictly adhering to the provided rules". The two agents were right,
the mechanism is the `\n\n---\n` boundary in the prompt, and the divider and the prompt
leak are one defect rather than two. **This paragraph is left in place rather than
deleted, because "I could not reproduce it, therefore it may not be real" was the wrong
conclusion and it is worth seeing that in the record.**

**One thing that did turn up while chasing it, and is new.** An eighteen-word list of
ordinary nouns — `apple bicycle mountain window telephone garden ocean pencil...` — came
back `HTTP 400 layer_b_failed`. It is over the sixteen-word floor and it is not long.
**So length is not the only thing that makes the rewrite fail**, and a student pasting a
bibliography, a glossary or a list of terms may hit the same wall. That is worth a look
in whatever session takes finding 1.

---
# FOUND BY THE FLEET, THEN RE-RUN BY THE CONDUCTOR

Fourteen agents probed the live site. Three of their most serious findings were
re-run independently by hand, because a finding nobody probed twice is exactly this
project's characteristic failure. These three reproduced.

### A. If Cloudflare is blocked, the visitor is walked all the way to a dead end (MEDIUM)
*(I called this HIGH; the skeptics reproduced both halves and settled on MEDIUM, because
nothing measures how many visitors actually hit it. The dead end itself is not in doubt.)*

**What a student sees.** They paste an essay. The scan works. It tells them a
statistical watermark is presumed present and that they have 2 free credits. They
click Sanitise and get **"We could not start a session. Please try again."** They try
again. Same thing. Their wifi is fine.

**Reproduced by blocking `challenges.cloudflare.com` — which is what a pi-hole, a
privacy extension, or some campus and office networks do:**

```
--- AFTER CLICKING SANITISE ---
Sanitise it   1
Upload a file
We could not start a session. Please try again.
WHAT WE FOUND
Sanitise to remove it   2 free
Hidden characters      NONE FOUND
Statistical watermark  PRESUMED PRESENT
```

**Why it is worse than a plain outage.** The free scan still works, so the site looks
alive. The message blames the connection and suggests retrying, and retrying can
never work. And the hero says *"Free. No account needed"*, so the visitor cannot even
guess that signing up might help. Every step before the wall works perfectly, which
is what makes it expensive: they spend their attention and get nothing.

### B. The warning before an irreversible money-destroying click describes a different product (MEDIUM)
*(Originally written as "deleting an account destroys paid credits". The consequence
skeptic reframed it and improved it: losing your credits when you ask to delete your
account is the expected outcome and every service does it — that half is not a defect.
What survives, and is a defect, is the warning.)*

**The live text, from the settings page, word for word:**

> Danger Zone — Some actions cannot be undone. Please be careful.
> **Delete your Account**
> This will delete your account and **the accounts you own**. Furthermore, we will
> immediately **cancel any active subscriptions**. This action cannot be undone.

There are no "accounts you own" — there are no teams here. There are no
subscriptions; the pricing page says so in its own words: *"No subscription, no
monthly reset, nothing to cancel."*

**And it never mentions credits**, which is the only thing the customer actually
loses and the only thing they may have paid for. Deletion cascades — verified
independently: a throwaway account was funded, spent from, deleted, and its ledger
rows went with it.

**Also worth Jon's eye.** That whole page is untouched starter-kit boilerplate:
profile-picture upload, multi-factor authentication, name and email management —
features this product does not use and does not display anywhere. It is the one page
a paying customer opens to manage their money, and it does not mention money.

### C. A short paste tells the customer the rewrite happened (HIGH)

The agent found what finding 4 above missed: not only is the credit taken silently,
the screen **actively says the rewrite ran**. Its evidence: the panel reads
`Statistical watermark: Rewritten`, headed *"What the rewrite changed"* and labelled
*"Measured, not estimated"* — with `Replaced 0% of your wording`, `Length 100% kept`,
and every bar on the chart at 100%.

So the interface is not merely silent about the skipped rewrite. It reports it as
done, and puts the word "Measured" next to it.

---
### D. The page a visitor is served contains a menu and a footer, and nothing else (MEDIUM)

**Measured on the live homepage.** Strip out the `<script>` tags — which is what a
browser has on screen until half a megabyte of JavaScript has downloaded and run —
and this is the entire page:

```
bytes of <body> INCLUDING scripts : 131,261
bytes of <body> EXCLUDING scripts :   7,821
visible text outside <script>     :     373 chars

'Un - Claude  How it works  What we do  Our Mission  Pricing  Sign In  Sign Up
 Un - Claude  AI tools mark what they make, invisibly and without telling you.
 Un-Claude finds those marks and sanitises them.  © Copyright 2026 Un-Claude.
 All Rights Reserved.  Product ... Account ... Legal ...'
```

The headline, the paste box, the Scan button, the coverage panel and the counter are
**not in the page at all**. They are built by JavaScript after it arrives.

**How much JavaScript. 28 files, 494,734 bytes compressed on the wire.** The two
largest are 103 KB and 74 KB. On a good connection nobody notices. On a phone on
campus wifi the visitor sees a logo, a menu and a footer with an empty middle, and a
reasonable person concludes the site is broken and leaves.

**What this is NOT, said plainly so nobody chases it.** It is **not** an SEO problem.
Everything a search engine or a link preview reads from the page head is properly
server-rendered and correct — checked:

```
<title>Un-Claude · AI Watermark Remover</title>
<link rel="canonical" href="https://un-claude.com"/>
<meta name="description" ...>
og:title, og:description, og:url, og:site_name, og:image (1200x630), og:image:alt
twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image
```

And the preview image is real: `HTTP 200, image/png, 56,293 bytes, 1200 x 630`.

---
### E. Any file over about 3.2 MB fails, and the site's own size limit can never fire (HIGH)

**What a student sees.** They drag in a photo from their phone. It fails. Nothing
tells them the file is too big, or what size would work. They try again and it fails
again.

**The cliff, measured to the tenth of a megabyte on the live site:**

```
3.20 MB raw / 4.27 MB base64  ->  HTTP 200  OK
3.30 MB raw / 4.40 MB base64  ->  HTTP 413  Request Entity Too Large
3.40 MB raw / 4.54 MB base64  ->  HTTP 413  Request Entity Too Large
3.50 MB raw / 4.67 MB base64  ->  HTTP 413  Request Entity Too Large
5.00 MB raw / 6.67 MB base64  ->  HTTP 413  Request Entity Too Large
```

**The response is not from us. This is the whole body of it:**

```
Request Entity Too Large

FUNCTION_PAYLOAD_TOO_LARGE

sfo1::jv4rf-1787467141930-71f146a74fba
```

**Why that matters more than the limit itself.** The application has its own polite
message — *"That file is over the 5 MB limit. Try a smaller one."* — and **it can
never be shown to anybody.** It is set to trigger at 7,500,000 base64 characters,
about 5.5 MB. Vercel refuses the request at about 4.5 MB first, before our code runs
at all. So the guard is real, correct, well-worded, and unreachable.

And because Vercel's reply is plain text rather than the JSON the interface expects,
the workbench cannot read it and falls back to a generic failure.

**A file is turned into base64 to be sent, which makes it a third bigger.** That is
why a 3.3 MB photo becomes a 4.4 MB request. The site's limit is written in the wrong
units and in the wrong place.

**And the pricing page says: "One Word document or picture, any size."** A 4 MB photo
off a phone is an entirely ordinary thing to upload.

**Fix sketch.** Move the size check into the browser, before the upload is attempted,
and set it against the raw file size the user can actually see — about 3.2 MB — not
against the base64 length. Then the honest message becomes reachable and the pricing
copy can be made true.

---
### F. Six jobs fired at one account at the same time — the credits held (PASS)

`LAUNCH-CHECKLIST` G4 (concurrent-user stress) had never been run. Six simultaneous
sanitise requests were sent from one live account holding 10 credits, each job
costing 2. Five should succeed and one should be refused.

```
balance before: 10 | each job is 1140 words
  job 1: HTTP 200  ok charged=2 balance=8
  job 2: HTTP 402  insufficient_credits: This needs 2 credits and you have 0.
  job 3: HTTP 200  ok charged=2 balance=6
  job 4: HTTP 200  ok charged=2 balance=0
  job 5: HTTP 200  ok charged=2 balance=2
  job 6: HTTP 200  ok charged=2 balance=4

full ledger for this account:
   id 1319    +5 adjustment
   id 1320    +2 anon_grant
   id 1321    +3 signup_grant
   id 1325    -2 spend    words=1140
   id 1331    -2 spend    words=1140
   id 1332    -2 spend    words=1140
   id 1334    -2 spend    words=1140
   id 1336    -2 spend    words=1140
   SUM = 0   (never negative)
```

**Exactly five spends, one clean refusal, and the balance never went below zero.**
Nobody can spend credits they do not have by clicking fast or opening several tabs.
The atomic spend in the database does its job.

---
### G. Share any page and the preview shows the homepage (MEDIUM)

**What a student sees.** They send a friend the pricing link. The preview bubble in
the chat says *"Un-Claude · AI Watermark Remover"* with the front-page blurb about
scanning for watermarks. Nothing about prices. Every page they share looks the same.

**Checked on all nine live pages. Titles and canonicals are per-page and right. The
share tags are the homepage's, every time:**

```
/                    title Un-Claude · AI Watermark Remover   canonical https://un-claude.com
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/how-it-works        title How it works · Un-Claude           canonical .../how-it-works
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/pricing             title Pricing · Un-Claude                canonical .../pricing
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/capabilities        title What we do · Un-Claude             canonical .../capabilities
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/mission /contact /terms-of-service /privacy-policy /cookie-policy — all the same
```

**The pattern is worth naming, because it is the same mistake in two places and only
one was caught.** The canonical work (D6) got nine of nine right. The Open Graph tags
need exactly the same per-page treatment and never got it — the root value leaks down
onto every page, which is precisely what standing rule D14 warns about for canonicals.

**Why it costs money.** The pricing page is the one people share when recommending a
paid tool. Its preview says nothing about pricing.

---
### H. Two different credit counts on the same screen, photographed (KNOWN — 6d, confirmed not new)
*(The skeptics killed the agent's version of this as a restatement of a board item that
is already open, and they were right. It is kept here only because nobody had a picture
of it before, and a picture is worth having when the fix is scheduled.)*

`LAUNCH-CHECKLIST` 6d says the header credit count freezes at page load and does not
move when you spend. Reproduced live, and both wrong numbers are visible at once in a
single screen of text taken straight after a sanitise:

```
Your credits
7 credits          <-- the header, still showing the balance from page load
...
WHAT WE REMOVED
Read the result before you use it
6
left               <-- the workbench chip, showing the real balance
```

Seven at the top of the page, six in the middle, at the same instant, both about
money. The customer has no way to know which is real without navigating away and back.

**The chip below it also wraps onto two lines** — that is 6e, and it is visible in
the same capture: the number and the word "credits" land on separate lines.

### I. A Word document is told the picture is untouched (LOW)

In the same live capture, the metadata panel for a `.docx` reads:

> "Stripped, and the file was re-read afterwards to confirm nothing was left. 1615
> bytes in, 1593 out, **and the picture itself is untouched.**"

A Word document is not a picture. The sentence was written for images and is reused
for every file type. It is the only wrong note in an otherwise very well-written
panel.

---
### J. The ledger itself is sound — every integrity check passed (PASS)

Run against the whole live ledger, with this audit's own throwaway accounts excluded
so the numbers are the real product's:

```
LIVE LEDGER, excluding this audit's throwaway accounts
  rows                : 85
  distinct accounts   : 30
  rows by reason      : {"anon_grant":24, "spend":40, "operation_refund":3,
                         "signup_grant":8, "adjustment":8, "purchase":1,
                         "money_refund":1}
  accounts with a NEGATIVE balance : 0   (none)
  ledger rows with delta = 0       : 0   (the table forbids it)
  duplicate payment intents        : 0
```

Nobody is in credit they did not earn, nobody is in debt, and no payment has been
counted twice.

**The ledger is protected, and I have to be precise about how — my first draft was
not.** On a throwaway account a row was inserted, then changed and deleted. Both were
refused and the row survived untouched:

```
INSERT a row                -> HTTP 201, id 2531
UPDATE it (as service_role) -> HTTP 403  42501 "permission denied for table credit_ledger"
                               hint: "GRANT UPDATE ON public.credit_ledger TO service_role"
DELETE it                   -> HTTP 403  42501 "permission denied for table credit_ledger"
the row afterwards          -> [{"id":2531,"delta":1}]   unchanged
```

**Read the error, not the outcome.** `42501` is the *privilege* layer refusing, and the
hint says so — the role simply does not hold `UPDATE`. **The append-only trigger was
never reached, so nothing here proves it is installed in production.**

**Why the difference matters.** Privileges are one `GRANT` away from being gone, and a
migration or a session with admin access can issue one. The trigger is the layer that is
supposed to hold even then. **A completeness critic flagged exactly this** — that the
audit had proven a privilege refusal and written it up as a trigger — and it was right.
Confirming the trigger needs direct SQL against the database, which this session did not
have. **It remains unverified.**

### K. What losing the database would actually cost, as a number (context for E2)

`LAUNCH-CHECKLIST` E2 has been calling this a total loss of the money record and E2a
correctly softened it. Here is the real figure, today:

```
RECONSTRUCTIBLE FROM STRIPE if the database were lost :  1 row
NOT RECONSTRUCTIBLE (grants, spends, refunds, adjustments) : 84 rows across 30 accounts
```

**Only one purchase has ever been made, and it carries its Stripe payment intent, so
that one row could be rebuilt.** Everything else — who was granted what, who has spent
what — is only here.

**The honest reading: the stakes are small today and they only grow.** Thirty
accounts is a cheap thing to protect and a cheap thing to lose. Both of those stop
being true at the first hundred customers. This is the least painful moment this
decision will ever have.

---
### L. The only way to reach anybody is a mail app the visitor may not have (MEDIUM)

The contact page looks like a form — Subject, Your message, Send message — and it is
not one. There is no `<form>` tag on the page. The button opens the visitor's own mail
application with a draft. The page says so, honestly:

> "Or email unclaudeapp@gmail.com. **Nothing is sent from this page and nothing you
> type here is stored.** Your address is used to reply..."

**Where it breaks.** A student on a phone who reads mail through a browser rather than
a mail app taps Send message and nothing happens. They have typed out their problem
and it goes nowhere. This is `LAUNCH-CHECKLIST` E9, with the live consequence attached:
**this is the only support channel on a site that takes payments**, and it fails
silently for a plausible slice of the audience.

**One related thing for Jon, not a defect.** A customer who disputes a charge sees
`UN-CLAUDE.COM` on their card statement and is asked to write to a Gmail address. A
`support@un-claude.com` address costs nothing and answers that mismatch. A dispute
costs about $24.50 against a refund's ~$0.56, so anything that keeps a confused
customer emailing rather than calling their bank pays for itself immediately.

**Confirmed while I was there:** the refund policy really is discoverable — "refund"
appears 11 times on `/pricing` (including the small print, *"Unspent credits are
refundable for 30 days at the price you paid"*) and 20 times in the terms. C3 holds.

---
### M. "Upload a file and you get all three" — no file the tool accepts gets all three (HIGH)

Found by the copy agent, and it is the sharpest catch of the run because **this
project's own working agreement says it too**: *"Paste text and you get A and B.
Upload a file and you get all three."*

**Checked against my own live runs, file type by file type:**

| what you upload | invisible characters | metadata | the rewrite |
|---|---|---|---|
| `.txt` | yes | **nothing to remove — a text file has no wrapper** | yes |
| `.docx` | yes | yes | **no** — `layer_b_used: false`, confirmed twice |
| `.png` / `.jpg` | **no text to check** | yes | **no text to rewrite** |
| pasted text | yes | no file, so none | yes |

**There is no input that receives all three.** The live pricing page says *"Paste text
and you get the first and the third. Upload a file and you get all three."* A student
who uploads their essay as a Word file because the page told them uploading gets
everything pays a credit and never gets the rewrite — which is the layer they came for.

**The interface itself is honest about this** (see the panel quoted earlier: *"NOT
REWRITTEN ... Paste the text instead"*). The pages that sell the product are not.
The fix is copy, not code, and `CLAUDE.md`'s own summary table needs the same
correction.

**Three independent confirmations.** The copy agent and the legal agent found this
separately, and my own live `.docx` run measured it. The legal agent also found the
sentence on `/how-it-works`: *"Paste text and the first and third apply to you. Upload
a file and all three do."* — and noted that the same pricing page contradicts itself
four screens further down.

### N. The site promises a three-word ceiling and its own receipt reports six (HIGH)

**The live pages say, in three places:**

> `/how-it-works` heading: **"Three words in a row, maximum"**
> homepage FAQ: **"a hard three-word ceiling on surviving sequences"**
> the workbench: "Three words in a row is the most that survives"

**My own receipt, from a 2,553-word run on the live site earlier tonight:**

```
"longestRun": 6,
"runs": [{"length":3,...},{"length":4,...},{"length":5,...},{"length":6,...}]
```

The receipt the site puts on screen to prove the claim is the thing that disproves it.
A reader who checks — which is exactly the reader this site says it wants — finds the
number wrong on the same screen.

### O. "Nine classes of invisible character checked" — one of the nine finds nothing (MEDIUM)

**The claim, on two live pages and in the tool itself:**

> "Nine classes of invisible character checked on every scan. Each one is named, given
> its exact position, and the text is read back afterwards to confirm none remain.
> **You see the count.**"

**A sentence containing eleven Cyrillic lookalike letters hidden inside English
words — `rаpid`, `cоmmittee`, `repоrt`, `wаs`, `рublished` — scanned live:**

```
text contains 11 Cyrillic lookalike letters inside English words
suspicious_total : 0
hits             : []
classes the engine says it checks: strip, bidi, tag_chars, variation_selector,
                                   zwj_family, private_use, space, confusable, other_cf
```

`confusable` is on the engine's own list of nine and it found none of the eleven. The
workbench then tells the reader *"None in this text. 9 classes checked."*

**Why it is worth fixing rather than rewording.** Swapping Latin letters for
identical-looking Cyrillic ones is a real, widely used trick for slipping past text
matching. A student told their document is clean of all nine classes has been told
something the product did not check.

---
### P. The tool's own estimate says three minutes; the hero says seconds; the job then fails (adds to finding 1)

Captured live from the workbench with a 9,900-word paste in the box:

```
Sanitise it   10
9,900 words  =  10  ·  takes up to about 3 minutes
```

**The homepage, at the top of the same page:** *"We sanitise every kind of AI
watermark in seconds."*

So the product contradicts its own headline at the moment of the sale — which is the
honest half. The unhonest half is that **the job does not take about three minutes.
It takes three and a half and then fails** (198s and 228s, both times).

**The 402 is well done, and worth saying so.** When the same paste met an account
without enough credits, the screen read:

```
This needs 10 credits and you have 6. Scanning stays free and unlimited.
[ Get credits ]   [ Back to the scan ]
```

Exact numbers, a reassurance, and two ways forward. That is what every error message
in the product should look like — and it is the model for fixing findings 4 and E.

---
# WHAT TO DO, IN ORDER

Ranked by what protects a paying customer soonest, not by how hard it is. Re-ranked
after the completeness critics sent a second round of agents at the surfaces nobody had
opened — which is where four of the top five came from.

### Do these before anything else. They are all settings or single conditions.

**1. Fix the refund so it cannot take a different purchase's credits.** A customer who
buys, uses it, buys again and then asks for the first purchase back loses the second
purchase's credits. They paid, never used them, never asked. Clamp against what remains
of *that payment*, not against the account balance. **Real money, ordinary path, live
today.**

**2. Turn on Vercel Deployment Protection.** Four old deployment URLs run the paid
rewrite for anybody with no account and no charge, on your gateway key. No account means
no rate limit; no credit check means no spend cap. One switch closes all four and every
future one.

**3. Lock down the storage bucket, or delete it.** Any free account can upload any file
of any type and size to a public bucket served from your Supabase, and **deleting the
account does not delete the file** — which the privacy policy says it does. Nothing in
the product displays a profile picture, so removing the control and the bucket is the
cleaner answer.

**4. Stop free credits being mintable on repeat.** Delete the account, sign up again on
the same address, collect five more, forever — because the dedupe record lives on the
ledger and the deletion cascade takes it. Key it to something deletion does not touch.

### Then these, which are the product working wrongly rather than leaking.

**5. Strip the tool's own fingerprints out of the output.** Map em dashes back to the
customer's punctuation, restore straight apostrophes, remove markdown the input never
had. **The cheapest item here and close to the most valuable** — the product currently
adds the marks its audience uses to spot machine writing.

**6. Stop the rewrite touching anything inside quotation marks.** The only defect here
that can damage a student's academic record, and they cannot see it.

**7. Make the advertised size a size that finishes.** 6,000 words takes 196 seconds
against a 240-second cut-off; 7,500 and up fail. Fixing this also closes the retry burn,
where every failed attempt costs 6–21 cents and the error invites another one.

**8. Guard the output, not the prompt.** Reject any result that opens with a line about
rules or contains a bare `---` the input never had, and refund instead of returning it.
That closes the prompt leak and the stray divider in one string check.

**9. Do not charge for a rewrite that did not run — and stop the screen saying it did.**
Under 16 words, and for a single space, the customer pays and gets their text back while
the panel reports "Rewritten · Measured, not estimated" with 0% replaced.

**10. Close the open redirect.** One condition on `/auth/callback`.

**11. Move the file-size check into the browser at about 3.2 MB.** The polite message you
already wrote can never fire, because Vercel rejects the upload first.

### Then the words, which cost nothing but copy.

**12. Fix the claims that are checkable and wrong** — the four "enforced rather than
promised" FAQ promises (three fail against the product's own receipt), "upload a file and
you get all three", "a hard three-word ceiling", "100% of detectable marks removed",
"nine classes checked", "about four college essays", "in seconds".

**13. Put a link behind the news logos, or take them down.**

**14. Give the auth pages real error messages.** Three different failures — a blocked
captcha, an unconfirmed email, everything else — all say "please ensure you have a
working internet connection". Two cases and a **Resend it** button.

**15. Rewrite the account-deletion warning.** It names teams and subscriptions that do
not exist and never mentions credits.

### Then the rest.

**16. Mint the free credits at signup**, so a new customer's wallet does not say "0
credits · Get credits" the first time they open it.

**17. Point the confirmation email at your own domain**, add MX records and a real
support address. One DNS change and one Supabase setting close three things at once.

**18. Give every page its own share tags** — nine pages, one line each.

**19. Screen readers: `role="status"` on the working/finished/failed line, a name on the
paste box and the file input, a `<main>` landmark and a skip link.** Then spend ten
minutes with VoiceOver before rebuilding anything bigger.

**20. The numbers about money that are wrong on screen** — the frozen header count, UTC
dates in the credit history, and a receipt that can report "Length 4000% of the original
kept" under the words "Measured, not estimated".

**21. Record what a run costs.** The column exists, the engine returns the figure, the
privacy policy already promises it is stored, and nothing writes it.

**22. Schedule the ledger backup while it is still 84 rows and 30 accounts.**

---

# THE SIZE CEILING, SETTLED — the board's longest-open question

`LAUNCH-CHECKLIST` B3 set an "honest limit at 10,000 words" and B11 recorded that
nothing had ever been measured on production. Both are now answered. Every row below
was run through https://un-claude.com against a funded account with the developer
credit bypass off.

| words in | result | wall clock | retries | words back | charged | cost to us |
|---|---|---|---|---|---|---|
| 730 | ok | ~8 s | 0 | 670–760 | 1 | — |
| 2,553 | ok | 14.3 s | 1–3 | 2,698–2,833 | 3 | $0.0094 |
| 4,800 | ok | 83.4 s | 2 | 3,398 | 5 | $0.0248 |
| **6,000** | **ok** | **196.3 s** | **4** | **4,670** | 6 | $0.0562 |
| **7,500** | **FAILED** | **192.9 s** | — | — | 0, refunded | — |
| **8,500** | **FAILED** | **197.7 s** | — | — | 0, refunded | — |
| **9,900** | **FAILED** | **198 s / 227.8 s** | — | — | 0, refunded | — |
| 10,064 | refused, correctly | 0.8 s | — | — | 0 | $0 |

**The real ceiling is between 6,000 and 7,500 words. The site advertises 10,000.**

**Every failure gave the money back, and the ledger proves it four separate times:**

```
    -6 spend              words=6000        (succeeded, kept)
    -8 spend              words=7500
    +8 operation_refund
    -9 spend              words=8500
    +9 operation_refund
```

**The failures all land between 192 and 198 seconds**, whether the document is 7,500
words or 9,900. That is the signature of a fixed internal cut-off, not of a job that
grows too big — which matters, because it means the fix is not "make it faster for
long documents", it is "stop starting jobs that cannot finish inside the window, and
say so up front".

**And 6,000 is not a comfortable pass.** 196 seconds against a 240-second cut-off,
reached only after four retries. Whether a 6,000-word document works depends on how
many times the internal fact-check happens to demand another attempt, which is not
something a customer can predict and not something the page can promise.

**This is why the timings could not be extrapolated from the laptop.** The local
measurement was 10,464 words in 78.7 seconds. On production the same size does not
finish at all. Nothing about that gap is mysterious — network, base64, cold start and
a different model — but it is the concrete reason B11 mattered.

**A cost figure Jon has never had.** 6,000 words cost **5.6 cents** to run and sold
for 6 credits — $3.00 at the Starter price, $1.50 at Pro. Even at the worst pack
price that is a 27x margin, and the retries are already in the number.

---
# LAYER A, TESTED PROPERLY — the one layer that can be proved

Fifteen different invisible characters, one from each family the engine names, planted
in ordinary prose and put through the live site.

**Detection: fifteen out of fifteen. Nothing was missed.**

```
PLANTED: 15 distinct invisible characters
SCAN FOUND: suspicious_total = 15
   U+00A0 NO-BREAK SPACE          U+061C ARABIC LETTER MARK    U+180E MONGOLIAN VOWEL SEP
   U+2009 THIN SPACE              U+200B ZERO WIDTH SPACE      U+200C ZERO WIDTH NON-JOINER
   U+200D ZERO WIDTH JOINER       U+200E LEFT-TO-RIGHT MARK    U+200F RIGHT-TO-LEFT MARK
   U+202F NARROW NO-BREAK SPACE   U+2060 WORD JOINER           U+E000 PRIVATE USE
   U+FE0F VARIATION SELECTOR-16   U+FEFF ZERO WIDTH NBSP       U+E0041 TAG LATIN CAPITAL A

PLANTED BUT NOT REPORTED BY THE SCAN: (none)
```

**That is a genuine, countable pass and it deserves saying plainly: the scanner
works.** This is the layer the product can prove, and it proved it.

**Removal: twelve of the fifteen. Three are left behind on purpose.**

```
removed_count: 9 | replaced_count: 3
STILL PRESENT IN THE CLEANED TEXT: U+200E LRM, U+200F RLM, U+061C ARABIC LETTER MARK
RE-SCAN of the cleaned text: suspicious_total = 3   hits: ["U+061C","U+200E","U+200F"]
```

**And leaving them is the right call.** The engine says so in its own note, which the
scan returns on every run:

> "Load-bearing invisibles are preserved by default during cleaning: ... RTL
> directional marks/paired embeddings, and orthographic Arabic/Syriac Cf marks.
> **Inspection still reports bidi controls.**"

Those three characters carry meaning in Arabic and Hebrew. Stripping them would
corrupt a real document. **The engineering is correct.**

### The problem is that two sentences on the live site say otherwise (MEDIUM)

> Homepage hero: **"100% of detectable marks removed"**
> `/capabilities`: "Nine classes of invisible character checked on every scan. Each
> one is named, given its exact position, and **the text is read back afterwards to
> confirm none remain.** You see the count."

The tool detected 15 and removed 12. Read the text back and 3 remain. **Any curious
visitor can disprove both sentences in about ten seconds** — scan, clean, scan again —
and this is a site whose entire argument is that its claims survive checking.

**The fix is a sentence, not a change to the engine.** Something like "every mark that
can be safely removed, and we show you the ones we deliberately keep and why" is both
true and a better sales line, because it demonstrates the care rather than asserting a
round number.

---
### The plumbing under the site is correct (PASS)

```
http://un-claude.com/          308 -> https://un-claude.com/
https://www.un-claude.com/     308 -> https://un-claude.com/
http://www.un-claude.com/      308 -> https://www.un-claude.com/   (then to the apex)

robots.txt:  User-Agent: *  /  Allow: /  /  Sitemap: https://un-claude.com/sitemap.xml

every URL in the sitemap, fetched:
  /  200   /how-it-works 200   /capabilities 200   /mission 200   /contact 200
  /pricing 200   /cookie-policy 200   /terms-of-service 200   /privacy-policy 200
```

Every redirect is a permanent 308, the sitemap is complete and every address in it
answers. Nothing here is broken.

**One gap worth a line of robots.txt:** `Allow: /` with no exclusions means the
sign-in, sign-up, password-reset and account pages are open to search engines. Nobody
is harmed, but a stranger searching for the product can land on a bare "Update
Password" screen, and one of those pages carries the homepage's own title, so two
pages claim to be "Un-Claude · AI Watermark Remover".

---
# THE ECONOMICS, MEASURED — numbers Jon has never had

Every figure here is the `cost_usd` the AI Gateway itself reported on live runs, not
arithmetic on a token count.

### The cost per credit is not flat, and I nearly reported it as though it were

```
 2,553 words   $0.0094   ->  0.37 cents per 1,000 words
 4,800 words   $0.0248   ->  0.52 cents per 1,000 words
 6,000 words   $0.0562   ->  0.94 cents per 1,000 words
```

**A credit sells for the same price whatever the document, and costs us two and a half
times more at the top of the working range than at the bottom.** The reason is the same
one behind finding 1: the fact guard demands retries, and the bigger the document the
more of them it demands.

**This note first quoted the 0.37 figure as "roughly the cost per credit". That was
wrong in exactly the way `LAUNCH-CHECKLIST` B3 already records ENGINE.md being wrong** —
*"'~0.06 typical' was a best case read as a typical"*. It is corrected here rather than
quietly, because making the same recorded mistake twice is worth a line.

### What a credit costs against what it sells for

| pack | price per credit | margin on small jobs | margin on 6,000-word jobs |
|---|---|---|---|
| Starter $4.99 / 10 | 50¢ | 136x | **53x** |
| Plus $9.99 / 25 | 40¢ | 109x | **43x** |
| Pro $24.99 / 100 | 25¢ | 68x | **27x** |

**The pricing is comfortable and it is not close.** Even the worst cell in that table —
the cheapest pack against the dearest work — returns twenty-seven times what the job
costs, with retries already inside the number. **Nothing here argues for raising
prices.** What it does argue is that the retry behaviour is the single lever that moves
the cost, and finding 1 is about that same lever.

### What the free tier costs

- an anonymous visitor: 2 credits ≈ 2,000 words ≈ **1 to 2 cents**
- a signed-up account: 5 credits ≈ 5,000 words ≈ **2 to 5 cents**

**A hundred strangers cost a pound or two, and a hundred signups a few pounds more.**
That is a cheap trial, and it means the free tier is not a leak worth engineering
against — including the forged-guest-cookie item (E13) that was deliberately left open.
**The worst that hole gives away is one or two cents at a time**, which is the missing
number that makes leaving it open obviously right rather than a gamble.

### And a failed job costs more than a successful one

A 7,500-word attempt that fails after 198 seconds does most of the work of a 6,000-word
attempt that succeeds, and hands back nothing. See the section on retry burn: somewhere
between 6 and 21 cents, charged to Jon, free to the customer, with "Please try again"
underneath it.

### The caveat that keeps this table honest

These figures are `mistral/mistral-medium` at today's gateway prices. **The model has
already changed once** — `mistral-small` to `mistral-medium` — and that change made the
prompt-leak defect three times worse. If it changes again every number here changes with
it, and **nothing in the product records what a job cost**: the ledger's `cost_usd`
column is empty on every row, which is why this table had to be built by hand.

---

### Q. The privacy policy describes a record the database does not keep (LOW)

**The live privacy policy:**

> "Each time you clean something, one line is added to your credit history. It records
> the date and time, whether the input was a file or pasted text, how many words it
> contained, and how many credits it cost, **along with what the run cost us to
> perform.**"

**The live database:** the `cost_usd` column is empty on every spend row that exists.
Words, credits, input kind and timing are all recorded faithfully. What the run cost
is not recorded at all.

**Nobody is harmed** — the policy claims we store *more* than we do, which is the safe
direction. **But it is the reason the economics table earlier in this note had to be
assembled by hand from live runs**, and the reason it will go stale the next time the
model changes. One column, already in the schema, already populated in the engine's
own response, and nothing writes it.

---
# THE METADATA LAYER, TESTED END TO END — and it works (PASS)

This is the other layer the product can prove, and it had never been checked on
production against a real content-credential block.

**A JPEG was built carrying a C2PA block the way a real AI-generated image carries
one** — an APP11/JUMBF segment with the `c2pa` identifier and a claim generator
naming Claude — plus an ordinary EXIF block.

**The live scan found it:**

```
{
 "format": "jpeg",
 "has_c2pa": true,
 "has_ai_metadata": true,
 "findings": [
  "JPEG APP11 segment (JUMBF/C2PA common)",
  "JPEG APP11: c2pa, C2PA, Claude, c2pa, C2PA, jumb, JUMB"
 ],
 "findings_confidence": ["confirmed", "probable"],
 "tools": { "c2patool": {"available": false}, "exiftool": {"available": false} }
}
```

**The live clean removed it, and said exactly what it did:**

```
"actions": ["drop APP11 (C2PA/JUMBF)", "drop APP1", "copied remainder after non-marker byte"],
"bytes_in": 1083915, "bytes_out": 1083711,
"still_has_c2pa": false, "still_has_ai_metadata": false, "post_findings": []
```

**Checked independently against the returned bytes, not taken on report:**

```
before:  segments [APP11, APP0, APP1]   c2pa: yes   jumb: yes   claim_generator: yes   "Claude": yes
after:   segments [APP0]                c2pa: NO    jumb: NO    claim_generator: NO    "Claude": NO
```

**Every trace gone, and the picture itself untouched.** A plain EXIF-only JPEG was
tested the same way and its whole EXIF block was removed while the image data stayed
byte-identical.

**One thing that looked alarming and is not.** The scan reports
`c2patool: available: false` and `exiftool: available: false` — neither external tool
is installed on the production function. **That does not matter**: the engine does its
own byte-level scan of the file's segments and, as shown above, both finds and removes
the content credentials without them. I chased this expecting the metadata layer to be
dead in production and it is not. Worth writing down so nobody else chases it.

---
# THE AGENTS' OTHER FINDINGS, WITH THEIR CURRENT VERDICTS

**Read this differently from the rest of the note.** Everything above was reproduced by
hand. What follows is the agents' remaining findings — the ones I did not personally
re-run — with the state of their skeptic panels beside each.

**How to read the "skeptics" column:**

- **"stands (3 skeptics)"** — three independent agents tried to refute it, one of them
  by re-running the reproduction command against the live site, and fewer than two
  succeeded. **This is strong.** Treat it as verified.
- **"1 of 3 checked" / "2 of 3 checked"** — partially judged when the run ended.
- **"not yet judged"** — **nobody has checked it. A lead, not a verdict.** These are
  worth reading and worth following up; they are not worth acting on until checked.

**Findings a majority of skeptics killed are not in this table** — they are in the
section below on what died and why.

| severity | finding | dimension | skeptics | on the board |
|---|---|---|---|---|
| **high** | A short paste is charged a credit and told its wording was rewritten, when the rewrite was deliberat... | 5 | stands (3 skeptics) | P2 |
| **high** | After a scan, the whole text panel becomes one button — a blind student cannot read their own result | 10 | **not yet judged** | — |
| **high** | An ordinary phone photo is refused by the hosting platform, and the site blames itself by saying the... | 5 | stands (3 skeptics) | — |
| **high** | If you refund someone who has deleted their account, the site rejects the refund message from Stripe... | 1 | stands (3 skeptics) | — |
| **high** | Nothing is announced while the tool is working, when it finishes, or when it fails | 10 | **not yet judged** | — |
| **high** | Short or odd pastes still come back as a chatbot talking about "the given rules" instead of the cust... | D4 | stands (3 skeptics) | P1 |
| **high** | The file picker has no name at all, and it is an invisible extra stop when you tab through the page | 10 | **not yet judged** | — |
| **high** | The homepage sends an empty page. Everything except the top menu and the footer is drawn by JavaScri... | 5 | stands (3 skeptics) | — |
| **high** | The pricing calculator quotes a pack for documents the tool refuses to run | 12 | **not yet judged** | — |
| **high** | When Cloudflare's invisible check fails, the visitor is dead-ended at the Sanitise button and cannot... | 12 | **not yet judged** | — |
| **medium** | A 5,000-word essay failed outright on the first live attempt, then worked on the second | 5 | **not yet judged** | B11 |
| **medium** | A Cloudflare bot challenge runs on every page of the site, including the privacy policy, for visitor... | 11 | **not yet judged** | — |
| **medium** | A returning customer on a phone has to scroll four and a half screens to find Sign In | 12 | **not yet judged** | — |
| **medium** | Choosing a pack and then signing up loses the pack you chose | 12 | **not yet judged** | — |
| **medium** | Clicking an expired or already-opened confirmation email drops you on the homepage and says nothing ... | 12 | **not yet judged** | — |
| **medium** | Every rewrite tells the customer's browser exactly what the job cost us, which model ran it, and how... | 2 | stands (3 skeptics) | — |
| **medium** | HYPOTHESIS, not confirmed: every free scan may write the visitor's raw IP address into our own datab... | 8 | **not yet judged** | — |
| **medium** | Looking up a signed-in customer's credit balance takes about three quarters of a second, and it happ... | 11 | **not yet judged** | — |
| **medium** | No page has a 'main content' region and no page has a skip link | 10 | **not yet judged** | — |
| **medium** | On the pricing page, the 'Most popular' card is the hardest one to read — including the number of wo... | 10 | **not yet judged** | — |
| **medium** | Plain text files are missing from every list of what you can upload, and they are the one upload cha... | 7 | 1 of 3 checked | — |
| **medium** | PostHog treats every single page load as a brand-new stranger, and the site pays 111 KB a page for it | 11 | **not yet judged** | — |
| **medium** | Production has never recorded what a single run cost — 155 money rows, every cost column empty | D4 | stands (3 skeptics) | — |
| **medium** | The Starter pack says it covers about four college essays. By the site's own calculator it covers th... | 7 | 1 of 3 checked | — |
| **medium** | The essay you pasted is thrown away when the site sends you off to sign up | 12 | **not yet judged** | H1 |
| **medium** | The homepage answers "Will it change my meaning, my facts, or my numbers?" with a flat No, on the on... | 7 | 1 of 3 checked | — |
| **medium** | The homepage is the only page on the site that arrives empty — every other page arrives with its wor... | 11 | **not yet judged** | — |
| **medium** | The homepage never once uses the word 'credit', and the label beside the free balance says the oppos... | 12 | **not yet judged** | — |
| **medium** | The ledger records what every job earned but never what it cost, so nothing can tell whether a job m... | 2 | stands (3 skeptics) | — |
| **medium** | The paste box has no label of its own — the grey placeholder is doing that job — and it removes its ... | 10 | **not yet judged** | — |
| **medium** | The receipt shows impossible figures — "Length 4000% of the original kept" — under a heading that sa... | D4 | stands (3 skeptics) | — |
| **medium** | The tool is not in the page the server sends: a phone gets a header, a blank gap and a footer until ... | 12 | **not yet judged** | — |
| **medium** | The tool's own colours are too faint to read: the Sanitise button, the result rows and the error mes... | 10 | **not yet judged** | — |
| **medium** | When the tool refuses your file, the message is just text floating on the page, not attached to anyt... | 10 | **not yet judged** | — |
| **low** | A heading says every major lab has signed up. The table an inch to the right says one has not. | 7 | 1 of 3 checked | — |
| **low** | An FAQ asks about PDFs and never answers, and never mentions images, which the tool has always accep... | 7 | 1 of 3 checked | 6c |
| **low** | Every logo on the page asks the server 'has this changed?' on every single repeat visit — sixteen times | 11 | **not yet judged** | — |
| **low** | Four pages have no top-level heading, one has two, and the settings page has none at all | 10 | **not yet judged** | — |
| **low** | If copying the clean text fails, the button does nothing at all and never says why | 5 | **not yet judged** | — |
| **low** | Live evidence suggests the P1 prompt-leak fix is ALREADY deployed, though the checklist says it is not | Security | **not yet judged** | P1 |
| **low** | On the fast path, the engine does 0.05 seconds of work and the customer waits 1.3 seconds — the wait... | 11 | **not yet judged** | B11 |
| **low** | One shape of confirmation link returns a completely blank white page | 12 | **not yet judged** | — |
| **low** | Signing out on one device signs you out of every device, with no warning | 3 | stands (3 skeptics) | — |
| **low** | Six sign-in and account pages are open to Google with no address of their own, and two of them wear ... | 9 | **not yet judged** | — |
| **low** | The cookie policy says exactly three things are stored on your device. A signed-in customer who coll... | 8 | **not yet judged** | — |
| **low** | The page waits until it is nearly a second in before it even starts shaking hands with Cloudflare an... | 11 | **not yet judged** | — |
| **low** | The pricing page's search-result summary is two characters over the length Google shows | 9 | **not yet judged** | — |
| **low** | The rewrite response tells any caller which AI model, gateway, temperature and prompt size it uses | Security | **not yet judged** | — |
| **low** | The single largest file the site downloads is the Supabase login library, and it carries a live-upda... | 11 | **not yet judged** | — |
| **low** | The site has no structured data in the pages it serves, and the one piece that was written never get... | 9 | **not yet judged** | D12 |
| **low** | The site has no web app manifest, so saving it to a phone home screen gives a generic tile | 9 | **not yet judged** | — |


### The three worth reading first

1. **"Short or odd pastes still come back as a chatbot talking about 'the given
   rules'"** — this **stands with all three skeptics**, and it means the P1 prompt leak
   is not fully closed. **I tried to reproduce it myself and could not**, across
   punctuation soup, bare noun lists, heading-only documents and numbers-only input.
   Three skeptics reproduced it, I failed thirteen times. It is intermittent and real,
   and it is the same defect family as the `---` divider. **Do not treat P1 as done.**
2. **"If you refund someone who has deleted their account, the site rejects the refund
   message from Stripe over and over"** — stands with three skeptics, and it touches
   money.
3. **"The pricing calculator quotes a pack for documents the tool refuses to run"** —
   not yet judged, and it is the same ordering problem I found from the other end: the
   calculator goes to 100,000 words while the engine stops at 10,000 and in practice
   fails above about 7,000.

# THE FOUR ENFORCEMENT PROMISES, MEASURED AGAINST MY OWN LIVE RUNS (HIGH)

The homepage FAQ makes four specific, checkable promises about the rewrite. They are
not marketing adjectives — they are engineering claims, stated as enforced. **They are
also inside the page's FAQPage structured data**, which is the text Google may show
directly in a search result.

**Promise 1, live, verbatim:**

> **"Will it change my meaning, my facts, or my numbers?"**
> "**No, and this is enforced rather than promised.** Every number, date and name is
> checked against your original and the section retries if one drifts. **Length is
> held within a tenth**, and the receipt shows the figures carried through."

**Promise 2, live, verbatim:**

> "Ours is a purpose-built engine, not a prompt: **a hard three-word ceiling on
> surviving sequences** ... every number, date and name checked against your original
> with a retry if one drifts, and length held within a tenth. Across our test set it
> **breaks over 90% of three-word sequences with zero figures lost**."

**What I measured on the live site tonight:**

| the promise | what happened |
|---|---|
| "it will not change my facts" | **A quotation attributed to a named person came back with different words inside the quotation marks. Three runs out of three.** A quotation is a fact about what someone said. |
| "every number ... checked" | **One of ten mentions of the year 1974 was dropped.** The engine's own receipt said 53 figures in, 47 kept, and its "figures to check" list was empty. |
| "length is held within a tenth" | **Broken in both directions and by a wide margin.** 2,553 → 2,833 words is +11.0%. 4,800 → 3,398 is −29%. 6,000 → 4,670 is −22%. |
| "a hard three-word ceiling" | **My own receipt from a live run printed `"longestRun": 6`.** |

**Why this cluster matters more than any single item in it.** "Enforced rather than
promised" is the strongest sentence on the site, and it is the one a careful reader
will believe. It is also the one they can check, because the product hands them the
receipt to check it with. Three of the four promises fail against that same receipt.

**And it is the one part of the copy that is not fixable by rewording alone.** "Length
is held within a tenth" can be softened. "It will not change your facts" cannot be
softened into something that is both true and worth saying — a student needs their
quotations and figures intact, and today they are not guaranteed to be. **That is the
engine work, and it is the same work as finding 2.**

---
# THE DOMAIN, THE MAIL AND THE CERTIFICATE

```
A record        un-claude.com -> 76.76.21.21   (Vercel)
MX              (none at all)
SPF at the root (none)
DMARC           v=DMARC1; p=reject;            (no rua= reporting address)
DKIM            resend selector present
TLS             Let's Encrypt, 18 Aug 2026 -> 16 Nov 2026, auto-renewing
```

**The certificate is healthy** and renews itself. Nothing to do.

**DMARC is set to `p=reject`, which is the strict setting and the right one.** With no
`rua=` address nobody ever sees the reports, which is `LAUNCH-CHECKLIST` E7 and is
confirmed here. E8 (no SPF at the root) is confirmed too; DKIM carries alignment, so
outbound mail still authenticates.

**The one worth acting on: the domain cannot receive email at all.** There are no MX
records. That means:

- `support@un-claude.com`, which is the address a confused customer will guess, does
  not exist and never bounces into anyone's inbox.
- The DMARC reporting address in E7 has nowhere to point until this changes.
- It is why the contact page is a `mailto:` to a Gmail address (finding L), and why a
  customer who disputes a charge sees `UN-CLAUDE.COM` on their statement and is asked
  to write to a personal-looking Gmail account.

**This is one DNS change and it closes three items at once** — a real support address,
a home for the DMARC reports, and the trust mismatch at the moment a customer is
deciding between emailing you and calling their bank. A dispute costs about $24.50; a
refund costs about $0.56.

---
# THE CONNECTION-DROP CASE — charged, and not refunded (MEDIUM)

Nobody had tested what happens when the customer's connection dies mid-job. It is the
student on a train, the phone that locks, the tab closed by accident. **With jobs
running for minutes, that window is wide.**

**Run live: a 2,553-word paste, connection dropped by the client at 6 seconds.**

```
balance before: 58
>>> connection dropped by the client at 6s (the train goes into a tunnel)
client saw: AbortError - This operation was aborted
balance immediately after the drop: 55        <- 3 credits taken
```

**Then watched for eight minutes.** For reference, the two genuine server-side failures
earlier that night were refunded after 3 minutes 11 seconds and 3 minutes 16 seconds,
so the window was known:

```
  +1 min: refunds after row 1630: none
  +2 min: none
  ...
  +8 min: none

CONCLUSION: no refund after 8 minutes. The credit was kept.
```

The ledger shows `id 1630, -3 spend, words=2553` with no matching `operation_refund`,
while every server-side failure that night has one.

**This is not a coding mistake, and saying so matters.** The credit is spent up front,
the engine does the work, and the answer is delivered to a browser that is no longer
there. From the server's point of view the operation succeeded. From the customer's
point of view they paid and got nothing, and the pricing page says *"A failed run costs
nothing. The credits go straight back to your balance."*

**It compounds the size problem.** A job that takes three minutes has three minutes in
which a phone can lock or a train can enter a tunnel. Shortening the jobs (finding 1)
shrinks this one too.

---
# ACCESSIBILITY — never started, and now opened (G1)

The accessibility agent did the fullest pass, and it was scrupulous about what it
could not see: no browser, no screen reader, no zoom testing. What follows is what I
re-ran and confirmed myself, plus its strongest finding.

### No page has a main landmark and no page has a skip link (MEDIUM)

**Checked on ten live pages. Not one has any of them:**

```
/                      <main>=0  role=main=0  skip-link=0  <h1>=0
/pricing               <main>=0  role=main=0  skip-link=0  <h1>=1
/how-it-works          <main>=0  role=main=0  skip-link=0  <h1>=1
/capabilities          <main>=0  role=main=0  skip-link=0  <h1>=1
/mission               <main>=0  role=main=0  skip-link=0  <h1>=1
/contact               <main>=0  role=main=0  skip-link=0  <h1>=1
/terms-of-service      <main>=0  role=main=0  skip-link=0  <h1>=1
/privacy-policy        <main>=0  role=main=0  skip-link=0  <h1>=1
/cookie-policy         <main>=0  role=main=0  skip-link=0  <h1>=1
/auth/sign-in          <main>=0  role=main=0  skip-link=0  <h1>=0
```

Every visit, on every page, a screen-reader user walks past the logo, four menu links
and two buttons before reaching anything they came for, with no way to jump.

**The homepage has no `<h1>` in the page it serves** — a consequence of everything
being drawn by JavaScript (section D), not a separate defect.

### After a scan, the result is wrapped in a button — but the strongest version of this did not survive checking (UNRESOLVED)

**The agent's finding, and it was the sharpest one it made:** once a scan completes the
whole text panel is wrapped in `role="button"`, `tabIndex 0`, `aria-label="Edit this
text"`. Under the ARIA rule for presentational children, everything inside a button
collapses into its label — so a screen reader would announce *"Edit this text, button"*
and never read the essay, the findings, or the cleaned result. **A blind student would
have paid for something they cannot hear.**

**The markup is exactly as described** — I confirmed the wrapper in the browser's own
tree, where the region reads `textbox` before the scan and `button "Edit this text"`
after it.

**But I then pulled Chrome's full computed accessibility tree over CDP, which is what
assistive technology actually consumes, and it does not support the strongest reading:**

```
the customer's own sentence is still present in the tree : true
   InlineTextBox "The committee reviewed the proposal carefully and agreed that further "
   InlineTextBox "warranted before any decision."
a textbox role still exists                              : true
an "Edit this text" button exists                        : true
a live region (status/alert) exists somewhere            : true
```

**So the customer's text is not stripped out of the tree.**

**What I can honestly say, and no more.** The wrapper is real and it is an odd thing to
do to a block of the customer's own writing. Whether a screen reader flattens it in
practice is **not settled by the computed tree either way**, because a text node being
present is not the same as a screen reader announcing it as prose. **This needs ten
minutes with VoiceOver and nobody has done it.**

**It is recorded this way deliberately.** The agent reasoned from the ARIA specification
and the markup, which is exactly the source-over-reality shape this audit exists to
catch — and it turned up inside the audit's own findings. The honest verdict is
unresolved, not high.

### Very little announces that the tool is working, has finished, or has failed (MEDIUM)

The served homepage contains **one** `aria-live` region, and the computed tree confirms
a live region exists — **so the agent's "zero live regions" was wrong, and it is
corrected here.** What is true is that the status line carrying "Rewriting", "Sanitised"
and every error message is a plain paragraph with no `role="status"` and nothing
pointing at it. A sighted user watches the button change for up to three minutes;
whether a screen reader user hears anything at the moments that matter is, again, **a
ten-minute check with VoiceOver that nobody has done.**

### The colours on the part that takes the money are the hardest to read (MEDIUM)

Measured from the live stylesheet's own tokens: the muted grey used for the scan
results (`#6A6963` on `#FAF9F5`), the white label on the orange Sanitise button
(`--mark #D97756`), and the pale white numbers on the "Most popular" pricing card all
fall below the readable minimum. **The card you most want a customer to read is the
one they can read least**, including "25,000 words" and "40¢ a credit" — the two
numbers they use to choose a pack.

### What nobody did, and it should be said plainly

No screen reader was run. No zoom or reflow testing at 320px or 400%. No keyboard tab
order was walked in a real browser. No axe-core, no Lighthouse. **This is a first look
that found real things, not an accessibility pass**, and G1 should still be treated as
open.

---
# THE REFUND TOOL TELLS JON TO REFUND MONEY THAT IS ALREADY REFUNDED (HIGH)

`CURRENT-HANDOFF.md` tells Jon to run `stripe-refund-check.mjs` **before refunding
anyone**, and the webhook route points at it too. It is the one thing standing between
him and a mistake with real money.

**Run tonight against the only real purchase the site has ever taken — the $4.99 pack
that was bought and then fully refunded on 22 August:**

```
ACCOUNT          3c559e2e-0b73-4bd8-8c7c-5daebd0248ce
PAYMENT          pi_3U74cIHwIcwEXjEP0HaPlfow
PURCHASED        10 credits for $4.99
                 2026-08-22  (1 days ago)

BALANCE NOW      1 credits
SPENT (lifetime) 2 credits
ALREADY REFUNDED 10 credits

>> REFUNDABLE    1 of 10 credits
>> THAT IS       $0.50 of $4.99
...
Refund in the Stripe dashboard.
```

**It prints "ALREADY REFUNDED 10 credits" and then, four lines later, tells him to
refund another 50 cents.**

**Two separate errors, both confirmed:** the already-refunded figure is calculated and
displayed but never subtracted from the refundable one; and the balance it works from
includes free grant credits, so the 1 credit it is offering to refund is a **signup
gift the customer never paid for**.

**Fifty cents today.** But this is a decision aid on the path where money leaves, it
will be run before every refund from now on, and it is wrong in the direction of
paying out too much. It was found by the money agent, re-run by the reproduction
skeptic against the live database, and re-run again here.

**One thing the skeptic caught that is mine, not the product's.** The briefing I wrote
for the fourteen agents repeated the broken command from that script's own header —
`cd apps/web && node scripts/read-ledger.mjs`, which crashes because the script reads
its environment relative to itself. It must be run from `apps/web/scripts/`. Several
agents lost time to it before working it out.

---
# PERFORMANCE, MEASURED ON THE LIVE SITE (dimension 11)

**The performance agent did return, late in the run, after this section was already
written by hand.** What follows is the conductor's own measurement; the agent's eight
findings are in the agents' table with their verdicts. Two independent passes over the
same ground, which is a good thing to have on a dimension nobody had ever measured.

### Delivering the page is genuinely fast, and that deserves saying

**Three runs per page, the middle one reported:**

| page | TTFB | total | HTML size | Vercel cache | compression |
|---|---|---|---|---|---|
| `/` | 228 ms | 237 ms | 25.0 KB | HIT | brotli |
| `/pricing` | 146 ms | 150 ms | 30.3 KB | HIT | brotli |
| `/how-it-works` | 241 ms | 249 ms | 33.1 KB | HIT | brotli |
| `/capabilities` | 183 ms | 188 ms | 26.8 KB | HIT | brotli |
| `/mission` | 201 ms | 213 ms | 20.5 KB | HIT | brotli |
| `/contact` | 172 ms | 182 ms | 18.1 KB | HIT | brotli |
| `/terms-of-service` | 197 ms | 203 ms | 25.8 KB | HIT | brotli |
| `/privacy-policy` | 144 ms | 161 ms | 28.0 KB | HIT | brotli |
| `/cookie-policy` | 145 ms | 158 ms | 20.8 KB | HIT | brotli |

**Every page a cache hit, every page brotli-compressed, every page under 250 ms.**
Nothing to fix here.

### What arrives after the page is the problem

```
HTML                        25 KB
CSS                          (2 files)
JavaScript   28 files      483 KB
images       18 files       ~33 KB   (all SVG except one 6.8 KB PNG — nothing to fix)
PostHog      array.js        81 KB
Cloudflare Turnstile        (loaded on top)
                          -------
a first visit             ~620 KB, of which ~564 KB is script
```

**And none of the page's content exists until that script has run** (section D). So the
fast HTML buys nothing: the visitor gets a menu and a footer in 230 ms and then waits
on half a megabyte of JavaScript for the headline and the tool.

**One line item worth a decision.** PostHog is **81 KB — about one sixth of all the
script on the page** — and `LAUNCH-CHECKLIST` G3 records that nothing is instrumented:
no funnel, and nothing measuring the different-device gap (H1) that the board calls the
most likely real-world failure left. **The site is paying the weight and not getting
the answers.** Either instrument it or drop it; carrying it unused is the worst of both.

### What could not be measured

No Core Web Vitals. LCP, CLS and INP need a real browser with field or lab
instrumentation, and I had one shared browser and no Lighthouse. **I did not estimate
them and will not present a guess as a measurement.** What can be said from the numbers
above is that LCP is bounded below by the script parse, because the largest element on
the page does not exist until then.

The engine's cold start was also not isolated: production is warm most of the time now,
and I could not establish a genuinely cold function with confidence.

---
# THE DEPLOY GAP, AND TWO CORRECTIONS TO THE BOARD (dimension 14)

**The operations agent returned late, with four findings.** This is the conductor's own
work on the same dimension.

### Correction 1: almost everything the board lists as "awaiting deploy" is live

`LAUNCH-CHECKLIST` records P1 as "FIXED — AWAITING DEPLOY" and item 6a says "a second
deploy is pending ... W7's seven fixes are committed and verified locally but **are not
on the live site**". **Tested one at a time against production:**

| item | what it is | live? | how I know |
|---|---|---|---|
| **P1** | the prompt-leak fix — rules moved into a system role | **DEPLOYED, and it does not fully work** | a 29-word paste, rewrite ran, response reports `message_roles: system+user`. But on odd input the leak still appears 3 times in 7 — see the section on the prompt leak. **Do not mark P1 done.** |
| **P2** | the 16-word floor below which the rewrite is skipped | **DEPLOYED** | `{"skipped":"input_too_short","min_words":16}` |
| **B7a** | `.txt` behaves like a paste — priced by the word and rewritten | **DEPLOYED** | a 4,800-word `.txt` with the rewrite on: `charged 5`, `layer_b_used: true` |
| **B7** | a Word document says "NOT REWRITTEN" instead of "Rewriting" | **DEPLOYED** | the live panel, quoted earlier in this note |
| **W7** | nav label changed to "What we do" | **DEPLOYED** | live homepage: "What we do" ×4, "Capabilities" ×0 |
| **D6** | canonical on every page | **DEPLOYED** | 9 of 9 checked |

**One caution I hit myself and it is worth passing on.** My first attempt at this table
got two of them wrong — I tested P1 with a 16-word input, which is below the floor so
the rewrite never ran and the field I was looking for was absent; and I tested the
`.txt` pricing with the rewrite switched off, which is the case that has always cost 1
credit. Both looked like "NOT DEPLOYED" and both were my own test error. **A negative
result from a badly-built probe is the same shape as the phantom findings this audit
exists to prevent.**

**What genuinely is still broken on the live site** — these are open defects, not
undeployed fixes: the header credit count freezing (6d), the credit chip wrapping (6e),
the rewrite altering quotations (6f), and the stale FAQ answer (6c).

### Correction 2: the "nothing is pushed" risk is closed

The board's tracked risk #5 says *"Nothing is pushed (E4). 76 commits exist only on this
machine"*, and item 4 says *"109 commits exist only on this laptop while the site is
live."*

```
commits on this laptop:      250
commits not on GitHub:       5      (and 5 of those are this audit's own, from tonight)
newest on GitHub:            069de01 "Two launch briefs, to be run from their own chats"
```

**Everything that existed before this session is on GitHub.** The laptop is no longer
the only copy. That risk can come off the board.

### Still true, and still worth doing

Nothing is watching production (E1, no Sentry) and nothing backs up the ledger (E2).
Both stand. The backup's real stakes are in the section above: 84 rows across 30
accounts, of which exactly one could be rebuilt from Stripe.

---
# ERROR HANDLING AND FAILURE MODES (dimension 13)

**That agent returned late too, with eight findings.** This is the conductor's
independent pass over the same ground.

### Ten deliberately broken inputs, sent to the live site

**Correctly refused, and nothing charged:**

```
a .docx that is not a zip at all           400  bad_format
a zip with no word/document.xml            400  bad_format
a .png that is not a PNG                   400  bad_format
a real PNG renamed .docx                   400  bad_format
a single null byte                         400  bad_format
a .pdf                                     400  bad_format
```

All six get the same message, and it is a good one: **"That file type is not supported.
Use text, a Word document, PNG or JPG."** Clear, and it names the way out.

**This answers an open question on the board.** `LAUNCH-CHECKLIST` B2a says *"`.pdf` is
in the engine's `CONTAINER_EXTS` while 04 entry 26 says PDF is deliberately unsupported
— nobody knows what a PDF upload does today."* **It is refused, cleanly, free of
charge.** That item can be closed.

**Accepted and charged one credit each:**

```
text that is only whitespace               200  OK  charged=1  kind=text
text that is only emoji                    200  OK  charged=1  kind=text
text that is only invisible characters     200  OK  charged=1  kind=text
a .jpg with a truncated scan               200  OK  charged=1  kind=image
```

**The whitespace one is a defect** and it is the same family as finding 4: a customer
whose paste silently failed, or who hit the button with an empty-looking box, is
charged a credit to have nothing done to nothing. The "only invisible characters" case
is the opposite — that is a legitimate document that is entirely watermark, and
charging for it is right.

### The credit check runs before the file check, and it costs a sale (MEDIUM)

**With the account at zero, all ten of those inputs returned the same thing:**

```
HTTP 402  insufficient_credits: This needs 1 credit and you have 0.
```

Including the six the site would have refused anyway.

**So a visitor can be told to buy credits for a job that will never run.** They top up,
come back, and are then told their file is not supported. The same ordering showed up
on the 45,000-word paste earlier: quoted 45 credits for a document that is over the
10,000-word limit and would be refused at any price.

**Cheap fix, and it is a conversion fix rather than a bug fix:** validate the format and
the size before pricing, so "we cannot use this file" always beats "you need to pay
first".

---
# FRICTION AND THE VISITOR'S JOURNEY (dimension 12)

**The friction agent also returned late, with nine findings of its own.** This is the
conductor's independent walk, done as the visitor the working agreement names: a student
on a phone who wants a document unwatermarked and knows nothing yet. The agent's
findings are in the agents' table.

### The path to a first result is genuinely short, and that is the best thing about the product

```
land on the homepage  ->  paste  ->  click "Scan it"
   one click, no fields, no account, no card, and the scan is free and unlimited
```

Then one more click sanitises it, using the two free credits a stranger is given
without asking for anything. **Two clicks and zero form fields from arriving to having
a cleaned document.** Very few paid tools get a visitor to value that fast, and nothing
in this audit should obscure it.

**Every internal link on the site works** — all ten, checked:

```
/auth/sign-in 200   /auth/sign-up 200   /capabilities 200   /contact 200
/cookie-policy 200  /how-it-works 200   /mission 200        /pricing 200
/privacy-policy 200 /terms-of-service 200
```

### The walls, in the order a visitor meets them

**1. Cloudflare has to load, or nothing works and the site blames their internet.**
This is the first wall and the worst, because it is invisible and unrecoverable — see
finding A. Everything before it works perfectly, which is what makes it expensive.

**2. Two free credits, then five.** Generous and clearly signposted. The one confusion
is on the same line as the counter: **"Scanning is always free"** sits directly beside
a chip reading **"1 left"**, and a first-time visitor cannot tell what the counter is
counting. One of those two phrases should say what it applies to.

**3. Then the price, and the pricing page is the strongest page on the site.** The
calculator, the "your five free credits already cover this" line, the four small
reassurances, and the honest layer table are all good work. Its defects are the
arithmetic ones already listed: "about four college essays" for a pack its own
calculator makes three, and "files are one credit each whatever their size" beside a
`.txt` that is charged by the word.

### The dead ends, all reachable, all reproduced

| dead end | what the visitor does next |
|---|---|
| Cloudflare blocked | retries forever; nothing else is offered |
| a 3.3 MB photo | gets a generic failure; is never told the size limit |
| a 9,900-word document | waits three and a half minutes, then is told to try again — which fails again |
| the contact form with no mail app | taps Send message and nothing happens |
| zero credits + an unsupported file | is told to buy credits for a job that will be refused anyway |

**Four of those five end with the visitor being invited to retry something that cannot
succeed.** That is the single most consistent shape in this audit, and it is worth
naming as one thing rather than five: **when this product fails, it does not say why,
and it suggests trying again.**

---
# THE DIFFERENT-DEVICE GAP (H1), GIVEN A NUMBER FOR THE FIRST TIME

`LAUNCH-CHECKLIST` H1 calls this *"the most likely real-world failure left in the
funnel, and nothing measures it"*: a guest earns credits on a laptop, opens the
confirmation email on a phone with no guest cookie, and the merge cannot fire.

**Counted on the live database tonight:**

```
anonymous guest accounts                    23
real accounts (excluding this audit's)       8
rows in guest_conversions                    7

guests still holding credits                12   (13 credits between them)
guests who spent everything                 10
```

**The merge is working for almost everyone who converts.** Seven of the eight real
accounts have a conversion row, which means the guest's credits followed them into
their account exactly as designed.

**The upper bound on the damage is one account.** Exactly one real account has no
conversion row — and that is either someone who signed up directly without ever
guesting (which decision B12 confirms is normal and expected), or someone who hit H1.
**Nothing in the data tells the two apart**, which is precisely what H1 says.

**So the honest position, which is better than the board's:** the gap is real, the
mechanism is real, and at today's volume it has affected **at most one person out of
eight, and possibly nobody.** The twelve guests holding credits are overwhelmingly
people who have not come back yet, not people who lost anything.

**What would settle it** is one column: record on the conversion row whether a guest
cookie was present. Then "converted with credits carried" and "converted with nothing
to carry" become countable, and this stops being a matter of opinion. That is a smaller
job than the analytics work G3 describes, and it answers the question G3 was raised for.

---
# SECURITY HEADERS — five of the six standard ones are absent (MEDIUM)

**The complete header block the live site returns, with the routine ones stripped out:**

```
HTTP/2 200
access-control-allow-origin: *
cache-control: public, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000
x-vercel-cache: HIT
```

**Checked one at a time:**

```
PRESENT  strict-transport-security
missing  content-security-policy
missing  x-frame-options
missing  x-content-type-options
missing  referrer-policy
missing  permissions-policy
```

**And the same on `/auth/sign-in`** — the page where people type their password:

```
missing  content-security-policy   (sign-in page)
missing  x-frame-options           (sign-in page)
```

**What each missing one actually allows, in plain terms.** `x-frame-options` is the one
that matters most here: without it another website can load the un-claude sign-in page
inside an invisible frame on top of its own, so a visitor believes they are clicking
one thing and are really clicking another. `content-security-policy` is the safety net
that limits the damage if a bad script ever reaches a page. The other three are smaller:
they stop a browser guessing file types wrongly, control what address is leaked to other
sites, and switch off browser features the site does not use.

**Nothing is broken today and no customer is affected today.** These are missing safety
nets rather than an open door, which is why this sits at medium and not higher.

**It pairs badly with the open redirect (finding 3), though, and the pair is worth
seeing together:** an attacker can already produce a link that starts with
`https://un-claude.com/` and lands wherever they like, and the sign-in page can be
framed. Those two are individually modest and jointly make a convincing phishing setup
out of your own domain. Closing the redirect is the cheaper half and closes most of it.

---
# A FAILED ATTEMPT COSTS JON REAL MONEY AND THE SITE INVITES A REPEAT (MEDIUM)

Found by the engine agent, measured here.

**One 7,500-word document — a size the site accepts and cannot finish:**

```
gateway balance before : $10.462808
customer credits before: 19

HTTP 400 after 198.5s
the customer is told   : "The rewrite could not be completed. Nothing was charged.
                          Please try again."

gateway balance after  : $10.250312
customer credits after : 19

>> cost to Jon of this one failed attempt : $0.2125
>> cost to the customer                   : 0 credits
```

**The caveat on that figure, stated because it matters.** Other agents from this audit
were running at the same time, so the $0.2125 is an upper bound rather than a clean
attribution. The defensible floor comes from the engine's own reported figure for
comparable work: a 6,000-word run that *succeeded* after 196 seconds reported
`cost_usd: 0.0562`. **So one failed attempt costs somewhere between about 6 and 21
cents. Either number makes the point.**

**The point being: the failure is free to the customer, expensive to Jon, and the
message asks them to do it again.** A student with a dissertation chapter will try
three or four times before giving up. At the low end that is a quarter of what a
Starter pack earns; at the high end, more than the pack is worth.

**And it needs no bad actor.** Every honest customer with a document over about 7,000
words is invited into this loop by the product's own error message. Fixing finding 1 —
refusing sizes that cannot finish, up front and free — closes this at the same time,
which is another reason it is the item to do first.

---
# COOKIES AND CONSENT — the legal page's central claim is justified (PASS)

The cookie policy's whole argument is that no consent banner is needed because nothing
is stored until the visitor asks for something. **Checked on a genuine first visit:**

```
Set-Cookie headers on the homepage response : none
cookie jar after loading the homepage       : empty
```

**Nothing at all is set until the visitor uses the tool.** That is the strongest form
of the claim the page makes, and it is true. On a site that could easily have shipped a
cookie banner it did not need, this is the right call and it is worth recording rather
than passing over.

**One gap, and it is small.** The page says *"Three things stored on your device"* and
*"Clearing your browser data clears everything on this page"*, presented as a complete
list. The legal agent found a fourth — a `sidebar_state` cookie set for seven days when
a signed-in customer collapses the sidebar in their account area. Nobody is harmed; the
list is simply not complete, and it says it is. One row.

---
# HOW THIS AUDIT ACTUALLY RAN, AND HOW MUCH TO TRUST EACH PART

**The design.** Fourteen agents, one per dimension, probing the live site. Every finding
then put to three independent skeptics with different jobs: one re-runs the reproduction
command, one asks whether it is true of the deployed system rather than of source or of
Stripe's test mode, and one asks whether it harms anybody. Two of three refuting kills
the finding. Then completeness critics naming what nobody opened, a round to fill those
gaps, and a synthesis.

**What actually happened.** The run hit the account's usage limit twice and was resumed
twice. The first stop killed every skeptic before any had reported; the second stopped
four dimension probes and most of the panels again. **A workflow that dies takes its
agents' work with it**, which is why this note was written and committed as the run went
rather than at the end.

**One thing the first stop exposed, and it is worth recording as a lesson.** My script
counted "no skeptic voted" as "the finding did not survive", so the first run reported
26 findings as refuted when in truth **not one of them had been looked at.** That is the
same defect this audit exists to find, in the audit's own machinery: a confident verdict
nobody checked. It was fixed before the second run — a finding with no votes is now
`UNVERIFIED`, never `REFUTED` — and no such finding reached this note.

**So the evidence in here comes from three different places, and they are not equal:**

| where it came from | how much to trust it |
|---|---|
| **Reproduced by hand against the live site, output pasted in** | The strongest. Most of this note. Anything marked "conductor". |
| **Found by an agent AND re-run by hand** | Equally strong. Marked as both. |
| **Found by an agent and passed by the skeptics** | Strong. The skeptics re-ran the commands themselves. |
| **Found by an agent, not yet judged** | **A lead, not a verdict.** In its own section, marked as such. |

**All fourteen dimensions eventually reported**, but four of them — performance,
friction, failure modes and operations — landed so late that I had already covered them
by hand. **That turned out well rather than badly:** those four have two independent
passes over the same ground, mine in their own sections and the agents' in the agents'
table.

**The skeptics changed real conclusions, which is the point of having them.** They killed
six findings, including one of the engine agent's for being a restatement of a board item
already ruled on, and one whose reproduction turned out to be **a simulation rather than
an observation** — an agent inserting figures it chose itself and then reporting what the
database stored. They also talked me down from "high" to "medium" on three of my own, and
reframed a fourth better than I had written it. Every one of those corrections is
recorded in place rather than quietly applied.

**Three of my own hypotheses died the same way**, and are recorded because a killed
hypothesis is worth as much as a finding: a font that looked corrupt and was not, a C2PA
metadata layer that looked dead on production and works perfectly, and a credit balance
that looked like an overspend and was my own concurrent tests.

---
# THREE SMALL ONES, CONFIRMED BY HAND (LOW)

### The sign-in failure page wears the homepage's title

```
/auth/callback/error     200   title: Un-Claude · AI Watermark Remover
/auth/verify             200   title: Sign In · Un-Claude
/update-password         200   title: Update Password · Un-Claude
/auth/password-reset     200   title: Reset Password · Un-Claude
```

Three of the four name themselves. The one that does not is the page a customer lands
on when their sign-in link fails — so with several tabs open they cannot find it, and
Google sees two pages claiming to be "Un-Claude · AI Watermark Remover".

### The sign-up page promises three credits and gives five

**The live page, verbatim:** *"Create an account — **3 free credits** — Email Address —
Password — Sign up with Email"*.

A brand-new account actually receives five: two welcome credits and three signup
credits. That is decision B12 and it is confirmed intended, so **the account is right
and the page is wrong.** Under-promising is the harmless direction, but it is another
number about money that does not match what the customer was told.

### The sign-up page says the terms twice, and its Google button says "Sign in"

Same page, same read, in order:

```
Create an account
3 free credits
Email Address / Password / Sign up with Email
By creating an account you agree to our Terms of Service and Privacy Policy.
Sign in with Google
By creating an account you agree to our Terms of Service and Privacy Policy.
```

The consent line appears twice and the Google button offers to sign you in on a page
headed "Create an account". It reads as two half-finished forms stacked up — and this
is the page standing between a visitor and the five free credits.

---
# THE PROMPT LEAK AND THE DIVIDER ARE THE SAME DEFECT, AND IT IS NOT FIXED (HIGH)

Two questions were left open earlier in this note: whether the P1 prompt leak is really
closed, and whether the `---` divider that two agents saw in finished documents is real.
**One run answered both.** The same input, eight times, on the live site:

```
run 1: leak=false divider=false  "This section appears to contain only symbols, punctuation,
                                  and no readable text. No rewrite is possible."
run 2: HTTP 400 layer_b_failed
run 3: leak=false divider=false  "The following lines contain only symbols, punctuation, and
                                  no meaningful text to rewrite..."
run 4: leak=TRUE  divider=TRUE   "The following text has been rewritten while strictly
                                  adhering to the provided rules:\n\n---\n\nA chaotic jumble..."
run 5: leak=TRUE  divider=TRUE   "The following text has been rewritten in compliance with
                                  the provided rules:\n\n---\n\nA chaotic mix of symbols..."
run 6: leak=TRUE  divider=TRUE   "The following text has been rewritten while strictly
                                  adhering to the provided rules:\n\n---\n\nA chaotic jumble..."
run 7: leak=false divider=false  "The following symbols appeared in sequence: ..."
run 8: leak=false divider=false  "I'm afraid I can't rewrite that—it's not a text with facts,
                                  names, or numbers to preserve..."

LEAKED IN 3 OF 7 RUNS THAT COMPLETED
```

### What this settles

**1. The divider is not a separate mystery. It is the prompt leak.** Every run that
leaked also carried the `---`, and none that did not leak carried it. The model is
echoing the *shape* of its instruction — preamble, then the boundary line, then the
text. That is why I could not reproduce the divider on clean prose in thirteen tries:
**I was looking for it on the wrong kind of input.** The two agents who found it were
right, and the mechanism is exactly the `\n\n---\n` boundary in `rewrite_text.py`.

**2. P1's fix is deployed and does not stop this.** The live response really does report
`message_roles: system+user`, so the rules are in a system role as W8 intended. **The
leak survives it**, which is the caveat W8's own note predicted when it recorded that
10 of 120 short or odd pastes still came back wrong.

**3. But it is milder than P1 was.** What leaks is the model's compliance language —
*"rewritten while strictly adhering to the provided rules"* — **not the rules
themselves.** No part of the actual prompt text appeared in any of the eight runs. The
worst version of P1, where a customer received the rewrite rules as their document, did
not reappear.

**4. And the customer pays for it.** Each of these runs charges a credit and hands back
either a chatbot's commentary or, in run 8, a flat refusal — *"I'm afraid I can't
rewrite that"* — presented as their sanitised text.

### What to do with it

**Do not mark P1 done.** The honest state is: the structural fix shipped, it reduced the
problem, and on odd input the model still talks about its instructions three times in
seven. **The cheap guard is at the output, not the prompt**: reject any result that
begins with a line about rules, or that contains a bare `---` the input never had, and
refund rather than return it. That is a string check, and it also removes the divider
from finished documents.

---
# THE 500 ERRORS NOBODY SAW — reported, and I could not check it (HIGH, unconfirmed by me)

The operations agent reports pulling Vercel's error log and finding **twelve `500`
responses on `POST /home/settings` in twenty-four hours**, plus one `501` on
`GET /api/scan`, with a sample message of `Invalid...`. Its point is not the errors
themselves but that **nobody knew** — there is no Sentry and no alerting, so E1 has
already cost something rather than being a hypothetical.

**I could not verify this.** Vercel's runtime-errors API returned `403 Forbidden` to me
and the project-protection endpoint returned `404`, so the credentials this session has
do not reach that data. The agent had access I did not.

**What I can say instead, and it makes the same point without needing the log.** During
this audit I personally watched the live site return `500`-class outcomes I would never
have known about if I had not been looking: the engine failing on 7,500, 8,500 and
9,900-word documents, an eighteen-word noun list failing outright, and a run coming back
as a chatbot refusal. **Not one of those produced any signal anywhere.** They were only
visible because somebody was sitting there watching the responses.

**So E1 is not a hypothetical any more, whatever the exact count.** The question is not
whether errors happen — they demonstrably do — it is that the only monitoring on this
site is Jon opening it himself.

**Worth Jon checking directly**, because it is two clicks in the Vercel dashboard and it
would settle both the count and whether `POST /home/settings` — the account-management
page — is genuinely erroring for real customers.

---
# THE CONFIRMATION EMAIL — mandatory, unobserved, and the link is not your domain (MEDIUM)

Three of the completeness critics independently flagged the same hole: **nobody in the
whole audit ever saw a confirmation email**, and every one of the ~20 throwaway accounts
was confirmed through the admin API instead. It is the only compulsory gate between a
visitor and a paying account, and it was 100% unobserved.

**What the live auth service says about itself:**

```
mailer_autoconfirm : false        <- a confirmation email IS required for every signup
disable_signup     : false
providers          : email, google, anonymous_users
```

**So the email is not optional. If it does not arrive, the paid funnel is closed.**

**I could not observe a send.** The public signup endpoint is captcha-gated and refuses
a headless request, and I have no inbox to receive one. That gap stays open and it is
worth Jon spending five minutes on: sign up with a personal address, and see whether the
mail arrives, how long it takes, and whether it lands in spam.

**But one thing I could check is concrete, and it is not good.** The link the
confirmation email carries points at:

```
https://itdgggoxsoolbfiwujvt.supabase.co/auth/v1/verify
```

**Not `un-claude.com`.** A student who has just signed up for un-claude.com receives an
email asking them to click a link to `itdgggoxsoolbfiwujvt.supabase.co` — a random
string on a domain they have never heard of.

**Two costs, and both are ordinary rather than exotic.** It reads exactly like a
phishing email, which is the one thing people are now trained to distrust in a
confirmation message. And spam filters weight the match between the sending brand and
the link domain heavily, so it makes the mail more likely to be filtered — on the one
message the entire funnel depends on.

**It connects to the missing MX records** (see the domain section): with no mail on
`un-claude.com`, there is no address on the brand's own domain for any of this to come
from or go to.

**Fix sketch.** Supabase supports a custom redirect domain for auth links, so the URL in
the email becomes `un-claude.com/auth/confirm?...`. Combined with the MX record and a
`support@un-claude.com` sender, the whole signup message stops looking like a stranger.

---
# THE MOST COMMON SIGNUP PROBLEM IS ANSWERED WITH "CHECK YOUR INTERNET" (MEDIUM)

A completeness critic named this as the single most common real-world signup problem:
somebody signs up, the confirmation email lands in spam or they close the tab, and later
they come back and try to sign in. **Nobody had tested it.**

**Live, in a real browser, with a genuinely unconfirmed account:**

```
Sign in to Un-Claude

  Sorry, we could not authenticate you
  We have encountered an error. Please ensure you have a working internet
  connection and try again

  Email Address / Password / Password forgotten? / Sign in with Email
```

**Their internet is fine. Their email is unconfirmed.** The message names the wrong
cause, offers no way forward, and there is no "resend the confirmation email" anywhere
on the page.

### The pattern underneath it, which is the actual finding

**This is the third distinct cause this audit has watched land on that same sentence:**

| what actually went wrong | what the customer is told |
|---|---|
| Cloudflare's captcha did not load (finding A) | "Please ensure you have a working internet connection" |
| the account exists but the email is unconfirmed | "Please ensure you have a working internet connection" |
| a wrong password, a rate limit, or anything else auth returns | "Please ensure you have a working internet connection" |

The sign-in page ships a list of error strings and **that list has no case for a
captcha failure and no case for an unconfirmed email**, so everything falls through to
the default. One sentence is doing the work of every possible failure, and it happens to
name the one cause that is almost never the real one.

**Why this is worth more than its severity suggests.** Every other error in this product
is well written — the 402 names the exact numbers and offers two ways forward, the
`bad_format` message names the accepted types, the `too_many_words` message says to split
the document. **The auth pages are the exception, and they are the one place where the
customer has already decided to buy.**

**Fix sketch.** Two cases and a button: map `email_not_confirmed` to "Check your inbox —
we sent you a link" with a **Resend it** control, and map `captcha_failed` to something
that says the security check could not load rather than blaming their connection.

---
