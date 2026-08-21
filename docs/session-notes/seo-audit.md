# SEO audit — 21 August 2026

Read-only. Nothing in the application was changed to produce this. Every
finding below was checked against the **live site** (`curl`/`WebFetch`
against `un-claude.com` and `www.un-claude.com`, run during this session,
output pasted in) or against the actual source file that produces it — not
inferred from what the code is supposed to do. Where I could not verify
something live (Vercel dashboard settings, Google Search Console), I say so
and mark it as a manual step rather than a finding.

Parked as its own task by Jon on 19 August 2026 ("SEO is parked... maybe
that's a later task"). This is that task. `docs/06-assumptions-and-open-
questions.md`, closing note under "SEO is parked as its own task."

**Read first, because it decides several findings below:** `robots.txt` and
the sitemap both already exist and are both correct. The real gaps are
elsewhere — the story that a visitor's browser tab and a search result
actually tell, and the coherence between the two addresses the site answers
to.

---

## What "SEO" means here, in plain terms

A search engine like Google sends a program (a "crawler") to read your
pages, decides what each page is about, and decides which single address is
the "real" one when the same content is reachable more than one way. Three
files do most of the talking to that crawler:

- **`robots.txt`** — a plain-text file at `/robots.txt` telling crawlers
  what they may read.
- **The sitemap** — a list of every real page's address, so the crawler
  does not have to guess your site's shape.
- **The `<title>` tag and meta description** — text that never appears on
  the page itself, only in the search result and the browser tab. It is
  the thing a stranger reads before they ever see your site.

A **canonical URL** is a page's way of saying "if you ever see this content
at more than one address, this is the one address to credit." Without one,
two addresses serving the same content can compete with each other in
search instead of one of them ranking.

---

## 1. There is no canonical tag anywhere on the site — confirmed live

**What it is.** Every page on `un-claude.com` should carry a `<link
rel="canonical" href="...">` tag in its `<head>`, naming itself as the one
true address for that content. None do.

**Proof — the complete list of every `<link>` tag the live homepage
actually sends**, pulled from the real HTML on 21 August 2026:

```
$ curl -s "https://un-claude.com/" | grep -oE '<link rel="[^"]*"[^>]*>' | sort -u

<link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png"/>
<link rel="icon" href="/icon.svg"/>
<link rel="mask-icon" href="/images/favicon/safari-pinned-tab.svg" color="#c45e3d"/>
<link rel="preload" ...>  (font/script preloads, several)
<link rel="shortcut icon" href="/images/favicon/favicon.ico"/>
<link rel="stylesheet" ...>  (two, both build output)
```

No `rel="canonical"` line. And in the source, `apps/web/lib/root-
metdata.ts`, the metadata object Next.js builds from has no `alternates`
key — canonical is a field Next.js supports and this file simply never sets
it, on any page, including the per-page `metadata` exports in `how-it-
works/page.tsx`, `pricing/page.tsx`, and the rest.

**How bad.** This is the item that turns finding 2 below from a curiosity
into a real risk. Without a canonical tag, there is nothing telling Google
which of `un-claude.com` and `www.un-claude.com` is the one to index. Right
now that is being decided by Google's own algorithm rather than by the
site — and Google's public guidance names redirects as the strongest signal
it uses to decide, sitemap entries as a much weaker one. This site has a
sitemap that only lists the apex address, and no redirect at all between
the two hosts (finding 2). That is a mixed, weak signal, not a clear one.

**Fix.** Add `alternates: { canonical: <page url> }` to
`generateRootMetadata` in `apps/web/lib/root-metdata.ts` so every page
declares itself, using `NEXT_PUBLIC_SITE_URL` (already `https://un-
claude.com`, the apex) as the base. This is a small, mechanical change and
is the standard fix cited by every current SEO source I checked.

---

## 2. `www.un-claude.com` and `un-claude.com` are two live, separately
   cached copies of the same site — confirmed live, and this is the
   canonical-story question the task asked about directly

**What it is.** Both addresses currently return the real site — not one
redirecting to the other.

**Proof**, from `curl -D -` (headers only) run against both, same minute:

```
=== https://un-claude.com/ ===
HTTP/2 200
age: 7327
x-vercel-cache: HIT

=== https://www.un-claude.com/ ===
HTTP/2 200
age: 0
x-vercel-cache: PRERENDER
```

Both `200`. Different `age` and different `x-vercel-cache` values means
Vercel is treating these as two distinct cached objects, not one page with
two names — which is exactly what "two separate copies" means at the
infrastructure level, not just in theory.

The plain-HTTP (non-encrypted) versions of each DO redirect, but only to
their own `https` self, never across to the other host:

```
$ curl -D - http://un-claude.com/
HTTP/1.0 308 Permanent Redirect → Location: https://un-claude.com/

$ curl -D - http://www.un-claude.com/
HTTP/1.0 308 Permanent Redirect → Location: https://www.un-claude.com/
```

So there is a redirect *rule* in place (upgrading `http` to `https`), it is
simply scoped per-host instead of consolidating the two hosts into one.

**How bad.** This is a real, checkable duplicate-content condition, not a
theoretical one. Search engines that index both addresses can split
authority between them instead of concentrating it on one, and — per the
research pulled for this audit — the newer AI answer engines (ChatGPT,
Perplexity, Google AI Overviews) have the same problem: two addresses for
one brand reads as ambiguity about which one to cite. The site's own
metadata already treats the apex as canonical in spirit — `NEXT_PUBLIC_SITE_
URL`, the Open Graph `og:url`, and the sitemap all say `https://un-
claude.com` — the `www` host is just never told to defer to it.

**Fix, in order of strength (per Google's own guidance, strongest first):**
1. **A redirect**, `www.un-claude.com` → `un-claude.com`, 308/permanent.
   This is normally set in Vercel's own dashboard under the project's
   Domains settings ("redirect to" on the `www` domain entry), not in
   application code — `next.config.mjs` and `vercel.json` here have no
   redirect rules, and a `redirects()` entry in `next.config.mjs` would not
   even fire for a cross-domain redirect on Vercel; the domain-level
   setting is the correct place. **This needs a person with dashboard
   access — I can't confirm or set it from source, and I did not find
   evidence either way of what the Domains panel is currently set to.**
2. **The canonical tag from finding 1**, once added, as a second signal
   agreeing with the redirect.
3. Set the preferred domain in Google Search Console once one exists (see
   finding 6).

Do all three. None of them alone is airtight; together they are.

---

## 3. Every page except the homepage loses the brand name from its own
   browser tab and search result — confirmed live on all eight subpages

**What it is.** A page's `<title>` is what shows as the blue link in a
search result and the text on a browser tab. The homepage's is right:

```
<title>Un-Claude · AI Watermark Remover</title>
```

Every other page on the site drops the brand entirely. Live, right now:

```
/how-it-works       <title>How it works</title>
/capabilities        <title>What we can do</title>
/pricing              <title>Pricing</title>
/mission              <title>Our mission</title>
/contact              <title>Contact</title>
/privacy-policy       <title>Privacy Policy</title>
/terms-of-service     <title>Terms of Service</title>
/cookie-policy        <title>Cookie Policy</title>
```

**Why.** Next.js lets a parent layout declare a title *template*, e.g.
`"%s · Un-Claude"`, so a child page setting `title: 'Pricing'` actually
renders `Pricing · Un-Claude`. `apps/web/lib/root-metdata.ts` sets `title:
appConfig.title` as a bare string instead of a template object, so every
child page's own `title:` line **replaces** the root title completely
rather than extending it. This is a one-file, structural cause, not eight
separate mistakes.

**How bad.** A stranger who has six tabs open, or who sees `Pricing` alone
in a search result with no company name attached, has no way to place
what they're looking at. It also throws away free keyword and brand real
estate in every search result except the homepage's — worth more here than
most sites, given the competitive picture below.

**Fix.** In `apps/web/lib/root-metdata.ts`, change the `title` field to:
```ts
title: {
  default: appConfig.title,
  template: `%s · ${appConfig.name}`,
},
```
`appConfig.name` already resolves to `"Un-Claude"`. This one change fixes
all eight pages at once; no per-page file needs editing.

---

## 4. Three meta descriptions are already over the length a search result
   will actually show — measured against the real strings in the code

**What it is.** The description meta tag is the two-line summary under
the blue link in a Google result. Past roughly 155–160 characters on
desktop (often less on mobile), Google truncates it with an ellipsis,
usually mid-word, and sometimes replaces it with its own extracted snippet
instead — so a carefully written description stops being the thing a
stranger reads.

**Proof — the real strings, measured:**

| Page | Characters | Verdict |
|---|---:|---|
| `/` (home) | 162 | over the safe limit |
| `/how-it-works` | 181 | over the safe limit |
| `/capabilities` | 171 | over the safe limit |
| `/pricing` | 158 | inside the safe range |
| `/mission` | 136 | inside the safe range |
| `/contact` | 109 | short, but fine |
| `/privacy-policy` | — | **no description at all**, see finding 5 |
| `/terms-of-service` | — | **no description at all** |
| `/cookie-policy` | — | **no description at all** |

The homepage's, for example, quoted in full from `apps/web/.env` and
matching what `curl` actually returns:

> "Scan text and files free for hidden AI watermarks: invisible characters,
> C2PA metadata and the statistical mark in the words themselves. Sanitise
> them in seconds." — **162 characters**

**How bad.** Moderate. The page still ranks; it just may not control what
a stranger reads about it in the result, which matters more here than on
a typical site because the whole product depends on a stranger correctly
understanding, before they click, which of the three watermark layers
applies to them (`CLAUDE.md`'s own central rule: never let a claim about
one layer read as though it covers all three — that rule applies to search
snippets too, and an auto-truncated or Google-rewritten description is no
longer a sentence anyone here wrote or approved).

**Fix.** Trim the three long ones to under 160 characters, ideally nearer
150 to survive mobile too. This is copy work, not code work — flagging it
here rather than rewriting it, since `CLAUDE.md` section 7 puts wording
changes through the messaging skill, not through an audit session.

---

## 5. The three legal pages have a title and nothing else

**What it is.** `privacy-policy`, `terms-of-service`, and `cookie-policy`
each set only a `title` in their `generateMetadata()`, no `description`:

```ts
// apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx
export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('marketing.privacyPolicy') };
}
```

Same shape in the other two files.

**How bad.** Low. Legal pages are rarely a real search-entry point and
Google will simply generate its own snippet from the page text, which is
an acceptable outcome here — a privacy policy summarized by whatever
Google extracts is not a trust problem the way a product page would be.
Noting it for completeness rather than urgency.

**Fix, low priority.** Add a one-line `description` to each, matching the
pattern the other pages already use.

---

## 6. `/dev/credits` is a live, public, indexable page — and the
   documentation's claim that this kind of page is protected does not
   hold for it

**What it is.** `apps/web/app/dev/credits/page.tsx` exists in production
right now, at `https://un-claude.com/dev/credits`.

