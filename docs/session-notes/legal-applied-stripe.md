# Terms, checkout and the European decision — 22 August 2026

**Read section 0 first. This note documents work that was applied, then partly
reversed by Jon's ruling the same day, and the reversal is the more important
half.** Everything the reversal deleted is preserved in section 7, because it was
proven working and it is what a future session restarts from if Europe is ever
opened up.

**Two commits.**

- `b965e88` — the full UK/EU consent ceremony. **Superseded.**
- `ca69a80` — US only, ceremony deleted, governing law added. **Current.**

**Decision log entries 115 and 115a carry the rulings.** Nothing was deployed and
nothing was pushed.

---

## 0. Where this landed, in one page

| | Before today | Now |
|---|---|---|
| **Market** | Sold worldwide | **US customers only**, stated in the terms |
| **Terms on payment** | "currently free... no payment method is collected" | Present tense, live, with the card-security line |
| **Free credits** | "a small number", "a few more" | **2 plus 3**, read from the code, with promotion terms |
| **UK/EU 14 day right** | Not addressed anywhere | **Out of scope.** Section removed |
| **Checkout ceremony** | Stripe's terms checkbox | **Unchanged.** Stripe's terms checkbox, and nothing on our side |
| **30 day refund** | A tile under the buy buttons | **Small print, FAQ, and the terms.** Not a tile |
| **Governing law** | Absent | **California.** D1 closed |
| **Legal page descriptions** | Inherited the site-wide one | One each |

**NOTHING ON THIS SITE CAN TAKE MONEY TODAY, and that reframes the urgency of
everything above.** Production returns **404** for `/api/checkout` and has **no
Stripe environment variables at all**. The payment path exists only on a laptop.
**So the two sentences this session was convened to fix are not currently false**;
they become false on the deploy that ships checkout with a live key, and the fix
is written and waiting for it. Section 6.2.

**The EU card block is built and proven in test**, and populating live is a
launch step rather than a today step, because there is no live mode to populate.
Section 6.2.

**And one thing that is bigger than anything on the legal pages:** the Vercel
project is on the **Hobby plan**, which does not permit commercial use. Jon has
ruled it a todo before launch. Section 6.1.

---

## 1. Part 1 — the false sentences

### 1.1 What was live, verified by curl before anything was changed

Read off `https://un-claude.com/terms-of-service`, under **Payment, credits and
refunds**:

> The service is currently free to use and no payment method is collected.
> Credit packs and their prices are announced on the pricing page and go on sale
> when card checkout opens. Prices are in US dollars. Nothing is charged without
> your agreement, and the price of an operation is shown before it runs.

**Both of the first two sentences become false statements in a binding document
the moment the first charge lands.** Checkout is already wired: `/api/checkout`
returns a live Stripe session, and the Stripe account has `charges_enabled true`.

### 1.2 What it says now, in full, as words rather than code

Rendered from the running application and pasted here so Jon reads what a
visitor reads. **Two sections where there was one.**

---

**Payment and credits**

> Credits are bought in packs on the pricing page, from $4.99 to $24.99. Prices
> are in US dollars. The price on that page is the total you are charged: we add
> nothing at checkout, no tax and no fee. There is no subscription and nothing
> renews. Nothing is charged without your agreement, and the price of an
> operation is shown before it runs.
>
> **Your card details never reach us.** Payments are handled by Stripe, and you
> enter your card on Stripe's own payment page rather than on ours. Your card
> number is never sent to Un-Claude and we never store it. What we receive back
> is which pack you bought, what it cost, and whether it was paid. Stripe emails
> you the receipt.
>
> One credit covers one thousand words of pasted text. An uploaded file is one
> flat credit whatever its size, unless it is a plain text file you also send
> through the rewrite, which is priced by its words in the same way a paste is.
> Every job rounds up to a whole credit, and credits never expire.
>
> A failed operation costs nothing. If a run fails, the credits it took are
> returned to your balance automatically, and your credit history shows the
> reversal. That is not a refund request and you do not have to ask for it.

**Cancelling, and getting your money back**

