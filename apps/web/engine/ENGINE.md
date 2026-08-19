# The un-claude engine: how it works, what it can prove, where it stops

**Written 19 August 2026 at the end of the session that built it.** This is the
complete reference. If you have never seen this project before, read this and
`API.md` and you will know what the engine does and what it cannot do.

**Everything below was measured, not assumed.** Where something is unverified it
says so.

---

## 1. What the engine is

**It finds marks that identify text and files as AI generated, and removes them.**

It is a copy of `guillaumemeyer/watermarks-remover`, MIT licensed, with our own
prompt and our own chunking layer added. Provenance and licence obligations are in
`PROVENANCE.md`, and that file must not be deleted.

**Three layers, and the differences between them decide everything.**

| Layer | Removes | Where the mark lives | Text | Files | Provable | Costs money |
|---|---|---|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | Between the visible words | **Yes** | Yes | **Yes** | No |
| **Metadata** | C2PA provenance, EXIF, XMP, generator tags | In the file's wrapper, not the text | **No** | **Yes** | **Yes** | Almost nothing |
| **B. Statistical watermark** | Patterns in which words the model chose | In the word choices themselves | **Yes** | Yes | **No. Best effort** | **Yes, per run** |

**Paste text and you get A and B. Upload a file and you get all three.**

---

## 2. What each layer actually does, and what it must never claim

### Layer A: invisible characters

**Deterministic. Instant. Free.** It finds characters that cannot be seen, names
them, gives their exact position, and removes or normalises them. Verified live at
every document length in under a second.

**It does NOT remove Anthropic's or Google's watermark, and the site must never
say it does.** Anthropic states directly that no hidden characters are added to
Claude's text. Layer A and the statistical watermark are unrelated problems.

**What layer A is genuinely for, researched and sourced.** In 2025 the team at
Rumi found newer ChatGPT models emitting narrow no-break spaces (`U+202F`) in
longer responses, identical in appearance to ordinary spaces. **OpenAI denied it
was deliberate**, calling it a quirk of large-scale reinforcement learning, and
independent analysis agrees: the training data contained professional multilingual
typography and the models learned to emit it.

**So layer A defends against a real, present, observable tell that catches people
today. It is not a deliberate watermark and must not be called one.**

### Metadata: what is inside a file's wrapper

**Deterministic. Fast. Effectively free.** Verified on a real Office document, a
real PNG carrying content credentials, and a JPEG with injected C2PA and XMP.
**Verified by reading the raw bytes afterwards, not by asking the tool whether it
had worked.** In every case the picture or document content came out byte
identical and only the marks were removed.

**On a Claude-generated file the removable mark is C2PA, and metadata is what
removes it. Not layer A.**

**Who actually marks their files**, researched 18 August 2026:

| Provider | Marks generated files | Note |
|---|---|---|
| **OpenAI** | **Yes.** C2PA on DALL-E 3 and GPT images since Feb 2024, SynthID from May 2026 | On the C2PA steering committee |
| **Anthropic** | **Yes.** Signed C2PA since 2 Aug 2026, on SVG, PNG and JPG | **Not on Word documents** |
| **Google** | **Yes.** C2PA since Nov 2025, plus SynthID on every output | Gemini, Imagen, Vertex, Ads |
| **Adobe Firefly** | **Yes,** all outputs | Originated the standard |
| **Stability, Flux** | **Yes** on hosted APIs | Open-weight versions, no |
| **Meta** | Reads and labels on upload. Own marking less clearly documented | **Re-check before naming it** |
| **Midjourney** | **No** | |
| **xAI Grok** | **Not confirmed.** Visible corner logo only | |

**One caveat that must survive into any copy review.** The Office document proof
used `sample_ai.xlsx`, a test file shipped with the engine repository, **not a
real OpenAI-produced document.** The cleaning worked and was byte verified. What
is *not* yet shown is that a document a real user would have carries those tags.
**Get one real file before Office documents are claimed on the site.**

### Layer B: the statistical watermark

**Best effort. Unverifiable by anyone. Costs money per run.**

**How the watermark works.** Anthropic uses a variant of Google DeepMind's
SynthID-Text. During generation it seeds a function with the preceding few tokens
plus a secret key, samples candidates from the model's true distribution, and
picks a winner by a tournament. Detection recomputes those values from the
observed text and runs a statistical test.

**Two consequences that decide the whole design.**

1. **Signal survives only where runs of consecutive words survive.** Not where
   meaning is similar. Not where vocabulary overlaps. **Only verbatim runs.** So
   the attack objective is breaking runs, not changing words.
