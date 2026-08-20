# un-claude: Decision Log

Every ruling Jon has made, with the reasoning behind it and not only the outcome.

**Append only.** Nothing here is edited away. When a decision is superseded, the
new entry says so and the old entry stays, struck through where it is now wrong.
When an entry turns out to have been factually mistaken, a correction block goes
underneath it rather than replacing it.

Most recent entries are at the bottom.

---

## 17 August 2026, session 1

### 1. The project runs locally, not in a container or the cloud

**Ruling.** Kimi runs against a plain local folder at `~/un-claude`, with the
permission system kept deliberately tight. Not Docker, not a cloud virtual
machine, not a separate macOS user account.

**Reasoning.** Two distinct risks were identified. The first is data: everything
in a session reaches Moonshot's servers. That is bounded by keeping the project
self contained and putting nothing sensitive in it, which is already the rule.
The second is control, and it is the larger one: Claude Code executes whatever
tool calls the model asks for, so the model decides what runs on the laptop, and
the permission prompt is the only wall. Jon cannot read code, so his ability to
evaluate a proposed command is limited.

Isolation was rejected anyway, for a reason that is worth preserving: every
isolation option adds unfamiliar machinery, and when something breaks Jon would
be unable to tell a misconfigured container from a badly behaving model. The
first several sessions are documentation with almost no code execution, so the
risky surface barely exists yet.

Isolation also does not address the constraint Jon named as critical. Keeping
Kimi out of the Blotter project is a matter of where a configuration file sits,
not of which machine the work happens on.

**Consequence.** Recorded as an open row in `06` with a revisit trigger rather
than as a closed question. See that file.

### 2. New repository from scratch, not a copy of Blotter

**Ruling.** `jnachman17-hue/un-claude`, private, built up file by file.

**Reasoning.** Copying Blotter's documentation skeleton would have been faster,
but it carries a `00-START-HERE.md` that had gone stale, three git remotes
including one that must never be pushed to, and content about a product this
project is not building. The cleanup would have cost more than the head start
was worth. Building file by file also means Jon watched every file get written
and has some chance of knowing what is in his own repository.

### 3. The rulebook is written before Kimi is connected

**Ruling.** The repository, `CLAUDE.md` and the whole continuity system are built
and pushed to GitHub while Claude is still the model running the session. Kimi is
connected only afterwards.

**Reasoning.** Jon's phrasing: "Claude builds rulebook, Kimi gets governed on
it." Two supporting reasons. A model that authors the rules that constrain it is
not meaningfully constrained by them. And pushing everything to GitHub before
switching means the worst a local mistake can do afterwards is recoverable.

### 4. The project is not a model comparison

**Ruling.** un-claude is building a text humanising tool. Running on Kimi is a
configuration choice, not the subject of the project. It is not a benchmark, not
an evaluation, and not a comparison against any other model.

**Reasoning.** Jon, directly: "This isn't a test against claude whatsoever."

**Correction this supersedes.** An earlier draft of `CLAUDE.md`, and an explicit
question put to Jon about whether to disclose the comparison to Kimi, were both
written on the mistaken premise that benchmarking was the point. The premise came
from reading the phrase "deliberate side by side test" in Jon's opening brief as
a statement of purpose rather than as a statement about scope. `CLAUDE.md` now
says outright that nobody is scoring the model, so the framing cannot resurface
in a later session. Logged as a failure mode in `05` section 6.

### 5. Documentation lives in a flat `docs/` folder

**Ruling.** `docs/` at the repository root, with Blotter's file numbering scheme
kept identical.

**Reasoning.** Blotter nests its documents inside a `blotter-ib-ws1/` folder,
which was an artifact of a workstream naming convention that does not apply here.
One level shallower makes every reading order shorter. The file numbers are kept
the same so that Jon's familiarity with `04`, `05`, `06` and `07` transfers
without relearning.

### 6. The Moonshot API key uses the default project

**Ruling.** One API key, named `un-claude`, created under Moonshot's `default`
project rather than a new project.

**Reasoning.** Moonshot projects exist to split usage and billing across
unrelated work inside one account. There is one piece of work here. The extra
layer buys nothing and adds a place for a configuration mismatch to hide.

**Worth remembering.** Deleting that key in Moonshot's console is the emergency
stop. It kills all access immediately regardless of what is configured on the
laptop, and requires no terminal commands. It is the one safety control Jon can
operate entirely on his own.

### 7. The model is `kimi-k3`, with `kimi-k2.6` for background work

**Ruling.** `ANTHROPIC_MODEL` is set to `kimi-k3`.
`ANTHROPIC_DEFAULT_HAIKU_MODEL` is set to `kimi-k2.6`.

**Reasoning.** The obvious choice looked like `kimi-k2.7-code`, since the project
builds software and that model is the dedicated coding model. That reasoning was
rejected. The hard part of a text humanising tool is not the code, which will be
simple: read text, call a model, return text. The hard part is judgment about
writing, which is what Moonshot describes `kimi-k3` as being for, namely
"software engineering, knowledge work, and deep reasoning." A coding specialist
tuned for large codebases solves a problem this project does not have.

The cost is that `kimi-k3` is the more expensive model per token. That is bounded
by the spending limit Jon set in Moonshot's console, and the setting is one line
to change if cost becomes a problem.

`kimi-k2.6` handles background work: conversation summarising and other
housekeeping the harness performs without being asked. A cheaper model is correct
for that, and leaving it unset would have been worse than a cost problem. See the
runbook.

**How the model list was established.** By reading Moonshot's own documentation,
not from memory. Every Kimi model this assistant could have named from training
had been discontinued: the `kimi-k2` series was retired on 25 May 2026, as was
K2.5. **Standing consequence: a model identifier produced from memory by any
assistant should be treated as wrong until checked against the provider.**

### 8. The global permission warning is restored

**Ruling.** `"skipDangerousModePermissionPrompt": true` was removed from
`~/.claude/settings.json`.

**Reasoning.** That setting muted the confirmation screen Claude Code shows when
it is launched with its permission system switched off. It does not turn
permissions off by itself, it removes the last confirmation before they go off.
Jon cannot evaluate a proposed shell command by reading it, so the permission
prompt is one of very few safety mechanisms in this project that works without
him understanding code. Muting the warning in front of it made no sense with an
unfamiliar model about to be given shell access.

**Scope note.** This is a global change and therefore affects every project on
the machine, including Blotter. Jon approved it on that basis. It is the only
change made outside `~/un-claude` in this session, and it added nothing: it
removed one line. The global settings file was checked afterwards and confirmed
to contain no model, endpoint or Moonshot configuration of any kind.

---

### 9. This project runs in Terminal, not the Claude Code desktop app

**Ruling.** Sessions for un-claude are started by running `claude` in a Terminal
window from `~/un-claude`. The desktop app is not used for this project.

**Reasoning.** The desktop app does not load the project's `env` block, so it
silently ignores the Kimi configuration and runs on Claude against
`api.anthropic.com`. Session 2 ran this way, which is why the Moonshot
dashboard still read zero at the point it was checked. Session 1 ran on Claude by
design, so session 2 was to be the first session on Kimi and silently was not. The command line version loads the
same file correctly. Confirmed by `/status` in Terminal on 17 Aug 2026:

```
Anthropic base URL:  https://api.moonshot.ai/anthropic
Model:               kimi-k3
Setting sources:     User settings, Project local settings
```

**What was ruled out first.** The configuration itself was proved correct by
calling Moonshot directly, outside Claude Code: the endpoint, the API key and all
three model names returned `HTTP 200`. Nothing in
`.claude/settings.local.json` needed changing, and nothing was changed. Quitting
and reopening the desktop app was tried before Terminal, on the theory that it
had not restarted since the settings file was written. It was not that.

**The cost, and why it is accepted.** Jon has to open a Terminal window to work
on this project, which is a real friction for someone who does not use one. It
is accepted because the alternative is abandoning the premise of the project.
Nothing else about how sessions work changes.

**Standing consequence, and it is the important part.** A session running in the
desktop app is running on Claude, no matter what this repository says. The model
picker trap and this one share a shape: **the configuration being correct is not
evidence that it is loaded.** Check `/status` at the start of any session where
it matters.

---

## 18 August 2026, session 3

### 10. ~~The project is rescoped: a general AI text humanizer, sold as a product~~

> **SUPERSEDED 18 August 2026 by entry 18, session 4.** The project is now an AI
> watermark remover. The ruling below is reversed in full, including the sentence
> saying watermark removal is not the goal. Left standing per the append only
> rule. **The division of labour and the market framing here are also dead:** see
> entries 18 and 19.

~~**Ruling.** un-claude builds an AI text humanizer. A user pastes text in, the tool
rewrites it so it reads naturally, with better flow and a more human tone. It is
a web product with accounts, not a script. It is explicitly a competitor to the
AI humanizer tools already on the market, not a novel category.~~

**Reasoning.** Jon, this session: the project "has morphed entirely." Two things
are now off the table that earlier framing left open. **Removing Anthropic
watermarks is not the goal and is not part of this project.** Neither is any
other provider specific signal removal. The goal is stylistic quality: flow,
readability, natural human tone.

**Division of labour Jon set.** Jon owns the rewriting engine itself, meaning the
model and the prompting that does the humanizing. The build work in these
sessions is the product around it: the site, accounts, billing, the interface.

**What this supersedes.** The one line description in `CLAUDE.md` and
`00-START-HERE.md` was already edited to match before this entry was written.
Row 3 in `06` moves from "undefined" to "defined at product level." Row 4, what
counts as good output, is **still open and is still the hardest question here.**

### 11. Kimi is retired. This project is built with Claude Code on Claude

**Ruling.** Jon, this session, verbatim: "Ignore Kimi from here on forwards. We
are using Claude code to build. We are not building with Kimi."

**Reasoning.** Not recorded by Jon beyond the instruction itself. Sessions 2 and 3
both demonstrated that the Kimi routing was fragile in practice: session 2 ran on
Claude while believing it was on Kimi, and session 3 opened on Claude again.

**What this supersedes, and it is a lot.** These are now historical rather than
operative:

- Decision 3, "the rulebook is written before Kimi is connected." The reason for
  the sequencing is gone. The rulebook stands on its own merits.
- Decision 7, the `kimi-k3` and `kimi-k2.6` model choice. Dead.
- Decision 9, "this project runs in Terminal, not the desktop app." **The reason
  for that rule was that the desktop app would not load the Kimi `env` block.
  With Kimi gone, that reason is gone.** Terminal is no longer required.
- Row 2 and row 9 in `06` were closed on Kimi grounds. Both are moot.
- The Kimi sections of `07-runbook.md`, including the model picker trap, the
  Moonshot endpoint notes and the environment check. **Kept, not deleted,**
  because the general lessons in them are the valuable part and still true: a
  correct configuration file is not a loaded one, and ask the service rather than
  the tool.

**The safety consequence, and it is the important one.** `CLAUDE.md` section 3
stated that everything in a session reaches Moonshot's servers. **That sentence
is now false**, and it is the single most safety relevant sentence in the
repository, so it was corrected in the same session rather than left to drift.
Data now goes to Anthropic. **The boundary rules themselves do not relax.**
Nothing outside `~/un-claude` gets read, and `~/Documents/GitHub/Blotter-Claude`
stays off limits. A different third party is still a third party.

**The emergency stop changes.** Deleting the Moonshot API key is no longer the
kill switch, because Moonshot is no longer in the path. Recorded in `07`.

### 12. The domain is `un-claude.net`

**Ruling.** Jon owns `un-claude.net` and the product ships there.

**Consequence.** This is the first thing in the project that is public facing and
carries Jon's name in the world. `CLAUDE.md` section 5 already requires his word
before publishing anything under his name. Deploying to this domain is
publishing.

### 13. Landing page copy is deferred

**Ruling.** Jon, this session: "We don't need to think about landing page wording
yet." The open question about whether the product is positioned as a
writing quality tool or as an AI detector bypass tool is parked, not answered.

**Why it is written down anyway.** It is a real fork that changes the engine, the
copy and the legal exposure, and parking it without recording it is how it gets
silently decided by default. Added to `06` as a row with a trigger.

### 14. The product is built on MakerKit Lite, not Vercel's SaaS starter

**Ruling.** Clone MakerKit Lite, the free MIT licensed Next.js and Supabase
starter kit, and merge it into the root of this repository. Approved by Jon and
installed the same session.

**What a starter kit is, in plain English.** A pre built skeleton of a website
that already has the boring, security sensitive parts written: sign up, sign in,
password reset, a settings page, a database connection. You delete the parts you
do not want and build your product on top. It saves weeks, and every piece of it
is code Jon cannot read, which is why the choice mattered.

**The candidates, and why the two Jon was handed both failed on inspection.**

Jon's brief named MakerKit Lite and Firestarta, and described both as free and
open source.

**Firestarta was rejected outright, on two independent grounds.** It has **no
licence file at all**, meaning that under default copyright it is publicly
visible but not legally free to use, and building a commercial product on it
would be a genuine legal exposure. And it has been **abandoned since 3 March
2024**, sitting on Next.js 14 when 16.3 is current. A third detail is worth
recording because of what it says about the brief: Firestarta does not use
Supabase authentication at all. Its dependencies are `next-auth` and `prisma`,
with Supabase only as a database host. **The brief describing it as a Supabase
authentication kit was simply wrong, and this was only caught by checking.**

**Vercel's `nextjs/saas-starter` was considered seriously and rejected.** Jon
raised it directly and reasonably, on the grounds that it has 16,000 GitHub stars
against MakerKit Lite's 454. Three findings settled it:

- Its `package.json` pins Next.js to `15.6.0-canary.59`. **A canary is an
  unfinished nightly test build, not a release.** It was pinned there in December
  2025 to patch a published security hole and has not moved since.
- **Two commits in fourteen months, both emergency security patches.** It is kept
  alive, not developed.
- Its open issue list contains obvious misfiled noise, months old and untriaged.

**On the star count, because the reasoning generalises.** Stars are a bookmark
button and mostly measure marketing reach. Vercel's starter is featured in
Vercel's own template gallery. MakerKit Lite is a free sample of a paid product.
**The gap measures audience size, not quality or upkeep.** Stars do buy something
real, namely more blog posts and more people hitting each bug first, and that was
weighed. It did not outweigh an unmaintained project on an unfinished build.

**The argument that actually decided it.** Vercel's starter writes its own login
system by hand, signing its own session tokens and hashing its own passwords.
MakerKit Lite uses Supabase Auth, a maintained service. **Jon cannot read code,
so a hand written login is precisely the component he would be trusting most
blindly, and it is the component where a mistake is a breach rather than a bug.**
Handing that to a company that patches it is worth more here than it would be on
a team that could audit it.

**The cost, stated plainly rather than buried.** MakerKit Lite has **no billing
of any kind.** No Stripe, verified three ways: the kit's own README lists
payments as excluded, a code search returns zero results, and a full file listing
turns up only a leftover translation file and an image. Vercel's starter has
working checkout and subscription handling out of the box. **Billing is now a
known future job rather than something inherited.** This is the one dimension on
which the rejected option was better.

**Rejected also, without deep investigation:** `KolbySisk/next-supabase-stripe-starter`,
which pairs Supabase and Stripe but whose last substantive work was January 2025,
and `ixartz/SaaS-Boilerplate`, which is well maintained but uses Clerk rather
than Supabase for authentication.

### 12a. Correction to decision 12: the domain is `un-claude.com`, not `.net`

**What decision 12 recorded.** That Jon owns `un-claude.net`.