> There are two of these and they are not the same thing. The first is a legal
> right you have. The second is a policy we chose.
>
> **Your right to cancel.** If you live in the UK or the EU, consumer law gives
> you 14 days from buying credits to cancel and get your money back, without
> giving a reason. To use it, email unclaudeapp@gmail.com and say you want to
> cancel. We refund you within 14 days of being told.
>
> **That right ends the moment your credits arrive.** They arrive as soon as the
> payment succeeds, so what you bought has already been delivered in full. That
> is why checkout asks you to tick a box agreeing to immediate delivery and
> confirming you understand the 14 day right to cancel ends at that point. You
> cannot pay without ticking it, and if you did not tick it you did not give up
> anything.
>
> **Our 30 day refund, which is separate and more generous.** Within 30 days of a
> purchase you may ask for a refund of any credits from it that you have not
> spent, at the price you paid, and we will not ask you why. Credits you have
> already spent are not refunded, because the work was done. Refunds are returned
> to the card that paid. This one is our own policy rather than a legal right,
> and it sits on top of the right above rather than standing in for it.
>
> If you delete your account, any credits on it end with it and are not refunded.
> Ask for the refund before you delete.

---

**And the free credits, which were vague and are now the promotion's terms.**
Under **Accounts, credits and free use**, first two paragraphs, before and after.

**Before:**

> You can use the tool without an account. The first time you clean something we
> create a guest account for your browser and give it a small number of free
> credits... Creating a real account earns a few more, once. The current numbers
> are on the pricing page.
>
> Free credits are a courtesy, not an entitlement. They are granted once rather
> than renewed, we may change the amounts, and we may refuse or reverse them
> where we believe someone is creating accounts to collect them repeatedly.

**After:**

> You can use the tool without an account. The first time you clean something we
> create a guest account for your browser and give it 2 free credits, so you can
> try the thing you came for before deciding anything. Creating a real account
> earns 3 more, once, which is 5 in total. The same numbers are on the pricing
> page.
>
> Free credits are a promotion rather than an entitlement, and these are its
> terms. They are granted once rather than renewed. They have no cash value,
> cannot be exchanged for money, and are not covered by any refund. We may change
> the amounts or end the promotion at any time, and doing so never touches
> credits you have already been granted or already paid for. We may refuse or
> reverse free credits where we believe someone is creating accounts to collect
> them repeatedly.

**Last updated is now 22 August 2026.**

### 1.3 No price and no credit count is typed into that page

**The instruction was "never hardcode a price anywhere" and the page obeys it
literally.** `$4.99 to $24.99` is computed from the same `PACKS` array the
pricing cards render from, and `2`, `3` and `5` are `WELCOME_CREDITS`,
`SIGNUP_CREDITS` and `FREE_CREDITS` from that same file. **A price change cannot
leave a stale figure sitting in a binding document.**

`04` entry 97 already reversed the free split once. That is exactly the failure
this guards against.

### 1.4 Every factual claim in the new wording, and where it was checked

| Claim | Checked against |
|---|---|
| "from $4.99 to $24.99" | Computed from `PACKS`; the live Stripe session created in section 2.3 returned `amount_total 999 usd` for the $9.99 pack |
| "the total you are charged: we add nothing at checkout, no tax and no fee" | No `automatic_tax` anywhere in the route; `packLineItem` sets a flat `unit_amount`; `amount_total` equalled the advertised price exactly |
| "you enter your card on Stripe's own payment page" | `stripe().checkout.sessions.create` returns a `checkout.stripe.com` URL and the button does a full navigation to it |
| "Stripe emails you the receipt" | A real receipt was read by the previous session and is quoted in `payments-tested.md` |
| "A failed operation costs nothing" | `refund()` writes an `operation_refund` row; unchanged from before |
| "2 free credits... 3 more... 5 in total" | Read from `pricing-data.ts`, which `04` entry 97 ratified |
| "You cannot pay without ticking it" | Proven four ways in section 2.3 |

