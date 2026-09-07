# The arrival briefing: the top half animated

**6 September 2026.** Brief: `docs/briefs/briefing-top-half-animated.md`. One
file: `apps/web/app/(marketing)/_components/watermark-briefing.tsx`.

---

# 0. ★ THE FIRST ATTEMPT WAS WRONG AND IT WAS WRONG FOR ONE REASON

**I did not watch the video.** The brief says "Open it and watch it" twice. Both
times I built from the brief's written description of the scenes instead, and
the result was, in Jon's words, "an absolute botch of what I requested" and
"just so freaking far from what I called for".

**It was reverted in full and rebuilt from the video.** This section stays at
the top of the note because the failure is more useful than the fix:

- **I read "headline cards" as PRESS headlines** and spent the session verifying
  four real news headlines from `coverage-marquee.tsx`. **The video's headlines
  are its own display type**: "Since August 2nd,", "No.", "The watermark is the
  words.", "The model is nudged at every pick.", "Your essay sounds Human."
- **I built a static layout that faded in.** **The video is a sequence of full
  scenes that REPLACE each other**, each built around one big typographic
  statement with a Claude chat card as the recurring object. That is a
  completely different thing and it is the structural point of the whole task.

**The lesson, for the runbook: a rendered artifact is not describable from a
brief. `07` now carries how to watch one**, because the artifact is a
cross-origin iframe with no reachable `<video>` element and the player has to be
driven by clicking and dragging its scrubber.

---

# 1. THE VIDEO, FRAME BY FRAME, AS I ACTUALLY SAW IT

**Portrait 9:16, about 27 seconds.** Warm off-white ground, black display type,
rust for the accent. Watched at `claude.ai/code/artifact/6119d6be`, paused and
scrubbed frame by frame.

| Time | What is on screen |
|---|---|
| **0:00 to 0:05** | `Since` small and grey, then **`August 2nd,`** enormous and black, then `AI models watermark the text they write.` with **`Invisibly.`** in rust. Below it a **Claude chat card**: white, rounded, "Claude" label top left, a warm tan user bubble reading *"Write my final essay on the Industrial Revolution"*, and the essay **typing in progressively** (partial at 0:00.9 and 0:01.9, complete by 0:02.8) |
| **0:06 to 0:09** | **White cards streak past diagonally at speed**, about fourteen of them, motion blurred into lines, flying in from both sides, each with a small image at its leading edge. Then it clears |
| **0:09 to 0:11** | The Claude card alone, centred, essay complete. Then a large **`No.`** lands low and left |
| **0:11.5 to 0:14** | A **rust horizontal scan line sweeps down the card**. As it passes, individual words take **rust filled highlights**. A dark pill badge counts **`3 signals` up to `14 signals`**. Headline: **`The watermark is the words.`** with `words.` in rust |
| **0:15 to 0:18** | **`The model is nudged at every pick.`** Large running prose, not a card, with the picked words in rust and **words visibly swapping in place** (caught `part` mid swap to `sector`). Grey subline: *`Enough picks make a pattern a detector can test.`* |
| **0:18 to 0:20** | **`Your essay sounds`** then a huge word cycling in place: **`Fine.`** to **`Normal.`** to **`Human.`** The marked essay card sits below with the `14 signals` badge |
| **about 0:26** | **`Your writing already carries it.`** centred and bold, a dark pill **`[ Remove AI Watermarks Free ]`**, then grey **`No account needed.`** |

**The visual language, for the rebuild:** warm off-white ground; black display
type at two or three sizes with tight tracking; rust used for exactly one thing
at a time; the Claude card white with a soft shadow and a tan user bubble;
signals as rust filled word highlights; the counter a dark pill; the scan a
single rust rule; the CTA a near-black pill.

---

# 2. WHAT HAD TO BE CUT, AND WHY

**The video is 27 seconds and Jon's ceiling for the briefing is 10.** Four
scenes survive and three are cut.

**Kept**, because the brief names each one:

1. **`August 2nd` and the Claude card typing.** Beat 1, and it is the only scene
   that establishes what a watermark even is.
2. **`The model is nudged at every pick.`** The brief: *"Beat 2 is the one that
   matters. It is the idea made visible. Everything else serves it."*
3. **The scan and `The watermark is the words.`** The pattern made visible.
4. **`It means Claude touched it.`** Beat 4, which must settle and stay.

