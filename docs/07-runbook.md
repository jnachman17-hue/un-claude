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

### Google sign in cannot be tested by pasting a URL, and the failure is silent

**19 August 2026, session 6.** With the Google console work done and the provider
enabled in Supabase, the flow was tested by pasting this into a browser:

```
https://itdgggoxsoolbfiwujvt.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://un-claude.com/auth/callback
```

**Google's consent screen appeared, the account was chosen, and the browser came
back to `un-claude.com` showing the email and password sign in form. Not signed
in. No error message anywhere.**

**The configuration was not at fault. The test was.** The assistant proposed this
method to avoid shipping a button in order to test it, which was the right goal
and the wrong mechanism.

**Why it cannot work.** The site uses PKCE, a scheme where the browser invents a
one-time secret at the start of sign in and the server needs that same secret at
the end to complete it. The button creates that secret. A pasted URL does not.
With no secret in play, Supabase returns the session in the part of the URL after
the `#`, and **browsers never send that part to the server**, so the callback
route receives nothing at all.

**Why it fails silently rather than erroring.** In
`packages/supabase/src/auth-callback.service.ts`, `exchangeCodeForSession` acts
only if a `code` or an `error` parameter is present. With neither, it falls
through to its final `return` and forwards the user to `/home` with no session.
`/home` is protected, so the middleware bounces them to the sign in page. **There
is no error path for "nothing arrived", so nothing is reported.** Proven live:

```
/auth/callback  → 307 → /home
/home           → 307 → /auth/sign-in?next=/home
```

**How to test it instead: run the button locally. No deploy, no Google change.**

1. Add `http://localhost:3000/**` to Supabase, Authentication, URL Configuration,
   Redirect URLs.
2. Set `oAuth: ['google']` in `apps/web/config/auth.config.ts` **without
   committing it.**
3. `pnpm dev`, open `http://localhost:3000/auth/sign-in`, click the real button.

**Google needs no configuration for this.** Proven from the live redirect below:
the address Google is given is always the Supabase one, never the site's. Local
development, Vercel previews and production are identical as far as Google is
concerned, and only Supabase's redirect allow list has to know about them.

**The one command that shows the whole Google configuration at once,** without a
browser and without signing in to anything:

```
curl -s -o /dev/null -w '%{redirect_url}\n' \
  "https://itdgggoxsoolbfiwujvt.supabase.co/auth/v1/authorize?provider=google"
```

A correctly configured project answers with a `accounts.google.com` address
carrying `client_id`, `redirect_uri=https://itdgggoxsoolbfiwujvt.supabase.co/auth/v1/callback`
and **`scope=email profile`**. An unconfigured one answers with
`{"code":400,...,"msg":"Unsupported provider: provider is not enabled"}`.
**That `scope` value is the whole verification question and it is worth reading
every time:** see `06` row 41.

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

---

## The overnight build session, and a bug worth remembering

### The engine crashed on every short rewrite, and had done since it was written

**`uc_chunk.rewrite_long` called `one(0)` six lines before `one` was defined.**
Python treats `one` as a local name in that function, so it was not yet assigned
and the call raised `UnboundLocalError`. The engine caught it, reported only the
exception type, and the failure surfaced as `layer B rewrite failed:
UnboundLocalError` with no clue where it came from.

**A single chunk is roughly 350 words, so this broke every document shorter than
that: very nearly every paste a visitor makes into the box on the landing page.**

**Why it was not caught in session 4:** the documents used to prove layer B were
all long enough to split into several chunks, which takes the other code path.
**A feature proved only on large inputs was completely broken on small ones.**

### The Browser preview pane degrades, and it manufactures fake bugs

**Recorded again, harder, because it cost real time in this session.** The pane
reached a state where the page rendered server HTML but never hydrated: clicks did
nothing, effects never ran, and the tool sat at its initial state forever. The
console showed no error, every chunk returned 200, and `git`-level checks all
passed.

**About forty minutes went into diagnosing an application bug that did not exist.
Opening a fresh tab showed the app working perfectly.**

**The rule: before diagnosing a front end bug, reproduce it in a NEW tab.** If a
fresh tab behaves, the pane is the defect. Symptoms to recognise: blank
screenshots of elements the DOM reports as present and full opacity; clicks that
do nothing; stale console errors naming files that no longer exist.

**A code comment was written blaming a bug that was never confirmed, and it was
corrected once the real cause was known.** Do not leave a diagnosis in the source
that the evidence did not support.

### Reading state from outside the app

The tool's root carries `data-phase`. Use it rather than inferring state from a
screenshot:

```js
document.querySelector('[data-phase]').dataset.phase
```

**This project's own record is eight measurement errors in one session.** A stable
way to ask the application what it is doing is worth more than a picture of it.

### The engine key, and the whitespace that broke it

**19 August 2026.** The key went onto Vercel correctly, the deployment said
`Ready`, and the lock worked: unauthenticated calls to `/api/scan` and
`/api/clean` were refused. **But the site could not call its own engine either.**

**Both halves read the same variable from the same project, so the value itself
had to differ.** The cause is whitespace. `openssl rand -hex 32` prints a trailing
newline. A value pasted with one is stored with one. **An HTTP header cannot carry
a newline, so the sending side drops it and the receiving side keeps it, and the
two never match.** Nothing in either log said so, because a wrong key and a
missing key produced the same 401.

**Both sides now `.strip()` and both log the LENGTH of the key they hold, never
the value.** The engine also says explicitly when no key is configured at all.

**The general rule: any secret that is copied by hand should be trimmed at both
ends of the comparison.** The failure it prevents is invisible in a dashboard,
which is exactly the kind this project cannot afford.

### Verifying the lock from outside, the full set

Run after any deployment that touches the engine or its key.

```bash
cd ~/un-claude && python3 - <<'PY'
import base64, json, urllib.request, urllib.error
def post(url, body, headers=None):
    h = {'Content-Type': 'application/json'}
    if headers: h.update(headers)
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=45); return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except Exception: return e.code, {}
s = 'The quarterly figure was' + chr(0x202F) + '18 percent' + chr(0x200B) + ' higher.'
p = {'file': base64.b64encode(s.encode()).decode(), 'name': 'paste.txt'}
print('no key      ', post('https://un-claude.com/api/scan', p)[0], 'expect 401')
print('wrong key   ', post('https://un-claude.com/api/scan', p, {'x-uc-key': 'nope'})[0], 'expect 401')
print('paid, no key', post('https://un-claude.com/api/clean', {**p, 'options': {'layer_b': True}})[0], 'expect 401')
print('via the site', post('https://un-claude.com/api/tool/scan', p)[0], 'expect 200')
print('layer B gate', post('https://un-claude.com/api/tool/clean', {**p, 'layer_b': True})[0], 'expect 503')
PY
```

**All five must match.** The fourth is the one that matters most: three 401s alone
prove only that something is refusing everyone, which is also what a completely
broken engine looks like.

### Layer B in production, and how to turn it off

**On as of 19 August 2026,** `UC_ENABLE_LAYER_B=true`, Production only.

```bash
npx vercel@latest env rm UC_ENABLE_LAYER_B production   # then redeploy
```

**Watch the balance rather than the dashboard:**

```bash
cd ~/un-claude && KEY=$(grep '^AI_GATEWAY_API_KEY=' .env.engine.local | cut -d= -f2) \
  && curl -s https://ai-gateway.vercel.sh/v1/credits -H "Authorization: Bearer $KEY"
```

**Two engine payload facts that contradict `API.md` and were verified live:**

