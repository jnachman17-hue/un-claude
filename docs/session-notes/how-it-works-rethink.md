# /how-it-works, rethought

**6 September 2026.** Brief: `docs/briefs/how-it-works-rethink.md`. A UI, copy
and visuals job on one page. No engine code, no pushes, no deploys.

**Written as I went. "What I could not prove" is section 9 and it is the part
to read first if you only read one.**

---

# THE HEADLINE, BEFORE ANYTHING ELSE

**Two things to know before the rest of it.**

**1. There ARE screenshots, but only after a detour, and one thing is still
unproven.** The in-app Browser pane in this session is hidden, and a hidden pane
does not draw the page: every scroll and every screenshot after the first paint
came back blank or timed out with the tool's own message, *"The Browser pane is
currently hidden. The page is not rendered while it is not displayed."*
**This is the same failure the 25 August copy session hit and could not name.**

**The way round it was the user's own Chrome**, which is connected to this
session, and it rendered the page properly. **So this page has been looked at,
at 1296px and at 500px, and the pipeline animation was photographed
mid-sequence with its placeholders showing.** Section 6.

**What is still not proven is autoplay on entry**, and the reason is now
measured rather than guessed: that Chrome window is not frontmost, so
`document.visibilityState` is `"hidden"` there too, and **a freshly created
IntersectionObserver watching an element demonstrably inside the viewport fired
nothing in two seconds.** It is the environment, not the component. Section
9 item 2.

**2. THE PAGE IS TALLER, NOT SHORTER, AND "LESS SPACE" WAS PART OF THE ASK.**

```
                         BEFORE      AFTER     CHANGE
desktop 1280px            4,140px    4,828px   +688px   (+17%)
phone   375px             5,553px    8,103px   +2,550px (+46%)
```

**I could not deliver a shorter page and also deliver what the brief ordered,
and I am not going to dress that up.** The brief's own instruction was to add a
new section that this page did not have, sequential, with motion, covering
seven beats, because *"the rewrite is what most visitors came for"*. That
section is 1,334px on desktop. The band it replaced was 442px. **The rewrite
went from a 230 word spec sheet to a 430 word sequence with two animations,
which is four times the explanation in three times the space.**

**What did get smaller is everything the brief called broken:**

```
                         BEFORE      AFTER     CHANGE
panel 1 Hidden chars        520px      520px     level
panel 2 Metadata            567px      543px     -24px
panel 3 Statistical       1,189px      610px     -579px   (-49%)
  ratio, panel 3 to 1        2.3x       1.17x
mobile "+" disclosures         3          0
```

**The three panels are symmetric, which is what part (a) of the brief asked
for.** Section 5.

**My position on the height, stated so Jon can overrule it.** The 46% on a
phone is the number that bothers me and I could not get it down without cutting
narrative the brief specifically ordered. **If less space matters more than the
seven beats, the cut I would make is beat 6 folded into the existing "Where
proof stands" section**, which says a version of the same thing 400px further
down. That is 200px on desktop and about 350px on a phone, and it costs the
sequence its ending. **I did not do it, because the brief names beat 6 as part
of the sequence. It is one edit away if he wants it.** Section 10.

---

# 1. WHAT THE BRIEF SAID WAS WRONG, MEASURED BEFORE I STARTED

**I measured the baseline myself rather than taking the brief's word for it, and
it matched to the pixel and to the word.**

```
$ node prerender-check.mjs apps/web/.next/server/app/how-it-works.html
words     1247
<h1>      1 found
          "Where an AI watermark actually hides."

live DOM, 1280px viewport
{"hidden-characters":520,"metadata":567,"statistical-watermark":1189,"doc":4140}
```

**520 / 567 / 1,189 and 4,140px, exactly as the brief states.** 1,247
prerendered words, exactly as the brief states. So the diagnosis was sound and
I did not re-open it.

---

# 2. WHAT THE PAGE IS NOW

**Two halves doing two different jobs, which is the split the brief ruled.**

