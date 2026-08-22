# The engine, tested rather than asserted

**21 August 2026, session 12.** Engine correctness, file handling, the size
ceiling, and a full stress pass over the interface.

**Territory:** `apps/web/engine/**`, `apps/web/api/*.py`, this note, and — added
part way through on Jon's explicit instruction — the workbench, `encode.ts` and
`lib/engine/client.ts`. No route handler, no `lib/server/credits.ts`, no pricing
or legal page was touched.

**How to read this.** Every claim has a run behind it and the real output is
pasted in. Where something was not run, it says so. The open items come first,
because a note that buries them is a note that hides them.

---

# 1. THE SHORT VERSION

## Is it closed out? Round three closed all but one, and that one is Jon's to run.

**Everything Jon ruled on is done and verified.** The one item left is
**measuring on production**, which needs a deploy and is his. One decision is
waiting on him: **which model to run** (section 15, measured bake-off).

Section 2 below is the state as it stood BEFORE his rulings. Section 14 is what
changed after them, and it is the part to read.

**The single worst finding came last, from the interface stress sweep, and it
reverses an answer given earlier in this session.** See section 2.1. Jon read an
earlier draft of this note and replied "Noted on file types and arbitrage. My
understanding is all good and all clean there." **That understanding was formed
before this defect was found, and it is not all clean.**

## What was fixed and proved

| | Evidence |
|---|---|
| **Formatting survives, on screen and on the clipboard** | 7 paragraph breaks in, 7 out of the Copy button; screen went from 0 line breaks to 18 |
| **The engine keeps paragraph structure through the rewrite** | 875 words, 16 paragraphs in, 16 out, aligned one for one; 9,900 words, 182 in, 182 out |
| **Only four file types are accepted, anywhere** | `.csv .md .pdf .html .epub .xlsx .pptx .svg .json .py` and a no-extension file all refused; a `.png` renamed `.docx` refused |
| **Every accepted type still opens afterwards** | PNG pixels, JPEG scan data and DOCX text all byte-identical, checked by reading the bytes |
| **10,000 words is refused before a model call** | 1.3 seconds, 11 credits charged and 11 refunded, net zero |
| **The 10,000 word path actually runs** | 9,900 words in 109.3 seconds through the real route, real ledger, dev bypass off |
| **The word counter stopped lying** | Empty box now shows nothing; it showed "10,500 words = 11" for ever before |
| **Long runs say how long they take** | "2,500 words = 3 · takes up to about 40 seconds" |
| **Local development tests the real product** | It did not before, and that invalidated a whole class of testing |
| **The 10,000-word failure is gone** | 149 model calls / 95s / returned nothing → 132 calls / 79s / succeeded |

## Closing verification

```
495 passed, 1 skipped              engine test suite
3/3 PASS                           price/engine drift guard
exit 0                             typecheck

per model call  45s                the four ceilings, consistent
retry budget    180s
site abort      240s
vercel cap      300s

ACCEPTED_EXTS   (".txt", ".docx", ".png", ".jpg", ".jpeg")   engine
ACCEPTED_FILES  '.txt,.docx,.png,.jpg,.jpeg'                 file picker
MAX_WORDS = 10_000  /  UC_MAX_WORDS "10000"                  interface and engine agree
```

## What it cost

Read from the AI Gateway at the start and the end, not estimated:

```
start  {"balance":"14.73742628","total_used":"0.26257372"}
end    {"balance":"14.53365238","total_used":"0.46634762"}
```

**20.4 cents**, for every rewrite in this note. No credits were bought. Three
throwaway accounts were funded by inserting ledger rows and deleted afterwards;
each time the ledger rows went with them, verified at 0 remaining.

---

# 2. OPEN — needs Jon's ruling, not a session's judgement

## 2.1 THE WORST ONE. The interface has text files and Word files backwards.

**One line decides whether an upload is treated as writing or as a picture, and
it is wrong for both file types, in opposite directions.**

```
workbench.tsx:358
    const carriesProse = !isFile || scan?.kind === 'container';
```

Verified directly against the engine:

```
  pasted text  isFile=False kind=text       -> carriesProse=True    treated as PROSE
  essay.txt    isFile=True  kind=text       -> carriesProse=False   treated as AN IMAGE
  essay.docx   isFile=True  kind=container  -> carriesProse=True    treated as PROSE

what the engine actually does with each:
  pasted text  -> layer A + layer B rewrite
  essay.txt    -> layer A + layer B rewrite   <- the interface asks for NEITHER
  essay.docx   -> metadata only, NO rewrite   <- the interface asks for a rewrite
```

**What a real person sees.** A `.txt` file containing one zero-width space was
uploaded through the actual interface. The panel said:

```
Hidden characters      NO TEXT TO CHECK
  "An image carries no text, so there are no characters to hide between."
  Zero width space · Invisible, no width at all      <- it lists the finding anyway
Metadata               NONE FOUND
Statistical watermark  NO WORDS TO MARK
  "An image carries no writing, so there are no word choices for this mark to hide in."
```

…beside a button reading **"Sanitise it (1)"**. After paying, the panel read
`NO TEXT TO CHECK`, `0 REMOVED`, `NO WORDS TO MARK`.

**The engine is fine.** The same bytes through `/api/tool/scan` return
`"kind":"text"`, `"suspicious_total":1`, `U+200B ZERO WIDTH SPACE`.

**Three things follow from one boolean:**

1. **The interface tells a `.txt` user their essay is an image.** That sentence is
   simply false and it is on screen.
2. **The rewrite never runs on an uploaded `.txt`.** Paste your essay and you buy
   the watermark rewrite. Upload the identical file and you buy invisible-character
   removal only. Same content, two different products, and nothing says so. This is
   the same defect reported in part 3 as a pricing question; the sweep shows the
   symptom is far worse than the price.
3. **A `.docx` is told it is being rewritten and is not.** The button says
   "Rewriting" and the status says "Breaking up the wording" for a file the engine
   only strips metadata from — which is exactly what Jon himself described as the
   intended behaviour.

**Why this was not fixed.** It changes what a customer is charged: today an
uploaded `.txt` costs 1 flat credit, and treating it as prose would charge it by
the word, up to 10. **The pricing rule is Jon's** and CLAUDE.md section 5 says
stop before overriding anything already decided. Fixing it correctly also means
splitting one flag into two — "does layer A apply" and "does the rewrite run" —
which rewrites about ten pieces of visitor-facing copy, and section 7 of CLAUDE.md
says copy goes through the messaging skill.

**Recommendation.** Split the flag, and make `.txt` behave exactly like a paste:

```js
const carriesText  = !isFile || scan?.kind === 'text' || scan?.kind === 'container';
const carriesProse = !isFile || scan?.kind === 'text';
```

`carriesText` drives the hidden-characters row. `carriesProse` drives the rewrite,
the price and the "Rewriting" copy. That makes the interface agree with the engine
for all three inputs, and it makes the browser's price agree with the server's for
a `.txt` — today they agree only by both being wrong in the same direction.

**The `.docx` half costs nothing to get right and changes no price** (a container
is charged one flat credit either way). **The `.txt` half is a pricing change and
is Jon's call.**

## 2.2 A document with nothing AI in it still loses its author

Verified on a Word document with `dc:creator` = "Jon Nachman" and no AI markings:

```
  scan says has_ai_metadata : False
  scan says suspicious      : False
  -> the interface shows: "No content credentials, generator tags or AI
     metadata in this file."   (workbench.tsx:954)

  before: <dc:creator>Jon Nachman</dc:creator><cp:lastModifiedBy>Jon Nachman</...
  after : <dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy>

  "Jon Nachman" still in the cleaned bytes: False
```

**The scan is honest and the clean deletes the name anyway, silently.** The same
thing happens to images: a JPEG whose only metadata was written by macOS scanned
as "nothing found" and came back 136 bytes lighter, with its Exif and Photoshop
blocks dropped.

**Not a lie in the interface** — it says "no AI metadata", which is true. But the
file is changed and nothing says so.

**This is a product question, not a defect to fix quietly.** For a student who
wants anonymity, stripping every trace is arguably the point. For someone
protecting their own authorship it is a surprise.

**Recommendation:** keep stripping, and say so. Report AI findings and general
metadata separately so a file with nothing AI in it is never described as having
had an AI mark removed, and the panel says plainly that all identifying metadata
is removed. There is already a `keep_non_ai_metadata` option in the clean route's
allowed set that nothing sends.

## 2.3 The fact guard asks for retries it should not — money, not breakage

Covered in full in part 5. **Nothing fails because of it.** It costs roughly four
times the money and time a clean run needs. The obvious repair was built and
measured and it is a wash, so it was not shipped. It needs a proper number parser
as its own small task.

## 2.4 Nothing has been measured on production

Jon's instruction was not to deploy, so the deployed code is not this session's
code, and production's `/api/scan` and `/api/clean` need an engine key that is a
Vercel-only secret. **Everything here is local against the real engine code, and —
for anything about money — against the real production database.** The timings
therefore carry no HTTP, no base64 and no cold start; real production will be
slower.

---

# 3. THE INTERFACE STRESS SWEEP

A full pass as a demanding human, at desktop and phone width, with the
development bypass on so nothing was charged. Twenty checks. **Fourteen passed.**

## Passed

- Paste, scan, paste different text: old findings clear, count follows.
- Paste, scan, sanitise, Start over: everything clears — box, placeholder,
  findings, credit line.
- Clear the box: the placeholder returns, the price line goes.
- Load the example, click into it: the example's findings clear.
- Upload a file, remove it, paste: shows "18 words = 1", not "1 file".
- Three scans clicked in one tick: 4 requests, 2 completed, 2 properly cancelled,
  one clean result, no stuck spinner.
- A `.txt` upload correctly offers **Download the clean file** rather than Copy.
- Refused extensions show, verbatim: `That file type is not supported. Use text,
  a Word document, PNG or JPG.`
- The picker's `accept` is exactly `.txt,.docx,.png,.jpg,.jpeg`.
- A filename with spaces, unicode and an emoji displays and scans intact.
- **10,500 words:** `10,500 words. The rewrite takes 10,000 at a time — split it
  and run it in parts.` Scan stays enabled (scanning is free); **Sanitise is
  disabled.**
- **The boundary is exact:** 10,000 allowed, 10,001 refused.
- **The time hint threshold is exact:** 999 words no hint, 1,000 words
  `· takes up to about 15 seconds`.
- **No horizontal overflow** at 1280 or 375. The new over-limit message wraps to
  two clean lines on a phone.
- **Paragraph breaks render** — computed `white-space: pre-wrap` on both the
  scanned and the sanitised text.
- **No React errors, no uncaught exceptions, no 5xx.** Every 4xx was a
  deliberately invalid file and every one was explained to the user.

## Found, and not fixed

**U1. A refused file stays in the box, priced, with a live Sanitise button.**
After the "not supported" message the chip still reads
`data-export.csv / CSV file = 1` and Sanitise is **not** disabled. Pressing it
gives a 400 and re-shows the same refusal, so nothing is silent — but a rejected
file should not sit there wearing a price.

**U2. Clicking "click anywhere above to paste your own text" does not put the
cursor in the box.** Verified with real mouse clicks: `document.activeElement` is
`BODY`. The next keystroke or paste goes nowhere. Cause is visible in the source:
`startEditing` and `startOver` both call
`requestAnimationFrame(() => textArea.current?.focus())` and the textarea has not
mounted by that frame.

**U3. You cannot select the scanned text, and trying wipes the scan.** The whole
result is one `<button class="cursor-text">`. Dragging across a line returns an
empty selection and drops back to the empty textarea with the findings gone.
Anyone who highlights a line to read it loses their scan. **This is also the other
half of the formatting complaint**: highlighting to copy was never going to work.

**U4. A decorative glow makes the hero programmatically scrollable.** 128px of
horizontal overflow at desktop inside `overflow-hidden`, from a
`right-[-10%] w-[820px]` div. Hidden, but any `scrollIntoView` inside that section
shifts the whole hero left with no way back — captured twice, with the headline
reading "Claude wrote / it's marked." and the counter reading "692,6".
**Honest caveat: not reproducible with a plain mouse click or Tab**, so there is
no demonstrated user path to it. The app does call `.focus()` inside that section.

**U5. The live counter is visibly mid-flip most of the time.** In 5 of 9
screenshots the number rendered with its leading digits large and its trailing
digits smaller and lower. It is the intended flip animation, but bursts arrive
every 0.25–4s and the flip lasts 0.5s, so a still frame usually looks like a
rendering fault.

**Smaller:** whitespace-only input shows `0 words = 1` before Scan is pressed; the
disabled Sanitise button's credit chip is illegible at 45% opacity; on a phone the
price line right-aligns under a left-aligned button row; two Cloudflare Turnstile
console warnings, cosmetic.

**None of U1–U5 were fixed.** They are a coherent interface work package and they
belong in a session that owns the workbench and loads the messaging skill, not in
the last hour of an engine session.

## What the sweep could not test

- **Whether a credit is really charged or refunded** — the bypass pins the balance
  and writes no ledger row, which is what makes it safe and also what makes money
  unobservable. That was covered separately against the real ledger; see part 3.
- **The contents of a downloaded file** — downloading needs permission.
- **A real `.docx`, `.png` or `.jpg`** — no sample files exist in the repo and the
  sweep was forbidden to create any.
- **Uploads through the real OS file picker** — synthetic `File` objects were used,
  which reach the same handler but bypass the picker's own filtering.
- **A production build.** Everything is the dev server.

---

# 4. PART 1 — FORMATTING

## The finding

**Formatting was destroyed in two unrelated places, and the bigger one was not in
the engine at all.**

Jon's question: *"If I paste it in a certain format and copy it out, does it come
out right?"* **It always did.** Measured by intercepting the Copy button:

```
input_paragraph_breaks       : 7
COPY_BUTTON_paragraph_breaks : 7
SCREEN_shows_line_breaks     : false      <-- the defect
```

The text was never damaged. The screen collapsed it. Somebody who pressed **Copy
the clean text** got correct formatting; somebody who looked at the box, or
highlighted it with the mouse, saw and got a wall.

## Candidates, tested one at a time

**Layer A — not the cause.** Through `_clean_payload`, the same function
`/api/clean` calls:

```
LAYER A ONLY: bytes identical: True   in=932 out=932
```

Byte for byte identical. **That is what proved the loss was after the engine**: a
plain sanitise returns the document unchanged and Jon still saw flattened text.

**The chunker — a real cause, smaller.** It split on blank lines and rejoined with
a flat `\n\n`, discarding what was there. Against the code as it was:

```
  PASS  plain two paragraphs
  FAIL  triple blank line            in: 'One.\n\n\n\nTwo.'      out: 'One.\n\nTwo.'
  FAIL  leading + trailing newlines  in: '\n\nOne.\n\nTwo.\n\n\n' out: 'One.\n\nTwo.'
  FAIL  blank line with spaces       in: 'One.\n   \nTwo.'       out: 'One.\n\nTwo.'
  PASS  numbered list block
  FAIL  windows endings              in: 'One.\r\n\r\nTwo.'      out: 'One.\r\n\nTwo.'
```

Four of six mangled **with no model involved at all.**

**The rewrite — the other real cause.** The layer B prompt had seven rules and not
one mentioned layout:

| Document | Paragraphs in | out | Lost |
|---|---:|---:|---|
| 147-word essay | 9 | 9 | `1. 2. 3.` came back as bullets |
| 875-word essay | 16 | 15 | **the title line was deleted** |

**The display — the biggest one.** Measured live in the browser:

```
tag: "P"   whiteSpace: "normal"
textContentNewlines: 16      <- the data still has all 16
innerTextNewlines:  0        <- the screen has none
first160: "The Long Shadow of the Printing Press Introduction When Johannes
           Gutenberg assembled his press in Mainz around 1440, he was not..."
```

## Fixed

1. **`uc_chunk.py`** — separators between paragraphs, blank-line runs and the
   document's own leading and trailing whitespace are captured and put back
   exactly. Chunks rejoin on the separator that actually sat between them.
2. **`rewrite_text.py`** — a layout rule added to both prompts: same number of
   paragraphs, same order, never merge or split, a short line on its own is a
   heading, keep list markers as they are.
3. **`uc_chunk.py`** — when the model loses a paragraph anyway the engine **keeps
   the model's own layout and reports it** rather than guessing where a break
   belonged. One bounded re-roll, `UC_LAYER_B_STRUCTURE_RETRIES`, default 1, kept
   separate from the fact guard's eight because a re-roll costs a model call
   against the clock.
4. **`marked-text.tsx`** — `whitespace-pre-wrap`.
5. Every layer B response now carries `paragraphs_in`, `paragraphs_out` and
   `structure_kept`. **None of the three existed before, which is why nobody knew.**

## Proof

Deterministic half, guaranteed:

```
DETERMINISTIC ROUND TRIP (split -> weave), no model involved
  PASS  plain two paragraphs        PASS  soft-wrapped paragraph   PASS  windows endings
  PASS  triple blank line           PASS  numbered list block      PASS  whitespace only
  PASS  leading + trailing newlines PASS  indented block           PASS  no trailing newline
  PASS  blank line with spaces      PASS  single paragraph
11/11 identical, 0 failed

NO-OP REWRITE (a model that echoes its input) — 10/10 byte-identical, 0 failed
no-op: 8 model calls for 8 chunks, no structure re-rolls
always-merges model: 2 calls for 1 chunk, paragraphs 3 -> 1, structure_kept=False
  returned: 'One. Two. Three.'   <- the model's own layout, not a guess
```

Real half, live model:

```
{ "seconds": 36.05, "chunks": 3, "words_in": 875, "words_out": 882,
  "paragraphs_in": 16, "paragraphs_out": 16, "structure_kept": true }
```

**16 in, 16 out, aligned one for one** — including the title the earlier run
deleted and the one-line closer it absorbed. And on screen after the fix:

```
computed whiteSpace : "pre-wrap"   (was "normal")
lineBreaksOnScreen  : 18           (was 0)
```

**Honest limits.** The deterministic half is guaranteed. The rewrite half is best
effort like everything in layer B — it depends on a model following a prompt rule,
and `structure_kept` is how it admits when it did not. Two documents were tested
in depth, not twenty.

---

# 5. PART 2 — FILE TYPES

## Nothing validated the extension, anywhere

`ACCEPTED_FILES` in `encode.ts` is the picker's `accept` attribute — a hint that
"All Files" or a drag-and-drop walks straight past. The clean route had no
allowlist. **So the real accepted set was the engine's own 24 extensions**,
including `.pdf`, `.xlsx`, `.pptx`, `.epub`, `.odt`, `.html` and `.svg`. None
chosen, none tested. That is exactly how the `.csv` undercharge got in.

## Fixed: four things, enforced, with the bytes checked

```python
ACCEPTED_EXTS = (".txt", ".docx", ".png", ".jpg", ".jpeg")
```

Five extensions, four things: pasted text, a Word document, a PNG, a JPG. `.txt`
is there because pasted text arrives as `paste.txt`.

**The bytes are checked, not just the name.** A `.png` must carry the PNG
signature; a `.docx` must be a zip that really contains `word/document.xml`, which
is what separates it from `.xlsx`, `.pptx`, `.odt` and `.epub`; a `.txt` must not
be a recognised binary and must carry no NUL bytes.

**Deliberately not in `format_dispatch.py`** — that is vendored upstream code
shared with the CLI and the audits, and it is one of the two lists the pricing
guard compares. Narrowing it would have broken the guard Jon said to keep passing.
The guard was run, as instructed:

```
  PASS  nothing the engine rewrites is priced as a flat file
  PASS  nothing priced by the word is refused a rewrite by the engine
  PASS  nothing priced as text is a CONTAINER to the engine
The price and the work agree on every extension.
```

## The front door

```
paste.txt / essay.txt / photo.png / PHOTO.PNG / shot.jpg / shot.jpeg / report.docx   accepted
essay.csv essay.md essay.pdf notes.html book.epub sheet.xlsx noext                    REFUSED bad_format
a.png (a docx renamed) / a.docx (a png renamed) / a.txt (a png renamed)               REFUSED bad_format
empty.txt                                                                             REFUSED no_file
../../etc/passwd.txt                                                    accepted as 'passwd.txt'
my essay final (2).txt / проба ünïcode 文書.txt                                        accepted
```

## Every type, end to end — and does it still open?

Layer B off throughout; it never runs on a `.docx`, `.png` or `.jpg` anyway. All
fixtures hand-built with the standard library, because CLAUDE.md section 3 forbids
reading outside this folder and section 5 forbids installing.

| Fixture | Scan | Clean | **Still opens?** | Credits |
|---|---|---|---|---|
| `paste.txt` | text / suspicious (48) | removed 47 invisibles, replaced 1 NBSP | **YES** | 1 |
| `clean.docx` / `marked.docx` | container / suspicious | metadata scrubbed, custom part dropped | **YES** zip valid, parts present, XML parses, text unchanged | 1 flat |
| `clean.png` / `marked.png` | image | tEXt and iTXt dropped | **YES** all CRCs valid, pixels byte-identical | 1 flat |
| `clean.jpg` / `marked.jpg` | image | APP1, APP13, COM dropped | **YES** scan data byte-identical | 1 flat |
| clean `.txt`, no marks | text / **not** suspicious | `removed_count: 0` | **YES** | 1 |
| 4.9 MB `.txt` | text | removed 107,367, replaced 2,285 | **YES** | 816 |
| 2.1 MB `.png` / 2.8 MB `.docx` | image / container | as above | **YES** | 1 flat |
| 5.4 MB `.txt` | **REFUSED 413 `too_large`** | — | — | — |
| invalid UTF-8 `.txt` | text | 0 removed | byte-identical in and out | 1 |
| `.txt` with NUL bytes | **REFUSED `bad_format`** | — | — | — |
| zip with `word/document.xml` removed | **REFUSED `bad_format`** | — | — | — |

**Nothing came back corrupted.** Verified by reading bytes — CRC32 on every PNG
chunk, marker walking on the JPEG, `zipfile` plus an XML parse on the DOCX.

