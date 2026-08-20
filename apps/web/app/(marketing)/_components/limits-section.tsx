import Link from 'next/link';

import { ArrowRightIcon } from 'lucide-react';

/**
 * The argument, and it is the spine of the page.
 *
 * REBUILT 19 August 2026 under 04 entries 80 and 84 and docs/09.
 *
 * Two fixes from Jon's review of the previous version. The pills on the right
 * had no header, so a reader had no idea what "Anyone, today" was answering:
 * the column now carries the question. And the "Anthropic, in their own words"
 * box below told no story: the three quotes are gone from here and placed as
 * inline rebuttals in the sections where each doubt actually occurs
 * (stakes-section and moat-section), per the iFixit pattern in docs/09
 * section 6.
 *
 * The table's grammar is uniform on purpose: mark, where it hides, who can
 * check it. Same three answers on every row, so the third row's "not yet"
 * lands against two "todays". The contrast is the argument.
 */
const HEADERS = ['The mark', 'Where it hides', 'Can anyone check it?'];

const ROWS = [
  {
    mark: 'Hidden characters',
    where: 'Between your words',
    check: 'Anyone, today',
    now: true,
    body: 'ChatGPT leaves them behind and they survive every copy and paste. We name each one, show its position, and prove none are left.',
  },
  {
    mark: 'Metadata',
    where: 'Inside your file',
    check: 'Anyone, today',
    now: true,
    body: 'Claude signs every image it makes, and any free C2PA reader exposes it in one click. We strip it and prove it against the raw bytes.',
  },
  {
    mark: 'Statistical watermark',
    where: 'In the order of your words',
    check: 'Not yet. Anthropic is building it',
    now: false,
    body: 'Nothing is added to your text. The mark is your text: the exact sequence of words Claude chose. So it cannot be found. It has to be rewritten out.',
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
              Anthropic is building a detection tool anyone can use. It is
              not open yet. Documents Claude has already touched are already
              marked, and marks do not expire.
            </p>

            <Link
              href={'/how-it-works'}
              className={
                'text-foreground hover:bg-foreground/[0.045] mt-5 inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors'
              }
            >
              Each mark, drawn out
              <ArrowRightIcon
                className={'size-[14px]'}
                strokeWidth={2.2}
                aria-hidden
              />
            </Link>
            <Link
              href={'/capabilities'}
              className={
                'text-foreground hover:bg-foreground/[0.045] inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors'
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
            {/* The header row is desktop-only: on a phone each row repeats its
                own labels inline, so nothing depends on a header that scrolled
                away. 04 entry 84 ruling 3. */}
            <div
              className={
                'text-muted-foreground border-border/70 hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-x-4 border-b pb-2.5 text-[11px] font-semibold tracking-[0.07em] uppercase sm:grid'
              }
            >
              {HEADERS.map((header) => (
                <span key={header}>{header}</span>
              ))}
            </div>

            <ul className={'divide-border/70 divide-y'}>
              {ROWS.map((row) => (
                <li key={row.mark} className={'py-5'}>
                  <div
                    className={
                      'flex flex-col gap-y-1 sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] sm:items-baseline sm:gap-x-4'
                    }
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
                        'text-muted-foreground text-[13px] tracking-[-0.005em]'
                      }
                    >
                      {row.where}
                    </span>
                    <span>
                      <span
                        className={[
                          'inline-block rounded-full px-2 py-[2px] text-[10.5px] font-semibold tracking-wide uppercase',
                          row.now
                            ? 'bg-emerald-600/12 text-emerald-700'
                            : 'bg-mark/15 text-mark-strong',
                        ].join(' ')}
                      >
                        {row.check}
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      'text-muted-foreground mt-2 max-w-[68ch] text-[13.5px] leading-[1.6]'
                    }
                  >
                    {row.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
