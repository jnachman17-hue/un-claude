# Track A working notes: the engine

**Owned by the Track A chat. Track B reads this and never edits it.** `04` entry 25.

**Purpose.** Jon's rulings and findings recorded at the moment they happen, so
that nothing is lost if a session ends, without two chats appending to
`04-decision-log.md` at the same time. **Everything here is folded into `04`,
`01` and `06` at integration, and this file is then deleted.**

**Format.** Mark each entry `DECISION`, `OPEN QUESTION`, `RUNBOOK` or `FINDING`
so it can be filed correctly later.

---

## Status

**Session A1 in progress. Steps 1, 2 and 3 done, step 4 mostly done.**

| Step | State |
|---|---|
| 1. How the engine is deployed | **Done.** `04` entries 26 and 27 |
| 2. Bring in the repository | **Done.** `engine/`, commit `f1ad185`. See `engine/PROVENANCE.md` |
| 3. Prove layer A on real text | **Done.** Six planted characters found, named, removed, verified |
| 4. Prove metadata on DOCX, PNG, JPG | **Done. All three.** Office document, PNG, JPEG. Each verified by reading the raw bytes |
| 5. `qpdf` | **Gone with PDF.** `04` entry 26 |
| 6. Define what the site calls | Not started |
| 7. Usage recording | Not started |

**Blocked on nothing. Next: step 6, the contract, which is what Track B waits on.**

**Test suite is running.** `pytest` is installed in `engine/.venv`, a
self-contained folder that changes nothing globally and is gitignored. **487
pass, 1 skipped, none fail.** Run it with:

```
cd ~/un-claude/engine && .venv/bin/python -m pytest
```

---

## Entries

### FINDING, 18 August 2026. This machine cannot run the engine repository as it stands

Checked by running the commands, not assumed.

| Requirement | This machine | Gap |
|---|---|---|
| Python 3.10 or newer | **Python 3.9.6** | **Too old. The engine will not run** |
| `qpdf` | Not installed | **Without it PDF cleaning leaves the original bytes recoverable** |
| `exiftool` | Not installed | Residual metadata, especially in PDFs |
| `c2patool` | Not installed | C2PA manifest inspection |
| Docker | Not installed | The repository's own answer to the three above |
| Node | v24.15.0 | Present |
| pnpm | 11.18.0 | Present |

**Consequence.** Taking the repository as it stands needs **five installations**
on Jon's laptop before a single line of it runs, every one of them requiring his
approval under `CLAUDE.md` section 5. Docker is already a known refusal point,
recorded as `06` row 11 since session 3.

### FINDING, 18 August 2026. Vercel cannot install `qpdf` for a Python function

Checked against Vercel's own documentation rather than recalled.

**Python dependencies on Vercel are declared in `requirements.txt` or
`pyproject.toml`, and those install Python packages only.** There is no mechanism
to install a system program like `qpdf` into a Vercel Function.

**The `dnf install` route that search results surface is Vercel Sandbox**, which
is a separate product: short lived isolated machines for running untrusted code.
Its own documentation states that installed packages **do not persist between
sessions.** That is not a home for an engine that needs `qpdf` on every request.

**Consequence.** Vercel Functions plus the repository's PDF handling do not
compose. Either PDFs are cleaned somewhere other than Vercel, or they are cleaned
by code that does not need `qpdf`.

### FINDING, 18 August 2026. What the four launch formats actually require

Established from the file formats themselves. Recorded because it is the
substance of the option Jon is being asked to rule on.

| Format | Where the mark lives | Difficulty without the repository |
|---|---|---|
| Pasted text | Invisible characters in the text | **Trivial.** No library needed |
| **DOCX** | A zip archive. Metadata is `docProps/core.xml` and `app.xml` inside it | **Low.** Needs a zip library |
| **PNG** | Chunks. `tEXt`, `iTXt`, `zTXt`, `eXIf` | **Low.** Chunk parsing is simple |
| **JPG** | Segments. `APP1` holds EXIF and XMP, `APP11` holds C2PA | **Low.** Segment parsing is simple |
| **PDF** | An `/Info` dictionary, an XMP metadata stream, and possibly older revisions still present in the file | **This is the hard one, and it is the whole reason `qpdf` exists** |

### DECISION, 18 August 2026. Architecture settled

