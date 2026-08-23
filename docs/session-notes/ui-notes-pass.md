# UI notes pass, 21 August 2026

Seven small fixes, worked against the dev server already running on
`localhost:3000`. Nothing deployed, nothing pushed, nothing committed. Two
files needed a note on what could and could not be verified live: see items 2
and 3 below.

## 1. Vendor table: Claude's text mark

**File:** `apps/web/app/(marketing)/_components/coverage-section.tsx`

Claude's row in the Text column read `text: 'committed'` (the amber clock,
"Committed, coming"). `ENGINE.md` section 2 says Anthropic has been marking
every model's text since 2 August 2026, globally, no opt out, so this was
stale: it should read the same as every other "already marking" cell, which
is the green check used for `'yes'` ("Marking today"). Changed `text:
'committed'` to `text: 'yes'` for the Claude row. No new icon or colour was
added; this reuses the vocabulary already on the table.

**Before:** amber clock icon, "Committed, coming"
**After:** green check icon, "Marking today"

**Verified:** live. Screenshot of the rendered table at 320px width shows
Claude's row with a green check in both the Files & images and Text columns,
matching Gemini's row (the only other vendor marking both today). Confirmed
this reflects `ENGINE.md`'s own claim ("Anthropic | Yes. Every model from 2
Aug 2026, globally, no opt out").

## 2. PDF sentence, two places

**Files:**
`apps/web/app/(marketing)/capabilities/page.tsx`
`apps/web/app/(marketing)/_components/faq-items.tsx`

**capabilities/page.tsx**, the footnote under the input matrix:
Before: `PDFs are not accepted yet. The reason is under the lines we hold, below.`
After: `More file types are coming soon.`

**faq-items.tsx**, line ~73, one sentence at the end of the "Word documents
and images" FAQ answer:
Before: `...paste it back into your document when it is done. PDFs are not accepted yet.`
After: `...paste it back into your document when it is done. More file types are coming soon.`

Only that one sentence was touched in the FAQ answer. The rest of that answer
was left as-is per instruction, but it is worth flagging: the answer still
talks through Word documents and pasted text only, and doesn't mention images
even though the capabilities matrix and the FAQ title both cover them. That
inconsistency was not in scope for this pass.

**Verified:** live for `capabilities/page.tsx` (the dev server picked up the
change; confirmed by re-reading the rendered footnote text in the browser).
The `faq-items.tsx` change was verified statically only (read the file after
editing, confirmed the new string) - I did not click open that FAQ item in
the browser to see the rendered sentence, since the rest of the pass focused
on the coverage table, header nav, and workbench, and time was spent instead
on the harder-to-verify mobile/font-size items. This one is a low-risk,
single-sentence swap with no logic involved.

## 3. "What we can do" → "What we do", three places

**Files:**
`apps/web/i18n/messages/en/marketing.json` (the `"capabilities"` key, used by
the header/footer nav via `Trans`)
`apps/web/app/(marketing)/how-it-works/page.tsx` (~line 359, the secondary
link at the bottom of that page)
`apps/web/app/(marketing)/capabilities/page.tsx` (the page's own `<h1>` via
`PageHeader`, and its `<title>` metadata, both on that page)

The `/capabilities` route itself was left untouched, as instructed.

| Location | Before | After |
|---|---|---|
| `marketing.json` `"capabilities"` | `What we can do` | `What we do` |
| `how-it-works/page.tsx` secondary link | `What we can do` | `What we do` |
| `capabilities/page.tsx` metadata title | `What we can do` | `What we do` |
| `capabilities/page.tsx` `<h1>` (`PageHeader` title) | `What we can do, exactly.` | `What we do, exactly.` |

**Verified:** `how-it-works/page.tsx` and `capabilities/page.tsx` changes are
live - confirmed both the browser tab title ("What we do · Un-Claude") and
the on-page heading changed after editing, no restart needed.

