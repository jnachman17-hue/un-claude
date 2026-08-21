# Stripe, from no account to taking money

**21 August 2026, session 11.** Written for Jon to follow with the Stripe
dashboard open. Every field Stripe asks a US individual for, with the answer
this project should give and why.

**Everything involving Jon's legal name, date of birth, home address, Social
Security number or bank account is his alone. This session never asks for those
and never enters them.**

---

## What is verified here, and what is not

**Verified this session, from Stripe's own documentation and its live
requirements endpoint** (not from memory, not from a content farm):

- The exact field list Stripe requires from a **US individual** taking **card
  payments**. Pulled live from
  `docs.stripe.com/_endpoint/get-requirements-for-setups` with
  `accountCountry=US`, `legalEntityType=individual`,
  `capabilities[0]=card_payments`. The list is in section 2.
- The statement descriptor rules: 5 to 22 characters, Latin only, at least one
  letter, no `< > \ ' " *`, must reflect the business name. Shortened descriptor
  2 to 10 characters.
- Stripe's website checklist, which its reviewers apply.
- That the business origin country **cannot be changed** after a live service is
  activated.

**NOT verified, and stated as unknown rather than guessed:**

- **How long verification takes.** Stripe publishes no timeframe. It did not in
  `03-pricing.md` section 12a either, and still does not.
- **When Stripe escalates from SSN last-4 to a full SSN or a photo ID.** The
  requirements endpoint asks only for `individual.ssn_last_4`. Escalation
  happens when automated checks fail, but Stripe does not publish the trigger.

---

## 1. The website, checked live before anything else

**The handoff said un-claude.com serves an OLD build and that this was a risk
for Stripe's review. Checked, and it is not a problem.** Fetched 21 August 2026:

| Stripe's website checklist item | On un-claude.com today |
|---|---|
| A description of what you're selling | **Yes.** "AI tools mark what they make, invisibly and without telling you. Un-Claude finds those marks and sanitises them." |
| The purchase currency | **Yes.** Prices shown as `$4.99` / `$9.99` / `$24.99`, and the terms say "Prices are in US dollars" |
| Customer service contact, not only a form | **Yes.** `unclaudeapp@gmail.com`, alongside the form |
| Refund policy | **Yes**, inside the terms: 30 days, unspent credits, at the price paid |
| Privacy policy | **Yes** |
| Business address | **No.** Optional. See section 5 |
| Promotion terms | **Weak.** The 2 + 3 free credits are a promotion and the terms do not state their conditions |
| Payment security statement | **No.** See section 6 |
| Card network logos | **No.** Optional |

**The live pricing page already shows Starter $4.99, Plus $9.99, Pro $24.99.** A
reviewer landing on the site today sees a coherent product with prices, terms,
privacy and a contact address. That is the bar.

### The one sentence that must change on the day checkout opens

The live terms say:

> "The service is currently free to use and no payment method is collected."

**That becomes a false statement in a binding legal document the moment the
first card is charged.** `TRACK-1-BILLING.md` names this exact failure and
forbids shipping a payments change without the policy edit in the same commit.

---

## 2. Every field Stripe asks for, and the answer

Pulled live from Stripe's requirements endpoint for a US individual with card
payments. This is the complete set.

### Yours alone. This session never handles these.

| Stripe field | What it is |
|---|---|
| `individual.first_name`, `individual.last_name` | Legal name |
| `individual.dob.day/month/year` | Date of birth |
| `individual.address.line1/city/state/postal_code` | Home address. **PO boxes are refused** |
| `individual.ssn_last_4` | **Last four digits only** at this stage |
| `individual.email`, `individual.phone` | Yours |
| `external_account` | The payout bank account |
| `tos_acceptance.date/ip` | Recorded when you tick Stripe's services agreement |

**`individual.address` cannot be a PO box.** Stripe's own validation note. A
virtual mailbox will not satisfy this field.

### Decided here, with the answer to type

| Stripe field | What to enter | Why |
|---|---|---|
| **Country** | **United States** | **Cannot be changed after activation.** Get it right once |
| **Business type** | **Individual / sole proprietor** | No company exists. Stripe's own support docs confirm a US sole proprietor with no EIN uses their SSN |
| `business_profile.url` | `https://un-claude.com` | Must be publicly accessible, and its content must match the product description below |
| `business_profile.mcc` (industry) | **Software → Software as a service (SaaS)** | Maps to MCC 5734. This is what the product is |
| `business_profile.product_description` | **Section 3** | Minimum 10 characters, must differ from the URL |
| `business_profile.support_phone` | **`310 737 8102`** (Google Voice, set up 21 Aug 2026) | Required field. **Keep the "show on receipts" toggle OFF.** Section 9 |
| `settings.payments.statement_descriptor` | **`UN-CLAUDE.COM`** | 13 characters. Legal, and matches the site |
| Shortened descriptor (prefix) | **`UN-CLAUDE`** | 9 characters, inside the 2 to 10 limit |
| Support email | `unclaudeapp@gmail.com` | Matches the address already on the site |

