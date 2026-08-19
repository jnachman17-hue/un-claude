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
| 47 | **Layer B is live in production with only a browser counter in front of it** | risk | **On since 19 Aug 2026 by Jon's ruling, `04` entry 49.** The engine is locked to our own site, and the interface caps a browser at three rewrites | **The cap is `localStorage`. A private window resets it.** That was an acceptable trade when nobody could reach the site; Google sign-in is now live and the site is public, so the shape of the risk has changed even though the balance has not. Two live test rewrites cost 0.0002 dollars, so this is about the absence of a real gate rather than about the money so far | **TRACK 3 owns this.** Before any marketing sends traffic. Off switch: `npx vercel@latest env rm UC_ENABLE_LAYER_B production` |
| 49 | **The credit balance must never live in `accounts.public_data`** | risk | **Nothing built yet, and this is the trap to avoid building.** | The migration grants `update` on that table to every signed-in user, and the protective trigger only guards `id` and `email`. **A user could set their own balance.** It is the obvious place to put it and it is the one place it cannot go. Found by the pricing session | **TRACK 1, before the first line of ledger code** |
| 50 | **The retry multiplier is eight, not three, and no layer B variable is set in production** | technical | **Corrected in `ENGINE.md` 19 Aug 2026.** `npx vercel@latest env ls production` returns zero `UC_LAYER_B_*` variables, so every code default applies | `ENGINE.md` claimed retries were 3. The code default is 8. The pricing session measured 96 model calls where 12 were expected. **Three of the four defaults happen to be the intended value; retries is not.** Worst case per request is eight times the documented figure, which is still under half a cent per thousand words | **TRACK 3.** Set them explicitly rather than relying on defaults that match by luck |
| 51 | **Vercel Hobby does not permit commercial use** | commercial | **Unchecked.** The plan the project is on has not been confirmed | The day anyone is charged, Vercel Pro at 20 dollars a month becomes a fixed cost, and break-even is about three sales a month. Raised by the pricing session; the command that would have answered it was blocked | **TRACK 1, before Stripe goes live** |
| 52 | **Stripe needs a refund policy page, and there isn't one** | scope | **Two of the three exist.** Terms of service and a contact address are live. **A refund policy is not** | Stripe expects terms, a refund policy and a contact address on the site before it will approve an account. Raised by the pricing session with the note that finding it in week four costs a week | **TRACK 1.** Cheap now, expensive later |
| 53 | **The business description given to Stripe is the highest-leverage sentence in the process** | risk | **Not written.** | The pricing session read Stripe's prohibited list and this category is not named in it. The entries a reviewer could reach for are "document falsification services", which fits badly, and an undefined deceptive-practices catch-all. **"Removes hidden metadata and invisible characters from documents" and "helps you bypass AI detection" are both true descriptions.** The first is a data hygiene utility. The second is what a risk team is trained to look at twice | **TRACK 1, at account creation.** The safer description is also the more provable one |
| 54 | **PostHog captures pageviews and autocapture only. No funnel events exist** | technical | **Live and verified cookieless 19 Aug 2026.** Zero cookies, zero storage, an event confirmed reaching `us.i.posthog.com` | Nothing tracks scan, sanitise, hitting the paywall, or signing up, **which is the entire reason analytics was added.** Traffic and referrers are visible; where the funnel breaks is not | **TRACK 4** |
| 55 | **Session replay is off, and turning it on needs masking built first** | risk | **Disabled in `analytics-provider.tsx`.** | It was the strongest argument for choosing PostHog. **The main element on the page is a box people paste confidential text into, and the privacy policy states we do not keep what they give us.** Replay recording that textarea would make a published legal document false | **TRACK 4.** Only after masking is built AND verified, not assumed |
| 56 | **Analytics undercount, and the numbers should be read as directional** | technical | **Accepted.** | The browser used for verification blocked PostHog with `ERR_BLOCKED_BY_CLIENT`. Ad and tracker blocking does the same to a share of real visitors, and this audience arrives from tech press, where blocking rates are higher than average | **Never. Recorded so nobody treats a PostHog figure as a headcount** |
| 58 | **No rate limiting anywhere beyond the shared key** | risk | **None.** The engine trusts anything holding `UC_ENGINE_KEY`, which is the site itself | Any visitor can drive the site's own routes as fast as they like. Combined with row 47 this is the real exposure surface | **TRACK 3, before marketing traffic** |
| 59 | **Landing page work Jon has asked for and not received** | cosmetic | **Open list, his words:** findings panel not readable in five seconds; key diagram animated but not more digestible; readership figure for the marquee **deliberately not invented and still unsourced**; his own marquee caption; mission page content; a logo beside the un-claude wordmark; social links with no handles supplied; no pricing page in the nav; Stable Diffusion showing Stability AI's mark | Each is small. Collectively they are the difference between a working prototype and something to send traffic at | **TRACK 2** |
| 60 | **The rename to Un-Claude, and the Google logo** | scope | **Parked.** Google branding is verified and published as it stands | **The site's own name and the Google app name must change together**, because the gap between them is what Google's checker measures. The logo is cheap now the hard part is done, but a change re-runs the check and a failure leaves the app unbranded until it is sorted. **Do it once with final artwork, and not immediately before wanting traffic** | **TRACK 4** |
| 1 | How isolated the runtime environment should be | risk | **Trigger fired 18 Aug 2026 and was not acted on.** Dependencies installed, code written and executed, a build ran. Jon present and approving each step. Position unchanged: plain local folder at `~/un-claude` | The control risk is real: the model decides what runs on the laptop and Jon cannot evaluate a command by reading it. Every isolation option adds machinery that would make a failure impossible for him to diagnose | **Raised again by the rescope:** the engine build will install Python packages and may run external tools. If that happens, the next step is a separate macOS user account, not Docker |
| 5 | Whether `CLAUDE.md` section 3 is too strict | rule | **Trigger fired 17 Aug 2026 and the rule held. Stands unchanged.** Nothing outside `~/un-claude` gets read | It genuinely blocked a diagnosis once, and the diagnosis was completed another way, so the rule blocked nothing that mattered. Recorded in `07` | The **second** time it blocks something genuine. One clean stop is evidence the rule works. A pattern is evidence it is too tight |
| 11 | Docker is not installed, so accounts cannot be tested offline | technical | Public site runs fine without it. Sign in and sign up render locally but cannot authenticate | Supabase runs locally inside Docker. Installing it needs Jon's approval under `CLAUDE.md` section 5 | The first time work requires a real local account, or the first database change |
| 8 | Where the project folder lives on disk | cosmetic | `~/un-claude` | Reversible with one command. Not worth a decision | If Jon finds it untidy |