2. **Entropy gates where signal can sit.** "two plus two equals four" carries
   none. But entropy is a permission mask, not a targeting map: an edit also
   scrambles the positions after it, so a full rewrite already saturates coverage
   and targeting buys almost nothing. Measured in the literature at **+0.6 points
   against a context-hashed scheme like Anthropic's, versus +42 against a
   context-free one.**

**Nobody can verify removal, including us.** No public detector exists. Anthropic
confirmed on 12 August 2026 that one is in development, with no ship date, access
model or terms. **Every layer B response carries `"verified": false` and a note
saying so.** That ships in the payload rather than depending on the interface to
remember.

---

## 3. The layer B prompt, and why every rule is there

Lives in `rewrite_text.py` as `PROMPTS["unclaude"]`, selected by
`--strength unclaude`. Roughly 200 tokens. **Every rule was added after reading
real output, not from reasoning.**

| Rule | Why it exists |
|---|---|
| **1. Facts survive character for character, and this OUTRANKS every other rule** | Rules 1 and 3 conflict. Nothing told the model which won, so it sometimes dropped a number rather than reuse three words |
| **2. Keep the same length. Do not condense** | Compression was the actual mechanism by which facts disappeared. Prose was coming back at 55 to 69% |
| **3. No runs of more than three consecutive words, subject to rules 1 and 2** | This is the actual attack. The mark lives in verbatim runs |
| **4. Vary sentence length deliberately** | A rewriter that smooths everything makes prose *more* machine-like. Uniformity is itself the tell |
| **5. Copy numbers and dates in exactly the original's form, in both directions** | One model silently turned `eighteen percent` into `18%`. The first version of this rule then caused the reverse, `2028` into `two thousand twenty-eight` |
| **6. Ordinary phrasing, no odd synonyms** | A model produced `semi-decade pact` for `five-year agreement` |
| **7. Output only the rewritten text** | |

**A rule that was added and then removed at Jon's instruction:** forbidding em
dashes in the output. **That was the old humanizer scope creeping back.** This
product removes watermarks; it does not police the model's punctuation. Jon's
no-dash rule governs his own copy only.

**The upstream prompt is still present and is actively worse.** It says "Preserve
all facts, numbers, names, and technical identifiers" with nothing about length or
rule precedence, which reads to a model as *keep the sentences containing them*.
That maximises verbatim runs, which is the exact channel the watermark survives
through. **Do not fall back to it.**

**There is also `PROMPTS["unclaude_retry"]`,** selected as
`unclaude_retry:<comma separated figures>`. It names the dropped figures back to
the model. A blind retry is another roll of the same dice, which is why more
retries alone never converged.

---

## 4. Chunking, and the bug that hid inside it

**A single model call silently truncates.** Measured live: a 3,367 word document
came back as **348 words**, reported as success. That is silent data loss sold as
success and it is the worst failure this product could have.

**`uc_chunk.py` fixes it.** Documents split on paragraph boundaries into chunks of
`UC_LAYER_B_CHUNK_WORDS` words, rewritten concurrently, reassembled in order.

**Chunk size was measured across 28 rewrites at three sizes, and both extremes are
worse:**

| Chunk size | Worst chunk | Mean | All above the 70% floor |
|---|---|---|---|
| 650 words | 66% | 87% | **No** |
| **350 words** | **84%** | **95%** | **Yes** |
| 180 words | 50% | 93% | **No** |

At 650 the model condenses. At 180 it loses the thread and pads or truncates.

### Two guards, and they behave differently on purpose

**The length guard is a hard rejection.** Anything under `MIN_RATIO` (70%) of its
input length raises `TruncatedRewrite` and the whole request fails. **A truncated
document is useless to anybody.** This enforces `04` entry 22: overflow rejects,
never truncates. **The 70% figure is Jon's ruling**, on the grounds that this is a
watermark remover and not a summariser.

**The fact guard is advisory and keeps the best attempt.** It compares every
number in the input against the output, **by value rather than spelling**, so
`thirty-four percent` matches `34 percent`. If figures are missing it retries up
to `RETRIES` times, naming them back to the model, and **keeps the best attempt
rather than discarding it.** Anything still unproven at the end is returned as
`figures_to_check` for the user to verify.

**The fact guard counted compound numbers twice, and it was found on 19 August
2026.** An earlier repair taught it that `thirty-four` is 34 rather than 30 and 4.
**The repair added 34 and left 30 and 4 in the set**, so a source saying
`thirty-four` demanded a 30 in the output, and an output written as `34` looked
like a dropped figure. Every compound word from twenty-one to ninety-nine forced
a retry. Measured on one 674 word document: **ten model calls where three were
needed, 38.4 seconds against a 60 second ceiling, and four times the documented
cost per thousand words.** After the fix, four to five calls. `07-runbook.md`.

