import Link from 'next/link';

import { ArrowRightIcon } from 'lucide-react';

/**
 * The argument, and it is the spine of the page.
 *
 * REWRITTEN 19 August 2026 from "Two of these we can prove. One we cannot."
 *
 * That framing was built when nobody could check a text watermark and nobody
 * was going to. It is out of date. Anthropic confirmed on 12 August that a
 * detection API "that you can use yourself" is coming, published further detail
 * on 15 August, and its explainer of 16 August says a check returns a
 * probability rather than a verdict. 04 entry 80.
 *
 * So the honest description flipped from "nobody can ever check this" to
 * "nobody can check this YET", and that one word turns the section from a
 * disclaimer into the reason to act. Jon: "we're here to sell, convert."
 *
 * The three supporting facts are all Anthropic's own public material. The first
 * is the strongest citation this product has: the company that built the
 * watermark describes the method that removes it.
 */
const ROWS = [
  {
    mark: 'Hidden characters',
    where: 'Between your words',
    check: 'Anyone, today',
    now: true,
    body: 'Real characters that take up no space. ChatGPT emits them and they survive copy, paste and export. We name every one, give its exact position, remove it, and read the text back to confirm none are left.',
  },
  {
    mark: 'Metadata',
    where: 'Inside the file',
    check: 'Anyone, today',
    now: true,
    body: 'A signed record naming what made the file. Claude signs every image it generates and any free public tool can read it. We strip it and show you the file before and after, verified against the raw bytes.',
  },
  {
    mark: 'Statistical watermark',
    where: 'In the word sequence itself',
    check: 'Not yet. Anthropic is building it',
    now: false,
    body: 'It is not hidden in your words. It is your words: the exact order Claude chose them in. We rebuild every sentence so no more than three words in a row survive, and check your facts and your length against your original.',
  },
];

/** All three from Anthropic's own public material. None of it is our claim. */
const FACTS = [
  {
    head: 'Anthropic says rewriting with another model removes it',
    body: 'The company that built the watermark describes the method that defeats it. That is their published position, not our promise.',
  },
  {
    head: 'A check returns a probability, never a yes or a no',
    body: 'There is no verdict at the end of this. Anthropic’s own explainer says so. Which means the work is reducing a signal, and a signal can be measured.',
  },
  {
    head: 'A mark means Claude touched it, not that Claude wrote it',
    body: 'Edit one paragraph of your own essay and you carry the same mark as someone who generated the whole thing from a prompt. The mark does not record how much you did.',
  },
];

export function LimitsSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'grid gap-10 lg:grid-cols-12 lg:gap-14'}>
          <div className={'lg:col-span-4'}>
            <h2
              className={
                'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
              }
            >
              Two of these anyone can check today. The third is about to be.
            </h2>
            <p
              className={
                'text-muted-foreground mt-4 max-w-[42ch] text-[15px] leading-[1.6]'
              }
            >
              Anthropic has committed publicly to a detection tool that anyone
              can use. It is not open yet. Every document already written and
              already handed in still carries the mark on the day it opens.
            </p>

            <Link
              href={'/capabilities'}
              className={
                'text-foreground hover:bg-foreground/[0.045] mt-5 inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors'
              }
            >
              Exactly what we can and cannot do
              <ArrowRightIcon
                className={'size-[14px]'}
                strokeWidth={2.2}
                aria-hidden
              />
            </Link>
          </div>

          <div className={'lg:col-span-8'}>
            <ul className={'divide-border/70 divide-y'}>
              {ROWS.map((row) => (
                <li key={row.mark} className={'py-5 first:pt-0'}>
                  <div
                    className={'flex flex-wrap items-baseline gap-x-3 gap-y-1'}
                  >
                    <h3
                      className={
                        'text-foreground text-[15px] font-semibold tracking-[-0.015em]'
                      }
                    >
                      {row.mark}
                    </h3>
                    <span
                      className={
                        'text-muted-foreground text-[12.5px] tracking-[-0.005em]'
                      }
                    >
                      {row.where}
                    </span>
                    <span
                      className={[
                        'ml-auto rounded-full px-2 py-[2px] text-[10.5px] font-semibold tracking-wide uppercase',
                        row.now
                          ? 'bg-emerald-600/12 text-emerald-700'
                          : 'bg-mark/15 text-mark-strong',
                      ].join(' ')}
                    >
                      {row.check}
                    </span>
                  </div>
                  <p
                    className={
                      'text-muted-foreground mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.6]'
                    }
                  >
                    {row.body}
                  </p>
                </li>
              ))}
            </ul>

            {/* Anthropic's own material, kept visually separate from our rows so
                it is obvious whose claims these are. */}
            <div className={'border-border/70 mt-8 border-t pt-8'}>
              <p
                className={
                  'text-muted-foreground text-[11px] font-semibold tracking-wide uppercase'
                }
              >
                Anthropic, in their own words
              </p>
              <div className={'mt-4 grid gap-5 sm:grid-cols-3'}>
                {FACTS.map((fact) => (
                  <div key={fact.head}>
                    <h4
                      className={
                        'text-foreground text-[13.5px] leading-[1.35] font-semibold tracking-[-0.012em]'
                      }
                    >
                      {fact.head}
                    </h4>
                    <p
                      className={
                        'text-muted-foreground mt-1.5 text-[12.5px] leading-[1.55]'
                      }
                    >
                      {fact.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
