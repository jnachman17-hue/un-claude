# Email and analytics — 24 August 2026

Two jobs. The support address moved to the domain, and the funnel was extended
past the paywall to the money.

---

## ★ WHAT DID NOT WORK, FIRST

**The "your credits are taking longer than usual" banner cannot appear. It is a
pre-existing defect, not something this session caused, and it is the one thing
here that touches a paying customer at a bad moment.**

It is one of the five places the support address was changed. The address in it
is now correct in the source and correct in the compiled bundle — but no
customer can ever read it, because the branch never runs.

**What happens instead.** A buyer whose credits are slow sits on *"Payment
received. Adding your credits now…"* indefinitely. The banner is supposed to
try ten times over about fifteen seconds and then say "refresh, and if they are
still missing, email us". It tries **once** and then stops forever.

**Why.** `purchase-banner.tsx` schedules its retry inside a React effect whose
dependency list is `[status, purchaseLanded, gaveUp, router]`. Calling
`router.refresh()` does not change any of those four, so the effect does not run
again, so no second timer is ever scheduled. The counter reaches 1 and stops.
The comment in the file — *"this re-runs when refresh() produces a new render"* —
is describing behaviour React does not have.

**Measured, not reasoned.** Driving `/dev/purchase?purchase=success&landed=0`,
the network log after the page load shows exactly one refresh and then silence
for over a minute:

```
GET /dev/purchase?purchase=success&landed=0                    200   <- the page load
GET /dev/purchase?purchase=success&landed=0&_rsc=g_fzPFfsK...   200   <- attempt 1
(nothing further, 60+ seconds)
```

and the banner text never moved off `Payment received. Adding your credits now…`.

**It was NOT fixed here, deliberately.** The fix is small — the retry needs a
counter React can see, so a state value rather than a ref. But it changes
behaviour on the live payment return path, this session was told not to deploy,
and there is no way to rehearse it against a real Stripe webhook from here. It
is Jon's call, and it is one line of work once he says go.

---

## ★ WHAT WAS ADDED BEYOND THE BRIEF, AND WHY

The brief asked for three events. **Five were added.** The two extra ones cost
nothing and the funnel does not answer its question without them.

| Event | Asked for? | Why |
|---|---|---|
| `checkout_started` | Yes | — |
| `checkout_failed` | Yes | — |
| `purchase_completed` | Yes | — |
| **`checkout_account_required`** | **No, added** | 401 and 402 are the ordinary outcome for anyone who finds /pricing before making an account, which is most people. Filed under `checkout_failed` it would bury real breakage under normal traffic. Left unrecorded, `checkout_started` looks like it leaks customers who were in fact handed to the sign-up form on purpose |
| **`purchase_cancelled`** | **No, added** | Without it, everyone who did not buy looks alike. Somebody who never reached Stripe is a broken button; somebody who reached it and backed out is a price. Different problems, opposite fixes |

---

## ★ THE THING THAT BREAKS THE FUNNEL, AND IT CANNOT BE FIXED WITHOUT JON

**`checkout_started` and `purchase_completed` are two honest numbers that
PostHog cannot join into one funnel.** They are not two halves of a journey it
can follow. This is not a bug in the events; it is the site's cookieless
setting doing exactly what it was chosen to do.

Analytics here stores nothing on the visitor's device (`persistence: 'memory'`),
so the id identifying a visitor lives in a variable and dies when the page does.
A buyer clicks Purchase now on /pricing, **leaves this site for stripe.com**,
pays, and comes back through a completely fresh page load. Whoever comes back is
a new person as far as PostHog is concerned.

It is the same wall that killed `signup_completed` — the same reason, recorded
in `07`, "Cookieless has an identity boundary".

**So the funnel below is five steps, not six.** The sixth is a number read
beside it, not a step inside it. Building it as six steps produces a chart that
looks like 100% of buyers abandon at the last moment, which is false and is the
kind of number somebody acts on.

