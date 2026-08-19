import { ArrowUpRightIcon } from 'lucide-react';

/**
 * The publication strip.
 *
 * 04 entry 34, and one operational rule keeps it honest: a name goes in ONLY if
 * it links to a real piece from that outlet about the watermark. No article, no
 * logo. Every entry below came from Jon's own list with its link.
 *
 * The caption is not decoration and is not optional. Publication names sitting
 * under our own tool, unlabelled, read as "as seen in", which would be false.
 * Nobody has covered un-claude. The caption says what the strip actually is.
 *
 * WORDMARKS, NOT LOGOS, deliberately. 06 row 34 requires Jon's approval before
 * any logo file is fetched, and CLAUDE.md section 5 requires it before anything
 * is downloaded. Names linking to what an outlet published is citation. Logos
 * are the thing that starts to imply endorsement.
 *
 * Ordered by reach, largest first, at Jon's instruction.
 */
const ARTICLES = [
  { outlet: 'CNN', href: 'https://www.cnn.com/2026/08/11/business/video/invisible-watermarks-coming-claudes-ai-written-text-digvid-vrtc' },
  { outlet: 'NPR', href: 'https://www.npr.org/2026/08/17/nx-s1-5928211/anthropics-new-invisible-watermark-marks-content-generated-by-ai-chatbot-claude' },
  { outlet: 'ABC News', href: 'https://www.youtube.com/watch?v=R01_-MkxFws' },
  { outlet: 'Forbes', href: 'https://www.forbes.com/sites/anishasircar/2026/08/13/claude-will-now-leave-a-watermark-on-everything-it-writes-what-does-that-mean/' },
  { outlet: 'Fortune', href: 'https://fortune.com/2026/08/11/anthropic-claude-watermark-ai-text-police-ai-slop/' },
  { outlet: 'Axios', href: 'https://www.axios.com/2026/08/12/anthropic-claude-watermarks-ai-detection' },
  { outlet: 'TechCrunch', href: 'https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/' },
  { outlet: 'CNET', href: 'https://www.cnet.com/tech/services-and-software/anthropics-claude-will-add-watermarks-to-ai-generated-text-and-files/' },
  { outlet: 'The Register', href: 'https://www.theregister.com/ai-and-ml/2026/08/11/anthropic-pledges-to-embed-watermarks-to-help-discern-ai-slop-in-sop-to-eu/5285792' },
];

export function CoverageMarquee() {
  return (
    <section className={'border-border/70 border-y'}>
      <div className={'mx-auto max-w-[1180px] px-5 py-10 sm:px-8'}>
        <p className={'text-foreground max-w-[42ch] text-[14px] leading-relaxed font-medium'}>
          AI tools now mark what they make. Invisibly, and without telling you.
          <span className={'text-muted-foreground'}> The story, as covered by:</span>
        </p>
      </div>

      {/* The strip pauses on hover so a name can actually be clicked, which is
          the detail GPTZero's own implementation gets right. */}
      <div className={'group relative overflow-hidden pb-10'}>
        <div
          className={
            'animate-drift flex w-max items-center gap-10 group-hover:[animation-play-state:paused] sm:gap-14'
          }
        >
          {[0, 1].map((copy) => (
            <div key={copy} className={'flex items-center gap-10 sm:gap-14'} aria-hidden={copy === 1}>
              {ARTICLES.map((article) => (
                <a
                  key={`${copy}-${article.outlet}`}
                  href={article.href}
                  target={'_blank'}
                  rel={'noopener noreferrer'}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className={
                    'text-muted-foreground hover:text-foreground group/link inline-flex shrink-0 items-center gap-1.5 text-[19px] font-medium tracking-[-0.02em] whitespace-nowrap transition-colors sm:text-[22px]'
                  }
                >
                  {article.outlet}
                  <ArrowUpRightIcon
                    className={'size-[13px] opacity-0 transition-opacity group-hover/link:opacity-100'}
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Fades at both ends so the loop has no visible seam. */}
        <div className={'from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent'} aria-hidden />
        <div className={'from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent'} aria-hidden />
      </div>
    </section>
  );
}
