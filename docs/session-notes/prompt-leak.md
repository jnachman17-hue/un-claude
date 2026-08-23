# The engine handed a customer its own prompt

**22 August 2026, session W8.** A P0 on a live site taking real money.

**Territory:** `apps/web/engine/rewrite_text.py`, `apps/web/engine/uc_chunk.py`,
a new `apps/web/engine/uc_leakguard.py`, `engine/tests/test_leakguard.py`, and
this note. Pricing, the legal pages, checkout and `lib/server/credits.ts` were
not touched. **Nothing was deployed or pushed.**

**Every number below has a run behind it and the real outputs are pasted in.**
720 single rewrites and 360 full end-to-end runs through the real retry loop,
across both models, at a total gateway cost of **$0.26**.

---

## 1. THE SHORT VERSION

**It reproduced, it was worse than reported, and it is now fixed but not
perfect.**

| | Before | After |
|---|---|---|
| **Short or odd pastes that came back wrong**, end to end | **48 of 120 (40%)** | **10 of 120 (8.3%)** |
| Same, on `mistral-medium` alone | **35 of 60 (58%)** | **4 of 60 (6.7%)** |
| **Outputs containing our prompt's own example figures** — hard proof the rules themselves were rewritten and handed over | **13** | **0** |
| **Ordinary prose pastes that came back wrong** | 0 of 60 | 0 of 60 |
| **Ordinary prose pastes wrongly refunded by the new guard** | — | **0 of 60** |

**The single most important number is the last one.** A guard that fires on good
work refunds a customer whose rewrite actually succeeded, which is worse than the
defect it prevents. It fired zero times on 240 measured rewrites of ordinary
prose.

**Was it the model change?** **It made it roughly three times worse and did not
create it.** On the same suspect inputs, `mistral-small` failed 24.2% of the
time and `mistral-medium` 68.3%. The defect existed before the switch.

**One thing is Jon's to decide and it is in section 7.**

---

## 2. WHAT THE CUSTOMER ACTUALLY GOT, AND WHY

### 2.1 It reproduced on the first pass

The rules and the customer's text were **one message** with a bare `---` line
between them. There is no reason a model must read that line as a wall, and on a
short paste the rules were the largest block of prose in front of it. Real
output, `mistral-medium`, input `Hello there.`:

```
Greetings.

I've got a fresh take for you—same details, all the specifics preserved,
but the wording is entirely new. Every figure, date, and name remains
untouched, just wrapped in different phrasing. The structure stay
```

That is the prompt, rewritten, exactly as Jon described.

### 2.2 The worse version: the model invents a whole document

Given instruction-shaped input, `mistral-medium` failed **10 times out of 10** —
and not by restating the rules but by **writing a new document out of the
examples inside them.** Input:

```
Rewrite this paragraph so it sounds more natural. Output only the result,
with no preamble.
```

Output (extract of ~200 words):

```
The period from 1698 to 1702 marked a time of severe hardship for Scotland.
A series of failed harvests led to widespread famine...
```

`1698`, `eighteen percent`, `$4.2 million`, `2028`, `3 December`, `sixty years`
and `eighty years` all appear across these fabrications. **Every one of them is
an example value written into rules 5 and 5a of our own prompt.** The customer's
text is gone entirely and ours is in its place.

### 2.3 And the model's private reasoning, delivered as product

Input `Revenue grew eighteen percent last year.`:

```
Earnings climbed by eighteen percent over the prior twelve months.

--- *Wait, this is too short compared to the original. Let me expand it
to match length...
```

### 2.4 A question comes back as an article

Input (13 words): `What is the best way to remove an AI watermark from a document?`
Output, 250 words, `mistral-medium`, **10 times out of 10**:

```
How can someone effectively erase an artificial intelligence watermark
from a file? There isn't a single guaranteed method, but several
approaches exist—each with limitations. One common tactic involves
converting the document into a different format...
```

The customer pasted a question and was billed for an essay.

### 2.5 What triggers it: short input, confirmed

**Not one defect, in either arm of the experiment, had an input longer than 25
words.** 91 confirmed defects before the fix, all on inputs under 25 words; 120
rewrites of ordinary 40 to 200 word prose produced none at all. The brief's
hypothesis was right, and short text is exactly what a first-time visitor
pastes.