| 46 | **The legal pages make claims that stop being true the moment we add analytics or payments** | legal | **Written truthfully on 19 Aug 2026 and correct as of that date. Both of the things that break them are already planned.** The privacy policy states we run no advertising or tracking and lists four third parties. The terms state the service is free and collects no payment method. **Jon has said analytics are coming and payments are coming soon.** Each one falsifies a sentence we published | **This is not a nag, it is a dated liability.** A privacy policy that says "we run no tracking" while running tracking is a false statement in a legal document, and it is one of the ways a granted Google brand verification gets pulled after the fact. **The exact lines to edit are listed in `07`** so nobody has to rediscover them. **One steer recorded with it, because the choice is easy to make badly:** the site currently sets no tracking cookies and therefore needs no consent banner. Google Analytics ends that and creates an EU and UK banner obligation. **A cookieless tool such as Plausible or Fathom keeps the banner-free property** and costs one line of policy instead of a consent system | **Whichever ships first, analytics or payments, and in the same deployment as the feature. Not after.** The `07` table says exactly which lines change for each |
| 61 | **[T1] Sales tax and VAT on digital credit sales have never been considered** | legal | **Nothing decided, nothing registered.** Jon's position, stated this session: "I hope Stripe can handle all of this" | **Stripe does not handle it.** Stripe Tax calculates and collects for a fee, but registering with a tax authority and filing returns remain the seller's obligation, and Stripe says so. **EU VAT on digital services to consumers has no minimum threshold** — liability begins at the first sale to an EU consumer. A merchant of record such as Paddle or Lemon Squeezy does absorb this by becoming the legal seller, but `03-pricing.md` 12d notes their acceptable-use policies are stricter than Stripe's for this category. **Nobody in this project is qualified to advise on tax and this row does not attempt to** | **TRACK 1, before the first live payment.** And a real accountant before revenue is material |
| 62 | **[T1] Which shipping Claude models actually carry the text watermark today is unknown, and it is the premise of the product** | risk | **Unverified, and probably "none or few".** `anthropic-watermarking-context.md` 2.1 records that marking applies to models launched on or after 2 August 2026, that all models publicly available at compilation predate that, and that the retrofit to older models is promised over "coming months" | **This decides whether the thing we charge to remove is present at all.** Jon's framing this session was that we "kind of just say it's there for all text". **That sentence cannot be published.** Anthropic states the mark is absent from short passages, near-absent from proofreading and from code, and sparse in factual writing, so it is not uniformly present even on a marked model. **No public detector exists**, so we cannot check, and neither can a customer. The same document warns that a retrofit can activate on an existing model ID with no version bump and no announcement, so a true answer today is not a true answer next month | **TRACK 1, before the pricing page or any refund policy is written**, because both make claims about what is being bought. Re-check whenever Anthropic ships the detection API |
| 63 | **[T1] The free tier was designed around a funnel that does not fire for the main use case** | commercial | **`04` entry 43's blur-the-result paywall assumes the free scan finds something.** For pasted Claude text it finds nothing, because Anthropic adds no hidden characters | Jon's observation this session and it is correct. Layers A and metadata are the provable, near-free layers and they mostly apply to **files**. The visitor who arrives because they used Claude needs **layer B**, the layer that costs money and cannot be proved. **So the free hook is the expensive layer and the cheap layers are the ones nobody arrives for.** That inverts the free-tier arithmetic in `03-pricing.md` 4g, which assumed free scanning was the hook | **TRACK 1, and it is upstream of the free-allowance decision rather than downstream.** Settle what a signed-out visitor gets before the pack prices are final |
| 64 | **[T3] The usage record is a log line, not a ledger. It stops the loss and does not end it** | technical | **Words, tokens, retries, chunks, model calls and the gateway's own dollar cost are now captured on every run and written as one `UC_USAGE` JSON line to the server log.** Row 48's capture defect is fixed | **Nothing persists it.** Vercel keeps runtime logs for a short window, so this is a stopgap. A durable ledger needs a database table, and `apps/web/supabase/**` and every migration belong to **Track 1**, so Track 3 must not build it. It is also unverified that a `print()` from a Python function on Vercel reaches the runtime log at all; it has only been proven locally | **Track 1, when the credit ledger is built.** The usage row and the credit row want the same table. Until then, anything worth keeping must be pulled out of the logs before they expire |
| 65 | **[T3] The measured cost per thousand words is above the figure Track 1 has been given, and it moves with how many numbers the text contains** | commercial | **Measured, not estimated, 19 Aug 2026 on one 674 word document: 0.093 and 0.128 cents per thousand words across two runs.** `04` entry 49 and `TRACK-1-BILLING.md` say about 0.06 | The fact guard retries a chunk when a figure looks dropped, so a number-dense document costs more than a discursive one. The test document was written to be number-dense and is a worst case rather than a typical paste. **Two runs of a non-deterministic process is not a cost model.** Before the compound-number fix the same document cost 0.248 cents per thousand and made ten model calls for three chunks | **Track 1, before the pack price is set.** The honest input is a range that moves with content, not a single figure. More runs across content types would narrow it, and row 36's test suite is the place to get them |
| 66 | **[T3] A number-dense document can approach the 60 second ceiling long before it approaches the word limit** | risk | **Measured 19 Aug 2026: 38.4 seconds on 674 words**, against `ENGINE.md` section 9's proven 5,047 words in 22 seconds | Retries, not length, are what spend the time, and retries follow figures rather than words. The compound-number fix removed most of them on that document, but the shape of the risk stands: **the ceiling is reached by content, not by size, so a word limit does not protect against it** | **Track 3, with row 36.** Time a citation-dense and a legal document before launch. If any lands over about 45 seconds, the retry ceiling needs a time budget rather than a count |
| 67 | **[T4] The paywall's own call to action breaks the funnel it sits at the top of** | technical | **Proved on the live site 19 Aug 2026, not reasoned.** `persistence: 'memory'` holds the visitor id in a variable, so a full page load makes a new person. Every link into sign-up preserves it except the paywall's, which is a plain `<a>` where the rest of the site uses `<Link>` | Until it is fixed, "how many people who hit the wall then signed up" cannot be answered per person at all, only as two unrelated totals. **The fix is one line in `paywall.tsx` and changes no policy sentence**, because nothing is written to the device either way | **TRACK 4, before any funnel event is trusted.** Do not solve it with a cookie, a stored id or a URL parameter: the first two end the no-banner property |
| 68 | **[T4] The published privacy policy under-describes what is measured, and will until a separate session applies the wording** | legal | **Outstanding as of 19 Aug 2026.** Funnel events shipped; the policy text did not, on Jon's instruction that policy rewrites go to a different session. Exact replacement wording is written and waiting in `docs/POLICY-CHANGES-PENDING.md` | Nothing published became false: no new company is involved, nothing is stored on the device, no content is collected. It is **incomplete**, not wrong, because it says we measure pages read and we now also measure which steps of the tool are used | **Whoever applies `POLICY-CHANGES-PENDING.md`.** It closes the moment that file is used. 04 entry 69 |
| 69 | **[T4] The sign-up and sign-in buttons themselves are not instrumented** | technical | **Deliberately not done 19 Aug 2026.** The funnel is measured up to arriving at the sign-up page, which is the break Jon reported. The button press is visible through autocapture, less conveniently | The buttons live in `packages/features/auth`, and instrumenting them means the shared kit importing app-level code, or a new `@kit/analytics` package. That is a structural change worth proposing rather than slipping in | **TRACK 4, next session.** Only worth it if the gap between reaching the page and pressing the button turns out to matter |
| 70 | **[T4] The landing page does not hydrate on a local machine, so the tool cannot be driven locally at all** | technical | **Confirmed 19 Aug 2026 on a fresh dev server AND on a local production build, with Track 4's changes stashed, so it is not caused by them.** The live site is unaffected and resolves in a few seconds | The workbench stays inside an unresolved React streaming container (`S:0`), never hydrates, and the initial scan never fires. Body and header hydrate normally. No compile error, no console error, no failed request. Local Supabase is not running, `06` row 11, which is the leading suspicion and is unproven | **TRACK 2 or 3, whoever needs to drive the tool locally.** It blocked Track 4's browser verification this session and forced a Node harness instead |

