# Session notes — the six interface fixes

**25 August 2026.** Brief: `docs/briefs/six-ui-fixes.md`. **All six are built,
committed separately as the brief asked, and pushed on Jon's instruction.**

**The brief said do not push. Jon overrode that in session** ("Do rest of UI
fixes if not done and push live"), and `CLAUDE.md` section 2 makes his
instruction the higher authority. Recorded rather than assumed.

**On the scheduling rule.** The brief says this must not run while a pre-flight
session is live, because both own `app/(marketing)/**`. **This session IS that
pre-flight session**, so the two ran in sequence in one place rather than in
parallel in two, which is what the rule is for. No other session held that
territory: `git status` showed no uncommitted work anywhere under
`app/(marketing)` when this started.

---

## Fix 1 — the credit offer loses its pill

**Asked for:** signed out, credits spent, the offer reads *"Sign up to receive
[3 more] free credits"* and the pill around "3 more" is vertically off balance
against the text beside it. Remove the box and the outline, keep the coin and
the words.

**Which of the three pills in that file, because the brief is ambiguous.** It
quotes `CreditOfferBadge`'s class string but describes `OfferFigure`'s text.
**The deciding detail is Jon's own words: off balance *against the text beside
it*.** `OfferFigure` is the only one that sits inline inside a sentence.
`CreditOfferBadge` and the "0 credits" readout are standalone blocks with no
text beside them, so the complaint cannot be about them. **They are untouched,
and `/dev/states` confirms they still read correctly as objects.**

**The box was hiding the real fault.** The old version carried BOTH
`align-baseline` and `translate-y-[1px]`: two alignment mechanisms disagreeing,
baseline-aligning a flex box whose contents are centred and then nudging it back
a pixel to compensate. That cannot be right at every font size, and the outline
made the error legible as a tilt. `align-middle` does it in one instruction.

**The sheen decision, which the brief asked me to state.** `animate-sheen` is a
white gradient swept across the element and clipped by `overflow-hidden` on a
rounded background. **With no background it has nothing to travel over:** either
invisible, or at dark-mode contrast a smear crossing live text, which reads as a
rendering fault. **It came off. `animate-offer-pop` stayed** — that is the
bounce Jon originally asked for, it acts on the object rather than a surface
behind it, and it survives the box going.

**Verified** on `/dev/states`:

```
background     rgba(0, 0, 0, 0)      (was bg-mark/[0.16])
box-shadow     none                  (was ring-1 ring-mark/40)
border-radius  0px                   (was rounded-full)
padding        0px                   (was py-[1px] pr-2 pl-1)
vertical-align middle                (was baseline + translate-y-[1px])
```

---

## Fix 2 — the counter no longer moves at all

**Asked for:** after a run, "WORDS CLEANED WITH UN-CLAUDE" is pushed down out of
view. Keep it visible.

**Observed before changing anything, as instructed.** At 1280x760, scanning then
sanitising a short paste:

```
                 workbench    counter top / bottom    state
before the run     511px        464 / 613             fully visible
after the run      868px        642 / 791             31px BELOW THE FOLD
```

**The cause is not the counter.** The workbench is `lg:row-span-2` and both rows
were `auto`, so the grid met the spanning item's height by growing **both** and
split the 357px of new workbench evenly. Row 1 took ~178px it had no content
for, and the counter, which starts at the top of row 2, was carried down by
exactly that. **It was pushed by a row growing underneath the headline.**

**The fix is one class:** `lg:grid-rows-[auto_1fr]`. Row 1 is pinned to the
headline; row 2 takes the remainder, so growth is absorbed below the counter's
starting edge instead of shared with the row above it.

**After, at the same viewport:**

```
idle      workbench 511px    counter 418 / 567
cleaned   workbench 868px    counter 418 / 567
```

**It does not move at all now.**

**The prerender check the brief requires.** Nothing in the DOM moved, so the
`<Suspense>` boundary is untouched. Built for production and counted:

```
crawlable words : 1265   (floor: 1,234)
<h1> count      : 1
<h1> text       : If Claude wrote it, it's marked.
```

**Above the floor and one `<h1>`.** The counter is correctly absent from the
static HTML, because it streams from that boundary, which is the whole design.

---

## Fix 3 — the cue, and the three things that nearly made it useless

**Asked for:** *"a dynamic arrow pointing downwards you click or something so
people actually see receipts."*

**It points at the receipt, not the findings.** The findings region's top is the
checklist and the receipt sits below it in the same block, so aiming at the
region would let the cue go quiet the moment the checklist appeared, with the
receipt still a screen further down and still unseen. **That is the exact
failure it exists to prevent.** The label changes to "See your receipt" when
there is one.

**Three faults found by testing, not by reading. Every one of them would have
shipped looking correct in review.**

1. **`IntersectionObserver` never fired.** The first version used one and its
   callback did not arrive at all, so the cue never appeared on a page where the
   findings were plainly below the fold. Replaced with `getBoundingClientRect`
   on passive scroll and resize behind a `requestAnimationFrame` gate.
2. **`position: fixed` was trapped.** It resolves against the nearest
   transformed ancestor, and every hero column carries `animate-rise`. The cue
   rendered at **y=631 in a 500px viewport**, 131px below the window and off
   centre: visible to the DOM, invisible to the visitor. Fixed by portalling to
   `document.body`.
3. **`behavior: 'smooth'` silently did nothing.** Feature detection returns
   true, `'auto'` scrolls correctly, and `'smooth'` left `scrollY` at 0 a full
   second later. **A button whose whole purpose is "take me there" must not be
   able to do nothing**, so it now reads the position back and jumps the plain
   way if the smooth path did not take.

**Verified:**

```
before any scan, 1280x760     hidden
after a scan,    1280x760     hidden   (findings at 463, already readable)
after a scan,    1280x500     SHOWN    "See what we found", centred, on screen
after a sanitise,1280x760     SHOWN    "See your receipt" (receipt at y=714)
click                         scroll 0 -> 540, findings to top of window
after the click               gone
```

Real `<button>`, keyboard reachable, labelled in words rather than an unlabelled
arrow, icon `aria-hidden`. `cue-nudge` runs three times and stops; reduced
motion collapses it to rest and leaves the control there.

**On whether mobile needs it**, which Jon said "I think" rather than "it does":
**the cue is measurement-driven, so it appears on a phone exactly when the
findings are genuinely below the fold there and stays away when they are not.**
No separate mobile decision is needed, and no mobile-only code was written.

---

## Fix 4 — the placeholder waits for the swoosh

**Asked for:** the placeholder absent while the swoosh is over the box,
appearing the moment it leaves. The "Sanitises Claude, ChatGPT, Gemini, Grok and
every other model" line untouched — **and it is untouched.**

**Done in CSS, not by withholding the attribute, and the reason is the
reduced-motion trap the brief names.** The swoosh overlay carries
`motion-reduce:hidden`, so for a visitor who asked for less motion it never
renders, its animation never runs, and `onAnimationEnd` never fires:
`swooshDone` would stay false for the whole visit. **Gating the placeholder on
that state alone would have deleted it permanently for exactly the people least
able to guess what the box wants.** The `motion-reduce` variant hands it back
from the first paint.

**`focus:` is the second guard:** a visitor who clicks in while the swoosh is
still travelling gets the normal box, placeholder and all.

**And `swooshDone` now flips after three seconds whatever happens.** That flag
used to control decoration and now controls whether the box explains itself at
all, which is too much to hang on one `animationend` that does not fire if the
tab is backgrounded when the box mounts. The swoosh is 2.4s, so the event
normally wins and this changes nothing; it exists so the worst case is a late
placeholder rather than none.

Nothing leaves the accessibility tree: it is a colour change.

---

## Fix 5 — the FAQ heading is just "FAQ"

**Removed**, on Jon's explicit instruction, which overrides the messaging
skill's preference for a fuller heading:

> **Straight answers to the hard questions.**
> Including the ones most tools in this category hope you will not ask.

**Now:** `FAQ`.

**Checked what the removal left behind, which the brief asked for.** Those two
lines were the entire height of the left column, so deleting them blind leaves a
`lg:col-span-4` column holding one short word beside eight rows of questions,
still carrying display type sized for a headline that is no longer there. **The
heading drops from 28/34px to 20/22px. It is a section label now and it is sized
like one.**

Rendered and looked at, 1280 and 375: no gap, no orphaned eyebrow, questions
still on the same grid. **Nothing else on the site referenced that heading
text** — the only other copy was the brief.

---

## Fix 6 — the coverage legend stacks on a phone

**Measured before, at 375px:** a ragged two-by-two, and the second column starts
at a different x in each row because the four labels are four different widths.

```
y=2319:  Marking today   |  Committed, coming
y=2345:  Nothing yet     |  Does not produce this
```

**After:**

```
y=2392:  Marking today
y=2418:  Committed, coming
y=2444:  Nothing yet
y=2470:  Does not produce this
left edges: 20, 20, 20, 20    <- symbols in a column
```

**Desktop untouched**, which the brief required: the single row returns at `sm`
and up.

**One thing the stack exposed.** The third entry carried `gap-2` where the other
three carry `gap-1.5`, so its label sat two pixels right of the others.
Invisible in a wrapped row, obvious in a column, normalised here.

---

## What I could not prove

**Screenshots at 375px are thinner than the brief asks for.** The preview
browser returns a blank image for anything below the initial viewport, so
below-fold captures were taken by setting a very tall viewport instead of
scrolling. **That works for layout but it is not the same as a phone-shaped
screenshot**, and for fixes where I could not get a usable picture I fell back
to measured geometry, which the brief explicitly says is not a substitute. **The
geometry is in each section above; take it as weaker evidence than a picture.**

**Fix 3 on a real phone viewport was not exercised end to end.** Under the
browser's touch emulation the textarea would not take focus, so I could not
type, scan and watch the cue there. **Its behaviour is measurement-driven and
width-independent, so there is no mobile-specific code path to be wrong**, but I
did not see it happen at 375px and I am not claiming I did.

**Fix 1 was verified on `/dev/states`, not in the live zero-credit flow.**
Reaching that state on the real tool means spending the balance down. The
component and its props are identical in both places, but that is an inference.

**The engine was restarted with rewrite credentials to do this.** Local
development normally cannot sanitise, so fixes 2 and 3 could not be tested in
the state Jon described without it. Three real rewrites were run against the
gateway, costing a fraction of a cent.

**A production build was run while another session's dev server was live.**
`next build` and `next dev` share `.next`. The dev server still answered 200
afterwards, but if that session sees odd behaviour, that is the likely cause and
a restart clears it.
