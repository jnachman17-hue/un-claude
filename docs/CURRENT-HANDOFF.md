# un-claude: Current Handoff

**Date:** 18 August 2026, end of session 3
**Status:** The product shell is deployed and the humanizer interface works
against a mocked engine. The real engine, billing, and the landing page do not
exist.

**Handing off to a fresh chat.** Jon paused building deliberately. This file is
written for someone with no memory of the session.

**This file holds resumption context only.** It is rewritten wholesale every
session. Nothing may live here as its only record. Durable things go in
`04-decision-log.md`, `06-assumptions-and-open-questions.md`, `07-runbook.md`,
or `01-build-spec.md`.

---

## 0. Read this before acting on anything written earlier

**Kimi is retired. This project runs on Claude through Claude Code.** Decision 11.
Everything about Moonshot, `kimi-k3`, the model picker trap and the Terminal only
rule is history, kept for the general lessons rather than as instructions.

Three consequences that bite if missed:

- **`CLAUDE.md` section 3 was corrected.** Data goes to Anthropic, not Moonshot.
  **The boundary rules did not relax.** Nothing outside `~/un-claude` gets read,
  and `~/Documents/GitHub/Blotter-Claude` stays off limits.
- **The emergency stop changed and is weaker.** Deleting the Moonshot key does
  nothing now. Close the window, and deny the permission prompt. Recorded
  honestly in `07` rather than glossed.
- **The Terminal only rule is void.** Its sole reason was the Kimi settings.

**The project was rescoped.** It builds an AI text humanizer sold as a product.
**Removing Anthropic watermarks is explicitly not the goal.** Decision 10.

---

## 1. Where to pick up

**Jon's stated next steps, from his own roadmap, in his order:**

1. **Redesign the landing page.** Modern dark mode SaaS aesthetic. He referenced
   GPTZero and Hemingway Editor. **The GPTZero reference is about interaction
   shape, one box in and one box out, not about positioning.** That was
   misread once in session 3 and corrected by Jon. Do not re-read it as a
   detection product.
2. **Build a features section** covering natural rhythm restoration, removal of
   robotic syntax, and sentence structure variation. **The metrics panel already
   computes evidence for all three claims,** so the features section can point at
   something real rather than asserting.
3. **Put the tool on the public landing page.** Agreed model: the landing page
   *is* the product, GPTZero style. A visitor uses it immediately, hits the free
   word budget, and is asked to register. Build the editor once and wrap it
   twice rather than building it again.

**Do not start the rewriting engine.** It is Jon's separate workstream.
Decision 15.

---

## 2. Run it

```bash
cd ~/un-claude && pnpm dev
```

Then `http://localhost:3000`. **The humanizer is at `/home`, behind login.**

**You cannot sign in locally.** Supabase requires email confirmation and the
confirmation link goes to an address with no mail delivery. In session 3 the
component was verified by mounting it briefly on a temporary public route, which
was then deleted. If you need to see it again, do the same and delete it after.

`apps/web/.env.local` points local development at the **hosted** Supabase project
using only the two public keys. The service role key is deliberately absent; it
lives only in Vercel.

**Docker is not installed,** so a local Supabase cannot run. `06` row 11.

---

## 3. Verified working, with the evidence

Everything below was tested by doing it, not by inspection.

| Thing | Evidence |
|---|---|
| Site live on `un-claude.com` | HTTPS certificate issued by Let's Encrypt |
| Email sign up | An account was actually created end to end |
| Anonymous database access blocked | Live probes returned `42501 permission denied` for both read and write |
| Humanize streaming, metrics, highlights, copy, word cap | Driven in a browser |
| Every error path including mid stream failure | Forced with `?simulate=` and rendered correctly |
| Type checking | 8 of 8 packages |

---

## 4. Do not repeat, do not ask about

- **MakerKit Lite is chosen.** Do not relitigate the boilerplate. Vercel's
  starter was considered on Jon's own prompting and rejected with reasoning in
  `04` entry 14.
- **Streaming is settled**, and the reason matters: a blocking client has to be
  rebuilt later, not extended. Decision 15.
- **Credits are priced in words, not tokens.** Decision 16.
- **The free tier is a word budget, not a rewrite count.** Decision 16.
- **Highlighting is sentence level, not word level.** Word level lights up the
  whole output because a rewrite changes nearly every word. Decision 17.
- The kit's `.mcp.json` was deleted deliberately. **If it reappears, delete it.**
- Jon has parked landing page *wording*, but has now asked for the landing page
  *design*. Those are different. Check before drafting copy.

---

## 5. The gap that outlives every session

**`06` row 4: what counts as good output. Open since session 1.**

Jon has heard the argument and deliberately deferred it to his own engine
workstream, which is a decision rather than an oversight. **It still does not
exist as a written standard in this repository,** and until it does, nobody can
say whether a change to the engine made the product better or worse.

Related and also open as `06` row 12: whether this is positioned as a writing
quality tool or an AI detector bypass. Jon parked it. The fork is real, it
changes the engine and the legal exposure, and it is recorded so it does not get
decided silently by whatever prompt gets written first.

---

## 6. Things that will bite you

**Read `apps/web/AGENTS.md` before writing Next.js code.** It warns this version
differs from what a model remembers and points at bundled docs. The warning is
real.

**Stage by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.**
The repository is now ~400 files.

**Re-run the secret check after any change to `.gitignore`:**

```bash
git check-ignore -v .claude/settings.local.json
```

**`git config --local http.postBuffer 524288000` is already set** and is why
pushes work. Without it, pushing this repository fails with a bare `HTTP 400`.

**`tail` on a streaming response can lie.** A truncated stream mid recompile
looked like a missing error frame for several minutes in session 3. Read the
full output when debugging a stream.

**The metrics are honest measurements, not decoration.** If the mock or the
engine makes prose worse, the panel will say so. That is correct behaviour and
not a bug to hide.

---

## 7. How sessions work

**Jon is not a programmer.** He directs by describing outcomes and reviews by
looking at the actual thing, never by reading code. For a text tool that means
showing real input and real rewritten output, in full, in the session.

**He wants pushback.** Session 3 is the evidence it works: both boilerplates he
was handed failed on inspection, one fatally on licensing, and the domain he
named turned out not to be registered. Checking rather than complying caught all
three.

**He wants a recommendation, not a menu.**

**Warn him before the context window fills.** He asks for this explicitly and
cannot see it coming.

**Bad news first, plainly, once.** No extended apology, no self criticism.

---

## 8. Sessions so far

**Session 1, 17 August 2026.** Setup. Repository, `CLAUDE.md`, the documentation
system, secret boundary tested twice. Five commits.

**Session 2, 17 August 2026.** Diagnosed that no session had ever reached
Moonshot despite a correct configuration file. No product work.

**Session 3, 18 August 2026.** The long one. Rescoped the project, retired Kimi,
evaluated three starter kits and rejected two on evidence, merged MakerKit Lite,
created Supabase, deployed to `un-claude.com`, tested sign up end to end, fixed a
live Google sign in bug, then designed and built the humanizer interface against
a mocked streaming engine. Twelve commits. **Tagged `session-3-end`.**

**Three bugs were written and caught before shipping in the build half**, all
invisible from the interface: a sentence splitter that would have shredded every
sentence, a stream closed twice so its error frame never arrived, and a metrics
panel reporting "no change" beside two visibly different numbers. Worth knowing
that rate exists, because Jon cannot catch any of them by reading.