**Do not close the gap with `posthog.identify()`.** It would not work — the
anonymous id was already gone before the account was known — and it would put a
real person into the analytics record, which is a change to the privacy policy
and the cookie policy and a consent banner on the site. That is a policy
decision and it is Jon's, not a session's. It is written into the header of
`lib/analytics/events.ts` so nobody reaches for it believing it is a quick fix.

---

## 1. The support address

`support@un-claude.com` replaces `unclaudeapp@gmail.com` in five places, four
files. Confirmed rendering on the running site, not just changed in the source.

| Where | What a visitor sees |
|---|---|
| `app/home/_components/purchase-banner.tsx:110` | The "credits have not arrived" fallback. **Ships in the bundle, unreachable — see above** |
| `app/(marketing)/_components/contact-form.tsx:32` | `CONTACT_EMAIL`. Both the mailto the button builds and the plain address beside it |
| `app/(marketing)/pricing/page.tsx:264` | The refund FAQ |
| `app/(marketing)/(legal)/_components/legal.tsx:119` | The `mailto:` href on every legal page |
| `app/(marketing)/(legal)/_components/legal.tsx:122` | The visible label on the same link |

**Counted on the running pages, old against new:**

```
/privacy-policy      old 0    new 3    mailto:support@un-claude.com
/cookie-policy       old 0    new 3    mailto:support@un-claude.com
/terms-of-service    old 0    new 9    mailto:support@un-claude.com
/pricing             old 0    new 2
/contact             old 0    new 1    mailto:support@un-claude.com
```

The contact form's button, with a subject and message typed in, builds:

```
mailto:support@un-claude.com?subject=A%20question%20about%20a%20scan&body=Hello%2C%20is%20this%20thing%20on%3F
```

**A repo-wide search finds no remaining `unclaudeapp@gmail.com` in any code
file.** What remains is in `docs/`, and it stays there: those are records of
what was decided when, and editing them would make the history lie.

### Stripe still says the old address, and this session did not touch it

Receipts carry `unclaudeapp@gmail.com`. That is a **dashboard setting, not
code** — Settings → Business → Business details → Public details. Both
addresses reach Jon, so nothing is broken, but a receipt and a website
disagreeing is the kind of small wrongness that makes a customer wonder. **Jon's
to change, one field.**

---

## 2. The events

Everything below is the **real payload**, read out of the browser at the moment
the code sent it.

### `checkout_started` — the button was pressed

```json
{ "event": "checkout_started", "properties": { "pack_id": "plus" } }
```

**The price is never sent.** `pricing-data.ts` decides what a pack costs and
Stripe charges it. A browser sending a number about money is the boundary this
product refuses to cross, and an analytics event is still a browser. The pack id
maps to a price in one place, and that place is the one allowed to know.

### `checkout_failed` — it did not reach Stripe, and something was wrong

All four causes, driven by making the checkout route answer with each status the
button handles:

```json
{ "event": "checkout_failed", "properties": { "pack_id": "starter", "reason": "rate_limited" } }
{ "event": "checkout_failed", "properties": { "pack_id": "plus",    "reason": "unavailable"  } }
{ "event": "checkout_failed", "properties": { "pack_id": "pro",     "reason": "error"        } }
{ "event": "checkout_failed", "properties": { "pack_id": "starter", "reason": "unreachable"  } }
```

`rate_limited` is 429, `unavailable` is 503 (Stripe configured but not
answering), `error` is any other bad reply, `unreachable` is the request never
landing at all. The route's own message is **not** sent, for the same reason
`sanitise_failed` does not send the engine's: a fixed list of causes cannot grow
a filename in it later.

### `checkout_account_required` — it did not reach Stripe, and nothing was wrong

Both branches. The first came from a **real mouse click on the real button** on
a signed-out local run, no faking of any kind:

```json
{ "event": "checkout_started",           "properties": { "pack_id": "plus" } }
{ "event": "checkout_account_required",  "properties": { "pack_id": "plus", "state": "signed_out" } }
```

and the guest branch, with the route answering 402:

```json
{ "event": "checkout_started",           "properties": { "pack_id": "pro" } }
{ "event": "checkout_account_required",  "properties": { "pack_id": "pro", "state": "guest" } }
```

`signed_out` is nobody signed in. `guest` is the anonymous identity the tool
hands out on arrival. Both go to sign-up. **`state` is a session class, not an
identity** — the same two words for everybody.

### `purchase_completed` — the card cleared

```json
{ "event": "purchase_completed", "properties": { "credits_ready": true  } }
{ "event": "purchase_completed", "properties": { "credits_ready": false } }
```

**It fires on arrival, not on the credits landing.** Stripe only sends a buyer
to the success return once the card has cleared, so the payment is already a
fact. Waiting for the credits would turn a purchase count into a measurement of
webhook latency and would silently drop every purchase whose webhook was slow —
which is exactly the population worth knowing about.

`credits_ready` carries that race instead. **False means a paying customer
looked at their old balance**, which is an operational alarm, not a marketing
number.

**It fires once.** The banner re-renders up to ten times while it polls, and a
purchase counted ten times is worse than one not counted at all. Proved by
sitting through five poll cycles: `firedTimes: 1`.

### `purchase_cancelled` — they reached Stripe and backed out

```json
{ "event": "purchase_cancelled", "properties": null }
```

**No pack id on either purchase event**, because the wallet does not know it —
the return URL carries `?purchase=success` and nothing else. Which pack sold is
a Stripe question, and Stripe answers it with the money attached.

---

## 3. Is there any personal data in any of it?

**No.** Every property, every value, from the runs above:

| Property | Every value it can take | What it is |
|---|---|---|
| `pack_id` | `starter`, `plus`, `pro`, `other` | Which of three packs |
| `reason` | `rate_limited`, `unavailable`, `error`, `unreachable` | Which of four failures |
| `state` | `signed_out`, `guest` | Which of two doors |
| `credits_ready` | `true`, `false` | Did the webhook win the race |

No email, no name, no account id, no Stripe id, no amount, no price, nothing
from any document, no filename, no text. **Four property names, eleven possible
values, all of them fixed words or booleans.**

That is enforced rather than trusted: `pack_id` goes through a fixed list before
it is sent, the same way filenames go through `fileType`, so a call site cannot
push a free string out of this module even by mistake.

**Nothing in `analytics-provider.tsx` was touched**, so the cookieless setting
is unchanged and the privacy and cookie policies do not move with this commit.
That was the condition, and it holds.

---

## 4. How this was proved, and what that proof is not

**PostHog does not run locally.** `NEXT_PUBLIC_POSTHOG_KEY` is empty in `.env`,
so the script never loads — which is the documented, intended behaviour.

So a **stand-in** was installed in the browser: an object named `posthog` with a
`capture` function, exactly the shape the real script provides. Every payload
above is what the product's own code handed to that function. It is the real
`events.ts`, the real button, the real component, the real click — the only
substituted piece is PostHog itself, and each capture also fired a genuine HTTP
request so the events appear as rows in the network tab:

```
POST /__posthog_capture/checkout_started
POST /__posthog_capture/checkout_failed
POST /__posthog_capture/purchase_completed
POST /__posthog_capture/purchase_cancelled
```

**What this does NOT prove: that anything arrives in PostHog.** That needs the
dashboard login and it is Jon's to check. Section 5 below is how.

**Also not proved:** the `other` fallback on `pack_id`. It can only trigger if a
fourth pack is added, there is no JavaScript test runner in this repo, and
adding one is a dependency decision and therefore Jon's. The three real pack
ids were all exercised and all came through correctly.

