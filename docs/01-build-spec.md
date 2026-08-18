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

No public detector exists. The key is symmetric and held only by Anthropic, and
the primer argues it can never be published, because a key that detects can also
forge. **Every present day claim about text watermark removal, from any tool, is
currently unfalsifiable.** This is the sourced version of `04` entry 23 and it
makes that ruling stronger rather than weaker.

### The watermark is not evenly present in the first place

Signal accumulates only where the model had genuine choice. **Strong** in
discursive prose and in anything Claude translated. **Sparse** in factual
statements. **Weak** in code, where it attaches mainly to comments. **Near zero**
when Claude only proofread human writing. **Insufficient** in short passages.

**A user pasting a short factual paragraph may have nothing to remove.** Saying
so honestly is better product than pretending otherwise.

### Metadata stripping works, and defeats something already fragile

C2PA is signed metadata attached to generated files. It is verifiable by anyone
with open tooling, which is exactly why it is the auditable half. Anthropic
documents it as removable by re-saving or converting the file. **Layer A and
metadata are the two layers that provably do what they say.**

**The tension worth carrying into any copy we write:** the durable mark cannot be
audited, and the auditable mark is not durable.

### One conflict in the sources, unresolved

The primer describes `guillaumemeyer/watermarks-remover` as early stage, single
digit stars, v0.0.1. A direct check of the repository on 18 August 2026 returned
14.4k stars and v0.5.0 with CI and 60+ tests. **The technical descriptions of the
three layers match exactly in both. Only the maturity figures conflict.** Not
resolved, and it does not need resolving until the engine session. `06` row 19.

---

## 3. What is actually built right now

**Honest summary: the plumbing is real and verified. The product is not.**

### Verified working, by doing it rather than by inspection

| Thing | Evidence |
|---|---|
| Site live on `un-claude.com` | HTTPS certificate issued by Let's Encrypt |
| Email sign up | An account was actually created end to end |
| Anonymous database access blocked | Live probes returned `42501 permission denied` for read and write |
| Type checking | 8 of 8 packages |

### Condemned but not yet deleted

**These files still exist on disk.** They were built for the humanizer, they are
ruled scrapped by `04` entry 21, and none of them has been removed yet. Saying
otherwise would be reporting a step as done that was not done.

| File | Why it goes |
|---|---|
| `apps/web/app/home/_components/humanizer.tsx` | The humanizer editor. Wrong product, and behind login, which is the wrong side of `04` entry 20 |
| `apps/web/lib/text-analysis.ts` | Measures sentence length variation. **The wrong instrument, not stale wording.** A watermark remover does not improve rhythm |
| `apps/web/app/api/humanize/route.ts` | A mock rewriter. No model call in it |
| `apps/web/lib/humanize-contract.ts` | The old interface to engine boundary |

### Kept, and untouched by the rescope

Supabase authentication, the hosted database and its security migration, the
Vercel deployment, `un-claude.com`, the monorepo layout, and MakerKit Lite as the
base. **None of it cares what the product does.**

---

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
| The engine, all three layers | **Not started.** Approach undecided | `06` row 19 |
| Python to TypeScript bridge | **Not started.** Deliberately parked for a technical session | `06` row 19 |
| The landing page | Still the starter kit's stock marketing page | `04` entry 20 |
| The tool itself, in any form | **Not started.** The humanizer is scrapped and its replacement does not exist | `04` entry 21 |
| File upload, PDF DOCX PNG JPG | Not started | `04` entry 24 |
| Free tier limits and enforcement | Decided in principle, not built | `04` entry 22 |
| Billing and credits | Not started. **Work begins immediately, in parallel with launch** | `06` row 10 |
| Pricing | **Undecided. Gets its own session** | `06` row 18 |
| Deleting the humanizer code | **Ruled, not done** | Section 3 above |
| Auth error messages | Broken, shows `<DefaultError />`. **Urgent, strangers hit this at launch** | `06` row 13 |
| How it works page, mission page | Parked by Jon as a side note | `06` row 22 |
| Definition of good output for layer B | **Open since session 1** | `06` row 4 |
