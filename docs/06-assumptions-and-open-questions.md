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
| 22 | ~~A how it works page, and a mission page~~ **CLOSED 19 Aug 2026 by `04` entry 40.** Four pages at launch: landing, technical deep dive, precise capabilities, and a mission page Jon writes himself | scope | **Closed. In scope and being built.** Original note kept: parked by Jon, session 4, as a side note rather than a request. He wants a page explaining what watermarking is and how the tool removes it, with simple animations, and a separate page where he writes his own thoughts on why the product exists. **He said explicitly this may all fold into the landing page instead** | Not needed for launch and not yet designed. Recorded because a parked idea that is not written down is a lost one | When the landing page structure is designed, which is the session after launch at the earliest |
| 23 | **What the product may honestly claim, now that layer A is known not to touch Claude's watermark** | scope | **Undecided and Jon has not yet ruled.** Working position: layer A is sold as removing invisible characters, which is true and provable, and never as removing Claude's watermark, which Anthropic's own documentation rules out | `docs/anthropic-watermarking-context.md` establishes that Anthropic adds no hidden characters. **A visitor arriving because they want Claude's watermark gone is not served by layer A at all**, and would be misled by copy implying otherwise. Jon has ruled that users are never misdirected, so this has to be settled deliberately rather than by whatever the headline ends up saying | **Before any landing page copy is written.** It is the first question that copy has to answer |
| 24 | **Whether Anthropic's detection API, when it ships, can be used to verify layer B** | technical | **Plan for no. Treat it as upside, not as the plan.** Layer B stays labelled unverified until this is settled with real terms in hand | Anthropic confirmed on 12 August 2026 that a publicly callable detection API is in development. **No ship date, no access model, no pricing, no terms.** And a removal tool querying a detector in a before and after pattern is the exact evasion oracle pattern such an API would be expected to control against. **Assuming we may use it is assuming a term of service nobody has published** | When Anthropic publishes the API's terms. Then read them before building anything that depends on it |
| 26 | **PDF support, deferred from version one** | scope | **Out of v1 by `04` entry 26.** Version one is pasted text, PNG, JPG and Word documents | PDF cleaning needs `qpdf`, a program that rebuilds the file so deleted content cannot be recovered from it. **Vercel cannot install it.** Doing PDFs without it would mean telling a user their file is clean while the old data is still inside it, which is the exact broken promise this product exists to avoid. **Two ways in when we want it:** run the PDF part on a second computer somewhere, or write the rebuilding ourselves in the site's own language | **Any of:** users ask for it, a paying customer needs it, or the first time someone reports sending a cleaned document to a client. It is a real gap and it will grow, not shrink |
| 27 | **What the results panel shows.** Jon's position is the working one | scope | **Show everything we scanned for, every time.** A fixed list of checks, each line resolving to a tick or a cross, with anything found highlighted as removed. **This is Jon's design, and it is the working position.** | **Track B originally proposed** showing statistics of what was removed. **Jon rejected it, and his reasoning is the substance of this row: a removals-only panel creates a false success condition.** It teaches users that finding things means the product works, when **there are many correct cases with nothing to show.** Two he named: **layer B leaves no visible trace at all**, so the one layer that costs us money per run would display nothing; and **a user may paste text that was never AI generated**, where finding nothing is the right answer. In both, a working product looks broken. **Recorded because Track B is paused and this would otherwise be lost with it. Not to be relitigated.** Track A's earlier note had the two positions reversed and this row replaces it | **When Track B resumes and the results panel is built.** Jon's design is the starting point, not an open question. Anyone reopening it must answer the false success condition problem first |
| 28 | **The surviving-wording measure as a user-facing receipt** | scope | **Jon's idea, parked for the website design session.** After a paste, show what was altered as proof the tool did something; and explain the measure properly on a separate how-it-works page | **It must never be labelled a watermark score.** No detector exists. The adversarial review already killed one version of this: it displayed 0.0% on a rewrite that was 26.4% carried over, and it improved when the model dropped one of the user's numbers. **Any user-facing version must measure several run-lengths, not one, and must be paired with a fact-survival check** so the score cannot improve by damaging the document. Fits `06` row 27, Jon's checklist panel, as one line of it | **The website design session.** Do not build it before row 27's panel design is settled |
| 29 | **Upgrade path: more thinking for better output** | technical | **Parked by Jon as a future improvement.** Ship the fast model now, revisit when quality matters more than launch speed | **Measured this session:** the models that produce the least surviving wording are the ones that write long private reasoning before answering, and that is exactly what makes them slow. qwen wrote **10,796 hidden thinking tokens** to produce 539 visible words, taking 76 seconds against mistral's 6. **Vercel kills any job at 60 seconds**, so qwen needs the document split into pieces sent simultaneously before it is usable. **A correction Jon should not lose: mistral-small performs no reasoning at all and no prompt can make it.** Getting more thinking means changing model, not changing wording | **When launch is done and quality becomes the priority**, or the first time a user complains the rewrite is shallow |
| 30 | **What the site is allowed to claim about layer A** | scope | **Sourced and settled in substance, not yet written as copy.** Layer A removes a real, observable tell that catches people today. **It does not remove any provider's deliberate watermark and must never be called one.** `04` entry 35 | Anthropic states directly that no hidden characters are added. The characters layer A finds come from other sources, notably a documented ChatGPT quirk emitting narrow no-break spaces which **OpenAI denied was deliberate.** The strongest provable claim is the file side: every major hosted provider except Grok and Midjourney marks generated files with C2PA, and C2PA is removable by design | **Before any landing page copy is written.** This is the answer to row 23 for layer A specifically |
| 31 | **Whether a real user's Word document actually carries C2PA tags** | technical | **Unproven. Do not claim Office documents in copy until it is.** | The metadata proof used `sample_ai.xlsx`, a test fixture shipped with the engine repository. **The cleaning worked and was verified against raw bytes.** What is not shown is that a document a real person would have carries those tags at all. Anthropic's own C2PA covers SVG, PNG and JPG, **not Word documents** | **Get one real AI-produced Office document and scan it.** Before Office documents appear in any claim |
| 32 | ~~Two logo strips would compete~~ **CLOSED 19 Aug 2026 by `04` entry 41.** One strip only, the publications | cosmetic | **Closed in favour of the working position: publications get the strip, AI provider names do not.** Provider coverage carried as text instead. **Not yet put to Jon** | Two logo ideas are live: publication logos below the tool, ruled in by `04` entry 34, and provider names near the top standing in for the credibility statistics GPTZero has and we do not. **Two logo strips near each other is noise** | **When the page structure is laid out** |
| 33 | **What "some visuals" means** | scope | **Unresolved.** Jon asked for serious with some visuals and has not said what visuals means | **Working position, put to him and unanswered:** the main visual is the product's own output, the user's text with hidden characters lit up in place, using `sample_offsets`. It is the most interesting image available, costs nothing, and **no competitor can show it** because they do not return per character positions | **Before the hero is built** |
| 34 | **Publication logo files need approval before they arrive** | rule | **Do not fetch them unasked.** `CLAUDE.md` section 5 requires approval before downloading a file, and there will be roughly a dozen | Either Jon supplies them with the articles, or he approves the download explicitly. Most outlets publish a brand or press page with permitted versions, which is where they should come from rather than a search result. **Logos are trademarks: using one to imply endorsement is the risk, using a name to point at something that outlet published, with a link, is citation** | **When the marquee is built.** Worth a real legal check before launch rather than a model's opinion |
| 35 | **Layer B is non-deterministic and nobody can verify it** | risk | **Accepted and surfaced rather than hidden.** Every response carries `verified: false` and a `figures_to_check` list | The same input twice gives different output: one live run returned 205 of 206 numbers where another returned 206. **No public detector exists, so removal cannot be verified by us or anyone.** Anthropic confirmed one is in development with no date, access model or terms | **`06` row 24's trigger.** When Anthropic publishes terms, read them before building anything that depends on the detector |
| 36 | **Untested content types, and quotations are the known weak spot** | technical | **Untested. Do not assume it works** | Verified on business prose and discursive essay prose at five lengths. **Not tested:** legal text with defined terms, academic writing with citations, quotation-heavy journalism, CVs, or deliberately hostile input trying to hijack the rewriting model. **Quotations are the structural weak spot:** a quote that must survive verbatim is preserved wording by definition, which is exactly the channel the watermark survives through | **Before launch.** It is the last engine risk not yet measured |
| 37 | **How a free allowance is tracked so it cannot be refilled by opening a new tab** | technical | **Nothing built.** Measured answer: a new tab does not refill under any method, but a private window, cleared site data, or a second device all refill unless an account is required. **Nothing short of a card on file stops a determined person, and that is true of every tool in this category** | Jon's question, session 5, and the right one. **The exposure is smaller than it looks:** layers A and metadata call no model, so someone gaming them costs bandwidth and nothing else, and layer B costs about 0.06 cents per 1,000 words, so five gamed accounts cost pennies. **The reason to gate is conversion behaviour, not cost control.** Assistant's recommendation: scan free and ungated always, a small free allowance on cleaning tracked by browser storage plus IP, and an account required for layer B | **The pricing session, and before the free cap is built.** `03-pricing.md` now exists from Jon's parallel session and has not yet been read into this one |
| 38 | ~~Layer B is not wired into the interface~~ **CLOSED 19 Aug 2026.** Wired, with a free allowance in front of it and `UC_ENABLE_LAYER_B` defaulting to OFF in production so a deploy cannot start a bill. `04` entry 48 | risk | **Closed. The gate is browser storage, which is gameable, and row 37 still owns the real one.** | Layer B costs money on every run and the credit gate that has to sit in front of it does not exist. `clean.py` carries a comment saying "Layer B is signed-in only, 04 entry 22" and **entry 22 does not say that and nothing in the code enforces it.** A rule that exists only as a comment, attributed to a source that does not contain it, is not a rule | **Before layer B appears in the interface at all.** It is the next piece of the tool after the page sections |
| 39 | ~~The surviving-wording receipt does not exist~~ **CLOSED 19 Aug 2026.** Built in `apps/web/lib/engine/receipt.ts`, computed in the clean route, no model call and no cost. Measures six run lengths paired with a figure survival count, per row 28 | technical | **Closed. Was:** not built. `ENGINE.md`'s "10.8% surviving runs" came from a session 4 test harness, not from the engine. The layer B payload carries `words_in`, `words_out`, `figures_to_check` and nothing comparing wording | Jon asked for receipts showing how different the rewritten text is, believing a parameter already existed. It does not. **It is cheap to add:** pure text comparison, no model call, no cost. `06` row 28 already constrains how: several run lengths rather than one, paired with the fact survival check, and never labelled a watermark score | **With layer B, row 38.** Both land together or the rewrite ships with no visible result |
| 40 | **Google sign in: console work done, one claim in this row was wrong** | risk | **Corrected 19 Aug 2026, session 6. There is no Google review standing between us and a working Google button, and this row previously said there was.** Google's rule: an app requesting only non-sensitive permissions is not required to complete verification. **Proven live rather than assumed** by reading what Supabase actually asks Google for: `scope=email profile`. Nothing else. `packages/features/auth/src/components/oauth-providers.tsx` has no Google entry in `OAUTH_SCOPES`, so the defaults stand. **Google Cloud project, consent screen, client and Supabase provider are all configured and confirmed working.** What remains is a local test of the real button, then `oAuth: ['google']`, then Publish | **The wrong claim came from the original failure being read as a review problem when it was a configuration problem.** The raw JSON error meant only that nobody had enabled the provider. **The review that does exist is brand verification, which governs whether the app's name and logo are displayed and gates nothing about signing in.** That is row 41 | **Fired and being worked. Closes when the button is live on `un-claude.com` and Jon has signed in through it** |
| 41 | ~~The Google consent screen says `itdgggoxsoolbfiwujvt.supabase.co`~~ **CLOSED 19 Aug 2026 by `04` entry 55. It now reads "Sign in to continue to un-claude", confirmed by Jon in a clean incognito window** | risk | **Closed on the free path. Nothing was bought.** This row and `04` entry 45 both claimed Supabase's $10 custom domain add-on was the unlock. **Both were wrong and Jon said so at the time** | **The real blocks were mundane and are worth remembering over the theory:** the app was never published, so verification never started; publishing the app is not publishing the branding, which needs `Verify Branding` then `Publish branding` on a different page; and the first attempt failed on an unreachable privacy policy because the parallel session had rebuilt the site four times in ninety minutes. **`supabase.co` is still an undeletable authorized domain and verification passed regardless** | **Closed. Two constraints survive in `07`:** the Google app name must change in lockstep with the site's own name, and any branding change re-runs verification |
| 42 | **The engine was broken for every rewrite under ~350 words and nobody knew** | risk | **Fixed 19 Aug 2026 and verified against the live model.** `uc_chunk.rewrite_long` called `one(0)` before `one` was defined, so any single-chunk document raised `UnboundLocalError` | **The lesson is bigger than the bug.** Session 4 proved layer B on five documents from 1,260 to 5,047 words, every one of which split into multiple chunks and took the other code path. **A feature proved only on large inputs was completely broken on small ones, and a landing page box is almost entirely small inputs.** The engine reported only the exception type, so the failure carried no clue where it came from | **Before launch: test every feature at the smallest input a real user would give it, not only the largest.** No automated test suite exists yet, which is row 36's territory |
| 43 | **The tool told every uploaded file it was made by Google** | risk | **Fixed 19 Aug 2026.** Producer detection flattened the scan report including field NAMES, and the report always carries a field called `synthid` regardless of what was found | **This is the failure mode this product cannot afford:** a false claim about a named company, printed in the interface as though it had been read out of the user's file. It was caught by testing a clean image alongside a marked one rather than only a marked one | **Any future detection feature must be tested on a NEGATIVE case.** Testing only the positive case is what let this through |
| 44 | **Publication logos are still wordmarks, not logo files** | cosmetic | **Names only, each linking to that outlet's own article.** Nine outlets from Jon's list, ordered by reach | `06` row 34 requires Jon's approval before any logo file is fetched, and `CLAUDE.md` section 5 requires it before anything is downloaded. **Separately: OpenAI has had its mark removed from the icon source everyone uses**, which is a signal about how that trademark is enforced and a reason to be careful | **When Jon supplies logo files or approves fetching them** |
| 45 | **Social links are not in the footer** | cosmetic | **Left out deliberately.** Jon asked for them and has not given the handles | A footer full of links to nothing is worse than a footer without them. The section is one edit away | **When the accounts exist** |
| 13 | Auth errors show `<DefaultError />` to users | technical | **Broken and unfixed.** Confirmed live 18 Aug 2026 | A bug in MakerKit Lite, not in anything we wrote. Any Supabase error without a canned message renders a raw placeholder instead of a sentence. Only three errors are covered. Traced to `packages/features/auth/src/components/auth-error-alert.tsx` line 37 | **Now urgent rather than pending.** Launch is within days and real strangers will hit sign up. Fix before launch |
| 1 | How isolated the runtime environment should be | risk | **Trigger fired 18 Aug 2026 and was not acted on.** Dependencies installed, code written and executed, a build ran. Jon present and approving each step. Position unchanged: plain local folder at `~/un-claude` | The control risk is real: the model decides what runs on the laptop and Jon cannot evaluate a command by reading it. Every isolation option adds machinery that would make a failure impossible for him to diagnose | **Raised again by the rescope:** the engine build will install Python packages and may run external tools. If that happens, the next step is a separate macOS user account, not Docker |
| 5 | Whether `CLAUDE.md` section 3 is too strict | rule | **Trigger fired 17 Aug 2026 and the rule held. Stands unchanged.** Nothing outside `~/un-claude` gets read | It genuinely blocked a diagnosis once, and the diagnosis was completed another way, so the rule blocked nothing that mattered. Recorded in `07` | The **second** time it blocks something genuine. One clean stop is evidence the rule works. A pattern is evidence it is too tight |
| 11 | Docker is not installed, so accounts cannot be tested offline | technical | Public site runs fine without it. Sign in and sign up render locally but cannot authenticate | Supabase runs locally inside Docker. Installing it needs Jon's approval under `CLAUDE.md` section 5 | The first time work requires a real local account, or the first database change |
| 8 | Where the project folder lives on disk | cosmetic | `~/un-claude` | Reversible with one command. Not worth a decision | If Jon finds it untidy |