**Why the fact guard is advisory, and this is the single most important thing in
this file.** It used to reject the whole document if any chunk dropped a number.
**That is arithmetic suicide.** Fifteen chunks at 95% each survive together only
**46%** of the time, which is exactly the observed half-of-documents failure rate.
**The rewrites were fine all along. The all-or-nothing verdict was throwing them
away.** A truncated document is useless; a document with two figures flagged for
checking is not.

---

## 5. The model, and the rule that constrains the choice

**Currently `mistral/mistral-small`, reached through Vercel AI Gateway.**

**The constraint is broader than "not Claude".** Any vendor that watermarks its
own output would swap one mark for another:

| Vendor | Marks its text | Usable |
|---|---|---|
| **Anthropic** | **Yes.** Every model from 2 Aug 2026, globally, no opt out | **No** |
| **Google Gemini** | **Yes.** SynthID for text | **No** |
| **OpenAI** | Not as of Aug 2026, but signed the EU code of practice | **Risky. See below** |
| **Open-weight models on a third-party host** | **No** | **Yes** |

**OpenAI is the trap.** If it switches text marking on, a product built on it
silently starts re-stamping every rewrite and **nobody would notice, because no
detector exists to catch it.**

**Therefore the model is one environment variable and nothing else.** Swapping it
is a settings change, not a code change. **Somebody must re-check the vendor list
periodically.** That is a standing obligation with no automatic reminder.

### Why this model rather than a better one

Measured across five open-weight models on real text. **Cost is not the deciding
factor and should not be treated as one:** the dearest option was a quarter of a
cent per thousand words.

| Model | Time | Facts | Verdict |
|---|---|---|---|
| `qwen3.7-flash` | **47 to 95s** | Good | **Too slow.** Writes 10,796 tokens of hidden reasoning to produce 539 visible words |
| `openai/gpt-oss-20b` | 8 to 36s | Variable | **Returned an empty answer** when given the seven-rule prompt |
| **`mistral/mistral-small`** | **6 to 7s** | **Best** | **Chosen.** No hidden reasoning, fastest, best fact retention |

**Speed is a hard limit and quality is a gradient.** Vercel kills any function at
60 seconds. The slowest model produced the lowest word overlap and could not be
used at all.

---

## 6. Configuration

Every setting is an environment variable. **Nothing needs a code change to tune.**

| Variable | Value in production | What it does |
|---|---|---|
| `WATERMARKS_REWRITE_BACKEND` | `openai-compatible` | |
| `WATERMARKS_REWRITE_BASE_URL` | `https://ai-gateway.vercel.sh` | **No `/v1`.** The code appends it. Putting it in gives a 404 |
| `WATERMARKS_REWRITE_MODEL` | `mistral/mistral-small` | |
| `WATERMARKS_REWRITE_API_KEY` | **Secret.** Set on Vercel as Sensitive | Never in the repository |
| `UC_LAYER_B_CHUNK_WORDS` | **NOT SET. Code default is 350** | Words per chunk. The default happens to be the measured best value, so this one is correct by accident rather than by configuration |
| `UC_LAYER_B_WORKERS` | **NOT SET. Code default is 8** | Chunks at once. Correct value, unset. If the default ever changes upstream this silently regresses to the 56 second failure below |
| `UC_LAYER_B_RETRIES` | **NOT SET. Code default is 8** | Attempts per chunk. **This table said 3 and that was wrong.** Verified 19 Aug 2026: no `UC_LAYER_B_*` variable is set in production at all, so every default applies. The worst case cost per request is eight times what this document previously implied |
| `WATERMARKS_REWRITE_TEMPERATURE` | 1.0 | Cooled by 0.2 per retry, floor 0.2 |

**`UC_LAYER_B_WORKERS` matters more than it looks.** At 3, the deployed engine
took **56.2 seconds** on a 5,047 word document against a 60 second ceiling. At 8
the same document takes about 22. **The value of 3 existed only to survive a free
credit balance being rate limited.**

---

## 7. Vercel, and three things that will bite

**The engine runs as Python on Vercel, in the same project as the site.** One
hosting company, one bill, no Docker, no second server. This works **only because
PDF is out of scope**: PDF cleaning needs `qpdf`, a system program, and **Vercel
can install Python packages but not system programs.**

**Functions must live in `apps/web/api/*.py`**, not in the Next.js `app/api`
folder. `apps/web` is the Vercel root directory.

