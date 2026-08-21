# The terms reconciled with real money, and the consent ceremony at checkout — 22 August 2026

**What this is.** Four jobs, all applied: the two false sentences in the live
terms fixed, a consent step built between the pricing page and Stripe, the
currency and the statutory cancellation right stated on the pricing page, and
a real description given to each of the three legal pages.

**Files changed. Nothing else was touched.**

- `apps/web/app/(marketing)/(legal)/terms-of-service/page.tsx`
- `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx` — metadata only
- `apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx` — metadata only
- `apps/web/app/(marketing)/pricing/page.tsx`
- `apps/web/app/(marketing)/pricing/_components/buy-button.tsx`
- `apps/web/app/api/checkout/route.ts`

**Nothing was deployed and nothing was pushed.** The live site still carries the
two false sentences until Jon deploys.

---

## 0. Read this first. Three things the brief assumed that turned out otherwise

**Stated up front because two of them change what someone should do next.**

### 0.1 Part 3 was already done, a day before this session

The brief said the pricing page "deliberately withholds the refund policy". It
does not, and has not since 21 August. `04` entry 113 ruled it on, and the page
already carries it as a trust tile reading **"Our 30 day refund — Unspent
credits go back at the price you paid. We will not ask why."** The page's header
comment was already rewritten to say so.

**The precision the brief was protecting was already protected.** The tile says
"Our", the header comment explains in eleven lines why that word is doing legal
work, and the code comment beside the tile says outright that writing it as
"your right to cancel" would be a false claim in a legal register.

**So Part 3 became a smaller job than briefed**, and what was actually missing is
in section 3 below: the currency, the tax position, and the existence of the
statutory right.

### 0.2 The research note says United Kingdom. The Stripe account says United States

**`legal-research.md` section 9A drafts "an individual trading as un-claude from
the United Kingdom", and its governing-law paragraph names England and Wales.**
**`04` entry 112 records the Stripe account as a US individual**, with
`accountCountry=US`, a US home address for identity, and a Google Voice number.
`stripe-setup.md` notes the business origin country cannot be changed after
activation, and the account is activated.

**Those cannot both be right, and this session did not resolve it.** Nothing was
applied from 9A or 9B, so no false country statement was written anywhere. But
**decision D1 is now blocked on a factual contradiction rather than only on Jon's
preference**, and whoever picks it up needs to settle it before drafting a word.

**It does not undermine Part 2.** The 14 day right belongs to the buyer based on
where the buyer lives, not where the seller sits, and the site sells to the UK
and the EU. A US trader directing a site at those markets is within scope. The
consent wording applied here never asserts where the trader is, deliberately.

**`legal-research.md` section 11 already flagged this**: "The US. No US
consumer-protection, state privacy or FTC analysis was done." That gap is wider
than it looked when it was written.

### 0.3 The third limb of the waiver is NOT fully closed, and the brief said it was

**The brief said the Stripe receipt satisfies the durable-medium requirement and
already exists. Half of that is right.**

The receipt exists and is real. A prior session read one:

    Receipt from Un-Claude
    Un-Claude Starter — 10 credits x 1      $4.99
    If you have any questions, contact us at unclaudeapp@gmail.com

**It is a durable medium. It does not repeat the consent.** The requirement is
confirmation on a durable medium *of the consent and the acknowledgement*, and
Stripe's receipt carries the pack and the price and nothing about immediate
supply. `legal-research.md` 9D saw this and drafted a confirmation email whose
whole point was that one email discharges three duties at once.

**Limbs 1 and 2 are closed and proven below. Limb 3 is partly open.** See
section 5 for the cheapest fix and why this session did not apply it.

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

## 2. Part 2 — the consent ceremony

### 2.1 Why it is required, in plain English

**A UK or EU consumer has 14 days to cancel a distance purchase and get ALL their
money back.** That includes credits they already spent. It is the law rather than
a policy, and **our 30 day refund does not discharge it**, because the two cover
different money: ours covers unspent credits only. Being more generous in one
place does not settle an obligation in another.

**The right is lost only if three things all happen.**

1. The customer expressly consents to the service starting immediately.
2. They acknowledge that this loses them the right to cancel.
3. They get confirmation of both on a durable medium.

**Credits land the instant the payment succeeds, so supply IS immediate whether
or not anyone papered it.** Without the paperwork, every UK and EU buyer keeps a
full 14 day right to a total refund, spent credits included.

### 2.2 What was built

**A dialog between the pack button and Stripe.** The card is untouched: the
button still reads "Purchase now", still receives its `className` unchanged from
the page, and the three cards still measure identically (332px each at 1280px
wide). The consent is a dialog, so nothing in the measured layout moved.

**What the buyer sees**, read out of the live DOM:

> **Buy the Plus pack**
>
> $9.99 for 25 credits. One payment, nothing renews, and the credits never
> expire.
>
> ☐ I want my credits delivered immediately, and I understand that once they are
> delivered I lose my 14 day right to cancel.
>
> Our 30 day refund of unspent credits is a separate thing and this does not
> affect it. **Both are in the terms.**
>
> **[ Pay $9.99 ]**
>
> You pay on Stripe's own page. Your card details never reach us.

**Three properties, each of which is the point rather than a detail.**

- **The box is not pre-ticked.** A pre-ticked box is not consent anywhere.
- **The pay button is dead until it is ticked**, and it renders at 40% opacity so
  it is visibly dead rather than mysteriously unresponsive.
- **The button states the amount.** "Pay $9.99", never "Continue" or "Confirm".
  A button that carries an obligation to pay and hides the figure is the trap
  sitting immediately next to this one.

**The tick does not survive closing the dialog.** Reopening is a fresh decision.

### 2.3 The proof, run rather than asserted

**The security boundary is intact: the browser still sends a pack id and never a
price.** The dialog renders the price for the eyes only, from the same array the
card renders from; the server looks the pack up by id and builds the line item
itself. If the dialog lied about the price the charge would still be correct.

**The route now refuses without the consent flag.** Four requests, as a real
signed-in buyer, against the running application:

    A. no consent field
       {"ok":false,"error":"consent_required"}          http 400

    B. agreedToImmediateSupply: false
       {"ok":false,"error":"consent_required"}          http 400

    C. agreedToImmediateSupply: "true"   (a string)
       {"ok":false,"error":"consent_required"}          http 400

    D. agreedToImmediateSupply: true
       {"ok":true,"url":"https://checkout.stripe.com/c/pay/cs_test_a1yocy39x…"}
                                                        http 200

**Case C matters more than it looks.** A truthy string is what a sloppy client or
a hand-rolled request produces, and accepting it would mean a sale whose consent
record says "accepted" on the strength of a value nobody deliberately set. The
check is `!== true`.

**The consent is written onto the Stripe payment**, read back from Stripe's API
for the session created in case D:

    session       cs_test_a1yocy39xmf710FA1cL2RCw8iRkRgWHmPVplqh4K8jEYQcxkyeYTIsWlDO
    amount_total  999 usd
    metadata      {
      "account_id": "b9c8dcc5-db62-4b4d-98cd-dbc0f2992d81",
      "consent_immediate_supply": "accepted",
      "consent_immediate_supply_at": "2026-08-21T23:07:08.721Z",
      "credits": "25",
      "pack_id": "plus"
    }

**And it is restated on Stripe's own page, above Stripe's own pay button.**
Stripe has no field for this consent — `consent_collection` offers terms of
service and marketing and nothing else — so it is repeated through `custom_text`.
Read out of the live checkout page at `checkout.stripe.com`:

    I agree to Un-Claude's Terms of Service and Privacy Policy

    You asked for your credits to be delivered immediately and confirmed that
    this ends your 14 day right to cancel. Our separate 30 day refund of unspent
    credits still applies.

    [ Pay ]

**So the buyer meets the sentence twice**, once where they tick it and once at
the moment the money leaves.

### 2.4 What was NOT proven, and why

**The charge-level copy of the consent was not proven by a completed payment.**
The route also writes the two consent keys into `payment_intent_data.metadata`,
so that a dispute opened months later still carries the record on the charge
itself. **A PaymentIntent does not exist until the session is paid**, so on the
unpaid session above that field reads `null`. Proving it needs a card typed into
Stripe's form, which is not something this session will do.

**What this means in practice:** the session-level record is proven and the
charge-level record is the same two keys on an object the previous session
already proved flows end to end (`payments-tested.md`, a real purchase crediting
a real account). It is very likely correct and it is not verified. **Whoever runs
the next end-to-end test should read `payment_intent.metadata` off the paid
charge and confirm it.**

**A signed-out visitor ticks the box and then meets a sign-up form.** The button
still always POSTs and lets the server answer "who are you" — 401 signed out, 402
guest — rather than guessing in a cached page. So the tick is discarded with the
request. That is the honest outcome, since no purchase happened and no consent
was needed, but it is one wasted click and it is recorded rather than hidden.

---

## 3. Part 3 — the pricing page

**The refund was already there.** Section 0.1. What was missing is what `9G` asks
for and what a buyer actually needs beside a price.

**Added, as small print under the rule below the four trust tiles:**

> Prices are in US dollars, and the price on the card is the total you pay. We
> add nothing at checkout, no tax and no fee. Separately from our 30 day refund,
> buyers in the UK and the EU have a 14 day legal right to cancel, which ends once
> credits are delivered. **Both are set out in the terms.**

**It is deliberately NOT a fifth trust tile, and that is the precision the brief
asked not to lose.** The four tiles are our promises and they are set in the
grammar of promises. These two sentences are neither: one is what the checkout
arithmetic does, and the other is a right the law gives the buyer that we do not
define and cannot vary. **Putting the statutory right in a trust tile would give
it the grammar of a selling point, and it would then read as "our cancellation
policy" — which is the exact false register `04` entry 113 ruled against.**

