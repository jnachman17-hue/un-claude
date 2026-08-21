# Engine correctness: formatting, file types, ceilings

**21 August 2026, session 12.** Territory: `apps/web/engine/**`, `apps/web/api/*.py`,
this note. No route handler, no credits file, no workbench file was edited. Where a
fix lives outside that boundary it is written up here as a handoff, not applied.

Every number below came from a command that was run. Where something was not run, it
says so.

---

# PART 1 — FORMATTING

## The finding, in one paragraph

**Formatting is destroyed in two different places, and they are unrelated.** The one
that hits every single person who pastes anything is **not in the engine at all**: the
interface renders the text inside an HTML paragraph with default whitespace handling,
so every line break in the document is displayed as a single space. The engine's own
copy of the text still has the line breaks; the screen does not. The second, smaller
loss **is** in the engine, in the layer B rewrite, and it is fixed in this session.

**The frontend half is the bigger one and I could not fix it — `marked-text.tsx` is
inside the workbench, which this session was told not to touch.** It is a one-line
change and it is written out below.

## How this was found, rather than guessed

The brief named three candidates and said to find the cause before changing anything.
All three were tested separately.

### Candidate 1 — layer A / the clean path. NOT the cause.

Layer A is the invisible-character pass. Run through `_clean_payload`, the same engine
function `/api/clean` calls, on a 932-byte essay with headings, a numbered list and
eight blank-line breaks:

```
LAYER A ONLY, through the same _clean_payload that /api/clean calls:
  bytes identical: True   in=932 out=932
```

**Byte for byte identical.** Layer A cannot be the cause, and this matters more than it
looks: it means a plain sanitise with no rewrite returns the document *unchanged*, and
Jon still sees flattened text. That alone proves the loss is after the engine.

### Candidate 2 — the chunker in `uc_chunk`. A real cause, though a smaller one.

`split_paragraphs` split the document on blank lines and rejoined every paragraph with
a flat `\n\n`, discarding whatever was actually there. Run against the code **as it was
before this session**:

```
THE SAME CASES AGAINST THE CODE AS IT WAS BEFORE THIS SESSION
(no model involved: this is the chunker's own no-op round trip)
========================================================================
  PASS  plain two paragraphs
  FAIL  triple blank line
        in : 'One.\n\n\n\nTwo.'
        out: 'One.\n\nTwo.'
  FAIL  leading + trailing newlines
        in : '\n\nOne.\n\nTwo.\n\n\n'
        out: 'One.\n\nTwo.'
  FAIL  blank line with spaces
        in : 'One.\n   \nTwo.'
        out: 'One.\n\nTwo.'
  PASS  numbered list block
  FAIL  windows endings
        in : 'One.\r\n\r\nTwo.'
        out: 'One.\r\n\nTwo.'
```

Four of six mangled, **with no model involved at all**. Blank-line runs collapsed, the
document's own leading and trailing blank lines deleted, and Windows line endings left
half-converted.

### Candidate 3 — the rewrite round trip. The other real cause.

The layer B prompt has seven rules and **not one of them mentioned layout.** Measured on
a 147-word essay and an 875-word essay, before the fix:

| Document | Paragraphs in | Paragraphs out | What was lost |
|---|---:|---:|---|
| 147-word essay | 9 | 9 | numbered list `1. 2. 3.` came back as `• • •` |
| 875-word essay | 16 | 15 | **the title line was deleted outright** |

The model folds short standalone lines — titles, headings, one-line closers — into the
paragraph next to them, or drops them. Nothing told it not to.

### Candidate 4, which the brief did not list, and which is the biggest one

**The interface renders the text in a `<p>` with default CSS whitespace handling.**
Measured live in the browser against the running dev server, after pasting a
16-newline essay and clicking Scan it:

```
{
  "matches": [{
      "tag": "P",
      "cls": "text-foreground/90 text-[15px] leading-[1.75] tracking-[-0.005em]",
      "whiteSpace": "normal",
      "textContentNewlines": 16,
      "innerTextNewlines": 0,
      "innerTextHasNewline": false,
      "first160": "The Long Shadow of the Printing Press Introduction When Johannes
                   Gutenberg assembled his press in Mainz around 1440, he was not
                   trying to remake European societ"
  }]
}
```

Read that carefully, because it is the whole finding. **`textContent` still holds all
16 newlines. `innerText` holds none.** The data is intact; the rendering collapses it.
The title, the heading and the first paragraph are run together into one line on screen.

The same component renders the *cleaned* output too (`workbench.tsx:1151`), so the
result a visitor reads is a wall of text whatever the engine returned.

**The Copy button itself is fine.** It calls
`navigator.clipboard.writeText(cleanedText)` on the raw string, which still has its line
breaks. But anyone who selects the text on screen and copies it — which is what most
people do, and what the flattened display invites — gets the flattened version, because
a selection copies what is rendered.

## What was changed, and where

All three edits are inside `apps/web/engine/`.

### 1. `uc_chunk.py` — the document's real spacing is now kept and put back

`split_paragraphs` was replaced by `_split_blocks` / `_plan_chunks` / `_weave` /
`_restore`. The separator between every pair of paragraphs is captured instead of
discarded, along with the document's own leading and trailing newlines, and put back
exactly where it was. Chunks are rejoined with the separator that actually sat between
them rather than a flat blank line.

`split_paragraphs` still exists with the same signature and same meaning, so nothing
that called it broke.

### 2. `rewrite_text.py` — the prompt now has a layout rule

Added as rule 7 of the `unclaude` prompt (and rule 6 of `unclaude_retry`), which pushes
"output only the rewritten text" down one number:

> **KEEP THE LAYOUT EXACTLY AS IT ARRIVED.** Return the same number of paragraphs, in
> the same order, separated by a blank line. Never merge two paragraphs into one and
> never split one into two. A short line standing on its own is a heading or a title:
> keep it on its own line and keep it — never fold it into the paragraph below it and
> never delete it. Keep every line break inside a paragraph where it is, and keep list
> markers in the form the original used: `1.` stays `1.`, `-` stays `-`, a bullet stays
> a bullet.

### 3. `uc_chunk.py` — one bounded re-roll when the model loses a paragraph anyway

After each chunk comes back, its paragraph count is compared with what went in. If it
matches, the original separators go back on and the structure is **exact**. If it does
not, the engine **keeps the model's own layout and says so** rather than guessing where
a paragraph break belonged — guessing at the shape of somebody's document is not
something this tool should do.

