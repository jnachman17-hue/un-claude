# un-claude: Runbook

Operational facts about this machine and this project. **Every section here
exists because something was got wrong once, or because it would have been if
nobody had checked.** Do not add speculative entries.

Anything not yet verified is marked **UNVERIFIED** and must not be relied on.

---

## Emergency stop

**What to do, in order:**

1. **Close the terminal window, or the Claude Code window, running the session.**
   This stops the model mid task. Nothing further can be run.
2. **Say no to the permission prompt.** Every command a model wants to run is
   shown to Jon first. Denying it is the routine, non emergency version of the
   same control, and it is the one that matters most day to day.

**There is no single console switch, and that is worth knowing rather than
glossing over.** An earlier plan for this project used an outside model provider,
where deleting one API key on a web page killed all access instantly with no
terminal involved. That was the one safety control Jon could operate entirely
alone. **It does not exist any more and nothing has replaced it exactly.**

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

`.claude/settings.local.json` is listed in `.gitignore` and therefore invisible to
git. **It holds nothing secret today, and the check below still matters,** because
that file is where an API key would land if one is ever added, and because a
changed `.gitignore` is a known way for this protection to vanish silently.

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

## Three lessons from an abandoned setup

**Before this project ran on Claude, it was configured to run on an outside
model provider. That plan was abandoned on 18 August 2026,** decision 11. All the
setup instructions for it have been deleted, because a stale instruction is worse
than no instruction and someone would eventually follow one. **The history is in
the decision log, which is append only. It is not repeated here.**

**Three lessons from it are general and are the reason this section exists.**

**A correct configuration file is not a loaded one.** An entire session ran
against the wrong model while every file on the laptop said otherwise. The
repository said one thing, the settings file said the same thing, and the
provider's own dashboard showed zero usage. Nothing local revealed the gap.
**Verify the running state, not the file on disk.** This applies today to
anything configured and assumed: an environment variable on Vercel, a database
setting, a deployment flag.

**Ask the service, not the tool.** When a claim matters, check it against the
system that actually holds the truth, not against the thing that is supposed to
be reporting it. Calling the provider directly, from outside the tool, is what
located that problem after the tool's own reporting had hidden it.

**A model identifier produced from memory should be treated as wrong until
checked against the provider.** Every model name the assistant could produce from
training had already been discontinued. `04` entry 7.

---

## The boundary has a consequence worth knowing

**Some problems cannot be diagnosed from inside a session at all.** The failure
above is the worked example: its cause lived outside `~/un-claude`, in how the
application started and in global settings.

`CLAUDE.md` section 3 forbids the model from reading anything outside this
folder. **That rule is correct and should stay, but the cost is real: a problem
of this shape has to be resolved with Jon directly, using checks he runs
himself, rather than by having the model go looking.**

---

## A global setting worth knowing about

**Corrected 18 August 2026, session 4. This section said the opposite of what is
true and would have misled Jon about a safety control.**

`~/.claude/settings.json` **no longer contains**
`"skipDangerousModePermissionPrompt": true`. It was removed in session 1, and the
removal is the whole of decision 8 in `04-decision-log.md`. The text here was
never updated and still described the state before that change.

In plain English: Claude Code shows a warning screen if it is ever launched with
its permission system turned off. That setting had muted the warning. It did
**not** turn permissions off by itself, it removed the last confirmation before
they go off. **The warning is now restored, which is the safer state,** and it
matters here because the permission prompt is one of very few safety mechanisms
in this project that works without Jon being able to read code.

**UNVERIFIED as of session 4, and it cannot be verified from inside a session.**
That file sits outside `~/un-claude` and `CLAUDE.md` section 3 forbids reading it.
The statement above rests on decision 8 rather than on a fresh check. **If it
matters, Jon checks it himself.**

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

### A production build fails locally, and it is not your change

**18 August 2026.** `pnpm build` in `apps/web` fails locally with:

```
Failed to collect page data for /cookie-policy
ZodError: Please provide a valid HTTPS URL. Set the variable NEXT_PUBLIC_SITE_URL
```

