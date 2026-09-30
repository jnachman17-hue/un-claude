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
 * CREDITS ARE SOLD TO US CUSTOMERS ONLY, AND THIS ROUTE DOES NOT ENFORCE IT.
 * Jon's ruling, 22 August 2026. The UK/EU 14 day right of withdrawal, and the
 * consent ceremony a version of this route briefly carried for it, are gone
 * with the market they belonged to. 04 entry 115.
 *
 * THE RESTRICTION IS A TERM OF SALE AND THIS ROUTE DELIBERATELY DOES NOT
 * IMPLEMENT IT. Nothing here looks at where a card comes from, because only
 * Stripe knows that and only after the card is entered. UK, EU and EEA cards
 * are refused by a Radar block on the built-in `card_country_blocklist`,
 * populated by `scripts/block-eu-cards.mjs` and proven in test mode: a US card
 * authorises, GB and FR come back blocked before reaching the network.
 *
 * THE TERM IS BROADER THAN THE BLOCK, ON PURPOSE. The terms say United States
 * only; the blocklist covers the UK, the EU and the EEA, which is where the
 * withdrawal right and the VAT problem actually live. A Canadian card still
 * completes. That is a term being stricter than its enforcement, which is
 * ordinary, and the terms reserve the right to refuse or reverse the rest.
 *
 * THE ONLY CONSENT COLLECTED IS STRIPE'S OWN TERMS CHECKBOX, below. That is
 * deliberate and it is the whole of it.
 */
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { packById, packCents, packCheckoutLineItem, stripe, stripeConfigured } from '~/lib/server/stripe';
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

  const origin = siteOrigin(request);

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    /*
       A real Stripe Price when one exists, so the buyer sees a clean number in
       their own currency; the old inline USD price when it does not. 04 entry
       167 and `packCheckoutLineItem`.
    */
    line_items: [await packCheckoutLineItem(pack)],

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
    },
    payment_intent_data: {
      metadata: {
        account_id: user.id,
        pack_id: pack.id,
        credits: String(pack.credits),
      },
    },

    /*
     * The consent checkbox. It requires a terms-of-service URL to be set in the
     * Stripe dashboard (Settings -> Business -> Public details) and links to it.
     *
     * THIS IS THE ONLY CONSENT THE CHECKOUT COLLECTS, and as of 22 August 2026
     * that is the finished design rather than a stage of one. 04 entry 115.
     * The terms it points at carry the refund policy and the US-only
     * restriction, so one tick covers both. There is deliberately nothing on
     * un-claude.com's own side: no dialog, no second checkbox, no interstitial.
     */
    consent_collection: {
      terms_of_service: 'required',
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