| 46 | **The legal pages make claims that stop being true the moment we add analytics or payments** | legal | **Written truthfully on 19 Aug 2026 and correct as of that date. Both of the things that break them are already planned.** The privacy policy states we run no advertising or tracking and lists four third parties. The terms state the service is free and collects no payment method. **Jon has said analytics are coming and payments are coming soon.** Each one falsifies a sentence we published | **This is not a nag, it is a dated liability.** A privacy policy that says "we run no tracking" while running tracking is a false statement in a legal document, and it is one of the ways a granted Google brand verification gets pulled after the fact. **The exact lines to edit are listed in `07`** so nobody has to rediscover them. **One steer recorded with it, because the choice is easy to make badly:** the site currently sets no tracking cookies and therefore needs no consent banner. Google Analytics ends that and creates an EU and UK banner obligation. **A cookieless tool such as Plausible or Fathom keeps the banner-free property** and costs one line of policy instead of a consent system | **Whichever ships first, analytics or payments, and in the same deployment as the feature. Not after.** The `07` table says exactly which lines change for each |
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


---

## Session 5 review notes from Jon, 19 August 2026

Given after seeing the built page. Kept as a list rather than folded into rows,
because they are a review pass rather than open questions. **Struck items are
done.**

### Corrections to fact, done first because they are wrong rather than ugly

