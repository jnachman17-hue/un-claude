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
