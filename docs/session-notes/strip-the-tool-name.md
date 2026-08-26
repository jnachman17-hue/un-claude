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
| **DALL·E / DALL-E / DALL_E / DALLE** | **On trust** | The brief, plus general reporting. No real download inspected |
| **Firefly** | **On trust** | Adobe's own community forum, a first-hand user report of downloads named `Firefly.jpg`. Adobe staff dispute it in the same thread |

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

**Claude, Grok and Meta AI: I could not find out.** The brief said UNKNOWN and
told me to find out. I searched, and there is no naming convention I can point
at for any of the three. Every real `Grok ...` file I found was named by a human
writing about Grok, not produced by it. **They are not in the list.** Adding
`Claude` in particular would have been the worst possible guess: Claude is a
common first name, so `Claude Monet study.docx` would have lost its first word to
remove a mark that may not exist.

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

**Engine suite: `870 passed, 1 skipped`.** Baseline was `842 passed, 1 skipped`.
The 28 new ones are `engine/tests/test_filename.py`. **No existing test was
changed, skipped or deleted.**

```
870 passed, 1 skipped in 17.83s
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

**2. That the list is anywhere near complete.** It names four tools. There are
dozens. Claude, Grok and Meta AI are the three the brief specifically asked about
and all three are absent, because I could not establish what they name their
files. **A list that looks complete and is not is the failure mode this whole
approach carries**, and the honest statement of where the coverage ends is: four
tools, two of them evidenced.

**3. That a tell in the MIDDLE of a name is handled. It is not.**
`Artificial planet by ChatGPT Image May 3, 2025.png` is a real file and keeps its
tell. This only looks at the front. Matching anywhere in a name would damage far
more customer filenames than it would clean, so this is a deliberate limit and
there is a test asserting it.

**4. That the collisions never fire.** `Gemini 4 spacewalk.jpg` and
`Firefly-shoes.jpg` will lose their first word. The file still opens, because the
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