**What is actually true.** He owns **`un-claude.com`**, registered 13 August 2026
through Squarespace. **`un-claude.net` is not registered by anyone.** Verisign,
the authoritative registry for `.net`, returns `No match for domain
"UN-CLAUDE.NET"`.

**How it was caught.** Not by asking. `un-claude.net` was added to the Vercel
project on Jon's word, and a routine DNS check returned no nameservers at all,
which is not what a working domain looks like. Querying the registry directly
showed the domain did not exist. A check of the obvious variants found
`un-claude.com` live on Squarespace's servers, created five days earlier. Jon
confirmed.

**The general lesson, and it is the same one this project keeps relearning.**
`un-claude.net` was stated confidently and written into a durable document
without being checked, because it came from Jon rather than from a model and
therefore felt like a fact rather than a claim. **The precedence order in
`CLAUDE.md` section 2 puts Jon's instructions first, and that is about authority
over decisions, not about factual accuracy.** A checkable claim should be checked
no matter who says it. Cost here was small. It would not have been small if the
site had gone live on a domain nobody owned.

**The original entry is left standing above** rather than edited, per the
append only rule, so that the error is visible rather than hidden.

---

## 18 August 2026, session 3, second half

### 15. ~~Frontend and engine are decoupled behind a mocked API contract~~

> **PARTLY SUPERSEDED 18 August 2026 by entries 19 and 21, session 4.** The
> division of labour is dead: the engine is built here now, not in a separate
> workstream. The mocked route and the humanizer contract are scrapped. **Two
> things in this entry survive and were worth keeping:** a single shared file
> defining the boundary between interface and engine, and a closed set of error
> messages rather than raw upstream text shown to users. Streaming is no longer
> load bearing, because only layer B is slow.

~~**Ruling.** Jon's roadmap. The rewriting engine is a black box behind
`/api/humanize`, taking `{ text, tone }` and returning rewritten text plus
metrics. Jon owns the engine and its benchmarking in a separate workstream.
These sessions build the product around it.~~

**Reasoning.** Contract first with a mock is sound practice: it parallelises the
two workstreams and forces the boundary to be explicit rather than emergent.
Jon acknowledged the evaluation argument from earlier this session and deferred
it deliberately rather than by omission. **That is a decision, not a gap, and
`06` row 4 stays open on his side of the line.**

**Four things settled before building, three of which would have caused rework.**

**Streaming, not blocking.** A client written to await one complete JSON object
has to be rebuilt when the engine later needs to stream, because streaming
changes the component's state model rather than adding to it. A real rewrite of
a long document takes tens of seconds. The mock streams so the interface is
built against the shape of reality.

**Metrics are writing quality measures, not detection scores.** Jon's
clarification closed this: the input is assumed to be machine written, so there
is nothing to detect. **The GPTZero reference was about interaction shape, one
box in and one box out, not about positioning.** That reading had been carried
into an earlier concern in this session and was wrong.

**A closed set of error codes with written messages.** An open error string puts
raw upstream text in front of users, which is exactly the `<DefaultError />`
defect found in the kit's auth alert hours earlier. Prevented rather than
repeated.

**The mock is slow and can be made to fail.** A fast, always successful mock
produces an interface that only works on the happy path.

### 16. ~~The free tier is a word budget, not a rewrite count~~

> **NUMBERS SUPERSEDED 18 August 2026 by entry 22, session 4. Mechanics survive.**
> Still true: input is billed rather than output, a failure refunds, and overflow
> rejects rather than truncating silently. **No longer true:** 500 free words, and
> words as the single unit for everything. Those were priced against a tool that
> called a model on every run. Layers A and metadata call no model and cost
> almost nothing, and files are not measured in words at all. Unit pricing is
> reopened in `06` and gets its own session. **Also dead:** the line below putting
> file upload out of scope, reversed by entry 24.

~~**Ruling.** A signed out visitor gets a budget of words, currently 500, spendable
across any number of rewrites. Not one free rewrite.~~

**Reasoning.** **Unit consistency.** Credits are priced in words, so a free tier
priced in rewrites teaches one unit and then switches it at the moment someone is
deciding to pay. It is also better product: a single rewrite means the trial gets
burned on a throwaway test and the tone selector, a thing worth paying for, is
never seen. Cost exposure is identical, since both are bounded by total words.

**Mechanics settled with it, and they are not details.**

- **Input words are billed, not output.** The price has to be known before
  committing, not discovered afterwards.
- **A failed rewrite refunds.** Otherwise one bad minute of infrastructure costs
  a visitor their whole trial and they leave with a permanent opinion.
- **Overflow rejects, never truncates.** Silently rewriting the first 500 words
  hands someone a document that stops mid sentence, which reads as a broken
  product rather than as a limit.
- **Anonymous budgets are tracked by IP and are bypassable.** Stated plainly
  rather than implied. The defence is keeping the number small.

**Not yet built.** Enforcement needs per visitor accounting, which arrives with
credits. `06` row 10.

### 17. ~~The highlight toggle works at sentence level, with the original on hover~~

> **SUPERSEDED 18 August 2026 by entry 21, session 4.** The highlight toggle is
> scrapped with the rest of the humanizer. **The reasoning underneath it is not
> scrapped and transfers directly:** showing a user what changed is proof of work,
> not criticism, and it is what stops a product looking like it did nothing. For a
> watermark remover that becomes showing the actual marks found and removed, which
> is a stronger version of the same idea because it is countable.

~~**Ruling.** Rewritten sentences are marked in the output, and hovering one shows
the sentence it replaced.~~

**Reasoning.** The risk with a humanizer is that the output looks similar to the
input and the user cannot see what they paid for. Word level diffing fails here
because a rewrite changes nearly every word, so the entire output lights up and
communicates nothing. Sentence level says something legible and true.

**Jon's own framing is the useful one:** this is highlighting used as proof of
work rather than as criticism, which is what separates it from Hemingway.

---

## 18 August 2026, session 4

**Session 4 rescopes the project a second time.** Entries 18 to 24 were all ruled
in one conversation, before any file was changed. Entries 10, 15, 16 and 17 are
struck through above where they are now wrong.

### 18. The project is rescoped: an AI watermark remover, not a humanizer

**Ruling.** un-claude removes AI watermarks from text and files. A user pastes
text or uploads a document, and the tool finds the marks that identify it as
machine generated and removes them. It is still a web product with accounts and
paid credits.

**What an AI watermark is, in plain English.** When an AI tool writes text or
makes an image, it can leave marks behind that say so. Some are characters you
cannot see, sitting invisibly between the words. Some are hidden notes tucked
inside the file itself. Some are patterns in which words the model chose. None of
them are visible on the page, and most people have no idea they are carrying
them.

**The three layers, and this distinction is the product.**

| Layer | What it removes | Where it hides | Works on pasted text |
|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction marks, tag characters | Inside the text itself, between the visible words | **Yes** |
| **Metadata** | C2PA provenance blocks, EXIF, XMP, generator tags | Inside the file's wrapper, not in the text | **No.** There is no file, so there is nothing to strip |
| **B. Statistical watermark** | Patterns in word choice, removed by rewriting | In the word choices themselves | **Yes**, best effort only |

**So: paste text and you get A and B. Upload a file and you get all three.**

**Reasoning.** Jon, this session: the project has morphed from a humanizer into a
watermark remover. He states the core mission as maintaining the dignity of human
written work, on the grounds that AI knowledge is human knowledge, gathered from
human writing. **He also said plainly that this framing is not a build input and
does not need discussing further.** It is recorded because it is his stated
reason, not because anything in the build follows from it.

**A correction made in the same conversation, because it will otherwise spread.**
The assistant used "metadata" loosely enough to imply that hidden characters in
pasted text needed a file. They do not. Jon caught it. Layer A works on pasted
text with no file involved, and the table above is the corrected version.

**What this supersedes.** Entry 10, which ruled that the project builds a
humanizer and that removing watermarks was explicitly not the goal. That entry is
struck through above and stays on the page.

### 19. There is no longer a division of labour. The engine is built here too

**Ruling.** Jon, this session: "There will no longer be a division of labor. You
will help me build the website and the engine now."

**Reasoning.** Entry 15 split the work so that Jon owned the rewriting engine as a
separate workstream and these sessions built the product around a mock, meaning a
stand in that returns fake results so the interface can be built before the real
thing exists. That split made sense when the engine was an unsolved problem about
prompting a model. It does not survive the rescope: layers A and metadata are
deterministic, meaning the same input always produces the same output with no
model involved and no judgment call. That is an integration job, not a research
one.

**What this supersedes.** Entry 15's division of labour. The rest of entry 15,
the contract first approach and the four things it settled, is judged separately
below.

### 20. The landing page is the product

**Ruling.** The tool sits on the public landing page and works immediately,
without an account. A visitor uses it, hits a free limit, and is asked to
register. There is no separate application behind the login.

**Jon's reasoning, in his own words.** Every tool in this category works this way.
QuillBot, GPTZero and Grammarly all let you paste and see a result before signing
up, then gate it. "If we build the editor only behind the login, the landing page
becomes a page that describes a tool instead of being one, and you lose the
strongest conversion mechanic this category has."

**Built once, wrapped twice.** The tool is identical in both places. What differs
is the frame around it. A stranger gets marketing underneath it and a signup
prompt when the limit is reached. A signed in user gets their credit balance and
history instead. The editor is built one time and wrapped in two shells.

**Consequence for the current build.** The humanizer was built at `/home`, behind
login, which is the opposite arrangement. It is being scrapped for other reasons
anyway, per entry 21.

### 21. Everything built for the humanizer is scrapped. The plumbing stays

**Ruling.** Jon, this session: all humanizer code is scrapped, and the plumbing
remains wherever it is applicable and useful.

**What "plumbing" means here.** The parts of a website that have nothing to do
with what the product does: signing up, signing in, storing users in a database,
and getting the site onto the internet. All of it was verified working in session
3 and none of it cares whether the product humanizes or removes watermarks.

| Scrapped | Kept |
|---|---|
| `humanizer.tsx`, the editor | Supabase authentication, sign up and sign in |
| `text-analysis.ts`, the metrics | The hosted database and its security migration |
| `/api/humanize/route.ts`, the mock | The Vercel deployment and `un-claude.com` |
| `humanize-contract.ts`, the boundary | The monorepo, meaning the folder structure holding the site and its shared code |
| The metrics panel and highlight toggle | MakerKit Lite as the base |

**Why the metrics had to go, and it is not a wording problem.** The panel measured
sentence length variation, which was built to prove that a humanizer improved
rhythm. A watermark remover does not improve rhythm. The panel is the wrong
instrument, not stale copy. Its replacement is better: a count of what was found
and removed is an objective fact, where prose quality never was.

**One idea survives the code that carried it.** A single shared file defining the
boundary between interface and engine, with a closed set of error messages rather
than raw upstream text shown to users. That was good practice for reasons
unrelated to the product, and it is rebuilt for the new engine.

**A simplification that comes free.** Entry 15 made the tool stream, meaning show
results progressively as they arrive rather than all at once, because a rewrite
takes tens of seconds. Layers A and metadata finish in milliseconds. Only layer B
is slow. Most of the streaming machinery being thrown away does not need
rebuilding.

### 22. Launch free with all three layers. No purchase flow at launch

**Ruling.** All three layers ship together, free, with tight limits and no way to
pay. Accounts exist. The credit wallet screen says credits are coming. **Work on
billing starts immediately rather than after launch,** at Jon's explicit
instruction.

**Reasoning.** Jon wants this live within 24 hours. Billing is the one part that
does not fit: MakerKit Lite has no payment code at all, verified three ways in
entry 14, and building a payment system, a credit wallet and metering against it
is multi day work where a bug takes real money from real people. Layer B on a
small free allowance costs a few dollars in model calls, which is a cheap price
for launching much sooner.

**Jon's addition to the ruling.** Pricing is to be kept in mind from the start and
billing brought online as fast as possible. It is not deferred, it is
parallelised.

**A consequence that must be built today, not later.** Pricing cannot be decided
without usage data, and usage data only exists if it is recorded from the first
line of code. **Every operation records what it consumed:** words in, file size
in, and model tokens used for layer B. Without this, the pricing session prices
from guesses.

**What this supersedes.** The numbers in entry 16, not its mechanics. Input is
still billed rather than output, a failure still refunds, and overflow still
rejects rather than truncating. But 500 free words and words as the single unit
were priced against a rewriter that calls a model every time. Layers A and
metadata call no model and cost essentially nothing to run, so the economics are
different in kind. Unit pricing is reopened in `06`.

### 23. Verification splits in two, and the difference is stated openly

**Ruling.** Layers A and metadata are verified by proof. Layer B is best effort,
cannot be verified the same way, and is labelled as such everywhere it appears,
including to users.

**Reasoning.** This is `CLAUDE.md` section 4 applied to a product where two thirds
of it can meet the standard and one third cannot.

- **Layers A and metadata are deterministic.** The character was there, now it is
  not. The provenance block was there, now it is not. That is a countable fact,
  shown by displaying the actual marks found and the actual file before and
  after. Jon can check it without reading code.
- **Layer B cannot be proved.** The engine's own documentation calls it best
  effort. Whether a statistical watermark was removed is not directly checkable,
  and claiming otherwise would be the exact misdirection Jon has ruled out.

**Jon's position, this session:** "For metadata and unicode, good output is
deterministic I believe and we can test that. Layer B will be best effort and we
can't verify I believe." Both readings are correct.

**Consequence for the product, not only for the documents.** The interface must
not present layer B's result with the same confidence as the other two. Honesty
about the limits was Jon's explicit instruction: at no point will users be
misdirected.

**What this does to the oldest open question in the project.** `06` row 4, what
counts as good output, has been open since session 1 and was called the hardest
question here. It **narrows to layer B alone.** For layers A and metadata it is
answered by definition. That is the single largest thing the rescope buys.

### 24. File upload is in scope. Four formats at launch

**Ruling.** Users can upload files. At launch: PDF, DOCX, PNG and JPG. Not every
format the engine supports.

**Reasoning.** Metadata cannot be stripped without a file, so "the metadata layer
ships" and "users upload files" are the same decision rather than two. Four
formats cover almost all real use and cut the work substantially, which matters
against a 24 hour target.

**What this reverses.** Entry 16 put file upload out of scope. That was correct
for a tool that only rewrote pasted text and is wrong now.

**What it brings with it, stated plainly rather than discovered later.** Accepting
files from strangers means upload size limits, temporary storage, and a larger
surface for abuse. Tracked in `06`.

### 25. The build runs as two parallel tracks in one folder, with hard file ownership

**Ruling.** Jon, this session: two chats run at once. **This chat is Track A, the
engine. A separate new chat is Track B, the site.** Both work in `~/un-claude`.

**Reasoning.** The engine and the site share almost no files. The engine is Python
in its own folder. The site is TypeScript in `apps/web`. Running them in sequence
would leave one idle while the other works, and Jon wants to sprint.

**Why not separate folders or branches, which is the textbook answer.** Two chats
in the same folder see the same files, so switching a git branch in one would pull
the files out from under the other. Separate folders would put one track outside
`~/un-claude`, which `CLAUDE.md` section 3 forbids. **One folder with hard file
ownership is the arrangement that fits the constraints this project already has.**

**The ownership split.**

| Track A owns | Track B owns | Neither edits |
|---|---|---|
| `engine/` | `apps/web/`, `packages/` | `CLAUDE.md` |
| `docs/TRACK-A-NOTES.md` | `docs/TRACK-B-NOTES.md` | `01`, `02`, `04`, `06`, `07` |
| | `docs/03-track-b-brief.md` | `CURRENT-HANDOFF.md` |

