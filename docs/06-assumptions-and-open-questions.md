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

| 76 | **[T1] `/dev/preview` is a public work surface on the production site** | scope | **Live, `noindex`, unlisted.** It renders the real landing page with switchable theme tokens, `04` entry 73 | It is unlisted rather than protected because the marketing side has no auth to gate it with, and it exposes nothing a visitor could not see on the home page. **But it is a page on a commercial site that is not part of the product**, and a stranger who finds it sees a half-finished decision being made | **Before launch, and before the Stripe review.** Delete it, or keep it deliberately and say why |
| 77 | **[T1] The landing page intermittently does not hydrate on a local dev server** | technical | **Confirmed twice, from two sessions, and it is intermittent rather than constant.** `06` row 70 was Track 4's report; this session first contradicted it after one lucky run, then reproduced it exactly: zero fetches sixty seconds after load, no console error, the effect never running | **A dev-server restart sometimes clears it and sometimes does not** — tried twice on 19 Aug, worked once, failed once on a completely fresh server — so the cause is NOT simply accumulated hot-reload state. **The live site has never shown it.** The cost is not the bug, it is the wasted verification: it looks identical to "my change broke the tool" and this session lost real time to that twice | **When it next appears: restart the dev server FIRST**, before believing any workbench change is broken. If it survives a restart, it is a real regression |

| 78 | **[T1] Overriding a theme colour needs `--color-*`, not the bare token, and one whole feature was built on the wrong one** | technical | **Measured 19 Aug 2026.** Setting `--mark` on a wrapper element changes nothing; setting `--color-mark` changes everything | `theme.css` declares `--color-mark: var(--mark)` at `:root`. **A custom property resolves its own `var()` where it is DECLARED**, so `--color-mark` computes against the root's `--mark` and then inherits already-resolved. Overriding `--mark` lower in the tree is a no-op. The theme bench at `/dev/preview` was built this way and showed three identical buttons; **Jon caught it before this session did**, reporting "literally zero difference between the three". Proof: `setProperty('--mark', …)` left the button at `oklch(0.597 …)` for all three variants, `setProperty('--color-mark', …)` produced `0.597 / 0.673 / 0.672` | **Fixed. Recorded because it will recur:** anything that themes a subtree — a dark section, a preview, a per-plan accent — must override the `--color-*` tokens |