| 71 | **[T1, for the engine owner] A rewrite may change "thirteen percent" to "13%" and nothing would catch it** | technical | **The prompt forbids it, the guard does not check it, and nobody has measured whether it happens.** Found by Jon reading Track 3's report | `rewrite_text.py` rule 5 tells the model to copy every number in exactly the original's form, in both directions. `_numbers()` in `uc_chunk.py` compares **values, not spellings**, by deliberate design — so that a model writing "eighteen percent" for "18 percent" is not treated as a dropped figure. **Run this session: "thirteen percent of the fund" and "13% of the fund" both resolve to `['13']` and the guard passes.** Numeral form is a visible authorial choice and one of the few rewrite changes a user would notice and object to, which makes it a refund question as well as a quality one. **Track 3's compound fix did not cause this and is correct** | **Before launch.** Cheap to measure: run the existing corpus and diff numeral forms between input and output. If it never happens, close the row. If it does, the guard needs a form check alongside the value check |

| 72 | **[T1] The scan returns no word count, so credits cannot yet be priced by words** | technical | **`report.length` is characters. There is no word figure anywhere in the scan response**, and for a Word document the words are only knowable inside the engine | `04` entry 67 prices a credit at 1,000 words. The browser can count words in a paste, but not inside a `.docx` — it only holds base64. **So the free counter presently counts jobs, not credits**, which is right for the common case of a short paste or an image and wrong for a long document | **TRACK 1, before the ledger is written.** `scan.py` must return words alongside length. Small, and it also gives the paywall an honest "this will cost 3 credits" before the visitor commits |
| 73 | **[T1] Pressing Scan is required for pasted text and not for a file, and Jon has noticed** | cosmetic | **Inconsistent by design rather than by accident.** A dropped or picked file scans immediately; pasted text waits for "Scan it" | Jon's report: choosing a new file "go straight to reading, scan button is passed and it automatically starts reading, should reset back to default scan state". **There is a real argument on each side** — a file has nothing to edit so waiting is a pointless click, and text is still being typed so scanning early would fight the user. **Not changed unilaterally, because it is a product decision and `04` entry 62 puts those with Jon** | **Jon's call, before launch.** Cheap either way |

