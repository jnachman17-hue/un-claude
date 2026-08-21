MODEL: Sonnet 5, medium effort. Well-specified, mechanical.

TERRITORY: apps/web/lib/root-metdata.ts, apps/web/app/layout.tsx, and the
metadata exports of the homepage, /how-it-works and /mission.

DO NOT TOUCH: the three legal pages or the pricing page -- another
session owns their metadata. Not the engine, not the workbench, not
docs/LAUNCH-CHECKLIST.md.

Read CLAUDE.md first. Section 4 governs: prove each fix with curl against
a running build, not by describing it.

TWO THINGS A PREVIOUS SEO SESSION GOT WRONG. Do not redo them.
  - It concluded a noindex tag was blocking Google. There is NO noindex
    anywhere in the source or on any live page. Re-verified with curl.
    Search Console's data was a 15 August crawl, before all this work.
  - It flagged the redirects as possibly temporary. They are all 308
    permanent. Verified. Closed.

═══ 1 — SELF-REFERENCING CANONICAL TAGS ═══
There is no canonical tag anywhere on the site. Confirmed by curl today.
Each page needs its own URL as its canonical -- the homepage
https://un-claude.com/, and every other page its own address. NOT every
page pointing at the homepage. That is the common mistake and it would be
worse than having none.

═══ 2 — A TITLE TEMPLATE ═══
Only the homepage carries the brand. Verified today: the homepage is
"Un-Claude · AI Watermark Remover", and /pricing is the bare word
"Pricing". Every page except the homepage loses the brand name in a
search result and in a browser tab.

Add a title template so pages inherit the brand, with the homepage
keeping its full title rather than doubling it.

═══ 3 — META DESCRIPTIONS OVER LENGTH ═══
Measured today with curl. Google truncates near 155-160 characters.

  /how-it-works   181  -- the worst
  /              162
  /pricing        158  -- borderline, and NOT yours, skip it

Bring /how-it-works and the homepage under 155 without losing the claim
each one makes. The unclaude-messaging skill fires on copy; let it check
you have not widened a claim while shortening a sentence.

═══ 4 — STRUCTURED DATA, only if the above is done and proven ═══
SoftwareApplication or Organization. Additive, not a defect. Skip it
rather than rush it.

═══ FINISHING ═══
Prove every item with curl output pasted in full -- the actual tags. Jon
cannot check this by reading code.

NOTE FOR JON, do not do it yourself: once the canonical ships he needs to
run URL Inspection -> Test Live URL in Search Console, then Request
Indexing. Pass condition is Crawl allowed Yes, Page fetch Successful,
Indexing allowed Yes. Write that into your session note.

Write docs/session-notes/seo-canonicals-and-titles.md.

Before EVERY commit run `git diff --cached --name-only` -- sessions share
one git index. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