**Nothing is broken.** The local `.env` carries a non-HTTPS placeholder, and the
production build validates that the site URL is real HTTPS. **Vercel has the
real value set for Production**, so the deployed build is fine.

**To build locally, supply it on the command line:**

```bash
cd ~/un-claude/apps/web && NEXT_PUBLIC_SITE_URL=https://un-claude.com pnpm run build
```

**Why this is worth writing down:** it looks exactly like a build you just broke,
and it appears the first time anyone runs a production build locally rather than
`pnpm dev`.

---

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

## Pushing broke once the kit was added, and how it was fixed

**18 August 2026.** The first push after MakerKit Lite went in failed:

```
error: RPC failed; HTTP 400 curl 22 The requested URL returned error: 400
fatal: the remote end hung up unexpectedly
Everything up-to-date
```

**Nothing reached GitHub.** Confirmed by asking GitHub rather than believing git:
`gh api` reported the latest commit as `f4ec3e8`, eight commits behind local.
**Note that git printed `Everything up-to-date` immediately after failing,** which
is the same misleading message documented earlier in this runbook. It means
nothing either way.

**The cause.** Git's default upload buffer is 1 MB. The repository is 3.3 MB now
that the kit is in it. Git 2.23 from 2019 handles this badly against GitHub and
fails with a bare HTTP 400 rather than anything descriptive.

**The fix, applied to this repository only:**

```bash
git config --local http.postBuffer 524288000
```

**`--local` matters.** It writes to this project's own git config and not to the
machine wide one, so no other project is affected. This was checked after
setting it: local reads back the new value, global remains unset.

The push then succeeded, `f4ec3e8..6739aa7`, verified against GitHub's API, with
`.claude/` on GitHub containing only `launch.json` and not the settings file.

**If a future push fails the same way,** this setting is already in place, so
suspect something else. A large file is the next thing to look at.

---

## Deployment: Vercel and Supabase, set up 18 August 2026

### What exists now

| Thing | Value |
|---|---|
| Vercel project | `un-claude`, id `prj_NXNj8mndsVwoXWQ3xLF5XauXOxMF` |
| Vercel team | `jnachman17-hues-projects` |
| Live URL | `https://un-claude.vercel.app` |
| Root directory | `apps/web`, set because this is a Turborepo monorepo |
| Supabase project | `https://itdgggoxsoolbfiwujvt.supabase.co` |
| Domain | `un-claude.com`. **Not `.net`, which is not registered.** See `04` entry 12a |

**Verified live, not asserted.** `https://un-claude.vercel.app` returns HTTP 200,
`/auth/sign-in` returns HTTP 200, and the home page renders.

### The database security was tested against the live project

Two probes were run against the real Supabase project using the public anon key,
as an anonymous visitor would:

```
GET  /rest/v1/accounts  ->  {"code":"42501","message":"permission denied for schema public"}
POST /rest/v1/accounts  ->  {"code":"42501","message":"permission denied for schema public"}
```

**Anonymous visitors can neither read nor write.** That error is stronger than
Row Level Security. The migration revokes all privileges from everyone at lines
27 to 63, then grants schema access back only to `authenticated` and
`service_role` at lines 77 and 80. Row Level Security at line 124, with policies
at 128 and 136, then restricts logged in users to their own row.

**Re-run those two probes after any migration.** They are cheap and they test the
real thing rather than the intention.

### A Supabase SQL Editor warning that is safe to dismiss

Pasting the migration triggers **"This query creates a table without enabling Row
Level Security."** Supabase scans top to bottom and warns when it sees the table
created, without reading ahead to line 124 where the migration enables it.

**Click "Run without RLS".** The correct choice, because the file enables it
itself. Clicking the green "Run and enable RLS" makes Supabase inject its own
command for something the migration already handles, which is how a database
drifts out of sync with its own migration files.

### Environment variables

Set on Vercel for Production:

| Variable | Sensitivity |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design, ships inside the site's own code |
| `NEXT_PUBLIC_SITE_URL` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret. Entered by Jon directly into Vercel.** Never in the chat, never in the repository |

**The build succeeds without the service role key.** It is read at runtime by
`packages/supabase/src/get-service-role-key.ts`, not at build time, so a missing
one fails admin features rather than the deploy.

### Vercel created a `.env.local` and edited `.gitignore`

`vercel link` writes `.env.local` and appends `.env*` to `.gitignore`. **The
secret boundary was re-checked immediately afterwards,** because a changed
`.gitignore` is now a known way for the protection to vanish:

```
.gitignore:24:.claude/settings.local.json
.gitignore:108:.env*	.env.local
```

Both protected.

---

## Sign up was tested end to end on the live site, 18 August 2026

**It works.** A real account was created at `https://un-claude.com/auth/sign-up`
and the site returned "We sent you a confirmation email." That exercises the
whole chain: browser, Vercel, Supabase, database write, email dispatch.

**A test account exists in the production database:**
`verify-test@un-claude.com`, unconfirmed. **Delete it** in Supabase under
Authentication, then Users. It is left recorded here rather than quietly removed
because a stray account in a production database should never be a surprise.

### Do not use `example.com` for test accounts

The first attempt failed and the cause was the test address, not the app:

```
Email address "unclaude-verify-0818@example.com" is invalid
```

Supabase rejects known placeholder domains. **Use an address at `un-claude.com`
instead.** The domain has no MX records, so nothing is delivered to a real
person, and Supabase accepts it because the domain genuinely exists.

### A real bug in the kit, found by that failure

When Supabase returns an error the kit does not have a canned message for,
**the user is shown the literal text `<DefaultError />`** instead of a readable
sentence.

The cause is in `packages/features/auth/src/components/auth-error-alert.tsx`
around line 37. The component looks up a translation keyed by the raw error text,
and when there is no match it falls back to `defaults={'<DefaultError />'}`,
intended as a placeholder that gets swapped for a real component. **The swap is
not happening, so the placeholder renders as visible text.**

The proper message exists and is unused: `auth.errors.default` in
`apps/web/i18n/messages/en/auth.json` line 72 reads "We have encountered an
error. Please ensure you have a working internet connection and try again."

**Only three errors have canned messages:** invalid credentials, already
registered, and unconfirmed email. **Every other failure shows the placeholder,**
including wrong email format, weak password, and rate limiting. This is a real
user facing defect, not cosmetic. Logged as row 13 in `06`.

### OAuth buttons: listing a provider does not configure it

**18 August 2026.** Jon clicked "Sign in with Google" on the live site and got a
raw JSON error in his face:

```
{"code":400,"error_code":"validation_failed",
 "msg":"Unsupported provider: provider is not enabled"}
```

**The cause.** `apps/web/config/auth.config.ts` shipped with `oAuth: ['google']`.
**That setting only draws the button.** Enabling the provider is a separate job
in the Supabase console, under Authentication then Providers, and it was never
done. The kit's own comment says so and is easy to miss.

**Fixed by emptying the list,** not by configuring Google. Google OAuth needs a
Google Cloud project, a consent screen and a verification review before public
use. Email and password already works.

**The general rule: `oAuth: []` stays empty until a provider is genuinely enabled
in Supabase.** Adding a name to that array without doing the console work puts a
broken button in front of users.

**Verified after deploying,** by fetching both live pages rather than assuming
the deploy did what was intended: zero occurrences of the Google button on
`/auth/sign-up` and `/auth/sign-in`, and all three pages returning HTTP 200.

---

## How to get back to an earlier state

**Every commit is permanent and nothing is ever really lost.** Git keeps a full
snapshot of the project at each commit, and each has an ID like `2895f5a`. The
difficulty is not recovering a state, it is knowing which ID you want. That is
what tags are for.

### Tags: named bookmarks on a snapshot

A **tag** is a permanent, human readable name pinned to one commit. Unlike a
branch, it never moves. On GitHub it appears under the repository's **Tags**
section, next to the branch selector.