- ~~**"100% of Claude's output has carried a watermark since 2 August 2026" is not
  true.** Jon caught it. Anthropic has said it is coming, not that every model
  from that date carries it. Going forward it will be the case; we do not know
  when.~~ **FIXED.**
- ~~"5 of 8 ... and two more will not say" editorialises. **Say what is
  committed, not what is withheld.**~~ **FIXED.**

### The box

- ~~The "Example" chip overlaps the text.~~ **FIXED.**
- ~~Not enough separation between the input area and the findings below it.~~ **FIXED.**
- ~~The list of what was found should be behind an expander, not always open.~~ **FIXED.**
- ~~File provenance needs a better symbol. A paperclip was suggested.~~ **FIXED.**
- ~~Statistical watermark needs a better description, and must name Anthropic and
  2 August 2026 the way the earlier version did.~~ **FIXED.**
- ~~Status words top right in capitals.~~ **FIXED.**
- **The whole findings area needs to be readable in five seconds.** Less text,
  more colour, easier on the eye. Partly done, still open.

### The hero

- **Format list (pasted text, Word, PNG, JPG) is in the wrong place.** Move it near
  the box. Put technical-sounding but true facts in its place.
- **The three facts need real design:** cards, motion, click to expand for detail.

### The marquee

- ~~Widen spacing so the same outlet is never visible twice at once.~~ **FIXED.**
- **Use each outlet's real logo and brand colour.** Brand-coloured wordmarks are in
  as a first step. **Actual logo files still need Jon's approval, `06` row 34.**