---

## 3. The product description. The highest-leverage sentence in the process

`03-pricing.md` section 12b established the problem: two descriptions of this
product are both true, and they land differently with a payments risk reviewer.

> A tool that finds and removes hidden metadata, invisible characters and
> provenance data from documents and images.

> A tool that helps you bypass AI detection.

**Lead with the true thing that is also the safe thing.** Not because the second
is false, but because two of the three layers do something provable and
technical that has nothing to do with detection, and that is an unusually strong
honest description most competitors cannot write.

**The description must also match the site**, because Stripe's own validation
note says so: *"Website content should match your business name and product
description."* The site's headline is already in this register.

### Paste this

> Un-Claude is a web tool that removes hidden machine-generated marks from text
> and documents. A customer pastes text or uploads a file; we strip invisible
> Unicode characters, embedded file metadata (EXIF and XMP), and C2PA
> content-credential provenance records, and optionally rewrite the wording. The
> cleaned result is returned in the browser immediately. Customers buy prepaid
> credit packs at $4.99, $9.99 and $24.99 USD; one credit covers 1,000 words of
> text or one file. No customer content is stored after a request completes.

**Every clause is checkable against the site or the code.** The prices are the
live ones, the credit rule is the ratified one (`04` entry 67), and "nothing is
stored" is `_shared.py`'s 5 MB temporary file deleted at end of request
(`03-pricing.md` section 4f).

**What it deliberately does not say:** anything about detectors, detection
scores, or guarantees. Not because those would be forbidden, but because the
rewrite is best-effort and unverifiable (`CLAUDE.md` section 4), and a payments
reviewer reading a guarantee we cannot keep is the worst possible first
impression.

---

## 4. The order to do it in

| # | Step | Who | When |
|---|---|---|---|
| 1 | Create the account at `dashboard.stripe.com/register` | **Jon alone** | First |
| 2 | Turn on 2FA — **passkey or authenticator app, not SMS** | **Jon alone** | Immediately |
| 3 | Business type, country, industry, website, product description | Jon, text from section 3 | With step 1 |
| 4 | Identity: name, DOB, address, SSN last 4 | **Jon alone** | With step 1 |
| 5 | Payout bank account | **Jon alone** | This week |
| 6 | Statement descriptor `UN-CLAUDE.COM`, shortened `UN-CLAUDE` | Jon types, decided here | With step 3 |
| 7 | Support phone number | **Jon alone**, see section 5 | With step 3 |
| 8 | **Everything else is built and tested in the sandbox** | This session | **In parallel. Waits on nothing** |
| 9 | Vercel Pro before the first real sale | **Jon** | Before launch |

**Step 8 is the point.** `03-pricing.md` section 12d: products, prices, checkout,
the webhook, the ledger path, duplicate-delivery handling and refunds can all be
built and proven with test cards before Stripe says a word. **Only the first real
payment waits on verification.**

**Stripe's 2FA guidance, quoted from its own account page:** SMS-based 2FA is
vulnerable to SIM-swapping, so use it only as a last resort. Passkey or
authenticator app.

---

## 5. Two things that catch sole proprietors, raised now rather than in week four

### `business_profile.support_phone` is required, and it becomes public

Stripe's activation page lists, under **Public business information**: *"Support
email address, phone number, and address"* — and says customers see these on
card statements or in Stripe's email receipts.

**So the support phone is not an internal field.** A number is required and it
will be shown to buyers. A free Google Voice number gives a real US number that
is not a personal mobile. **Jon's call, and no purchase is involved.**

### The public support address. ANSWERED, and it cannot be hidden

**Jon asked whether his real address can be kept off the site and off receipts.
The answer is in Stripe's own receipts documentation, under "Support
requirements", and it is not negotiable:**

> "For compliance reasons, some contact information is always required on
> receipts:
> - Legal business name
> - **Customer support address**
> - Customer support email
> - Privacy policy URL"

**So an address WILL appear on every receipt. There is no setting that removes
it.** Anyone who tells you otherwise is guessing.

**THE PHONE IS DIFFERENT, AND THIS SESSION GOT IT WRONG FIRST TIME.** Section 9
said the support phone becomes public. **It does not, unless you let it.** Jon's
own screenshot of the Public details screen, 21 August 2026, shows a toggle
reading **"Show phone number on receipts and invoices", and it is OFF by
default.** The phone is a required FIELD; publishing it is optional. **There is
no equivalent toggle beside the address**, which is exactly why the address is
the harder of the two problems and the phone is nearly a non-problem.

