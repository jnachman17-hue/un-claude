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
 */
function Home() {
  return (
    <div className={'flex flex-col'}>
      <HeroSection />
      <CoverageMarquee />
      <HowItWorksSection />
      <CoverageSection />
      <LimitsSection />
    </div>
  );
}

export default Home;