Because the rewrite is non-deterministic, another roll usually lands it. So a chunk that
kept its facts but lost its paragraphs gets **one** extra attempt, capped by a new
`UC_LAYER_B_STRUCTURE_RETRIES` (default 1, set 0 to disable). It is deliberately
separate from the fact guard's budget of eight: a re-roll costs a model call and seconds
against the function ceiling, and part 4 of this brief is about that ceiling.

Where the fact guard is *already* retrying, structure costs nothing at all — it is used
as a tie-break between attempts that dropped the same number of figures.

### 4. The result is now reported, so this cannot regress silently

Every layer B response now carries `paragraphs_in`, `paragraphs_out` and
`structure_kept`. None of the three existed before, which is why nobody knew.

## Proof

### The deterministic half: guaranteed, and it now is

Eleven shapes of document through the split-and-rejoin, and then through a rewrite where
the model returns its input unchanged:

```
DETERMINISTIC ROUND TRIP  (split -> weave), no model involved
========================================================================
  PASS  plain two paragraphs         paras=2 chunks=1
  PASS  triple blank line            paras=2 chunks=1
  PASS  leading + trailing newlines  paras=2 chunks=1
  PASS  blank line with spaces       paras=2 chunks=1
  PASS  soft-wrapped paragraph       paras=2 chunks=1
  PASS  numbered list block          paras=3 chunks=1
  PASS  indented block               paras=3 chunks=1
  PASS  single paragraph             paras=1 chunks=1
  PASS  windows endings              paras=2 chunks=1
  PASS  whitespace only              paras=0 chunks=0
  PASS  no trailing newline          paras=3 chunks=1
========================================================================
11/11 identical, 0 failed

NO-OP REWRITE  (a model that echoes its input) must return the document unchanged
========================================================================
  PASS  plain two paragraphs         paras_in=2 paras_out=2 kept=True
  PASS  triple blank line            paras_in=2 paras_out=2 kept=True
  PASS  leading + trailing newlines  paras_in=2 paras_out=2 kept=True
  PASS  blank line with spaces       paras_in=2 paras_out=2 kept=True
  PASS  soft-wrapped paragraph       paras_in=2 paras_out=2 kept=True
  PASS  numbered list block          paras_in=3 paras_out=3 kept=True
  PASS  indented block               paras_in=3 paras_out=3 kept=True
  PASS  single paragraph             paras_in=1 paras_out=1 kept=True
  PASS  windows endings              paras_in=2 paras_out=2 kept=True
  PASS  no trailing newline          paras_in=3 paras_out=3 kept=True
========================================================================
0 failed
```

The re-roll fires exactly once and only when it is needed:

```
no-op round trip: 8/8 byte-identical, 8 model calls (1 per chunk, no structure re-rolls)

always-merges model: 2 model calls for 1 chunk (1 first attempt + 1 structure re-roll),
                     paragraphs 3 -> 1, structure_kept=False
  returned: 'One. Two. Three.'   <- the model's own layout, not a guess
```

### The real half: a real essay, real model, whole thing pasted in

875 words, 16 paragraphs, a title, a one-line closer. Live against
`mistral/mistral-small` through the AI Gateway.

```
{
  "seconds": 36.05,
  "chunks": 3,
  "words_in": 875,
  "words_out": 882,
  "paragraphs_in": 16,
  "paragraphs_out": 16,
  "structure_kept": true,
  "figures_to_check": ["80"],
  "usage": { "attempts": 11, "model_calls": 11, "retries": 8,
             "total_tokens": 12911, "cost_usd": 0.0020995 }
}
```

**16 paragraphs in, 16 out, aligned one for one and in order** — including the title,
which the run before the fix deleted, and the closing one-liner, which the run before
the fix absorbed:

```
paragraph-for-paragraph alignment, 16 in / 16 out
==========================================================================
 1  IN : Why the Coffee House Mattered
    OUT: Why the Coffee House Held Significance
 2  IN : In 1652 a Greek servant named Pasqua Rosee opened the first coff
    OUT: In the year 1652 a servant from Greece, named Pasqua Rosee, init
 3  IN : What made it matter was not the drink. It was the seating. A tav
    OUT: What granted them influence was not the beverage itself but the
 4  IN : The economics were unusual too. A cup cost roughly a penny, and
    OUT: The financial structure defied convention as well. A single serv
 5  IN : Specialisation followed quickly. Traders in marine insurance gat
    OUT: Specialised gatherings sprang up in short order. Those trading m
 6  IN : That last detail is worth sitting with. The London Stock Exchang
    OUT: The final element merits careful reflection. The London Stock Ex
 7  IN : The political consequences arrived fast enough to alarm the crow
    OUT: The swift political fallout unsettled the monarchy. In December
 8  IN : Eleven days is a short life for a royal proclamation, and the re
    OUT: Eleven days proved too brief for a royal decree, and the explana
 9  IN : Women were excluded from most of them, and said so. A pamphlet o
    OUT: Female patrons were systematically barred from most establishmen
10  IN : The newspapers deserve their own paragraph. Coffee houses did no
    OUT: The press merits its own section. Coffeehouses did more than sup
11  IN : That is a division of labour in the gathering of news, worked ou
    OUT: This informal division of journalistic labor—shaped by where peo
12  IN : Postal habits changed as well. A regular customer could have let
    OUT: Postal routines shifted in kind. A loyal patron might request ma
13  IN : None of this was designed. The coffee house was a commercial ven
    OUT: None of this was deliberate. The coffeehouse functioned as a com
14  IN : There is a temptation to draw the obvious modern comparison and
    OUT: It’s tempting to make the straightforward comparison to modern d
15  IN : The decline, when it came, was slow and had ordinary causes. Tea
    OUT: The decline unfolded gradually and for entirely routine reasons.
16  IN : That is a considerable inheritance for a room with a shared tabl
    OUT: This is no small legacy for a modest room with a shared table in
```

And the 147-word essay, whole, before and after — headings intact, and the numbered
list keeps `1. 2. 3.` where before the fix it came back as bullets:

**BEFORE**

```
The Long Shadow of the Printing Press

Introduction

When Johannes Gutenberg assembled his press in Mainz around 1440, he was not
trying to remake European society. He was a goldsmith looking for a business.

Yet within fifty years there were printing shops in more than two hundred
European towns, and the number of books in circulation had risen from perhaps
thirty thousand manuscripts to over nine million printed volumes.

Three consequences followed, and historians still argue about their order.

1. Literacy spread outward from the clergy.
2. Vernacular languages hardened into national standards.
3. The cost of being wrong in public rose sharply.

The third point deserves more attention than it usually gets. A manuscript
error stayed in one library. A printed error travelled.

Conclusion

The press did not cause the Reformation, the scientific revolution, or the
nation state. It made each of them cheaper to attempt.
```