**Filed to `04` as entries 26 and 27** rather than held here, because they amend a
numbered entry and change what Track B builds. Rows 19 and 25 in `06` are closed.

### RUNBOOK, 18 August 2026. Invisible characters get destroyed by the shell. Track B must know this

**This is the single most project specific hazard found so far, and it caught the
assistant twice in a row inside ten minutes.**

**What happened.** A test sentence containing hidden characters was written into a
file using a shell command. **The characters did not survive the trip.** A
no-break space arrived as an ordinary space. The tool then correctly reported
finding thirteen ordinary spaces, which looked like a broken detector and was in
fact broken test data.

**Why it matters more here than in a normal project.** This product's entire
subject is characters that cannot be seen. **Any test written by typing those
characters into a command is untrustworthy, and it fails silently**, looking like
a bug in the thing being tested rather than in the test.

**The rule. Build these characters from their code numbers, never by typing
them.** In Python that means writing the escape form. The same applies to
JavaScript and TypeScript, so **Track B needs this before it writes a single test
or a single piece of sample text.**

**A second, smaller trap in the same session.** A count of characters found will
not match the change in length, because some characters are deleted outright and
some are swapped for an ordinary space. A swap changes nothing about the length.
**Report deleted and swapped separately or the numbers look wrong.**

### FINDING, 18 August 2026. Python 3.14.7 installed and verified. Layer A proven working

Jon installed Python 3.14.7 from python.org. `python3` resolves to
`/usr/local/bin/python3`, and `sys.version_info >= (3, 10)` returns `True`, so
the engine's minimum is met. **3.14 rather than the 3.13 recommended, which is
fine: the recommendation was mild caution about add-on packages and the engine
core uses none.**

**Layer A was then proven on real text using nothing but the standard library.**
Six hidden characters were planted in a normal looking sentence, all six were
found and named with their positions, five were deleted and one swapped for an
ordinary space, and the result was checked two ways: zero hidden characters left,
and an exact match against the sentence as intended.

**This is the first evidence in the project that the product does anything at
all**, and it needed no repository, no Docker, and no second hosting company.

### FINDING, 18 August 2026. The engine works, verified independently

**Layer A on real text.** Six invisible characters planted in an ordinary
sentence. All six found and named with positions. Five deleted, one swapped for
an ordinary space. Zero left afterwards and the sentence matched what was
intended, exactly.

**A real Office document, using the upstream fixture `sample_ai.xlsx`.** Before:
C2PA present, AI metadata present, naming OpenAI as generator, plus an embedded
image carrying content credentials. After: both absent.

**Verified by reading the raw bytes, not by asking the tool whether it had
succeeded.** Every incriminating string was searched for in the decompressed
contents of every part of the file. All absent afterwards.

**The document survived.** The workbook part came out **byte identical**. Only
two parts were removed, and both were the ones carrying AI metadata. Everything
else that changed, changed for a stated reason.

### RUNBOOK, 18 August 2026. Three test failures in a row were the test, not the thing being tested

Worth recording as a pattern rather than three incidents.

1. Invisible characters destroyed by writing them through a shell command.
2. A verification comparing two strings that had been normalised differently.
3. A check for a part called `xl/worksheets/sheet1.xml` in a minimal fixture that
   never had one, reported as "sheet data still present: False".
4. Sending output to `/dev/null`, which fails because the engine writes safely via
   a temporary file in the destination folder.

**The lesson is specific and useful: in this project the tool under test is
usually right and the harness around it is usually wrong,** because the subject
matter is invisible characters and binary file internals, both of which are easy
to mangle by accident. **Check the harness before believing a failure.**

### FINDING, 18 August 2026. All three launch formats proven, byte verified

| Format | Before | After | Picture or content intact |
|---|---|---|---|
| **Office document** | C2PA and AI metadata, naming OpenAI | Both absent | Workbook part byte identical |
| **PNG** | `tEXt` chunk holding `c2pa`, `contentcredentials` | Chunk gone | Picture data byte identical |
| **JPEG** | `APP1` XMP naming OpenAI and DALL-E | Gone, plus an `APP13` block | Picture data byte identical, still opens |

**Every one checked by searching the raw bytes for the incriminating strings,
not by asking the tool whether it had worked.**

### RUNBOOK, 18 August 2026. `inspect_file.py` exits non-zero when it finds something