- **`words_in` and `words_out` are absent on single-chunk documents**, which is
  anything under roughly 350 words and therefore most pastes. `API.md` presents
  them as always returned. The site computes its own word counts and does not
  depend on them.
- **A boolean environment flag must be trimmed before comparison.** Setting one
  with `echo` gives `"true\n"`, which is not `"true"`, so the flag silently does
  the opposite of what was intended. `printf` avoids it and the code now trims
  anyway. This is the same failure that broke the engine key an hour earlier.

### Logo files, and the mistake that wasted most of a batch

**19 August 2026.** Jon supplied fifteen files for nine outlets. **Six were HTML
documents rather than images**, saved with "Save Page As" instead of "Save Image
As". Their titles gave it away: *American Broadcasting Company - Wikipedia*,
*Forbes Logo, symbol, meaning, history, PNG, brand*.

**Check before processing anything.** The extension lies:

```bash
cd ~/Outlets && file *
```

**A `.png` that reports `HTML document text` is a saved web page.** Anything
reporting `PNG image data` or `JPEG image data` is real.

**Also check that transparency is real rather than drawn.** One CNN file showed a
checkerboard, which was baked-in pixels from a stock site preview rather than an
alpha channel:

```bash
python3 -c "
import struct
d=open('FILE.png','rb').read(); i=8
while i<len(d):
    n=struct.unpack('>I',d[i:i+4])[0]; k=d[i+4:i+8]
    if k==b'IHDR': print('colortype',struct.unpack('>IIBB',d[i+8:i+18])[3],'(6=RGBA, 3=palette, 2=RGB)')
    i+=12+n"
```

**What to ask for.** SVG first. Failing that, PNG **with a transparent
background**, from the outlet's own press or brand page. A logo on a white square
needs the background lifting out before it can sit on a tinted band.

### Removing a white background without PIL or ImageMagick

Neither is installed. `apps/web/../scratchpad/logo_prep.py` in session 5 decoded
PNG directly with `zlib` and `struct`.

**The part worth keeping: un-premultiply, do not key out.** Setting white pixels
transparent and leaving the rest alone leaves pale fringes on every antialiased
edge, and turns a coloured logo washed out. Instead:

```
alpha = 255 - min(r, g, b)
colour = (observed - 255 * (1 - alpha/255)) / (alpha/255)
```

That recovers the original colour and coverage of art drawn over white, which is
why TechCrunch's green survived as green.

---

## The legal pages expire. Exactly which lines, and when

**19 August 2026, session 6.** The privacy policy, terms of service and cookie
policy were written to be true of the code as it stood that day. **Two planned
changes each falsify a published sentence.** This section exists so nobody has to
work out which ones.

**Why it matters more than tidiness.** A privacy policy claiming "we run no
tracking" while running tracking is a false statement in a legal document. It is
also one of the documented ways a Google brand verification is revoked after being
granted. **The edit ships in the same deployment as the feature, never after it.**

### When analytics is added

| Page | Section | What changes |
|---|---|---|
| Privacy policy | The short version | "We run no advertising or tracking" — name the tool and what it measures |
| Privacy policy | Cookies and browser storage | Add the analytics entry, and say whether it sets cookies |
| Privacy policy | Who else is involved | Add the analytics provider as a row |
| Cookie policy | Opening line | Rewrite the "no advertising or tracking cookies" claim |
| Cookie policy | Whole page | **Add a consent banner if, and only if, the tool sets cookies** |

**Pick the tool with this in mind rather than on features.** The site currently
sets no tracking cookies, so it needs no consent banner and has none. **Google
Analytics ends that and creates an EU and UK banner obligation.** A cookieless
tool such as Plausible or Fathom preserves the property and costs one line of
policy instead of a consent system.

### When payments are added

| Page | Section | What changes |
|---|---|---|
| Terms | Payment | Replace "currently free and no payment method is collected" with real billing, refund and cancellation terms |
| Privacy policy | What we store if you create an account | Add billing data |
| Privacy policy | Who else is involved | Add the payment processor as a row |
| Terms | New section | **Governing law.** Omitted deliberately because there is no entity, `04` entry 54. There will likely be one by then |

### The check that catches this if the tables are missed

The claims are all falsifiable from the repository. Before any deploy that adds a
third party, run this and confirm every name it prints is listed in the privacy
policy's "Who else is involved" table:

```
grep -rniE "analytics|gtag|posthog|plausible|fathom|stripe|sentry|@vercel/analytics" apps/web/app apps/web/components apps/web/package.json | grep -v node_modules
```

**On 19 August 2026 that command returned nothing but a prose comment in
`mission/page.tsx`**, which is how the "no analytics or trackers of any kind"
claim was verified rather than assumed. **If it starts printing real imports, the
policy is out of date.**

---

## DNS for un-claude.com is at Squarespace, not Vercel

**19 August 2026, session 6.** Found by lookup when Google Search Console needed a
verification record, and worth writing down because the obvious guess is wrong.

**The site is hosted on Vercel. The DNS is not.** The nameservers are
`nsc1` through `nsc4.squarespacedns.com`, almost certainly because Squarespace
bought Google Domains. **Any DNS change — verification records, mail, a future
`auth.un-claude.com` for the Supabase custom domain fallback in `06` row 41 — is
made in Squarespace under Domains, then the domain, then DNS, in the section
called Custom Records.**

**Records live on the domain as of that date:**

```
"google-site-verification=Tew_u-su6QILD4-YST8-BxeGHZe9THkjBNaIqY6Ugj0"
"v=spf1 -all"
```

The first proves domain ownership to Google and is what unlocks OAuth brand
verification. **The second says the domain sends no mail. Leave it alone** unless
sending mail is deliberately set up, and understand it must change first if it is.

**Check whether a DNS change has actually published, before clicking Verify
anywhere.** Pressing a verify button too early fails in a way that looks identical
to having entered the record wrongly, which sends people back to re-do correct
work:

```
dig +short TXT un-claude.com @8.8.8.8
```

**Search Console ownership was verified on 19 August 2026** against the Google
account that owns the Cloud project. **That pairing matters: verification is tied
to the account that performed it, and Google Cloud cannot see a domain verified by
a different account.**

---

## Two Google console facts that look like problems and are not

**19 August 2026, session 6.** Both cost time while setting up Google sign in.

### The Supabase domain in Authorized domains cannot be deleted, and must not be

The Branding page lists **two** authorized domains, not one:

```
un-claude.com
itdgggoxsoolbfiwujvt.supabase.co
```

**Google added the second one itself**, because the OAuth client's redirect URI
points at it. Trying to delete it produces a tooltip saying the domain is in use
by a client URI and credentials must be updated first. **That is an explanation,
not an error.** The redirect URI has to stay, because it is how Supabase sign in
works, so the domain stays with it. **Every site using Supabase for Google sign in
has this exact pair. Leave both.**

### The app name must track the site's own name, in both directions

The consent screen name is checked against the name on the home page. The
documented rejection is *"the app name shown on your OAuth consent screen does not
match the app name on your home page"*, and it is automated, instant, and offers
no email thread to argue.

**On 19 August 2026 the live site wrote its own name as `un-claude` in all five
places it appears, and in the page title. The Google app name was set to match.**

**Jon intends to restyle it as `Un-Claude` at some point.** When that happens:

- **Change the site and the Google app name in the same stretch of work.** Never
  one without the other. The gap between them is the exact thing the checker
  measures, and capitalisation is the easiest kind of gap to open by accident.