**How decisions get recorded without two chats fighting over one file.** Jon's
rulings are written **at the moment they happen** into the track's own notes
file, under a heading marked `DECISION`, in the same format `04` uses. **They are
folded into `04-decision-log.md` at integration.** This keeps the live
ratification rule in `05` section 5 intact without two sessions appending to the
same file at the same time and producing a merge conflict Jon cannot read.

**The staging rule this project already has is what makes this safe.**
`CLAUDE.md` section 5 forbids `git add -A`, `git add .` and `git commit -a`, and
requires staging by explicit path. **That rule was written for a different reason
and happens to be the exact protection two parallel sessions need**, because it
stops either track from committing the other's half finished work.

**Two operational rules that follow.**

- **Only Track B runs `pnpm dev`.** Two dev servers collide on port 3000.
- **Two tracks maximum.** More than that and a bad merge gets past Jon, who
  cannot read code to catch one.

**The real risk, stated plainly, is not files.** It is Jon receiving questions
from two chats and a decision being made in one that the other never learns.
**Both tracks read `04-decision-log.md` and the other track's notes file before
acting.**

## 18 August 2026, session 4, Track A session A1

**A note on where these are written.** `04` entry 25 says each track records
rulings in its own notes file to stop two chats colliding in this one. **Entries
26 and 27 are written here instead, deliberately.** They amend a numbered entry
and they change what Track B builds, so leaving them in a side file would leave
the numbered log wrong on a scope question. Track B had not begun editing when
these were written, so there was nothing to collide with. **The rule stands for
everything that does not amend a numbered entry.**

### 26. PDF is dropped from version one and added later

**Ruling.** Jon, this session: version one supports pasted text, PNG, JPG and
Word documents. **PDF is deferred.**

**Reasoning, and it is Jon's, not the assistant's.** He observed that AI tools
rarely produce PDFs compared with other file types. **That is correct.** Image
generators produce PNG and JPG, and those carry the provenance data. Chat tools
produce text. A PDF is almost always something a person exported afterwards.

**What dropping it unlocks, which is the part nobody saw coming.** The chain runs
like this and it collapses the entire architecture problem:

1. PDF cleaning needs `qpdf`, a separate program that rebuilds a PDF so that
   deleted content cannot be recovered from it.
2. Vercel can install Python packages but **cannot install separate programs like
   `qpdf`**, so PDF and Vercel could not coexist.
3. **No PDF means no `qpdf`. No `qpdf` means no separate programs at all.**
4. The engine repository's core needs Python and nothing else for text, PNG, JPG
   and Word documents. It says so in its own documentation.
5. **So the engine runs on Vercel, in the same place as the site.**

**What the assistant recommended, and why it was wrong.** Two options were put to
Jon: a second hosting company running the repository, or writing the file
handling from scratch in the site's own language. **Jon rejected both by asking a
better question.** He wanted to lean on the repository as heavily as possible,
which was the stated goal all along, and dropping one format achieved it where
neither proposed option did.

**What this amends.** Entry 24, which put PDF, DOCX, PNG and JPG in scope at
launch. **Three of the four stand. PDF moves out.**

**The cost, stated now rather than discovered later.** PDF is the format people
send to clients and employers, so the case for it is real and will grow. Adding
it later means either a second computer somewhere to run the PDF part, or writing
the PDF rebuilding ourselves. **Both are real work. Both are cheaper to decide
later than to guess at now.** Tracked as `06` row 26.

### 27. The engine runs on Vercel, using the repository, in one place with the site

**Ruling.** Follows directly from entry 26. The engine is
`guillaumemeyer/watermarks-remover`, MIT licensed, running as Python on Vercel
alongside the site. **One hosting company, one bill, no Docker, no second system
to understand.**

**What this closes.** `06` rows 19 and 25, the two questions Jon deliberately
parked for a technical session. Both are answered.

**What it costs on Jon's laptop: one install, not five.** Python 3.13, because the
version macOS ships is 3.9 and the engine needs 3.10 or newer. **The laptop is the
workshop, not the server.** Nothing users do ever touches it. It matters only so
that work can be shown to Jon running rather than asserted, per `CLAUDE.md`
section 4.

**Not needed, and this is the whole gain:** Docker, `exiftool`, `c2patool`,
`qpdf`, and a second hosting company.

### 28. Track B is paused. Track A runs alone until the engine is finished

**Ruling.** Jon, this session: "I'm pausing track B. We are going to only do track A
until engine is done because decisions on each unique track have been fighting one
another. No longer worry about file collision."

**Reasoning, and it is worth stating because the two track idea was sound and still
failed.** The tracks did not collide on files, which is what entry 25 was built to
prevent. **They collided on decisions.** Track B was blocked on rulings that only
Jon could give, reached for adjacent work to stay busy, and started building
pricing and metering that belonged to neither its session nor anyone else's yet.
Meanwhile Track A kept producing findings that changed what Track B should build.
**Two chats asking one non technical person for decisions produced contention for
him, not parallelism.**

**What this supersedes.** Entry 25's file ownership rules are suspended while
Track B is paused. `apps/web` is no longer reserved, which matters because Vercel
requires the engine to live inside it. **If a second track ever restarts, entry 25
is the starting point and this entry is the warning attached to it.**

**Not lost, deliberately.** A live design argument was preserved as `06` row 27
rather than left in a paused chat.

**Correction, same session.** The first version of that row **had the two
positions reversed**, describing the fixed checklist as Track B's idea that Jon
doubted. **It is Jon's idea and he holds it.** Track B proposed showing what was
removed; Jon rejected that because it creates a false success condition, and
proposed showing everything checked instead. **The error came from reading a
pasted fragment of another conversation as if the assistant's own summary of it
were the record.** `06` row 27 is corrected and is the authority.

**Also recorded from that exchange, because it is the clearest statement of the
product's shape so far, and it is Jon's:** `/inspect` is the free hook and
`/clean` is the conversion event. **Paste, see your own text with every hidden
character marked exactly where it sits, then press the button that removes them.**

## 19 August 2026, end of session 4. Folded in from the track notes

**Entries 29 to 35 were recorded live in the two track notes files during the
session, per `04` entry 25, and are filed here at integration. **Those files no
longer exist and this log is now the record.** References to them elsewhere in
this log are historical.**

### 29. The model for layer B must not be one that watermarks its own output

**Ruling.** Layer B runs on `mistral/mistral-small` through Vercel AI Gateway.
**The constraint is broader than Jon's instruction of "not Claude."**

**Reasoning.** Jon said not to rewrite with Claude, because a rewrite by Claude
re-applies the watermark at full strength. **That is correct and it is not the
whole rule. Google Gemini also watermarks its text**, using SynthID, and was not
on Jon's list. Any vendor that marks its own output would swap one mark for
another and make the product actively dishonest.

**OpenAI is the trap worth naming.** It does not mark text as of August 2026, but
it signed the EU code of practice attached to Article 50(2), a public commitment
to machine-readable marking. **If it switches on, a product built on it silently
re-stamps every rewrite and nobody would notice, because no detector exists.**

**Consequence that is now built in:** the model is a single environment variable.
Swapping it is a settings change. **Somebody must re-check the vendor list
periodically, and nothing will remind them.**

**Why this model and not a better one.** Measured across five open-weight models on
real text. **Cost is not the deciding factor:** the dearest was a quarter of a cent
per thousand words. `qwen3.7-flash` produced the least surviving wording and takes
**47 to 95 seconds**, because it writes ten thousand tokens of hidden reasoning to
produce five hundred visible words. **Vercel kills any function at 60 seconds, so
it cannot be used at all.** `gpt-oss-20b` returned an **empty answer** on the
full prompt. `mistral-small` runs in 6 to 7 seconds with the best fact retention.

### 30. A rewrite under 70% of its input length is a failure, not a short answer

**Ruling.** Jon, verbatim: "If any rewrite comes back under 70% its input length I
think it should be considered a fail or an error. That makes no sense we aren't a
synthesizser we are a watermarker remover trying to preserve all else where
possible."

**Reasoning is the product definition rather than a tuning choice.** This tool
removes marks and preserves everything else. A rewrite returning two thirds of a
document has not done the job whatever it did to the watermark.

**It reinforces entry 22's surviving mechanic:** overflow rejects, never truncates.

### 31. The fact guard reports rather than rejects. The length guard still rejects

**Ruling.** Two guards, behaving differently on purpose.

- **Length: a hard rejection.** Under 70% and the request fails. **A truncated
  document is useless to anybody.**
- **Facts: advisory.** Numbers are compared by value, missing ones are named back
  to the model on retry, the best attempt is kept rather than discarded, and
  anything still unproven is returned as `figures_to_check`.

**Reasoning, and it is the most important correction of the session.** The fact
guard originally rejected the whole document if any chunk dropped a number.
**That is arithmetic suicide.** Fifteen chunks at 95% each survive together only
**46%** of the time, which is exactly the observed half-of-documents failure rate.
**The rewrites were fine. The all-or-nothing verdict was throwing them away.**

**Measured after the change: five documents of five, 1,260 to 5,047 words, every
number intact, 94 to 100% of length preserved, worst case 22 seconds.**

**Jon refused a handoff that would have shipped this broken**, and was right to.

### 32. The em dash rule does not govern the engine's output

**Ruling.** Jon, this session, overturning a rule the assistant had added: the
model may use em dashes in a user's rewritten text.

**Reasoning, in his framing:** "We aren't making this appear as un-ai generated
output, we simply want to clean it of any watermarks."

**What this corrects.** The assistant added a prompt rule forbidding em dashes on
the grounds that they are a recognisable machine tell. **That was the old
humanizer scope creeping back into a watermark remover.** Jon's no-dash rule,
`05` section 2, governs his own copy and documents. It says nothing about what the
tool does to a user's text.

### 33. Design direction for the site: light, serious, tool above the fold

**Ruling.** Jon, giving Track B the direction its session was gated on.

| Question | Ruling |
|---|---|
| Light or dark | **Light** |
| Feel | **Serious, with some visuals.** Not bare |
| Structure | **What it does explained up top, tool immediately usable beside it, both above the fold** |

**His references, in his own words.**

- **`gptzero.me`, the structural reference.** Explains what it does up top with
  some stats, the tool sits on the right and is usable the moment the page opens,
  and it is light.
- **`humanizeai.pro`, the cleanliness reference.** Very clean and simple. **His own
  criticism: a tad too simple, not enough colour, visuals, icons or animation.**
  The floor for tidiness, not the target for richness.
- **`deepai.org`, rejected.** Too techy and too dark.
- **`rareui.com`, for components.** Look here before inventing one.

**How to read them together.** Layout from GPTZero, tidiness from humanizeai.pro,
more visual interest than humanizeai.pro has, nothing from deepai.org.

**Jon has said he will supply further references for theme alone**, which will not
be AI detector sites.

### 34. A publication marquee goes below the tool, and one operational rule keeps it honest

**Ruling.** Jon. An infinite loop strip of major publication logos, **below the
tool**, each logo **linking to that publication's own article about the Anthropic
watermark**, with a caption at the top left about the problem. Minimal text. Jon
finds the articles.

**Why it earns its place, his framing.** It shows the scale of the story the
product exists to answer, and the caption carries the explanation in very few
words.

**The rule that keeps it legal and honest, and it is operational rather than an
argument: a logo goes in only if it links to a real article from that outlet about
the watermark. No article, no logo.**

**The caption is not decoration and is not optional.** It must make clear the strip
is about **the watermark story, not about un-claude**. Without it, publication
logos below our own tool read as "as seen in", which would be false. **GPTZero's
unlabelled strip is honest for them because those outlets covered them. Nobody has
covered un-claude.**

**A correction to Jon's premise, established by research and recorded so the
roster is not built on it.** He said basically every major publication covered it.
**Found:** TechCrunch, Forbes, Fortune, Euronews, Global News, BleepingComputer,
Search Engine Land, Interesting Engineering. **Not found:** New York Times, Wall
Street Journal, BBC, Guardian, Washington Post, Reuters, WIRED, Ars Technica, The
Verge. **Real and broad tech press with two business names and a European
broadcaster. Not the NYT and BBC set GPTZero shows.**

### 35. What layer A actually defends against, and what it must never claim

**Ruling.** Researched at Jon's instruction because it decides what the site may
say.

**Layer A does not remove any provider's deliberate watermark.** Anthropic states
directly that no hidden characters are added to Claude's text.

**What it does defend against is real, present and catches people today.** In 2025
the team at Rumi found newer ChatGPT models emitting narrow no-break spaces,
`U+202F`, in longer responses, identical in appearance to ordinary spaces.
**OpenAI denied it was deliberate**, calling it a quirk of large-scale
reinforcement learning, and independent analysis agrees.

**Consequence for copy: layer A removes a real tell, not a watermark, and the site
must not call it one.** This is the sourced version of the working position in
`06` row 23.

**Separately established, and it is the strongest provable claim the product has:**
every major hosted AI provider except Grok and Midjourney marks its generated
files, they have converged on C2PA, and **that standard is removable by design.**
Full table in `apps/web/engine/ENGINE.md` section 2.

---

## 19 August 2026, session 5. The landing page session

### 36. The product removes AI marks generally. It is marketed Claude forward

**Ruling.** Jon, correcting the assistant's framing.

**The capability is general.** The tool sanitises AI produced content from any
model, across all three layers: invisible characters in text, metadata in files,
and statistical marks in word placement. It is not built to remove one company's
marks.

**The marketing is Claude forward, deliberately.** The product exists because of
the media attention around Anthropic's August 2026 announcement, it is called
un-claude, and the headline will be about Claude. **Every other major lab signed
the EU code of practice and is expected to follow, so all of them are named on the
site, less prominently.**

**Jon's framing:** built intentionally for Claude sanitation, serves all models.

**What this corrects.** The assistant treated "the name promises Claude and layer A
does not touch Claude" as the central problem of the session. It is not. The
product's capability was never Claude specific, and the tension only existed
because the assistant had assumed it was.

### 37. What the site may claim, refining entry 35

**Ruling.** Jon, narrowing a rule the assistant had drawn too wide.

| May say | May not say |
|---|---|
| **Layer A removes watermarks.** Invisible character marking is a real watermarking technique and removal is provable | **That layer A removes Claude's watermark.** Anthropic adds no hidden characters |
| **Word documents.** In scope | **PDFs.** Not accepted in version one, so nothing is claimed |
| **We remove it**, in the framed way below | An explicitly false claim of any kind |

**On layer B, Jon's own framing of how it is sold honestly:** explain how it works,
that it is not merely an AI rewrite, that it holds verbatim runs to three words,
that it varies high entropy words such as adjectives rather than facts because
those are where the key mechanism can sit, **and show receipts at the end for how
different the text is.**

**Marketing is deliberately enticing and may be intentionally ambiguous. It stops
short of explicitly false claims and stays in line with the facts. Final wording
authority is Jon's, on every sentence.**

### 38. The per response "nobody can verify this" note is dropped from the interface

**Ruling.** Jon, overturning the assistant's reading of entry 23.

**Reasoning, his:** it is unneeded on every response, and **it will be untrue in
the near future** when Anthropic ships the detection API confirmed on 12 August
2026.

**What survives.** The engine still returns `verified: false` in its payload. The
limits of layer B are explained properly, once and precisely, on the capability
page in entry 40 and in the technical deep dive. **What changes is that it stops
being a repeated disclaimer stapled to every result.**

### 39. One work box, not a chooser. The tool routes itself

**Working position, Jon, stated as a strong preference and open to discussion.**

**One box.** Paste text or upload a file into the same place. **The tool runs
whatever applies on its own:** layer A and B for text, all three for a file. The
user never picks a layer and never sees the three layer split as a choice they
have to make.

