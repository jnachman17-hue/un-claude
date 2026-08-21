MODEL: Opus 5, high effort. Legal precision and the claims boundary.

You are reconciling the terms with the fact that un-claude.com is about
to take real money, and building the consent ceremony at checkout.

READ FIRST, IN THIS ORDER
1. CLAUDE.md in full. Section 4 (a run, not an assertion), section 5
   (stop and ask), section 7 (before you write a word a visitor reads).
2. docs/session-notes/legal-research.md sections 9A-9H. This is your
   source text. It is drafted and unapplied.
3. docs/session-notes/legal-reconciliation.md for what was already
   reconciled and why.
4. The unclaude-messaging skill fires automatically on copy work. Let it.

TERRITORY: apps/web/app/(marketing)/(legal)/**, the pricing page and its
_components, apps/web/app/(marketing)/pricing/_components/buy-button.tsx,
and apps/web/app/api/checkout/route.ts.

DO NOT TOUCH: apps/web/engine/**, apps/web/api/*.py, the workbench,
apps/web/lib/root-metdata.ts, apps/web/app/layout.tsx, or
docs/LAUNCH-CHECKLIST.md. Other sessions hold those right now.

═══ PART 1 — THE FALSE SENTENCE. Do this first. ═══
The live terms say, today, verified by curl:

  "The service is currently free to use and no payment method is
   collected."
  "Credit packs and their prices are announced on the pricing page and go
   on sale when card checkout opens."

Both become false statements in a binding legal document the moment the
first charge lands. Move the payment sections from future tense to
present tense. Also add the payment-security line Stripe's website
checklist wants, and terms covering the 2+3 free-credit promotion.

Prices come from pricing-data.ts. Never hardcode a price anywhere.

JON APPROVES THE WORDING BEFORE IT SHIPS. Show him the before and the
after, in full, as plain text he can read. Do not paraphrase it for him.

═══ PART 2 — THE CHECKOUT CONSENT CEREMONY ═══
This is a legal requirement, not a nicety, and it is cheap now and
expensive to retrofit.

The existing 30-day unspent-credit refund does NOT satisfy the UK/EU
statutory withdrawal right, and being more generous does not fix it: the
statutory right refunds everything, including credits already spent. It
is lost only if all three of these happen:

  1. The customer expressly consents to immediate supply.
  2. They acknowledge losing the right.
  3. They get confirmation on a durable medium -- the Stripe receipt
     satisfies this and already exists.

So: one checkbox at checkout, and a pay button that states the amount
("Pay $9.99", never "Continue"). Read buy-button.tsx and the checkout
route before designing it -- the browser sends a pack id, never a price,
and that must stay true.

═══ PART 3 — THE REFUND ON THE PRICING PAGE ═══
The pricing page deliberately withholds the refund policy, with a header
comment explaining that 03-pricing.md P6 proposed it and entry 67 never
ratified it. That caution is overtaken: the live terms already promise it
word for word, so you are committed in the binding document already.

The economics: a refund costs about $0.56, a dispute about $24.50.
Advertising the refund turns a would-be disputer into a refund request.

ONE PRECISION THAT MUST NOT BE LOST. This voluntary policy is NOT the
statutory cancellation right. If the page presents it as "your right to
cancel" that is a false claim, in exactly the register this project is
careful about everywhere else. They coexist as two different things.

═══ PART 4 — THE LEGAL PAGES' META DESCRIPTIONS ═══
All three legal pages inherit the site-wide description, so Google is
told that /terms-of-service is "Scan text and files free for hidden AI
watermarks...". Give each of the three its own description under 155
characters describing that page. An SEO session owns root-metdata.ts, so
do this in the pages' own metadata exports only.

═══ FINISHING ═══
Jon is not a programmer and cannot check this by reading code. Every
claim needs the real artefact -- the actual wording, in full, pasted in.
A step you skipped is a step that failed; say which.

Write docs/session-notes/legal-applied-stripe.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed -- sessions share one git index. Never
`git add -A`, `git add .` or `git commit -a`. Do NOT deploy. Do NOT push.
