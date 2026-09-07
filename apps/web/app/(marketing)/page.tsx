import appConfig from '~/config/app.config';

import { ClaudeBand } from './_components/claude-band';
import { CoverageMarquee } from './_components/coverage-marquee';
import { CoverageSection } from './_components/coverage-section';
import { FaqSection } from './_components/faq-section';
import { HeroSection } from './_components/hero-section';
import { WatermarkBriefing } from './_components/watermark-briefing';

import { shareTags } from '~/lib/share-tags';

/**
 * `title` is `absolute` so the root layout's title template (`%s · brand`)
 * does not append the brand name a second time onto a title that already
 * carries it. Every other page's `title` is a bare string that the template
 * appends to. `description` is trimmed to stay under Google's ~155-160
 * character truncation point without dropping any of the three watermark
 * layers it names.
 */
/**
 * Written once and used twice: the browser tab and the share preview must
 * not be able to drift apart.
 */
const DESCRIPTION =
  'Scan text and files free for hidden AI watermarks: invisible characters, C2PA metadata and the mark in the words themselves. Sanitise in seconds.';

export const metadata = {
  title: { absolute: appConfig.title },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  ...shareTags({
    title: appConfig.title,
    description: DESCRIPTION,
    path: '/',
  }),
};

/**
 * WHO THIS SITE BELONGS TO, WRITTEN SO A SEARCH ENGINE CAN READ IT.
 * Added 24 August 2026. There was no structured data anywhere on the site.
 *
 * Structured data is a small block of machine-readable facts in the page, in a
 * format every search engine agrees on. It is not shown to a visitor. It is
 * how Google learns that "Un-Claude" is the name of an organisation, that this
 * address is its website, and which image is its logo — rather than inferring
 * all three from the page and sometimes inferring them wrong.
 *
 * ★ EVERY FIELD HERE IS A FACT AND NONE OF THEM IS A CLAIM. Structured data is
 * copy, and `CLAUDE.md` section 7 governs copy. So this block carries a name,
 * an address, a logo and a support email, and deliberately carries NO
 * `description` — a description here would be a product claim in a place
 * nobody would think to review, and the one question that catches most of them
 * ("which layer, and is that provable?") cannot even be asked of a sentence
 * hidden in a script tag.
 *
 * ★ THIS DOES NOT FIX THE GREY BOX IN SEARCH RESULTS. That box is the favicon,
 * the favicon is already correct and already reachable, and it is waiting on
 * Google to recrawl the site. Nothing in this block changes it, and nobody
 * should be told otherwise.
 *
 * The logo is the 512-pixel icon that already exists and already answers 200.
 * Google wants a real, fetchable image; it does not want a promise of one.
 */
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: appConfig.name,
  url: appConfig.url,
  logo: `${appConfig.url}/images/favicon/android-chrome-512x512.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@un-claude.com',
  },
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
      {/* Renders nothing a visitor sees. It is read, not displayed. */}
      <script
        type={'application/ld+json'}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ORGANIZATION_JSON_LD),
        }}
      />

      {/*
        THE ARRIVAL BRIEFING, 6 September 2026. Jon: "It should pop up as soon
        as you get to the website so you understand the issue."

        It renders NOTHING on the server and nothing for a visitor who arrived
        from a search engine, so the prerendered HTML a crawler reads is
        unchanged and no searcher ever meets an interstitial. Both of those are
        load-bearing rather than tidy; the docblock in the component says why,
        and it is the same shape of risk as the one that cost this site its
        indexing in August.
      */}
      <WatermarkBriefing />

      <HeroSection />
      <CoverageMarquee />
      <ClaudeBand />
      <CoverageSection />
      <FaqSection />
    </div>
  );
}

export default Home;
