# Session note: the filename was a watermark, and we were adding one of our own

**26 August 2026. Brief: `docs/briefs/strip-the-tool-name.md`. Opus, high effort.**

---

## 1. What was wrong, and which half was ours

A visitor downloads an image from ChatGPT. It arrives called
`ChatGPT Image Aug 25, 2026, 03_14_22 PM.png`. They upload it to un-claude,
which correctly strips the C2PA record and the EXIF block. Then this happened:

```
uploaded :  ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
downloaded: cleaned-ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
```

**Two faults.** The tool's name survived, so the mark a human reads first
outlived the marks nobody can see. And `cleaned-` announced that the file had
been through a watermark remover. **The second one was entirely ours and it was
on every file this product has ever returned.**

Both are fixed. The round trips below are the real ones, run against the site.

---

## 2. The before and after, in full

**Run against a running instance** (`localhost:3000/api/tool/clean`, the site's
own route, into the real engine). Not a unit test.

```
==========================================================================
UPLOADED : ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
DOWNLOADS: Image Aug 25, 2026, 03_14_22 PM.png
IDENTICAL: False
report.filename: {"original": "ChatGPT Image Aug 25, 2026, 03_14_22 PM.png",
                  "name": "Image Aug 25, 2026, 03_14_22 PM.png",
                  "tool": "ChatGPT", "changed": true}
report.actions : ["drop chunk tEXt", "drop chunk tEXt", "exiftool -all= pass"]
bytes in/out   : 158 -> 73
==========================================================================
UPLOADED : my essay.docx
DOWNLOADS: my essay.docx
IDENTICAL: True
report.filename: null
report.actions : ["scrub docProps/core.xml field dc:creator"]
bytes in/out   : 1825 -> 1818
==========================================================================
```

**The customer-named control comes back byte-identical in name and carries no
`filename` block at all.** That is the guarantee that matters most: almost every
upload is a document somebody named themselves, and this must be invisible to
every one of them.

### The same two files through the actual interface

Driven in a browser at `localhost:3000`, file dropped into the real input,
Sanitise pressed, and the `download` attribute of the real button read back:

```
ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
  -> download="Image Aug 25, 2026, 03_14_22 PM.png"

my essay.docx
  -> download="my essay.docx"
```

**No `cleaned-` on either.**

### What the card and the report say

Card, always visible, once there is something to download:

```
ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
PNG file · sanitised
Downloads as Image Aug 25, 2026, 03_14_22 PM.png
```

Metadata row of the report, opened:

```
Metadata
A digital fingerprint inside your file
3 REMOVED

Stripped, and the file was re-read afterwards to confirm nothing was left.
158 bytes in, 73 out, and nothing you can see was changed. Its name also said
ChatGPT, which anyone can read at a glance, so your download is called
Image Aug 25, 2026, 03_14_22 PM.png instead.

File name · ChatGPT Image Aug 25, 2026, 03_14_22 PM.png is saved as
            Image Aug 25, 2026, 03_14_22 PM.png
Removed   · drop chunk tEXt
Removed   · drop chunk tEXt
Removed   · exiftool -all= pass
```

On `my essay.docx` neither the card line nor the `File name` row appears.

**Rendered and looked at, desktop 1280 and phone 375.** No horizontal overflow
at 375 (`scrollWidth` 375 against `clientWidth` 375). The card's new line
truncates with an ellipsis on a phone exactly as the filename above it does, and
carries the full name in its `title`; the full name is also in the report
underneath. **Noted for Jon rather than fixed: on a phone the visitor sees
"Downloads as Image Aug 2…" rather than the whole name.**

**THE BROWSER PASS WAS NOT REPEATED FOR THE THREE TOOLS ADDED LATER, and the
reason is a known defect rather than a shortcut.** After the second round of
changes the local dev server stopped hydrating: the page server-renders the tool
correctly, and in the browser React never runs, so pressing "Try an example" does
nothing at all. **That is `06` row 77 exactly:** intermittent, no console error,
and its recorded remedy is a dev-server restart. **The dev server on port 3000
belongs to another session and I did not restart it**, because nothing about the
rendering changed between the two rounds: the second round changed the CONTENTS
of a list in Python, and the interface code that was screenshotted above is
byte-identical. The five new names are proven through the real route instead.

