# Track 4: Analytics, Google and the rename

**The smallest track and the one with the sharpest edges.** Two items here can
break something that currently works.

---

## Read these, in this order, before anything

| # | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` | The rules |
| 2 | `docs/TRACK-RULES.md` | **File ownership. Four sessions are running in parallel** |
| 3 | This file | |
| 4 | `apps/web/components/analytics-provider.tsx` | **Read the comment block in full.** It explains why every setting is what it is |
| 5 | `docs/06-...` rows **54, 55, 56, 60**, then 46 | This track's work list and the legal coupling |
| 6 | `docs/07-runbook.md`, the PostHog and Google sections | Three ways a verification lied, and the Google rules |
| 7 | `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx` | What has been promised about tracking |

---

## What exists

**PostHog is live and verified cookieless.** `persistence: 'memory'`, loaded from
PostHog's own script rather than the npm package because `posthog-js` pulls
`core-js`. Verified on the live site: library loaded, an event reached
`us.i.posthog.com/i/v0/e/`, and **cookies, local storage and session storage were
all empty.**

**Google sign-in is live**, end to end, with branding published. The consent screen
says "Sign in to continue to un-claude".

---

## What this session has to achieve

**1. `06` row 54. Funnel events. This is the actual job.**
PostHog captures pageviews and autocapture only. **Nothing tracks scan, sanitise,
hitting the paywall, or signing up, which is the entire reason analytics was
added.** Jon can see traffic and referrers and cannot see where the funnel breaks.

Events worth having: a scan completing and whether it found anything, a sanitise
starting and finishing, the paywall appearing, a sign-up starting and completing,
and a file being uploaded by type.

**Never send the visitor's content, or any part of it, as a property.** The privacy
policy states we do not keep what they give us.

**2. `06` row 55. Session replay, only with masking built AND verified.**
It was the strongest argument for choosing PostHog. **The main element on the page
is a box people paste confidential text into.** Enabling replay without proven
masking would make a published legal document false. Build the masking, verify it
by watching a real recording, then turn it on.

**3. `06` row 60. The Google logo and the rename to Un-Claude.**

*The logo:* cheap now the hard part is done. Put it on the Branding page, confirm
the site is not mid-deploy, click **Verify Branding**, then **Publish branding**.
Two separate buttons on a page separate from Publish app. **Branding is currently
verified. A change re-runs the check, and if it fails the app is unbranded until
sorted. Do it once with final artwork, not immediately before wanting traffic.**

*The rename:* **the site's own name and the Google app name must change together.**
The gap between them is what Google's checker measures.

---

## The rule that governs this whole track

**Any change to what is collected changes the policies, in the SAME commit.**
`06` row 46. A privacy policy claiming no tracking while tracking is a false
statement in a legal document.

**The check, before any deploy that adds a third party. Every name it prints must
appear in the privacy policy's "Who else is involved" table:**

```bash
grep -rniE "analytics|gtag|posthog|plausible|fathom|stripe|sentry|@vercel/analytics" \
  apps/web/app apps/web/components apps/web/package.json | grep -v node_modules
```

**If Google Ads is ever added, that is cookies, and it brings a consent banner.**
The site currently has none because nothing optional is stored.

---

## Three ways a verification lied here, all real

**`curl` cannot see an `afterInteractive` script.** Next injects it client side
after hydration. `curl | grep posthog` returning nothing proves nothing.

**The chunk path is `/_next/static/immutable/chunks/`**, not `static/chunks/`.

**Read the rendered DOM, not the source that produced it.** Every config check
passed while the stored host was truncated to `https://us.i.po`. Only this found
it:

```js
document.getElementById('posthog').textContent.match(/api_host: "([^"]*)"/)[1]
```

**Proving cookieless, and all three must be empty WITH `loaded: true`:**

```js
({ loaded: !!window.posthog.__loaded, cookies: document.cookie || '(none)',
   local: Object.keys(localStorage), session: Object.keys(sessionStorage) })
```

**Any build-time variable must be in three places:** Vercel, `turbo.json`
`globalEnv`, and `apps/web/.env` blank. Turborepo strips undeclared ones and the
build succeeds silently without them.

---

## What you must not do

**Do not edit the landing page, the workbench, billing, or the legal pages**
beyond the policy lines your own change makes false.

**`06` row 56, recorded so nobody misreads a number:** the browser used for
verification blocked PostHog with `ERR_BLOCKED_BY_CLIENT`. **Analytics undercount.**
This audience arrives from tech press, where blocking is above average.
