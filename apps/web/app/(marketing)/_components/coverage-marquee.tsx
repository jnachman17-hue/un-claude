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
 * Un-Claude. The caption says what the strip actually is, and it links through to
 * the mission page, which is Jon's to write.
 *
 * REAL ARTWORK, all nine, supplied by Jon. Which is the right route: 06 row 34
 * requires his approval before any logo file is fetched, and a masthead he took
 * from a press page is on far safer ground than one scraped from a search result.
 *
 * Three of them carry their own background, because that is how those brands
 * present: CNN's red square, The Register's red band and Forbes' dark band. They
 * get a corner radius and no colour treatment. The rest are art on transparent
 * and are inverted for dark mode, with a hue rotation where the mark also carries
 * a brand colour so that Axios blue does not come back orange.
 */
interface Article {
  outlet: string;
  href: string;
  logo: {
    src: string;
    /** Carries its own background, so it gets a corner radius and no inversion. */
    plate?: boolean;
    /** Dark art on transparent. Needs inverting to stay legible in dark mode. */
    mono?: boolean;
    /** Dark art plus a brand colour. Inverting alone would flip the hue too. */
    mixed?: boolean;
    /** Square-ish marks need a touch more height to match a wordmark's weight. */
    tall?: boolean;
  };
}

const ARTICLES: Article[] = [
  {
    outlet: 'CNN',
    href: 'https://www.cnn.com/2026/08/11/business/video/invisible-watermarks-coming-claudes-ai-written-text-digvid-vrtc',
    logo: { src: '/images/outlets/cnn.png', plate: true, tall: true },
  },
  {
    outlet: 'NPR',
    href: 'https://www.npr.org/2026/08/17/nx-s1-5928211/anthropics-new-invisible-watermark-marks-content-generated-by-ai-chatbot-claude',
    logo: { src: '/images/outlets/npr.png', plate: true },
  },
  {
    outlet: 'ABC News',
    href: 'https://www.youtube.com/watch?v=R01_-MkxFws',
    logo: { src: '/images/outlets/abc.png', mono: true },
  },
  {
    outlet: 'Forbes',
    href: 'https://www.forbes.com/sites/anishasircar/2026/08/13/claude-will-now-leave-a-watermark-on-everything-it-writes-what-does-that-mean/',
    logo: { src: '/images/outlets/forbes.svg', plate: true },
  },
  {
    outlet: 'Fortune',
    href: 'https://fortune.com/2026/08/11/anthropic-claude-watermark-ai-text-police-ai-slop/',
    logo: { src: '/images/outlets/fortune.png', mono: true },
  },
  {
    outlet: 'Axios',
    href: 'https://www.axios.com/2026/08/12/anthropic-claude-watermarks-ai-detection',
    logo: { src: '/images/outlets/axios.png', mixed: true },
  },
  {
    outlet: 'TechCrunch',
    href: 'https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/',
    logo: { src: '/images/outlets/techcrunch.png', mixed: true },
  },
  {
    outlet: 'CNET',
    href: 'https://www.cnet.com/tech/services-and-software/anthropics-claude-will-add-watermarks-to-ai-generated-text-and-files/',
    logo: { src: '/images/outlets/cnet.png', mono: true },
  },
  {
    outlet: 'The Register',
    href: 'https://www.theregister.com/ai-and-ml/2026/08/11/anthropic-pledges-to-embed-watermarks-to-help-discern-ai-slop-in-sop-to-eu/5285792',
    logo: { src: '/images/outlets/register.png', plate: true },
  },
];

export function CoverageMarquee() {
  return (
    <section>
      <div className={'mx-auto max-w-[1180px] px-5 pt-14 pb-9 sm:px-8'}>
        <p
          className={
            'text-foreground max-w-[52ch] text-[17px] leading-[1.5] font-medium tracking-[-0.015em] text-balance sm:text-[19px]'
          }
        >
          AI tools now mark what they make. Invisibly, and{' '}
          <Link
            href={'/mission'}
            className={
              'decoration-mark-strong underline decoration-2 underline-offset-[3px] transition-colors hover:text-foreground/70'
            }
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
      <div
        className={
          'group bg-foreground/[0.022] border-border/70 relative overflow-hidden border-y py-9'
        }
      >
        <div
          className={
            'animate-drift flex w-max items-center group-hover:[animation-play-state:paused]'
          }
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className={'flex items-center'}
              aria-hidden={copy === 1}
            >
              {ARTICLES.map((article) => (
                <a
                  key={`${copy}-${article.outlet}`}
                  href={article.href}
                  target={'_blank'}
                  rel={'noopener noreferrer'}
                  tabIndex={copy === 1 ? -1 : undefined}
                  aria-label={`${article.outlet} on the AI watermark story`}
                  className={
                    'inline-flex shrink-0 items-center px-9 opacity-65 transition-opacity duration-300 hover:opacity-100 sm:px-12'
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.logo.src}
                    alt={article.outlet}
                    loading={'lazy'}
                    decoding={'async'}
                    className={[
                      'w-auto object-contain',
                      article.logo.tall ? 'h-[32px]' : 'h-[26px]',
                      article.logo.plate ? 'rounded-[5px]' : '',
                      // A plate brings its own background and needs no help.
                      // Dark art on transparent would vanish on a dark page, so it
                      // is inverted; where the mark also carries a brand colour the
                      // hue is rotated back so blue does not become orange.
                      article.logo.mono ? 'dark:invert' : '',
                      article.logo.mixed
                        ? 'dark:invert dark:hue-rotate-180'
                        : '',
                    ].join(' ')}
                  />
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Fades at both ends so the loop has no visible seam. */}
        <div
          className={
            'from-foreground/[0.022] pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent'
          }
          aria-hidden
        />
        <div
          className={
            'from-foreground/[0.022] pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent'
          }
          aria-hidden
        />
      </div>
    </section>
  );
}