**(a) The three marks, as three symmetric panels.** One idea, one visual,
comparable height. Panel 3 says what the statistical mark is and that it comes
off by rewriting, and stops.

**(b) "How the rewrite works", underneath, sequential, with motion.** Seven
beats in the order the brief set, two animated stages, and the honesty at the
end.

**The four ENGINE_RULES cards are gone as a list and nothing in them was
lost.** Where each one went is section 4.4.

---

# 3. THE NEW SECTION, EVERY WORD OF IT

**Nothing here existed on the page before. It is all new copy except the last
sentence, which moved.**

## 3.1 The section header

> ## How the rewrite works.
>
> The signature travels in runs: unbroken stretches of the words the first
> model picked. Break the runs and there is nothing left to read it from. Here
> is what happens to your document, in the order it happens.

**"Runs" is taught in the same breath it is used**, which is the grammar the
25 August pass settled on and `04` entry 76 requires. **This sentence is also
where the old "Break the runs" rule went.**

## 3.2 Beat 0 and beat 1, the entropy block

> **WHERE THE MARK CAN LIVE**
>
> ### A watermark needs a choice to hide in.
>
> When a model writes, some places leave it plenty of freedom and some leave it
> none. After "the sky was", grey, overcast and gloomy all fit. After "the
> Treaty of", there is one answer. A watermark works by nudging the pick, so it
> can only exist where there was a pick to nudge.
>
> **Which makes the job narrower than it looks. You do not have to rewrite
> everything. You have to rewrite the places where the model had freedom, and
> break the runs that carry the signal between them.**

**This is the argument the brief said was missing from the page.** The old
panel 3 said several words "read equally well" and never drew the conclusion.
The conclusion is the reason the whole design makes sense, and it is what makes
freezing quotations free rather than a compromise.

**Beside it, the animation.** Running prose in which four words cycle through
alternatives and one span never moves:

> The Treaty of Versailles *transformed* the map of Europe. Trade *expanded*
> across the new borders, old rivalries *pursued* fresh ones, and the pace of
> change *quickened*.
>
> · The model had a choice here    · No choice, so nothing to nudge

**`transformed / changed / reshaped` · `expanded / grew / widened` ·
`pursued / chased / followed` · `quickened / sped up / raced`.** Rust for the
word actually written, grey for the alternatives passing through. Those are
scene 2's own word pairs from Jon's motion canvas.

**"The Treaty of Versailles" is the whole other half of the idea.** It is boxed
and it never changes, because there was only ever one thing it could say.

## 3.3 Beats 2 to 5, the pipeline block

**Four numbered beats beside one document strip that transforms through all
four.**

> **1. Split**
> Your document goes in as pieces of about 350 words. A thousand words is three
> of them. Hand a model ten thousand at once and it drifts, drops facts and
> comes back shorter; small pieces stay faithful, and they run at the same time.
>
> **2. Freeze**
> Quotations, citations, references and headings become numbered placeholders
> before anything is sent, so the rewriting model never sees those words.
> Nothing is lost by that: a verbatim quote was copied from fixed text, so there
> was no freedom in it to carry a mark.
>
> **3. Rewrite**
> Everything else goes to a model that does not watermark its own output,
> because rewriting Claude's text with Claude would stamp a fresh mark straight
> back in. The rebuild works to a three-word limit on what carries over.
>
> **4. Restore and check**
> The frozen words go back, and the result is checked against what you sent:
> protected spans character for character, every number, date and name still
> yours, and the length close to your original, because condensing is how
> rewrites lose facts. A piece that fails twice comes back exactly as you sent
> it, rather than corrupted.

**Beat 2's caption on the strip:** `Piece 1 · about 350 words`, ×3.
**Beat 3's:** the placeholders render as `[[17]]` and `[[24]]`, which is the
real mask format from `uc_freeze.py`.
**Beat 4's:** *"Rewritten by a model that does not watermark its own output. The
placeholders are all it can see of the protected text."*
**Beat 5's:** `Quotes exact · Figures held · Length held`.
**The strip's own label:** *"Your document, from paste to receipt"*.