**The metadata really was removed**, read back from the cleaned bytes:

```
marked.png   IN  IHDR | tEXt b'Software\x00Claude' | iTXt b'...Generated by Claude Opus 5' | IDAT | IEND
             OUT IHDR | IDAT | IEND
             b"Claude" in OUT: False    IDAT identical: True
             OUT == the unmarked original PNG, byte for byte: True

marked.docx  IN  <Application>Claude</Application><Company>Anthropic</Company>
             OUT <Application></Application><Company></Company>
             b"Claude"/b"Anthropic" anywhere in OUT: False
             word/document.xml identical in/out: True

marked.jpg   IN  [E0, E1(Exif...Claude Opus 5), FE(Generated by Claude Opus 5), C0, ..., SOS, scan, EOI]
             OUT [E0,                                                          C0, ..., SOS, scan, EOI]
             b"Claude" in OUT: False    scan bytes identical: True
```

## What a PDF actually does — nobody knew

Refused at the door now, consistent with 04 entry 26. Reached directly, with a
valid PDF carrying `/Producer (Claude Opus 5)`:

```
_inspect_payload -> "has_ai_metadata": true, "findings": ["pdf-structured:ai:Claude"]
_clean_payload   -> "actions": ["no PDF cleaner available (install exiftool...); copied as-is"],
                    "bytes_in": 719, "bytes_out": 719, "still_has_ai_metadata": true,
                    "meta": {"mode": "copy", "degraded": true}
output == input: True     b"Claude" still in output: True
```

**It detects the mark, returns the file completely unchanged, says so honestly,
and returns `ok: true`.** The file is not damaged. `billing_estimate` would charge
one credit for that no-op if the path were reachable. It is not.

## Should any other type be added? No.

Jon asked to be told if anything else was a free add-in. **Nothing is.** Every
remaining type is either a container the rewrite silently skips, or needs a system
program Vercel cannot install (`exiftool`, `qpdf`), or both. PDF is the clearest
case: the cleaner is a no-op today.

## Smaller findings

- **A UTF-16 `.txt` is refused** with "that file type is not supported", which is
  a confusing sentence for a text file. **Pre-existing, not a regression** — the
  engine already refused it (`refusing to clean bytes that look like a binary
  container as text`). Notepad's "Save as → Unicode" produces exactly this.
- **A file named exactly `.txt` is refused**, because `Path(".txt").suffix` is
  `''`. Safe outcome reached by accident rather than by rule.
- **Invalid UTF-8 round-trips byte-identical** — nothing is corrupted — but it is
  billed on a word count taken from a lossy decode.

## Two smaller defects found and FIXED

- **The scan was sending the browser our server's temp path**:
  `report.path = /var/folders/5r/.../T/wm-inspect-vjlp3as1/clean.docx`.
  `_clean_payload` popped its own keys; `_inspect_payload` popped nothing.
  Now stripped in both.
- **A filename carrying a path crashed with the wrong error.**
  `../../etc/passwd.txt` was accepted, reached the engine and died in
  `_tmp_path` with `ValueError: unsafe filename`, reported to the user as "that
  file type is not supported". **Nothing was ever written outside the temp
  directory** — `_tmp_path` refused first, which is what it is for. The name is
  now reduced to its basename at the door, so it cleans normally.

---

# 6. PART 3 — THE PRICING ARBITRAGE: TESTED, AND IT IS NOT THERE

**The brief said 10,000 pasted words cost 10 credits and the same text uploaded
as a `.txt` cost 1 — same work, a tenth of the price. The first half is true.
The second half is not.**

Live, real database, **dev bypass off**, one throwaway account funded by inserting
a ledger row and deleted afterwards:

```
the document: 2616 words, identical bytes in all three runs
signed in with a real session cookie: true (dev bypass NOT used)

PASTED into the box                name=paste.txt  layer_b=true  -> charged=3 rewrite ran=true  16.6s
the SAME text uploaded as .txt     name=essay.txt  layer_b=false -> charged=1 rewrite ran=false  1.5s
.txt upload, rewrite forced on     name=essay.txt  layer_b=true  -> charged=3 rewrite ran=true  13.6s

THE LEDGER: +60 purchase | +2 anon_grant | +3 signup_grant
            -3 spend clean text words_in=2616
            -1 spend clean file words_in=2616
            -3 spend clean file words_in=2616
account deleted; ledger rows remaining: 0
```

**Read the third row.** The same `.txt` upload with the rewrite actually requested
is charged **3 credits — exactly what the paste cost.** The route prices by words
whenever a rewrite will run, whatever the file is called. **The Stripe audit's fix
holds and there is no discount to be had by renaming a paste.**

**The one-credit case is not cheap work — it is different work**, and that is
section 2.1, which the interface sweep then showed is far worse than a price.

## A second price defect, read from source not run

`credits.ts:costFor` — the price the **browser** shows — still uses the extension
list the Stripe audit removed from the route:

```
credits.ts   const textLike = !input.isFile || /\.(txt|md|markdown|text)$/i.test(input.name);
route.ts     ENGINE_TEXT_EXTS = ['.txt','.text','.css','.js','.py','.rs','.go','.json','.yaml','.yml','.toml','.csv'];
```

`.md` is in the browser's list and not the server's, so a `.md` upload was
displayed at one credit per 1,000 words and charged one flat credit — quoted more
than charged, the safe direction. `.md` is now refused at the door, so the quote
is for a file that will be rejected. **Not run**, because the door refuses it
before any price is charged.

## An observation, not a finding

A brand-new account that was never a guest received **both** `+2 anon_grant` and
`+3 signup_grant`. Five credits — the same total someone gets by guesting first
and then signing up, so it looks consistent rather than wrong. Noting it because
it was visible in the ledger and somebody should confirm it is intended.

---

# 7. PART 4 — THE TWO CEILINGS

## (a) Why 10,000 words failed locally with nothing timing it out

**Reproduced. It is not a timeout — the engine gives up.**

```
{ "ok": false, "seconds": 95.32,
  "usage": { "model_calls": 149, "retries": 119, "cost_usd": 0.0246386, "chunks": 34 } }

WHY EACH ATTEMPT ENDED AS IT DID
  FactsLost          126
  ok                  19
  TruncatedRewrite     4

chunks that burned all eight attempts: {0, 3, 6, 8, 11, 17, 23, 25}
```

**149 model calls, 95 seconds, 2.5 cents, and nothing returned.**

The mechanism, exactly:

- The **fact guard is advisory** — a chunk that keeps losing a figure keeps its
  best attempt. On its own it cannot fail a document.
- The **length guard is a hard failure by design** (04 entry 22: overflow rejects,
  never truncates). On the **last** attempt it re-raised, and that exception
  escaped and killed the whole request.
- Together: a chunk spends seven attempts losing figures — so it is holding a
  perfectly good rewrite — and its eighth roll comes back short, and the good
  rewrite is thrown away along with the entire document.

**That is why 5,000 worked and 10,000 did not.** 34 chunks with 8 rolls each is
272 chances for one roll to come back short, and any one of them ended the request.

**Fixed without softening 04 entry 22.** A short last attempt no longer discards a
good earlier one. Nothing truncated is ever returned — the kept attempt passed the
same length guard when it was recorded. If there is no good attempt it still
raises, fails and refunds.

Same document after the fix:

```
{ "ok": true, "seconds": 78.68, "words_in": 10464, "words_out": 10262,
  "paragraphs_in": 192, "paragraphs_out": 193, "model_calls": 132 }
  FactsLost 106 | ok 23 | TruncatedRewrite 3
```

**Three chunks still came back short and none of them killed the document.**

## (b) Words against seconds

**Localhost, not production** — see 2.4. Engine only, no HTTP. The filler is one
875-word essay repeated with a distinct heading per section and every number
shifted per section, so the fact guard sees fresh figures. That makes it realistic
prose but deliberately **number-dense, the known worst case** for retries.

| Words | Seconds | Chunks | Model calls | Retries | Cost | Paragraphs | Result |
|---:|---:|---:|---:|---:|---:|---|---|
| 2,616 | **35.8** | 9 | 35 | 26 | $0.0059 | 48 → 48 | success |
| 5,232 | **68.6** | 17 | 89 | 72 | $0.0143 | 96 → 98 | success |
| 7,848 | **104.2** | 26 | 116 | 90 | $0.0183 | 144 → 143 | success |
| 10,464 | **78.7** | 34 | 132 | 98 | $0.0220 | 192 → 193 | success |
| 10,464 | 95.3 | 34 | 149 | 119 | $0.0246 | — | **failed, before the fix** |

**Read 7,848 against 10,464: the shorter document took longer.** Time does not
track length, it tracks how many retries the fact guard demands, and that is a
roll of the dice. **Any promise about how long a document of size N takes would be
false.**

**What it costs:** $0.0220 for 10,464 words is **0.21 cents per 1,000 words**.
ENGINE.md said "~0.06 cents typical" — a best case reading like a typical one.
Now corrected there.

## THE CEILING NOBODY HAD RECORDED, AND IT IS THE ONE THAT BOUND

`limits.md` raised Vercel's `maxDuration` from 60 to 300 and recommended it as the
fix. **It bought nothing above 120 seconds, because the site gave up on its own
engine call first:**

```
lib/engine/client.ts:143   slow ? 120_000 : 20_000
lib/engine/client.ts:101   setTimeout(() => controller.abort(), timeoutMs)
lib/engine/client.ts:120   } catch { return failure('unreachable'); }
```

Past it the browser was told the service was unreachable, the credit was correctly
refunded, **and the Python function carried on running and being billed for a
result nobody would ever receive.**

## Recommendation, and what was done

**An honest limit at 10,000 words, and raise the site's abort so the limit is
reachable. Both, because the first is not true without the second.**

- **Raising the platform cap** is what `limits.md` already did and it changed
  nothing.
- **Background work** is the architecturally right answer for a product taking
  50,000-word documents — a job store, a status endpoint, an interface that shows
  progress. Right answer for later, wrong size for now.
- **10,000** is Jon's own figure and the measurements support it rather than merely
  permit it.

**Both ceilings moved together:**

| Ceiling | Was | Now |
|---|---|---|
| One model call | 45s | 45s |
| Retries, whole document (`UC_LAYER_B_DEADLINE`) | none | **180s** |
| **The site's own abort** | **120s** | **240s** |
| Vercel's function cap | 300s | 300s |

Worst case is 180 seconds of retries plus one 45-second call already in flight =
225: inside the site's abort with 15 seconds spare and inside Vercel's cap with 75.

**`UC_MAX_WORDS`, default 10,000**, refused in `api/clean.py` **before a single
model call**. Only the rewrite has a word ceiling and only text reaches it, so a
`.docx`, `.png` or `.jpg` is never capped by words. The free scan now carries
`billing.limit` and `billing.over_limit` so the interface can refuse **before**
anyone commits to paying.

## The stress test

```
throwaway account 8ab7716b funded +80
real session: true (dev bypass NOT used)

OVER the 10,000 limit       10464 words -> HTTP 400  charged=-     1.3s  paragraphs 192->-
just UNDER the limit         9900 words -> HTTP 200  charged=10  109.3s  paragraphs 182->182
the slowest measured size    7848 words -> HTTP 200  charged=8    82.5s  paragraphs 144->146

LEDGER: +80 purchase | +2 anon_grant | +3 signup_grant
        -11 spend words_in=10464 | +11 operation_refund
        -10 spend words_in=9900
         -8 spend words_in=7848
account deleted; ledger rows remaining: 0
```

**9,900 words in 109.3 seconds.** Under the old 120-second abort that was a coin
flip. **182 paragraphs in, 182 out**, through the whole real stack.

## The defect the stress test found, and fixed

The over-limit refusal was correct and the refund was correct and the user was
told **"Something went wrong. Nothing was charged."** The site maps the engine's
`code` to its own sentence and falls back to a generic one; the local gate was
returning a message with no code. Fixed, and re-run:

```
OVER the word limit    code=too_many_words   charged=-
  "That is longer than 10,000 words, which is the most the rewrite can do in one
   go. Split it and run it in parts."
a .csv                 code=bad_format       charged=-
  "That file type is not supported. Use text, a Word document, PNG or JPG."
a .md                  code=bad_format       charged=-
  "That file type is not supported. Use text, a Word document, PNG or JPG."

ledger: -11 spend | +11 refund | -1 spend | +1 refund | -1 spend | +1 refund
```

**Every refusal refunds to net zero.**

---

# 8. PART 5 — RETRY EXHAUSTION

**The breaking is fixed. The waste is bounded but not gone.**

Instrumented on the 10,464-word document:

```
  FactsLost          126 attempts
  ok                  19 attempts
  TruncatedRewrite     4 attempts
```

**Retries are almost entirely the fact guard.** 126 of 149. Eight chunks never
satisfied it.

Some are genuine — the model does drop figures. Some are the guard being wrong:

```
  'thirty thousand manuscripts' -> '30,000 manuscripts'
      src numbers=['30']  out numbers=['30000']  guard demands ['30']  -> RETRY
```

**The value is right there in the output.** Each such phrase costs up to eight
model calls and up to eight times the money.

## Why the guard was not changed

The obvious fix — teach `_numbers` that a scale word multiplies the number before
it — was built and **measured against the current one on twenty realistic pairs
before shipping:**

```
   OLD          NEW           phrase
-> RETRY        ok            'thirty thousand manuscripts' -> '30,000 manuscripts'
   ok           ok            'nine million volumes' -> '9,000,000 volumes'
   ok           ok            'thirty-four percent' -> '34 percent'
   ok           ok            'eighteen percent' -> '18 percent'
-> ok           RETRY         'two thousand five hundred' -> '2,500'
   RETRY        RETRY         'profits rose 42 percent in 2019' -> 'profits rose in 2019'

false retries demanded by the OLD guard: 1
false retries demanded by the NEW guard: 1
```

**It fixes one false positive and introduces another.** `_numbers` has already
been got wrong twice in opposite directions and the docstring is a long account of
what that cost. **Shipping a change that measures as a wash would be worse than
leaving it.**

**What was done instead:** the deadline stops a chunk spending the whole request
chasing a figure the guard was never going to accept, and the truncation fix stops
a retrying chunk losing the document on its last roll.

**What it needs:** a proper number parser handling additive and multiplicative
compounds, with that table as its test. Its own small task. **Nothing breaks while
it waits; it costs about four times what it should.**

`limits.md`'s 1,000-word failures should be re-run afterwards — with the
truncation fix in place, no failure was reproducible at any size this session.

---

# 9. THE FINDING THAT INVALIDATES A CLASS OF TESTING

**Local development was not testing the live site.**

There are two ways into this engine and they are **different programs**:

| | Path | Reads |
|---|---|---|
| **Production** | browser → `/api/tool/clean` → `/api/clean` | the Vercel functions, via `_shared.py` |
| **Local development** | browser → `/api/tool/clean` → port 8765 | the standalone `server.py`, because `.env.local` sets `UC_ENGINE_URL` |

The allowlist and the word cap were added to `_shared.py` only, so they were
enforced live and **not locally**:

```
before:  essay.csv -> ACCEPTED locally    (production refuses it)
```

**Every local test of file handling would have proved nothing about production.**
That is the worst kind of testing: the kind that reassures without checking.

**Fixed.** The policy moved to `apps/web/engine/uc_policy.py` and both read it:

```
  essay.csv / essay.md / essay.pdf / notes.html   -> REFUSED
  paste.txt                                       -> ACCEPTED
  10,001 words                                    -> REFUSED: that is longer than 10,000 words
```

**Opt-in for the standalone server** via `UC_PRODUCT_POLICY`, because `server.py`
is also the vendored engine's own server and the upstream suite drives it over
real HTTP with formats this product does not sell — `test_clean_markdown_container`
posts a `.md` and expects it to work.

```bash
UC_PRODUCT_POLICY=1 python3 server.py --port 8765
```

**Run it any other way and local development accepts 24 file types and unlimited
words.** Recorded in ENGINE.md section 7.

---

# 10. EVERYTHING CHANGED

| File | What |
|---|---|
| `engine/uc_chunk.py` | Paragraph separators captured and restored; structure re-roll; `UC_LAYER_B_DEADLINE`; a short last attempt no longer discards a good earlier one; `paragraphs_in/out` and `structure_kept` reported |
| `engine/rewrite_text.py` | Layout rule added to both layer B prompts |
| `engine/uc_policy.py` | **New.** The four accepted types, the magic-byte check, `safe_name`, `UC_MAX_WORDS` — read by both entry points |
| `engine/server.py` | Opt-in product gate on the standalone server, returning proper error codes |
| `engine/ENGINE.md` | Four settings added; cost figure corrected 0.06 → 0.21; timings corrected; one ceiling → four; improvement 0 struck through as done; the two-entry-points trap written down |
| `engine/API.md` | `paragraphs_in/out`, `structure_kept`, `billing.limit/over_limit`, `too_many_words` |
| `api/_shared.py` | Reads `uc_policy`; strips our server's paths out of replies |
| `api/clean.py` | Word ceiling refused before any model call |
| `api/scan.py` | Strips our server's paths out of replies |
| `workbench/marked-text.tsx` | `whitespace-pre-wrap` — the formatting fix on screen |
| `workbench/workbench.tsx` | One honest `wordsNow`; over-limit refusal before the button; Sanitise disabled over the limit; "takes up to" before and during a run; placeholder and price row respect an emptied box |
| `workbench/credits.ts` | `MAX_WORDS`, `estimateSeconds`, `humanDuration` |
| `workbench/encode.ts` | `.md` removed from the picker |
| `lib/engine/client.ts` | Abort 120s → 240s; `too_many_words` message added |

Five commits, each staged by explicit path with `git diff --cached --name-only`
checked first. **Nothing was deployed and nothing was pushed.**

---

# 11. DECISIONS MADE, AND WHY

1. **The allowlist went at the product's front door, not in `format_dispatch.py`.**
   That file is vendored, shared with the CLI, and is one of the two lists the
   pricing guard compares. Narrowing it would have broken the guard.
2. **Paragraph structure is restored exactly when it can be and never guessed at
   when it cannot.** Guessing where a break belonged in somebody's document is not
   something this tool should do. `structure_kept` says which happened.
3. **The structure re-roll is capped at one and kept separate from the fact
   guard's eight.** A re-roll costs a model call against the clock, and the clock
   is the revenue gate.
4. **The truncation fix does not soften 04 entry 22.** Nothing truncated is ever
   returned; the kept attempt passed the same guard.
5. **`_numbers` was measured and deliberately left alone.** The fix is a wash.
6. **The word cap is enforced in the engine and mirrored in the interface**, with
   the limit riding on the free scan so the price and the refusal are both knowable
   before anyone commits.
7. **The interface's `.txt`/`.docx` defect was reported, not fixed.** It changes
   what a customer is charged and the pricing rule is Jon's.
8. **The metadata-stripping question was reported, not decided.** What "clean"
   means is a product question.
9. **U1–U5 were reported, not fixed.** They are a coherent interface package for a
   session that owns the workbench and loads the messaging skill.

---

# 12. WHAT WAS SKIPPED, AND WHY

A step skipped is a step that failed, so here they are:

1. **Nothing was measured on production.** See 2.4.
2. **`exiftool` and `c2patool` are not installed**, so container and image
   metadata detection ran in its degraded, standard-library-only mode throughout.
   That is why the PDF cleaner is a no-op. **Installing needs Jon's approval**
   (CLAUDE.md section 5).
3. **No file written by real Word, a real camera, or a real AI tool was used.**
   Every fixture was hand-built. "Opens" means the structural checks passed, **not
   that Microsoft Word opened it.** ENGINE.md carries the same caveat already.
4. **Genuine signed C2PA provenance was not tested** — a valid manifest cannot be
   hand-built, so `has_c2pa` was false everywhere and that detector is unexercised.
5. **The exact 5 MB boundary** was not tested; 4.9 MB and 5.4 MB were.
6. **The downloaded file's contents were never checked** — downloading needs
   permission. Given section 2.1, that is worth doing by hand.
7. **A production build was never tested.** Everything is the dev server.
8. **04 and 06 entries were not written.** The conductor merges session notes into
   the decision log — `31a8a6f "Merge 21 August session notes into the decision
   log and runbook"` — so this note is the vehicle. What is owed: the layout rule,
   `UC_LAYER_B_STRUCTURE_RETRIES`, `UC_LAYER_B_DEADLINE`, `UC_MAX_WORDS`,
   `UC_PRODUCT_POLICY`, the four-type allowlist, the 240-second abort, and the
   open questions in section 2.

---

# 13. RUNNING AND VERIFYING IT

```bash
# the local engine, behaving like the live site
UC_PRODUCT_POLICY=1 python3 apps/web/engine/server.py --port 8765

# the engine suite
engine/.venv/bin/python -m pytest engine          # 495 passed, 1 skipped

# the price and the work must agree about what a file is
cd apps/web && node scripts/verify-pricing-matches-engine.mjs    # 3/3 PASS

cd apps/web && npx tsc --noEmit                   # exit 0
```

---

# 14. ROUND THREE — Jon's rulings, carried out

**Same session.** Jon read the report and ruled. Every item below has a run
behind it and the real output pasted in.

| His ruling | What happened |
|---|---|
| **Measure on production. Happening shortly** | **Not done, and it is the one open item.** Needs a deploy |
| **Metadata stripping: leave as is** | Left exactly as it was. The scan still says "no AI metadata" and the clean still removes `dc:creator` |
| **Word documents are just metadata. Keep it that way** | Done. The interface no longer claims a rewrite it does not perform |
| **Make .txt behave exactly like a paste** | Done, and it turned out to be the biggest single fix in the session |
| **Fix the retry number parser** | Done. 29 cases, wrong on 0, where the old reader was wrong on 5 |
| **You have my okay to install exiftool** | Installed, and **measured to change nothing** for the four accepted types |
| **Re-check the ceiling now the account is Pro** | Done. **It does not change the recommendation.** See section 16 |
| **Fix every UI item** | All five, plus the smaller ones, verified in the browser |
| **The pricing page states the old rule in four places** | All four updated through the messaging skill |