**One claim about tax that is narrower than it looks, said plainly.** The page
says the checkout adds nothing to the price. **That is a statement about what the
code does, and it is true.** It is NOT a statement that no VAT or sales tax is
owed anywhere. Whether Jon has a registration obligation in the EU or in any US
state is a question this session did not touch and could not answer.
`legal-reconciliation.md` marked it MISSING and it is still missing.

---

## 2. The checkout, as it now stands

**There is nothing on un-claude.com's side. The button goes straight to Stripe.**

The only consent collected is Stripe's own, set by `consent_collection` and live
since entry 112. Read off the live checkout page:

> ☐ I agree to Un-Claude's Terms of Service and Privacy Policy

Not pre-ticked, required to pay, recorded by Stripe with its own timestamp.
**That is the whole ceremony and it is deliberately the ordinary one.** Jon:
*"We shouldn't present the granular details at checkout, just make them
acknowledge they have read the T&C."*

**What the terms that checkbox points at now carry:** the refund policy, the
US-only restriction, and the governing law. **One tick covers all three**, which
is why nothing needed to be added beside it.

---

## 3. The refund, moved rather than removed

**The audit trail Jon asked for, since it changed the decision.** Entry 115a has
it in full. The short version: the policy came from **Stripe dispute economics on
19 August**, not from law, and the legal research two days later said it **fails**
as a substitute for the statutory right. Roughly **40 to 1**, a refund against a
dispute, is the entire case for it and it is a good one.

**It is now in three places and none of them is a tile.**

**Small print under the pack grid**, at 12.5px:

> Prices are in US dollars, and the price on the card is the total you pay.
> Credits are sold to customers in the United States only. Unspent credits are
> refundable for 30 days at the price you paid. **The terms have the detail.**

**Last answer in the pricing FAQ**, placed last on purpose so that someone
deciding whether to buy does not meet it on the way in:

> **Can I get a refund?** Yes. Within 30 days of buying, email
> unclaudeapp@gmail.com and we will refund any credits from that purchase you have
> not spent, at the price you paid, without asking why. Credits already spent are
> not refunded, because the work was done.

**And in full in the terms**, under its own **Refunds** heading.

**What took its slot in the trust grid**, because a four-column grid cannot have
three items and because Stripe's checklist wants this disclosed anyway:

> **Your card never touches us.** You pay on Stripe's own page. We never see the
> number.

**It must not leave the pricing page entirely.** Stripe's website checklist
expects a visible refund policy and `03-pricing.md` 12c step 8 lists it as a
pre-activation requirement. Hidden is fine. Absent is an account risk.

---

## 4. Part 4 — the meta descriptions

**All three legal pages inherited the site-wide description**, so a search result
for `/terms-of-service` described the product rather than the page. Each now has
its own, written in its own page file. **`lib/root-metdata.ts` was not opened**;
it belongs to the SEO session.

Read out of the rendered HTML of the running application:

    /terms-of-service   The agreement behind Un-Claude: what each of the three
                        layers is promised to do, how credits and payment work,
                        and our 30 day refund policy.                   (140)

    /privacy-policy     What Un-Claude does with your text and files. Nothing you
                        submit is kept, the optional rewrite is the only thing
                        that leaves, and here is what we store.         (152)

    /cookie-policy      Un-Claude sets no advertising and no tracking cookies, so
                        there is no consent banner. What is actually set, what it
                        does, and how long it lasts.                    (144)

**All three under 155 characters.** Each describes its own page, and the terms
one keeps the layer split rather than flattening the three into one promise.

**One near miss worth recording as a pattern.** The terms description first read
"and your 14 day right to cancel", written in the morning. The section behind it
was deleted that afternoon when the market was cut to the US, and **nothing
caught it**: the typechecker cannot see inside a string, and the page itself read
correctly. **A meta description is copy that no reader of the page ever sees, so
it does not get re-read when the page changes.** It was found on a final grep for
"14 day" across the file. Commit `d859d99`. **Anything asserting a policy from
outside the page body needs its own check when the policy moves.**

---

## 5. The terms, as they now read

The two new sections, rendered from the running application and pasted as words.
Section 1.2 above has the payment sections.

