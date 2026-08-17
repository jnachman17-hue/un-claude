# un-claude: Runbook

Operational facts about this machine and this project. **Every section here
exists because something was got wrong once, or because it would have been if
nobody had checked.** Do not add speculative entries.

Anything not yet verified is marked **UNVERIFIED** and must not be relied on.

---

## Emergency stop

**Delete the API key in Moonshot's console.** Access dies immediately, regardless
of what is configured on the laptop. No terminal commands are needed and Jon can
do it alone.

This is the only safety control in the project that does not depend on reading or
understanding anything. If something is going wrong and it is not obvious what,
this is the correct first move, and a new key takes a minute to create afterwards.

---

## Git on this machine is old, and it matters

`git --version` reports **2.23.0**, the version Apple ships with macOS. It dates
from 2019. Two consequences have already been hit:

**`git init -b main` does not work.** The `-b` flag was added in git 2.28. Use
`git init` on its own.

**`git branch -M main` fails on a brand new empty repository,** with
`error: refname refs/heads/master not found`. This is not a fault. In this
version the `master` branch does not exist as a real reference until the first
commit is made, so there is nothing to rename yet. Two ways round it:

- Before any commit: `git symbolic-ref HEAD refs/heads/main`
- After the first commit: `git branch -M main` works normally

This project used the first option, so `main` was the branch name from the root
commit onward.

**The first `git push -u origin main` printed `Everything up-to-date`,** which is
what git says when there was nothing to send. That was misleading, not wrong
about the outcome. Investigated on 17 August 2026 rather than assumed: GitHub's
own API confirmed all three commits and all eight files were present, the reflog
showed exactly one `update by push` event timestamped at the moment the command
ran, `.git/hooks/` contained only inert `.sample` files, and no push
configuration beyond `push.default simple` was set.

**Conclusion: nothing on this machine pushes automatically.** The message is a
quirk of this old git version reporting on the tracking setup phase rather than
the transfer. Publishing remains a deliberate act.

**The general lesson, which is the reason this is written down:** git's own
report on what reached GitHub is not evidence. When it matters, ask GitHub:

```
gh api repos/jnachman17-hue/un-claude/commits --jq '.[] | .sha[0:7]'
gh api repos/jnachman17-hue/un-claude/contents --jq '.[].path'
```

---

## GitHub access

The `gh` command line tool is installed (version 2.96.0) and authenticated as
**jnachman17-hue**, over HTTPS, with token scopes `gist`, `read:org`, `repo` and
`workflow`. The `repo` scope is what allows repository creation.

The repository is **https://github.com/jnachman17-hue/un-claude**, private, with
a single remote named `origin`.

Unlike the Blotter project, there is **one remote only**. There is no upstream
and no organisation fork, so there is no remote here that must never be pushed
to.

---

## The secret boundary, and how to re-check it

The Moonshot API key lives in `.claude/settings.local.json`, which is listed in
`.gitignore` and therefore invisible to git.

**This was verified rather than assumed** on 17 August 2026. A file containing a
fake key was written to that path. `git check-ignore -v` reported that rule
`.gitignore:24` matched it. `git status` showed git could not see the file at
all. The fake file was then deleted.

To re-check it at any point, run this from inside the project folder:

```
git check-ignore -v .claude/settings.local.json
```

Expected output is a line naming `.gitignore` and the rule that matched. **If it
prints nothing, the protection is gone and nothing should be committed until it
is fixed.**

---

## Claude Code settings, and where the Kimi configuration must live

Claude Code merges settings across several layers. For this project the Kimi
configuration belongs in **one place only**:

`~/un-claude/.claude/settings.local.json`

It must **not** go in `~/.claude/settings.json`, which applies to every project
on the machine, and must **not** be set as a shell export, because a shell
variable takes precedence over the settings file and would apply everywhere.

**Baseline recorded 17 August 2026, before any change was made.** At that moment
the machine was clean: no `ANTHROPIC_*` exports in `.zshrc`, `.bash_profile`,
`.bashrc`, `.zprofile` or `.profile`, and no `env` block of any kind in the
global `~/.claude/settings.json`.

To re-check that nothing has leaked, from anywhere:

```
grep -n -i "ANTHROPIC" ~/.zshrc ~/.bash_profile ~/.bashrc ~/.zprofile ~/.profile
```

Expected output is nothing at all.

### The configuration actually in place

