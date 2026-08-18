# Track B: The Site. Your Brief

**You are Track B.** You build the website. A second chat, Track A, is building
the engine at the same time, in this same folder. **Read this whole file before
doing anything.**

Written 18 August 2026 by the Track A session, at Jon's instruction, so that you
start with everything that session learned rather than rediscovering it.

---

## 1. Do not build yet

**Jon's explicit instruction: you and he discuss first.** Understand the context,
form a view, put your questions and recommendations to him, and wait. **Building
starts when he says it starts.**

He is not a programmer. He directs by describing outcomes and cannot review your
code by reading it. Everything in `CLAUDE.md` applies to you in full, especially
section 1 on plain English, section 4 on how something becomes "done", and
section 5 on stopping and asking. **He wants pushback, not agreement, and a
recommendation rather than a menu of options.**

---

## 2. What the product is

**un-claude removes AI watermarks from text and files.** A user pastes text or
uploads a document, the tool finds the marks identifying it as AI generated,
removes them, and shows exactly what it found.

**An AI watermark is a mark an AI tool leaves behind saying it wrote something.**
Three kinds, and the differences between them decide almost everything you will
build.

| Layer | What it removes | Where it hides | Pasted text | Files | Provable |
|---|---|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | Inside the text itself, between the visible words | **Yes** | Yes | **Yes** |
| **Metadata** | C2PA provenance, EXIF, XMP, generator tags | Inside the file's wrapper, not in the text | **No** | **Yes** | **Yes** |
| **B. Statistical watermark** | Patterns in which words the model chose, removed by rewriting | In the word choices themselves | **Yes** | Yes | **No. Best effort** |

**Paste text and you get A and B. Upload a file and you get all three.**

**This was an AI text humanizer until 18 August 2026.** If you find anything in
this repository describing a humanizer, a rewriting engine owned as a separate
workstream, or a metrics panel measuring sentence rhythm, **it is history that was
missed.** Report it, do not follow it.

---

## 3. Three facts that constrain what you may write on the page

**These were checked against Anthropic's own publications and the engine
repository on 18 August 2026. They are not opinions and they are not stale.**

**Layer A does nothing against Claude's text watermark.** Anthropic states
directly that no hidden characters are added to Claude's text. Layer A is still
worth building, because other AI tools, web pages and export pipelines do insert
those characters. **But copy claiming layer A removes Claude's watermark would be
false.**

**On a Claude generated file, the removable mark is C2PA, and the metadata layer
removes it.** So "we remove Claude's mark from your files" is a true claim, and it
is true because of metadata rather than layer A. Attribute it correctly.

**Nobody can verify a text watermark was removed, including us.** No public
detector exists. Anthropic confirmed on 12 August 2026 that one is in development,
with no ship date and no published terms. **Layer B is labelled best effort
everywhere it appears, including to users.** `04` entry 23. Presenting it with the
confidence of the other two layers is the fastest way to make this product
dishonest, and Jon has ruled that users are never misdirected.

**Full detail is in `01-build-spec.md` section 2a. Read it.**

---

## 4. The decision that gates your copy

**`06` row 23 is open and Jon has not ruled on it: what does the site claim?**

His stated intent, this session: headline removing Claude's watermark and every
other AI's, because that is what the finished product does. **He has also said the
claims will align with the realities above and that he wants to discuss the
wording separately.**

**Get this ruled before you write copy.** It is the first thing your session
should put to him. Do not write a headline and ask him to react to it as though
the underlying question were settled.

---

## 5. What you are building

**The landing page is the product.** `04` entry 20, in Jon's own words:

> Every tool in this category lets you paste text and see a result before signing
> up, then gates it. QuillBot, GPTZero, Grammarly all work this way. The tool is
> the landing page. You arrive, there is a box, you try it, and you hit a limit
> that asks you to register.

**Built once, wrapped twice.** The tool is identical signed in or signed out.
What changes is the frame around it: a stranger gets marketing underneath and a
signup prompt at the limit, a signed in user gets their credit balance and history
instead. **There is no separate application behind the login.** The humanizer was
built the opposite way, at `/home` behind login, and that is one reason it is
being deleted.

**Nothing launches until every layer works.** Jon ruled out an incremental
launch specifically so that you can build with the theme, styling and wording of
the finished product from the start.

**Your two sessions are B1 and B2, fully specified in `02-build-plan.md` sections
6 and 7.** In short: B1 is design direction, page structure and final quality
copy, needing no engine. B2 is the tool frame, file upload, results display, free
caps, the signed in wrapper, and the auth bug fix.

---

## 6. The stack you are working in

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

**Read `apps/web/AGENTS.md` before writing any Next.js code.** It warns that this
version differs from what a model is likely to remember, and points at bundled
documentation. **That warning is real and has already caught people.**

