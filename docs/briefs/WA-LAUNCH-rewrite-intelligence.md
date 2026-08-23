MODEL: Opus 5, high effort.

**RUN THIS AS A MULTI-AGENT WORKFLOW. Jon has explicitly authorised it and
approved the token cost.** Author a Workflow script and call the Workflow
tool. Roughly 24 agents. Do not do this work single-threaded.

READ FIRST, IN THIS ORDER
1. CLAUDE.md in full. Section 4 governs — a run, not an assertion — and it
   is strict here because these are claims about people's documents.
2. docs/workflows/A-rewrite-intelligence.md — your scope, the 12
   categories, and the design constraint. This is your brief.
3. docs/session-notes/engine-limits.md sections 6 and 7, and
   docs/session-notes/prompt-leak.md. Both are recent, both measured
   carefully, and both will save you from re-deriving what is settled.

THE QUESTION: what must survive a rewrite unchanged, and what does the
engine do to each of those things today?

It started with quotations — Jon found that a direct quote gets rewritten
like any other sentence, which for a student is a misattributed source.
But he asked for something broader and predictive: **find the cases that
will come up, before a customer finds them.**

SHAPE OF THE WORKFLOW
  Phase 1, fan out: one agent per category, twelve of them. Each TESTS
    the current engine and returns real before/after evidence, a rate over
    at least 10 runs, and results on BOTH mistral-small and
    mistral-medium. "Sometimes" is not a finding Jon can act on.
  Phase 2, barrier: dedupe and rank by likely x damaging. This one needs
    every result together.
  Phase 3: four independent design proposals.
  Phase 4: judge each on three lenses — correctness, cost in rewrite
    aggressiveness, and provability.
  Phase 5: synthesise ONE plan, taking the best of the runners-up.

THE CONSTRAINT THAT BINDS EVERY AGENT
The core goal stays: far fewer three-word sequences from the original. A
protection that freezes half the document defeats the product. **Every
proposal must state its cost in rewrite aggressiveness, measured.**

A BET FOR THE PANEL TO BEAT OR ADOPT: protected spans — detect, mask
before the rewrite, restore after — rather than more prompt instructions.
Masking is deterministic and provable; a prompt instruction is best
effort and unverifiable. W8 proved the point the hard way: rule 3a
already demanded length within a tenth and the model ignored it until
something enforced it.

TERRITORY: read anything. **WRITE NOTHING BUT
docs/session-notes/rewrite-intelligence.md.** No engine code. Design and
evidence only — a single session implements afterwards, on Jon's
approval, because parallel writers are what breaks this repo.

MONEY: read the AI Gateway balance at the start and the end and report
the exact spend. Budget roughly $0.50-$1 of a ~$14 balance. Do not buy
credits. Fund any account by inserting ledger rows and delete it after.

DO NOT deploy. DO NOT push. Before EVERY commit run
`git diff --cached --name-only`. Never `git add -A`, `git add .` or
`git commit -a`.

FINISHING: Jon is not a programmer. Every category needs real pasted
input and output. A step you skipped is a step that failed.