Installed 17 August 2026. The token value is redacted here and must never be
written into any file that git can see.

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "REDACTED, 51 characters, sk- prefix",
    "ANTHROPIC_MODEL": "kimi-k3",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k2.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2.7-code",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-k3",
    "ANTHROPIC_DEFAULT_FABLE_MODEL": "kimi-k3"
  }
}
```

**The last three exist only as a safety net.** See the model picker section below.

**There is no `permissions` block, deliberately.** Blotter accumulated an allow
list over thirteen sessions of earned trust. This project starts at zero, so
every command prompts. Entries get added one at a time as they prove themselves,
never copied across in bulk.

### Three things confirmed from Claude Code's documentation, not from memory

**`ANTHROPIC_SMALL_FAST_MODEL` is deprecated.** It has been replaced by
`ANTHROPIC_DEFAULT_HAIKU_MODEL`, which sets the model used for the `haiku` alias
and for background functionality. Any guide or assistant recommending the old
name is out of date.

**Leaving the background model unset is a real failure, not a cost issue.**
Claude Code performs housekeeping such as conversation summarising on its own. If
that variable is unset while `ANTHROPIC_BASE_URL` points at Moonshot, the harness
asks Moonshot for a Claude model, which does not exist there.

**Behind a custom `ANTHROPIC_BASE_URL`, Claude Code does not validate model
names.** The provider defines them, so any string is passed straight through. A
typo in `kimi-k3` is not caught at startup. It fails on the first request with an
error about the selected model.

### The model picker is a trap in this project. Warn Jon if he reaches for it.

Claude Code's model picker, reachable through `/model` or the control in the
corner of the window, still displays Anthropic model names in this project. It
looks completely ordinary. Selecting from it does two harmful things.

**It overrides the Kimi setting.** The documented priority order for choosing a
model is, highest first: `/model` during a session, then `--model` at launch,
then the `ANTHROPIC_MODEL` environment variable, then the `model` field in a
settings file. The picker sits above `ANTHROPIC_MODEL`, so a selection wins.
Behind a custom `ANTHROPIC_BASE_URL` no validation happens, so a Claude model
identifier is passed straight to Moonshot and fails on the next message with no
warning at startup.

**It writes to the global settings file.** `/model` saves the selection as the
default for new sessions by writing the `model` field into user settings. A
selection made inside this project therefore changes the default model in every
other project on this machine, Blotter included. **This is a route by which this
project can affect Blotter, and it is the only one found so far.** It does not
carry Kimi across, but it does change something outside this folder.

**Mitigation in place, and its limits.** `ANTHROPIC_DEFAULT_OPUS_MODEL`,
`ANTHROPIC_DEFAULT_SONNET_MODEL` and `ANTHROPIC_DEFAULT_FABLE_MODEL` are set to
Kimi models so that an accidental selection of a family alias lands somewhere
that works rather than somewhere broken. **This does not make the picker safe.**
It bounds one of the two problems and does nothing about the write to global
settings, and it does not cover selecting a full Claude model name directly.

**The rule: do not use the model picker in this project.** To change the model,
edit `.claude/settings.local.json` and restart.

### Settings precedence, confirmed

Highest to lowest: managed settings, command line arguments,
`.claude/settings.local.json`, `.claude/settings.json`, then the global
`~/.claude/settings.json`.

**This is why the constraint works.** Project local settings override the global
file, so Kimi applies to this project and nothing else. A shell export would
apply everywhere, which is why one was never used.

### How to check which model a session is actually running

**Three checks. Two belong to Jon. The third the model can perform, and the
earlier claim that it could not was wrong — see the third entry below.**

**`/status`, typed by Jon inside Claude Code.** It reports the provider, base URL
and proxy for that session. A slash command is typed by the user and cannot be
invoked by a model, so a model claiming to have run it has not. **UNVERIFIED:**
whether `/status` is available in the desktop app is not known. Some slash
commands open an interactive terminal panel that the desktop app does not offer.
If it is unavailable, use the second check, which is better anyway.

**The Moonshot usage dashboard at `platform.moonshot.ai`.** If token usage climbs
after a few exchanges, requests are genuinely reaching Moonshot. If it sits at
zero, they are not. **This is the check that cannot lie,** because the evidence
comes from the provider being paid rather than from the tool making the claim.
It is also the only one of the two Jon can perform without any terminal at all.

**The environment check, which the model can run.** This one command prints the
address the session is actually pointed at:

```bash
echo "BASE_URL=[${ANTHROPIC_BASE_URL:-unset}] MODEL=[${ANTHROPIC_MODEL:-unset}]"
```

On a session correctly running Kimi this prints the Moonshot address. On a
session running Claude it prints `https://api.anthropic.com`. **This is stronger
than self description, because it reads configuration rather than instructions,
and it costs one command.** It is still weaker than the dashboard: it reads the
environment of a command the model ran, which is normally but not provably the
same environment its own requests travel through. Use it as the fast check and
the dashboard as the authority.

