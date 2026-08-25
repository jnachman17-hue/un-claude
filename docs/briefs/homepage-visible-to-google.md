# BRIEF — make the homepage visible to Google

**Written by the conductor, 24 August 2026. Paste this whole file into a fresh
session.**

**The problem in one line: un-claude.com's homepage serves Google a navigation
menu, one sentence and a footer, with no `<h1>` at all — so Google ranks
`/capabilities` above it for the brand name "un-claude".**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1 (Jon is not a programmer), 4 (a run, not
an assertion), 5 (stop and ask), 7 (what the site is allowed to say) and 8
(think like the visitor) all bite on this job.**

**The verification standard:** an assertion carries no weight. Run it and paste
the real output. **A step you skipped is a step that failed — say so.**

**The `unclaude-messaging` skill fires automatically on landing-page work and
governs every word a visitor reads. It outranks your judgment and is outranked
by the documents and by Jon.**

---

## 1. THE FACT, PROVEN — reproduce this before you change anything

Fetch each page as Googlebot, strip `<script>`, `<style>` and all tags, and
count the words that remain:

```
UA='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
curl -s -A "$UA" https://un-claude.com/ | <strip scripts and tags> | wc -w
```

```
/                 75 words        <- and NO <h1> in the served HTML
/capabilities    638 words
/how-it-works  1,240 words
```

**All 75 words on the homepage are the nav, one sentence, and the footer:**

> *"AI tools mark what they make, invisibly and without telling you. Un-Claude
> finds those marks and sanitises them."*

**Every `<h1>` in the site, served:**

```
/                *** NO H1 ***
/capabilities    "What we do, exactly."
/how-it-works    "Where an AI watermark actually hides."
/pricing         "5"                      <- see job 4
/mission         "Why I built this."
/contact         "Get in touch"
```

**And the homepage's real copy exists only as React flight data inside
`<script>` tags** — 127,139 of the page's 137,858 characters, 92%:

```
'...\"aria-hidden\":true}],\\"100% of detectable marks removed\\"]}],[\\"$\\",\\"li\\"...'
'...\"children\":\\"The story, as covered by:\\"}]]}],[\\"$\\",\\"div\\"...'
```

**Google ranks what it can read. On the homepage it can read a menu.**

## 2. WHAT THE CONDUCTOR ALREADY RULED OUT — do not re-tread these

- **It is not the favicon, robots.txt, the sitemap or the canonical.** All
  verified correct and reachable as Googlebot. `/sitemap.xml` lists 9 URLs with
  the homepage first; the canonical is self-referential; `robots.txt` is
  `Allow: /`.
- **It is not `app/(marketing)/loading.tsx`.** That boundary covers every
  marketing route, and `/capabilities`, `/how-it-works`, `/mission` and
  `/contact` all render their content and their `<h1>` into the HTML perfectly.
  **Only the homepage fails.**
- **It is not a missing `<h1>` in the source.** `hero-section.tsx:116` already
  renders one. **It never reaches the HTML.**
- **It is not a `'use client'` on the sections.** `hero-section.tsx`,
  `coverage-marquee.tsx`, `claude-band.tsx`, `coverage-section.tsx` and
  `faq-section.tsx` are all server components.
- **No SSR error appears in the production runtime log** in the recent window.

**The one thing that distinguishes the homepage from every page that works:
`HeroSection` imports `Workbench` and `LiveCounter`.** Every file under
`_components/workbench/` carries `'use client'`, and `live-counter.tsx` reaches
`window.matchMedia`. **That is a lead, not a conclusion. Diagnose it; do not
assume it.**

---

## 3. YOUR TERRITORY

**Yours:** `apps/web/app/(marketing)/**` · `apps/web/app/layout.tsx` (only if
structured data requires it) · `apps/web/public/**` ·
`docs/session-notes/homepage-visible-to-google.md` (create it).

**NOT yours:**
- **`apps/web/engine/**` and `engine/**` — A FREEZE SESSION IS LIVE IN THERE.
  Do not touch a single file under either path.**
- `apps/web/lib/server/**`, `apps/web/app/api/**`, `supabase/**`, `vercel.json`
- **`docs/IMPLEMENTATION-BOARD.md`, which only the conductor writes.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own separate step
  before every commit.** A previous session ran the file-list check every time
  and still swept another session's work into a commit, because staging by path
  says nothing about whose edits are already inside a file you staged. **Two
  other sessions are live in this tree.**