**NOTHING IS EXPOSED UNTIL THERE IS A REAL PAYMENT.** The support address
reaches a human when a receipt is generated, and receipts are generated by
successful live charges. With no live key and no customers, no receipt has ever
been sent. **So this field can be filled in to get past the screen and corrected
later** at Settings -> Business -> Public details. It is on the hard gate in
section 13 so it cannot be forgotten.

**But it does not have to be his home address, because these are two different
fields.**

| Field | Where | Public? | Rules |
|---|---|---|---|
| `individual.address` | Identity verification | **No. Private, KYC only** | **Must be his real home address. PO boxes refused** |
| **Customer support address** | Settings → Business → Business details → **Public details** | **YES. On every receipt** | **A different field. Set it to something that is not his home** |

**The KYC address is unavoidable and that is fine** — it is identity
verification, it is never published, and every payment processor requires it.

**The support address is the one to solve**, and the fix is a mailing address
that is not the house.

**Recommendation: a virtual mailbox from a mail-receiving service** (the UPS
Store, Anytime Mailbox, iPostal1, PostScan Mail and similar). Roughly $10 to $30
a month. It gives a **real street address with a suite number** rather than a PO
box, which reads as a business address and passes validators that reject PO
boxes. A PO box is cheaper and would probably work in this field, but it reads
as less credible on a receipt, and credibility on a receipt is dispute
prevention.

**NOT VERIFIED, and cheap to test:** Stripe publishes the PO-box prohibition for
the KYC address and publishes **no** validation rules for the support address.
So whether a given virtual address is accepted is not something this session can
promise. **Set it, press save, and see.** That is a thirty second test and it
beats any amount of research.

**The bigger option, mentioned once and not pushed:** forming an LLC gives a
business address and an EIN, and keeps the home address out of more places than
this one. It also costs money, adds filings, and has tax consequences.
**That is an accountant's conversation, not this session's**, and nothing about
launching needs it.

---

## 6. Sales tax, and the limit of what this session should say

**Not advice, and not this session's to give.** Two facts and a recommendation:

- **Stripe Tax costs an extra 0.5% per transaction.** On a $4.99 sale that is
  2.5 cents against Stripe's existing 44 cents.
- Whether a US sole proprietor owes sales tax on digital services depends on the
  home state and on economic-nexus thresholds in other states, which are
  volume-based and nowhere near reachable at launch.

**Recommendation: do not enable Stripe Tax at launch.** Revisit it when volume
is real. **If certainty is wanted, that is an accountant's answer, not this
session's.**

---

## 7. What the site still needs, against Stripe's checklist

Three edits, all small, all this session's to make. **The first is not optional.**

1. **The terms' "currently free" sentence.** Section 1. Must ship in the same
   commit as checkout.
2. **A payment security line.** Stripe's checklist asks that customers be told
   their payment details are handled safely. Ours is an unusually clean sentence
   because it is true: card details are entered on Stripe's own page and never
   reach un-claude.com.
3. **Promotion terms for the free credits.** The 2 + 3 free credits are a
   promotion. Stripe's checklist asks that promotion conditions be disclosed. The
   conditions already exist in code — once per account, once per inbox, once per
   guest conversion, no cash value — and are stated nowhere a buyer can read.

**Optional, and worth it:** card network logos on /pricing, which Stripe's
checklist says reduces checkout friction.

---

## 8. The refund policy is already promised, and the pricing page is not taking
credit for it

**A finding, not a proposal.** `04` entry 108 flagged the 30-day refund
(`03-pricing.md` P6) as *"proposed but never ruled"* and deliberately kept it off
/pricing.

**But the live terms of service already promise it**, word for word:

> "Within 30 days of a purchase you may ask for a refund of any credits from it
> that you have not spent, at the price you paid, and we will not ask you why."

**So the policy is already committed in the binding document.** The open question
is not whether to offer it. It is whether the marketing page gets to say the
generous thing the legal page already says.

**Recommendation: put it on /pricing.** A refund costs 56 cents. A dispute costs
about $24.50 (`03-pricing.md` section 4d). Advertising the refund is how a
would-be disputer is turned into a refund request instead.

---

## 9. The support phone, and getting one without publishing a personal mobile

**Two phone fields, and only one of them is public.** Same shape as the address.

| Field | Public? | What to put |
|---|---|---|
| `individual.phone` | **No. KYC only** | His real mobile |
| `business_profile.support_phone` | **YES** | A Google Voice number |

**A Google Voice number is free, takes about five minutes, and gives a real US
number that is not his mobile.** Verified against Google's own setup page.

### The steps

1. **Install the Google Voice app**, or go to `voice.google.com` in a browser.
2. **Sign in with a Google account.** Recommendation: **use the account that
   already owns `unclaudeapp@gmail.com`**, so the business phone and the
   business email live together rather than on a personal account.
