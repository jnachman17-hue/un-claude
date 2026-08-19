# un-claude: Current Handoff

**Date:** 19 August 2026, end of session 4
**Status:** **The engine is finished and live on `un-claude.com`. The site does not
exist.** Your job is the site.

**This file holds resumption context only.** It is rewritten wholesale every
session. Durable things live in `04-decision-log.md`,
`06-assumptions-and-open-questions.md`, `07-runbook.md`, `01-build-spec.md`, and
`apps/web/engine/ENGINE.md`.

---

## 0. Session 5 built the site. What is done and what Jon still wants

**Live and verified:** the landing page is the tool. Scan, sanitise, layer B
rewrite, receipts, file upload with provenance removal, and a paywall that fires
without calling the engine. Four pages: landing, how it works, capabilities, and a
mission page waiting for Jon's words. The engine is locked behind `UC_ENGINE_KEY`.

**`UC_ENGINE_KEY` is still not set on Vercel, so the production engine refuses
every request.** That is the fail-closed guard working. Jon has the key.

**A severe engine bug was found and fixed:** every rewrite under about 350 words
crashed, which is nearly every paste a visitor makes. `06` row 42.

**Jon's review notes are in `06`, at the end.** The struck ones are done. Still
open: the findings panel needs to be readable in five seconds, the key diagram
needs to be more digestible, a sourced readership figure for the marquee, and real
publication logo files, which need his approval under `06` row 34.

---

## 0a. Open before launch, carried from session 6

**One item is parked and must not reach launch unnoticed.** Google sign in works,
but Google's consent screen names our Supabase address, `itdgggoxsoolbfiwujvt.supabase.co`,
where it should name the product. **Jon saw it, said he does not like it, and
ruled ship anyway for now.**

**It is not fixed by making a logo, and reaching for one is the trap.** The fix is
Supabase's custom domain add-on, $10 a month, which moves the callback to
`auth.un-claude.com`. Reasoning in `04` entry 45, and the row that owns it is
**`06` row 41, trigger: before deployment.**

---

## 0. Read these before doing anything

