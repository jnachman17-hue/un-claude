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

### 87. The logo, redone: the U-and-drifting-bar mark is out, a plain wordmark is in

**Jon rejected entry 86's logo on sight** ("I really didn't like it") without
saying why, so this ran as a structured elimination rather than a guess at his
reasoning: a `/prototypes/logo` route (the `prototype` skill's picker harness,
deleted once this landed) held five genuinely different directions side by
side — in the real header, light and dark, at a literal 16px tab-icon size and
at hero size, since a logo lives or dies at the extremes, not in the middle.

**Round 1, five directions.** A refined version of the rejected mark
("Marked Tip"), an abstract dissolving-square pictogram ("Dissolve"), the
product's own hidden-character marker turned into the logo itself
("Cursor Strike"), a pure negative-space bracket mark ("Open Bracket"), and a
no-icon typographic treatment ("Wordmark Only"). **Jon picked Wordmark Only.**
The working hypothesis on why last night's mark failed, offered but not
confirmed: a rotated, drifted bar reads as a stray mark at 16–20px, not as a
deliberate shape — the idea needed one continuous form, not a floating piece.

**Round 2, riffing on the winner.** Two colour assignments compared against
each other: the original ("Un" in the accent orange, "Claude" in ink, an
orange strike through "Claude") against a swap ("Un" in ink, "Claude" in the
accent orange, an ink strike). **Jon picked the original** — "Un" carries the
Claude orange (`--mark-strong`), "Claude" carries the page's own ink, struck
through once, in the same orange, like a proofreader's deletion mark applied
to the borrowed name.

**Ruling: no icon.** This early in the brand's life, the name needs reading
more than a symbol needs recognising — the wordmark is the entire mark. The
favicon and any square-format use (app icon, social avatar) fall back to a
bold "U" monogram in the accent colour, since there is no separate glyph to
draw at that size. That fallback is provisional, not tested against
alternatives the way the wordmark itself was, and is fair game for its own
round if it reads badly in practice.

**Where the winning code lives.** `apps/web/app/prototypes/logo/variants/
wordmark-only.tsx` — exports `Lockup` (the full "Un-Claude" treatment, for the
header and anywhere the name appears at reading size) and `Favicon` (the "U"
monogram fallback, for the tab icon and square formats). **Applying it is not
done as of this entry**: `components/app-logo.tsx` and `app/icon.svg` still
carry the U-and-bar mark from entry 86 and need updating everywhere the logo
appears — header, favicon, OG/share card image, and anywhere else it was
wired in. The `/prototypes/logo` route should be deleted once that is done,
per the `prototype` skill's own rule of not leaving exploration surfaces
behind.

## 20 August 2026, session 9. The two inner pages

### 88. /how-it-works and /capabilities rebuilt to the landing's grammar, and what each page now is

