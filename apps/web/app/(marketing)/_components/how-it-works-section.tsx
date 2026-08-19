import Link from 'next/link';

import { ArrowRightIcon, EyeOffIcon, FingerprintIcon, StampIcon } from 'lucide-react';

import { FileProvenanceDiagram } from './diagrams/file-provenance';
import { HiddenCharactersDiagram } from './diagrams/hidden-characters';
import { StatisticalWatermarkDiagram } from './diagrams/statistical-watermark';

/**
 * Three kinds of mark, drawn rather than described.
 *
 * The statistical one gets the large panel because it is the one people arrive
 * for, the one that is hardest to picture, and the one every wrong intuition
 * about this product comes from.
 */
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
            Nothing here is a trade secret. The more clearly you can picture where
            each mark sits, the easier it is to judge what a remover can honestly
            promise about it.
          </p>
        </div>

        {/* The one that matters most, given room to be understood. */}
        <div className={'bg-card ring-border/70 mt-10 overflow-hidden rounded-[18px] ring-1'}>
          <div className={'grid lg:grid-cols-2'}>
            <div className={'flex flex-col justify-center gap-4 p-7 sm:p-9'}>
              <span className={'bg-mark text-mark-foreground grid size-[34px] place-items-center rounded-[10px]'}>
                <FingerprintIcon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
              </span>

              <h3 className={'text-foreground text-[21px] font-semibold tracking-[-0.02em]'}>
                The statistical watermark
              </h3>

              <p className={'text-muted-foreground max-w-[46ch] text-[14px] leading-[1.65]'}>
                Nothing is added to your text. At each word where several choices
                read equally well, a secret key steers which one the model picks.
                Do that a few hundred times and the run of choices becomes a
                signature. It survives copy and paste, reformatting and light
                editing, because it is made of your words rather than hidden
                between them.
              </p>

              <p className={'text-foreground max-w-[46ch] text-[13.5px] leading-[1.6] font-medium'}>
                The signal lives in runs of consecutive words. Break the runs and
                you break the signal, which is exactly what sanitising does.
              </p>
            </div>

            <div className={'border-border/70 bg-foreground/[0.014] flex items-center justify-center border-t p-6 lg:border-t-0 lg:border-l'}>
              <StatisticalWatermarkDiagram className={'h-auto w-full max-w-[440px]'} />
            </div>
          </div>
        </div>

        <div className={'mt-5 grid gap-5 lg:grid-cols-2'}>
          <article className={'bg-card ring-border/70 flex flex-col overflow-hidden rounded-[18px] ring-1'}>
            <div className={'flex flex-col gap-3 p-7'}>
              <span className={'bg-foreground/[0.055] text-foreground/70 grid size-[34px] place-items-center rounded-[10px]'}>
                <EyeOffIcon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className={'text-foreground text-[18px] font-semibold tracking-[-0.02em]'}>
                Hidden characters
              </h3>
              <p className={'text-muted-foreground max-w-[44ch] text-[13.5px] leading-[1.6]'}>
                Real characters sitting between the visible ones, drawn as
                nothing. They arrive from AI tools, from web pages you copied
                from, and from export pipelines. Finding them is exact: we can
                name each one and point at where it sits.
              </p>
            </div>
            <div className={'border-border/70 bg-foreground/[0.014] mt-auto border-t p-5'}>
              <HiddenCharactersDiagram className={'h-auto w-full'} />
            </div>
          </article>

          <article className={'bg-card ring-border/70 flex flex-col overflow-hidden rounded-[18px] ring-1'}>
            <div className={'flex flex-col gap-3 p-7'}>
              <span className={'bg-foreground/[0.055] text-foreground/70 grid size-[34px] place-items-center rounded-[10px]'}>
                <StampIcon className={'size-[17px]'} strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className={'text-foreground text-[18px] font-semibold tracking-[-0.02em]'}>
                File provenance
              </h3>
              <p className={'text-muted-foreground max-w-[44ch] text-[13.5px] leading-[1.6]'}>
                A signed record of what made a file, tucked into the file’s
                wrapper rather than its content. Nearly every major provider
                attaches one now, they all agreed on the same format, and that
                format is removable by design.
              </p>
            </div>
            <div className={'border-border/70 bg-foreground/[0.014] mt-auto border-t p-5'}>
              <FileProvenanceDiagram className={'h-auto w-full'} />
            </div>
          </article>
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
