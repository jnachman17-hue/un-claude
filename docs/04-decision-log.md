# un-claude: Decision Log

Every ruling Jon has made, with the reasoning behind it and not only the outcome.

**Append only.** Nothing here is edited away. When a decision is superseded, the
new entry says so and the old entry stays, struck through where it is now wrong.
When an entry turns out to have been factually mistaken, a correction block goes
underneath it rather than replacing it.

Most recent entries are at the bottom.

---

## 17 August 2026, session 1

### 1. The project runs locally, not in a container or the cloud

**Ruling.** Kimi runs against a plain local folder at `~/un-claude`, with the
permission system kept deliberately tight. Not Docker, not a cloud virtual
machine, not a separate macOS user account.

**Reasoning.** Two distinct risks were identified. The first is data: everything
in a session reaches Moonshot's servers. That is bounded by keeping the project
self contained and putting nothing sensitive in it, which is already the rule.
The second is control, and it is the larger one: Claude Code executes whatever
tool calls the model asks for, so the model decides what runs on the laptop, and
the permission prompt is the only wall. Jon cannot read code, so his ability to
evaluate a proposed command is limited.

Isolation was rejected anyway, for a reason that is worth preserving: every
isolation option adds unfamiliar machinery, and when something breaks Jon would
be unable to tell a misconfigured container from a badly behaving model. The
first several sessions are documentation with almost no code execution, so the
risky surface barely exists yet.

Isolation also does not address the constraint Jon named as critical. Keeping
Kimi out of the Blotter project is a matter of where a configuration file sits,
not of which machine the work happens on.

**Consequence.** Recorded as an open row in `06` with a revisit trigger rather
than as a closed question. See that file.

### 2. New repository from scratch, not a copy of Blotter

**Ruling.** `jnachman17-hue/un-claude`, private, built up file by file.

**Reasoning.** Copying Blotter's documentation skeleton would have been faster,
but it carries a `00-START-HERE.md` that had gone stale, three git remotes
including one that must never be pushed to, and content about a product this
project is not building. The cleanup would have cost more than the head start
was worth. Building file by file also means Jon watched every file get written
and has some chance of knowing what is in his own repository.

### 3. The rulebook is written before Kimi is connected

**Ruling.** The repository, `CLAUDE.md` and the whole continuity system are built
and pushed to GitHub while Claude is still the model running the session. Kimi is
connected only afterwards.

**Reasoning.** Jon's phrasing: "Claude builds rulebook, Kimi gets governed on
it." Two supporting reasons. A model that authors the rules that constrain it is
not meaningfully constrained by them. And pushing everything to GitHub before
switching means the worst a local mistake can do afterwards is recoverable.

### 4. The project is not a model comparison

**Ruling.** un-claude is building a text humanising tool. Running on Kimi is a
configuration choice, not the subject of the project. It is not a benchmark, not
an evaluation, and not a comparison against any other model.

**Reasoning.** Jon, directly: "This isn't a test against claude whatsoever."

**Correction this supersedes.** An earlier draft of `CLAUDE.md`, and an explicit
question put to Jon about whether to disclose the comparison to Kimi, were both
written on the mistaken premise that benchmarking was the point. The premise came
from reading the phrase "deliberate side by side test" in Jon's opening brief as
a statement of purpose rather than as a statement about scope. `CLAUDE.md` now
says outright that nobody is scoring the model, so the framing cannot resurface
in a later session. Logged as a failure mode in `05` section 6.

### 5. Documentation lives in a flat `docs/` folder

**Ruling.** `docs/` at the repository root, with Blotter's file numbering scheme
kept identical.

**Reasoning.** Blotter nests its documents inside a `blotter-ib-ws1/` folder,
which was an artifact of a workstream naming convention that does not apply here.
One level shallower makes every reading order shorter. The file numbers are kept
the same so that Jon's familiarity with `04`, `05`, `06` and `07` transfers
without relearning.

### 6. The Moonshot API key uses the default project

**Ruling.** One API key, named `un-claude`, created under Moonshot's `default`
project rather than a new project.

