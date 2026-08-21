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

      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'grid gap-10 lg:grid-cols-12 lg:gap-14'}>
          <div className={'lg:col-span-4'}>
            <h2
              className={
                'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
              }
            >
              Straight answers to the hard questions.
            </h2>
            <p
              className={
                'text-muted-foreground mt-4 max-w-[40ch] text-[15px] leading-[1.6]'
              }
            >
              Including the ones most tools in this category hope you will not
              ask.
            </p>
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
