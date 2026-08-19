import { HeroSection } from './_components/hero-section';

/**
 * The un-claude landing page.
 *
 * Sections still to build, in order: the publication marquee with Jon's caption
 * (04 entry 34), how it works in three steps, coverage across every model with
 * Claude prominent and the other labs present, the limits, and credits. 04
 * entry 41.
 */
function Home() {
  return (
    <div className={'flex flex-col'}>
      <HeroSection />
    </div>
  );
}

export default Home;