---

## 3. Where the logic lives, and why there is only one of it

**In the engine, and only in the engine.** `apps/web/engine/uc_filename.py`
decides the name; `_clean_payload` in `server.py` calls it and returns
`download_name` in the response; the browser renders what it is handed and has
no opinion about filenames.

**That was the conductor's recommendation and it is right for a reason beyond
tidiness.** `_clean_payload` is the single point BOTH ways into this engine pass
through: the Vercel function at `apps/web/api/clean.py` and the standalone
`server.py` used in local development. Putting it in `workbench.tsx` would have
been a third implementation of a rule the engine already had the information to
apply, and the split-brain between those two paths is what `uc_policy.py` exists
to stop.

---

## 4. THE LIST: which patterns were verified, and which were not

**This is the section the brief asked for, and the honest answer is that web
research was as thin as the conductor warned.** Two of the five entries are
confirmed against real files. The rest are not.

| Entry | Status | Evidence |
|---|---|---|
| **ChatGPT** | **CONFIRMED** against real files | Wikimedia Commons carries hundreds of `ChatGPT Image <date>.png` uploads |
| **Gemini** | **CONFIRMED** against real files | Wikimedia Commons carries `Gemini_Generated_Image_<id>.png` uploads |
| **Grok** | **CONFIRMED** against real files | Added on Jon's instruction. `Grok_image_1772320123570.jpg` and `Grok_image_7x449i.jpg`, both Commons uploads marked "own work" |
| **DALL·E / DALL-E / DALL_E / DALLE** | **On trust** | The brief, plus general reporting. No real download inspected |
| **Firefly** | **On trust** | Adobe's own community forum, a first-hand user report of downloads named `Firefly.jpg`. Adobe staff dispute it in the same thread |
| **Meta AI / Meta_AI / MetaAI** | **UNPROVEN, and safe anyway** | Added on Jon's instruction. Nothing found. Carried because it is two words: nobody's own file begins "Meta AI" |
| **Claude** | **UNPROVEN, and GUARDED** | Added on Jon's instruction. Fires only in front of a lab's type word. See below |

**Nobody handed me a genuine fresh download from any of these tools.** I have no
ChatGPT, Gemini, Adobe or OpenAI account in this session, and the project
boundary keeps me inside this folder. What I could do instead was look for real
files in the wild, and the Wikimedia Commons file index turned out to be a good
source: people upload AI images under the name the tool gave them.

**The ChatGPT evidence is stronger than a single pattern and it changed the
design.** These are all real Commons filenames (Commons shows `_` as a space and
strips `:`):

```
ChatGPT Image Aug 14, 2025, 01 01 35 PM.png      US English
ChatGPT Image Sep 29, 2025 at 09 31 03 AM.png    a newer build, note "at"
ChatGPT Image 7 mrt 2026, 11 19 57.png           Dutch
ChatGPT Image 8. sep. 2025, 18 32 11.png         Danish
```

**One tool, four date formats, and that is only what one search surfaced.** The
conductor's objection was that a list of naming conventions moves whenever a lab
ships a new export button. It is worse than that: the convention differs by the
user's locale on the same build. **So the implementation does not match date
patterns at all.** It strips the tool's name when it is the first word and the
character after it is not a letter or a digit, and leaves everything else alone.
One rule, and all four of those work without knowing anything about dates.

### What is deliberately NOT in the list

**Midjourney, and the brief already called this.** Its convention is
`<user>_<prompt>_<uuid>.png` and the tool's name never appears. There is nothing
to strip. **An entry for it would look like coverage and deliver none.**

**Microsoft Copilot and Bing Image Creator, for the same reason.** The brief
lists `OIG.<id>.jpeg` and `_<uuid>.jpeg`. Neither contains "Copilot" or "Bing".
**And `OIG` was actively rejected as a token:** in US documents OIG is the Office
of Inspector General, so `OIG-report-2026.docx` is a real filename a real
customer could upload, and stripping it would damage their document to remove
nothing.

