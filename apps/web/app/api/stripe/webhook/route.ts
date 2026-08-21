/**
 * POST /api/stripe/webhook
 *
 * The only place money becomes credits. 04 entry 112.
 *
 * THIS ROUTE IS PUBLIC AND UNAUTHENTICATED, because Stripe calls it, not a
 * browser. Its entire defence is the signature check below, and that check is
 * the difference between "Stripe says this was paid" and "somebody on the
 * internet says this was paid". Without it, anyone who guessed this URL could
 * POST themselves a thousand credits.
 *
 * WHY THE CREDITS ARE GRANTED HERE AND NOT ON THE SUCCESS PAGE. The success
 * redirect is a hint, not a fact: the buyer can close the tab the instant the
 * card clears, lose signal in the redirect, or open the success URL again a
 * week later. The payment is only real when Stripe says so, out of band, and
 * Stripe keeps saying so until we acknowledge it. A success page that granted
 * credits would both miss real payments and pay for imaginary ones.
 *
 * DELIVERY IS AT LEAST ONCE. Stripe will send the same event more than once —
 * this is documented behaviour, not an edge case, and it will happen in normal
 * operation. Every handler below is therefore idempotent, and the guarantee
 * lives in database indexes rather than in this file's care. See
 * `recordPurchase` and 20260821150000_stripe_purchases.sql.
 */
import {
  purchaseByPaymentIntent,
  recordPurchase,
  refundPurchase,
} from '~/lib/server/credits';
import { packById, stripe, stripeConfigured, stripeIsLive } from '~/lib/server/stripe';

import type Stripe from 'stripe';

/**
 * Stripe's signature header. The raw body plus this header plus the signing
 * secret is what proves the request came from Stripe and was not modified.
 */
const SIGNATURE_HEADER = 'stripe-signature';