Like a scanner, not like a failure. **Exit 1 means marks were found. Exit 0 means
clean.** This broke a chained shell command during testing and it will matter for
how the site calls the engine: **a non-zero exit here is a result, not an error.**

### RUNBOOK, 18 August 2026. Two upstream test files were deleted, deliberately

`tests/test_lightweight_skill.py` and `tests/test_precommit_hooks.py`. They test
the standalone editor skill and the pre-commit hooks, **neither of which was
copied**, so they failed on missing files rather than on broken code. Removed so
the suite is green and therefore worth believing. **If the engine is ever
re-copied from upstream, delete these two again.**

### FINDING, 18 August 2026, session A2. "Not Claude" is too narrow. The rule is "nothing that marks its output"

Checked against current reporting and Anthropic's and OpenAI's own material, not
recalled.

| Vendor | Marks its text? | Usable for layer B |
|---|---|---|
| **Anthropic** | **Yes.** Every model launched on or after 2 Aug 2026, globally, no opt out | **No** |
| **Google Gemini** | **Yes.** SynthID for generated text | **No** |
| **OpenAI** | **Not as of Aug 2026.** Researched it, held it back | **Risky. See below** |
| **Open weight models** run by a third party host | **No.** The weights do not mark, and the host is not applying one | **Yes** |

**Jon's instruction was "not Claude." The real constraint is broader:** rewriting
with any vendor that marks its output swaps one watermark for another and makes
the product actively dishonest. **Gemini was not on Jon's list and is disqualified
for exactly the same reason as Claude.**

**OpenAI is the trap worth naming.** It does not mark text today, but it signed
the EU code of practice attached to Article 50(2), which is a public commitment to
machine-readable marking of synthetic output. **If OpenAI switches text marking on,
a product built on it silently starts re-stamping every rewrite and nobody would
notice**, because no detector exists to catch it.

**Design consequence, and it is the important one.** **The model must be a single
swappable setting, not something woven through the code**, and somebody must
re-check the vendor list periodically. This is the same standing obligation as
watching the engine repository for security fixes.

### FINDING, 18 August 2026. Layer B costs almost nothing, which changes the question

Read from Vercel AI Gateway's live model list, 229 language models with published
prices. A 1,000 word rewrite pays for reading and writing, roughly 2,600 tokens.

| Model | Per 1,000 words | Per 1,000 rewrites |
|---|---|---|
| `alibaba/qwen3.7-flash` | $0.00021 | **$0.21** |
| `openai/gpt-oss-20b` | $0.00032 | **$0.33** |
| `deepseek/deepseek-v4-flash` | $0.00051 | **$0.51** |
| `mistral/mistral-small` | $0.00052 | **$0.52** |
| `meta/llama-3.1-8b` | $0.00057 | **$0.57** |

**A thousand people each pasting a thousand word essay costs under a dollar.**

**So price is not the deciding factor and should not be treated as one.** Jon's
criteria were capability, unit economics, and not local. **Unit economics is
answered: they are all negligible and the spread between cheapest and dearest is
about half a dollar per thousand uses.** The decision is entirely about which one
rewrites well.

**And "rewrites well" has a specific meaning here, already paid for in
`01-build-spec.md` section 6:** a rewriter that uniformly shortens or uniformly
smooths makes prose *more* machine-like, because uniformity is itself the tell.
**Layer B can degrade the thing it sells.** Whichever model is chosen must be
judged on that, not on whether the output reads nicely in isolation.

### OPEN, 18 August 2026. Needs Jon: an AI Gateway key

Checked: no AI key exists in any `.env` file in this project. **Nothing can be
tested until one is created.** Presence checked only, values never read.

### FINDING, 18 August 2026. The investigation. Nine agents, and it overturns an earlier claim

**Correction to what was told to Jon earlier in this session.** The assistant said
the repo's layer B was "more principled than expected" on the strength of its
`--candidates` option. **That was too generous.** The investigation found layer B
is a thin single-shot paraphrase wrapper: `--candidates N` sends **N identical
requests at the same temperature** and picks a winner on vocabulary overlap; the
back-translation and structural two-pass templates are **dead code, never
referenced**; and **layer B is not wired into the HTTP server at all**
(`grep -c rewrite server.py` returns 0). More has to be built than was stated.

### THE FINDING THAT MATTERS MOST: the shipped instruction is backwards

