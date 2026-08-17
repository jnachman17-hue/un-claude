# un-claude: Current Handoff

**Date:** 17 August 2026, end of session 6
**Status:** Setup complete and now genuinely running on Kimi. No product work has
started.
**Sessions 1 to 6 all ran on Claude.** Sessions 2 to 5 believed otherwise and
were wrong. See section 0. If you are reading this in a Terminal session started
with `claude` from `~/un-claude`, you are the first session actually on Kimi.

**This file holds resumption context only.** It is rewritten wholesale at the end
of every session. Nothing may live here as its only record. If something matters
beyond the next session, it belongs in `04-decision-log.md`,
`06-assumptions-and-open-questions.md`, or `07-runbook.md`.

---

## 0. Act on these before anything else

### Due now, in this order

**1. Confirm you are on Kimi before doing anything else.** Ask Jon to type
`/status` and read back two lines. **Anthropic base URL** must say
`api.moonshot.ai`. **Model** must say `kimi-k3`. If either says anything else,
stop and say so. Nothing done in a session that is not on Kimi counts as work on
this project.

**Why this is item one.** Sessions 2 to 5 all ran in the Claude Code desktop app,
which silently ignores this project's configuration and runs on Claude against
Anthropic. Every one of those sessions could have reported that Kimi was
configured, because it was, and the Moonshot dashboard read zero the whole time.
Closed as decision 9 in `04` and row 9 in `06`.

**The configuration itself is proved good and needs no further attention.** On 17
August 2026 the endpoint, the API key and all three model names were tested by
calling Moonshot directly, outside Claude Code. All returned `HTTP 200`. **Do not
spend another session re checking the settings file.** The file was never the
problem.

**2. Say what is stale, wrong, or missing in these documents.** Jon asks for this
in the first reply of every session and it is the only mechanism this project has
for catching documentation rot. There is no automation at session boundaries.
None at all.

**3. Then get to section 4, which is the actual work.** Six sessions have
produced a repository, a documentation system and a working Kimi configuration,
and no specification for the tool. That is the gap.

### Done. Do not repeat, do not ask about.

- The GitHub repository exists and is private. Do not offer to create one.
- `.gitignore` is written and its protection of the API key was tested rather
  than assumed, twice, once with the real file present. Do not re-derive it.
- The model is chosen: `kimi-k3` main, `kimi-k2.6` background. Settled with
  reasoning in `04` entry 7.
- Plain local folder, not Docker, not cloud, not a separate user account. Settled
  with a written revisit trigger in `06` row 1. **Do not raise container
  isolation unprompted.**
- The repository was built from scratch rather than copied from Blotter.
- The global permission warning was restored. Settled in `04` entry 8.

### Standing, and it governs everything

- **Nothing outside `~/un-claude` gets read.** `~/Documents/GitHub/Blotter-Claude`
  is named explicitly as off limits in `CLAUDE.md` section 3. It is a separate
  live project.
- **Show real output, never an assertion of correctness.** Jon cannot read code.
  "It works" is worth nothing on its own.
- **Stage by explicit path.** Never `git add -A`, `git add .`, `git commit -a`.
- **No em dashes or en dashes,** in documents or in the tool's own output.
- **Do not push to GitHub without Jon's word.** Committing locally is yours.
- **This is not a test of you.** Nobody is scoring the model. Build the tool.
- **If Jon mentions the model picker, warn him before he uses it.** It still
  shows Anthropic model names in this project. Selecting from it overrides the
  Kimi setting, and it writes the choice into his global settings, which changes
  the default model in his other projects. It is the only route found so far by
  which this project can affect anything outside this folder. Details and the
  partial mitigation are in `07-runbook.md`. To change model, edit
  `.claude/settings.local.json` and restart.

---

## 1. Read these, in this order

1. `CLAUDE.md`
2. This file
3. `docs/04-decision-log.md`
4. `docs/06-assumptions-and-open-questions.md`
5. `docs/05-working-agreement.md`
6. `docs/07-runbook.md`

Jon usually pastes his own reading order at the top of a session. **His list wins
over this one.**

---

## 2. The documentation system. Follow it or the next session loses the thread.

| When you notice | Write it to | With |
|---|---|---|
| A ruling Jon has made | `04-decision-log.md` | the reasoning, not only the outcome |
| A question that is open | `06-assumptions-and-open-questions.md` | a working position, why it is unresolved, and a trigger for revisiting |
| An operational fact learned the hard way | `07-runbook.md` | what went wrong and what to do instead |
| Where to pick up next | this file | rewritten at session end |

**At the moment it happens, not at the end of the session.** A session can end
without warning and everything unwritten is lost.

---

## 3. What session 1 shipped

Setup only. No product work, by design.

- Private repository at `jnachman17-hue/un-claude`, one remote, branch `main`,
  five commits
- `.gitignore`, with the API key protection verified under test
- `CLAUDE.md`: precedence, the data boundary, the verification standard, the
  staging rule, and a statement of what the project is
- `docs/`: this file plus `00`, `04`, `05`, `06`, `07`
- Kimi configured in `.claude/settings.local.json`, gitignored, project local
  only. `kimi-k3` main, `kimi-k2.6` background
- `skipDangerousModePermissionPrompt` removed from global settings

**Everything above was written by Claude, deliberately, so that the rules
governing this project were not authored by the model they govern.** That is
Jon's decision, recorded as `04` entry 3.

---

## 4. Where to pick up

**The next session is the build definition session, and Jon leads it. It has been
the next session since session 1.** Nothing about the tool has been decided in
six sessions. Everything so far has been setup, and setup is finished.