**Every claim here is sourced, and I checked each one against the code rather
than against another document:**

| Claim | Source |
|---|---|
| pieces of about 350 words | `ENGINE.md` §4, measured across 28 rewrites at three sizes |
| rewritten at the same time | `uc_chunk.py`, chunks rewritten concurrently |
| ten thousand at once drifts | `ENGINE.md` §4: a 3,367 word document came back as 348 words |
| placeholders before anything is sent | `uc_freeze.py`: headings, attributed quotations, block quotes, reference entries, masked as `[[17]]` |
| the model never sees those words | `uc_chunk.py:650` comment: *"THE MODEL SEES THE MASKED CHUNK"* |
| a model that does not watermark | `ENGINE.md` §5, the vendor table |
| three-word limit | `ENGINE.md` §3 rule 3, **subject to rules 1 and 2** |
| length close, condensing loses facts | `ENGINE.md` §3 rule 2 |
| fails twice, comes back as sent | `uc_chunk.py:699`: *"the fallback to the chunk's ORIGINAL text"* |

## 3.4 Beat 6, where the honesty lands

> ### What we can measure, and what nobody can yet
>
> Your document cannot be tested for the watermark itself. Anthropic's detector
> is coming rather than callable, and nobody outside the labs can check a text
> for the mark today.
>
> What can be measured is how much of your original word order survived, and
> that is the number that matters, because the signature cannot be read at all
> without unbroken runs to read it from. **So every run hands you your own
> figures:** the share of your wording replaced, the longest run of it still
> standing, every figure accounted for, and how much of your length was kept.
> **Across our test set it breaks over 90% of three-word sequences with zero
> figures lost.**

**It is last on purpose and that is Jon's ruling.** His Reddit post opens with
*"we can only positively claim we remove two of them"*; that framing does not
come to the site. The honesty is not softened, it is placed.

**★ The last sentence is the reinstated claim and it is byte for byte the
sentence that was in "Facts held, character for character".** I did not
reword it, I did not rescope it, and I did not drop "across our test set". It
moved because the card it lived in dissolved. `04` entry 151. Section 7.

---

# 4. THE THREE PANELS, EVERY CHANGED SENTENCE

## 4.1 Panel 3, the one the brief called structurally unlike its siblings

**BEFORE** (two paragraphs, 130 words, plus a 442px band underneath)

> This is the mark Claude, and others, apply to text itself: the one in the
> news, and the one nobody can point at, because nothing is inserted at any
> point. Here is the trick. As a model writes, it constantly reaches words where
> several options would read equally well: the sky was grey, overcast, gloomy. A
> normal model just picks one. A watermarking model hands that pick to a secret
> key, every time. Each choice reads naturally on its own, but across a few
> hundred words the picks line up into a hidden pattern, and whoever holds the
> key can test any text for it.
>
> That pattern lives only in unbroken stretches of the original words, which is
> why you cannot beat it by swapping synonyms or asking a chatbot to reword: a
> casual rewrite leaves long stretches of the original untouched, and every one
> of them still carries the signature. Beating it takes an engine built for this
> one job, one that dismantles the word sequences the mark rides on. That is
> what we built, and its rules are below.

**AFTER** (two paragraphs, 108 words, no band)

> This is the mark Claude, and others, apply to text itself: the one in the
> news, and the one nobody can point at, because nothing is inserted at any
> point. As a model writes it reaches words where several options read equally
> well, and a watermarking model hands that pick to a secret key. Across a few
> hundred words those picks line up into a pattern, and whoever holds the key
> can test any text for it.
>
> The pattern lives only in unbroken runs of the original words, so a casual
> reword leaves it standing. Taking it off means rebuilding the wording, and
> that is what the section below does.

**"stretches" became "runs" in both places**, which is the grammar the rest of
the site uses. **"sequences" became "runs" in the checklist** for the same
reason. **The closing pointer changed from "its rules are below" to "the
section below does"**, because the rules are not below any more; a sequence is.