**The two are named as two throughout:** "Separately from our 30 day refund" and
"a 14 day legal right". Neither stands in for the other on any surface.

**Still not on the pricing page, and it cannot be:** a visible link to "Who you
are dealing with". That section does not exist in the terms, because there is no
name and no service address to put in it. Decision D1, now also blocked on
section 0.2.

---

## 4. Part 4 — the meta descriptions

**All three legal pages inherited the site-wide description**, so a search result
for `/terms-of-service` described the product rather than the page. Each now has
its own, written in its own page file. **`lib/root-metdata.ts` was not opened**;
it belongs to the SEO session.

Read out of the rendered HTML of the running application:

    /terms-of-service   The agreement behind Un-Claude: what each of the three
                        layers is promised to do, how credits and payment work,
                        and your 14 day right to cancel.                (143)

    /privacy-policy     What Un-Claude does with your text and files. Nothing you
                        submit is kept, the optional rewrite is the only thing
                        that leaves, and here is what we store.         (152)

    /cookie-policy      Un-Claude sets no advertising and no tracking cookies, so
                        there is no consent banner. What is actually set, what it
                        does, and how long it lasts.                    (144)

**All three under 155 characters.** Each describes its own page, and the terms
one keeps the layer split rather than flattening the three into one promise.

---

## 5. Handoffs. Not this session's files, or not this session's call

**5.1 The durable-medium limb. The most important item in this note.**
Section 0.3. Stripe's receipt does not repeat the consent, so limb 3 is partly
open. **The cheapest fix is `invoice_creation` on the Checkout Session with the
consent sentence in `invoice_data.footer`**: Stripe then emails a PDF invoice
carrying our wording, which is a durable medium and needs no mail infrastructure,
of which this project has none. **It was not applied here because it changes what
every customer receives**, which is a product and finance decision belonging to
Jon and to whoever owns the Stripe account, not a wording fix. `9D` drafts the
alternative, a confirmation email that discharges three duties at once.

**5.2 D1 is now blocked on a contradiction, not a preference.** Section 0.2.
United Kingdom in the research note, United States in the Stripe account, and the
country cannot be changed after activation. Settle the fact before drafting 9A or
9B, and note that no US consumer-protection analysis has ever been done.

**5.3 Liability, 9E and 9F, drafted and still unapplied.** "The service is
provided as it is, without warranties of any kind" still stands alone in "What we
can and cannot promise", and `9H` says it should not against a consumer. `9F`'s
suspension sentence, which refunds an unspent balance on suspension and removes
the single most likely chargeback in the product, is also unapplied. **Both were
out of this session's brief and both get more dangerous now money moves.**

**5.4 The model cancellation form.** The CCRs expect one to be made available.
It cannot be written without a trader name and a service address. Same block as
D1. The email route is stated in the terms in the meantime.

**5.5 Sales tax and VAT.** The terms say what the checkout does, which is that it
adds nothing. Whether anything is owed is unanswered and unresearched.

**5.6 Entries for the permanent documents.** Two other sessions are live, so
these are recorded here to be carried across rather than written into shared
files: the UK/US contradiction as an open question with "before any 9A wording"
as its trigger; the consent ceremony and its three limbs as a decision log entry;
and the durable-medium gap as an open question with `invoice_creation` named as
the candidate fix.

---

## 6. Verification

**What was run.**

- `npx tsc --noEmit` across the web app: **exit 0, no output.**
- `npx oxlint` over the three changed directories: **no output.**
- Both changed pages rendered on the running dev server and read end to end. The
  full text of the terms is in section 1.2 above.
- The consent dialog opened and driven at **1280px and at 375px**. At 375 it
  measures 326x366 inside a 375x812 viewport, fits on both axes, and the page
  does not scroll sideways. The pay button reads "Pay $9.99" and is disabled
  until the box is ticked; ticking it enables the button, confirmed by reading
  `aria-checked` and `disabled` off the live elements.
- The three card heights measured identically at 332px, so the layout signed off
  in `04` entry 109 did not move.
- Four real requests against `/api/checkout` as a signed-in buyer, section 2.3.
- The resulting Checkout Session read back from Stripe's API, section 2.3.
- The consent sentence read off the live `checkout.stripe.com` page.
- The three meta descriptions read out of the rendered HTML.

**What was not run, said plainly.**

- **No completed test payment**, so `payment_intent.metadata` is unproven.
  Section 2.4.
- **The live terms were read by curl before the change and are unchanged on the
  live site.** Nothing was deployed and nothing was pushed.
- **Nothing here is legal advice and nobody in this session is a lawyer.** This
  applies drafted wording and builds a mechanism. `legal-research.md` section 8
  still names the items that need a professional, and one of them is this one.
