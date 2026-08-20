import { CoverageMarquee } from './_components/coverage-marquee';
import { CoverageSection } from './_components/coverage-section';
import { HeroSection } from './_components/hero-section';
import { HowItWorksSection } from './_components/how-it-works-section';
import { LimitsSection } from './_components/limits-section';

/**
 * The Un-Claude landing page. 04 entry 41.
 *
 * The tool is the page. Everything under it answers a question the tool raises:
 * who else does this, how does it actually work, and which parts of it can be
 * proved.
 *
 * ORDER CHANGED 19 August 2026. The argument section used to sit last, as a
 * closing disclaimer. Jon: "why isn't it showing in a good story?" It is the
 * story, so it now runs directly under the marquee and the deeper sections
 * follow it.
 */
function Home() {
  return (
    <div className={'flex flex-col'}>
      <HeroSection />
      <CoverageMarquee />
      {/* The argument comes before the detail. It names the three marks, says
          which of them anyone can check today and which is about to become
          checkable, and carries Anthropic's own three admissions. Everything
          below it goes deeper on something this section has already framed. */}
      <LimitsSection />
      <HowItWorksSection />
      <CoverageSection />
    </div>
  );
}

export default Home;
