# Making the homepage visible to Google

**Session, 24 August 2026.** Brief: `docs/briefs/homepage-visible-to-google.md`.

---

## What I could not prove

**Leading with this, per the brief.**

- **I did not verify the fix against the live site.** The brief forbids pushing
  and deploying, so every "after" number below comes from a local production
  build (`pnpm build`, the same command Vercel runs) read out of
  `apps/web/.next/server/app/*.html` — the actual prerendered HTML files Next
  writes and then serves. That is a production build, not a dev server, so it
  is the right artefact. But **un-claude.com will not change until somebody
  deploys.** The "before" numbers were taken from the live site AND reproduced
  in the local build, and they matched exactly, which is the reason to trust
  the "after" numbers from the same place.
- **I could not confirm Google has recrawled anything**, and nothing here can.
  Ranking changes are Google's to make on Google's schedule.
- **The grey box in search results is not fixed by any of this** — see Job 2.

---

## Job 1 — the homepage's content was not in the served HTML

### Before, from a real run

Fetched as Googlebot, `<script>` and `<style>` stripped, all tags stripped,
remaining words counted:

```
UA='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
curl -s -A "$UA" https://un-claude.com$p \
  | perl -0777 -pe 's/<script\b.*?<\/script>//gis; s/<style\b.*?<\/style>//gis; s/<[^>]+>/ /gs;' \
  | wc -w
```

```
/                words=75     chars=137858   h1=*** NO H1 ***
/capabilities    words=638    chars=152146   h1=[What we do, exactly.]
/how-it-works    words=1240   chars=166437   h1=[Where an AI watermark actually hides.]
/pricing         words=1046   chars=155269   h1=[5 credits free. Packs from $4.99.]
/mission         words=637    chars=96284    h1=[Why I built this.]
/contact         words=136    chars=85445    h1=[Get in touch]
```

The 75 words on the homepage are the navigation menu, the footer's one
sentence and the footer's link lists. There is no page body at all.

*(Note on `/pricing`: its `<h1>` reads as the whole sentence once the tags
nested inside it are stripped. The brief recorded it as the bare character
"5" — that was an artefact of a stripper that stopped at the first inner tag.
See Job 4.)*

### It reproduces locally, which is what made it diagnosable

A local production build writes the same file:

```
.next/server/app/index.html          75 words, no <h1>
.next/server/app/capabilities.html  638 words
```

Identical to the live numbers. So this is a build-time fact, not a
deployment or a CDN fact, and it can be fixed and proved without deploying.

### What the cause actually was

**One call to `Date.now()`, made while the page was being drawn, inside the
live word counter.** `app/(marketing)/_components/live-counter.tsx`, line 148:

```tsx
const [words, setWords] = useState(() => currentTotal(Date.now()));
```

**Why one clock reading deletes an entire page.** This app is built with a
Next.js setting called `cacheComponents` (`next.config.mjs`). It means: build
as much of every page as possible ahead of time, into a plain HTML file, and
serve that file instantly to everyone. That pre-built file is what a search
engine reads.

For that to work, Next has to know which parts of a page are the same for
everybody and which are not. So while it is pre-building, it watches for the
handful of things that can only be known at the moment a real person asks for
the page. **Reading the clock is one of them** — along with `Math.random()`
and `new Date()`. The instant one of them is called, Next stops pre-building
that region and marks it "fill this in later, per visitor".

**"That region" is the problem.** It is not the component that read the clock.
It is everything up to the nearest `<Suspense>` boundary — the marker that
says "content below here may arrive late; here is a placeholder meanwhile".
**The homepage had no such marker anywhere inside it.** The nearest one is the
one Next creates automatically for the whole route because
`app/(marketing)/loading.tsx` exists — and that one wraps the entire page.

So the clock reading in a small desktop-only counter halfway down the hero
took the whole page body with it. What got written into `index.html` was the
placeholder from `loading.tsx`, which is an empty box:

```html
<main id="main">
  <!--$?-->
  <template id="B:0"></template>
  <div class="min-h-[60vh] w-full"></div>   <!-- ContentFallback: an empty box -->
  <!--/$-->
</main>
```

`<!--$?-->` is Next's own marker for "this region never finished". The real
copy still exists in the response, but only inside `<script>` tags as data for
the browser to build the page from — 92% of the file. **A browser runs that.
A crawler reads HTML.**

### How I proved it was that and not something else

I did not assume it. I built temporary throwaway pages, one per section of the
homepage, and built the site for real each time. Each page renders exactly one
section and nothing else:

```
hero       words=75     <- no content at all
marquee    words=93
band       words=123
coverage   words=215
faq        words=756
```

Only the hero fails. Then, inside the hero, its two client-side pieces:

```
workbench     words=316   h1_count=1     <- fine
live-counter  words=75    h1_count=0     <- kills the page, and the <h1> above it
```

Then the smallest possible test — two pages identical except for one line, each
with a plain `<h1>` and one client component below it:

```tsx
// zz-probe-now      const [n] = useState(() => Math.floor(Date.now() / 1000));
// zz-probe-nonow    const [n] = useState(() => 12345);
```

```
now      words=75   h1_count=0
nonow    words=85   h1_count=1
```

**One clock reading is the entire difference between a page Google can read and
a page it cannot.** All of these throwaway pages were deleted before any commit.

**And it is why only the homepage was affected.** `LiveCounter` is rendered on
no other page. The footer's `new Date().getFullYear()` is exempt because it
sits inside a `'use cache'` function, which is handed a fixed timestamp — which
is why the footer's words are in the HTML on every page, including this one.