**Asking the model what it is still proves nothing.** It sits inside a harness
full of Anthropic branding, reading a file called `CLAUDE.md`, and may sincerely
answer that it is Claude. Self description reports instructions, not
configuration. The environment check above is not self description.

---

## Verified on 2026-08-17: the Kimi setup is correct, and it was still not running

Confirmed by Jon's Moonshot dashboard reading zero, and independently by the
environment check above returning `https://api.anthropic.com`. Two independent
checks, same answer: **no session of this project had ever reached Moonshot.**

### What was proved good, by direct test

The key and address in `.claude/settings.local.json` were used to call Moonshot
directly, going around Claude Code entirely. All three configured models
answered `HTTP 200`, and `kimi-k2.7-code` returned the requested word. This
retires three items previously marked UNVERIFIED in this runbook:

| Previously unverified | Now |
|---|---|
| Whether `https://api.moonshot.ai/anthropic` is the right address | **Confirmed working** |
| Whether the `un-claude` API key is valid | **Confirmed working** |
| Whether `kimi-k3`, `kimi-k2.7-code`, `kimi-k2.6` are real model names | **All three confirmed real** |

**Nothing in the configuration file is wrong.** Do not spend another session
rewriting it, re-checking the key, or second-guessing the model names.

### The trap: a correct configuration file is not an active one

The whole failure was that **Claude Code never read the file.** The settings sat
on disk, complete and correct, and the program ignored them.

This is a distinct failure from the model picker trap recorded above, and it
fails silently in the same way — everything looks configured, and nothing is.
**"I checked the settings file and it is correct" is not evidence that a session
is running on Kimi.** Only the dashboard and the environment check are.

### The suspected cause: the desktop app

Jon runs these sessions in the **Claude Code desktop app**, not by typing
`claude` in Terminal. The desktop app signs in with an Anthropic account and
appears to supply its own credentials and address, overriding the project's
`env` block. The supporting detail is that `ANTHROPIC_BASE_URL` was not merely
missing, it was actively set to `https://api.anthropic.com`. Something set it.

**UNVERIFIED, and this is the open question:** whether the desktop app ignores
the project `env` block by design, or whether it simply had not been restarted
since the settings file was created. Test the cheap possibility first.

1. **Fully quit the desktop app** — Cmd+Q, not just closing the window — reopen
   it, start a session in this folder, exchange a few messages, and look at the
   dashboard. Settings are read at startup, so an app running since before the
   file existed would never have seen it.
2. **If that fails, run `cd ~/un-claude && claude` in Terminal** and repeat. The
   `env` override is a documented Claude Code CLI behaviour; the CLI is the
   surface most likely to honour it.

### A boundary consequence worth knowing

The cause of this problem lives outside `~/un-claude`, in how the app launches
and in global settings. `CLAUDE.md` section 3 forbids the model from reading
anything outside this folder. **That rule is correct and should stay, but it
means launch problems of this kind cannot be diagnosed from inside a session.**
Expect to resolve them with Jon directly, using the checks above, rather than by
having the model go looking.

---

## A global setting worth knowing about

`~/.claude/settings.json` contains `"skipDangerousModePermissionPrompt": true`.

In plain English: Claude Code normally shows a warning screen if it is ever
launched with the permission system turned off. On this machine that warning is
muted. It does **not** mean permissions are off. It means the last confirmation
step before turning them off has been removed.

---

## Moonshot

Use **`platform.moonshot.ai`**, the global platform. There is a separate
mainland China platform at `platform.moonshot.cn` with different accounts,
different keys and a different API endpoint. A key from one does not work with
the other.

The Anthropic compatible endpoint is `https://api.moonshot.ai/anthropic`.
**UNVERIFIED:** this address came from Jon's brief and has not yet been tested
from this machine. It gets confirmed the first time a session runs on Kimi.

The API key for this project is named `un-claude` and sits under Moonshot's
`default` project.

Set a spending limit at `platform.moonshot.ai/console/limits`. This is
pay as you go, not a subscription.
