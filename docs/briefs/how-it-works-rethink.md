# BRIEF — /how-it-works, rethought

**Written by the conductor, 6 September 2026. Paste this whole file into a fresh
session.**

**Jon's words: "a UI rethink, a messaging rethink, a visuals rethink, to make it
more digestible and easier to follow in less space."**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1, 4, 7 and 8 all bite on this job.** The
**`unclaude-messaging` skill fires automatically** on copy work and governs
every word a visitor reads.

**Then read `docs/session-notes/tell-the-truth-about-runs.md`.** It is the
record of what this page's claims are allowed to say and why, and it will stop
you re-opening settled ground.

**The verification standard:** an assertion carries no weight. Run it, show the
real output, and **render every changed surface and look at it, desktop and
phone**, before calling anything done.

---

## 1. WHAT IS WRONG, MEASURED

```
Hidden characters        520px    one idea, one diagram
Metadata                 567px    one idea, one diagram
Statistical watermark  1,189px    2.3x the first — and 442px of that is a
                                  full-width band hanging BELOW the columns
```

**The third panel is 524 words and structurally unlike its siblings.** Panels 1
and 2 are one beat each. Panel 3 is a whole engine explainer wearing the same
frame, which is why the page reads as broken.

**The deeper fault is that it is organised thematically where it should be
sequential.** It runs: what the mark is → why casual rewording fails → "what
makes it hard" → an Anthropic quote → a diagram → four named rules → a receipt
line.

**Those four rules are PROPERTIES, not a process.** *Break the runs · Never
rewritten by Claude · Facts held · Length held* is a spec sheet. **It never
tells a reader what happens to their document.**

**And the best idea in the product is missing from the page.** It says several
words "read equally well" but never draws the conclusion — that a span where the
model had no choice cannot carry a mark, which is why freezing quotations costs
nothing. That argument is the reason the whole design makes sense.

---

## 2. THE SHAPE JON HAS RULED

**Split the page in two.**

**(a) The three marks stay as three SYMMETRIC panels** — one idea, one visual,
comparable height. This is the education layer and Jon likes it. **Panel 3 gets
SHORTER, not longer:** it says what the statistical mark is and that it comes
off by rewriting, and it stops there.

**(b) A NEW SECTION, "how the rewrite works", sits underneath**, sequential,
with motion. **Same page, not a separate one** — the nav is already five items
and a "why this matters" tab is coming.

**Why this is the right split:** the rewrite is what most visitors came for, and
cramming it into panel 3 is what broke the layout.

---

## 3. THE NARRATIVE — follow this order, it is the whole point

**Jon's own Reddit post is the model for tone and sequence.** Each beat earns
the next. Do not reorder them and do not turn them back into a list of features.

**Beat 0 — where the mark can live.** When a model writes, some positions leave
it lots of freedom and some leave it none. *"The sky was \_\_\_"* — grey,
overcast, gloomy all fit. *"The Treaty of \_\_\_"* has one answer. A watermark
works by nudging the choice, **so it can only exist where there was a choice.**

**Beat 1 — therefore the job is narrower than it looks.** You do not rewrite
everything. You rewrite the parts where the model had freedom.

**Beat 2 — split.** A 1,000-word paste becomes about three pieces of ~350 words.
Hand a model ten thousand words and it drifts, drops facts and shortens. Small
pieces stay faithful, and they are rewritten at the same time so it is quick.

**Beat 3 — freeze.** Quotations, citations, references and headings are found
and swapped for numbered placeholders **before anything is sent.** When the
original model produced a verbatim quote it was copying fixed text, so it had no
freedom there either — **no freedom, no watermark.** Rewriting them would gain
nothing and risks a misquoted source or an invented page number. **The rewriting
model never sees those words, so it cannot change them.**

**Beat 4 — rewrite.** Everything else goes to a model that does not watermark
its own output. Rewriting Claude's text with Claude would stamp a fresh mark in.

**Beat 5 — restore and check.** The frozen words go back, and the result is
checked against the original: every protected span present character for
character, numbers and dates still the visitor's, length sane. **A failure
retries; a second failure returns the original text for that piece rather than
something quietly corrupted.**

**Beat 6 — how it is measured, and this is where the honesty lands.** We cannot
test for the watermark; nobody outside the labs can yet. What we can measure is
how much of the original word sequence survived, because the signature needs
unbroken runs to be read at all.

---

## 4. THE MOTION

**Jon has a Claude Design canvas of motion mockups** — "Marketing assets for
watermark detection", shared at
`https://claude.ai/code/artifact/6119d6be-8f78-43cd-bfec-71c38a94c3ae`.
**Open it and watch it.** Three scenes:

1. *"Since August 2nd, AI models watermark the text they write. Invisibly."*
   with a Claude chat card live-typing an essay
2. **"The model is nudged at every pick"** — running prose where individual
   words cycle between alternatives in place: *transformed/changed*,
   *expanded/grew*, *pursued/chased*, *quickened/sped up*. Rust for the chosen
   word, grey for the alternatives passing through
3. Detection — the same text with signals boxed and a scan line, badge counting
   **"13 signals"**

**★ SCENE 2 IS BEAT 0.** It is the entropy idea made visible — you watch the
model having a choice. Rebuild it. **Scenes 1 and 3 belong to the "why this
matters" page Jon is planning; do not use them here.**

**These are rendered videos, not code. You cannot lift components out.**
Rebuild the effect in React to match what you see. Same visual language for
beats 2–5 so the section reads as one continuing story rather than one borrowed
animation followed by four static diagrams.

