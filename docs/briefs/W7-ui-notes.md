MODEL: Sonnet 5, medium effort. Seven small, visitor-facing fixes.

UPDATED 22 August: un-claude.com is LIVE and taking real money. The
engine session that held the workbench has finished, so items 6 and 7 —
previously blocked — are now yours as well. No other session is running.

Read CLAUDE.md first. Section 4 (show the artefact, not a description of
it) and section 8 (think like the visitor) both apply — every one of
these is something a person sees. The unclaude-messaging skill fires on
copy work; let it.

TERRITORY, and it is exactly these:
  apps/web/app/(marketing)/_components/coverage-section.tsx
  apps/web/app/(marketing)/capabilities/page.tsx
  apps/web/app/(marketing)/_components/site-header.tsx
  apps/web/app/(marketing)/_components/site-navigation.tsx
  apps/web/app/(marketing)/_components/site-header-account-section.tsx
  apps/web/i18n/messages/en/marketing.json
  apps/web/app/(marketing)/how-it-works/page.tsx   (ONE link label, line ~359)
  apps/web/app/(marketing)/_components/faq-items.tsx  (ONE sentence, line ~73)

PLUS, for items 6 and 7 only:
  apps/web/app/(marketing)/_components/workbench/workbench.tsx
  apps/web/app/(marketing)/pricing/page.tsx   (the metadata export ONLY)

DO NOT TOUCH:
  apps/web/engine/**, apps/web/api/*.py, apps/web/lib/engine/**
  docs/LAUNCH-CHECKLIST.md
  The pricing page's COPY or its FAQ. It was rewritten hours ago through
  the messaging skill to match a pricing ruling, and it is correct. You
  are adding one line to its metadata and nothing else.

TWO ENVIRONMENT FACTS THAT WILL COST YOU TIME IF YOU DO NOT KNOW THEM.

1. Do NOT start your own dev server on a spare port. Next.js locks one
   dev server per BUILD DIRECTORY via .next/dev/lock — scoped to the
   project folder, not the port — and sessions share one working tree. If
   one is already running on 3000, use it; your edits hot-reload there
   because it is the same tree.
2. EDITING AN i18n MESSAGES JSON DOES NOT REACH A RUNNING DEV SERVER.
   Not a hot reload, not touching i18n/request.ts. Only a full restart.
   Item 3 edits one, so expect to need that and do not spend twenty
   minutes thinking your change did not apply.

THE SITE IS LIVE AND TAKES REAL MONEY. Do NOT deploy — Jon deploys, and
only from a quiet tree. Nothing here should touch the payment path, and
if you find yourself in a checkout or credits file, stop.

YOU CANNOT DEPLOY AND MUST NOT TRY. Another session has unfinished work
and a deploy ships the WORKING TREE rather than git.

═══ 1. The vendor table: mark Claude's row with the green symbol ═══
On the home page vendor/coverage table, the row for Claude text should
carry the green symbol used for the "committed" state rather than
whatever it shows now. Jon has accepted this; implement it.

Read the table's existing symbol vocabulary first and REUSE it. Do not
introduce a new icon or a new green. The point is that Claude's row joins
an existing category, not that it gets a special mark.

═══ 2. The PDF sentence becomes a forward-looking one ═══
Two places say PDFs are refused:
  capabilities/page.tsx — "PDFs are not accepted yet. The reason is under
    the lines we hold, below."
  faq-items.tsx line ~73 — the answer ends "PDFs are not accepted yet."

Replace both with something short and forward-looking, along the lines of
"More file types coming soon." Jon's instruction, and his wording is a
direction rather than a dictation — make it read well.

IN faq-items.tsx CHANGE ONLY THAT SENTENCE. Leave the rest of that answer
exactly as it is. If anything else in it looks stale to you, REPORT it in
your note rather than fixing it — another session owns file-type
behaviour and may already be rewriting it.

═══ 3. Rename "What we can do" to "What we do" ═══
Three places, and missing one leaves the site talking to itself:
  i18n/messages/en/marketing.json:39   "capabilities": "What we can do"
  how-it-works/page.tsx:359            the secondary link's label
  capabilities/page.tsx                the page's own heading

The URL stays /capabilities. Do not rename the route — it is in the
sitemap, it now carries a canonical tag pointing at itself, and changing
it would break both.

═══ 4. There is no way to reach /home from the site ═══
Right now /home is reachable only by typing the URL. Someone who signs in
has no link to their own wallet.

Work out where it belongs — site-header-account-section.tsx already
handles the signed-in and signed-out states, so read it before deciding.
A signed-out visitor should NOT be shown a link to a page that will
bounce them to sign-in; a signed-in one should always have one.

Use the header's existing navigation components rather than a bespoke
link, so it inherits the mobile behaviour the rest of the nav already has.

═══ 5. Mobile: the vendor table's circle logos are not vertically aligned ═══
Under the vendor table on a phone, the circular logos preceding
"committed", "coming" and "does not produce this" do not line up
vertically with each other. Align them.

Fix it in the component with its existing utility classes. DO NOT edit
styles/theme.css — another session is in that file.

═══ 6. Mobile: tapping the paste box zooms the page and never zooms back ═══
Jon, on a phone: tap into the box to paste text and the page zooms in,
and it STAYS zoomed after leaving the box, so the layout is wrong from
then on.

A STRONG HYPOTHESIS, NOT A DIAGNOSIS — verify before you trust it. iOS
Safari auto-zooms any focused input or textarea whose computed font-size
is UNDER 16px, and it does not zoom back out afterwards. Check the
textarea's computed font-size at phone width first.

If that is the cause, the fix is to make the font-size at least 16px at
mobile widths. It must not change how the box looks at desktop.

DO NOT "FIX" THIS BY EDITING THE VIEWPORT META TAG. Adding
`maximum-scale=1` or `user-scalable=no` stops the zoom by taking pinch
zoom away from everybody, which breaks the site for anyone who needs to
magnify it. That is an accessibility regression traded for a layout bug.
If the font-size route does not work, report back rather than reaching
for the viewport tag.

Prove it with the real interface at phone width: tap in, type, tap out,
and show the page is not left zoomed.

═══ 7. /pricing is the only page with no canonical tag ═══
Eight of the nine pages in the sitemap now name their own address. The
ninth was skipped because another session held the file; it has let go.

Add to the metadata export in pricing/page.tsx, matching what the other
eight do exactly:

    alternates: { canonical: '/pricing' },

TOUCH NOTHING ELSE IN THAT FILE. Not the copy, not the FAQ, not the pack
data. One line. Prove it with curl showing the tag rendering.

═══ FINISHING ═══
Jon is not a programmer and cannot check this by reading code. For every
item, show the rendered result — screenshots at desktop AND at phone
width for items 1, 4 and 5, and the actual before/after text for 2 and 3.

A step you skipped is a step that failed. Say which.

Write docs/session-notes/ui-notes-pass.md. Do this even if the work feels
too small to write up — the last session that skipped its note left the
next one guessing.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed — sessions share one git index, so a `git add`
in the other session leaves ITS paths staged for YOUR commit. Never
`git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