3. Accept the terms.
4. **Search for a number by city or area code, and pick one.** Google's own
   note: *"If numbers aren't available, try a nearby city or area code."*
5. **Verify with an existing phone.** Google texts a code to a real number he
   already has. **This is a one-time link, not a redirect** — the Google Voice
   number is what gets published, and his mobile stays private.

**Free for US numbers.** Google does not offer 1-800 numbers, which does not
matter here.

**Why a Google Voice number is safe in THIS field specifically.** Some services
refuse Google Voice numbers when they are being used for SMS identity
verification. `business_profile.support_phone` is **not** a verification field —
it is a published contact number for customers. Stripe verifies identity through
`individual.phone` and the SSN, which stay real.

---

## 10. Is a refund policy actually mandatory for Stripe? ANSWERED

**Jon asked. The answer is in two halves, because two different things were
being conflated.**

### The hard requirement is the PRIVACY policy, not the refund policy

Stripe's receipts documentation lists what is **"always required on receipts"
for compliance reasons**, and a **Privacy policy URL** is on that list. It is a
field in the dashboard and it is printed on every receipt.

**Set it to `https://un-claude.com/privacy-policy`.** The page exists and is
live.

### The refund policy is required in practice, enforced by review rather than by a form field

Stripe's website checklist, quoted from its own page:

> "For most businesses, you must clearly explain your order fulfillment policies
> to your customers... **Refund policy:** Describe the conditions under which
> customers can receive a refund."

and

> "If your website doesn't include sufficient information about your fulfillment
> policies, **we might request that you add it.**"

**So it is not a blocking form field. It is something a reviewer checks, and
asks for if missing.** The exemption Stripe grants — *"Businesses that have no
fulfillment process... don't have to include fulfillment policies"* — is for
in-person services and donations, and **does not cover selling credit packs.**

**It is also a card network rule, not only a Stripe preference.** Visa and
Mastercard both require a merchant to disclose its refund policy to the customer
at the point of sale.

### What this means for un-claude, concretely

**The policy already exists and is already binding** — it is in the live terms of
service, section "Payment, credits and refunds". **Nothing needs writing.**

**What is missing is findability.** A refund policy buried in the middle of a
terms page is not "clearly explained" to a customer deciding whether to buy, and
it is not what a reviewer scanning the site will find.

**Three things fix it**, and Jon has already ruled on the first:

1. **Put it on /pricing** as its own line. Ruled by Jon, 21 August 2026. See
   `04` entry 113 for the wording constraint, which matters.
2. **A footer link** so it is reachable from every page.
3. **The checkout page itself** carries the statutory right separately. Section 11.

---

## 11. The refund policy and the statutory right are two different things

**Jon's correction, 21 August 2026, and it is the most important sentence in
this file for the copy.**

**These are not the same thing and the page must not blur them:**

| | What it is | What it covers |
|---|---|---|
| **Our 30 day refund** | **A voluntary policy** we chose | **Unspent credits only**, at the price paid |
| **The UK/EU right of withdrawal** | **A statutory right**, not ours to define | **Everything, including credits already spent** |

**Presenting the voluntary policy as "your right to cancel" would be a false
claim in a legal register** — and it is exactly the class of error `CLAUDE.md`
section 7 exists to catch, a sentence true of one thing written as though true
of another.

**So they are carried in two different places:**

- **/pricing describes OUR POLICY**, in our words, as a policy.
- **The checkout consent wording carries the STATUTORY RIGHT**, separately.

**One number correction, also Jon's.** `03-pricing.md`'s "a refund costs $0.561"
is modelled on a **$9 pack that no longer exists**. It transfers almost exactly
to the $9.99 Plus pack, so **the conclusion holds and the argument is sound**,
but the figure must not be quoted as though it were measured against the real
prices. **The honest version of the argument is the ratio, not the cents: a
refund costs under a dollar and a dispute costs about $24.50.**

---

## 12. The code side. Built 21 August 2026, waiting on two things from Jon

**Everything below is written, typechecks clean, and is proven as far as it can
be proven without a Stripe account.** `04` entry 112.

### What was built

| File | What it does |
|---|---|
| `lib/server/stripe.ts` | The Stripe client, and the pack lookup. **The browser sends a pack ID, never a price** |
| `app/api/checkout/route.ts` | Opens a Stripe-hosted payment page. Refuses guests and signed-out visitors |
| `app/api/stripe/webhook/route.ts` | **The only thing that grants paid credits.** Signature-checked |
| `lib/server/credits.ts` | `recordPurchase`, `refundPurchase`, `purchaseByPaymentIntent` |
| `supabase/migrations/20260821150000_stripe_purchases.sql` | Second anti-double-pay index, and the refund function |
| `pricing/_components/buy-button.tsx` | The three "Purchase now" buttons, now real |
| `home/_components/purchase-banner.tsx` | The post-payment confirmation on the wallet |
| `scripts/verify-stripe-webhook.mjs` | **Proves a forged webhook cannot mint credits** |
| `scripts/stripe-refund-check.mjs` | **Run before refunding anyone.** Shows what is actually unspent |