**AFTER**

```
The Extensive Impact of the Printing Machine

Introduction

When Johannes Gutenberg constructed his device in Mainz approximately 1440, his
intent was not to transform European civilization. He was merely a metalworker
in search of income.

Within fifty years, however, printing facilities had appeared in over two hundred
European cities, and the count of available texts had increased from around thirty
thousand handwritten works to more than nine million printed copies.

This led to three major outcomes, and historians continue to debate their
sequence.

1. Reading skills expanded beyond religious circles.
2. Local dialects solidified into recognized national languages.
3. The social penalty for publicly held incorrect views grew substantially.

The final consequence merits deeper consideration than it typically receives. An
error in a handwritten document remained confined to a single library. A printed
mistake, by contrast, could reach countless readers.

Conclusion

The invention did not single-handedly spark the Reformation, the scientific
advancement, or the formation of nation states. It simply reduced the expense of
pursuing each of these developments.
```

### Nothing else broke

```
495 passed, 1 skipped in 11.10s
```

(`ENGINE.md` section 11 records 487 passing; the suite has grown since. No failures.)

## What is honest to claim, and what is not

- **The deterministic half is guaranteed.** Paragraph separators, blank-line runs,
  leading and trailing whitespace, and the joins between chunks are now exact. That is
  proved by the 11/11 table above and it does not depend on any model.
- **The rewrite half is best effort, like everything else in layer B.** It depends on a
  model following a prompt rule. It went from losing a title on a 16-paragraph document
  to keeping all 16, but that is one run of one document, not a guarantee. What *is*
  guaranteed is that the engine no longer hides it: `structure_kept` is in every
  response.
- **Two documents were tested, not twenty.** This is the weakest part of the evidence.

---

## HANDOFF TO JON — the bigger half of part 1, which is not mine to fix

### 1. The flattened display. One line. `marked-text.tsx:73`

```
'text-foreground/90 text-[15px] leading-[1.75] tracking-[-0.005em]'
```

needs `whitespace-pre-wrap` adding:

```
'text-foreground/90 text-[15px] leading-[1.75] tracking-[-0.005em] whitespace-pre-wrap'
```

That is the whole fix. The component already receives the text with its line breaks
intact — it splits it into spans by character offset and every newline is inside one of
those spans. `pre-wrap` keeps the line breaks and still wraps long lines, which is what
is wanted. Nothing about the hidden-character markers changes.

**This affects both views**: the scanned input at `workbench.tsx:1154` and the cleaned
output at `workbench.tsx:1151`. One change fixes both.

**Verify it by re-running the browser check above** and confirming `innerTextNewlines`
matches `textContentNewlines`.

### 2. The stale word count. `workbench.tsx:557` and `1465`. Confirmed, read-only.

Jon's report: paste 10,000 words, sanitise, clear the box, and it still says
"10,027 words = 11 credits".

The conductor's hypothesis was right, and here is the exact mechanism. The price line
reads:

```
workbench.tsx:1465   const words = countWords(loaded.text || text);
```

`clearResults()` (line 557) runs on **every keystroke** after a scan and resets `scan`,
`cleaned`, `cleanedText`, `message` and `phase` — **but never `loaded`**. Only
`startOver()` (line 578) clears `loaded`. So once a scan has happened, `loaded.text`
holds the old paste for the rest of the session, `loaded.text || text` always picks the
stale one, and emptying the textarea changes nothing on screen.

Two more things fall out of the same cause and should be fixed together:
- the row is shown at all because the condition at line 1456 is
  `loaded.text || text || isFile`, so it survives an empty box;
- the placeholder never comes back, because line 1176 requires `loaded.text === ''`.

`countWords(loaded.text || text)` also appears at lines 377 and 1400, on the paywall and
tracking paths, so the same stale number is being sent to those.

**I did not run this one.** It is read from the source, and it explains the symptom
exactly, but a session that owns the workbench should confirm it in the browser before
calling it fixed.

### 3. Decision log entries are owed

CLAUDE.md section 6 says a decision goes in `04-decision-log.md` and an open question in
`06`. This brief restricted this session to the engine, the Python functions and this
file, and both of those documents were being edited by other sessions today. Rather than
write into a shared file mid-session I am naming what is owed:

- **04**: the layout rule is now part of the layer B prompt, and paragraph structure is
  restored deterministically but never guessed at.
- **04**: `UC_LAYER_B_STRUCTURE_RETRIES`, default 1, is a new cost-and-time knob.
- **06**: layer B paragraph preservation is best effort and measured on two documents.
- **ENGINE.md section 6** should gain `UC_LAYER_B_STRUCTURE_RETRIES` in the settings
  table. Not done: this session's brief did not include a documentation pass and
  `ENGINE.md` is heavily cross-referenced.

---

## What part 1 did not do

- **Did not test on production.** Every layer B run above is against the same engine
  code, called through the same `_clean_payload`, but locally and directly rather than
  over HTTP through `/api/tool/clean`. The formatting behaviour is in the engine and the
  browser, and neither is changed by the hop; the timing is not comparable and no timing
  claim is made from these runs.
- **Did not fix the display.** Out of territory. See the handoff.
- **Did not test a `.docx` round trip.** That is part 2.
- **Did not test more than two documents.**

---

# PART 2 — EVERY FILE TYPE, END TO END

## The correction the brief asked for, confirmed and then acted on

The brief's correction was right and the situation was slightly worse than it
said. **Nothing validated the extension anywhere.** `ACCEPTED_FILES` in
`encode.ts` is the file picker's `accept` attribute, which a "All Files" choice
or a drag-and-drop walks straight past. The clean route has no allowlist. So the
real accepted set was the engine's own: **12 text extensions and 12 container
extensions, 24 in all**, including `.pdf`, `.xlsx`, `.pptx`, `.epub`, `.odt`,
`.html` and `.svg`. None was ever chosen, and none was ever tested.

## What changed: the four things, enforced at the front door

`apps/web/api/_shared.py` now holds an allowlist, and `read_request` applies it
to **both** `/api/scan` and `/api/clean`:

```python
ACCEPTED_EXTS = (".txt", ".docx", ".png", ".jpg", ".jpeg")
```

