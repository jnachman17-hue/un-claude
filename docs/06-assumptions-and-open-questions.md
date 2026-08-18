# un-claude: Assumptions and Open Questions

The live work list. Every row is something not yet settled, with a position to
work from in the meantime and a **trigger** that says when to look at it again.

The trigger column is the point of this file. Without it an open question is a
nag that gets reread every session and never resolved. With it, the question goes
dormant until a condition is actually met.

**Types:** `risk`, `config`, `scope`, `definition`, `rule`, `technical`,
`unknown`, `commercial`, `legal`, `cosmetic`.

**Rewritten 18 August 2026, session 4,** when the project was rescoped from an AI
text humanizer to an AI watermark remover. Rows made void by that rescope are in
the Closed section with the reason, rather than deleted.

---

## Open

| # | Item | Type | Current working position | Why it is unresolved | Revisit trigger |
|---|---|---|---|---|---|
| 4 | What counts as good output **for layer B only** | definition | **Open since session 1, and now much smaller than it was.** The rescope answered it for layers A and metadata by definition: the mark was there, now it is not, and that is countable. It survives untouched for layer B, where removal cannot be checked | Whether a statistical watermark was removed is not directly observable by us or anyone else. The engine's own documentation calls layer B best effort. **There is no way to write a passing test for it**, which is exactly why entry 23 requires it to be labelled unverified rather than measured | Before any prompt tuning on layer B, or the first time a user complains that layer B did nothing. Whichever is first |
| 10 | Billing does not exist, and MakerKit Lite ships none | technical | **Not built, and launch does not wait for it.** Entry 22: launch free with tight caps, no purchase flow, wallet screen says credits are coming. **Jon's instruction is that billing work starts immediately and runs in parallel**, not after launch | Payments are multi day work where a bug takes real money from real people, and the kit has zero payment code, verified three ways in `04` entry 14 | Immediately, in parallel with the launch build. Not deferred |
| 18 | **Pricing and unit economics are undecided** | commercial | **Nothing decided. Gets its own dedicated session.** Jon's position: text should be priced in words because that is easy to understand, but files vary so much in size that per file pricing probably does not work | The three layers have wildly different costs. Layer A costs nothing to run. Metadata costs almost nothing. **Layer B calls a model and costs real money every time.** One unit across all three is not obviously right, and Jon has not yet formed a view | **A dedicated unit economics session, before the purchase flow is built.** Entry 22 requires usage recording from the first line of code so that session prices from real numbers rather than guesses |
| 20 | **The abuse surface that arrives with file upload** | risk | **Accepted, unmitigated.** Entry 24 puts uploads in scope for PDF, DOCX, PNG and JPG | Accepting files from strangers means size limits, temporary storage, and the possibility of hostile files. None of it exists. **The launch caps are the only defence and they are not a real one** | Before launch: a hard file size limit and a format allow list. Anything beyond that when the first abuse actually happens |
| 21 | **Stripping C2PA may attract regulation** | legal | **Not a blocker and the build proceeds.** Recorded so it is not learned from a payment processor | C2PA is an industry provenance standard backed by large companies, and AI disclosure rules are moving, including EU AI Act obligations around labelling AI generated content. **Stripping it is legal today.** Whether it stays commercially safe is a different question and not one this project can answer from inside itself | Any of: a payment processor asks what the product does, a regulation naming provenance stripping is passed, or before Jon markets to customers outside the US |
| 22 | **A how it works page, and a mission page** | scope | **Parked by Jon, session 4, as a side note rather than a request.** He wants a page explaining what watermarking is and how the tool removes it, with simple animations, and a separate page where he writes his own thoughts on why the product exists. **He said explicitly this may all fold into the landing page instead** | Not needed for launch and not yet designed. Recorded because a parked idea that is not written down is a lost one | When the landing page structure is designed, which is the session after launch at the earliest |
| 23 | **What the product may honestly claim, now that layer A is known not to touch Claude's watermark** | scope | **Undecided and Jon has not yet ruled.** Working position: layer A is sold as removing invisible characters, which is true and provable, and never as removing Claude's watermark, which Anthropic's own documentation rules out | `docs/anthropic-watermarking-context.md` establishes that Anthropic adds no hidden characters. **A visitor arriving because they want Claude's watermark gone is not served by layer A at all**, and would be misled by copy implying otherwise. Jon has ruled that users are never misdirected, so this has to be settled deliberately rather than by whatever the headline ends up saying | **Before any landing page copy is written.** It is the first question that copy has to answer |
| 24 | **Whether Anthropic's detection API, when it ships, can be used to verify layer B** | technical | **Plan for no. Treat it as upside, not as the plan.** Layer B stays labelled unverified until this is settled with real terms in hand | Anthropic confirmed on 12 August 2026 that a publicly callable detection API is in development. **No ship date, no access model, no pricing, no terms.** And a removal tool querying a detector in a before and after pattern is the exact evasion oracle pattern such an API would be expected to control against. **Assuming we may use it is assuming a term of service nobody has published** | When Anthropic publishes the API's terms. Then read them before building anything that depends on it |
| 26 | **PDF support, deferred from version one** | scope | **Out of v1 by `04` entry 26.** Version one is pasted text, PNG, JPG and Word documents | PDF cleaning needs `qpdf`, a program that rebuilds the file so deleted content cannot be recovered from it. **Vercel cannot install it.** Doing PDFs without it would mean telling a user their file is clean while the old data is still inside it, which is the exact broken promise this product exists to avoid. **Two ways in when we want it:** run the PDF part on a second computer somewhere, or write the rebuilding ourselves in the site's own language | **Any of:** users ask for it, a paying customer needs it, or the first time someone reports sending a cleaned document to a client. It is a real gap and it will grow, not shrink |
| 27 | **What the results panel is a receipt for.** Jon has a preference and it is not yet argued out | scope | **Unresolved. Track B moved position and Jon is not sure he agrees.** Recorded now because Track B is paused and this would otherwise be lost | **Track B's original design:** the panel shows what was found and removed. **Track B's revised design, after an exchange with Jon:** a fixed list of checks, always the same, always shown, each line resolving to either clear or found and removed. **Its argument for changing:** a receipt of removals makes *finding* the success condition, finding depends on what the input happens to carry, which we do not control, so a clean input makes a working product look broken. **Jon's position, verbatim: he "might prefer old version."** His reasoning is **not yet stated** and the message recording it was cut off mid sentence. **The trade as Track A reads it:** the removals view is startling, and being startled is the strongest thing this product has. "There were six invisible characters in the paragraph you just pasted" converts. "We checked twelve things and all were clear" reassures but does not. The checklist view never looks broken and never lands either. **This also collides with the free and paid split**, since `/inspect` is the free hook and is exactly the screen in question | **Before any results panel is built.** Track B is paused, so this is dormant until it resumes. **Do not let whoever resumes it treat the revised design as settled**, because Jon did not settle it |
| 13 | Auth errors show `<DefaultError />` to users | technical | **Broken and unfixed.** Confirmed live 18 Aug 2026 | A bug in MakerKit Lite, not in anything we wrote. Any Supabase error without a canned message renders a raw placeholder instead of a sentence. Only three errors are covered. Traced to `packages/features/auth/src/components/auth-error-alert.tsx` line 37 | **Now urgent rather than pending.** Launch is within days and real strangers will hit sign up. Fix before launch |
| 1 | How isolated the runtime environment should be | risk | **Trigger fired 18 Aug 2026 and was not acted on.** Dependencies installed, code written and executed, a build ran. Jon present and approving each step. Position unchanged: plain local folder at `~/un-claude` | The control risk is real: the model decides what runs on the laptop and Jon cannot evaluate a command by reading it. Every isolation option adds machinery that would make a failure impossible for him to diagnose | **Raised again by the rescope:** the engine build will install Python packages and may run external tools. If that happens, the next step is a separate macOS user account, not Docker |
| 5 | Whether `CLAUDE.md` section 3 is too strict | rule | **Trigger fired 17 Aug 2026 and the rule held. Stands unchanged.** Nothing outside `~/un-claude` gets read | It genuinely blocked a diagnosis once, and the diagnosis was completed another way, so the rule blocked nothing that mattered. Recorded in `07` | The **second** time it blocks something genuine. One clean stop is evidence the rule works. A pattern is evidence it is too tight |
| 11 | Docker is not installed, so accounts cannot be tested offline | technical | Public site runs fine without it. Sign in and sign up render locally but cannot authenticate | Supabase runs locally inside Docker. Installing it needs Jon's approval under `CLAUDE.md` section 5 | The first time work requires a real local account, or the first database change |
| 8 | Where the project folder lives on disk | cosmetic | `~/un-claude` | Reversible with one command. Not worth a decision | If Jon finds it untidy |