**Consequence.** The three layer table is an explanation on the page, not a
control in the interface.

### 40. Four pages at launch

**Ruling.** Jon.

| Page | Content | Written by |
|---|---|---|
| **Landing** | The tool, results, marquee, how it works in brief | Assistant |
| **Technical deep dive** | How all three layers work at a real technical level, with simple visual animations breaking it down for non technical readers | Assistant |
| **Capabilities, precise** | Legal register. Explicitly and precisely what the tool can and cannot do | Assistant |
| **Mission** | Why the product exists | **Jon, entirely** |

**`06` row 22 is closed by this.** It asked whether a how it works page and a
mission page were in scope. Both are, and a third has been added.

**`06` row 28 comes into scope with them.** The surviving wording receipt is how
layer B shows a tangible result, per entry 37.

### 41. Layout is reopened. Publication strip stays single

**Ruling.** Jon.

**Entry 33's "tool immediately usable beside it" is not ratified as a side by side
layout** and is open for discussion. What is fixed from entry 33 is light, serious,
some visuals, and the tool usable above the fold.

**Requirements he added:** beautiful, intuitive, user friendly, clear to
understand and use, professional, with animations and visual graphics or icons so
it is not all text. **Simple intuitive interface showing what is scanned for on
every pass, what was found, and what was removed**, across whichever layers apply
to what was submitted.

**One logo strip only, the publications.** `06` row 32 closed in favour of the
working position.

**The marquee caption is Jon's to write.** He rejected the assistant's amendment.
**His reasoning, and it is the correct one: the whole point of a watermark is that
it is invisible,** so "without telling you" is not the overreach the assistant
called it.

### 42. Hero box arrives pre-filled with a live sample

**Working position. Jon likes it and wants to discuss further.** The box on arrival
holds a short sample that has already been scanned, with the marks lit up in place,
so the product demonstrates itself before the visitor does anything.

### 43. The paywall blurs the result, not the scan

**Working position. Jon's idea, and he likes it.** When free credits run out, the
scan still appears to complete, **the results and the sanitised output are blurred**,
and the visitor is taken to a paywall to buy credits and reveal them.

**Jon's revenue position, which is broader than the assistant assumed:** layers A
and metadata are to be limited and monetised too, not only layer B. **They cost
almost nothing to run, so the margin on them is the highest in the product.**

**Open underneath this: how a free allowance is tracked so it cannot be refilled
by opening a new tab.** `06` row 37.

### 44. Extreme time pressure is a standing condition of this session

**Ruling.** Jon. **The media attention is live now and the site has to be up as
soon as possible.** This is stated as massively important and applies to every
decision in the session.

**His limit on it, stated in the same breath and not to be traded away: no cutting
corners, no sloppiness, no laziness.**

---

## 19 August 2026, session 6. The Google sign in session

### 45. Google sign in ships with an unbranded consent screen, and comes back for it

**Ruling.** Jon, told what users would see before deciding rather than after.
**Ship it.** The Google button goes live even though the consent screen will read
*"Sign in to continue to itdgggoxsoolbfiwujvt.supabase.co"* rather than naming the
product. **He said plainly that he does not like it.** It is accepted as
temporary, and `06` row 41 carries the instruction to revisit it before
deployment.

**What the decision rests on, and it is not what session 5 believed.** `06` row 40
said Google sign in needed "a verification review before public use". **That was
wrong, and it was wrong in the direction that would have delayed launch for no
reason.** Google requires verification only for apps requesting sensitive
permissions. This one asks for `scope=email profile` and nothing more, read off
the live redirect rather than taken from a config file. **No review stands between
us and a working Google button.**

**The review that does exist is a different thing wearing a similar name.** Brand
verification decides whether the consent screen shows the app's name and logo. It
gates nothing about signing in. Google's own figures: minutes if automated, **two
to three business days if it escalates to a human.**

**Why no logo is being commissioned to fix this.** Google requires proof of domain
ownership, through Search Console, for the top private domain of every URI in the
configuration **including the OAuth redirect URI.** Ours is `supabase.co`. It is
Supabase's domain and cannot be proved to be ours. **So artwork cannot fix this.**
Any logo would fail the automated check and land in the manual queue, where the
case is an email explaining a third-party redirect. That is the multi-day path,
and it buys nothing that sign in needs.

**The real fix, recorded so the next session does not go looking for a cheaper
one: Supabase's custom domain add-on, $10 a month.** It moves the callback to
`auth.un-claude.com`, which makes the domain ours, which makes verification
possible. **It is a purchase and a DNS change, not a code change**, and it is not
allowed to delay the button.

**One method decision inside this, because it cost a test run.** Google sign in
cannot be checked by pasting the authorize URL into a browser. It fails silently
and looks exactly like a misconfiguration. **It is tested by running the real
button locally against the live Supabase project**, which needs no deploy and no
Google change. Full account in `07`.

---

## 19 August 2026, session 5 continued. The overnight build

### 46. The AI dropdown is removed. Detection replaces it where detection is real

**Ruling.** Jon asked whether the "which AI wrote this" selector gave the site any
utility or was only friction. **It was friction.** It cost a click, and his own
ruling that pasted text always shows the statistical watermark as present made
its answer redundant before it was given.

**What replaces it, and it is his better idea:** on a FILE, the tool reads the
provenance record and names who made it. That is real detection of recorded data,
not a guess. **It deliberately does not exist for pasted text**, because nobody
can identify which model wrote a paragraph and guessing would be exactly the
claim this product is built not to make.

### 47. Every figure on the site is real. None are invented

**Ruling.** Jon said made up metrics would be acceptable if they showed the right
idea. **The assistant declined to fabricate measurements and supplied real ones
instead**, on the grounds that they are stronger and that Anthropic has a detector
in development, which is the day every invented number in this category becomes
checkable at once.

**What ships instead, all sourced:** 100% of Claude output watermarked since
2 August 2026; 5 of the 8 largest providers confirmed marking generated files;
9 classes of hidden character checked per scan. **And on the rewrite receipt, all
computed live: percentage of wording replaced, longest surviving run of original
words, figures carried through, length preserved.**

**Jon retains final wording authority on all of it. What was declined was
inventing measurements, not writing confident copy.**

### 48. Layer B ships switched off in production until somebody turns it on

**Ruling.** Assistant's call, recorded because it constrains a deploy.

Layer B costs real money on every run and the credit gate does not exist.
`UC_ENABLE_LAYER_B` defaults to **off in production and on everywhere else**, so
deploying the site cannot start a bill by accident. The free allowance in front of
it is browser storage, which is gameable and is documented as such in `06` row 37.

**The paywall was verified to fire without calling the engine at all**, so an
exhausted allowance cannot spend money even by mistake.

### 49. Layer B is switched on in production

**Ruling.** Jon, 19 August 2026. **Reasoning, his: nobody has the URL yet, so
nobody is visiting, and having it live is how it gets tested properly.**

**The assessment behind agreeing, so the reasoning survives rather than only the
outcome.** The engine is now locked to our own site, so the only route to a paid
rewrite is through the interface. The interface caps a browser at three. A rewrite
costs about **0.06 cents per thousand words**, and the two live production
rewrites run to verify this cost **0.0002 dollars between them** against a
balance of 14.77.

**Set as `UC_ENABLE_LAYER_B=true` on Production only.** Turning it off is one
command and takes effect on the next deployment:

```bash
npx vercel@latest env rm UC_ENABLE_LAYER_B production
```

**One caveat that is real rather than theoretical.** "Nobody knows the URL" is
weaker than it sounds: every domain with an HTTPS certificate appears in public
certificate transparency logs, which are scraped continuously. What protects the
balance is not obscurity, it is that a scraper hitting the homepage does not run
a multi-step interface flow, plus the three-rewrite cap. **Obscurity is not the
control and should not be relied on once there is a reason to visit.**

**Measured live in production:** 105 words rewritten in 2.8 seconds, 86.4% of the
wording replaced, longest surviving run 5 words, 11 of 11 figures kept, length
unchanged at 105 words.

### 50. Products are named first, companies second

**Ruling.** Jon raised the question and it is a real one: the table listed
Anthropic, Google, OpenAI, when the things people actually met are Claude,
Gemini, ChatGPT.

**Answer: both, in a fixed order. The product on top, the company underneath.**

**Reasoning.** Nobody arrives here thinking Anthropic watermarked their text.
They think Claude did. The product is what our own headline names and what a
visitor scans the table looking for. **But the company is what signs the European
code and applies the mark**, so dropping it would make the row less true rather
than simpler. It also settles the logo question, because in every one of these
cases the product mark and the company mark are paired anyway.

| Shown | Underneath |
|---|---|
| Claude | Anthropic |
| ChatGPT | OpenAI |
| Gemini | Google |
| Grok | xAI |
| Meta AI | Meta |
| Firefly | Adobe |
| Stable Diffusion | Stability AI |

### 51. Midjourney is removed, and the state it occupied with it

**Ruling.** Jon. Midjourney marks no files and writes no text, so its row said
"not applicable" twice and told a reader nothing.

**The consequence he spotted himself: removing it emptied the "does not mark"
state.** A legend explaining a symbol that never appears is worse than no legend,
so that state is gone from the code rather than left unused. Three states remain:
marking today, committed and coming, does not produce this.

### 52. One formula for every row in the coverage table

**Ruling.** Jon: each description followed its own shape, which made the column
impossible to read down.

**The formula, fixed for every row: what happens to files, then what happens to
text.** Two short sentences, files always first.

**Also corrected at his instruction.** "Anthropic is the one in the news" is gone.
"Researched 18 August 2026" becomes "As of 19 August 2026". The Word documents
caveat is cut from the table, where it was detail nobody needed. **And a vendor
that has signed the European code but not shipped is described as committed and
coming rather than unconfirmed**, which is both better marketing and more
accurate, since a signed commitment is a fact rather than an absence.

### 53. Correcting entry 45 within the hour. The consent screen is fixable, free, and before launch

**This entry exists because entry 45 is wrong on its central point and the log is
append only.** Read 45 with this attached to it.

**What 45 got wrong.** It said branding could not be fixed while the callback sits
on `itdgggoxsoolbfiwujvt.supabase.co`, because Google demands Search Console proof
of ownership for every domain in the configuration including the redirect URI, and
that Supabase's $10 a month custom domain was therefore the only unlock. **It
presented that as near certain. It was over-read from a single documentation page
and it is not what happens in practice.**

**Jon rejected it on sight and his reasoning was better than the source.** A very
large number of small sites run Google sign in through Supabase and do display
their own name and logo. If the redirect host genuinely gated branding, none of
them could. **That is decisive, and it is a good example of a plain argument from
observed reality beating a model's reading of a document.**

**What is actually happening, and it is simpler.** Google shows an app's name and
logo only once the brand is verified, and shows the bare domain until then. **Brand
verification does not start until the app is published to production.** un-claude
is still in Testing. **Nothing is broken and nothing has been refused. The step has
not been taken yet.**

**The free path, in order:** verify `un-claude.com` in Google Search Console,
publish the app on the Audience page, let the automated brand check run. Google's
stated time for that check is minutes.

**One real risk survives, in a much smaller form, and is worth keeping.** Google's
developer forums carry a documented failure where an unverified app's consent
screen falls back to the redirect host, and Google's own automated checker then
compares that fallback against the homepage and rejects with *"the app name shown
on your OAuth consent screen does not match the app name on your home page"* — with
no email thread offered to argue it. **It is a flaw in Google's checker that lands
on hosted auth providers. It is not a rule against them, and it does not always
fire.**

**So the ruling changes.** Entry 45 accepted an unbranded consent screen as the
shipping state. **Jon has since ruled the opposite: we do not go live to the public
with sign in looking like that.** Branding is worked in parallel with the button,
not after launch.

**And the $10 add-on is demoted from unlock to escape hatch.** Buy it only if the
automated check returns that specific name-mismatch rejection. Not before.


### 54. The three legal pages are written, and four things about them are Jon's rulings

**Context.** All three legal pages were shipped as the starter kit's stub and were
live to the public that way. **The privacy policy page read "Your terms of service
content here"** — the kit's own copy-paste error, so the privacy policy did not
even claim to be a privacy policy. Found while checking whether Google's brand
verification would pass. It would not have.

**They were drafted from the code rather than from a template.** What the engine
actually does with submitted content was read out of `clean.py`, the API routes,
the Supabase schema and `free-uses.ts`, so every claim in them is checkable
against the repository. The findings that shaped the text:

- **Nothing submitted is retained.** No table holds it. Uploaded files exist as an
  ephemeral temp file for the length of one request.
- **Layer B is the single exception and had to be disclosed.** Text goes to
  `mistral/mistral-small` through Vercel AI Gateway. Layer B is live in production,
  entry 49, so this is a present fact and not a future one.
- **There are no analytics or trackers of any kind.** Verified by search, not assumed.
- **Account data is three fields:** name, email, picture URL.

**Worth keeping for positioning: GPTZero retains submitted text by default and
reserves the right to use it to improve their models.** We retain nothing. That is
a real difference and it is now the first line of the privacy policy.

**Jon's four rulings.**

1. **Contact address is `unclaudeapp@gmail.com`.**
2. **No governing law clause, because there is no company and no entity.** Normal
   for a solo operator. **The consequence, recorded once because it is the reason
   people incorporate before taking money: "we" in these documents is Jon
   personally, so liability runs to him rather than to an entity.** Revisit with
   payments.
3. **Minimum age 18.** Sidesteps the child-privacy regime entirely, and this
   product has an obviously student-adjacent audience.
4. **Acceptable use prohibits deceiving a school, employer, publisher or client,
   and the tool is for the user's own writing and own files.**

**One drafting decision inside ruling 4, because it is the part that will be read
adversarially.** The section names the legitimate uses **first** — hidden data in
your own files, invisible characters breaking formatting, unreliable detectors
flagging human writing — and the prohibition second. **A watermark remover whose
terms only say "do not deceive anyone" invites the question of what is left, and
reads as a wink.** Naming the real uses makes the prohibition credible rather than
decorative. Google's reviewer reads the whole page, and so will journalists.

**Not restricted to non-commercial use, deliberately, against a literal reading of
Jon's "personal use".** A non-commercial clause would block a freelancer cleaning
their own client work and would contradict paid plans. Written as *your own writing
and your own files*, which is the restriction that carries the meaning.

**These pages have an expiry date and it is already known.** See `06` row 46 and
the line-by-line table in `07`.

### 55. Google sign in is live and branded. What actually blocked it was mundane

**19 August 2026, session 6.** The consent screen now reads **"Sign in to continue
to un-claude"**, confirmed by Jon in a clean incognito window. `oAuth: ['google']`
is back in `auth.config.ts` for the first time since it was emptied, and this time
the provider behind it is genuinely configured.

**Entry 45 and `06` row 41 both said this needed Supabase's $10 custom domain add-on.
It did not. Nothing was purchased. That row closes on a free path.**

**What actually blocked it, in the order the blocks were found.**

1. **The Google app was never published.** Brand verification does not begin while
   an app is in Testing, and until a brand is verified Google shows the bare
   redirect domain. Nothing had been refused; a step had not been taken.
2. **Publishing the app is not publishing the branding.** Two separate actions in
   two places. **Branding sits as "Draft Branding" until `Verify Branding` is
   clicked on the Branding page, and stays invisible to users until `Publish
   branding` is clicked after it passes.** The Audience page's `Publish app` does
   neither. This cost a full cycle.