**And the Anthropic quote lost one clause.** *"The engine below was built for
it"* came off, because the engine is no longer below it, and the paragraph
above already hands the reader onward. The quote itself and its link are
untouched.

## 4.2 Panel 1, cut so it does not need a plus on a phone

**BEFORE / AFTER**, and only two clauses moved:

> ...They hold real positions in your text, ~~and they travel~~ **and travel**
> with it through every copy and paste.
> ...anyone who knows to look can check ~~for them~~ in seconds.

## 4.3 Panel 2, same

> When an AI tool generates a file~~,~~ it writes a record into that wrapper
> naming itself.
> ...read the file back to confirm nothing is left. ~~Your picture or document
> comes out byte for byte identical, and on~~ **On** a file Claude made, this is
> Claude's mark coming off, with proof.

**"byte for byte identical" was not lost.** It is the second line of that
panel's own checklist, four lines below, and it was saying the same thing
twice: *"The picture or document returned byte for byte identical"*.

## 4.4 ★ WHERE THE FOUR ENGINE RULES WENT, ITEM BY ITEM

**This is the table to check if you want to know whether anything was dropped.
Nothing was.**

| The old card | Where it is now |
|---|---|
| **Break the runs** — *"The signature travels only in unbroken runs of your original wording..."* | The section standfirst, §3.1, and beat 1 |
| ...*"working to a three-word limit"* | Beat 3, §3.3, with the wording intact |
| ...*"protects your quotations and references rather than rewording them"* | Beat 2, at much greater length, §3.3 |
| **Never rewritten by Claude** — *"Rewriting Claude's text with Claude would stamp the mark straight back in"* | Beat 3, almost verbatim |
| **Facts held** — *"Every number, date and name is checked against your original, and the section retries if one drifts"* | Beat 4 |
| ...*"Across our test set it breaks over 90%..."* | **Beat 6, byte for byte.** §3.4 and §7 |
| **Length held** — *"because condensing is how rewrites actually lose facts"* | Beat 4 |
| The band's *"Every run returns a receipt: the share of your wording replaced..."* | Beat 6 |
| The band's *"Why can't another AI do this?"* paragraph | Panel 3's second paragraph already carries the argument, and the homepage FAQ carries it in full |

## 4.5 The proof row, trimmed rather than rewritten

**BEFORE**

> Measured on every run. Everything a rewrite can do to defeat this mark, the
> engine does: it dismantles the word sequences the mark rides on, holds every
> fact and your length, and hands you the numbers. The one word we hold back is
> verified, because nobody can check a text watermark until Anthropic opens its
> public detector. The day it opens, we run every job against it.

**AFTER**

> Measured on every run, and the section above is what the engine does to earn
> that. The one word we hold back is verified, because nobody can check a text
> watermark until Anthropic opens its public detector. The day it opens, we run
> every job against it.

**The last two sentences are untouched.** What came out was a summary of the
rewrite standing 400px below the section that now explains it properly.

## 4.6 The mobile plus is gone, and it is the copy that changed

**The brief:** *"Whatever replaces it must not need that trick. If the new
structure still needs a disclosure to be bearable on a phone, the structure is
wrong."*

**So `MobileDisclosure` is no longer used on this page and every word of the
panels is now visible on a phone with nothing to press.** Verified at 375px:

```
document.body.innerText.includes('How this one works')  ->  false
```

**`mobile-disclosure.tsx` itself stays.** `/capabilities` and `/pricing` still
import it, and deleting a component two other pages use was not this brief.

---

# 5. THE GEOMETRY, MEASURED AT BOTH WIDTHS

**Read out of the live DOM on the dev server. Same instrument before and
after.**

## 5.1 Desktop, 1280px

```
                          BEFORE     AFTER
panel 1  Hidden chars       520px     520px
panel 2  Metadata           567px     543px
panel 3  Statistical      1,189px     610px
section  How the rewrite       -    1,334px
document                  4,140px   4,828px
sideways scroll              none      none
```

