MODEL: Opus 5, high effort. URGENT — this is live and affecting paying
customers right now.

THE DEFECT, reported by Jon from the live site 22 August 2026.

He sanitised some text and got back, as his "sanitised output", a
REWRITE OF THE ENGINE'S OWN PROMPT. It began "Here's a fresh take where
the facts remain untouched but the phrasing is entirely new:" and then
restated the rewrite rules — facts must survive, no more than three
consecutive words, length within ten percent, keep 'eighteen percent' as
'eighteen percent', keep the paragraph layout. That is the `unclaude`
prompt in rewrite_text.py, rewritten and handed to a customer.

WHY IT HAPPENS. Diagnosed already; verify before you trust it.

  rewrite_text.py:329 and :390
      "messages": [{"role": "user", "content": prompt}]

  and every prompt in PROMPTS ends:
      "...Output only the rewritten text, with no preamble or commentary."
      "\n\n---\n{TEXT}"

The rules and the customer's text are ONE user message, and the only
boundary between them is a bare `---` line. There is no system role. The
model has no structural signal for which half is instructions and which
half is the thing to rewrite, so it can rewrite the wrong half.

A SHORT INPUT IS THE LIKELY TRIGGER and that is the worst part: when the
text is short the rules dominate the message by volume, so the biggest
block of prose in front of the model IS the rules. Short text is exactly
what a first-time visitor pastes to try the product.

A SECOND SUSPECT, TEST IT: the model changed to mistral/mistral-medium
hours ago. The previous model was mistral-small. Run your reproduction
against BOTH and say whether this is new.

WHAT IT COSTS RIGHT NOW
  - A paying customer receives the prompt instead of their document.
  - The engine's internal prompt is disclosed to anyone who triggers it.
  - It is happening on a site taking real money.

TERRITORY: apps/web/engine/**, apps/web/api/*.py, and this note.
DO NOT TOUCH: pricing, the legal pages, checkout, lib/server/credits.ts.
DO NOT DEPLOY — Jon deploys.

═══ 1. REPRODUCE IT FIRST. Do not fix what you have not seen. ═══
Find inputs that trigger it. Try: a very short input (a sentence, a few
words), an input containing its own `---` line, an input that is itself
instruction-shaped, and an empty-ish or whitespace input. Record which
inputs fail and how often, on both models. Paste the real outputs.

Report the RATE. "It happens sometimes" is not a finding Jon can act on.

═══ 2. THE STRUCTURAL FIX: separate the roles ═══
Put the rules in a `system` message and the customer's text ALONE in the
`user` message. That is a boundary the model is trained to respect,
rather than a horizontal rule it has to infer.

Check the backend supports it — this goes through an OpenAI-compatible
endpoint, so it should. If any backend does not, say so and handle it.

Keep the `---` form only where a system role genuinely is not available.

═══ 3. THE GUARD, AND IT MATTERS MORE THAN THE FIX ═══
Even with roles separated, a model can still return the wrong thing.
Nothing today checks that the output bears ANY relationship to the input.
The existing guards check facts and length. None asks "is this even the
customer's text?"

Add an output guard that rejects a response that does not plausibly
derive from the input. Ideas, pick what you can defend with measurements:
  - overlap with the INPUT below a floor (a real rewrite still shares
    proper nouns, numbers, names, structure)
  - resemblance to the PROMPT above a ceiling — the strongest signal,
    because you know the prompt text exactly
  - a preamble like "Here's a..." when the prompt forbade one

On rejection: retry, and if retries are exhausted, FAIL THE JOB. Do not
hand back a suspect rewrite. The refund path is proven live and a refund
is a far better outcome than a customer receiving our prompt.

BEWARE FALSE POSITIVES. A legitimate aggressive rewrite shares few words
with its input by design — that is the product. A guard that fires on
good output is worse than no guard, because it refunds paying customers
for work that succeeded. Measure the false-positive rate on real rewrites
before recommending a threshold.

═══ 4. WHAT JON NEEDS TO DECIDE, AND YOU SHOULD ASK ═══
`UC_ENABLE_LAYER_B` already exists as an environment variable. Turning it
off stops the rewrite entirely while leaving invisible characters and
metadata — the two provable layers — working.

DO NOT SWITCH IT OFF YOURSELF and do not recommend it lightly: pricing
charges pasted text BY THE WORD because the rewrite runs, so disabling it
silently recreates the exact "customer paying and not receiving" defect
that was just fixed for Word documents. It is only an option alongside a
pricing and copy change, and both are Jon's.

Tell him what you measured and what you recommend. His call.

═══ FINISHING ═══
Jon is not a programmer and cannot check this by reading code. Show the
real inputs and the real outputs, in full, before and after. Show the
rate before and after. A step you skipped is a step that failed.

Write docs/session-notes/prompt-leak.md.

Before EVERY commit run `git diff --cached --name-only`. Never
`git add -A`, `git add .` or `git commit -a`. Do NOT deploy. Do NOT push.