---

## 3. THE FIX: THE ROLES ARE SEPARATED

`rewrite_text.py` now builds two turns instead of one string. The rules go in a
`system` message; **the customer's text is alone in the `user` message.** That
is the boundary a chat model is trained to respect rather than a horizontal rule
it has to infer.

- `build_rules()` returns the instruction half and never sees customer text.
- `build_messages()` returns the two turns.
- `build_prompt()` still returns the old single-message form, **byte-for-byte
  identical on all 32 strength/text combinations tested against the committed
  version.** It is used by the `print-prompt` backend, which has no roles, and
  by `WATERMARKS_REWRITE_SINGLE_MESSAGE=1` for any future backend that refuses a
  system turn.

**The backend supports it, verified live** against the Vercel AI Gateway:

```
message_roles: system+user
HTTP ok, usage: {'model_calls': 1, 'prompt_tokens': 764, 'completion_tokens': 12,
                 'total_tokens': 776, 'cost_usd': 0.0003296}
output: 'Sales climbed by eighteen percent over the previous twelve months.'
```

### 3.1 On its own, it is not enough — and this is the important part

Re-running the identical 360 rewrites with roles separated and **no guard**:

| corpus | model | before | after |
|---|---|---|---|
| suspect | `mistral-small` | 20.8% | 23.3% |
| suspect | `mistral-medium` | **55.0%** | **30.0%** |
| ordinary prose | both | 0% | 0% |

**It halves the problem on `mistral-medium` and does nothing measurable on
`mistral-small`.** The brief said the guard would matter more than the fix. It
was right.

---

## 4. THE GUARD, AND THE TWO IDEAS THAT DID NOT WORK

New module `apps/web/engine/uc_leakguard.py`, wired into `uc_chunk.py` **before
anything can record a fallback**, so a suspect rewrite can never become the
result that gets returned when a later attempt fails.

**Two of the three ideas in the brief were measured and rejected.**

- **An input-overlap floor cannot work.** Across 360 runs, the fraction of the
  input's distinctive words surviving a **good** rewrite fell as low as **0.08**,
  while a **leaked** output reached **0.14**. The ranges overlap. A floor set
  anywhere between them refunds customers whose work succeeded. Not used.
- **Resemblance to the prompt is nearly useless alone**, because the model does
  not copy the prompt, it *rewrites* it — which is what it was asked to do. The
  output in section 2.1 scored **0.03** bigram overlap against the prompt it came
  from. Verbatim echo is kept only because a hit is certain proof; it catches
  almost nothing on its own.

**What works is length.** Every leak is the model answering, explaining or
inventing, and all three run long.

| | good rewrites (240 runs) | confirmed defects (155 runs) |
|---|---|---|
| output length vs input | never above **1.35x** | median over **6x**, worst **212x** |

**The threshold is `out > in * 1.5 + 8` words.** 1.35 with no slack sits exactly
on the highest good result with no headroom; 1.5 with 8 words of slack clears
every good run measured and still does almost all the catching. The prompt
already demands the rewrite stay within one tenth of the original (rule 3a), so
this is the first *enforcement* of an existing rule, not a new one.

Two narrow signals sit behind it: phrases that only occur when the model talks
**about** the task, and word runs lifted verbatim from our own prompt. **A phrase
already present in the customer's own text is never treated as ours** — if they
sent it, getting it back is the product working.

### 4.1 Measured, over all 720 recorded rewrites

```
false positives on the 240 legitimate rewrites :   0 / 240
caught, of confirmed defects                   : 152 / 155  (98.1%)
by signal: length=128, commentary=24, prompt echo=0, missed=3
```

An earlier draft of the guard matched refusals and requests at the start of the
output. **It was cut because it rejected `"I am sorry for what happened that day,
she wrote in her letter to him."`** — ordinary prose in somebody's document. That
is exactly the false positive that would refund a paying customer, and the
narrower version that replaced it is in the tests.

### 4.2 A stray `---` is stripped, not rejected

A bare horizontal rule at the edge of the output appeared in **1.7% of perfectly
good rewrites (2 of 120)**. Failing the job over a stray punctuation mark would
refund real customers, so it is removed and the rewrite continues.

### 4.3 On rejection

