# Workflow A — rewrite intelligence

**What must survive a rewrite unchanged, and what does the engine do to each
today?** Discovery and design only. **This workflow writes no engine code.**

## The 12 categories to probe

Each gets one agent. Each must TEST the current engine and return real
before/after evidence, not opinions.

| # | Category | Why it matters |
|---|---|---|
| 1 | **Direct quotations** | A rewritten quote is a misattributed source. Jon's own report. **The one that started this.** |
| 2 | **Numbers, dates, units** | A fact guard already exists — verify it actually holds. **P3 is here:** `mistral-small` turns `2028` into `two thousand twenty-eight`, seen in 3 of 120 ordinary-prose runs, which rule 5a forbids. |
| 3 | **Citations and references** | `(Smith, 2019)`, `[1]`, footnote markers, bibliographies. |
| 4 | **Proper nouns and names** | People, companies, places. Rule 1 claims these survive character-for-character. Test it. |
| 5 | **Defined and technical terms** | "statistically significant" → "notably meaningful" changes the meaning of a claim. |
| 6 | **Code, identifiers, filenames** | A `code` strength exists. Does prose containing inline code survive? |
| 7 | **Lists, headings, structure** | W1 fixed paragraph structure. Lists and headings were never measured the same way. |
| 8 | **URLs, emails, handles** | A mangled URL is a dead link in someone's document. |
| 9 | **Non-English and mixed-language text** | There is a `lang`/`original_lang` path. Nobody has tested it. |
| 10 | **Titles of works** | Book, paper and song titles are quotations by another name. |
| 11 | **Equations and math notation** | Common in the student case this product is built for. |
| 12 | **Tables and tabular text** | Column alignment and cell contents. |

## What each probe returns

- Real input, real output, pasted in full
- **Rate** across at least 10 runs — "sometimes" is not a finding Jon can act on
- Both models: `mistral/mistral-small` and `mistral/mistral-medium`
- Severity: how likely × how damaging
- Whether the customer would notice

## Then

**Rank** by likely × damaging. **Design** — 4 independent approaches. **Judge**
on three lenses: correctness, cost in rewrite aggressiveness, and provability.
**Synthesise** one plan.

## The constraint that binds every agent

**The core goal stays: far fewer three-word sequences from the original.** A
protection that freezes half the document defeats the product. **Every proposal
must state its cost in rewrite aggressiveness**, measured, not asserted.

## The conductor's bet, which the panel must beat or adopt

**Protected spans: detect, mask before the rewrite, restore after** — rather than
adding instructions to the prompt. Masking is **deterministic and provable**; a
prompt instruction is best-effort and unverifiable. W8 proved the point the hard
way: rule 3a already demands length within a tenth, and the model ignored it
until something *enforced* it. This would move part of layer B out of "best
effort" into something assertable.
