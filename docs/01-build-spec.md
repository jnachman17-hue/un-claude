# un-claude: Build Specification

What exists, how the pieces fit, and the contract between the interface and the
engine.

**Rewritten 18 August 2026, session 4,** when the project was rescoped from an AI
text humanizer to an AI watermark remover. `04` entries 18 to 24.

**This describes what is actually built and verified,** not what is planned.
Anything unbuilt is in section 7 or in `06-assumptions-and-open-questions.md`.

---

## 1. The product, in one paragraph

A user pastes text or uploads a file. The tool finds the marks that identify it
as AI generated and removes them, then shows exactly what it found. **The tool
sits on the public landing page and works without an account.** A visitor hits a
free limit and is asked to register. There is no separate application behind the
login: the same tool is built once and wrapped twice, with marketing underneath
it for a stranger and a credit balance for a signed in user. `04` entry 20.

---

## 2. The three layers

**This table is the product.** Everything else in this document follows from it.

| Layer | What it removes | Where the mark hides | Pasted text | Files | Provable | Costs money to run |
|---|---|---|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction marks, tag characters | Inside the text itself, between the visible words | **Yes** | Yes | **Yes** | **No** |
| **Metadata** | C2PA provenance blocks, EXIF, XMP, generator and producer tags | Inside the file's wrapper, alongside the content rather than in it | **No** | **Yes** | **Yes** | Almost nothing |
| **B. Statistical watermark** | Patterns in which words the model chose, removed by rewriting | In the word choices themselves | **Yes** | Yes | **No. Best effort** | **Yes, every run** |

**Paste text and you get A and B. Upload a file and you get all three.**

**Why metadata cannot work on pasted text.** Metadata lives in a file's wrapper,
which is the part of a file that describes the file rather than being its
content: who made it, with what tool, when. Pasted text has no wrapper. There is
nothing there to strip. **This was got wrong once in session 4 and corrected by
Jon**, and it is stated at length here because the mistake is easy to repeat.

**Layer B is presented as best effort everywhere it appears.** In the interface,
in marketing, and to users. `04` entry 23. **Presenting it with the confidence of
the other two layers is the single easiest way to make this product dishonest.**

---

## 2a. What the layers do NOT do, from Anthropic's own documentation

**Source.** `docs/anthropic-watermarking-context.md`, added by Jon 18 August 2026.
It is a technical primer on Anthropic's watermarking, compiled 17 August 2026,
which tags every claim by confidence. The items below are the ones tagged
`[ANTHROPIC]`, meaning stated directly by Anthropic in a primary source, and they
constrain what this product may honestly claim.

### Layer A does nothing against Claude's text watermark

**Anthropic states directly that no hidden characters are added.** No zero width
spaces, no homoglyphs, no Unicode tags, no steganographic insertion of any kind.
The text watermark lives in **which words the model chose**, not in anything
inserted between them.

**So invisible character stripping and Claude's watermark are unrelated
problems.** The primer says so explicitly about this exact category of tool.

**Layer A is still worth building and still works.** It removes marks that other
sources leave: other AI tools, copy and paste from web pages, editors, and export
pipelines. Those characters are real, they are common, and finding them is
provable. **What layer A must never claim is that it removes Claude's
watermark**, because it does not and Anthropic has published the reason.

### A rewrite performed by Claude re-applies the watermark

**This is a hard engineering constraint on layer B, and it is easy to get wrong.**
Any text fully regenerated through Claude is marked at full strength, regardless
of what went in. **Paraphrasing Claude's output with Claude makes the situation
worse, not better.** Layer B must run on a non-Claude model. This project is
*built* with Claude Code, which is unrelated: that is the tool writing the
software, not the engine processing user text.

### Nobody can verify that a text watermark was removed. Including us

No public detector exists **today**. **Every present day claim about text
watermark removal, from any tool, is currently unfalsifiable.** This is the
sourced version of `04` entry 23.

**Correction to the primer, 18 August 2026. Jon was right and the primer is stale
on this point.** It argued the key can never be published and that detection is
therefore permanently gated. **Anthropic confirmed on 12 August 2026 that a
publicly callable detection API is in development,** and Anthropic's own help
page says they are "working to enable users and other third parties to detect
Claude's embedded watermarks." No ship date, no access model, no pricing, and no
terms published.

**The primer's underlying argument is not wrong, it is unresolved.** A symmetric
key still cannot be handed out, so a detection API means querying Anthropic and
trusting the answer rather than verifying independently. And the primer predicted
the exact problem a removal tool creates: **a detector queried repeatedly in a
before and after pattern is an evasion oracle**, which is the pattern Anthropic
would be expected to build abuse controls against.

**Working position: plan for layer B being unverifiable. Treat the detector as
upside if it ships with terms we can actually use, not as the plan.** Confirming
whether those terms permit this use is a task, not an assumption. `06` row 24.

