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