> **Refunds**
>
> Within 30 days of a purchase you may ask for a refund of any credits from it
> that you have not spent, at the price you paid, and we will not ask you why.
> Email unclaudeapp@gmail.com and we will do it. Credits you have already spent
> are not refunded, because the work was done. Refunds are returned to the card
> that paid.
>
> If you delete your account, any credits on it end with it and are not refunded.
> Ask for the refund before you delete.
>
> **Who you are dealing with, and whose law applies**
>
> Un-Claude is operated by an individual sole trader based in California, in the
> United States. There is no company; the trader is a person, and these terms are
> an agreement with him. Write to unclaudeapp@gmail.com and a person reads it.
>
> These terms are governed by the law of the State of California and of the
> United States, and any dispute is heard in the state or federal courts of
> California. Nothing here takes away rights you have under consumer law that a
> contract cannot remove.

And in **Payment and credits**, the sentence that makes all of the above coherent:

> **We sell credits to customers in the United States only.** If you are outside
> the United States you may use the free tool, but you may not buy credits, and by
> buying you confirm that you are a US resident. We may refuse or reverse a
> purchase made from outside the United States and refund it in full.

**No legal name and no address**, on Jon's instruction. The US has no equivalent
of the UK DMCC disclosure duty and Stripe holds a support address separately.

---

## 6. Open items, ordered by how much they can hurt

### 6.1 The Vercel plan is Hobby. RULED, and it is Jon's todo

Read from the Vercel API, 22 August 2026:

    team    jnachman17-hue's projects
    id      team_4xVAEsxQQQJGwkd6mabjRXO5   (matches .vercel/project.json orgId)
    plan    hobby

**`03-pricing.md` 4e:** *"Vercel's Hobby plan does not permit commercial use...
a project generating revenue must be on Pro."* That section also says *"Jon
should check which plan the un-claude project is currently on. I could not: the
command that would have shown it was blocked by a permission rule."* **It is now
checked.**

**Jon, 22 August 2026: "I am upgrading to pro vercel before launch it's noted and
a todo."** So this is ruled rather than open. **It is the one item on this list
that can cost the whole site rather than some money**, and it is not done yet.

### 6.2 EU, EEA and UK cards. Built and proven in test. Live is a LAUNCH step, not a today step

**First, the fact that reframes this whole note, found 22 August by probing
production rather than by reading code.**

    POST https://un-claude.com/api/checkout   ->  404
    GET  https://un-claude.com/api/checkout   ->  404

    vercel env ls production  ->  13 variables, and NOT ONE of them is Stripe.
                                  No STRIPE_SECRET_KEY. No STRIPE_WEBHOOK_SECRET.

**The entire payment path exists only on a laptop.** The checkout route is not
deployed, production has no Stripe credentials, and the live pricing page still
carries the OLD `<Link>` buttons from entry 109 rather than the posting ones.
**The live site cannot take a dollar from anybody, anywhere.**

**Which means the two sentences this session was convened to fix are NOT
currently false.** "The service is currently free to use and no payment method
is collected" is **true today**. They become false on the deploy that ships the
checkout route with a live key, and the fix now exists and is waiting for it.
**There is no live falsehood to race.**

**THREE THINGS THIS NOTE ASSERTED THAT WERE WRONG, all the same shape: a match
read as a fact.**

1. *"Checkout is already wired: `/api/checkout` returns a live Stripe session,
   and the Stripe account has `charges_enabled true`."* **True on a laptop, false
   in production.** No probe of the live site was run before writing it.
2. *".env.local contains a live key."* A grep for `sk_live` matched **the comment
   warning that the live key must never be put in that file.** There is no live
   key anywhere on this machine.
3. *"It is idempotent, so running it twice is harmless."* It was not. Section
   below.

**The blocklist itself is built and proven.** `scripts/block-eu-cards.mjs` puts
31 country codes on Stripe's built-in `card_country_blocklist`: the **EU 27**,
the **three EEA states**, and the **UK**. The UK is included deliberately: it is
outside EU VAT but it kept the 14 day withdrawal right in CCR 2013, which is the
reason the list exists.