export async function POST(request: Request) {
  if (!stripeConfigured()) return new Response('stripe not configured', { status: 503 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — refusing every webhook.');

    return new Response('webhook secret not configured', { status: 503 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!signature) return new Response('missing signature', { status: 400 });

  /*
   * THE RAW BODY, NOT THE PARSED ONE. The signature is computed over the exact
   * bytes Stripe sent. Parsing to JSON and re-serialising changes key order and
   * whitespace, and the signature then fails for a request that was perfectly
   * genuine. This is the single most common way a Stripe webhook is broken.
   */
  const raw = await request.text();

  let event: Stripe.Event;

  try {
    event = await stripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    // A bad signature is either a misconfigured secret or someone probing.
    // Either way it is a 400 and it never reaches the ledger.
    console.error(
      `stripe webhook signature check failed: ${err instanceof Error ? err.message : String(err)}`,
    );

    return new Response('invalid signature', { status: 400 });
  }

  /*
   * TEST AND LIVE MUST NEVER MIX. `event.livemode` says which world the event
   * came from; the secret key says which world this deployment believes it is
   * in. A mismatch means a test card is about to credit a real account, or a
   * real payment is about to be handled by code that thinks it is rehearsing.
   * The ledger is append-only, so a row written by the wrong world cannot be
   * edited out afterwards — it can only be corrected by another row. Refusing
   * is much cheaper.
   */
  if (event.livemode !== stripeIsLive()) {
    console.error(
      `stripe webhook refused: event livemode=${event.livemode} but this ` +
        `deployment is ${stripeIsLive() ? 'live' : 'test'}. Check which key is set.`,
    );

    return new Response('livemode mismatch', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      /*
       * A DELAYED PAYMENT SETTLING, DAYS LATER. Found by testing, 21 August
       * 2026: the account had Bank (ACH) enabled, where the session completes
       * with payment_status `unpaid` and the money lands later under THIS
       * event. Without this case, such a customer pays and never receives
       * credits, silently.
       *
       * Checkout now pins `payment_method_types: ['card']`, so this should be
       * unreachable. It is handled anyway because payment methods are a
       * DASHBOARD setting: someone could enable a delayed method with no
       * deploy, and this line is what stops that becoming a money bug.
       *
       * IT IS SAFE TO SHARE A HANDLER WITH `completed`. The two events carry
       * different ids, so the event-id index would NOT stop a double grant —
       * but `credit_ledger_purchase_payment_intent_uniq` keys on the PAYMENT,
       * and both events describe the same one. That index exists precisely for
       * this case. See 20260821150000_stripe_purchases.sql.
       */
      case 'checkout.session.async_payment_succeeded':
        await onCheckoutCompleted(event);
        break;

      case 'checkout.session.async_payment_failed': {
        const failedSession = event.data.object as Stripe.Checkout.Session;
        console.warn(
          `checkout.session.async_payment_failed ${failedSession.id}: the delayed ` +
            `payment did not settle. No credits were granted, which is correct.`,
        );
        break;
      }

      case 'charge.refunded':
        await onChargeRefunded(event);
        break;

      case 'charge.dispute.created':
        onDisputeCreated(event);
        break;

      /*
       * A DISPUTE FINISHED. If it was LOST, the money is gone and the credits
       * must go with it.
       *
       * THE FIRST VERSION HAD NO CASE HERE, on a stated assumption that turned
       * out to be false: `onDisputeCreated` said Stripe "will send
       * charge.refunded if it is eventually lost". IT DOES NOT. A lost dispute
       * emits `charge.dispute.closed` with status `lost` (and
       * `charge.dispute.funds_withdrawn`), never `charge.refunded`. So a lost
       * dispute left the customer holding both their money and every credit,
       * on top of the ~$15 fee — about a $40 net loss on a $24.99 sale, on the
       * single most expensive event this business has. Found by the payment
       * audit, 21 August 2026.
       */
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;

        if (dispute.status !== 'lost') {
          console.log(
            `charge.dispute.closed ${dispute.id}: status "${dispute.status}". ` +
              `Credits untouched, which is correct.`,
          );
          break;
        }

        const chargeId =
          typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

        if (!chargeId) {
          console.error(`charge.dispute.closed ${dispute.id} has no charge. Handle manually.`);
          break;
        }

        // The event carries the dispute, not the charge, so fetch the charge to
        // reach the payment intent that links this to an account.
        const charge = await stripe().charges.retrieve(chargeId);

        await reverseCredits({
          event,
          charge,
          // A lost dispute takes the whole disputed amount.
          refundedCents: dispute.amount ?? charge.amount ?? 0,
          what: 'DISPUTE LOST',
        });

        break;
      }

      default:
        // Everything else is acknowledged and ignored. Returning 200 stops
        // Stripe retrying events we have no opinion about.
        break;
    }
  } catch (err) {
    /*
     * A 500 tells Stripe to retry, which is what we want for a transient
     * failure: the database being briefly unreachable must not lose a payment.
     * Stripe retries with backoff for days, so a genuine outage self-heals.
     */
    console.error(
      `stripe webhook ${event.type} (${event.id}) failed: ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );

    return new Response('handler failed', { status: 500 });
  }

  return Response.json({ received: true });
}

/**
 * A payment completed. Grant the credits.
 *
 * NOTE THE ONE EVENT TYPE. This is the only handler that grants credits, and
 * adding a second one (`payment_intent.succeeded` is the tempting candidate)
 * would describe the SAME payment under a different event id. The event-id
 * index would not catch it. That is exactly what
 * `credit_ledger_purchase_payment_intent_uniq` exists for — but do not rely on
 * it casually. If a second handler is ever genuinely needed, read that
 * migration first.
 */
async function onCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  /*
   * `complete` is not the same as `paid`. A session can finish while the money
   * has not actually arrived — that is what delayed payment methods do. Cards
   * are immediate, so this should always be 'paid' today, but the check costs
   * nothing and is the difference between selling credits and giving them away
   * if a bank-transfer method is ever switched on in the dashboard.
   */
  if (session.payment_status !== 'paid') {
    /*
     * NOT PAID YET. For a card this should never happen. For a delayed method
     * it is the NORMAL first event, and the money arrives later under
     * `checkout.session.async_payment_succeeded`, which routes back into this
     * same function with payment_status flipped to `paid`.
     *
     * So returning here does not drop the payment — it defers it. Logged at
     * warn rather than error for that reason.
     */
    console.warn(
      `${event.type} ${session.id} not granting yet: payment_status=` +
        `${session.payment_status}. Expect async_payment_succeeded to follow.`,
    );

    return;
  }

  const accountId = session.metadata?.account_id ?? session.client_reference_id;

  if (!accountId) {
    // Nothing to credit. Loud, because it means a customer has paid and the
    // money cannot be matched to anyone — a manual refund or a manual grant.
    console.error(
      `checkout.session.completed ${session.id} has NO account_id. ` +
        `A payment was taken and cannot be credited. Handle manually.`,
    );

    return;
  }

  /*
   * HOW MANY CREDITS THIS PAYMENT BOUGHT, and the order of precedence matters.
   *
   * THE FIRST VERSION GOT THIS WRONG AND IT COULD LOSE A CUSTOMER'S MONEY. It
   * re-derived the count by looking `pack_id` up in the live PACKS array and
   * RETURNED EARLY if the lookup missed — while answering Stripe 200, so the
   * event was never retried. Any pack rename, price restructure or removal
   * would therefore take a customer's money and grant them nothing, leaving one
   * console line as the only trace. Found by the payment audit, 21 August 2026.
   *
   * `metadata.credits` is authoritative because OUR OWN checkout route wrote
   * it, at the moment the customer agreed to the price. It is the record of
   * what they actually bought. PACKS is today's catalogue, which may have moved
   * since. So metadata wins, and PACKS is used only to cross-check it.
   */
  const pack = packById(session.metadata?.pack_id);
  const fromMetadata = Number.parseInt(session.metadata?.credits ?? '', 10);

  const credits = Number.isFinite(fromMetadata) && fromMetadata > 0 ? fromMetadata : pack?.credits;

  if (!credits) {
    /*
     * Neither source could say what was bought. THROWN, not swallowed: a throw
     * becomes a 500, Stripe retries with backoff for days, and the failure
     * appears in the Stripe dashboard's webhook log where it is actually
     * visible. Returning 200 here would bury a taken-but-unfulfilled payment
     * in a console line nobody reads.
     */
    throw new Error(
      `${event.type} ${session.id}: cannot determine credits. ` +
        `pack_id="${session.metadata?.pack_id}" credits="${session.metadata?.credits}". ` +
        `A payment has been taken and NOT fulfilled — handle manually.`,
    );
  }

  if (pack && pack.credits !== credits) {
    // Not fatal: the customer gets what they paid for. But a divergence means
    // the catalogue changed after they checked out, and that is worth knowing.
    console.warn(
      `${event.type} ${session.id}: metadata says ${credits} credits but pack ` +
        `"${pack.id}" is now ${pack.credits}. Honouring the metadata.`,
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const { granted } = await recordPurchase({
    accountId,
    credits,
    eventId: event.id,
    paymentIntentId,
    priceCents: session.amount_total ?? 0,
  });

  console.log(
    granted
      ? `PURCHASE: ${credits} credits to ${accountId.slice(0, 8)} ` +
          `for ${session.amount_total} cents (${pack?.name ?? session.metadata?.pack_id}, ${paymentIntentId})`
      : `purchase ${paymentIntentId} already recorded — repeat delivery of ${event.id}, ignored`,
  );
}

/**
 * A payment was refunded in the Stripe dashboard. Take the credits back.
 *
 * WITHOUT THIS, A REFUND GIVES AWAY BOTH THE MONEY AND THE CREDITS. Refunds
 * are issued by hand in Stripe, where there is nothing to remind anyone that a
 * balance exists over here.
 *
 * The clamping at a zero balance, and why a negative balance is never an
 * acceptable outcome, are in 20260821150000_stripe_purchases.sql.
 */
async function onChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  await reverseCredits({
    event,
    charge,
    refundedCents: charge.amount_refunded ?? 0,
    what: 'REFUND',
  });
}

/**
 * Take credits back off an account because money went the other way.
 *
 * Shared by refunds and lost disputes, because from the ledger's point of view
 * they are the same event: the customer has their money and must not also keep
 * what it bought.
 */
async function reverseCredits(params: {
  event: Stripe.Event;
  charge: Stripe.Charge;
  refundedCents: number;
  what: 'REFUND' | 'DISPUTE LOST';
}) {
  const { event, charge, refundedCents, what } = params;

  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!paymentIntentId) {
    console.error(`${event.type} ${charge.id} has no payment_intent. Handle manually.`);

    return;
  }

  /*
   * Read the account and the credit count off the PURCHASE ROW rather than
   * trusting the event. Stripe does not know what an un-claude account is; the
   * link was written into the ledger when the payment succeeded.
   */
  const purchase = await purchaseByPaymentIntent(paymentIntentId);

  if (!purchase) {
    /*
     * STRIPE DOES NOT GUARANTEE EVENT ORDER, so "no purchase row" has two very
     * different meanings and the first version treated them as one.
     *
     *   (a) a refund of a charge that never granted credits here — ignore;
     *   (b) the refund overtook its own purchase event — and ignoring it means
     *       the purchase lands seconds later and the credits are NEVER removed,
     *       leaving the customer with their money and their credits.
     *
     * They are told apart by our own metadata: we stamp `account_id` onto the
     * payment intent at checkout, so its presence means this charge IS ours and
     * its purchase row is merely late. Throwing returns 500, Stripe retries with
     * backoff, and by the next attempt the purchase will have landed.
     */
    const ours = (charge.metadata?.account_id ?? null) !== null;

    if (ours) {
      throw new Error(
        `${event.type} ${charge.id}: no purchase row for ${paymentIntentId} YET, ` +
          `but the charge carries our account_id — the purchase event is late. ` +
          `Failing so Stripe retries.`,
      );
    }

    console.warn(
      `${event.type} ${charge.id}: no purchase row for ${paymentIntentId} and no ` +
        `account_id on the charge. Nothing of ours to reverse.`,
    );

    return;
  }

  /*
   * THE TARGET IS CUMULATIVE, NOT INCREMENTAL, because Stripe's
   * `amount_refunded` is the RUNNING TOTAL refunded on the charge. This figure
   * is "how many credits should stand removed for this payment in total"; the
   * database subtracts whatever earlier events already removed. See
   * 20260821160000_refund_cumulative.sql for what the incremental reading did.
   *
   * ROUNDING IS `round`, NOT `ceil`. With ceil, a one-cent refund removed a
   * whole credit — 50 cents of product for a penny — and a run of trivial
   * refunds could confiscate an entire pack. Rounding is proportional in both
   * directions. A FULL refund is special-cased rather than left to arithmetic,
   * so floating point can never leave one credit behind on a complete refund.
   */
  const paidCents = charge.amount ?? 0;

  const targetTotal =
    paidCents <= 0 || refundedCents >= paidCents
      ? purchase.credits
      : Math.min(purchase.credits, Math.round((refundedCents / paidCents) * purchase.credits));

  const removed = await refundPurchase({
    accountId: purchase.accountId,
    targetTotal,
    paymentIntentId,
    eventId: event.id,
    refundCents: refundedCents,
  });

  if (removed === 0) {
    console.log(
      `${what}: nothing further to remove for ${paymentIntentId} ` +
        `(target ${targetTotal} of ${purchase.credits} already met).`,
    );

    return;
  }

  console.log(
    `${what}: ${removed} credits removed from ${purchase.accountId.slice(0, 8)} ` +
      `for ${refundedCents} of ${paidCents} cents (${paymentIntentId})`,
  );

  if (removed < targetTotal) {
    /*
     * The clamp bit: they had already spent some. This is exactly the case the
     * terms cover by refunding UNSPENT credits only, so it means a refund was
     * issued more generously than the policy requires. Not an error — but it
     * must be visible rather than silent.
     */
    console.warn(
      `${what} SHORTFALL: target was ${targetTotal} credits but only ${removed} ` +
        `could be removed — the rest were already spent. Run ` +
        `scripts/stripe-refund-check.mjs BEFORE refunding to see this first.`,
    );
  }
}

/**
 * Somebody's bank has reversed a payment and charged us a fee for the
 * privilege.
 *
 * DELIBERATELY DOES NOT TOUCH THE LEDGER. A dispute is not a decision, it is
 * the start of an argument that can be won. Removing credits now would punish a
 * customer whose card was used fraudulently by someone else, which is the most
 * common cause of a dispute on a small digital purchase.
 *
 * THE CREDITS ARE REMOVED WHEN IT IS ACTUALLY LOST, by the
 * `charge.dispute.closed` case above. An earlier version of this comment said
 * a lost dispute arrives as `charge.refunded`; that is FALSE, and because it
 * was believed, nothing removed the credits at all.
 *
 * It is logged loudly because a dispute costs about $24.50 all-in and is the
 * single most expensive event in this business — worth 25 sales of the entry
 * pack. 03-pricing.md section 4d.
 */
function onDisputeCreated(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;

  console.error(
    `DISPUTE OPENED: ${dispute.amount} cents, reason "${dispute.reason}", ` +
      `charge ${dispute.charge}. Respond in the Stripe dashboard before the ` +
      `evidence deadline. Credits deliberately NOT removed yet.`,
  );
}
