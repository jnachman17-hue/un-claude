# Session note: the mobile pass

**Session 10, 21 August 2026.** Phase 3 of three, written as it happens.
To be merged into `04-decision-log.md` and `07-runbook.md`, then deleted.

**Jon's brief, and it is the governing philosophy rather than a checklist:**

> "There's so much to read and it's just blobs of information and text. We're
> going to need to use way less text on mobile than we do on web... And we're
> going to need to really utilise plus icons to expand sections if you actually
> want to look at them. So what you're mainly looking at is visuals and symbols
> and tables and easy-to-digest things you just look at, because let's be real,
> we're all brain rotted and we don't actually read."

**And the standing constraint that governs every cut below:** shorter copy is
the easiest way to overclaim by accident, because the caveat is the first thing
that gets cut. **So the method here is collapse before cut.** A paragraph
behind a plus is still on the page, still in the markup, still indexed, and
still there for anyone who wants it. Nothing load bearing went behind a
control: the claim, what we actually do, and the limits all stay outside it.

---

## FIRST, AN OPERATIONAL FACT THAT COST AN HOUR. For `07-runbook.md`

**The Browser preview pane cannot be used for mobile work on this site.**

Setting the pane to any width below 768px turns on its mobile *device
emulation*, and in that mode the landing page never finishes hydrating: every
section reports `offsetHeight: 0`, the document measures 1100px instead of
4142px, and the screenshot comes back as a hero over a blank sheet. It looks
exactly like a catastrophic layout bug in the app. It is not one. At 768px
and above, the identical page hydrates and measures correctly.

**Confirmed by elimination**, not by guessing: fresh tabs, closing every other
tab, reloads and long waits all reproduced it; only the width changed the
outcome. An iframe harness at 390px inside a non-emulated tab hydrated
correctly but still would not paint the tool.

**What works instead, and what this pass used for every measurement and every
screenshot below: the repo's own Playwright, driving the copy of Chrome
already installed on this machine.**

    cd apps/e2e
    node __probe.mjs / /how-it-works        # heights and overflow at 390px
    node __shots.mjs /how-it-works <dir>    # full-page slices at 390px

**`npx playwright install` is NOT needed and was NOT run** (it downloads
browsers, which needs Jon under `CLAUDE.md` section 5). `chromium.launch({
channel: 'chrome' })` uses `/Applications/Google Chrome.app`, which is already
there. That one option is the whole trick.

---

## The ledger

Every change, current state to new state, for Jon to ratify.

### Shared, so every page gets it

| # | What | Before | After |
|---|---|---|---|
| S1 | Section padding on every marketing section | `py-20` / `py-16` / `py-14`, the desktop figures, at every width | `py-12` / `py-11` / `py-10` below `sm`, desktop figures unchanged from `sm` |
| S2 | Footer link groups | Three lists stacked: twelve rows, about half a phone screen, on every page | Three columns side by side. Same links, a third of the height. Unchanged from `sm` |
| S3 | The tool's checklist rows | Label, "where it lives" and status all competing for one 390px row, so "Hidden characters" and "Statistical watermark" each broke across two lines with the status printed alongside the wreckage | Below `sm`: "where it lives" is hidden and the status sits under the label. One clean line per mark, same row height. **Nothing lost: the "where" line is teaching, and the + on the same row already opens the full three column table that teaches it properly.** Unchanged from `sm` |
| S4 | New component `mobile-disclosure.tsx` | n/a | Prose hidden behind a labelled plus below `sm`, and from `sm` the control and its wrapper dissolve to `display: contents` so the desktop rendering is exactly what it was |

### The home page. 4.9 phone screens to 4.2

| # | What | Before | After |
|---|---|---|---|
| H1 | The three beats (Marked invisibly / A public detector is coming / Marks don't expire) | Icon on its own line, then heading, then body, three times, 32px apart: about a third of a screen for three sentences | Icon beside the text as a row, gaps at 20px, heading 17px. Reads as the list it is. Unchanged from `sm` |
| H2 | Hero bottom padding | `pb-14` at every width | `pb-8` below `sm` |
| H3 | Checklist rows | see S3 | see S3 |
| H4 | Vendor table | seven rows each carrying a three-line grey note | notes removed in phase 2 |

**No copy was cut on this page.** Every word a visitor reads is the word that
was there before.

### /how-it-works. 8.0 phone screens to 6.4

| # | What | Before | After |
|---|---|---|---|
| W1 | The three mark panels | icon, title, lede, **two paragraphs of body copy**, WHAT WE DO checklist, status, then the diagram. Twelve to eighteen lines of grey prose standing between the visitor and the picture that explains the same thing in one look, three times over | icon, title, lede, **"How this one works +"**, checklist, status, diagram. The prose is one tap away and unchanged. From `sm` the control is gone and the paragraphs are back inline |
| W2 | "Free, on every scan, in under a second." | as written | "Free, on every scan." Jon called the under-a-second phrasing unnecessary on /capabilities; same phrase, same judgement |

**What deliberately stayed outside the plus, and why.** The lede carries the
claim. The checklist carries what we actually do. The status line carries the
limits, including "Needs a file. Pasted text has no wrapper to read." **A
phone reader who never opens a single disclosure still reads every
load-bearing sentence on the page.**

**Verified, not assumed.** On a 390px page the prose is not visible with the
control closed, is visible after one tap, and at 1280px the control is not
rendered at all while the paragraphs are present with their original spacing
(`display: contents`, `margin-top: 0`, gap from the parent). Measured in
Chrome, both widths, in the same run.

### /pricing. 7.5 phone screens to 6.5

| # | What | Before | After |
|---|---|---|---|
| P1 | "Anything left over from step one comes with you" | on the second free-credits card | **Gone.** Jon struck the same sentence from the paywall in phase 1 and asked for the leftovers with it. The arithmetic it introduced stays, because 2 and 3 need a total beside them or the two cards read as alternatives: "5 credits in total, or 5,000 words." |
| P2 | The four reassurances (never expire / a failed run costs nothing / no subscription / scanning is free) | icon on its own line above a heading above a body, four times | icon beside the words as a row, same grammar as the home page's three beats. Unchanged from `sm` |
| P3 | The three layer cards (Invisible characters / File metadata / The statistical watermark) | name, a four line description, then the claim pill | name, **"What comes off +"**, then the claim pill. The description is one tap away on a phone and inline as before on a desktop |
| P4 | Card padding | `p-6` at every width | `p-5` below `sm` |

**THE CLAIM PILL IS NOT COLLAPSIBLE AND THAT IS DELIBERATE.** "Proven on
every run" on two of those cards and "Best effort, and not verifiable yet" on
the third is the claims boundary doing its work on the page where money
changes hands. It stays visible at every width, with or without the plus. Only
the description of the work waits behind the control.

**The three pack cards were left alone.** They are about a full phone screen
between them, and they are the thing the page exists to sell. `04` entry 108
made the price the hero deliberately; shrinking it to save scroll would be
undoing last night's work to satisfy tonight's brief.

**Desktop checked, not assumed:** at 1280px the three layer cards render name,
full description and pill, all three the same height, exactly as before.

---

## Still to do

- /capabilities, 3.6 screens
- /mission, 3.7 screens
- /contact, 1.4 screens
- the wallet at /home

## A boundary being held

**/mission is Jon's essay in his own voice, and its words are not mine to
cut.** `CLAUDE.md`: "Jon writes the mission page in his own voice." The mobile
work there will be spacing, measure and rhythm only. If he wants it shortened
he can say so and it is a five minute job.
