# Which migrations are applied, and one trap that cost a paste

**21 August 2026, session 10.** Kept because a migration's applied state is
invisible from the repo, and getting it wrong is expensive.

## Applied to the hosted database

| Migration | Applied | Notes |
|---|---|---|
| `20241219010757_schema` | long since | MakerKit base |
| `20260819180000_credit_ledger` | yes | |
| `20260820210000_welcome_grant` | yes | Jon pasted it, session 9/10 |
| `20260821130000_account_deletion_cascade` | yes | parallel session, before the append-only one on purpose |
| `20260821140000_guest_conversion_once` | yes | `guest-merge-double-runs.md` |
| `20260821120000_credit_ledger_append_only` | yes | |
| `20260821120100_credit_balance_self_only` | yes | |
| `20260821120200_rate_limits` | **see below** | failed first attempt, file was broken |
| `20260821120300_signup_grant_email_dedupe` | pending | |

**Applied out of filename order, deliberately.** `130000` and `140000` went in
before `120000`. Both were written to tolerate it: the deletion-cascade note
explains why going first was safer, and `140000` guards its repair step with an
`if exists` check on the append-only trigger so it works either side of it.

---

## The trap: a slash-star inside a SQL comment silently eats the file

`20260821120200_rate_limits.sql` failed on its first ever run with:

    ERROR: 42601: unterminated comment at or near ...

pointing at line 1. Nothing in the message named the cause.

**The cause was a URL path written with a trailing wildcard inside the header
comment** — a slash immediately followed by a star. **Postgres NESTS block
comments, unlike C.** Those two characters opened a SECOND comment, so the first
closing delimiter shut the inner one rather than the outer one, and everything
after it stayed commented out to the end of the file. Three opening delimiters,
three closing, and still unterminated.

It survived being written, reviewed as security work, and handed off twice,
**because nobody had ever run it.** A migration that has not been run is not
known to work, however carefully it was written.

**Never write a slash immediately followed by a star inside a SQL comment.** To
check a file before pasting it, the counts must match:

    grep -o '/\*' FILE | wc -l
    grep -o '\*/' FILE | wc -l

Run across every migration, only this one was unbalanced.

**This was NOT the RLS prompt.** Supabase asks "Run and enable RLS" or "Run
without RLS" whenever a script creates a table. Either is safe with these files,
because each one enables RLS itself; "Run and enable RLS" is the right button
and simply does it twice.
