import Link from 'next/link';

import { ArrowRightIcon, EyeOffIcon, FingerprintIcon, PaperclipIcon } from 'lucide-react';

import { FileProvenanceDiagram } from './diagrams/file-provenance';
import { HiddenCharactersDiagram } from './diagrams/hidden-characters';
import { StatisticalWatermarkDiagram } from './diagrams/statistical-watermark';

/**
 * Three kinds of mark, drawn rather than described.
 *
 * REBUILT after Jon's review. The first version gave one panel an accent
 * background and a side-by-side layout, then dropped the other two into a
 * two-column grid underneath, so the page changed shape halfway down for no
 * reason a reader could see. His objection was exactly right.
 *
 * All three are now the same panel: same width, same split, same treatment, in
 * the order a visitor meets them. The only thing that varies is the content.
 */
const LAYERS = [
  {
    id: 'statistical',
    icon: FingerprintIcon,
    title: 'The statistical watermark',
    lede: 'Nothing is added to your text at any point.',
    body: 'At each word where several choices read equally well, a secret key steers which one the model picks. Do that a few hundred times and the run of choices becomes a signature. It survives copy and paste, reformatting and light editing, because it is made of your words rather than hidden between them.',
    pull: 'The signal lives in runs of consecutive words. Break the runs and you break the signal.',
    Diagram: StatisticalWatermarkDiagram,
  },
  {
    id: 'characters',
    icon: EyeOffIcon,
    title: 'Hidden characters',
    lede: 'Real characters, drawn as nothing at all.',
    body: 'They sit between the letters you can see, taking up a position and no space. They arrive from AI tools, from web pages you copied out of, and from export pipelines. Nine classes are checked on every scan, free, in about forty milliseconds.',
    pull: 'This layer is exact. We name each one, point at where it sits, and read the text back to prove none are left.',
    Diagram: HiddenCharactersDiagram,
  },
  {
    id: 'provenance',
    icon: PaperclipIcon,
    title: 'Metadata',
    lede: 'A signed record attached to the file, not inside the picture.',
    body: 'Every file has a wrapper that describes it rather than being it. When an AI tool makes an image it writes a signed record in there saying so. Nearly every major provider now does this, they agreed on one format, and that format is removable by design.',
    pull: 'Removing it changes no pixel. The file is re-read afterwards to confirm nothing was left.',
    Diagram: FileProvenanceDiagram,
  },
];

export function HowItWorksSection() {
  return (
    <section className={'border-border/70 border-t'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-20 sm:px-8'}>
        <div className={'max-w-[46ch]'}>
          <h2
            className={
              'text-foreground text-[28px] leading-[1.1] font-semibold tracking-[-0.028em] text-balance sm:text-[34px]'
            }
          >
            Three kinds of mark. They hide in three different places.
          </h2>
          <p className={'text-muted-foreground mt-4 text-[15px] leading-[1.6]'}>
            None of this is secret. The more clearly you can picture where each
            mark sits, the easier it is to judge what any tool in this category
            can honestly promise you.
          </p>
        </div>

        <div className={'mt-10 space-y-5'}>
          {LAYERS.map(({ id, icon: Icon, title, lede, body, pull, Diagram }, index) => (
            <article
              key={id}
              className={'bg-card ring-border/70 animate-rise overflow-hidden rounded-[18px] ring-1'}
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <div className={'grid lg:grid-cols-2'}>
                <div className={'flex flex-col justify-center gap-3.5 p-7 sm:p-9'}>
                  <span
                    className={'bg-mark text-mark-foreground grid size-[34px] place-items-center rounded-[10px]'}
                  >
                    <Icon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
                  </span>

                  <h3 className={'text-foreground text-[21px] font-semibold tracking-[-0.02em]'}>
                    {title}
                  </h3>

                  <p className={'text-foreground max-w-[46ch] text-[14.5px] leading-[1.55] font-medium'}>
                    {lede}
                  </p>

                  <p className={'text-muted-foreground max-w-[46ch] text-[14px] leading-[1.65]'}>
                    {body}
                  </p>

                  <p
                    className={
                      'border-mark-strong text-foreground mt-1 max-w-[46ch] border-l-2 pl-3.5 text-[13.5px] leading-[1.6] font-medium'
                    }
                  >
                    {pull}
                  </p>
                </div>

                <div
                  className={
                    'border-border/70 bg-foreground/[0.016] flex items-center justify-center border-t p-6 lg:border-t-0 lg:border-l'
                  }
                >
                  <Diagram className={'h-auto w-full max-w-[440px]'} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <Link
          href={'/how-it-works'}
          className={
            'text-foreground hover:bg-foreground/[0.045] mt-7 inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors'
          }
        >
          The full technical explanation
          <ArrowRightIcon className={'size-[14px]'} strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