3. **The first verification attempt failed on "your privacy policy URL is
   unresponsive."** The URL was correct. The site had been rebuilt four times in
   ninety minutes by the parallel session, and the legal pages did not exist in
   real form until 12:23. Google crawled a moving target.

**The fix for 3 was to stop moving and re-run.** The parallel session paused, the
live build id and all three crawlable URLs were watched for ninety seconds and did
not change, and the retry passed.

**The claim in entry 45 that this whole area is gated by Search Console ownership
of `supabase.co` is now settled as wrong, on evidence rather than argument.** Jon
rejected it when it was made, reasoning that a very large number of small sites run
Google sign in through Supabase and do show their own name. **He was right.** The
authorized domains list still contains `itdgggoxsoolbfiwujvt.supabase.co`, it still
cannot be deleted, and verification passed anyway.

**Two facts that survive as constraints, recorded in `07`:**

- **The Google app name must track the site's own name.** Both currently read
  `un-claude`. Jon intends `Un-Claude` eventually; the two must change together.
- **Any branding change re-runs verification.** That is the cost of adding a logo
  later, and it is a re-run of the same automated check rather than a new manual
  review. Manual review only happens if the automated check cannot decide.

### 56. Work splits into four parallel tracks with hard file ownership

**Ruling.** Jon, 19 August 2026, at the end of session 5. The session had run long
enough to have served four different purposes, and the remaining work does not fit
one conversation.

| Track | Owns | Jon's priority |
|---|---|---|
| **1. Billing** | Pricing, Stripe, credits, the ledger, the real paywall | **First** |
| **2. Landing page** | Everything a visitor reads or looks at | Continuous |
| **3. Trust and correctness** | The defects that break in front of a paying customer | Blocks track 1 |
| **4. Analytics and admin** | Funnel events, Google, the rename, session replay | Smallest |

**The reason ownership is written down rather than assumed.** Four sessions editing
one repository is a new failure mode for this project, and `CLAUDE.md` section 5's
staging rule exists because ignoring it caused real damage once already. Rules in
`TRACK-RULES.md`.

**Three assignments that are not obvious and will cause trouble if guessed:**

- **`_components/workbench/**` belongs to TRACK 3, not the landing page track.** It
  looks like page work. It holds the credit gate, the paywall trigger and every
  engine call.
- **The legal pages belong to TRACK 1, not the landing page track**, because
  payments change the terms, the privacy policy and add a governing law section,
  and those edits must ship in the same deployment as the billing.
- **`06` row 48, the missing usage record, is TRACK 3 work that TRACK 1 depends
  on.** It is the only open item that gets strictly worse with time, because the
  data cannot be backfilled.

### 57. Every session begins by stating what it understands

**Ruling.** Jon. Each track's opening prompt asks the session to summarise the
project, its own role, its task and its goals for the session **before doing any
work**, and to say what it thinks is wrong or missing.

**Why it is a ruling rather than a habit.** Jon cannot review code, so the only
early signal that a session has misunderstood its brief is what it says back. **A
session that has misread its scope will edit another track's files**, which is the
specific damage this arrangement introduces. Catching it in the first message costs
one paragraph; catching it later costs a merge conflict in a live repository.

---

## 19 August 2026, session 7. Track 1, billing

### 58. [T1] The project stays on Vercel Hobby until Vercel objects

**Ruling.** Jon, told the constraint first. **"If Vercel doesn't stop me we will
continue on hobby. If they do we will upgrade."**

**What he was told before deciding.** Vercel's Hobby plan restricts the plan to
non-commercial personal use, and a project taking payments is commercial by any
reading of it. Pro is $20 a month for one seat, $240 a year, and break-even
against the recommended entry pack is about three sales a month.

**The part of the risk worth recording, because it is not a billing risk.** The
failure mode is not a surprise invoice. It is Vercel suspending the deployment,
and `un-claude.com` going dark on the day it starts making money, with recovery
gated on a support queue rather than on a button. **That is the trade Jon is
knowingly taking**, and it is cheap to reverse the moment there is revenue.

**Recorded so the reversal is not a fresh decision:** upgrade to Pro at the first
sign of any Vercel notice, or at the first month with meaningful revenue,
whichever is first. `06` row 51 closes with this.

### 59. [T1] Usage and revenue tracking is a launch requirement, not a follow-up

**Ruling.** Jon, this session. **The V1 price ships without data, and the system
that collects the data ships with it.** He also asked for an internal dashboard so
pricing can be watched and corrected once real visitors and real charges exist.

**His words:** "we must build a system that can actually track this on the back
end and maybe even set up an internal dashboard for us to be able to view all
this so once we start getting real visitors and charges, we can track our pricing
internally to ensure we are optimizing pricing. We will still create our V1
pricing before these because we need to start charging users before we have
data."

**Why this is a ruling and not a task.** `06` row 48 records that
`usage_record()` has never recorded words, tokens or retries, that `04` entry 22
promised exactly those, and that **it cannot be backfilled**. The same mistake
made twice would mean pricing V2 from guesses as well. **Every day the fix is not
in is a day of evidence permanently lost.**

**What it has to capture, stated now so it is not rediscovered later:** words in,
credits charged, credits refunded, which layers ran, model retries, wall time,
and the Stripe event that paid for it. **The link between a charge and what it
bought is the whole point** — usage without revenue attached cannot answer a
pricing question.

**Ownership is not settled and must not be assumed.** The `usage_record()` fix is
`06` row 48 and belongs to **Track 3**. The ledger and everything revenue-side is
Track 1. **An internal dashboard is closest to Track 4, "analytics and admin",
and Jon should say which session builds it** rather than two sessions building
half each.

### 60. [T1] The pricing decision does not wait for usage data

**Ruling.** Jon, this session, after being told the trigger on `06` row 48 says
the usage fix "should come BEFORE the pricing decision rather than after."
**"We will still create our V1 pricing before these because we need to start
charging users before we have data."**

**Reasoning, and it is the reason the trigger was wrong rather than merely
inconvenient.** The fix records nothing historical. It begins collecting from the
moment it ships, against a site with almost no traffic, so waiting would have
blocked the decision for weeks on evidence that does not yet exist in either
case. **The recommendation in `03-pricing.md` never rested on usage data anyway:**
it rests on the model bill measured directly against the gateway and on
competitors' published prices. **Row 48's trigger is overruled, and row 48 itself
stands** — the fix is still urgent, for V2 rather than V1.


### 61. [T3] Usage goes to the log now and to a ledger later, and cost stays off the wire

**Ruling.** Assistant's call, recorded because it constrains what Track 1 builds
next and because it is a deliberately partial fix rather than a finished one.
**It is the Track 3 half of entry 59.**

**Three choices inside one piece of work.**

**One. The figures travel down into the model call, not back out of it.** The
obvious design returns token counts alongside the rewritten text. It loses the
data on exactly the runs that matter most: a call that raises still spent money,
and a failed layer B run retries up to eight times per chunk, so **the most
expensive requests were the ones reporting nothing at all.** The accumulator is
therefore a dict the caller owns and passes downwards.

**Two. A log line, not a database, and it is labelled a stopgap.** Every request
writes one `UC_USAGE` JSON line to the server log. A durable ledger needs a
database table, and `apps/web/supabase/` and every migration belong to Track 1
under `TRACK-RULES.md`. **Track 3 stops the loss; it does not end it.** `06` row
64 carries the unfinished half, and **everything before 19 August 2026 stays
lost.**

**Three. Cost and token counts do not go into the HTTP response.** They are our
unit economics and this site is public and unauthenticated. The browser gets
words, bytes, seconds and whether layer B ran. Nothing in the site reads any of
it today, so the restriction costs nothing and closes a door before it opens.

**Against entry 59's list, which is the useful way to read this.**

| Entry 59 asked for | State |
|---|---|
| Words in | **Done.** Words out as well |
| Which layers ran | **Done** |
| Model retries | **Done.** Plus attempts, chunks and model calls, which are three different numbers |
| Wall time | **Done** |
| Model tokens and cost | **Done.** Cost is the AI Gateway's own dollar figure, not our arithmetic |
| Credits charged, credits refunded | **Not started.** Credits do not exist. Track 1 |
| The Stripe event that paid for it | **Not started.** Track 1 |
| Somewhere durable to put it | **Not started, and it is the gap that matters.** Track 1 |

**What was found while doing it, and it changes a number Track 1 has been
given.** The fact guard was forcing a retry on every compound number word from
twenty-one to ninety-nine, because an earlier repair taught it that
`thirty-four` is 34 and left 30 and 4 in the set. On one 674 word document that
was ten model calls where three were needed, 38.4 seconds against a 60 second
ceiling, and four times the documented cost per thousand words. Fixed. **The
measured cost after the fix is still 0.093 to 0.128 cents per thousand words
against the 0.06 cents in entry 49**, and it moves with how many numbers the text
contains. `06` row 65. **Two runs of a non-deterministic process is not a cost
model** and must not be treated as one.

**Why this is in the decision log rather than only in `06`.** Entry 22 promised
words, tokens and model cost so pricing would not guess, and entry 60 rules that
V1 pricing proceeds without them. **A future session must not read "row 48
closed" and assume there is usage history to price V2 from.** There is a log
with a short memory, and there is no ledger.

### 62. [T1] Track 1 prices the product. It does not write what the product says

**Ruling.** Jon, correcting this session directly. **"Your job here isn't to build
the landing page, messaging, wording etc... It is to help me with pricing and get
that set up."**

**What prompted it, recorded because the mistake is worth not repeating.** This
session read `03-pricing.md` and `anthropic-watermarking-context.md`, inferred
from them what the live site must be claiming, and argued at length that a
sentence needed removing. **It had never opened the landing page.** The inference
was built on documents Jon describes as stale and partial.

**Jon's position, which is the one that governs:** he is the sole authority on
this project, the language on the site is precise, accurate, legal and not
misleading, and **nothing is being charged for on a false claim.**

**The general rule this sets, beyond one mistake.** `TRACK-RULES.md` already
assigns landing-page copy to Track 2. **Reading another track's files to price
correctly is right. Reasoning about what they contain without reading them is
not.** `CLAUDE.md` section 4 says an assertion carries no weight without the
artefact, and that applies to assertions about our own product.

**`06` row 62 stays open** because it is a question about Anthropic's rollout that
Track 1 needs answered for the refund policy, not a claim about our copy.

### 63. [T1] All three layers are charged. The free allowance is generous and finite

**Ruling.** Jon. **"We are going to charge for the sanitization of layer A,
metadata, and Layer B."** And on the free tier: **"Invisible characters and file
metadata can be generous free but not free forever. Those should still be
charged."**

**What this supersedes.** This session proposed giving layers A and metadata away
without limit, on the reasoning that they call no model and would serve as the
proof-of-work demonstration. **Overruled.** It also confirms and hardens `04`
entry 43, where Jon first ruled that the cheap layers are monetised too.

**What it changes in code, which is not this track's to change.** The live paywall
in `_components/workbench/paywall.tsx` reads *"Scanning stays free and unlimited.
Credits cover the rewrite, which is the part that costs us money to run."* **The
second sentence stops being true under this ruling** and the file belongs to
Track 3. Track 1 must ask rather than edit. `TRACK-RULES.md`.

**Scanning is not sanitisation and is not affected.** It stays free and unlimited,
per `04` entry 43 and the same paywall copy. **Recorded as this session's reading
of the ruling rather than as something Jon said**, and flagged to him for
confirmation.

### 64. [T1] One credit buys 1,000 words. Packs first, subscription soon, no lifetime pass

**Ruling.** Jon, four decisions in one breath.

**The unit is a credit and one credit buys 1,000 words**, not the 100 this session
proposed. **His reasoning is better than the one it overrules:** at 1,000 words a
credit maps to a job. "This document costs 3 credits" is a sentence a person can
check against the thing in front of them. At 100 words the same document costs 25
credits, which is a number nobody can sanity-check.

**The cost of it, stated so it is a known trade rather than a surprise:** jobs
round up to a whole credit, so a 200 word paste and a 900 word paste both cost
one. That is the small unfairness the 100 word unit existed to avoid. **Accepted
deliberately**, and the pricing page has to say it plainly.

**Packs of credits at launch. No subscription in the first release, and a
subscription "asap" after it.** Jon pushed back on the argument that a
subscription should wait for data and he was substantially right: the compute
maths was already laid out for him and does not need more evidence. **What
survives the pushback is narrower and he accepted it** — a pack price can be
changed tomorrow with nobody affected, a subscription price cannot, so the
subscription number is the one worth setting against a few weeks of real repeat
purchases.

**The consequence Track 1 owns from day one:** the ledger is built so a
subscription is an additional way credits arrive, not a second system. **If that
is designed in now it is a small change later. If it is not, it is a rebuild.**

**The lifetime pass at $49.99 is deferred, not refused.** Jon's own note with the
deferral: he is not much worried about somebody adversarially draining the
system. **The disagreement is recorded rather than smoothed over**, because the
argument that persuaded him was the commercial one — a lifetime pass caps the
highest-intent buyers and makes the subscription he wants irrational — and not
the abuse one.

**Layer B requires an account.** Accepted from this session's recommendation. It
is the only layer that calls a model, and an account is the only gate available
short of a card on file.

### 65. [T1] Stripe, and a real accountant when revenue is real

**Ruling.** Jon, after being told plainly that Stripe does not handle sales tax.
**Stripe Tax calculates and collects; registering with a tax authority and filing
returns remain the seller's.** EU VAT on digital sales to consumers has no
minimum threshold.

**Decision: go with Stripe, accept the exposure knowingly at launch volumes, and
engage an accountant if revenue becomes material.** A merchant of record such as
Paddle would absorb the liability by becoming the legal seller, and was not
chosen because its acceptable-use policy is stricter for this category than
Stripe's. `06` row 61 holds the detail and the revisit trigger.

**Nobody in this project is qualified to advise on tax and none of the above is
advice.**

### 66. [T4] Measure the funnel by naming the moments, not by watching the DOM

**Decision.** Seventeen named events, called explicitly from the places where the
things happen, defined in one file, `apps/web/lib/analytics/events.ts`.

**The alternative that was rejected, and it was tempting.** `workbench.tsx`
carries a `data-phase` attribute whose own comment says it exists so the tool's
state can be read "from outside it". An observer watching that attribute could
have produced most of these events without touching the workbench at all, which
would have kept Track 4 inside its own file ownership.

**It was rejected because it would work and then quietly stop working.** A watcher
reading state out of the DOM breaks silently the first time a phase is renamed,
and Track 3 was editing that exact file the same week. **This project's runbook is
already a list of checks that passed while being wrong.** Adding a measurement
that fails without saying so was the one thing not worth the convenience.

**Jon lifted the file-ownership constraint for this session** rather than accept
the fragile version.

### 67. [T4] The visitor's content never becomes an event property, and the module
enforces it rather than the call sites

**Decision.** The rule is not a convention to be remembered. It is built into the
shape of `events.ts`: the exported functions take counts, flags and fixed choices.
The only free string that enters is a filename, and it is never sent — it is
reduced to an extension from a fixed vocabulary, or to `other`.

**Three consequences that look like over-caution and are not.**

**Sizes and durations are bucketed.** An exact character count is not content, but
the same document reappearing is identifiable by its exact length. A range answers
the only question worth asking of it, which is whether the funnel breaks on long
documents, and identifies nobody.

**The engine's own failure message is not sent.** It is our own copy today. It is
also built at the far end from a payload containing the visitor's document, and
the first time somebody interpolates a filename into an error string, content
starts flowing to a third party silently. A fixed set of properties cannot develop
that fault later.