- **A name change re-runs brand verification.** It is a cycle, not a free edit.
  Do it once, after the name is decided, not while deciding.
- Whether Google's matching is case-insensitive is **unverified**. Do not rely on
  it either way.

---

## Google brand verification: two buttons, two pages, and a moving site

**19 August 2026, session 6.** Each of these cost a cycle. Written so the next
branding change — a logo, or the rename to `Un-Claude` — takes one attempt.

### Publishing the app is not publishing the branding

Three separate actions, easily mistaken for one:

| Where | Button | What it does |
|---|---|---|
| Audience page | `Publish app` | Lets any Google user sign in. **Does not touch branding** |
| Branding page | `Verify Branding` | Starts the automated brand check |
| Branding page | `Publish branding` | **Makes the verified name and logo actually appear.** Nothing changes for users until this is pressed |

**Until the branding is published it sits as "Draft Branding" and the consent
screen shows the bare redirect domain**, which is `itdgggoxsoolbfiwujvt.supabase.co`
here and looks like a fault. It is not one.

### Never verify while the site is being deployed

**The first attempt failed with "your privacy policy URL is unresponsive." The URL
was correct.** The parallel session had rebuilt the site four times in ninety
minutes, and Google crawled during one of those windows. Prerendered pages are
regenerated on deploy and a crawler can land on one that is not ready.

**Before clicking `Verify Branding`, confirm nothing is deploying.** The site
reports its own build at `/version`. This watches the build id and all three URLs
Google crawls, and prints whether anything moved:

```
for i in $(seq 1 10); do
  printf "%s home=%s privacy=%s terms=%s build=%s\n" "$(date +%H:%M:%S)" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://un-claude.com/)" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://un-claude.com/privacy-policy)" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://un-claude.com/terms-of-service)" \
    "$(curl -s https://un-claude.com/version | cut -c1-7)"
  sleep 8
done
```

Ten identical lines means it is safe to verify. **A changing build id means a
deploy is in flight and the attempt will be wasted.**

### What a branding change costs later

**Any change to the name, logo, home page, privacy policy URL or authorized domains
re-runs verification.** It is the same automated check, typically minutes, and it
escalates to manual review — Google's figure is two to three business days — only
when the automated pass cannot decide.

**So a logo is not free but it is not a multi-day commitment either.** Make the
change once, when the artwork is final, with the site stable, and expect a re-run.

### Turborepo strips environment variables the build needs, silently

**19 August 2026, and it is the fifth time this project has hit a setting that is
present, correct, and never loaded.**

**Turborepo 2 filters the build environment in strict mode.** Only names listed in
`turbo.json`'s `globalEnv` reach a task. Anything else is removed before Next
runs, and the build succeeds with a warning nobody reads.

**It only bites `NEXT_PUBLIC_` variables, which is why it hid for so long.**
Runtime secrets are read by the deployed function and never touch the build, so
Supabase and `UC_ENGINE_KEY` kept working. A `NEXT_PUBLIC_` value is inlined at
BUILD time, so stripping it produces a deployment that quietly has the feature
switched off while Vercel shows the setting present and correct.

**`NEXT_PUBLIC_SUPABASE_URL` survives for a third reason again:** it lives in
`apps/web/.env.production` on disk, where Next reads it directly and Turbo cannot
reach it.

**The rule. Any variable needed at BUILD time must be in three places:**

1. Vercel project settings
2. `turbo.json` `globalEnv`
3. `apps/web/.env` as documentation, blank

**The warning is in the build log and names the variables it is dropping:**

```bash
npx vercel@latest inspect <deployment-url> --logs 2>&1 | grep -A12 "missing from"
```

**A bonus, once a variable IS declared:** changing its value changes Turbo's cache
key, so a rebuild cannot reuse a stale cached build. Declaring it fixes the
delivery and the cache invalidation together.

### Verifying a client-side script actually works, and three ways to get it wrong

**All three of these produced a false result on the PostHog install.**

**1. `curl` cannot see an `afterInteractive` script.** Next injects it client side
after hydration, so it is never in the server HTML. `curl | grep posthog`
returning nothing proves nothing.

**2. The chunk path is `/_next/static/immutable/chunks/`, not
`/_next/static/chunks/`.** A grep over the wrong path searched one irrelevant file
and reported a clean miss.

**3. `grep ... | head && echo "found"` prints "found" when grep matched nothing,**
because `head` exits 0 on empty input. That reported a key as embedded when it was
absent.

**What actually works is reading the rendered DOM in a browser:**

```js
document.getElementById('posthog').textContent.match(/api_host: "([^"]*)"/)[1]
```

**That is what found the real bug: the stored host was truncated to
`https://us.i.po`.** Every config-level check passed, because the config was
correct; the value inside it was not. **Read the rendered output, not the source
that produced it.**

### Proving the cookieless claim, which the cookie policy stakes a claim on

Run in the browser console on the live site, after the library has loaded:

```js
({ loaded: !!window.posthog.__loaded, cookies: document.cookie || '(none)',
   local: Object.keys(localStorage), session: Object.keys(sessionStorage) })
```

**All three stores must be empty WITH `loaded: true`.** Empty stores while the
library failed to load proves nothing at all, which was the state for two rounds
of this. Verified 19 August 2026: library loaded, an event reached
`us.i.posthog.com/i/v0/e/`, and cookies, local storage and session storage were
all empty.

**Note for reading the numbers: the browser used for testing blocked PostHog with
`ERR_BLOCKED_BY_CLIENT`.** Ad and tracker blocking will undercount real visitors
too. The figures are directional, not exact.


---

## [T3] The measurement was the defect a fourth time, and this one cost money

**19 August 2026, track 3.** Written up because the same rule caught the same
kind of bug again, and because the number it was corrupting is the one the
pricing decision rests on.

### What was wrong

The fact guard compares every number in a chunk against the rewritten version,
by value rather than spelling, so `eighteen percent` matches `18 percent`. It
retries the chunk when a figure looks dropped.

**It was forcing a retry on every compound number word from twenty-one to
ninety-nine.** `ENGINE.md` records an earlier repair, that `thirty-four` must
resolve to 34 and not to 30 and 4. **The repair added 34 to the set and left 30
and 4 in it.** So a source saying `thirty-four` demanded that the output contain
30, and an output written as `34` — the natural thing for a model to do — looked
like a dropped figure.

### What it cost, measured on one 674 word document

| | Model calls | Retries | Cost | Time |
|---|---|---|---|---|
| **Before** | **10** for 3 chunks | 7 | $0.00167 | **38.4s against a 60s ceiling** |
| After, run 1 | 4 | 1 | $0.00063 | |
| After, run 2 | 5 | 4 | $0.00086 | |

**Two runs of a non-deterministic process is not a cost model** and the document
was deliberately number-dense. The direction is not in doubt; the magnitude
varies with content. `06` rows 65 and 66.

### The check that finds this class of bug in ten seconds

Never reason about a value comparison. Print both sides:

```bash
cd ~/un-claude/apps/web/engine && python3 -c "
import sys; sys.path.insert(0, '.')
from uc_chunk import _numbers
for src, out in [('Fifty-one hires', '51 hires'), ('Thirty-four percent', '34 percent')]:
    s, o = _numbers(src), _numbers(out)
    print(f'{src!r:24} -> {sorted(s, key=int)}   {out!r:20} -> {sorted(o, key=int)}   '
          f'{\"RETRY \" + str(sorted({m for m in s - o if len(m) > 1})) if {m for m in s - o if len(m) > 1} else \"ok\"}')"
```