He will bring references and examples and explain what the tool is meant to do.
Right now the entire specification is one sentence: a small tool that rewrites AI
written text so that it reads as though a person wrote it. That is not enough to
build from and it is not meant to be yet.

**Do not start writing code before that specification exists.** Do not propose an
architecture, pick a language, or scaffold a project in the first reply. The
useful thing to do is help Jon get specific.

The two questions that need answers, in order:

1. **What does the tool do, concretely?** Input, output, and where it runs.
2. **What counts as good output?** This is row 4 in `06` and the hardest question
   in the project. A humaniser with no agreed definition of success cannot be
   tested, tuned, or finished. Push on this one.

The output of that session is a build specification, written to `docs/01-` or
similar, plus a working definition of good output. Both are durable documents,
not handoff notes.

---

## 5. Things that will bite you

**Git on this machine is version 2.23, from 2019.** Several modern commands do
not exist. `git init -b main` fails. `git branch -M main` fails on an empty
repository. Workarounds in `07-runbook.md`.

**git's own report about GitHub is not evidence.** The first push printed
`Everything up to date` for commits that had never been pushed. The end state was
correct. When it matters, ask GitHub through `gh api`. See `07-runbook.md`.

**There is no memory between sessions except these files.** No startup hook, no
session log, no crash detection. If a session ends mid task this file will still
describe the last clean state and will not know it is wrong. The true indicators
are `git status` showing uncommitted work and `git log origin/main..main` showing
unpushed commits.

**The Kimi configuration is gitignored,** so it does not travel with the
repository. A fresh clone on another machine runs on Claude.

**There is no permissions allow list, deliberately.** Every command will prompt
Jon. That is the intended state and not a misconfiguration to fix. Entries get
added one at a time as they earn it.

---

## 6. Verification that has earned its place

Entries are added here only after an approach has actually caught or proved
something. This is not a list of good intentions.

**The secret boundary.** Tested, not asserted. A file with a fake key was written
to `.claude/settings.local.json`, `git check-ignore -v` named the matching rule,
`git status` confirmed git could not see it. Re-checked after the real key was
installed. Command in `07-runbook.md`.

**Ask the service, not the tool.** git reported a push as unnecessary when it had
in fact just performed it. GitHub's API settled what was actually there. The
general form: when a claim matters, check it against the system that holds the
truth, not against the tool reporting on it.

**Read the provider's documentation, never the model's memory.** Every Kimi model
identifier recallable from training had been discontinued in May 2026, and
`ANTHROPIC_SMALL_FAST_MODEL` had been deprecated in favour of
`ANTHROPIC_DEFAULT_HAIKU_MODEL`. Both would have produced a broken configuration
Jon had no way to diagnose.

---

## 7. Decisions that are settled. Do not reopen without Jon.

Full reasoning for all eight is in `04-decision-log.md`.

1. Local folder, not Docker, cloud, or a separate user account
2. New repository from scratch, not copied from Blotter
3. The rulebook was written by Claude before Kimi was connected
4. **The project is not a model comparison.** Nobody is scoring you
5. Documentation lives in a flat `docs/` folder
6. One Moonshot API key named `un-claude` under the default project
7. `kimi-k3` main, `kimi-k2.6` background
8. The global permission warning is restored

---

## 8. Open and waiting on Jon

- **What the tool actually does**, in enough detail to build from. Session 2.
- **What counts as good output.** The hardest question in this project.
- Whether `CLAUDE.md` section 3, which bans reading any file outside this folder,
  turns out to be too strict once building starts. Untested.

Full rows with revisit triggers are in `06-assumptions-and-open-questions.md`.

---

## 9. How sessions work

**Jon is not a programmer.** He directs by describing outcomes. He reviews by
looking at the actual thing, never by reading code and never by reading a
description of the thing. For a text tool that means showing him real input text
and real rewritten text, in full, in the session, so he can judge for himself.

**He wants pushback.** Agreeing with a bad plan and executing it well is a
failure. If a premise is wrong, say so before building on it. If an
interpretation of his intent is about to shape a durable document, state the
interpretation back to him in one sentence first. That specific mistake already
happened once in session 1 and is logged in `05` section 6.

**He wants a recommendation, not a menu.** Five options with no position taken is
not help.

**Warn him before the context window fills.** He has asked for this explicitly
and cannot see it coming himself.

**Bad news first, plainly, once.** No extended apology and no self criticism.
State it, fix it, move on.

---

## 10. Sessions so far

**Session 1, 17 August 2026. Claude.** Setup. Prerequisites checked, private
repository created, secret boundary established and tested twice, `CLAUDE.md` and
the full documentation system written, Moonshot account and key created by Jon,
model selected from Moonshot's published list, Kimi configured project local
only, global permission warning restored. Five commits, all pushed. Ran on Claude
by design so that the rules governing this project were not written by the model
they govern.

**Sessions 2 to 5, 17 August 2026. Claude, believing they were Kimi.** Work of
unrecorded scope, carried out in the Claude Code desktop app. Their commits are
in the log. Treat their reasoning as sound and their premise as wrong: anything
any of them said or implied about running on Kimi was false.

**Session 6, 17 August 2026. Claude, and it said so.** Diagnosed the above.
Established by two independent checks that no session had ever reached Moonshot,
proved the configuration itself correct by calling Moonshot directly, established
that the desktop app is the cause and that Terminal works, and closed the
question. Decision 9, row 9 closed, runbook updated, no product work. **The
project can now actually run on Kimi, and has still never been specified.**
