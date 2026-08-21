import { CtaBand } from '../_components/cta-band';

export const metadata = {
  title: 'Our mission',
  description:
    'Why Un-Claude exists: a mark you cannot see, never agreed to, and cannot answer is not transparency. Written by the person who built it.',
};

/**
 * The mission page. Rewritten 20 August 2026 (04 entry 92, then revised the
 * same day to Jon's notes, entry 93).
 *
 * VOICE: first person, anonymous. Jon removed his byline and name; the page
 * still reads as the builder speaking, per entry 80 ruling 9. This is the one
 * page allowed to be adversarial in its own voice. No em dashes.
 *
 * PROSE: rewritten for fluency at Jon's instruction ("doesn't read fluently
 * ... it still must sound human"). Short sentences, spoken rhythm, no stacked
 * qualifier clauses. The arguments are unchanged from entry 92, which chose
 * them specifically to not derive from the circulated X essay on this
 * subject: intake versus output, the unanswerable claim, who actually gets
 * flagged, and ignorance-dependent enforcement.
 *
 * LAYOUT: relaid out 20 August 2026 to Jon's note ("I hate the look ... the
 * massive 'why I built this' at top then the massive space gap"). The oversized
 * hero and the rule under it are gone. Title, a small date directly beneath it,
 * then straight into the first paragraph, all inside one paper panel sitting on
 * the page background so it reads as a written document rather than a landing
 * page module. Measure is held at 68ch, which lands in the 65 to 75 characters
 * a line that an essay needs to be readable. Not one word of the prose changed
 * in this pass.
 */
const SECTIONS: Array<{ head: string; body: string[] }> = [
  {
    head: 'What I object to',
    body: [
      'I am not against knowing where writing comes from. I am against the way the labs have chosen to do it.',
      'A statistical watermark is not a label you can read. It is a pattern pressed into the words themselves. You cannot see it, you were never asked about it, and it stays in your writing wherever that writing goes. There is no notice when it happens, no record you can look up afterwards, and no expiry date.',
    ],
  },
  {
    head: 'They marked the wrong end',
    body: [
      'A model knows nothing on its own. It has never seen a sunset or sat with grief. It can only write about these things because millions of people wrote about them first, and all of that writing was taken to train it, at a scale nobody agreed to and on terms nobody was offered.',
      'Nothing was attached to any of that work on the way in. No credit, no permission, no mark of any kind. The only permanent, invisible label in this whole arrangement is the one stamped on what comes back out. A permanent mark on everything the machine gives back, and nothing at all on what it took.',
      'And look at who gets marked. Everything of substance in a generated paragraph came from people. The mark records the machine, the one participant that authored nothing, and by recording it, quietly hands it the credit.',
    ],
  },
  {
    head: 'The claim you cannot answer',
    body: [
      'Anthropic is careful about this in its own documentation. A detected mark means Claude was involved somewhere, not that Claude wrote it. Proofreading leaves a mark. Translation leaves a mark. So does getting help with one paragraph of something you wrote yourself.',
      'None of that nuance survives the trip to a dashboard. What shows up on the other end is a flag, and a flag reads like a verdict. And here is the part nobody built: there is no way to prove you wrote something. No document to show, no process to follow, no one to appeal to. An accusation like this costs nothing to make and is nearly impossible to answer.',
    ],
  },
  {
    head: 'So I built this',
    body: [
      'What I want instead is simple. Disclosure the author can see and control, made at the point of publishing, with a name on it. If a lab wants to record what its model produced, it can put that record in the file, where anyone can read it, and be honest that it is a claim about a file, not a verdict on a person.',
      'Until that exists, this is the most useful thing I could do. Un-Claude finds the marks in your text and your files, names every one of them, and shows you exactly what was there and what came off. Nothing about your own writing is hidden from you. That is the whole point.',
      'I did not build this to hide that a machine was involved. I built it because a mark you cannot see, never agreed to, and cannot answer is not transparency.',
    ],
  },
];

function Mission() {
  return (
    <div className={'flex flex-col'}>
      <article className={'mx-auto w-full max-w-[860px] px-4 py-10 sm:px-8 sm:py-14'}>
        <div
          className={
            'bg-card border-border/60 rounded-[14px] border px-5 py-9 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:px-10 sm:py-12'
          }
        >
          <header>
            <h1
              className={
                'text-foreground text-[27px] leading-[1.15] font-semibold tracking-[-0.024em] text-balance sm:text-[32px]'
              }
            >
              Why I built this.
            </h1>

            <p className={'text-muted-foreground mt-1.5 text-[13px] tracking-[0.01em]'}>
              20 August 2026
            </p>
          </header>

          {/* One continuous column. Small bold headers, stacked, no rail. */}
          <div className={'mt-6 max-w-[68ch]'}>
            <p className={'text-foreground/85 text-[16px] leading-[1.72]'}>
              AI companies now write an invisible mark into what they produce.
              They did not ask, they do not show you, and it stays in your work
              after you have made it your own.
            </p>

            {SECTIONS.map((section) => (
              <div key={section.head} className={'mt-7'}>
                <h2
                  className={
                    'text-foreground text-[15px] leading-[1.35] font-semibold tracking-[-0.012em]'
                  }
                >
                  {section.head}
                </h2>

                <div className={'mt-2 space-y-3.5'}>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 24)}
                      className={'text-foreground/85 text-[16px] leading-[1.72]'}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <CtaBand
        heading={'See what your own writing is carrying.'}
        sub={'Free, in seconds, and nothing you paste is stored.'}
        secondary={{ href: '/how-it-works', label: 'How it works' }}
      />
    </div>
  );
}

export default Mission;