**Panel 3 was 2.3 times panel 1 and is now 1.17 times it.** That is the
symmetry the brief asked for, and it is the number I would point at first.

**Where the new section's 1,334px goes:**

```
header (h2 and standfirst)        ~110px
entropy card                       322px
pipeline card                      567px
beat 6 block                       192px
gaps and section padding          ~143px
```

**The pipeline card's height is set by its four beats, not by the drawing.**
Measured: the beat list needs 567px and the drawing beside it needs about
330px. **The first draft stacked the beats in one column and the card was
715px**; two by two with a numbered badge is 567px for the same words, and the
numbers keep the sequence legible. **A single column at full card width is
worse, not better: 676px.** I tried it.

**And the first draft of the whole section was 1,983px**, because I put it in
the same 4/8 shell the two reading sections use, so every card inherited a
725px column and none of their `lg:grid-cols-2` layouts engaged. Full width
fixed that.

## 5.2 Phone, 375px

```
                          BEFORE     AFTER
panel 1                     669px     872px   (+203, the prose is no longer hidden)
panel 2                     692px     941px   (+249, same)
panel 3                   1,705px   1,061px   (-644, the band is gone)
section  How the rewrite       -    2,808px
document                  5,553px   8,103px
in phone screens              6.8      10.0
sideways scroll              none      none
elements crossing the edge       0         0
"+" disclosures                  3         0
```

**The three panels together are 192px SHORTER on a phone than they were, with
every word visible and nothing behind a control.** That part worked. The
increase is entirely the new section.

---

# 6. THE MOTION, FRAME BY FRAME, FROM THE REAL DOM

**★ I could not watch this, for the reason in the headline.** What follows is
the real DOM sampled on a timer while the real animation ran, which proves the
state machine and does not prove that it looks good.

**One thing I had to do to observe it at all, stated so nobody thinks the
component does this:** a hidden browser tab never fires
`requestAnimationFrame`, and `play()` uses one. So the probe replaced
`window.requestAnimationFrame` with a timer before pressing Replay. **The
component is untouched; the patch lives only in the probe.** Timings below are
also stretched by the browser's background-tab throttling, which clamps timers
to about one per second.

## 6.1 The pipeline, beats 2 to 5

```
STATE                badges     pieces   placeholders    chips rewritten  chips restored  caption
settled (as served)  ON,ON,ON,ON split    -               25               2              checks
step 0  (rewind)     off,off,off,off whole -               0                0              none
step 1  (split)      ON,off,off,off  split -               0                0              none
step 2  (freeze)     ON,ON,off,off   split [[17]] [[24]]   0                0              none
step 3  (rewrite)    ON,ON,ON,off    split [[17]] [[24]]   25               0              "Rewritten by a model..."
step 4  (restore)    ON,ON,ON,ON     split -               25               2              Quotes exact / Figures held / Length held
+6.3s onward         ON,ON,ON,ON     split -               25               2              checks      <- STOPPED
```

**Every beat's badge lights in turn, the placeholders appear and go, the chips
change width when the rewrite happens, the two protected chips come back solid,
and it stops.** A chip's measured width goes 98px → 68px on rewind → 98px when
rewritten, so the widths really do transition.

## 6.2 The entropy prose, beat 0

**The paragraph, sampled straight out of the DOM while it ran:**

```
SERVED   The Treaty of Versailles transformed the map of Europe. Trade expanded
         across the new borders, old rivalries pursued fresh ones, and the pace
         of change quickened.
+0.5s    The Treaty of Versailles changed   ... Trade expanded ... rivalries followed ... change sped up.
+1.0s    The Treaty of Versailles reshaped  ... Trade grew     ... rivalries pursued  ... change raced.
+2.5s    The Treaty of Versailles transformed ... expanded ... pursued ... quickened.   <- SETTLED
+7.0s    (unchanged)                                                                    <- STOPPED
```

**"The Treaty of Versailles" is identical in every frame.** That is the beat's
whole argument, and it is visible in the data rather than only asserted.

## 6.3 What happens under `prefers-reduced-motion`

