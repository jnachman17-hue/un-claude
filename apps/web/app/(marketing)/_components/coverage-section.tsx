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

/**
 * THE LOGO CARRIES THE BRAND. THE NAME IS JUST THE NAME.
 *
 * An earlier version set each vendor's name in its brand colour. Jon's own
 * research is what ruled that out, and it was right: the correct typefaces are
 * Styrene, Google Sans, Optimistic Display, OpenAI Sans and Adobe Clean, and four
 * of those five are licensed and cannot be installed. Putting Anthropic's hex on
 * a name set in somebody else's typeface is an approximation wearing a precise
 * number, which is the exact thing his notes warn against.
 *
 * His research reaches the same conclusion four separate times: for Meta,
 * Midjourney, Stability and xAI it says to use the vector wordmark for fidelity.
 * That artwork is now beside every name, supplied by him, so the brand is
 * represented by the brand's own asset rather than by a guess at it.
 *
 * The names are therefore set like every other word on this page. That is not a
 * compromise, it is the honest version.
 *
 * `color` survives on each row because the fallback tile still uses it if artwork
 * is ever missing. Two values worth keeping accurate if it is ever shown: Gemini
 * gets no single hex, because its identity is a gradient, and Stability's purple
 * is #8300FF sampled from the supplied asset rather than the #6B21A8 circulating
 * online that Jon correctly flagged as unverified.
 */
interface Vendor {
  name: string;
  color: string;
  initial: string;
  files: Mark;
  text: Mark;
  note: string;
  /** Real artwork where we have it. `mono` marks need inverting in dark mode. */
  logo?: { src: string; mono?: boolean };
}

const VENDORS: Vendor[] = [
  { name: 'Anthropic', initial: 'A', color: '#141413', files: 'yes', text: 'yes', note: 'Text watermarked globally since 2 August 2026. Files signed, though not Word documents', logo: { src: '/images/vendors/anthropic.png', mono: true } },
  { name: 'Google', initial: 'G', color: '#1F1F1F', files: 'yes', text: 'yes', note: 'SynthID on every output, plus signed files since November 2025', logo: { src: '/images/vendors/google.png' } },
  { name: 'OpenAI', initial: 'O', color: '#000000', files: 'yes', text: 'unconfirmed', note: 'Files signed since February 2024. No text watermark confirmed yet, and it signed the European transparency code', logo: { src: '/images/vendors/openai.svg', mono: true } },
  { name: 'Adobe Firefly', initial: 'Ad', color: '#FA0F00', files: 'yes', text: 'na', note: 'Originated the file provenance standard and marks everything it makes', logo: { src: '/images/vendors/adobe.png' } },
  { name: 'Stability, Flux', initial: 'S', color: '#8300FF', files: 'yes', text: 'na', note: 'Marked on their hosted services. The open versions are not', logo: { src: '/images/vendors/stability.png' } },
  { name: 'Meta', initial: 'M', color: '#1C2B33', files: 'unconfirmed', text: 'unconfirmed', note: 'Reads and labels marks on upload, and signed the European transparency code. Its own marking is not yet documented', logo: { src: '/images/vendors/meta.png' } },
  { name: 'Midjourney', initial: 'MJ', color: '#000000', files: 'no', text: 'na', note: 'No provenance marking', logo: { src: '/images/vendors/midjourney.svg', mono: true } },
  { name: 'xAI Grok', initial: 'X', color: '#000000', files: 'unconfirmed', text: 'unconfirmed', note: 'A visible corner logo only, as far as anyone has published. Bound by the same European commitments', logo: { src: '/images/vendors/xai.png', mono: true } },
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
                  <div className={'flex min-w-0 items-start gap-3'}>
                    {/* A neutral tile behind every vendor, so a full colour mark
                        and a black one carry the same weight down the column.
                        xAI has no artwork here on purpose: the file supplied is
                        clipped, and a cut off brand mark looks worse than a clean
                        initial. */}
                    <span
                      aria-hidden
                      style={vendor.logo ? undefined : { backgroundColor: vendor.color }}
                      className={
                        'bg-foreground/[0.045] mt-[1px] grid size-[28px] shrink-0 place-items-center overflow-hidden rounded-[8px]'
                      }
                    >
                      {vendor.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vendor.logo.src}
                          alt={''}
                          loading={'lazy'}
                          decoding={'async'}
                          className={[
                            'size-[17px] object-contain',
                            vendor.logo.mono ? 'dark:invert' : '',
                          ].join(' ')}
                        />
                      ) : (
                        <span className={'text-[11px] font-bold text-white'}>{vendor.initial}</span>
                      )}
                    </span>

                    <div className={'min-w-0'}>
                    <span className={'text-foreground text-[14px] font-medium tracking-[-0.012em]'}>
                      {vendor.name}
                    </span>
                    <p className={'text-muted-foreground mt-0.5 text-[12px] leading-snug'}>
                      {vendor.note}
                    </p>
                    </div>
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
