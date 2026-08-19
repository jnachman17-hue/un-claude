import { Workbench } from './workbench/workbench';

/**
 * The hero, and it is the product rather than a picture of one.
 *
 * 04 entry 20: the landing page IS the tool. A stranger arrives, uses it, and
 * hits a limit that asks them to register. Building the tool only behind a login
 * would turn this page into a page that describes a tool instead of being one.
 *
 * The box scans itself on arrival, so the first thing anyone sees is the product
 * working on real text rather than a screenshot of it.
 */
export function HeroSection() {
  return (
    <section className={'relative overflow-hidden'}>
      {/* A single soft warmth behind the tool, so the box reads as the subject of
          the page rather than as a form sitting on white. No mesh, no gradient
          blobs, nothing that announces itself. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute top-[-18%] right-[-10%] h-[560px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.16] blur-[90px]'
        }
      />

      <div className={'relative mx-auto max-w-[1180px] px-5 pt-7 pb-16 sm:px-8 lg:pt-12 lg:pb-20'}>
        <div className={'grid items-start gap-7 lg:grid-cols-12 lg:gap-12'}>
          <div className={'animate-rise lg:col-span-5 lg:pt-6'}>
            <h1
              className={
                'text-foreground text-[30px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[52px] lg:leading-[1.04] lg:tracking-[-0.032em]'
              }
            >
              Remove the watermark Claude puts in your writing.
            </h1>

            <p
              className={
                'text-muted-foreground mt-3.5 max-w-[38ch] text-[15px] leading-[1.55] tracking-[-0.006em] lg:mt-5 lg:text-[16px] lg:leading-[1.6]'
              }
            >
              Paste text or drop a file. We find the marks that identify it as AI
              written, and remove them.
            </p>
          </div>

          <div
            className={'animate-rise lg:col-span-7'}
            style={{ animationDelay: '110ms' }}
          >
            <Workbench />
          </div>
        </div>
      </div>
    </section>
  );
}