### Claude, Grok and Meta AI: Jon sent me back for them, and the three came back different

**They were absent from the first cut of this list.** Jon's instruction, 26
August 2026: *"Please do get Claude, Grok, Meta AI."* All three are now in, and
what I found for each one is not the same thing.

**GROK: a real find, and the instruction is what produced it.** A prefix listing
of every file on Wikimedia Commons beginning `Grok` turned up two real uploads,
both marked "own work" by their uploader:

```
https://upload.wikimedia.org/wikipedia/commons/3/36/Grok_image_1772320123570.jpg
https://upload.wikimedia.org/wikipedia/commons/5/57/Grok_image_7x449i.jpg
```

**Two different id shapes under one prefix**, which is what makes it xAI's name
rather than a person's: nobody types `Grok image 1772320123570` by hand. This is
now as well evidenced as ChatGPT and Gemini. **It would not be in the list if Jon
had not sent me back for it.**

**META AI: nothing found, and it goes in anyway because being wrong is free.**
Meta's own help pages say only "tap Save", no real file surfaced, and the six
Commons files beginning "Meta AI" are all logos and screenshots. **The entry is
two words, and that is what makes it safe to carry unproven:** no customer's own
file begins "Meta AI", so if the guess is wrong it fires on nothing and harms
nobody. **`Meta` alone is deliberately absent and must stay absent.** It would
take the first word off `Meta description.docx`. There is a test asserting it.

**CLAUDE: nothing found, and the evidence against a plain entry is not close.**
Three separate checks, all negative:

  * **Artifacts download under the artifact's own title**, not under Claude's
    name. Documented by the tooling built around them.
  * **A document Claude writes is named from what is in it.** Anthropic's own
    help page on creating files says nothing about a prefix.
  * **Every file on Commons beginning `Claude Image` or `Claude Generated`:
    none. Zero, both queries.**

And the collision is worse than I said the first time. **The first thirty files
on Commons beginning with the word `Claude` are thirty human beings:**

```
Claude&Ethel1926.jpg              Claude-Achille Debussy - Noël des enfants...
Claude, empereur romain.tif       Claude-Alix Bertrand.JPG
Claude, chef de la police...      Claude-Alexandre de Villeneuve...
```

**Thirty out of thirty.** A plain entry would rename a real customer's document
to remove a mark nobody has shown exists.

**So Claude is in the list and it is guarded, and the guard is one sentence: it
fires only when the word after it is one a lab uses and a parent does not.**

```
Claude Image Aug 25, 2026.png    ->  Image Aug 25, 2026.png      stripped
Claude_Generated_Image_a1b2.png  ->  Generated_Image_a1b2.png    stripped
Claude artifact report.docx      ->  artifact report.docx        stripped
Claude Monet study.docx          ->  Claude Monet study.docx     untouched
Claude-Alix Bertrand.jpg         ->  Claude-Alix Bertrand.jpg    untouched
Claude Debussy prelude.txt       ->  Claude Debussy prelude.txt  untouched
```

**The six words are not invented.** `image`, `images`, `generated`, `artifact`,
`artifacts`, `export`. Each is what a peer already puts in exactly that position:
OpenAI writes `ChatGPT Image ...`, Google writes `Gemini_Generated_Image_...`,
xAI writes `Grok_image_...`. **If Anthropic ships any of those shapes, this fires
on the first day.**

**Today it fires on nothing, and that is the honest statement.** It is the one
entry in the list that is a prepared position rather than a measured one, and it
is in because Jon asked for it after being told the risk. **The guard is what
makes that safe rather than reckless**, and removing it is one line if he wants
the blunt version instead.

**`Claude.png` on its own is deliberately NOT stripped.** `Firefly.jpg` is,
because Adobe really does that; a bare `Claude.png` is far more likely a
photograph of somebody called Claude, and nothing says Anthropic produces it.

### The rule I wrote into the constant, so the next person has one