| Order | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` | The rules. Jon is not a programmer, he cannot review code, and an assertion that something works carries no weight |
| 2 | This file | |
| 3 | **`apps/web/engine/ENGINE.md` section 2** | **What each layer actually does and what it must never claim.** You cannot write a word of copy without it |
| 4 | `apps/web/engine/API.md` | How to call the engine |
| 5 | `docs/04-decision-log.md` entries **20, 27, 33, 34, 35** | The design direction, the marquee, and what layer A may claim |
| 6 | `docs/06-assumptions-and-open-questions.md` rows **23, 27, 30 to 36** | Everything parked for you |
| 7 | `apps/web/AGENTS.md` | **Before writing any Next.js code.** This version differs from what a model remembers |

---

## 1. What exists

**The engine, finished and verified live.** Two endpoints on `un-claude.com`:

| Call | What it does | Time | Cost |
|---|---|---|---|
| `POST /api/scan` | Says what is hidden, with **exact character positions** | ~40ms | **Free** |
| `POST /api/clean` | Removes it | ~40ms | **Free** |
| `POST /api/clean` with `{"options":{"layer_b":true}}` | Also rewrites the text | 6s at 500 words, 22s at 5,000 | ~0.06 cents per 1,000 words |

**Proven live:** five documents from 1,260 to 5,047 words, every number intact, 94
to 100% of length preserved.

**The site: nothing.** `un-claude.com` still serves the starter kit's stock
marketing page, headline "Ship a SaaS faster than ever", hardcoded in
`apps/web/app/(marketing)/page.tsx`. **No environment variable touches it.**

---

## 2. What you are building

**The landing page IS the product.** `04` entry 20, in Jon's words:

> Every tool in this category lets you paste text and see a result before signing
> up, then gates it. QuillBot, GPTZero, Grammarly all work this way. The tool is
> the landing page. You arrive, there is a box, you try it, and you hit a limit
> that asks you to register.

**Built once, wrapped twice.** Identical tool signed in or out. A stranger gets
marketing underneath and a signup prompt at the limit; a signed-in user gets their
credit balance instead. **No separate application behind the login.**

**Jon's own framing of the funnel:** `/api/scan` is the free hook, `/api/clean` is
the conversion event. **Paste, see your own text with every hidden character
marked exactly where it sits, then press the button that removes them.**

---

## 3. The design direction, already given

`04` entry 33. **Do not ask for this again, he has answered it.**

| Question | Ruling |
|---|---|
| Light or dark | **Light** |
| Feel | **Serious, with some visuals.** Not bare |
| Structure | **What it does explained up top, tool immediately usable beside it, both above the fold** |

**His references, in his own words.**

- **`gptzero.me`, the structural reference.** Explains what it does up top with
  stats, tool on the right usable immediately, light.
- **`humanizeai.pro`, the cleanliness reference.** **His criticism: a tad too
  simple, not enough colour, visuals, icons or animation.** The floor for
  tidiness, not the target for richness.
- **`deepai.org`, rejected.** Too techy, too dark.
- **`rareui.com`, for components.** Look here before inventing one.

**Layout from GPTZero, tidiness from humanizeai.pro, more visual interest than
humanizeai.pro has, nothing from deepai.org.** He has said more theme references
will follow.

**One thing GPTZero does that we cannot copy:** credibility statistics at the top.
**We have none, because nobody has used this yet.**

---

## 4. The publication marquee, ruled in

`04` entry 34. An infinite loop strip of publication logos **below the tool**, each
**linking to that outlet's own article about the Anthropic watermark**, caption top
left. Minimal text. **Jon finds the articles.**

**The rule that keeps it honest is operational, not an argument: a logo goes in
only if it links to a real article from that outlet about the watermark. No
article, no logo.**

**The caption is not optional.** It must make clear the strip is about the
watermark story and **not about un-claude**. Publication logos below our own tool,
unlabelled, read as "as seen in", which would be false. **Nobody has covered
un-claude.**

**Recommended caption, put to Jon and not yet answered:**

> AI tools now mark what they make. Invisibly, and without telling you.
> The story, as covered by:

**This is the one piece of copy not blocked by `06` row 23**, because it makes no
claim about what un-claude does.

**A correction to Jon's premise, so the roster is not built on it.** He believed
basically every major publication covered it. **Found:** TechCrunch, Forbes,
Fortune, Euronews, Global News, BleepingComputer, Search Engine Land, Interesting
Engineering. **Not found:** New York Times, Wall Street Journal, BBC, Guardian,
Washington Post, Reuters, WIRED, Ars Technica, The Verge.

**Two craft points**, both from GPTZero's own implementation which handles this
correctly: **the loop pauses on hover** so a logo can be clicked, and it must
respect the reduced-motion setting.

**Logo files need Jon's approval before they arrive.** `06` row 34.

---

## 5. What you may and may not claim. Read this twice

**This is the part where a careless sentence makes the product dishonest.**

**Layer A does NOT remove Claude's or Gemini's watermark.** Anthropic states
directly that no hidden characters are added to its text. **Layer A removes a
real, present tell that catches people today** (a documented ChatGPT quirk
emitting narrow no-break spaces, which **OpenAI denied was deliberate**), **but it
is not a watermark and the site must not call it one.** `04` entry 35.

**The strongest provable claim in the product is the file side.** Every major
hosted provider except Grok and Midjourney marks generated files with C2PA, they
have converged on one standard, and **that standard is removable by design.** Full
table in `ENGINE.md` section 2.

**Layer B cannot be verified by anyone, including us.** No public detector exists.
Every response carries `verified: false` and a note saying so. **Presenting layer B
with the confidence of the other two layers is the fastest way to make this
product dishonest**, and Jon has ruled that users are never misdirected.

**Do not claim Office documents yet.** The proof used a test fixture, not a real
AI-produced document. `06` row 31.

**`06` row 23, what the site claims overall, is still formally open and Jon has not
ruled on it. Put it to him before writing a headline.**

---

## 6. The results panel: Jon's design, and it is not a toss-up

`06` row 27. **Track B proposed showing statistics of what was removed. Jon
rejected that** and specified the alternative himself.

**Show everything scanned for, every time.** A fixed list of checks, each line
resolving to a tick or a cross, with anything found highlighted as removed.

**His reasoning, which anyone reopening this must answer first: a removals-only
panel creates a false success condition.** There are many correct cases with
nothing to show. **Layer B leaves no visible trace at all**, so the one layer that
costs money per run would display nothing every time. And a user may paste text
that was never AI generated, where finding nothing is the right answer. **In both,
a working product looks broken.**

**The engine returns `figures_to_check` and it is currently unused.** It lists any
number the rewrite could not prove survived. **Usually empty.** When it is not, it
belongs on that panel, because a rewrite quietly altering a figure is the failure
that actually harms somebody.

---

## 7. Run it

```bash
cd ~/un-claude && pnpm dev
```

**A local production build fails on a placeholder site URL and it is not your
change.** See `07-runbook.md`. To build locally:

```bash
cd ~/un-claude/apps/web && NEXT_PUBLIC_SITE_URL=https://un-claude.com pnpm run build
```

**You cannot sign in locally.** Supabase needs email confirmation and Docker is
not installed. `06` row 11.

---

## 8. Things that will bite you

**Never write invisible characters into a file through a shell command.** They get
destroyed silently and it looks like a broken detector. Build them from code
numbers. **This caught the last session twice in ten minutes and the whole product
is about invisible characters.**

**In this project the harness is usually the defect, not the thing being tested.**
Eight measurement errors in one session. `07-runbook.md` has the list.

**Check deployments actually succeeded.** `npx vercel@latest ls | head -3` and look
for `Ready`. **A site returning HTTP 200 proves a server is alive, not that your
code is on it.** Fourteen consecutive deployments failed while the site answered
normally.

**Stage by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.**

**Pushing to GitHub is fine. Publishing anything under Jon's name needs his word.**

---

## 9. What is NOT your job

- **Pricing.** Undecided, its own session, real cost numbers now exist. `06` row 18
- **Billing.** `06` row 10
- **Usage recording.** The engine already does it, every response carries it
- **The engine.** It is finished. If it is wrong, report it rather than editing it

---

## 10. Sessions so far

**Session 1, 17 Aug.** Repository, `CLAUDE.md`, the documentation system.

**Session 2, 17 Aug.** Diagnosed that no session had reached the configured model.

**Session 3, 18 Aug.** MakerKit Lite, Supabase, deployed to `un-claude.com`, built
a humanizer against a mocked engine.

**Session 4, 18 to 19 Aug. The long one.** Rescoped from humanizer to watermark
remover. Vendored and proved the engine. Built and validated our own layer B
prompt against the upstream one across five models. Deployed all three layers
live. Found and fixed silent truncation on long documents. Ran a nine-agent
investigation into how the watermark actually works. **Eighteen decisions, entries
18 to 35.** Also found that the site had not deployed successfully in over three
hours while appearing healthy.