**Proof:**

```
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" https://un-claude.com/dev/credits
HTTP 200

$ curl -s -D - https://un-claude.com/dev/credits | grep -i robots
(no output — no x-robots-tag header)

$ curl -s https://un-claude.com/dev/credits | grep -io noindex
(no output — no noindex meta tag either)
```

And `robots.txt`, confirmed live from both hosts, is a blanket allow with
no exclusion for `/dev`:

```
User-Agent: *
Allow: /
Sitemap: https://un-claude.com/sitemap.xml
```

**Why this matters for SEO specifically, separate from the security
question a sibling audit is covering:** `docs/06-assumptions-and-open-
questions.md` row 76 describes this class of page as "Live, `noindex`,
unlisted" and reasons about it on that basis. That description does not
match the current, live behaviour — there is no `noindex` anywhere,
meaning it can be crawled, indexed, and surfaced in search results next to
the real product pages. A stranger searching the site (`site:un-
claude.com`) or simply landing on it from a crawl would see a half-built
internal page rather than the product. It is currently inert in
production (it renders one static sentence outside of a development
build), so this is a discoverability and polish problem, not a data leak
— but it is exactly the kind of page a launch checklist should keep out of
the index on principle.

**Fix.** Either add `export const metadata = { robots: { index: false,
follow: false } }` to the page, or add a `Disallow: /dev` line to
`apps/web/app/robots.ts`. The metadata approach is more robust — it stops
indexing even if something later links to the page — and costs one line.

