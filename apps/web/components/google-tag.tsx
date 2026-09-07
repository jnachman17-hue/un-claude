'use client';

import Script from 'next/script';

import { CONSENT_KEY, GRANTED, DENIED } from '~/components/cookie-consent';

/**
 * The Google Ads tag, and the consent state it obeys.
 *
 * Added 6 September 2026, Jon's decision, so the ads account can measure
 * whether a click ever becomes a sale. Google's installation screen tells you
 * to paste its snippet "in the code of every page"; this application has no
 * such thing, so it is mounted once in `root-providers.tsx`.
 *
 * ★ THIS REVERSES THE COOKIELESS POSTURE, DELIBERATELY, AND THREE OTHER FILES
 * MOVED IN THE SAME COMMIT. `analytics-provider.tsx` states the rule: if the
 * analytics configuration changes, the privacy policy and the cookie policy
 * change with it and the site needs a consent banner. All three did. The
 * banner is `cookie-consent.tsx`.
 *
 * ★ CONSENT IS DENIED UNTIL A VISITOR SAYS OTHERWISE, and the ORDER below is
 * the whole of it. `gtag('consent','default')` has to reach the dataLayer
 * before any `config` command, or the first ping is sent under granted consent
 * and a cookie is written before anybody was asked. Both live in one
 * synchronous block, in that order, so the queue can only ever be built the
 * right way round whenever gtag.js finishes loading.
 *
 * ★ THE STORED CHOICE IS READ IN THE SAME BLOCK rather than in a React effect.
 * A returning visitor who already accepted would otherwise spend the first
 * moments of every page under denied consent, and their ad click would go
 * unattributed for no reason.
 *
 * `url_passthrough` keeps `gclid` travelling in the URL as well as in a cookie,
 * so an ad click stays identifiable in PostHog even for somebody who declines.
 */

/**
 * Public by design. It is served inside the page to every visitor, it is not a
 * credential, and it cannot spend money. Kept here rather than in an
 * environment variable so installing the tag needs no deploy-time
 * configuration and cannot silently go missing.
 */
const TAG_ID = 'AW-18434780777';

export function GoogleTag() {
  // Development gets nothing. A local page view is not a customer and has no
  // business reaching an advertising account.
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script id={'google-tag'} strategy={'afterInteractive'}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': '${DENIED}',
            'ad_user_data': '${DENIED}',
            'ad_personalization': '${DENIED}',
            'analytics_storage': '${DENIED}'
          });
          try {
            if (window.localStorage.getItem('${CONSENT_KEY}') === '${GRANTED}') {
              gtag('consent', 'update', {
                'ad_storage': '${GRANTED}',
                'ad_user_data': '${GRANTED}',
                'ad_personalization': '${GRANTED}',
                'analytics_storage': '${GRANTED}'
              });
            }
          } catch (e) {}
          gtag('set', 'url_passthrough', true);
          gtag('js', new Date());
          gtag('config', '${TAG_ID}');
        `}
      </Script>

      <Script
        id={'google-tag-src'}
        strategy={'afterInteractive'}
        src={`https://www.googletagmanager.com/gtag/js?id=${TAG_ID}`}
      />
    </>
  );
}
