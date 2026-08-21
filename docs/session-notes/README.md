# Session notes

**Why this folder exists.** When several sessions run at once, every one of
them wants to append to `docs/04-decision-log.md` and `docs/07-runbook.md`.
Appending to the end of the same file from two places is the one thing git
cannot merge cleanly, so parallel sessions were reliably colliding on the
documentation rather than on the code.

**The rule for a session running alongside others:** write your entry to
`docs/session-notes/<your-topic>.md` instead. One file per session, named for
the work, so no two sessions ever touch the same path. The content is the same
as a decision-log entry would be: what was decided, and why, not just what
changed.

**These get merged into `04-decision-log.md` and `07-runbook.md` afterwards,
and the note file is deleted.** Nothing here is permanent. If you are the only
session running, skip this folder and write to the real documents directly.
