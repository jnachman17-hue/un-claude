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

### The fix

One `<Suspense>` boundary around the counter, in
`app/(marketing)/_components/hero-section.tsx`:

```tsx
<Suspense fallback={<div className={'min-h-[150px]'} />}>
  <LiveCounter />
</Suspense>
```

That is the entire change. It stops the abandonment at the one component that
genuinely cannot be known ahead of time, so everything above and below it
prerenders into the HTML. **No copy changed, no component's logic changed, and
nothing was deleted.** The reasoning is written into the file at the boundary.

### After, same command, same build

```
index (/)        words=1234   h1=[If Claude wrote it, it’s marked.]
capabilities     words=638    h1=[What we do, exactly.]
how-it-works     words=1240   h1=[Where an AI watermark actually hides.]
pricing          words=1046   h1=[5 credits free. Packs from $4.99.]
```

**75 → 1,234 words, and the `<h1>` is there.** The homepage is now the second
longest page on the site by crawlable text, level with `/how-it-works`. The
two control pages are unchanged to the word, which is the check that this did
not disturb anything else.

The `<h1>` is the headline that was already at `hero-section.tsx:116`, exactly
as written. The governed claims are all in the served HTML — I grepped the
built file for each one rather than trusting the word count:

```
PRESENT  : 100% of detectable marks removed
PRESENT  : Every kind of watermark
PRESENT  : Free. No account needed.
PRESENT  : We sanitise every kind of AI watermark in seconds.
PRESENT  : The story, as covered by:
ABSENT   : Words cleaned with Un-Claude
```

**That last line is the cost and it is deliberate.** The counter is now the
only thing on the page the browser draws rather than the server, so its three
lines of text are not crawlable. Three lines out of 1,234 words, none of them
load-bearing for ranking, against 1,231 words that were invisible before.

**One thing for Jon.** The counter now fades in a beat after the page instead
of being there on arrival, which is the exact thing the note at
`live-counter.tsx:145` was written to avoid. The gap is reserved so nothing
jumps. Undoing it properly means seeding the counter from a constant and
reading the clock in its effect instead — a small change, but it changes
behaviour ratified in 04 entry 71, so it is Jon's call and not mine.

### Rendered and looked at

`docs/session-notes/homepage-visible-to-google/desktop.png` (1440 wide) and
`.../phone.png` (390 wide), captured from a real browser against the running
app.

Desktop: headline, promise line, authority strip, hairline, counter reading
2,961,487, tool on the right, all in place, no gap where the boundary is.
Phone: headline, one line, the tool — exactly what 04 entry 84 ruling 3
requires. The counter is `hidden lg:block`, so the new fallback height costs a
phone visitor nothing, which I checked rather than assumed.

### The workbench: what I confirmed and what I could not

**Confirmed.** The tool renders, mounts and is interactive at both widths. The
text box accepts input, "Try an example" loads the sample text into it, and
"Scan it" fires a real `POST /api/tool/scan`.

**Not confirmed, and this is a failure to report rather than hide: a scan does
not complete on this machine, and it did not before my change either.** The
request comes back `400` with `{"ok":false,"code":"unreachable"}` — the site
could not reach the engine, the separate program that does the actual work.

**The exact reason, and why I did not just start it.** `.env.local` points
`UC_ENGINE_URL` at `127.0.0.1:8765`, and nothing is listening there. The
runbook (`07`, "Exercising the paid route locally") gives the command to start
it. **I did not run it, deliberately.** The only engine running on this machine
right now is the freeze session's, on port 8780, mid-measurement:

```
Python 127.0.0.1:8780
... python3 apps/web/engine/server.py --port 8780
```

and the command that started it opens with `pkill -f "server.py --port 87"`.
**Starting a second engine in the 87xx range while that is running risks
killing or polluting another session's measurement run**, which is a worse
outcome than an unverified scan in a session that was told not to touch that
territory at all. So this is reported rather than resolved.

**I proved it is not mine.** I stashed my change, reloaded the unmodified page,
and ran the identical steps: the same `POST /api/tool/scan → 400` and the same
`"We could not reach the service."` Then I restored the change. The engine and
its API route are also outside this session's territory and a freeze session is
live in them, so this is reported, not touched.

