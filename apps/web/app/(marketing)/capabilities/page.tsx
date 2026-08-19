import { CheckIcon, MinusIcon, XIcon } from 'lucide-react';

import { PageHeader, Section } from '../_components/prose';

export const metadata = {
  title: 'What we can and cannot do',
  description:
    'A precise statement of what Un-Claude removes, what it can prove, and what no tool in this category can currently verify.',
};

/**
 * The precise page.
 *
 * This is not a compliance chore. It is what makes a confident headline
 * defensible: a punchy claim above a page that states exactly what the tool does
 * and does not do is a far stronger position than the claim on its own.
 *
 * Every line is sourced from ENGINE.md section 9, which separates what was
 * measured from what was not. Nothing here should ever be softened to make the
 * marketing easier. If the two ever disagree, this page is right.
 */

const CLAIMS: Array<{
  claim: string;
  verdict: 'yes' | 'no' | 'partial';
  detail: string;
}> = [
  {
    claim: 'We remove hidden characters from text and files',
    verdict: 'yes',
    detail:
      'Nine classes, named individually, with the exact position of each. The text is read back afterwards to confirm none remain. This is countable and we show you the count.',
  },
  {
    claim: 'We remove provenance and AI metadata from files',
    verdict: 'yes',
    detail:
      'C2PA content credentials, EXIF, XMP and generator tags. Verified against the raw bytes of the file, not by asking the tool whether it worked. The image or document content comes out byte for byte identical.',
  },
  {
    claim: 'We rewrite text to break up the statistical watermark',
    verdict: 'partial',
    detail:
      'The rewrite runs and we can show you precisely what it changed. Whether the watermark is gone cannot be confirmed by us or by anyone else, because no public detector exists for any vendor’s text watermark.',
  },
  {
    claim: 'We can prove a statistical watermark was removed',
    verdict: 'no',
    detail:
      'Nobody can, today. Anthropic confirmed in August 2026 that a detection interface is in development, with no ship date and no published terms. Any tool claiming verified removal is claiming something it has no way to check.',
  },
  {
    claim: 'Hidden character removal deals with Claude’s text watermark',
    verdict: 'no',
    detail:
      'It does not, and we will not imply otherwise. Anthropic states directly that no hidden characters are added to Claude’s text. Claude’s text watermark lives in word choice, which is what the rewrite addresses. On a Claude generated file, the provenance layer does remove Claude’s mark.',
  },
  {
    claim: 'We support PDFs',
    verdict: 'no',
    detail:
      'Not in this version, and we will not accept one. Removing data from a PDF properly requires rebuilding the file so the old content cannot be recovered. Without that step a PDF would look clean while still carrying what we said we removed.',
  },
  {
    claim: 'Word documents carry AI marks we can remove',
    verdict: 'partial',
    detail:
      'We can remove generator tags and hidden characters from a Word document, and that is tested. What has not yet been shown is that a document a real person receives from an AI tool carries provenance data at all. Anthropic’s own file signing covers images, not Word documents.',
  },
  {
    claim: 'Your text is stored',
    verdict: 'no',
    detail:
      'What you paste is sent for processing and returned. The rewrite is performed by a third party model provider, chosen specifically because it does not watermark its own output. That provider necessarily sees the text you submit for rewriting.',
  },
];

const VERDICT = {
  yes: { icon: CheckIcon, className: 'bg-emerald-600 text-white', label: 'Yes' },
  no: { icon: XIcon, className: 'bg-rose-500 text-white', label: 'No' },
  partial: { icon: MinusIcon, className: 'bg-amber-500 text-white', label: 'Partly' },
} as const;

function Capabilities() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Precisely what we can and cannot do.'}
        standfirst={
          'Every tool in this category makes claims nobody can currently check. This page states ours in plain language, including the ones that are inconvenient for us. If anything elsewhere on this site disagrees with this page, this page is correct and the other thing is a mistake.'
        }
      />

      <section className={'border-border/70 border-b'}>
        <div className={'mx-auto max-w-[1180px] px-5 py-14 sm:px-8'}>
          <ul className={'divide-border/70 divide-y'}>
            {CLAIMS.map((row) => {
              const verdict = VERDICT[row.verdict];
              const Icon = verdict.icon;

              return (
                <li key={row.claim} className={'py-5 first:pt-0 last:pb-0'}>
                  <div className={'flex items-start gap-3.5'}>
                    <span
                      className={`mt-[3px] grid size-[20px] shrink-0 place-items-center rounded-full ${verdict.className}`}
                    >
                      <Icon className={'size-[12px]'} strokeWidth={3} aria-hidden />
                      <span className={'sr-only'}>{verdict.label}</span>
                    </span>

                    <div className={'min-w-0'}>
                      <h2 className={'text-foreground text-[15.5px] font-semibold tracking-[-0.015em]'}>
                        {row.claim}
                      </h2>
                      <p className={'text-muted-foreground mt-1.5 max-w-[72ch] text-[14px] leading-[1.65]'}>
                        {row.detail}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <Section title={'How each of these was established'}>
        <p>
          The two provable layers were tested by reading the result back rather
          than by trusting the tool’s own report. Characters were planted at
          known positions and the text re-read afterwards. Files were compared
          byte by byte before and after.
        </p>
        <p>
          The rewrite was measured across five documents from 1,260 to 5,047
          words. Every figure survived in all five, and between 94 and 100 per
          cent of the original length was preserved. That measures the quality of
          the rewrite. It does not measure the watermark, and cannot.
        </p>
        <p>
          <strong>
            The rewrite is deliberately not performed by Claude or by Gemini.
          </strong>{' '}
          Rewriting Claude’s text with Claude would apply the watermark again at
          full strength rather than removing it. The model we use is one setting
          and is re-checked against a list of vendors known to watermark their
          own output.
        </p>
      </Section>

      <Section title={'What we would change if we learned we were wrong'}>
        <p>
          If a detector ships and shows the rewrite does not work, we will say so
          on this page and stop selling that part.
        </p>
        <p>
          The reason we can say that is that we have not built a business on a
          claim we cannot check. Two of the three things this product does are
          provable to the character and to the byte. The third is described here
          exactly as what it is.
        </p>
      </Section>
    </div>
  );
}

export default Capabilities;
