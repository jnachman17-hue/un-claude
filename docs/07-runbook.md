# un-claude: Runbook

Operational facts about this machine and this project. **Every section here
exists because something was got wrong once, or because it would have been if
nobody had checked.** Do not add speculative entries.

Anything not yet verified is marked **UNVERIFIED** and must not be relied on.

---

## Emergency stop

**Corrected 18 August 2026 when Kimi was retired. The old instruction below no
longer works and would waste time in an actual emergency.**

**What to do now, in order:**

1. **Close the terminal window, or the Claude Code window, running the session.**
   This stops the model mid task. Nothing further can be run.
2. **Say no to the permission prompt.** Every command a model wants to run is
   shown to Jon first. Denying it is the routine, non emergency version of the
   same control, and it is the one that matters most day to day.

**There is no longer a single console switch.** The old stop was deleting the
Moonshot API key, which killed all access instantly from a web page, with no
terminal needed. That control is gone because Moonshot is no longer in the path,
and nothing has replaced it exactly. **This is a real reduction in safety and it
is recorded here rather than glossed over.**

~~**Delete the API key in Moonshot's console.** Access dies immediately,
regardless of what is configured on the laptop. No terminal commands are needed
and Jon can do it alone.~~

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
earlier claim that it could not was wrong. See the third entry below.**

**`/status`, typed by Jon inside Claude Code.** It reports the provider, base URL
and proxy for that session. A slash command is typed by the user and cannot be
invoked by a model, so a model claiming to have run it has not. Confirmed
available in Terminal on 17 August 2026. Whether it exists in the desktop app no
longer matters here, because this project is always started from Terminal. See
the desktop app section below.

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
fails silently in the same way. Everything looks configured, and nothing is.
**"I checked the settings file and it is correct" is not evidence that a session
is running on Kimi.** Only the dashboard and the environment check are.

### The cause, confirmed: the desktop app

Jon runs these sessions in the **Claude Code desktop app**, not by typing
`claude` in Terminal. The desktop app signs in with an Anthropic account and
appears to supply its own credentials and address, overriding the project's
`env` block. The supporting detail is that `ANTHROPIC_BASE_URL` was not merely
missing, it was actively set to `https://api.anthropic.com`. Something set it.

**RESOLVED the same day.** Restarting the desktop app was tried first, on the
theory that it had not restarted since the settings file was written. It made no
difference. Running `claude` in a Terminal window from `~/un-claude` worked
immediately. `/status` in that session reported:

```
Anthropic base URL:  https://api.moonshot.ai/anthropic
Model:               kimi-k3
Setting sources:     User settings, Project local settings
```

**The rule: start this project with `cd ~/un-claude && claude` in Terminal.**
The desktop app does not load the project `env` block and will run on Claude no
matter what this repository says. Recorded as decision 9 in `04-decision-log.md`.

### Starting a session, and the check that takes five seconds

```bash
cd ~/un-claude && claude
```

Then type `/status` and read two lines: **Anthropic base URL** must say
`api.moonshot.ai`, and **Model** must say `kimi-k3`. If either says anything
else, the session is not on Kimi and nothing it does counts as work on this
project until that is fixed.

`/status` is available in Terminal, which retires the UNVERIFIED note above about
whether it exists. It reads configuration rather than asking the model what it
is, so it is real evidence, but it is still Claude Code describing itself. The
Moonshot dashboard remains the authority.

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
Confirmed working on 17 August 2026 by calling Moonshot directly from this
machine, outside Claude Code. All three configured models answered `HTTP 200`.
See the verified section above.

The API key for this project is named `un-claude` and sits under Moonshot's
`default` project.

Set a spending limit at `platform.moonshot.ai/console/limits`. This is
pay as you go, not a subscription.

---

## The stack, installed 18 August 2026