| 74 | **[T1] A Word document gets no rewrite, so it is priced wrong and the interface promises wrong** | risk | **Measured by reading `server.py`: layer B runs only when `kind == "text"`.** Containers get metadata plus layer A and never reach the model | `04` entry 69 has the detail. **Three consequences:** the workbench sends `layer_b: true` for a container and the engine silently ignores it; the statistical row therefore never shows "removed" for a `.docx`, which is part of why Jon sees rows staying lit; and `04` entry 67 prices a Word document by its words on the stated basis that those words are rewritten, **which is false**. A `.docx` costs us exactly what an image costs: nothing | **TRACK 1, before checkout is built.** Jon rules: either a container is a flat credit like an image, or the engine is extended so containers really are rewritten |

| 75 | **[T1] On a phone the tool is roughly two screens below the fold, and the product is the tool** | risk | **Measured 19 Aug 2026 at 375x812**: header, headline, subtitle, then the three hero statistics fill the entire first screen and most of a second before the box appears. A visitor sees no tool at all without scrolling | `CLAUDE.md` says the tool lives on the landing page and IS the page, and `04` entry 41 built it that way — **for a desktop two-column layout, where the box sits beside the headline.** On one column the same markup stacks the box last. **Jon expects TikTok traffic, so the likeliest visitor never sees the product.** He opened it on a phone for the first time this session and called it abysmal; this row is the specific, measured reason | **TRACK 1, with the box rebuild.** On a narrow viewport the box comes FIRST and the headline compresses above it. The three statistics are being rewritten anyway, `04` entry 70, so they should land below the tool rather than in front of it |

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


