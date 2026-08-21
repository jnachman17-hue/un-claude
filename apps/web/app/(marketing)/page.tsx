import appConfig from '~/config/app.config';

import { ClaudeBand } from './_components/claude-band';
import { CoverageMarquee } from './_components/coverage-marquee';
import { CoverageSection } from './_components/coverage-section';
import { FaqSection } from './_components/faq-section';
import { HeroSection } from './_components/hero-section';

/**
 * `title` is `absolute` so the root layout's title template (`%s · brand`)
 * does not append the brand name a second time onto a title that already
 * carries it. Every other page's `title` is a bare string that the template
 * appends to. `description` is trimmed to stay under Google's ~155-160
 * character truncation point without dropping any of the three watermark
 * layers it names.
 */
export const metadata = {
  title: { absolute: appConfig.title },
  description:
    'Scan text and files free for hidden AI watermarks: invisible characters, C2PA metadata and the mark in the words themselves. Sanitise in seconds.',
  alternates: { canonical: '/' },
};

/**
 * The Un-Claude landing page, radically cut 19 August 2026 on Jon's order:
 * "People don't care about the argument. Show them what they need. Tell them
 * what it does. Make sure they understand that this works with Claude and
 * park the bullshit elsewhere."
 *
 *   Hero      the tool, the claim, the authority strip. The rows teach.
 *   Marquee   nine outlets say this is real.
 *   Band      three beats: marked invisibly, detector coming, marks persist.
 *   Coverage  which vendors mark what, with sources.
 *   FAQ       everything hard, at full length, collapsed.
 *
 * Limits, stakes and moat died as sections in the same cut. Their depth
 * lives in the row teach-tables, the FAQ, and /how-it-works. 04 entry 86.
 */
function Home() {
  return (
    <div className={'flex flex-col'}>
      <HeroSection />
      <CoverageMarquee />
      <ClaudeBand />
      <CoverageSection />
      <FaqSection />
    </div>
  );
}

export default Home;
