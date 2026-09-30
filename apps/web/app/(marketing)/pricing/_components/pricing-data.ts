/**
 * The prices, in one place, so the cards and the calculator can never
 * disagree with each other.
 *
 * THE NUMBERS ARE THE RATIFIED ONES. 04 entry 67 for the packs, entry 97 for
 * the free split (2 welcome plus 3 on signup, superseding entry 67's 3 plus
 * 2), entry 71 for a file costing one flat credit.
 *
 * The three credit constants are DELIBERATELY RESTATED here rather than
 * imported from `_components/workbench/credits.ts`. That file carries a
 * 'use client' directive, and a Server Component importing a plain value
 * from a client module gets a client reference back rather than the number.
 * Keep these three in step with it by hand.
 *
 * `dollars` and `cents` are split on purpose: the price is typeset as three
 * pieces so the decimal sits tight against the figures. Setting "$4.99" as a
 * single mono string is what produced the "$4 . 99" spacing on the page this
 * replaced.
 */
export interface Pack {
  id: 'starter' | 'plus' | 'pro';
  name: string;
  dollars: string;
  cents: string;
  price: number;
  credits: number;
  words: number;
  rate: string;
  /** The saving against the entry pack's rate, or null for the entry pack. */
  saving: string | null;
  /** What that many credits looks like as a real job. */
  covers: string;
  featured: boolean;
}

export const PACKS: Pack[] = [
  {
    id: 'starter',
    name: 'Starter',
    dollars: '4',
    cents: '99',
    price: 4.99,
    credits: 10,
    words: 10_000,
    rate: '50¢ a credit',
    saving: null,
    covers: 'About four college essays.',
    featured: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    dollars: '9',
    cents: '99',
    price: 9.99,
    credits: 25,
    words: 25_000,
    rate: '40¢ a credit',
    saving: 'Save 20%',
    covers: 'About ten college essays.',
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    dollars: '24',
    cents: '99',
    price: 24.99,
    credits: 100,
    words: 100_000,
    rate: '25¢ a credit',
    saving: 'Save 50%',
    // WAS "A dissertation, with room to spare." One rewrite takes 8,000 words,
    // so a dissertation is a dozen runs rather than one, and the old line let a
    // visitor buy the biggest pack believing otherwise. The pack still covers
    // it; it does not do it in a single press.
    covers: 'A dissertation, run in parts.',
    featured: false,
  },
];

/**
 * 04 entry 166, 21 September 2026. Mirrors `_components/workbench/credits.ts`.
 * The free tier is the welcome grant and nothing else: creating an account
 * earns nothing, so `FREE_CREDITS` and `WELCOME_CREDITS` are the same number
 * and both names are kept only so a page can say which one it means.
 */
export const WELCOME_CREDITS = 2;
export const WORDS_PER_CREDIT = 1_000;

export const FREE_CREDITS = WELCOME_CREDITS;

/**
 * ★ WHAT A BUYER OUTSIDE AMERICA SEES, IN THEIR OWN CURRENCY, AS A CLEAN NUMBER.
 *
 * Jon's ruling, 30 September 2026. These live here beside `PACKS` and not in a
 * server file for the reason that governs every price in this project: the day
 * a pack changes, exactly one file may be right.
 *
 * WHY THESE EXIST AT ALL. Stripe's Adaptive Pricing was already switched on and
 * already converting — measured on live sessions that day, buyers were shown
 * EUR 4.56, GBP 7.69, AUD 7.22, CAD 36.39 and ILS 31.30. Every one of those is
 * an unrounded conversion, because **Stripe has no rounding rule**: it converts
 * at the mid-market rate plus its fee and presents whatever falls out. Five
 * real conversions, not one of them landing on a round number, is the proof.
 *
 * AND WHY A ROUNDING RULE WOULD NOT HAVE FIXED IT EVEN IF STRIPE HAD ONE. An
 * automatically rounded price moves when the exchange rate moves: EUR 4.56
 * rounds up to 4.99 today and to 5.49 after a bad month. A hand-set price does
 * not move at all, and a price that is the same on every visit is most of what
 * "looks professional" actually means.
 *
 * THE TRADE, NAMED: we now carry the exchange-rate risk on these four
 * currencies, which is precisely the risk Adaptive Pricing exists to avoid.
 * On a product between five and twenty five dollars that is a rounding error,
 * and it is the deliberate price of a tidy number.
 *
 * ANY CURRENCY NOT LISTED HERE IS STILL HANDLED, and that is load-bearing
 * rather than incidental: Stripe REFUSES a currency a manual price does not
 * cover rather than converting it, so Adaptive Pricing must stay switched on
 * to catch everything else. Stripe's own rule is that a manual price overrides
 * Adaptive Pricing for that currency and leaves the rest alone.
 *
 * Amounts are in the currency's smallest unit, the same way Stripe takes them.
 */
export const LOCAL_PRICES: Record<string, Record<Pack['id'], number>> = {
  // Germany 98 visitors, the Netherlands 43, Italy 24, France 18.
  // Roughly +9% on today's converted price. EUR sits close enough to USD that
  // matching the dollar ladder exactly is both tidy and easy to remember.
  eur: { starter: 499, plus: 999, pro: 2499 },
  // The United Kingdom, 161 visitors and the largest single non-US market.
  // About +4%.
  gbp: { starter: 399, plus: 799, pro: 1999 },
  // Australia, 86 visitors. AUD and CAD are within a penny of the same rate, so
  // they share one ladder; keeping two near-identical ladders apart would be a
  // second place to make a mistake for no gain.
  aud: { starter: 799, plus: 1499, pro: 3999 },
  // Canada, 26 visitors.
  cad: { starter: 799, plus: 1499, pro: 3999 },
};

/** The currencies we set by hand. Everything else falls to Adaptive Pricing. */
export const LOCAL_CURRENCIES = Object.keys(LOCAL_PRICES);

/** The cheapest pack, for any line that names a starting price. */
export const CHEAPEST_PACK = PACKS.reduce((low, pack) => (pack.price < low.price ? pack : low));