| 79 | **[T1] White on the accent orange is 3.12:1 and fails WCAG AA for normal text** | risk | **Known, chosen, and measured before shipping, not discovered after.** `04` entry 75 | White on `#d97757` passes AA for large text and fails for normal text, which includes every button label on the site at 13-15px. **Jon compared it against the compliant alternative and preferred it**; the nearest passing orange on the same hue is `#ab5e45` at 4.75:1 and reads brown. **The cheap middle exists if this is ever revisited:** keep `#d97757` for tints, gradients and highlight halos, where no text sits on it, and use a deeper shade ONLY behind small white labels. That keeps everything Jon chose and fixes the one place it fails | **An accessibility pass before launch, or the first complaint.** Do not "fix" it by silently darkening the accent - that reverses a ruling |
| 80 | **Whether a credit pack is "digital content" or a "service" for the 14-day cancellation right** | legal | **Treat it as digital content supplied immediately**, take express consent plus an acknowledgement at checkout, and send a confirmation email. `session-notes/legal-research.md` §3c | The two characterisations give different answers and one of them is expensive. As digital content the right dies at purchase once the three-part waiver is taken. **As a service, [CRD Art 16(a)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528) only kills it once the service is "fully performed" — and a pack with credits left in it never is**, so a customer could spend 9 of 10 credits on day 13 and cancel for a full refund. I hold the digital-content reading with moderate confidence, not high | **One hour of a consumer solicitor, before the first EU sale.** It is item 1 on the professional-advice list and the one worth paying for first |
| 81 | **Whether publishing only a trading name satisfies DMCC s.230(6)** | legal | **Publish "Jonathan [surname], trading as un-claude".** Fallback if Jon refuses: trading name plus service address, name on request | **The statute and the regulator disagree and I will not average them.** [DMCC s.230(6)](https://www.legislation.gov.uk/ukpga/2024/13/section/230) defines a trader's identity as "(a) the name of the trader, and (b) if different, the name under which the trader trades" — both. [CMA207 ¶4.16](https://assets.publishing.service.gov.uk/media/691b9bd821ef5aaa6543ee6f/Unfair_commercial_practices_CMA207_18_Nov_2025__2_.pdf) glosses the same section as "their personal **or** trading name". In force since 6 April 2025, so there is little practice to read | **Jon's ruling, and it blocks both legal pages** — every draft in `legal-research.md` §9 has two versions until it is made. A solicitor may know how the CMA is applying it in practice, which cannot be found from outside |
| 82 | **Whether a Stripe email receipt discharges Companies Act 2006 s.1202(1)(c)** | legal | **Assume not, and send our own confirmation email.** It is needed anyway | [s.1202(1)(c)](https://www.legislation.gov.uk/ukpga/2006/46/section/1202) requires the trader's own name and service address on **receipts**, and the Stripe receipt is the receipt. Stripe's customer-visible fields are the business (DBA) name, support email, phone and address — **could not establish whether a separate legal-name line is possible** | **Already resolved in practice by the reg 16 confirmation email**, which section 9D drafts. One email discharges the durable-medium confirmation, the third limb of the waiver, and this. Only revisit if that email is dropped |
| 83 | **Whether professional indemnity / tech E&O is underwritable for a watermark remover** | risk | **Unknown. Ask a broker early.** Insurance is the only substitute for the limited company Jon has decided against, so this is the highest-value item on the risk list | Cover for solo UK software operators is widely sold, but "AI watermark removal" is a category an underwriter may decline or load, and **I could not establish appetite from public sources**. **A refusal would itself be information about the risk, not just about insurance** | **Before the first sale.** Long lead time, and the answer may change how much money Jon wants running through the site |
| 84 | **Selling to EU consumers triggers VAT from the first sale, with no threshold** | legal | **Decide deliberately rather than by default.** Either register for the non-Union OSS or use a merchant-of-record — the second conflicts with the Stripe decision | UK VAT has a [£90,000 threshold](https://www.gov.uk/register-for-vat), but there is none for digital services to EU consumers: VAT is due in the customer's country from sale one, via the [non-Union One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en). It also brings a **mandatory phone number** ([CRD Art 6(1)(c)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528) as amended, where the UK still says "where available") and the three-part Art 16(m) waiver | **An accountant's question, alongside the record-retention number D2 already sends there.** Before the first EU sale |
| 85 | **Whether "un-claude" is a trade mark problem, given "Claude" is Anthropic's mark** | legal | **Not researched. No position taken.** Recorded so it is not mistaken for something this session covered | The legal research session covered consumer disclosure, distance selling, liability, Stripe and the contract-cheating offences. **Trade mark was explicitly out of scope and remains completely unexamined**, as does whether removing a provider's provenance marks breaches that provider's own terms of service | **Its own session, before any spend on marketing the name.** Worth a real professional rather than a model's opinion, same as `06` row 34 |
| 86 | **Layer B ran on pastes far too short to carry a watermark, and that is where every prompt-leak defect lived** | risk | **CLOSED in the engine 22 Aug 2026, `session-notes/prompt-leak.md`.** Rules and customer text are now separate chat turns; `uc_leakguard.py` rejects a rewrite that does not derive from the input, retrying then refunding; and layer B is **skipped below `UC_LAYER_B_MIN_WORDS`, default 16**, with layers A and metadata still running so a short paste keeps the two provable layers. Measured end to end: bad output on short pastes 48/120 to 10/120, outputs carrying our prompt's own example figures 13 to 0, false refunds on ordinary prose 0/60, and 144 runs over the 16 to 32 word band clean | **What is left is interface, not engine.** The engine returns `report.layer_b.reason` explaining why a short paste was not rewritten and **nothing in the workbench renders it**, so the behaviour is correct but silent. 16 was measured after a first recommendation of 25 proved to refuse the whole 16 to 24 band for no gain | **Whoever next owns landing-page copy.** Otherwise: the first support message asking why a short paste came back unchanged |
| 87 | **A new customer's wallet still moves from 3 credits to 5** | technical | **Accepted, 23 Aug 2026.** The signup grant is now minted when the email is confirmed, so the wallet reads **3** — exactly what the sign-up page promises — instead of the "0 credits · Get credits" the F1 audit found. The 2-credit welcome grant still lands on first use of the tool | Whether a new account is a **guest conversion** decides whether it may have the welcome grant, and that fact lives in the browser's cookie. A database trigger cannot see a cookie, so paying it at signup would pay it to converting accounts too — the 7-credits-against-a-ratified-5 defect in `guest-merge-double-runs.md`. Closing it properly means carrying the conversion fact into account creation, which is its own piece of work | **The first support message asking why the number changed**, or whenever the signup flow is next opened. Not urgent: the number only ever goes up, and the first number now matches the promise |
| 88 | **Our own cost per run is sent to every browser** | risk | **Found 23 Aug 2026 by lane B, not fixed — `engine/` and `api/*.py` belong to another lane.** No customer is harmed; the exposure is that anybody who opens the network tab on a rewrite can read what that rewrite cost us, and therefore work out the margin | `api/_shared.py` deliberately keeps token counts and `cost_usd` out of the `usage` block it returns, calling them "our unit economics on a public site" — and the same figures then ride to the browser anyway inside `report.layer_b.usage`, which `strip_server_paths` does not touch. **The care was taken in one place and undone in the other** | **Whoever next owns the engine or the Python functions.** One line in `strip_server_paths`. Sooner if the site ever publishes its pricing rationale, since the two would then be checkable against each other |
| 89 | **The connection-drop refund does not fire on Vercel, because request cancellation is opt-in and this project has not opted in** | technical | **MEASURED 24 Aug 2026, not assumed. It does not work in production and the code is inert.** The fix that was proved on a development server is real, and it is switched off by configuration rather than broken | Immediately after the deploy, on the live site: the client dropped at 3 seconds, the job ran to completion — the `run_costs` row was written, which proves execution reached the check — and `request.signal.aborted` was **false**. Vercel's own docs are explicit: `request.signal` only aborts for functions declaring **`supportsCancellation`** in `vercel.json`, and this project declares nothing. **The connected case was measured on the same deploy and correctly did NOT refund**, so it is dead code, not wrong code | **Three things before turning it on, and none of them should be done blind.** (1) `vercel.json` is another lane's file, and it is not established that a Next 16 App Router route can even be targeted by its `functions` glob — Vercel's own examples are `api/**` and `pages/api/**`. (2) Vercel's docs warn that work after a disconnect may not complete without `waitUntil`, which needs `@vercel/functions` — **a new dependency, which is Jon's call**. (3) It is one deploy and one re-run of the existing free test to find out: enable it, drop a connection, look for the refund row. If the row appears, no dependency is needed at all |
| 91 | **A short paste carrying hidden characters can no longer be cleaned at all** | rule | **Jon's ruling stands and is shipped as given: below 16 words the Sanitise button is disabled.** Working position is that this is right, because the overwhelming majority of short pastes carry nothing to remove and the alternative was charging for a rewrite that does not run | Layers A and metadata are the two PROVABLE layers and they work perfectly on six words. Before 23 August a six-word paste holding three zero-width characters cost a credit and came back genuinely clean of those three. It is now refused, because the third layer would not have run. **The visitor is told why and can add words, which is a real way out, but they cannot clean the thing they pasted.** The narrower rule that keeps both properties is one line: refuse only when the scan ALSO found nothing to remove | **The first time somebody asks why a short paste cannot be cleaned**, or the first support message about it. It is a one-line change in `workbench.tsx` where `tooShortToRewrite` is computed |
| 92 | **Two tab stops in the workbench are both called "Upload a file"** | cosmetic | **Accepted for now.** Both are named, which is strictly better than the invisible one being nameless as it was until 23 August | The 1px `sr-only` file input is focusable and now carries `aria-label="Upload a file"`; the visible button that clicks it says the same thing. Removing either stop costs something real: hiding the input from the keyboard leaves the visible button as the only route, and hiding the button leaves a sighted keyboard user with no visible focus ring | **When a screen reader is actually run against this page (G1).** Whoever does that will hear it immediately and can judge whether it is worth restructuring |
| 93 | **The finished result is wrapped in a control whose name replaces it** | technical | **No change made, deliberately: the brief asked for a check.** Measured 23 August — the customer's text IS present in the accessibility tree, so the strongest version of the agent's claim is refuted, **but the wrapper's `aria-label="Edit this text"` replaces the contents when the accessible name is computed, so a screen-reader user who reaches the result hears "Edit this text, button" and not their document** | Whether the text can be reached another way depends on the screen reader: under the ARIA presentational-children rule a button's descendants may be flattened, and browse-mode behaviour differs between VoiceOver, NVDA and JAWS. **The proposed fix is narrow: once a job is finished the result does not need a click-to-edit affordance at all** — there is a "Start over" button beside it, and clicking the result currently discards the finished work — so the wrapper can be a plain block in the `done` state only | **Ten minutes with VoiceOver**, which nobody has done. Or sooner: the `done`-state half of the fix stands on its own as a bug fix and needs no screen reader to justify it |
| 94 | **C2PA now specifies an invisible-character text watermark, in layer A's exact territory** | technical | **Unresolved and nobody has checked.** Working position: our detector probably does not catch it, because it was built for spaces and zero-width marks rather than variation selectors | **C2PA specification 2.4, appendix A.8**, encodes a full manifest into plain text using **Unicode variation selectors, U+FE00 to U+FE0F and U+E0100 to U+E01EF**, prefixed by U+FEFF with magic bytes `C2PATXT\0`. That is deterministic, detectable and strippable, which makes it **the first text watermark layer A could genuinely defeat and prove.** The spec labels A.8 "under review", so it is a moving target. The steering committee that publishes it includes OpenAI, Google, Meta, Microsoft, Adobe and **TikTok** | **Test it: run a variation-selector sequence through the scanner and see whether it is found.** One afternoon. If the answer is no, it is a small change to a character class and a real capability nobody else in the category has |
| 95 | **`ENGINE.md` section 2 may be describing a tell that no longer exists** | risk | **Surfaced, not resolved. The documents govern under `CLAUDE.md` section 2 and this session did not override them** | `ENGINE.md` says layer A "defends against a real, present, observable tell that catches people today", citing Rumi's 2025 finding of ChatGPT emitting narrow no-break spaces. **Three things now cut against the word "today":** OpenAI denied it was deliberate and called it a reinforcement learning artifact; **Rumi reported on 23 April 2025 that the characters had disappeared**; and an independent scan of 1,815 characters of current Claude output found zero invisible characters, matching Originality.AI's published test. **Row 63 already records the commercial consequence in Jon's own words: "for pasted Claude text it finds nothing."** | **A measurement session, and it is cheap.** Scan twenty real ChatGPT and Claude outputs, of varying length, and count. **It decides whether the free scan has a hook at all**, which is upstream of the free-tier arithmetic in row 63 |
| 96 | **Marketing copy is the evidence that meets the knowledge element in seventeen state term paper statutes** | risk | **Unresolved and it needs a real lawyer, not a session.** Working position: keep the site's careful FAQ posture, and **do not let a CTA anywhere instruct a submission** | **Seventeen US states have term paper mill statutes and seven criminalise or enjoin the ADVERTISING separately from the selling**, including **California Education Code 66401**, where section 66403 gives standing to **"any person"**, and **Texas Penal Code 32.50(b)**, which reaches whoever "offers or advertises for sale". Un-Claude does not write papers, so the ten statutes needing a submittable assignment fit badly. **Two categories do reach it**: the states prohibiting sale of "assistance" (Oregon "any assistance", Maryland, Pennsylvania, Massachusetts), and **every editing carve-out, each conditioned on not making "substantive changes"** (Washington, Oregon, Colorado, Texas). **A tool that rebuilds every sentence makes substantive changes on its face.** All seventeen carry a knowledge element about the student's intent, and **two courts have held disclaimers do not defeat it when the marketing points the other way**: *People v. Magee* (NY 1979) called signed disclaimers "patently tongue-in-cheek, and executed with an obvious wink", and *Trustees of Boston University v. ASM Communications* (D. Mass. 1998) found "for research only" warnings did not help. **The counterweight is substantial:** no US case, AG opinion or enforcement action has ever applied any of the seventeen to an AI tool or any software; total case law is three decisions in fifty years; **the plaintiff lost every count in the leading case** and the Massachusetts AG declined to prosecute; the First Amendment question was raised there and expressly not reached; none of the seventeen has been amended for AI; and the peer-reviewed analysis (Gaumann and Veale, 2024) judges the knowledge requirement "will likely prove difficult" to meet and calls the regimes "primarily symbolic". **Related to row 53, the Stripe business description, which is the same question asked by a payments risk team** | **Before the first paid or organic campaign goes out, and it is cheap: twenty minutes of a real lawyer's time.** The free mitigation is already identified and costs nothing: **a CTA that ends on the free scan rather than on "do it before you hand anything in"** |
| 97 | **In Australia, New Zealand and Ireland the ADVERTISING is a standalone criminal offence, and Australia blocks websites** | risk | **Unresolved, and this is now the largest open risk attached to marketing. It needs a real legal opinion, not a session.** Working position: keep the site's data-hygiene characterisation and never let marketing describe the product as helping a student pass work off as their own | **Australia, TEQSA Act s 114B:** advertising an academic cheating service is a standalone offence at **2 years imprisonment or 500 penalty units, five times that for a company**, with a parallel civil penalty. **Strict liability applies to key elements** and s 114A(4) says it is "not necessary to prove that the person provided ... to a particular student". The Act reaches a person "whether that person is in Australia or elsewhere", **and that was proven against a US company: Chegg, Federal Court, 27 March 2026, $500,000 plus $150,000 costs.** **TEQSA blocks websites: 616 as of 19 May 2026**, routinely via an ISP protocol under s 313(3) of the Telecommunications Act, and its one Federal Court injunction was granted on the **advertising** provision. **Ireland, s 43A(5) and (6):** two separate advertising offences, up to **EUR 100,000 and 5 years**, prosecuted by QQI, **whose own page lists "paraphrasing services (to hinder counter-plagiarism tools such as TurnItIn)" as a commercial contract cheating service.** **New Zealand, s 393(1)(b) and (c):** advertising and publishing an ad, NZ$10,000. **The counterweight is real: Un-Claude provides no work.** Australia's definition is "the provision of work to or the undertaking of work for students", and this tool takes a document the student already has. **No regulator has placed AI tools inside the definition** — TEQSA's guidance, good practice notes, gen-AI hub and both sector alerts were checked and it treats gen AI and cheating services as separate tracks. **The exposure is specific to broadcast marketing, because TikTok does not respect borders**: a video aimed at students reaches Australian, NZ and Irish students whatever the creator intends | **A proper legal opinion before the channel is scaled, not before the first post.** The question is whether a watermark removal and rewriting tool is an "academic cheating service" in those three jurisdictions, and nobody has answered it. **The free mitigation is already applied:** the CTA no longer instructs a submission, and the site's careful FAQ posture is what supports the data-hygiene characterisation. **Realistic worst case is a block, not a prosecution**, which is survivable, reversible and public |
| 98 | **The enforcement record in this category has never once reached a post-processing tool, and it materially downgrades row 97** | risk | **Working position, and it is now evidenced rather than hoped: the statutory exposure in row 97 is real but the enforcement risk is low, and the mitigation is reputational rather than legal.** Do not shelve the marketing channel over row 97 | **Every enforcement action ever taken in this space hit someone producing or selling the academic work**: TEQSA's 616 blocks, the Chegg penalty, the UK offence, PayPal 2019, Paddle, Lemon Squeezy, Google Ads, YouTube 2018. **The decisive check: TEQSA's live blocklist was pulled in full, 615 domains, and grepped for `humaniz|bypass|undetect|stealth|paraphras|rewrit|gptzero|turnitin|quillbot|phrasly|humbot|writehuman|hix`. Zero matches.** It is entirely essay and homework mills. Five further verified negatives: **no registrar or host has ever taken down an essay mill or humanizer anywhere**; **Visa's Integrity Risk Program names no education category** at all; **the UK has had an advertising offence since June 2022 with zero prosecutions**, confirmed by the BBC with both the CPS and the DfE in December 2025 while "dozens" of firms advertise openly; no UDRP action has ever been brought against a bypass tool; and Google Ads bans "essay or thesis **generators**", giving seven days' warning first. **On payments this is actively good news: Stripe publishes a marketing case study for Undetectable AI**, describing a tool that helps writing "pass muster with AI content detectors", at 18 million users, and **Stripe's restricted list contains no academic category.** **Un-Claude is already on the right processor by luck rather than judgement**: Paddle names "essay and paper mills, ghostwriting services" and Lemon Squeezy names "Homework/Essay mills", both by name. **The one documented payment withdrawal, PayPal 2019, was triggered by press and a minister, not by chargebacks, a card network or a regulator**: the QAA wrote to six platforms in Nov 2018, the BBC named PayPal in Dec 2018, the Education Secretary named PayPal personally on 20 March 2019, and **PayPal folded fourteen days later** | **Nothing to do now. Revisit if a journalist contacts the project, which is the actual trigger this evidence identifies.** The standing mitigation is the one the site already runs: honest claims, careful characterisation, and not being the story. **Answers row 53 from the outside and downgrades row 97** |
| 99 | **[URGENT] Layer B calls Vercel's AI Gateway, and Vercel's Acceptable Use Policy names watermark removal as prohibited** | risk | **Live conflict, verified in the repo and against Vercel's own policy page on 24 August 2026. Not a hypothetical.** Working position: **move layer B to a direct provider call.** The code already takes the base URL from an environment variable, so this is a URL and a key, not a rewrite | **The repo side:** `WATERMARKS_REWRITE_BASE_URL` is documented as `https://ai-gateway.vercel.sh` in `ENGINE.md` line 262, and `server.py` line 822 reads it. **Layer B, the only layer that costs money and the only one that earns it, routes through a Vercel AI Service.** **The policy side, fetched from vercel.com/legal/acceptable-use-policy and quoted verbatim.** Section 3, Artificial Intelligence Services, prohibits: **"Remove any metadata, digital signatures, or watermarks to identify AI-generated content"** and **"Represent that output is human-generated without reliance on AI"**. Section 5: **"If we reasonably believe you or your users are violating this Policy, we may restrict, suspend, or terminate your access to Services immediately upon notice to you."** **Two clauses, and the product does both by design.** **Scope, stated precisely:** section 3 is scoped to AI Services, so plain hosting under section 2 does not carry the watermark clause. **But section 5 makes a violation a material breach of the Agreement and speaks of terminating access to "Services" without qualification, and un-claude.com is hosted on Vercel too.** So the realistic worst case is not just the rewrite failing, it is the rewrite and the site going together. **This is the only policy found in an entire sweep of platforms, processors, app stores, ad networks and four countries' statutes that names watermark removal explicitly, and it is the one the engine currently calls.** **Marketing amplifies it:** a campaign describing the product as watermark removal is exactly what brings it to the provider's attention | **Before the TikTok campaign runs, and ideally this week.** It is upstream of marketing rather than downstream: **the channel that makes the product visible is the channel that surfaces this.** Two steps: point `WATERMARKS_REWRITE_BASE_URL` at the provider directly rather than at the gateway, and confirm which provider layer B is actually routed to (git history says Mistral-small, verified live at 2.9 seconds). **Belongs on `IMPLEMENTATION-BOARD.md` at the top, not buried in this file** |


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

---

## Parked, 19 August 2026, session 8

- **Test our own rewrite against Anthropic's detection API the day it opens.
  PARKED BY JON, deliberately, not forgotten.** The assistant recommended
  building it now, Jon's ruling was later. **The trigger for revisiting is the
  day Anthropic opens access**, confirmed 12 August 2026 as coming, not callable
  as of 19 August. **Why it will matter then:** the same event that makes the
  site's urgency real is the event that makes every claim on it checkable. Being
  first to run it is either the best marketing asset the product can own, or the
  earliest possible warning. **Working position until then:** claims describe the
  engineering and report measured results, and never assert a verified defeat.

- **The layer B gate is confirmed and is where the money is.** Layer A and
  metadata run instantly with no account. **Layer B needs an account, because it
  is the layer that costs real money per run and is the thing being sold.** Sign
  up grants 2 to 3 credits, roughly 2,000 to 3,000 words. Consistent with `04`
  entry 67. **Open refinement, not yet ruled on:** whether a short free sample
  rewrite, on the visitor's own text with the receipt shown, should sit in front
  of that gate. See the session 8 discussion. The argument for it is that layer B
  is the one layer that cannot be demonstrated, so a sample is the closest thing
  to proof available before payment.

- **Mobile is the first impression, desktop is likely the actual use.** Jon, 19
  August 2026: students will see the site on a phone and probably switch to a
  desktop to do the work. **So the phone has to sell and be shareable. It does not
  have to be where the heavy work happens**, though the tool must still function
  there.

- **SEO is parked as its own task, by Jon, 19 August 2026.** "Maybe think about
  SEO and how you're doing things... maybe that's a later task." Nothing on the
  page was built for SEO tonight beyond what Next.js already does (robots.ts and
  a sitemap exist). **Trigger for revisiting: after launch**, as its own session,
  covering metadata, structured data, and the copy's search surface.

## Where sign-up should land you, opened 20 August 2026

**Jon, on completing the first real sign-up in production:** "now when you
sign up it brings you to this weird page instead of just back to the home
page."

The starter sends a new account to `/home`, its wallet page. That is correct
for a dashboard product and wrong for this one: nobody arrives at un-claude.com
wanting to look at a balance, they arrive wanting a document cleaned, and they
only signed up because the tool asked them to. Landing them on a ledger drops
them out of the job they were doing.

**Working position: send a new account back to the tool**, with the new balance
visible in the header so the 3 credits register. The wallet stays reachable
from the account menu for anyone who wants the history. **Not yet implemented.**
Revisit with the credits UX work (family 3), since it shares the same files as
the paywall and balance chip.

## The welcome grant is paid twice, found 20 August 2026

**The ledger after Jon's first real sign-up:**

    3100a55e (guest)  +2 anon_grant, -1 spend, -1 spend   = 0
    2a7c662a (guest)  +2 anon_grant, -1 spend, -1 spend   = 0
    f17969e2 (real)   +2 anon_grant, +3 signup_grant      = 5

Entry 97 ratified **2 + 3 = 5 free credits**. What actually happens is that a
visitor receives 2 as a guest, spends them, signs up, and is then granted the
welcome *again* on the real account alongside the signup grant. **The real
total is 7, and it is unbounded across browsers**: clearing cookies mints
another guest and another 2.

`grantOnce` is doing its job — it prevents a *second* welcome per account. The
gap is that guest and real accounts are separate accounts, so the per-account
guarantee does not add up to a per-person one.

**This is not urgent while nothing costs money except layer B, and it is the
generous direction rather than the dangerous one.** But it is the exact shape of
the credit-farming problem, so it belongs to the security pass rather than being
patched ad hoc. **Working position: leave it, and decide it alongside the
per-IP cap on anonymous grants**, so both are solved by one mechanism instead of
two competing ones.

## The double grant is closed, 21 August 2026

**Resolved by the security pass, as the working position above asked for: one
mechanism, not two.** Both routes now read the guest cookie *before* granting,
so a real account continuing a guest session is not paid the welcome grant a
second time. Both arrival paths land on the ratified **5**: sign up cold and it
is 2 + 3; arrive as a guest and it is the guest's 2 (spent or merged) plus 3.
Beside it, the signup grant is now keyed to a normalised email **inbox** rather
than an address, so `student+1@` and `student+2@` collect it once. See `04`
entry 110 and `docs/session-notes/security-fixes.md`.

**The code half is done and committed. The email-dedupe half needs migration
`20260821120300_signup_grant_email_dedupe.sql` applied before it does anything**
— until then the code detects the missing column and grants without the dedupe
rather than failing, so nothing breaks, but the door is still open.

## Should deleting an account delete the ledger? Opened 21 August 2026

**The question, in plain English.** When someone deletes their account, their
sign-in goes. Their account record and their credit history do not.

**Why it is open rather than a bug.** `public.accounts.id` carries no foreign
key to `auth.users`, so `auth.admin.deleteUser()` removes the login and leaves
the account row and every `credit_ledger` row standing. **Verified, not
assumed** — the schema shows no such key, and the live database has an orphan
`accounts` row with no matching auth user. **The privacy policy already
describes this accurately**, so nothing on the site is false today; a previous
session found the same thing and wrote the honest sentence rather than the
expected one.

**Working position: leave it.** The record is small (no document content, only a
history of jobs and amounts), the page tells the truth about it, and changing it
alters the deletion semantics of every account.

**The fix when it is wanted** is a foreign key from `public.accounts.id` to
`auth.users(id) on delete cascade`. The append-only trigger added on 21 August
was deliberately written to allow that cascade, so it will not stand in the way.

**Trigger for revisiting:** any of — a user asking for their data to be erased,
a GDPR/CCPA obligation being taken on, or the ledger starting to carry anything
more identifying than it does now. **The privacy policy must be edited in the
same deployment as the foreign key**, because that page's wording depends on
this behaviour.

## Guest credits carry over once, ever — RATIFIED 21 August 2026

**Jon's ruling.** An account absorbs a guest balance exactly once in its life.
Enforced by the `guest_conversions` table and the locking SQL function from
`20260821140000_guest_conversion_once.sql`.

**What it buys:** it closes the farming hole. Before this, you could sign out,
collect a fresh guest grant, sign back in, and repeat indefinitely, and the
ratified 2 + 3 = 5 drifted to 7 and upward.

**What it costs:** a returning signed-out user who accumulates guest credits and
then signs into an existing account keeps nothing. That is a real person losing
something they were given. Accepted deliberately as the cheaper of the two
errors, because the alternative is unbounded.

**Verified on the live database**, four invariants: no doubled transfers, no
negative balances, every transfer has a record, and no welcome grant after
conversion. Three real conversions on record at the time of ratification.

## The confirmation email opened on a different device — OPEN

**Not a bug in anything, and nothing errors. It is how people read email.**

Someone uses the tool on a laptop, is given a guest account with credits, and
spends one. They sign up; the confirmation email arrives; they open it on their
phone. The link confirms the account and creates the session **on the phone**,
which has never seen the tool and holds no `uc-guest` cookie. **The merge cannot
fire** — the guest exists only on the laptop. Back on the laptop they are still
a signed-out guest, and their remaining credit is stranded on an account they
can no longer reach.

**Nobody has looked at this.** It is the most likely real-world failure left in
the funnel, because reading email on a phone is the normal case rather than the
edge case.

**Directions worth considering, none chosen:** carry the guest id in the
confirmation link so the merge can run wherever it is opened; or make the
laptop's still-open session notice the account was confirmed elsewhere; or
accept it and make the carry-over promise conditional in the copy. **Deciding
this needs a view on how often it happens, which nothing currently measures.**

---

## A forged `uc-guest` cookie can name another user's anonymous account

**Raised 21 August 2026, session 11, by the payment audit. `04` entry 114.**
**Open. Not fixed today, deliberately.**

**What it is.** `merge_guest_credits` validates that the account named by the
`uc-guest` cookie **is anonymous**, but not that the caller ever held that guest
session. The cookie is an attacker-controlled value that reaches a database
write. So someone who learns another visitor's anonymous account UUID can put it
in their own cookie and have that account's remaining credits transferred onto
theirs, leaving the victim at zero with an `adjustment / transfer_out` row they
did not cause.

**Working position: leave it, and record it.** Three reasons, and the third is
the real one.

1. **It needs a UUID that is never published.** Anonymous account ids are not
   rendered, not in any URL, and not returned by any endpoint to anyone but
   their owner. There is no enumeration path, and a UUID is not guessable.
2. **The take is at most 2 credits**, the welcome grant, on layers that cost us
   nothing to run.
3. **The fix is not obviously cheap and could break the real flow.** Proving
   "this browser held that guest session" means signing the cookie or keeping a
   server-side record, and the guest merge is the piece of this system that has
   already been broken three separate ways. **Changing it to close a hole that
   requires a secret UUID, days after finally getting it right, is a bad trade
   this week.**

**Rated LOW by 2 of 3 skeptics** in the audit, against CRITICAL for the two
defects fixed the same day.

**Trigger for revisiting.** Any of: an anonymous account id becoming visible
anywhere a third party can read it; the welcome grant rising materially above 2
credits; or the guest merge being touched for another reason, at which point
signing the cookie is a small addition to work already being done.

---

## Does the site disclose that the engine started as someone else's code?

**Raised 23 August 2026, press Phase 2. Open, and it blocks press outreach.**

**The fact.** `apps/web/engine/PROVENANCE.md` records that the engine folder is a
copy of `guillaumemeyer/watermarks-remover`, MIT licensed, taken at commit
`063119d` on 18 August. `UPSTREAM-LICENSE` is present and intact, **so the licence
is satisfied and this is not a legal question.**

**What the repository shows about how much is still upstream.** Counting commits
since the copy: `text_unicode.py` and `clean_text.py`, which do the entire
invisible-character layer, have **one commit each, meaning they were copied in and
never modified.** `image_meta.py` has two. The files carrying the `uc_` prefix,
`uc_chunk.py`, `uc_policy.py` and `uc_leakguard.py`, are un-claude's own work and
all three sit on layer B.

**So the two layers the product can prove are the two layers it did not write, and
the layer it wrote is the one nobody can verify.** That is checkable from the
repository in minutes.

**Why it is urgent rather than theoretical.** Ax Sharma's 13 August
BleepingComputer audit of this product category names `watermarks-remover`
explicitly and quotes Guillaume Meyer volunteering that his tool removes metadata
only for now. **He is the reporter most likely to cover this and he already has the
lineage in his notes.** Disclosed lineage and discovered lineage read completely
differently in a story.

**Working position: disclose, and do it before any journalist is contacted.**
`PROVENANCE.md` already says a visible attribution "is planned", so **this was
decided once and never shipped.** The recommendation is to ship the credit line,
tell Meyer directly before the press hear about it, and lead the Sharma email with
it. Full reasoning in `docs/session-notes/press-phase-2.md` section 3.

**This is Jon's decision and it is not yet made.** Nothing in press Phase 2 or 3
starts until it is.

**Trigger for revisiting.** Answered by Jon, or any journalist contact being made,
whichever is first.

---

## Chinese, Japanese and Thai: the honest word count is built, and wiring it to the customer is one coupled pricing decision

**Raised 24 August 2026, Lane A. CLOSED THE SAME DAY BY JON — see `04` entry
136. He ruled REFUSE these scripts rather than price them**, because refusing
closes the hole with no pricing arithmetic, no change to the word ceiling, and
no browser counter to keep in step. Shipped and verified in the route session.
**Everything below is the analysis that led to the ruling, kept because it is
still the right description of the mechanism.**

**The fact.** Every word count in the product is `len(text.split())`, which
counts spaces, and these three scripts do not put spaces between words. So a
Chinese, Japanese or Thai document today: counts as roughly one word → bills
one credit → passes the 10,000-word ceiling at any size → and is then silently
skipped by the 16-word rewrite floor. The customer pays one credit, gets layer
A and metadata, and no rewrite runs.

**What Lane A shipped.** A script-aware counter (`engine/uc_wordcount.py`,
tested) now drives the ENGINE-INTERNAL numbers — chunk sizes, the truncation
guard, the leak guard — where it cannot change a price. Customer-visible
behaviour is unchanged.

**Why the rest is ONE decision, not three.** Fixing the floor alone runs
rewrites the gate never priced (a 200,000-character Chinese document would
bill 1 credit and cost ~170 chunks of model calls). Fixing billing alone
charges for a rewrite the floor still skips. And the browser's own counter
(Lane C's file) must change in the same deploy or the price shown will not be
the price charged — the two-implementations trap, again.

**Working position.** Wire `count_words` into `uc_policy.word_count` (billing
and the gate) and the server floor in one change, with the workbench counter
updated in the same deploy — and re-measure rewrite quality on these scripts
before advertising support, because W10 measured French coming back
half-translated in 16 of 20 runs and CJK has never been rewritten even once.
Also note `trigram_overlap` is invalid on non-Latin script (W10 §4.9), so the
receipt would mislead in both directions until it is script-aware.

**Trigger for revisiting.** Jon ruling on it, or the first CJK support request
from a real customer, whichever is first.

---

## Lao, Khmer, Burmese and Tibetan have exactly the CJK billing hole and are not closed

**Raised 24 August 2026, route session. Open, and it is small.**

**The fact.** Jon's ruling (`04` entry 136) refuses Chinese, Japanese and Thai
because they are written without spaces between words and every price here comes
from a word count that counts spaces. **Lao, Khmer, Burmese and Tibetan are
written the same way and have the identical hole.** A document in any of them
counts as roughly one word, bills one credit, and passes the 10,000-word ceiling
at any size.

**Why they were not included.** The ruling named three scripts. The reasoning
behind it — refuse what cannot be priced — plainly extends to these four, but
extending a ruling is not the same as following one, and refusing a script turns
away a real customer. `CLAUDE.md` section 5.

**Working position.** Leave them accepted. The exposure is small: these languages
are a very small share of the traffic this product expects, and the same 16-word
engine floor that currently skips the rewrite on Chinese skips it on these too,
so no model call is made today either way.

**The fix is one line.** `SPACELESS_LETTERS` in `app/api/tool/clean/route.ts`
already reads as a list of script names; adding `\p{Script=Lao}`,
`\p{Script=Khmer}`, `\p{Script=Myanmar}` and `\p{Script=Tibetan}` closes them on
the same terms, with the same threshold and the same message — though the
message names three languages and would need a fourth clause.

**Trigger for revisiting.** Jon ruling on it, or anyone wiring an honest word
counter into the engine's 16-word rewrite floor — **that change is what turns
this from a latent hole into a live one**, for these scripts and for CJK alike.

---

## Does Vercel's cancellation switch reach an App Router route? Unanswered, and only a deploy answers it

**Raised 24 August 2026, route session. This replaces the earlier M-6 row as the
live version of the question.**

**What changed.** `"app/api/tool/clean/route.ts": { "supportsCancellation": true }`
is now in `apps/web/vercel.json`. **It is unproven and untestable from a
laptop.**

**What is now known that was not.** Lane B's second reason for not switching it
on blind was "Vercel's own examples target `api/**` and `pages/api/**`". **Vercel
documents App Router paths in a `functions` block** — the advanced-configuration
page gives `"app/api/hello/route.ts": { "memory": 3009, "maxDuration": 60 }`
verbatim. So the glob form reaches App Router routes for the two settings the
docs demonstrate. **Whether `supportsCancellation` is honoured there is the open
part.** The key itself is valid: Vercel's published schema lists it as a boolean,
default false, and our `functions` block uses only allowed keys.

**The risk to name before deploying.** If the Next builder does not recognise
that path as a function, the **build fails** with "the pattern defined in
`functions` doesn't match any Serverless Functions". This could not be ruled out
locally: `.vercel` is not linked in this repo and linking authenticates against
the live project.

**Working position.** Deploy from a quiet tree, watch the build, then run
`UC_SITE=https://un-claude.com node scripts/verify-connection-drop-refund.mjs` —
a 250,000-word layer-A-only job, so no model call and no cost. **A refund row
means M-6 is closed with no new dependency.** No refund row means the switch does
not reach this route, and the next step is `waitUntil` from `@vercel/functions`,
**a new dependency and therefore Jon's call.**

**Trigger for revisiting.** The next deploy.

---

## The freeze's interface half is owed, and the wording is already fixed

**Raised 24 August 2026, E-9 session.**

The engine now returns everything D4 needs, before payment, on the free scan:
`billing.freeze = {fraction, frozen_words, words, spans}`. **Nothing shows it
yet.** The interface half is Lane C's (board W-10): the Continue/Cancel
prompt, **whose wording is FIXED on the board** — it must not say
"quotations" (the machine knows what it froze, not that it found a
quotation) and must not say removal is reduced (unprovable in both
directions, and by D2's reasoning the frozen spans carry little watermark).
**Above 60% frozen, the prompt gets louder.** The rewrite's own report
carries `layer_b.freeze`, including `chunks_fallback` with a plain-English
`note` when the D3 hand-back fires — also unshown. Trigger: **Lane C's next
session.** Wording through the messaging skill; the fixed D4 text is the
floor, not a draft.

---

## Spans the freeze deliberately does not protect

**Raised 24 August 2026, E-9 session.** D1 ships two tiers — structure
(headings) and quotes (attributed quotations, block quotes, references) —
and the freeze stops there on purpose. Left free, with the working position:

- **`[sic]` markers** (W10: left on a substituted word 6–7 of 10). A claim
  about somebody else's document, so discretion-free like a quote — but it
  was not in the ruled tiers and every extra mask adds restore-failure
  surface. Trigger: the report-only protection block showing `sic` damage
  on real customers' documents.
- **URLs, code, tables, equations** — E-3's chunk fixes removed their worst
  failure modes (boundary deletion, torn fences), and addresses already
  survive 858 of 860.
- **Unattributed quotations** — D2, settled, not an open question; listed
  only so nobody reads this row as an oversight.
- **The attribution cue's residuals, accepted. REWRITTEN 24 August 2026,
  E-16 — the old list is obsolete and entry 142 replaces it.** Epistolary
  fiction's *«she wrote: "…"»* no longer freezes wrongly; it goes free, and
  so does all real attribution carried by a pronoun (*«The auditor … She
  wrote that "…"»*), which is the same rule seen from the other side. An
  UNCITED trailing attribution — *«"…," wrote Orwell in 1946»* — also goes
  free, because a bare year is not a citation shape. What still freezes
  wrongly: a pre-quote tag on a named character, *«Marcus concluded, "…"»*,
  textually identical to *«The committee concluded, "…"»*. Measured residual
  2 of 45 fiction lines, 2 of 30 attribution shapes. Trigger: real-customer
  protection reports contradicting the trade.

---

## Freeze behaviour past ~520 words is unmeasured

**Raised 24 August 2026, E-9 session.** Live measurement ran to ~520 words
and 2 chunks. W10's warning stands: a 10,464-word document is 34 chunks, and
mask loss looks like a function of how many masks sit alone as whole
paragraphs, not of document size — **do not assume the measured restore
rate scales.** The D3 fallback bounds the damage (a lost mask costs one
chunk, not the document), but the fallback RATE at scale is unknown.
Trigger: E-8's ceiling re-measurement, which runs long documents anyway —
add the freeze columns there.

---

## The post-purchase banner never reaches its give-up message

**Raised 24 August 2026, email and analytics session. Measured, not
inferred.** `purchase-banner.tsx` is meant to re-ask the server ten times over
about fifteen seconds and then tell a buyer whose credits have not appeared to
refresh and, failing that, to email support. **It asks once and then stops
forever.** The buyer sits on *"Payment received. Adding your credits now…"*
indefinitely.

The retry is scheduled inside an effect whose dependency list is
`[status, purchaseLanded, gaveUp, router]`. `router.refresh()` changes none of
them, so the effect never re-runs and no second timer is ever scheduled. The
file's own comment claims otherwise and is wrong about React.

**Evidence:** driving `/dev/purchase?purchase=success&landed=0`, the network log
shows the page load, exactly one `_rsc` refresh, and then nothing for over a
minute, with the banner text unchanged.

**Working position: leave it, and it is Jon's call.** The fix is small — the
counter needs to be state rather than a ref, so React can see it change — but it
alters behaviour on the live payment return path, this session was told not to
deploy, and it cannot be rehearsed against a real Stripe webhook from here.

**Why it is worth doing soon anyway:** it hides the support address at the exact
moment a customer most needs it, and it now hides the only signal that
`purchase_completed`'s `credits_ready: false` is firing for real people.

**Trigger: the next session that owns `app/home/**` with permission to deploy.**

---

## The checkout funnel is cut in half by the cookieless setting, and no event can rejoin it

**Raised 24 August 2026, email and analytics session.** `checkout_started`
fires on /pricing. The buyer then leaves for stripe.com and returns through a
fresh page load, and because persistence is `memory` the visitor id that fired
it no longer exists. **`purchase_completed` therefore belongs to a stranger.**
Both are trustworthy counts; neither is a funnel step the other can follow.

Same wall as `signup_completed`, same reason, recorded in `07` under
"Cookieless has an identity boundary".

**Working position: read them as two numbers side by side, and build the funnel
five steps deep rather than six.** A six-step funnel would show near-total
abandonment at the last step, which is false and is exactly the kind of number
somebody acts on. The walkthrough in `docs/session-notes/email-and-analytics.md`
builds it the honest way.

**`posthog.identify()` is NOT the fix and must not be reached for.** It would
not work — the anonymous id was gone before the account was known — and it puts
a real person into the analytics record, which changes the privacy policy, the
cookie policy, and requires a consent banner. **That is a policy decision and it
is Jon's.** It is written into the header of `lib/analytics/events.ts` so a
future session does not adopt it as a quick fix.

**Trigger: Jon deciding whether joined purchase attribution is worth a consent
banner.** Until then, Stripe answers "how many purchases" with the money
attached, which is the better source anyway.


---

## A hard-wrapped document gets no quote protection at all, silently

**Raised 24 August 2026, E-16 session, found while building the document-size
ladder. Not fixed — this is a decision, not a bug fix.**

`uc_spans._QUOTE` is `"([^"\n]{12,600})"`. **A quotation containing a newline
is not detected**, so a document hard-wrapped at 80 columns — a plain-text
email, a `.txt` export, anything out of a terminal editor — gets no quote
protection whatsoever. Nothing warns anybody. Measured on the same ladder
document: **wrapped it freezes 13.8%, unwrapped 21.3%.**

**Working position: leave it.** The common paste — out of Word, Docs, a
browser — is one long line per paragraph, so the common case is already
right, and widening the pattern changes what freezes across every document
AND the D4 pre-flight percentage a visitor is quoted before they pay. That is
a pricing-visible change and it needs a ruling, not a patch.

**Why it is not free to leave:** the customer most likely to paste
hard-wrapped text is the one working in plain files, and they are quoted a
lower frozen percentage than the identical document would get unwrapped —
which is the *cheap* direction (more gets rewritten, nothing is handed back
frozen), so no customer is overcharged by it.

**Trigger for revisiting:** the first support case about a quotation coming
back reworded where the customer's source was a `.txt` or an email; or any
work on file upload, where wrapped text is the norm rather than the
exception. **File: `apps/web/engine/uc_spans.py`, the `_QUOTE` constant.**

## The site advertises 8,000 words and the engine still accepts 10,000

**Raised 25 August 2026, `tell-the-truth-about-runs.md` §5.2. Half-closed
deliberately: the copy half is done and the engine half is another lane's.**

`MAX_WORDS` in `_components/workbench/credits.ts` is now 8,000, the pricing FAQ
states it, and the workbench refuses above it. **`UC_MAX_WORDS` in the Python
engine is still 10,000.**

**It is worse than a stale constant, because the browser defers to the server.**
`workbench.tsx:503` reads `scan?.billing?.over_limit ?? wordsNow > MAX_WORDS`.
The server's answer comes first and `MAX_WORDS` is only the fallback, so:

```
8,500 words, before a scan   -> refused, "The rewrite takes 8,000 at a time"
8,500 words, after a scan    -> allowed, because the server's ceiling is 10,000
```

**Working position: ship it as it stands.** The direction is safe — the browser
is stricter than the server, so nothing is charged for a job that is then
refused, and no job that starts is at any new risk. **An advertised limit that
is occasionally more generous than advertised harms nobody**, where the reverse
would.

**Why it is not free to leave:** it is two implementations of one number, which
this project has been bitten by three times, and it means the site cannot
honestly say 8,000 is enforced. **`lib/engine/client.ts:64` is deliberately
still worded for 10,000** and becomes wrong the moment the engine moves, so the
two must change together.

**Trigger for revisiting: any Lane A session.** It is one number in
`api/_shared.py` plus that one string. **Until then, do not "fix" `client.ts` on
its own — it would then fire at 10,001 words claiming the limit is 8,000.**

## What replaces "over 90% of three-word sequences broken", if anything

**Raised 25 August 2026, `tell-the-truth-about-runs.md` §3. Removed from the
site; no replacement written, because `04` entry 77 makes statistics Jon's.**

The claim holds on **18 of 63 runs** on the shipped engine, measured with the
engine lane's own `overlap_unfrozen` — the share of the customer's three-word
runs still standing in the text that WAS rewritten. Median 0.185, so 81.5%
broken rather than over 90%. **On deepseek, now the settled model, 3 of 21.**

**It fails by document size, and that is the whole difficulty:**

```
  words   median % broken   meets "over 90% broken"
    463             95.3%   9 of 9
    919             94.9%   6 of 9
   1942             81.5%   0 of 9
   4958             68.0%   1 of 9
   9946             64.0%   0 of 9
```

**Working position: name no averaged figure at all**, and let the per-job
receipt carry it. The moat line now reads *"Every figure there is measured on
your own document, not averaged from ours."* **A number the visitor can check on
their own document beats a test-set average they cannot, and it cannot go stale
when the model changes.**

**Why it is not free to leave:** it was the site's only hard number about how
deep the rewrite goes, and taking it down is commercially expensive as well as
honest. **The moat and FAQ now argue the mechanism without quantifying it.**

**Trigger for revisiting:** Jon asking for a figure back, or the rewrite getting
materially deeper. **The only version the data supports is a floor with its
condition attached** — *"on documents under a thousand words, over 90% of your
three-word runs broken; longer documents are lower and the receipt shows you
yours."* It is not written anywhere.

## D4's pre-flight promises a full rewrite the engine does not always deliver

**Raised 25 August 2026, `tell-the-truth-about-runs.md` §8. Flagged and NOT
changed: the wording is fixed on the board and D4 is Jon's.**

D4's approved text ends *"The other 58% gets the full rewrite."* **It is false in
about half of runs.** D3's fallback hands a chunk back unrewritten — roughly 350
words — and the freeze note §5.2 measured that in about half of all runs; the 25
August ladder shows `fallbacks: 1` on every `ladder_5000` deepseek run. **A
visitor reads that sentence, clicks Continue, pays, and can receive 350 words of
that 58% exactly as they sent it.**

**Separately, "full rewrite" overstates even the successful case:** the median
run leaves 18% to 36% of the customer's three-word runs standing inside the text
it did rewrite.

**And it carries an em dash into visitor-facing copy**, against Jon's own rule
in `docs/05` section 2. **Whoever builds W-10 is told not to improvise the
wording, so they must either break the style rule or break the board.**

**Working position: change only the last sentence, keep the rest byte for byte —
"The other 58% is rewritten."** No new number, same shape, same Continue/Cancel,
and it stops promising a completeness the engine does not reach.

**Trigger for revisiting: before W-10 is built.** It is unbuilt today, so this
costs nothing to settle now and costs a rebuild later.

---

## A Word document's own title property keeps the tool's name, on purpose

**Raised 26 August 2026, `strip-the-tool-name.md` §6. Checked and NOT changed,
because the brief said to report it and not fix it here.**

A `.docx` carries a title inside `docProps/core.xml`, separate from its filename.
**The metadata strip does not empty it.** Measured on a document carrying
`<dc:title>ChatGPT Image Aug 25, 2026</dc:title>`: `dc:creator`,
`cp:lastModifiedBy`, `Application` and `Company` all came out empty and the title
came through verbatim.

**It is a decision rather than an oversight.** `container_meta.py` line 749 says
so: *"dc:title is deliberately not listed: it is the document's own heading, not
provenance."*

**The reasoning is right in general and wrong in one case.** A title the author
wrote is their content and emptying it would be vandalism. But Word fills the
title in from the filename often enough that a document downloaded as
`ChatGPT ....docx` arrives carrying `ChatGPT ...` in its title too, where nobody
looks and no interface shows it. **We now take the tool's name off the outside of
that file and leave it on the inside.**

**Working position: leave it alone until Jon rules.** Emptying somebody's
document title is a bigger act than renaming a download, it is a metadata
question rather than a filename one, and getting it wrong silently damages a
document rather than annoying somebody.

**The narrow version worth considering** is to apply the same rule the filename
gets rather than emptying the field: strip a leading tool name from `dc:title`
and keep the rest. Same list, same one implementation, and it never destroys a
title the author wrote.

**Trigger for revisiting: the next time anything touches `container_meta.py`'s
OOXML path, or any complaint about a Word document still naming its maker.**

---

## The money leak is at the moment somebody runs out, and 87% of them are shown another free offer instead of a price

**Measured 4 September 2026, after Jon asked whether to cut the free allowance to
one credit and drop the signup bonus. The numbers say his diagnosis is wrong and
his instinct about TIMING is right, so the question is recorded here rather than
answered.**

### The funnel, thirty days, live site, internal IPs excluded

```
884  visited
215  scanned their own document
129  pressed Sanitise
123  got a finished result
 85  ran out of credits
 17  saw the paywall
  6  clicked the out-of-credits offer
  3  pressed a pack button
```

**Stripe, all time: 3 payments, 1 refunded.** So roughly two net customers ever.

### What people actually use, which is far less than anyone assumed

```
99 of 123 people sanitised exactly ONCE. 19 did two. Five did more.
92% of every job ever run cost exactly 1 credit (242 of 263 ledger spends).
Median job: 201 words. 90th percentile: 973 words, still inside one credit.
```

**So "one free credit" already equals "one free job" for almost everybody, and
almost everybody already only does one.** Cutting the allowance to one would
change the experience of about 24 people a month.

### THE FINDING: the wall does not sell, because for most people it is not a wall

Of the 85 who ran out, **74 were guests and 11 had accounts.** The two see
completely different panels (`credit-offer.tsx`, `OutOfCredits`):

| Who | What they are shown |
|---|---|
| **Guest, 74 of 85** | "Sign up to receive **3 more** free credits. Claim them" |
| **Account holder, 11 of 85** | "Your balance is empty. Get credits" then `/pricing` |

**87% of everyone who reaches the only sales moment in the product is offered
more free credits rather than a price.** The route to money is: run out, sign up,
receive three more free, run out again, and only then meet a price. **Only 11
people a month reach that second rung.** That is two free rungs in front of the
till, and it is the direct explanation for Jon's own observation that email
signups are at an all-time high while purchases are nil. The machine is doing
exactly what it was built to do.

### AND THE OFFER ITSELF IS NOT LANDING, WHICH DECIDES WHAT TO FIX FIRST

**Six of the 85 clicked anything at all.** That is a free offer, one click, no
risk, and 92% walked past it. **When a free offer at that moment converts at 8%,
replacing it with a paid one converts worse, not better.** So the panel, its
moment and its placement are the first problem, and the size of the free
allowance is not.

### Working position

**Do not cut the free credits yet, and keep the signup bonus.** Cutting hits the
99 people out of 123 who do one job and leave, who are the likeliest to tell
somebody else, and it sends perhaps twenty extra people per month to a step that
has produced three sales in its lifetime. The signup bonus costs almost nothing
(only 11 of the 85 who ran out were account holders) and email addresses are the
one asset currently accumulating.

**Fix the moment instead.** The offer is a banner above the tool, met cold on a
later page load, competing with an entire landing page. It should arrive where
the finished document is, at the instant the balance reaches nought, while the
proof that the tool works is still on screen. And a guest should be able to reach
a price without first being routed through a second free offer.

**Trigger for revisiting: two weeks after the moment is fixed and `just_ran_out`
is reporting truthfully.** If the in-session population still does not convert,
Jon's experiment becomes the right next move and should be run properly, with a
before-and-after read rather than a guess.

---

## `just_ran_out` could never be true, so the two populations it exists to separate were never separated

**Found and fixed 4 September 2026. The interface was never affected. This was a
measurement defect only, and it is recorded because it invalidated a month of one
property and will be easy to reintroduce.**

**The symptom: `just_ran_out` was false on 85 of 85 events in thirty days, with
no exceptions.** A hard 100% is the signature of a code defect rather than of
behaviour.

**The cause, in `workbench.tsx`.** Two effects run in the same commit, in
declaration order:

1. the watch sees the balance go from something to nought and calls
   `setJustRanOut(true)`, which SCHEDULES a state update,
2. the reporter runs immediately afterwards, in the same commit, still holding
   the previous render's `justRanOut`, sends `false`, and sets
   `reportedEmpty.current = true` so it can never fire again.

By the time the state is actually true, the only line that reads it has already
run and locked itself.

**The fix is a ref alongside the state**, because a ref updates the instant it is
assigned while state does not. The state stays, because the panel's animation
reads it at render time and that always worked.

**What it cost: the one question worth asking of this data could not be asked.**
"Does somebody whose last credit was just spent behave differently from somebody
arriving on an empty balance" is the entire reason the property exists, and both
populations were recorded identically. The 6-clicks-in-85 figure above is a blend
of two groups that cannot be separated.

**NOT VERIFIED AT RUNTIME.** The local dev server would not hydrate across two
restarts, which is `06` row 77, so the corrected event was never watched firing.
The defect itself is proven by reading, and by the 85 out of 85. **The fix is
proven only by React's own guarantees**, that effects run in declaration order
within a commit and that a ref assignment is synchronous.

**How it will be confirmed, and it costs nothing: the live site.** After the next
deploy, the first person who runs out mid-session produces `just_ran_out=true`.
**If a fortnight passes and every event is still false, the fix did not work.**

---

## /how-it-works after the 6 September rethink

**Three things left open. All three are Jon's, and the session note
`docs/session-notes/how-it-works-rethink.md` has the measurements behind each.**

### The page is taller and "less space" was part of the ask

**Working position: keep it.** 4,140px to 4,828px on desktop, 5,553px to
8,103px on a phone. The page gained a whole section covering the thing most
visitors came for, and the rewrite went from a 230 word spec sheet to a 430
word sequence with two animations. **Everything the brief called broken got
smaller** — panel 3 down 49%, the three panels symmetric, three mobile
disclosures gone — but the total went up.

**Why it is unresolved: the two halves of Jon's own sentence pull apart.**
"More digestible and easier to follow" and "in less space" cannot both be had
once a seven-beat sequence is added to a page that did not have one.

**The trigger for revisiting: Jon looking at it on a phone.** The cut I would
make is folding beat 6 into "Where proof stands", which says a version of the
same thing 400px below it. Worth about 200px desktop and 350px phone, and it
costs the sequence its ending.

### "Three-word sequences" inside the reinstated claim

**Working position: leave the word alone.** Everything else on the page now
says "runs", per `04` entry 76. The claim *"Across our test set it breaks over
90% of three-word sequences with zero figures lost"* still says "sequences",
because it is inside a claim Jon reinstated on 25 August after being shown the
measurements against it (`04` entry 151).

**Why it is unresolved: editing a word inside a reaffirmed claim is not a
formatting decision.** It reads slightly against its own page.

**Trigger: the next time the claim is touched for any reason.** It is one word.

### Panel 3's diagram is a new drawing over Jon's own

**Working position: the new one stays.** The old drawing was Jon's spec of 20
August, a sentence stopping at a blank with a secret key picking between grey,
overcast and gloomy. **Beat 0 now teaches that idea in running prose, in
motion, with the same example**, and the brief flagged the duplicate. Dropping
the drawing entirely would have broken the panel symmetry the rethink exists to
create, so it was replaced rather than cut: the same sentence from a plain
model and a watermarking one, identical except at two words.

**Why it is unresolved: the secret key is no longer drawn anywhere**, only
described in panel 3's prose one sentence above.

**Trigger: Jon looking at the replacement.** The old file is in git at `1ae6f2e`
and restoring it is one file.

---

## ★ Anthropic's checker is LIVE, and it checks the metadata layer, not the rewrite

**Researched 6 September 2026**, prompted by Jon asking to wire
`claude.com/check-content` into the homepage after a scan. **This moves a fact
the whole site's argument sits on, so it is written down before anything is
built on it.**

**What the page actually is**, from the page itself and corroborated by
reporting:

| | |
|---|---|
| **Input** | **Files only.** Drag and drop. No text box at all |
| **What it reads** | **C2PA content credentials.** Our METADATA layer |
| **Where it runs** | **Entirely in the visitor's browser.** The file never leaves the device; it reads the embedded credential and nothing else |
| **Formats** | JPG, PNG, GIF, WEBP, TIFF, HEIC, AVIF, SVG, DNG, JXL, MP4, MOV, AVI, WAV, MP3, M4A, FLAC, to 100MB. **No Word document, no PDF, no .txt** |
| **An API** | **None published.** Nothing to call from a server |
| **The TEXT watermark** | Separate, and **"a Detection API, which is currently in private preview"** |

**WHAT THIS DOES NOT CHANGE, checked line by line: the site's layer B copy is
still accurate.** `/how-it-works` beat 6 says the detector "is coming rather
than callable, and nobody outside the labs can check a text for the mark
today", and that remains true, because **the live checker cannot see text at
all** and the text API is private. **"Where proof stands" is likewise
unaffected.** No copy needed correcting on the day this was found.

**WHAT IT DOES CHANGE, and it is two things.**

1. **`.claude/skills/unclaude-messaging` says "Anthropic has publicly committed
   to a detection API that anyone can use. Not callable yet."** That is now
   imprecise in the product's favour and against it at once: **a public file
   checker IS live and free**, and the text API has moved from "committed" to
   **private preview**, which is one step from the thing this company is
   waiting for. **The skill should be updated. It is a claims file, so that is
   Jon's.**
2. **For the first time this product can point at THIRD PARTY verification of
   one of its layers.** Anthropic's own tool reads exactly the credential we
   strip, it is free, and it runs on the visitor's own machine. **Our own green
   tick is worth nothing because we are the seller. Theirs is worth
   everything.**

**Working position on building it: a HANDOFF, not a badge.** Send the visitor
to Anthropic's checker with their cleaned file, rather than rendering a tick of
our own. There is no API to call, so a server round trip is not available
anyway, and driving somebody else's browser tool from our server would upload a
file their tool deliberately never uploads.

**Why it is unresolved: Jon asked for the badge**, and the difference between
"we checked and it is clean" and "check it yourself, here is where" is a
positioning decision rather than an engineering one.

**★ THE TRAP, WRITTEN DOWN SO NOBODY WALKS INTO IT.** A tick that says
"Anthropic verified: clean" after a REWRITE would be false. The checker cannot
see text. **It is honest for metadata, silent on hidden characters, and a lie
about layer B**, which `CLAUDE.md` section 4 names as the single easiest way to
make this project dishonest. Any build of this must gate on
`has_c2pa === true`, on a file, in one of the seventeen formats above.

**Trigger for revisiting: the text Detection API leaving private preview.** That
is a different and much larger feature, and somebody should be checking for it.
**Applying for the preview is a Jon action and is probably the highest value
item on this list.**

---

## Measured again 21 September 2026: the leak is that a whole essay fits in the free allowance. The cut is now Jon's to rule on

**This is the revisit the 4 September section above set as its trigger.** Full
data: `session-notes/pricing-investigation-21-sept.md`. Read-only.

**Since the 4 September change: 7 paid in 17 days against 2 in the 15 days
before**, with the same visitor count. Not attributable to that change alone:
desktop share went from 51% to 82%, the briefing shipped, and Google Ads ran.

**The finding that supersedes the 4 September working position.** The buyers
are essay people (5 of 6 have jobs of 2,000 to 7,500 words; the site median is
171). A first job of one credit converts at 4%; a first job of an essay
converts at 31%. **When the essay did not fit in the free credits, 2 of 2
bought. When it did fit, 9 of 11 cleaned it free and never ran another job.**
After signup the allowance is 3 plus unspent guest credits, up to 5, which
covers a 5,000 word essay. Entry 97's "first essay free, second paid" assumed a
second essay; there is not one.

**Working position: cut to guest 1, signup +1, so the ceiling after signup is 2
and no 2,000 word document fits.** Cost: 116 guests a month who run a second
free snippet (median 105 words, 3 minutes after the first) meet the signup wall
instead; they buy at about 0.2%. Gain: 3 to 9 sales a month on current traffic,
and n is too small to say which. **Run it for two weeks and read purchases per
essay-sized first paste.**

**Not recommended:** a $100 pack (251 of 305 credits sold are unspent; the two
Pro buyers used 0 and 1 of 100; nobody has exhausted a pack); a subscription
yet (1 of 7 buyers has repeated; entry 64's trigger is "a meaningful share");
any change to the three packs or the checkout (10 of 11 real sessions paid).

**Trigger for revisiting:** Jon's ruling. If he rules for the cut, the
before/after read two weeks later. **If he rules against it, the next lever is
not the allowance at all but the 40% failure rate on 4,000+ word jobs**, which
hit the $24.99 buyer's only job.

## Should purchase rows survive account deletion?

**Open, 21 September 2026.** `credit_ledger` cascades on account deletion, so a
buyer who deletes their account removes the record of the sale (`07`, "Deleting
an account deletes its purchase rows"). Stripe still has it, so no money is
lost, but the ledger cannot be the sales record. **Working position: leave the
cascade and treat Stripe as the book of record**, because the ledger is
append-only and the cascade is what makes deletion honest (entry 120). The
alternative is a `purchase_claims` table shaped like `grant_claims` (entry 121),
keyed to the Stripe payment intent rather than the account. **Trigger:** the
accountant entry 65 anticipates, or the first refund request from a deleted
account, which would need the row to exist.


---

## The signup-grant removal, read at nine days: the mechanism is proven, the conversion gain is not and cannot be

**30 September 2026.** Full data: `session-notes/free-credit-change-read-30-sept.md`.
This is the revisit the 21 September section set as its trigger.

**Matched 8.98-day windows either side of the 21 September deploy.**

| | Before | After | p |
|---|---|---|---|
| Unique visitors | 334 | 361 | |
| Reached a paid moment | 18.6% | **27.1%** | **0.009** |
| Purchased (Stripe) | 2 (0.60%) | 3 (0.83%) | 1.00 |
| Gave an email | 9.9% | **2.8%** | **<0.001** |
| Revenue per visitor | $0.150 | **$0.111** | |
| Clicked the offer at the wall | 58.3% | **13.3%** | **0.001** |

**THE FINDING THAT DECIDES HOW TO TALK ABOUT THIS: the conversion question is
not answerable at this traffic.** Detecting 0.60% -> 0.83% at 80% power needs
**~21,000 visitors per arm, over 500 days each.** Waiting will not settle it.
**Every statistical question here is blocked on volume, not on time.**

**What IS established, and it is mechanism rather than statistics:** two of the
three buyers since the change bought **before running any free job**, then
immediately ran essays costing 4 and 3 credits. **Both would have fitted inside
the old 5-credit allowance and both essays would have been free.** That is the
predicted mechanism, observed in individual ledger rows.

**Working position: keep the change, and stop describing it as a conversion
win.** Nothing argues for reverting. The one solid negative (offer click rate
58% -> 13%) compares a free giveaway against a price and was explicitly
predicted on 4 September.

**The open risk, and it is the one to watch:** revenue per visitor is **down
26%**, average order $24.99 -> $13.32. There is a mechanism that would make
that real rather than noise — the old free tier only let heavy users reach a
price, and heavy users buy big packs — but with 2 sales against 3 it is
unreadable. **Track revenue per visitor, not conversion rate**, because
conversion rate treats a $4.99 and a $24.99 sale as the same event and this
change appears to move the mix.

**BLOCKING THE NEXT READ: `paywall_shown` does not record how big the refused
job was.** It carries `input_kind` and `file_type` only, so "how many people
were refused an essay" cannot be counted and had to be inferred from three
buyers' ledger rows. `workbench.tsx` already holds `needed` and `have` at the
moment it fires the event. **Adding those two properties is the prerequisite
for answering this question properly, and it is one line.**

**Trigger for revisiting:** once `needed`/`have` ship, read *of people refused
an essay-sized job, what share buy?* That population is small enough to read
one row at a time and it is the population the change was aimed at.

---

## THE TERMS SAY UNITED STATES ONLY. NINE OF THIRTEEN SALES ARE NOT. Jon's decision, and it is urgent

**Found 30 September 2026 while answering a question about currency display.**
Read-only; nothing was changed.

**What `04` entry 115 and the code believe.** Credits are sold to US customers
only (Jon's ruling, 22 August 2026). `app/api/checkout/route.ts` states in its
header that "UK, EU and EEA cards are refused by a Radar block on the built-in
`card_country_blocklist`, populated by `scripts/block-eu-cards.mjs` and proven
in test mode."

**What the live Stripe account actually holds:**

```
card_country_blocklist      (country)  ->  0 entries
client_ip_country_blocklist (country)  ->  0 entries
   ...every other Radar value list also empty
```

**"Proven in test mode" is the whole defect.** Radar value lists are per-mode.
The list was populated in the sandbox and **never in live**, so the block has
never existed in production.

**What has therefore happened, from the charges themselves:**

```
succeeded charges by card country:
  US 4  ·  AU 3  ·  CA 2  ·  IT 1  ·  GB 1  ·  IL 1  ·  DE 1
```

**Nine of thirteen sales are non-US cards, including GB, IT and DE** — exactly
the jurisdictions entry 115 set out to avoid, for exactly the reasons it named:
the 14 day right of withdrawal, and EU VAT on digital sales to consumers, which
has no minimum threshold.

**And the traffic says this is not an accident of a few buyers.** Since 1
September, by country: United States 395, **United Kingdom 161, Germany 98**,
Australia 86, **Netherlands 43**, India 38, South Africa 36, Canada 26, Brazil
26, **Italy 24, France 18, Switzerland 17**. Roughly two thirds of visitors are
outside the United States.

**So there are two coherent positions and they are opposites.**

1. **Enforce the term.** Populate `card_country_blocklist` in LIVE mode. This
   makes the terms true and removes the VAT and withdrawal exposure. **It also
   refuses about 69% of the revenue taken so far.**
2. **Change the term to match reality.** Sell internationally on purpose, and
   take on what that means: EU/UK VAT registration or a merchant of record
   (Paddle was considered and rejected in entry 65 on acceptable-use grounds,
   and that judgement predates the product having actual EU customers), plus a
   14 day withdrawal right in the terms.

**Working position: neither, until Jon rules.** This is a legal and commercial
decision, not a technical one, and nobody in this project is qualified to
advise on tax. **What is NOT acceptable is the current state**, where the terms
say one thing, the enforcement says nothing, and the money says another.

**Trigger: immediate.** Every day this sits, more EU sales accumulate under
terms that disclaim them.

## ~~Stripe shows every price in USD~~ CORRECTED SAME DAY: it already shows local currency. See `07`

**The section below was written before the live sessions were read and its
premise is wrong.** Adaptive Pricing is already enabled in live mode and buyers
in Germany, Canada, Australia, Israel and the UK have been seeing their own
currency at unrounded amounts (EUR 4.56, CAD 36.39, AUD 7.22, ILS 31.30, GBP
7.69). The charge stays USD because that is the settlement currency; the
presented figure lives in `presentment_details`, which nothing here was
reading. **Kept rather than deleted because the reasoning about `currency_options`
below is still correct and is now the actual open question.** `07` has the
proof and the implementation consequences.

**THE OPEN DECISION, AND IT IS A PRICING ONE, SO IT IS JON'S:** what the clean
local prices should be. $4.99 converts to about €4.56 today; setting €4.99 is a
9% price rise for EU buyers, €4.49 a small cut. Nobody should pick those
numbers but him. Until he does, nothing changes and buyers keep seeing the
converted amounts.

## Stripe shows every price in USD, and Adaptive Pricing would change that for free

**Confirmed 30 September 2026, from Stripe's own documentation and the live
account.** Every charge ever taken is `usd`; `lib/server/stripe.ts` hardcodes
`currency: 'usd'` in `packLineItem`.

**Adaptive Pricing** lets Stripe present the buyer's local currency in Checkout.
Confirmed from the docs: it is a **Dashboard toggle**, not an API change
(`dashboard.stripe.com/settings/adaptive-pricing`); it **works with inline
`price_data`**, which is what this site uses; it covers every country that has
bought here (GB, DE, IT, AU, CA, IL, NL, FR, CH); and **Stripe charges us 0% —
the buyer pays a 2–4% conversion fee**, or opts to pay in USD.

**What it would NOT do is make the price look tidy.** Adaptive Pricing converts
$4.99 at the day's rate, so a German buyer sees something like €4.27, not
€4.99. **Clean local prices are a different feature**, `currency_options` on
the line item, which is a code change, makes Jon set each price by hand, and at
€4.99 would be a real price rise for EU buyers rather than a cosmetic change.

**Working position: do not enable either until the question above is ruled on.**
Presenting a polished local-currency price to EU buyers while the terms say we
do not sell to them makes the contradiction worse, not better.


---

## Google Ads is disapproved under "Enabling dishonest behavior", and row 98's reading of that policy was too narrow

**30 September 2026.** Full record: `session-notes/google-ads-disapproval-30-sept.md`.

**Row 98 says Google Ads bans "essay or thesis generators" and treats Un-Claude
as outside it. The policy text is broader than that example.** The prohibited
category is *"Services or products that enable academic dishonesty, like essay
or thesis generators"* — generators are an instance, introduced by "like". The
campaign was disapproved minutes after starting, on 6 September, after 9 clicks
and no checkouts.

**Row 98's main conclusion is unaffected and still good:** no enforcement action
in this space has ever reached a post-processing tool. That is about regulators.
**An ad platform applying its own rule to its own inventory needs no regulator
and has already happened.** The two should not be conflated again.

**Working position: do not pursue Google Ads by reworking copy.** The
disapproval attaches to the product and the landing page, Google re-reviews the
destination on save, and copy vague enough to pass would meet the separate
Misrepresentation policy. **This project will not write copy whose purpose is
to clear that disapproval; that is recorded as a boundary, in the session note.**

**The honest route to this channel, if it is wanted, is a genuinely separate
file-privacy product with its own landing page** — EXIF, GPS and C2PA
stripping, which the product really does and which carries no dishonesty angle.
Real work, smaller market, no reviewer needs to miss anything.

**But the arithmetic says the channel is not worth it at present.** Break-even
CPC is **$0.111** (revenue per visitor, measured, before Stripe's fees) against
realistic CPCs of $1–3. **Paid search needs the funnel to be ~18× better before
it can work at any plausible price**, and that work helps every channel.

**Two live exposures in the current ad assets, separate from the disapproval
and worth fixing regardless:** the headline "Official AI Watermark Remover"
asserts an endorsement that does not exist and is its own Misrepresentation
risk; and "Claude Watermark Remover" (pinned, so present in every impression)
plus "ChatGPT Watermark Remover" put third-party trademarks in ad text, which a
rights holder can have restricted on complaint.

**Trigger for revisiting:** revenue per visitor above roughly $1, which is the
point paid search stops being structurally unprofitable.