## 14.1 The worst defect in the session, and it arrived last

**One line decided whether an upload was treated as writing or as a picture, and
it was wrong for BOTH file types, in opposite directions.**

```
workbench.tsx:358   const carriesProse = !isFile || scan?.kind === 'container';

  pasted text  isFile=False kind=text       -> carriesProse=True    treated as PROSE
  essay.txt    isFile=True  kind=text       -> carriesProse=False   treated as AN IMAGE
  essay.docx   isFile=True  kind=container  -> carriesProse=True    treated as PROSE

what the engine actually does:
  pasted text -> layer A + rewrite
  essay.txt   -> layer A + rewrite     <- the interface asked for NEITHER
  essay.docx  -> layer A + metadata    <- the interface asked for a rewrite
```

Uploading an essay showed, on screen: **"An image carries no text, so there are
no characters to hide between"** — while the same panel listed the zero width
space it had just found.

**Fixed by splitting one flag into two**, because they were always two questions:

```js
const carriesText  = !isFile || scan?.kind === 'text' || scan?.kind === 'container';
const carriesProse = !isFile || scan?.kind === 'text';
```

`carriesText` drives the hidden-characters row, because layer A genuinely runs on
a Word document too — proved before splitting anything:

```
DOES A WORD DOCUMENT GET LAYER A (hidden characters)?
  zero width spaces still in the cleaned document: 0
  -> layer A RUNS on a .docx
```

`carriesProse` drives the rewrite, the price and the copy.

### Verified in the running interface

**A 3,004 word `.txt` upload, before and after:**

```
before:  TXT file = 1   Sanitise it (1) 1   1 file = 1
         Hidden characters      NO TEXT TO CHECK   "An image carries no text..."
         Statistical watermark  NO WORDS TO MARK   "An image carries no writing..."

after:   TXT file = 4   Sanitise it (1) 4   3,004 words = 4 · takes up to about 1 minute
         Hidden characters      1 FOUND     "Characters sitting between the words... Zero width space"
         Statistical watermark  PRESUMED PRESENT
```

**A Word document, after:**

```
         DOCX file = 1   Sanitise it (1) 1   1 file = 1
         Hidden characters      NONE FOUND    "None in this text. 9 classes checked..."
         Statistical watermark  NOT REWRITTEN "A Word document is cleaned of its metadata and its
                                               hidden characters. Its wording is not rewritten, so a
                                               statistical mark in the writing itself would stay.
                                               Paste the text instead to have it rewritten."
```

**That last sentence is Jon's ruling written out for the visitor.**

### And the two-implementations trap, a third time

The `.txt` price came back as **zero words** at first. The standalone development
server returns no `billing` block; only the Vercel function did. So the interface
priced every uploaded file at zero words locally and correctly in production.

`billing_estimate` now lives in `uc_policy.py` and **both** entry points send it:

```
kind: text  billing: {'credits': 4, 'words': 3011, 'basis': 'words', 'limit': 10000, 'over_limit': False}
```

The file card's coin was also **hardcoded to 1**, so the card said "TXT file = 1"
beside a button saying 4. It is told the price now.

## 14.2 The number reader, third rewrite, first one that measures better

The old reader could not read scale words at all. "thirty thousand" resolved to
**30** and "30,000" to **30000**, so a model obeying rule 5 of the prompt looked
like it had dropped a figure.

**An earlier attempt this session was built and rejected** because it multiplied
without adding and broke "two thousand five hundred". This one does both, using
the ordinary way English numbers are read, with the real combining rule so that
"nineteen eighty four" stays 19 and 84 rather than becoming 103.

```
   OLD          NEW          should
-> RETRY        ok           ok       'thirty thousand manuscripts' -> '30,000 manuscripts'
-> RETRY        ok           ok       'one hundred and twenty seats' -> '120 seats'
-> RETRY        ok           ok       '$4.2 million in sales' -> '4,200,000 in sales'
-> RETRY        ok           ok       '30 thousand copies' -> '30,000 copies'
   ok           ok           ok       'two thousand five hundred pounds' -> '2,500 pounds'
   ok           ok           ok       'nineteen eighty-four' -> 'nineteen eighty-four'
   ok           ok           ok       'thirty-four percent' -> '34 percent'
   ok           RETRY        RETRY    'two hundred towns' -> 'a handful of towns'
   RETRY        RETRY        RETRY    'profits rose 42 percent in 2019' -> 'profits rose in 2019'

cases: 29   OLD guard wrong on 5   NEW guard wrong on 0
```

### The retries did not fall, and THAT is the finding

Measured on the same 10,464 word document, retries went **up**, and chasing why
found something more important than the parser.

**The model itself mangles figures.** Given three attempts at one paragraph:

```
SOURCE: Within sixty years there were coffee houses in every ward. Stockjobbers were
        expelled in 1698 and carried on trading there for the next eighty years.

ATTEMPT 1: Within fifty-eight years ... banished in sixteen ninety-eight ... eighty-two.
ATTEMPT 2: Within half a century ... In seventeen sixty-eight ... four-score years.
```

**"1698" became "seventeen sixty-eight", which is a different year.** "sixty
years" became "fifty-eight years". **The fact guard firing is correct.** The
retries are true positives, not waste.

A rule 5a was added to the prompt forbidding exactly this. **It did not
measurably help** and is kept only because it costs nothing and states the
intent. Three fresh attempts after it still produced "sixteen ninety-eight",
"four score years" and "three score years".

**So the honest answer to "fix the retry parser" is: the parser is fixed and
proven, and the remaining retries are the model, not the parser.** Which leads to
the next section.

## 14.3 The five interface defects, all fixed and all verified

| | Verified |
|---|---|
| A refused file kept its price and a live button | `csv_still_in_box: false`, message shown, box back to "Scan it" |
| The cursor never landed in the box | `U2_activeElement: "TEXTAREA"` — was `BODY` |
| The scanned text could not be selected without wiping the scan | `U3_selected_chars: 384`, `has_newlines: true`, tag is now `DIV` |
| The hero could be scrolled sideways | `scrollLeft` forced to 300, reads back `0`; `overflow-x: clip` |
| The counter was usually caught mid-flip | `card-flip .28s` and a 40 degree start, was 0.5s and 100 |

**The selection fix is the other half of Jon's original formatting complaint.**
Highlighting the result to copy it was never going to work while it was a
`<button>`, whatever the whitespace rule said. It now selects **with its
newlines**.

Smaller ones fixed in the same pass: the browser's price rule still used the
extension list the Stripe audit removed from the route (`.md|.markdown`), and the
file card's hardcoded credit.

**Rendered and looked at, desktop and 375px.** The over-limit message wraps to
two clean lines on a phone and the page does not scroll sideways at either width
(`scrollWidth` 1280 and 375).

### I broke the site once doing this, and it is worth writing down

Shortening the counter flip, I added a `@media` block inside `@theme`. **That is
a build error in Tailwind v4** and it took every page to a 500:

```
CssSyntaxError: `@theme` blocks must only contain custom properties or `@keyframes`.
```

It also survived a dev server restart, because Turbopack had cached it; it needed
`.next` removed. **And the block was redundant anyway** — `globals.css` already
collapses every animation on the site under `prefers-reduced-motion`. Removed.

**The lesson is the messaging skill's own rule 4, which I skipped: render it and
look, before claiming done.**