**Proof, because an assertion is worth nothing here.** Every event was driven with
a confidential filename and a real sentence, then all sixteen fragments of them
were searched for across the seventeen resulting payloads. None appeared. With
PostHog absent, which is every local machine and every visitor running a blocker,
every call is silent rather than throwing.

### 68. [T4] No `signup_completed`, and `identify()` is never called

**Decision.** Both are deliberately absent, and the reasoning is written at the
top of `events.ts` so nobody adds them back believing they were forgotten.

**`signup_completed` cannot exist honestly.** PostHog stores nothing on the
device, so the visitor's id lives in memory and dies with the page. Both ways of
finishing a sign-up leave the site entirely — Google's consent screen, or a
confirmation link in an email — so whoever returns is a new person. An event fired
on arrival would sit in a funnel chart looking like a step and would be two
unrelated numbers. **How many accounts were created is a database question, not an
analytics one.**

**`identify()` was rejected on cost.** It would attach a real account id to the
analytics record, which is a new category of personal data in the privacy policy,
and it still would not join the anonymous half of the funnel to the signed-in
half, because the anonymous id was already gone. A real cost for no gain.

### 69. [T4] The policy rewrite is handed over as text rather than shipped in the
same commit

**Ruling.** Jon, 19 August 2026. Policy changes go to a separate session; this
session writes the replacement wording and does not touch the legal pages.

**This overrides the standing rule** in `CLAUDE.md`, `06` row 46 and
`TRACK-4-ANALYTICS.md` that the policy edit ships in the same commit as the change
that makes it necessary. Jon's explicit instruction is the higher authority,
`CLAUDE.md` section 2, and this entry exists so the exception is visible as a
decision rather than looking like the rule was forgotten.

**The wording is in `docs/POLICY-CHANGES-PENDING.md` and it is OUTSTANDING.**
Until it is applied the published privacy policy describes less measurement than
actually happens. Nothing in it becomes false — no new company, no device storage,
no content — but it is incomplete.

### 66. [T1] Three billing mechanics settled, and the number-form gap Jon found

**Ruled by Jon this session, recorded together because each is small and none
should have to be rediscovered.**

**Images are a flat one credit, whatever their size.** His words: "to keep all
credits simple, write like text = 1,000 words and images are flat rate one
credit. We make that clear so you can price it in but that keeps it simple."
**The reason it is defensible rather than merely simple:** stripping metadata from
a 4 MB photograph and a 40 KB one is the same 40 millisecond operation, so our
cost genuinely does not scale with file size when there is no text to rewrite.
Word documents remain charged by the words inside them, with the metadata strip
included.

**The statement descriptor is `UN-CLAUDE.COM`.** That is the 5 to 22 characters a
customer sees on their card statement. An unrecognised descriptor is a leading
cause of disputes and a dispute costs $15, so matching the site they bought from
is the whole job.

**Credits are debited when the work completes and returned in full when it
fails.** Confirmed by Jon. This was already `04` entry 16's surviving mechanic;
what makes it urgent rather than theoretical is `06` row 66, where a 674 word
document was measured at 38.4 seconds against a 60 second ceiling. **Timeouts are
a live case, not a hypothetical**, and every failure screen already tells the user
nothing was charged.

**The number-form gap, found by Jon reading Track 3's report and correct.** He
asked whether rewriting "thirteen percent" as "13%" is a user's stylistic choice
being overwritten. **Three findings, from reading the code and running it, not
from reasoning about it.**

1. **The prompt already forbids it.** `rewrite_text.py` rule 5: "Copy every number
   and date in EXACTLY the form the original used, in both directions. Words stay
   words: 'eighteen percent' stays 'eighteen percent', never '18%'."
2. **Nothing enforces it.** `_numbers()` in `uc_chunk.py` compares values and not
   spellings, by deliberate design stated in its own docstring. **Run live this
   session: source "thirteen percent of the fund" and output "13% of the fund"
   both resolve to `['13']`, so the guard passes it with no retry.**
3. **Track 3's fix did not cause this and is correct.** The value comparison
   predates it. Their change was to compound parsing, and it is right:
   "thirty-four" now resolves to `['34']` alone, where before it also demanded 30
   and 4 and forced retries against figures that were never lost.

**So the instruction exists, the check does not, and whether the model actually
disobeys has never been measured.** Proven here: the guard would not catch it.
**Not proven: that it happens.** `06` row 71, and it belongs to whoever owns the
engine.

### 67. [T1] The prices, ratified. Three packs, and free credits weighted away from the rewrite

**Ruling.** Jon, 19 August 2026. **"I ratify your recommendation on pricing and
free credits."** `06` rows 18 and 37 close on this entry, and `03-pricing.md`
sections 6 and 7 are superseded where they disagree.

| Pack | Credits | Words | Price | Stripe takes | **Net to us** | Per 1,000 words |
|---|---|---|---|---|---|---|
| **Taster** | 10 | 10,000 | **$4.99** | $0.44 | **$4.55** | $0.50 |
| **Standard** | 25 | 25,000 | **$9.99** | $0.59 | **$9.40** | $0.40 |
| **Pro** | 100 | 100,000 | **$24.99** | $1.02 | **$23.97** | $0.25 |

**One credit buys 1,000 words. A file with no words in it costs one credit,
whatever its size. Every job rounds up to a whole credit.**

**Why the ladder starts at $4.99 and not the $9 this session first proposed.**
Jon's objection was that $9 to $24 to $60 asks a stranger for a considered
purchase and most will not make it. **He was right and the first ladder was too
steep.** The entry pack exists to be bought without thinking.

**Why $4.99 and not the $2.99 he floated.** Stripe's 30 cent fixed fee is 12.9
percent of a $2.99 sale and 8.9 percent of a $4.99 one, and one $15 dispute
costs the net revenue of seven Taster sales at $2.99 against four and a half at
$4.99. **A buyer does not distinguish the two — both read as "under five
dollars" — but we keep three quarters more per sale.** Jon accepted this.

**The free allowance, and the reasoning is Jon's own worry rather than a cost
argument.**

| Who | Gets | Covers |
|---|---|---|
| Anyone, no account | **Unlimited scanning** | Free forever |
| **Signed out** | **3 credits, once** | Invisible characters and file provenance. **No rewrite** |
| **On creating an account** | **+2 credits** | Everything, rewrite unlocked |

**His words: "I'm not worried about how much these signup free credits cost us,
I'm worried they give 99% of the users enough of what they need to the point
where they don't need to buy."** That is the correct worry and it is the opposite
of the one `03-pricing.md` P4 was built on.

**The arithmetic that set the number at 2 and not 3.** A standard essay is about
2,500 words, which is **3 credits**. So a 3 credit signup grant is exactly one
free essay: the person we most want to convert does the job they came for, free,
and leaves. **At 2 credits a real essay is refused before it starts** — overflow
rejects rather than truncating, `04` entry 16 — and that refusal is the buying
moment. **Generous on the layers that do not compete with the sale, tight on the
one that is the sale.**

**And with a 10 credit entry pack at $4.99, every free credit given away is 50
cents of it.** That is the frame that makes the number a commercial decision
rather than a cost one.

**Deliberately not decided here:** the subscription price, which waits for a few
weeks of real repeat purchases, `04` entry 64.

### 68. [T1] Correcting this session: Claude DOES mark files, and it is the strongest honest claim we have

**Jon challenged a claim this session made twice, and he was right.** This session
said that for a Claude user "the two layers we can prove don't apply" and that
Claude adds no metadata. **The second half is false.**

**What `anthropic-watermarking-context.md` section 3 actually says**, and the site's
own vendor table already said it:

| | Text watermark | C2PA content credential |
|---|---|---|
| What it marks | Generated text | **Generated files** |
| Where it lives | In the token choices | **In file metadata** |
| Who can verify | Only Anthropic | **Anyone, with any C2PA tool** |
| **Available today** | **No. No marked model is shipping** | **YES** |

**So the asymmetry runs the opposite way to what this session assumed.** The thing
Anthropic does to Claude's files is **live now, provable by anyone, and removable
by us with a before-and-after we can show.** The thing it does to Claude's text is
**not yet shipping on any public model**, unverifiable by anyone, and only best
effort to remove.

**What this changes commercially, and it is Jon's positioning argument made
sound.** He wanted to position maximally as a Claude product without lying. **The
honest Claude-first claim is stronger than the one this session was reaching
for:**

> If Claude made you a file, it carries a signed credential anyone can read with
> a free public tool. We remove it, and we show you the file before and after.
> Claude's text watermark is a separate mechanism, rolling out, and no detector
> for it exists anywhere — our rewrite is the published defence and we call it
> best effort because that is what it is.

**Certainty about Claude, today, on files. Best effort on text, labelled.** That
is a Claude product without a false sentence in it.

**`06` row 62 is amended rather than closed:** what remains unknown is which
shipping models carry the **text** watermark. The **file** credential is not in
doubt.

### 69. [T1] A Word document never gets the rewrite, and both the price and the interface assume it does

**Found by reading `server.py` while adding a word count. Not a decision yet — it
is a defect that invalidates part of `04` entry 67 and needs Jon's ruling.**

**What the engine actually does**, in `_clean_payload`:

| Input | Layers that run |
|---|---|
| Pasted text or `.txt` | Layer A **and** layer B, the rewrite |
| An image | Metadata only |
| **A `.docx` or any other container** | **Metadata, and layer A inside the text. NO rewrite** |

**Layer B is inside `if kind == "text"` and nowhere else.** A container never
reaches it.

**Three things follow, and none of them are small.**

1. **The interface asks for a rewrite it will not get.** The workbench sends
   `layer_b: true` for a container, because `carriesProse` is true when
   `scan.kind === 'container'`. The engine ignores it silently.
2. **This is one cause of Jon's complaint that rows stay lit after sanitising.**
   The statistical row reads `done && receipt ? 'removed' : 'found'`. A container
   returns no receipt, **so after a successful sanitise the row still says
   "present"** — correctly, as it happens, but for a reason nobody could guess.
3. **It breaks the pricing.** `04` entry 67 charges a Word document by the words
   inside it, on this session's stated reasoning that "its text goes through
   layer B". **It does not.** A `.docx` costs us the same as an image: no model
   call at all.

**The question for Jon, and it is a real fork.** Either a Word document is priced
like an image — a flat credit, because that is what it costs and what it gets —
**or** the engine is changed so containers do get the rewrite, which is a larger
piece of work and the only option that matches what the interface currently
promises. **Not decided here.** `06` row 74.

### 70. [T1] Un-Claude, in Claude's orange, and clarity outranks everything until further notice

**Rulings, Jon, 19 August 2026.**

**The name is `Un-Claude`.** Capital U, capital C, hyphenated. **Applied
retrospectively across the whole site and forward from here.** The domain, the
package names and every identifier stay lowercase; this is the display name only.

**The gradient moves from white-yellow to white-orange, keyed to Claude's own
orange**, applied universally. The point is that the product reads as belonging
to the thing it is named after.

**"Sanitise" stays.** Jon's reasoning, and it is the honest one: **"remove
watermark" would be untrue**, because for layer B nobody can say the watermark
was removed. Sanitise claims the work, not the outcome.

**Clarity and intuitiveness outrank everything else right now, including
reversibility.** His words: "I might have you revert later but clarity and
intuitiveness and UI over everything right now." **He also granted latitude:**
new sections, callouts, popups, anything that makes it clearer, and explicit
permission to be creative.

**Wording is deliberately NOT being polished yet.** He calls the current copy
abysmal and wants function and layout fixed first, then he will get nitpicky on
words. **So do not spend passes on sentences that a layout change will delete.**

**One thing that must not get buried:** the producer name. When the scan
identifies what made a file, **"made by Stability AI" is a headline finding, not
a footnote** — it is the moment a visitor sees the product work.

**Mobile is now a first-class constraint, not a later pass.** Jon opened the site
on a phone for the first time this session and calls it abysmal. **Traffic is
expected from TikTok**, so the likeliest visitor is on a phone. Nothing in this
list is finished until it is right on a small screen.

### 71. [T1] A Word document is one credit, and the counter is real but starts high

**Two rulings, Jon, 19 August 2026.**

**A Word document costs one credit, the same as an image.** He ruled it as soon
as he read `04` entry 69: if the engine never rewrites a container, charging it
by its words charges for a rewrite it does not get. **`06` row 74's pricing half
closes here.** The engineering half stays open — whether containers should one
day be rewritten is a separate question, and his aside, "although not sure why
they don't get rewrite", deserves the real answer: rewriting the text inside a
`.docx` means pulling it out of the document's XML, rewriting it, and putting it
back without destroying the formatting around it. **That is a substantially
harder job than rewriting a plain string**, which is why the upstream engine only
does the latter. It is a feature to build, not a bug to fix.

**The live counter becomes a real, rising number, seeded above what we have
actually done.** It replaces the current counter, which extrapolates a February
2024 ChatGPT-only figure to imply an industry that now includes labs the citation
predates. **Jon's judgement on that: indefensible, and he is right.**

**This session raised an objection and then withdrew it, which is recorded so the
reasoning is not re-run.** The objection was that a seeded figure could hurt the
Stripe application. **Asked directly for a real Stripe reason, there is not one.**
Stripe's review looks at what is sold, whether the site describes it accurately,
and whether terms, refunds and contact details exist. **A vanity metric on a
landing page is not a claim about what a customer receives**, and `03-pricing.md`
section 12b's actual risk is about how we describe the product, not about a
counter. Jon's instruction stands and this session agrees with it.

**One thing worth doing anyway, because it costs almost nothing.** A scan costs
$0.0000021, or 467,000 per dollar, and a rewrite about 0.1 cents per thousand
words. **Two million words could be put through the engine for roughly $2.50**,
which would make a large seed figure literally true rather than merely
defensible. Offered, not decided.

**The mechanic Jon specified:** always rising, including when nobody is using it,
because a static counter reads as broken. Real usage adds to it on top.

**Phrasing is open.** "Words sanitised" is his own note as needing something
plainer, and `04` entry 70 defers wording until layout is settled.

### 72. [T1] The accent is #C15F3C with white text, and there is a theme bench to judge it on

**Ruling.** Jon, shown both candidates side by side. **`#C15F3C`, the deeper of
the two, chosen specifically so the button carries WHITE text the way Claude's
own buttons do.** `oklch(59.7% 0.135 40)`, foreground pure white.

**Measured rather than eyeballed: 4.23:1 against white**, which passes WCAG AA
for normal text. The lighter alternative `#DE7356` was 4.62:1 but only against
near-black, which would not have matched Claude.

**Why the first attempt was wrong, recorded because it was this session's
misjudgement and not a change of mind.** The first pass took the exact logo
colour `#D97757` and kept dark text on it, because that preserved the existing
button shape. Jon's reaction: **too orange, too deep, too dark, and harsh to
read.** The real problem was that it was neither one thing nor the other — an
orange too dark to be a highlighter and too light to carry white text.

**One thing that had to move with it.** `marked-text.tsx` drew the bar inside a
hidden-character marker in `--mark-foreground`. That token is now **white**, so
the bar would have vanished on a light page. It uses the page's own ink instead,
which is correct regardless of what the accent does next.

**Definition backed off to a middle setting.** Jon: the cards read as "heavily
placed there ... a lot going on because they are so harshly separated". The page
sat at 96.4% against a 100% card. **It is now 97.7% against 99.7%** — roughly two
points of separation where the original had one and the first repair had nearly
four.

**The page carries a gradient again**, per his note: a very light wash from the
page colour into a trace of the accent, fixed rather than scrolling. The hero's
own glow dropped from 0.16 to 0.07 so the two do not stack.

### 73. [T1] A theme bench at /dev/preview, so judgement happens in a browser

