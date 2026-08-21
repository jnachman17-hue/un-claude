# SEO fixes: canonical tags, title template, description length — 21 August 2026

The fix session that follows `docs/session-notes/seo-audit.md` (read-only,
21 August 2026). That audit found the problems; this session fixed the three
that were code fixes in my territory and proved each one with `curl` against
a running build, per `CLAUDE.md` section 4. Nothing was deployed. Nothing was
pushed. Nothing outside my assigned territory (`apps/web/lib/root-metdata.ts`,
`apps/web/app/layout.tsx`, and the metadata exports of the homepage,
`/how-it-works` and `/mission`) was touched.

**Environment note, worth keeping for the runbook.** I could not bind my own
dev server to port 3003 as instructed. Next.js 16 enforces a single dev-server
lock per build directory (`.next/dev/lock`), scoped to the project folder, not
to the port — so with four sessions sharing one working tree and one `.next`
folder, only whichever session's dev server is already running can hold the
lock, regardless of which port anyone else asks for. Port 3003 itself was
genuinely free; the block was the shared lock file, not port contention. I
verified everything below with `curl` against the dev server a peer session
already had running on port 3000 — read-only requests only, and my source
edits hot-reloaded there exactly as they would have on my own port, since it
is the same working tree. `docs/07-runbook.md` is the right home for this if
it recurs.

---

## What was wrong (confirmed live before this session's edits)

Re-verified myself before touching anything, matching the prior audit exactly:

- No `<link rel="canonical">` anywhere on the site.
- Only the homepage's `<title>` carried the brand name; every other page's
  title replaced the root title instead of extending it.
- Two meta descriptions ran past Google's ~155-160 character truncation
  point: the homepage at 162 and `/how-it-works` at 181.

**The two things a previous SEO session got wrong, re-checked and not
repeated:** there is no `noindex` tag anywhere in source or on any live page,
and the `http` → `https` redirects are all `308 Permanent Redirect`, not
temporary. Both closed; neither needed touching.

---

## Fix 1 — self-referencing canonical tags

