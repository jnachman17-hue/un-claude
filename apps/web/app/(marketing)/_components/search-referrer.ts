/**
 * Did this visitor arrive from a search engine?
 *
 * ★ THIS IS ITS OWN FILE FOR ONE REASON: SO IT CAN BE RUN AND PROVED.
 *
 * It is the rule that keeps the arrival briefing away from search traffic, and
 * that rule is the whole defence against Google's intrusive-interstitial
 * ranking signal. A wrong answer here is not a cosmetic bug, it is the same
 * category of self-inflicted wound as the `Date.now()` that cost this site its
 * indexing in August (`04` entry 71, `07`).
 *
 * Inside `watermark-briefing.tsx` it could only ever be tested by arranging a
 * real navigation from Google, which nobody can do from a development machine.
 * As a pure function of two strings, with no React and no browser in it, it
 * runs under `node --experimental-strip-types` and every case can be shown.
 *
 * NO IMPORTS, and it must stay that way, or it stops being runnable.
 */

/**
 * Matched as a substring of the referrer's HOSTNAME, never of the whole URL.
 *
 * Hostname only, because a URL match would fire on
 * `https://example.com/?ref=google.com` and silently suppress the briefing for
 * a visitor who never came from a search engine. Only the host says where
 * somebody actually came from.
 *
 * Substring rather than exact, because one entry has to cover a hundred hosts:
 * `google.` catches `www.google.com`, `google.co.uk` and `news.google.com`,
 * and `yandex.` catches every country domain it runs. The trailing dot on
 * those two is deliberate and is what stops `google.` matching a hostname like
 * `notgoogleatall.com` — there is no dot after `google` there.
 */
const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'duckduckgo.com',
  'search.yahoo',
  'yahoo.com',
  'ecosia.org',
  'search.brave.com',
  'startpage.com',
  'qwant.com',
  'baidu.com',
  'yandex.',
] as const;

/**
 * @param referrer  `document.referrer`. Empty for a direct visit, a typed
 *                  address, most app-to-browser handoffs, and anything sent
 *                  with a `noreferrer` link.
 * @param selfHost  `window.location.hostname`, so a visitor moving around
 *                  inside this site is never mistaken for an arrival.
 */
export function isSearchReferrer(referrer: string, selfHost: string): boolean {
  if (!referrer) return false;

  let host: string;

  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    // An unparseable referrer is not evidence of anything. Fail towards
    // showing the briefing, because the alternative is suppressing it for
    // everybody the moment a browser sends something unexpected.
    return false;
  }

  if (host === selfHost.toLowerCase()) return false;

  return SEARCH_HOSTS.some((needle) => host.includes(needle));
}