**Also updated by the same check:** Claude models launched on or after 2 August
2026 carry the mark, and it is applied globally. The primer said no current model
was confirmed marked.

### The watermark is not evenly present in the first place

Signal accumulates only where the model had genuine choice. **Strong** in
discursive prose and in anything Claude translated. **Sparse** in factual
statements. **Weak** in code, where it attaches mainly to comments. **Near zero**
when Claude only proofread human writing. **Insufficient** in short passages.

**A user pasting a short factual paragraph may have nothing to remove.** Saying
so honestly is better product than pretending otherwise.

### Layer A on an Anthropic file finds nothing Anthropic put there

**A correction worth stating precisely, because the layers are easy to mix up.**
An Anthropic generated file does carry a removable mark, and removing it is a
real capability this product will have. **But it is the metadata layer that
removes it, not layer A.** The mark on the file is C2PA signed provenance sitting
in the file's wrapper. Layer A looks for invisible characters in text, and
Anthropic adds none, so on a Claude generated file layer A finds nothing Claude
left behind.

**Layer A still earns its place on files**, because a file's text may have been
pasted from a web page or produced by a different AI tool, and those sources do
insert characters. **The claim to be careful with is attribution:** "we remove
Claude's mark from your files" is true, and it is true because of metadata.

### Metadata stripping works, and defeats something already fragile

C2PA is signed metadata attached to generated files. It is verifiable by anyone
with open tooling, which is exactly why it is the auditable half. Anthropic
documents it as removable by re-saving or converting the file. **Layer A and
metadata are the two layers that provably do what they say.**

**The tension worth carrying into any copy we write:** the durable mark cannot be
audited, and the auditable mark is not durable.

### What the engine repository actually does, checked 18 August 2026

Read directly from the repository rather than assumed. **Three findings that
shape the engine session.**

**Layer B does nothing out of the box.** Its default backend is `print-prompt`,
which prints the rewrite prompt and calls no model at all. Real backends are
`ollama`, meaning a model running locally, and `openai-compatible`, meaning any
API speaking that format. **A model has to be chosen and wired up. It is not
included.**

**The repository already knows about re-stamping.** It states: prefer a non
origin model for layer B, and do not rewrite Claude text with Claude if you are
trying to avoid re-stamping. Jon assumed this was handled and it is.

**PDF cleaning does not properly work without `qpdf`, and that is a system
program rather than Python code.** The repository states that without it, PDF
cleaning is incremental and **the original metadata bytes remain recoverable**,
which means the file still carries what we said we removed. It also names
`exiftool` and `c2patool` as optional helpers, and says all three come
preinstalled in its Docker image.

**Why that last one matters more than it looks.** The core Python needs version
3.10 and nothing else, which would sit comfortably on Vercel. **The system
programs are the problem, and PDF is one of the four launch formats.** The
repository's own answer is a Docker container, which is a different way of
running software than the rest of this project uses. **This is the real content
of the engine session** and it is why that session is scheduled before anything
depends on it. `06` row 19.

### One conflict in the sources, unresolved

The primer describes `guillaumemeyer/watermarks-remover` as early stage, single
digit stars, v0.0.1. A direct check of the repository on 18 August 2026 returned
14.4k stars and v0.5.0 with CI and 60+ tests. **The technical descriptions of the
three layers match exactly in both. Only the maturity figures conflict.** Not
resolved, and it does not need resolving until the engine session. `06` row 19.

---

## 3. What is actually built right now

**The engine is finished and live. The site is not built at all.**

### The engine, done and verified on `un-claude.com`

| Layer | State | Evidence |
|---|---|---|
| **A, invisible characters** | **Live** | 6 planted characters found, named, located, removed, none left. ~40ms |
| **Metadata, files** | **Live** | Office document, PNG, JPEG. Marks present before, absent after, **verified against raw bytes.** Content byte identical |
| **B, statistical watermark** | **Live** | **Five documents of five, 1,260 to 5,047 words, every number intact, 94 to 100% of length, worst case 22 seconds** |

**Two endpoints:** `POST /api/scan` says what is hidden, `POST /api/clean` removes
it. Layer B is one option on the second. **Full detail in
`apps/web/engine/ENGINE.md` and `apps/web/engine/API.md`.**

**Costs:** scan and clean without layer B are free and instant, no model call.
Layer B is about **0.06 cents per thousand words.**

**Every response carries a usage record** and layer B carries `verified: false`
plus a note that nobody can verify removal. `04` entry 23.

### The site: nothing exists

The landing page is still the starter kit's stock marketing page, headline "Ship a
SaaS faster than ever", hardcoded in `apps/web/app/(marketing)/page.tsx`. **No
environment variable touches it. It needs replacing by hand.**

### Deleted, as ruled

The humanizer editor, the mock route, the text analysis and the old contract are
gone. `04` entry 21.