The product is built on **MakerKit Lite**, the free MIT licensed Next.js and
Supabase starter kit, merged into the root of this repository. Reasoning and the
rejected alternatives are in `04-decision-log.md` entry 14.

### How to run the site locally

```bash
cd ~/un-claude && pnpm dev
```

Then open `http://localhost:3000`. **Verified working 18 August 2026.** Next.js
reported `Ready in 307ms`, and the home page, the feature sections, the footer,
the legal pages and the sign in screen all rendered.

To stop it, press `Ctrl` and `C` in the terminal running it.

### Docker is required for accounts, and is not installed

Supabase runs locally inside Docker, which is a tool for running software in
self contained boxes on your own machine. **Docker is not installed on this
machine.** `docker --version` returns `command not found`.

**What still works without it:** the entire public site. Home page, marketing
sections, footer, legal pages, and the sign in and sign up screens all render.

**What does not:** actually creating an account, signing in, or storing anything.
Those need the database, and the database needs Docker.

**This is not urgent.** Deploying a placeholder site to Vercel uses Supabase's
hosted service, not the local one, so Docker is only needed for offline
development. Installing it requires Jon's approval under `CLAUDE.md` section 5.

### Versions confirmed at install time

| | Version | Kit requires |
|---|---|---|
| Node | v24.15.0 | >= 22.13.0 |
| pnpm | 11.20.0 | 11.18.0 |
| Next.js | 16.3.0 | current stable is 16.3.1 |

The install took 68 seconds and pulled 850 packages. The kit runs its own
requirements check on install, and it passed.

### Two things were changed in the downloaded kit, deliberately

**`.mcp.json` was deleted.** The kit shipped a file that instructs Claude Code to
automatically download and run `next-devtools-mcp@latest` from the internet at
the start of every session, always fetching the newest version. Nothing in this
project needs it, and an auto updating remote package that runs without being
asked is exactly what `CLAUDE.md` section 5 exists to prevent. **If a future
session finds this file has reappeared, delete it again.**

**The `.gitignore` files were merged rather than replaced.** This project's own
rules were kept as the priority, and only the kit's build artefact rules were
appended. This mattered: the kit's `.gitignore` does not protect
`.claude/settings.local.json`, so replacing ours with theirs would have silently
exposed a secrets file.

**The secret boundary was re-verified immediately after the merge,** not assumed:

```
$ git check-ignore -v .claude/settings.local.json
.gitignore:24:.claude/settings.local.json	.claude/settings.local.json
```

**Re-run that check after any future change to `.gitignore`.** A starter kit
overwriting it is now a known way for the protection to disappear.

### The env files that arrived with the kit are not secrets

`apps/web/.env.development` contains a Supabase URL and two long keys. They look
alarming and are not. They are Supabase's published demo keys, identical on every
local Supabase install worldwide, and they only unlock a database on
`127.0.0.1`, meaning this laptop and nothing else. **Real keys, when the hosted
Supabase project exists, go in `.env.local`, which is gitignored.**

---

## Kimi is retired. What that means for the sections above

**As of 18 August 2026 this project is built with Claude Code on Claude.** Jon's
instruction, decision 11 in `04-decision-log.md`.

**The emergency stop has changed.** Deleting the Moonshot API key no longer stops
anything, because Moonshot is no longer in the path. There is now no single
console switch Jon can throw. **The working equivalents are closing the terminal
window, and denying the permission prompt when a command is proposed.**

**Everything above about Moonshot, the Kimi model names, the environment check
and the model picker trap is kept as history, not as instructions.** Two lessons
in it remain true and general, and are the reason none of it was deleted:

- **A correct configuration file is not a loaded one.** Verify the running state,
  not the file on disk.
- **Ask the service, not the tool.** When a claim matters, check it against the
  system that holds the truth.

**The Terminal rule is void.** Decision 9 required starting sessions from
Terminal, purely because the desktop app would not load the Kimi settings. With
Kimi gone that reason is gone, and the desktop app is fine.
