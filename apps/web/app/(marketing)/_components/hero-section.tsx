import { FileTextIcon, ImageIcon, TypeIcon } from 'lucide-react';

import { FactCards } from './fact-cards';
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
const FACTS = [
  {
    figure: '3',
    label: 'kinds of mark, in three different places',
    detail:
      'Hidden characters between the words, provenance records inside a file’s wrapper, and a bias in which words the model chose. They are unrelated mechanisms, and a tool that treats them as one thing is not removing all of them.',
  },
  {
    figure: '9',
    label: 'classes of hidden character checked every scan',
    detail:
      'Zero width, unusual spaces, direction marks, tag characters, variation selectors, private use, lookalike letters, control characters and other invisibles. Every class is checked whether or not anything is found, and the scan is free and takes about forty milliseconds.',
  },
  {
    figure: '5 of 8',
    label: 'of the largest providers already mark the files they generate',
    detail:
      'Anthropic, Google, OpenAI, Adobe and the hosted Stability and Flux services all attach a signed provenance record. They converged on one format, C2PA, and that format is removable by design. Every major lab has also signed the European transparency code.',
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
      {/* One soft warmth behind the tool, so the box reads as the subject of the
          page rather than a form sitting on white. Nothing that announces itself. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute top-[-18%] right-[-10%] h-[560px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.16] blur-[90px]'
        }
      />

      <div className={'relative mx-auto max-w-[1180px] px-5 pt-7 pb-14 sm:px-8 lg:pt-12'}>
        <div className={'grid items-start gap-7 lg:grid-cols-12 lg:gap-12'}>
          <div className={'animate-rise lg:col-span-5 lg:pt-6'}>
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
              Paste text or drop a file. We find every mark that identifies it as
              AI written, and sanitise it.
            </p>

            <p className={'text-muted-foreground mt-6 max-w-[38ch] text-[13px] leading-[1.6]'}>
              Three kinds of mark, nine classes of hidden character, and a rewrite
              that never repeats more than three of your words in a row. Scanning
              is free and takes about forty milliseconds.
            </p>
          </div>

          <div className={'animate-rise lg:col-span-7'} style={{ animationDelay: '110ms' }}>
            <Workbench />

            <ul className={'mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1'}>
              {HANDLES.map((handle) => (
                <li
                  key={handle.label}
                  className={'text-muted-foreground inline-flex items-center gap-1.5 text-[12px]'}
                >
                  <handle.icon className={'size-[13px]'} strokeWidth={1.9} aria-hidden />
                  {handle.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={'relative mx-auto max-w-[1180px] px-5 pb-20 sm:px-8'}>
        <FactCards facts={FACTS} />
      </div>
    </section>
  );
}