Added `alternates: { canonical: '<path>' }` to each of the three pages I own,
so each names its own address rather than all pointing at the homepage (the
common mistake, and worse than having none). Left `apps/web/lib/root-metdata.ts`
itself with no canonical field, on purpose — setting one at the root would
have leaked onto every page that doesn't set its own, including the pricing
and legal pages another session owns, and given them the wrong canonical
(the homepage's) instead of no canonical at all.

**Proof, `curl` against the running build:**

```
$ curl -s http://localhost:3000/ | grep 'rel="canonical"'
<link rel="canonical" href="https://un-claude.com"/>

$ curl -s http://localhost:3000/how-it-works | grep 'rel="canonical"'
<link rel="canonical" href="https://un-claude.com/how-it-works"/>

$ curl -s http://localhost:3000/mission | grep 'rel="canonical"'
<link rel="canonical" href="https://un-claude.com/mission"/>
```

Each page names itself. No trailing slash on the homepage's — that matches
`NEXT_PUBLIC_SITE_URL` and the existing `og:url`, which have never carried
one either, so this isn't a new inconsistency.

---

## Fix 2 — a title template

`apps/web/lib/root-metdata.ts` now sets `title` as a template object
(`{ default: appConfig.title, template: '%s · Un-Claude' }`) instead of a
bare string. The homepage sets its own `title: { absolute: appConfig.title }`
so it keeps its exact current title instead of the template appending the
brand a second time onto a title that already carries it.

**Proof:**

```
$ curl -s http://localhost:3000/ | grep '<title>'
<title>Un-Claude · AI Watermark Remover</title>          ← unchanged, not doubled

$ curl -s http://localhost:3000/how-it-works | grep '<title>'
<title>How it works · Un-Claude</title>

$ curl -s http://localhost:3000/mission | grep '<title>'
<title>Our mission · Un-Claude</title>
```

This one field in the root file fixes every page site-wide, including pages
I did not touch — proof the template is doing the work, not per-page edits:

```
$ curl -s http://localhost:3000/pricing | grep '<title>'
<title>Pricing · Un-Claude</title>

$ curl -s http://localhost:3000/privacy-policy | grep '<title>'
<title>Privacy Policy · Un-Claude</title>

$ curl -s http://localhost:3000/terms-of-service | grep '<title>'
<title>Terms of Service · Un-Claude</title>

$ curl -s http://localhost:3000/cookie-policy | grep '<title>'
<title>Cookie Policy · Un-Claude</title>
```

Not one file outside my territory was edited to get those four.

---

## Fix 3 — two meta descriptions over length

Trimmed the homepage and `/how-it-works` descriptions under 155 characters.
Both were run past the `unclaude-messaging` skill's claims check first: the
concern with shortening any Layer B (statistical watermark) sentence is
widening a claim while cutting words, and neither trim does that. Nothing
that names hidden characters, metadata, or the statistical mark's provability
was changed in meaning; words were cut, not claims.

`/mission`'s description was already 136 characters — no complaint, no change,
verified.

**Proof, character counts of the actual strings now served:**

| Page | Before | After |
|---|---:|---:|
| `/` (home) | 162 | **145** |
| `/how-it-works` | 181 | **151** |

```
$ curl -s http://localhost:3000/ | grep 'name="description"'
<meta name="description" content="Scan text and files free for hidden AI
watermarks: invisible characters, C2PA metadata and the mark in the words
themselves. Sanitise in seconds."/>

$ curl -s http://localhost:3000/how-it-works | grep 'name="description"'
<meta name="description" content="Three kinds of AI watermark, where each
hides, and what Un-Claude does to each: found and counted, stripped and byte
verified, or sanitised by rewrite."/>
```

`/pricing` at 158 was left alone, as instructed — it belongs to another
session.

---

## Fix 4 — structured data: skipped

Not added. The brief allowed skipping rather than rushing it, and I'd rather
hand you three proven fixes than a fourth one done quickly at the end of a
session. `SoftwareApplication` or `Organization` JSON-LD on the homepage is a
reasonable next step and additive, not a defect — a clean pickup for a future
session once this one is deployed and settled.

---

## What this session did not touch, and why

- **The three legal pages, the pricing page, `apps/web/engine/`, the
  workbench, `docs/LAUNCH-CHECKLIST.md`.** Out of territory by the brief.
- **The `www.un-claude.com` / `un-claude.com` duplicate-hosts question** from
  the prior audit's finding 2. That fix lives in Vercel's Domains dashboard,
  not in source — nothing here to prove with `curl` from a dev build, and not
  in this session's scope either.
- **`/capabilities`' own over-length description (171 characters)**, also
  flagged in the prior audit. Not in this session's page list. Worth a line
  in a future SEO pass.
- **Deploying.** Forbidden this session on purpose — two other sessions have
  unfinished edits on disk, and a deploy ships the working tree, not git.

---

## Your Search Console walkthrough

This half of the job is yours, and only after the deploy that hasn't happened
yet. Doing it now would be pointless: Google would just re-crawl the current
(un-deployed) build, and you'd hit the exact stale-data trap the last SEO
session fell into. Come back to this list once Jon has deployed the quiet
tree.

1. **Test the live homepage.** In Search Console, find "URL Inspection" in
   the left sidebar. Paste `https://un-claude.com/` into the search bar at
   the top and press enter. Once it loads the page's current status, click
   **"Test Live URL"** (a button on the right side of the panel). Wait for it
   to finish — it takes 10-30 seconds. You're looking for three lines, all
   green:
   - **Crawl allowed: YES**
   - **Page fetch: SUCCESSFUL**
   - **Indexing allowed: YES**

   If any of the three says otherwise, stop and send me the exact wording —
   don't try to interpret it yourself.

2. **Check the canonical Google agrees with.** Still on that same URL
   Inspection result (the live-test one, not the older cached one), scroll to
   a section usually labeled **"Indexing"** or shown as a small table. Look
   for two lines:
   - **User-declared canonical** — this is the tag we just added; it should
     read `https://un-claude.com/`.
   - **Google-selected canonical** — this is Google's own choice, which may
     lag behind or differ.

   If they match, you're done, that's the goal. **If they disagree** — for
   instance if Google's line shows `https://www.un-claude.com/` or something
   else — that means Google had already picked a favorite before we added the
   tag, and it can take a supplementary crawl or two to update. Don't try to
   force it; just note it and check back in a week.

3. **Inspect the `www` address.** Paste `https://www.un-claude.com/` into the
   same URL Inspection search bar. You're looking for a status that says
   **"Page with redirect"**, not "Submitted and indexed" or anything implying
   it's a separate live page. This confirms Google correctly sees `www` as
   just a redirect into the real site, not a competing copy of it.

4. **Request indexing on four pages, in order.** Wait until Jon has told you
   the deploy is live before doing this — otherwise you're asking Google to
   re-read the same old build we're trying to fix. For each of these four
   addresses: paste it into the URL Inspection search bar, wait for the
   result, then click **"Request Indexing"** (usually near the top right of
   the result panel). Do this once per page, not repeatedly:
   - `https://un-claude.com/`
   - `https://un-claude.com/pricing`
   - `https://un-claude.com/how-it-works`
   - `https://un-claude.com/mission`

5. **What's normal afterward, and the mistake to not repeat.** Indexing takes
   days, sometimes longer, never minutes — don't read anything into a quiet
   Search Console the day after. And every report you look at in Search
   Console reflects Google's **last crawl**, not the page as it exists right
   now. A previous session misread a stale 15 August crawl as a live `noindex`
   tag that had never actually existed anywhere in the code, and sent everyone
   hunting for a problem that wasn't there. If a report ever looks wrong, the
   first question is always "when was this crawled," visible right on the
   inspection result, before assuming the site itself is broken.