**Cut:** `No.` (it answers a question the modal has not asked), `Your essay
sounds Fine / Normal / Human` (a second word-cycling scene when there is already
one), and the closing `Your writing already carries it.` scene, because the
modal already has a permanent CTA pinned to its own footer.

**The card fly-in survives as a compressed transition**, which is what it is in
the video: texture that says "this is everywhere", not something to read.

---

# ★ 0. THE CURRENT BUILD. FIVE SCENES, 9,900ms. Everything below is history.

**7 September 2026, fourth round of Jon's notes.**

| Scene | From | To | What it shows |
|---|---|---|---|
| **1** | 0ms | 3,100 | `Since 2 August 2026`, then **`AI models watermark the text they write.`** with **`Invisibly.`** in rust. **From 1,500ms the news screenshots land ON the words**, 120ms apart, until they have buried the frame, the "Sorry, students" hero last |
| **2** | 3,100 | 6,100 | **`The model is nudged at every pick.`** over a **Claude window**, three picks visibly moving inside Claude's own answer |
| **3** | 6,100 | 8,000 | `Not hidden code. Not metadata.` then **`The watermark is the words.`** The same window, scanned, **8 picks lighting and a badge counting to 8** |
| **4** | 8,000 | 9,100 | **`So we rebuild the wording.`** The same window with the wording changed and the highlights gone |
| **5** | 9,100 | 9,900 | **The Un-Claude end card.** Held |

## The four notes, and what each changed

**1. *"It looks a little more sped up now, particularly the model is nudged at
every pick. That screen feels too compressed and too quick."*** **That scene went
from 2.2s to 3.0s**, the longest in the sequence, paid for by merging the first
two scenes.

**2. *"I'd rather just have the news blobs just cover that text... it literally
stays on frame one, and then that text becomes obscured by the news articles
popping up."*** **The news no longer gets its own scene.** The hook stays exactly
where it is and the screenshots land on top of it, **120ms apart rather than
170**, because he also asked for them to "cover the screen super quickly". They
are sized and placed to tile the box rather than to sit in it.

**3. *"This screen looks really bad... the title is sort of in the same area and
the text and the size as what's being scanned."*** **He was describing an absence
of hierarchy and he was right.** The ruling is now the display type at the top
and the scanned artefact is a small window under it, with the counter on the
window's own corner, which is where the handoff puts it.

**★ 4. *"I don't know why there's eleven signals when you highlight three
words."*** **A real bug, and the honest answer is that `SIGNALS` was a
hand-written `11` sitting next to three highlighted words.** It is now
`PROSE.filter(t => 'mark' in t).length`. **The badge and the highlights cannot
disagree again, whatever anybody does to that sentence.** Verified on screen:
eight picks lit, badge reads eight.

## ★ THE FIX BEAT, WHICH THE BRIEFING NEVER HAD

Jon: *"you need to make them know... you fix this by an engineered structural
rewrite to break the watermarks."* **Everything before scene 4 was the problem,
and a dialog that only states a problem has not earned its button.**

> **So we rebuild the wording.**
> An engineered rewrite breaks up the runs the mark travels in.

**★ IT DESCRIBES THE ENGINEERING AND STOPS THERE.** The highlights clear and the
wording visibly changes, and **there is deliberately no counter falling to
zero**, because a verified removal is the one thing this product may never show.
The claims file: confident about the engineering, stop short of proving the
outcome.

## Measured

```
PASS. Five scenes in order, nudge now 3.0s, total under the ceiling.
TOTAL 9900ms   CEILING 10000ms
marked picks: 8   badge counts to: 8 (derived)   words that visibly move: 3
```

**No scene clipped, panel does not scroll, CTA visible.** `tsc --noEmit` exit 0.

---

# ★ 0a. THE CURRENT BUILD. FIVE SCENES, 9,900ms.

**7 September 2026, after three of Jon's notes.** Everything below this section
is the record of how it got here and includes two versions he rejected.