**Row 48, `usage_record()` recording no words, tokens or retries. CLOSED 19
August 2026, TRACK 3.** The three numbers `04` entry 22 promised are now captured
on every run, along with chunks, model calls and the AI Gateway's own cost in US
dollars, and written as one `UC_USAGE` JSON line per request. **The figures now
travel down into the model call in a dict the caller owns rather than back out on
a return value**, because a call that raises still spent money and a failed run
retries up to eight times per chunk, so the most expensive requests were the ones
reporting nothing at all.

**What is NOT closed, and is row 64: nothing persists it.** A log line is a
stopgap. The durable ledger needs a migration, and every migration belongs to
Track 1. **Everything recorded before 19 August 2026 remains lost and always
will be.**

**One thing was found in the closing and it changed the numbers.** The fact guard
was forcing a retry on every compound number word from twenty-one to ninety-nine.
The earlier repair taught it that `thirty-four` is 34 but left 30 and 4 in the
set, so an output written as `34` looked like a dropped figure. That is the
project's own rule proving itself a third time: **assume the measurement is the
defect before the thing being measured.** Detail in `07-runbook.md`.

**Row 57, `clean.py` stating a rule that entry 22 does not contain. CLOSED 19
August 2026, TRACK 3, by deleting the claim.** The docstring said "Layer B is
signed-in only. 04 entry 22." Entry 22 says all three layers ship free with tight
limits and no way to pay, nothing anywhere enforced signing in, and layer B is
reachable today without an account. **The comment was made true by removing it,
not by building the rule it described.** Whether layer B should require an account
is a live question and it is row 47, which is still open.

**Row 13, auth errors showing the literal text `<DefaultError />`. CLOSED 19
August 2026, TRACK 3.** Reproduced first, against the live site's own Supabase,
before anything was changed: a sign-up at a domain Supabase rejects produced, in
the alert a user reads, `Sorry, we could not authenticate you` followed by
`<DefaultError />`.

**The fix is a chain whose last link cannot fail.** The exact key first, which
keeps the three messages that already worked. Then a closed list of patterns,
because some Supabase errors carry a variable inside the sentence and can never
match a fixed key: the rate limit message names a number of seconds, and the
invalid-address message quotes the address the user typed back at them, which is
its own reason never to show upstream text. Then the general message. Then, if
even that is missing, a plain English sentence written into the component. **The
fallback itself was the thing that broke last time, so the bottom of the chain
now depends on nothing.**

**Five messages were added for failures that had none:** invalid email, weak
password, rate limited, provider not enabled, signups disabled. The fourth is the
error Jon hit on the Google button before the provider was configured.

**One part is proven and one part is not, and the difference matters.** The
placeholder is gone: verified live, and the three previously working messages
still work. **The five new messages have not been seen rendering in a browser**
— the only dev server on the machine belongs to a parallel session and its
message bundle predates the change, and Next.js 16 refuses a second dev server
for the same directory. They are proven against the real regexes and the real
message file, not through next-intl's loader. **Confirm on the first deploy.**

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
