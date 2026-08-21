'use client';

import { useState } from 'react';

import { PlusIcon } from 'lucide-react';

/**
 * PROSE THAT A PHONE HAS TO ASK FOR. Added 21 August 2026, session 10.
 *
 * Jon's brief for the mobile pass: "There's so much to read and it's just
 * blobs of information and text. We're going to need to use way less text on
 * mobile than we do on web... we're going to need to really utilise plus
 * icons to expand sections if you actually want to look at them."
 *
 * So this is the plus icon. Below `sm` the children are hidden behind a
 * labelled control and default to closed. From `sm` upward the control
 * disappears and the children are simply there, exactly as they were, because
 * a desktop reader has the room and the patience the phone reader does not.
 *
 * NOTHING IS DELETED BY USING THIS, WHICH IS THE POINT. The claims boundary
 * survives a collapse in a way it does not survive a cut: shortening copy is
 * the easiest way to drop a caveat by accident, and a caveat behind a plus is
 * still on the page, still in the markup, and still read by anything that
 * indexes it.
 *
 * DO NOT PUT A LOAD-BEARING CLAIM IN HERE ON ITS OWN. What goes behind the
 * control is explanation. What must be read stays outside it.
 */
export function MobileDisclosure({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  const [open, setOpen] = useState(false);

  return (
    // `display: contents` from `sm` up: the wrapper and the control dissolve
    // and the children become direct children of whatever laid this out, so
    // the desktop rendering is byte for byte the one that existed before this
    // component was introduced, gaps and all.
    <div className={'sm:contents'}>
      <button
        type={'button'}
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className={
          'text-foreground border-border/70 hover:bg-foreground/[0.03] flex w-full items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors sm:hidden'
        }
      >
        {label}
        <span
          aria-hidden
          className={[
            'bg-foreground/[0.07] text-foreground/60 grid size-[20px] shrink-0 place-items-center rounded-full transition-transform duration-300',
            open ? 'rotate-45' : '',
          ].join(' ')}
        >
          <PlusIcon className={'size-[11px]'} strokeWidth={2.8} />
        </span>
      </button>

      <div
        className={[
          'sm:!contents',
          open ? 'mt-3 flex flex-col gap-3.5' : 'hidden',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
