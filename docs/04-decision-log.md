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
