import Link from 'next/link';

/**
 * The publication strip.
 *
 * 04 entry 34, and one operational rule keeps it honest: a name goes in ONLY if
 * it links to a real piece from that outlet about the watermark. No article, no
 * entry. All nine came from Jon's own list with their links.
 *
 * The caption is not decoration. Publication names sitting under our own tool,
 * unlabelled, read as "as seen in", which would be false. Nobody has covered
 * un-claude. The caption says what the strip actually is, and it links through to
 * the mission page, which is Jon's to write.
 *
 * BRAND COLOURS, NOT LOGO FILES. Jon asked for real logos. 06 row 34 requires his
 * approval before any logo file is fetched, and CLAUDE.md section 5 requires it
 * before anything is downloaded. Each outlet's own colour is set here as the step
 * that needs no download. Logo files follow once he supplies or approves them.
 */
const ARTICLES = [
  { outlet: 'CNN', color: '#CC0000', href: 'https://www.cnn.com/2026/08/11/business/video/invisible-watermarks-coming-claudes-ai-written-text-digvid-vrtc' },
  { outlet: 'NPR', color: '#166E9E', href: 'https://www.npr.org/2026/08/17/nx-s1-5928211/anthropics-new-invisible-watermark-marks-content-generated-by-ai-chatbot-claude' },
  { outlet: 'ABC News', color: '#1B1B1B', href: 'https://www.youtube.com/watch?v=R01_-MkxFws' },
  { outlet: 'Forbes', color: '#004B8D', href: 'https://www.forbes.com/sites/anishasircar/2026/08/13/claude-will-now-leave-a-watermark-on-everything-it-writes-what-does-that-mean/' },
  { outlet: 'Fortune', color: '#0A0A0A', href: 'https://fortune.com/2026/08/11/anthropic-claude-watermark-ai-text-police-ai-slop/' },
  { outlet: 'Axios', color: '#0A5BD3', href: 'https://www.axios.com/2026/08/12/anthropic-claude-watermarks-ai-detection' },
  { outlet: 'TechCrunch', color: '#0A8F3C', href: 'https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/' },
  { outlet: 'CNET', color: '#0067B8', href: 'https://www.cnet.com/tech/services-and-software/anthropics-claude-will-add-watermarks-to-ai-generated-text-and-files/' },
  { outlet: 'The Register', color: '#FF0000', href: 'https://www.theregister.com/ai-and-ml/2026/08/11/anthropic-pledges-to-embed-watermarks-to-help-discern-ai-slop-in-sop-to-eu/5285792' },
];

export function CoverageMarquee() {
  return (
    <section className={'bg-foreground/[0.022] border-border/70 border-y'}>
      <div className={'mx-auto max-w-[1180px] px-5 pt-14 pb-9 sm:px-8'}>
        <p className={'text-foreground max-w-[52ch] text-[17px] leading-[1.5] font-medium tracking-[-0.015em] text-balance sm:text-[19px]'}>
          AI tools now mark what they make. Invisibly, and{' '}
          <Link
            href={'/mission'}
            className={'decoration-mark-strong underline decoration-2 underline-offset-[3px] transition-colors hover:text-foreground/70'}
          >
            without telling you
          </Link>
          .
        </p>

        <p className={'text-muted-foreground mt-2.5 text-[13px]'}>
          The story, as covered by:
        </p>
      </div>

      {/* Pauses on hover so a name can be clicked, which is the detail GPTZero's
          own implementation gets right. The two copies are what makes the loop
          seamless, and the spacing is wide enough that the same outlet is never
          on screen twice at once. */}
      <div className={'group relative overflow-hidden pb-14'}>
        <div
          className={
            'animate-drift flex w-max items-center group-hover:[animation-play-state:paused]'
          }
        >
          {[0, 1].map((copy) => (
            <div key={copy} className={'flex items-center'} aria-hidden={copy === 1}>
              {ARTICLES.map((article) => (
                <a
                  key={`${copy}-${article.outlet}`}
                  href={article.href}
                  target={'_blank'}
                  rel={'noopener noreferrer'}
                  tabIndex={copy === 1 ? -1 : undefined}
                  style={{ '--outlet': article.color } as React.CSSProperties}
                  className={
                    'group/link inline-flex shrink-0 items-center px-9 text-[26px] font-semibold tracking-[-0.03em] whitespace-nowrap text-[color:var(--outlet)] opacity-45 transition-opacity duration-300 hover:opacity-100 sm:px-12 sm:text-[30px] dark:brightness-150'
                  }
                >
                  {article.outlet}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Fades at both ends so the loop has no visible seam. */}
        <div className={'from-foreground/[0.022] pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent'} aria-hidden />
        <div className={'from-foreground/[0.022] pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent'} aria-hidden />
      </div>
    </section>
  );
}