Five extensions, four things: **pasted text, a Word document, a PNG, a JPG.**
`.txt` is there because pasted text arrives as `paste.txt` — the browser has no
separate text path, so refusing `.txt` would refuse every paste.

**It also checks the bytes, not only the name.** A `.png` must carry the PNG
signature, a `.jpg` the JPEG one, a `.docx` must be a zip that actually contains
`word/document.xml` (which is what separates it from `.xlsx`, `.pptx`, `.odt` and
`.epub`, all of which are zips too), and a `.txt` must not be a binary we
recognise and must carry no NUL bytes.

**Deliberately NOT in `engine/format_dispatch.py`.** That file is vendored
upstream code shared with the command line tools and the audits, and it is one of
the two lists `verify-pricing-matches-engine.mjs` compares. Narrowing it would
have broken the guard I was told to keep passing. The restriction belongs at our
product's front door, and that is where it now is.

**The guard was run, as instructed, and still passes:**

```
Does the PRICE agree with the WORK about what a file is?
==================================================================

engine TEXT_EXTS       .css .csv .go .js .json .py .rs .text .toml .txt .yaml .yml
route ENGINE_TEXT_EXTS .css .csv .go .js .json .py .rs .text .toml .txt .yaml .yml

engine CONTAINER_EXTS  .docx .epub .htm .html .markdown .md .mdx .odt .pdf .pptx .svg .xlsx

  PASS  nothing the engine rewrites is priced as a flat file
  PASS  nothing priced by the word is refused a rewrite by the engine
  PASS  nothing priced as text is a CONTAINER to the engine

==================================================================

The price and the work agree on every extension.
```

## The front door, as it now behaves

Every row below is a real call to `_shared.read_request`:

```
name                       result                                 name used
============================================================================
paste.txt                  accepted                               'paste.txt'
essay.txt                  accepted                               'essay.txt'
photo.png                  accepted                               'photo.png'
PHOTO.PNG                  accepted                               'PHOTO.PNG'
shot.jpg                   accepted                               'shot.jpg'
shot.jpeg                  accepted                               'shot.jpeg'
report.docx                accepted                               'report.docx'
essay.csv                  REFUSED 400 bad_format                 -
essay.md                   REFUSED 400 bad_format                 -
essay.pdf                  REFUSED 400 bad_format                 -
notes.html                 REFUSED 400 bad_format                 -
book.epub                  REFUSED 400 bad_format                 -
sheet.xlsx                 REFUSED 400 bad_format                 -
noext                      REFUSED 400 bad_format                 -
a.png   (a docx renamed)   REFUSED 400 bad_format                 -
a.docx  (a png renamed)    REFUSED 400 bad_format                 -
a.txt   (a png renamed)    REFUSED 400 bad_format                 -
empty.txt                  REFUSED 400 no_file                    -
../../etc/passwd.txt       accepted                               'passwd.txt'
my essay final (2).txt     accepted                               'my essay final (2).txt'
проба ünïcode 文書.txt       accepted                               'проба ünïcode 文書.txt'
```

**`essay.csv` is the one that matters**: that is the exact name the Stripe audit
found buying an unlimited rewrite for one credit. It is now refused at the door.

## The end-to-end table

Layer B was **off** for all of it — this part is about file integrity, not the
rewrite, and layer B never runs on a `.docx`, `.png` or `.jpg` anyway. Every
fixture was hand-built with the Python standard library, because CLAUDE.md
section 3 forbids reading any file outside this folder and section 5 forbids
installing anything.

| Fixture | Front door | Scan: kind / suspicious | Clean | **Output still opens?** | Credits |
|---|---|---|---|---|---|
| `paste.txt` 2143 B | accept | text / **yes** (48) | removed 47 invisibles, replaced 1 NBSP | **YES** UTF-8 | 1 (357 words) |
| `essay.txt` same bytes | accept | text / yes (48) | identical | **YES** | 1 |
| `clean.docx` | accept | container / yes | scrubbed creator, lastModifiedBy, Application, Company, AppVersion | **YES** zip valid, parts present, XML parses, visible text unchanged | 1 flat |
| `marked.docx` | accept | container / yes | as above plus dropped `docProps/custom.xml` | **YES** same checks | 1 flat |
| `clean.png` | accept | image / no | nothing to remove | **YES** all CRCs valid, pixels byte-identical | 1 flat |
| `marked.png` | accept | image / yes | dropped tEXt, dropped iTXt | **YES** CRCs valid, pixels byte-identical | 1 flat |
| `clean.jpg` | accept | image / **no** | dropped APP1, APP13 | **YES** scan data byte-identical | 1 flat |
| `marked.jpg` | accept | image / yes | dropped APP1, dropped COM | **YES** scan data byte-identical | 1 flat |
| clean `.txt`, no marks | accept | text / **no** (0) | `removed_count: 0, replaced_count: 0` | **YES** unchanged | 1 |
| 4.9 MB `.txt` | accept | text / yes (109,652) | removed 107,367, replaced 2,285 | **YES** | **816** |
| 2.1 MB `.png` | accept | image / no | nothing to remove | **YES** pixels byte-identical | 1 flat |
| 2.8 MB `.docx` | accept | container / yes | metadata scrubbed | **YES** visible text unchanged | 1 flat |
| 5.4 MB `.txt` | **REFUSED 413 `too_large`** | — | — | — | — |
| invalid UTF-8 `.txt` | accept | text / no | 0 removed | byte-identical in and out | 1 |
| `.txt` containing NUL | **REFUSED 400 `bad_format`** | — | — | — | — |
| zip with `word/document.xml` deleted | **REFUSED 400 `bad_format`** | — | — | — | — |
| docx containing a nested zip | accept | container / yes | metadata scrubbed | **YES** zip valid, text unchanged | 1 flat |

**Nothing came back corrupted.** Every PNG's pixels, every JPEG's entropy-coded
scan, and every DOCX's visible text survived byte for byte. That was checked by
reading the bytes — CRC32 on every PNG chunk, marker walking on the JPEG, and
`zipfile` plus an XML parse on the DOCX — not by asking the engine whether it had
worked.

**The metadata really was removed**, read back out of the cleaned bytes:

```
marked.png
  IN  IHDR  crc OK | tEXt payload=b'Software\x00Claude' | iTXt payload=b'Comment\x00...Generated by Claude Opus 5' | IDAT | IEND
  OUT IHDR  crc OK | IDAT | IEND
  b"Claude" in OUT bytes : False
  IDAT payload identical : True
  OUT == the unmarked original PNG, byte for byte : True

marked.docx
  IN  docProps/app.xml  : <Application>Claude</Application><Company>Anthropic</Company>
  OUT docProps/app.xml  : <Application></Application><Company></Company>
  IN  docProps/core.xml : <dc:creator>Claude</dc:creator><cp:lastModifiedBy>Claude</cp:lastModifiedBy>
  OUT docProps/core.xml : <dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy>
  b"Claude" anywhere in OUT bytes    : False
  b"Anthropic" anywhere in OUT bytes : False
  word/document.xml identical in/out : True

marked.jpg
  IN  segments [E0, E1(Exif...Claude Opus 5), FE(Generated by Claude Opus 5), C0, C4..., SOS, scan, EOI]
  OUT segments [E0,                                                          C0, C4..., SOS, scan, EOI]
  b"Claude" in OUT bytes : False
  scan bytes identical   : True
```

## What a PDF actually does, which nobody knew

**At the front door it is now refused**, consistent with 04 entry 26:

```
read_request({... "name": "essay.pdf"}) ->
  (400, {'ok': False, 'code': 'bad_format',
         'error': 'That file type is not supported. Use text, a Word document, PNG or JPG.'})
```

**Bypassing the door and calling the engine directly**, with a valid hand-built
PDF carrying `/Producer (Claude Opus 5)`:

```
classify_bytes(pdf, ".pdf") -> container

_inspect_payload -> "has_ai_metadata": true,
                    "findings": ["pdf-structured:ai:Claude"],
                    "suspicious": true

_clean_payload  -> "actions": ["no PDF cleaner available (install exiftool for
                                reliable metadata strip); copied as-is"],
                   "bytes_in": 719, "bytes_out": 719,
                   "still_has_ai_metadata": true,
                   "meta": {"mode": "copy", "degraded": true}

output == input          : True
b"Claude" still in output: True
```

So the answer is: **it detects the mark, returns the file completely unchanged,
says so honestly in the report, and returns `ok: true`.** The file is not damaged.
But `billing_estimate` returns one credit for it, so if that path were ever
reachable a customer would pay a credit for a no-op whose own report says it did
nothing. It is not reachable now.

## Findings from part 2

### F1. A document with NO AI metadata is still reported as scrubbed, and loses its author

This is the container half of the brief's own test — "a clean input must not be
reported as cleaned of something" — and it fails.

Fixture: a `.docx` with `dc:creator` = "Jon Nachman", `Application` =
"Microsoft Office Word", and no AI markings at all.

```
scan : kind=container  suspicious=False  findings=[]  has_ai_metadata=False
clean actions: ['scrub docProps/core.xml field dc:creator',
                'scrub docProps/core.xml field cp:lastModifiedBy',
                'scrub docProps/app.xml field Application',
                'scrub docProps/app.xml field AppVersion']
core.xml OUT: <dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy>
```

The scan is honest. The clean reports four "scrub" actions on a file that had
nothing AI in it, **and deletes the user's own name from their own document.**

The text path gets this right — a clean `.txt` reports `removed_count: 0` and
claims nothing. The container path does not.

**Not fixed, deliberately.** Whether "clean" means "remove AI marks" or "remove
all identifying metadata" is a product decision and Jon's, not mine — and there is
already a `keep_non_ai_metadata` option in the clean route's `ALLOWED` set that
nothing sends. My recommendation: keep stripping (anonymity is a reasonable thing
to sell) but **report AI findings and general metadata separately**, so a file
with nothing AI in it is never described as having had an AI mark removed.

### F2. The scan told the browser where our server keeps its temp files. FIXED.

Every image and container scan came back carrying:

```
report.path = /var/folders/5r/rqsn81s52mb2wfp7nsmkc5hh0000gn/T/wm-inspect-vjlp3as1/clean.docx
```

`_clean_payload` pops its own `input`/`output` keys; `_inspect_payload` popped
nothing, and `scan.py` returned the report whole. Text scans additionally echoed
the filename inside `report.stylometry.path`.

Fixed in `_shared.py` (`strip_server_paths`), applied in both `scan.py` and
`clean.py`:

```
  report carried a server path before stripping: True
  report carries a server path after stripping : False
```

### F3. A filename with a path in it crashed with the wrong error. FIXED.

`../../etc/passwd.txt` was **accepted** by the front door, reached the engine, and
died inside `server._tmp_path` with `ValueError: unsafe filename`, which
`clean.py` maps to `bad_format` — so the user was told "that file type is not
supported" for what is a filename problem.

**Nothing was ever written outside the temp directory**; `_tmp_path` refused
first, which is exactly what it is for. But the request should not have got that
far. `_shared.safe_name` now takes the basename at the door, so
`../../etc/passwd.txt` becomes `passwd.txt` and cleans normally — friendlier than
refusing, and it is almost certainly what the person wanted.

### F4. The scan and the clean disagree about a JPEG with only ordinary metadata

A JPEG produced by macOS `sips` scanned as `suspicious: False`, `findings: []` —
correctly, there is nothing AI in it. The clean then reported
`["drop APP1", "drop APP13"]` and returned a file 136 bytes smaller. Those were an
Exif block and a Photoshop block, neither AI.

Same root cause as F1 on the image path. A user who scans first is told nothing
was found and then watches bytes disappear.

### F5. Smaller notes

- A file named exactly `.txt` is refused, because `Path(".txt").suffix` is `''`.
  Safe outcome, reached by accident rather than by rule.
- Invalid UTF-8 in a `.txt` is accepted and round-trips **byte-identical** — the
  engine corrupts nothing. But it is billed on a word count taken from a lossy
  decode. Open question rather than a defect.
- `.jpeg`, uppercase extensions and a missing `name` all behave as intended.

## What part 2 did not do

- **`exiftool` and `c2patool` are not installed**, so container and image metadata
  detection ran in its degraded, standard-library-only mode throughout. That is
  why the PDF cleaner is a no-op. Installing is forbidden by CLAUDE.md section 5.
- **No file written by real Word, a real camera, or a real AI tool was used.**
  Every fixture was hand-built. A DOCX from actual Word carries far more parts than
  mine. "Opens" means the structural checks passed, **not that Microsoft Word
  opened it.** This is the same caveat ENGINE.md section 2 already carries.
- **Genuine signed C2PA provenance was not tested.** A valid manifest cannot be
  hand-built, so `has_c2pa` was false everywhere and that detector is unexercised.
