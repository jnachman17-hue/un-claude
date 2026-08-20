import { FileTextIcon, ImageIcon, TypeIcon } from 'lucide-react';

import { LiveCounter } from './live-counter';
import { Workbench } from './workbench/workbench';

/**
 * The hero, and it is the product rather than a picture of one.
 *
 * 04 entry 20: the landing page IS the tool. A stranger arrives, uses it, and
 * hits a limit that asks them to register. The box scans itself on arrival, so
 * the first thing anyone sees is the product working on real text.
 */

/**
 * One measured figure per layer, and the labelling is what makes it legal.
 *
 * REPLACED 19 August 2026. This slot held Free / Nothing stored / Nothing lost,
 * 04 entry 78. Jon's verdict on it: "the free, nothing stored, nothing lost on
 * the left is awful. We need to replace that with data and metrics."
 *
 * THE RULE THAT KILLED THE TWO ATTEMPTS BEFORE THAT still stands, 04 entry 78
 * ruling 3: a claim in a whole-service slot has to be true of the whole
 * service. "Every mark shown in place" over-promises for Claude text, which has
 * no visible mark. "Zero figures changed" is meaningless over a PNG.
 *
 * The way out is not a weaker claim, it is a scoped one. EACH FIGURE NAMES THE
 * LAYER IT BELONGS TO, so nothing is claimed beyond where it is true, and the
 * three of them teach the three layers on the way past.
 *
 * All measured on our own test documents, which the line beneath them says.
 */
const RESULTS = [
  {
    figure: '9',
    layer: 'Hidden characters',
    label: 'classes of invisible character checked on every scan.',
  },
  {
    figure: '100%',
    layer: 'Metadata',
    label: 'of the record removed, checked against the file\u2019s raw bytes.',
  },
  {
    figure: '90%+',
    layer: 'Statistical watermark',
    label: 'of your three word sequences broken by the rewrite.',
  },
];

const HANDLES = [
  { icon: TypeIcon, label: 'Pasted text' },
  { icon: FileTextIcon, label: 'Word documents' },
  { icon: ImageIcon, label: 'PNG and JPG' },
];

export function HeroSection() {
  return (
    <section className={'relative overflow-hidden'}>
      {/* A last touch of warmth directly behind the tool. The page-level
          gradient in globals.css now carries most of it, so this dropped from
          0.16 to 0.07 rather than being removed: the box is still the brightest
          thing on the page, just no longer by a wide margin. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute top-[-18%] right-[-10%] h-[560px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.07] blur-[90px]'
        }
      />

      <div
        className={
          'relative mx-auto max-w-[1180px] px-5 pt-7 pb-14 sm:px-8 lg:pt-12'
        }
      >
        {/*
          THE TOOL COMES FIRST ON A PHONE. 06 row 75.

          This was one grid with two children, headline-column and box-column,
          and on one column that stacks the box THIRD: header, headline,
          subtitle, three statistics, and only then the product. Measured at
          375x812 the box began roughly two screens down, so a visitor arriving
          from a phone never saw the thing they came for.

          So the left column is split in two and the order is set explicitly.
          Narrow: headline, BOX, statistics. Wide: the original two columns,
          restored with col-start and row-start rather than by source order.
        */}
        <div
          className={
            'flex flex-col gap-7 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 lg:gap-y-7'
          }
        >
          <div
            className={
              'animate-rise order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-6'
            }
          >
            <h1
              className={
                'text-foreground text-[30px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[52px] lg:leading-[1.04] lg:tracking-[-0.032em]'
              }
            >
              Remove the watermark Claude puts in your writing.
            </h1>

            <p
              className={
                'text-muted-foreground mt-3.5 max-w-[38ch] text-[15px] leading-[1.55] tracking-[-0.006em] lg:mt-5 lg:text-[16px] lg:leading-[1.6]'
              }
            >
              Paste text or drop a file. We find every mark that identifies it
              as AI written, and sanitise it.
            </p>
          </div>

          <div
            className={
              'animate-rise order-3 hidden lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:block'
            }
          >
            <dl
              className={
                'border-border/70 grid max-w-[40ch] gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-3'
              }
            >
              {RESULTS.map((result) => (
                <div key={result.figure}>
                  <dt
                    className={
                      'text-foreground font-mono text-[22px] leading-none font-medium tracking-[-0.03em] tabular-nums'
                    }
                  >
                    {result.figure}
                  </dt>
                  <dd
                    className={
                      'text-muted-foreground mt-1.5 text-[11.5px] leading-[1.45]'
                    }
                  >
                    {/* The layer name carries the scope. Without it each figure
                        reads as a claim about the whole service, which is the
                        exact failure 04 entry 78 ruling 3 records twice. */}
                    <span
                      className={'text-foreground/85 block font-semibold'}
                    >
                      {result.layer}
                    </span>
                    {result.label}
                  </dd>
                </div>
              ))}
            </dl>

            <p
              className={
                'text-muted-foreground/70 mt-3 max-w-[40ch] text-[11px] leading-snug'
              }
            >
              Measured on our own test documents, not estimated.
            </p>
          </div>

          <div
            className={
              'animate-rise order-2 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:order-none'
            }
            style={{ animationDelay: '110ms' }}
          >
            <Workbench />

            <ul
              className={
                'mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1'
              }
            >
              {HANDLES.map((handle) => (
                <li
                  key={handle.label}
                  className={
                    'text-muted-foreground inline-flex items-center gap-1.5 text-[12px]'
                  }
                >
                  <handle.icon
                    className={'size-[13px]'}
                    strokeWidth={1.9}
                    aria-hidden
                  />
                  {handle.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/*
        The counter, standing on its own.

        The heading and claim that used to sit above it were built on a misread
        of Jon — he was asking for the scope of the problem to be clear FLUIDLY
        THROUGHOUT the site, meaning a visitor should understand which mark is
        theirs, not for a headed block of statistics. Correction under 04 entry
        76, and the three industry figures that shared the row are parked in
        docs/PARKED-CONTENT.md rather than deleted. 04 entry 78.
      */}
      <div
        className={'relative mx-auto max-w-[1180px] px-5 pt-4 pb-20 sm:px-8'}
      >
        <div className={'max-w-[52ch]'}>
          <LiveCounter />
        </div>
      </div>
    </section>
  );
}
