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

### OPEN QUESTION, 18 August 2026. Architecture. With Jon, not yet ruled

`06` row 19 and row 25. Options put to him with a recommendation. Not decided.