**Run it with controls where a number really was dropped**, or a guard that never
fires will look identical to a guard that is working.

---

## [T3] Where the usage figures go, and what that is worth

**19 August 2026.** Every request now writes one line to the server log:

```
UC_USAGE {"at": "...", "endpoint": "clean", "ok": true, "kind": "text",
 "words_in": 674, "words_out": 644, "seconds": 22.1,
 "layer_b": {"chunks": 3, "attempts": 4, "retries": 1, "model_calls": 4,
             "prompt_tokens": 2731, "completion_tokens": 1510,
             "total_tokens": 4241, "cost_usd": 0.0006263}}
```

**To read them:**

```bash
npx vercel@latest logs <deployment-url> 2>&1 | grep UC_USAGE
```

**Two things about it that must not be forgotten.**

**It is a log line, not a database.** Vercel keeps runtime logs for a short
window. Anything worth keeping has to be pulled out before it expires. The
durable ledger is Track 1's, because it needs a migration. `06` row 64.

**`attempts` and `model_calls` are different numbers and both matter.** An
attempt that never reaches the model, because the connection failed or the
gateway rate limited us, is an attempt and is not a billed call. A live run
showed 7 attempts against 5 calls. **If they are ever equal in every line, one of
them is not being counted.**

**Cost and token counts are deliberately absent from the HTTP response.** They
are our unit economics and the site is public. The browser gets words, bytes,
seconds and whether layer B ran.

---

## Cookieless has an identity boundary, and it runs straight through the paywall

**19 August 2026, session 7, Track 4. Proved on the live site rather than reasoned
about.**

`persistence: 'memory'` means the visitor's id lives in a JavaScript variable and
nowhere else. **A full page load makes a new one. A client-side navigation does
not.** So a funnel joins up exactly as far as Next's router carries the visitor,
and no further.

Measured on un-claude.com, each move made the way a real visitor would make it:

| The move | Visitor id | Session id |
|---|---|---|
| `/` → `/how-it-works`, header link (`<Link>`) | same | same |
| `/` → `/auth/sign-up`, header "Sign Up" (`<Link>`) | same | same |
| `/` → `/auth/sign-up`, paywall "Get credits" (plain `<a>`) | **new** | **new** |
| `/` → `/auth/sign-up`, address typed in | **new** | **new** |

From the paywall run: before `01a01bf0-ba56-7cf5-a9c4-354fea8ca2e1`, after
`01a01bf3-bc25-7222-ac0f-2c896572c70c`, and the `window` variable holding the
"before" value was gone, which is what a full page load looks like from inside
the page.

**The one route that broke it was the one that matters most.** Every other way
into sign-up preserved the visitor. The paywall's own call to action did not,
because `paywall.tsx` used a plain `<a href>` where the rest of the site uses
Next's `<Link>`.

**The fix is one line and it costs nothing legally.** `<Link>` keeps the
navigation client-side, the id stays in memory, nothing is written to the device,
and no sentence in either policy changes. **Do not reach for a cookie, a stored
id, or a URL parameter to solve this.** The first two end the no-banner property
outright, which is the thing the whole configuration was chosen to protect.

**The test, for any two pages, and it is the whole test:**

```js
// on page one
window.__before = posthog.get_distinct_id();
// navigate the way a real visitor would, then:
({ survived: !!window.__before, before: window.__before, after: posthog.get_distinct_id() })
```

`survived: false` means the browser did a full page load and PostHog is now
looking at a different person.

### A page mid-hydration reads exactly like a broken one

**19 August 2026, session 7.** Cost twenty minutes and was one step away from
being written up as a live outage.

Checked immediately after `/` finished loading, the workbench reported all five of
these at once:

- `data-phase="scanning"`, its initial state, indistinguishable from a hung scan
- no `__reactFiber` key on its root element, indistinguishable from a component
  that never hydrated
- zero requests to `/api/tool/scan` in `performance.getEntriesByType('resource')`
- an ancestor `<div id="S:0">`, React's streaming-SSR placeholder container
- clicks on its buttons doing nothing at all

**All five are also true of a genuinely dead page, and all five were false.**
Seconds later the same checks returned `data-phase="scanned"`, a fiber present,
one scan request made, and `S:0` gone. Hydration on this page is slow enough to
span several tool calls.

**Before concluding anything from the DOM here, confirm the page is actually
alive first:**

```js
({ phase: document.querySelector('[data-phase]').getAttribute('data-phase'),
   hydrated: Object.keys(document.querySelector('[data-phase]')).some(k => /^__reactFiber/.test(k)) })
```

**`phase` must not be `scanning` and `hydrated` must be `true`.** Anything read
before that is a reading of the server's HTML, not of the running product.

### The landing page does not hydrate on a local machine, and it is not your change

**19 August 2026, session 7.** Cost most of a verification budget. Written so the
next session spends none.

**The workbench never comes alive locally.** It sits inside an unresolved React
streaming container, `<div id="S:0">`, never gains a `__reactFiber` key, never
fires its opening scan, and ignores every click. The body and the site header
hydrate normally around it.

**It is not caused by whatever you just edited.** Established by stashing this
session's changes and reloading: identical behaviour. It reproduces on a fresh
`next dev` AND on a local production build served with `next start`. There is no
compile error, no console error, and no failed network request.

**The live site is unaffected** and resolves the same container within a few
seconds.

**Leading suspicion, unproven:** local Supabase is not running, `06` row 11, and
something in that subtree waits on a session that never arrives. `.env.local`
points at the real hosted Supabase rather than at localhost, so it is not simply
an unreachable address.

**What to do instead of chasing it.** Verify client-side logic by compiling the
module on its own and driving it in Node:

```bash
./node_modules/.bin/tsc apps/web/lib/analytics/events.ts --ignoreConfig \
  --module commonjs --target es2020 --lib es2020,dom --outDir <scratch>/build --skipLibCheck
```

Then `require` the result, stub whatever global it talks to, and print what it
produced. That is how the analytics events were proven without a working browser
page. **`--ignoreConfig` is required**: naming a file on the command line while a
`tsconfig.json` exists is an error without it.

### Next 16 refuses a second dev server, and tells you where the first one logs

`next dev` exits with code 1 and prints the running server's PID and its log path,
which is `apps/web/.next/dev/logs/next-development.log`. **Read that file rather
than guessing** — it carries both server and browser errors with timestamps, and
it is the only way to see a compile failure belonging to a session that is not
yours. Historical errors stay in it, so check the timestamps before believing one.

## The preview pane's dead-hydration state has a cause, found 20 August 2026