**Tags in this project:**

| Tag | Commit | What it marks |
|---|---|---|
| `session-3-end` | `2895f5a` | 18 Aug 2026. Site deployed on `un-claude.com`, humanizer built against the mocked engine, before the handoff documents were rewritten |

### Looking at an old state without changing anything

**On GitHub, no terminal needed.** Open the repository, click the branch
dropdown, choose the **Tags** tab, pick the tag. You are now browsing every file
exactly as it was. **Nothing on the laptop changes.** There is a **Download ZIP**
option under the green Code button if a copy is wanted.

**On the laptop, temporarily:**

```bash
cd ~/un-claude && git checkout session-3-end
```

Every file becomes what it was at that moment. Git prints a warning about a
"detached HEAD", which sounds alarming and is not: it means you are looking at a
snapshot rather than standing on a branch. **Return to the present with:**

```bash
cd ~/un-claude && git checkout main
```

### Actually reverting to an old state

**Two ways, and the difference matters.**

**Undo specific commits, keeping the history.** This is the safe one. It creates
a new commit that reverses the changes, so the record of what happened survives:

```bash
git revert <commit-id>
```

**Move the branch back, discarding what came after.** This throws work away and
should only be run deliberately:

```bash
git reset --hard session-3-end
```

**`--hard` deletes uncommitted work with no warning and no undo.** Run
`git status` first and confirm it prints nothing.

### Making a new tag

```bash
git tag -a <name> -m "what this marks"
git push origin <name>
```

**A tag only exists on GitHub once it is pushed.** A tag made locally and not
pushed is invisible to everyone and gone if the laptop is lost.

---

## The engine, and four things that will waste an hour each

**Added 19 August 2026. Full detail in `apps/web/engine/ENGINE.md`.**

### A healthy site does not mean a working deployment

**On 18 August 2026, `un-claude.com` returned HTTP 200 all day while fourteen
consecutive deployments failed.** It was serving a stale build from before the
failures started. Every commit pushed that day deployed nothing.

**Cause:** `vercel link` had appended `.env*` to `.gitignore`, silently blocking
`apps/web/.env`, which holds fourteen non-secret settings the build requires.

**The standing check.** After any push that matters:

```bash
npx vercel@latest ls | head -3
```

**Look for `Ready`, not for the site answering.** `curl` returning 200 proves a
server is alive, not that your code is on it. **This project has now learned that
lesson three times in three disguises:** a correct config file that was never
loaded, a domain that was never registered, and a deploy pipeline dead for hours
behind a healthy front page.

### Vercel does not put a Python function's own folder on the import path

A function importing a file sitting right beside it fails in production with
`ModuleNotFoundError` while working perfectly locally. **Both functions in
`apps/web/api/` add their own directory and the engine directory to `sys.path`
explicitly, before any local import. Do not remove those lines.**

**Related:** the scan endpoint is called `scan.py` and not `inspect.py` on purpose.
`inspect.py` would shadow Python's built-in `inspect` module, which the engine's
own code imports.

### AI Gateway: a card is not credits

**Adding a payment card unlocks access. Gateway credits are a separate purchase.**
A card alone leaves the account on free credit, and **free credit is rate limited
per model regardless of balance.**

Verified the hard way: with $4.99 of free credit and $0.0135 spent, six concurrent
requests failed, three failed, one at a time with five retries failed, and
eventually **a five word request returned 429.**

**Check the real balance rather than the dashboard:**

```bash
curl https://ai-gateway.vercel.sh/v1/credits -H "Authorization: Bearer $KEY"
```

### In this project the harness is the likely defect

**Eight times in one session a test failed and the fault was the measurement, not
the thing measured.** Invisible characters destroyed by writing them through a
shell command. Two mis-built string comparisons. A check for a file that never
existed. Output sent to `/dev/null`, which fails because the engine writes safely
via a temporary file in the destination folder. Exact-string fact matching that
flagged `thirty-four percent` against `34 percent`. Name matching that failed when
a model shortened `Bergstrom Manufacturing` to `Bergstrom`. And a number extractor
reading `thirty-four` as 30 and 4, which rejected six chunks in eight on entirely
false grounds and nearly got the engine declared broken.