- **Do not push, deploy, or apply migrations.** Committing locally is yours.
- **No new dependencies** without asking Jon.

---

## 4. ★★ THE CONSTRAINT THAT MAKES THIS DELICATE

**The tool lives on the homepage, it works without an account, and it takes
real money.** `CLAUDE.md`: *"Built once, wrapped twice: a stranger gets
marketing underneath it, a signed in user gets their credit balance instead."*

**So the page is legitimately personalised**, and that is very likely why it is
being rendered the way it is. **The answer is almost certainly not "make the
whole page static".**

**The shape to aim for: the marketing content — headline, promise lines,
coverage table, FAQ — is server-rendered into the HTML, and only the genuinely
per-visitor parts (the credit chip, the account nav, anything reading a
session) sit behind their own small boundary.** Google needs the first; it does
not need the second.

**IF YOU BREAK THE TOOL, YOU HAVE FAILED THE JOB REGARDLESS OF THE SEO
RESULT.** Paste text, scan it, and confirm the workbench still works before you
call anything done.

---

## 5. JOB 1 — get the homepage's content into the served HTML

**Diagnose first, then fix.** Say what the cause actually was — that finding is
worth as much as the fix, because nobody knows it yet.

### Done looks like

1. **The before numbers, from your own run** — 75 words, no `<h1>`.
2. The fix.
3. **The after numbers, same command.** The homepage should serve content in the
   same order of magnitude as `/capabilities` (638 words), and **the `<h1>` must
   be present in the served HTML.**
4. **The headline is the `<h1>`.** It already exists at `hero-section.tsx:116`:
   *"If Claude wrote it, it's marked."* **Use the copy that is there.**
5. **The workbench still works.** Paste text, scan, confirm. Say that you did.
6. **Rendered and looked at, desktop and phone width** (`CLAUDE.md` section 8).
   Screenshots in the note.

### ★ DO NOT WRITE NEW COPY

**Every claim on this page is governed.** *"100% of detectable marks removed"*
is a settled ruling (`04` 134–135) and **must come across byte for byte.** The
hero headline is the product of a long argument recorded in the component's own
comments — **read them before you touch it.**

**Your job is to make existing words visible to a crawler, not to write
different ones.** If you believe a word must change, **stop and ask Jon.**

---

## 6. JOB 2 — `Organization` structured data with the logo

**There is none anywhere on the site.** Add JSON-LD `Organization` on the
homepage: name, url, and `logo` pointing at a real, reachable image.

**Be accurate and claim nothing.** This is factual markup — name, URL, logo,
and the support address `support@un-claude.com` if you include contact details.
**No description that makes a product claim**, because structured data is copy
and section 7 governs it.

**State plainly in your note that this does NOT fix the grey box in search
results.** That is the favicon, it is already correct, and it is waiting on
Google to recrawl. **Do not let anyone believe otherwise.**

## 7. JOB 3 — a web app manifest

`/manifest.json` and `/site.webmanifest` both **404** today. Add one, referenced
from the head, pointing at the icons that already exist under
`/images/favicon/`. Small job, correct furniture.

## 8. JOB 4 — `/pricing`'s `<h1>` is the character "5"

```
/pricing    <h1> = "5"
```

Almost certainly a price number rendered as the first heading. **A page's `<h1>`
is what Google shows and what a screen reader announces first.** Give it a real
heading — **but the words are copy, so if nothing suitable already exists on the
page, propose wording to Jon rather than inventing it.**

---

## 9. WHAT TO HAND BACK

`docs/session-notes/homepage-visible-to-google.md`, **written as you go, not at
the end.** It must contain:

- **The before and after word counts and `<h1>` state, from real runs**, for the
  homepage and at least two other pages as controls
- **What the cause actually was** — the most valuable thing in the note
- Screenshots at desktop and phone width
- Confirmation the workbench still works, and how you confirmed it
- **A section titled "What I could not prove"** — the best notes here lead with
  it. If you could not verify the rendered output against a production-like
  build, say so plainly rather than measuring a dev server and calling it done

Commit locally by explicit path as you go. **Leave nothing uncommitted.** Do not
push.

## 10. MODEL AND EFFORT

**Opus, high reasoning effort.** The page is live, it takes money, and the
failure mode is breaking a working tool in pursuit of a crawler.
