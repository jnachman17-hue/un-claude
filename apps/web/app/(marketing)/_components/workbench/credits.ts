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
import { useSyncExternalStore } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The whole free tier, since 21 September 2026 (04 entry 166). There used to
 * be a SIGNUP_CREDITS of 3 beside this; creating an account earns nothing now.
 * Mirrors `lib/server/credits.ts` and `pricing/_components/pricing-data.ts`.
 */
export const WELCOME_CREDITS = 2;
export const WORDS_PER_CREDIT = 1_000;

/**
 * The most words one rewrite will accept.
 *
 * 8,000 SINCE 25 AUGUST 2026, DOWN FROM 10,000, and the reasoning is not
 * mine: `docs/session-notes/freeze-every-quotation.md` §5.5 derived it and
 * handed the number back for someone else to write down. The ceiling is TIME,
 * not size. The site aborts a job at 240 seconds and documents run as waves of
 * 8 parallel calls:
 *
 *    8,000 words -> 23 chunks -> 3 waves   at 65s a wave = 195s   FITS
 *   10,000 words -> 29 chunks -> 4 waves   at 65s a wave = 260s   DOES NOT
 *
 * 65 seconds is THE ONLY PER-WAVE FIGURE EVER MEASURED IN PRODUCTION (478
 * words, 64.982s). Every faster number this project holds came from the lab on
 * a good day. 8,000 is the largest round number that survives the worst
 * production figure on record.
 *
 * ★ THIS NO LONGER MATCHES `UC_MAX_WORDS`, AND THE DISAGREEMENT IS ON PURPOSE.
 *
 * The Python engine still refuses at 10,000 and is another lane's territory.
 * So the two numbers now mean two different things, and that is the honest
 * arrangement rather than a bug:
 *
 *   - 8,000 is what the site ADVERTISES AND STANDS BEHIND. It declines here,
 *     before the button and before any money moves.
 *   - 10,000 is where the engine hard-refuses, unchanged, as a backstop.
 *
 * The direction is the safe one. This gate is stricter than the server's, so
 * nothing is charged for a job that is then refused, and no job that starts is
 * at any new risk.
 *
 * ★ AND IT IS ADVISORY RATHER THAN ENFORCED. `workbench.tsx` reads
 * `scan?.billing?.over_limit ?? wordsNow > MAX_WORDS`, so ONCE A SCAN HAS RUN
 * THE SERVER'S ANSWER WINS and a scanned 9,000 word document is still allowed
 * through. Closing that needs `UC_MAX_WORDS` to come down to 8,000, which is
 * Lane A's, and it is written up in
 * `docs/session-notes/tell-the-truth-about-runs.md` §5.
 */
export const MAX_WORDS = 8_000;

/**
 * The fewest words the rewrite will accept.
 *
 * MUST MATCH `UC_LAYER_B_MIN_WORDS` in apps/web/engine/server.py, which is what
 * actually enforces it. Below this the engine does not call a model at all: it
 * returns the run as `skipped: input_too_short` with a `reason` explaining
 * itself, runs layers A and metadata as normal, and the route charges for it
 * anyway.
 *
 * WHY THE NUMBER IS 16 AND NOT A ROUND FIGURE. Measured end to end during the
 * prompt-leak session: every defective output the engine has ever produced had
 * an input of 15 words or fewer, and 144 runs across the 16-to-32 word band
 * produced none. A statistical watermark is not present, let alone detectable,
 * in a handful of words.
 *
 * WHAT THIS COPY IS FOR, Jon's ruling of 23 August 2026: the minimum goes at
 * the FRONT DOOR. The engine's own explanation was reaching the browser and
 * nothing rendered it, so a customer paid a credit, got their text back byte
 * for byte, and read "Rewritten · Measured, not estimated" with 0% replaced
 * above it. The button is now refused before the money moves, with the reason
 * on screen. The free scan is unaffected at any length.
 */
export const MIN_REWRITE_WORDS = 16;

