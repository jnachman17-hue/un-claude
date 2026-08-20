import Link from 'next/link';

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
 * Every answer here is governed by the claims boundary in
 * .claude/skills/unclaude-messaging: confident on the two provable layers,
 * measured-and-imminent on the third, nothing explicitly false anywhere.
 * The Word-document answer follows 06 row 74: a container never reaches the
 * rewrite, so the honest instruction is to paste the text.
 */
const ITEMS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Can my school or employer detect Claude’s watermark today?',
    a: 'Not today. Anthropic’s detector is not open yet; the company has committed to releasing one, in its own word, “soon”. The day it opens, anyone can check, and text that is already marked stays marked.',
  },
  {
    q: 'Why can’t I just ask another AI to reword it?',
    a: 'Because a generic rewrite protects exactly the wrong thing. Ask any model to reword but keep the facts, and it hands your fact-bearing sentences back nearly untouched, and those unbroken stretches of original wording are where the watermark rides. When we tested it, generic rewrites also came back a third shorter and quietly changed figures. Our engine does the opposite: it rebuilds every sentence so no more than three of your words survive in a row, on a model that is not Claude, with your facts and length held.',
  },
  {
    q: 'How do I know the rewrite actually worked?',
    a: 'Nobody can verify removal yet, and anyone claiming otherwise is telling you something they cannot know. What we give you is measured: every run returns the share of your wording replaced, the longest sequence of your original words still standing, and every figure checked. The mark rides only on unbroken stretches of your original words, and the receipt shows how little survives.',
  },
  {
    q: 'Will it change my meaning, my facts, or my numbers?',
    a: 'No, and this is enforced rather than promised. Every number, date and name is checked against your original and the section retries if one drifts. Length is held within a tenth, and the receipt shows the figures carried through.',
  },
  {
    q: 'Is using Un-Claude cheating?',
    a: (
      <>
        Un-Claude removes marks that AI companies place inside your work,
        invisibly, without asking you and without telling you. What you then
        submit, publish or send is your call and your responsibility, under
        whatever rules you have agreed to. Where we stand on the marking
        itself is on the{' '}
        <Link
          href={'/mission'}
          className={
            'text-foreground underline decoration-1 underline-offset-2'
          }
        >
          mission page
        </Link>
        .
      </>
    ),
  },
  {
    q: 'What happens to my document after I upload it?',
    a: 'It is processed and deleted. Uploads are held for the length of the request and removed when the response is sent. Nothing you paste or upload is stored.',
  },
  {
    q: 'Which AI tools mark their output?',
    a: 'Five of the eight largest providers, confirmed. Anthropic watermarks every Claude model launched since 2 August 2026 and signs the images Claude makes. OpenAI, Google, Adobe and the hosted Stability services sign theirs too, using a shared standard called C2PA that any free reader can open. The coverage table above names each one, with sources.',
  },
  {
    q: 'What about Word documents and PDFs?',
    a: 'Upload a Word document and we clean its hidden characters and metadata. For the statistical rewrite, paste the text itself into the box, and paste it back into your document when it is done. PDFs are not accepted yet.',
  },
  {
    q: 'What if the scan finds nothing?',
    a: 'Then nothing is there to find in the two countable layers, and that is a real answer. The statistical watermark is the exception: no tool can show or count it, which is why it is handled by rewriting rather than by finding.',
  },
];

export function FaqSection() {
  return (
    <section className={'border-border/70 border-t'}>
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
                      {item.a}
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