---

## Closed

When a row closes it comes here with the date and the ruling that closed it,
rather than being deleted.

**Rows 19 and 25, the engine architecture. CLOSED 18 August 2026, session 4,
Track A session A1.** Both were deliberately parked by Jon for a technical
session, and both were answered in it by `04` entry 27. **Row 19** asked how much
of `guillaumemeyer/watermarks-remover` to use and how to connect a Python engine
to a TypeScript site. **Row 25** asked how to deploy an engine needing system
programs rather than only Python. **The answer to both came from dropping PDF**,
`04` entry 26: without PDF there is no need for `qpdf`, without `qpdf` there is
no need for any separate program, and the engine then runs on Vercel in the same
place as the site. One hosting company, no Docker, and the repository used as
heavily as Jon wanted.

**Worth carrying forward.** The assistant put two options to Jon and both were
worse than the answer he reached by asking why PDFs mattered at all. **A scope
question can dissolve an architecture problem, and it is worth asking what can be
dropped before asking how to support everything.**

**Row 12, positioning: writing quality tool or AI detector bypass. CLOSED 18
August 2026, session 4.** **Answered by the rescope, and this is the row the
whole project turned on.** It was parked in session 3 and recorded specifically
so it would not be decided silently by whatever prompt got written first. It was
not decided silently. Jon decided it deliberately, and picked neither of the two
options originally written down: the product is not a writing quality tool and it
is not a detector bypass tool either. **It removes watermarks, and it is honest
about which of the three layers can be proved to work.** `04` entries 18 and 23.