- ~~More separation between the hero and this strip.~~ **FIXED.**
- **Add a readership figure**, directionally correct and sourced. **NOT INVENTED:
  still open because no source has been checked.**
- **Caption is Jon's**, and he wants it to link to the mission page, styled as a
  link. Wiring done, wording his.

### How it works

- **Inconsistent and needs rebuilding.** One panel has the accent background and a
  side-by-side layout, the other two do not, and the column count changes down the
  page. **Jon's words: the section is bad, but the direction is a strong start.**
- **Needs animation and movement.**
- **The key diagram is not digestible enough.**

### Second review, same day

- ~~The paragraph under the headline said nothing. Jon wanted measured results
  about accuracy there instead.~~ **DONE.** 100% provenance removed, 90%+ of three
  word sequences broken, 0 figures lost, labelled as measured on our own tests.
- ~~The three cards described the product. Jon wants the scope of the problem.~~
  **DONE**, plus a live counter of AI words written since the page opened, driven
  from a real attributable figure.
- **A counter of files un-claude has cleaned, starting around 6,000, was asked for
  and DECLINED.** Jon described it as a little bit fictitious. It is fabricated
  usage data, it is the one claim here anybody could disprove, and it would undo
  the honesty position the rest of the site depends on. **The live AI-words
  counter does the same job from a sourced number.** Jon can overrule this; it is
  recorded so the decision is deliberate rather than silent.
- **Real logo files for the nine outlets and eight vendors. BLOCKED ON JON**, who
  has offered to supply them. Drop-in paths are named in the source:
  `apps/web/public/images/outlets/` and `apps/web/public/images/vendors/`.
  **Press-page artwork he supplies is on far safer ground than anything fetched
  from a search result**, which is also what `06` row 34 requires.
- **A readership figure for the marquee is still not sourced** and has not been
  invented.

### The vendor table

- ~~Labels: marks its output, committed to watermarking, does not mark, does not
  produce this.~~ **FIXED.**
- **Vendor names in each vendor's own brand colour and typeface.** Colour done.
  Typeface would need font files and is not worth it.
