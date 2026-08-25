'use client';

import { ShieldCheckIcon } from 'lucide-react';

import type { FreezeEstimate } from '~/lib/engine/types';

/**
 * THE THRESHOLD. One named constant, and the reasoning lives beside it.
 *
 * A pre-flight that interrupts ordinary work is worse than no pre-flight at
 * all, so the number is set from measurement rather than from taste. Measured
 * 25 August 2026 against the shipping freeze plan (`uc_freeze.freeze_fraction`,
 * the same function the paid rewrite runs) over 103 documents: every text
 * document in `engine/lab`, plus section-length pastes cut from the academic
 * ladder documents, plus a dialogue-heavy story and a quote-dense essay.
 *
 * What the measurement said, and it is not what the plan assumed:
 *
 *   ORDINARY WHOLE DOCUMENTS cluster tight and low. Business and essay prose
 *   with no quotations sits at 0.0%. Full academic documents carrying
 *   headings, quotations, block quotes and a reference list sit at 23.9% to
 *   29.7% across every length from 463 to 9,946 words.
 *
 *   SHORT PASTES ARE VOLATILE, and this is the part the original 14-document
 *   corpus could not see, because it only measured whole documents at seven
 *   fixed lengths. The same academic prose, cut to the section a student
 *   actually pastes, runs from 7.0% to 66.1%. A heading or a reference list is
 *   a small share of 5,000 words and a large share of 200.
 *
 *   SO THERE IS NO EMPTY BAND. The plan recorded a clean gap between 29.7% and
 *   52.3% and recommended 35% inside it. Once section pastes are measured the
 *   distribution is continuous from 30% to 66% with no gap anywhere, and the
 *   quote-dense documents (45.7% to 51.0%) sit inside the ordinary range
 *   rather than above it. No threshold separates the two populations cleanly.
 *   The number is therefore a trade, and it is chosen to be the best trade.
 *
 * Ordinary documents that fire, against quote-dense and fiction documents
 * caught, over those 103 documents:
 *
 *   above 25%   50 of 98 ordinary fire   5 of 5 caught   <- noise
 *   above 30%   22 of 98 ordinary fire   5 of 5 caught
 *   above 35%   11 of 98 ordinary fire   4 of 5 caught   <- the plan's number
 *   above 40%    7 of 98 ordinary fire   4 of 5 caught   <- THIS ONE
 *   above 50%    3 of 98 ordinary fire   1 of 5 caught   <- goes quiet too often
 *
 * 40% CATCHES EXACTLY WHAT 35% CATCHES AND INTERRUPTS FOUR FEWER ORDINARY
 * DOCUMENTS, so it dominates the planned number on this corpus. It also clears
 * the stable ordinary cluster's ceiling (29.7%) by ten points, so a normal
 * essay of any length never sees this, and sits five points under the
 * quote-dense cluster (45.7%), so the documents that need the warning get it.
 *
 * A WORD FLOOR WAS TESTED AND REJECTED. Requiring 500 words before firing cuts
 * ordinary firings to 1 of 98, but it silences the pre-flight on every
 * quote-dense and fiction document in the corpus, all of which are under 300
 * words. It suppresses the warning exactly where the fraction is highest.
 *
 * Full workings in docs/session-notes/preflight-and-two-claims.md.
 */
export const FREEZE_WARNING_ABOVE = 0.4;

/** Does this scan's freeze estimate warrant stopping the visitor? */
export function needsPreFlight(freeze: FreezeEstimate | undefined): boolean {
  if (!freeze) return false;
  if (freeze.words <= 0) return false;
  return freeze.fraction > FREEZE_WARNING_ABOVE;
}

