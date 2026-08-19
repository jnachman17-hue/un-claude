import { CheckIcon, ClockIcon, MinusIcon } from 'lucide-react';

/**
 * Who marks what, and it is the most credible thing on this page.
 *
 * GPTZero opens with credibility statistics. We have none, because nobody has
 * used this yet. What we do have is a researched, sourced table of which vendors
 * mark their output and how, which is more useful than a usage number and is
 * checkable by anyone.
 *
 * Every row comes from ENGINE.md section 2. Where something has been committed
 * but not shipped it says so, including where overstating it would flatter us.
 */

type Mark = 'yes' | 'committed' | 'na';

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
 * ALL SEVEN ARE NOW THE PRODUCT'S OWN MARK, in clean vector, supplied by Jon.
 * Claude's sunburst rather than Anthropic's wordmark, Firefly rather than Adobe's
 * corporate A, so the artwork agrees with the name above it.
 *
 * They load as <img src> rather than inlined, which matters here: three of these
 * files define a gradient called `linearGradient-1`, and inlining them together
 * would have them fight over the same id. As separate documents they cannot.
 *
 * `color` survives on each row only as the fallback tile's background, used if
 * artwork ever goes missing. Two values kept accurate there: Gemini gets no single
 * hex, because its identity is a gradient, and Stability's purple is #8300FF
 * sampled from the supplied asset rather than the #6B21A8 circulating online that
 * Jon correctly flagged as unverified.
 */
/**
 * THE LOGO CARRIES THE BRAND. THE NAME IS JUST THE NAME.
 *
 * An earlier version set each vendor's name in its brand colour. Jon's own
 * research ruled that out and was right: the correct faces are Styrene, Google
 * Sans, Optimistic Display, OpenAI Sans and Adobe Clean, four of which are
 * licensed and cannot be installed. Putting Anthropic's exact hex on a name set
 * in somebody else's typeface is an approximation wearing a precise number.
 *
 * PRODUCT FIRST, COMPANY SECOND, which is Jon's question answered.
 *
 * Both lines are full-strength text and only the description is grey, so the row
 * breaks once: who this is, then what they do. Greying the company line put the
 * break in the wrong place and made the identity look like a footnote.
 *
 * Nobody arrives here thinking Anthropic watermarked their text. They think
 * Claude did. The product is the thing people met, the thing our own headline
 * names, and the thing they will scan this table looking for. But the company is
 * what actually signs the European code and applies the mark, so dropping it
 * would make the row less true rather than simpler.
 *
 * So both, in a fixed order: the product people know, with the company that owns
 * it underneath. It also settles the logo question, because the two marks are
 * paired in every case here anyway.
 *
 * Midjourney is gone entirely, at Jon's instruction. It marks nothing and writes
 * nothing, so it was a row that said "not applicable" twice. Removing it also
 * emptied the "does not mark" state, which has been removed with it rather than
 * left in a legend explaining a symbol that never appears.
 *
 * Ordered by how much they matter to someone reading this, not alphabetically.
 */
interface Vendor {
  product: string;
  company: string;
  color: string;
  initial: string;
  files: Mark;
  text: Mark;
  note: string;
  logo?: { src: string; mono?: boolean };
}

/**
 * One formula for every row, so the column can be read down rather than
 * deciphered line by line: what happens to files, then what happens to text.
 * Every claim comes from ENGINE.md section 2.
 */
const VENDORS: Vendor[] = [
  {
    product: 'Claude',
    company: 'Anthropic',
    color: '#141413',
    initial: 'A',
    files: 'yes',
    text: 'yes',
    note: 'Files signed since 2 August 2026. Text watermarked from the same date, worldwide, with no way to opt out.',
    logo: { src: '/images/vendors/claude.svg' },
  },
  {
    product: 'ChatGPT',
    company: 'OpenAI',
    color: '#000000',
    initial: 'O',
    files: 'yes',
    text: 'committed',
    note: 'Files signed since February 2024. Text watermarking committed under the European code, not yet shipped.',
    logo: { src: '/images/vendors/chatgpt.svg', mono: true },
  },
  {
    product: 'Gemini',
    company: 'Google',
    color: '#1F1F1F',
    initial: 'G',
    files: 'yes',
    text: 'yes',
    note: 'Files signed since November 2025. Text watermarked with SynthID on every output.',
    logo: { src: '/images/vendors/gemini.svg' },
  },
  {
    product: 'Grok',
    company: 'xAI',
    color: '#000000',
    initial: 'X',
    files: 'committed',
    text: 'committed',
    note: 'Files and text both committed under the European code. Neither has shipped yet.',
    logo: { src: '/images/vendors/grok.svg', mono: true },
  },
  {
    product: 'Meta AI',
    company: 'Meta',
    color: '#1C2B33',
    initial: 'M',
    files: 'committed',
    text: 'committed',
    note: 'Files and text both committed under the European code. Today it reads and labels other companies’ marks.',
    logo: { src: '/images/vendors/meta-ai.svg' },
  },
  {
    product: 'Firefly',
    company: 'Adobe',
    color: '#FA0F00',
    initial: 'Ad',
    files: 'yes',
    text: 'na',
    note: 'Files signed on everything it makes. Adobe wrote the standard the others adopted.',
    logo: { src: '/images/vendors/firefly.svg' },
  },
  {
    product: 'Stable Diffusion',
    company: 'Stability AI',
    color: '#8300FF',
    initial: 'S',
    files: 'yes',
    text: 'na',
    note: 'Files signed on the hosted service. The versions you run yourself are unmarked.',
    logo: { src: '/images/vendors/stable-diffusion.svg' },
  },
];

const CELL: Record<Mark, { icon: typeof CheckIcon; className: string; label: string }> = {
  yes: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'Marking today' },
  committed: {
    icon: ClockIcon,
    className: 'bg-amber-500 text-white',
    label: 'Committed, coming',
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
            Every major lab has signed up to this.
          </h2>

          <p className={'text-muted-foreground mt-4 max-w-[40ch] text-[15px] leading-[1.6]'}>
            Claude and Gemini mark their text today. The rest have committed to it
            under European law, and are building it now. un-claude sanitises all
            of them, in text and in files.
          </p>

          <p className={'text-muted-foreground/80 mt-5 max-w-[40ch] text-[12.5px] leading-relaxed'}>
            As of 19 August 2026, from each company’s own published material.
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
                  key={vendor.product}
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
                    <span className={'text-foreground block text-[14px] font-medium tracking-[-0.012em]'}>
                      {vendor.product}
                    </span>
                    <span className={'text-foreground block text-[11.5px] leading-tight'}>
                      by {vendor.company}
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
              <Cell mark={'yes'} /> Marking today
            </span>
            <span className={'inline-flex items-center gap-1.5'}>
              <Cell mark={'committed'} /> Committed, coming
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