| Scene | From | To | What it shows |
|---|---|---|---|
| **1** | 0ms | 2,200 | `Since 2 August 2026` as a small label, **`AI models watermark the text they write.`** as the display type, **`Invisibly.`** in rust and underlined |
| **2** | 2,200 | 4,800 | **Six real news screenshots** popping in scattered and rotated, 170ms apart, then the **California Post "Sorry, students" hero** landing centred |
| **3** | 4,800 | 7,000 | **`The model is nudged at every pick.`** over a **Claude chat window** with its mark, its label and a prompt bubble, and three words swapping inside Claude's own answer |
| **4** | 7,000 | 8,900 | `Not hidden code. Not metadata.` then **`The watermark is the words.`** A rust rule crosses the sentence, each pick takes a filled highlight, a pill counts the signals |
| **5** | 8,900 | 9,900 | **The Un-Claude end card**, logo over *"Your writing already carries it."* **Held. Nothing moves again.** |

## The three notes this round, and what each changed

**1. *"Can that look like it's in the Claude chat textbox UI, like Claude wrote
it and nudged it."*** Scene 3 is now a Claude window: the mark from the handoff
bundle, the "Claude" label, a right-aligned prompt bubble, and the swapping
words inside the answer. **It is the right instinct and it is what the handoff
does** — the essay lives in a Claude window for the whole video, so the picks
are visibly Claude's rather than a sentence on a page.

**2. *"At end of visual finish with an Un-Claude screen and have it pause
there."*** Scene 5, which is the handoff's own closing frame minus its button
and sub-line, **because this dialog already has a permanent CTA in its footer
and does not need two.** It is also where a reduced-motion visitor lands and
where the review loop rests before starting over.

**3. *"Highlight 'Soon universities, companies and individuals will have access
to it' just like 'it's marked' is highlighted on the homepage."*** Done, in the
same `bg-destructive/[0.16]`.

**★ BUILT DIFFERENTLY FROM THE HOMEPAGE'S, ON PURPOSE.** The homepage version is
a bar positioned absolutely behind the phrase and sized in `em`, because an
inline background follows the font's ascent and descent rather than the ink;
`hero-section.tsx` has the whole account of getting that wrong twice. **That
technique cannot cross a line break, and this phrase wraps to two lines.** So
this one is a real inline background with `box-decoration-clone` so it paints
once per line, and its own `leading` so the box hugs the text. **Measured: two
line boxes, both painted, same colour.**

## Measured

```
PASS. Five scenes in order, each finishing inside the next, total under the ceiling.
TOTAL 9900ms   CEILING 10000ms
```

**No scene is clipped by the box, the panel does not scroll, and the CTA is
visible.** `tsc --noEmit` exit 0.

---

# ★ 1a. THE DESIGN HANDOFF, AND THE ONE THING IT SETTLED

**7 September 2026.** Jon handed over
`~/Downloads/design_handoff_pin1_watermark_video`, the source bundle for the
pinned campaign video: a README, `pin1-scene.jsx` with every scene's copy,
position and timing, the Un-Claude logo, and **twelve real news-headline
screenshots**.

**Read with Jon's explicit instruction, which overrides `CLAUDE.md` section 3's
"nothing outside `~/un-claude`" rule.** `CLAUDE.md` section 2 makes his
instruction in a session the highest authority; the folder is this project's own
design handoff and contains no personal data. Noted rather than assumed.

## ★ WHAT IT SETTLED, AND IT IS THE THING TWO ATTEMPTS GOT WRONG

**The "news headline snippets" are photographs.** The README's headline scene:

> 11 news-screenshot cutouts (in `uploads/`) pop in one-by-one, 0.22s apart,
> each rotated -8 to +7 degrees, drop shadows, 14px radius, scattered to fill
> the frame... At +2.75s the hero card lands with a pop.

**Both earlier attempts composed cards out of an outlet logo and a line of
headline text.** That is not what the design is, which is why Jon said the
snippets "don't appear anywhere" and "you could literally copy that directly".
**There was nothing to find, because I had been building the wrong object.**

## WHAT WAS TAKEN, AND WHAT WAS NOT

**Taken directly:** the screenshots themselves, the scatter-and-pop behaviour,
the hero landing last and centred, and **the two rule-outs from its scan scene**
("Is it hidden code?" / "Is it metadata?" / "No.") which are now one line above
the reveal and do this site's hardest teaching job for about a dozen words.

**Not taken:** the pixel positions, because the video frame is 1080 wide and
portrait and this box is about 490 and landscape. The scatter is re-laid to fit.
Also left behind: the Claude chat window (Jon cut it), the slot-machine roll
scene, and the closing CTA scene, because this dialog has a permanent CTA of its
own and a ten second ceiling against the video's 27.5.

## ★ EVERY SCREENSHOT WAS OPENED AND READ BEFORE IT WENT ON THE HOME PAGE