**All three adversarial reviewers independently confirmed this.**

The repo's prompt says **"Preserve all facts, numbers, names, and technical
identifiers."** That reads to a model as *keep the sentences containing them*.

**Verbatim runs of words are the exact channel through which the watermark
survives a rewrite.** Detection recomputes a value at each position from the
*preceding few tokens plus the secret key*. A position keeps its signal **only if
the rewrite reproduces an original run of consecutive tokens.** Not if the meaning
is similar. Not if the vocabulary overlaps. **Only verbatim runs.**

So the instruction that sounds most responsible is the one that preserves the
watermark. **The fix: keep the entity, rewrite everything around it.** Keep
"$4.2 million"; rewrite the eight words either side of it.

### Jon's hypothesis: half right, and the wrong half is the half that would drive the build

**Right:** entropy gates how much signal a position *can* carry. "two plus two
equals four" carries none. This is Kirchenbauer Theorem 4.2 and Anthropic says it
directly.

**Wrong:** entropy tells you **where you may safely edit**, not **where you must
edit**. Two mechanics break the targeting idea:

1. **An edit breaks the following positions too**, because detection re-derives
   each position from its preceding context. Editing a boring word still destroys
   signal in the interesting words after it. **"Leave the rest alone" throws away
   free breakage.**
2. **A full rewrite already saturates the coverage** that targeting would buy.

**Measured evidence:** targeted rewriting gains **+0.6 points** over plain
paraphrase against a context-hashed scheme like Anthropic's, versus **+42 points**
against a context-free one. **Anthropic's hashes context. Targeting buys almost
nothing here.**

**And it is not cheaper.** Cost ordering: **model tier ~60x >> number of passes
~2x >> entropy estimation ~0.** Jon's think-smart-then-write-cheap intuition is a
real technique, but it needs two generations where one suffices, and the saving it
is famous for is a model-tier saving we already have.

### Unit economics: not the binding constraint, at any of the designs

| Design | Model | Cents per 1,000 words | Versus a 1 cent budget |
|---|---|---|---|
| Single pass | `qwen3.7-flash` | **0.0225** | 44x under |
| Single pass + 15% retry | `qwen3.7-flash` | **0.0259** | 39x under |
| Single pass | `mistral-small` | **0.0565** | 18x under |
| Best-of-4 candidates | `qwen3.7-flash` | 0.0901 | 11x under |

**A 1,000 token prompt would add 0.003 cents.** Prompt length is not the lever.
**Pass count is, and even four passes stays 11x under budget.**

**So the argument against extra passes must be that they buy nothing measurable,
not that they cost too much.** Jon named unit economics as the most important
constraint. **At these prices it is not binding.** The real constraints found were
**meaning preservation** and **a 60 second ceiling on how long a Vercel function
may run.**

### The adversarial reviewers killed the proposed measurement, and were right to

Both designs proposed showing users a "how much of your original wording survived"
percentage. **All three reviewers found it defective and one found it dishonest.**

- **It would have displayed a false number.** Demonstrated: a rewrite that scores
  **0.0%** on the proposed gate was **26.4% verbatim carry-over** by word count.
  The gate counts five-word runs; the leakage was in two and three word runs.
- **It rewards the worst failure.** If the model **drops or changes one of the
  user's numbers**, overlap falls, so the displayed score **improves**.
- **It measures the wrong thing.** The longest surviving run in the test was
  `between $4.6 million and $4.9 million`, which is the **lowest** entropy region
  in the passage and therefore carries almost no signal anyway.

**One reviewer also caught a governance failure and it is the strongest evidence
yet that this documentation system works.** A design agent cited `06` row 27 as a
logged gap its statistics panel would close. **Row 27 records Jon rejecting a
statistics panel.** The reviewer flagged it as a `CLAUDE.md` section 2 violation:
a settled document was quietly inverted rather than surfaced as a conflict.

### Still open after all of this

- **No public detector exists, so none of the above can be verified by us or
  anyone.** `06` row 24 stands.
- **Anthropic's context depth is unpublished**, so every threshold is calibrated
  against a plausible range rather than a known value.
- **Long documents are the weak case.** Signal grows with the square root of
  length, so one pass on 5,000 words is materially weaker than on 500.
- **A hosted open-weight endpoint could apply its own watermark and we would never
  know.** Excluding Anthropic and Google removes the two documented cases only.