**Nothing starts.** The effect returns before it registers the observer:

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

**So the visitor keeps the state the component renders from its constant, which
is the SETTLED FINAL state** — the finished sentence, the split pieces, the
protected chips restored, the three checks showing. **Never a blank frame and
never a half-built one**, which is what the brief required.

**The Replay button still works for them**, and `styles/globals.css` already
collapses every transition on the site to 0.001ms under that setting, so they
get four discrete states rather than four tweened ones. That is a deliberate
choice: a control the visitor pressed should do something.

## 6.4 The animation, photographed in a real browser

**The mid-sequence frame is the one worth having.** Caught at the freeze step,
in the user's Chrome at 1296px: **beats 1 and 2 lit rust and beats 3 and 4
still grey, every chip still grey because nothing has been rewritten yet, and
the two protected chips outlined in rust reading `[[17]]` and `[[24]]`.** That
is step 2 of the state table above, seen rather than sampled.

**The settled frame** shows all four badges lit, three labelled pieces, the
rewritten chips in rust, the two protected chips solid dark, and
`Quotes exact · Figures held · Length held`.

## 6.5 Autoplay on entry: WIRED, NOT PROVEN, AND THE REASON IS MEASURED

**Section 9 item 2.**

---

# 7. ★ THE THREE RULED CLAIMS, AND WHAT HAPPENED TO EACH

**All three survived. This is the section to check.**

**1. "Across our test set it breaks over 90% of three-word sequences with zero
figures lost."** **Present, byte for byte, in beat 6.** It moved out of "Facts
held, character for character" when that card dissolved, and the brief named
beat 5 or the proof section as its home. **I put it in beat 6, which is the
measurement beat**, because a measured claim belongs beside the sentence
explaining what we measure and why. **"Across our test set" is intact.**

**One thing I deliberately did not do.** The rest of this page now says "runs"
where it used to say "sequences", and this sentence still says "three-word
sequences". **I left the word alone.** It is inside a claim Jon reinstated on
25 August after being shown the measurements against it, and editing a word
inside a reaffirmed claim is not a formatting decision. **If he wants it to
read "three-word runs" for consistency, that is one word and it is his.**

**2. "Working to a three-word limit."** **Present in beat 3, unchanged**, with
the docblock above it repeating why it must not become a promise again.

**3. Do not lead with the limitation.** **Obeyed.** The section opens with what
the mark is and where it can live. The first sentence anywhere in it saying
what cannot be done is beat 6, at the bottom, 1,100px below the section
heading, followed by "Where proof stands". Nothing about the limitation was
softened; it was placed.

---

# 8. ★ THE INDEXING CONSTRAINT, AND THE PROOF IT HELD

**The brief:** *"In August, ONE `Date.now()` called during render destroyed
this site's Google indexing... Any animation you add is exactly that shape of
risk."*

**What I did about it.** Both animated components are `'use client'`, which is
fine, because a client component is still server-rendered into the static HTML.
What is not fine is reading anything Next cannot know ahead of time. **There is
no clock, no random number, no search param and no cookie anywhere in
`rewrite-sequence.tsx`.** Every piece of state starts at a constant, and that
constant is the settled final state, so the server and the browser's first
render agree exactly.

**Both are also behind their own `<Suspense>` boundaries**, as the brief
required. A boundary around something that never suspends still prerenders its
children, so it costs nothing and it caps the blast radius if a later session
puts something unstable inside one.

**The proof, from a real `pnpm build`:**

```
$ pnpm build          -> exit 0
Route (app)               Revalidate  Expire
├ ○ /how-it-works                 1d      1w        <- still a static prerender

$ node prerender-check.mjs apps/web/.next/server/app/how-it-works.html
words     1456        (baseline 1247)
<h1>      1 found
          "Where an AI watermark actually hides."
<h2>      7 found
          "Three marks, three places."
          "Hidden characters"
          "Metadata"
          "The statistical watermark"
          "How the rewrite works."      <- the new section, in the static HTML
          "Where proof stands."
          "See what your own text is carrying."
```

