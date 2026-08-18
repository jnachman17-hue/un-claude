# un-claude: Assumptions and Open Questions

The live work list. Every row is something not yet settled, with a position to
work from in the meantime and a **trigger** that says when to look at it again.

The trigger column is the point of this file. Without it an open question is a
nag that gets reread every session and never resolved. With it, the question goes
dormant until a condition is actually met.

**Types:** `risk`, `config`, `scope`, `definition`, `rule`, `technical`,
`unknown`, `cosmetic`.

---

| # | Item | Type | Current working position | Why it is unresolved | Revisit trigger |
|---|---|---|---|---|---|
| 1 | How isolated the runtime environment should be | risk | Plain local folder at `~/un-claude`, permissions kept tight, nothing sensitive in the folder | The control risk is real: the model decides what runs on the laptop and Jon cannot evaluate a command by reading it. But every isolation option adds machinery that would make a failure impossible for him to diagnose | **Any of:** the project starts executing code the model wrote; a dependency or package is installed; a build runs; or the first time Kimi proposes a command Jon does not understand. At that point the next step is a separate macOS user account, not Docker |
| 2 | ~~Which Kimi model variant to configure~~ | config | **CLOSED 17 Aug 2026.** `kimi-k3` main, `kimi-k2.6` background | See Closed section below | Closed |
| 3 | What the tool actually does, in detail | scope | Undefined beyond "rewrites AI written text so it reads as human written" | Deliberately deferred. Jon wants a dedicated session to define the build, supply references and explain the intent | Session 2, first substantive session on Kimi |
| 4 | What counts as good output | definition | Undefined | Cannot be settled before item 3. This is the hardest question in the project and the one that decides whether it succeeds | With item 3, or immediately after |
| 5 | Whether `CLAUDE.md` section 3 is too strict | rule | **Trigger fired 17 Aug 2026, and the rule held. It stands unchanged.** Nothing outside `~/un-claude` gets read | The trigger condition was met: diagnosing why Kimi was not running genuinely required looking outside the folder, at how the desktop app launches and at global settings. The model stopped and said so rather than reading. The cost was real, in that it could not find the cause alone, but the diagnosis was completed with Jon using in-folder checks instead, so the rule blocked nothing that mattered. Recorded in `07-runbook.md` under "A boundary consequence worth knowing" | The **second** time it blocks something genuine. One clean stop is evidence the rule works; a pattern of stops is evidence it is too tight |
| 6 | Whether this documentation system actually works in practice | unknown | Assumed to work, because it works in the project it was adapted from | Untested here. The conventions were carried over from a different project with a different subject, and nothing in this repository has been exercised by a real working session yet | End of session 2. Judge on: did the right things get written to the right files at the moment they happened, was real output shown instead of asserted, did the boundary in `CLAUDE.md` section 3 hold up against actual work. If a convention got in the way, fix the convention |
| 7 | ~~Technology stack for the tool~~ | technical | **CLOSED 18 Aug 2026.** MakerKit Lite: Next.js, Supabase, Tailwind, shadcn/ui | See Closed section below | Closed |
| 10 | Billing. MakerKit Lite ships none | technical | Not built. Stripe is the presumed choice, nothing is decided or installed | The kit deliberately excludes payments, which was the known cost of choosing it over Vercel's starter. Nothing can be charged for until this exists | When the site is live on `un-claude.net` and the rewriting engine works end to end. Not before: billing for a product that does not yet work is wasted effort |
| 11 | Docker is not installed, so accounts cannot be tested offline | technical | Public site runs fine without it. Sign in and sign up screens render but cannot actually authenticate | Supabase runs locally inside Docker. Installing it needs Jon's approval under `CLAUDE.md` section 5, and it is not needed for deploying to Vercel, which uses hosted Supabase | The first time work requires a real user account to exist locally, or the first database change |
| 12 | Positioning: writing quality tool, or AI detector bypass | scope | Parked by Jon on 18 Aug 2026. Working position is the writing quality reading, per `CLAUDE.md` | Jon deferred landing page wording. But this is not only a wording question: it changes the engine, what counts as good output, and the legal and reputational exposure. Recorded so it is not decided silently by default | Before any landing page copy is written, or before row 4 is answered, whichever comes first |
| 13 | Auth errors show `<DefaultError />` to users | technical | Broken and unfixed. Confirmed live on 18 Aug 2026 | A bug in MakerKit Lite, not in anything we wrote. Any Supabase error without a canned message renders a raw placeholder instead of a sentence. Only three errors are covered. Cause traced to `packages/features/auth/src/components/auth-error-alert.tsx` line 37 | Before real users touch the sign up flow. It is small and self contained, so the trigger is simply the next session that touches auth |
| 8 | Where the project folder lives on disk | cosmetic | `~/un-claude`, directly in the home folder rather than alongside Blotter in `Documents/GitHub/` | Reversible with a single command and the GitHub repository does not care. Not worth spending a decision on | If Jon finds it untidy. No other trigger |
| 9 | ~~Whether the desktop app can run this project on Kimi~~ | config | **CLOSED 17 Aug 2026. It cannot. Use Terminal.** | See Closed section below | Closed |

---

## Closed

When a row closes it comes here with the date and the ruling that closed it,
rather than being deleted.

**Row 2, which Kimi model variant to configure. Closed 17 August 2026, session
1.** `kimi-k3` for the main session, `kimi-k2.6` for background housekeeping.
Chosen by reading Moonshot's published model list rather than from memory, which
mattered: every Kimi model recallable from training had been discontinued in May
2026. Full reasoning in `04-decision-log.md` entry 7.

**Still open and worth re-reading:** whether `kimi-k3` is the right pick is not
the same question as which models exist. If output quality disappoints or cost
runs high, `kimi-k2.7-code` is the alternative and the change is one line in
`.claude/settings.local.json`. That is a live option, not a closed one.

**Row 7, technology stack. Closed 18 August 2026, session 3.** MakerKit Lite, the
free MIT licensed Next.js and Supabase starter kit, merged into the repository
root and installed. Vercel's `nextjs/saas-starter` was considered on Jon's
prompting and rejected: it sits on an unfinished pre release build of Next.js,
has had two commits in fourteen months, and writes its own login system by hand.
Full reasoning, including the star count argument, in `04-decision-log.md` entry
14. **The known cost is that MakerKit Lite has no billing.** That is now row 10.

**Rows 2 and 9 are void, not closed.** Both were about Kimi, which was retired on
18 August 2026 by decision 11. The questions no longer exist. **Row 9's rule that
this project must run in Terminal is void with them,** because its only reason
was that the desktop app would not load the Kimi settings.

**Row 9, whether the Claude Code desktop app can run this project on Kimi. Closed
17 August 2026, session 2.** It cannot. The desktop app does not load the
project's `env` block and runs on Claude regardless of what
`.claude/settings.local.json` says. Running `claude` in Terminal from
`~/un-claude` loads it correctly, confirmed by `/status` reporting the Moonshot
base URL and `kimi-k3`. **This project is worked on in Terminal from now on.**
Full reasoning in `04-decision-log.md` entry 9.

**The part worth carrying forward:** session 2 was meant to be the first session
on Kimi and was not, and nothing in the project would have revealed that. The
repository said Kimi, the settings file said Kimi, and the dashboard said zero. A
correct configuration file is not evidence of a loaded one.
