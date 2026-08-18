# Anthropic Claude Watermarking — Technical Context Document

> **PURPOSE.** This document is a context primer for an AI system assisting with deeper investigation into Anthropic's watermarking of Claude outputs. It is written to be consumed by a model, not a human reader. It prioritizes factual density, explicit provenance, and clear separation between confirmed fact, published research, and inference.
>
> **CURRENCY.** Compiled 17 August 2026. The primary source (Anthropic's technical FAQ) was published 14 August 2026 — three days prior. This is a fast-moving topic; several items flagged `[OPEN]` may have resolved since compilation. Verify anything time-sensitive.
>
> **CONFIDENCE CONVENTIONS.** Every substantive claim carries one of:
> - `[ANTHROPIC]` — stated directly by Anthropic in a primary source
> - `[LITERATURE]` — from peer-reviewed or preprint academic publication
> - `[REGULATORY]` — from EU legal text or official Commission guidance
> - `[INFERRED]` — reasoned conclusion, not directly stated by any source
> - `[OPEN]` — explicitly unknown or unpublished
>
> Do not treat `[INFERRED]` items as established fact. Do not upgrade `[OPEN]` items by assumption.

---

## 1. Executive summary

Anthropic has begun embedding provenance marks in Claude's output to comply with the EU AI Act. Two technically unrelated mechanisms are involved, and conflating them is the single most common error in coverage of this topic:

1. **Text watermarking** — a statistical watermark embedded in token selection during generation. Symmetric-key. Detectable only by a party holding Anthropic's secret key.
2. **C2PA content credentials** — cryptographically signed metadata attached to generated files. Asymmetric-key. Verifiable by anyone, today, with open tooling.

The text watermark is a variant of Google DeepMind's **SynthID-Text**, confirmed by name in Anthropic's FAQ. It works by replacing the source of randomness used in token sampling with a pseudorandom function keyed on a secret plus the preceding context. It does not add characters, does not alter meaning, does not consume extra tokens, and does not measurably affect latency or cost.

**Current state as of compilation:** no publicly available Claude model is confirmed watermarked (all shipping models predate the 2 August 2026 cutoff). Retrofit to older models is committed with a "coming months" timeline. A public detection API is committed but unshipped, with no published pricing or access tier.

**The central structural tension**, which is the most analytically interesting feature of this system: the durable mark (text) is unauditable by any third party, and the auditable mark (C2PA) is trivially destroyed. Neither half provides both durability and independent verifiability.

---

## 2. Timeline and rollout status

| Date | Event | Confidence |
|---|---|---|
| 2022 | Scott Aaronson proposes the design principle underlying this watermark family | `[ANTHROPIC]` |
| Oct 2024 | SynthID-Text published in *Nature* by Google DeepMind | `[LITERATURE]` |
| Jul 2026 | Anthropic signs EU Code of Practice on Transparency of AI-Generated Content, alongside ~190 total signatories | `[ANTHROPIC]` |
| 2 Aug 2026 | EU AI Act Article 50 becomes enforceable. Claude models launched on or after this date support marking at launch | `[ANTHROPIC]` `[REGULATORY]` |
| 11 Aug 2026 | Anthropic support-center article published documenting marking scope | `[ANTHROPIC]` |
| 14 Aug 2026 | Anthropic technical FAQ published, naming SynthID-Text and detailing mechanism | `[ANTHROPIC]` |
| "coming months" | Retrofit of watermarking to pre-2 Aug models | `[ANTHROPIC]` |
| "soon" | Public watermark detection API | `[ANTHROPIC]` |

### 2.1 Which models are marked

`[ANTHROPIC]` Marking applies to models **launched on or after 2 August 2026**. The EU law provides a transition period for earlier models; Anthropic states it is working to add watermarking to those and will roll it out over the coming months.

`[INFERRED]` As of compilation, all publicly available Claude models predate the cutoff. No currently shipping model is confirmed to carry the text watermark.

`[INFERRED]` **Critical framing for investigation:** watermarking status is a property of a specific model version, not a provider-wide boolean. A retrofit can activate on an existing model ID without a version bump or announcement. Any empirical work must therefore pin the exact model identifier and date, and cannot assume that a result obtained on one date holds on another.

### 2.2 Deployment scope

`[ANTHROPIC]` Marking is applied at the model level, meaning it covers all surfaces: consumer apps, the API, Claude Code, Cowork, Tag, and Claude accessed via third-party clouds (AWS, Google Cloud, Microsoft Foundry).

`[ANTHROPIC]` Applied **globally**, not scoped to the EU. Anthropic's stated reason is that it does not yet have a durable way to scope by region, and it explicitly frames this as provisional — it will continue evaluating approaches and share updates.

`[INFERRED]` This is an engineering-constraint explanation, not a policy commitment to global marking. Regional scoping is a live possibility. Do not model global application as permanent.

---

## 3. The two mechanisms — do not conflate

| Property | Text watermark | C2PA content credential |
|---|---|---|
| What it marks | Generated text | Generated files (.png, .jpg, .svg and other supported types) |
| Where it lives | In the token choices themselves | In file metadata, alongside content |
| Cryptography | **Symmetric** — one secret both embeds and detects | **Asymmetric** — private key signs, public key verifies |
| Who can verify | Only a holder of Anthropic's key | **Anyone**, with any C2PA-aware tool |
| Independent audit | Structurally impossible | Structurally trivial |
| Survives copy-paste | Yes | No (metadata does not travel with copied pixels) |
| Survives re-save / format conversion | Yes (text is unchanged) | No |
| Survives paraphrase / rewrite | No | N/A |
| Alters the content | No | No — nothing in the file changes |
| Available today | No (no marked models shipping) | Yes |

`[ANTHROPIC]` Anthropic explicitly states the C2PA metadata label is very different from a watermark: nothing in the file changes, and the credential is neither embedded nor hidden.

`[ANTHROPIC]` C2PA is the same open industry standard used by camera manufacturers and photo-editing software. Any C2PA-aware tool can read it. Anthropic states it will also provide its own drop-a-file checker.

---

## 4. Text watermark — technical mechanism

### 4.1 Lineage and family

`[ANTHROPIC]` Claude's text watermark is a version of **SynthID-Text**, published by Google DeepMind in *Nature* (2024). It belongs to a family originating with a 2022 proposal by Scott Aaronson.

**This lineage matters and is frequently misreported.** There are two distinct branches of LLM text watermarking, and most popular explainers describe the wrong one:

| | **Branch A — distribution reshaping** | **Branch B — randomness substitution** |
|---|---|---|
| Canonical work | Kirchenbauer et al., "A Watermark for Large Language Models" (ICML 2023) | Aaronson (2022) → SynthID-Text (Nature 2024) |
| Mechanism | Partition vocabulary into green/red lists; add a bias δ to green-list logits | Leave the distribution alone; replace the RNG that selects among candidates with a keyed PRF |
| Effect on distribution | Distorts it (biased toward green tokens) | Can be non-distortionary (marginal distribution preserved) |
| **Used by Anthropic** | **No** | **Yes** |

`[ANTHROPIC]` Anthropic's own framing confirms Branch B: the watermark only changes the *source* of the randomness used to pick among words. Choices are still random; the randomness now derives from the key plus preceding words rather than an arbitrary RNG.

`[INFERRED]` Any analysis built on the green-list/red-list model will produce subtly wrong predictions about Anthropic's system — particularly regarding output quality effects and detection statistics. Investigations should be grounded in the SynthID-Text paper, not the Kirchenbauer paper, though the latter remains useful for intuition and for the general detection-statistics framework.

### 4.2 Where it operates in the stack

`[LITERATURE]` SynthID-Text is implemented as a **logits processor** applied in the generation pipeline after Top-K and Top-P filtering. It augments the model's output using a pseudorandom g-function.

`[INFERRED]` Architectural consequences, all significant:
- The model has no awareness of the watermark. It is not in the weights, not in the system prompt, not in training.
- It cannot be disabled by prompting, jailbreaking, or instructing the model.
- It is largely model-agnostic, which is why retrofitting to older models is plausible on a months-scale timeline — the engineering constraint is deployment and determinism management, not research.
- It applies to any text the model generates, regardless of task framing.

### 4.3 Tournament sampling — the core algorithm

`[LITERATURE]` The mechanism, per the SynthID-Text publication:

1. At generation step *t*, seed a pseudorandom function (PRF) using the **preceding *k* tokens** (the watermarking context window) plus the **secret key**.
2. Sample *n₀* = 2^*L* candidate tokens from the model's original (unmodified) probability distribution.
3. Compute a pseudorandom **g-value** for each candidate from the seeded PRF.
4. Run an *L*-layer single-elimination tournament. Candidates are paired; in each match the token with the larger g-value advances.
5. After *L* layers, the single surviving token is emitted.

`[LITERATURE]` Because candidates are drawn from the true distribution and the tournament only arbitrates among them using pseudorandom values, the scheme can be configured to be **non-distortionary** — preserving the marginal token distribution — or **distortionary**, trading quality for detectability. Both configurations reportedly outperform prior approaches in their respective categories.

`[ANTHROPIC]` Anthropic's plain-language version: for "The weather today was cold and…", both "overcast" and "grey" are acceptable and the choice would normally be settled by a random number. Watermarking settles it with the key instead. Critically, Anthropic notes the watermark does **not** push the model toward words it would not otherwise consider — their example is that it would not cause selection of "nubilous," an obscure synonym the model would never normally use.

`[INFERRED]` That last point is a meaningful constraint on the mechanism: the watermark operates strictly within the set of tokens the model already assigned meaningful probability. It cannot introduce lexical artifacts. This is a testable prediction and a useful discriminator against Branch A schemes, which *can* surface lower-probability tokens via logit bias.

### 4.4 Anthropic's own analogy (useful for framing)

`[ANTHROPIC]` Consider Monopoly played with a book of the digits of π instead of dice. Start at a randomly chosen digit and use successive digits as rolls. Gameplay is indistinguishable from dice — the moves are effectively random and the outcome distribution is unchanged. But an observer who knows π and sees the full move sequence can determine the game likely drew from it. Anthropic notes the analogy is imperfect (π digits run 0–9, Monopoly dice 1–6) but the principle holds: π is technically deterministic, yet any run of digits from its middle is indistinguishable from true randomness.

### 4.5 Detection

`[LITERATURE]` Detection recomputes g-values from the observed text using the key and tokenizer, then aggregates (mean g-value across tokens) and applies a statistical hypothesis test. Unwatermarked text scores near the ~0.5 baseline; watermarked text scores above it.

`[LITERATURE]` Detection is computationally cheap and **does not require access to the underlying LLM** — only the text, the key, and the tokenizer.

`[ANTHROPIC]` Output is a **likelihood**, not a binary verdict. The question the key can answer is framed by Anthropic as: what is the likelihood this was partly written by Claude? Confidence increases with passage length.

`[INFERRED]` Detection is **stateless**. No log of generated outputs is consulted. This is a distinct architecture from *retrieval-based* provenance (maintaining a database of outputs), which the SynthID-Text paper discusses as a separate strategy and which Anthropic is **not** using. Claims that Anthropic maintains a searchable record of Claude outputs are unsupported.

### 4.6 Performance characteristics

`[ANTHROPIC]` No extra tokens are produced; the model costs the same to serve and use. Impact on speed is negligible.

`[LITERATURE]` The SynthID-Text paper reports latency overhead of approximately **0.57%**, with computational complexity remaining constant as model size grows.

`[ANTHROPIC]` Quality impact: internal testing showed no effect on content, creativity, or readability. Google DeepMind's validation served watermarked generation to a portion of live Gemini traffic and compared thumbs-up/thumbs-down ratings, finding no statistically significant difference. A separate controlled study with human raters comparing watermarked and unwatermarked answers side by side found no perceptible quality difference.

---

## 5. What the watermark does and does not carry

### 5.1 Explicitly does NOT contain

`[ANTHROPIC]` All of the following are stated directly:
- **No user identification.** Nothing in the watermark or its key permits recovery of information about a user, organization, or conversation.
- **No hidden characters.** Nothing is added to the text. There are no zero-width spaces, homoglyphs, Unicode tags, or steganographic insertions of any kind.
- **No change to ownership or legal responsibility.** The watermark does not affect authorship, ownership, or a user's rights under Anthropic's terms.

`[INFERRED]` The "no hidden characters" statement is a direct, citable refutation of a widespread misconception, and it invalidates an entire category of purported detection and removal tooling built around Unicode scrubbing (see §8.4). Any tool claiming to detect Claude's watermark by inspecting characters is operating on a false premise.

### 5.2 What a positive detection actually establishes

`[ANTHROPIC]` A watermark can only determine that Claude was **likely involved with the content at some point**. It explicitly cannot distinguish "Claude wrote this" from "Claude heavily edited this."

`[ANTHROPIC]` Further stated limitations:
- It does **not** confirm text was human-written.
- It does **not** detect text from a different AI. Another watermarking provider would use a different key and possibly a different method entirely.
- It performs poorly on **short samples**, where fewer word choices yield less signal.

`[INFERRED]` The system is **authorship-agnostic and provider-specific**. It answers "was Claude in this pipeline?" — not "who wrote this?" and not "was this AI-generated?" The gap between what it measures and what institutional users will want it to mean (proof of authorship) is the primary misuse vector and warrants investigation independent of the technical mechanism.

---

## 6. Behavior across content types

The controlling variable is **entropy** — the amount of genuine choice available at each token. Where the model has multiple equally-good options, signal accumulates. Where output is constrained, nothing embeds.

| Content type | Watermark strength | Basis |
|---|---|---|
| Creative / discursive prose | Strong | High entropy, many equivalent choices |
| **Translation produced by Claude** | **Full strength** | `[ANTHROPIC]` Every word is chosen by Claude |
| Factual statements | Sparse | `[ANTHROPIC]` Fewer choices available without reducing accuracy |
| Code | Weak | `[ANTHROPIC]` Exactness required; mark applies mainly in comments |
| Proofreading / grammar-only edits | Near-zero | `[ANTHROPIC]` Mark can only attach to the handful of corrections |
| Short passages | Insufficient | `[ANTHROPIC]` Too few choices for reliable signal |

`[ANTHROPIC]` Worked examples given by Anthropic:
- "Isaac Newton's most famous work was called *Principia*…" — the next word must be "Mathematica"; there is nothing for the watermark to act on.
- "2 + 2 =" — there is no equally-good alternative to "4", so the nudge is not applied. (Anthropic notes the wry exception that if discussing Orwell's *Nineteen Eighty-Four*, "5" becomes the correct completion.)

`[ANTHROPIC]` On code specifically: where an exact output is required — where a different term would break the code or make it factually wrong — the watermark is not applied. Where arbitrary choice exists within code, such as in comments, it can be used. Anthropic states this has a negligible effect on the actual code produced.

`[ANTHROPIC]` On editing human text: the watermark applies only to words Claude chooses. When Claude proofreads human writing, nearly all words remain the person's, so there is very little for the mark to attach to. Whether the changes suffice for detection depends on text length and edit depth.

`[INFERRED]` **The translation case is the most counterintuitive and analytically important.** There is a directional asymmetry worth stating precisely:
- Translating **Claude's watermarked output using a different tool** destroys the mark (token sequence is fully regenerated by an unkeyed system).
- Translating **any text using Claude** applies a fresh, full-strength mark, because Claude selects every output token.

This generalizes: any full regeneration through Claude re-marks the output regardless of the input's provenance. This has direct implications for pipeline design and for any empirical robustness testing — a rewrite performed by Claude is not a removal, it is a re-application.

---

## 7. Detection architecture and the verification asymmetry

This section contains the document's most significant analytical content. It is largely `[INFERRED]` and should be treated as an argument to evaluate, not established fact.

### 7.1 The key cannot be published

`[INFERRED]` Anthropic's key must remain secret permanently. Two independent reasons:

1. **Evasion.** With the key, an adversary can compute which tokens carry signal and modify only those, converting removal from a blunt full-rewrite into a minimal-edit operation.
2. **Forgery.** More serious and less discussed: a symmetric key that detects can also *embed*. Key disclosure would permit stamping Claude's watermark onto arbitrary human-written text, causing the detector to attribute it to Claude. `[LITERATURE]` The general attack class is documented — piggyback attacks maliciously alter watermarked text while preserving the mark, damaging provider reputation.

`[INFERRED]` Therefore detection is architecturally forced into a hosted-service model: text in, score out, key never leaves Anthropic's infrastructure. This is not a business decision that could be reversed under pressure; it is a constraint of symmetric-key watermarking.

### 7.2 The consequence: verification is never independent

`[INFERRED]` When the detection API ships, users will not be *verifying* provenance. They will be *querying Anthropic and trusting the response*. There is no mechanism by which any third party — researcher, regulator, journalist, or court — can independently confirm the detector's accuracy, false-positive rate, or honest operation, because doing so requires the key.

`[INFERRED]` Contrast with C2PA, which uses asymmetric signing and is therefore fully auditable by anyone. The result is the structural tension named in §1:

> **The durable mark is unauditable. The auditable mark is fragile.**

This is, so far as this compilation found, underexamined in public discussion and represents a strong candidate for deeper investigation.

### 7.3 The oracle problem

`[INFERRED]` A freely accessible, unlimited detection API functions as an evasion oracle: an adversary can iterate modifications until the score drops. A gated or metered API restricts third-party verification — including verification of Anthropic's own transparency claims — to parties able to pay or obtain access. There is no configuration that satisfies both. Rate limiting is the only real lever.

`[INFERRED]` This tension predicts the eventual access model: metered, rate-limited, likely tiered, with abuse controls specifically designed against systematic before/after query patterns.

### 7.4 Precedent — Google SynthID Detector

`[INFERRED]` The nearest available precedent for how a detection portal gets released. Google's SynthID Detector launched to early testers with a waitlist prioritizing journalists, media professionals, and researchers. Text detection lagged behind image detection. Roughly fifteen months later it remains not openly public. Google did open-source the watermarking *framework* — but that lets third parties embed with their own keys; detection against Google's production keys stayed gated.

`[INFERRED]` If Anthropic follows this pattern, expect: narrow initial access, credentialed gating, text later than files, and slow widening.

### 7.5 Distinction from heuristic AI detectors

`[ANTHROPIC]` Anthropic explicitly distinguishes watermark detection from AI-detection services such as Pangram. Those providers lack the key and instead analyze stylistic tells — Anthropic cites the "this isn't [X], it's [Y]" construction and unusually frequent use of "quietly" as examples. Pattern-matching on style is fundamentally different from checking a watermark.

`[INFERRED]` These two categories have completely different error profiles. Heuristic detectors produce false positives on human writing that resembles AI style (a documented harm, particularly for non-native English writers). Watermark detection has a different failure mode: false negatives on short, low-entropy, or heavily edited text. Investigation should never treat them as interchangeable or compare their accuracy on a single axis.

---

## 8. Robustness and limitations

### 8.1 Anthropic's own position

`[ANTHROPIC]` Asked directly whether editing can circumvent the watermark, Anthropic's answer is: to some extent, yes. Light editing probably will not remove it completely. A complete rewrite replacing every word will. Anthropic adds a pointed observation — in that case it is arguable whether the text can still be described as AI-generated at all.

`[INFERRED]` That framing is analytically stronger than most commentary on the subject. If defeating the watermark requires regenerating essentially all of the text, the human or system performing that rewrite has arguably become the author. The mark's fragility and its semantic validity are coupled rather than in tension.

### 8.2 Published robustness findings

`[LITERATURE]` The academic picture is consistent and unflattering to watermark durability:
- A single round of LLM paraphrasing reduces detection rates of all evaluated watermarking schemes below 0.3. Detection falls below 0.15 after a few paraphrasing rounds.
- Documented removal attack classes include token editing, synonym substitution, paraphrasing, and back-translation.
- Adaptive reinforcement-learning-based attacks have reported 98.5% removal success while preserving semantic fidelity, generalizing across five model sizes and ten watermarking schemes. The authors characterize adaptive attacks as a fundamental threat to current watermarking defenses.
- SynthID-Text specifically has a documented unimodality property in its detection-rate curve that can be exploited.

`[INFERRED]` Note the tension between §8.1 and §8.2: Anthropic says a *complete* rewrite is required; the literature reports that a *single* paraphrase pass suffices to substantially degrade detection. These are not necessarily contradictory — "removed completely" and "detection rate below 0.3" are different thresholds — but the gap is real and is a productive line of inquiry. Resolving it empirically requires a detector, which does not yet exist publicly.

### 8.3 The verification gap cuts both ways

`[INFERRED]` Because no public detector exists, robustness claims currently cannot be validated by anyone outside Anthropic and DeepMind. This applies symmetrically:
- Anthropic's claims about durability are unverifiable by third parties.
- Any claim that a transformation removed the mark is equally unverifiable.

Every present-day assertion about Claude watermark removal is therefore unfalsifiable. Treat all such claims — including those in tooling and marketing — as unsupported until a detector ships.

### 8.4 Case study: existing removal tooling

A representative public tool (`guillaumemeyer/watermarks-remover`, GitHub) is instructive for what such tools actually contain. Its three layers:

| Layer | Function | Effectiveness vs. Claude text watermark |
|---|---|---|
| Unicode scrubbing | Strips zero-width spaces, bidi controls, tag characters, homoglyphs | **Zero.** `[ANTHROPIC]` confirms no characters are added. Targets a different watermark class entirely. |
| Statistical rewrite hook | Calls an external model to paraphrase; default backend merely prints a prompt | Literature-standard paraphrase. No novel technique, no key recovery, no targeted suppression. |
| File metadata cleaning | Strips C2PA, EXIF, XMP via exiftool/c2patool | Works — but defeats a mechanism Anthropic already documents as strippable by re-saving or format conversion. |

`[INFERRED]` The repository's own documentation concedes that until vendors ship public detectors, no tool can honestly certify that removal succeeded. It also notes a genuine technical point: rewriting Claude text *with Claude* re-applies the mark rather than removing it (consistent with §6). The project is early-stage (single-digit stars, v0.0.1) and should be read as an illustration of the category's ceiling, not as state of the art.

`[INFERRED]` **General finding for investigation:** the difficulty in this domain is not transformation, which is trivial. It is *measurement*, which is gated behind a key held by one party. Any analysis of this space should center measurement asymmetry rather than transformation technique.

---

## 9. Regulatory context (abbreviated)

Included for background only. Not the focus of investigation.

`[REGULATORY]` **EU AI Act, Regulation (EU) 2024/1689, Article 50** — transparency obligations, enforceable **2 August 2026**. Four obligations split between *providers* (who build and ship AI) and *deployers* (who use it in their own products):

- **50(1)** — Providers: inform people they are interacting with an AI system, unless obvious.
- **50(2)** — Providers of generative systems: ensure outputs are marked in a **machine-readable format and detectable as artificially generated or manipulated**. ← *This is the obligation driving Claude watermarking.*
- **50(3)** — Deployers of emotion-recognition or biometric-categorisation systems: inform exposed persons.
- **50(4)** — Deployers: disclose deepfakes, and AI-generated text published to inform the public on matters of public interest. Broad exemption where human editorial review occurred and a person or entity holds editorial responsibility.

`[REGULATORY]` **The feasibility standard.** 50(2) requires technical solutions to be effective, interoperable, robust and reliable **"as far as is technically feasible,"** accounting for content-type limitations, implementation cost, and generally acknowledged state of the art.

`[INFERRED]` This clause is why a watermark that degrades under paraphrase satisfies the law. The regulation demands best available practice, not unbreakable provenance. Critiques premised on "the watermark is defeatable therefore non-compliant" misread the statute.

`[REGULATORY]` **Carve-out:** 50(2) does not apply where the AI performs an assistive function for standard editing, or does not substantially alter input data or its semantics — consistent with the near-zero marking on proofreading described in §6.

`[ANTHROPIC]` **Code of Practice.** Anthropic signed the EU Code of Practice on Transparency of AI-Generated Content in July 2026, alongside approximately 190 total signatories. This is an industry-wide floor, not an Anthropic-specific policy. Other major model developers have signed and will implement their own watermarks with their own keys.

`[REGULATORY]` **Penalties:** up to €15 million or 3% of global annual turnover, whichever is higher. Enforcement is split between national market surveillance authorities, the AI Office, and the European Data Protection Supervisor.

---

## 10. Open questions

Explicitly unresolved as of 17 August 2026. These are the highest-value targets for investigation.

**Mechanism parameters** `[OPEN]`
- Watermarking context window depth *k* (number of preceding tokens seeding the PRF)
- Tournament depth *L* / number of candidates 2^*L*
- Whether Anthropic runs the non-distortionary or distortionary SynthID configuration
- Whether and how Anthropic's variant deviates from published SynthID-Text
- Key rotation policy — single persistent key, per-model keys, or rotating keys
- Detection thresholds and the length floor for a usable result

**Detection access** `[OPEN]`
- Pricing, rate limits, access tier
- Whether a consumer-facing paste-text interface will exist or API-only
- Whether output is a raw p-value, a calibrated confidence band, or a categorical verdict
- Abuse controls and how they treat systematic query patterns
- Whether third-party auditing of detector accuracy will be permitted in any form

**Rollout** `[OPEN]`
- Retrofit timing and per-model sequencing; which legacy models are in scope and which are excluded
- Whether regional scoping will replace global application, and on what timeline
- Whether marking status will be exposed in API responses or model metadata

**Empirical** `[OPEN]`
- Actual detection rate as a function of passage length, entropy, and edit depth
- Reconciliation of §8.1 vs §8.2 (complete-rewrite vs single-paraphrase thresholds)
- False positive rate on human text, and on other AI providers' text
- Real marking density in code across languages and comment ratios

---

## 11. Sources

**Primary — Anthropic**
- "How Claude's text watermark works," 14 Aug 2026 — https://www.anthropic.com/news/claude-text-watermark *(principal technical source)*
- "How Claude marks AI-generated content," support center, updated 11 Aug 2026 — https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content

**Primary — academic**
- SynthID-Text, *Nature* (2024) — https://www.nature.com/articles/s41586-024-08025-4 *(the method Anthropic names)*
- Kirchenbauer et al., "A Watermark for Large Language Models," ICML 2023 — Branch A; useful for detection statistics, **not** Anthropic's method
- Aaronson (2022) — originating proposal for Branch B

**Regulatory**
- EU AI Act Article 50 full text — https://artificialintelligenceact.eu/article/50/
- Commission FAQ on Article 50 transparency obligations — https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- Commission guidelines on transparency for AI-generated content — https://digital-strategy.ec.europa.eu/en/policies/guidelines-transparency-ai-generated-content
- Code of Practice signatory announcement — https://digital-strategy.ec.europa.eu/en/news/strong-backing-code-practice-transparency-ai-generated-content

**Standards**
- C2PA — https://c2pa.org/

**Tooling referenced**
- `guillaumemeyer/watermarks-remover` — https://github.com/guillaumemeyer/watermarks-remover

---

## 12. Common errors to avoid

Recurring mistakes observed in public coverage. Flag these if they appear in reasoning.

1. **Conflating the text watermark with C2PA.** Different cryptography, different durability, different verifiability. Nearly every claim about "Anthropic's watermark" is true of one and false of the other.
2. **Describing the mechanism as green-list/red-list logit biasing.** That is Branch A. Anthropic uses Branch B.
3. **Assuming hidden characters are involved.** Explicitly denied by Anthropic. Invalidates character-inspection tooling.
4. **Treating detection as binary.** It is a likelihood with a length-dependent floor and an abstention region.
5. **Treating detection as proof of authorship.** It indicates involvement, not authorship, and cannot separate writing from heavy editing.
6. **Assuming current models are watermarked.** As of compilation, none confirmed. Pin the model ID and date.
7. **Assuming Anthropic logs outputs.** Detection is stateless and keyed; no output database is implied or required.
8. **Treating global rollout as policy.** Anthropic frames it as a temporary technical limitation.
9. **Assuming a paraphrase performed by Claude removes the mark.** It re-applies it at full strength.
10. **Treating "defeatable" as "non-compliant."** The statute requires feasibility-bounded best effort, not unbreakability.