**1,456 words against a 1,247 baseline, up 209, with the `<h1>` intact and the
route still `○`.** Nothing collapsed.

**And the words INSIDE the animated components are in the file a crawler
reads.** Grepped out of the built HTML:

```
A watermark needs a choice to hide in                      2
The Treaty of Versailles                                   1
quickened                                                  1
Restore and check                                          1
about 350 words                                            1
Quotes exact                                               1
Length held                                                1
Rewritten by a model that does not watermark               1
three-word limit                                           1
Across our test set it breaks over 90                      2
Replay                                                     1
```

**Every one of them is there.** The settled state being the constant is what
buys that: a crawler reads the finished sentence and the finished labels rather
than an opening frame.

`tsc --noEmit`:

```
$ npx tsc --noEmit
tsc exit: 0
```

**Console on the finished page: no errors.** Only the pre-existing Cloudflare
Turnstile warnings, which are there on every page of this site in local
development and are unrelated.

---

# 9. WHAT I COULD NOT PROVE

**1. ★ THE PHONE SCREENSHOT IS AT 500px, NOT 375px.** Chrome would not accept a
window narrower than 500 CSS pixels, and every attempt to resize it snapped
back to full width within a second or two. **500px is still below the `sm`
breakpoint, so it renders the phone layout** — one column, stacked cards, no
disclosure — and that is what the picture shows. **The 375px numbers in section
5.2 are DOM measurements from the emulated pane, not from a photograph.**

**2. ★ AUTOPLAY ON ENTRY IS WIRED AND NOBODY HAS WATCHED IT FIRE.** Pressing
Replay calls the identical `play()` the observer calls, and that was proved
both by DOM sampling and by photograph, **so the gap is exactly one function
call wide.** It is still a gap.

**The reason is the environment and I isolated it rather than assuming it.** In
the connected Chrome, with the stage sitting at `top: 95px` in a 757px
viewport, so unambiguously on screen:

```
{"visibility":"hidden","hasFocus":false,
 "stageRect":{"top":95,"h":567,"inView":true},"innerHeight":757,
 "aFreshObserverFired":null}
```

**`aFreshObserverFired: null` is a brand new `IntersectionObserver` I created
in the console, watching that element, which fired nothing in two seconds.**
Not my component: any observer. That window is not frontmost, so the document
reports itself hidden and the browser stops delivering intersection callbacks.
**This proves the failure is the environment. It does not prove the component
works, and I am not going to pretend those are the same sentence.**

**How to close it in ten seconds:** bring the browser window to the front, open
`/how-it-works`, and scroll down to "How the rewrite works". Either the four
numbered badges light 1, 2, 3, 4 in turn or they do not.

**3. Whether the new section LOOKS like one continuing story.** The brief asked
for one visual language across beats 2 to 5 so it does not read as one borrowed
animation followed by four static diagrams. **I built it as literally one
animation covering all four beats, which is the strongest form of that**, and
the two stages share type, colour and chip language. **Whether a human reads
them as one thing is an eye judgement and I have no eyes on it.**

**4. Whether the phone page at ten screens is bearable.** It is 46% longer than
before and the brief's whole mobile section is about a page that "ran to eight
phone screens". **I have measured that nothing overflows, nothing scrolls
sideways and nothing hides behind a plus. I have not established that ten
screens is acceptable**, and I do not think measurement can establish it.
Section 10 item 1 has the cut I would make.

**5. Whether dropping the secret-key drawing costs anything.** I replaced panel
3's diagram, and my argument for it is in section 11. **The old drawing was
Jon's own spec from 20 August and he liked it.** My case is that beat 0 now
teaches the same idea better and in motion, and the brief itself flagged the
duplicate. **It is still me overwriting his drawing, and he should look at the
replacement.**

**6. Whether a statistical watermark is removed.** Not measurable, by anybody,
and nothing on this page claims otherwise. Beat 6 says so in the visitor's own
words.

---

# 10. HANDED BACK

