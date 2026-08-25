import { FAQ_ITEMS } from './faq-items';

/**
 * The FAQ, and it is deliberately the longest block of prose on the page.
 *
 * NEW, 19 August 2026. docs/09 section 9: measured across the category, the
 * FAQ is the largest section on these pages, larger than the hero, because it
 * is the one place long, careful, hedged prose is expected and forgiven. It
 * is where the whole market puts legality, ethics, mechanism and limits, and
 * it is the answer to the question that stalled this project for a day: where
 * do the arguments go that will not fit near the top.
 *
 * THE WORDS LIVE IN `faq-items.tsx`, and this section renders that array in
 * order. /faq rendered the same nine answers as a separate page until 20
 * August 2026, when Jon deleted the route: `04` entry 102. The FAQPage
 * structured data that page carried moved down here rather than dying with it,
 * so these answers stay eligible for the search results they were written for.
 * It is invisible to a visitor and changes nothing on the page.
 *
 * Every answer is governed by the claims boundary in
 * .claude/skills/unclaude-messaging: confident on the two provable layers,
 * measured-and-imminent on the third, nothing explicitly false anywhere.
 * The Word-document answer follows 06 row 74: a container never reaches the
 * rewrite, so the honest instruction is to paste the text.
 */
const ITEMS = FAQ_ITEMS;

/**
 * FAQPage structured data, built from the plain-text answers. This is why each
 * answer is authored as a string with an optional rich rendering rather than
 * as nodes: a search engine needs the words, not the markup.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export function FaqSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <script
        key={'ld:json'}
        type={'application/ld+json'}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={'mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-20'}>
        <div className={'grid gap-10 lg:grid-cols-12 lg:gap-14'}>
          {/*
            JUST "FAQ". Jon's instruction, 25 August 2026, six-ui-fixes brief
            fix 5. It overrides the messaging skill's preference for a fuller
            heading, and `CLAUDE.md` section 2 makes his instruction the higher
            authority.

            What came out: "Straight answers to the hard questions." and
            "Including the ones most tools in this category hope you will not
            ask." Both were doing the same job the questions do better, one
            screen further down, and the second line was a claim about other
            products rather than about this one.

            THE TWO-LINE BLOCK WAS ALSO THE COLUMN'S ONLY HEIGHT. Removing it
            blind leaves a `lg:col-span-4` column holding a single short word
            beside eight rows of questions, so the type size comes down from
            the 28/34px display pair to the size of a section label. It is a
            label now, not a headline, and it is sized like one.
          */}
          <div className={'lg:col-span-4'}>
            <h2
              className={
                'text-foreground text-[20px] leading-[1.1] font-semibold tracking-[-0.02em] sm:text-[22px]'
              }
            >
              FAQ
            </h2>
          </div>

          <div className={'lg:col-span-8'}>
            <ul className={'divide-border/70 divide-y'}>
              {ITEMS.map((item) => (
                <li key={item.q}>
                  <details className={'group py-4'}>
                    <summary
                      className={
                        'text-foreground flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold tracking-[-0.012em] [&::-webkit-details-marker]:hidden'
                      }
                    >
                      {item.q}
                      <span
                        aria-hidden
                        className={
                          'bg-foreground/[0.07] text-foreground/60 grid size-[22px] shrink-0 place-items-center rounded-full text-[14px] transition-transform group-open:rotate-45'
                        }
                      >
                        +
                      </span>
                    </summary>
                    <p
                      className={
                        'text-muted-foreground mt-3 max-w-[66ch] text-[14px] leading-[1.65]'
                      }
                    >
                      {item.render ?? item.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
