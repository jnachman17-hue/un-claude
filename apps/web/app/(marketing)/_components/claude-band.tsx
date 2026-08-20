/**
 * The one argument section on the home page.
 *
 * REPLACES limits-section, stakes-section and moat-section, 19 August 2026,
 * under Jon's radical-cut order: "People don't care about the argument. Show
 * them what they need... park the bullshit elsewhere." Three short beats a
 * college student actually cares about, no paragraphs, one quote.
 *
 * The depth those sections carried lives on: the engineering story is an FAQ
 * answer and /how-it-works; the vendor spread is the coverage table below.
 */
import { ClockIcon, EyeOffIcon, InfinityIcon } from 'lucide-react';

const ANTHROPIC_POST = 'https://www.anthropic.com/news/claude-text-watermark';

const BEATS = [
  {
    icon: EyeOffIcon,
    head: 'Marked, invisibly',
    body: 'Claude watermarks what it writes. You can’t see it. Nobody can. Yet.',
  },
  {
    icon: ClockIcon,
    head: 'A public detector is coming',
    body: 'Anthropic will release a checker anyone can use. Its word: “soon”.',
  },
  {
    icon: InfinityIcon,
    head: 'Marks don’t expire',
    body: 'What’s already submitted stays marked. Sanitise before checking starts.',
  },
];

export function ClaudeBand() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-16 sm:px-8'}>
        <div className={'grid gap-8 sm:grid-cols-3 sm:gap-10'}>
          {BEATS.map((beat) => (
            <div key={beat.head}>
              <beat.icon
                className={'text-mark-strong size-[20px]'}
                strokeWidth={2}
                aria-hidden
              />
              <h2
                className={
                  'text-foreground mt-3 text-[19px] leading-[1.2] font-semibold tracking-[-0.02em]'
                }
              >
                {beat.head}
              </h2>
              <p
                className={
                  'text-muted-foreground mt-1.5 max-w-[36ch] text-[14px] leading-[1.55]'
                }
              >
                {beat.body}
              </p>
            </div>
          ))}
        </div>

        {/* The strongest citation this product has, in one line, linked and
            dated. The maker of the watermark naming what defeats it. */}
        <p
          className={
            'text-muted-foreground border-border/70 mt-10 border-t pt-6 text-[13.5px] leading-[1.6]'
          }
        >
          Anthropic&rsquo;s own words:{' '}
          <a
            href={ANTHROPIC_POST}
            target={'_blank'}
            rel={'noreferrer'}
            className={
              'text-foreground underline decoration-1 underline-offset-2'
            }
          >
            &ldquo;Light editing probably won&rsquo;t remove the watermark
            completely; a complete rewrite where every word is replaced
            will.&rdquo;
          </a>{' '}
          That rewrite is what we built.
        </p>
      </div>
    </section>
  );
}
