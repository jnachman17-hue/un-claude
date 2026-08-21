MODEL: Sonnet 5, medium effort. Two small, well-scoped bugs.

TERRITORY: apps/web/app/(marketing)/_components/workbench/** only.

DO NOT TOUCH: apps/web/engine/**, apps/web/api/*.py, the legal pages, the
pricing page, apps/web/app/api/** route handlers, lib/server/credits.ts,
or docs/LAUNCH-CHECKLIST.md. Other sessions hold those.

Read CLAUDE.md first -- section 4 governs, and section 8 (think like the
visitor) applies because both of these are things a visitor sees.

═══ BUG 1 — THE WORD COUNTER FREEZES ON A STALE NUMBER ═══
Jon: deleted 10,000 words, the box is empty, and it still reads
"10,524 words = 11 tokens". Typing more words leaves it frozen there.

This matters more than it looks. The counter is what tells someone what
they are about to be charged. A frozen counter showing a stale number is
a price display that lies.

A PREVIOUS SESSION'S UNTESTED HYPOTHESIS, offered only to save you time:
workbench.tsx around line 1465 reads `countWords(loaded.text || text)`,
which would mean a non-empty `loaded.text` wins forever once set, so an
emptied textarea can never show zero. THIS WAS READ, NOT RUN. Verify it
before you trust it, and say so either way.

Reproduce it first. Then fix it. Then prove it with the real interface:
paste a large block, delete it, and show the counter reading zero.

═══ BUG 2 — THE DISCLOSURE LINE AT THE TOOL'S BUTTON ═══
From the legal report section 2D. The people most likely to care about
this are the ones who never sign up, and the workbench is where the
decision to paste is made. Put this at the tool's own button:

  Your text is processed and deleted, never stored. The optional rewrite
  sends it to an AI model to be rewritten.

Wording is settled -- do not improve it. Placement and styling are yours.
The unclaude-messaging skill will fire; let it check your placement.

═══ FINISHING ═══
Jon cannot check this by reading code. Show the real interface, at
desktop AND at phone width. A step you skipped is a step that failed.

Write docs/session-notes/workbench-counter-and-disclosure.md.

Before EVERY commit run `git diff --cached --name-only` -- sessions share
one git index. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