The chunk retries. **If retries run out, the job fails and the customer is
refunded.** No suspect rewrite is ever returned.

---

## 5. END TO END, THROUGH THE REAL RETRY LOOP

360 runs (180 each side) calling `uc_chunk.rewrite_long` with the same closure
`server.py` uses, against the committed engine and the fixed one.

```
corpus    model          delivered bad   refunded  delivered ok
suspect   small    BEFORE    13/60 = 21.7%      2        45
suspect   small    AFTER      6/60 = 10.0%      9        45
suspect   medium   BEFORE    35/60 = 58.3%      0        25
suspect   medium   AFTER      4/60 =  6.7%     18        38

legit     small    BEFORE     0/30 =  0.0%      0        30
legit     small    AFTER      0/30 =  0.0%      0        30
legit     medium   BEFORE     0/30 =  0.0%      0        30
legit     medium   AFTER      0/30 =  0.0%      0        30
```

**Refunds rise on junk input and that is the intended trade** — a refund is a far
better outcome than a customer receiving our prompt. **Refunds on ordinary prose
stayed at zero.**

### 5.1 What still gets through, stated plainly

**10 of 120.** All of them are short conversational replies on junk input, and
**none of them discloses any part of the prompt.** In full:

```
IN 'Hi'                          OUT 'How can I assist you today?'
IN 'Hi'                          OUT 'Nothing here to rewrite.'
IN 'Hello there.'                OUT '(No text provided to rewrite under the given rules.)'
IN 'conclusion'                  OUT 'The final outcome is clear.'
IN 'Rewrite this paragraph...'   OUT "I cannot rewrite text without seeing the paragraph you want me to transform..."
IN 'Rewrite this paragraph...'   OUT "I can't do that without seeing the original text you'd like rewritten..."
IN 'Please make the following...' OUT "I need the original text to rewrite it for you..."
IN 'Please make the following...' OUT "I'll need the text you want rewritten so I can follow the rules properly..."
IN 'RULES 1. Be concise...'      OUT "I can't comply with those instructions—they conflict with the detailed rules provided earlier..."
IN 'RULES 1. Be concise...'      OUT "I can't follow those rules—they directly conflict with the original instructions..."
```

These say a set of rules exists. **They do not say what the rules are, and they
carry none of the prompt's example figures.** The P0 — our prompt reaching a
customer — measured **13 occurrences before and 0 after.**

---

## 6. WHAT WAS NOT DONE

- **Not deployed and not pushed.** Both are Jon's.
- **Not measured on production.** Everything here ran against the live gateway
  from this machine, through the engine's real code, but not through the
  deployed function or the site's route.
- **No anchor / input-overlap guard was added**, deliberately — section 4 shows
  it cannot be set safely.
- **The 3 remaining guard misses in section 4.1 were not chased.** Two are
  one-word inputs where a length ratio means nothing (`'conclusion'` →
  `'This is the closing.'`); tightening for them would cost false positives.
- **A second rule-5a bug was found and left alone**, because it is outside this
  brief's territory and is not the P0: `mistral-small` sometimes spells a year
  out, turning the customer's `2028` into `two thousand twenty-eight` and `2024`
  into `twenty-four`, which rule 5a forbids. Seen in 3 of 120 ordinary-prose
  runs. Worth its own item.

---

## 7. THE DECISION THAT IS JON'S

**Every single defect, before and after, had an input under 25 words.** With a
minimum input length on Layer B, delivered-bad goes to **0 of 120 on both arms**.

There is nothing to de-watermark in "Hi". A statistical watermark is not present,
let alone detectable, in two words — so Layer B on a tiny paste is spending a
model call and a customer's credit to produce nothing but risk.

**The recommendation: refuse Layer B below about 25 words rather than turning it
off.** It removes the entire remaining defect class, it costs nothing real (no
one is unwatermarking a two-word paste), and it does not touch pricing.

**`UC_ENABLE_LAYER_B=false` is not recommended.** Pricing charges pasted text by
the word *because* the rewrite runs. Switching it off silently recreates the
"customer paying and not receiving" defect that was just fixed for Word
documents, so it is only an option alongside a pricing and copy change — and both
of those are Jon's, not this session's.

A minimum-input rule needs a copy line telling the visitor why a short paste was
refused, so it is a small interface change and therefore also his call.
