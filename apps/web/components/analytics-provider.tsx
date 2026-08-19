'use client';

import Script from 'next/script';

/**
 * PostHog, loaded from its own script rather than the npm package.
 *
 * WHY NOT THE PACKAGE. posthog-js declares core-js as a runtime dependency, which
 * is a large polyfill set this application does not otherwise need and does not
 * want in its bundle. The hosted script is PostHog's own supported route, weighs
 * nothing at build time, and loads after the page is interactive.
 *
 * WHY COOKIELESS, AND WHY THAT IS THE WHOLE POINT. The rule in the EU and UK is
 * not about cookies by name: it is triggered by storing or accessing ANY
 * information on a visitor's device, local storage included. Strictly necessary
 * is exempt, analytics is not. PostHog's default persistence uses cookies, and
 * PostHog's own documentation says a site using it that way should show a consent
 * banner.
 *
 * `persistence: 'memory'` stores nothing at all, so there is no banner to build
 * and no claim in the cookie policy to walk back. The cost is that a visitor is
 * not recognised between sessions, so "returning visitors" is not a number to
 * trust here. Acquisition and in-session behaviour, which is what this is for,
 * are unaffected.
 *
 * SESSION REPLAY IS DELIBERATELY OFF. It was the strongest argument for choosing
 * PostHog and it is not safe to switch on casually: the main element on this page
 * is a box people paste confidential text into, and the privacy policy states
 * plainly that we do not keep what they give us. Replay is worth having, but only
 * once the masking is built and verified rather than assumed.
 *
 * IF ANY OF THIS CONFIGURATION CHANGES, the privacy policy and the cookie policy
 * change in the same commit, and the site needs a consent banner. 06 row 46.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export function AnalyticsProvider() {
  // No key means no analytics and no script tag. Local development and any
  // deployment without the variable simply run without it.
  if (!KEY) return null;

  return (
    <Script id={'posthog'} strategy={'afterInteractive'}>
      {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(${JSON.stringify(KEY)},{
  api_host: ${JSON.stringify(HOST)},
  persistence: 'memory',
  capture_pageview: 'history_change',
  disable_session_recording: true,
  autocapture: true,
  respect_dnt: true
});`}
    </Script>
  );
}