**The symptom this file already records** (server HTML renders, clicks do
nothing, screenshots come back blank, "about forty minutes went into an
application bug that did not exist") **has a mechanism:**

**The home page's React hydration is large enough that React yields mid-tree
and schedules its continuation. A preview tab that is not the FRONTED, visible
tab freezes scheduled work.** So hydration starts, pauses, and never resumes.
Small pages such as `/mission` hydrate synchronously in the first task and work
even in a hidden tab, which is why the failure looks intermittent and
page-specific.

**The tell:** `Object.keys(document.querySelector('textarea')).some(k =>
k.startsWith('__react'))` is false while scripts and HMR are demonstrably
running.

**The fix, every time, before any interaction test:** front the tab
(`tabs_select`), wait two or three seconds, then probe hydration before
clicking anything. A reload while hidden re-enters the frozen state.

**Real visitors are unaffected**: their tab is visible while they use it. This
is purely a property of driving the embedded pane while it is backgrounded.

**Three hours of session time went into rediscovering this once. Do not
diagnose the app until the tab is fronted and the probe above returns true.**

## `vercel deploy` hangs forever with no output, 20 August 2026

**The Vercel CLI does not read `.gitignore`.** It reads `.vercelignore`, and
this project did not have one. So `vercel deploy` tried to upload the entire
working folder, including the 6.2 GB Turborepo cache in `.turbo/`, before it
would even begin the build. The real source this app needs is **764 files and
7.3 MB.**

**What it looks like:** no output at all, no error, and `vercel ls` shows no
new deployment even minutes in. That last part misleads: the CLI registers a
deployment only *after* the upload completes, so "no deployment appeared" reads
as "the command failed" when it actually means "still uploading". A normal
build for this project takes 18 to 43 seconds.

**Do not diagnose this by hypothesis.** Two wrong causes were confidently
proposed here (payload size, then directory-walk cost over `.turbo`) before
anyone simply looked at the CLI's own progress line, which says
`Uploading (0.0B/6.2GB)` and names the problem outright.

**Never pipe a deploy through `tail`.** `vercel deploy … | tail -40` buffers
every line until the command exits, so a hung deploy produces an empty output
file and looks like a crash. Run it unpiped and read the file as it grows.

**`.vercelignore` now exists at the repo root** and excludes build caches
(`.turbo`, `.next`, `node_modules`, `dist`) and, importantly, the `.env.local`
files. Without it those were being uploaded into the deployment bundle, and
they hold the Supabase service role key.

## Preview deployments have never had the Supabase keys, found 20 August 2026

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SITE_URL` and `UC_ENABLE_LAYER_B` are set on the Vercel project
for **Production only**. Every other variable covers Preview and Production.

**So every preview build fails**, and the error is misleading: it surfaces as a
`ZodError` from `get-supabase-client-keys.ts` while prerendering
`/api/credits`, which reads as a bug in the credits route. It is not. The route
is fine; the environment is half-configured. The one prior Preview deployment
in the project history, from 18 August, is in `Error` state for the same
reason.

**`turbo.json` was also missing six variables from `globalEnv`**
(`SUPABASE_SERVICE_ROLE_KEY`, `UC_ENGINE_KEY`, and the four
`WATERMARKS_REWRITE_*`), which Turbo warns about explicitly: they are set on
Vercel but were not declared, so they were withheld from the build. Fixed by
declaring all of them.

## Adding a subdomain: DNS first, certificate about three minutes later

**20 August 2026.** `www.un-claude.com` returned HTTP 000 — no response at
all, not an error page — while the apex `un-claude.com` served fine.

**Two causes, in sequence.**

**One: `@` is not a wildcard.** The Squarespace DNS had a single A record,
host `@`, pointing at Vercel's `76.76.21.21`. That covers the bare domain and
**nothing else**. Subdomains do not inherit it. `www` needs its own record,
same type and same value, with `www` in the host field. Vercel already listed
both `www.un-claude.com` and `un-claude.com` on the project, so nothing was
wrong on that side; the record simply did not exist.

**Two: the certificate lags the DNS.** Once `www` resolved, Vercel still had
to issue a certificate covering it, and until it did, the TLS handshake failed
and curl reported HTTP 000 — indistinguishable from the original problem.
Measured here: **150 seconds** between the record propagating and `www`
answering 200.

**The tell, and the reason this is worth writing down:** during that window a
browser may succeed while curl fails, because of caching and because the two
requests land either side of issuance. That looks like a disagreement about
whether the site works. It isn't. Check the certificate's subjectAltName
rather than guessing:

    echo | openssl s_client -servername www.example.com \
      -connect www.example.com:443 2>/dev/null \
      | openssl x509 -noout -ext subjectAltName

If the SAN lists only the apex, the certificate has not been issued yet.
Wait, do not re-diagnose.

### Screenshotting a long page when the preview pane refuses to scroll

**20 August 2026, session 10, the pricing rebuild.** A variant of the pane
degradation above, with a workaround worth keeping.

**The symptom:** `computer` with `action: "scroll"` times out after 30 seconds
saying the pane is hidden, and a `window.scrollTo` from `javascript_tool` moves
`scrollY` correctly but the next screenshot comes back painted only with the
content that was at scroll position zero. The page is fine. The compositor is
only painting the initial viewport.

**Two things that work, in order.**

1. **Set a tall viewport and shoot once.** `resize_window` to something like
   1280x1500 captures most of a page in a single frame with no scrolling at all.
   **Do not go much past 1500px tall** — at 3400 the pane stopped compositing
   entirely and every screenshot timed out.
2. **Shift the page under a normal viewport** for the parts below that.
   `document.body.style.marginTop = '-1360px'` pulls later content up into the
   frame the pane is willing to paint. Step it down the page in viewport-sized
   chunks, and set it back to `'0px'` before doing anything else.

**And the rule from the entries above still applies first: if the DOM itself
reads empty, open a NEW TAB.** This session hit that too. `document.body.innerText`
was 328 characters of header and footer with the whole page missing, while
`curl` returned 210KB of correct HTML for the same URL. A fresh tab rendered it
perfectly. **Measure with `curl` or a new tab before believing a broken DOM.**

---

## The Browser preview pane cannot do mobile work on this site at all

**21 August 2026, session 10.** A different failure from the backgrounded-tab
freeze above, and worth telling apart from it. Setting the pane to any width
below 768px turns on its mobile *device emulation*, and in that mode the
landing page never finishes hydrating: every section reports `offsetHeight: 0`,
the document measures roughly a quarter of its real height, and the screenshot
comes back as a hero over a blank sheet. **It looks exactly like a catastrophic
layout bug in the app. It is not one.** At 768px and above, the identical page
hydrates and measures correctly, in the same pane.

**Confirmed by elimination, not by guessing:** fresh tabs, closing every other
tab, reloads and long waits all reproduced it; only the width changed the
outcome. An iframe harness at 390px inside a non-emulated tab hydrated
correctly but still would not paint the tool.

**What actually works for mobile verification on this project: the repo's own
Playwright, driving the copy of Chrome already installed on the machine.**

```bash
cd apps/e2e
node mobile-probe.mjs / /how-it-works        # heights and side scroll
node mobile-shots.mjs /how-it-works <dir>    # full page slices as PNGs
node wallet-shots.mjs <dir>                  # signed-in pages, via an admin-minted magic link
```

**`npx playwright install` is NOT needed and must NOT be run** — it downloads
browsers, which needs Jon's approval under `CLAUDE.md` section 5.
`chromium.launch({ channel: 'chrome' })` uses `/Applications/Google Chrome.app`,
which is already there. That one option is the whole trick.

## Two sessions in one folder share one git index — read the staged list before every commit

**21 August 2026.** Staging by explicit file path (`CLAUDE.md` section 5) is
necessary here and **it is not sufficient** when a second session is working in
the same folder at the same time. A `git add` in one session leaves that path
staged for both, and the next `git commit` in the other sweeps it in even
though that commit named only its own files.

**It happened.** A second session's `docs/session-notes/operations-setup.md`
landed inside an unrelated commit about the capabilities page — caught by
reading the tool's own output, not by assuming the staged list matched the
requested one.

**The fix, and it is clean:** `git rm --cached <their-path>` then
`git commit --amend --no-edit`. The commit is rewritten without the file; the
file stays on disk, untracked, exactly as its owner left it.

**The habit worth keeping: run `git diff --cached --name-only` and read it
before every commit, every time**, not only when something feels off.

## A slash immediately followed by a star inside a SQL comment silently eats the rest of the file

**21 August 2026.** `20260821120200_rate_limits.sql` failed on its first-ever
run with `ERROR: 42601: unterminated comment at or near ...`, pointing at line
1, with nothing in the message naming the real cause.

**The cause: a URL path written with a trailing wildcard inside the header
comment** — a slash immediately followed by a star. **Postgres nests block
comments, unlike C.** Those two characters opened a second comment, so the
first closing delimiter closed the inner one rather than the outer one, and
everything after it stayed commented out to the end of the file.

**It survived being written, reviewed, and handed off twice, because nobody
had ever run it.** A migration that has not been run is not known to work,
however carefully it was written.

**Never write a slash immediately followed by a star inside a SQL comment.**
To check a file before pasting it, the counts must match:

```bash
grep -o '/\*' FILE | wc -l
grep -o '\*/' FILE | wc -l
```

Run across every pending migration; only this one was ever unbalanced.

**Not to be confused with Supabase's "Run and enable RLS" prompt**, which the
SQL editor shows on any script that creates a table — either button is safe on
this project's migrations because each one enables RLS itself.

## Do not test auth over a LAN IP address

**21 August 2026.** Testing sign-in or sign-up from a phone against
`http://192.168.x.x:3000` produces failures that look like product bugs and
are properties of the address, not the code.

- **It is not a secure context**, so `crypto.subtle` (WebCrypto) is missing and
  Supabase's PKCE sign-in flow silently degrades its code-challenge method to
  `plain`.
- **Supabase only redirects to URLs on its allow list.** A confirmation email's
  link sent while testing on a LAN address resolves to the project's real Site
  URL instead — production, running whatever build is live there — in a
  browser context holding none of the session state the test needed.
- **Cloudflare Turnstile fails the same way for the same family of reason**
  (error `110200`): the host is not on the widget's allowed list.

**None of this affects real visitors.** Production is `https://un-claude.com`,
a secure context, on every allow list that matters. **Use
`http://localhost:3000` on the Mac itself for any auth testing** — it is a
secure context and is on Supabase's redirect allow list by default. The merge
and grant logic this unblocks is server-side and does not need a phone at any
point; drive it from the Mac and verify layout separately with the Playwright
scripts above.

## A guest cookie and a confirmation link opened on a different device don't meet

**21 August 2026.** A visitor uses the tool on a laptop as a guest, spends part
of a free balance, signs up, and opens the confirmation email on their phone
instead. The link confirms the account and creates the session **on the
phone**, which has never held the `uc-guest` cookie — the guest only exists on
the laptop. The merge that would carry the guest's remaining credit onto the
new account cannot fire, because it depends on the same browser holding both
the guest cookie and the new session. The laptop stays a signed-out guest with
a stranded credit; the phone is a signed-in account that never received it.
**No error appears anywhere.** This is the normal way people read email, not
an edge case, and it has not been fixed or even measured for frequency.

## Rate limiting fails open, by design, and that is what makes it safe to deploy ahead of its own migration

**21 August 2026.** The rate limiter added this session (`rate-limit.ts`,
backed by a Postgres counter and `rate_limit_hit()`) is written so that any
failure inside it — the migration not yet applied, the service key missing, a
database blip — **allows the request rather than blocking it**, logging the
error instead. A rate limiter is a backstop against abuse; it must never be
the thing that takes the free tool down for everyone.

**The consequence worth keeping in mind:** deploying this code before pasting
its migration is safe. Before the migration, the RPC is simply missing, every
call fails open, and behaviour is exactly what it was before the limiter
existed. The same "detect the specific missing-column or missing-function
error and continue without the feature rather than failing" pattern is used
for `grantOnce` and the per-inbox dedupe column — this project has already had
every grant fail outright once, because code assumed a column existed before
the migration adding it had actually been pasted. **Any code that depends on a
migration Jon has not yet run should be written to degrade, not to break.**

## The Cloudflare Turnstile `600010` console error is noise, not a failure

**21 August 2026.** `[Cloudflare Turnstile] Error: 600010` appears in the
console on every page load, including in production, and looks like a
misconfigured widget. **It is not the cause of a captcha failure if one
happens.** Confirmed directly: with Supabase captcha protection switched on,
a real sanitise completes successfully on the same page that logs this error
on every load. `600010` is nominally the invalid-domain error, but `localhost`
was confirmed already present in the Turnstile widget's allowed hostnames when
this was checked, so whatever triggers it here is not a missing hostname.
**Do not chase it.** The one time it is worth a second look is if sign-in or
sanitising actually starts failing in production — that is the first place to
check, not the first thing to fix on sight.

## The credit ledger refuses UPDATE, so nothing learned after the fact can live on it

**23 August 2026, lane B.** `credit_ledger` has six columns — `cost_usd`,
`model_calls`, `retries`, `total_tokens`, `seconds`, `layer_b` — that describe
what a run cost. Every one of them is empty on every row that has ever existed,
and **they could never have been filled in.**

The credit is spent *before* the engine runs, which is what stops two racing
requests both spending the last credit. The cost is only known *after*. Filling
the columns in would mean updating the spend row. Tested against the live
database rather than assumed:

```
row 2735 cost_usd before: null
UPDATE result: REFUSED -> permission denied for table credit_ledger
direct DELETE result: REFUSED -> permission denied for table credit_ledger
rows left after deleting the account: 0
```

**Do not relax that refusal to make bookkeeping easier.** Supabase's free plan
takes no backups, so an append-only ledger is the only protection the credit
history has.

**The rule: a ledger row can only ever record what was already true when it was
written.** Anything learned afterwards goes in its own table, keyed to the ledger
row. `run_costs` is the first of those.

## Two `next dev` servers cannot run in one folder, and killing the other one is not yours to do

**23 August 2026, lane B.** Starting a second development server in
`apps/web` — even on a different port — refuses:

```
⨯ Another next dev server is already running.
- Local:        http://localhost:3003
- PID:          94673
- Dir:          /Users/jonathannachman/un-claude/apps/web
```

The lock is on the **folder**, not the port, and in a session where several
lanes are working at once that server belongs to somebody else. **`kill` is
not the answer.** Either use the server that is already up — it hot-reloads
your edits like any other — or do the test against production with an input
that cannot cost money.

## Testing the money path without spending any money

**23 August 2026, lane B.** The two things that make this safe are the same two
every time:

**Fund throwaway accounts by writing ledger rows, never by buying anything.** A
grant, a purchase and a refund are all just rows; the append-only shape is the
same whether a webhook wrote it or a script did. Deleting the account cascades
every row away, verified again this session — the ledger held 93 rows before and
93 after.

**Label every account and refuse to touch anything else.**
`scripts/_lane-b-throwaway.mjs` creates only addresses beginning
`lane-b-money-`, and its `destroy()` **throws rather than deleting** anything
whose address is outside that prefix. That guard is what makes it impossible for
a mistake in a test to reach a customer, and every money script in the lane goes
through it.

**To exercise the real charge-and-refund path on production at zero model
cost, send a paste far over the 10,000 word limit with the rewrite requested.**
The engine refuses those in milliseconds "before it spends a penny" — its own
words — but the site has already charged by then, so the whole spend-and-refund
sequence runs for free. A 250,000 word paste takes about four seconds end to end,
which is a wide enough window to drop the connection deliberately.

**A session on the live site is obtainable without the sign-in form.** Turnstile
correctly refuses an automated browser. `auth.admin.generateLink({type:
'magiclink'})` gives a one-time token, and
`GET /auth/confirm?token_hash=…&type=magiclink` returns real session cookies.
That is the captcha working, not a gap in it.

## The dev credit bypass must be OFF when testing the money path

**23 August 2026, lane B.** `devBypass` is the `x-uc-dev: 1` header, development
builds only. With it on, **nothing is charged and none of the real path runs** —
no grant, no spend, no refund, no ledger row. A test that sends it proves the
interface and nothing else. Every run recorded in `session-notes/lane-b-money.md`
was made without it.

## Looking at states that need a session, 23 August 2026

**Three parts of this product are gated on a real signed-in account against the
hosted Supabase, and there is no local one (`06` row 11).** Until now that meant
they could be changed but not looked at, which `CLAUDE.md` section 4 does not
accept. All three now have a development-only way in, and all three compile out
of a production build.

| To see | Do this |
|---|---|
| The signed-in header, with the credit pill and the avatar | On `/dev/credits`, pin a balance whose value ends `:account`. `SiteHeaderAccountSection` renders the real signed-in row against a stand-in identity |
| The wallet's credit history, at any length | `/dev/wallet`, `?page=4`, `?total=8`. The real `CreditHistory` component with fabricated rows |
| An empty balance, a paywall, the post-signup arrival | `/dev/states`, which already existed |

**None of them signs anybody in.** Every route still asks the server who is
calling, and the ledger is untouched.

### Driving the workbench from JavaScript does not work; type instead

**Setting a textarea's value with the native property setter and dispatching an
`input` event does NOT update React state in this build.** The event reaches
React — `clearResults` fires — but `text` stays empty, so "Scan it" does nothing
and the phase sits at `idle`. Twenty minutes went into this once.

**Use real keystrokes** (`computer` `left_click` then `type`). That works every
time. Clicking buttons from JavaScript is fine; only the text input is affected.

### The local engine has to be started by hand, or every scan says "we could not reach the service"

`.env.local` points `UC_ENGINE_URL` at `127.0.0.1:8765`, which is the standalone
engine and is not running unless somebody starts it:

```bash
cd ~/un-claude/apps/web/engine && python3 server.py --port 8765
```

**Scanning is free and local, so this costs nothing.** Sanitising a text paste
does call a rewrite model and does cost real money; sanitising a `.docx` or an
image does not, because layer B never runs on a container.

### Only one `next dev` at a time in this repo, whatever the port

`.claude/launch.json` offers four ports so parallel sessions do not collide, but
Next refuses a second dev server regardless of the port — they share `.next`. The
refusal names the running PID and its log path. **When two sessions are live,
whoever starts first owns the dev server**, and it is better to use theirs than
to kill it.

## `grant` does not narrow a privilege in Supabase — only `revoke` does

**24 August 2026, lane B.** Two new tables were created with

    grant select, insert on table ... to service_role;

on the belief that this made them insert-only. It does not. **Supabase sets
default privileges on the public schema that already hand `service_role`
everything on every new table**, and `grant` only ever ADDS. Both tables arrived
fully updatable and fully deletable. Measured, with the credit ledger as the
control:

```
credit_ledger      DELETE -> REFUSED: permission denied for table credit_ledger
refund_shortfalls  DELETE -> ALLOWED
run_costs          DELETE -> ALLOWED
```

The ledger is protected because `20260819180000_credit_ledger.sql` **revokes
first and grants afterwards**. Copy that order:

    revoke all on table public.X from authenticated, anon, service_role;
    grant select, insert on table public.X to service_role;

**And check it by trying**, rather than by reading the migration back:

    await db.from('X').delete().eq('<a real column>', <a value that matches nothing>)

**Use a column that actually exists.** The first version of this probe used the
same column name against three different tables, two of which did not have it,
and the resulting "permission denied"-shaped errors were column errors wearing a
convincing disguise.

## A throwaway that signs in to the live site leaves a row that deleting it does not remove

**24 August 2026, lane B.** After `20260823120100_grant_claims_survive_deletion.sql`
landed, two test runs that drove the real site left **four rows in
`grant_claims`** — and deleting the accounts did not take them, because **not
being taken by the deletion cascade is the entire purpose of that table.**

They had to be picked out afterwards by timestamp, checked against every
account that still exists, and removed by hand. That is a bad way to clean a
money-adjacent table.

**The sweep is `forgetAllLaneClaims()` in `_lane-b-throwaway.mjs`, and it is a
separate end-of-script step on purpose.** It is deliberately NOT part of
`destroy()`: `verify-grants-survive-deletion.mjs` proves the fix by deleting an
account and signing up again on the same address, so a `destroy()` that swept
claims would hand out free credits every round and report the bug as fixed.

**So: any script that creates a throwaway and touches `/api/credits` or
`/api/tool/clean` must call `forgetAllLaneClaims()` before it exits.** All three
verify scripts now do.

**`refund_shortfalls` is the opposite case and cannot be swept at all.** It is
insert-only, so the two rows `verify-refund-attribution.mjs` writes against
throwaway payments stay for ever. `read-refund-shortfalls.mjs` skips anything
whose payment id begins `pi_LANEB_` and says how many it skipped.

---

## A "reasoning" model through this engine thinks with no cap, and it looks exactly like a timeout

**24 August 2026, Lane A bake-off.** The engine never sends the
`reasoning_effort` parameter (server.py passed `None`, which omits it), so any
model tagged `reasoning` on the gateway runs in its default thinking mode and
spends its whole 45-second call budget thinking. From outside this is
indistinguishable from the model being slow or down: the call times out, the
retry times out, the run fails.

**This is the likeliest reason `moonshotai/kimi-k2` and `zai/glm-4.6` were
recorded as "timed out" in the engine-limits bake-off** — recorded there as a
property of the models, when it may have been a property of our call.

**What to do instead.** `WATERMARKS_REWRITE_REASONING_EFFORT=none` (a Vercel
env var since 24 August) asks a reasoning model to skip its chain of thought.
Two cautions, both learned by running it: not every model accepts the
parameter — some return 400 on an unknown value, which burns the retry budget
— so measure with it and without before concluding anything; and a bake-off
that tests a reasoning-tagged model without this setting is testing the
model's thinking budget, not its rewriting.

---

## The M-6 connection-drop test was never a file, and now it is

**Learned the hard way, 24 August 2026, route session.** The board and
`session-notes/lane-b-money.md` both say M-6 needs "one re-run of a script that
already exists and costs nothing". **It did not exist.** There is no abort test
in `apps/web/scripts/` and git has no record of one being deleted; it was a
throwaway that died with the session that wrote it.

**It is `scripts/verify-connection-drop-refund.mjs` now.** If a session note says
"re-run the existing script", check that the file is actually in the tree before
promising anyone it is one command away.

## Exercising the paid route locally, with no gateway key and no model call

**Route session, 24 August 2026.** Three lanes recorded that they could not
exercise the tool locally at all. This is the setup that works. **Three
processes, in this order:**

```bash
cd apps/web

# 1. the stand-in for the AI Gateway. There is no WATERMARKS_REWRITE_API_KEY on
#    this machine, and this answers in the gateway's own shape with the token
#    counts and cost from a real production run.
node scripts/_stand-in-gateway.mjs &

# 2. the REAL Python engine, pointed at it
WATERMARKS_REWRITE_BACKEND=openai-compatible \
WATERMARKS_REWRITE_BASE_URL=http://127.0.0.1:8799 \
WATERMARKS_REWRITE_API_KEY=stand-in-key \
WATERMARKS_REWRITE_MODEL=stand-in/echo \
WATERMARKS_REWRITE_ALLOW_REMOTE=1 \
python3 engine/server.py --port 8765 &

# 3. the site. .env.local already points UC_ENGINE_URL at 127.0.0.1:8765
npx dotenv -e ./.env.local -- npx next dev -p 3200 &
```

**Then drive it with a real signed-in session**, not with the dev bypass — the
bypass skips the credit path entirely, so no ledger row and no `run_costs` row
are written and any test of the money path proves nothing:

```bash
node scripts/verify-cost-leak-closed.mjs
node scripts/verify-cjk-refusal.mjs
```

**`scripts/_route-session-harness.mjs` holds the session plumbing.** It reuses
lane B's throwaway machinery deliberately rather than re-writing it, because
`destroy()` there refuses any address outside the `lane-b-money-` prefix and that
guard is what stops a mistake reaching a customer. **`.env.local` points at the
LIVE Supabase**, so the prefix is not decoration.

**Two things that will confuse you if nobody says them:**

- **`seconds` is null in every locally-written `run_costs` row.** It comes from
  the top-level `usage` block that `api/clean.py` adds, and `engine/server.py`,
  the dev server, does not add it. In production it is a real number.
- **A dropped connection refunds correctly on a local dev server whether or not
  `supportsCancellation` is set.** Node propagates the disconnect on its own.
  **A local pass on the M-6 test therefore says nothing about Vercel.**

## `oxfmt --check` already fails on `app/api/tool/clean/route.ts` at HEAD

**Route session, 24 August 2026.** Do not "fix" it while editing that file. Every
complaint is on pre-existing lines — `fail('bad_json', ...)` and two siblings
that oxfmt wants split across three lines — so running the formatter produces a
large diff that has nothing to do with the change being made. Checked by stashing
the change and re-running: it fails at HEAD too. `oxlint` is clean on that file;
the one lint error in `apps/web/scripts/` is a pre-existing unused variable in
lane B's `verify-refund-attribution.mjs`.

---

## A gateway call can hang far past its 45-second timeout. Lab scripts need a wall clock around the whole run

**Learned 24 August 2026, E-9 session, the hard way.**

**What happened.** A measurement campaign froze for 15+ minutes inside a
single run. The process sat blocked in `PySSL_select` on two ESTABLISHED
connections to the gateway, with the 45-second call timeout never firing.

**Why the timeout does not save you.** urllib's `timeout` is applied **per
socket operation**, not per request. A connection on which the server keeps
dripping bytes — or an SSL read that keeps being woken — resets the clock
every time, so a call can stay "in flight" indefinitely. The engine's own
production comment ("a model call already in flight has its own 45 second
timeout on top") assumes the timeout fires; on Vercel the function's own
300-second kill is the real backstop, and the site aborts at 240. **A lab
script on a laptop has neither**, so it hangs forever.

**What to do instead.** Run each measured job in a **subprocess with a hard
wall clock** (`subprocess.run(..., timeout=240)` — the site's own ceiling)
and append results to disk as they finish, so a hang costs one run, not the
campaign. `engine/lab/freeze_measure.py` is the pattern.

**Do not diagnose with `lsof ... | grep -c`.** The first check this session
piped lsof through `grep -c TCP`, got `0`, and briefly concluded there were
no connections; running lsof plainly showed two. Read the raw output.

## The freeze's own repair can un-indent a block quote, and the model gets the blame

**24 August 2026, E-16. Cost about forty minutes, and the first suspect was
the wrong one.** The first run of a new 463-word essay failed outright on
`deepseek` and on `mistral-medium` while `mistral-small` delivered the same
document. **It looked exactly like a model-quality difference, and it was
not.**

**What it actually was.** The model deletes the document's title — a lone
`[[11]]` placeholder — which is E-9's known dominant failure, and
`_reinsert_lost_masks` repairs it correctly. Then the job fails anyway, and
the verifier names a completely different span:

```
>>> REPAIR dropped=[11] -> REINSERTED
>>> VERIFY PROBLEMS (1): ['span [[17]] (block_quote) missing: 0 of 1 copies present']
```

The repair rejoined the chunk's paragraphs with a bare `"\n\n"`.
`_PARA_BREAK`'s trailing `[^\S\n]*` swallows the horizontal whitespace that
OPENS the next paragraph, and that whitespace is exactly what an indented
block quote is recognised by and part of the frozen text that must come back
character-for-character. **So the repair silently un-indented the block quote
beside the mask it was fixing, and the verifier was right to fail.**
Fixed; `uc_spans._paragraphs` had documented the same trap years of sessions
earlier and compensated for it.

**Two operating lessons, and the second is the general one:**

- **When a freeze failure names a span, read WHICH span.** The dropped
  placeholder in the retry prompt and the span the verifier rejects can be
  different objects, and the loud one is not always the cause.
- **Before blaming a model, run the same document through a model you trust
  and run a document you have measured before through the suspect model.**
  Two runs of E-9's own essay on both suspects came back 11/11 spans clean,
  which ruled the models out in ninety seconds and pointed at the document
  shape — a block quote next to a heading — instead.

**Diagnosing this needs no gateway money.** Monkeypatching `verify_restore`
and `_reinsert_lost_masks` to print, then reproducing the whole thing with a
hand-written fake model output, cost nothing and was faster than live runs.

## The gateway key has its OWN spend cap, and `balance` does not show it

**24 August 2026, E-16. It stopped a measurement campaign dead and, if the
records are right, took layer B down on the live site with it.**

Every model on the key started returning HTTP 402:

```
{"error":{"message":"API key budget exceeded. Current spend: $10.00,
limit: $10.00. Please contact your administrator to increase the budget.",
"type":"quota_for_entity_exceeded"}}
```

**At that moment the credits endpoint said this:**

```
{"balance":"14.9946587732","total_used":"10.0053412268"}
```

**$14.99 of balance, and not a cent of it spendable.** The cap is on the API
KEY, the credits endpoint does not report it, and every note in this project
so far has read `balance` as headroom. It is not. **`total_used` against the
key's limit is the number that matters**, and the limit is only visible in the
Vercel AI Gateway dashboard under the key itself.

**Before spending on a campaign, read `total_used`, not `balance`:**

```bash
cd ~/un-claude && KEY=$(grep '^AI_GATEWAY_API_KEY=' .env.engine.local | cut -d= -f2) \
  && curl -s https://ai-gateway.vercel.sh/v1/credits -H "Authorization: Bearer $KEY"
```

E-16 began with `total_used` at $9.6515923588 against a $10.00 key cap —
**$0.348 of headroom — while its brief carried a $3.00 stop-and-report rule.**
The rule could not have fired. **A budget rule stated in dollars is worthless
unless the remaining headroom is read first.**

**Two things this also teaches about reading failures:**

- **Eight consecutive 402s look exactly like a bad model.** Two runs in the
  campaign were recorded as `chunk N failed after 8 attempts: HTTPError` and
  the obvious reading — deepseek is unreliable today — was wrong. **When a
  run fails on HTTPError, make one bare `curl` to the gateway before drawing
  any conclusion about the model.** It takes five seconds and it is the
  difference between a finding and a fiction.
- **A campaign spends far more per run on a bigger model.** `mistral-medium`
  cost about 7x `mistral-small` per run here — $0.0362 against $0.0048 for one
  9,946-word document — so a ladder that is affordable on small is not
  automatically affordable on medium.