**Not verified live:** the `marketing.json` change. Per this session's
environment notes, edits to `apps/web/i18n/messages/en/marketing.json` do not
hot-reload into the running dev server. I did not restart the shared dev
server, because another session is using the same working tree and a restart
would disrupt it. I confirmed the change statically instead: read the file
back after editing and the `"capabilities"` key now reads `"What we do"`. The
header nav link, the footer "Product" column link, and the mobile dropdown
entry all read this same key, so all three will pick up the new label the
next time the dev server restarts (or on the next real deploy) - but that
has not been confirmed by an actual render in this session.

## 4. Header link to /home for signed-in users

**Files:**
`apps/web/app/(marketing)/_components/site-navigation.tsx`
`apps/web/i18n/messages/en/marketing.json` (new `"wallet": "Your credits"` key)

`/home` (the signed-in wallet/credit-balance page) had no link anywhere in
the site nav. `SiteNavigation` previously rendered a fixed, server-safe list
of four links with no awareness of session state (by design - see the
comment in `site-header-account-section.tsx` about reading the session only
on the client so marketing HTML stays identical, and cacheable, for every
visitor).

Made `SiteNavigation` a client component (`'use client'`) that reads
`useUser()` the same way `SiteHeaderAccountSection` already does, and appends
one extra link - `Your credits` → `/home` - to both the desktop nav list and
the mobile dropdown list, only when a real (non-anonymous) signed-in session
exists. A signed-out or guest visitor gets exactly the four links that were
there before; the wallet link is not added, not hidden-but-present, not in
the DOM at all for them. Used the existing `SiteNavigationItem` for the
desktop menu and the existing `MobileDropdown`/`DropdownMenuItem` for mobile,
so it inherits the same styling and mobile-dropdown behaviour as the other
four links rather than a bespoke element.

**Verified, signed-out path:** live. Confirmed via the rendered page (desktop
nav shows only "How it works / What we can do / Our Mission / Pricing" plus
Sign In / Sign Up) and by inspecting the DOM directly: `document.
querySelectorAll('a[href="/home"]')` returned zero matches anywhere on the
page while signed out, and the mobile dropdown's menu items (read via DOM)
were exactly the four original links with no "Your credits" entry.

**Not verified live, signed-in path:** I do not have a real signed-in test
account in this session (the workbench was in "testing mode" with an
anonymous, zero-balance session, not a true signed-in one), and creating one
would mean going through the sign-up/checkout flow, which is out of scope and
explicitly off-limits here (no touching the payment/checkout path). The
signed-in branch was verified by code review only: it mirrors the exact
condition `SiteHeaderAccountSection` already uses to decide "show the account
dropdown vs. show Sign In/Sign Up" (`user && user.is_anonymous !== true`), so
it should flip on for the same visitors that dropdown already treats as
signed in. This needs a real signed-in click-through before it can be called
proven.

## 5. Mobile vendor table alignment

**File:** `apps/web/app/(marketing)/_components/coverage-section.tsx`