## 4. The stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js, App Router, Turbopack, Cache Components on | 16.3.0 |
| UI | React | 19.2.8 |
| Styling | Tailwind CSS with shadcn/ui components | 4.3.3 |
| Language | TypeScript | 7.0.2 |
| Auth and database | Supabase, hosted Postgres | managed |
| Hosting | Vercel, production on `un-claude.com` | managed |
| Monorepo | Turborepo with pnpm workspaces | 2.10.8 |
| Base | MakerKit Lite, MIT licensed | 1.0.0 |
| **Engine** | **Undecided.** Based on `guillaumemeyer/watermarks-remover`, MIT, Python | `06` row 19 |

**This is a monorepo,** meaning one repository holding the website and the shared
code it uses, in separate folders. The Next.js application lives in `apps/web`.
Shared code sits in `packages/`. Vercel's root directory is set to `apps/web`.

**Read `apps/web/AGENTS.md` before writing Next.js code.** It warns that this
version differs from what a model is likely to remember and points at bundled
documentation in `apps/web/node_modules/next/dist/docs/`. That warning is real.

**The engine is Python and the site is TypeScript.** Those are different
programming languages that do not run in the same place, so something has to
bridge them. **Undecided and deliberately parked** for a technical session with
Jon. `06` row 19.

---

## 5. What is being built, and the two rules it must satisfy

### Every operation records what it consumed, from the first line of code

Words in, file size in, and model tokens used for layer B. **Pricing is undecided
and gets its own session, and that session cannot price from guesses.** `04`
entry 22, `06` row 18. This is small to add now and impossible to backfill.

### Showing the marks is the product, not a feature of it

The old humanizer had a real problem: after a rewrite the output looked similar
to the input and the user could not see what they had paid for. **A watermark
remover has the stronger version of the answer available to it.** The marks are
countable. Show which characters were found, how many, and where. That is proof
of work rather than criticism, which was Jon's own framing in `04` entry 17 and
survives the code that carried it.

### What does not need rebuilding

**Streaming.** The old tool showed results progressively as they arrived because
a full rewrite takes tens of seconds. **Layers A and metadata finish in
milliseconds.** Only layer B is slow. Most of the streaming machinery being
thrown away does not need replacing, which is a real saving against the launch
target.

### What does carry over

A single shared file defining the boundary between interface and engine, with a
**closed set of error messages** rather than raw upstream text shown to users. An
open error string puts whatever the engine said in front of a stranger, which is
exactly the `<DefaultError />` defect still open as `06` row 13.

---

## 6. A finding that outlived the product it came from

The humanizer's mock made the product **worse on its own headline metric.**
Sentence variation fell from 30.5% to 18.9%.

**The cause generalises and it now applies to layer B.** Compressing every
sentence pulls them all toward the same length, which makes the rhythm more
uniform, and uniformity is itself the machine tell. Three strategies were
measured rather than guessed, and compressing only alternate sentences fixed the
direction by preserving contrast between long and short sentences.

**Any rewriter that uniformly shortens or uniformly smooths will degrade the
exact quality it is selling.** Layer B is a rewriter. This applies to it directly,
and it applies to a real model with a prompt just as much as it applied to a
crude pattern match.

---

## 7. What is not built

| | Status | Tracked in |
|---|---|---|
| **The landing page** | **Nothing exists.** Still the kit's stock page | `04` entries 20, 33, 34 |
| **The tool interface** | **Nothing exists.** The engine behind it is finished | `apps/web/engine/API.md` |
| Free tier limits and enforcement | Decided in principle, not built | `04` entry 22 |
| Billing and credits | Not started. The kit ships none | `06` row 10 |
| Pricing | **Undecided. Gets its own session**, and now has real cost numbers to work from | `06` row 18 |
| PDF | **Out of version one** | `06` row 26 |
| Guarding names as well as numbers | Not built. Same mechanism, free to compute | `ENGINE.md` section 10 |
| Surfacing `figures_to_check` | **Returned by the engine and currently unused** | `06` row 27 |
| A repeatable test suite | Not built | `06` row 36 |
| Auth error messages | Broken, shows `<DefaultError />`. **Strangers hit this at launch** | `06` row 13 |
| How it works page, mission page | Parked by Jon | `06` row 22 |

---

## 8. Where to read what

| Question | File |
|---|---|
| **How does the engine work, what can it prove, where does it stop** | `apps/web/engine/ENGINE.md` |
| **How do I call it** | `apps/web/engine/API.md` |
| Where did the engine code come from, what does the licence require | `apps/web/engine/PROVENANCE.md` |
| Why was something decided | `docs/04-decision-log.md` |
| What is still undecided | `docs/06-assumptions-and-open-questions.md` |
| How do I run, deploy, or avoid a known trap | `docs/07-runbook.md` |
| What happens next | `docs/02-build-plan.md` and `docs/CURRENT-HANDOFF.md` |
