/**
 * POST /api/checkout
 *
 * Turns "I want the Plus pack" into a Stripe-hosted payment page. 04 entry 112.
 *
 * WHY STRIPE'S OWN HOSTED PAGE, AND NOT A CARD FORM ON OUR SITE. A card number
 * never touches un-claude.com, never touches Vercel, and never touches this
 * codebase. That is not only a security posture, it is a compliance one: the
 * lightest PCI obligation available is the one where you never handle the card,
 * and Stripe's checklist asks a business to be able to tell customers their
 * payment details are handled safely. Ours can, truthfully, in one sentence.
 * Apple Pay, Google Pay and 3-D Secure come free with it.
 *
 * THE SECURITY BOUNDARY, in one line: THE BROWSER SENDS A PACK ID, NEVER A
 * PRICE. See `packById` in lib/server/stripe.ts. A route that accepted an
 * amount would let anyone buy 100 credits for one cent, and the ledger row it
 * produced would look exactly like an honest sale.
 *
 * WHY A REAL ACCOUNT IS REQUIRED, AND A GUEST CANNOT BUY. Credits live on an
 * account. A guest's account is anonymous and is remembered only by a cookie in
 * one browser: clearing cookies, or opening the site on a phone instead of a
 * laptop, loses it. Selling someone credits that a cleared cookie destroys is
 * a refund request and a dispute waiting to happen, and there is no email
 * address to send a receipt to either. 402 sends them to sign up first, which
 * is also where the 3 signup credits are.
 *
 * WHY THIS ROUTE REFUSES WITHOUT A CONSENT FLAG, ADDED 22 August 2026.
 * A UK or EU consumer has a statutory 14 day right to cancel a distance
 * purchase and get ALL of it back, credits they already spent included. Our
 * voluntary 30 day refund covers UNSPENT credits only, so it does not discharge
 * that right, and being more generous does not either: the two cover different
 * money. 04 entry 113.
 *
 * The right is lost only where the buyer expressly consents to immediate
 * supply, acknowledges that this loses them the right, AND receives
 * confirmation of both on a durable medium. Credits land the instant the
 * payment succeeds, so supply IS immediate whether or not anybody papered it.
 * The dialog in `pricing/_components/buy-button.tsx` collects the first two.
 * Stripe's receipt email is the third and already exists.
 *
 * SO THE FLAG IS REQUIRED RATHER THAN RECORDED-IF-PRESENT. A checkout that
 * quietly proceeded without it would take money under a consent nobody gave,
 * and the resulting sale would look identical to an honest one — the same shape
 * of defect as accepting a price from the browser. Refusing is one line and it
 * makes the ceremony impossible to skip by accident.
 *
 * IT IS ALSO WRITTEN DOWN ON STRIPE'S SIDE, because a consent nobody can
 * produce later is not worth collecting: onto the session AND the charge as
 * metadata, so a dispute opened months from now still carries it, and restated
 * beside Stripe's own pay button through `custom_text`.
 */
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { packById, packCents, packLineItem, stripe, stripeConfigured } from '~/lib/server/stripe';
import { rateLimit } from '~/lib/server/rate-limit';

/**
 * Checkout sessions one account may open per hour.
 *
 * Deliberately loose. Abandoning a checkout and coming back is ordinary
 * behaviour — changing your mind about which pack, losing the tab, the card
 * being in another room — and each abandoned session costs nothing. This is a
 * backstop against a script opening thousands, not a quota on indecision.
 */
const CHECKOUTS_PER_HOUR = 20;

/**
 * Where Stripe sends the buyer afterwards.
 *
 * In production this is the site's own configured URL. In development it is the
 * origin the request actually arrived on, because the configured URL is
 * `https://un-claude.com` even on a laptop, and a success redirect to the live
 * site after a test-mode payment is a genuinely confusing way to lose ten
 * minutes.
 *
 * THE REQUEST ORIGIN IS TRUSTED ONLY IN DEVELOPMENT. It is attacker-controlled
 * in general, and using it in production would turn this route into an open
 * redirect with Stripe's credibility attached to it.
 */