**What that leaves.** A `<Suspense>` boundary around a sibling component cannot
change what an API route returns, and the stashed-vs-unstashed comparison is
the evidence for that. But **I did not watch text go in and clean text come
out**, and the brief asked for exactly that. Somebody with a working engine
connection should run it once before this deploys.

---

## Job 2 — `Organization` structured data

**Structured data is a small block of machine-readable facts inside the page,
in a format every search engine agrees on.** A visitor never sees it. It is how
Google learns that "Un-Claude" is the name of an organisation, that this address
is its website, and which image is its logo, instead of guessing all three.

### Before

The live homepage carried **zero** blocks of it:

```
=== LIVE homepage ld+json blocks ===
TOTAL BLOCKS: 0
```

### After

**Two blocks, not one.** The first is the one this job asked for:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Un-Claude",
  "url": "https://un-claude.com",
  "logo": "https://un-claude.com/images/favicon/android-chrome-512x512.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@un-claude.com"
  }
}
```

The logo is the 512-pixel icon that already exists and already answers `200`
as Googlebot — I checked before pointing at it, because Google wants a
fetchable image and not a promise of one:

```
/images/favicon/android-chrome-512x512.png     200 image/png
```

**Every field is a fact and none of them is a claim.** There is deliberately no
`description`. A description here would be a product claim sitting in a place
nobody would think to review, and `CLAUDE.md` section 7's test — which layer,
and is that provable? — cannot even be asked of a sentence hidden in a script
tag. Name, address, logo, support email. Nothing else.

### The second block was already written and Google never saw it

**A finding worth more than the block I added.** The FAQ section has been
emitting a full `FAQPage` structured-data block — all nine questions and
answers — for as long as it has existed. It never reached Google, for exactly
the reason in Job 1: it was inside the region that was being abandoned.

So the Job 1 fix restored structured data that was already written and paid
for. The homepage now serves both blocks.

### ★ This does not fix the grey box in search results

**Stated plainly because somebody will otherwise assume it does.** The grey box
is the favicon. The favicon is already correct and already reachable — I
confirmed both as Googlebot:

```
/images/favicon/favicon.ico     200 image/vnd.microsoft.icon
/icon.svg                       200 image/svg+xml
```

It is waiting on Google to recrawl the site, which is Google's schedule and not
ours. **Nothing in Job 2 changes it, and nobody should be told otherwise.**

---

## Job 3 — the web app manifest

**A web app manifest is the small file telling a phone what to call this site
and which icon to use if somebody adds it to their home screen.**

**It turned out to already exist and to already be correct.** The job was not
to write one — it was to link it. `public/images/favicon/site.webmanifest`
names the site and lists all four icons, and it has been served correctly the
whole time. Nothing pointed at it, and the two addresses a browser guesses at
both 404:

```
/manifest.json                              404
/site.webmanifest                           404
/images/favicon/site.webmanifest            200 application/manifest+json
```

So I added the link rather than a second copy of the file — two manifests that
can drift apart is a worse problem than an unconventional path, and browsers
follow the link rather than requiring a particular address. One line in
`lib/root-metdata.ts`, next to the `icons` block that learned the same lesson
in 04 entries 99 and 100: **a file being built and served is not the same thing
as a file being linked from `<head>`.**

After, on every page:

```
/                <link rel="manifest" href="/images/favicon/site.webmanifest"/>
/capabilities    <link rel="manifest" href="/images/favicon/site.webmanifest"/>
/pricing         <link rel="manifest" href="/images/favicon/site.webmanifest"/>
/mission         <link rel="manifest" href="/images/favicon/site.webmanifest"/>
/contact         <link rel="manifest" href="/images/favicon/site.webmanifest"/>
```

**One defect fixed inside the file.** It declared `"display"` twice —
`"fullscreen"` near the top and `"standalone"` at the bottom. A JSON parser
takes the last one, so `"standalone"` was already what applied; I deleted the
dead `"fullscreen"` line, which changes no behaviour and removes a line that
would mislead the next person to read it. The file still parses.

**One thing I left alone and am flagging instead.** The manifest sets
`"orientation": "portrait"`. That locks an installed copy to portrait, which
is a real choice and possibly the wrong one for a site people use on a laptop.
It only affects an installed home-screen copy, it is not an SEO matter, and
changing it is a behaviour decision rather than a piece of missing furniture.
**Jon's call.**

**A territory note, per `CLAUDE.md` section 2.** The brief's territory list
gives me `apps/web/app/(marketing)/**`, `apps/web/public/**` and
`apps/web/app/layout.tsx`. The manifest link belongs on every page, and the
only correct place for that is `lib/root-metdata.ts`, which the brief neither
grants nor forbids — its exclusions are `lib/server/**`, `app/api/**`,
`supabase/**` and `vercel.json`. I made the call to put it there rather than
duplicate it into the marketing layout, and I am naming it rather than
resolving it quietly. One line plus its comment; nothing else in that file was
touched.

---

## Job 4 — `/pricing`'s `<h1>` is not "5"

**No change made, because there is nothing wrong, and the brief's premise was a
measurement artefact rather than a defect.** Saying so is the job.

The `<h1>` served on `/pricing` is:

```html
<h1 class="...">5<!-- --> credits free. Packs from<!-- --> <span class="text-mark-strong">$4.99</span>.</h1>
```

Read as text, that is **"5 credits free. Packs from $4.99."** — a real heading
that names the offer.

**Why it was recorded as "5".** React writes `<!-- -->` between two adjacent
pieces of text so it can tell them apart again when it takes over in the
browser. Any extractor that stops at the first `<` after the opening tag —
which is what a simple one does — returns `5` and nothing else. The brief's
own `<h1>` table and mine disagree on this one line for that reason, and mine
strips the inner tags before reading:

```
brief:  /pricing    <h1> = "5"
mine:   /pricing    h1=[5 credits free. Packs from $4.99.]
```

**Google and screen readers both read the text, not the first node.** Neither
announces an HTML comment. A screen reader says the whole sentence.

**So nothing needed proposing to Jon and no copy was invented.** The other
`<h1>` values in the brief's table were all correct; this was the only one the
extractor mangled, because it is the only one whose heading begins with a bare
number followed by more text.

---

## The whole-site sweep, since the same bug could be anywhere

Every built page, word count from the production build:

```
PAGE                     WORDS
_global-error            18
_not-found               42
capabilities             638
contact                  136
cookie-policy            464
home                     15
how-it-works             1240
index (/)                1234
mission                  637
pricing                  1046
privacy-policy           2036
terms-of-service         1375
update-password          7
```

**No other page has it.** `/home` and `/update-password` are behind the login
and are genuinely per-visitor, so they are supposed to be short. `/contact` at
136 is a form and matches the live site exactly.

**One thing this sweep corrected in my own work.** I first wrote the runbook
check as "count `<!--$?-->`, any hit is the bug". **That is wrong and I have
fixed it there.** Pending boundaries are normal — most healthy pages here have
one, and after the fix `/` has three of them along with its 1,234 words. The
reliable signal is the word count collapsing to nav-plus-footer length, and a
missing `<h1>` on a page whose source has one.

---

## Where things stand

**Done and committed, four commits, nothing left uncommitted of mine.**

| Job | Outcome |
|---|---|
| 1. Homepage content in the HTML | **Fixed.** 75 → 1,234 words, `<h1>` present |
| 2. `Organization` structured data | **Added**, and a pre-existing `FAQPage` block was restored by Job 1 |
| 3. Web app manifest | **Linked.** The file already existed and was already correct |
| 4. `/pricing`'s `<h1>` | **Nothing wrong.** The "5" was a measurement artefact |

**Not done, and each has its reason above:** a scan was not driven end to end
(the freeze session's engine is mid-run on this machine); nothing is deployed,
so **un-claude.com still serves 75 words until somebody deploys**; and Google
recrawling is Google's schedule.

**Two things left for Jon, neither of them mine to decide.** Whether the
counter should be reseeded so it stops fading in (04 entry 71 behaviour), and
whether the manifest's `"orientation": "portrait"` is right for an installed
copy.

**`04-decision-log.md` and `06-assumptions-and-open-questions.md` were left
alone on purpose.** Both had another session's uncommitted edits in them for
this session's whole duration, and `07`'s own entry of 24 August says staging
by path does not protect a shared document. Everything that would have gone to
them is in this note and in the runbook entry, both of which are pure appends
to files nobody else was editing.
