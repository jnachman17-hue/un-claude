# un-claude: Start Here

**What this is.** A small tool that rewrites AI-written text so that it reads as
though a person wrote it.

**Current phase.** Setup. The repository, the working agreement and the
continuity system exist. The build specification does not. Writing it with Jon is
the next substantive piece of work.

**Which model runs this.** Kimi, served through Moonshot's API, inside the Claude
Code harness. Configured per project in `.claude/settings.local.json`, which is
gitignored and therefore does not travel with the repository. A fresh clone on
another machine runs on Claude until that file is recreated by hand.

---

## The files, and what each one is for

| File | What it holds | How often it changes |
|---|---|---|
| `CLAUDE.md` (repo root) | Precedence, the data boundary, the verification standard. Loads automatically every session | Rarely |
| `docs/00-START-HERE.md` | This file. An index, nothing more | Rarely |
| `docs/04-decision-log.md` | Every ruling Jon has made, with the reasoning. Append only | Whenever Jon rules |
| `docs/05-working-agreement.md` | How we work together. The constitution | Rarely |
| `docs/06-assumptions-and-open-questions.md` | The live list of what is undecided, and what would settle it | Constantly |
| `docs/07-runbook.md` | Operational facts learned the hard way | When something is learned |
| `docs/CURRENT-HANDOFF.md` | Where the last session stopped and where this one starts | Every session |

Numbers 01, 02 and 03 are reserved for project content documents: the build
specification, the definition of what counts as good output, and whatever else
the work turns out to need.

---

## Reading order for a cold session

1. `CLAUDE.md`
2. `docs/CURRENT-HANDOFF.md`
3. `docs/04-decision-log.md`, most recent entries first
4. `docs/06-assumptions-and-open-questions.md`
5. Anything else the session's subject touches

Jon usually pastes his own reading order at the top of a session, tailored to
what that session is about. **His list wins over this one.**

---

## A warning about this file specifically

In the project this system is adapted from, the equivalent file went stale for
twelve days. It kept instructing every reader to follow a build process that had
been abandoned, and nobody noticed, because nobody had reason to reread an index.
The recorded lesson from that project applies directly: a governing document
nobody reads does not govern, it ambushes.

It went stale because it duplicated content that lived elsewhere. So this file
stays deliberately thin. It points at other files. It does not explain how
anything works.

**If you find yourself wanting to explain something here, that explanation
belongs in the file that owns the subject.**