## 14.4 exiftool: installed, and measured to be unnecessary

Jon approved installing it. Installed (13.55) and measured with it on PATH and
removed:

```
--- exiftool with ---            --- exiftool without ---
marked.png  ai=True  findings=['PNG tEXt: Claude']      marked.png  ai=True  findings=['PNG tEXt: Claude']
clean.png   ai=False findings=[]                        clean.png   ai=False findings=[]
photo.jpg   ai=False findings=[]                        photo.jpg   ai=False findings=[]
essay.docx  ai=True  findings=['docProps/app.xml: ai:Claude']   essay.docx  ai=True  findings=[...]
```

**Identical. It changes nothing for the four accepted types**, because the engine
reads PNG chunks, JPEG segments and DOCX parts natively. It only ever mattered
for PDF, which is not accepted.

**This is a good outcome rather than a wasted one.** exiftool is a system program
and **Vercel cannot install system programs**, so anything depending on it would
have worked locally and not in production — the exact trap that has now bitten
this project three times. Nothing depends on it. It stays installed as a
cross-check tool.

## 14.5 The grant question, confirmed

A brand-new account that was never a guest gets **+2 `anon_grant` and +3
`signup_grant` = 5**. Read from `lib/server/credits.ts`:

```js
const isConversion = user.isConversion === true && !user.isAnonymous;
if (!isConversion) { ... grantOnce(user.id, WELCOME_CREDITS, 'anon_grant') }
if (!user.isAnonymous) { grantOnce(user.id, SIGNUP_CREDITS, 'signup_grant') }
```

A converter gets the +2 as a guest, which merges across, then +3. **Both routes
total 5. It is deliberate and consistent**, and both were seen in the live ledger.

## 14.6 The pricing page, updated through the messaging skill

Jon's instruction, and it was right: the `.txt` change made four statements
false. All four updated, and the skill loaded first:

| Where | Now |
|---|---|
| Meta description | "One credit sanitises 1,000 words of text. A Word document or picture is one credit, any size." |
| Unit row 1 | "1,000 words of text, pasted or uploaded" |
| Unit row 2 | "One Word document or picture, any size" |
| FAQ answer | Teaches the split by **what the work is**: text gets rewritten and a rewrite is priced by the word; a document or picture has its metadata and hidden characters removed, which is the same job at any size |
| The comment at line 116 | Records the ruling and why the line moved |

**The terms of service already carried the new rule** and needed no change.

**No em dashes in any visitor-facing string.** One I had introduced earlier in the
over-limit message has been removed:

```
10,500 words. The rewrite takes 10,000 at a time. Split it and run it in parts.
```

---

# 15. THE MODEL: a measured recommendation, and Jon's call

Chasing the retries found that the model is the cost driver. A bake-off, same
prompt, same 306 word chunk, three attempts each:

| Model | Figures kept | Length | Seconds | Missed |
|---|---|---|---|---|
| `mistral/mistral-small` (current) | **1/3** | 113% | 4.8 | 60, 80 |
| **`mistral/mistral-medium`** | **3/3** | 108% | 5.4 | none |
| `deepseek/deepseek-v3.1` | 2/3 | 106% | 34.1 | 1699 |
| `alibaba/qwen3-next-80b-a3b-instruct` | 0/3 | 104% | 3.2 | 60 |
| `moonshotai/kimi-k2` | timed out | | | |
| `zai/glm-4.6` | timed out | | | |

Confirmed on the full 10,464 word document:

| | small | **medium** |
|---|---|---|
| Model calls | 162 | **109** |
| Retries | 128 | **75** |
| Truncated chunks | 3 | **0** |
| Seconds | 99.6 | **84.6** |
| Words out | 96% | **99%** |
| Cost | $0.027 | $0.101 |

**Recommendation: switch to `mistral/mistral-medium`.** Better on every axis that
matters to the product, and faster despite being the larger model, because it
does not spend calls being corrected. It costs 3.8x more per run, which is
**about 1 cent per 1,000 words against roughly 50 cents of revenue per credit**,
so cost is not the constraint — ENGINE.md section 5 already says so.

**One caveat, stated plainly:** medium split paragraphs more (192 in, 206 out)
where small merged them (192 to 190). Neither kept structure exactly on a
192-paragraph document. `structure_kept` reports it either way.

**This is one Vercel environment variable and it is Jon's to set.** No code
change is needed and none was made.

---

# 16. VERCEL PRO: re-checked, and it does not change the recommendation

Jon flagged that the account moved from Hobby to Pro. Read from Vercel's own
documentation, 21 August 2026:

|  | Default | Maximum | Extended maximum |
|---|---|---|---|
| Hobby | 300s | 300s | — |
| **Pro** | **300s** | **800s** | **1800s (30 minutes)** |
| Enterprise | 300s | 800s | 1800s |

Python 3.14 is on the supported list for the extended beta, so `api/*.py` could
run for up to 30 minutes.

**It changes nothing, and the reason matters: Vercel's ceiling was never the one
that bound.** The site gave up on its own engine call at 120 seconds, well under
even Hobby's 300. The measured worst case at 10,000 words is 109 seconds.

**So the 10,000 word limit stands, and it is not a platform limit.** It is set by
three things Pro does not touch:

1. **How long a person will wait.** 109 seconds is already a long time to watch a
   box. Twenty thousand words would be nearly four minutes.
2. **Variance.** The same document ranges 79 to 109 seconds because time tracks
   retries, not length. A limit has to hold at the bad end.
3. **What a failure costs.** A run cut off after two minutes has spent the money
   and returns nothing.

**`maxDuration` stays at 300 and should NOT be raised to 800.** It already sits
above the site's 240 second abort, which is what matters; raising it further only
lets an abandoned function keep running and billing after the browser has stopped
listening.

**What Pro genuinely buys** is headroom for the background-job design if very
large documents are ever wanted. That remains the right answer for 50,000 word
documents and it is still a job store, a status endpoint and an interface that
shows progress.

---

# 17. WHAT REMAINS

**One item, and it is Jon's:**

- **Measure on production.** Everything here is local against the real engine
  code, and for anything about money against the real production database. The
  timings carry no HTTP, no base64 and no cold start, so production will be
  slower. Jon says this is happening shortly.

**One decision, with the data above:** which model.

**Deliberately left alone, on Jon's ruling:** a Word document with no AI markings
still loses `dc:creator` silently. Unchanged.

**Still true and still worth knowing:**

- No file written by real Word, a real camera or a real AI tool was ever used.
  Every fixture was hand-built. "Opens" means the structural checks passed, not
  that Microsoft Word opened it.
- Genuine signed C2PA provenance is untested; a valid manifest cannot be
  hand-built.
- A UTF-16 `.txt` from Notepad is refused with a confusing sentence.
  Pre-existing: the engine already refused it.
- Two workbench instances render on the page (a responsive pair). Harmless, but
  it makes browser testing confusing because only one receives a synthetic file.

---

# 18. WHAT THE WHOLE SESSION SPENT

Read from the AI Gateway at both ends, not estimated:

```
start  {"balance":"14.73742628","total_used":"0.26257372"}
end    {"balance":"14.34079368","total_used":"0.65920632"}
```

**39.7 cents**, covering every rewrite in this note: the formatting proofs, four
sizes before the fixes and four after, the instrumented 10,000 word runs, the
model bake-off, and the live route tests. No credits were bought. Four throwaway
accounts were funded by inserting ledger rows and deleted, each verified at 0
rows remaining.