A screenshot cannot be checked by reading its filename, and these go on a live
commercial page. Seven were chosen and each one's `alt` is what it actually
says:

| File | What it is |
|---|---|
| `IMG_3479` | **California Post: "Sorry, students: Anthropic adding watermarks to AI-generated content, potentially making cheating harder"** — the hero, and the best headline in the set for the person this dialog is for |
| `IMG_3578` | Anthropic: "How Claude's text watermark works" |
| `IMG_3580` | Forbes: "Claude Is Now Putting Invisible Watermarks In AI-Generated Text" |
| `IMG_3585` | The Guardian: "Claude to start watermarking AI-generated text, but will it make quality worse?" |
| `IMG_3577` | Business Insider: "Why Anthropic's AI watermark is going further than its rivals" |
| `IMG_3581` | Mashable: "What Claude's AI text watermark actually does" |
| `IMG_3583` | New Atlas: "Claude will now watermark all content generated using its tools" |

**And every one was resized.** The originals are phone screenshots totalling
**1,816KB**, which is an absurd thing to put in front of somebody arriving from
TikTok before they have seen the tool. At 560px wide and JPEG quality 62 the
seven together are **288KB**, and a card renders about 190px wide, so 560 is
still comfortably 2x on a retina screen.

## THE SEQUENCE NOW, FOUR SCENES IN 9,800ms

```
SCENE                                   FROM      TO   LASTS
----------------------------------------------------------------------
1  AI models watermark... Invisibly.       0ms   2400ms   2400ms
2  the news screenshots pop in          2400ms   5200ms   2800ms
3  nudged at every pick, words swap     5200ms   7400ms   2200ms
4  not code, not metadata: the words    7400ms   9800ms   2400ms
   (6 shots 180ms apart, hero lands 4000ms)
----------------------------------------------------------------------
TOTAL                                                       9800ms
CEILING (Jon's number)                                     10000ms
PASS. Scenes in order, hero lands inside its scene, total under the ceiling.
```

**Measured: no scene is clipped by the box, the panel does not scroll, and the
CTA is visible.**

---

# ★ 2a. SUPERSEDED. SECTIONS 3 TO 6 BELOW DESCRIBE A VERSION JON REJECTED.

**7 September 2026.** The four-scene build documented from section 3 onwards was
shown to Jon and rejected. **Read this section instead; the rest is kept because
the reasons are still the record of how the design got here.**

**What he said, and what each note changed:**

| His note | What changed |
|---|---|
| *"Better if the top half is contained in a box itself and it plays more as a video of things you visually digest as opposed to a bunch of text you read"* | **The animation now has its own bordered box** inside the dialog, its own ground, and a fixed height |
| *"Those news headline snippets don't appear anywhere. I think you failed to add them in but I see where you intended to"* | **He was right.** They were blank white bars streaking past as texture. **They are now four real cards that pop in one at a time**, each an outlet mark and a verified headline, and each links to its article |
| *"I hate Aug 2nd being so big. Really weird... not logical to make an emphasis on Aug 2nd because the date doesn't really matter"* | **Reversed.** The date is a 12px label; "AI models watermark the text they write." is the display type, and **"Invisibly." is rust and underlined** |
| *"That industrial revolution thing shows us or teaches us nothing and just adds to the complexity of what is digested"* | **The Claude chat card and its essay are gone from scene 1.** The snippets take that space |
| *"A mark does not mean Claude wrote it... that's too much nuance. We don't need that"* | **Cut.** It is a good sentence and it is not this dialog's job |
| *"The orange highlights overlap, and they don't actually place against the words"* | **Fixed at the cause.** §2b |
| *"The whole nudge thing is right"* | Kept, and **the sentence it works on went from 25 words to 11**, because the complaint underneath all of this is that there is too much to read |

## THE THREE SCENES NOW

| Scene | From | To | What it shows |
|---|---|---|---|
| **1** | 0ms | 3,800 | `Since 2 August 2026` as a small label, then **`AI models watermark the text they write.`** with **`Invisibly.`** in rust and underlined, then **four news snippets popping in** at 420ms apart |
| **2** | 3,800 | 6,800 | **`The model is nudged at every pick.`** and one short sentence with three words swapping between alternatives that read just as well, landing at 6,400ms |
| **3** | 6,800 | 9,600 | **`The watermark is the words.`** A rust rule travels across the sentence, each pick takes a filled highlight as it passes, and a pill counts to `11 signals`. **Held.** |