**Test mode, run and proven:**

    US card   -> succeeded  | outcome type "authorized"
    GB card   -> DECLINED   | type "blocked", reason "blocklist",
                            | rule "block_if_in_blocklist",
                            | network_status "not_sent_to_network"
    FR card   -> DECLINED   | same

**Two things previously flagged as unverifiable are now facts.** The rule reading
the built-in blocklist is **on by default**, needing no dashboard work and **no
paid Radar tier**. And a blocked card **never reaches the card network**, so it
costs nothing and leaves no failed charge.

**LIVE IS A LAUNCH STEP.** There is no live Stripe key and no live mode, so
there is nothing to populate yet. **When Jon activates live mode, this belongs
in the same sequence as putting the live key into Vercel:**

    STRIPE_LIVE_KEY=sk_live_xxx node apps/web/scripts/block-eu-cards.mjs live

**The key is passed in rather than read from a file**, because `.env.local` says
in its own comment that the live key must never be written there. Nothing stores
it. The script refuses a placeholder, refuses a test key in live mode, and is
idempotent.

**It can also be done in the Stripe dashboard** under Radar, block list, card
country, which Jon offered to do. Either is fine; the script is faster and
records what it did.

### 6.2a Four defects in that script, every one found by Jon running it

**None was found by anything in this session, and that is the point.**

| # | Defect | Cause |
|---|---|---|
| 1 | `MODULE_NOT_FOUND` | Handed over as a path relative to `apps/web` to someone at the repo root |
| 2 | Only worked from one directory | Read `.env.local` relative to the working directory |
| 3 | **Not idempotent, though described as idempotent** | Stripe stores codes **lowercased**; the script compared uppercase, so every re-run re-added all 31 and died on the first |
| 4 | `Invalid API Key provided: sk_live_` | The key was **regex-scraped out of the whole file** and matched **a comment** |
| 5 | `SyntaxError` in the fix for 4 | The explanatory comment contained a regex literal, whose `*/` closed the block comment early |

**Defect 4 is the instructive one.** A regex over a config file matches prose as
happily as configuration. The script now parses `key=value` lines with comments
skipped, reads the **named** variable, and validates that the key matches the
mode asked for and is not a stub. **Populating the test list while believing you
populated the live one is the exact failure this script exists to prevent, and it
would look identical from the outside.**

All four paths were then run and shown to behave: test succeeds and reports 0
added, live with no key prints the instruction, live with the placeholder says
"8 characters, which is a placeholder", and live with a test key refuses.

**THE PATTERN, THREE TIMES IN ONE DAY.** The meta description advertised a right
the page no longer granted. The script claimed idempotency with no second run
behind it. The live-key claim came from a grep hit inside a comment. **All three
were assertions about something no command had exercised.** A grep match is
evidence that a string exists, not that a fact is true.

### 6.3 Vercel log retention. RULED, no change wanted

The privacy policy says technical logs *"sit with our hosting company, which
keeps them for a limited period set by its platform rather than by us."*

**Jon, 22 August 2026: "Keep vercel log framing in privacy policy as is."** So
this is closed rather than open. **Nobody should reopen it as a defect.** The
sentence is accurate; it was only ever flagged as an opportunity to make it
stronger if the real retention window turned out to be short, and Jon does not
want that chased.

### 6.4 Still open, smaller

- **An arbitration clause with a class action waiver.** Now the highest-value
  legal addition, and it is lawyer drafting rather than a session's.
- **US state sales tax.** Trigger: roughly $100,000 or 200 transactions in a
  single state. **EU VAT is gone entirely** with the EU market.
- **`9F`, the suspension sentence** in "Ending your use", still unapplied. It
  refunds an unspent balance on suspension and removes the most likely chargeback
  in the product.
- **`legal-research.md` was written against the wrong jurisdiction.** It assumes
  the UK throughout while the Stripe account is a US individual. **Do not reuse
  its UK-specific conclusions.** Its section 11 already admitted no US analysis
  was done.

---

## 7. What was deleted, and how to bring it back

**Preserved because it was built, proven and then made unnecessary by a market
decision rather than by being wrong.** If Europe is ever opened for sale, start
here rather than from scratch.