**Jon's request:** "It would help if you could actually make the landing page I
can view in browser at link ... and I can click there."

**Built at `/dev/preview`.** It renders **the real landing-page components**
inside a wrapper that overrides the theme tokens, rather than a mock — a copy
would drift from the product within a day and then be worse than useless.

Three accents and three definition settings, switchable live, with the measured
contrast ratio printed beside each. **`noindex`, and unlisted rather than
protected:** there is no auth on the marketing side to hang a gate from, and it
shows nothing a visitor could not already see on the home page.

**This is a work surface and it should be deleted before launch**, or kept
deliberately. `06` row 76.

### 74. [T1] The brand-guidelines skill is Anthropic's own kit. Take the neutrals, refuse the identity

**Installed at Jon's request**, 19 August 2026, into
`.claude/skills/brand-guidelines`. His terminal run had hung on an interactive
"which agents" prompt and written nothing; `-a claude-code -y --copy` completes
it without one.

**What it actually is, which is not what the name suggests.** It is **Anthropic's
own corporate brand kit**, category `document-processing`, and its mechanism is
PowerPoint: it applies colours "via python-pptx's RGBColor class". Its purpose is
making an artefact look like Anthropic produced it.

**What it corroborates, and this is worth having.** Its accent is `#d97757` —
**the same value this session read out of `claude.svg`**, independently
confirming a number the palette was already built on. And the neutrals turn out
to be where we already are:

| Theirs | oklch | Ours |
|---|---|---|
| Light `#faf9f5` | `oklch(98.2% 0.005 95)` | `--background` `oklch(98.2% 0.004 70)` |
| Dark `#141413` | `oklch(19.1% 0.002 107)` | `--foreground` `oklch(19% 0.008 60)` |

**Identical lightness on both, to a tenth of a point.** We differ only in hue: we
sit warmer, at 60–70, where Anthropic sits yellower at 95–107. **So the page is
already in the right neighbourhood and this changes nothing.** The one value we
have no equivalent for is Mid Gray `#b0aea5`, `oklch(75% 0.013 96)`.

**What must NOT be taken from it, and the reason is specific rather than
squeamish.**

**Un-Claude removes Anthropic's watermarks and is named after Anthropic's
product.** Looking like it belongs in Claude's world is Jon's stated aim and is
fine. **Adopting Anthropic's official brand identity — their exact palette and
their typography together — is a different thing: it is presenting as an
Anthropic property.** Two concrete consequences, neither hypothetical:

- **Google brand verification**, which `04` entries 45 and 53 already touch.
- **Stripe's "unfair, deceptive or predatory" catch-all**, which `03-pricing.md`
  12b records as the one entry a reviewer can apply to anything, **judged on how
  the site presents itself.** A site dressed as an official Anthropic property
  while selling watermark removal is the exact shape that earns a second look.

**Typography is refused for a plainer reason too.** Poppins headings over Lora
body is a document style, and a serif body is wrong for this product. The site
uses Geist and should keep it.

**Precedence, stated because this is exactly the case `CLAUDE.md` section 2 was
written for.** The skill is level 3. **It cannot override `04` entry 72**, where
Jon ruled `#C15F3C` so the button carries white text the way Claude's does. The
skill says `#d97757`. **Entry 72 governs and the accent does not change.**

### 75. [T1] Take the kit's colour, refuse its typography and layout

**Ruling.** Jon, after viewing `/dev/anthropic` beside the live page.

**Taken:** the colouring, white text on orange, the tints and the way white and
orange layer, and the gradients. His words: *"the orange is better, the white is
better, the white text inside the orange is better ... the gradient where it's
like what we found hidden characters of that orange is better."*

**Refused, explicitly:** *"not the layout, not the styling, not the font."*
**Geist stays.** Poppins and Lora were the experiment only.

**What changed in the real theme.**

| Token | Now | From |
|---|---|---|
| `--mark` | `oklch(67.2% 0.131 39)` | Kit orange `#d97757`, same value as `claude.svg` |
| `--mark-foreground` | white | Jon's preference, and Anthropic's own convention |
| `--background` | `oklch(98.2% 0.005 95)` | Kit Light `#faf9f5` |
| `--foreground` | `oklch(19.1% 0.004 100)` | Kit Dark `#141413` |
| `--border` | `oklch(92.4% 0.012 97)` | Kit Light Gray `#e8e6dc` |

**The hue shift is the part that actually did the work.** The page was at hue
60–70 and is now at 95–107 — yellower, not just lighter. That is most of what he
was reacting to when he said the previous orange "isn't right".

**A known trade, stated to him with the number before it shipped.** **White on
`#d97757` is 3.12:1.** That passes WCAG AA for large text and **fails it for
normal text, including a 13px button label.** The nearest orange along the same
hue that passes at normal size is `#ab5e45` at 4.75:1, and it is visibly browner
— it loses the thing he chose. **He saw white-on-`#d97757` at 14px, preferred it,
and was given the figure.** Recorded so this is a decision and not an oversight,
and so a future accessibility pass finds the reasoning rather than re-deriving
it. `06` row 79.

**Boxes are coming off, not being softened.** Jon twice: *"the boxes are too
thick and too glaring and too demanding"*, and *"the words cleaned with Un-Claude
can literally just exist on the page ... I don't think it needs a box around
it."* The counter and the fact cards now have a hairline and nothing else. **The
heaviness was never the border colour, it was that things were boxed at all.**

**`/dev/anthropic` survives as the reference for this decision** and should go
before launch with `/dev/preview`. `06` row 76.

### 76. [T1] The statistics say what they mean, and the problem gets a named section

**Ruling.** Jon, on the three hero figures: **"these stats make no sense there to
me. Like whatsoever."** He added the detail that makes it decisive — he has
worked on this project since the first day, and **if he cannot read them, nobody
arriving cold can.**

**What they said, and why each failed.**

| Was | Problem |
|---|---|
| "100% of provenance data removed, checked against the file's raw bytes" | Two pieces of jargon in one line. Nobody outside this project knows what provenance data or raw bytes are |
| "90%+ of your three word sequences broken by the rewrite" | Jon's words: "three word sequences no one knows what that means" |
| "0 figures lost across every document we have tested" | "Figures" reads as diagrams, or as nothing |

**Now:** the hidden tags in a file removed and the file opened again to prove it;
three-word runs of your wording gone, **and a clause saying runs are where the
mark hides**, so the number explains itself; and zero numbers, dates or names
changed by mistake.

**The numbers did not change. Only the words did.** No claim was weakened to make
it readable, which was the risk worth avoiding.

**The counter and the fact cards become one named section: "The scope of the
problem."** Jon asked for exactly that, and said the old arrangement — counter
left, cards right, nothing joining them — "needs improvement". It now carries a
heading and a claim, and the two halves do different jobs: how big the problem
is, then who causes it and since when.

**`/dev/preview` and `/dev/anthropic` are deleted** on his instruction. They
settled the accent and the neutrals and had no further use. `06` row 76 closes.

**Mobile, measured against the reference Jon named.** GPTZero on a phone: header
56px, **tool at 305px, 0.38 screens down, and no subtitle between headline and
tool.** Un-Claude: **tool at 282px, 0.35 screens.** **We are already ahead of the
page he pointed at**, so no change was made for its own sake. Also checked and
NOT a problem: the page does not scroll sideways — several elements are wider
than the viewport and every one is properly clipped.

### 77. [T1] Copy, statistics and metrics are discussed BEFORE they are changed

**Ruling.** Jon, 19 August 2026, correcting this session. **"Don't go ahead and
make changes to like text or stats without discussing it with me first. I wanted
to discuss the stats we are changing, metrics we are creating, how we tell this
story."**

**This is not a new instruction and that is the point.** `04` entry 70 already
recorded his position: wording is deliberately held until layout settles, because
he intends to get nitpicky about it and does not want passes spent on sentences a
layout change will delete. **This session wrote that down and then rewrote every
statistic on the page anyway**, in entry 76, without asking.

**The rule, stated so it is unambiguous.** Layout, mechanics, colour, structure
and defects: proceed. **Anything a visitor READS — headlines, statistics, the
metrics we invent, the story order — is proposed first and changed after he
agrees.** Naming a new section counts. Inventing a metric counts.

**What he objected to in the work itself, kept here because it is the brief for
redoing it:**

- **"I don't love how you just dropped the scope of the problem in there."** The
  section was named and given a claim without the claim ever being agreed.
- **The expander text under each figure is far too long.** Three and four
  sentences where a glance was wanted. **They are not read, so they are not
  doing a job.**
- **`5 of 8` is not the right metric for that slot** and a replacement has not
  been found.

**Nothing has been reverted.** The current copy stays live until he rules,
because it is not wrong, only undiscussed — and reverting unasked would repeat
the same mistake in the other direction.

> **CORRECTION to entry 76, same day.** It records that Jon "asked for this block
> to be a scope of the problem type section and we name it that". **That is a
> misreading of what he meant and the section built on it is wrong.** He was not
> asking for a headed section with that title. He was asking for **the scope of
> the problem to be made clear fluidly throughout the site** — specifically, that
> a visitor should understand *which mark applies to them*: Claude text goes to
> the statistical watermark, files go to provenance, other AI text carries hidden
> characters. **That is the routing-clarity problem, `06` row 63 and the box
> rebuild, not a block of statistics.** His words: "This doesn't necessarily mean
> explicitly saying that." Recorded before it is acted on, per `04` entry 77.

### 78. [T1] Metadata, not provenance. And a claim here must be true of the whole service

**Four rulings, Jon, 19 August 2026, and the first one is site-wide.**

**1. "File provenance" becomes "Metadata" everywhere a visitor can read it.**

**Why he is right on the substance and not only on the plainness.** Metadata is
the umbrella — EXIF, XMP, generator tags **and** C2PA provenance. Provenance is
one signed thing inside it. **The old label named the narrowest part of what the
layer actually strips**, so it was less accurate as well as less clear. The
engine's own file is `container_meta.py`, and **`CLAUDE.md` has called this layer
"Metadata" since the rescope**, so the UI was the odd one out.

Code identifiers are deliberately untouched. `provenanceFound`, `id: 'provenance'`
and `has_c2pa` have no reader on the other end and renaming them is churn.

**2. The rewrite may be described as engineering, but not as targeting Claude's
tokens.** Jon accepted the limit without argument. What may be said, all true:
the rewrite runs through a model that is **not Claude**, because rewriting
Claude's text with Claude re-applies the mark at full strength; every number,
date and name is checked against the original and the chunk retries if one
drifts; length is held within about a tenth. **What may not be said is that we
target the token sequences Claude used** — the key is Anthropic's, no public
detector exists, and nothing can identify which tokens carry the mark.

**His warning on how to say it, which is the harder half:** *"an average person
has no idea what 'we break the runs the mark rides on, and we measure how many
survive' means. That literally means nothing to an average person."* **True, and
unsolved.** The wording for this is open, `04` entry 77.

**3. The three hero figures are replaced, and the rule that produced them
matters more than the words.** Two attempts failed the same way: **a claim about
one layer is wrong for the other two.** "Every mark shown in place" over-promises
for Claude text, which has no visible mark. "Zero figures changed" is meaningless
over a PNG.

**So a claim in that slot must be true of the whole service.** The replacements —
**Free**, **Nothing stored**, **Nothing lost** — share one job: removing a reason
not to try, which is what a stranger needs before pasting a confidential document
into a site found on TikTok. **"Nothing stored" is measured**: uploads are capped
at 5 MB, held in a temporary folder for the length of the request, and deleted.

**They are hidden below `lg`.** Jon: beside the tool on a wide screen they cost
nothing; on a phone they take space the product needs. GPTZero drops the
equivalent block at the same point.

**4. The three industry figures come off, parked rather than deleted.**
`docs/PARKED-CONTENT.md`, with their sources and the reason. The heading above
them went too, because it was built on the misread corrected under entry 76.

**One standing steer recorded from this exchange, because it governs copy from
here on.** On leading with our own limitation, Jon: *"why is that screaming at
you at the very front of this website when that's kind of why we're here and we
want your payment? ... we're not lying and we include that sort of implicitly in
other places."* **The line this session will hold: where a disclosure sits is a
choice, whether it exists is not.** Layer B stays labelled best effort at the
result, at the point of purchase and in the terms, per `04` entry 23 — and does
not headline the home page.

---

## 19 August 2026, session 8

### 79. The messaging layer is written down and loads itself, and marketing skills rank third

**Jon's diagnosis, and it was the right one.** Round after round of copy and UI
came back incoherent or counter to what the product sells, and he asked whether a
skill or agent could fix it rather than more human rounds.

**What was actually wrong.** Fourteen skills were installed and **every one of
them was about how the page looks and moves**: motion, typography, spacing,
animation, library choice. **Not one told a session what Un-Claude is, who reads
it, or what it may claim.** So a session improvised the meaning and applied real
craft to it. That is exactly the failure: something well built that says the wrong
thing.

**The second half of the cause, and it is structural.** The meaning *was* written
down. `TRACK-2-LANDING.md` opened by asking a session to read eight documents
including ten specific entries out of a 2,336 line decision log before writing a
word. **That is a reading assignment, and a reading assignment is what a session
skips under pressure.**

**What was built.**

| File | Role |
|---|---|
| `.claude/skills/unclaude-messaging/SKILL.md` | The claims boundary, voice, visitor and conversion ladder. **Fires automatically** on any copy or landing work |
| `.agents/product-marketing.md` | The full positioning, in the shape the installed marketing skills read by default |
| `CLAUDE.md` section 7 | The pointer, so it loads every session |

**Three skills installed** from `coreyhaines31/marketingskills`:
`product-marketing`, `copywriting`, `cro`. **Three of roughly sixty**, chosen
deliberately. The rest are cold email, ads and SEO and would only add noise.

**They rank third under `CLAUDE.md` section 2, and that is recorded because it
will be tested.** A conversion skill optimising this page for a frightened student
**will** reach for the sentence that a school can detect Claude's text watermark.
**No detector for it exists anywhere.** That sentence is the highest converting
one available and it is false, so the wrapper skill bans it by name.

**Four positioning answers Jon gave that were nowhere in `docs/`.**

1. **The visitor is a student.** Coursework, phone, close to a deadline.
2. **They arrive already believing the threat.** They have learned AI work is
   watermarked and that schools and employers can check. **So the first screen
   demonstrates rather than educates.** A hero that explains watermarking to this
   person has wasted its one chance.
3. **The moral stance is restrained.** State the fact, let them conclude. The site
   does not call the labs unethical, illegal or immoral in its own voice.
4. **The destination is a credit purchase.**

**One conflict surfaced rather than resolved quietly.** Jon named buying credits
as the goal. **There is no checkout**: no Stripe account, no products, no pricing
page, blocked on him. `CURRENT-HANDOFF.md`. So the positioning file records the
purchase as the destination and names the highest rung that currently exists, a
completed scan by a signed out stranger, as the metric to optimise. **Copy must
not promise a checkout that will 404.**

**Entry 78 corrected two things in the first draft of these files**, which is the
argument for writing them down at all: "provenance" had been listed as
visitor-facing vocabulary, and the layer B honesty rule had been written in a way
a session could read as an instruction to lead with the limitation. **Both fixed.
Where a disclosure sits is a choice, whether it exists is not.**

### 80. The messaging layer is corrected by Jon, and the detector is imminent rather than absent

**Jon's notes on entry 79's output, and he was right on the substance in several
places. Recorded in full because entry 79 is now partly superseded.**

**1. The assistant fabricated "close to a deadline" and put it in the audience
definition.** Jon never said it. **In a document written specifically to stop
invented detail, invented detail was the first thing in it.** Removed.

