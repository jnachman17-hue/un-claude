MODEL: Opus 5, xhigh effort. Open-ended diagnosis plus production
measurement. This is the hardest task on the board and the long pole to
launch.

Engine correctness, file handling, and the size ceiling. Five parts.

TERRITORY: apps/web/engine/**, apps/web/api/*.py, and
docs/session-notes/engine-limits.md.

DO NOT TOUCH: apps/web/app/api/** route handlers (including
app/api/tool/clean/route.ts), lib/server/credits.ts, the workbench, the
pricing page, or the legal pages. Other sessions hold several of those
right now. If a fix needs one of them, do the engine half and write the
rest up as a handoff for Jon.

READ FIRST
1. CLAUDE.md. Section 4 governs and it is strict here, because these are
   correctness claims about money and about people's documents.
2. docs/session-notes/limits.md -- it measured production timing and
   raised the function cap from 60s to 300s.
3. docs/session-notes/payments-tested.md section 4 -- a Stripe audit just
   fixed two pricing defects that live on the boundary you are about to
   work on. Know what changed before you change anything near it.

A HARD CONSTRAINT, READ IT TWICE
apps/web/scripts/verify-pricing-matches-engine.mjs guards the agreement
between the engine's TEXT_EXTS/CONTAINER_EXTS and the clean route's
pricing list. Drift between them was a 100x undercharge: essay.csv bought
an unlimited rewrite for one credit. It passes today. If you touch either
extension list, RUN IT, and paste the output. If you cannot keep it
passing, stop and hand it to Jon.

═══════════════════════════════════
PART 1 — FORMATTING IS DESTROYED. Do this first, and finish it.
═══════════════════════════════════
Jon, testing with real essays: paste a formatted essay in, copy the
sanitised version out, and the formatting is gone.

This outranks everything else here. A size limit can be stated honestly
and most people never hit it. Broken formatting hits EVERY person who
pastes more than a paragraph, and the core case is a student pasting a
long document they care about. Handing back an unbroken wall of text
means rebuilding it by hand, which destroys the whole "paste, clean,
done" promise.

Second reason it matters: structure is a signal. Flattened paragraphing
looks processed, which cuts against the entire point of the product.

FIND WHERE IT IS LOST BEFORE CHANGING ANYTHING. At least three
candidates -- the chunking in uc_chunk, the rewrite round-trip, and
normalisation in the clean path -- and it may be lost on the way in, on
the way out, or in the copy button. Guessing wastes the session.

Preserve paragraph breaks at minimum; list structure and line breaks too
if it can be done safely.

PROVE IT with a real multi-paragraph essay, input and output pasted in
full.

STOP HERE AND WRITE YOUR SESSION NOTE BEFORE STARTING PART 2. Part 1 is
the item that affects every user. If you run out of room later, it must
already be banked and provable. Parts 2-5 are a clean second session.

═══════════════════════════════════
PART 2 — EVERY FILE TYPE, END TO END
═══════════════════════════════════
A CORRECTION TO EARLIER GUIDANCE, which said this was "seven input
paths". It is not, and the difference is the point.

  ACCEPTED_FILES in encode.ts is '.txt,.md,.docx,.png,.jpg,.jpeg' -- but
  that is only the file picker's accept attribute, which is a HINT. A
  user can choose "All Files", or drag and drop.

  The clean route validates the extension NOWHERE. There is no allowlist.

  The engine's TEXT_EXTS holds 12 extensions and CONTAINER_EXTS holds 12
  more, including .pdf, .xlsx, .pptx, .epub, .odt, .html and .svg.

  This is not theory: the .csv undercharge the Stripe audit just fixed
  got in exactly this way.

So test the six nominal types properly, AND establish what actually
happens with the rest. Specifically: 04 entry 26 says PDF is deliberately
unsupported, yet .pdf is in the engine's CONTAINER_EXTS. Nobody knows
what a PDF upload does today. Find out.

For EACH type, on production, WITH THE DEV BYPASS OFF:
  - Does the scan report sensibly?
  - Does the clean succeed?
  - DOES THE FILE STILL OPEN AFTERWARDS? A .docx that comes back
    corrupted is worse than one that was never cleaned. Verify each
    output is a valid file of its type, not just that bytes came back.
  - Was the right number of credits charged?
  - On failure, was it refunded?

Then the things that go wrong:
  - An empty file
  - A file renamed to lie about its type (a .png called .docx)
  - A file with no watermarks at all -- a clean input must not be
    reported as cleaned of something
  - A filename with spaces, unicode, or a very long name
  - The largest file of each type you can reasonably make

Report as a table. Any row that fails is a finding.

Whether uploads SHOULD be restricted to the six is a product decision and
Jon's to make. Report it; do not decide it, and do not edit the route.

═══════════════════════════════════
PART 3 — THE PRICING ARBITRAGE. Verify, do not assume.
═══════════════════════════════════
Pricing charges one credit per 1,000 words of PASTED text, but one credit
per FILE whatever its size. So 10,000 pasted words costs 10 credits, and
the identical text saved as a .txt and uploaded costs 1. Same work, same
cost to run, a tenth of the price.

TEST IT. One document, submitted both ways, report what each actually
charged. If the gap is real, say what it costs at the sizes the engine
can handle. This is a finding for Jon to rule on, NOT something to fix --
the pricing rule is his and those files are not yours.

═══════════════════════════════════
PART 4 — THE TWO CEILINGS. Measure, do not assume.
═══════════════════════════════════
  LOCALHOST has no function time limit. 5,000 words succeeds, 10,000
  fails with "something went wrong, nothing was changed". Nothing timed
  it out, so that is an ENGINE defect and it is the more interesting one.

  PRODUCTION has a 300s cap. NOTHING above 2,000 words has ever run
  there. The single 2,000-word attempt failed and refunded correctly, and
  that was under the old 60s cap.

  (a) Find why 10,000 fails locally where nothing is timing it out.
  (b) Then measure production at 2,500 / 5,000 / 7,500 / 10,000 and give
      a table of words against seconds and outcome.

Then recommend ONE of: raise the cap, split large documents into
background work, or set an honest limit. Reasoning, not a menu. If it is
a limit, say exactly what the interface must tell the user and hand that
to Jon -- the workbench is not yours.

THIS IS THE ITEM GATING REVENUE. Checkout is built and tested and is
being held closed partly because of it: the moment money moves, a student
pasting 5,000 words is paying for a path that has never once executed in
production. Your table is what tells Jon whether that is safe.

═══════════════════════════════════
PART 5 — RETRY EXHAUSTION AT 1,000 WORDS
═══════════════════════════════════
From limits.md: runs at 1,000 words sometimes fail through uc_chunk's
retry loop giving up, on both word salad and real prose. Both refunded
correctly. Nobody has investigated why it gives up when it does.

═══════════════════════════════════
HOW TO TEST WITHOUT SPENDING MONEY
═══════════════════════════════════
THE DEV BYPASS MUST BE OFF. It only runs on development builds, and with
it on nothing is charged and none of the real path is exercised.
Essentially everything measured so far was measured with it on, which is
why the ledger contains no large runs at all.

Do NOT buy credits. Fund one test account by inserting ledger rows
directly, in the same append-only shape the grants use. Delete the
account afterwards -- deletion cascades and takes the ledger rows with
it, verified twice on the live database.

Model costs are settled at roughly 0.09-0.25 cents per 1,000 words. Do
not re-derive them, but DO report what your testing actually spent.

═══════════════════════════════════
FINISHING
═══════════════════════════════════
Jon is not a programmer and cannot check this by reading code. Every
claim needs real pasted output -- especially the before/after formatting
and the file-type table.

A step you skipped is a step that failed. Say which ones you skipped.

Write docs/session-notes/engine-limits.md.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed -- sessions share one git index and this has
already put one session's file inside another's commit. Never
`git add -A`, `git add .` or `git commit -a`.
Do NOT deploy. Do NOT push.
