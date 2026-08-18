# un-claude: Start Here

**What this is.** An AI text humanizer. A user pastes machine written text in and
gets back a version that reads naturally, with better flow and a more human tone.
It is a web product with accounts and paid credits, sold in a market that already
has competitors. It is not a novel category.

**Current phase.** The product shell is live at
[un-claude.com](https://un-claude.com) and the humanizer interface is built
against a mocked engine. **The real rewriting engine does not exist yet and is
Jon's separate workstream.** Billing does not exist. The landing page is still
the starter kit's stock marketing page.

**Which model runs this.** Claude, through Claude Code. **Kimi was retired on 18
August 2026** and everything about Moonshot in these documents is history, kept
for the general lessons in it rather than as instructions. See `04` entry 11.

---

## The files, and what each one is for

| File | What it holds | How often it changes |
|---|---|---|
| `CLAUDE.md` (repo root) | Precedence, the data boundary, the verification standard. Loads automatically every session | Rarely |
| `docs/00-START-HERE.md` | This file. An index, nothing more | Rarely |
| `docs/01-build-spec.md` | What is built, how it fits together, and the API contract | When the architecture changes |
| `docs/04-decision-log.md` | Every ruling Jon has made, with the reasoning. Append only | Whenever Jon rules |
| `docs/05-working-agreement.md` | How we work together. The constitution | Rarely |
| `docs/06-assumptions-and-open-questions.md` | The live list of what is undecided, and what would settle it | Constantly |
| `docs/07-runbook.md` | Operational facts learned the hard way | When something is learned |
| `docs/CURRENT-HANDOFF.md` | Where the last session stopped and where this one starts | Every session |

Numbers 02 and 03 are still free for project content documents. **The most likely
occupant of one of them is a definition of what counts as good output,** which is
`06` row 4 and has been open since session 1.

---

## Reading order for a cold session

1. `CLAUDE.md`
2. `docs/CURRENT-HANDOFF.md`
3. `docs/01-build-spec.md` if you are touching code
4. `docs/04-decision-log.md`, most recent entries first
5. `docs/06-assumptions-and-open-questions.md`
6. Anything else the session's subject touches

Jon usually pastes his own reading order at the top of a session, tailored to
what that session is about. **His list wins over this one.**

---

## A warning about this file specifically

In the project this system is adapted from, the equivalent file went stale for
twelve days. It kept instructing every reader to follow a build process that had
been abandoned, and nobody noticed, because nobody had reason to reread an index.
The recorded lesson from that project applies directly: a governing document
nobody reads does not govern, it ambushes.

**This file proved the point on 18 August 2026.** It spent that whole session
saying the project was in setup and running on Kimi, when the project had been
rescoped and Kimi had been retired hours earlier. Nobody read it, so nobody
noticed.

It goes stale because it duplicates content that lives elsewhere. So it stays
deliberately thin. It points at other files. It does not explain how anything
works.

**If you find yourself wanting to explain something here, that explanation
belongs in the file that owns the subject.**
