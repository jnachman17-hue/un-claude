MODEL: Sonnet 5, medium effort. Small, mechanical, well-specified.

You are finishing the SEO work a previous session could not reach. Read
docs/session-notes/seo-canonicals-and-titles.md first -- it did the
homepage, /how-it-works and /mission, and it explains the one decision
you must not undo.

TERRITORY, and it is exactly five files:
  apps/web/app/(marketing)/capabilities/page.tsx
  apps/web/app/(marketing)/contact/page.tsx
  apps/web/app/(marketing)/(legal)/terms-of-service/page.tsx
  apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx
  apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx

You may edit ONLY the `metadata` export at the top of each. Do not touch
the page body, the visible copy, or anything else in those files.

DO NOT TOUCH, and this one matters:
  apps/web/app/(marketing)/pricing/page.tsx -- ANOTHER SESSION MAY BE
  REWRITING ITS COPY RIGHT NOW. Jon has ruled on how an uploaded .txt is
  priced, and the pricing page states the old rule in four places. It is
  not yours. Its canonical tag is a known, accepted gap.

Also do not touch: apps/web/lib/root-metdata.ts, apps/web/app/layout.tsx,
the engine, the workbench, or docs/LAUNCH-CHECKLIST.md.

ABOUT THE DEV SERVER. Do not start your own on a spare port. Next.js
locks one dev server per BUILD DIRECTORY via .next/dev/lock, scoped to
the project folder and not to the port, and every session shares one
working tree. If a peer already has one running, use it -- same tree, so
your edits hot-reload there. Keep your requests read-only.

YOU CANNOT DEPLOY AND MUST NOT TRY. Another session has unfinished edits
on disk and a deploy ships the WORKING TREE rather than git.

Read CLAUDE.md first. Section 4 governs: prove each fix with curl output
pasted in full, not by describing it.

═══ 1 — SELF-REFERENCING CANONICAL TAGS ON ALL FIVE ═══
None of these five has a canonical tag. Confirmed by curl.

Add `alternates: { canonical: '<path>' }` to each page's own metadata
export, naming ITS OWN address: '/capabilities', '/contact',
'/terms-of-service', '/privacy-policy', '/cookie-policy'.

DO NOT ADD A CANONICAL TO root-metdata.ts. The previous session
deliberately refused to, and was right: a canonical set at the root leaks
the homepage's address onto every page that does not set its own, so each
of those pages would claim to BE the homepage. A wrong canonical is worse
than a missing one. Per-page only.

═══ 2 — /capabilities' DESCRIPTION IS TOO LONG ═══
Measured today: 171 characters. Google truncates near 155-160. Bring it
under 155 without losing the claim it makes.

The unclaude-messaging skill will fire on copy work. Let it. The specific
risk when shortening a sentence about the statistical watermark (layer B)
is widening a claim while cutting words -- layer B is best effort and
unverifiable and must never be written as though it were proven. Cut
words, not caveats.

The other four descriptions were measured and are fine: /contact 109,
terms 143, privacy 152, cookie 144. Leave them alone.

═══ FINISHING ═══
Prove it with curl. For each of the five pages show the canonical tag and
the description, and show the character count of the /capabilities
description before and after. Jon cannot check this by reading code.

A step you skipped is a step that failed.

Write docs/session-notes/seo-finish.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own five files are listed -- sessions share one git index and a
stray `git add` in another session leaves paths staged for yours. Never
`git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