**A production build WAS run**, against `.env.test` rather than real
credentials, deliberately — prerendering can reach live services and this
session was under a no-deploy instruction. It passed, exit code 0, and the new
page prerenders as static exactly like `/dev/wallet` beside it. Typecheck
(`tsc --noEmit`) and lint (`oxlint`) are both clean on every changed file.

The new page is **not in the sitemap** (nine URLs, all marketing and legal) and
carries `robots: { index: false, follow: false }`, the same as `/dev/wallet`.

### A new dev page, and why it exists

`/dev/purchase` renders the real banner with the prop fabricated, the same
pattern and the same development-only guard as `/dev/wallet` next to it.
`/home` needs a real session against the hosted database and there is no local
Supabase, so the alternative was **paying with a live card on the live site to
look at a banner**. Four states: `?purchase=success`,
`?purchase=success&landed=0`, `?purchase=cancelled`, and no query.

---

## 5. PostHog: what to look at, and the one funnel

**Everything below is done in PostHog's web interface. No code.**

### Step one — confirm the events are actually arriving

1. Sign in to PostHog and pick this project.
2. Left sidebar → **Activity** (in some versions it is called **Live events**).
   This is a live list of everything arriving, newest first.
3. On another device or in a private window, open **un-claude.com/pricing** and
   press **Purchase now** on any pack.
4. Within a few seconds, `checkout_started` should appear in that list. Click
   the row to open it and check `pack_id` says the pack you pressed.

**If nothing appears**, the events are fine and the connection is not. Check the
same list for `own_text_entered` by typing in the tool on the home page. If that
is missing too, no event is arriving and the problem is the PostHog key on
Vercel, not this work.

### Step two — build the one funnel

1. Left sidebar → **Product analytics** → **New insight** → choose **Funnel**.
2. Add these five steps, in this order:

   | # | Event |
   |---|---|
   | 1 | `own_text_entered` |
   | 2 | `scan_completed` |
   | 3 | `sanitise_started` |
   | 4 | `out_of_credits_shown` |
   | 5 | `checkout_started` |

3. Set the date range top-right to **Last 30 days**.
4. Save it, name it **Visitor to checkout**, and pin it to your home dashboard.

**Read it as: of the people who tried their own text, how many got as far as
asking to pay.** Step 4 to step 5 is the number this product exists to know —
of the people who hit the wall, how many reached for their card.

### Step three — the purchase number, read beside it and not inside it

**Do not add a sixth step for `purchase_completed`.** It will read as near-zero
and the number will be a lie, for the identity reason at the top of this file.

Instead:

1. **New insight** → **Trends**.
2. Add three series: `checkout_started`, `purchase_completed`,
   `purchase_cancelled`.
3. Date range **Last 30 days**, and set the chart to **Bar chart** if you prefer
   to read them side by side.
4. Save as **Checkout to purchase** and pin it beside the funnel.

**Read it as three totals.** If 100 people started checkout and 60 purchases
completed, that is your checkout conversion. It is a division you do in your
head, and it is correct — what PostHog cannot do is tell you *which* sixty.

**Sanity check against Stripe.** `purchase_completed` should track Stripe's own
count of successful payments closely. If PostHog is much lower, that is tracker
blockers and Do Not Track, which is normal and expected. **If PostHog is
HIGHER than Stripe, something is wrong** and Stripe is the one to believe.

### The two numbers worth an alert

- **`checkout_failed` should be near zero.** Any run of them, especially
  `unavailable`, means the checkout route cannot reach Stripe and nobody can
  buy anything.
- **`purchase_completed` with `credits_ready: false`** means a paying customer
  landed on their old balance. A few is the normal race. A lot means the
  webhook is slow or failing — and while the banner defect at the top of this
  file stands, those customers are told nothing at all.

---

## What this session did not touch

The engine, the Python API, `app/api/**`, `vercel.json`, `lib/server/credits.ts`,
the workbench, `app/auth/**`, `analytics-provider.tsx`, the board, and Stripe.
Nothing was pushed and nothing was deployed.