---

## 7. What's already right, so it doesn't get re-litigated later

- **`robots.txt` is correct and consistent.** Identical, valid content
  served from both hosts, permissive by design (the tool itself is meant
  to be crawled and found), and correctly points at the sitemap.
- **The sitemap is correct.** Live-fetched and checked line by line: it
  lists the homepage and all eight real marketing pages at their proper
  apex URLs, with no `www` duplicates and no internal/auth/dev routes
  leaking in. `apps/web/app/sitemap.xml/route.ts` builds it from a
  hand-maintained path list rather than a filesystem crawl, which is the
  right call for a small, deliberate site like this one.
- **The FAQ section carries real `FAQPage` structured data**
  (`app/(marketing)/_components/faq-section.tsx`), correctly formed
  `@context`/`@type`/`Question`/`Answer` JSON-LD. This is exactly the kind
  of markup that earns a rich result (an expandable Q&A block directly in
  Google's results) and it's already done right — nothing to fix.
- **No deployment wall is blocking crawlers.** Checked for a Vercel
  authentication/SSO redirect on the production URL; the homepage serves a
  clean `200` with real content, so nothing is stopping Google (or anyone
  else) from reading the live site today.
- **The single H1 per page is respected everywhere checked** — hero,
  legal pages, `how-it-works`, `capabilities`, `mission`, `contact`, and
  `pricing` each render exactly one `<h1>`, no duplicates found.
- **Only one locale (`en`) is configured**, so there is no `hreflang`
  requirement outstanding — worth stating so nobody adds hreflang tags
  looking for a problem that isn't there yet.
- **The Open Graph share image is properly built**: 1200×630, real
  `image/png`, generated from the live headline rather than a static
  asset that could drift out of date. It is identical across every page
  (`app/opengraph-image.tsx` is a single root-level file with no
  per-page override) — worth a page-specific image for `/pricing` and
  `/how-it-works` eventually, but this is a nice-to-have, not a defect.

---

## 8. What the competitive search landscape actually looks like, checked
   live rather than assumed

Searched `"remove claude watermark"` and `"claude ai watermark"` on
21 August 2026. Real, currently-ranking pages, quoted by title:

- [How to Remove Claude Watermarks From Content You Own](https://haimaker.ai/blog/claude-watermark-removal-guide/) — haimaker.ai
- [Claude Watermark Remover | Strip Claude AI Watermarks](https://www.stealthgpt.ai/use-cases/claude-watermark-remover) — StealthGPT
- [Claude Watermark Remover and Checker | Remove AI Text Watermarks](https://www.claudewatermark.com/)
- [Remove Claude Watermarks - Clean Invisible Unicode from Claude Text](https://gpt-watermark-remover.com/remove-claude-watermarks)
- [People Are Rushing to Find Ways to Remove Claude's AI Text Watermark](https://gizmodo.com/people-are-rushing-to-find-ways-to-remove-claudes-ai-text-watermark-2000800433) — Gizmodo, press coverage of the demand itself

A second search on general 2026 SEO practice reported the term "AI
watermark remover" up roughly 60% week over week in search interest at
time of writing (source: [ALM Corp's 2026 SEO practices roundup](https://almcorp.com/blog/seo-best-practices-complete-guide-2026/), citing third-party search-trend data — noted as a claim from that source,
not independently re-verified against a trends tool in this session).

**What this means for the findings above.** The demand exists and rivals
are already titling their pages explicitly around "Claude watermark
remover." This site's homepage title already competes reasonably —
`Un-Claude · AI Watermark Remover`. But finding 3 means every other page
on the site currently searches worse than it should: `/how-it-works`
titled just `How it works` cannot compete for "how does Claude's
watermark work" or similar informational searches the way a title
containing those actual words would. Fixing finding 3 is not just a
branding fix — it's the difference between eight pages that can rank for
this topic and one page that can.

**Sources:**
- [HTML Tags for SEO: The Ultimate 2026 Technical Guide](https://www.clickrank.ai/html-tags-for-seo/)
- [The Ultimate On-Page SEO Checklist for 2026](https://www.webfactoryltd.com/blog/the-ultimate-on-page-seo-checklist-for-2026/)
- [47 SEO Best Practices That Drive Results in 2026](https://almcorp.com/blog/seo-best-practices-complete-guide-2026/)
- [Non Canonical URL Guide for 2026](https://www.riffanalytics.ai/blog/non-canonical-url)
- [Google Search Central: What is URL Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
- [Google Search Central: How to Specify a Canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [claudewatermark.com](https://www.claudewatermark.com/)
- [StealthGPT: Claude Watermark Remover](https://www.stealthgpt.ai/use-cases/claude-watermark-remover)

---

## 9. Not checked, and why — manual steps for Jon, not code findings

- **Which host is set as primary in Vercel's Domains panel, and whether a
  www→apex redirect is already configured there.** This lives in the
  Vercel dashboard, not in source, and I have read-only filesystem access
  only. Check `vercel.com` → the project → Domains, for both
  `un-claude.com` and `www.un-claude.com`.
- **Google Search Console** — whether the property exists yet, which
  domain (if either) is verified, and whether either host has already
  been partially indexed under the current no-redirect setup. If the site
  has had any traffic or crawl activity before today, checking Search
  Console for an existing "Duplicate, Google chose different canonical
  than user" warning would confirm whether finding 2 has already started
  causing the exact problem described, rather than being only a risk.
- **Structured data beyond FAQPage** — a `SoftwareApplication` or
  `Organization` schema on the homepage would be a reasonable next step
  once the fixes above are in, but is additive rather than a defect, so
  it's named here as a suggestion, not a finding.

---

## Priority list, before launch

1. **Fix 2 (www/apex split)** — needs a Vercel dashboard change, the one
   item here that isn't a code edit. Do this first; the other fixes are
   partly there to reinforce it.
2. **Fix 1 (canonical tag)** — one field, one file, applies everywhere.
3. **Fix 3 (title template)** — one field, one file, applies everywhere.
4. **Fix 6 (`/dev/credits` noindex)** — one line, before launch on
   principle even though it's inert today.
5. **Fix 4 (trim three descriptions)** — copy work, low effort, do
   whenever the messaging skill is next in a session for this page set.
6. **Fix 5 (legal page descriptions)** — lowest priority, cosmetic.