- **The tests called the functions, not the HTTP surface.** `authorised()`, the
  engine key check and `Content-Length` handling are not covered by this table.
- The exact 5 MB boundary was not tested; 4.9 MB and 5.4 MB were.

---

# PART 3 — THE PRICING ARBITRAGE: TESTED, AND IT IS NOT THERE

**The brief said: 10,000 pasted words costs 10 credits, the same text uploaded as
a `.txt` costs 1, same work for a tenth of the price. The first half is true. The
second half is not, and the difference matters.**

Run live, against the real database, **with the dev bypass off**, on one
throwaway account funded by inserting a ledger row directly and deleted
afterwards, exactly as the brief describes:

```
throwaway account 587f87e0
funded +60 credits with reason "purchase"
the document: 2616 words, identical bytes in all three runs

signed in with a real session cookie: true (1 sb- cookies, dev bypass NOT used)

PASTED into the box                name=paste.txt  layer_b sent=true  -> HTTP 200 charged=3 balance=62 rewrite actually ran=true  16.6s
the SAME text uploaded as .txt     name=essay.txt  layer_b sent=false -> HTTP 200 charged=1 balance=61 rewrite actually ran=false  1.5s
.txt upload, rewrite forced on     name=essay.txt  layer_b sent=true  -> HTTP 200 charged=3 balance=58 rewrite actually ran=true  13.6s

THE LEDGER FOR THIS ACCOUNT, every row:
  447      +60  purchase          -       -      words_in=-
  448       +2  anon_grant        -       -      words_in=-
  449       +3  signup_grant      -       -      words_in=-
  450       -3  spend             clean   text   words_in=2616
  453       -1  spend             clean   file   words_in=2616
  456       -3  spend             clean   file   words_in=2616

account deleted; ledger rows remaining for it: 0 (must be 0)
```

**Read the third row.** The same `.txt` upload, with the rewrite actually
requested, is charged **3 credits — exactly what the paste cost.** The route
prices by words whenever a rewrite will run, whatever the file is called. The
Stripe audit's fix holds. **There is no way to buy a rewrite at a discount by
renaming a paste to a file.**

## So what IS the one-credit case?

**It is a different product, sold silently.** Look at the `rewrite actually ran`
column: for the 1-credit upload it is `false`, and the run took 1.5 seconds
instead of 16.6.

The cause is one line in the interface:

```
workbench.tsx:355   const carriesProse = !isFile || scan?.kind === 'container';
```

For a `.txt` upload, `scan.kind` is `"text"`, not `"container"`, so `carriesProse`
is **false**, so `wantsRewrite` is false, so the browser never asks for the
rewrite. The user gets layer A only, pays one credit, and **nothing tells them the
rewrite did not run.**

Paste your essay: the watermark rewrite, priced by the word.
Upload the identical essay as a `.txt`: invisible characters only, one credit.

**This is a finding for Jon, not something I changed** — the pricing rule is his
and the workbench is not mine. Two ways to settle it, and my recommendation is
the first:

1. **Make `.txt` upload behave exactly like a paste.** A `.txt` IS prose; the
   engine rewrites it perfectly well, as row three proves. The condition becomes
   `!isFile || scan?.kind === 'container' || scan?.kind === 'text'`. One line, and
   the two routes into the product stop being different products.
2. Keep the distinction, and say so in the interface before the button is pressed.

## A second, smaller price defect found on the way

`credits.ts:costFor` — the price the **browser shows** — still uses the extension
list the Stripe audit removed from the route:

```
credits.ts   const textLike = !input.isFile || /\.(txt|md|markdown|text)$/i.test(input.name);
route.ts     const ENGINE_TEXT_EXTS = ['.txt','.text','.css','.js','.py','.rs','.go','.json','.yaml','.yml','.toml','.csv'];
```

`.md` and `.markdown` are in the browser's list and not in the server's. So a
`.md` upload is **displayed** at one credit per 1,000 words and **charged** one
flat credit. The customer is quoted more than they pay, which is the safe
direction, but the two disagree. `.md` is refused at the engine's door as of this
session, so the quote is now for a file that will be rejected.

**Read from source, not run** — I could not exercise it because the front door now
refuses `.md` before any price is charged. `credits.ts` is not my territory.

### An observation, not a finding

A brand-new account that never was a guest received **both** `+2 anon_grant` and
`+3 signup_grant` (rows 448 and 449). That is 5 credits, which is the same total
a visitor gets by guesting first and then signing up, so it looks consistent
rather than wrong. Noting it because it was visible in the ledger and somebody
should confirm it is intended.

---

# PART 4 — THE TWO CEILINGS

## (a) Why 10,000 words failed locally with nothing timing it out

**Reproduced, and the cause is not a timeout. The engine gives up.**

```
{ "ok": false, "seconds": 95.32,
  "usage": { "attempts": 149, "model_calls": 149, "retries": 119,
             "total_tokens": 172246, "cost_usd": 0.0246386, "chunks": 34 } }

WHY EACH ATTEMPT ENDED AS IT DID
  FactsLost          126
  ok                  19
  TruncatedRewrite     4

chunks that burned all eight attempts: {0, 3, 6, 8, 11, 17, 23, 25}
```

**149 model calls, 95 seconds, 2.5 cents spent, and the request returned
nothing.** Eight of the 34 chunks used every one of their eight attempts.

The mechanism, exactly:

- The **fact guard** is advisory — a chunk that keeps losing a figure keeps its
  best attempt and carries on. On its own it cannot fail a document.
- The **length guard** is a hard failure by design (04 entry 22: overflow rejects,
  never truncates). On the **last** attempt it re-raised, and that exception
  escaped `pool.map` and killed the whole request.
- Put together: a chunk spends seven attempts losing figures — so it is *holding a
  perfectly good rewrite* — and then its eighth roll happens to come back short,
  and the good rewrite is thrown away along with the entire document.

**It gets worse with length, which is why 5,000 worked and 10,000 did not.**
34 chunks with 8 rolls each is 272 chances for one roll to come back short, and
any single one of them ended the request.

### Fixed, without softening 04 entry 22

A short last attempt no longer discards a good earlier one:

```python
if best_out is not None:
    return i, best_out, best_info, best_missing, usage, best_kept
raise
```

**Nothing truncated is ever returned.** `best_out` passed the same length guard
when it was recorded. The only change is that a good rewrite already in hand is
no longer thrown away because a later roll was bad. If there is no good attempt,
it still raises and the request still fails and refunds.

