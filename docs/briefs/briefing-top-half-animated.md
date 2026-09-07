# BRIEF — the arrival briefing: animate the top half, sharpen the bottom

**Written by the conductor, 6 September 2026. Paste this whole file into a fresh
session.**

**File: `apps/web/app/(marketing)/_components/watermark-briefing.tsx`.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1, 4, 7 and 8 all bite.** The
**`unclaude-messaging` skill** governs every word a visitor reads.

**The verification standard:** run it and show the real output. **Render it and
look at it, desktop and phone**, before calling anything done.

---

## 1. WHAT EXISTS TODAY

The briefing shows to visitors who did not arrive from a search engine. Its copy,
in order:

```
TOP HALF
  Since 2 August 2026
  Claude marks the text it writes.
  A secret key makes the pick between words that read equally well.
    The pattern of picks is the mark.
  A mark does not mean Claude wrote it. It means Claude touched it.
    Ask it to tidy a paragraph you wrote yourself, and the mark goes in
    with the tidy.

BOTTOM HALF
  The detector is close
    Anthropic has committed to releasing a public watermark detector
    imminently. Universities, corporations, and individuals will be able
    to use this.
  Marks don't expire
    What you have already handed in stays marked. The day the detector
    opens, it can be checked.

  Free, takes seconds, and needs no account.
  [ See what your own text is carrying ]
```

**It is `max-w-[560px]` and it already animates** — step state, per-word timing
(`WORD_MS`), and a `prefers-reduced-motion` check are all in the file. **This is
an extension of existing machinery, not a green field. Read it before you
touch it.**

---

## 2. JON'S RULING

**Split it. The top half becomes an animated sequence. The bottom half stays
text and becomes more prominent.**

---

## 3. THE TOP HALF — animated, TEN SECONDS MAXIMUM

**Hard ceiling: 10 seconds.** Jon's number. A briefing that outstays that is a
thing people close.

### Reference: Jon's Claude Design canvas

`https://claude.ai/code/artifact/6119d6be-8f78-43cd-bfec-71c38a94c3ae`
**Open it and watch it.** It is a rendered video, so **you cannot lift code out
of it — rebuild in React.** Its arc, which is the arc to follow:

1. *"Since **August 2nd**, AI models watermark the text they write. **Invisibly.**"*
   over a Claude chat card typing an essay, **with headline cards flying in fast
   from the sides**
2. *"The model is nudged at every pick"* — running prose where individual words
   **cycle between alternatives in place**: *transformed/changed*,
   *expanded/grew*, *pursued/chased*, *quickened/sped up*. **Rust for the word
   that lands, grey for the alternatives passing through**
3. *"Enough picks make a pattern a detector can test."*
4. A scan over the text with signals boxed, badge counting **"14 signals"**, then
   *"The watermark is the words."*
5. *"Your writing already carries it."* + **Remove AI Watermarks Free** +
   *"No account needed."*

**Beat 2 is the one that matters.** It is the idea made visible — you watch the
model having a choice. **Everything else serves it.**

### The beats to build, inside 10 seconds

| | Beat | Roughly |
|---|---|---|
| 1 | **Since 2 August 2026 — Claude marks the text it writes.** Headline cards fly in fast behind or around it | ~3s |
| 2 | **The secret key picks between words that read equally well.** Words cycling in a real paragraph, rust on the landing word | ~4s |
| 3 | **The pattern of picks is the mark** — settle | ~1s |
| 4 | **"A mark does not mean Claude wrote it. It means Claude touched it."** | ~2s, **then HOLDS** |

**★ BEAT 4 MUST SETTLE AND STAY ON SCREEN.** Jon's split puts it in the animated
half, and the conductor's view — flagged to him — is that it is **the most
persuasive sentence in the whole briefing**, because it turns the audience from
*people who cheated* into *anyone who has ever used Claude at all*, which is most
of the visitors. **It is also conceptual rather than visual and therefore the
easiest to lose to motion.** Animate into it if you like; **it must be readable,
still, at the end.** If it cannot be, keep it as plain text under the animation
and say so.

### ★ THE HEADLINE CARDS — do not invent headlines

**`apps/web/app/(marketing)/_components/coverage-marquee.tsx` already holds the
real outlets with real article URLs** — CNN, ABC, Forbes, Fortune, CNET, WSJ,
The Guardian, The Register. **Use those.**

**Fabricated headlines are the single thing this project must never ship.**
`CLAUDE.md` section 4: invented sources are unfindable and unfixable. If you want
headline text rather than mastheads, **take it from the real articles already
linked in that file** and say in your note which you used.

