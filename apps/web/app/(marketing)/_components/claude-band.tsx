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

/**
 * REWRITTEN 20 August 2026 to Jon's notes. Two changes that matter.
 *
 * The first beat now names WHO will be able to check, because "nobody can
 * see it" was answering the wrong question: a student does not care that
 * the mark is invisible in the abstract, they care who gets to run the
 * check on them. The second beat attributes the timing to Anthropic and
 * links their own announcement, so the claim carries their name rather
 * than ours.
 *
 * `body` is a node rather than a string on the second beat so the link can
 * live inside the sentence instead of being appended to it.
 */
const BEATS = [
  {
    icon: EyeOffIcon,
    head: 'Marked, invisibly',
    body: (
      <>
        Claude watermarks what it writes. Universities, employers and anyone
        else will be able to see it soon.
      </>
    ),
  },
  {
    icon: ClockIcon,
    head: 'A public detector is coming',
    body: (
      <>
        <a
          href={ANTHROPIC_POST}
          target={'_blank'}
          rel={'noreferrer'}
          className={
            'text-foreground font-medium underline decoration-1 underline-offset-2'
          }
        >
          Anthropic
        </a>{' '}
        says its release of a checker anyone can use is imminent.
      </>
    ),
  },
  {
    icon: InfinityIcon,
    head: 'Marks don’t expire',
    body: <>What’s already submitted stays marked. Sanitise before checking starts.</>,
  },
];

export function ClaudeBand() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-11 sm:px-8 sm:py-16'}>
        {/*
          THE ICON MOVES BESIDE THE TEXT ON A PHONE, 21 August 2026.

          Stacked, each beat was an icon on its own line, a heading, and two
          lines of body, three times over, with 32px between them: about a
          third of a phone screen for three sentences. Turned into rows the
          same three beats read as a list, which is what they are, and the
          icon does the job it was drawn for, marking where the next one
          starts. From `sm` the original column layout is untouched.
        */}
        <div className={'grid gap-5 sm:grid-cols-3 sm:gap-10'}>
          {BEATS.map((beat) => (
            <div key={beat.head} className={'flex gap-3 sm:block'}>
              <beat.icon
                className={'text-mark-strong mt-[3px] size-[20px] shrink-0'}
                strokeWidth={2}
                aria-hidden
              />
              <div className={'min-w-0'}>
                <h2
                  className={
                    'text-foreground text-[17px] leading-[1.2] font-semibold tracking-[-0.02em] sm:mt-3 sm:text-[19px]'
                  }
                >
                  {beat.head}
                </h2>
                <p
                  className={
                    'text-muted-foreground mt-1 max-w-[36ch] text-[13.5px] leading-[1.5] sm:mt-1.5 sm:text-[14px] sm:leading-[1.55]'
                  }
                >
                  {beat.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* The Anthropic quote line that closed this band was removed at
            Jon's instruction, 20 August 2026: read cold, "a complete rewrite
            will remove it" invites "so any AI can do that for me". The quote
            survives, trimmed and answered, on /how-it-works. */}
      </div>
    </section>
  );
}
