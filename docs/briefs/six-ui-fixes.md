# BRIEF — six interface fixes Jon asked for

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session. Six independent fixes. Every one is something Jon looked at and did
not like, so the proof is a screenshot, not a class name.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Section 8 is the one that decides this job:** step
back and re-read every change as the actual visitor — a college student on a
phone who knows nothing yet. **Layouts must be rendered and looked at, desktop
and phone width, before being called done.**

**The `unclaude-messaging` skill fires automatically** and governs any word a
visitor reads. **Fix 5 deletes copy on Jon's explicit instruction, which is the
higher authority (`CLAUDE.md` section 2).**

**The verification standard:** an assertion carries no weight. **Screenshots at
1280 and 375, before and after, for every one of the six.**

---

## 1. ★★ SCHEDULING — READ BEFORE YOU START

**`docs/briefs/preflight-and-two-claims.md` covers the same territory —
`apps/web/app/(marketing)/**`, including `workbench.tsx`. THE TWO MUST NOT RUN
AT THE SAME TIME.**

**If a pre-flight session is live, stop and tell Jon.** One lane per territory;
every collision this project has had came from ignoring it.

---

## 2. YOUR TERRITORY

**Yours:** `apps/web/app/(marketing)/**` · `apps/web/styles/theme.css` (only if
a fix genuinely needs a keyframe) ·
`docs/session-notes/six-ui-fixes.md` (create it).

**NOT yours:** **`apps/web/engine/**` and `engine/**` — an engine session may be
live** · `apps/web/lib/engine/receipt.ts` (**ruled off-limits by Jon**) ·
`apps/web/lib/server/**` · `apps/web/app/api/**` · `supabase/**` ·
`vercel.json` · **`docs/IMPLEMENTATION-BOARD.md`, conductor only.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three calls: add, check, commit.
  **The conductor broke this rule by chaining them with `&&`** and committed
  another session's work. A marketing session has uncommitted edits in
  `docs/04-decision-log.md`.
- **Do not push or deploy.** Committing locally is yours.
- **No new dependencies.**
- **Commit the six separately.** Jon may want one reverted without losing five.

---

## 3. FIX 1 — the free-credit pill has no box

**File:** `apps/web/app/(marketing)/_components/workbench/credit-offer.tsx`

**What Jon sees:** signed out, free credits spent. The offer reads
*"Sign up to receive ⬤3 more free credits"*, and **the pill around "3 more" is
vertically off balance** against the text beside it.

**What he wants:** **remove the box and its outline entirely.** Keep the credit
coin symbol and the words. No pill, no background, no ring.

The wrapper today is:

```
'bg-mark/[0.14] ring-mark/40 relative inline-flex items-center gap-2
 overflow-hidden rounded-full py-1.5 pr-4 pl-2.5 ring-1'
```

**Take out the background, the ring and the pill padding.** The coin
(`CreditCoin`) and the number stay.

**Two things to decide and state, rather than delete blindly:**
- **The `animate-sheen` sweep** inside the pill exists because Jon asked for the
  number to "pop out and call your attention" (the reasoning is in the file's
  own header). **With no pill to sweep across, does it still read as anything?**
  Judge it on screen and say what you decided and why.
- **The vertical balance was the actual complaint.** Removing the box may fix it
  or may expose it. **Get the coin, the number and the words sitting on one
  optical baseline** and show it at both widths.

**Web and mobile.**

---

## 4. FIX 2 — the words-cleaned counter is pushed out of frame

**File:** `apps/web/app/(marketing)/_components/hero-section.tsx`

**What Jon sees, on desktop:** he scans, the receipt opens below the tool, **and
"WORDS CLEANED WITH UN-CLAUDE" is pushed down out of view.** He wants it to stay
where it is always visible, even once results are showing.

**The layout facts, so you do not hunt:**

```
container    'flex flex-col gap-7 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 lg:gap-y-7'
headline     'order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1'
counter      'order-3 hidden lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:block'
workbench    'order-2 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1'
```

**The workbench spans both rows. When it grows, the rows grow with it.**

**★ OBSERVE IT BEFORE YOU CHANGE IT.** Run the site, scan something, and
**measure where the counter actually goes** — that is the diagnosis, not the
class list above. **I am giving you the facts, not the cause.**

**The constraint that makes this delicate:** `LiveCounter` is wrapped in a
`<Suspense>` boundary, and **that boundary is the only reason this page is in
Google's index at all.** One `Date.now()` during render previously abandoned the
entire homepage's HTML, taking the `<h1>` with it — 75 crawlable words instead
of 1,234. **The reasoning is written at the boundary in `hero-section.tsx`. Read
it. Do not remove or move that boundary without proving the page still
prerenders.**

**Prove it after your change:** build for production and count the words and the
`<h1>` in `apps/web/.next/server/app/index.html`. **1,234 words and one `<h1>`
is the number to hold.** If it drops, you have broken the SEO fix.

---

## 5. FIX 3 — nothing tells anyone the receipt is there

**File:** `apps/web/app/(marketing)/_components/workbench/workbench.tsx`