**1. ★ THE PAGE IS TALLER AND THAT IS JON'S CALL, NOT MINE.** +17% desktop,
+46% phone. **The cut I would make if he wants the number down: fold beat 6
into "Where proof stands", which says a version of the same thing 400px below
it.** Worth about 200px desktop and 350px phone. It costs the sequence its
ending, which is why I did not do it unasked.

**2. "Three-word sequences" in the reinstated claim.** Everything else on this
page now says "runs". Changing one word inside a claim he reaffirmed is his.
§7.

**3. `statistical-watermark.tsx` is a new drawing over his old one.** §11 is
the argument. If he prefers the secret-key tree, the old version is in git at
`1ae6f2e` and putting it back is one file.

**4. The "why this matters" tab the brief mentions is still coming**, and
scenes 1 and 3 of the motion canvas belong to it. I used only scene 2, as
instructed, and did not touch the other two.

**5. `/capabilities` and `/pricing` still use the mobile plus.** The brief
ruled it out for this page only, and the same argument may apply to them.
Somebody should look. Not this brief.

---

# 11. THE TWO JUDGEMENT CALLS I MADE, AND WHY

## 11.1 Panel 3's diagram: replaced, not simplified and not dropped

**The brief's words:** *"Panel 3's existing diagram now duplicates beat 0.
Recommendation: simplify or drop it so the same idea is not made twice on one
page. Say what you decided."*

**I did neither. I replaced it, and here is the reasoning.**

**Dropping it breaks the symmetry that part (a) of the brief exists to
create.** Panels 1 and 2 each have a drawing. A third panel with an empty right
column is not a symmetric panel.

**Simplifying it does not fix the duplicate, because the duplicate is the
example itself.** The old drawing is "The sky was ___" with a secret key
picking between grey, overcast and gloomy. **Beat 0's copy is now "After 'the
sky was', grey, overcast and gloomy all fit."** Trimming the drawing's bottom
strip would have left the same sentence illustrated twice, 900px apart.

**So the drawing now makes panel 3's own point, which nothing else on the page
makes:** the same sentence, written by a plain model and by a watermarking one,
aligned word column against word column, identical except at two positions.

```
No watermark    the results were striking and the effect held
Watermarked     the results were notable  and the effect lasted
                Nothing added. Nothing removed. Two picks changed.
```

**That is panel 3's lede made visible** — *"Nothing is added to your text. The
mark is the words themselves"* — and it is accurate to `ENGINE.md` §2: the
candidates are sampled from the model's true distribution, so a watermarked
sentence is one the model could have written anyway.

**The caption under it changed to match:** *"A watermarked sentence is one the
model could have written anyway. There is nothing extra in it to find, and
nothing to point at."*

**What was lost, said plainly: the secret key is no longer drawn anywhere.** It
is still in panel 3's prose, one sentence above the drawing. §9 item 5.

## 11.2 Two stages rather than six

**The brief:** *"Same visual language for beats 2 to 5 so the section reads as
one continuing story rather than one borrowed animation followed by four static
diagrams."*

**Beats 2 to 5 are one animation, not four.** The same document strip is on
screen the whole way through and it is cut, masked, rebuilt and restored in
front of the reader. That is the strongest available reading of "one continuing
story", and it is also the cheapest in height.

**Beat 1 is a sentence, not a picture**, per *"if a beat is clearer as a
sentence, make it a sentence"*. It is a conclusion drawn from beat 0 and there
is nothing to draw.

**Beat 6 is a sentence for a harder reason: there is nothing honest to
animate.** A drawing of measurement here would be a drawing of a receipt we
cannot show, on a page where the receipt is described rather than displayed.

---

# 12. WHERE THE NEXT SESSION PICKS UP

**Nothing is blocking. Nothing was pushed and nothing was deployed.**

**The one thing left is ten seconds of somebody's attention:** bring a browser
window to the front, open `/how-it-works`, scroll to "How the rewrite works",
and watch whether the four numbered badges light in turn on their own. That is
the only claim in this note that rests on reading rather than on running. §9
item 2.
