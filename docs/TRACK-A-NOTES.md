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

**Session A1 in progress.** Step 1, the deployment decision, is open and with Jon.
Steps 2 onward are blocked on it.

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