**What Jon sees:** he scans, the findings appear **below the fold on desktop**,
and **nothing on screen suggests there is anything to scroll to.** A first-time
visitor gets a result and never sees the receipt that justifies it.

**Confirmed: no such cue exists anywhere in the workbench today.**

**What he wants:** something that directs the eye down — his words, *"a dynamic
arrow pointing downwards you click or something so people actually see
receipts."* **He thinks mobile needs it too.**

**Design it properly rather than bolting on an arrow:**
- **It must only appear when there is something below to see AND it is out of
  view.** A cue that is always there is furniture and gets ignored. A cue
  pointing at something already on screen is noise. **This project has nearly
  shipped a guard that fires on good work twice; the same rule applies here.**
- **Clicking it should take the visitor to the findings**, not just decorate.
- **It must disappear once they have got there.**
- **Respect `prefers-reduced-motion`** if you animate it.
- **It must be reachable by keyboard and announce itself sensibly** if it is a
  control.

**Judge it on screen at both widths and say whether mobile actually needed it**
— Jon said "I think", not "it does". **If mobile already shows the findings
without scrolling, say so and leave it alone.**

---

## 6. FIX 4 — the placeholder should not sit under the swoosh

**File:** `apps/web/app/(marketing)/_components/workbench/workbench.tsx`

**What Jon sees on page load:** the orange swoosh sweeps across the paste box,
and **the placeholder text "Paste your text here, or drop a file anywhere in
this box." is visible underneath it** while it passes.

**What he wants:** **the placeholder absent while the swoosh is over the box,
appearing the moment the swoosh leaves.** He is explicit that **"Sanitises
Claude, ChatGPT, Gemini, Grok and every other model" stays underneath the swoosh
exactly as it is now. Do not touch that line.**

**The machinery already exists:**

```
workbench.tsx:126    const [swooshDone, setSwooshDone] = useState(false);
workbench.tsx:1315   {!swooshDone ? ( ... the swoosh ... )}
workbench.tsx:1363   placeholder={'Paste your text here, or drop a file anywhere in this box.'}
workbench.tsx:1526   'Sanitises Claude, ChatGPT, Gemini, Grok and every other model'   <- LEAVE
theme.css:145        --animate-swoosh: swoosh 2.4s ...
```

**Two things you must not break:**
- **A visitor who types immediately must not be interrupted.** If they focus or
  type before the swoosh finishes, the box must behave normally.
- **`prefers-reduced-motion`.** If the swoosh does not play, the placeholder
  must be there from the first paint, not missing forever.

**Web and mobile.**

---

## 7. FIX 5 — the FAQ heading is just "FAQ"

**File:** `apps/web/app/(marketing)/_components/faq-section.tsx:63`

**Remove:**

> **Straight answers to the hard questions.**
> Including the ones most tools in this category hope you will not ask.

**Label the section FAQ.** Jon's instruction, and it overrides the messaging
skill's preference for a fuller heading.

**Check what the removal leaves behind:** a section heading carries type sizing,
spacing and an anchor. **Removing two lines from a heading block can leave a gap
or an orphaned eyebrow.** Render it and look. **And check nothing else on the
site links to or references that heading text.**

---

## 8. FIX 6 — the coverage-table legend on mobile

**File:** `apps/web/app/(marketing)/_components/coverage-section.tsx:332`

**What Jon sees at 375px:** the four legend entries under the vendor table —
*Marking today · Committed, coming · Nothing yet · Does not produce this* —
**wrap into a ragged two-by-two that does not line up.** He wants them
**aligned vertically below the table so it reads cleanly.**

Today:

```
'text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]'
```

**On phones, stack them one per line with their symbols aligned in a column.**
**Desktop is fine as it is — do not change what works.**

**The screenshot Jon sent is the specification.** Match it, then show him the
after at 375px.

---

## 9. HOW TO PROVE ALL SIX

- **Screenshots at 1280 and 375, before and after, for every fix.** Jon judges
  these by eye; measured geometry is not a substitute and this project has
  already had one session hand back numbers instead of pictures.
- **Fix 2 additionally needs the prerender check** — 1,234 words and one `<h1>`
  in the built `index.html`.
- **The workbench must still work.** Paste text, scan, confirm. **Say how you
  confirmed it.** If you cannot reach an engine, say so plainly rather than
  assuming — `07-runbook.md` has the local engine command, and **check nothing
  else is already running on those ports first.**
- `tsc --noEmit` clean.

## 10. WHAT TO HAND BACK

`docs/session-notes/six-ui-fixes.md`, **written as you go**, one section per
fix: what Jon asked for, what you changed, before and after pictures, and
anything you decided that he did not specify. Then **a section titled "What I
could not prove."**

**If any fix turns out to need a decision from Jon — the sheen in fix 1, whether
mobile needs the cue in fix 3 — do that fix's other half and flag the question.
Do not guess and do not stall the other five.**

Commit the six separately, by explicit path. **Leave nothing uncommitted.** Do
not push.

## 11. MODEL AND EFFORT

**Opus, high reasoning effort.** Five are small; **fix 2 sits on top of the
`<Suspense>` boundary that put this site back in Google's index**, and fix 3 is
a new interface element on a live commercial page.
