MODEL: Opus 5, high effort. This is the big one.

**RUN THIS AS A MULTI-AGENT WORKFLOW. Jon has explicitly authorised it,
approved the scale, and approved the token cost — he said massive is
fine.** Author a Workflow script and call the Workflow tool. Roughly 70
agents. Do not do this single-threaded and do not scale it down.

READ FIRST, IN THIS ORDER
1. CLAUDE.md in full. Section 4 governs and it is the whole point here.
2. docs/workflows/B-f1-audit.md — your scope, the 14 dimensions, the
   verification rule and the money rules. This is your brief.
3. docs/LAUNCH-CHECKLIST.md — what is already known, so you spend your
   agents on the unknown.

THE JOB, in Jon's words: test the system end to end as a user in every
possible case, test the backend, stress the edge cases, look through the
entire site, find any errors, anything not working, problems, friction
points, and investigate everything that could cause a problem later.

**un-claude.com IS LIVE AND TAKING REAL MONEY.** Read, probe, measure.
Do not deploy, do not push, do not change configuration, and do not touch
production data beyond clearly labelled throwaway accounts.

SHAPE OF THE WORKFLOW
  Pipeline, not a barrier, so each dimension verifies as soon as it
  finishes rather than waiting for the slowest.
    Stage 1: one finder per dimension, fourteen of them.
    Stage 2: THREE independent skeptics per finding, each prompted to
      REFUTE it, each given a different lens. Majority-refute kills it.
    Stage 3: a completeness critic — what was not probed, what claim is
      still unverified, what surface did nobody open?
    Stage 4: synthesis, ranked by severity.

THE VERIFICATION RULE, AND IT IS THE POINT OF THE WHOLE RUN
**A finding that cannot be reproduced against the live site dies**,
however good the reasoning looks.

Five claims in the last two days were true in test or in source and false
in production: a noindex tag reported twice that has never existed in any
form, a payment path asserted as wired that was never deployed, an
`sk_live` grep that matched a comment warning never to store one, and a
Stripe Radar tier that works in test and is paid in live. **This
project's characteristic failure is a confident finding nobody probed
against reality.** Build the workflow so that cannot survive.

MONEY RULES, and the first is absolute
  - **NO PURCHASES. Nobody enters card details, ever.** Verify the
    payment path up to but not including the card form. That leg was
    proven with real money on 22 August and checked on the live ledger.
  - Fund test accounts by inserting ledger rows in the same append-only
    shape the grants use, then delete the account — deletion cascades.
  - Label every test account so it cannot be mistaken for a customer.
  - The dev credit bypass MUST be OFF for anything about money or size.
  - Read the AI Gateway balance at the start and the end and report the
    exact spend. Budget roughly $2-5 of a ~$14 balance. If it runs low,
    the code and config dimensions cost nothing — finish those.

TERRITORY: read anything. **WRITE NOTHING BUT
docs/session-notes/f1-audit.md.** No fixes. Findings only; a session
implements afterwards on Jon's approval.

FINISHING: Jon is not a programmer and cannot check this by reading code.
Every finding needs the real artefact — the actual output, the actual
response, the actual screen. **Rank by severity and put the worst first.**
Say plainly which dimensions you could not cover and why. A step you
skipped is a step that failed.

Before EVERY commit run `git diff --cached --name-only`. Never
`git add -A`, `git add .` or `git commit -a`. Do NOT deploy or push.