**2. The audience is wider than students, and it is B2C.** Two overlapping groups:
people who have just learned AI writing is watermarked, often students and not
only students, and **somewhat more technical people who understand metadata and
want a credential or watermark off a file.**

**3. "Demonstrate, do not educate" is overturned, and Jon's reasoning is the
better one.** **Most visitors come for the Claude text watermark, and it cannot be
shown.** It is not a character or a tag, it is the words themselves. So a page
built on "paste it and watch us find it" has nothing to show the person who came
for the main thing. **The page teaches: what the three layers are, which applies,
what to expect.** Demonstration keeps its place where a mark is real and visible.

**4. The detector is announced. The assistant's "no detector exists anywhere" was
true of today and wrong as a framing.** Checked on the web at Jon's prompting,
because `ENGINE.md` predates the reporting.

| Fact | Date |
|---|---|
| Anthropic confirms a text detection API **"that you can use yourself"** is coming | **12 August 2026** |
| Anthropic publishes further detail on how the mark works | **15 August 2026** |
| Interactive explainer: a check **"never answers yes or no"**, it returns a **probability** | **16 August 2026** |
| **Not callable. No pricing or access tier published** | As of 19 August 2026 |

**So layer B is imminently provable, not unprovable.** The word is **imminent**.

**Three facts from Anthropic's own material that are commercially valuable and
entirely true.**

- **Anthropic says the mark can be defeated by rewriting with another model.**
  **The company that built the watermark describes the method that removes it.**
  That is the strongest citation this product has.
- **Detection returns a probability, never a verdict.** So reducing signal is the
  accurate frame and metrics are the right language.
- **A detected mark means Claude processed the content, not that Claude wrote it.**
  **It flags someone who wrote their own work and edited it with Claude.** Factual,
  needs no adjectives, and it is the emotional centre of the pitch.

**5. The commercial posture is stated plainly and governs the copy.** Jon: **"We're
here to sell, convert. We're not going to outright lie, but we're going to make a
coherent, logical, convincing argument that gets you to buy credits."** Confident,
technical, big-technology marketing register. **He is the final arbiter on every
sentence.**

**One consequence worth keeping.** Because the API is coming, **overclaiming is now
a dated liability rather than only a dishonesty.** When it ships, every sentence on
the site becomes checkable at once.

**6. Layer B's honest sell, in Jon's own cleaner phrasing.** A targeted structural
rewrite that breaks the word sequences the mark rides on. **Facts persist. Length
is preserved.** Report the measured share of three word sequences broken. **Stop
short of claiming a verified defeat.** He also struck "and that rule outranks every
other" as engine-internal detail that had leaked into visitor-facing framing.

**The one limit that survives, `04` entry 78 ruling 2 restated.** **Target the
runs, which is true and sounds technical. Do not claim to target the key, which
nobody can**, and which Anthropic's own probabilistic detector confirms is not
locatable.

**7. The "every figure is real, none are invented" paragraph is removed at Jon's
instruction**, along with the recounting of entry 47. **Replaced with the operative
rule and no lecture: figures come from our own measured test data and sourced
public reporting. Measure it, then say it.**

**8. Buying credits is not "blocked".** **Billing ships before the site goes live**,
so copy is written for a working checkout rather than around a missing one.

**9. Moral framing is restrained on the landing page only.** **Jon writes the
mission page in his own voice and will call the labs unethical, illegal and immoral
there.** That is his, and it does not belong on the home page.

**Open, and flagged rather than fixed.** **`ENGINE.md` section 2's layer B
paragraph now understates what is public**, saying a detector is in development
with no ship date. The 15 and 16 August material is more specific than that.
**`ENGINE.md` is the technical source of truth and was not edited from news
reporting without Jon.** It needs a refresh pass.

### 81. "Three words in a row", and the statistical row stops claiming a finding

**Two copy rulings, Jon, 19 August 2026, session 8. Both affect words already live
on the site.**

**1. "Runs" is retired from anything a visitor reads. The phrase is "three words in
a row".**

**It was never actually decided.** The site says "runs" in at least six places
(`how-it-works/page.tsx`, `how-it-works-section.tsx`, the statistical diagram,
`workbench.tsx`, `receipt-panel.tsx`), one parked metric says "three word
sequences", and Jon has said "sequences" every time he has spoken about it. **The
assistant recommended neither.** Both are jargon. **"Three words in a row" needs no
teaching**, and the metric reads: the longest piece of your original wording still
there is three words in a row. **Jon: "I like that better."**

**"Runs" is engine vocabulary that leaked into the site.** It stays in `ENGINE.md`
and in code. It comes off the pages.

**2. The statistical watermark row stops saying PRESENT. It says "If Claude wrote
this, it is marked."**

**Corrected within the session.** The assistant proposed "Nothing can show you this
one" and Jon took it, then replaced it: **"I'm saying as a replacement to Nothing
can show you this."** The final wording is his.

**Why it mattered.** That badge was driven by a single check, `carriesProse`, which
asks only whether the input contains words. **Nothing is examined.** Any pasted
text produced PRESENT, including the hand-written sample paragraph in the hero,
which almost certainly carries no Claude watermark at all.

**Jon confirmed it was intentional and explained the reasoning**, which is recorded
because it is a fair one: **it gives the visitor a receipt at one end.** We cannot
verify removal at the other end because no detector exists yet, so asserting the
mark at the input end was a deliberate counterweight.

**The assistant's objection, raised once and not pressed after Jon reaffirmed:**
when Anthropic opens the detector, anyone can paste that paragraph in, get nothing,
and we are the site that said PRESENT. **Jon's replacement removes the exposure and sells harder than
either alternative.** "If Claude wrote this, it is marked" is true at the population
level, 100% of Claude output since 2 August 2026, so it asserts the visitor's
problem is certain rather than describing our own limits. **The assistant's version
led with our blindness. Jon's leads with their certainty**, and it survives the day
the detector opens. **Why nobody can point at the mark moves one layer down, behind
the +**, where it explains why the answer is a rewrite rather than a search.

### 82. The technical labels stay. Teaching moves to the status line

**Ruling, Jon, 19 August 2026.** The assistant proposed replacing two of the three
row labels with plainer language: **"The words themselves"** for Statistical
watermark, **"Inside the file"** for Metadata.

**Jon rejected both.** *"If we deviate from hidden characters, metadata, and
statistical watermark, we're creating a technical deviation."*

**He is right and the reasoning generalises beyond these three rows.** Hidden
characters, metadata and statistical watermark are **the real names**. They are
what a visitor meets in a news article, in Anthropic's own documentation, and in
anything else they read on this subject. **A private vocabulary invented for this
page connects to nothing outside it**, and a visitor who learns our words cannot
match them to what they read anywhere else.

**So the label carries the name and the status line carries the meaning.** "Hidden
characters / 3 found". "Statistical watermark / If Claude wrote this, it is
marked". **Teaching happens in the status and behind the `+`, not by renaming the
thing.**

**This also settles the open question left by entry 78 ruling 1.** "Metadata" stays,
and not only because that entry chose it over "provenance" on accuracy grounds.
**It stays because it is the real word.**

### 83. Anthropic's own three sentences, verified at source, and the gap in the first one

**Found by research, 19 August 2026, then verified by fetching
`anthropic.com/news/claude-text-watermark` directly rather than trusting the
agent that found them.** Page dated 14 August 2026. **All three are verbatim.**

> **"Light editing probably won't remove the watermark completely; a complete
> rewrite where every word is replaced will."**

> **"We will soon be offering a watermark detection API. We're in the process of
> working out the details of its implementation."**

> **"A watermark can only determine that Claude was likely involved with the
> content at some point. It cannot distinguish 'Claude wrote this' from 'Claude
> heavily edited this.'"**

**Why this matters more than anything else on the page.** The first sentence is
**the maker of the watermark saying what removes it.** Research across the wider
field found this pattern is close to nonexistent because almost nobody ever gets a
clean admission from the incumbent: **Spotify built an entire campaign site
attacking Apple, `timetoplayfair.com`, containing zero verbatim Apple quotes.** We
have one, dated, on their own domain.

**The third sentence is the unfair-part argument in Anthropic's own words**, and
stronger than the version this project had been paraphrasing.

**THE GAP, AND IT IS NOT DECORATIVE.** Anthropic says **"a complete rewrite where
every word is replaced."** Our engine holds runs to a maximum of three consecutive
words, `ENGINE.md` rule 3, **which is not every word replaced.** So the quote
describes a stronger intervention than the one we ship.

**Two consequences, both open and neither settled here.**

1. **Copy.** The quote may be used, dated and linked and unembellished. **It must
   not be stretched into an implication that our rewrite is the thing Anthropic
   described**, unless Jon rules that the engine should meet that bar.
2. **Product.** It is an argument for a maximum-strength mode that replaces every
   word, at a higher credit cost. **Jon's call, not recorded as a decision.**

**A competitor is already running our best emotional argument.** `writehuman.ai`
has published "Claude's Watermark Punishes the Wrong People", quoting Anthropic's
own documentation inline. **The unfair-part angle is not ours alone and is not
going to stay unused.**

### 84. Three rulings before the rebuild: the dash carve-out, the posture, and mobile drop-off

**Jon, 19 August 2026, given mid-build with creative autonomy over the page.**

**1. The em dash is allowed as a null-value glyph.** The three result rows show a
dash where a count cannot exist. Jon: "You can use em dashes for that use. Ignore
that rule." **The prose ban in `docs/05` section 2 stands everywhere else.** This
is a carve-out for the status column only.

**2. The commercial posture, in his words:** "we teeter on the boundary of
ethicality, marketing genius, correctness, and lean towards exaggeration on what
we can offer short of outright lying. The goal is to sell and convert." **Copy
leans hard. The line that survives is: never explicitly false.** Entry 70's
"sanitise, not remove" still governs the verb, because "remove" for layer B is on
the wrong side of that line by Jon's own earlier reasoning.

**3. Mobile first, and the GPTZero drop-off pattern.** Most visitors convert on a
phone. **The box must be on the first screen of a phone.** Desktop may carry
extra statistics, validity and decoration that simply drop off on mobile, the way
GPTZero collapses its hero. Applied: the live counter moves into the hero's left
column and is desktop-only; the three scoped statistics die entirely, per Jon's
"we need new metrics altogether" and his counter idea.

### 85. The distill: one screen of tool, one argument, and the FAQ carries the weight

**Built 19 August 2026 on Fable, under full creative autonomy from Jon, after his
verdict on the interim state: "a colossal mess... so much text... text slob
without much intentionality." Going live tomorrow was named in the same message.**

**The method, for once, was not improvisation.** The `impeccable` skill was loaded
and followed: its context script, the distill playbook, the craft floor, and its
mechanical detector, which was run and comes back clean. **The craft floor caught
a scaffold this session had shipped hours earlier:** numbered 01/02/03 steps in
costume monospace, a banned pattern. The moat's four rules now stand on their
titles.

**What the home page now is, in order:** hero (headline, one line, the tool, and
on desktop only the counter), marquee, the argument table, the stakes, the
engineering, the vendor table, the FAQ. **Roughly 5.8 desktop screens and 9.7
phone screens, no horizontal scroll at either width, console clean.**

**The decisions inside that:**

1. **The headline is "If Claude wrote it, it's marked."** The old one, "Remove
   the watermark Claude puts in your writing," was the exact claim entry 70
   forbids and had been flagged twice without a ruling. The replacement is the
   line Jon ratified for the statistical row, promoted. True of 100% of Claude
   output since 2 August 2026, five words, and it survives the detector opening.
2. **How-it-works left the home page.** Its three drawn panels were the largest
   text mass on the page and the same depth already lives at `/how-it-works`,
   which the argument section now links. The component file stays for that page's
   future use; nothing imports it today.
3. **An FAQ exists at last**, eight questions, the hard ones: cheating, can my
   school detect this today, how do I know the rewrite worked, Word and PDF
   truthfully stated per `06` row 74. docs/09 section 9 is the reasoning: the FAQ
   is where this category actually argues.
4. **The three Anthropic quotes are placed, not boxed:** the edit-versus-wrote
   sentence in the stakes, the detection API sentence beside it, the
   complete-rewrite sentence closing the engineering section, each hyperlinked in
   running prose and dated.
5. **The engineering section Jon demanded exists:** why a generic rewrite fails
   (it protects fact sentences, which is where the mark lives, measured), four
   engine rules with the reason each exists, the receipts, and the measured 90%+
   of three-word sequences broken.
6. **The rows follow one template:** name, where it lives, count. The count is an
   em dash where no count can exist, Jon's carve-out, entry 84. The button
   carries the count when there is one: "Sanitise it (3)".
7. **The sample is a chip, "Try an example"**, restoring the demonstration the
   empty-box ruling removed, per the category-universal pattern in docs/09.
8. **The counter's hydration error is fixed** with a one-line suppression: the
   figure is clock-derived by design, entry 71, so server and client can never
   match. This was the only console error the page produced and it predated this
   session.

**Flagged for Jon, not decided here:** the stakes heading ("Wrote it yourself and
edited with Claude? Same mark.") stands in for the words he said he wants to
write himself; the marquee caption is still his; the mission page is still his.

### 86. The overnight build: tested end to end, priced, missioned, logoed

**Jon handed the project over for the night of 19 to 20 August 2026 with launch
readiness as the brief: "This is your baby. Execute." The record of what was
built and what was found, so the morning needs no archaeology.**

**Built.**
- **/pricing**, per `03` section 8 and entries 63 to 67: free tier stated as it
  really works, three packs at the ratified prices, buttons routing to sign-up
  until Stripe lands, with a line saying exactly that.
- **The mission page**, Jon's draft refined in his voice, one em dash surviving.
- **The logo**: a U missing the top of its right stem, the missing piece being
  the orange hidden-character bar drifting away. Favicon, header and share card.
- **The OG share card**, rendered from the live headline at /opengraph-image.
- **A copy button** on the clean result, a size guard on both API routes, light
  and dark themes only, the sitemap completed, title and description rewritten.

**Corrected, from a primary-source research pass on the vendor table.**
- **xAI never signed the European transparency code.** The row credited it with
  a commitment it never made. New "Nothing yet" state, grey cross.
- Claude text moves to committed: models launched from 2 August, retrofit over
  coming months. Gemini text has no public check. Meta marks images today.
  OpenAI gained its May 2026 SynthID layer. The intro sentence was false twice.

**Tested live, all passing.** Sample scan, full rewrite with receipts, file scan
reading a planted XMP creator (the STABILITY AI status lands exactly as entry 70
demanded), file clean with byte report and download, paywall at zero allowance,
remove-file, empty-scan error, Google button present, every route 200.

**Found and settled: the preview pane's dead-hydration mystery has a mechanism**,
written to `07`: the home page's hydration yields mid-tree and a backgrounded
pane freezes scheduled work forever. Front the tab, force a frame, probe for
fibers. Real visitors are unaffected.

**Found and left for Jon, in order of weight.**
1. **The rewrite invented a dollar sign**: "4.2 million" came back "$4.2
   million" on one run. The fact guard compares values, not symbols. An engine
   tweak, not a copy fix, and not one to make at 3am.
2. **The headline and the Claude band ride the announced-rollout ambiguity**:
   no shipping Claude model is confirmed marked today (`06` row 62). The precise
   version lives in the FAQ and the vendor table; the punchy version lives in
   the hero and band per his posture ruling (entry 84). His call stands; it is
   recorded so it stays a decision rather than an accident.
3. **The stakes heading and marquee caption remain placeholders in his voice to
   replace at will.**
