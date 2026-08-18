# un-claude: Current Handoff

**Date:** 18 August 2026, session 4
**Status:** The project was rescoped from an AI text humanizer to an AI watermark
remover. **All documentation has been rewritten to match. No code has been
touched yet.**

**This file holds resumption context only.** It is rewritten wholesale every
session. Nothing may live here as its only record. Durable things go in
`04-decision-log.md`, `06-assumptions-and-open-questions.md`, `07-runbook.md`, or
`01-build-spec.md`.

---

## 0. Read this before acting on anything written earlier

**The project is an AI watermark remover.** A user pastes text or uploads a file,
and the tool finds the marks identifying it as AI generated and removes them.
`04` entry 18.

**Three layers, and the differences between them decide everything:**

| Layer | Pasted text | Files | Provable | Costs money to run |
|---|---|---|---|---|
| **A. Invisible characters** | **Yes** | Yes | **Yes** | No |
| **Metadata** | **No** | **Yes** | **Yes** | Almost nothing |
| **B. Statistical watermark** | **Yes** | Yes | **No. Best effort** | **Yes, every run** |

**Paste text and you get A and B. Upload a file and you get all three.**

**Layer B is labelled best effort everywhere, including to users.** `04` entry 23.
Presenting it with the confidence of the other two layers is the fastest way to
make this product dishonest, and Jon has ruled that users are never misdirected.

**It was an AI text humanizer until this session.** If you find anything
describing a humanizer, a rewriting engine owned as a separate workstream, or a
metrics panel measuring sentence rhythm, it is history that was missed. Entries
10, 15, 16 and 17 in `04` are struck through and superseded by 18 to 24.

---

## 1. Where to pick up

**Nothing in the product is built. The next session builds it.** In order:

1. **Delete the humanizer code.** Four files, listed in `01-build-spec.md`
   section 3 under "condemned but not yet deleted." Ruled scrapped, not yet
   removed.
2. **The engine technical session.** This is the first real conversation to have
   and Jon has asked for it explicitly. Two questions, both in `06` row 19: how
   much of `guillaumemeyer/watermarks-remover` to use, and how to connect a
   Python engine to a TypeScript site. **Jon is not technical and has parked both
   deliberately, leaning on you. Do not rule on them alone.**
3. **Build the tool on the landing page.** Not behind login. `04` entry 20.
4. **Fix the auth error bug before any stranger reaches sign up.** `06` row 13.

**Target: live within 24 hours, free, all three layers, no purchase flow.** `04`
entry 22.

**Billing starts in parallel, not after.** Jon's explicit instruction.

---

## 2. Two things that must be built in from the start

**Every operation records what it consumed.** Words in, file size in, model
tokens used for layer B. Pricing is undecided and gets its own session, and that
session cannot price from guesses. Small now, impossible to backfill. `04` entry
22.

**Showing the marks is the product.** Which characters were found, how many,
where. It is countable, which is exactly what the old humanizer could never do.

---

## 3. Run it

```bash
cd ~/un-claude && pnpm dev
```

Then `http://localhost:3000`.

**You cannot sign in locally.** Supabase requires email confirmation and the
confirmation link goes to an address with no mail delivery. **Docker is not
installed**, so a local Supabase cannot run. `06` row 11.

`apps/web/.env.local` points local development at the **hosted** Supabase project
using only the two public keys. The service role key is deliberately absent and
lives only in Vercel.

---

## 4. Verified working, with the evidence

| Thing | Evidence |
|---|---|
| Site live on `un-claude.com` | HTTPS certificate issued by Let's Encrypt |
| Email sign up | An account was actually created end to end |
| Anonymous database access blocked | Live probes returned `42501 permission denied`, read and write |
| Type checking | 8 of 8 packages |

**Everything else that session 3 verified was the humanizer and is being deleted.**

---

## 5. Do not relitigate

- **MakerKit Lite is the base.** Vercel's starter was considered on Jon's own
  prompting and rejected with reasoning. `04` entry 14.
- **The landing page is the product.** `04` entry 20. Jon's reasoning is recorded
  in his own words there.
- **The engine is built here now.** There is no division of labour any more.
  `04` entry 19.
- **Launch is free with no purchase flow.** `04` entry 22.
- **The domain question is parked in Jon's head, deliberately not in these
  files.** Do not raise it and do not write it down.
- The kit's `.mcp.json` was deleted deliberately. **If it reappears, delete it.**

---

## 6. Things that will bite you

**Read `apps/web/AGENTS.md` before writing Next.js code.** It warns this version
differs from what a model remembers and points at bundled docs. The warning is
real.

**Stage by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.**
The repository is ~400 files.

**Re-run the secret check after any change to `.gitignore`:**

```bash
git check-ignore -v .claude/settings.local.json
```

**`git config --local http.postBuffer 524288000` is already set** and is why
pushes work. Without it, pushing this repository fails with a bare `HTTP 400`.

**Pushing to GitHub is Jon's call.** Committing locally is not.

---

## 7. Sessions so far

**Session 1, 17 August 2026.** Setup. Repository, `CLAUDE.md`, the documentation
system, secret boundary tested twice.

**Session 2, 17 August 2026.** Diagnosed that no session had ever reached
Moonshot despite a correct configuration file. No product work.

**Session 3, 18 August 2026.** Merged MakerKit Lite, created Supabase, deployed
to `un-claude.com`, tested sign up end to end, then built a humanizer interface
against a mocked engine. Twelve commits. Tagged `session-3-end`.

**Session 4, 18 August 2026.** Rescoped to a watermark remover. Seven rulings,
entries 18 to 24, taken before any file was edited. Every document rewritten.
**Two errors were caught in the existing documents while doing it:** the runbook
claimed a global safety warning was muted when decision 8 had restored it, and
`00-START-HERE.md` had gone stale for the second time in two days. Both are
corrected in place with the correction visible.

---

## 8. The one thing that did not get easier

**`06` row 4, what counts as good output, is open since session 1 and survives
the rescope.** It shrank a lot: for layers A and metadata it is now answered by
definition, because the mark was there and now it is not, and that is countable.

**For layer B it is untouched and there is no test that can be written for it.**
That is the whole reason entry 23 requires layer B to be labelled unverified
rather than measured. **If a future session finds itself wanting to put a
confidence score on layer B, that is this question resurfacing, and the answer is
still no.**