**Reasoning.** Moonshot projects exist to split usage and billing across
unrelated work inside one account. There is one piece of work here. The extra
layer buys nothing and adds a place for a configuration mismatch to hide.

**Worth remembering.** Deleting that key in Moonshot's console is the emergency
stop. It kills all access immediately regardless of what is configured on the
laptop, and requires no terminal commands. It is the one safety control Jon can
operate entirely on his own.

### 7. The model is `kimi-k3`, with `kimi-k2.6` for background work

**Ruling.** `ANTHROPIC_MODEL` is set to `kimi-k3`.
`ANTHROPIC_DEFAULT_HAIKU_MODEL` is set to `kimi-k2.6`.

**Reasoning.** The obvious choice looked like `kimi-k2.7-code`, since the project
builds software and that model is the dedicated coding model. That reasoning was
rejected. The hard part of a text humanising tool is not the code, which will be
simple: read text, call a model, return text. The hard part is judgment about
writing, which is what Moonshot describes `kimi-k3` as being for, namely
"software engineering, knowledge work, and deep reasoning." A coding specialist
tuned for large codebases solves a problem this project does not have.

The cost is that `kimi-k3` is the more expensive model per token. That is bounded
by the spending limit Jon set in Moonshot's console, and the setting is one line
to change if cost becomes a problem.

`kimi-k2.6` handles background work: conversation summarising and other
housekeeping the harness performs without being asked. A cheaper model is correct
for that, and leaving it unset would have been worse than a cost problem. See the
runbook.

**How the model list was established.** By reading Moonshot's own documentation,
not from memory. Every Kimi model this assistant could have named from training
had been discontinued: the `kimi-k2` series was retired on 25 May 2026, as was
K2.5. **Standing consequence: a model identifier produced from memory by any
assistant should be treated as wrong until checked against the provider.**

### 8. The global permission warning is restored

**Ruling.** `"skipDangerousModePermissionPrompt": true` was removed from
`~/.claude/settings.json`.

**Reasoning.** That setting muted the confirmation screen Claude Code shows when
it is launched with its permission system switched off. It does not turn
permissions off by itself, it removes the last confirmation before they go off.
Jon cannot evaluate a proposed shell command by reading it, so the permission
prompt is one of very few safety mechanisms in this project that works without
him understanding code. Muting the warning in front of it made no sense with an
unfamiliar model about to be given shell access.

**Scope note.** This is a global change and therefore affects every project on
the machine, including Blotter. Jon approved it on that basis. It is the only
change made outside `~/un-claude` in this session, and it added nothing: it
removed one line. The global settings file was checked afterwards and confirmed
to contain no model, endpoint or Moonshot configuration of any kind.

---

### 9. This project runs in Terminal, not the Claude Code desktop app

**Ruling.** Sessions for un-claude are started by running `claude` in a Terminal
window from `~/un-claude`. The desktop app is not used for this project.

**Reasoning.** The desktop app does not load the project's `env` block, so it
silently ignores the Kimi configuration and runs on Claude against
`api.anthropic.com`. Sessions 1 through 5 all ran this way, which is why the
Moonshot dashboard read zero the entire time. The command line version loads the
same file correctly. Confirmed by `/status` in Terminal on 17 Aug 2026:

```
Anthropic base URL:  https://api.moonshot.ai/anthropic
Model:               kimi-k3
Setting sources:     User settings, Project local settings
```

**What was ruled out first.** The configuration itself was proved correct by
calling Moonshot directly, outside Claude Code: the endpoint, the API key and all
three model names returned `HTTP 200`. Nothing in
`.claude/settings.local.json` needed changing, and nothing was changed. Quitting
and reopening the desktop app was tried before Terminal, on the theory that it
had not restarted since the settings file was written. It was not that.

**The cost, and why it is accepted.** Jon has to open a Terminal window to work
on this project, which is a real friction for someone who does not use one. It
is accepted because the alternative is abandoning the premise of the project.
Nothing else about how sessions work changes.

**Standing consequence, and it is the important part.** A session running in the
desktop app is running on Claude, no matter what this repository says. The model
picker trap and this one share a shape: **the configuration being correct is not
evidence that it is loaded.** Check `/status` at the start of any session where
it matters.
