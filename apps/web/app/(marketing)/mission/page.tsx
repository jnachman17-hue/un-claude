import { PageHeader } from '../_components/prose';

export const metadata = {
  title: 'Why I built this',
  description:
    'Why Un-Claude exists: a statistical watermark misidentifies its subject, punishes the diligent, and spares the malicious.',
};

/**
 * Jon's mission statement. His draft, refined at his instruction on the
 * night of 19 August 2026: first person, creator's voice, aligned with the
 * rest of the site. His arguments and his strongest sentences are kept
 * whole; the refinement tightened, cut all but one em dash per his rule,
 * and tied the closing to what the product actually does.
 */
const PARAGRAPHS: Array<{ head?: string; body: string[] }> = [
  {
    body: [
      'I am not against knowing where a text came from. I am against this particular method of establishing it, and the two are constantly confused.',
      'A statistical watermark tells you one fact: a machine was somewhere in the pipeline. It cannot tell you whether the machine drafted the argument or fixed the commas. Whether it wrote the paper or translated it. Whether the human contributed everything or nothing. Authorship has always been a spectrum. Collaborators, editors, researchers, translators: every mature institution we have for handling credit knows this. The mark flattens that spectrum into a binary, then hands the binary to people who will treat it as a verdict.',
      'And the mark degrades exactly as human contribution increases. Rewrite the output, restructure it, argue with the model and win, and the signal thins into noise. Leave it untouched and the signal is crisp. The technique is most confident precisely where the human did least, and least confident where the human did most. That is not a bug awaiting a patch. That is the shape of the thing.',
    ],
  },
  {
    head: 'It stamps the only participant that authored nothing.',
    body: [
      'There is a second inversion underneath the first, and it is the one that turned my discomfort into opposition. The model has no independent access to reality. It has never seen a sunset or sat with grief. It knows those things only because millions of people wrote them down first. Every weight in it is an inheritance, and its entire universe is bounded by a corpus of human work ingested at a scale, and on terms, that no individual author agreed to.',
      'So when the system generates a paragraph, it is recombining human expression: a mosaic assembled from tiles other people made. Which means the watermark misattributes at both ends of the chain at once. It marks the output as machine-origin when the material is human in provenance, and it marks it as machine-origin when the editing, the judgment and the accountability are human too. It stamps the one participant in the process that authored nothing, and by stamping it, quietly awards it the credit.',
    ],
  },
  {
    head: 'The cost lands on the honest.',
    body: [
      'This is where the argument stops being philosophical. Detection is probabilistic. A hit is not proof and a miss is not clearance, and any threshold you pick trades false accusations against missed ones. Push it toward catching more marked text and you accuse more people who did nothing wrong.',
      'Every one of those errors has a face. A student who wrote her own paper. A writer who agonised over an article. A clinician whose reviewed and signed record now carries the implication that a machine, rather than the accountable professional, is responsible for it.',
      'Meanwhile the people this transparency regime was built to stop face no obstacle at all. The fraud operations, the influence campaigns, the spam mills: they paraphrase, they translate, they publish. The mark survives only on the text of people who do not know it is there. It is a tax on the naive. Maximum friction for the honest, and approximately zero for the adversary it was justified by.',
    ],
  },
  {
    head: 'What honest transparency looks like.',
    body: [
      'I would rather have transparency that survives contact with reality. Signed provenance at the file level, attached at generation, legible to any tool that cares to look — which is exactly what it is today, and this site will show it to you inside your own file. Plain disclosure by the person doing the publishing. And a watermark treated as what its own documentation admits it is: a weak hint, never evidence, never grounds for an accusation.',
      'So this is why I built an AI watermark removal tool. Not to hide machine involvement. To refuse a fingerprint that misidentifies its subject, punishes the diligent, spares the malicious, and was never something any of us agreed to carry.',
    ],
  },
];

function Mission() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Why I built this.'}
        standfirst={
          'A statistical watermark tells you a machine was in the room. It cannot tell you who did the work.'
        }
      />

      <section className={'mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8'}>
        <div className={'max-w-[68ch]'}>
          {PARAGRAPHS.map((block, blockIndex) => (
            <div key={blockIndex} className={blockIndex > 0 ? 'mt-12' : ''}>
              {block.head ? (
                <h2
                  className={
                    'text-foreground text-[22px] leading-[1.2] font-semibold tracking-[-0.022em]'
                  }
                >
                  {block.head}
                </h2>
              ) : null}
              {block.body.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    'text-foreground/80 mt-5 text-[15.5px] leading-[1.75]'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}

          <p
            className={
              'text-muted-foreground border-border/70 mt-12 border-t pt-6 text-[13.5px]'
            }
          >
            Jon, founder of Un-Claude. August 2026.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Mission;
