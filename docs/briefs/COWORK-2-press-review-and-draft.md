COWORK / CLAUDE CODE SESSION — review Phase 1, then draft Phase 2.

**Two things the research session raised outrank the press list. One of
them it got wrong, and the correction matters. Read this whole brief
before touching the list.**

## CORRECTION 1 — the lab numbers are five days stale, and they predate
## every engine fix

The research session reported, from `engine/lab/`:

    doc_3000   3,367 words in ->   348 out
    doc_5000   5,047 words in ->   623 out

and concluded *"lab/longtest.py hits the live production endpoint, so
this is what the site actually does."*

**That conclusion is wrong. Verified by the conductor:**

- **Every file in `engine/lab/` is dated 18 August.** `longtest_results.json`,
  `results.json`, `results_v2.json`, all of them.
- **The engine was rewritten on 21 and 22 August** — seven commits,
  including *"Keep the document's shape through the rewrite"*, *"stop a
  bad last roll losing the document"*, and *"make the limit reachable"*.
- So those numbers describe a build that no longer exists.

**Do not repeat the 90% figure to anyone.** It is not what the site does.

**BUT THE UNDERLYING CLAIM SURVIVES, and this is the part to keep.**
`docs/session-notes/f1-audit.md`, measured on the live site on 23 August,
independently found the same three claims failing — just not by that
margin:

| The site's claim | What was measured on 23 August |
|---|---|
| "length is held within a tenth" | **+11%, −29%, −22%** |
| "a hard three-word ceiling" | the product's own receipt printed **6** |
| "every number, date and name is checked" | one of ten mentions of 1974 dropped; receipt said 53 in, 47 kept, "figures to check" **empty** |

**Use the audit's numbers. They are current, they were reproduced by
hand, and they are enough.** The research session's instinct was right
and its evidence was out of date.

## CORRECTION 2 — the upstream, and this one is real and unresolved

The research session found that **Ax Sharma has already named this
product's upstream in print** — a 13 August BleepingComputer audit of
this exact category, naming `watermarks-remover`, MIT-licensed, by
Guillaume Meyer, and quoting Meyer volunteering that his tool *"removes
metadata only for now, and stripping the actual marks may not be
available today."*

**Verified by the conductor:** `apps/web/engine/PROVENANCE.md` and
`UPSTREAM-LICENSE` exist in the repository. **Nothing anywhere in
`apps/web/app` mentions the upstream.** The site does not disclose it.

**The licence permits this. That is not the issue.** The issue is that
the reporter most likely to cover this has already set a candour
benchmark using the upstream author's own words, and **disclosed lineage
and discovered lineage read completely differently** in a story.

**This is Jon's decision and it must be made before a single email is
drafted, because it changes what the emails say.** Put the options and a
recommendation to him. Do not decide it.

## WHAT THIS MEANS FOR SENDING — raise it with Jon before drafting

The research session's own finding: **five of the highest-priority names
test tools as a professional habit, and two more will test before
writing.** The site currently makes three claims that fail against its
own receipt, in minutes, by anyone who tries.

**A journalist who tests and finds that writes a much worse story than no
story at all.** "Tool overclaims" lands on the two layers that are
otherwise this product's strongest ground.

**The conductor's recommendation, for Jon to accept or reject: draft now,
send later.** The list is built and the news window is real — the
Anthropic announcement produced fifteen named bylines in twelve days. But
the claims are being fixed right now in a parallel lane, and the send
should wait until they are true. Drafting costs nothing to hold.

## YOUR ACTUAL JOB

1. **Read the Phase 1 list** and give Jon your own read of it — who is
   genuinely worth writing to, not all 62.
2. **Put the upstream-disclosure decision to Jon** with a recommendation.
3. **Recover the gaps** the research session named: The Verge, Wired, Ars
   Technica, CNET, ZDNet and PCMag were network-blocked; about a dozen
   published emails are machine-obfuscated. It called that the
   highest-yield hour of manual work available.
4. **Draft Phase 2, as HELD DRAFTS.**

## RULES FOR THE DRAFTS

- **Jon writes as himself.** He built it. Not a neutral observer — the
  sending address alone makes that implausible, and a founder is a better
  source than a tipster.
- **From `unclaudeapp@gmail.com`.** Never the un-claude.com domain — cold
  outreach must not touch the deliverability of transactional email.
- **Read `.claude/skills/unclaude-messaging/SKILL.md` and obey it.** Three
  layers, two provable, **layer B is best effort and unverifiable and the
  site says so.** An email that overclaims to a journalist who then tests
  it is the whole risk in one sentence.
- **Offer: an interview or an exclusive first look.** Say which fits whom.
- **One email per person**, referencing their actual article and the hook
  from their own piece. Not a template with a name swapped in.
- **DRAFTS ONLY. Send nothing.** Every send is Jon's own click, one at a
  time, spaced out.

## AND ABOUT THE CRITICAL 26

The research session expects roughly 26 of 62 to write critically — the
education beat spent three years concluding *stop detecting*, and the
provenance beat spent them calling metadata stripping a defect.

**Do not write around that. Write into it.** This product's real
differentiator is that it says plainly what it cannot prove, on a site
full of tools that don't. **Candour is the pitch**, and it is also the
only thing that survives being tested.

Write your review to `docs/session-notes/press-phase-2.md`.
