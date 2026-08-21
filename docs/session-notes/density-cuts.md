# Session note: cutting the text density

**Session 10, 21 August 2026.** Phase 2 of three. To be merged into
`04-decision-log.md` and deleted.

---

## 2a. The vendor table on the home page lost its notes

Every one of the seven rows carried a grey paragraph underneath it, three or
four lines long, of sourced detail:

> "Files signed since 2 August 2026. Text watermarking applies to models
> launched from that date, with no opt out, and is being added to today's
> models over the coming months."

Seven of those turned a table into seven small essays, in the one section of
the page whose whole value is that it can be scanned down a column. Jon:
**"Remove those notes entirely. Keep the table. Jon wants the table to speak
for itself."** Done.

**The claims boundary was checked before cutting, and is unaffected.** The
distinction those notes carried is still carried, by the marks themselves: a
green tick means marking today and an amber clock means committed but not
shipped, and both are spelled out in the legend directly under the table. The
dated sourcing footnote stays. **Nothing that was true only of one vendor is
now implied of all seven.** The removed wording lives in `ENGINE.md` section 2,
which is where it came from.

## 2b. The capabilities table says its answer in the cell

**Jon's report, and it was accurate:** *"the text can't carry over... it
expands all the way over into the right columns where no text should be... on
mobile the text hangs over so much worse and obscures the icons for everything
else. This literally needs to be done in like five words or something."*

**The structure is unchanged, as instructed.** It is still input down the side
and mark across the top. Jon withdrew his own first objection to that
breakdown mid-thought and it was not revisited.

**What changed is where the words live.** Each row used to end in a grey
paragraph running the full width of the table, underneath all three dots,
answering all three columns in one sentence. So a reader had to hold three
questions in their head and then unpick one sentence to answer them, and the
answer sat nowhere near the column it belonged to.

**Now every intersection answers for itself, in three or four words, beside
its own dot. The paragraph is gone.**

| | Hidden characters | Metadata | Statistical watermark |
|---|---|---|---|
| **Pasted text** | Removed, with a receipt | No file, no metadata | Rewritten, and measured |
| **Word documents** | Removed, with a receipt | Removed, with a receipt | Paste the text instead |
| **PNG and JPG images** | No text to check | Removed, with a receipt | No text to rewrite |

**THE REGISTER IS THE CLAIMS BOUNDARY IN SHORTHAND, and this is the thing to
protect if anybody edits these words later.** The two provable layers say
"with a receipt". The statistical rewrite says "measured". Same table, two
different strengths of claim, and short enough that the difference is legible
rather than buried at the end of a sentence. **Do not give the rewrite a
receipt word.** A comment saying so sits on the data in the file.

"Scanned free in under a second" is gone, as asked.

**Two layouts, one set of facts.** A three-column matrix with readable words in
it cannot fit across 375px, and the version that tried is exactly what Jon
reported. So the phone gets the same table folded: one card per input, its
three marks listed under it, each with its dot, its mark name and its answer.
Wider screens keep the matrix. Same rows, same columns, same words.

---

## How this was verified

Rendered and measured at three widths.

| Width | Result |
|---|---|
| 1280px | Matrix. Every cell one line except "Rewritten, and measured", which takes two. `scrollWidth` equals `offsetWidth` on all twelve cells: **nothing overflows its column** |
| 660px | Matrix, cells wrapping to two lines, no overflow |
| 375px | Stacked cards. `document.documentElement.scrollWidth` is 375 against a 375 viewport and **zero elements extend past the right edge** |

That last measurement is the acceptance test Jon set, run as a query over
every element in the page rather than by eye.

Typecheck clean. The home page vendor table was screenshotted after the cut
and reads as seven scannable rows.

**One operational note worth keeping:** the preview pane refused to paint the
vendor section after a normal scroll, which is the documented dead-paint
failure. What worked was the runbook's own recipe: a fresh tab, a tall
viewport, and `document.body.style.transform = 'translateY(-N)'` to bring the
section into the frame the pane is willing to paint, rather than scrolling to
it.

---

## Left for Jon

- **`/how-it-works` still says "Free, on every scan, in under a second."** on
  one status chip. Jon called that phrasing unnecessary on the capabilities
  page. It was left alone here because it is a different page and a different
  slot, and /how-it-works is being touched in the mobile pass anyway.
