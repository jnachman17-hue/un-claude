# The payment path, tested rather than asserted

**21 August 2026, session 11.** What was actually run, what it printed, what it
found, and what is still not proven. `04` entry 114.

---

## 1. What is PROVEN, with a run behind each line

| Proof | Command | Result |
|---|---|---|
| The migration is applied and behaving | `node scripts/verify-stripe-migration.mjs` | **9/9 pass** |
| A forged webhook cannot mint credits | `node scripts/verify-stripe-webhook.mjs` | **6/6 pass** |
| Every refusal on the payment surface holds | `node scripts/verify-payment-edges.mjs` | **12/12 pass** |
| A real purchase credits a real account | `cd apps/e2e && node stripe-purchase.mjs starter` | **PASSED** |
| **A repeat webhook does not pay twice** | `stripe events resend <id>` x2 | **1 row after 3 deliveries** |

### The purchase, end to end

A throwaway account signed in, pressed **Purchase now**, paid $4.99 with Stripe's
test card, and came back to a wallet reading **15 credits**, up from 5, with
`Purchase +10` in the history. The ledger agrees:

    399     4857d2f7           +25  purchase   (the Plus run)
    ...     a14c7d3b           +10  purchase   (the Starter run)

### The double-delivery test, which is the one that matters

Stripe delivers **at least once**, so a repeat is a certainty. The same event was
resent twice more:

    13:34:10   --> checkout.session.completed [evt_1U6z7kHwIcwEXjEPp81GR2Sb]
    13:34:11  <--  [200] POST /api/stripe/webhook
    13:34:15   --> checkout.session.completed [evt_1U6z7kHwIcwEXjEPp81GR2Sb]
    13:34:15  <--  [200] POST /api/stripe/webhook

    purchase rows in the whole ledger: 1

**Three deliveries. One row. Both retries answered 200**, so Stripe stops
retrying rather than hammering us.

**`payment_intent.succeeded` also arrived and was correctly ignored**, which is
the single-handler design working: one payment, one event type, one grant.

---

## 2. What the audit found

A multi-agent adversarial audit ran over the whole money path: six review lenses,
each finding then put to three independent skeptics, surviving only on a 2-of-3
vote. **33 raw findings, 17 survived.**

**Two of the worst were NOT in the new Stripe code.** They were pre-existing
defects in the credit system, which is exactly what Jon asked for when he said
the whole system had never really been tested.

### Fixed: in the new payment code

| Severity | Defect | What it would have cost |
|---|---|---|
| **CRITICAL** | **`charge.amount_refunded` is a RUNNING TOTAL, and the code read it as the amount of this refund.** Two $3 refunds on a $9.99 pack removed 8 then 16 credits, total 24 of 25 | The surplus is clamped against the WHOLE BALANCE, so it eats credits from **other, un-refunded purchases**. Append-only, so uncorrectable |
| **HIGH** | **An unknown or renamed pack id dropped a paid payment and answered Stripe 200** | Money taken, nothing granted, no retry, one console line as the only trace |
| **MEDIUM** | **A lost dispute never removed credits.** The code's own comment claimed Stripe sends `charge.refunded` when a dispute is lost. **It does not** — it sends `charge.dispute.closed` with status `lost` | ~$40 net loss on a $24.99 sale: the money, the ~$15 fee, and the customer keeps 100 credits |
| **MEDIUM** | **`Math.ceil` on the refund proportion** removed a whole credit for a one-cent refund | Ten 1p refunds confiscated a whole $4.99 pack |
| **LOW** | **A refund arriving BEFORE its purchase** was discarded as "not ours" | Customer refunded and keeps the credits, for ever |
| **MEDIUM** | **No `checkout.session.async_payment_succeeded` handler** — found independently by the live test, see section 3 | A bank payment takes the money and grants nothing |

### Fixed: pre-existing, in the credit system

| Severity | Defect | What it would have cost |
|---|---|---|
| **CRITICAL** | **`/api/tool/clean` derived "is this a guest conversion?" from the `uc-guest` cookie — which `/api/credits` DELETES the moment the merge completes.** So every converted account was later paid the +2 welcome grant it had just been correctly denied | **Every converting user minted 2 free credits**, spendable on the rewrite, the only layer that costs real money. This is byte-for-byte defect 2 from `guest-merge-double-runs.md`, fixed in one route and missed in the other. `ensureGrants`' own docblock warns against exactly this |
| **CRITICAL** | **The clean route's idea of a "text file" did not match the engine's.** The route knew `.txt/.md/.markdown/.text`; the engine's `TEXT_EXTS` is `.txt .text .css .js .py .rs .go .json .yaml .yml .toml .csv`, and `.md/.markdown` are **CONTAINERS** to it | **Both directions wrong.** A 100,000-word essay saved as `essay.csv` bought a full rewrite for **1 credit** — a 100x undercharge. And a `.md` upload was **charged per 1,000 words for a rewrite the engine never runs** — paying and not receiving |

**Still open, not fixed:** a forged `uc-guest` cookie can name someone else's
anonymous account and move its credits across, because `merge_guest_credits`
checks only that the named account is anonymous, not that the caller ever held
that session. Rated LOW (2 of 3 skeptics) — it needs a victim's account UUID,
and the take is at most 2 credits. **Recorded in `06` rather than fixed today.**

