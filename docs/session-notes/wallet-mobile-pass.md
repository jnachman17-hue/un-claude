# The wallet at phone width, looked at for the first time

**21 August 2026, session 10.** The last unproven item from the session-9
handoff: `/home` had never been rendered or looked at on a phone.

Picture: `docs/wallet-mobile.png`.

---

## How it was looked at, since it needs a signed-in session

`/home` signed out is one sentence saying "sign in", so a plain screenshot
proves nothing. `apps/e2e/wallet-shots.mjs` signs the test browser in the only
way that involves no password: the Supabase admin API mints a ONE-TIME
magic-link token hash, and the browser hands it to `/auth/confirm`, which is the
same route a confirmation email uses.

    cd apps/e2e && node wallet-shots.mjs shots/wallet

It talks to the admin API over plain `fetch` rather than importing
`@supabase/supabase-js`, which is not a dependency of `apps/e2e`. Adding one
needs Jon under CLAUDE.md section 5, and two REST calls do not justify it. It
prints no email addresses (section 3).

The preview pane still cannot do this, for the reason recorded in
`mobile-pass.md`: below 768px it turns on device emulation and this site never
finishes hydrating.

---

## The layout: fine, and that is a measurement, not an opinion

    viewport      390 x 844
    scrollHeight  844
    sidewaysScroll 0        <- nothing overflows the screen

The balance card, the "About 4,000 words of sanitising. Credits never expire."
line and the "Get credits" button all sit inside the width with room to spare.
The history rows fit on one line each. Nothing needed changing.

There is a lot of empty space below the history, which is what a two-row history
looks like and not a defect.

---

## Two defects found, both fixed

### 1. The page could not be prerendered and had never said so

The only visible sign was the "1 Issue" badge in the corner of the dev build.
Chasing it:

    Route "/home": Next.js encountered the unstable value `Date.now()`
    while prerendering.
      at SupabaseAuthClient.__loadSession
      at HomePage

`next.config` has `cacheComponents: true`, under which every route is a
prerender candidate unless it declares a request-time dependency. This page
reads the visitor's own session, so a prerendered copy is meaningless by
definition, and Supabase's auth client calls `Date.now()` while loading that
session.

**This is a build-time problem, not dev noise.** Fixed with `await connection()`
at the top of `HomePage`, which declares that the render waits for a real
request. Console errors mentioning `Date.now()` after the fix: **0**.

### 2. "Transfer +1", which means nothing to the person reading it

The wallet mapped the ledger reason `adjustment` to the word **Transfer**.

**Nobody had ever seen this row.** The guest merge had never once run against
the real database, so no wallet had ever contained one. It ran for the first
time today, which makes this the FIRST ROW most new accounts will ever see,
sitting above their signup credits saying "Transfer +1" — a transfer from what,
to what, by whom.

CLAUDE.md section 8: read it as the visitor. That visitor used the tool before
making an account and does not know that a "guest session" was ever a thing, so
the sentence cannot mention one. It now says what happened in their words:

    Account credits                      +3
    Credits from before you signed up    +1

Fits one line at 390px.

---

## Flagged, not fixed

**Cloudflare Turnstile is erroring on every page load**, including this one:

    [Cloudflare Turnstile] Error: 600010.
    Failed to execute 'postMessage' on 'DOMWindow': the target origin
    ('https://challenges.cloudflare.com') does not match the recipient
    window's origin ('http://localhost:3000').

600010 is the invalid-domain error, so the sitekey in use does not list
`localhost`. Captcha protection is currently OFF in Supabase and is due to be
turned back on before launch — **so this wants resolving in the same sitting**,
or the first thing that happens after switching it on is that local testing
stops working. See `captcha-blocks-every-sanitise.md`.
