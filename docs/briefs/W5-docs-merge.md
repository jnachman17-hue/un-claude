MODEL: Sonnet 5, high effort. High volume, low ambiguity, but it needs
judgment about what is permanent and what was only ever scaffolding.

You are folding two days of parallel-session findings into the permanent
record, so future sessions stop rediscovering the same things.

TERRITORY: docs/04-decision-log.md, docs/07-runbook.md, and the note
files listed below.

DO NOT TOUCH: docs/LAUNCH-CHECKLIST.md -- the conductor is its only
writer and your edits would be reverted. Do not touch
docs/CURRENT-HANDOFF.md, which the Stripe session just rewrote and is
current. Do not touch docs/briefs/. No code, anywhere.

Read CLAUDE.md section 6 first -- it defines what belongs in the decision
log (the reasoning, not only the outcome) versus the runbook (an
operational fact learned the hard way, and what to do instead).
docs/session-notes/README.md defines the merge contract: notes get merged
and then the note file is deleted. Nothing in that folder is permanent.

MERGE EXACTLY THESE 24 FILES AND NO OTHERS:

  docs/session-notes/HANDOFF-after-credits-verified.md
  docs/session-notes/HANDOFF-signup-blocker.md
  docs/session-notes/account-deletion-fix.md
  docs/session-notes/auth-surface.md
  docs/session-notes/captcha-blocks-every-sanitise.md
  docs/session-notes/credit-funnel-verified.md
  docs/session-notes/credits-ux.md
  docs/session-notes/density-cuts.md
  docs/session-notes/guest-merge-double-runs.md
  docs/session-notes/legal-applied.md
  docs/session-notes/legal-reconciliation.md
  docs/session-notes/legal-research.md
  docs/session-notes/limits.md
  docs/session-notes/migrations-applied.md
  docs/session-notes/mobile-pass.md
  docs/session-notes/operations-setup.md
  docs/session-notes/password-form-bug.md
  docs/session-notes/payments-tested.md
  docs/session-notes/security-audit.md
  docs/session-notes/security-fixes.md
  docs/session-notes/seo-audit.md
  docs/session-notes/stripe-setup.md
  docs/session-notes/wallet-mobile-pass.md
  docs/session-notes/what-signup-still-has-not-proven.md

THAT LIST IS CLOSED. Other sessions are running right now and will create
new notes in that folder while you work. If a file appears that is not on
your list, LEAVE IT. It belongs to a live session and deleting it
destroys work in progress.

HOW TO MERGE
The decision log is at entry 114 -- continue the numbering, do not
renumber anything existing. Several notes overlap heavily and several
correct each other, so this is not concatenation. Two known examples of
notes that were WRONG and were corrected later:

  - auth-surface.md records the account-deletion defect as still open and
    "confirmed again here". It had already been fixed, and two runs of
    the verification script proved it. The fix is real; the note is not.
  - seo-audit.md concluded the site was blocking Google with a noindex
    tag. There is no noindex anywhere in the source or on any live page.
    Search Console's data was a stale 15 August crawl.

So where two notes disagree, work out which is current before you write
either into the permanent record, and say in the entry which one won and
why. Where you cannot tell, write it into
docs/06-assumptions-and-open-questions.md as open, with a trigger for
revisiting, rather than guessing.

DELETING: MERGE ALL, BUT DO NOT DELETE THESE FIVE YET

  docs/session-notes/limits.md
  docs/session-notes/payments-tested.md
  docs/session-notes/stripe-setup.md
  docs/session-notes/legal-research.md
  docs/session-notes/legal-reconciliation.md

Two sessions are running right now and their briefs instruct them to read
those five. Deleting a file out from under a live session is how you
break one. Merge their content normally, then leave the file on disk with
a single line added at the very top saying which decision-log entry now
holds it and that it is retained until W1 and W2 finish. The conductor
removes them afterwards.

Every other file on your list: delete it once its content is merged, as
the folder's README describes.

If you run out of room, stop cleanly: merge fewer files completely rather
than all of them partially, and say exactly which ones are done.

FINISHING
Report as a list: which note went where, and which notes contradicted
each other and how you resolved it. Jon should be able to read that list
and know the record is now trustworthy.

A step you skipped is a step that failed.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed -- sessions share one git index. Never
`git add -A`, `git add .` or `git commit -a`. Do NOT deploy. Do NOT push.
