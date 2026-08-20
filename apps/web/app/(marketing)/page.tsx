import { CoverageMarquee } from './_components/coverage-marquee';
import { CoverageSection } from './_components/coverage-section';
import { FaqSection } from './_components/faq-section';
import { HeroSection } from './_components/hero-section';
import { LimitsSection } from './_components/limits-section';
import { MoatSection } from './_components/moat-section';
import { StakesSection } from './_components/stakes-section';

/**
 * The Un-Claude landing page. 04 entry 41, rebuilt 19 August 2026 under
 * entries 80 to 84 and the research in docs/09.
 *
 * The tool is the page, and everything under it is one argument told in
 * order, each section owning exactly one beat:
 *
 *   Hero        the tool, and the claim: if Claude wrote it, it is marked
 *   Marquee     nine outlets say this is real, citation not endorsement
 *   Limits      the three marks, where they hide, who can check them today
 *   Stakes      the mark cannot tell authors from editors, and the detector
 *               is coming for documents that already exist
 *   Moat        why a generic AI rewrite fails, and the engineering that
 *               does not
 *   Coverage    which vendors mark what, with sources
 *
 * HOW-IT-WORKS LEFT THE HOME PAGE, 19 August 2026. Its three drawn panels
 * were the largest text mass on the page, and the same depth already lives
 * at /how-it-works. Jon: the page "can't be 50 scroll lanes long." The
 * argument section links there for the reader who wants the drawings.
 *   FAQ         the hard questions, answered at full length
 *
 * The Anthropic quotes are distributed, one per doubt, never boxed together:
 * Jon rejected the collected version as telling no story, and docs/09
 * section 6 found the inline-citation pattern is what reads as evidence.
 */
function Home() {
  return (
    <div className={'flex flex-col'}>
      <HeroSection />
      <CoverageMarquee />
      <LimitsSection />
      <StakesSection />
      <MoatSection />
      <CoverageSection />
      <FaqSection />
    </div>
  );
}

export default Home;
