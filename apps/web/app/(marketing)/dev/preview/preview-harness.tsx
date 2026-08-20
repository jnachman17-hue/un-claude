'use client';

import { useState } from 'react';

import { CoverageMarquee } from '../../_components/coverage-marquee';
import { CoverageSection } from '../../_components/coverage-section';
import { HeroSection } from '../../_components/hero-section';
import { HowItWorksSection } from '../../_components/how-it-works-section';
import { LimitsSection } from '../../_components/limits-section';

/**
 * Every accent under consideration, with the numbers that decide whether the
 * text on top of it is legible.
 *
 * `contrast` is measured, not guessed: WCAG 2.1 relative luminance against the
 * foreground named beside it. Anything below 4.5 fails AA for normal text.
 */
const VARIANTS = [
  {
    id: 'b',
    name: 'B — deep, white text',
    hex: '#C15F3C',
    mark: 'oklch(59.7% 0.135 40)',
    strong: 'oklch(53% 0.140 39)',
    fg: 'oklch(100% 0 0)',
    contrast: '4.23:1 on white',
  },
  {
    id: 'a',
    name: 'A — lighter, dark text',
    hex: '#DE7356',
    mark: 'oklch(67.3% 0.140 36)',
    strong: 'oklch(60% 0.138 37)',
    fg: 'oklch(20% 0.02 60)',
    contrast: '4.62:1 on near-black',
  },
  {
    id: 'claude',
    name: 'Claude logo exact',
    hex: '#D97757',
    mark: 'oklch(67.2% 0.131 39)',
    strong: 'oklch(60% 0.140 38)',
    fg: 'oklch(20% 0.02 60)',
    contrast: '4.65:1 on near-black',
  },
] as const;

/** How far apart the page and a card sit. The cause of "everything dissolves". */
const DEFINITION = [
  {
    id: 'soft',
    name: 'Softer',
    background: 'oklch(98.2% 0.004 70)',
    border: 'oklch(94.5% 0.005 65)',
  },
  {
    id: 'mid',
    name: 'Current',
    background: 'oklch(97.7% 0.005 70)',
    border: 'oklch(93% 0.006 65)',
  },
  {
    id: 'hard',
    name: 'Harder',
    background: 'oklch(96.4% 0.006 70)',
    border: 'oklch(90% 0.007 65)',
  },
] as const;

export function PreviewHarness() {
  const [variant, setVariant] = useState<string>('b');
  const [definition, setDefinition] = useState<string>('mid');

  const v = VARIANTS.find((entry) => entry.id === variant) ?? VARIANTS[0];
  const d =
    DEFINITION.find((entry) => entry.id === definition) ?? DEFINITION[1];

  return (
    <div
      /*
        THE `--color-*` TOKENS ARE THE ONES THAT MATTER, AND THE FIRST VERSION OF
        THIS FILE SET THE WRONG ONES.

        `theme.css` declares `--color-mark: var(--mark)` at :root. A custom
        property resolves its own var() references WHERE IT IS DECLARED, so
        `--color-mark` is computed against the ROOT's `--mark` and then inherits
        already-resolved. Overriding `--mark` further down the tree therefore
        changes nothing, which is exactly what Jon saw: three buttons, one
        colour. Measured before and after — `--mark` moved the wrapper's style
        attribute and left the button at oklch(0.597 …) all three times;
        `--color-mark` moves the button.

        Both are set: the `--color-*` pair is what Tailwind's classes read, and
        the bare pair keeps any raw `var(--mark)` in hand-written CSS in step.
      */
      style={
        {
          '--color-mark': v.mark,
          '--color-mark-strong': v.strong,
          '--color-mark-foreground': v.fg,
          '--color-background': d.background,
          '--color-border': d.border,
          '--mark': v.mark,
          '--mark-strong': v.strong,
          '--mark-foreground': v.fg,
          '--ring': v.mark,
          '--background': d.background,
          '--border': d.border,
          backgroundColor: d.background,
        } as React.CSSProperties
      }
    >
      <div
        className={
          'border-border bg-card/95 sticky top-0 z-50 border-b px-4 py-2.5 backdrop-blur-md sm:px-6'
        }
      >
        <div
          className={
            'mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2'
          }
        >
          <span
            className={
              'text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase'
            }
          >
            Theme bench
          </span>

          <div className={'flex flex-wrap items-center gap-1.5'}>
            {VARIANTS.map((entry) => (
              <button
                key={entry.id}
                type={'button'}
                onClick={() => setVariant(entry.id)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  entry.id === variant
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-foreground/[0.06]',
                ].join(' ')}
              >
                <span
                  className={'size-[11px] rounded-full'}
                  style={{ backgroundColor: entry.hex }}
                  aria-hidden
                />
                {entry.name}
              </button>
            ))}
          </div>

          <div className={'flex items-center gap-1.5'}>
            <span className={'text-muted-foreground text-[11px]'}>
              Definition
            </span>
            {DEFINITION.map((entry) => (
              <button
                key={entry.id}
                type={'button'}
                onClick={() => setDefinition(entry.id)}
                className={[
                  'rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  entry.id === definition
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-foreground/[0.06]',
                ].join(' ')}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <span
            className={'text-muted-foreground ml-auto font-mono text-[11px]'}
          >
            {v.hex} · {v.contrast}
          </span>
        </div>
      </div>

      <div className={'flex flex-col'}>
        <HeroSection />
        <CoverageMarquee />
        <HowItWorksSection />
        <CoverageSection />
        <LimitsSection />
      </div>
    </div>
  );
}
