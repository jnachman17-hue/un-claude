# un-claude: Start Here

**What this is.** A tool that removes AI watermarks from text and files. A user
pastes text or uploads a document, and the tool finds the marks identifying it as
machine generated and removes them. It is a web product with accounts and paid
credits.

**Three layers.** Invisible characters hidden between the visible words (layer A),
hidden data inside a file's wrapper (metadata), and patterns in word choice
removed by rewriting (layer B). **Paste text and you get A and B. Upload a file
and you get all three.** Layers A and metadata are provable. **Layer B is best
effort and is always labelled as such.** Full definitions in `CLAUDE.md`.

**Rescoped 18 August 2026, session 4.** This was an AI text humanizer until that
date. **Assume anything in these documents describing a humanizer is history**
unless it has been rewritten since. See `04-decision-log.md` entries 18 to 24,
which supersede entries 10, 15, 16 and 17.

**Current phase.** The site shell is live at
[un-claude.com](https://un-claude.com) with working sign up. **Everything built
for the humanizer is scrapped and the product is being rebuilt from the ground
up.** The engine does not exist yet. Billing does not exist yet. The landing page
is still the starter kit's stock marketing page.

**Which model runs this.** Claude, through Claude Code.

---

## The files, and what each one is for

| File | What it holds | How often it changes |
|---|---|---|
| `CLAUDE.md` (repo root) | What the product is, precedence, the data boundary, the verification standard. Loads automatically every session | Rarely |
| `docs/00-START-HERE.md` | This file. An index, nothing more | Rarely |
| `docs/01-build-spec.md` | What is built, how it fits together, and what the layers do and do not do | When the architecture changes |
| `docs/02-build-plan.md` | **The sequence.** Phases, sessions, what gates each one, and what each already knows | When a session passes its exit criteria |
| `docs/03-track-b-brief.md` | The full briefing handed to the site track | Owned by Track B |
| `docs/TRACK-A-NOTES.md` | Track A's live notes. Folded into the durable files at integration | Constantly, by Track A only |
| `docs/TRACK-B-NOTES.md` | Track B's live notes. Folded into the durable files at integration | Constantly, by Track B only |
| `docs/anthropic-watermarking-context.md` | Sourced primer on Anthropic's watermarking, added by Jon | Reference, not maintained here |
| `docs/04-decision-log.md` | Every ruling Jon has made, with the reasoning. Append only | Whenever Jon rules |
| `docs/05-working-agreement.md` | How we work together. The constitution | Rarely |
| `docs/06-assumptions-and-open-questions.md` | The live list of what is undecided, and what would settle it | Constantly |
| `docs/07-runbook.md` | Operational facts learned the hard way | When something is learned |
| `docs/CURRENT-HANDOFF.md` | Where the last session stopped and where this one starts | Every session |

**The build runs as two parallel tracks in one folder,** the engine and the site,
with hard file ownership rules. `04` entry 25. **Read the ownership table before
editing anything.**

---

## Reading order for a cold session

1. `CLAUDE.md`
2. `docs/CURRENT-HANDOFF.md`
3. `docs/02-build-plan.md`, for what is next and what gates it
4. `docs/01-build-spec.md` if you are touching code. **Section 2a especially**
5. `docs/04-decision-log.md`, most recent entries first
6. `docs/06-assumptions-and-open-questions.md`
7. The other track's notes file, before acting
8. Anything else the session's subject touches

Jon usually pastes his own reading order at the top of a session, tailored to
what that session is about. **His list wins over this one.**

---

## A warning about this file specifically

In the project this system is adapted from, the equivalent file went stale for
twelve days. It kept instructing every reader to follow a build process that had
been abandoned, and nobody noticed, because nobody had reason to reread an index.
The recorded lesson applies directly: a governing document nobody reads does not
govern, it ambushes.

**This file has now proved the point twice.**

**18 August 2026, session 3.** It spent the whole session saying the project was
still in setup, hours after it had been rescoped and the model it named had been
abandoned.

**18 August 2026, session 4.** It spent the session describing an AI text
humanizer, a product that had been abandoned in the same conversation that
rewrote it. **The second occurrence is the more useful one, because it happened
even after the first was written down here as a warning.** The lesson is not that
somebody forgot. It is that an index goes stale by default and only stays true if
rewriting it is part of finishing a rescope, not a thing to get to afterwards.

It goes stale because it duplicates content that lives elsewhere. So it stays
deliberately thin. It points at other files. It does not explain how anything
works.

**If you find yourself wanting to explain something here, that explanation
belongs in the file that owns the subject.**
