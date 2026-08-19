'use client';

import { useState } from 'react';

import { PlusIcon } from 'lucide-react';

/**
 * The three facts, as cards you can open.
 *
 * The figure carries the impact and the detail is one click away, so the strip
 * reads in about two seconds and still rewards anyone who wants the substance.
 * Every number here is real. None were invented, and Jon caught the one that was
 * wrong: an earlier version claimed all Claude output has been watermarked since
 * 2 August 2026, which overstates what Anthropic has actually said.
 */
export interface Fact {
  figure: string;
  label: string;
  detail: string;
}

export function FactCards({ facts }: { facts: Fact[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <dl className={'grid gap-3 sm:grid-cols-3'}>
      {facts.map((fact, index) => {
        const isOpen = open === fact.figure;

        return (
          <div
            key={fact.figure}
            className={'animate-rise'}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <button
              type={'button'}
              onClick={() => setOpen(isOpen ? null : fact.figure)}
              aria-expanded={isOpen}
              className={[
                'bg-card ring-border/70 group flex w-full flex-col rounded-[15px] p-5 text-left ring-1',
                'transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0',
                isOpen
                  ? 'ring-mark-strong shadow-[0_8px_30px_-12px_rgba(0,0,0,0.14)]'
                  : 'hover:shadow-[0_8px_30px_-14px_rgba(0,0,0,0.12)]',
              ].join(' ')}
            >
              <div className={'flex w-full items-start justify-between gap-3'}>
                <dt
                  className={
                    'text-foreground font-mono text-[32px] leading-none font-medium tracking-[-0.03em] tabular-nums'
                  }
                >
                  {fact.figure}
                </dt>

                <span
                  className={[
                    'grid size-[22px] shrink-0 place-items-center rounded-full transition-all duration-300',
                    isOpen
                      ? 'bg-mark text-mark-foreground rotate-45'
                      : 'bg-foreground/[0.055] text-foreground/45 group-hover:bg-foreground/[0.09]',
                  ].join(' ')}
                >
                  <PlusIcon className={'size-[12px]'} strokeWidth={2.6} aria-hidden />
                </span>
              </div>

              <dd className={'text-foreground mt-3 text-[13.5px] leading-snug font-medium'}>
                {fact.label}
              </dd>

              {/* Grid rows animate to auto height without measuring anything. */}
              <dd
                className={[
                  'grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                ].join(' ')}
              >
                <span className={'overflow-hidden'}>
                  <span className={'text-muted-foreground block text-[12.5px] leading-[1.6]'}>
                    {fact.detail}
                  </span>
                </span>
              </dd>
            </button>
          </div>
        );
      })}
    </dl>
  );
}