---

## 3. The bug the audit could not have found, and the live test did

**The Stripe account had `Bank` enabled as a payment method** — visible only by
looking at the actual checkout page.

Bank means ACH: the Checkout Session completes **immediately** with
`payment_status: unpaid`, and the money lands days later under a **different
event**. The webhook grants only on `paid`. So a customer paying by bank would
have completed checkout, been charged, and received **nothing**, silently.

**Two fixes, deliberately overlapping.** Checkout now pins
`payment_method_types: ['card']`, and the webhook handles
`checkout.session.async_payment_succeeded` anyway — because payment methods are
a **dashboard setting**, so someone could re-enable a delayed method a year from
now with no deploy and no review.

**Reading the code would never have surfaced this.** It took a screenshot.

---

## 3b. Everything proven AFTER the fixes, second pass

**The refund migration was applied and the whole path re-run.**

| Proof | Command | Result |
|---|---|---|
| Migration, incl. the buggy signature being GONE | `verify-stripe-migration.mjs` | **10/10 pass** |
| **Refunds, including repeated partial refunds** | `verify-refund-flow.mjs` | **all pass** |
| **A lost dispute reclaims the credits** | `verify-dispute-flow.mjs` | **all pass** |
| The price agrees with the engine about file types | `verify-pricing-matches-engine.mjs` | **3/3 pass** |
| The ledger's four invariants still hold | `verify-guest-merge.mjs` | **4/4 pass** |
| **A converted account gets NO second welcome grant** | `apps/e2e/conversion-regression.mjs` | **no anon_grant** |
| A real receipt, read | `read-stripe-receipt.mjs` | **no personal name, no address** |

### The refund arithmetic, run against a real charge

$4.99 for 10 credits, refunded in three parts. The cumulative bug would have
removed 20 credits in total; the fix removes exactly 10.

    step 1: refund 200c  -> rows -4          total removed 4    balance 15 -> 11
    step 2: refund 100c  -> rows -4, -2      total removed 6    balance 11 -> 9
      (the OLD code would by now have removed 10, not 6)
    step 3: refund 199c  -> rows -4, -2, -4  total removed 10   balance 9 -> 5

    the total removed equals exactly what the purchase granted   PASS
    a repeat refund delivery removes NOTHING further             PASS

### The dispute, run against a real disputed charge

Paid with Stripe's dispute card `4000000000000259`:

    dispute du_1U70j9…, reason "fraudulent", status "needs_response"
    an OPEN dispute leaves the credits alone      PASS  (balance still 15)
    a LOST dispute removes all 10 credits         PASS  (balance 5)

**An open dispute deliberately does nothing**, because a dispute is an argument
rather than a verdict and the commonest cause on a small digital purchase is a
stolen card — taking the credits then would punish the victim.

### The conversion double-grant, proven fixed through the real route

An account holding a `guest_conversions` record, in a browser with **no guest
cookie** — the exact state in which the bug fired — ran a real sanitise:

    +3 signup_grant
    -1 spend (24 words)
    balance: 2
    anon_grant present: false

**Under the old code this run wrote `+2 anon_grant` and the balance was 4.**

### What a customer actually receives

    Receipt from Un-Claude
    Un-Claude Starter — 10 credits x 1      $4.99
    If you have any questions, contact us at unclaudeapp@gmail.com

    card statement: UN-CLAUDE.COM

**Checked explicitly for "Nachman", "Jonathan", both street addresses and both
postcodes. All absent.** This CORRECTS section 5 of `stripe-setup.md`, which
warned that an address would appear on every receipt: Stripe requires the
support address as a SETTING, but does not render it on the email receipt.

---

## 3c. The Stripe account is ACTIVATED

Read from the API, 21 August 2026:

    charges_enabled    true
    payouts_enabled    true
    details_submitted  true
    requirements       none outstanding
    descriptor         UN-CLAUDE.COM

**Stripe has approved the account. Nothing on their side is pending.**

---

## 4. What is NOT proven, stated plainly

- **Nothing has been deployed and no live key exists anywhere.** Production
  carries no `STRIPE_*` variables at all, so checkout on the live site returns
  503 and cannot take money. That is the correct state until the gate clears.
- **The sign-in FORM is not covered** by any script. Turnstile correctly refuses
  an automated browser, so the tests use an admin-issued one-time token through
  the product's own `/auth/confirm` route. **That is the captcha working, not a
  gap in it** — but it does mean the form itself is only covered by a human.
- **Layer B was not exercised** in these runs (`layer_b: false`), so the paid
  rewrite path's cost accounting is proven by the extension-drift check rather
  than by a run.
- **Which Vercel plan the project is on has not been confirmed.** Hobby forbids
  commercial use; this is Jon's to check and is a hard gate.
- **A forged `uc-guest` cookie** can still name another user's anonymous
  account. Rated LOW, recorded in `06`, deliberately not fixed.

**The console errors seen during purchase runs (`%c%d font-size:0…`) come from
`checkout.stripe.com`, not from un-claude.com.** Our own pages measure clean.