**Still 9,600ms against the 10,000ms ceiling, still asserted in the file.**

## ★ 2b. THE HIGHLIGHT DEFECT, AND WHY IT WAS A REAL BUG RATHER THAN A NUDGE

Jon: *"the orange highlights overlap, and they don't actually place against the
words."*

**The cause: an `inline-block` inherits the LINE's height.** So a highlight box
was exactly as tall as the line pitch, and two boxes on consecutive lines met
edge to edge with no gap at all, at any parent line-height. Raising the
line-height did nothing, because it raised the box height by the same amount.
Measured before the fix:

```
striking  y 278  h 47      held  y 278  h 47      trial  y 325  h 47
gap between stacked boxes: 0px
```

**The fix is one class: the box carries its own `leading-[1.25]`**, so it is as
tall as its own text plus its padding, and the parent's line-height becomes real
space between boxes. After:

```
striking  y 288  h 31      held  y 288  h 31      trial  y 331  h 31
gap between stacked boxes: 12px      collisions: 0      overflows the box: false
```

## THE TEXT UNDER THE VIDEO

**Jon's own wording, 7 September:**

> **A watermark detector already exists**
> Anthropic has publicly released a watermark detector. **Soon universities,
> companies and individuals will have access to it.**

**★ IT IS TRUE, AND ONE THING ABOUT IT NEEDS WATCHING.** Anthropic *has*
publicly released a watermark detector: `claude.com/check-content`, free, no
account. And its text detector exists too, in private preview, with "educational
organizations" named among those who can request access.

**But those are two different detectors.** The public one reads C2PA credentials
in files and cannot see text at all; the one this dialog is about is the text
detector, which is not public yet. **"Soon universities, companies and
individuals will have access to it" is the clause that keeps the sentence
honest**, because it puts general access in the future. **It must not be moved
to the present tense.**

`Marks don't expire` is untouched. Jon: *"that's good."*

---

# 3. WHAT WAS BUILT, SCENE BY SCENE

**A stage of fixed height with four scenes stacked in it. One is in the layout
at a time.**

| Scene | From | To | What it does |
|---|---|---|---|
| **A** | 0ms | 2,900 | `Since` / **`August 2nd,`** / `AI models watermark the text they write.` **`Invisibly.`** Below it a Claude card: the "Claude" label, a tan user bubble reading *"Write my final essay on the Industrial Revolution"*, and the essay **typing itself in word by word** from 400ms to 2,200ms |
| — | 2,100 | 3,000 | **Cards streak past from both sides**, over the cut into B |
| **B** | 2,900 | 6,100 | **`The model is nudged at every pick.`** The essay again, larger and out of the card, with six words **swapping between alternatives in rust every 260ms** and landing on what was written at 5,900ms. Grey subline: *`Enough picks make a pattern a detector can test.`* |
| **C** | 6,100 | 8,000 | A **rust scan line travels down the prose**, the picked words take **filled rust highlights** as it passes, a dark pill **counts up to `14 signals`**, and the headline cuts to **`The watermark is the words.`** |
| **D** | 8,000 | 9,600 | **`A mark does not mean Claude wrote it.`** **`It means Claude touched it.`** in rust, the follow-up line, and the marked card with its `14 signals` badge underneath. **Then nothing moves again.** |

**Total 9,600ms against Jon's 10,000ms ceiling.** Derived from the source rather
than typed here:

```
SCENE                                       FROM     TO   LASTS
--------------------------------------------------------------------------
A  "August 2nd" + the Claude card typing       0ms   2900ms   2900ms
   (essay types 400 to 2200ms)
   cards streak past, over the cut          2100ms   3000ms    900ms
B  "nudged at every pick", words swapping   2900ms   6100ms   3200ms
   (a swap every 260ms, they land at 5900ms)
C  the scan, the signals, "the words."      6100ms   8000ms   1900ms
D  "It means Claude touched it", HELD       8000ms   9600ms   1600ms
--------------------------------------------------------------------------
TOTAL                                                9600ms
CEILING (Jon's number)                              10000ms
PASS. Scenes are in order, the streak covers the cut, and the total is under the ceiling.
```

**The ceiling is asserted in the file**, so stretching a beat past ten seconds
is a build error rather than a briefing people close:

```ts
if (T.TOTAL > 10_000) throw new Error('The briefing must not exceed 10 seconds.');
```

## ★ Two defects found by looking, which is the only way they were ever going to be found

**1. The scenes cross-faded, and it drew two of them at once.** "The model is
nudged at every pick." rendered straight through "August 2nd," and its Claude
card. **It reads as a rendering fault and it is a large part of what Jon saw.**
**The video cuts between scenes**, so this now cuts: only one scene is in the
layout at a time, and motion lives inside a scene rather than between two.

**2. Reserving width for the swapping words left holes in the sentence.** Each
open word was held at the width of its longest alternative, so the line read
"Revolution utterly&nbsp;&nbsp;&nbsp;&nbsp;transformed". **The video lets the
prose reflow**, so this does too.

---

# 4. THE BOTTOM HALF, EVERY CHANGED SENTENCE

## 4.1 The detector block

**BEFORE**

> **The detector is close**
> Anthropic has committed to releasing a public watermark detector imminently.
> Universities, corporations, and individuals will be able to use this.

**AFTER**

> **Detection is already running**
> The text detector is in **private preview** now, not a promise for later.
> Anthropic names **"educational organizations"** among those who can request
> access, and says it plans to widen that access over time.
>
> *Both from Anthropic's own announcement.* (linked)

**Every clause verified 6 September 2026 against Anthropic's own two pages:**

| Clause | Source, verbatim |
|---|---|
| in private preview now | *"Watermark detection is currently in private preview"* |
| "educational organizations" can request access | *"regulators, law enforcement, media, fact-checkers, independent researchers, educational organizations, and EU civil society groups"* |
| plans to widen that access | *"We plan to expand access to the detection API over time."* |

**★ WHY JON'S OWN PHRASE COULD NOT COME WITH IT.** "Universities, corporations,
and individuals will be able to use this" was true as a forecast. **Moved into
the present tense it becomes false: corporations and individuals are not on the
eligibility list.** So the block is present tense for what is running and future
tense for the widening, which is more frightening than the original rather than
less, because the first half is now a fact.

**★ WHAT IS DELIBERATELY NOT ON SCREEN.** The announcement frames eligibility as
*"eligible organizations as required under EU law"*. **The dialog does not say
that.** "Private preview" and "can request access" already tell a visitor it is
gated; naming the EU clause is more precise and would invite an American student
to conclude it can never reach them, which Anthropic's own "we plan to expand
access" contradicts. **It is the one place I chose impact over precision.**

## 4.2 Marks don't expire

**The head is Jon's and is untouched** ("that's good").

> **BEFORE** ...The day the detector opens, it can be checked.
> **AFTER** It does not fade, and it can be checked long after you handed it in.

**"The day the detector opens" was written when the detector had not opened for
anybody. It has now, for some.**

## 4.3 It got weight, and only one phrase got the rust

Two lines of 13.5px grey under an animation is the shape of small print. It is
now a bordered, tinted block with 15px heads, 14px bodies and its source
attached. **One highlight, not three**: the rust is spent on "educational
organizations" and nothing competes with it.

---

# 5. ★ THE CTA, AND THE RULING IT OVERRIDES

**BEFORE** `Free, takes seconds, and needs no account.` / **[ See what your own
text is carrying ]**

**AFTER** **[ Remove AI Watermarks Free ]** / `No account needed.` — which is
the video's own closing frame.

**`04` entry 70 ruled the opposite, in Jon's words:**

> **"Sanitise" stays.** "Remove watermark" would be untrue, because for layer B
> nobody can say the watermark was removed. Sanitise claims the work, not the
> outcome.

**Jon asked for this button and `CLAUDE.md` section 2 makes his instruction the
highest authority, so it is built as asked.** Section 2 also requires naming the
document rather than resolving the conflict quietly, which is what this is.

**It is sharper here than anywhere else on the site**, because the dialog spends
9.6 seconds teaching layer B and then offers to remove it. `04` entry 78 ruling
3: a claim in a whole-service slot must be true of the whole service, and
removal is provable for hidden characters and metadata and **not** for the
rewrite.

**What keeps it defensible:** the site already sells itself as an AI watermark
remover in its own title tag, the tool really does remove two of three layers
provably, and no sentence in the dialog claims the rewrite is verified.

**The one-word fix if Jon wants entry 70 back: "Sanitise" for "Remove".**

