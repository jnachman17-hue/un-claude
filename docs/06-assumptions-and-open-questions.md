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
| 2 | Which Kimi model variant to configure | config | Not chosen | Model identifiers change faster than any written knowledge. A name recalled from training would probably be stale and Jon would have no way to tell | At the moment of writing `.claude/settings.local.json`. Read the current list from Moonshot's own console and pick from what exists |
| 3 | What the tool actually does, in detail | scope | Undefined beyond "rewrites AI written text so it reads as human written" | Deliberately deferred. Jon wants a dedicated session to define the build, supply references and explain the intent | Session 2, first substantive session on Kimi |
| 4 | What counts as good output | definition | Undefined | Cannot be settled before item 3. This is the hardest question in the project and the one that decides whether it succeeds | With item 3, or immediately after |
| 5 | Whether `CLAUDE.md` section 3 is too strict | rule | The rule stands exactly as written: nothing outside `~/un-claude` gets read | Untested. It is the correct default but may block something legitimate once building starts | The first time a genuine task appears to require reading a file outside the project folder. Loosen it deliberately and record it here. Do not let the model quietly decide the rule does not apply |
| 6 | Whether this documentation system actually works in practice | unknown | Assumed to work, because it works in the project it was adapted from | Untested here. The conventions were carried over from a different project with a different subject, and nothing in this repository has been exercised by a real working session yet | End of session 2. Judge on: did the right things get written to the right files at the moment they happened, was real output shown instead of asserted, did the boundary in `CLAUDE.md` section 3 hold up against actual work. If a convention got in the way, fix the convention |
| 7 | Technology stack for the tool | technical | Not chosen | Depends entirely on item 3 | With item 3 |
| 8 | Where the project folder lives on disk | cosmetic | `~/un-claude`, directly in the home folder rather than alongside Blotter in `Documents/GitHub/` | Reversible with a single command and the GitHub repository does not care. Not worth spending a decision on | If Jon finds it untidy. No other trigger |

---

## Closed

Nothing yet. When a row closes, it moves here with the date and the ruling that
closed it, rather than being deleted.
