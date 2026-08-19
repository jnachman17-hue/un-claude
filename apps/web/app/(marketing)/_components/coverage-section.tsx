import { CheckIcon, ClockIcon, MinusIcon, XIcon } from 'lucide-react';

/**
 * Who marks what, and it is the most credible thing on this page.
 *
 * GPTZero opens with credibility statistics. We have none, because nobody has
 * used this yet. What we do have is a researched, sourced table of which vendors
 * mark their output and how, which is more useful than a usage number and is
 * checkable by anyone.
 *
 * Every row comes from ENGINE.md section 2, researched 18 August 2026. Where
 * something is unconfirmed it says unconfirmed, including for the vendors it
 * would flatter us to overstate.
 */

type Mark = 'yes' | 'no' | 'unconfirmed' | 'na';

/** Brand colours so each vendor is recognisable at a glance. Jon's request.
 *  Their own typefaces would mean licensing and shipping font files for eight
 *  companies, which is not worth it for a table. */
const VENDORS: Array<{ name: string; color: string; files: Mark; text: Mark; note: string }> = [
  { name: 'Anthropic', color: '#D97757', files: 'yes', text: 'yes', note: 'Text watermarked globally since 2 August 2026. Files signed, though not Word documents' },
  { name: 'Google', color: '#4285F4', files: 'yes', text: 'yes', note: 'SynthID on every output, plus signed files since November 2025' },
  { name: 'OpenAI', color: '#0A0A0A', files: 'yes', text: 'unconfirmed', note: 'Files signed since February 2024. No text watermark confirmed yet, and it signed the European transparency code' },
  { name: 'Adobe Firefly', color: '#FA0F00', files: 'yes', text: 'na', note: 'Originated the file provenance standard and marks everything it makes' },
  { name: 'Stability, Flux', color: '#7C3AED', files: 'yes', text: 'na', note: 'Marked on their hosted services. The open versions are not' },
  { name: 'Meta', color: '#0064E0', files: 'unconfirmed', text: 'unconfirmed', note: 'Reads and labels marks on upload, and signed the European transparency code. Its own marking is not yet documented' },
  { name: 'Midjourney', color: '#111111', files: 'no', text: 'na', note: 'No provenance marking' },
  { name: 'xAI Grok', color: '#1A1A1A', files: 'unconfirmed', text: 'unconfirmed', note: 'A visible corner logo only, as far as anyone has published. Bound by the same European commitments' },
];

const CELL: Record<Mark, { icon: typeof CheckIcon; className: string; label: string }> = {
  yes: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'Marks its output' },
  no: { icon: XIcon, className: 'bg-rose-500 text-white', label: 'Does not mark' },
  unconfirmed: {
    icon: ClockIcon,
    className: 'bg-amber-500 text-white',
    label: 'Committed to watermarking',
  },
  na: {
    icon: MinusIcon,
    className: 'bg-foreground/12 text-foreground/40',
    label: 'Does not produce this',
  },
};

function Cell({ mark }: { mark: Mark }) {
  const cell = CELL[mark];
  const Icon = cell.icon;
  return (
    <span
      title={cell.label}
      className={`grid size-[18px] place-items-center rounded-full ${cell.className}`}
    >
      <Icon className={'size-[11px]'} strokeWidth={3} aria-hidden />
      <span className={'sr-only'}>{cell.label}</span>
    </span>
  );
}

export function CoverageSection() {
  return (
    <section className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
      <div className={'grid gap-10 lg:grid-cols-12 lg:gap-14'}>
        <div className={'lg:col-span-4'}>
          <h2
            className={
              'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
            }
          >
            It is not only Claude, and it is not only text.
          </h2>

          <p className={'text-muted-foreground mt-4 max-w-[40ch] text-[15px] leading-[1.6]'}>
            Anthropic is the one in the news. Nearly every lab now marks what it
            makes, and every major one signed the European transparency code, so
            the rest are arriving. un-claude sanitises all of them, in text and
            in files.
          </p>

          <p className={'text-muted-foreground/80 mt-5 max-w-[40ch] text-[12.5px] leading-relaxed'}>
            Researched 18 August 2026 from each vendor’s own published material.
            Where something has not been confirmed it says so.
          </p>
        </div>

        <div className={'lg:col-span-8'}>
          <div className={'border-border/70 overflow-hidden rounded-[14px] border'}>
            <div
              className={
                'text-muted-foreground bg-foreground/[0.022] grid grid-cols-[1fr_auto_auto] gap-x-5 px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase sm:px-5'
              }
            >
              <span>Vendor</span>
              <span className={'w-14 text-center'}>Files</span>
              <span className={'w-14 text-center'}>Text</span>
            </div>

            <ul className={'divide-border/70 divide-y'}>
              {VENDORS.map((vendor) => (
                <li
                  key={vendor.name}
                  className={
                    'hover:bg-foreground/[0.014] grid grid-cols-[1fr_auto_auto] items-center gap-x-5 px-4 py-3 transition-colors sm:px-5'
                  }
                >
                  <div className={'min-w-0'}>
                    <span
                      style={{ color: vendor.color }}
                      className={'text-[13.5px] font-semibold tracking-[-0.012em] dark:brightness-150'}
                    >
                      {vendor.name}
                    </span>
                    <p className={'text-muted-foreground mt-0.5 text-[12px] leading-snug'}>
                      {vendor.note}
                    </p>
                  </div>
                  <span className={'flex w-14 justify-center'}>
                    <Cell mark={vendor.files} />
                  </span>
                  <span className={'flex w-14 justify-center'}>
                    <Cell mark={vendor.text} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={'text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]'}>
            <span className={'inline-flex items-center gap-1.5'}>
              <Cell mark={'yes'} /> Marks its output
            </span>
            <span className={'inline-flex items-center gap-1.5'}>
              <Cell mark={'unconfirmed'} /> Committed to watermarking
            </span>
            <span className={'inline-flex items-center gap-1.5'}>
              <Cell mark={'no'} /> Does not mark
            </span>
            <span className={'inline-flex items-center gap-1.5'}>
              <Cell mark={'na'} /> Does not produce this
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