/**
 * ★ NOT DISPLAYED ANYWHERE SINCE 25 AUGUST 2026. Kept, not deleted, so the
 * measurements below are not lost, and so a future session finds this warning
 * rather than the function on its own.
 *
 * DO NOT WIRE THIS BACK INTO THE INTERFACE without a production measurement
 * behind it. Every figure in it is from the lab. THE ONE PRODUCTION FIGURE
 * THIS PROJECT HAS BROKE IT: 478 words took 65 seconds on deepseek, and this
 * function quotes that document 10 seconds. It is out by 6.5x on the only
 * real-world case anyone has ever checked it against, in the direction that
 * makes a working tool look hung.
 *
 * It is also model-dependent, and the model is under review. The same 478-word
 * paste took 2.9 seconds on mistral-small. Any constant here is a promise about
 * whichever model happens to be wired up on the day it was measured.
 *
 * The interface now says "a few minutes" on a long document and shows the real
 * elapsed seconds while it runs, which is true on every model measured and
 * cannot go stale. See docs/session-notes/tell-the-truth-about-runs.md §6.
 *
 * ORIGINAL REASONING, KEPT VERBATIM: "Roughly how long a rewrite of this many
 * words will take, rounded UP, so the number shown to somebody waiting is a
 * ceiling they beat rather than a promise they watch slip. 15 seconds per 1,000
 * words comes from the worst measured run (7,848 words in 104 seconds, 13.4s
 * per 1,000). Time tracks retries rather than length — the 7,848 word document
 * took LONGER than the 10,464 word one — so this is honest as an upper bound
 * and would be dishonest as an estimate."
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
  /*
   * THIS LIST USED TO BE THE ONE THE STRIPE AUDIT REMOVED FROM THE ROUTE.
   * It still said `.md|.markdown`, which the server treats as a CONTAINER and
   * charges one flat credit for, so a .md upload was QUOTED per 1,000 words and
   * CHARGED one. Quoted more than charged is the safe direction, but the two
   * disagreeing is how the 100x undercharge happened in the first place.
   *
   * `.md` is refused at the door as of 21 August 2026, and this now mirrors the
   * server's own `ENGINE_TEXT_EXTS` for what remains. `verify-pricing-matches-
   * engine.mjs` guards the server's copy against the engine's.
   */
  const textLike = !input.isFile || /\.(txt|text)$/i.test(input.name);
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

/**
 * ONE BALANCE, READ IN TWO PLACES, AND UNTIL NOW THEY DISAGREED ON SCREEN.
 * 23 August 2026, LAUNCH-CHECKLIST 6d, photographed by the F1 audit.
 *
 * The header held its own `useState`, filled once from /api/credits when the
 * page loaded and never read again. The workbench chip took its number from
 * the sanitise response. So the moment a credit was spent the two numbers
 * differed — seven at the top of the page and six in the middle, at the same
 * instant, both about money — and nothing but a navigation would settle it.
 *
 * Two components cannot hold two copies of one fact. This is the fact, once:
 * a module-level value plus the React subscription both of them read through.
 * Whoever learns a newer balance publishes it here and every reader updates
 * in the same frame.
 *
 * WHY NOT POLL. A timer would be a request per visitor per interval, for ever,
 * for a number that changes only when the visitor does something. The balance
 * moves on exactly three occasions and each one already has a moment attached:
 * a sanitise answers with the new balance, a refused sanitise triggers a
 * refetch, and coming back to the tab after buying credits fires `focus`. The
 * header listens for the third; the workbench publishes the first two.
 */
let snapshot: CreditsState = { balance: null, isAnonymous: true };

/**
 * The server render has no browser, so it must be a value that never changes
 * between calls: `useSyncExternalStore` compares the server snapshot by
 * identity and re-renders for ever if a fresh object comes back each time.
 */
const SERVER_SNAPSHOT: CreditsState = { balance: null, isAnonymous: true };

const listeners = new Set<() => void>();

/** Tell every reader on the page what the balance now is. */
export function publishCredits(next: CreditsState): void {
  if (
    next.balance === snapshot.balance &&
    next.isAnonymous === snapshot.isAnonymous
  ) {
    return;
  }

  snapshot = next;

  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** The balance right now, outside a render. */
export function creditsNow(): CreditsState {
  return snapshot;
}

/** The balance, live, wherever it is needed. */
export function useCredits(): CreditsState {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

/**
 * Ask the server and publish the answer.
 *
 * Concurrent callers share one request. The home page has two readers that
 * both want the balance the moment they mount, and without this it asked
 * /api/credits twice on every load.
 */
let inFlight: Promise<CreditsState> | null = null;

export function refreshCredits(): Promise<CreditsState> {
  if (inFlight) return inFlight;

  inFlight = fetchCredits()
    .then((next) => {
      publishCredits(next);

      return next;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
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
