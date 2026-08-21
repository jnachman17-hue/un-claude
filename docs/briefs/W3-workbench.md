MODEL: Sonnet 5, medium effort. Two small, well-scoped bugs.

TERRITORY: apps/web/app/(marketing)/_components/workbench/** only.

DO NOT TOUCH: apps/web/engine/**, apps/web/api/*.py, the legal pages, the
pricing page, apps/web/app/api/** route handlers, lib/server/credits.ts,
or docs/LAUNCH-CHECKLIST.md. Other sessions hold those.

Read CLAUDE.md first -- section 4 governs, and section 8 (think like the
visitor) applies because both of these are things a visitor sees.

ABOUT THE DEV SERVER, so you do not lose time to it. Do NOT try to start
your own on a spare port. Next.js 16 locks one dev server per BUILD
DIRECTORY via .next/dev/lock -- the lock is scoped to the project folder,
not to the port, and every session shares one working tree. So whichever
session started first holds the only dev server, and asking for another
port will not help. A peer session already has one running on port 3000.
Use it: it is the same working tree, so your edits hot-reload there. Keep
your requests to that server read-only. The launch handoff's Part 0 rule
7 tells you to take your own port; that rule is wrong and is being
corrected.

YOU CANNOT DEPLOY AND MUST NOT TRY. Other sessions have unfinished edits
on disk and a deploy ships the WORKING TREE rather than git.

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

If the counter bug turns out NOT to be the hypothesis above, say so
plainly and say what it actually was. A corrected hypothesis is a useful
result; a quietly abandoned one is not.

Write docs/session-notes/workbench-counter-and-disclosure.md.

Before EVERY commit run `git diff --cached --name-only` -- sessions share
one git index. Never `git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
