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
