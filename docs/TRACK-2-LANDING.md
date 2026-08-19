# Track 2: The landing page

**The page exists and works. Jon's verdict is that it is a strong start and not
close to done.**

---

## Read these, in this order, before anything

| # | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` | The rules. **Jon cannot review code. Show him the real thing running** |
| 2 | `docs/TRACK-RULES.md` | **File ownership. Four sessions are running in parallel** |
| 3 | This file | |
| 4 | **`apps/web/engine/ENGINE.md` section 2** | **What each layer does and what it must never claim. You cannot write a word of copy without it** |
| 5 | `docs/04-decision-log.md` entries **33, 34, 36, 37, 41, 46, 47, 50, 51, 52** | Design direction, the marquee, what may be claimed, product-first naming, and why no figure on the site is invented |
| 6 | `docs/06-...` rows **59**, then 30, 31, 33, 36 | The open list in Jon's own words |
| 7 | `docs/05-working-agreement.md` section 2 | **No em dashes or en dashes anywhere a visitor reads** |
| 8 | `apps/web/AGENTS.md` | **Before writing Next.js code** |

---

## What exists

Hero with a live working tool, a stat strip, a live counter of AI words written,
expandable fact cards, the publication marquee on real artwork from nine outlets,
three how-it-works panels with drawn diagrams, a vendor coverage table, a limits
section. Plus `/how-it-works`, `/capabilities`, and `/mission` as a styled shell.

---

## What this session has to achieve

**`06` row 59 is the list, in Jon's words:**

1. **The findings panel is still not readable in five seconds.** His central
   complaint and the least resolved.
2. **The key diagram animates but is not more digestible.** He said the direction
   is right and the execution is not there.
3. **A readership figure for the marquee.** Directionally correct and **sourced**.
   It has deliberately not been invented, twice. Do not invent it now.
4. **The marquee caption is Jon's.** He rejected an amendment and will write it.
   His draft idea: "AI tools now mark what they make. Invisibly, and without
   telling you," continuing to something like "unethically, illegally and
   immorally", linking to the mission page.
5. **A logo beside the un-claude wordmark.** Jon is making it.
6. **Social links in the footer.** Left out because a link to nothing is worse than
   no link. Needs handles.
7. **A pricing page in the nav.** Blocked on Track 1.
8. **Stable Diffusion shows Stability AI's mark.** Flagged, unresolved.
9. **Mission page content.** Jon writes it. The page is built and waiting.

---

## The rules that govern every word you write

**Every figure on this site is real.** Jon suggested inventing some and the
assistant declined; `04` entry 47. A fabricated "files cleaned" counter was
specifically asked for and specifically refused, `06` review notes. **Anthropic has
a detector in development, which is the day every invented number in this category
becomes checkable.**

**Layer A removes watermarks. It does NOT remove Claude's text watermark.**
`04` entry 37. Anthropic adds no hidden characters.

**Marketing may be enticing and deliberately ambiguous. It stops short of
explicitly false. Final wording authority is Jon's, on every sentence.**

**Do not claim anything about PDFs.** Not accepted in version one.

**Publication and vendor logos are citation, not endorsement.** A logo goes in only
if it links to a real article from that outlet about the watermark.

---

## What you must not do

**Do not edit `_components/workbench/**`.** It looks like landing page work and it
is not: it holds the credit gate, the paywall trigger and every engine call.
**Track 3 owns it.** If a visual change needs it, ask Jon.

**Do not edit the legal pages.** Track 1 owns them, because payments change them.

---

## How to verify, because the preview pane lies

**Reproduce in a NEW browser tab before diagnosing any front end bug.** The pane
reaches a state where it renders server HTML and never hydrates: clicks do nothing
and screenshots come back blank while the DOM reports everything present. **About
forty minutes went into an application bug that did not exist.** `07-runbook.md`.

**Read state from the DOM, not from a picture:**

```js
document.querySelector('[data-phase]').dataset.phase
```
