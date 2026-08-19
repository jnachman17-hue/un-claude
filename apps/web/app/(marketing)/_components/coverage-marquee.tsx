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
 * BRAND COLOURS AND WEIGHTS, NOT LOGO FILES.
 *
 * Jon's objection is right: nine names in one typeface do not read as nine
 * mastheads. Each entry now carries its own colour, weight, tracking and casing,
 * which is as close as type alone gets.
 *
 * The real fix is the actual artwork, and Jon has offered to supply it. That is
 * the right route: 06 row 34 requires his approval before any logo file is
 * fetched, CLAUDE.md section 5 requires it before anything is downloaded, and a
 * masthead taken from a press page is on far safer ground than one scraped from a
 * search result. Drop PNG or SVG files into apps/web/public/images/outlets/ named
 * cnn.svg, npr.svg and so on, and they slot straight in here.
 */
const ARTICLES = [
  { outlet: 'CNN', color: '#CC0000', style: 'font-black tracking-[-0.05em]', href: 'https://www.cnn.com/2026/08/11/business/video/invisible-watermarks-coming-claudes-ai-written-text-digvid-vrtc' },
  { outlet: 'NPR', color: '#235F9E', style: 'font-bold tracking-[0.02em]', href: 'https://www.npr.org/2026/08/17/nx-s1-5928211/anthropics-new-invisible-watermark-marks-content-generated-by-ai-chatbot-claude' },
  { outlet: 'ABC News', color: '#0A0A0A', style: 'font-semibold tracking-[-0.03em]', href: 'https://www.youtube.com/watch?v=R01_-MkxFws' },
  { outlet: 'Forbes', color: '#0A0A0A', style: 'font-bold tracking-[-0.045em]', href: 'https://www.forbes.com/sites/anishasircar/2026/08/13/claude-will-now-leave-a-watermark-on-everything-it-writes-what-does-that-mean/' },
  { outlet: 'FORTUNE', color: '#0A0A0A', style: 'font-semibold tracking-[0.06em] text-[0.85em]', href: 'https://fortune.com/2026/08/11/anthropic-claude-watermark-ai-text-police-ai-slop/' },
  { outlet: 'Axios', color: '#1858C8', style: 'font-bold tracking-[-0.035em]', href: 'https://www.axios.com/2026/08/12/anthropic-claude-watermarks-ai-detection' },
  { outlet: 'TechCrunch', color: '#149A4B', style: 'font-bold tracking-[-0.04em]', href: 'https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/' },
  { outlet: 'CNET', color: '#E21B22', style: 'font-black tracking-[-0.02em]', href: 'https://www.cnet.com/tech/services-and-software/anthropics-claude-will-add-watermarks-to-ai-generated-text-and-files/' },
  { outlet: 'The Register', color: '#FF0000', style: 'font-semibold tracking-[-0.035em]', href: 'https://www.theregister.com/ai-and-ml/2026/08/11/anthropic-pledges-to-embed-watermarks-to-help-discern-ai-slop-in-sop-to-eu/5285792' },
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
                  className={[
                    'group/link inline-flex shrink-0 items-center px-9 text-[26px] whitespace-nowrap',
                    'text-[color:var(--outlet)] opacity-50 transition-opacity duration-300',
                    'hover:opacity-100 sm:px-12 sm:text-[30px] dark:brightness-[1.7]',
                    article.style,
                  ].join(' ')}
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