> An entry earns its place on two questions. **One:** is the tool's name really
> the first word of what that tool hands a user, and is that evidenced?
> **Two:** if we are wrong about one, what does it cost the customer whose own
> file happens to start with that word?
>
> Include when one is evidenced, or when two is harmless. Leave it out when one
> is unevidenced **and** two is a word people really name files after.

`DALL·E` is in on the second test: unevidenced, but a file beginning "DALL-E" is
a file about DALL-E, so being wrong costs nothing.

**Two entries carry a real collision and the code says so beside each.**
`Gemini` is a constellation, a star sign and a NASA programme, so
`Gemini 4 spacewalk.jpg` would lose its first word. `Firefly` is the worst one
here: fireflies are insects, and Firefly is also an aircraft, a tank, a rocket
company and a television series. Wikimedia Commons is full of all of them.
**Firefly is the first line to delete if it ever causes trouble**, and the
comment in the file says exactly that.

---

## 5. The fallback, and why it is what it is

**`Firefly.jpg` strips to nothing, and nothing is not a filename.** An empty name
or a bare `.jpg` is invisible on macOS, unnamed on Windows, and reads to the
customer as a download that broke.

**The stem becomes the most ordinary word for what the file actually is:**

```
ChatGPT.png   -> image.png
ChatGPT.jpg   -> image.jpg
Firefly.jpg   -> image.jpg
ChatGPT.docx  -> document.docx
ChatGPT.txt   -> text.txt
ChatGPT.gif   -> file.gif        (an extension we do not sell)
ChatGPT       -> file            (no extension at all)
```

**Why not `file.png` for everything.** `file.png` reads as something having gone
wrong. `image.png` tells a reader nothing at all, which is the entire point, and
it is what several million completely human files are already called.

**Why not keep the original.** That is the defect.

---

## 6. The Word document's internal title: CHECKED, REPORTED, NOT FIXED

**The answer is no: the metadata strip does not remove it.**

A `.docx` carries a title property inside `docProps/core.xml`, separate from the
filename, and it can hold the same tell. Built one carrying
`<dc:title>ChatGPT Image Aug 25, 2026</dc:title>` and ran the real strip:

```
ACTIONS: ['scrub docProps/core.xml field dc:creator',
          'scrub docProps/core.xml field cp:lastModifiedBy',
          'scrub docProps/app.xml field Application',
          'scrub docProps/app.xml field Company']

docProps/core.xml AFTER:
<cp:coreProperties ...><dc:title>ChatGPT Image Aug 25, 2026</dc:title>
<dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy>
</cp:coreProperties>
```

**`dc:creator`, `cp:lastModifiedBy`, `Application` and `Company` come out empty.
`dc:title` survives verbatim.**

**It is a decision rather than an oversight.** `container_meta.py` line 749 says
so in as many words: *"dc:title is deliberately not listed: it is the document's
own heading, not provenance."* That reasoning is sound in general and wrong in
this specific case, because Word fills the title in from the filename often
enough that an AI-named document arrives with an AI-named title.

**Not fixed here, as the brief instructed.** It is a metadata question, it needs
a ruling about whether emptying somebody's document title is acceptable, and it
belongs in a separate job. Logged as an open question in `06`.

---

## 7. Proof

**Engine suite: `876 passed, 1 skipped`.** Baseline was `842 passed, 1 skipped`.
The 34 new ones are `engine/tests/test_filename.py`. **No existing test was
changed, skipped or deleted.**

```
876 passed, 1 skipped in 21.40s
```

**The three tools Jon sent me back for, round tripped through the site's own
route into the real engine:**

```
UPLOADED                         DOWNLOADS AS                     STRIPPED
----------------------------------------------------------------------------
Grok_image_7x449i.jpg            image_7x449i.jpg                 Grok
Grok_image_1772320123570.jpg     image_1772320123570.jpg          Grok
Meta AI Image 2026.png           Image 2026.png                   Meta AI
Claude Image Aug 25, 2026.png    Image Aug 25, 2026.png           Claude
Claude Monet study.docx          Claude Monet study.docx          nothing, name untouched
Claude-Alix Bertrand.jpg         Claude-Alix Bertrand.jpg         nothing, name untouched
Claude Debussy prelude.txt       Claude Debussy prelude.txt       nothing, name untouched
```