**Playback, ruled by Jon:**
- **Autoplay on entry**, not scroll-scrubbed
- **Plays its sequence once, then settles on the final state and stops.** A
  permanently looping paragraph competes with reading
- **A small replay control** for anyone who wants it again
- **`prefers-reduced-motion` must land on the settled final state**, never on a
  blank or half-built frame

**Visuals earn their place or they do not appear.** Jon: *"visuals to the extent
they are useful for digestibility, not because a panel looks bare."* If a beat
is clearer as a sentence, make it a sentence.

**Panel 3's existing diagram now duplicates beat 0.** Recommendation: simplify
or drop it so the same idea is not made twice on one page. Say what you decided.

---

## 5. ★★ THE CONSTRAINT THAT WILL BITE YOU

**In August, ONE `Date.now()` called during render destroyed this site's Google
indexing.** Under `cacheComponents`, reading the clock abandons prerendering up
to the nearest `<Suspense>` boundary — the homepage had none, so a small
desktop-only counter took the whole page body with it: **75 crawlable words
instead of 1,234, and no `<h1>` at all.** The runbook has it.

**Any animation you add is exactly that shape of risk.**

**The baseline to hold: `/how-it-works` currently prerenders 1,247 words.**
Measure it yourself before you start, and **prove it afterwards** by counting
the words and the `<h1>` in `apps/web/.next/server/app/how-it-works.html` from a
real `pnpm build`. **If that number collapses, you have broken the thing that
put this site back in the index, and no amount of good motion is worth it.**

**Put the animated component behind its own `<Suspense>` boundary** and keep
every word of the surrounding copy in the server-rendered shell.

---

## 6. MOBILE — the current fix is a patch, not a solution

Each panel's prose currently hides behind a **"+"** below `sm`, because the page
ran to eight phone screens. **Whatever replaces it must not need that trick.**
If the new structure still needs a disclosure to be bearable on a phone, the
structure is wrong.

**Render at 375px and read the whole thing top to bottom before you call it
done.** `CLAUDE.md` section 8.

---

## 7. ★ CLAIMS — three things that are RULED and must survive the restructure

**These are Jon's decisions, not open questions. A restructure that quietly
drops them is a failure.**

1. **"Across our test set it breaks over 90% of three-word sequences with zero
   figures lost."** Jon reinstated this on 25 August **after being shown the
   measurements that argue against it**, and reaffirmed. `04` entry 151.
   **The claim MOVES with the restructure, it does not disappear.** It currently
   lives in "Facts held, character for character"; its natural new home is
   beat 5 or the proof section. **The "across our test set" scoping is what
   makes it a measured claim rather than an absolute one and is NOT optional.**
2. **"Working to a three-word limit."** This is the corrected wording that
   replaced a false "hard three-word ceiling". **Do not revert it to a promise.**
   It is the limit the engine works to, subject to holding facts and length.
3. **Do not lead with the limitation.** Jon's ruling. The Reddit post opens with
   *"we can only positively claim we remove two of them"*; **that framing does
   not come to the site.** The honesty stays and lands at the end — beat 6 and
   the existing "Where proof stands" section — not in the doorway.

**The four ENGINE_RULES dissolve into the sequence:** *Break the runs* becomes
the framing, *Never rewritten by Claude* becomes beat 4, *Facts held* and
*Length held* become beat 5. **They stop being a spec sheet and become what
happens.** Nothing in them is lost.

---

## 8. YOUR TERRITORY

**Yours:** `apps/web/app/(marketing)/how-it-works/**` ·
`apps/web/app/(marketing)/_components/diagrams/**` · new components under
`apps/web/app/(marketing)/_components/` · `apps/web/styles/theme.css` if a
keyframe is genuinely needed · `docs/session-notes/how-it-works-rethink.md`.

**NOT yours:** the homepage and its hero · `apps/web/app/(marketing)/_components/workbench/**` ·
`apps/web/engine/**` and `engine/**` · `apps/web/lib/engine/receipt.ts`
(**ruled off-limits by Jon**) · `supabase/**` · `vercel.json` ·
**`docs/IMPLEMENTATION-BOARD.md`, conductor only.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three calls: add, check, commit.
  **The conductor broke this rule by chaining them with `&&`** and committed
  another session's work.
- **Do not push or deploy.** Committing locally is yours.
- **No new dependencies** — and that includes an animation library. Build it
  with CSS and React state.

---

## 9. HOW TO PROVE IT

- **Before and after screenshots at 1280 and 375**, for the three panels and the
  new section. Jon judges by eye; measured geometry is not a substitute.
- **The panel heights**, showing the three are now comparable.
- **The prerender check** — words and `<h1>` in the built `how-it-works.html`,
  against the 1,247 baseline.
- **The motion, described frame by frame**, plus what happens under
  `prefers-reduced-motion`.
- **Total page height before and after.** It is 4,140px today and "less space"
  is Jon's explicit ask.
- `tsc --noEmit` clean.

## 10. WHAT TO HAND BACK

`docs/session-notes/how-it-works-rethink.md`, **written as you go.** Every
changed sentence in full, the screenshots, the prerender numbers, and **a
section titled "What I could not prove."**

**If any beat cannot be written honestly within the claims boundary, stop and
say so** rather than reaching for a claim that is not ours to make.

Commit locally by explicit path. **Leave nothing uncommitted.** Do not push.

## 11. MODEL AND EFFORT

**Opus, high reasoning effort.** It is a live commercial page, the copy is
governed, and the animation is the exact shape of the change that cost this site
its Google indexing once already.
