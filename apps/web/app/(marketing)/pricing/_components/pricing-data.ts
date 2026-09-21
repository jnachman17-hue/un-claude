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

/** The cheapest pack, for any line that names a starting price. */
export const CHEAPEST_PACK = PACKS.reduce((low, pack) => (pack.price < low.price ? pack : low));