**`tsc --noEmit`: exit 0, no output.**

**Every edge case in section 5.3 of the brief is a test**, including the
empty-stem case, the extension's case being preserved, the U+00B7 in `DALL·E`,
case-insensitive matching, stranded separators at both ends, the 255-character
cut falling on the stem and never on the extension, and the customer-named
control.

**The one that matters most is `test_a_tool_name_that_runs_on_into_another_word_is_not_a_tool_name`:**
`Geminids meteor shower.docx`, `ChatGPTastic.png` and `Fireflies at dusk.jpg`
all come back untouched. That boundary check is the entire false-positive
defence.

---

## 8. What I could not prove

**1. That any of these four names is what the tool produces TODAY.** ChatGPT and
Gemini are confirmed against real files that real people uploaded, but those
files were downloaded on dates I do not control, from builds I cannot check.
DALL·E and Firefly rest on second-hand reports. **Nobody in this session
downloaded a file from any of these four tools.** If the coverage matters
commercially, one person with four accounts and ten minutes can settle it
completely, and that is worth more than any amount of further searching.

**2. That the list is anywhere near complete.** It names seven tools and there
are dozens. **Three of the seven are evidenced against real files** (ChatGPT,
Gemini, Grok), two are on second-hand reports (DALL·E, Firefly), and two fire on
nothing at all today (Meta AI, Claude). **A list that looks complete and is not
is the failure mode this whole approach carries**, so the honest statement of
where the coverage ends is that sentence rather than the number seven.

**2a. That Meta AI or Claude will ever fire.** Both are prepared positions. Meta
AI costs nothing to carry because no customer's file begins "Meta AI", and Claude
costs nothing because of its guard. **Neither is coverage and neither should be
counted as coverage.** They become real the day somebody shows me a download.

**3. That a tell in the MIDDLE of a name is handled. It is not.**
`Artificial planet by ChatGPT Image May 3, 2025.png` is a real file and keeps its
tell. This only looks at the front. Matching anywhere in a name would damage far
more customer filenames than it would clean, so this is a deliberate limit and
there is a test asserting it.

**4. That the collisions never fire.** `Gemini 4 spacewalk.jpg`,
`Grok chatbot screenshot.png` and `Firefly-shoes.jpg` will lose their first
word. The file still opens, because the
extension is preserved exactly and there is a test for that, but the name is not
what the customer chose. **This is the cost of Jon's ruling and it was recorded
as the conductor's objection before the ruling was made.**

**5. Nothing about Layer B.** Untouched by this session.

---

## 9. Files changed

| File | What |
|---|---|
| `apps/web/engine/uc_filename.py` | **New.** The list, the rule, the fallback |
| `apps/web/engine/server.py` | `_clean_payload` returns `download_name` and a `report.filename` block |
| `engine/tests/test_filename.py` | **New.** 28 tests |
| `apps/web/app/(marketing)/_components/workbench/workbench.tsx` | `cleaned-` deleted; the download name comes from the engine; the card and the report say what changed |
| `apps/web/lib/engine/types.ts` | `download_name` and `FilenameChange` on the response type |
| `docs/04-decision-log.md` | Entry 156 |
| `docs/06-assumptions-and-open-questions.md` | The `dc:title` question |

**Two files were not on the brief's territory list, and neither was on its
forbidden list. Flagged rather than done quietly.**

`apps/web/lib/engine/types.ts` is the file that describes what the engine
returns, the engine now returns a new field, and the change is a type
declaration with no behaviour in it. `docs/06-assumptions-and-open-questions.md`
is where `CLAUDE.md` section 6 requires an open question to be written at the
moment it is found, and section 6.5 of the brief produced one.

**`docs/CURRENT-HANDOFF.md` was deliberately left alone.** Other sessions are
working in this repository and the brief asked for a session note rather than a
handoff rewrite, so stamping the shared file would have overwritten somebody
else's resumption context.

**Nothing was pushed and nothing was deployed.**
