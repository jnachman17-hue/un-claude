# un-claude: Current Handoff

**Date:** 18 August 2026, session 3
**Status:** The product skeleton is installed and runs. The rewriting engine does
not exist. Nothing is deployed.

**This file holds resumption context only.** It is rewritten wholesale every
session. Nothing may live here as its only record. If it matters beyond the next
session it belongs in `04-decision-log.md`,
`06-assumptions-and-open-questions.md`, or `07-runbook.md`.

---

## 0. What changed in session 3, and it is a lot

**Read this section before acting on anything written in an earlier session.**
Three things were settled that make large parts of the older documents
historical rather than operative.

**Kimi is retired. This project is built with Claude Code on Claude.** Jon's
instruction, decision 11. Everything about Moonshot, `kimi-k3`, the model picker
trap and the Terminal only rule is now history. **It was kept, not deleted,**
because two lessons in it are general and still true: a correct configuration
file is not a loaded one, and ask the service rather than the tool.

**Three consequences you must not miss:**

- **`CLAUDE.md` section 3 was corrected.** It said everything reaches Moonshot.
  It now says Anthropic. **The boundary rules themselves did not relax.** Nothing
  outside `~/un-claude` gets read, and `~/Documents/GitHub/Blotter-Claude` stays
  off limits.
- **The emergency stop changed and is weaker.** Deleting the Moonshot key no
  longer does anything. There is no single console switch now. Close the window,
  and deny the permission prompt. Recorded honestly in `07` rather than glossed.
- **The Terminal only rule is void.** Its sole reason was that the desktop app
  would not load the Kimi settings. The desktop app is fine now.

**The project was rescoped.** It builds an AI text humanizer, sold as a product
with accounts. **Removing Anthropic watermarks is explicitly not the goal and is
not part of this project.** Decision 10. Jon owns the rewriting engine itself,
meaning the model and prompting that do the humanizing. These sessions build the
product around it.

**The domain is `un-claude.net`,** owned by Jon. Decision 12.

---

## 1. Where to pick up

**The site runs locally right now:**

```bash
cd ~/un-claude && pnpm dev
```

Then open `http://localhost:3000`. It currently shows MakerKit's own marketing
page, headline "Ship a SaaS faster than ever," because none of the content has
been replaced yet.

**The obvious next step is deploying the placeholder to Vercel on
`un-claude.net`.** That was Jon's stated Phase 1 and it is the only piece of it
not yet done. **It needs two approvals from Jon before it can happen,** both
under `CLAUDE.md` section 5, and neither has been given:

1. **Pushing to GitHub.** There are now 7 unpushed commits.
2. **Publishing under his name.** A live site on his domain is publishing.

**It also needs a hosted Supabase project,** which is a free account Jon creates,
and which produces the keys the deployed site needs to run.

---

## 2. Do not repeat, do not ask about

- MakerKit Lite is chosen and installed. **Do not relitigate the boilerplate.**
  Vercel's `nextjs/saas-starter` was considered on Jon's own prompting and
  rejected with reasoning in `04` entry 14.
- Node, pnpm and the dependencies are installed and working. Nothing to set up.
- The kit's `.mcp.json` was deleted deliberately. **If it reappears, delete it
  again.** Reasoning in `07`.
- The secret boundary was re-verified after the `.gitignore` merge.
- Jon has parked landing page wording. Do not draft copy unprompted.

---

## 3. The gap that actually matters

**Two sessions of setup and one of infrastructure have produced no answer to the
question that decides whether this product is any good.**

`06` row 4: **what counts as good output.** It has been open since session 1. A
humanizer with no agreed definition of success cannot be tested, tuned, or
finished, and no amount of infrastructure substitutes for it.

Jon owns the engine, so he may consider this his. **It still needs to exist as a
written standard in this repository,** or nobody can tell whether a change made
the tool better or worse.

**Related and also open, as `06` row 12:** whether this is positioned as a
writing quality tool or as an AI detector bypass. Jon parked the wording. The
underlying fork is real, it changes the engine and the legal exposure, and it is
recorded so it does not get decided silently by default.

---

## 4. Things that will bite you

**Git on this machine is 2.23, from 2019.** Several modern commands do not exist.
Workarounds in `07`.

**Stage by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.**
The kit added 389 files, so this rule now matters more than it did.

**Re-run the secret check after any change to `.gitignore`:**

```bash
git check-ignore -v .claude/settings.local.json
```

**Docker is not installed,** so accounts cannot be created or tested locally. The
public site runs fine without it. `06` row 11.

**MakerKit Lite has no billing at all.** That was the known cost of choosing it.
`06` row 10.

**There is no memory between sessions except these files.** If a session ends
mid task this file will still describe the last clean state and will not know it
is wrong. The true indicators are `git status` and `git log origin/main..main`.

---

## 5. How sessions work

**Jon is not a programmer.** He directs by describing outcomes and reviews by
looking at the actual thing, never by reading code. For a text tool that means
showing real input and real rewritten output, in full, in the session.

**He wants pushback.** Agreeing with a bad plan and executing it well is a
failure. Session 3 is the evidence this works: the two boilerplates he was handed
both failed on inspection, one of them fatally, and checking rather than
complying is what caught it.

**He wants a recommendation, not a menu.**

**Warn him before the context window fills.** He has asked for this explicitly
and cannot see it coming.

**Bad news first, plainly, once.** No extended apology, no self criticism.

---

## 6. Sessions so far

**Session 1, 17 August 2026.** Setup. Repository, `CLAUDE.md`, the documentation
system, secret boundary tested twice, Kimi configured. Five commits.

**Session 2, 17 August 2026.** Diagnosed that no session had ever actually
reached Moonshot despite a correct configuration file. Established the desktop
app as the cause. No product work.

**Session 3, 18 August 2026. Claude.** The project was rescoped to an AI text
humanizer and Kimi was retired. Researched the two boilerplates in Jon's brief:
**Firestarta was found to have no licence file and to have been abandoned since
March 2024, and its description in the brief was factually wrong about its own
authentication stack.** Vercel's starter was raised by Jon on star count and
rejected on evidence. MakerKit Lite was chosen, merged, installed and verified
running. `CLAUDE.md` section 3 and the runbook's emergency stop were corrected
because Kimi's retirement had made both false. Two commits.
