import { FileTextIcon, ImageIcon, TypeIcon } from 'lucide-react';

import { FactCards } from './fact-cards';
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
 * Every figure here is real and sourced, and that is deliberate.
 *
 * Jon suggested inventing some. The honest ones are stronger: they describe the
 * mechanism rather than decorating it, and Anthropic has a detector in
 * development, which is the day every fabricated number in this category becomes
 * checkable at once. Sources: ENGINE.md section 2, researched 18 August 2026.
 */
const RESULTS = [
  {
    figure: '100%',
    label: 'of provenance data removed, checked against the file’s raw bytes',
  },
  {
    figure: '90%+',
    label: 'of your three word sequences broken by the rewrite',
  },
  {
    figure: '0',
    label: 'figures lost across every document we have tested',
  },
];

const FACTS = [
  {
    figure: '5 of 8',
    label: 'of the largest AI labs already mark what they generate',
    detail:
      'Anthropic, Google, OpenAI, Adobe and the hosted Stability and Flux services all attach a signed provenance record to the files they produce. They converged on one format, C2PA. Every major lab has also signed the European transparency code, so the remaining three are a question of when rather than whether.',
  },
  {
    figure: '2.5bn',
    label: 'prompts answered by ChatGPT alone, every day',
    detail:
      'Reported in 2026, and that is one product from one company. The volume of machine written text now in circulation is not something any person or organisation can audit by reading it, which is exactly why the marks exist and why they are invisible.',
  },
  {
    figure: 'Aug 2026',
    label: 'when Claude began watermarking the text it writes',
    detail:
      'Anthropic applies it to models launched from 2 August 2026, globally, with no way to opt out. Google already does the same to Gemini through SynthID. Neither mark can be detected by any public tool, which is why the only answer available today is removal rather than checking.',
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
              'animate-rise order-3 lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:order-none'
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

      <div className={'relative mx-auto max-w-[1180px] px-5 pb-20 sm:px-8'}>
        <div className={'grid gap-4 lg:grid-cols-12'}>
          <div className={'lg:col-span-7'}>
            <LiveCounter />
          </div>
          <div className={'lg:col-span-5'}>
            <FactCards facts={FACTS} />
          </div>
        </div>
      </div>
    </section>
  );
}