**No Stripe Products or Prices need creating in the dashboard.** Checkout builds
the line item from `pricing-data.ts`, so the price on the page and the price on
the card are the same number from the same file and cannot drift apart. The cost
is that changing a price means a deploy, which for this product is the right
cost.

### The two things Jon has to do

**1. Paste the migration.** `20260821150000_stripe_purchases.sql`, in the
Supabase SQL editor, exactly like the others. Comment delimiters are balanced —
checked with the counts from `migrations-applied.md`.

**2. Add the test keys.** From the Stripe dashboard with **test mode ON** (the
toggle at the top). They exist the moment the account exists and do **not** wait
for verification.

Add to `apps/web/.env.local`:

    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...

**`sk_test_` is a test key and cannot move real money.** The `whsec_` value comes
from the `stripe listen` command in the next section, which prints it.

**Never commit either.** `.env.local` is already gitignored.

### The end-to-end test, once those two are done

Three terminals.

    # 1. the app
    pnpm --filter web dev

    # 2. forward Stripe's webhooks to it, and print the signing secret
    stripe listen --forward-to localhost:3000/api/stripe/webhook

    # 3. watch the ledger
    cd apps/web/scripts && node read-ledger.mjs 20

Then sign in, press **Purchase now**, and pay with Stripe's test card
**4242 4242 4242 4242**, any future expiry, any CVC, any postcode.

**FIRST, READ AN ACTUAL RECEIPT. Added 21 August 2026 because Jon asked the
right question and the honest answer was "look rather than reason".**

He asked whether his real name reaches customers. **Stripe's receipts
documentation lists "Legal business name" among the things always required on a
receipt, and for a SOLE PROPRIETOR WITH NO COMPANY the legal business name can
default to the person's own name.** Everything else that reaches a customer is
the DBA ("Un-Claude"), the statement descriptor, the support address and the
support email — none of which carry his name.

**So there is one plausible path by which his personal name lands on a
customer's receipt, and it is checkable in a minute rather than arguable.**
After the first test payment, send yourself the receipt:

    Transactions -> Payments -> the test payment -> Receipt history
    -> the ... menu -> Send receipt

**Read it. If his legal name is on it, the DBA is not set correctly** and it is
fixed in Settings -> Business -> Public details before anything goes live.
CLAUDE.md section 4: show the artefact, do not reason about it.

**Then, what proves the purchase worked, in order:**

1. `stripe listen` prints `checkout.session.completed`.
2. The server log prints `PURCHASE: 25 credits to ...`.
3. **A new `purchase` row appears in `read-ledger.mjs`** with the right delta.
4. The wallet shows the new balance.

**Then prove it cannot pay twice**, which is the part that matters most:

    stripe events resend evt_...      # the event id from step 1

**The ledger must not gain a second row.** The server should log
`already recorded — repeat delivery`. Stripe delivers at least once, so this is
not a hypothetical.

**Then prove the refund path:**

    cd apps/web && node scripts/stripe-refund-check.mjs pi_...

Refund the payment in the Stripe dashboard, and a `money_refund` row should
appear taking the credits back.

### Proven already, without an account

**`node scripts/verify-stripe-webhook.mjs` — all 6 cases pass.** A genuine
signature is accepted; a missing one, an invented one, **a real signature over a
tampered body**, one made with the wrong secret, and one replayed a day later
are all refused. **This is the whole defence of a public URL that grants
credits**, so it is tested rather than asserted.

**The pricing page was measured at 390px after the change**: cards 315, 319 and
319px, tier three at y=1393, buttons 49px, `scrollWidth` 390 with no horizontal
overflow, no console errors. **Identical to the numbers `04` entry 109 signed
off**, so wiring the buttons moved nothing.

---

## 13. THE GATE BEFORE THE FIRST REAL PAYMENT

**A conflict, surfaced rather than resolved quietly, per `CLAUDE.md` section 2.**

`TRACK-1-BILLING.md` says: *"Do not ship a payments change without the policy
edits in the SAME commit."* **Jon deferred the privacy and terms reconciliation
until after Stripe setup**, and his instruction outranks the document.

**Both can be true, because shipping the code is not the same as charging
anybody.** The test keys cannot move real money. So:

**HARD GATE: the live key (`sk_live_`) must not be set until the terms are
reconciled.** Specifically, the live terms still say:

> "The service is currently free to use and no payment method is collected."

**The first real charge makes that a false statement in a binding legal
document.** Three edits are queued for the reconciliation pass, all in section 7:
that sentence, a payment-security line, and the free-credit promotion terms.

**Nothing about the test-mode build is blocked by this. Only the live key is.**

### The full gate list, everything that must be true before `sk_live_` is set

| # | Must be true | Why |
|---|---|---|
| 1 | The terms no longer say the service is free | A false statement in a binding document the moment a card is charged |
| 2 | **The customer support address is NOT Jon's home address** | It prints on every receipt. Section 5. Virtual mailbox |
| 3 | The privacy policy URL is set in the Stripe dashboard | Stripe requires it on receipts |
| 4 | A payment security line is on the site | Stripe's website checklist |
| 5 | The free-credit promotion terms are stated | Stripe's website checklist |
| 6 | Vercel is on Pro | Hobby forbids commercial use |
| 7 | The end-to-end test in section 12 has passed **including the double-delivery check** | Stripe delivers at least once |
| 8 | **A real test receipt has been read, and Jon's legal name is not on it** | Sole proprietors have no separate legal entity, so the "legal business name" can default to the person. Section 12 |
| 9 | **Customer emails toggled ON** for successful payments and refunds | A paying customer who receives no receipt is a dispute waiting to happen. Section 15 |
| 10 | Support email and privacy policy URL set in Public details | Stripe lists both as always required on receipts. Section 15 |


---

## 14. The virtual mailbox. Options priced live, 21 August 2026

**Pulled from Anytime Mailbox's own location search this session, not from
memory.** Prices are "starting from" the entry tier, which is the right tier:
this address exists to be printed on a receipt, and inbound mail volume will be
close to zero.

| Distance | Location | Address | From |
|---|---|---|---|
| **1.0 mi** | **Redondo Beach** | **1732 Aviation Blvd, Redondo Beach, CA 90278** | **$14.99/mo** |
| 3.0 mi | Torrance - Hawthorne Blvd | 21213 Hawthorne Blvd, Torrance, CA 90503 | $14.99/mo |
| 4.6 mi | Torrance - Sepulveda Blvd | 2768 Sepulveda Blvd, Torrance, CA 90505 | **$9.99/mo** |
| 5.6 mi | Torrance - Crenshaw Blvd | 24325 Crenshaw Blvd, Torrance, CA 90505 | $9.99/mo |
| 7.8 mi | Harbor City - Palos Verdes Dr | 1724 Palos Verdes Dr N, Harbor City, CA 90710 | $9.99/mo |

**Recommended: Redondo Beach, 1.0 miles, $14.99.** Walkable if a package ever
needs collecting, and **a South Bay service address is coherent with a South Bay
business.** That coherence is dispute prevention: an address that does not match
the story the rest of the receipt tells is what makes a confused customer call
their bank instead of the support email.

### IT IS FULLY ONLINE. No visit anywhere

**Confirmed on Anytime Mailbox's own Form 1583 page, 21 August 2026**, because
an earlier version of this file implied a trip was needed.

**THE CONFUSION WORTH KILLING:** walking into a UPS Store and renting a box
directly DOES need an in-person visit with ID. **Going through a virtual mailbox
platform does not**, even when the physical location behind the address is a
shop of exactly that kind. Same building, different process.

| Step | Where |
|---|---|
| Choose location and plan | Online |
| Fill in Form 1583 | Online wizard |
| **Notarise it** | **"Use Online Notary" — a video call. Their partners run 24/7** |
| Send the form and IDs in | **Nothing to do.** Quoting them: *"you don't have to submit your form and IDs. They will be automatically forwarded to us by our notary partners"* |

**Needed at the desk:** a webcam or a phone that does video calls, plus the two
IDs below. A driver's licence satisfies both.

**A ONE-OFF NOTARY FEE sits on top of the monthly plan.** Anytime Mailbox calls
it a "nominal fee" and **does not publish the figure.** Around $25 is what
secondary sources say. **Not verified — the real number appears at checkout.**

### What activation actually requires

**USPS Form 1583, notarised.** A legal requirement on the mail-receiving agency,
not a company policy, and it cannot be skipped.

**Two forms of ID, both current:**

- **One photo ID:** driver's licence, state ID, passport, permanent resident
  card, military ID, university ID, or NEXUS card.
- **One address ID:** driver's licence, state ID, lease, insurance policy, voter
  registration, vehicle registration, mortgage, or deed.
- **Social Security cards, credit cards and birth certificates are refused.**

**Take the online notary option** offered during signup: a webcam session,
about fifteen minutes, form filled in automatically.

**Timing: typically one to three business days** from notarisation to an active
mailbox. *(From secondary sources rather than from a single authoritative page.
Treat as a working expectation, not a promise.)*

