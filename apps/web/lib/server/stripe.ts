import 'server-only';

import Stripe from 'stripe';

import { PACKS, type Pack } from '~/(marketing)/pricing/_components/pricing-data';

/**
 * Everything that talks to Stripe, in one file. 04 entry 112.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: the price a customer is charged is
 * derived from `pricing-data.ts`, the same module the pricing page renders
 * from. It is never sent by a browser and never stored a second time in
 * Stripe's dashboard. The failure this prevents is the one that would be
 * hardest to notice and worst to explain: the page advertising $4.99 while the
 * card is charged $9.99, or the reverse, because two systems each hold their
 * own copy of a number and one of them was edited.
 *
 * WHY THERE ARE NO STRIPE PRODUCTS OR PRICES TO CREATE. Checkout sessions are
 * built with inline `price_data` rather than pointing at a Price object created
 * in the dashboard. The conventional setup is the other way round, so the
 * departure is deliberate and worth stating:
 *
 *   - A dashboard Price is a second source of truth for a number this project
 *     already keeps in one place on purpose (04 entry 108, "the prices in one
 *     place, so the cards and the calculator can never disagree").
 *   - It removes three environment variables that would have to be set
 *     correctly in test AND in production, and whose being set WRONG produces a
 *     working checkout at the wrong price rather than an error.
 *   - Nothing is lost that this business needs. Stripe's reporting groups by
 *     the product name we send, which is the pack name.
 *
 * The cost is real and small: changing a price means a deploy. For this
 * product that is the RIGHT cost, because a price that can change without a
 * deploy is a price that can disagree with the page.
 */

/**
 * THE API VERSION IS DELIBERATELY NOT SET HERE, and that is the safer of the
 * two options rather than the lazier one.
 *
 * `stripe` pins an API version inside the package itself (22.5.0 pins
 * 2026-07-29.dahlia) and its TypeScript types are generated against exactly
 * that version. Passing a version string here would create a second place the
 * version is written down, free to drift from the types that are checking this
 * code — and the way that drift shows up is a response shape the types promise
 * and the API does not send.
 *
 * The version is therefore pinned by the dependency, which pnpm's catalog pins
 * in `pnpm-workspace.yaml`. Upgrading the version is upgrading the package,
 * which is a reviewable change rather than an edited string.
 */

let client: Stripe | null = null;

/**
 * The Stripe client, created on first use.
 *
 * LAZY ON PURPOSE. Building it at module load would mean that importing
 * anything from this file throws when the key is absent, which takes down
 * routes that have nothing to do with payments. The key is genuinely absent in
 * ordinary development, and it must stay absent-safe: the free tool, the scan
 * and the whole signed-out path have to keep working on a machine that has
 * never seen a Stripe key.
 */
export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Checkout cannot run without it. ' +
        'See docs/session-notes/stripe-setup.md.',
    );
  }

  client = new Stripe(key);

  return client;
}

/** Is Stripe configured at all? Used to decide what the pricing page offers. */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Is this a live key rather than a test one?
 *
 * Used by the webhook to refuse to mix the two. A test-mode payment crediting a
 * real account, or a live payment landing while the code thinks it is testing,
 * are both silent and both corrupt the ledger — which is append-only, so the
 * bad row cannot be edited out afterwards.
 */
export function stripeIsLive(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true;
}

/**
 * Find a pack by the id a browser asked for.
 *
 * THE BROWSER SENDS AN ID, NEVER AN AMOUNT. This lookup is the boundary: an id
 * that is not one of the three packs returns undefined and the request is
 * refused, so the only prices reachable are the three on the page. A route that
 * accepted an amount from the client would let anyone buy 100 credits for one
 * cent, and it would look exactly like a normal purchase in the ledger.
 */
export function packById(id: unknown): Pack | undefined {
  if (typeof id !== 'string') return undefined;

  return PACKS.find((pack) => pack.id === id);
}

/** The price in cents, from the dollars-and-cents pieces the page typesets. */
export function packCents(pack: Pack): number {
  return Math.round(pack.price * 100);
}

/**
 * What a buyer sees on the Stripe checkout page and on their emailed receipt.
 *
 * CLAUDE.md section 8: read it as the visitor. They are looking at a payment
 * page, possibly on a phone, possibly having arrived from a Google search
 * twenty seconds ago, and "Plus" on its own tells them nothing about what they
 * are buying or from whom. The line names the product, the pack and what the
 * credits actually do, because this is the last screen before money moves and
 * the first one a disputing customer's bank will ask them about.
 */
export function packLineItem(pack: Pack): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: packCents(pack),
      product_data: {
        name: `Un-Claude ${pack.name} — ${pack.credits} credits`,
        description:
          `${pack.credits} credits for un-claude.com. One credit covers 1,000 ` +
          `words of text or one file. Credits never expire.`,
      },
    },
  };
}