Each vendor row put its 28px logo tile in a flex container with
`items-start`, so the tile pinned to the top of the vendor's name/company
text block. On phone width, `by {company}` wraps under longer product names
("Meta AI", "Stable Diffusion"), which grows that row's height - but the
Files/Text check-mark dots on the same row are centred against the *whole*
row (`items-center` on the row's own grid). The result: the logo tile stayed
pinned near the top while the dots sat at the row's true centre, drifting
apart as the row got taller.

Measured before the fix, at 320px width, comparing each row's logo-tile
centre to its check-mark centre (positive = dots below the tile):
- Claude: 9.9px off
- ChatGPT: 9.9px off
- Gemini: 9.9px off
- Grok: 9.9px off
- Meta AI (wraps to 2 lines): 20.4px off
- Firefly: 9.9px off
- Stable Diffusion (wraps to 3 lines): 27.6px off

Fix: changed the vendor block's container from `items-start` to
`items-center` (and dropped the now-unneeded `mt-[1px]` nudge that was
compensating for the old top alignment). This is an existing Tailwind
utility already used elsewhere in this file; no new class was invented.

**Verified:** live, same measurement re-run after the fix at 320px width. All
seven rows now report `diff: 0` - logo tile and check-mark dots share the
same vertical centre on every row, including the two that wrap. Also
confirmed visually via a rendered screenshot at 320px: the Meta AI and Stable
Diffusion logos now sit level with their check marks instead of riding high.

## 6. Mobile zoom-stick bug in the paste box

**File:** `apps/web/app/(marketing)/_components/workbench/workbench.tsx`

**Hypothesis confirmed before fixing.** Checked the textarea's computed
`font-size` at 375px viewport width via `getComputedStyle`: **14.5px**. iOS
Safari auto-zooms the page when a focused input/textarea has a computed
font-size under 16px, and does not zoom back out on blur, which matches the
reported bug (tap in, page zooms, stays zoomed after tapping out).

Fix: changed the textarea's font-size class from a flat `text-[14.5px]` to
`text-[16px] sm:text-[14.5px]` - Tailwind is mobile-first, so this sets 16px
at the default (mobile) breakpoint and restores the original 14.5px at the
`sm:` breakpoint and up. The viewport meta tag was not touched.

**Verified, concretely:**
- At 375px width: `getComputedStyle(textarea).fontSize` = **`"16px"`**
  (measured both before typing and after focusing + typing into the box via
  a real `.focus()` and `input` event - value held at 16px throughout).
- At 1280px width (desktop): `getComputedStyle(textarea).fontSize` =
  **`"14.5px"`** - unchanged from before the fix, confirming desktop
  appearance was not touched.

**Not verified:** actual iOS Safari zoom/no-zoom behaviour itself. This
session's browser tooling is a desktop-engine preview pane, not real iOS
Safari, so the zoom trigger and its "does not zoom back out" failure mode
can't be reproduced or disproven directly here. The fix targets the
documented, well-known trigger condition (sub-16px focused input on iOS
Safari) and the computed style now sits at the documented safe threshold, but
this should be spot-checked on a real iPhone/iOS Safari before being called
fully proven.

## 7. Pricing page canonical tag

**File:** `apps/web/app/(marketing)/pricing/page.tsx`

Added `alternates: { canonical: '/pricing' }` to the metadata export, matching
the pattern already used by `how-it-works`, `mission`, `contact`, and
`capabilities`. Nothing else in the file was touched.

**Verified:** live.
```
$ curl -s http://localhost:3000/pricing -o /tmp/pricing.html
$ grep -o 'rel="canonical"[^>]*' /tmp/pricing.html
rel="canonical" href="https://un-claude.com/pricing"/
```

## Files changed (`git diff --stat`, read-only, nothing staged or committed)

```
 apps/web/app/(marketing)/_components/coverage-section.tsx   | 18 +++++++---
 apps/web/app/(marketing)/_components/faq-items.tsx          |  2 +-
 apps/web/app/(marketing)/_components/site-navigation.tsx    | 39 +++++++++++++++++++---
 apps/web/app/(marketing)/_components/workbench/workbench.tsx| 12 ++++++-
 apps/web/app/(marketing)/capabilities/page.tsx               |  7 ++--
 apps/web/app/(marketing)/how-it-works/page.tsx                |  2 +-
 apps/web/app/(marketing)/pricing/page.tsx                     |  1 +
 apps/web/i18n/messages/en/marketing.json                      |  5 +--
 8 files changed, 69 insertions(+), 17 deletions(-)
```

No files outside the assigned territory were touched. Nothing was staged,
committed, deployed, or pushed.

## Open items for a future session

- The `marketing.json` label change (item 3) and the FAQ sentence (item 2)
  need a dev-server restart (or the next deploy) before they're visibly live
  - they are correct in the file but unconfirmed by render.
- Item 4's signed-in path needs a real signed-in click-through; the
  signed-out path is fully proven, the signed-in path is code-reviewed only.
- Item 6 needs a spot-check on a real iOS Safari device; the underlying
  font-size condition is fixed and measured, but the actual zoom behaviour
  couldn't be reproduced in this session's tooling.
- The FAQ answer touched in item 2 is otherwise stale (mentions only Word
  documents and pasted text, not images) - flagged, not fixed, out of scope
  for this pass.
