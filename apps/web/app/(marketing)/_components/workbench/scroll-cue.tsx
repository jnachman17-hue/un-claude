'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ArrowDownIcon } from 'lucide-react';

/**
 * "THERE IS SOMETHING DOWN THERE." six-ui-fixes fix 3, Jon's instruction,
 * 25 August 2026: *"a dynamic arrow pointing downwards you click or something
 * so people actually see receipts."*
 *
 * What it is for. A visitor scans, the answer lands below the fold, and the
 * screen they are looking at gives no sign that anything happened further
 * down. They read the box, conclude that was it, and never see the findings
 * that justify the product.
 *
 * ★ THE RULE THIS PROJECT KEEPS NEARLY BREAKING. A cue that is always there is
 * furniture and gets ignored; a cue pointing at something already on screen is
 * noise. This one is mounted only when BOTH are true:
 *
 *   1. there is a result to look at, which the caller decides, and
 *   2. that result is actually out of view, which is measured here, live, off
 *      the real element's own position rather than guessed from a viewport
 *      height.
 *
 * So it cannot fire on a screen where the findings are already visible, which
 * is most phones, and it removes itself the moment they come into view whether
 * that happened because it was clicked or because the visitor scrolled by
 * themselves.
 *
 * IT IS A REAL BUTTON. Keyboard reachable, focusable in the ordinary order, it
 * says what it does rather than being an unlabelled arrow, and its motion is
 * governed by the global reduced-motion rule. Screen readers get the label and
 * nothing else: the icon is decorative and hidden.
 *
 * MEASURED ON SCROLL AND RESIZE, NOT WITH AN IntersectionObserver, and that is
 * a deliberate downgrade. The observer version of this was written first and
 * NEVER FIRED ONCE in testing: its callback did not arrive at all, so
 * `outOfView` stayed false and the cue never appeared on a page where the
 * findings were plainly 137px below the fold. A cue that silently does nothing
 * is worse than no cue, and it would have shipped looking correct in review.
 *
 * `getBoundingClientRect` on scroll and resize is the older, duller instrument
 * and it is right every time. The listeners are passive and the work is one
 * rect read behind a `requestAnimationFrame` gate, so it costs nothing, and it
 * only runs at all while there is a result on screen.
 *
 * The 96px margin is why "visible" is not "one pixel over the line". An element
 * whose first pixel has just crossed the fold is not readable yet, and a cue
 * that vanished at that moment would be pulling away exactly as somebody
 * reached for it.
 */
const SEEN_MARGIN = 96;

export function ScrollCue({
  targetRef,
  active,
  label = 'See what we found',
}: {
  /** The thing the visitor should be looking at. */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Is there anything worth pointing at right now? The caller decides. */
  active: boolean;
  label?: string;
}) {
  const [outOfView, setOutOfView] = useState(false);
  /**
   * Once they have been taken there, this cue is finished for this result.
   *
   * Without it, scrolling back up to the box, which is a normal thing to do
   * after reading the findings, brings the arrow back and points it at
   * something they have already read.
   */
  const [dismissed, setDismissed] = useState(false);
  const previousTarget = useRef<HTMLElement | null>(null);
  /**
   * Portals need a DOM that exists, so nothing is rendered on the server.
   * This is a hint pointing at live layout; it has no business in the HTML a
   * crawler reads.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = targetRef.current;

    // A new result means a new thing to point at, so the cue is allowed back.
    if (node !== previousTarget.current) {
      previousTarget.current = node;
      setDismissed(false);
    }

    if (!active || !node) {
      setOutOfView(false);
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      const top = node.getBoundingClientRect().top;
      // Out of view means: its top edge has not yet risen far enough up the
      // window for any of it to be readable.
      setOutOfView(top >= window.innerHeight - SEEN_MARGIN);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active, targetRef]);

  if (!mounted || !active || !outOfView || dismissed) return null;

  /*
   * ★ PORTALLED TO <body>, AND IT HAS TO BE.
   *
   * `position: fixed` is resolved against the nearest ancestor that has a
   * transform, not against the window. Every column in the hero carries
   * `animate-rise`, whose end state is a transform, so a fixed element
   * rendered inside the workbench is positioned against THAT box.
   *
   * Measured before this was fixed: at a 500px viewport the cue rendered at
   * y=631, which is 131px below the bottom of the window, and x=796 rather
   * than centred. It was "visible" to the DOM and invisible to the visitor,
   * which is the worst of both. The portal takes it out of the transformed
   * subtree so bottom-5 means five from the bottom of the window.
   */
  return createPortal(
    <div
      className={
        'pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4'
      }
    >
      <button
        type={'button'}
        onClick={() => {
          const node = targetRef.current;
          setDismissed(true);
          if (!node) return;

          const before = window.scrollY;
          const quiet = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches;

          node.scrollIntoView({
            behavior: quiet ? 'auto' : 'smooth',
            block: 'start',
          });

          /*
           * ★ AND THEN CHECK IT ACTUALLY MOVED.
           *
           * `behavior: 'smooth'` is reported as supported by
           * `'scrollBehavior' in document.documentElement.style` and can still
           * do nothing at all. Measured in this project's own preview browser:
           * feature detection returns true, the same call with
           * `behavior: 'auto'` scrolls correctly, and the smooth call leaves
           * `scrollY` at 0 a full second later. Feature detection does not
           * catch it, because nothing is missing; the animation simply never
           * runs.
           *
           * A button whose entire purpose is "take me there" must not be able
           * to silently do nothing, so this reads the position back and jumps
           * the plain way if the smooth path did not take. In a browser where
           * smooth works, the scroll is already under way and `scrollY` has
           * moved, so this never fires.
           */
          if (quiet) return;
          window.setTimeout(() => {
            if (Math.abs(window.scrollY - before) < 2) {
              node.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }, 350);
        }}
        className={
          'animate-cue-in bg-foreground text-background pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-[0_6px_24px_-6px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.97]'
        }
      >
        {label}
        <span className={'animate-cue-nudge inline-flex'}>
          <ArrowDownIcon className={'size-[15px]'} strokeWidth={2.4} aria-hidden />
        </span>
      </button>
    </div>,
    document.body,
  );
}