**Use the full address including the PMB or suite number** in Stripe. The unit
number is what makes it Jon's address rather than the store's.

**NOT AN EXHAUSTIVE COMPARISON, stated plainly.** Anytime Mailbox was queried
because its location search could be read directly. **iPostal1 is the main
alternative at comparable prices and would be equally fine.** There is no
evidence here for preferring one over the other beyond these specific addresses
and prices being verified to exist today.


---

## 15. What Jon actually submitted, reviewed 21 August 2026

**Submitted and correct:** website `https://un-claude.com`, public business name
**Un-Claude**, category **Software as a service**, KYC address his home (private),
support phone the Google Voice number with **"show on receipts" OFF**, 2FA on,
Radar Lite on (free), Climate off.

**Support address: `1732 Aviation Blvd, Unit #1643, Redondo Beach, CA 90278`** —
the Anytime Mailbox Redondo Beach location from section 14, with its unit number.
**NOT YET HELD: the Form 1583 and notary step was not done before submitting.**
Jon proceeded knowingly. **Gate item 2 stays OPEN until the mailbox is active.**

### Four corrections raised at submission

| # | Item | Was | Should be | Why |
|---|---|---|---|---|
| 1 | **Support email** | **absent** | `unclaudeapp@gmail.com` | **Required on receipts.** The representative email is `jnachman17@gmail.com`, which is KYC and stays private — it must not be the customer-facing one |
| 2 | **Privacy policy URL** | **absent** | `https://un-claude.com/privacy-policy` | **Required on receipts** |
| 3 | Statement descriptor | `UN-CLAUDE` | **`UN-CLAUDE.COM`** | Both legal. The URL form lets a customer squinting at a statement TYPE IT IN and find the site. An unrecognised descriptor is a leading cause of disputes, at about $24.50 each |
| 4 | Support address city | `Redondo beach` | `Redondo Beach` | Cosmetic, but it prints on every receipt |

All four are editable at Settings -> Business -> Public details, so none blocked
submission.

**IMPORTANT CORRECTION, from Jon at the screen:** items 1 and 2 are **NOT asked
for anywhere in the activation wizard.** The wizard collects only what Stripe
needs to VERIFY the business. **The receipt fields live in account settings,
reachable only after submitting.** The only email the wizard asks for is the
**account representative** email under Management and ownership, which is KYC,
stays private, and is correctly his real address.

### The three settings screens to visit after activation

| Screen | Set |
|---|---|
| **Settings -> Business -> Business details -> Public details** | Support email `unclaudeapp@gmail.com`, privacy policy URL `https://un-claude.com/privacy-policy`, fix the city capitalisation |
| **Settings -> Business -> Business details** | Statement descriptor -> `UN-CLAUDE.COM` |
| **Settings -> Business -> Customer emails** | **Toggle "Successful payments" and "Refunds" ON** |

**THE CUSTOMER EMAILS TOGGLE IS THE ONE NOBODY WOULD THINK TO LOOK FOR, and it
matters most.** Stripe presents automatic receipts as something you switch on.
**If it is off, a paying customer receives NOTHING.** An unfamiliar line on a
card statement plus an empty inbox is close to ideal conditions for a dispute,
and a dispute costs about $24.50 against a $4.99 sale.

**Not verified:** whether Stripe hard-blocks receipts when the support email or
privacy policy URL are missing, or merely sends a poorer receipt. The docs say
"required" without saying what absence does. Setting them makes the question
moot.

### A CORRECTION TO THIS FILE'S OWN ADVICE: Stripe Tax stays ON

**Section 6 recommended NOT enabling Stripe Tax at launch, on the grounds that it
costs 0.5% per transaction. That was wrong for this case**, and Stripe's own
dashboard wording is the correction:

> "You'll be charged only for the locations where you have a registration."

**With no registrations there is no charge.** What it provides instead is **free
monitoring of economic-nexus thresholds** — early warning of the point where
sales tax would actually be owed somewhere. That is worth having and costs
nothing. **Leave it on.**

**The thing to be careful about is REGISTERING**, not monitoring. Registering in
a state is what begins both the billing and the filing obligations, and it is an
accountant's decision rather than a prompt to click through.

---

## 16. GOING LIVE. The exact sequence, when the gate clears

**Written 21 August 2026, session 11, after the payment path was tested end to
end.** `payments-tested.md` has the proof. **Do not start this until section 13's
gate is clear.**

### Where things actually stand

| | |
|---|---|
| Stripe account | **ACTIVATED.** `charges_enabled: true`, `payouts_enabled: true`, nothing outstanding |
| Statement descriptor | `UN-CLAUDE.COM` |
| Production Stripe keys | **NONE SET.** Checkout on the live site returns 503 and cannot take money |
| The payment code | Tested end to end in test mode, including refunds, disputes and repeat deliveries |