### Also added: a time budget on retries

ENGINE.md section 10 lists this as improvement zero — "a time budget on retries,
not only a count" — and the measurement above is the evidence for it. New
`UC_LAYER_B_DEADLINE`, default **100 seconds**, after which retries stop and the
best attempt so far is returned.

### The same document, after both fixes

```
{ "ok": true, "seconds": 78.68, "words_in": 10464, "words_out": 10262,
  "paragraphs_in": 192, "paragraphs_out": 193,
  "usage": { "model_calls": 132, "retries": 98, "cost_usd": 0.0219923 } }

  FactsLost          106
  ok                  23
  TruncatedRewrite     3
```

**Three chunks still came back short and none of them killed the document.**

## (b) The table of words against seconds

**Stated plainly first: this is measured on LOCALHOST, not production.** I was
told not to deploy, so production is running the code as it was before this
session, and its `/api/scan` and `/api/clean` require an engine key that is a
Vercel-only secret — a direct production measurement was not available to me.
Every row is the engine's own code called in-process, which means it carries **no
HTTP, no base64 and no cold start**. Real production numbers will be larger.

The filler is one 875-word essay repeated with a distinct heading per section and
**every number shifted per section**, so the fact guard sees fresh figures rather
than the same ones. That makes it grammatical, realistic prose but deliberately
**number-dense, which is the known worst case** for retries (06 row 66). Treat
these as pessimistic.

| Words | Seconds | Chunks | Model calls | Retries | Cost | Paragraphs in→out | Result |
|---:|---:|---:|---:|---:|---:|---|---|
| 2,616 | **35.8** | 9 | 35 | 26 | $0.0059 | 48 → 48 | success |
| 5,232 | **68.6** | 17 | 89 | 72 | $0.0143 | 96 → 98 | success |
| 7,848 | **104.2** | 26 | 116 | 90 | $0.0183 | 144 → 143 | success |
| 10,464 | **78.7** | 34 | 132 | 98 | $0.0220 | 192 → 193 | success |
| 10,464 | 95.3 | 34 | 149 | 119 | $0.0246 | — | **failed, before the fix** |

**Read the 7,848 row against the 10,464 row.** The shorter document took
**longer**. Time here does not track length; it tracks how many retries the fact
guard demands, and that is a roll of the dice. Any promise made about "how long a
document of size N takes" would be false.

**What it actually costs.** $0.0220 for 10,464 words is **0.21 cents per 1,000
words**. ENGINE.md section 8 says "~0.06 cents per 1,000 words typical" — about a
quarter of what I measured. My corpus is number-dense and therefore worst-case, so
this is not a contradiction, but **the documented figure is a best case and reads
like a typical one.** The failed run cost more than the successful one, which is
the property 06 row 48 already warns about.

## THE CEILING NOBODY HAD RECORDED, AND IT IS THE ONE THAT BINDS

`limits.md` raised Vercel's `maxDuration` from 60 to 300 seconds and recommended
it as the fix. **That change bought nothing above 120 seconds, because the site
gives up on its own engine call first:**

```
apps/web/lib/engine/client.ts:143
  return call<CleanResult>(CLEAN_PATH, { ...payload, options }, slow ? 120_000 : 20_000);

apps/web/lib/engine/client.ts:101
  const timer = setTimeout(() => controller.abort(), timeoutMs);

apps/web/lib/engine/client.ts:120
  } catch { return failure('unreachable'); }
```

So the real chain is:

| Ceiling | Value | Where |
|---|---|---|
| One model call | 45s | `WATERMARKS_REWRITE_TIMEOUT` |
| Retries, whole document | **100s, new this session** | `UC_LAYER_B_DEADLINE` |
| **The site's own abort** | **120s** | `lib/engine/client.ts:143` |
| Vercel's function cap | 300s | `vercel.json` |

**Past 120 seconds the browser is told "We could not reach the service", the
credit is correctly refunded, and the Python function carries on running and
being billed for a result nobody will ever receive.** The 7,848-word row above
took 104.2 seconds *before* any HTTP overhead. That is not a theoretical margin.

## The recommendation: an honest limit, and raise the abort so the limit is real

**One recommendation, not a menu.**

**Set the limit at 10,000 words, and raise the site's 120-second abort to 240
seconds. Both, because the first is not true without the second.**

Why not the other two:

- **Raising the cap** is what `limits.md` already did, and the measurement above
  shows it changed nothing: 300 seconds was never reachable, because 120 came
  first. Raising the abort is part of my recommendation, but on its own it just
  moves the wall — 7,848 words at 104 seconds says the wall is close at sizes well
  under the cap.
- **Background work** is the architecturally right answer and I would recommend it
  for a product that means to take 50,000-word documents. It needs a job store, a
  status endpoint and an interface that can show progress — none of which exists,
  and the interface is not this session's to build. It is the right answer for
  later and the wrong size for now, which is the same judgement `limits.md` made.

Why 10,000 specifically: it is Jon's own figure, and the measurements support it
rather than merely permit it. 10,464 words ran in 79 and 95 seconds. With HTTP,
base64 and a cold start on top, that fits inside a 240-second abort with real
margin and does not fit inside 120.

### What I implemented, and what is still Jon's

**Implemented (my territory):** `UC_MAX_WORDS`, default 10,000, enforced in
`apps/web/api/clean.py` **before a single model call is made**. Only the rewrite
has a word ceiling and only `.txt` reaches the rewrite, so a `.docx`, `.png` or
`.jpg` is never capped by words — those are instant and free however large.

The free scan now carries the limit so the interface can say "too long" **before**
anyone commits to paying, which is the same rule as the price itself (04 entry 16):

```
  small          words=50      credits=1    over_limit=False
  at the limit   words=10000   credits=10   over_limit=False
  over           words=10001   credits=11   over_limit=True
```

**Still Jon's, and needed for this to be honest:**

1. **`lib/engine/client.ts:143` — raise 120_000 to 240_000.** Without this the
   limit I just set is not reachable. **Until it is raised, set
   `UC_LAYER_B_DEADLINE=60`**, because a run can still exceed 120s: the deadline
   stops new retries but a model call already in flight has its own 45-second
   timeout, so worst case is deadline + 45.
2. **`lib/engine/client.ts` MESSAGES — add the `too_many_words` line.** The engine
   returns that code with the right sentence, but `client.ts` maps codes to its own
   closed set and an unknown code falls back to "Something went wrong. Nothing was
   charged." **Until this is added, a user over the limit sees the generic
   message.** I am flagging it rather than hiding it. The sentence the engine
   already returns, and which `client.ts` should use:

   > **That is longer than 10,000 words, which is the most the rewrite can do in
   > one go. Split it and run it in parts.**