/**
 * D4's pre-flight, which is Jon's ruling: before a visitor pays, they are told
 * what share of their document comes back exactly as they sent it, and given
 * Continue or Cancel. Ruled long ago, shipped in the engine with E-9, and never
 * built on screen until now. Board W-10.
 *
 * IT SITS IN FRONT OF THE CREDIT CHECK, not behind it. D4 says "before a
 * visitor pays", and the same principle is already open on the board as W-4:
 * telling somebody to buy credits for a job, and only then telling them
 * something about that job they might have refused, is the wrong order.
 *
 * CANCEL COSTS NOTHING. Nothing has been spent at this point: the number comes
 * from the free scan, which runs no model. Cancel returns to the scan exactly
 * as it was.
 *
 * ONE MESSAGE, ONE TONE. Jon's amendment of 25 August 2026 removed D4's
 * original louder variant above 60%. 04 entry 148.
 *
 * THE WORDING IS D4'S, FIXED ON THE BOARD, WITH THREE CHANGES AND NO OTHERS:
 *
 *   1. The percentages are rendered from this document rather than being the
 *      board's illustrative 42% and 58%. This is the change the brief
 *      mandated.
 *   2. The em dashes are gone. Jon's style rule forbids them anywhere a
 *      visitor reads, and the board itself flags that D4's wording broke it.
 *   3. "The other 58% gets the full rewrite" IS DROPPED, NOT REPLACED. The
 *      board records it as false (row 4) and assigns the replacement to Jon,
 *      because a chunk whose protected text cannot be verified on the way back
 *      is handed to the customer as their own original, unrewritten. See the
 *      corrected measurement below. Dropping a false clause needs no new ruling;
 *      writing a true replacement is a claim about what we disclose, and that
 *      is Jon's call. Nothing on screen now says anything about the remainder.
 *
 * "so it comes back character for character" came off, as redundant: the
 * heading above already says "exactly as you sent it".
 *
 * ★ "EVERYTHING ELSE GOES THROUGH THE FULL REWRITE" — Jon's ruling,
 * 25 August 2026, 04 entry 153. READ THIS BEFORE CHANGING THE VERB.
 *
 * "GOES THROUGH" IS LOAD-BEARING. It describes what happens
 * to the text, which is always true: every unfrozen chunk is sent to the model
 * and rewritten. It deliberately does NOT promise that every word comes back
 * changed, because sometimes it does not.
 *
 *   A chunk whose protected text cannot be verified on the way back is handed
 *   to the customer as their own original, unrewritten. Deduped over 200
 *   recorded runs (`_ladder_prev.jsonl` is a byte-identical copy of
 *   `ladder_25aug_campaign1.jsonl` and must be excluded or it double-counts a
 *   whole campaign):
 *
 *     runs containing at least one fallback   36 of 200   = 18.0%
 *     chunks that fell back                   43 of ~1425 =  3.0%
 *     share of a document unrewritten         mean 2.2%, median 0%, worst 16.7%
 *
 *   It is entirely a long-document effect: ZERO fallbacks across ~102 runs at
 *   919 words or fewer, rising to 18 of 26 runs at 9,946 words, because more
 *   chunks means more chances one fails.
 *
 *   Small on average, and still fatal to the wrong verb: when it does happen,
 *   up to 350 words of high entropy text that should have been rewritten come
 *   back exactly as sent.
 *
 * **"Gets the full rewrite" or "is rewritten" would be false for that chunk.**
 * "Goes through" is true every time: the chunk IS sent and rewritten, and a
 * result that cannot be safely reassembled is rejected rather than never
 * attempted. This is the wording the board flagged as false (row 4) coming back
 * in a form that is not. Do not tighten it. 04 entry 153.
 *
 * SEE ALSO 04 entry 154, open: the engine reports `chunks_fallback` and no file
 * in this app reads it, so the customer is never told when this happened.
 *
 * NOTE ALSO: this sentence says nothing about sanitising, on purpose. Layer A
 * runs on the WHOLE document before the freeze and before the rewrite
 * (server.py: "THE REWRITE RECEIVES THE CLEANED TEXT. Layer A already ran
 * above, on the original"), so the protected text IS sanitised of invisible
 * characters. Saying "we sanitise everything else" would imply it is not, and
 * would give away a real selling point. 04 entry 152.
 */
export function PreFlight({
  freeze,
  onContinue,
  onCancel,
}: {
  freeze: FreezeEstimate;
  onContinue: () => void;
  onCancel: () => void;
}) {
  /*
   * ROUNDED TO A WHOLE PERCENT, which is why the sentence keeps D4's word
   * "about". The underlying fraction is exact and is the one the rewrite
   * works to; a visitor does not need two decimal places to make this
   * decision.
   */
  const percent = Math.round(freeze.fraction * 100);

  return (
    <div
      role={'dialog'}
      aria-modal={'false'}
      aria-labelledby={'preflight-heading'}
      data-preflight={'open'}
      className={'bg-card/70 relative grid min-h-[184px] place-items-center rounded-[13px] px-5 py-7'}
    >
      <div className={'flex max-w-[44ch] flex-col items-center gap-3 text-center'}>
        <span
          className={
            'bg-mark text-mark-foreground grid size-[34px] shrink-0 place-items-center rounded-[10px]'
          }
        >
          <ShieldCheckIcon className={'size-[16px]'} strokeWidth={2} aria-hidden />
        </span>

        <h3
          id={'preflight-heading'}
          data-preflight-percent={percent}
          className={'text-foreground text-[15px] font-semibold tracking-[-0.015em]'}
        >
          We will return about {percent}% of this document exactly as you sent
          it.
        </h3>

        <p className={'text-muted-foreground text-[13px] leading-snug'}>
          That is text we have protected from being reworded, such as
          quotations, references and headings. Everything else goes through the
          full rewrite.
        </p>

        <div className={'mt-1 flex flex-wrap items-center justify-center gap-2'}>
          <button
            type={'button'}
            onClick={onContinue}
            data-preflight-action={'continue'}
            className={
              'bg-mark text-mark-foreground hover:bg-mark-strong rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors active:scale-[0.98]'
            }
          >
            Continue
          </button>
          <button
            type={'button'}
            onClick={onCancel}
            data-preflight-action={'cancel'}
            className={
              'text-muted-foreground hover:text-foreground rounded-[9px] px-3 py-2 text-[13px] font-medium transition-colors'
            }
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
