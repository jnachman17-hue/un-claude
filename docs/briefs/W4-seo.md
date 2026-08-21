MODEL: Sonnet 5, medium effort. Well-specified, mechanical.

TERRITORY: apps/web/lib/root-metdata.ts, apps/web/app/layout.tsx, and the
metadata exports of the homepage, /how-it-works and /mission.

DO NOT TOUCH: the three legal pages or the pricing page -- another
session owns their metadata. Not the engine, not the workbench, not
docs/LAUNCH-CHECKLIST.md.

Read CLAUDE.md first. Section 4 governs: prove each fix with curl against
a running build, not by describing it.

USE PORT 3003. `.claude/launch.json` defines web-d on 3003. Two other
sessions are running on other ports right now; taking theirs breaks them.

YOU CANNOT DEPLOY AND MUST NOT TRY. Two other sessions have unfinished
edits on disk, and a deploy ships the WORKING TREE rather than git, so
deploying now would ship their half-done work to the live site. Prove
your changes against localhost:3003. Jon deploys later, once the tree is
quiet.

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

WRITE JON A SEARCH CONSOLE WALKTHROUGH. This is a required deliverable,
not an afterthought. There is a half of this job only Jon can do, in
Google Search Console under his own account, and it can only happen AFTER
your code is deployed -- which is not today.

So end your session note with a numbered, plain-English walkthrough he
can follow without you. He is not a programmer: name the buttons he
clicks and the exact text he should see. Cover at least:

  1. URL Inspection -> Test Live URL on the homepage. Pass condition:
     Crawl allowed YES, Page fetch SUCCESSFUL, Indexing allowed YES.
  2. How to confirm the canonical Google sees matches the one you set --
     the "User-declared canonical" and "Google-selected canonical" lines,
     and what it means if they disagree.
  3. Inspect https://www.un-claude.com/ and confirm it reports "Page with
     redirect" rather than being indexed separately.
  4. Request Indexing on the homepage, /pricing, /how-it-works, /mission.
  5. What is normal afterwards: indexing takes days, not minutes, and
     Search Console's report reflects its LAST CRAWL, not the live page.
     Say this explicitly -- a previous session misread stale crawl data
     as a noindex tag that never existed and sent everyone hunting for it.

Tell him plainly that step 4 is pointless before the deploy, because
Google would just re-crawl the current build and the stale data problem
repeats.

Write docs/session-notes/seo-canonicals-and-titles.md.

Before EVERY commit run `git diff --cached --name-only` -- sessions share
one git index. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