3. **The workbench should refuse before the button, not after.** The free scan now
   returns `billing.over_limit` and `billing.limit`. The price line at
   `workbench.tsx:1465` already shows words and credits; when `over_limit` is true
   it should show the sentence above and disable Sanitise, so nobody waits two
   minutes to be refused. **This is the whole reason the limit is on the scan.**

---

# PART 5 — RETRY EXHAUSTION

## What is actually happening

`limits.md` recorded that runs at 1,000 words sometimes fail through the retry
loop giving up, on both word salad and real prose, and that nobody knew why.
Instrumented, on the 10,464-word document:

```
  FactsLost          126 attempts
  ok                  19 attempts
  TruncatedRewrite     4 attempts
```

**Retries are almost entirely the fact guard.** 126 of 149 attempts ended because
`_guard_facts` found a number in the input that it could not find in the output.
Eight chunks never satisfied it and burned all eight attempts each.

Some of those are genuine — the model does drop figures. But some are the guard
being wrong. Measured, phrase by phrase:

```
  'thirty thousand manuscripts' -> '30,000 manuscripts'
      src numbers=['30']  out numbers=['30000']  guard demands ['30']  -> RETRY
```

**The value is right there in the output.** The guard reads "thirty thousand" as
the single number 30 and "30,000" as the single number 30000, so a model doing
exactly what rule 5 asks looks like it dropped a figure. Every such phrase costs
up to eight model calls and up to eight times the money.

The two other repeat offenders in this corpus were `60` and `80`, from "sixty
years" and "eighty years" — those are the model writing "six decades", which is a
real change of form, so the guard firing there is defensible.

## Why I did not change the guard

I built the obvious fix — teach `_numbers` that a scale word multiplies the
number before it, so "thirty thousand" resolves to 30000 — and **measured it
against the current one on twenty realistic rewrite pairs before shipping it:**

```
   OLD          NEW           phrase
================================================================================
-> RETRY        ok            'thirty thousand manuscripts' -> '30,000 manuscripts'
   ok           ok            'nine million volumes' -> '9,000,000 volumes'
   ok           ok            'more than two hundred towns' -> 'more than 200 towns'
   ok           ok            'thirty-four percent' -> '34 percent'
   ok           ok            'eighteen percent' -> '18 percent'
   ok           ok            '$4.2 million' -> '$4.2 million'
-> ok           RETRY         'two thousand five hundred' -> '2,500'
   RETRY        RETRY         'profits rose 42 percent in 2019' -> 'profits rose in 2019'
   RETRY        RETRY         'thirty thousand manuscripts' -> 'many manuscripts'
================================================================================
false retries demanded by the OLD guard: 1
false retries demanded by the NEW guard: 1
```

**It fixes one false positive and introduces another.** "two thousand five
hundred" resolves to 2000 and 500 where "2,500" is one number, so the additive
compound breaks in the same way the multiplicative one was broken.

`_numbers` has already been got wrong twice, in opposite directions, and the
docstring in `uc_chunk.py` is a long account of what that cost. **I am not
shipping a change that my own measurement says is a wash.** Doing it properly
means a real number parser handling additive and multiplicative compounds
together, with a test table, and that is its own piece of work.

**What I did instead** is bound the damage: the deadline in part 4 stops a chunk
spending the whole request chasing a figure the guard was never going to accept,
and the truncation fix stops a chunk that has been retrying from losing the
document on its last roll. Both are measured above.

## Recommendation

Do the number parser properly, as its own small task with a table of pairs like
the one above as its test. Until then the deadline stops it being expensive. The
1,000-word failures `limits.md` recorded should be re-run afterwards: with the
truncation fix in place I could not reproduce a failure at any size this session,
including the 10,464-word document that failed before it.

---

# WHAT THIS SESSION SPENT

Real figures from the AI Gateway, read from the API at the start and at the end,
not estimates:

    start  {"balance":"14.73742628","total_used":"0.26257372"}
    end    {"balance":"14.58194968","total_used":"0.41805032"}

**15.5 cents**, for every layer B run in this note: two formatting essays run
twice each, the four sizes run before the fixes, the four run after, two
instrumented 10,000-word runs, and the three live route calls in part 3.
No credits were bought. The one throwaway account
was funded by inserting a ledger row and deleted afterwards, and its ledger rows
went with it (verified: 0 rows remaining).

---

# WHAT WAS SKIPPED, AND WHY

A step skipped is a step that failed, so here they are, plainly:

1. **Nothing was measured on production.** The brief asked for the file-type
   table and the size table on production with the dev bypass off. Production's
   engine endpoints need `UC_ENGINE_KEY`, a Vercel-only secret not in any local
   env file, and I was told not to deploy — so the deployed code is not this
   session's code anyway. Everything is localhost against the real engine code and,
   for part 3, against the **real production database**. The part 4 table therefore
   has no HTTP, base64 or cold-start time in it and real production will be slower.
2. **The frontend half of part 1 is not fixed.** `marked-text.tsx` is inside the
   workbench. One-line handoff is in part 1.
3. **The `.md` picker entry is not removed.** `encode.ts:ACCEPTED_FILES` still
   offers `.md`, which the engine now refuses. **A user can still pick a `.md` file
   and be told it is unsupported.** The fix is to remove `.md` from that string;
   it is in the workbench folder.
4. **`too_many_words` has no sentence in `client.ts`** yet, so an over-limit user
   sees the generic failure message. Part 4 handoff item 2.
5. **`_numbers` was measured and deliberately left alone.** Part 5.
6. **F1 and F4 (a clean file reported as scrubbed) were not fixed** — a product
   decision, reported for Jon.
7. **04 and 06 entries are owed.** Territory, and both files were being edited by
   other sessions today. Listed in part 1's handoff, plus: the four-type allowlist,
   `UC_MAX_WORDS`, `UC_LAYER_B_DEADLINE`, and the 120-second abort finding.
8. **ENGINE.md is not updated.** Its section 6 settings table, its section 8 cost
   figure and its section 10 limits are all now out of date in ways this note
   records. Not in this session's brief and the file is heavily cross-referenced.
9. **No real Word/camera/AI-produced file was used**, and `exiftool`/`c2patool`
   are not installed, so metadata detection ran degraded throughout.
