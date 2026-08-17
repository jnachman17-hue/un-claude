# un-claude: Current Handoff

**Date:** 17 August 2026, session 1
**Status:** Setup complete through the documentation layer. Kimi configuration in
progress. No product work has started.

**This file holds resumption context only.** It is rewritten wholesale at the end
of every session. Nothing may live here as its only record. If a decision matters
beyond the next session, it belongs in `04-decision-log.md`.

---

## 0. Act on these before anything else

### Due now

**Nothing is due yet.** Session 2 is the build definition session. Jon will bring
references and examples and explain what the tool is meant to do. Until he has,
there is no product work to pick up.

**In your first reply of session 2, say whether anything in these documents is
stale, wrong, or missing.** Jon asks for this explicitly and it is the only
mechanism this project has for catching documentation rot. There is no automation
at session boundaries. None.

### Done, do not repeat, do not ask about

- The GitHub repository exists and is private. Do not offer to create one.
- `.gitignore` is written and its protection of the API key was tested, not
  assumed. Do not re-derive it. To re-check, see `07-runbook.md`.
- The choice of a plain local folder over Docker, a cloud machine, or a separate
  user account is settled with a written revisit trigger. Do not reopen it, and
  do not raise container isolation unprompted.
- The repository was built from scratch rather than copied from Blotter. Settled.
- This project is not a benchmark against another model. Nobody is scoring you.
  Do not treat any instruction here as a test.

### Standing, and it governs everything

- **Nothing outside `~/un-claude` gets read.** `~/Documents/GitHub/Blotter-Claude`
  is named explicitly as off limits in `CLAUDE.md` section 3.
- **Show real output, never an assertion of correctness.** Jon cannot read code.
  If you say it works, that statement is worth nothing on its own.
- **Stage files by explicit path.** Never `git add -A`, `git add .`, or
  `git commit -a`.
- **No em dashes or en dashes**, in documents or in the tool's own output.

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

Setup only. No product work.

- Private GitHub repository at `jnachman17-hue/un-claude`, one remote, branch
  `main`
- `.gitignore`, with the API key protection verified under test rather than
  assumed
- `CLAUDE.md`: precedence, the data boundary, the verification standard, the
  staging rule, and a statement of what the project is
- `docs/`: this file plus `00`, `04`, `05`, `06`, `07`
- Kimi configuration: **in progress at the time of writing**

---

## 4. Where to pick up

**Session 2 is the build definition session.** Jon defines what the tool does,
supplies references and examples, and explains the intent. The output of that
session is a build specification written to `docs/01-` or similar, plus a
definition of what counts as good output.

Do not start writing code before that specification exists. Item 4 in
`06-assumptions-and-open-questions.md`, what counts as good output, is the
hardest question in this project and the one that decides whether it works.

---

## 5. Things that will bite you

**Git on this machine is version 2.23, from 2019.** Several modern commands do
not exist. `git init -b main` fails. `git branch -M main` fails on an empty
repository. See `07-runbook.md`.

**There is no memory between sessions except these files.** No startup hook, no
session log, no crash detection. If a session ends mid task, this file will still
describe the previous clean state and will not know it is wrong. The true
indicators of an interrupted session are `git status` showing uncommitted work
and `git log origin/main..main` showing unpushed commits.

**The Kimi configuration is gitignored,** which means it does not travel with the
repository. A fresh clone on another machine runs on Claude, not Kimi.

---

## 6. Verification that has earned its place

Only one entry so far, because only one thing has been verified.

**The secret boundary.** Not asserted, tested: a file with a fake key was written
to `.claude/settings.local.json`, `git check-ignore -v` named the matching rule,
`git status` confirmed git could not see the file, and the fake file was removed.
The re-check command is in `07-runbook.md`.

Entries get added here only after a verification approach has actually caught
something or proved something. This is not a list of good intentions.

---

## 7. Decisions that are settled. Do not reopen without Jon.

All six are recorded with full reasoning in `04-decision-log.md`.

1. Local folder, not Docker or cloud or a separate user account
2. New repository from scratch, not copied from Blotter
3. The rulebook is written by Claude before Kimi is connected
4. The project is not a model comparison
5. Documentation lives in a flat `docs/` folder
6. One Moonshot API key named `un-claude` under the default project

---

## 8. Open and waiting on Jon

- **What the tool actually does**, in enough detail to build from. Session 2.
- **What counts as good output.** The hardest question here.
- **Which Kimi model variant** to configure, decided by reading Moonshot's
  console rather than from memory.

Full rows with revisit triggers are in `06-assumptions-and-open-questions.md`.

---

## 9. How sessions work

**Jon is not a programmer.** He directs by describing outcomes. He reviews by
looking at the actual thing, not by reading code and not by reading a description
of the thing. For a text tool that means showing him real input text and real
rewritten text, in full, in the session.

**He wants pushback.** Agreeing with a bad plan and executing it well is a
failure. If a premise is wrong, say so before building.

**He wants a recommendation, not a menu.** Five options with no position taken is
not help.

**Warn him before the context window fills.** He has asked for this explicitly
and cannot see it coming himself.

**Bad news first, plainly, once.** No extended apology and no self-criticism.

---

## 10. Sessions so far

**Session 1, 17 August 2026.** Setup. Repository created, secret boundary
established and tested, `CLAUDE.md` and the full documentation system written,
Kimi configuration begun. Run on Claude by design, so that the rules governing
the project were not written by the model they govern.