**Vercel does not put a function's own folder on Python's import path.** A file
importing its neighbour fails at runtime with `ModuleNotFoundError` while working
perfectly locally. Both functions add their own directory and the engine directory
explicitly, before any local import. **Do not remove those lines.**

**The scan endpoint is deliberately not called `inspect.py`.** That would shadow
Python's built-in `inspect` module, which the engine's own code imports.

### AI Gateway credits

**Adding a card unlocks access. Gateway credits are a separate purchase.** A card
alone leaves the account on free credit, and **free credit is rate limited per
model** regardless of balance. Verified: with $4.99 of free credit and $0.0135
spent, six concurrent chunks failed, three failed, one at a time with five retries
failed, and eventually **even a five word request returned 429.**

**Check the real balance rather than the dashboard:**

```
curl https://ai-gateway.vercel.sh/v1/credits -H "Authorization: Bearer $KEY"
```

---

## 8. What it costs

**Measured, not estimated.** The whole day of building and testing, dozens of
model calls including full document rewrites at five lengths, spent **under two
cents.**

| Operation | Cost | Time |
|---|---|---|
| `/api/scan` | **Nothing** | ~40ms |
| `/api/clean`, no layer B | **Nothing** | ~40ms |
| `/api/clean` with layer B | **~0.06 cents per 1,000 words** typical. **Worst case is eight times that**, because retries default to 8 and are invisible in this figure | 6s for 500 words, 22s for 5,000 |

**Layer A and metadata call no model at all.** Only layer B costs anything, which
is why it is the paid tier.

---

## 9. Proven, and not proven

### Proven, by measurement, live on `un-claude.com`

| | Evidence |
|---|---|
| Layer A on text | 6 planted characters found, named, located, removed, none left |
| Metadata on Office, PNG, JPEG | Marks present before, absent after, **verified against raw bytes**, content byte identical |
| Layer B on short text | 38/38 numbers, 17/17 names, 10.8% surviving runs, 6.9s |
| **Layer B on long documents** | **Five of five: 1,260 to 5,047 words, every number intact, 94 to 100% of length, worst case 22s** |
| **What a run costs, per run** | Words, tokens, retries, chunks, model calls and the gateway's own dollar figure, captured on every request since 19 Aug 2026. `06` row 48 |

### Not proven, and should not be claimed

- **That any watermark was removed.** No detector exists. Nobody can verify this.
- **That a real user's Word document carries C2PA tags.** Only a test fixture was used.
- **Behaviour on quotation-heavy, legal or citation-dense text.** Untested, and it
  is the known weak spot: a quotation that must survive verbatim *is* preserved
  wording by definition.
- **Behaviour on deliberately hostile input** trying to hijack the rewriting model.
- **Anything about PDFs.** Out of scope entirely.

---

## 10. Known limits and the next improvements

| Limit | Detail |
|---|---|
| **Non-deterministic** | Same input twice gives different output. One live run returned 205 of 206 numbers where another returned 206. This is why `figures_to_check` exists |
| **60 second ceiling** | A document beyond roughly 8,000 words would need more workers or a different approach. **Length is not the only way to reach it:** a number-dense 674 word document took 38.4 seconds, because retries follow figures rather than words. `06` row 66 |
| **5 MB upload cap** | In `_shared.py` |
| **No fact check on names** | Only numbers are guarded. A dropped or altered name is not caught |
| **Provider watermarking** | If our chosen host starts marking output we would not know |

**Improvements worth making, in order:**

0. **A time budget on retries, not only a count.** The retry ceiling is 8 per
   chunk and the function ceiling is 60 seconds. Nothing connects them, so a
   number-dense document can spend its whole budget retrying and time out with
   nothing to show. `06` row 66.
1. **Guard names as well as numbers.** Same mechanism, free to compute.
2. **Surface `figures_to_check` in the interface.** It is returned and currently
   unused. It is the honest half of Jon's checklist panel design.
3. **A test suite that runs on demand**, covering length, content type, repeat
   runs for variance, and hostile input.
4. **Reconsider the model** when quality matters more than launch speed. The
   models producing the least surviving wording are the ones that reason before
   writing, and those are the slow ones.

---

## 11. Running it

```bash
cd ~/un-claude/apps/web/engine && python3 server.py --port 8765
```

Needs the environment variables from section 6. Then `POST /clean` and
`POST /inspect` as described in `API.md`.

**The upstream test suite:**

```bash
cd ~/un-claude/engine && .venv/bin/python -m pytest
```

**487 pass, 1 skipped.** Two upstream test files were deleted deliberately because
they test features that were not copied. **If the engine is ever re-copied from
upstream, delete `test_lightweight_skill.py` and `test_precommit_hooks.py` again.**