**Do not relitigate MakerKit Lite.** Vercel's starter was considered on Jon's own
prompting and rejected with full reasoning in `04` entry 14.

**Run the site:**

```bash
cd ~/un-claude && pnpm dev
```

**You cannot sign in locally.** Supabase requires email confirmation and the
confirmation link goes nowhere. Docker is not installed, so a local Supabase
cannot run. `06` row 11.

---

## 7. File collision. These are hard rules

**Track A is working in this same folder at the same time.** `04` entry 25.

| You own, edit freely | Track A owns, **never touch** | Shared, **do not edit** |
|---|---|---|
| `apps/web/` | `engine/` | `CLAUDE.md` |
| `packages/` | `docs/TRACK-A-NOTES.md` | `docs/01-build-spec.md` |
| `docs/TRACK-B-NOTES.md` | | `docs/02-build-plan.md` |
| `docs/03-track-b-brief.md` (this file) | | `docs/04-decision-log.md` |
| | | `docs/06-assumptions-and-open-questions.md` |
| | | `docs/07-runbook.md` |
| | | `docs/CURRENT-HANDOFF.md` |

**Read every file in every column. Edit only the first one.**

### How you record decisions without fighting Track A for a file

Jon's live ratification rule says a decision is written down **at the moment it
happens**, not at the end of a session. `05` section 5. That rule stands.

**Write his rulings into `docs/TRACK-B-NOTES.md`**, under a heading marked
`DECISION`, in the same format `04-decision-log.md` uses: the ruling, then the
reasoning, then what it supersedes. **They are folded into `04` at integration.**
Same for anything that would normally go to `06` or `07`: mark it `OPEN QUESTION`
or `RUNBOOK`, and it gets filed at integration.

### Three operational rules

**Only you run `pnpm dev`.** Two dev servers collide on port 3000. Track A does
not run it.

**Stage by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.**
This is already the rule in `CLAUDE.md` section 5, and with two sessions running
it is also the thing that stops you committing Track A's half finished work.
**Run `git status` before every commit and stage only your own files by name.**

**Read `04-decision-log.md` and `docs/TRACK-A-NOTES.md` before acting each time
you resume.** The real risk in a two track build is not files, it is a decision
made in the other chat that you never learn about.

---

## 8. The engine you will eventually call

**You are not building it and you must not start it.** Track A owns it entirely.

What you need to know: the engine is Python, based on
`guillaumemeyer/watermarks-remover`, MIT licensed. **How it is deployed is
undecided** and is the substance of Track A's first session, because it needs
system programs that Vercel does not obviously provide. `06` row 25.

**Track A defines the HTTP contract and tells you.** Until it exists, build
against a thin placeholder, and keep the placeholder honest: slow, and capable of
failing, because an always fast always successful stand in produces an interface
that only works when nothing goes wrong. That lesson is already paid for in `04`
entry 15.

**Two things carry over from the deleted humanizer and are worth keeping:** one
shared file defining the boundary between site and engine, and a **closed set of
error messages** rather than raw upstream text shown to a user. `06` row 13 is a
live example of what happens without the second one.

---

## 9. What you must build in from the first line

**Every operation records what it consumed:** words in, file size in, and tokens
for layer B. **Pricing is undecided and gets its own session, and that session
cannot price from guesses.** `04` entry 22, `06` row 18. This is small now and
impossible to backfill.

**Showing the marks is the product, not a feature of it.** The old humanizer had a
real problem: after a rewrite the output looked similar to the input and the user
could not see what they had paid for. **You have the stronger answer available:
the marks are countable.** Show which characters were found, how many, and where.

---

## 10. Formatting and tone rules that apply to your copy

**No em dashes and no en dashes.** In documents and in every word on the site:
headings, subheadings, body copy, button labels. **This is Jon's style preference
for his own site.** `05` section 2. It says nothing about the engine and must not
leak into any technical specification.

**Define technical terms on first use.** Jon should never have to look something
up to read his own project's documents.

**State failures first and plainly.** One sentence, then the fix. No extended
apology and no self criticism.

---

## 11. What to do first

1. Read the files listed in section 12.
2. Come back to Jon with: your read of the product, **your question on `06` row
   23**, what design direction you need from him, and anything in here you think
   is wrong.
3. **Wait for him. Do not build.**

---

## 12. Reading order

1. `CLAUDE.md`
2. This file
3. `docs/02-build-plan.md`, sections 1, 2, 6, 7 and 9
4. `docs/01-build-spec.md`, **section 2a especially**
5. `docs/04-decision-log.md`, entries 18 to 25
6. `docs/06-assumptions-and-open-questions.md`
7. `apps/web/AGENTS.md` before any code
8. `docs/07-runbook.md` when you touch deployment or git