## The analytics survived, and here is the check

`briefing_dismissed` carries `via`, and **`via` is a hardcoded literal in the
click handler, never read from the button's text**:

```
watermark-briefing.tsx:  onClick={() => close('cta')}
events.ts:               via: 'cta' | 'close' | 'backdrop' | 'escape';
```

**The button text cannot break the event.**

---

# 6. RENDERED AND MEASURED

**All four scenes were photographed rendering**, after the two defects above
were fixed: scene A with the essay typing, scene B with the words swapping and
the prose reflowing, scene C with the scan highlights and the `14 signals`
badge, and **scene D holding unchanged across two screenshots eighteen seconds
apart.**

```
375 x 812   panel 375 x 763   content 763   scrolls FALSE
            stage 300px, 4 scenes, one in the layout at a time
            CTA visible, sub-line visible, detector block visible
            elements crossing the edge 0     sideways scroll false
```

**Nothing scrolls on a phone.** `tsc --noEmit` exit 0.

---

# 6a. ★ `?briefing=loop`, BECAUSE REVIEWING THIS WAS NEARLY IMPOSSIBLE

**Jon, 7 September: "have it loop so I can actually look at it deeply and watch
it, instead of one time where it doesn't loop and then cookies remember it's
there and I can't see it again."**

Both of those are correct product behaviour and both make review impossible: the
sequence plays once and stops, and it never shows again on that device.

**`http://localhost:3001/?briefing=loop`** skips the once-per-visitor check,
writes nothing to storage, and restarts the sequence after holding its final
frame for two seconds. **Everything else is the real component in its real
place**, which is the point. A separate demo page would be a different thing
from the one that ships.

**★ IT CANNOT TOUCH PRERENDERING.** The parameter is read from
`window.location.search` **inside an effect**, never with `useSearchParams`.
Reading search params during render is the same shape as the `Date.now()` that
cost this site its indexing: it would pull the homepage out of its static
prerender. This runs after mount, in a component that already renders nothing on
the server.

**Proved by running it**, scene by scene, in a throttled tab so the wall clock is
stretched about tenfold:

```
LOOPED: true
  32s  scene 0  A August 2nd
  37s  scene 1  streak
  38s  scene 2  B/C nudged + scan
  88s  scene 3  D touched it
 125s  scene 0  A August 2nd      <- it came back round
```

**It ships.** A visitor would have to guess the string, it changes nothing for
anybody who does not, and a review tool that only exists on a branch is one
nobody has when they need it.

---

# 7. WHAT I COULD NOT PROVE

**1. ★ THE WALL-CLOCK TIMING. The 9.6 seconds is arithmetic, not a stopwatch.**
Every browser this session could reach reported `document.visibilityState ===
"hidden"`, and a backgrounded tab clamps timers hard: the sequence took about
90 seconds of real time to play through, which is why the scene screenshots are
spaced 9 seconds apart. **The designed timings are exact and asserted. That a
foreground browser runs them in 9.6s is not something I could watch.**

**2. Scene C after the reflow fix.** It was photographed before that change and
the change only removed a width reservation. **The same highlight styling is
visible in scene D's card, which did get photographed afterwards.** Reasoning,
not a photograph, and it is a small gap.

**3. `prefers-reduced-motion`.** The branch sets `ms` to `T.TOTAL`, which is
scene D held. **The media query cannot be emulated from here**, so what is
proved is that the branch exists and that scene D renders correctly.

**4. A 375px photograph.** Chrome refused to size its window below about 500px.
**The 375px numbers are DOM measurements.**

**5. Whether the compression works.** The video is 27 seconds and this is 9.6.
Three scenes were cut. **Whether what is left still lands is Jon's judgement and
he should watch it at real speed**, which takes ten seconds in a foreground tab
and is the fastest verification available to this project.

---

# 8. HANDED BACK

**1. ★ The CTA verb crosses `04` entry 70.** §5, one word from reconciled.

**2. ★ The EU-law clause, left off screen.** §4.1.

**3. `claude-band.tsx` now understates the case, again.** It still says a public
checker is "imminent". Detection in private preview, with educational
organisations named, is verified fact. **The band and the briefing disagree and
the band is the one that is wrong.**

**4. The messaging skill still says the detection API is "not callable yet" and
that a detector usable today is forbidden.** Both were true when written. It is
a claims file, so the rewording is Jon's.