**The rule: the subject matter here is invisible characters, binary file internals
and numbers written two ways. All three are trivially easy to compare wrongly.
Before believing a failure, prove the check itself on a case where you already
know the answer.**

**And specifically: never write invisible characters into a file through a shell
command.** Build them from their code numbers. In Python that means the escape
form. The same applies in TypeScript, so **the site track needs this before it
writes a single test or sample.**

---

## The site build, session 5

### The engine is locked, and how to prove it

Both endpoints now require an `x-uc-key` header matching `UC_ENGINE_KEY`.
**The check fails closed in production:** if the variable is missing on Vercel,
every request is refused rather than allowed. That is deliberate, and it is this
runbook's own lesson applied, that a correct configuration file is not a loaded
one.

**Proving the lock from outside, which is the only proof that counts:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://un-claude.com/api/scan \
  -H "Content-Type: application/json" -d '{"file":"dGVzdA==","name":"paste.txt"}'
```

**401 means locked. 200 means the lock is off and something is wrong.**

**The browser must never call the engine directly.** It calls `/api/tool/scan`
and `/api/tool/clean` on our own site, and those handlers attach the key server
side. The variable has no `NEXT_PUBLIC_` prefix, which is what stops Next.js
shipping it to a browser. **If a component ever fetches `/api/scan` from the
client, the key has to travel with it and the whole lock is undone.**

### The two deployments answer on different paths

**This is not documented anywhere else and `API.md` gets it wrong.**

| Where | Scan | Clean |
|---|---|---|
| **Production**, the Vercel functions in `apps/web/api` | `/api/scan` | `/api/clean` |
| **Local**, the engine's own server | `/inspect` | `/clean` |

`API.md` section 1 documents only `/inspect` and presents it as the contract.
`API.md` section 6 also gives a local run command pointing at
`engine/service/scripts/server.py`, **which does not exist.** The working one is
in `ENGINE.md` section 11:

```bash
cd ~/un-claude/apps/web/engine && python3 server.py --port 8765
```

Both paths are environment variables (`UC_ENGINE_SCAN_PATH`,
`UC_ENGINE_CLEAN_PATH`) so neither is hardcoded in a component.

### The invisible character trap caught this project a third time

**Writing the sample text through a shell heredoc destroyed the escape
sequences,** turning ` ` into a literal invisible character sitting in the
source file. It was caught immediately, by checking the file for literals rather
than trusting it, and the file was rewritten through Python so the **escape
sequences** land in it as text.

**The check that catches it, run it after writing any file containing these:**

```bash
python3 -c "
raw = open('PATH').read()
print([hex(ord(c)) for c in raw if ord(c) in (0x202F,0x200B,0x00A0,0xFEFF)] or 'clean')"
```

**Expected output is `clean`.** Anything else means literal invisible characters
are in the source and the escapes were eaten.

### Simple Icons has no OpenAI mark

Checked 19 August 2026. `anthropic`, `googlegemini`, `githubcopilot`, `meta`,
`mistralai`, `perplexity` and `deepseek` all return 200. **`openai` returns 404,
along with every variant tried.** It was removed, which is itself a signal about
how that trademark is enforced.

**Consequence:** the "which AI wrote this" selector ships with names and no
logos, because a logo row missing the second most important brand looks broken.
`06` row 34 requires Jon's approval before any logo file is fetched anyway.

### The Browser preview pane stops painting

**It renders blank while reporting correct geometry.** Screenshots came back with
the tool missing while the DOM reported the element present, positioned, and at
full opacity, and `get_page_text` returned all of its content correctly.

**Do not diagnose a layout bug from a blank screenshot.** Measure the DOM first.
The mobile layout in this session was verified by measurement, not by eye, and
that was recorded as such rather than claimed as a visual check.