**In commit `b965e88`:** a consent dialog in `buy-button.tsx` with an unticked
immediate-supply checkbox and a pay button stating the amount; a `consent_required`
gate in the checkout route that refused a missing flag, a `false`, and the string
`"true"`; the consent and its timestamp written to Stripe session and charge
metadata; a `custom_text` restatement above Stripe's pay button; and a
"Cancelling, and getting your money back" section in the terms.

**All of it was proven working**, including four refusal cases against the live
route and the consent read back off Stripe's own checkout page.

**The law behind it**, which has not changed: UK CCR 2013 regs 30, 37 and 16, and
CRD Article 16(m). The right is lost only on express consent to immediate supply,
plus acknowledgement of losing it, plus confirmation on a durable medium.

**The two things that were never closed and would need closing:**

1. **The durable-medium limb.** Stripe's receipt is durable but does not repeat
   the consent. The cheapest fix identified was `invoice_creation` with the
   sentence in `invoice_data.footer`.
2. **Digital content or service?** `legal-research.md` 3c holds it is digital
   content with **moderate confidence**, and names it the one item worth paying a
   lawyer for. On the "service" reading the right survives until the credit
   balance hits zero, and someone could spend 9 of 10 credits on day 13 and
   cancel for everything.

---

## 8. Earlier handoffs, still standing

Carried from `legal-applied.md` and unaffected by today's rulings.

- **The account-deletion defect.** "Delete account" destroys the sign-in but
  leaves the account row, holding email and name, and the whole credit history.
  There is no cascade and no delete trigger. The privacy policy describes this
  accurately today; **when the code is fixed the sentence changes in the same
  deployment.**
- **Nobody agrees to the terms at sign-up.** The checkbox flag is unset and there
  is no acceptance line under either sign-up button. **Note that this matters
  less than it did this morning**, because Stripe's checkbox now takes terms
  acceptance from every buyer at the moment of purchase. It still matters for
  everyone who uses the free tool without buying.
- **The disclosure line at the tool's own button**, `legal-reconciliation.md` 2D.
- **Whether PostHog autocapture has ever recorded workbench text.**

---

## 9. Verification

**Run, with output.**

- `npx tsc --noEmit` across the web app: **exit 0, no output.** Run after each of
  the two commits.
- `npx oxlint` over the three changed directories: **no output.**
- **The terms rendered and read end to end** on the running dev server. The
  changed sections are pasted as words in sections 1.2 and 5.
- **The pricing page read out of the live DOM after the changes.** The trust grid
  is now *Credits never expire, A failed run costs nothing, Your card never
  touches us, Scanning is always free*. The refund appears twice on the page, both
  times below the fold. The three pack cards still measure **332px each**, so the
  layout signed off in entry 109 has not moved. No horizontal overflow at 375px,
  and the page was screenshotted at that width and looked at.
- **The three meta descriptions read out of the rendered HTML**, all under 155
  characters.
- **Tax and fees, verified on all three packs** through the real route, read back
  from Stripe:

      pack     advertised   subtotal   tax   total   currency
      starter  $4.99        499        0     499     usd
      plus     $9.99        999        0     999     usd
      pro      $24.99       2499       0     2499    usd

      automatic_tax: {"enabled": false}   on all three

  And a search of the whole payment path finds no `automatic_tax`, no
  `tax_behavior`, no `application_fee`, no `tax_rates` and no shipping.

- **The Vercel plan read from the API:** `hobby`. Section 6.1.

**Not run, said plainly.**

- **No completed test payment.** The consent metadata that a paid charge would
  have carried is gone with the ceremony, so this no longer matters for this
  session's work.
- **The Radar block was not populated**, on Jon's instruction, and **the Radar
  rule state could not be read** from a session. Section 6.2.
- **Vercel log retention could not be read.** 403 on the project. Section 6.3.
- **Nothing was deployed and nothing was pushed.** The live site still carries the
  two false payment sentences until Jon deploys.
- **Nothing here is legal advice and nobody in this session is a lawyer.**
