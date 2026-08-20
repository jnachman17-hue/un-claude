import type { Metadata } from 'next';

import { PreviewHarness } from './preview-harness';

/**
 * A live theme bench for the real landing page.
 *
 * Jon, 19 August 2026: "It would help if you could actually make the landing
 * page I can view in browser at link ... and I can click there."
 *
 * This is NOT a copy of the landing page. It renders the real components inside
 * a wrapper that overrides the theme tokens, so what is being judged is the
 * actual product and not a mock that will drift from it within a day.
 *
 * `noindex` because it is a work surface, not a page. It is unlisted rather than
 * protected: there is no auth on the marketing side to hang a gate from, and the
 * page reveals nothing a visitor could not see on the home page anyway.
 */
export const metadata: Metadata = {
  title: 'Theme bench',
  robots: { index: false, follow: false },
};

function DevPreviewPage() {
  return <PreviewHarness />;
}

export default DevPreviewPage;
