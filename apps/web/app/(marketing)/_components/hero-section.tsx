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
 * Three claims about OUR TOOL, in words a stranger can check against their own
 * document.
 *
 * Every figure is real and sourced. Jon suggested inventing some; the honest
 * ones are stronger, because they describe the mechanism rather than decorating
 * it, and Anthropic has a detector in development — the day it ships, every
 * fabricated number in this category becomes checkable at once. Sources:
 * ENGINE.md section 2, researched 18 August 2026.
 *
 * REWRITTEN 19 August 2026 for plain English. 04 entry 76. The previous set read
 * "of provenance data removed, checked against the file's raw bytes", "of your
 * three word sequences broken by the rewrite" and "figures lost". Jon, who has
 * worked on this project from the first day: "these stats make no sense there to
 * me. Like whatsoever." If he cannot read them, nobody arriving cold can.
 *
 * The numbers did not change. Only the words did.
 */
const RESULTS = [
  {
    figure: '100%',
    label:
      'of the hidden tags in a file removed, and we open the file again afterwards to prove it',
  },
  {
    figure: '9 in 10',
    label:
      'three-word runs of your original wording gone after a rewrite. Runs are where the mark hides',
  },
  {
    figure: '0',
    label:
      'numbers, dates or names changed by mistake, across every document we have tested',
  },
];

/**
 * Three facts about THE PROBLEM, not about us. Jon asked for this block to be
 * "a scope of the problem type section and we name it that". 04 entry 76.
 *
 * Each one is sourced and none is rounded up to sound bigger. The scale point is
 * made by naming what a single product does in a day and letting the reader do
 * the multiplication, rather than by inventing an industry total nobody
 * publishes.
 */
const FACTS = [
  {
    figure: '5 of 8',
    label: 'of the biggest AI companies already mark what they make',
    detail:
      'Anthropic, Google, OpenAI, Adobe and the hosted Stability and Flux services all attach a signed record to the files they produce, and they settled on one shared format for it. Every major lab has also signed the European transparency code, so the other three are a question of when rather than whether.',
  },
  {
    figure: '2.5bn',
    label:
      'prompts answered by ChatGPT every day. That is one product, at one company',
    detail:
      'Reported in 2026. Nobody can read their way through that much machine-written text to work out where it came from, which is the whole reason the marks exist and the whole reason they are invisible.',
  },
  {
    figure: 'Aug 2026',
    label: 'when Claude started marking the writing it produces',
    detail:
      'Anthropic applies it to models launched from 2 August 2026, everywhere, with no way to switch it off. Google already does the same to Gemini. Neither mark can be checked by any tool the public can use, which is why removing it is the only option anyone actually has today.',
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

      {/*
        THE SCOPE OF THE PROBLEM.

        Jon asked for this block to be "a scope of the problem type section and
        we name it that", and said the layout — counter on the left, cards on the
        right, nothing tying them together — "needs improvement". 04 entry 76.

        It is now one named section with a heading, and the two halves say
        different things on purpose: the left is how big the problem is, the
        right is who is causing it and since when. On a phone they stack in that
        order, which is the order the argument runs in.
      */}
      <div
        className={'relative mx-auto max-w-[1180px] px-5 pt-4 pb-20 sm:px-8'}
      >
        <h2
          className={
            'text-muted-foreground text-[11.5px] font-semibold tracking-[0.09em] uppercase'
          }
        >
          The scope of the problem
        </h2>

        <p
          className={
            'text-foreground mt-2.5 max-w-[46ch] text-[19px] leading-[1.35] font-semibold tracking-[-0.02em] text-balance sm:text-[22px]'
          }
        >
          Nearly every large AI company now marks what it produces, and none of
          them ask first.
        </p>

        <div className={'mt-9 grid gap-x-12 gap-y-10 lg:grid-cols-12'}>
          <div className={'lg:col-span-6'}>
            <LiveCounter />
          </div>
          <div className={'lg:col-span-6'}>
            <FactCards facts={FACTS} />
          </div>
        </div>
      </div>
    </section>
  );
}