function siteOrigin(request: Request): string {
  if (process.env.NODE_ENV === 'development') {
    const origin = request.headers.get('origin');

    if (origin?.startsWith('http://localhost')) return origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://un-claude.com';
}

function fail(error: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error, ...extra }, { status });
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    // Checkout is not wired up on this deployment. Say so plainly rather than
    // throwing a 500 that reads like a bug in the payment itself.
    return fail('checkout_unavailable', 503);
  }

  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail('signed_out', 401);

  // An anonymous (guest) account cannot buy. See the file header.
  if (user.is_anonymous === true) return fail('account_required', 402);

  if (!(await rateLimit(`checkout:acct:${user.id}`, CHECKOUTS_PER_HOUR, 3600))) {
    return fail('rate_limited', 429);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail('bad_request', 400);
  }

  const pack = packById((body as { packId?: unknown })?.packId);

  if (!pack) return fail('unknown_pack', 400);

  /*
   * The consent, checked before a Checkout Session exists. See the file header.
   * Strictly `true`: a missing field, a string, or any other truthy-ish value is
   * not consent.
   */
  if (
    (body as { agreedToImmediateSupply?: unknown })?.agreedToImmediateSupply !== true
  ) {
    return fail('consent_required', 400);
  }

  // Recorded to the second, because "when" is half of what makes a consent
  // record evidence rather than an assertion.
  const consentAt = new Date().toISOString();

  const origin = siteOrigin(request);

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [packLineItem(pack)],

    /*
     * CARD ONLY, AND THIS IS A CORRECTNESS DECISION BEFORE IT IS A PRODUCT ONE.
     *
     * FOUND BY TESTING, 21 August 2026. Left to its automatic defaults, this
     * account offered Card, Cash App Pay, Klarna, Amazon Pay and **Bank**.
     * Bank means ACH, which does not settle for DAYS: the Checkout Session
     * completes immediately with `payment_status` of `unpaid`, and the money
     * arrives long afterwards under a DIFFERENT event
     * (`checkout.session.async_payment_succeeded`).
     *
     * The webhook grants credits only when payment_status is `paid`, so a
     * customer paying by bank would have completed checkout, been charged, and
     * received NOTHING — silently, with no error anywhere. That is the single
     * worst failure this system can have, and no amount of reading the code
     * would have surfaced it; it took looking at the actual payment page.
     *
     * The webhook now ALSO handles the async events, so this is belt and
     * braces rather than the only defence. But the list is pinned here because
     * payment methods are otherwise controlled by a DASHBOARD SETTING, which
     * means someone could re-enable a delayed method a year from now, with no
     * deploy and no review, and quietly reintroduce the bug.
     *
     * The product cost is small and the page gets better: these are $4.99 to
     * $24.99 impulse purchases, where a card is what nearly everyone uses, and
     * five payment choices on a five dollar purchase is friction rather than
     * flexibility. Cash App Pay is the one worth revisiting, since it settles
     * immediately and suits this audience.
     */
    payment_method_types: ['card'],

    /*
     * Prefilled so the buyer does not retype it, and so Stripe's receipt goes
     * to the same inbox the credits landed in. A receipt arriving at a
     * different address than the account is a support email we do not need.
     */
    customer_email: user.email ?? undefined,

    /*
     * THE LINK BETWEEN A STRIPE PAYMENT AND AN UN-CLAUDE ACCOUNT, and the
     * webhook has nothing else to go on. Stripe has no idea what an account is
     * here; this is the only thread connecting the money to the balance.
     *
     * Written in three places on purpose. `client_reference_id` is the field
     * Stripe designed for it and shows in the dashboard; the session metadata
     * is what the webhook reads; and `payment_intent_data.metadata` carries it
     * onto the charge itself, so a refund or a dispute opened months later in
     * the dashboard still says which account it belongs to without a lookup.
     */
    client_reference_id: user.id,
    metadata: {
      account_id: user.id,
      pack_id: pack.id,
      credits: String(pack.credits),
      consent_immediate_supply: 'accepted',
      consent_immediate_supply_at: consentAt,
    },
    payment_intent_data: {
      metadata: {
        account_id: user.id,
        pack_id: pack.id,
        credits: String(pack.credits),
        consent_immediate_supply: 'accepted',
        consent_immediate_supply_at: consentAt,
      },
    },

    /*
     * The consent checkbox. It requires a terms-of-service URL to be set in the
     * Stripe dashboard (Settings -> Business -> Public details) and links to it.
     *
     * THIS CARRIES CONSENT TO OUR TERMS AND NOTHING MORE. 04 entry 113: our
     * voluntary 30 day refund of unspent credits and the UK/EU statutory right
     * of withdrawal are DIFFERENT THINGS, and the statutory wording is
     * deliberately NOT invented here. It belongs to the legal reconciliation
     * Jon deferred until after Stripe setup. A checkbox consenting to terms is
     * accurate and legally neutral; a sentence this session wrote about a
     * statutory right would be neither.
     */
    consent_collection: {
      terms_of_service: 'required',
    },

    /*
     * The immediate-supply acknowledgement, restated where the money actually
     * leaves. Stripe has no field for this consent — `consent_collection`
     * offers terms of service and marketing and nothing else — so it is
     * collected on our page and repeated here, above Stripe's own pay button,
     * so the buyer reads it once more at the moment of paying.
     *
     * The wording tracks the checkbox and the terms sentence deliberately.
     * Three surfaces saying the same thing in three different ways is how a
     * consent record gets argued with.
     */
    custom_text: {
      submit: {
        message:
          'You asked for your credits to be delivered immediately and confirmed that this ends your 14 day right to cancel. Our separate 30 day refund of unspent credits still applies.',
      },
    },

    success_url: `${origin}/home?purchase=success`,
    cancel_url: `${origin}/pricing?purchase=cancelled`,
  });

  if (!session.url) {
    // Stripe accepted the session but returned nowhere to send them. Never
    // observed; handled because a silent undefined here would render as a
    // button that does nothing at all.
    return fail('no_checkout_url', 502);
  }

  return Response.json({
    ok: true,
    url: session.url,
    // Echoed so the client can be certain which pack it is about to pay for.
    pack: { id: pack.id, name: pack.name, cents: packCents(pack) },
  });
}