**Production carrying no Stripe variables is the correct state**, not an
oversight. It means the live site physically cannot charge anyone while the
legal text still says the service is free.

### Step 1 — the live secret key

Stripe dashboard with **test mode OFF**, Developers -> API keys -> reveal the
live secret key (`sk_live_`).

**IT NEVER GOES IN A FILE AND NEVER GOES IN CHAT.** It goes straight into
Vercel:

    vercel env add STRIPE_SECRET_KEY production

Paste when prompted. **`.env.local` keeps only the `sk_test_` key**, so a
developer machine can never charge a real card.

### Step 2 — the production webhook endpoint

**This is the step most likely to be forgotten, and it is the one that decides
whether paid credits arrive at all.** `stripe listen` only ever forwarded to
localhost; production needs its own endpoint.

Stripe dashboard, **live mode**, Developers -> Webhooks -> Add endpoint:

| Field | Value |
|---|---|
| Endpoint URL | `https://un-claude.com/api/stripe/webhook` |
| Events | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed` |

**All six.** Sending fewer is how a refund silently fails to remove credits.

Then reveal that endpoint's **signing secret** (`whsec_`) and:

    vercel env add STRIPE_WEBHOOK_SECRET production

**The production signing secret is DIFFERENT from the `stripe listen` one.**
Reusing the local value means every real webhook fails its signature check, and
every paid customer receives nothing.

### Step 3 — deploy, then verify against production

    vercel --prod

Then, before telling anyone:

1. **Buy the Starter pack yourself, with a real card.** $4.99. It is the only
   way to prove the live path.
2. **Check the ledger:** `cd apps/web/scripts && node read-ledger.mjs 5` — one
   `purchase` row, correct credits.
3. **Check Stripe's webhook log** shows `200` for `checkout.session.completed`.
4. **Refund yourself** in the dashboard and confirm the credits come back off.
5. **Read the receipt** that arrives in the inbox.

**Then re-run `node scripts/verify-guest-merge.mjs`.** It is cheap and it
catches anything that disturbed the ledger's invariants.

### What NOT to do

- **Do not set `STRIPE_SECRET_KEY` in Preview.** Preview deployments would then
  take real money from anyone who found the URL.
- **Do not put the live key in `.env.local`, `.env`, or any committed file.**
- **Do not skip the double-delivery check on production.** It is the one
  guarantee Stripe explicitly gives you that will be tested by reality.


---

## 17. Vercel Hobby vs Pro. ANSWERED from Vercel's own policy pages

**Jon asked, 21 August 2026: "will my thing break down if I start getting
purchases, or can I default and then purchase a Pro plan if this site actually
gets traction?"** Quoted from Vercel's fair-use guidelines and their
account-pause support page rather than from memory.

### Nothing breaks mechanically

**Vercel has no connection to Stripe.** The first sale trips no wire and sends
no signal; the code does not know what plan it is on. There is no technical
failure mode at sale number one.

### The enforcement is a PAUSED DEPLOYMENT — the whole site offline

Vercel's support page: when commercial activity is found on a Hobby account,
**"the deployment gets paused"**, and **"Vercel emails you with the specifics and
the steps to resolve it."** Resuming requires upgrading.

Their fair-use page adds that they aim to reach out first, but
**"Vercel attempts to provide notice before enforcing limits, though this isn't
guaranteed in all cases."**

### THE SITE IS ARGUABLY ALREADY IN VIOLATION, BEFORE ANY SALE

Vercel's definition of commercial usage, quoted:

> "Commercial usage is defined as any Deployment that is used for the purpose of
> financial gain... Examples include, but are not limited to:
> - Any method of requesting or processing payment from visitors of the site
> - **Advertising the sale of a product or service**"

**/pricing advertises three packs at $4.99, $9.99 and $24.99 today.** The
trigger is the shop window, not the till.

### Usage limits are not the constraint

Hobby: 100 GB Fast Data Transfer, 1M function invocations, 4 CPU-hours,
360 GB-hours of memory per month. **Nowhere near reachable at launch volume**,
which matches `03-pricing.md` section 4e.

### RULING RECOMMENDED: upgrade as part of going live, not after traction

**The argument is the cost asymmetry, not the rules.** A pause takes the site
offline at exactly the moment there are paying customers holding credits they
cannot spend. Those become refund requests, and the ones who do not email
instead call their bank. **One dispute costs about $24.50 — more than a month of
Pro. A single pause event costs more than a year of it.**

Pro is $20/month; break-even is roughly three Starter sales. **Deferring saves
$20 against a risk of total outage with customers' money already taken.**

**Gate item 6 stands.**