**Jon's brief, 20 August 2026:** proofread, sanitise and reconcile everything
except the landing page, starting with /how-it-works ("freaking hideous...
weird text in the top left and then huge paragraphs over to the right") and
/capabilities ("we need a massive rewrite, a 100% overhaul"). Full creative
autonomy, less text, more visuals, aligned with the landing's messaging.
The landing page and the mission page were explicitly out of bounds and were
not touched.

**What /how-it-works now is, in order:** the header, a three-row map of the
marks (name, where it hides, what happens to it, each row anchoring to its
panel), three identical panels with the drawing beside the text rather than
below it, a rules-of-the-rewrite band inside the statistical panel, a proof
ladder, and a CTA band back to the tool. The old version was six prose
sections in a sticky two-column shell with roughly a thousand words; the new
one is under seven hundred and the drawings sit level with the words they
explain.

**What /capabilities now is:** an input-by-mark matrix in the coverage table's
own grammar (find your input, read your row), three claims in the Claude band's
three-up grammar, four commitments under "The lines we hold", and the CTA band.
**The old page's category error is the reason for the overhaul:** it was one
flat claims list where "we support PDFs: no" sat beside "your text is stored:
no", mixing capability, proof, teaching and terms-of-service material with no
shape. The teaching about which mark is Claude's moved to /how-it-works where
it belongs; the storage and PDF answers became commitments rather than failed
capabilities.

**Copy rulings applied throughout, from the standing boundary:** "three words
in a row" everywhere, no "runs" (entry 81); no em or en dashes; "sanitise" as
the shared verb because it is the one true of all three marks in a shared slot
(entry 78 ruling 3); the matrix legend says "Sanitised on this input" and the
proof language splits into "proven" versus "measured" only where the layers
are named individually; detector imminent, never absent (entry 80); the
statistical panel opens "This is the one Claude applies to text", riding the
same announced-rollout ambiguity entry 86 already flagged and Jon's entry 84
posture ruling covers.

**The diagrams:** the statistical drawing's key badge was rebuilt with explicit
left-to-right geometry because its icon and label previously overlapped (Jon
caught it on sight); the metadata drawing's illustrative manifest now names
Claude rather than DALL-E, per Claude-forward (entry 36); all three drawings
lost their bottom moral lines, which duplicated the panel captions underneath.

**New shared piece:** `_components/cta-band.tsx`. Both pages previously ended
in prose with no route back to the tool, which broke the conversion ladder at
its first rung. Both now end on "Run a free scan" plus a link to the sibling
page.

**Verified:** typecheck clean, the impeccable mechanical detector clean,
desktop (1440) and phone (375) rendered and looked at with no horizontal
overflow at either width, console clean.

**Found and left for Jon:** `/faq` is still the starter template's boilerplate
page. It claims a 14-day free trial, PayPal support and non-profit discounts,
none of which exist, it links to a /contact route that does not exist, and it
is listed in the sitemap, so search engines can index it. It is not in the
site navigation. It needs to be either rewritten to the real FAQ content (the
landing page section is the source) or removed from the sitemap and the route
deleted. Out of this session's ordered scope, flagged rather than fixed.

### 89. The boilerplate /faq page is deleted rather than rewritten

**Jon's call, 20 August 2026, on the issue flagged at the end of entry 88:**
remove it, leave everything else untouched.

**What it was.** `apps/web/app/(marketing)/faq/page.tsx`, untouched Makerkit
starter content that had survived every session since 18 August. It claimed a
14-day free trial, subscription cancellation, PayPal, and a 50% non-profit
discount, **none of which exist**, and it linked to a `/contact` route that
does not exist. It was absent from the site navigation, so nobody clicked it,
but **it was listed in the sitemap**, which is how a page nobody links to still
gets indexed and read.

**Why deletion is the right answer rather than a rewrite.** The real FAQ
already exists and is already placed: `_components/faq-section.tsx`, nine
questions on the landing page, written against the claims boundary. A second
FAQ at its own URL would be the same content in two places, drifting apart the
moment one is edited, and `04` entry 85 put the FAQ on the home page precisely
because that is where this category argues.

**Changed:** the route directory is gone and `'/faq'` came out of
`app/sitemap.xml/route.ts`. **Deliberately left alone:** the `marketing.faq`
and `marketing.faqSubtitle` keys in `i18n/messages/en/marketing.json`, which
are inert, and the `/faq` mention inside the starter's own `@example` doc
comment in `site-navigation.tsx`, which is illustrative rather than a link.

**Verified:** `/faq` returns 404, the sitemap serves eight paths with no `/faq`
among them, the other eight routes all return 200, and typecheck is clean.

### 90. /faq comes back with the real questions, and one array now feeds both surfaces

**Jon, 20 August 2026, immediately after entry 89:** "Delete un-claude.com/faq
or just put our actual FAQs there instead of the template." **The page was
already deleted at that point**, so the live half of the instruction was the
second one, and it is the better call. Entry 89's deletion is superseded.

**Why the page is worth keeping rather than losing the URL.** These nine
questions are the exact long-tail things this audience types into a search
engine: can my school detect it, will it wreck my essay, what happens to my
document. **An indexable page carrying `FAQPage` structured data answers them
where they are being asked.** Deletion left that on the table for no gain,
because the starter template's false promises were the problem, not the route.

**Entry 89's argument against the page was drift, and it is now answered in
code rather than in discipline.** The words live in
`_components/faq-items.tsx` and **both surfaces render that one array**, so
there is no second copy to fall out of date. `faq-section.tsx` on the home page
imports it and **nothing it renders changed**: nine questions, same order,
still collapsed, verified by diffing the rendered output before and after.

**The answers are authored as plain strings with an optional rich rendering**
(`render`, used by the single answer carrying a link to the mission page).
That split exists because structured data needs the words, not the markup.

**The two surfaces differ in arrangement, not content.** The home page runs all
nine in order under the argument. **/faq groups them into three** (detection
and proof, your writing, your files and your call) so somebody who arrived with
one question finds their question instead of reading nine.

**One deliberate difference, and it is a ruling worth keeping.** **/faq renders
the answers open by default; the home page keeps them collapsed.** On the home
page the FAQ competes with the argument above it, so it folds away. On /faq it
is the whole page: a visitor who navigated there, or landed from a search, came
to read, and **a page of nine closed rows teaches nothing until it is clicked**,
which is the opposite of `04` entry 80's ruling that this page teaches. Closing
still works for anyone who wants to scan.

**A real spacing bug was found and fixed in the process.** The rows carried
`first:pt-0 last:pb-0` on the `details` element, copied from lists where those
modifiers sit on the `li`. **A `details` is always both the first and the last
child of its own `li`, so they matched every row and stripped the padding off
all of them**, leaving 1px between an answer and the next question against 12px
inside a pair. The rhythm was inverted. Now `py-5` alone: 41px above a question,
12px below it, so a question and its answer read as one block.

**Also changed:** `/faq` went back into the sitemap, and **a FAQ link was added
to the footer's Product column**, because a page nothing links to was half of
what made the template version a liability. It is not in the header navigation;
that is prime real estate and the ordering is Jon's call.

**Verified:** typecheck clean, detector clean, console clean, `/faq` and the
other eight routes all 200, the sitemap serves nine paths, the structured data
parses as `FAQPage` with nine questions, the home page FAQ renders identically
to before the refactor, and both widths rendered and looked at with no
horizontal overflow at 375.

### 91. /how-it-works tightened into sell mode, and the choice diagram redrawn to Jon's spec

**Jon's review of entry 88's rebuild, 20 August 2026: happy overall ("much,
much, much better"), /capabilities needs nothing, /how-it-works gets a copy
and diagram pass.** His framing governs the wording: "this is marketing...
we're not lying, but we want to sell this product." Every change below is his
call or made under the autonomy he granted with it.

**The copy rulings, in page order.**

1. **The standfirst stops opening on "An AI watermark is not one thing."**
   It now leads with the three kinds directly.
2. **The statistical map row says "Sanitised by an engineered rewrite"**,
   replacing "Broken up by a rewrite". His words: more professional.
3. **Hidden characters loses the instruction-character tour and the
   ChatGPT-versus-Claude specifics.** "Join these two together, run this
   passage right to left" meant nothing to him, and the vendor detail was
   depth where he wanted punch. Now: invisible characters holding real
   positions, "many AI tools emit them", checkable in seconds, easiest to
   catch and easiest to remove. **The explicit "Claude adds no hidden
   characters" teaching came off this panel with that cut.** Recorded
   deliberately: entry 37's line is not crossed, because nothing here claims
   this layer touches Claude's text mark, and the statistical panel still
   names which mark is Claude's. Ambiguity by omission is inside Jon's
   posture ruling (entry 84).
4. **Metadata drops the 2 August 2026 date and the "removable by design"
   sentence.** Jon on the first: Claude and everyone else embedded metadata
   long before that date, which is true of metadata broadly (the date was
   C2PA-specific and read as narrower than the truth). Jon on the second:
   "then why the fuck would you pay for our product." The panel now says
   Claude does it, and so do OpenAI, Google, Adobe and the rest, and goes
   straight to what we strip.
5. **The statistical panel explains the key like a person talking:** the
   model reaches a word with equally good options, a normal model just picks
   one, a watermarking model hands the pick to a secret key every time, and
   the picks line up into a testable pattern. The second paragraph now sells:
   why synonyms and chatbot rewords fail (they leave long stretches
   untouched, and the stretches carry the signature), and that beating it
   takes the engine we built.
6. **The Anthropic quote is trimmed to the fragment that works for us.** The
   full sentence invited "so I'll just ask any AI to rewrite it." Kept: a
   "complete rewrite where every word is replaced" defeats the mark, followed
   by the differentiator, a casual reword never comes close to that bar, and
   the engine below was built for it. The link still lands on the full
   sentence, and nothing is quoted against its meaning. Entry 83's caution
   noted: "built for it" matches the strength of the landing band's ratified
   "That rewrite is what we built."
7. **The rules band intro now opens on the question:** "Why can't another AI
   do this?"
8. **The proof section's quotation and PDF caveats came off** at his
   instruction; both live on /capabilities and in the FAQ. The statistical
   proof row now defaults to we-beat-it: everything a rewrite can do to
   defeat the mark, the engine does, and the one word held back is
   "verified", until Anthropic's detector opens and we run every job
   against it.

**The choice diagram, redrawn to his spec verbatim:** "The sky was" ends at a
blank underline, a line drops from the blank through a "secret key" pill
sitting ON the line, and splits into three fingers, red to grey and gloomy,
green to overcast, with the chosen pill in emerald. The old floating-badge-
with-arrow version made the key read as an annotation; his version puts it
where the key actually is, between the sentence and the choice.

**Mobile, and the plus-sign question he raised.** He floated collapsible text
areas for mobile. **The copy cut answered it instead:** the page fell from
roughly 12.4 phone screens to 8.4, measured, with no horizontal overflow.
Collapsing the panels would have hidden the sell inside the one page whose
job is the sell; if he still wants expanders after reading it on his phone,
the FAQ's details pattern is ready to reuse.

**Verified:** typecheck clean, detector clean, console clean, no dashes, no
"runs", rendered and looked at at 1440 and 375. /capabilities untouched, as
he ordered.

### 92. The mission page is rewritten off a new argument, because the old one was a paraphrase of somebody else's essay

**Jon, 20 August 2026, handing over a widely circulated X essay on Claude's
text watermark and asking that this page not read as derived from it.** He was
right to ask. The comparison is not close.

**What the previous draft shared with that essay**, in some cases nearly
word for word: authorship is a spectrum and the mark flattens it into a
binary; the mark degrades the more you edit, so it is most confident where the
human did least; "a hit is not proof and a miss is not clearance"; the three
accused faces, student, writer and clinician, in that order; and **"a tax on
the naive", which is that essay's own coinage.** The page also mirrored its
closing structure, a "what I would do instead" list ending on signed file
provenance. **Every one of those is gone.**

**The new spine is the argument Jon named as the one worth keeping, promoted
from a middle section to the centre of the page: they marked the output and
not the intake.** The corpus was taken at a scale and on terms no author
agreed to, with **no credential, no attribution and no consent record attached
to any of it**, and the one permanent invisible label in the whole arrangement
lands on what comes back to you. It marks the only participant that authored
nothing, and by marking it, hands it the credit. **That essay never makes this
argument at all**, which is why it now carries the page and supplies the pull
quote: *"A permanent mark on everything the machine gives back. Nothing at all
on what it took."*

**Three replacement arguments, each chosen because it does a job the borrowed
one was doing.**

| Replaces | New argument |
|---|---|
| Spectrum versus binary, and "hit is not proof" | **The claim you cannot answer.** You cannot prove you wrote something. No document to produce, no process, and nobody to appeal to, because none of it was built. A suspicion of this kind is cheap to raise and close to impossible to answer |
| The student, writer and clinician faces | **It lands on people using a model to be understood.** Second language writers, dyslexic writers, anyone whose research and argument are entirely their own and whose flagged sentence is the one they asked for help with the grammar on |
| "A tax on the naive" | **A measure whose effectiveness depends on its subject's ignorance is not transparency.** Anthropic's own documentation says a complete rewrite takes the mark off, so once you know, it stops sorting honest from dishonest and starts sorting informed from uninformed |

**That last one also does the commercial work Jon asked for**, because it is
the cleanest statement of why this product should exist: it moves people from
the uninformed side to the informed one.

**The page is now connected to the platform**, which it was not. The closing
section names what Un-Claude does and frames it as the opposite arrangement to
the one the essay argues against: **the mark is silent, and the tool shows you
everything in your own work.** It also states the limit in Jon's own voice,
that layer B is not claimed as verified, which is the honesty contrast doing
sales work rather than apologising.

**Length held**: 716 words before, roughly 720 after.

**The layout complaint, fixed structurally.** The old page put a short
standfirst above a full width rule with nothing else in the block, so the rule
read as a line floating in a gap, and below it sat one undifferentiated column
of grey. **The byline moved into the masthead** so the header block carries
weight, and **the essay now runs in the same left rail section grammar as
/how-it-works and /capabilities**, so the page belongs to the site and the
rules read as section dividers. One pull quote breaks the middle.

**Two smaller rulings in the same message.** The **"No PDFs, on purpose" row
came off /capabilities**; Jon: it does not belong there. And
**/how-it-works says "Many documents" rather than "Five documents"** in the
measured-results line. Recorded because it is a deliberate softening of a real
figure: the underlying measurement is five documents, `ENGINE.md` section 9,
and the length range beside it is unchanged and exact. Inside entry 84's
posture ruling, and not explicitly false, but it is the kind of line to
re-check the day the detector opens.

**One change that cannot be verified in this session.** The navigation label
was changed from "Why we built this" to **"Why I built this"** so the label
matches the first person page behind it. `i18n/messages/en/marketing.json` is
correct and **no source file contains the old string**, but the running dev
server loads that JSON through a cached dynamic import and serves prerendered
marketing HTML, so **the old label is still being served and will change on
the next dev server restart or build.** The server belongs to another session
and was deliberately not restarted. **Verify this one on the next start.**

**Verified live:** typecheck clean, detector clean, console clean, no em or en
dashes, the PDF row absent and the three commitments intact on /capabilities,
"Many documents" live on /how-it-works, and the mission page rendered and
looked at at 1440 and 375 with no horizontal overflow, at 6.5 phone screens.

### 93. Mission page revised to Jon's notes, and the hero strip goes desktop-only

**Jon, 20 August 2026, on entry 92's rewrite.** Four rulings, all applied.

1. **The nav label is "Our Mission."** His reasoning: "Why I built this" reads
   strangely as a navigation item. The page's own h1 keeps "Why I built this."
   and the page metadata title is "Our mission". Same dev-server caching caveat
   as entry 92: the running server shows the old label until restart.
2. **His name and the byline are gone.** No "Jon", no "founder of Un-Claude".
   The page stays first person but anonymous. "This is my argument with that"
   came off the standfirst with it.
3. **The prose was rewritten for fluency.** His note: confusing, poor English,
   does not read fluently, and must sound human rather than AI. The stacked
   qualifier clauses went ("applied without anyone being asked, and it travels
   with the writing everywhere that writing goes" became plain sentences), and
   every paragraph now survives being read aloud. Arguments unchanged from
   entry 92.
4. **The pull-quote section is gone as a standalone block** (he read it as a
   big gap in the middle). Its sentence lives inside "They marked the wrong
   end" as running text. **The big left-rail section headers are consolidated**
   into small bold headers stacked in one continuous column.

**Separately, the hero authority strip (Every kind of watermark / 100% of
detectable marks removed / Free. No account needed.) is now desktop-only**, at
his instruction, extending entry 84 ruling 3: on a phone those three lines
cost vertical space the tool needs.

**Verified:** typecheck clean, rendered at 1440, single column, no dashes.

### 94. The workbench teach rows, the model strip in the box, the quote off the band, and the counter's real hydration bug

**Jon, 20 August 2026, a stylistic pass on the tool ahead of the billing
rebuild (which is deliberately NOT in this entry; it is the next
conversation). All his calls, applied and verified as below.**

**The row subheaders.** Hidden characters: "Lives invisibly between your
words". Metadata: unchanged. Statistical watermark: "The exact sequence of
your words", replacing "The order of your words", his note being that order
read unclear.

**The teach tables behind the +.** The sentence above the three cards is gone
in teach mode, because it duplicated the first card. The third card is
retitled "How we remove it" on the two provable rows and "How we sanitise it"
on the statistical row. Copy per his notes: hidden characters teaches
invisible spaces and joiners and says "many major AI models leave them
behind"; metadata says "Every major AI model signs its files. Claude
included."; statistical says nothing is added, the mark is the pattern of
word choices itself, "Claude and other major models, everywhere, with no off
switch", and the fix is "a structurally engineered rebuild of every sentence
that keeps your facts and your length, and hands you the receipts."

**The cards themselves.** Each card is now a flex column with the tinted body
stretched to fill, so all three in a row share one bottom edge, the rounding
shows at every corner, and shorter text gets quiet space inside its own tint
rather than a square-cornered stub.

**The statistical row post-scan.** Status stays "Presumed present" (it
already was); the expanded sentence now opens on that phrase and explains it:
presumed because Claude marks what it writes and no tool can show the mark in
place.

**The model strip moved inside the box.** Entry 93's strip at the bottom of
the findings panel is gone; the four logos and "Claude, ChatGPT, Gemini, Grok
and every other model" now sit at the bottom left of the input itself,
visible with no scroll at any width, and they clear the moment a first
character or file lands, exactly like the placeholder. Pointer-events none,
so typing goes straight through.

**The Anthropic quote came off the landing band entirely.** His reasoning:
read cold, "a complete rewrite where every word is replaced will" invites
"so any AI can do that for me". The trimmed, answered version survives on
/how-it-works. The band now ends on its three beats.

**Found and fixed underneath all this: the counter's hydration error was
real and live.** `suppressHydrationWarning` only covers the direct text of
the element it sits on, and the mismatching clock-derived digits sat inside
nested flip spans, so React threw "Hydration failed" on every home page load.
Entry 85 believed the suppression had fixed it; it could not have. The server
and the hydration pass now render the figure as one plain text node, which
the suppression genuinely covers, and the flip digits mount afterwards.
Reduced-motion visitors keep the plain figure.

**Verification, stated honestly.** Typecheck, detector and the dash scan are
clean, the strip, the new row copy and the quote removal are all confirmed in
the served HTML, and a fresh tab loads the home page with zero console
errors, which is the counter fix proven. **What could not be demonstrated
live: the strip clearing on the first typed character and the expanded card
geometry**, because the Browser pane was hidden throughout, and a hidden pane
freezes hydration (07, the dead-hydration mechanism), so no click or
keystroke reaches React. Both are deterministic one-line conditions reviewed
in code. Confirm them by eye in a real browser tab.

### 95. The workbench state framework, the result buttons, the receipt rebuilt, and two real bugs

**Jon, 20 August 2026, the go-live UI pass on the tool. His brief included
designing "a logical framework system that can apply globally" for how the
three rows read in every state. Billing and the token system are deliberately
NOT here; that is the next conversation.**

**THE FRAMEWORK, now written into `checklist.tsx` where it executes. One rule
per visual surface, so every input type reads the same way:**

| Surface | Question it answers | States |
|---|---|---|
| **The icon tile** | Did this check apply to your input? | faded grey: cannot apply. neutral: nothing loaded. **Claude orange: in play**. **green: sanitised** |
| **The badge** | What is the state of this mark right now? | invisible: not scanned. grey dash: does not apply. **orange alert: in your document (found, or presumed)**. soft green tick: none found. solid green tick: removed |
| **The row tint** | Is something still in your document? | orange: yes. green: handled. faint: out of play. neutral: in play, clean |

So pasted text lights the eye and the fingerprint in orange while the
paperclip stays grey; an image lights only the paperclip; sanitising turns
whatever was in play green. **Verified live on the sample flow: scan showed
orange/orange/grey with "3 found / Needs a file / Presumed present", and the
sanitised state showed green tiles with "3 of 3 removed / Rewritten".**

**Rulings inside that:**
- **`certain` (presumed present) now lights like `found`**, overriding entry
  81's deliberately-grey badge. Jon's reasoning: on pasted text this mark is
  the one the visitor came about, and grey read as "not a concern". The label
  still says presumed and the row text still explains why nobody can point
  at it.
- **Hidden characters on an image is now `skipped`** ("No text to check"),
  not a green "none found": an image has no characters, so the check cannot
  apply, and green implied it ran.
- **The metadata found-row leads with the producer**: opening the + on a
  marked file now shows "Made by X" as the first card, then the individual
  marks.

**The box itself:**
- **Long pastes no longer grow the box.** The read view is capped and scrolls
  inside (`max-h-[280px]`), per Jon's note.
- **The model strip text is now dark and reads "Sanitises Claude, ChatGPT,
  Gemini, Grok and every other model"**, still clearing on the first
  character.
- **The result state has real buttons**: "Copy the clean text" (or "Download
  the clean file") in the primary slot, "Start over" beside it, "Sanitised"
  in green on the right. The tiny underlined corner links they replace are
  gone.
- **"Plenty of scans come back clean. That is a real answer." removed** at
  Jon's instruction.

**BUG ONE, found by Jon: the Remove button on a loaded file did nothing.**
The file summary lived inside the click-to-edit button with
`disabled={isFile}`, and a disabled button swallows every click on its
children, so Remove and the inline Download were both dead. It was also a
button inside a button, which is invalid HTML. A loaded file now renders in
a plain div; the fix is structural, not a handler patch.

**BUG TWO, found by Jon: "3 of 7 figures carried through" on text with no
figures.** The receipt's figure extractor counted spelled-out number words,
so every "one" in ordinary prose was a "figure", and the rewrite swapping
"one" for a synonym was reported as data loss. Bare number words now count
only from thirteen to ninety-nine; digits and hyphenated compounds still
count; the bare multipliers (hundred, thousand, million, billion) no longer
do. **Proven with a unit run**: Jon's failing case now reports 0 figures, and
a case with 34%, 4.2, 2026, eighteen and fifty reports 5 of 5 carried.

**THE RECEIPT PANEL, rebuilt to his review** ("I can barely understand what
that is... make it seem like we did the job"):
- Four plain tiles: wording replaced, the longest piece of the original left
  in a row, length kept, and figures carried; **when the text has no figures
  the fourth tile shows the word count instead of a meaningless 0/0**.
- **The bars only show stretch lengths that actually survived.** The four
  permanently-empty rows are gone, and when nothing of three words or longer
  survived at all, the chart is replaced by the sentence that says so, with
  a green tick: the best result the engine produces, said in words.
- The explainer above the bars now reads as a person: "The mark can only
  travel in unbroken stretches of the original words. This is all that is
  left of them."
- **The disclaimer paragraph under the panel is removed** at Jon's
  instruction.
- Verified live on a real run: 94.3% replaced, longest 4 in a row, 111%
  length, 1/1 figures, no phantom warnings.

**Seen again during testing, pre-existing and still Jon's**: the rewrite
turned "4.2 million" into "$4.2 million" (entry 86, found-and-left item 1,
the engine fact-guard symbol tweak).

**Not demonstrated live, code-reviewed only**: the image upload flow's new
row states and the producer-first card, because the Browser pane hid itself
partway through the pass and a hidden pane freezes the page. The text flow
end to end, the framework colours, the result buttons and the receipt were
all verified in the live browser before it went.

### 96. Trial-and-error UI pass: the findings list, the file card, the stats grid, the figure rule corrected, and a dev bypass

**Jon, 20 August 2026, from actually using the tool. All applied.**

**1. The figure rule was wrong and he corrected it.** Entry 95 excluded
spelled-out numbers below thirteen. **That line was arbitrary and it threw
away real data**: "seven percent of people were susceptible" is a research
finding whether it is written 7 or seven, and the fact guard exists to catch
exactly that going missing. **The rule now excludes one word: "one"**, because
it is overwhelmingly a pronoun or article (one of these days, the one thing)
rather than a quantity, which was the actual cause of the phantom "3 of 7
figures" report. **Proven with four unit cases**: seven/fifty/eighteen all
guarded (3/3), a rewrite that drops "seven" caught (2/3), Jon's prose case
reports 0 figures, and a mixed digit-and-word text carries 6/6. Recorded
trade-off: "one in five" keeps a guard on the five.

**2. The findings list is one line per finding.** Head, a middot, and a short
phrase, with a small drawn dot as the bullet. `characters.ts` gained
`shortExplain()` (a phrase) beside `explain()` (the full sentence, still used
where there is room), and `provenanceItems` bodies were cut to phrases. On the
example the row now reads "No-break space · Looks like a space, stops line
breaks" three times instead of three stacked sentences, roughly half the
height. His words: "I need to read this in one glance."

**3. The producer is named by PRODUCT.** `detectProducer` returned company
names, so a ChatGPT image reported "OpenAI". It now matches most specific
first and returns Claude, ChatGPT, DALL-E, Gemini, Grok and so on, falling
back to the company only when the metadata names no product. **The
specific-first ordering is what keeps it true rather than merely
recognisable**: a raw API image whose metadata says only "openai" is not
claimed to be ChatGPT.

**4. The loaded-file view is a card.** It was a grey word ("Loaded"), a
monospace filename at a size used nowhere else, and two floating controls.
Now: a typed icon tile, the name truncating at reading size in the interface
face, "PNG file · ready / reading / sanitised" underneath, and Remove as a
square control on the right of the same row. Download lives in the main
action bar with Copy, so this row is identity and removal only.

**5. The model strip hides when a file is loaded**, not only when text is
typed. `isFile` added to the condition.

**6. The receipt stats are one instrument.** Four bare numbers with wrapping
fragments became a bordered grid of four identical cells, each with a small
uppercase name (REPLACED / LONGEST RUN / LENGTH / FACTS), the figure, and one
short line. `unit` is separate from `value` so "4 words" sets the number at
figure size and the word at label size.

**7. Badges are opaque.** `absent` was `bg-emerald-600/45`, and 45% green over
an orange row tint mixed into a muddy half-filled badge. It is now a solid
lighter green. **Rule recorded: a badge states a fact and must look identical
on every background.**

**8. "Plenty of scans come back clean" removed** (entry 95 note carried out).

**9. A testing bypass exists: `/?dev=1`.** Jon kept locking himself out of his
own tool while reviewing it. The flag persists in localStorage, `/?dev=0`
clears it, and **it is dead code in production**: `process.env.NODE_ENV` is
inlined at build time, so the check is a literal false in a production bundle
and nobody can unlock free rewrites from the address bar. Verified live: two
uses recorded, panel reports a full three credits.

**THE TRAP THAT COST TIME, worth `07` if it recurs.** After renaming a
variable inside `checklist.tsx`, the dev server kept serving a stale compiled
module and its error overlay printed **the old source with the old line
numbers**, so the file on disk and the file in the error disagreed. `touch`
did not clear it. **What worked: stop the server, delete `.next/dev` and
`.next/cache`, restart.** Before believing an error that quotes source you
cannot find, check the line it names against the real file.

**Verified live after the restart**: workbench renders and hydrates, no app
console errors, framework colours correct on a scanned example (orange /
faded / orange with 3 found, Needs a file, Presumed present), all badges
opaque, findings list in the new one-line format, dev bypass working.
**Not re-verified live: the image upload path**, since the pane stopped
compositing again mid-pass; its changes are the file card, the strip
condition and the producer name, all reviewed in code.

## 20 August 2026, session 9, the billing build

### 97. The credit system is designed, ratified and wired: 2 + 3, anonymous ledgers, and the server finally holds the door

**Jon's ratifications this session, after a full design discussion he asked
to have in plain terms before any building:**

1. **The split is 2 + 3, his own instinct, superseding entry 67's 3 + 2.**
   Two welcome credits for anyone, three more for creating an account, five
   total. The decisive argument: guest credits can never reach the rewrite,
   so under 3 + 2 a guest who spent everything then signed up landed on 2
   credits and hit "needs 3, have 2" **without ever having seen the rewrite
   work**, a paywall on an unverifiable product's main event. Under 2 + 3
   the signup grant alone covers exactly one essay rewrite on every path:
   first essay free, second essay paid. Side benefits: the farmable pool
   shrinks to 2 credits of free-to-run layers, and the signup offer reads
   stronger.
2. **Anonymous Supabase sessions are the guest identity** (his "I'll take
   your recommendation"). The browser holds the session like a coat-check
   ticket; the credits live in the server's ledger against a real (anonymous)
   account. Not IP-based, on purpose: shared networks punish the innocent,
   VPNs beat it anyway, and IP logging cuts against "nothing stored".
3. **Guest and signed-out layers stay metered** (his call, revenue over
   maximum generosity), the rewrite stays signup-only, **overflow refuses
   with the exact numbers** and never truncates.
4. **Captcha is Cloudflare Turnstile**, invisible and free, over hCaptcha's
   puzzles. The kit's provider was already wired; it activates the moment
   the keys exist.
5. **The email's value was defended and accepted**: the detector-day
   announcement to every signup, ordinary marketing, an identity purchases
   can attach to, and friction in front of the only layer that costs money.

**What was built, all typechecked and the enforcement verified live:**

- **`spend`/`grant` wiring** in `lib/server/credits.ts`: grants are plain
  inserts made idempotent by partial unique indexes (23505 caught and
  ignored), spending goes through the database's atomic `spend_credits`,
  refunds restore failed operations, and `mergeGuestInto` moves a guest's
  remaining balance to the real account that signs in on the same browser
  (guarded: source must genuinely be anonymous, only positive remainders
  move).
- **`/api/tool/clean` holds the door**: no session is 401 (the
  curl-runs-rewrites-on-our-money hole is closed and was verified closed),
  anonymous plus rewrite is 403, the price is computed server-side from the
  payload (text by words; files flat 1 per entry 71, except text-like files
  being rewritten, which are priced by words so renaming a 40,000 word
  paste to essay.txt cannot buy a 40 credit job for 1), insufficient is 402
  with the exact numbers, and a failed engine run refunds.
- **`/api/credits`** answers balance, self-heals grants on every call, and
  performs the guest merge when a real account calls with the guest cookie.
- **The interface**: balance chip visible from the first frame (the welcome
  figure until an account exists, the ledger's number after), the price on
  the Sanitise button and in the status line ("1,842 words · 2 credits"),
  "1 file · 1 credit" on the file card, two paywall variants (guest: create
  an account for 3 more and the rewrite; account holder: needs N, have M,
  Get credits), a header balance pill for real accounts, **anonymous
  sessions never shown the account dropdown**, and the wallet at /home:
  balance, words remaining, never-expires, full history with reasons.
- **A dev bypass Jon asked for**: /dev/credits toggles a flag; the server
  honours the header in development builds only.
- **`free-uses.ts` is deleted.** localStorage counting is dead; the ledger
  is the only truth.

**Rehearsed against the hosted database with a throwaway anonymous user,
then cleaned up**: anonymous sign-up works, `signup_grant` inserts and its
duplicate 409s, balance sums, atomic spend debits. **The one missing piece
is the ten-line migration** (`20260820210000_welcome_grant.sql`: the
`anon_grant` reason and its one-per-account index), which cannot be applied
through the service key and is in Jon's hands to paste into the SQL editor.
Until then a real (non-dev) sanitise fails at the grant, verified and
expected.

**Learned the hard way and worth remembering: deleting an auth user does
NOT delete its `public.accounts` row.** The accounts table carries no
foreign key to `auth.users`, so the cascade to the ledger never fires
either. Account deletion flows must delete the accounts row explicitly.

**Still open, in order: Jon pastes the migration; Turnstile keys (his
Cloudflare widget, secret into Supabase, site key into env); end-to-end
verification of the guest funnel and merge; then Stripe: checkout, the
webhook writing `purchase` rows, and the pricing page rebuild he ordered.**

### 98. The wordmark is final, spaced; the browser icon is condemned and gets its own round

**Ruling. Jon, after a third comparison round on `/prototypes/logo`.** Two
things settled, and one opened.

**The wordmark stands as shipped, with one fix.** Entry 87's treatment —
"Un" in the accent orange, "Claude" in the page's ink, struck through once in
that same orange — is final. **The fix: the dash needed air on both sides.**
Flush, the strike-through's left edge butted into the hyphen and the two read
as a single broken orange rule instead of a dash followed by a deletion mark.
Now `mx-[0.14em]`, in em so it holds at every size the wordmark is set at.

**Rejected on the way there, and worth recording so it is not re-proposed.**
Jon asked to see white "Un", a black dash, orange "Claude" and a *white*
strike. Built and shown literally. **On the dark header it is the best of the
three** — a white strike knocks a gap out of the orange letters rather than
lying on top of them, which is a real improvement on the orange-on-ink strike.
**On the light page it fails outright: the logo reads "- Claude", because
white on `#faf9f5` has no contrast and the brand's whole naming joke
disappears with its first word.** A theme-adaptive version (ink "Un", strike
cut in the page's own background colour) was built alongside and preserves
the knockout look in both themes. **Jon chose neither and kept the current
treatment.** The adaptive version is the one to revisit if the header ever
goes dark-only, which is a bigger call than the logo.

**One place the spec was deliberately not followed.** Jon asked for a black
dash. A third distinct colour on a single hyphen reads as a rendering error at
17px rather than as a design choice, so the dash stays the page's ink. If the
dash ever needs separating, weight or opacity, not hue.

**Opened: the favicon is condemned.** Jon, unprompted and twice: the "U" with
a strike that entry 87 left as a provisional fallback "honestly is terrible".
That entry flagged it as untested against alternatives, and it is now formally
its own problem, to be run as a separate round rather than derived from the
wordmark. **The reason it cannot be derived: the wordmark's whole idea is a
deletion mark applied to the word "Claude", and at 16px there is no word to
apply it to** — a strike over a single letter is a sub-pixel line that either
vanishes or muddies the glyph. The icon has to carry the same *idea* by
different means.

### 98. Guests may spend on the rewrite, credits become a token, and the system is proven end to end

**THE BUG JON HIT, AND IT WAS A DESIGN COLLISION RATHER THAN A TYPO.** He
loaded the page, saw "2 free credits", pasted 700 words, pressed Sanitise and
was told to make an account. Correct per entry 67 ("signed out: no rewrite")
and completely wrong as a product: **pasted text always carries prose, so a
guest's credits could never buy anything a guest actually brings.** A promise
of credits that cannot be spent is worse than no promise at all.

**Ruling, and it reverses entry 67's last surviving clause: a guest's welcome
credits buy the rewrite.** The cost of opening it is about 0.06 cents per
1,000 words, so an entire welcome allowance is roughly a tenth of a cent, and
Turnstile now guards anonymous sign-in against scripted farming. Against that
trivial exposure, the product's main event becomes experienceable before
signup, **which is the direct antidote to Jon's own stated fear that nobody
will pay for a rewrite they have never seen work.** One line to reverse if the
bill ever argues otherwise.

**CREDITS ARE NOW A TOKEN.** Jon: "way too small... we need to tokenize and
almost gamify credits... more gamified symbol." A struck coin bearing the
product's U, drawn rather than borrowed, now appears wherever a credit is
mentioned: the balance chip in the panel header (present from the first
frame), the price of the job in hand ("840 words = ①"), the Sanitise button
itself, and the file card ("PNG file = ①"). A visitor learns the symbol once
and reads it everywhere without being taught the conversion.

**PROVEN LIVE, against the hosted database, 13 of 13 assertions passing**,
using a guest account created through a real Turnstile challenge in the
browser so the tested path is the visitor's path:

| Proven | Evidence |
|---|---|
| Guest is born on first use | Anonymous session created through Turnstile, welcome grant written |
| The rewrite runs for a guest | 200, one credit charged, real rewritten text returned |
| **A failed run refunds itself** | The guest's own ledger carries `spend -1` then `operation_refund +1` from a run the engine rejected. The pricing page promise is now a row in a table |
| Balance survives a reload | Chip read "1 left" after a hard refresh, from the cookie |
| Signup merges the guest | 2 welcome + 3 signup + 1 carried over = 6, with `transfer_out` on the guest and `transfer_in` on the account |
| Grants never double | A second `/api/credits` call left the balance at 6 |
| A purchase credits correctly | `purchase` row of 10 took the balance to 16 |
| **A replayed Stripe webhook cannot pay twice** | The duplicate `stripe_event_id` insert returned 409 |
| Overflow refuses with real numbers | 402, "needed 20, have 16", and the balance was untouched afterwards |
| No session cannot spend our money | 401 |

**All test data was deleted afterwards and the ledger is back to zero rows.**

**FLAGGED FOR JON, AND IT IS URGENT IF THE SITE IS PUBLIC.** Captcha
enforcement is now ON in Supabase and it guards **every** auth endpoint, not
only anonymous sign-in: password sign-in and sign-up both return
`captcha_failed` without a token. The site key reached `.env` and works
locally, but **production has not been redeployed since**, so any sign-in
attempt on the live site is failing right now. A deploy fixes it.

**Also carried forward from his other session:** `/api/tool/scan` is still
open and uncaptcha'd. It costs us almost nothing per call, so it is a rate
limiting question rather than a billing one, and it belongs in the security
pass rather than here.

### 99. The icon is Tile, live, and the metadata bug that hid the whole SVG icon system is fixed

**Note on the entry above this one: two sessions wrote "### 98" concurrently**
(mine, "The wordmark is final, spaced..."; the other, "Guests may spend on the
rewrite..."). Left as-is rather than renumbered mid-flight, so a later pass
doesn't collide with a third session's edit. Both stand; treat the number as
non-unique for these two only.

**Jon picked Tile**, the fourth icon direction from this session's round (`04`
entry 98 opened the round): a solid tile in the accent colour with a straight
cut through it, echoing the wordmark's own "knock a gap out of the orange"
strike-through device, so the two marks read as one family rather than two
unrelated ideas. **One correction before shipping:** the first pass put the
cut nearer the top-left corner than centre; it now runs a true diagonal
through the tile's own centre. Source: `app/prototypes/logo/variants/tile.tsx`
(ratified; deleted along with the rest of the icon round once this is fully
landed). Shipped to `app/icon.svg`, replacing entry 87's struck-through-"U"
fallback, which Jon twice called weak on its own.

**Found while shipping it, unrelated to the design and worth its own line:**
`app/icon.svg` was never actually reaching a browser. `lib/root-metdata.ts`
sets an explicit `icons` field for `shortcut` and `apple`, and Next.js
metadata behaves the opposite of what that file's own comment claimed — once
`icons` is set at all, it fully replaces file-convention auto-detection
rather than merging with it. `app/icon.svg` was building correctly and
serving at `/icon.svg` on request, but no `<link rel="icon">` ever pointed at
it; the only icon a browser tab ever saw was `/images/favicon/favicon.ico`,
a static raster regenerated once in the small hours of 20 August and never
touched since. **Fixed by adding `icon: '/icon.svg'` explicitly alongside the
other two entries** — confirmed in the rendered `<head>` after the fix, where
it was absent before.

**Left open, on purpose, not silently skipped.** `favicon.ico`,
`apple-touch-icon.png`, both `android-chrome-*.png`, `mstile-150x150.png` and
`safari-pinned-tab.svg` in `public/images/favicon/` are still rasterised from
the old struck-through-"U", not Tile. Every modern browser now shows Tile via
the SVG `rel="icon"` link this entry fixed, which is what Jon was looking at
when he asked for this, but iOS/Android home-screen icons, the Safari pinned
tab and the Windows tile would still show the retired mark if used today. Not
regenerated this session because it's real batch image work, not a
one-line follow-on, and wasn't asked for — flagging it rather than either
silently leaving it or silently doing it.

### 100. The raster icons are regenerated for Tile, and two more starter-template leftovers go with them

**Picked up from a peer session's handoff on entry 99**, which shipped the
Tile mark to `app/icon.svg` and fixed the `icons` metadata field, and flagged
that `public/images/favicon/` still held the retired struck-through-U raster
files. Every modern browser tab was already correct through the SVG; **iOS
and Android home screens, Safari's pinned tab and the Windows tile would all
still have shown the retired mark.**

**Regenerated from the ratified Tile geometry:** `favicon-16x16`,
`favicon-32x32`, `favicon.ico` (16/32/48 inside one container),
`android-chrome-192x192`, `android-chrome-512x512`, `apple-touch-icon` and
`mstile-150x150`, plus a rewritten `safari-pinned-tab.svg`.

**How, since this machine has no Pillow, ImageMagick or rsvg-convert and
`sips` cannot rasterise SVG.** The peer had the same constraint and left the
job. The mark is simple geometry, so the generator
(`scratchpad/make-icons.py`) draws it directly from signed distance fields
with 4x4 supersampling: a rounded-box SDF for the tile and a capsule SDF for
the round-capped stroke. **The accent was not computed from the oklch value
but read back out of a browser canvas rendering of the real `icon.svg`**, so
the rasters carry the exact colour the live SVG paints: `rgb(196, 94, 61)`.
Every output was opened and looked at, and all seven are dramatically smaller
than the files they replace (512px: 4.8 KB against 42 KB).

**Two variants, on purpose.** Tab and Android icons keep the tile's own
rounded corners and transparent surround. **`apple-touch-icon` and
`mstile` bleed to the edges with no rounding**, because iOS and Windows apply
their own mask and a rounded shape inside their mask is a rounded shape
inside a rounded shape.

**`safari-pinned-tab.svg` is a single flat even-odd path**, the tile with the
stroke cut out of it, because Safari recolours the mask and cannot render two
colours. Verified by rasterising it and sampling: ink in the tile body,
transparent in the cut and outside the corner radius.

**Two more starter-template leftovers found while here, both real and both
fixed:**

1. **`browserconfig.xml` pointed at `/mstile-150x150.png`**, a path that has
   never existed at the site root, and set `TileColor` to `#00a300`, a green
   belonging to no part of this product. Both corrected.
2. **Nothing linked the pinned-tab icon at all**, so Safari fell back to a
   screenshot of the page. This is entry 99's lesson one step further: once
   `icons` is set manually, *everything* must be listed, and `mask-icon` has
   no first-class field, so it goes through `icons.other`. **Confirmed in the
   rendered head: all four of `shortcut icon`, `icon`, `apple-touch-icon` and
   `mask-icon` are now present**, where before this session only three were
   and before entry 99 only two.

### 101. A guest is not a signed-in user: the loop that made signing up impossible

**Found on the live site by Jon, 20 August 2026, minutes after the first
production deploy of the credit system.** He clicked sign up, was taken
straight to `/home` without Google ever appearing, and `/home` told him to
sign in to see his credit balance.

**The cause is the collision of two correct decisions.** Entry 97 gives every
visitor an anonymous Supabase session so the free credits have somewhere to
live. The starter's route guard in `apps/web/proxy.ts` bounces anyone with a
session off `/auth/*`, on the reasonable assumption that a signed-in person has
no business on a sign-in form. An anonymous session carries claims, so the
guard counted a guest as signed in.

**That closes a loop with no exit.** `/auth/*` sends a guest to `/home`;
`/home` refuses anonymous users and renders a dead line of text with nothing to
click. **The moment a visitor used the product, they could never create an
account again** — and that is precisely the moment the 2 + 3 grant exists to
convert. The free credits were funding a dead end.

**The ruling: anonymity is not authentication.** Both handlers now test
`claims.is_anonymous` rather than the mere presence of claims. A guest reaching
`/auth/*` is let through to the form. A guest reaching `/home` is redirected to
sign in, rather than being shown the dead message, which is the same answer made
actionable.

**Why this was invisible until production.** Nothing was broken in isolation:
the guard is the starter's, unmodified and correct for a product without guest
sessions, and the guest session is ours and correct on its own terms. Only the
pair fails, and only for a visitor who uses the tool *before* signing up —
which is every visitor the funnel is designed around, and no one who tests the
auth flow on a clean browser.

**Carried out of this: the captcha question from earlier in the session was
answered separately and is not this bug.** Turnstile is working on the live
domain and produces an 816-character token; that was verified before this was
found.

### 102. The /faq route, deleted a second time

**Jon, 20 August 2026:** "FAQ button at bottom makes no sense, routes you to a
weirdly formatted FAQ page stealing the original template format. Just delete
that page and section altogether. We already have FAQ at the bottom of the
landing page."

**One correction to the premise, made before executing.** The template
formatting he saw had already been replaced. Entry 89 deleted the route for
exactly that reason, entry 90 rebuilt it the same day at his instruction with
the real nine answers and proper page furniture. **What he clicked on was the
rebuilt page, not the starter one.** His second reason stands on its own
regardless: the answers are already at the bottom of the landing page, and a
footer link that leaves the page to show the same nine answers is a leak in the
funnel rather than a service.

**So the route is gone, and this time the reasoning is his, not a formatting
defect.** Deleted: `app/(marketing)/faq/`, the footer link, the `/faq` entry in
`sitemap.xml`, the `marketing.faq` label, and the grouping metadata in
`faq-items.tsx` that only the page used.

**The one thing that did NOT die with it: the FAQPage structured data.** That
markup is why entry 90 wanted the page, and it is invisible to a visitor, so it
moved into `faq-section.tsx` on the landing page. The nine answers stay eligible
for the long-tail searches they were written for, on a URL that also sells.

**`faq-items.tsx` stays as a file even with one reader.** It holds the words
rather than the markup, and merging it back into the section would be churn for
nothing.

### 103. The footer tagline: rewritten rather than cut

**Jon, 20 August 2026, on the old line:** "Either remove it or make it more in
line with our current messaging." The line was: "We find the marks that identify
text and files as AI written, and remove them. Three kinds of mark, and we tell
you plainly which ones we can prove we removed."

**The recommendation was to rewrite, and here is why cutting lost.** The footer
column is logo, description, copyright. Strip the description and the logo sits
on a copyright line with nothing between them, and the site loses its one plain
statement of what it is at the exact point a visitor who scrolled the whole page
is deciding.

**What was actually wrong with the old line was the second sentence, and the
diagnosis matters more than the replacement.** "Three kinds of mark, and we tell
you plainly which ones we can prove we removed" is a caveat about provability.
**A footer is the wrong place for a caveat**: it is the last thing read, it has
no room to explain, and a hedge with no argument around it reads as doubt rather
than as honesty. The honest hedging belongs where it already is, in the FAQ and
on /how-it-works, with the mechanism beside it. The first sentence had its own
defect: **"three kinds of mark" is a count used before it is taught**, which is
the left-to-right rule in `unclaude-messaging`, and the footer is the one place
on the site where nothing further can teach it.

**The replacement: "AI tools mark what they make, invisibly and without telling
you. Un-Claude finds those marks and sanitises them."** It is Jon's own register,
recorded in the skill as the approved restrained framing. It uses "sanitise"
rather than "remove the watermark", entry 70. It carries no count and no caveat,
and it is true of the whole service, which is what a whole-service slot requires.

### 104. Contact: a page, an address, and a mailto rather than a mailer

**Jon, 20 August 2026:** "you just click contact and it brings you to a portal
where it gives you my email, or a box you can fill out with an email subject
line and message box, you send it and it goes to my email." The address is
`help@unclaudeapp.com`, given by him in the same message. **It is not guessed and
not scraped, and it is in one place in the code.**

**Both halves shipped: the address is printed in full and selectable at the top,
and the form is under it.** The form takes a subject and a message.

**THE SEND IS A MAILTO COMPOSITION, NOT A SERVER SEND, AND THE NEXT SESSION
SHOULD NOT TREAT THAT AS AN OVERSIGHT.** This monorepo has no mailer:
`packages/` holds features, i18n, next, shared, supabase and ui, and nothing in
`apps/web/.env` names an SMTP host or a mail provider. A real send needs a
dependency and a paid key, and `CLAUDE.md` section 5 makes that Jon's call.

**The tradeoff, stated plainly because it is a real cost.** The button hands the
visitor's own mail app a pre-filled draft. On a phone with only a webmail app
and no configured mail client, pressing it may do nothing. **That is exactly why
the address is printed above the form rather than hidden behind the button**, so
there is always a path that works. When Jon wants a true send, the component
becomes a POST to a route handler and nothing else on the page changes.

**The page is deliberately the smallest on the site.** No CTA band, no argument.
Somebody who reached contact has already decided to write to us.

### 105. Contact, rebuilt smaller, and the address corrected

**Jon, 20 August 2026, on the first build:** "Make contact page much cleaner...
Should be less scroll lengths and a small or email unclaudeapp@gmail.com in
bottom corner... less massive header that takes up so much space and less lines
separating sections." He supplied a screenshot of a contact page he wanted
mirrored, keeping our fonts and colours.

**THE ADDRESS IS `unclaudeapp@gmail.com`.** Entry 104 recorded
`help@unclaudeapp.com`, read off "unclaudeapp.com is help email btw". That was
wrong and is superseded here. The address lives in exactly one place in the
code, `CONTACT_EMAIL` in `contact-form.tsx`.

**What made the first build too tall, which is the reusable part.** It used the
shared `PageHeader`, and `PageHeader` is a full-bleed band with `py-16 lg:py-20`
and a bottom border, sized for a reading page that has to establish a subject
before a visitor commits to scrolling. **A contact page has no subject to
establish.** It also split the address off from the form with a rule, which
turned one short task into two sections. Both are gone: the page is now a single
column with its own heading, and the whole page including the site footer fits
in a 900px viewport at desktop and at 375px.

**The send is now the only send.** The address moved to a small line beside the
button rather than a headline above the form, so "Send message" is the obvious
action and the address is the fallback for a visitor whose phone has no mail
client. It still composes a mailto and opens their own mail app, for the reason
in entry 104: there is no mailer in this monorepo and adding one is Jon's call.

**One deliberate departure from the reference layout, and it is not a
shortcut.** The reference collects the sender's email address and name, which a
real server-side form needs in order to reply. **A mailto does not.** The
address is whatever account their mail app sends from, so a "your email" box
here would either do nothing or paste an address into the body of a mail that
already carries it in its headers. The two fields a draft actually needs are
subject and message, which is also less to scroll. **If this ever becomes a
server send, the email and name fields come back with it**, because at that
point they stop being decorative.

### 106. The mission page is set as a document, not a landing page section

**Jon, 20 August 2026, on the previous layout:** "I hate the look. It looks so
awful, like the massive 'why I built this' at top then the massive space gap...
Give it a title and a date smaller underneath and go right into it." And
separately, on the rule under the hero: "that bar that separates the header and
the bottom, I know it doesn't look good. Make it look cleaner."

**Layout only. Not a word of the prose changed.** The argument and the voice
were ratified in entries 92 and 93 and were not reopened.

**What changed.** The full-bleed hero band with `py-16 lg:py-20` and its bottom
border is gone, and so is the second bordered section under it. The page is now
one card panel (`bg-card`, one point of lightness above the page background,
same relationship as the boxes on the home page) sitting on the page with an
860px outer column. Inside it: the title at 27px rising to 32px, the date at
13px directly beneath with 6px between them, then the opening paragraph. The
small bold stacked headers Jon asked for in entry 93 stayed; only the spacing
around them changed, from 40px between blocks to 28px, and from 12px under a
header to 8px.

**The measure is the point, and it is the reason this page is not full width.**
Body text is held at 68 characters a line, measured at 714px on a 16px face,
which sits inside the 65 to 75 that prose needs to be readable. An essay set
across a 1180px container is the defect the old page had underneath the
spacing problem.

**The date is 20 August 2026,** taken from the page's own source header, which
is the day the prose was written. The page carried no visible date before this
pass, so this is the first time a reader sees one.

### 107. The contact page's privacy line, and the policy section behind it

**Jon, 20 August 2026:** remove the standalone blurb under the form, put the
privacy line in its place as the reference layout had it, and update the privacy
policy to cover this use.

**The privacy line is worded for a mailto, not for a form, and that is the whole
point of the entry.** The reference layout says "Your address is used to reply
and nothing else", which is the right promise for a form that posts an address
to a server. **This page has no address to post.** The button hands a draft to
the visitor's own mail app, so their address arrives in the mail headers rather
than from a box on the page. Copying the reference sentence alone would have
described a collection that does not happen. The line now says both halves:
nothing is sent from the page and nothing typed there is stored, and once the
mail does arrive the address is used to reply and for nothing else.

**The policy gained a section called "When you write to us", and the same
distinction drives it.** First paragraph: the page sends nothing and stores
nothing, and the message does not exist anywhere until they send it themselves
from their own app. Second: what arrives is ordinary email, the address is used
to reply and is not added to a list or joined to an account or to anything they
have scanned, correspondence is kept only as long as it is useful, and it is
deleted on request.

**One real disclosure that was easy to miss: the inbox is Gmail, so Google holds
the mail.** The "Who else is involved" table listed Google for sign-in only.
That row now reads "Runs the inbox you write to, and sign-in if you choose it",
because a visitor writing to us is handing their message to Google whether or
not they ever sign in. **"Your rights" also gained the promise to delete
correspondence**, since before this there was genuinely nothing to delete and
now there is.

**Date bumped to 20 August 2026**, per the page's own Changes section and the
discipline set at entry 46's analytics change: the policy and the behaviour ship
together or the policy is a false statement.

### 108. The pricing page rebuilt: the price is the hero, the credit is taught before it is spent, and no button pretends to sell

**Jon, 20 August 2026, ordering the rebuild:** *"we need to do an overhaul of
our pricing page. It looks terrible. Like it is, it truly couldn't be worse."*
Plus the brief: it must be beautiful, the price must **jump out**, it must be
obvious what a dollar buys, and it must hold up on a phone.

**THE AUDIT FIRST, because the shape of the fix follows from it.** Six defects,
and the first one was live and wrong rather than merely ugly.

1. **It advertised a free tier that no longer existed.** "Three sanitises on us
   before you sign up, and two more credits the moment you do" is entry 67's
   split, which **entry 97 reversed to 2 + 3** the same week. A live page was
   promising the wrong numbers in both directions.
2. **The headline sold the free thing.** "Scanning is free. Forever." at 52px on
   the one page whose job is a purchase, with the first number 380px lower.
3. **The prices did not read as prices.** 34px in a mono face that spaced them
   **"$4 . 99"**, three near-identical grey boxes, and the page's only colour
   spent on the least important element in the middle card.
4. **A credit was never translated into anything a student owns.** "10 credits,
   50¢ per credit" and nothing else. The conversion from dollars to their own
   document, which is the single most persuasive thing available on this page,
   appeared as an abstract feature bullet 400px below the buttons.
5. **Three dead buttons.** "Get Starter", "Get Plus" and "Get Pro" all quietly
   delivered a sign-up form, with the explanation set as 12.5px grey text
   underneath, after the click decision.
6. **On a phone it was four stacked full-width slabs**, the free banner eating
   the entire first screen and the first price roughly 900px down.

**WHAT REPLACED IT, and the ordering is the argument.**

**The unit is taught before it is spent.** A card in the hero reads
`① = 1,000 words of pasted text`, `① = one Word document, any length`,
`① = one PNG or JPG, any size`. Same grammar three times. Every price below that
point is quoted in credits, and a term used before it is taught is a defect the
messaging skill names explicitly.

**The headline carries a number.** "5 credits free. Packs from $4.99", the $4.99
in the product's own orange. The price is on the first phone screen, in the
headline, before any card is reached.

**The price is the hero of each card.** 56px to 62px against 15px body, set as
three pieces (`$`, the figures, `.99`) with `tabular-nums`, so the decimal sits
tight and the three prices stack straight. The rate sits directly under the
price because it qualifies the price, not the quantity. The Plus card is a full
orange gradient with a white button, which is the page's colour moment and lands
on the element that should win.

**A slider answers Jon's actual question.** "Work out what you actually need"
takes a word count and returns the credits, the smallest pack that covers it,
and the change left over. **Its arithmetic is the server's arithmetic**, mirrored
from `costFor`: `max(1, ceil(words / 1000))`. Verified live at three points: 500
words is 1 credit and the free five cover it, 8,000 is 8 credits and Starter with
2 left over, 100,000 is 100 credits and Pro exactly.

**NO BUTTON ON THIS PAGE PRETENDS TO SELL, which was Jon's instruction and is
also the researched answer.** All three read **"Create free account"**, which is
exactly what they do, and a status bar sits **above** the grid rather than
apologising below it: *"Card checkout opens shortly. These prices are locked in.
Create your free account now, take 3 more credits with you, and buying is one
click the day it opens."* **A disabled button was rejected on evidence**: NN/g
and Smashing both document that users abandon rather than investigate, and a
tooltip does not exist on a phone, which is where this traffic is.
**Wiring Stripe is three hrefs, three labels and deleting the status bar. No
layout moves.**

**THE CLAIMS BOUNDARY GOT THE MOST CAREFUL BLOCK ON THE PAGE**, because a
pricing table is the easiest place in this project to write a sentence true of
one layer as though it were true of all three. The three layers run in **one
shared shape**: what it is, what happens to it, and a status pill.
**Invisible characters: "Proven on every run". File metadata: "Proven on every
run". The statistical watermark: "Best effort, and not verifiable yet"**, in an
outlined pill rather than a solid one, so the difference is visible before it is
read. `03-pricing.md` section 8's strongest sentence is set at 19px rather than
as a footnote.

**FLAGGED FOR JON, AND IT IS THE ONE THING DELIBERATELY LEFT OFF.**
`03-pricing.md` **P6 proposes a 30 day no-questions refund of unspent credits**,
and the reasoning is good: a refund costs 56 cents where a dispute costs about
$24.50. **Entry 67 ratified "pricing and free credits" and did not reach P6**, so
it is not a ruled policy and it does not appear on a live page as though it
were. **It is the strongest trust line still available on this page.** One word
from Jon puts it on.

**ALSO FLAGGED: the pack names depart from entry 67 and this is the second
session to do it.** Entry 67's table names them **Taster, Standard, Pro**; the
shipped page has used **Starter, Plus, Pro** since it was built. Kept, because
"Taster" reads British to a US college student, but recorded rather than left
silent, since `CLAUDE.md` section 2 makes the document govern where it decided
something. **Jon's call.**

**Researched rather than guessed.** A background agent measured live pricing
pages in a browser at 390px. Three findings changed the build. **Card height is
the whole mobile problem**: Canva fits three tiers in 1.5 viewports at 375px per
card by keeping feature lists out of them, while ChatGPT's run 598 to 683px and
ElevenLabs' 786px, burying tier three two swipes down. **Ours are 345 to 349px
and tier three starts at y=1640 on a 390x844 phone**, inside the second screen.
**`tabular-nums` is the emerging standard** on prices (ChatGPT and ElevenLabs
both set it) and the old page did not. **Superscript cents have no evidence
base**: GoodUI aggregates two tests over 222,414 visitors and calls it
inconclusive, so the cents are full-size decimals.

**Two research findings were noted and NOT acted on, deliberately.** The web
reference class tops out at about **2x body size** for a price and this page runs
**3.7x**; that is a departure taken on purpose, and Huang (2025) supports it for
exactly this cell, an unknown brand with genuinely small numbers. And **fading in
an LCP element delays LCP**, which the hero's `animate-rise` does; it is left
because it is the whole site's motion grammar and changing it here alone would
make this page the odd one out. **Both are Jon's to overrule.**

**RENDERED AND LOOKED AT, at 1280px, 768px and 390px.** Tap targets measured at
49px for the pack buttons and 40px for the calculator chips, against Apple's
44pt guidance. No horizontal overflow at 390px, `scrollWidth` equal to
`innerWidth`. No console errors. Three pack cards of equal height on one line
each, no wrapped buttons.

**Files:** `app/(marketing)/pricing/page.tsx`,
`app/(marketing)/pricing/_components/pricing-data.ts` (the prices in one place),
`app/(marketing)/pricing/_components/credit-calculator.tsx`. **Nothing outside
`/pricing` was touched**; the closing band reuses `CtaBand` unchanged.

**One trap worth recording:** `_components/workbench/credits.ts` carries a
`'use client'` directive, so a Server Component importing `WELCOME_CREDITS` from
it gets a client reference back rather than the number. The three constants are
restated in `pricing-data.ts` with a comment saying why and to keep them in step.

### 109. Jon's pass on the new pricing page: one universal credit rule, the page reads as live, and the boundary summary comes off

**Four rulings, 20 August 2026, immediately after `04` entry 108 shipped.**
Recorded separately because two of them override things this project had
previously decided, and one of those is the governing document.

**1. ONE UNIVERSAL RULE FOR FILES.** His words: *"let's just make this
universal. 1 credit = 1,000 words of text. 1 credit = 1 file. We don't need to
separate word document on one row and then png/jpg on next row."* The hero card
is now two rows instead of three.

**He is right and the reason is better than brevity.** A Word row and a PNG row
taught the visitor to hunt for their own file type in a list, and **a list
invites the question of what is missing from it**, which on this product is
PDFs, the one thing the page may not discuss at all. One rule for every file is
also closer to what the server actually does: `costFor` charges a flat credit
per file entry regardless of kind, `04` entry 71. The accepted types moved to
the card's footer line, where they read as an answer rather than as a menu.

**2. THE CREDIT RULE COMES OUT OF THE STANDFIRST**, because the card beside it
now says the same thing in two lines: *"remove this from text at top because
diagram box at right shows you this."* The standfirst is now about the offer
rather than the unit: buy once, never expires, no subscription, no monthly
reset, nothing to cancel. **The duplication was real and this is the right half
to keep.**

**3. THE PAGE READS AS LIVE. Jon's ruling, against this session's design and
stated as final in advance:** *"make this seem like it is live universally.
Remove card check out opens shortly and faqs all the small callouts that say
checkout opens shortly. Just listen to me on this."* Removed: the status bar
above the pack grid, the caption under all three buttons, and the FAQ entry
"Can I buy a pack right now?". **The word "checkout" no longer appears anywhere
on the page**, verified in the rendered DOM.

**The buttons now read "Purchase now" and route to sign-up.** That is his shape:
*"if you click it guides you to create your account then brings you to
payment."* **The second half does not exist yet.** He was told plainly that
this means a button promising a purchase currently delivers a sign-up form, and
he ruled anyway, which is his call to make. **This reverses entry 108's "no
button pretends to sell" and it is the one line to change the day Stripe lands:
the three `href` values, nothing else.**

**Not done, and worth knowing why:** routing them back to /pricing after sign-up
would be the honest halfway house, but `app/auth/sign-up/page.tsx` hardcodes
`pathsConfig.app.home` as the destination and carrying a return path through
means editing `packages/features/auth`, which is another session's. **Left
alone rather than reached into.**

**4. THE BOUNDARY SUMMARY SENTENCE COMES OFF, AND THIS OVERRIDES THE GOVERNING
DOCUMENT.** He instructed the removal of *"Two of the three checks are provable,
and we show you the proof. The third is best effort and we say so"* along with
the "Exactly what we can and cannot do" link beside it.

**`03-pricing.md` section 8 names that exact sentence as the one carrying the
most weight on this page**, and calls it a competitive advantage rather than a
disclaimer, because no competitor can write it. **Surfaced rather than resolved
quietly, per `CLAUDE.md` section 2, which also puts Jon above the document.
Removed.**

**THE BOUNDARY ITSELF IS UNTOUCHED AND THAT IS WHY THIS IS NOT A CLAIMS
PROBLEM.** The three layer cards still run one shared shape with a status pill
each, and **the statistical watermark still carries "Best effort, and not
verifiable yet"** in an outlined pill against the other two solid "Proven on
every run" pills. **The removed sentence was a summary of what those three
pills already say one at a time.** Nothing on the page now claims layer B is
proven, and nothing claims a watermark was removed. **If a future session wants
the sentence back, this entry is the argument for it, and section 8 is the
document that wants it.**

**MEASURED AFTER THE CHANGES, at 390x844.** Pack cards **315, 319 and 319px**,
down from 345 to 349, and **tier three now starts at y=1393**, down from y=1640,
because the status bar and three captions came out. Buttons 49px. No horizontal
overflow, `scrollWidth` 390. No console errors. The only remaining
`/capabilities` links on the page are the shared header and footer navigation,
which are not this page's and were not touched.

### 110. Security fixes: the free-credit doors close by inbox, not by network, and the audit's per-IP number is deliberately not used

**21 August 2026, implementing `docs/session-notes/security-audit.md`.** Three
rulings worth keeping, because two of them depart from a number the audit
already derived and one corrects a premise the work was briefed on.

**1. THE PER-IP CAP ON ANONYMOUS GRANTS IS 60/HOUR, NOT THE AUDIT'S 5.** The
audit derived 5 new anonymous sessions per hour per IP before it was confirmed
that Cloudflare Turnstile is genuinely enforced. It is — verified this session
against the live project: `signInAnonymously()` returns
`captcha_failed: captcha protection: request disallowed`. So every anonymous
account already costs a human solving a captcha and the attack is not
scriptable, which is the same correction Jon applied to the signup path. Against
that, **this product's audience is students, and a campus, a school or a mobile
carrier is one IP for hundreds of real people.** A cap of 5/hour would lock out
a lecture hall of genuine first-time users, the exact failure the audit itself
warns about. 60/hour serves a full lecture hall and still stops industrial
farming. **The cap counts grants actually paid, not requests**, so ordinary
repeat visitors never consume the budget, and **at the cap the account still
works** — it only goes without the giveaway. The constant is
`ANON_GRANTS_PER_HOUR_PER_IP` in `credits.ts`, one line to retune.

**2. THE REAL DEFENCE AGAINST "ONE PERSON, MANY ACCOUNTS" IS IP-BLIND.** The
signup grant is now keyed to a normalised email **inbox** rather than an
address, so `student+1@` and `student+2@` collect it once. This is the mechanism
doing the work, and it is deliberately blind to the network: 300 students on one
campus IP are 300 different inboxes and every one is served. The per-IP cap is a
backstop behind it, not the primary control. **The two are one mechanism sharing
one counter, per the brief, not two competing ones.**

**3. THE BRIEF'S PREMISE ABOUT ACCOUNT DELETION WAS WRONG, AND VERIFYING IT WAS
THE INSTRUCTION.** The work was briefed that deleting an account cascades the
credit ledger away and that the privacy policy relies on it. **It does not.**
`credit_ledger.account_id` does cascade from `public.accounts`, but
`public.accounts.id` carries **no foreign key to `auth.users`** — confirmed in
`20241219010757_schema.sql` and confirmed live by an orphan `accounts` row with
no matching auth user. `auth.admin.deleteUser()` removes the sign-in and leaves
both the account row and the ledger standing. **The privacy policy already says
exactly this**, having been corrected by an earlier session. Nothing false is on
the site and nothing was broken; the append-only trigger preserves the cascade
that does exist. **Adding `accounts.id references auth.users on delete cascade`
is Jon's call and changes the legal page in the same deployment** — recorded in
`06` as open rather than decided here.

## 21 August 2026, session 11. The Stripe session

### 111. The pack names are ratified as Starter, Plus and Pro, ending two sessions of drift

**Ruling. Jon, 21 August 2026, asked directly because the names were about to be
typed into Stripe, where they appear on the checkout page and on every receipt.**

**The drift, stated plainly, because this is the third document to carry it.**
`04` entry 67's ratified table names the packs **Taster, Standard, Pro**. The
page that shipped, and `pricing-data.ts` behind it, have said **Starter, Plus,
Pro** since they were built. `04` entry 108 flagged the departure and kept it,
on the grounds that "Taster" reads British to a US college student, and
explicitly left it as Jon's call. **It stayed open through a second session and
is now closed.**

**Starter, Plus, Pro.** No code and no copy changes: the live page, the live
site and `pricing-data.ts` already agree, and now the document does too.

**Why it needed asking rather than assuming.** `CLAUDE.md` section 2 makes the
document govern where it decided something, and entry 67 decided this. A session
that quietly kept the page's names would have been overriding a ratified entry
without saying so. **The names are also about to stop being editable cheaply:**
once they are on a Stripe Product they appear on receipts and in a buyer's card
statement history, and changing them later makes old receipts disagree with the
site.

**`04` entry 67's table is amended on this row only.** The prices, the credit
counts and the words-per-credit are untouched and remain as ratified: $4.99 for
10 credits, $9.99 for 25, $24.99 for 100, one credit buying 1,000 words.

### 112. Stripe is set up as a US individual, and the product description leads with the provable layers

**Ruling. Jon, 21 August 2026, approving the account walkthrough and both
installs** (`stripe` into `apps/web`, and the Stripe CLI globally so webhooks can
be proven locally rather than asserted).

**The framing decision, which `03-pricing.md` section 12b called the highest
leverage sentence in the process.** Two descriptions of this product are both
true, and a payments risk reviewer treats them very differently. The account's
product description leads with the **provable data-hygiene layers** — invisible
Unicode characters, EXIF and XMP metadata, C2PA provenance records — states the
prices and the credit rule, and **makes no claim about detectors or detection
scores at all.**

**This is not concealment and the reasoning matters.** Layers A and metadata are
deterministic and provable; the rewrite is best effort and unverifiable
(`CLAUDE.md` section 4). A description promising a detection outcome would be a
claim this project cannot stand behind, written into the one document a risk
reviewer reads first. **The honest description is also the safe one, which is
the unusual luxury this product has.**

**Stripe's own validation note makes consistency mandatory rather than
optional:** *"Website content should match your business name and product
description."* The description was written to match the live site's register,
not to differ from it.

**The full field-by-field walkthrough, with what was verified against Stripe's
live requirements endpoint and what is flagged as unknown, is in
`docs/session-notes/stripe-setup.md`.**

### 113. The 30 day refund goes on /pricing as OUR POLICY, and the statutory right is carried separately

**Ruling. Jon, 21 August 2026.** Closes a question three sessions have now
touched, and it closes it with a correction that matters more than the ruling.

**The history, because it is the flagging system working rather than a
mistake.** `03-pricing.md` P6 proposed a 30 day refund of unspent credits. `04`
entry 67 ratified "pricing and free credits" and **did not reach P6**, so the
session that rebuilt /pricing (`04` entry 108) refused to advertise an unruled
policy and left a flag. This session found the flag when it became decision
relevant. **One session raised it, another surfaced it a day later. That is the
system behaving correctly.**

**THE INCONSISTENCY THAT FORCED THE RULING.** The **live terms of service
already promise it**, word for word: *"Within 30 days of a purchase you may ask
for a refund of any credits from it that you have not spent, at the price you
paid, and we will not ask you why."* **So the policy was already binding in the
legal document while the marketing page withheld it out of caution.** The
caution had been overtaken by events.

**Ruled: it goes on /pricing.**

**JON'S CORRECTION, AND IT IS THE LOAD-BEARING PART OF THIS ENTRY.** Our refund
and the statutory right of withdrawal are **two different things**, and the page
may not blur them:

| | What it is | What it covers |
|---|---|---|
| **Our 30 day refund** | **A voluntary policy** we chose | **Unspent credits only**, at the price paid |
| **UK/EU right of withdrawal** | **A statutory right**, not ours to define | **Everything, including spent credits** |

**Presenting the voluntary policy as "your right to cancel" would be a false
claim in a legal register**, which is the precise error `CLAUDE.md` section 7
exists to catch: a sentence true of one thing written as though true of another.
**So /pricing describes OUR POLICY in our words, and the checkout consent
wording carries the STATUTORY RIGHT separately.** Both will exist. Neither
stands in for the other.

**A SECOND CORRECTION FROM JON, ON THE ARITHMETIC.** `03-pricing.md`'s
"a refund costs $0.561" is **modelled on a $9 pack that no longer exists.** It
transfers almost exactly to the $9.99 Plus pack, so the conclusion is sound, but
**the figure must not be quoted as if measured against the real prices.** The
honest form of the argument is the **ratio**: a refund costs under a dollar, a
dispute costs about $24.50. **Roughly 40 to 1, and that is the whole case** —
advertising the refund is how someone who would have called their bank becomes
someone who sends an email instead.

**Also ruled, in passing:** the live site being ahead of nothing is not a
problem, because **the site has no traffic yet**. Jon: *"I know it's live but no
one knows about this site yet so zero traffic, it's okay."*

**Deferred by Jon, deliberately:** the full reconciliation of the privacy policy
and the terms **happens after Stripe setup is finished**, not during it.

### 114. The payment path is tested, and the audit found more in the OLD code than in the new

**21 August 2026. Jon: "This is real people's money, real logic, everything.
This, our whole system has never really been tested. So really stress it."**
He was right to say so, and the result justifies the instruction: **the two worst
defects found were not in the Stripe code at all.**

**WHAT IS PROVEN, each with a run behind it.** `payments-tested.md` has the
output. A real purchase credits a real account. **Three deliveries of the same
webhook produce exactly one ledger row.** 12 refusals on the payment surface all
hold, including a perfectly-shaped forged paid session. 6 signature-forgery
cases refused. 9 migration checks pass.

**THE TWO CRITICAL PRE-EXISTING DEFECTS, both in the credit system:**

**1. `/api/tool/clean` read the guest cookie to decide "is this a conversion?"**
— and `/api/credits` deletes that cookie the moment the merge completes. So every
converted account was later paid the +2 welcome grant it had just been correctly
denied. **This is defect 2 from `guest-merge-double-runs.md`, fixed in one route
and missed in the other**, and `ensureGrants`' own docblock warns against it by
name. Every converting user minted 2 free credits, spendable on the rewrite —
the only layer that costs real money.

**2. The clean route's idea of a "text file" did not match the engine's.** The
route knew four extensions; the engine's `TEXT_EXTS` has twelve, and treats
`.md`/`.markdown` as CONTAINERS. **Wrong in both directions:** a 100,000-word
essay saved as `essay.csv` bought a full rewrite for **one credit**, a 100x
undercharge; and a `.md` upload was **charged per 1,000 words for a rewrite the
engine never runs.** Paying and not receiving, and the reverse, in one function.

**THE WORST DEFECT IN THE NEW CODE was a misread Stripe field.**
`charge.amount_refunded` is a **running total**, and it was read as the amount of
the current refund. Two $3 refunds on a $9.99 pack removed 8 credits then 16 —
24 of 25 — and because the clamp works against the whole balance, the surplus
eats credits from **other, un-refunded purchases**. Fixed by making the caller
pass a **cumulative target** and letting the database work out the shortfall
under its lock: `20260821160000_refund_cumulative.sql`.

**A FALSE COMMENT CAUSED A REAL BUG, and it is worth recording as a pattern.**
`onDisputeCreated` deliberately left the ledger alone, reasoning that Stripe
"will send `charge.refunded` if it is eventually lost". **Stripe does not.** A
lost dispute is `charge.dispute.closed` with status `lost`. Because the comment
was believed, nothing removed the credits: roughly **$40 of loss on a $24.99
sale** — the money, the ~$15 fee, and the customer keeps 100 credits.
**A confident comment is not evidence.**

**THE BUG NO AMOUNT OF CODE READING WOULD HAVE FOUND.** The Stripe account had
**Bank (ACH) enabled** as a payment method, visible only by looking at the real
checkout page. ACH completes the session immediately as `unpaid` and settles
days later under a different event, so a bank payer would have been charged and
received nothing, silently. Fixed twice over: checkout pins
`payment_method_types: ['card']`, and the webhook now handles
`checkout.session.async_payment_succeeded` anyway, **because payment methods are
a dashboard setting that can change with no deploy and no review.**

**METHOD, recorded because it worked.** Six adversarial review lenses over the
money path, every finding then put to three independent skeptics — a refuter, a
database check, and a practical-impact judge — surviving only on 2 of 3. **33
raw findings, 17 survived.** The rejected 16 were mostly concerns the code's own
comments already answered correctly.

**STILL OPEN, recorded rather than fixed:** a forged `uc-guest` cookie can name
another user's anonymous account, because `merge_guest_credits` checks only that
the target is anonymous, not that the caller ever held that session. Rated LOW —
it needs the victim's account UUID and takes at most 2 credits. **In `06`.**

**NOT PROVEN AND SAID SO:** refunds and disputes are written and typechecked but
never fired, because the refund fix changes a database function signature and
the migration is Jon's to paste. The `.csv`/`.md` pricing fix is by inspection
against `format_dispatch.py`, not yet run against the engine.

### 115. Credits are sold to Americans only, the European consumer regime is parked, and the checkout ceremony is Stripe's one checkbox

**Ruling. Jon, 22 August 2026.** Closes the question `legal-research.md` section
3 opened and does it by removing the market rather than by satisfying the law.

**Jon's words, and the reasoning is his:** *"I am a solo developer who may not
get $1 of revenue. I am not worried about a determined EU regulator hunting me
down. Simply reject EU cards for now."*

**WHAT WAS BUILT AND THEN DELETED IN THE SAME DAY, recorded because the reasoning
is worth keeping.** Earlier on 22 August this session applied the full waiver
ceremony for the UK/EU 14 day right of withdrawal: a consent dialog before
Stripe, an unticked checkbox carrying express consent to immediate supply and
acknowledgement of losing the right, a pay button stating the amount, a consent
flag the checkout route refused to proceed without, the consent written onto the
Stripe payment as metadata, and a cancellation section in the terms splitting the
statutory right from our voluntary refund. **All of it was proven working and all
of it is now deleted.** Commit `b965e88` holds it and
`docs/session-notes/legal-applied-stripe.md` holds the law behind it. **If Europe
is ever opened up, that is the starting point rather than a fresh session.**

**THE TRADE, STATED HONESTLY BECAUSE IT IS A REDUCTION AND NOT AN ELIMINATION.**
What decides whether UK and EU consumer law reaches a trader is whether he
**directs activities** at those markets, not which card was used. Refusing non-US
cards and saying so in the terms is good evidence that he does not. It is not a
certificate. **Jon was told this in those words and accepted it.**

**THE HALF THIS DOES NOT CLOSE, and it is the half nobody should later assume
went away.** Restricting **sales** does not restrict **use**. The free tool stays
open worldwide, European visitors will keep pasting text into it, and **GDPR and
UK GDPR still apply to that processing.** The privacy policy, the controller
question and the supervisory-authority question are untouched by this entry. What
is gone is the consumer-contract half: withdrawal rights, the consent ceremony,
distance-selling disclosure, the model cancellation form, the EU trader address
and phone number, and **EU VAT**, which was the item with real money attached.

**US STATE SALES TAX IS NOT VAT AND DOES NOT VANISH.** It has economic-nexus
thresholds of roughly $100,000 or 200 transactions in a single state, so it bites
at nothing like current volume. Parked with that as its trigger.

**THE BLOCK IS BUILT AND PROVEN, AND THE SCOPE IS NARROWER THAN THE TERM.**
Jon's instruction moved during the session and the final one governs: *"I thought
we agreed to just block a EU card to stop the VAT stuff."* An earlier "do not
populate country blocklist" was a rejection of the **scope** proposed at the time,
which was all ~200 non-US countries, rather than of the mechanism.

**`scripts/block-eu-cards.mjs` blocks 31: the EU 27, the three EEA states, and
the UK.** The UK is included deliberately. It is outside EU VAT but it kept the
14 day withdrawal right in CCR 2013, and that right is the reason the list exists.

**Proven in test mode:** a US card authorises; GB and FR come back
`type: "blocked"`, `rule: "block_if_in_blocklist"`,
`network_status: "not_sent_to_network"`. **Two things previously recorded as
unverifiable are now facts: the rule that reads the built-in blocklist is ON BY
DEFAULT, needing no dashboard work and no paid Radar tier, and a blocked card
never reaches the network, so it costs nothing.**

**LIVE MODE IS NOT POPULATED, AND THERE IS NOTHING TO POPULATE YET.** Probing
production on 22 August found `/api/checkout` returns **404** and Vercel holds
**no Stripe environment variables at all**. **The payment path exists only on a
laptop and the live site cannot take a dollar from anybody.** So the live
blocklist is a **launch step**, sequenced with putting the live key into Vercel,
not an outstanding task. `STRIPE_LIVE_KEY=sk_live_xxx node
apps/web/scripts/block-eu-cards.mjs live`, or the same thing by hand in Radar.

**AND A CORRECTION TO THIS SESSION'S OWN FRAMING.** It was written throughout as
though the site were about to take money. **It is not, and the two "false"
sentences in the live terms are true today.** They go false on the deploy that
ships checkout with a live key. The wording is fixed and waiting; there is no
live falsehood to race.

**THE TERM IS DELIBERATELY BROADER THAN THE BLOCK.** The terms say United States
only; the blocklist covers the UK, EU and EEA, which is where the withdrawal
right and the VAT problem actually are. **A Canadian card still completes.** A
term of sale being stricter than its enforcement is ordinary, and the terms
reserve the right to refuse or reverse the rest. **Revisit only if non-US, non-EU
sales start arriving.**

**THE CHECKOUT CEREMONY IS NOW WHAT EVERYONE ELSE DOES, AND THAT WAS THE POINT.**
Jon: *"We shouldn't present the granular details at checkout, just make them
acknowledge they have read the T&C."* Stripe's own `consent_collection` checkbox,
live since entry 112, reading **"I agree to Un-Claude's Terms of Service and
Privacy Policy"**, unticked and required to pay. **Nothing on un-claude.com's own
side: no dialog, no second checkbox, no interstitial.**

**GOVERNING LAW ARRIVES AND D1 CLOSES. California.** Jon operates from there. He
asked whether a friendlier state could be named instead and was told no: **a
California court applies California law to a California trader whatever the
contract says**, so naming another state buys nothing and reads as evasive.
**His legal name and address are deliberately not published, on his instruction.**
The US has no equivalent of the UK DMCC disclosure duty and Stripe holds a
support address separately.

**AND A CONTRADICTION THIS RESOLVES BY ACCIDENT.** `legal-research.md` 9A drafted
the trader as "an individual trading as un-claude from the United Kingdom" while
entry 112 recorded the Stripe account as a US individual. **The research note was
written against the wrong jurisdiction throughout.** Its UK-specific conclusions
should not be reused. Section 11 of that note already admitted no US analysis was
done, and that gap is wider than it looked.

**ONE THING GOT STRONGER BY ACCIDENT.** "Provided as it is, without warranties of
any kind" was flagged as close to unenforceable against a UK consumer. **Against a
US consumer a conspicuous disclaimer of that kind is broadly enforceable**, so
`9E` drops down the list. **The highest-value US addition is now an arbitration
clause with a class action waiver**, which is lawyer drafting and was not
attempted.

### 115a. The 30 day refund stays, and moves off the shop window

**Ruling. Jon, 22 August 2026**, after asking for the audit trail behind it.

**THE AUDIT TRAIL, BECAUSE THE ANSWER SURPRISED BOTH OF US.** Jon asked whether
the policy came from a legally favourable basis. **It did not.** It was proposed
in `03-pricing.md` P6 on **19 August**, two days before any legal research
existed, on **pure Stripe dispute economics**: a refund costs about $0.56 and a
dispute about $24.50, roughly 40 to 1. When the legal research did arrive on 21
August it said the policy **fails** as a substitute for the statutory right,
because it is narrower in scope. **It never positioned us better legally and was
never claimed to.**

**A DEFECT IN THE TRAIL WORTH REMEMBERING.** Entry 67 ratified "pricing and free
credits" and never reached P6, yet **the promise entered the terms of service on
20 August anyway** (commit `3eeffda`), while the pricing page correctly refused to
advertise an unruled policy. **The binding document acquired a promise the
marketing page would not make.** That inversion is what forced entry 113.

**RULED: keep it.** The 40 to 1 arithmetic is sound and it is the only refund
route a US customer has, since there is now no statutory right anywhere in scope.
**Dropping it would not have reduced legal exposure by a penny.**

**RULED: stop advertising it.** Jon: *"I don't want to aggressively advertise it
... only people that are really fed up would go looking for this."* The reasoning
is the same arithmetic read backwards: the policy earns its keep by catching the
customer who would otherwise call their bank, and **not** by reminding a satisfied
customer their money is refundable.

**So it is discoverable rather than advertised, in three places and none of them a
tile:** the small print under the pack grid, the last FAQ answer, and in full in
the terms. **It did not leave the pricing page**, because Stripe's website
checklist expects a visible refund policy and `03-pricing.md` 12c step 8 lists it
as a pre-activation requirement. **Hidden is fine. Absent is an account risk.**
Its slot in the trust grid went to a card-security line, which Stripe's checklist
also wants and which sells where the refund line cost.

**No real sale has ever happened**, confirmed by Jon, so the promise bound nobody
while it was on the page.

---

## 21 August 2026, session 10. The credits interface, density and mobile: a three-phase night

### 116. The credit dead end is answered before it is reached, and sign-up lands back on the tool

**Ruling.** Jon, reporting the funnel by hand: "after you complete 2 scans and use
your 2 free credits it just says 0 left... Most people will see 2 free scans, then
give up because they see their token at zero and not even try again."

**What was wrong, and it was a genuine defect, not a copy problem.** The
empty-balance offer fired only after a *failed* attempt to spend — nobody could
learn that 3 more free credits existed without pressing a button that would not
work. And the paywall box itself had inverted layers: the blurred filler text sat
in normal document flow and the message sat absolutely positioned on top of it,
so the box's height was fixed by the filler and anything taller had its top
pushed off-screen.

**Fixed.** The offer now fires the moment the balance reaches nought — on arrival
as well as on a spend, not only on a failed attempt — and it sits directly under
the balance chip so the eye that reads "0 left" lands on the answer in the same
movement. The offer text became an object rather than a clause buried in a
sentence: a badge with the coin, the figure, a light pop-and-sheen animation
(three runs, not infinite, and collapsing to nothing under reduced motion). The
paywall's layering was inverted so the message sets the height and the filler is
what's absolutely positioned.

**Sign-up now lands back on the tool, not the wallet.** `app.afterAuth` is a new
path, separate from `app.home` (still the wallet, reachable from the account menu
and the header balance pill). Seven call sites across the auth flow now read it.
Landing on the tool carries `?welcome=1`, which triggers "Your credits are ready"
beside the balance so the new grant registers as news rather than as an unchanged
number, then strips itself from the address bar the moment it is read.

**Also, on Jon's mid-session instruction:** the repeat-password field is gone from
sign-up. `refineRepeatPassword` stays in the schema because the password-reset
form still needs it, where there is no email to fall back on.

**What could not be verified from this session.** No local Supabase means the
states needing a real ledger were built and looked at through a `/dev/states`
harness and a display-only balance override, not through a live sign-up.
**The first real sign-up in production is the actual test of the seven
`afterAuth` call sites.**

### 117. Text density is cut on the vendor table and the capabilities matrix, and the claims boundary survives by moving into the cell

**Ruling.** Jon: "Remove those notes entirely. Keep the table. Jon wants the
table to speak for itself," on the vendor table's seven paragraphs of sourced
detail underneath each row. And on the capabilities matrix: "the text can't
carry over... This literally needs to be done in like five words or something."

**Why this is more than a copy trim.** The two-tier claims boundary — provable
layers get "with a receipt," the statistical rewrite gets "measured" — had been
living in a paragraph under the table. Cutting the paragraph without preserving
the distinction would have flattened three different strengths of claim into one
row of prose. Instead every cell now answers for itself in three or four words,
and the register survives inside the cell: "Removed, with a receipt" for the two
provable layers, "Rewritten, and measured" for the statistical one.
**The rule for anyone editing this table later: never give the rewrite a
receipt word.**

**Verified by measurement, not by eye.** At 1280px every cell is one line except
the two-line statistical entry, and nothing overflows its column. At 375px the
matrix folds into one card per input type, with zero elements past the viewport
edge.

### 118. The mobile pass: collapse before cut, because a caveat is the first thing a cut sentence loses

**Ruling, and it is the governing philosophy for the whole pass, not a single
change.** Jon: "There's so much to read and it's just blobs of information and
text... we're going to need to really utilise plus icons to expand sections if
you actually want to look at them... let's be real, we're all brain rotted and
we don't actually read."

**The method this sets, stated because it will recur.** Shorter copy is the
easiest way to overclaim by accident — the caveat is the first thing that gets
cut under space pressure. So nothing load-bearing goes behind a disclosure
control: the claim, what the product actually does, and the limits stay outside
it on every page. What moves behind a plus is explanatory prose a phone reader
can skip without losing the argument. **The claim pill on /pricing — "Proven on
every run" against "Best effort, and not verifiable yet" — is explicitly not
collapsible**, because it is the claims boundary doing its work on the page
where money changes hands.

**Result, measured at 390px, phone screens of scroll:** home 4.9 → 4.2,
how-it-works 8.0 → 6.4, capabilities 4.0 → 3.4, mission unchanged (Jon's own
essay, untouched on principle), pricing 7.5 → 6.5, contact 1.6 → 1.4. Four and a
half screens removed site-wide, with every word that survives still reachable at
every width and nothing deleted. Fifty-six width/page combinations checked for
horizontal overflow: zero failures.

**Found in the same pass, not asked for, and it mattered more than any of the
planned cuts:** the sign-up page never told an arriving visitor about the 3 free
credits every surface sending them there had promised. Fixed with the same
badge used elsewhere.

**Not reached, and said so rather than silently skipped:** the wallet at `/home`
could not be rendered signed-in from this session (no local Supabase) and
inherited only the shared padding fix.

---

## 21 August 2026. The guest merge and account deletion: bugs that had never been exercised until tonight

### 119. The guest merge had never run, and when it finally did it was wrong in two independent ways — both minting credits

**What happened.** Sign-up itself was fixed by a parallel session (a missing
foreign key), and the guest merge — the code that carries a visitor's credits
onto the account they create — ran for the first time in this project's history.
Jon watched it happen: started as a guest with 2 credits, spent 1, signed up,
expected 4, got 5.

**Defect one: the merge is not idempotent and races with itself.** Two
components independently call the balance route on page load, and the merge
lived inside that route with no record that it had already run. Two concurrent
calls both read the same starting balance and both transfer it — the account
gets the credit twice and the guest goes negative. Nothing capped this at two:
the transfer multiplies with however many concurrent requests carry the guest
cookie.

**Defect two: the conversion flag depends on a cookie the same route deletes.**
The route decides "is this a conversion?" by reading `uc-guest`, then deletes
that cookie sixteen lines later. Every call after the first sees no cookie,
decides this is not a conversion, and pays the welcome grant a second time —
the exact 7-credits-against-a-ratified-5 drift the security audit had already
flagged as a risk, now confirmed live and reproduced on command.

**The fix, and why a table rather than the pattern the welcome grants already
use.** The welcome and signup grants are protected by partial unique indexes —
one grant per account, enforced by the database. That pattern cannot protect
the merge, because a guest who has already spent everything converts with zero
credits to move and writes no ledger row at all (`delta <> 0` is enforced), so
there is nothing for an index to catch. A new table, `guest_conversions`, with
`guest_id` as primary key and `account_id` unique, claims the conversion record
*before* moving anything, so the loser of a race gets nothing rather than a
share. The transfer itself moved into a locking SQL function,
`merge_guest_credits`, for the same reason `spend_credits` already exists as
one: the check and the write have to be one indivisible step. The merge now
runs before the grants, so the grant decision reads a permanent fact rather
than a cookie about to disappear.

**A third hole closed in the same migration, found rather than designed for.**
`account_id unique` means an account can only ever convert once. Without it,
signing out, collecting a fresh guest welcome grant, and signing back in would
merge it across every time — repeatable at will.

**Verified against the live ledger, including the actual race.** Both the
already-converted branch (ten simultaneous merge calls on a converted pair: all
ten return 0, nothing written) and the fresh race (two calls arriving before any
conversion record exists) were run for real. The fresh race produced exactly
one `transfer_out` and one `transfer_in` where the old code produced two of
each, every time.

**The product trade-off this creates, stated as a trade rather than smoothed
over.** An account now carries guest credits across exactly once, ever. The
cost: a signed-up user who later uses the tool signed out and signs back in
leaves whatever that guest session earned stranded on the guest. The
alternative is unlimited free credits, so this is deliberate — but it is
product behaviour, not an implementation detail, and had not been put to Jon as
of this entry.

### 120. Account deletion actually deletes now — the missing foreign key, why a database constraint rather than a line of application code, applied and verified twice

**The defect.** Pressing "delete account" destroyed only the sign-in. The
`accounts` row — holding the person's email address and name — and their
entire credit history both survived. Someone exercising a data-protection right
got the opposite of what the button promised.

**Why.** The deletion chain has three links and only two existed.
`credit_ledger.account_id` really does cascade from `accounts.id` — the only
`on delete cascade` in the whole schema. But `accounts.id` carried no reference
to `auth.users` at all; its key column was a bare default-generated UUID. The
delete button calls exactly one thing, `auth.admin.deleteUser()`, which removes
the sign-in and nothing else. **This is the same finding the security audit
reached and, separately, that a legal reconciliation pass reached — both read
the schema and got the same answer independently, which is itself worth
noting: the finding did not depend on any one session's care.**

**The choice: a foreign key, not a line in the delete service.** The button is
not the only way an account gets deleted — Jon deleted several from the
Supabase dashboard directly while this was being investigated. A line inside
`delete-personal-account.service.ts` would protect exactly that one path and
would go on looking like it protected all of them, including a failure mode a
database constraint cannot produce: if application code deleted the account
row and the sign-in delete then failed, the result is the inverse orphan, a
live sign-in with no account, breaking the app for a real person underneath
them. The database performs both halves or neither.

**Confirmed rather than assumed that the key is correct.** Every `accounts` row
in this database is written by exactly one trigger, keyed to the auth user's
own id — there are no team accounts in this schema, only inherited starter-kit
comment text that mentions them. Live check: 15 auth users, 15 non-orphan
accounts, zero auth users without one.

**The interaction with the append-only ledger trigger, reasoned through before
it could be tested.** The security session's append-only trigger (still
unapplied at the time this migration was written) refuses direct UPDATE/DELETE
on `credit_ledger` but allows a cascade, telling the two apart by whether the
parent `accounts` row is already gone. Adding this foreign key makes the
cascade run one level deeper — `auth.users → accounts → credit_ledger` — and
the parent is still already gone by the time the ledger trigger fires, so the
allow branch is the one taken. This could not be executed locally (no Postgres
on the machine) and was proved live instead, twice, after Jon applied it.

**The orphans.** Nine `accounts` rows already existed with no matching sign-in
— every account ever deleted before this fix. The migration refuses to add the
constraint while any exist, printing the full list rather than silently
discarding real records; Jon confirmed all nine were his own testing, and a
`begin…commit` sweep removed them, backed up first since the free Supabase plan
takes no backups.

**Applied and proved, twice, against the live database.**
`node scripts/verify-account-deletion.mjs`: create an account, give it real
credit history, press delete, read what's left. Before the fix: sign-in gone,
account row and all three ledger rows still present. After: all zero. Re-run
later the same day for an unrelated reason: same result. **This corrects an
earlier note that the fix was "recorded as open rather than decided here" — it
was decided, applied, and is now standing.**

**In the same commit, per the standing rule that a legal page changes when the
code that makes it wrong does:** the privacy policy's deletion paragraphs
moved from "does not by itself erase the record" to "deletes your account
record and your entire credit history with it... in that moment, not marked for
removal later."

---

## 21 August 2026. Security, backups, and the auth surface

### 121. The security audit's two worst findings were not in new code — they were pre-existing defects the audit surfaced by actually stress-testing the system

**Context.** Jon: "This, our whole system has never really been tested. So
really stress it." A read-only, multi-lens audit ran over the credit system and,
separately, the file-upload path.

**Found and fixed, ranked by what could actually cost money.**

- **A free, no-login PNG upload could crash or hang the server for nothing.**
  The zTXt/iTXt metadata decoder called `zlib.decompress()` with no output cap,
  so a 199 KB crafted chunk aimed at 200 MB drove the function to 438 MB of
  heap in 255ms — reachable through the free scan endpoint with no account and
  no rate limit. Fixed with a bounded-inflate helper mirroring the cap already
  applied to `.docx` zip bombs; peak heap for the same attack dropped to
  8.6 MB. Eight new tests, all passing, no regression in the surrounding image
  suites.
- **Plus-addressed and dotted email variants could each claim a fresh signup
  grant from one real inbox**, with no limit anywhere on how many accounts one
  person could farm this way. Fixed with `normalizeEmail()`, applied to Gmail's
  dot-and-plus rules specifically (not to every provider, since other
  providers' dots are meaningful) and enforced with a partial unique index on
  the normalised address.
- **The `credit_balance` RPC leaked another account's balance to any signed-in
  caller** who knew the account id, via a `security definer` function granted
  to `authenticated` with no self-check. Fixed by splitting it by arity: a
  no-argument form that always resolves to the caller, and a `uuid` form
  restricted to `service_role`.

**Ledger hardening, built as insurance against Jon's decision to stay on
Supabase's free plan (entry 122).** Every writer to `credit_ledger` was audited
and confirmed append-only already; a trigger now makes the database itself
refuse UPDATE, TRUNCATE and any direct DELETE, distinguishing a real cascade
(parent row already gone) from a direct attack (parent still present) the same
way the account-deletion fix in entry 120 relies on.

**Rate limiting built, not yet wired everywhere.** A Postgres-backed counter
(no new dependency, no new service) with the audit's numbers applied —
20/minute per IP on the free scan, 10/minute per account on the paid clean,
60/hour per IP on new anonymous grants — and it fails open by design: if the
limiter itself errors, the request is allowed rather than the free tool going
down for everyone. `proxy.ts` still excludes `/api/*`, so this is per-route
rather than site-wide by design, because the account-aware keys have to live at
the route anyway.

**The 60/hour figure is a deliberate departure from the audit's own
recommendation of 5, and the reasoning matters.** The audit derived 5 before
confirming Turnstile is actually enforced on anonymous sign-in; it is. Each
anonymous account already costs a solved captcha, so this isn't scriptable at
volume, and a cap of 5 would lock out a lecture hall of genuine students
sharing one campus IP. The real defence against "one person, many accounts" is
the per-inbox dedupe above, which is IP-blind on purpose — 300 students on one
IP are 300 different inboxes and every one is served.

**Not fixed, deliberately, and recorded rather than patched under time
pressure:** a forged `uc-guest` cookie can still name another user's anonymous
account and pull its balance across, because `merge_guest_credits` checks only
that the target is anonymous, not that the caller ever held that session.
Rated low risk by a later payment audit (needs a UUID that is never published,
and the take is at most 2 credits).

**Four migrations were written and reasoned through but not executed** — no
Postgres, Docker or Supabase CLI exists on this machine, and installing one
needs Jon's approval. All four are pasted, idempotent, and wrapped in
`begin…commit`.

### 122. Supabase stays on the free plan: zero backups, accepted knowingly, with the code hardened as the substitute

**Ruling.** Jon declined both the $25/month Pro tier (nightly backups, 7 days)
and the $100/month point-in-time-recovery add-on.

**Reasoning.** Traffic and volume don't justify either yet. **The consequence
stated plainly rather than left implicit: as of this decision, the credit
ledger has zero backup protection — if it were lost or corrupted, there is no
way to restore it.** That shifts the priority from insuring against corruption
to making corruption unlikely in the first place, which is most of the
reasoning behind entry 121's ledger hardening: an append-only table with no
UPDATE or DELETE anywhere in the codebase has no number for a bug to set
wrongly, because a balance is never stored, only summed.

**The stopgap, built the same day.** `backup-credit-ledger.mjs`,
dependency-free (Node built-ins only), dumps the whole ledger to a timestamped
CSV. Run and verified against the live table. **Not a substitute for real
backups — better than the nothing the free plan gives**, and cheap enough to
run on a schedule.

### 123. The auth surface: terms acceptance added without switching on the starter's own mechanism, and a real bug in "you cannot update your password" fixed

**What was missing.** Nobody had ever agreed to the terms — no checkbox, no
sentence, the only route to the terms a footer link — and either sign-up route
(email or Google) created a real account with no acceptance behind it.

**The starter kit has a mechanism for this, and it was deliberately not used.**
`TermsAndConditionsFormField`, behind a feature flag, only renders inside the
email/magic-link forms — the Google button never sees it, so switching the
flag on would have covered one of two account-creation routes and looked like
it had covered both. One sentence under both buttons instead: *"By creating an
account you agree to our Terms of Service and Privacy Policy,"* both links
real. **If the starter's checkbox is ever wanted, the choice is between the two
mechanisms, not both at once** — and whoever flips that flag should know it
isn't wired to validation at all yet; nothing beyond the browser's own
`required` attribute enforces it.

**A real bug, reproduced for the first time.** "You cannot update your password
because your account is not linked to any" was shown to accounts that had just
set a password. The check asked `amr` — how *this session* signed in — rather
than whether the account *has* a password identity at all. A session created
by clicking the sign-up confirmation link authenticates by `otp`, not
`password`, so anyone who confirmed by link and never happened to sign in with
a password again hit this warning permanently. Reproduced end-to-end on a
throwaway account and fixed by checking the account's actual identities
(`getUser()`) rather than the session's claims (`getClaims()`), which cannot
answer the question because `identities` was never a JWT claim to begin with.

---

## 21 August 2026. Layer B's timeout, and what the SEO and legal read-only passes found

### 124. Layer B's 60-second cap raised to 300 seconds, after production timing showed a document colliding with it mid-retry rather than mid-work

**What was measured, on production, through the real UI, not locally.** A
1,000-word document in real prose completed in 7.4 seconds. A 2,000-word
document — the largest reachable under a single guest's 2 free credits without
spending real money — failed at approximately the 60-second mark with the
engine's own internal failure code, not a raw platform timeout page.

**Why they fit together.** Each chunk's model call has its own 45-second
timeout and retries with no internal deadline of its own on top of that. The
2,000-word failure landing right at 60 seconds looks like a chunk hitting its
45-second call timeout, retrying, and running out the platform's 60-second
clock before the retry could return — a platform collision, not evidence the
rewrite itself needs a full minute for 2,000 words.

**Fixed:** `maxDuration` on `api/*.py` raised from 60 to 300 seconds, Vercel's
current documented Fluid Compute default. Considered and set aside:
background-job chunking (architecturally correct for very large documents, but
real work needing a job store and a polling UI, out of scope for a one-file
session) and a hard word cap (trades one failure mode for another — paid
credits a guest cannot spend in one request, the same dead end entry 98 already
ruled out once).

**Explicitly not fixed, and not chased further:** two failures at exactly
1,000 words on adversarial word-salad input, both retry-exhausted rather than
timed out — refunded correctly both times, but a separate reliability question
in the retry logic rather than a duration one. **Untested past 2,000 words**,
because reaching larger sizes needs real credits this session did not have
standing permission to spend.

### 125. SEO audit, read-only: robots.txt and the sitemap are already right, and one belief about `/dev/credits` was wrong

**What's already correct, so it isn't re-litigated:** `robots.txt`, the
sitemap, the FAQ's structured data, single-H1 discipline site-wide, and the
Open Graph share image are all confirmed live and correct.

**Two real gaps, both mechanical, one-file fixes.** No page carries a canonical
tag anywhere, and `www.un-claude.com` and `un-claude.com` are both live as two
separately cached copies rather than one redirecting to the other — a genuine
duplicate-content condition, with no dashboard evidence either way of what
Vercel's Domains panel is currently set to. And every page except the homepage
drops the brand from its own `<title>` (`Pricing` instead of
`Pricing · Un-Claude`), a one-file structural cause: the root metadata sets a
bare title string instead of a template, so every child page's own title
*replaces* rather than extends it.

**Correcting a belief already on record.** `/dev/credits` is live in
production and is not protected the way it was believed to be — no `noindex`
meta tag, no `x-robots-tag` header, and `robots.txt` is a blanket allow with no
exclusion for `/dev`. It renders one static sentence outside a development
build, so nothing leaks, but it is exactly the kind of half-built page a
launch checklist should keep out of the index. One line closes it
(`robots: { index: false, follow: false }`), and the security audit flagged
the same page independently for the same reason.

**Checked live and worth recording:** rivals are already titling pages
explicitly around "Claude watermark remover," and the site's own homepage
title competes; every other page currently cannot, for the reason above.

### 126. Legal reconciliation: three sentences the credit-ledger work made false in the same week they were written, and what was corrected

**The premise the session started on was wrong, and worth recording because it
changes what kind of problem this is.** The legal pages were not starter-kit
boilerplate — they were rewritten from the code on 19–20 August (entry 54) and
were accurate the day they shipped. **The software moved underneath them on
20–21 August and nobody moved the pages back.** That is exactly the failure the
standing rule (a legal page changes in the same deployment as the code that
makes it wrong) exists to prevent, and it was followed on the 19th and not on
the 20th–21st.

**Found false, and corrected in the same pass as entry 120's account-deletion
wording:**
- Both policies still described `uc.free-sanitises.v1`, a localStorage counter
  whose file, `free-uses.ts`, is deleted. Nothing writes or reads that key any
  more.
- Both policies said cookies are "set only after you sign in." Two identifiers
  are now placed on a browser that has never signed in: an anonymous Supabase
  session created on first use, and `uc-guest`, a year-long cookie carrying the
  guest's identity. Both are defensible as strictly necessary (no
  consent-banner obligation follows), but the sentence claiming otherwise was
  simply wrong.
- The terms described the free allowance as "enforced in your browser and not
  a security measure." It is now a server-side ledger enforced in a locking
  database transaction — false in the direction that *understates* the
  product, which is the sentence a Stripe reviewer would notice first.
- Cloudflare Turnstile loads on every page for every visitor and appeared in
  neither policy's third-party table.

**Confirmed true and left untouched, so nobody re-audits them:** content is
never retained or used for training, PostHog stores nothing on the device and
never receives content, the contact form really does send nothing to a server,
account deletion (as of entry 120) really does cascade, and the claims
boundary section of the terms is — independently — the best-drafted section on
the site.

**What the reconciliation could not settle, and why: no legal entity exists.**
Every disclaimer, cap and jurisdiction clause in a terms of service is written
on behalf of a legal person, and today "we" means Jon personally. A companion
research pass (drafted for a UK sole trader) worked out what publishing his
name, an address and a governing-law clause would require under UK/EU consumer
law — **entry 115 later resolved the live question by restricting sales to US
customers instead, which supersedes that research's jurisdiction throughout.**
What that research still leaves standing regardless of jurisdiction:
professional-indemnity insurance is worth pricing early because a refusal is
itself information about the risk, and the trade-mark question ("un-claude"
containing Anthropic's mark) was explicitly out of scope and remains
unexamined.

### 127. The payment path, stress-tested: the audit's open items closed, and four small corrections to the Stripe account itself

**Following entry 114, everything left "not proven" there was subsequently run
and passed:** the refund migration applied and re-tested, including a real
cumulative refund across three partial refunds (the old code would have
removed double the correct amount); a real disputed charge, opened and then
lost, correctly leaving credits alone until the loss and removing them exactly
then; the guest-merge invariants re-checked (4/4); a converted account
confirmed to receive no second welcome grant through the real route; and a real
receipt read end to end, confirming no personal name or address appears on it.

**Four corrections made to what Jon had submitted to Stripe, found only by
looking at the actual screens rather than the API:** the customer support
email was missing from Public details (required on receipts — set to
`unclaudeapp@gmail.com`, distinct from the private KYC representative email);
the privacy policy URL was missing from the same screen; the statement
descriptor was `UN-CLAUDE`, corrected to `UN-CLAUDE.COM` so a customer
squinting at a card statement can type it straight into a browser; and the
support address city's capitalisation was fixed. **The one setting that
mattered most and is easy to miss entirely: the "Successful payments" and
"Refunds" customer-email toggles were off by default — if left off, a paying
customer receives no receipt at all, which is close to ideal conditions for a
dispute.**

**One self-correction inside the same body of work, recorded because the
reversal is the useful part.** Stripe Tax was first recommended off at launch
(a 0.5% per-transaction cost). Reading Stripe's own dashboard wording corrected
this — with no tax registrations, there is no charge, and what it actually
buys is free monitoring of economic-nexus thresholds. **Left on.** The thing
to be careful with is registering in a state, which is a real decision with
real obligations, not the monitoring itself.

**Left genuinely open, not decided here.** Whether the project's Vercel plan
permits commercial use at all — Hobby forbids it, and entry 58 already has
Jon's ruling to stay on Hobby "until Vercel objects." A later session's
cost-asymmetry argument for upgrading proactively as part of going live is
recorded as a recommendation, not a ruling; **entry 58 stands unless and until
Jon revisits it.**


### 115b. Two operational rulings, recorded so they stop being reopened

**Jon, 22 August 2026.**

**The Vercel plan.** *"I am upgrading to pro vercel before launch it's noted and
a todo."* The project was confirmed on **Hobby** this session, read from the
Vercel API, and `03-pricing.md` 4e says Hobby does not permit commercial use.
**This is ruled rather than open, and it is still not done.** It is the single
item in this whole area that can cost the site itself rather than money.

**Vercel log retention in the privacy policy.** *"Keep vercel log framing in
privacy policy as is."* The sentence stays: logs *"sit with our hosting company,
which keeps them for a limited period set by its platform rather than by us."*
**It was never wrong.** It was flagged only as an opportunity to strengthen if the
real window turned out to be short. **Jon does not want it chased. Nobody should
reopen it as a defect**, and `legal-applied.md` section 6's entry on it is
superseded by this.

---

## 23 August 2026. The money path, lane B

### 128. Credits are spent oldest first, and that one rule decides every refund

**The problem it settles.** Credits are not labelled. When somebody buys a pack,
spends some of their balance and then asks for a refund, there is no fact
anywhere saying which credits were which — and without an answer, `refund_purchase`
was clamping against the whole account balance, which cost money in both
directions at once. It confiscated a second, un-refunded purchase when the first
was spent, and it recovered almost nothing when the credits had gone. Both
reproduced on the live database; the rows are in `session-notes/lane-b-money.md`.

**The ruling: OLDEST FIRST.** The free grants arrive first and are used up first.
A purchase is only eaten into once everything granted before it has gone. What is
left of a payment is what it sold, less what has already been refunded against
it, less whatever spending reached past everything ahead of it.

**Why oldest first rather than newest first.** It is the customer-favourable
reading — their free credits are consumed before anything they paid for, so a
refund recovers as much as it honestly can. It is also the reading the F1 audit
itself used without noticing, when it wrote "4 of those were free grants". Newest
first would make refunds recover more and would mean a customer's most recent
purchase is always the one being eaten, which is the harder thing to explain to
somebody asking why their new pack disappeared.

**And a refund that cannot recover what it gave back is now written down**, in
`refund_shortfalls`, with its cash value. Jon asked repeatedly for the numbers
this business does not have; this is one of them, and it had no home at all
before today.

### 129. Both free grants are keyed to the email inbox, not just the signup grant

**The audit (0c) named the 3-credit signup grant: delete your account, register
the same address, collect it again, without limit.** Closing only that one would
have left the 2-credit welcome grant open to exactly the same loop, because the
per-network cap on the welcome grant applies **only to anonymous browser
accounts** and a real account skips it.

**So both are now claimed once per inbox**, in `grant_claims` — a table with no
link to any account, which is what makes it survive the deletion cascade that
removed the old guard.

**Accepted cost: somebody who deletes their account by mistake and registers
again gets no free credits the second time.** That is the intended behaviour.

**Accepted change to what is retained after a deletion:** a hash of the address,
which grant it was, the date, and a count of repeat attempts. The address itself
is not stored. **This makes a sentence on the privacy page necessary and that
copy is Jon's**, not a migration's — see `POLICY-CHANGES-PENDING.md`.

### 130. The signup grant is minted at signup; the welcome grant deliberately is not

**A new customer's first look at their wallet said "0 credits · Get credits"**,
after a sign-up page that promised three (audit 0d). The grants were minted by
the tool, and the wallet page never calls the tool.

**The signup grant now lands when the email is confirmed.** The welcome grant
does not, and that is a decision rather than an omission: whether a new account
is a guest conversion is **not knowable at the moment it is created**, because the
browser's cookie is what says so. Paying the welcome grant in the database would
pay it to converting accounts too — the 7-credits-against-a-ratified-5 defect in
`guest-merge-double-runs.md`.

**So the wallet reads 3 at signup, which is exactly what the sign-up page
promises, and 5 once the tool is used.** The number still moves once; `06` holds
that as open.

### 131. What a run costs is recorded beside the ledger, never on it

**The privacy policy says the credit history records what a run cost us. It never
has, and it never could have.** The credit is spent before the engine runs, the
cost is known after, and the ledger refuses every UPDATE — confirmed against the
live database rather than assumed. The columns were put somewhere they could not
be written.

**The append-only rule is not being relaxed for bookkeeping.** Supabase's free
plan takes no backups, so refusing updates is the only protection the credit
history has. The cost goes in `run_costs`, keyed to the ledger row it describes.

### 132. A job nobody received is a failed job, and gives the credit back

**The pricing page says a failed run costs nothing. A customer whose connection
drops mid-job was charged and never refunded** — watched for eight minutes
against a known three-minute window.

**The refund path never depended on the connection**, which is the part everyone
had wrong: measured on the live site, a job whose client dropped at three seconds
still wrote its refund row a second later. What depended on the client was **the
definition of failure** — the only trigger was the engine saying no, and nothing
ever asked whether the answer reached anybody.

**Ruled: delivery failure is failure.** The credit goes back. **The cost of the
run is recorded first**, because if the rewrite ran we really did pay for it and
refunding does not undo that — recording it and then refunding is what keeps the
loss countable.

### 133. The rewrite's minimum goes at the front door, not into an explanation

**Jon's ruling, 23 August 2026.** A paste under sixteen words was charged a
credit, came back byte for byte identical, and the panel said *"Rewritten ·
Measured, not estimated"* with 0% replaced sitting directly underneath. The
engine had returned a `reason` string explaining itself on every one of those
responses and **nothing in the interface read it.**

**The choice was between showing the reason afterwards and refusing the button
before.** Jon ruled for the button: below sixteen words Sanitise is disabled with
the reason beside it, **so nobody pays for a reduced product and the decision
happens before money moves.** Showing the reason afterwards would still have
taken the credit.

**Scanning stays free at any length**, which is the half of the tool that still
works below sixteen words and is also the hook.

**The cost, recorded so it is not discovered later.** Layers A and metadata are
the two provable layers and they work on six words. A short paste that genuinely
carries hidden characters can no longer be cleaned at all — the visitor is told
why and can add words, but the thing they pasted is refused. `06` row 91 carries
the one-line narrowing (refuse only when the scan also found nothing) and a
trigger for revisiting it.

### 134. The credit balance is one fact, held once

**23 August 2026.** The header read `/api/credits` once on page load into its own
state and never again; the workbench chip read the balance out of each sanitise
response. **Two components, two copies of one number, and the audit photographed
them disagreeing: seven at the top of the page and six in the middle, at the same
instant, both about money, on a site taking money.**

**Ruled against polling.** A timer would be a request per visitor per interval,
for ever, for a number that changes only when the visitor does something. The
balance moves on exactly three occasions and each already has a moment attached:
a sanitise answers with the new figure, a refused sanitise triggers a refetch,
and returning to the tab after buying credits fires `focus`.

**So the fix is a single shared value with a subscription, not a synchronised
pair.** Two components cannot hold two copies of one fact and be trusted to
agree. It also halved the home page's calls to `/api/credits`, because the two
readers now share one request instead of making one each.

### 135. A public counter may be seeded, but it may never go down

**23 August 2026, and it narrows entry 71 rather than reversing it.** Entry 71
ruled that a seeded figure rising on a clock is acceptable, and that stands. What
shipped was not that: a burst added an invented 18 to 578 words to whatever was
on screen every few seconds, roughly forty a second, while the anchored figure
underneath rose at one. Four consecutive reloads produced four different numbers
and the third was 473 lower than the second.

**The property the component's own documentation claimed for itself — anchored to
a fixed instant, the same for everyone, not restarting on refresh — is the
property it must actually have.** A public counter that goes down looks broken,
or invented, on a site whose whole argument is that it does not overclaim.

**The burst is a reveal now, not an increment.** The value is always the
clock-derived total; the rhythm only chooses when the display catches up.

**The price is that the counter is quieter**, because a monotonic counter can
only rise as fast as the rate it claims. Getting the motion back means making the
figure real, which entry 71 already described: sum `words_in` on the ledger and
add it to the seed. That is a route the money lane owns.

### 133. `grant_claims` stays writable; the two accounting tables do not

**Found by probing the live database after the migrations landed**, not by
reading them: `refund_shortfalls` and `run_costs` arrived fully deletable,
because Supabase's default privileges already give `service_role` everything and
`grant select, insert` adds rather than narrows. The credit ledger beside them is
protected only because its migration revokes first. `07` carries the trap.

**Both are now insert-only, and the reason is the same one that justifies the
ledger's own rule.** `refund_shortfalls` exists so that money given back and
never recovered can be **counted**. A record of losses that any code holding the
service key can quietly erase simply gets smaller, and with no backups there is
nothing to compare it against.

**`grant_claims` is deliberately left writable, and that is not an oversight.**
`claim_grant` counts repeat attempts by updating a row. And removing a claim is a
legitimate thing a person may need to do: somebody who deleted their account by
mistake and wants their free credits back has no other remedy, because the whole
point of the table is that deleting the account no longer clears it. **A guard
with no manual override would turn one honest mistake into a permanent
punishment.**

---

## 24 August 2026. Lane D, copy

### 134. "100% of detectable marks removed" stays. Preserved RTL marks do not get to reshape the site

**Jon's ruling, given in the session and quoted so nobody relitigates it.** Lane
D changed the hero line to "Every mark that is safe to remove", on the grounds
that the scan finds 15 invisible characters and the clean removes 12, keeping
`U+200E`, `U+200F` and `U+061C` because they carry meaning in Arabic and Hebrew.

**He reverted it.** The line is back to "100% of detectable marks removed", byte
for byte, and it is not to be changed again for this reason.

**His reasoning, and it is the part that generalises.** The preserved marks
matter to a vanishingly small share of real scans. **Rewording the site's
headline promise to defend that share is the tail wagging the dog.** "100% of
detectable marks removed" is **directionally correct** for what actually happens
to what actually gets uploaded, and a marketing line in a three-item hero list is
not the place a format edge case gets adjudicated.

**Where the boundary still sits, because this ruling is narrower than it looks.**
It is a ruling about **this line and this cause**. It does not license overclaiming
generally, and it did not disturb the other six Lane D fixes, all of which he
approved in the same message. The claims boundary in
`.claude/skills/unclaude-messaging/SKILL.md` is otherwise unchanged.

### 135. The panel says marks were left in place intentionally, not that they could not be removed

**Same session, and it is the other half of 134.** The workbench had told a
customer, since 18 August:

```
3 could not be removed. Read the result before you use it.
```

**That sentence described a deliberate engineering choice as a failure**, and
then sent the customer off to inspect their own document about it. Jon: get that
out of here.

**His wording, in the product now:**

```
3 formatting marks were left in place intentionally. Every other hidden
character watermark has been stripped.
```

**Why it could not simply be deleted.** The branch underneath it ends "the text
was read back to confirm none are left", so removing the sentence would have
printed something false whenever marks remained. It had to be replaced rather
than dropped.

**The two rulings agree with each other, which is the point.** A hero claiming
100% above a panel saying three things could not be removed was the real
incoherence. A hero claiming 100% above a panel saying three formatting marks
were left in place intentionally is one product with one voice.

---

## 24 August 2026. Route session

### 136. Chinese, Japanese and Thai are refused, not priced

**Jon's ruling, given in the route session brief, and the reasoning is his.**

**The fact underneath it.** Every price in this product comes from a word count
that counts spaces, and these three scripts do not put spaces between words.
Measured:

```
200k-character Chinese document    chars  201400  words      1  credits billed    1
comparable English document        chars  102700  words  20800  credits billed   21
```

**The options were price it or refuse it, and Jon chose refuse.** His reasoning:
refusing **closes the hole completely** with no pricing arithmetic, no change to
the 10,000-word ceiling, and **no counter in the browser that then has to be kept
in step with the server.** Two implementations of one number is the trap this
project has been bitten by three times, and pricing CJK would have needed exactly
that — the workbench's own counter changed in the same deploy or the price shown
would not be the price charged.

**This ANSWERS the open question Lane A raised in `06` the same day** ("the
honest word count is built, and wiring it to the customer is one coupled pricing
decision"). Lane A's recommendation was to wire `uc_wordcount.count_words` into
billing, the gate and the floor in one change. **Jon's ruling supersedes it for
now:** the engine-internal counter stays, and the customer-facing answer is a
refusal rather than a price.

**One fact that arrived after the ruling and does not change it.** The rewrite is
*not* currently running on these documents at all — one space-counted word is
under the engine's 16-word floor, so it is silently skipped. So today the defect
is **the customer paying a credit for a rewrite that never runs**, and our
model-call exposure is latent rather than live. It becomes real the moment anyone
wires the honest counter into that floor. **Refusing fixes the live defect and
pre-closes the latent one, so the ruling holds either way.**

**What it cost, said plainly.** The workbench asks for the rewrite automatically
on anything carrying prose, so a Chinese document can no longer be sanitised
through the site at all, not even for its layer A characters. The free scan still
shows the visitor what is hidden. Changing that would be a different ruling and
would need the browser to ask for the layers separately.

### 137. The threshold is a share of letters, not "contains any"

**Decided in the route session, because a ruling to refuse a script still has to
say what counts as that script.**

**"Contains any" would refuse an English essay that quotes Chinese**, which is a
real customer with a real document and no billing problem at all. So the test is:
**at least 20 characters from a spaceless script, AND at least 20% of all the
letters in the document.**

**Why a fifth.** Below it, the document is English with something quoted inside
it and the English around the quotation is still being counted and charged for
honestly. Above it, it is not an English document and there is no honest price.
Measured: an essay carrying **forty separate Chinese quotations, 360 characters,
still goes through** at 14.8%.

**Korean is deliberately excluded and is the control.** It is an Asian script
that does put spaces between its words, so it counts and prices correctly.
Refusing it would turn away a paying customer for nothing. Verified: 0.0% share,
accepted, charged 1 credit for 71 words.

### 138. Our unit economics are stripped in the route, after the cost writer and before the response

**Lane A's E-12. The four lines are trivial and the position is the entire
decision, so it is recorded rather than left in a comment.**

**`recordRunCost` reads the token counts and `cost_usd` out of
`report.layer_b.usage`, server side, and its row is what makes the privacy
policy's promise to record "what the run cost us" a true sentence.** Stripping
those figures anywhere earlier — higher in the route, or in the Python engine
where Lane A first wanted to put it — feeds the writer nulls and the promise
quietly becomes a lie again.

**So there is exactly one correct place: after that call, before
`Response.json`.** Proved in both directions in
`session-notes/route-session.md`: the browser's copy now carries `chunks`,
`attempts` and `retries` only, and the `run_costs` row for the same run still
holds 862 tokens and $0.000096.

**`chunks`, `attempts` and `retries` stay on purpose.** They count work rather
than money and the interface's own behaviour already implies them.

---

## 24 August 2026. Lane A, session E-9: the freeze

### 137. When the freeze fails, the chunk is handed back unrewritten — and the refund has a threshold. Changes entry 22.

**Jon's ruling (D3, 23 August), now implemented, with the one number the
ruling left to the implementer.** Entry 22 says a failed rewrite refunds.
The freeze adds a failure mode entry 22 never met: the masking that protects
a quotation can fail to restore in ONE chunk while every other chunk's
rewrite is perfect. Refunding the whole job over that would hand a customer
nine tenths of a rewritten document and their money back — and anyone who
can trip the freeze on purpose gets the work free, the same shape as the
mintable-credits hole Lane B closed.

**What happens now, in order:**

- A chunk whose restored output cannot be verified — every protected span
  back, character for character — retries **once** (Lane A's rule: every new
  retry is bounded at one), then **falls back to that chunk's own original
  text**. The customer gets their own words, never a mask token, never a
  corrupted span. The report says so plainly (`layer_b.freeze`).
- **At or below the threshold: no refund.** The customer received the bulk
  of the rewrite plus the two provable layers, and the report explains
  exactly which part came back untouched and why.
- **Past the threshold: the job fails, which refunds** — entry 22's rule
  takes back over, because past that point "delivered" stops being honest.

**The threshold is one third of the document's words** (`UC_FREEZE_REFUND_SHARE`,
default 1/3), measured over the chunks that fell back. Why a third:

- Below it, the customer demonstrably got most of a rewrite — at worst two
  thirds rewritten — plus layers A and metadata, which are the layers this
  product can prove.
- Above it, calling the result a delivered rewrite stretches honesty past
  what section 4 permits.
- And it is the abuse-resistant direction: a customer engineering a refund
  must sabotage **more than a third of their own document**, and what they
  keep free is a document at most two-thirds rewritten — the least
  attractive free good this product can offer.

A single-chunk document whose only chunk falls back is 100% failed, past any
threshold, so it refunds — correct, because that customer received no
rewrite at all.

---

## 24 August 2026. Email and analytics session

### 139. The customer-facing address is `support@un-claude.com`. Supersedes entries 104 and 118's `unclaudeapp@gmail.com`.

**The address forwards to Jon's inbox and was confirmed working end to end
before this change was made** — MX propagated, SPF live, a real message
delivered. That confirmation is the whole reason the change is safe: an
address on a refund promise that bounces is worse than a Gmail address on a
refund promise that works.

**Why it was worth changing at all.** Every place the old address appeared is
a place where a customer is already unsure: a payment whose credits have not
arrived, a refund request, a privacy question, a contact form. A gmail.com
address on those pages reads as a person's side project, and
`docs/session-notes/legal-research.md` had already flagged it as "serviceable
but not a" business address. The domain address costs nothing and answers the
doubt.

**Changed in five places, all four of them customer-facing:**

| File | What it is |
|---|---|
| `app/home/_components/purchase-banner.tsx` | The "your credits have not arrived" fallback, after a paid checkout |
| `app/(marketing)/_components/contact-form.tsx` | `CONTACT_EMAIL` — the mailto target and the visible address beside the button |
| `app/(marketing)/pricing/page.tsx` | The refund FAQ, entry 115's second home for the refund |
| `app/(marketing)/(legal)/_components/legal.tsx` | The `Mail` component: one mailto and one visible label, used by every legal page |

**Stripe still shows the old address on receipts and is deliberately not
touched here.** It is a dashboard setting under Settings → Business →
Public details, not code, and changing it is Jon's to do. Until he does, a
receipt says `unclaudeapp@gmail.com` and the site says `support@un-claude.com`.
Both reach him, so nothing is broken, but they should match.

**The old address is left standing in `docs/`.** Those are records of what was
decided when, and rewriting them would make the history lie. This entry is the
change; the older entries stay as they were written.

### 140. The funnel is instrumented to the money, and it stops at counts rather than buying a consent banner

**The gap this closes.** `events.ts` instrumented fifteen events on 19 August
and followed a visitor all the way to the paywall. Stripe went live on the
22nd and nothing was added, so **the button that takes money sent no analytics
at all.** The one question this product exists to answer — of the people who
run out of credits, how many actually buy — could not be answered.

**Five events, not the three the brief named.** `checkout_started`,
`checkout_failed` and `purchase_completed` were asked for. Two more were added
because the answer is wrong without them:

- **`checkout_account_required`.** 401 and 402 are the ordinary outcome for
  anyone who reaches /pricing before making an account, which is most people.
  Recorded as a failure it would bury real breakage under normal traffic. Not
  recorded at all, `checkout_started` would look like it leaks customers who
  were in fact handed to the sign-up form on purpose.
- **`purchase_cancelled`.** Without it every non-buyer looks alike, and the two
  populations need opposite fixes: never reached Stripe is a broken button,
  reached it and backed out is a price.

**THE PRICE IS NEVER A PROPERTY.** `pricing-data.ts` decides what a pack costs
and Stripe charges it. A browser sending a number about money is the boundary
this product refuses to cross, and an analytics event is still a browser
talking. The pack id goes; the price stays server-side. `pack_id` is also run
through a fixed list of three before it is sent, the same guard as `fileType`,
so a call site cannot push a free string out of that module by mistake.

**NOTHING IDENTIFIES A PERSON, and the funnel is deliberately left broken
rather than fixed by identifying one.** Four property names across the five
events — `pack_id`, `reason`, `state`, `credits_ready` — eleven possible
values, every one a fixed word or a boolean. No email, no name, no account id,
no Stripe id, no amount, nothing from any document.

The cost is real and is accepted: the buyer leaves for stripe.com and comes back
through a fresh page load, so with `persistence: 'memory'` the visitor id is
gone and **`checkout_started` and `purchase_completed` cannot be joined into one
funnel.** They are read as counts beside each other instead. `posthog.identify()`
would not close it — the anonymous id was already gone — and would add a person
to the analytics record, which means a privacy policy change, a cookie policy
change and a consent banner. **That trade is Jon's to make and it was not made
here.** 06 has the row.

**`analytics-provider.tsx` was not touched**, so the cookieless configuration is
unchanged and the two policies do not move with this commit. That was the
condition on this work and it holds.

**`purchase_completed` fires on arrival, not on the credits landing**, because
Stripe only redirects to the success return once the card has cleared. Waiting
for the credits would turn a purchase count into a measurement of webhook
latency and would drop every purchase whose webhook was slow — precisely the
population worth knowing about. The race rides along as `credits_ready`
instead, which is an operational alarm: false means a paying customer looked at
their old balance.

**A pack id is not sent with either purchase event**, because the wallet does
not know it — the return URL carries `?purchase=success` and nothing else.
Which pack sold is a Stripe question and Stripe answers it with the money
attached, so the gap is not worth a schema change.

---

### 141. TikTok is a channel and the claims boundary follows the product onto it

**24 August 2026.** Jon commissioned the first short-form video for un-claude.com,
targeting US university students, and gave a working framework. Research was run
on hook mechanics, on the factual state of AI watermarking, and on platform
policy. `docs/session-notes/tiktok-script-01.md` holds the script and the full
reasoning.

**The ruling that matters: what the site may not say, a video may not say
either.** The framework's central claim was "universities can now see it".
`.agents/product-marketing.md` section 13 lists that under **what must never be
said**, and the live FAQ answers the same question with "For files, yes. For
text, not yet." **A video making the claim would be contradicted by the landing
page at the moment of conversion**, which is a conversion defect before it is an
honesty one.

**Independent verification agreed, and went further.** No detector exists that a
university can run against any provider's text watermark. Anthropic's is
committed and not callable. Google's portal is waitlisted and covers image, video
and audio only. **Turnitin, GPTZero and Copyleaks are statistical classifiers and
do not read watermarks**; "watermark" appears zero times in Turnitin's AI
detection FAQ.

**What replaced it, and it is stronger.** "Your school already scans everything
you hand in for AI. That was a guess. This isn't." True, sourced, and it escalates
rather than deflates. **Detection is imminent and that is the argument rather than
the caveat**, which is what section 13 already required.

**Jon asked for the literal claim a second time and this session did not write
it.** The alternative was delivered instead, with the reasoning, and the decision
was left with him. **Recorded because the next session will meet the same
pressure**: short form rewards a harder claim than the page makes, and the answer
is a truer claim rather than a looser one.

**Three secondary rulings.**

1. **No layer breakdown in short form.** Jon's call and it is right. Thirty
   seconds cannot teach three layers. The video says the watermark is the words
   themselves and moves.
2. **The strongest line in the script is Anthropic's own**: "a complete rewrite
   where every word is replaced will" remove the mark. **The company that built
   the watermark describing the method that removes it.** It also kills the "just
   ask another AI to reword it" objection in six words. It belongs in every video.
3. **Post from a personal account.** The video trips all three of TikTok's
   commercial content triggers, disclosure is itself a reach cost, and that is the
   documented reason every competitor in the category runs creator accounts.

## 24 August 2026. E-16 session, the quotation detector

### 142. A dialogue tag is not an attribution: position and subject decide, not the verb. Corrects entry 137's D2 implementation.

**Not a change to D2, a correction of how D2 was implemented.** D2 rules that
only ATTRIBUTED quotations freeze, because invented dialogue is the most
watermarked text in a document and freezing it hands the customer back the
worst part untouched after charging for a rewrite. E-9 implemented that by
narrowing the cue to reportive verbs. **Seventeen of the verbs it kept —
argued, warned, observed, concluded, insisted … — are also standard fiction
dialogue tags, so the rule failed exactly where D2 says the cost is highest.**
Measured on 45 realistic novel dialogue lines, the shipped rule froze **35**.

**E-9's own D2 demo could not have caught it.** That short story tags its
dialogue only with `said`, `asked` and `replied` — the three verbs already off
the list — so its 0-of-193-words result tested the story's word choices, not
the rule. **A demo that cannot fail is not evidence.**

**The rule now, and it is two tests, neither of them the verb:**

- **Position.** Attribution INTRODUCES its quotation — «Orwell wrote that
  "…"», «As Smith puts it, "…"». A dialogue tag FOLLOWS it — «"…," she
  argued». Every one of the 35 false positives came through the trailing
  path, and that path is deleted rather than narrowed.
- **Subject.** Attribution names a source — Smith, The committee, the 2019
  review. Fiction uses a bare pronoun. A reportive verb whose subject is a
  bare pronoun does not attribute.
- **A citation shape stays an independent trigger** — `(Smith, 2019, p. 47)`,
  `p. 47` — subject and position irrelevant. Unchanged from E-9, and it is
  the strongest evidence a real source exists.

**Why this rule and not the one the brief proposed.** The brief recommended
the subject test alone. Measured, it fixes about two thirds: it cannot see
«"There were four men on that quay," Ruth argued», and half a novel's
dialogue is tagged with a character's name. **The product-level test settles
it — two identical stories differing only in their four dialogue tags: the
shipped rule froze 0.0% and 33.6%, the brief's rule 0.0% and 10.0%, this rule
0.0% and 0.0%.**

**What this gives up, deliberately, in the direction D2 chose** (being wrong
toward free costs a few reworded phrases; being wrong toward frozen hands back
a paid-for rewrite undone — those are not the same size):

- an **uncited trailing attribution**, «"…," wrote Orwell in 1946» — a bare
  year is not a citation shape, so it no longer freezes;
- **attribution carried by a pronoun**, «The auditor … She wrote that "…"»,
  which is common in real academic prose. This also frees epistolary fiction,
  which E-9 listed as a known wrong freeze. **One rule, both sides.**
  It drops E-9's mask-heavy demo document from 71.9% frozen to 34.2%.
- a pre-quote tag on a **named character**, «Marcus concluded, "…"», which is
  textually identical to «The committee concluded, "…"».

**Residual after the change: 2 of 45 fiction lines, 2 of 30 attribution
shapes.** A stricter variant that keeps the inverted academic case («"…,"
wrote Orwell») was built and measured — 0 of 30 attribution lost, but 4 of 45
fiction frozen — and rejected on D2's asymmetry. It is four lines of code if
Jon wants the other trade. **The E-9 essay is unaffected: 23.6% before and
after, same spans.**

**Locked by `test_every_attribution_verb_has_a_fiction_line`,** which reads
the live cue pattern and fails if any verb on it has no dialogue line proving
it does not freeze a novel. Adding a cue verb without that proof now fails the
suite.

**Amended the same day, when the platform research landed.** Ruling 3 above said
to post from a personal account, and the reason given was partly wrong. **TikTok
has no academic integrity policy at all** — all 38 advertising policy articles
were enumerated and the nearest clause is "Document falsification, forgery, or
counterfeiting". Competitors are not using euphemism either: `@phrasly`'s bio
reads "bypass AI detectors" and live Meta ad copy reads "Bypass tools like
Turnitin and Originality effortlessly".

**The real exposure is press, not policy.** TikTok removed videos and banned
accounts only after a Digital Services Act study named them, and **The New York
Times, 18 June 2026, wrote up this exact category** — naming a creator and a
brand, and singling out **a video that was not labelled an ad**. **The ruling
stands and gains a second half: post from a personal account, and disclose
properly when it is paid.** The thing that gets written up is the undisclosed ad,
not the product.

**A channel finding worth more than the video.** Every brand account in this
category is small, between 1,600 and 8,200 followers. **Growth is bought through
affiliates at 20 to 25% recurring, for life.** StealthGPT publishes 50 million
affiliate views and $100,000 paid out. **No affiliate programme in the category
restricts academic use**, including Undetectable AI's, whose own ethics page lists
"Cheating in school" as unacceptable. **That gap between the ethics page and the
acquisition channel is what a reporter writes about**, and it is avoidable here
because `04` entry 141's whole point is that this project does not run one.

### 143. Every quotation freezes. There is no test of whose words they are. Supersedes 137's D2 implementation and 142.

**Jon's ruling, 24 August 2026, in his own words:** *"I don't want to try and
differentiate real quotation versus novel dialogue. I think that makes no
sense, and it's purely a non-deterministic, subjective guessing game. What
we're going to do is any quotation is frozen and kept across the board.
There's no delineation between novel dialogue and real quotation. We preserve
the text and quotations, and citations around it on either side."*

**Two sessions built the test he is abolishing and both failed on ordinary
text.** E-9 keyed on reportive verbs; E-16 replaced that with a
position-and-subject test after measuring that the shipped rule froze 35 of 45
ordinary novel dialogue lines. Neither failed through carelessness. The two
things are grammatically identical:

```
"Power tends to corrupt," Acton observed.      <- real, must freeze
"Mind the second stair," Aldous observed.      <- fiction, must not
```

Quote, comma, capitalised name, reportive verb, in both. **The difference is
that Acton published and Aldous is a character, which is world knowledge and
not syntax.** No program has it.

**The cost of dropping the distinction, measured before the change and
confirmed on the shipping code afterwards:**

| document | words | frozen before | frozen after |
|---|---|---|---|
| ladder_500 | 463 | 27.4% | 27.4% |
| ladder_1000 | 919 | 27.7% | 28.8% |
| ladder_2000 | 1,942 | 23.6% | 25.1% |
| ladder_3000 | 2,971 | 23.5% | 25.2% |
| ladder_5000 | 4,958 | 22.3% | 24.1% |
| ladder_10000 | 9,946 | 21.4% | 23.2% |
| dialogue-heavy story | 61 | 0.0% | 63.9% |

**Under two points on every academic document.** It is dramatic only for
dialogue-heavy fiction — the case this product does not optimise for, and the
case D4's pre-flight already discloses before any money changes hands.

**Three things went with the distinction, and the deletion is the prize rather
than a side effect:** the reportive-verb list, the attributive-position and
pronoun-subject tests, and the `attributed` field on every span. The report's
`quotes_attributed` and `quotes_unattributed` are removed rather than renamed —
their names claimed a distinction the engine no longer makes, and the count of
quotations already lived in `spans_found.quote`. **This project found three
silent freeze defects in two days; a deleted code path cannot harbour a
fourth.**

**Block quotes lost their colon lead-in test too, which the brief left open.**
That test decided from the introducing line whether indented text was quoted
material — the same species of guess. Indenting a paragraph is the typographic
statement that it is quoted, and the engine now takes it at its word. **The
price, accepted: indented text that is not a quotation — an address block, a
poem, unfenced code — freezes too.** On a 45-word document with an indented
address, 2.2% frozen becomes 24.4%.

**The second half of the ruling: the citation freezes with the quotation.**
Until now the masker handed the model a protected quotation with its source
loose — `As Smith puts it, [[11]] (p. 47)` — so a page, year or author could be
renumbered, and W10 measured invented authors in 23 of 41 runs on this model
family. **A rewritten citation attached to a correctly preserved quotation is
the worse half of two errors: it reads as authoritative and it is wrong.** A
citation adjacent on either side is now inside the frozen span. **A citation
not adjacent to any quotation is deliberately NOT frozen** — that would be a
larger change than the ruling asked for.

**Locked by `test_the_surrounding_words_never_decide`**, which puts one
quotation into fourteen different surroundings — every cue either deleted rule
ever keyed on — and requires the identical answer from all fourteen. Any future
attempt to read the context and decide fails the suite, whatever mechanism it
uses.

### 144. [T1] The three-word ceiling is retired as a promise and kept as a rule

**25 August 2026, session brief `tell-the-truth-about-runs.md`.**

**The site told every visitor that no more than three of their own words survive
in a row. The measured figure on a delivered document is up to 388.** The freeze
alone guarantees runs of 55 to 57 words, so the claim was not merely optimistic,
it was out by two orders of magnitude and would have been out even if nothing
had ever gone wrong.

**The fix is not deletion, because the sentence carries the whole anti-detection
argument.** The mark rides on unbroken runs of the model's own word choices, so
"we break the runs" is the reason a rewrite is the answer at all. **What changed
is its grammar: three is now stated as the limit the engine WORKS TO, not as a
guarantee about the reader's document.** That is what `ENGINE.md` section 3 rule
3 always said — *"no runs of more than three consecutive words, subject to rules
1 and 2"* — with facts and length both outranking it. **The site was the only
place in the project where it had been written as a promise.**

**Six places, one grammar, and "runs" replaces "sequences" throughout** per
entry 76, where Jon ruled *"three word sequences no one knows what that means."*
Three of the six were still using the phrase he rejected.

**The freeze is named on the site for the first time.** Before this, the words
"quotation" and "reference" appeared nowhere a visitor could read them, while
about a quarter of a typical document came back untouched by design. **A long
surviving run is now distinguishable in the copy between the product working and
the product falling short, which is the distinction the whole job turned on.**
Placement follows the earlier ruling recorded at `how-it-works:360`: the fullest
statement is in the FAQ, and the proof block is untouched.

**The receipt's ladder stays at `[3, 4, 5, 6, 8, 10]` by Jon's ruling and was
not touched.** Measured against the shipping file, a 57-word run, a 352-word run
and a 388-word run all print "10". **So the tile prints "10+" at the ceiling and
is no longer one of the two lit headline figures** — on the same three cases the
Replaced tile reads 94.5%, 64.9% and 61.3%, so it separates a frozen document
from a partly unrewritten one and Longest run cannot. **The honest instrument
gets the emphasis.**

### 145. [T1] "Over 90% of three-word sequences broken" comes down, with no
### number put in its place

**Same session. This one is handed back rather than settled, because `04` entry
77 makes statistics Jon's.**

The brief proposed keeping the figure by scoping it to the text the engine
actually rewrites. **The engine lane committed a 63-run ladder the same day
(`dfc4cad`) recording `overlap_unfrozen`, which is precisely that measurement.
The claim holds on 18 of 63 runs.**

```
                        n      min   median      max   meets "over 90% broken"
mistral/mistral-small  21   0.0347   0.1747   0.4302    6 of 21
mistral/mistral-medium 21   0.0252   0.1009   0.4093    9 of 21
deepseek/deepseek-v3.2 21   0.0505   0.2887   0.6017    3 of 21   <- the settled model
ALL 63 RUNS            median 0.1846 -> 81.5% broken
```

**And it fails by document size, which is the part with a product meaning:** it
holds on 9 of 9 runs at 463 words and 0 of 9 at both 1,942 and 7,498 words.
**True of a short paste, false of a term paper.**

**So no single site-wide figure is honest here** — any one number lies about one
end of the range, because the real answer depends on how long the document is.
**The figure was removed from both whole-service slots and the moat line now
points at the per-job receipt instead: "Every figure there is measured on your
own document, not averaged from ours."** That is stronger commercially as well
as more honest: a number the visitor can check on their own document beats a
test-set average they cannot, and it cannot go stale when the model changes.

**Open for Jon.** If he wants a figure back, the only one the data supports is a
floor with its condition attached — *"on documents under a thousand words, over
90% of your three-word runs broken; longer documents are lower and the receipt
shows you yours."* **It is not written anywhere and it is his call.**

### 146. [T1] The advertised word limit is 8,000, and the engine has not moved yet

**Same session, executing `freeze-every-quotation.md` §5.5 rather than
re-deriving it.** The ceiling is time: the site aborts at 240 seconds, documents
run as waves of 8 parallel calls, and 10,000 words is 4 waves against 8,000
words' 3. **At 65 seconds a wave — the only per-wave figure ever measured in
production — 8,000 fits at 195s and 10,000 does not at 260s.**

**`MAX_WORDS` is 8,000 and the pricing FAQ states the limit for the first time.**
The brief's two named targets both turned out to be something else: *"a
dissertation"* is the Pro pack's 100,000-word coverage and the calculator's
10,000 is a slider tick.

**Recorded because it is a live inconsistency rather than a closed decision.
`UC_MAX_WORDS` is still 10,000 and the browser trusts the server's `over_limit`
first, so a SCANNED 9,000 word document still runs.** The site now advertises a
limit it does not always hold itself to. The direction is the safe one — nothing
is charged for a job that is then refused — but it is real. **`lib/engine/client.ts`
deliberately still says 10,000, because it describes the engine's own refusal
and saying 8,000 there would fire at 10,001 claiming 8,000.** Both close in one
Lane A change. `06` carries it as open.

### 147. [T1] The wait stops naming seconds, because the number belongs to the model

**Same session.** The progress line quoted "about 10 seconds" to every short
paste, from `estimateSeconds`, which floors at 10. **The only time this project
has measured the rewrite in production, 478 words took 65 seconds — 6.5x the
quote, in the direction that makes a working tool read as hung.** The same box
was right at 2.9 seconds for a short paste on mistral-small, so the figure was
not conservative, it was unrelated.

**No seconds are named now.** Jon's instruction of 21 August 2026 stands and is
still obeyed — a long run says it is long — but it says "a few minutes" on a
document over 1,000 words and nothing at all below that. **The reason for naming
no number is that the per-wave time is a property of the model and the model is
under review: any constant is stale the day it switches.** The elapsed-second
counter already beside it was always the honest instrument, because it is the
real time rather than a prediction about it.

**`estimateSeconds` and `humanDuration` are kept, uncalled, carrying a warning
not to reuse them without a production measurement.**
