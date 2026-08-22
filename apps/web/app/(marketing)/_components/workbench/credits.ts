'use client';

/**
 * The browser's half of the credit system. 04 entry 97.
 *
 * This file replaced `free-uses.ts`, which counted three free sanitises in
 * localStorage and was the entire "billing system" until this session. The
 * truth now lives in the server's ledger; what remains here is fetching the
 * balance, making sure a session exists before work is attempted, and the
 * price arithmetic the interface shows before the button is pressed. The
 * server recomputes that price from the payload and trusts none of this.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const WELCOME_CREDITS = 2;
export const SIGNUP_CREDITS = 3;
export const WORDS_PER_CREDIT = 1_000;

/**
 * The most words one rewrite will accept.
 *
 * MUST MATCH `UC_MAX_WORDS` in apps/web/api/_shared.py, which is what actually
 * enforces it. This copy exists so the interface can refuse before the button
 * rather than after a two minute wait. If they ever disagree the server wins and
 * the user is refunded, so drift is annoying rather than dangerous — but it is
 * still drift, and this project has been bitten by two lists that had to agree
 * before.
 *
 * Measured rather than guessed. Words against seconds, engine only, no network:
 * 2,616 -> 36s, 5,232 -> 69s, 7,848 -> 104s, 10,464 -> 79s. Above this the run
 * does not reliably finish inside the time the site waits for it.
 */
export const MAX_WORDS = 10_000;

/**
 * Roughly how long a rewrite of this many words will take, rounded UP, so the
 * number shown to somebody waiting is a ceiling they beat rather than a promise
 * they watch slip.
 *
 * 15 seconds per 1,000 words comes from the worst measured run (7,848 words in
 * 104 seconds, 13.4s per 1,000). Time tracks retries rather than length — the
 * 7,848 word document took LONGER than the 10,464 word one — so this is honest
 * as an upper bound and would be dishonest as an estimate.
 */
export function estimateSeconds(words: number): number {
  return Math.max(10, Math.ceil((words / 1_000) * 15));
}

/** "about 40 seconds" / "about 2 minutes". Never a bare number. */
export function humanDuration(seconds: number): string {
  if (seconds < 90) return `about ${Math.ceil(seconds / 5) * 5} seconds`;

  return `about ${Math.ceil(seconds / 60)} minutes`;
}

export interface CreditsState {
  /** Null until a first sanitise creates the account: show the welcome. */
  balance: number | null;
  isAnonymous: boolean;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * What this input will cost, for display, mirroring the server's rule
 * exactly so the price on the button is the price on the ledger: anything
 * the rewrite will actually run on is priced by its words; every other file
 * is one flat credit (04 entry 71, and 06 row 74 for why: the engine only
 * rewrites text-kind inputs, so a docx or an image costs us nothing).
 */
export function costFor(input: {
  isFile: boolean;
  name: string;
  wantsRewrite: boolean;
  words: number;
}): number {
  const textLike =
    !input.isFile || /\.(txt|md|markdown|text)$/i.test(input.name);
  const byWords = Math.max(1, Math.ceil(input.words / WORDS_PER_CREDIT));

  if (textLike && input.wantsRewrite) return byWords;

  return input.isFile ? 1 : byWords;
}

/**
 * A FORCED BALANCE, FOR DEVELOPMENT ONLY. Added 21 August 2026, session 10.
 *
 * Three of the states this interface has to get right are reachable only
 * through a real ledger: an empty balance, a wall, and the arrival straight
 * after signing up. A local Supabase is not available (06 row 11), so the
 * only way to see them for real used to be to spend real credits against the
 * hosted database in the right order. This lets /dev/credits pin a balance
 * instead, so the state can be LOOKED AT in the actual tool.
 *
 * Guarded twice: the constant below is compiled out of a production build,
 * and this is client-side display only. The server's ledger is untouched and
 * still refuses anything this cannot pay for.
 */
const DEV_BALANCE_KEY = 'uc.dev-balance';

function forcedCredits(): CreditsState | null {
  if (process.env.NODE_ENV !== 'development') return null;
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(DEV_BALANCE_KEY);

  if (!raw) return null;

  const [amount, who] = raw.split(':');
  const balance = Number(amount);

  if (!Number.isFinite(balance)) return null;

  return { balance, isAnonymous: who !== 'account' };
}

export async function fetchCredits(): Promise<CreditsState> {
  const forced = forcedCredits();

  if (forced) return forced;

  try {
    const response = await fetch('/api/credits', { cache: 'no-store' });
    const data = (await response.json()) as {
      balance: number | null;
      isAnonymous: boolean;
    };

    return {
      balance: data.balance,
      isAnonymous: data.isAnonymous !== false,
    };
  } catch {
    return { balance: null, isAnonymous: true };
  }
}

/**
 * Make sure the browser holds a session before a sanitise is attempted,
 * creating the anonymous guest account on first use. Lazy on purpose: a
 * visitor who only reads the page never becomes a row anywhere.
 *
 * The captcha token rides along when the site has captcha configured, which
 * is what lets Supabase's anonymous sign-in abuse protection be turned on
 * without changing this code.
 */
export async function ensureSession(
  supabase: SupabaseClient,
  captchaToken?: string,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return true;

  const { error } = await supabase.auth.signInAnonymously(
    captchaToken ? { options: { captchaToken } } : undefined,
  );

  return !error;
}

/**
 * The development bypass flag, kept from the old file: with this set, dev
 * requests carry a header the server honours only in development builds.
 */
const DEV_KEY = 'uc.dev-mode';

export function devMode(): boolean {
  if (typeof window === 'undefined') return false;

  return window.localStorage.getItem(DEV_KEY) === '1';
}

/**
 * WHAT IS CURRENTLY LYING TO YOU, so the interface can say so out loud.
 * Added 21 August 2026.
 *
 * Both of these switches make the credit system LOOK broken while working
 * perfectly: with the bypass on, a sanitise succeeds, charges nothing, creates
 * no session and writes no ledger row, so the balance sits at its opening
 * figure for ever. Jon hit exactly that and reasonably read it as a bug,
 * after being sent to /dev/credits to use the other switch on the same page.
 *
 * A testing tool that silently disables the thing under test is a trap. The
 * workbench now prints this state when either is set. Development only: both
 * constants are compiled out of a production build.
 */
export function devOverrides(): { bypass: boolean; forced: string | null } {
  if (process.env.NODE_ENV !== 'development') return { bypass: false, forced: null };
  if (typeof window === 'undefined') return { bypass: false, forced: null };

  return {
    bypass: window.localStorage.getItem(DEV_KEY) === '1',
    forced: window.localStorage.getItem(DEV_BALANCE_KEY),
  };
}