**Row 3, what the tool actually does. Closed twice.** First on 18 August 2026,
session 3, as an AI text humanizer. **Reopened and re-answered the same day in
session 4** as an AI watermark remover, `04` entry 18. Left here as a pair rather
than overwritten, because a question that closed and reopened within one day is
worth being able to see.

**Row 14, the mock engine barely improves the headline metric. VOID 18 August
2026, session 4.** The mock and the metric are both scrapped with the humanizer.
**One finding underneath it survives and is not void:** compressing every
sentence uniformly made the prose measurably more machine like, not less, because
uniformity is itself the tell. **That transfers directly to layer B**, which is a
rewriter and can degrade the thing it is selling in exactly the same way. Kept in
`01-build-spec.md`.

**Row 15, the tool is not on the public page. Closed 18 August 2026, session 4,
as decided but not built.** `04` entry 20 rules that the landing page *is* the
product, with the tool usable by strangers and no separate application behind the
login. The humanizer was built the opposite way, at `/home` behind login, and is
scrapped.

**Row 6, whether this documentation system works in practice. CLOSED 18 August
2026, session 4. It works, and session 4 is the evidence.** A rescope that
reversed the central decision of the project was captured in the decision log
before any file was edited, with the reasoning and with the superseded entries
left visible. **The failure it did not prevent is the more useful result:**
`00-START-HERE.md` went stale twice in two days, both times because rewriting the
index was treated as cleanup rather than as part of finishing the work. Recorded
in that file.

**Rows 2 and 9 are VOID, not closed. 18 August 2026.** Both were about the
outside model provider this project was originally going to be built on, which
was abandoned by `04` entry 11. The questions no longer exist. **Row 9's rule
that this project must be run from Terminal is void with them,** because its only
reason was that the desktop app would not load that provider's settings. The
desktop app is fine. **The lessons from both are kept in `07` without the
history.**

**Row 7, technology stack. Closed 18 August 2026, session 3.** MakerKit Lite,
the free MIT licensed Next.js and Supabase starter kit. Vercel's
`nextjs/saas-starter` was considered on Jon's prompting and rejected: an
unfinished pre release build of Next.js, two commits in fourteen months, and a
hand written login system. Full reasoning in `04` entry 14. **The known cost is
that it has no billing.** That is row 10, and it is now urgent rather than
future.