Jon's instruction was *"not the press logos from the home page — the headlines
that pop up in the Claude Design artifact."* **Watch what they actually do
there** and match the motion; source the words from the verified list.

---

## 4. THE BOTTOM HALF — text, and it can be much stronger than the brief Jon gave

Jon asked for *"a detector is coming, Anthropic has committed"*, made bolder and
scarier. **The truth is more alarming than that, and the conductor verified it.**

**The text-watermark Detection API is already in PRIVATE PREVIEW.** It is open
on request to regulators, law enforcement, media, fact-checkers, independent
researchers, **educational organisations**, EU civil society groups, and
enterprises with EU compliance duties. There is a public access request form.
Anthropic says access will widen over time.

**So the honest sentence is not "a detector is coming." It is: detection exists
today, and universities are on the list of who can ask for it.** That is more
frightening, more specific, and checkable — which is why this site writes
carefully in the first place.

**Sources for the writer, both to be linked or cited as the messaging skill
requires:**
`https://www.anthropic.com/news/claude-text-watermark` ·
`https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content`

### ★ THE PRECISION GUARD — two different detectors, never blur them

- **Live today, public: `claude.com/check-content`.** Drag and drop, runs in the
  visitor's browser, **files only** — it reads the embedded C2PA credential.
  Seventeen image, video and audio formats. **No Word document, no PDF, no API,
  and it CANNOT SEE TEXT AT ALL.**
- **Private preview: the text Detection API.** Not public, not callable by you.

**Nothing on this site may imply a rewrite was verified by the live checker. It
cannot see text.** `04` records this trap; do not walk into it.

### What to write

- **"Universities, corporations, and individuals"** gets the emphasis Jon asked
  for — bolder, or the rust mark-highlight the site already uses for *"it's
  marked"*. **Judge it on screen: this is a modal, and a wall of red reads as a
  cookie banner rather than a warning.** One emphasised phrase lands; three
  compete.
- **"Marks don't expire" stays.** Jon: *"that's good."*
- **Both blocks get more visual weight than they have now** — they are the point
  of the briefing and currently sit quieter than the animation will.

---

## 5. THE CTA

**Change to "Remove AI Watermarks Free"**, matching the Claude Design ending,
with **"No account needed."** beneath it. Jon asked for *"Remove AI watermarks"*;
the artifact's own version adds the two words that carry the offer.

**Flag, not a blocker:** this shifts the button from describing a free scan to
promising removal. Still true — the tool does remove layers A and metadata
provably — but it is a larger claim than *"see what your own text is carrying"*
and the messaging skill applies.

**`lib/analytics/events.ts` instruments this briefing.** Changing button text
must not break an event name or Jon loses the funnel he just built. **Check
before you rename anything, and say what you checked.**

---

## 6. MOBILE AND DESKTOP

**Build ONE responsive React sequence, not two videos.** The container is
`max-w-[560px]`, so a real video would need two files kept in sync, would be
heavier on a modal, and would be harder to make honour reduced motion. **React
reflows for free.**

**Render at 375px and 1280px and read the whole thing top to bottom.** If the
animation crowds the bottom half on a phone, the bottom half wins — it carries
the argument.

**`prefers-reduced-motion` must land on the settled final state**, with beat 4
readable and both bottom blocks present. **Never a blank or half-built frame.**

---

## 7. HOW TO PROVE IT

- **Screenshots at 1280 and 375**, before and after, including the settled end
  state.
- **The animation described beat by beat with its timings**, and the total,
  which must be **≤10s**.
- **What happens under `prefers-reduced-motion`**, shown.
- **Which headline sources you used**, named, with their URLs from
  `coverage-marquee.tsx`.
- **Confirmation the analytics events still fire** with the new CTA.
- `tsc --noEmit` clean.

## 8. WHAT TO HAND BACK

`docs/session-notes/briefing-top-half-animated.md`, **written as you go.** Every
changed sentence in full, the screenshots, the timings, and **a section titled
"What I could not prove."**

**Jon will critique the result**, so make the decisions visible: what you chose
for the headline cards, how you handled beat 4, and how heavy you made the
emphasis in the bottom half.

Commit locally by explicit path — **never `git add -A`** — and run
**`git diff --cached` as its own separate step** before each commit. **Do not
push or deploy.** **No new dependencies, including animation libraries.**

## 9. MODEL AND EFFORT

**Opus, high reasoning effort.** It is the first thing many visitors see, the
copy is governed, and the claims about detection have to be exactly right.
