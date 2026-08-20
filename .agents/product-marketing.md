# Un-Claude: product marketing context

**Written 19 August 2026, rewritten the same day to Jon's notes.** This is the
foundation document every marketing skill reads before it writes a word.

**This site exists to sell.** It converts a visitor into a credit purchase. Write
confident, technical, commercial copy that makes a coherent and convincing
argument, and stop short of a claim that is explicitly false. **Jon is the final
arbiter on every sentence.**

**Section 13 sets the line.** Read it before writing anything.

---

## 1. Product overview

**One liner.** Un-Claude finds the marks that identify text and files as AI
generated, and removes them.

**Category.** AI content sanitiser. Not a humanizer, `04` entries 18 to 24.

**The word is "sanitise", not "remove the watermark".** `04` entry 70. For layer B
nobody can yet say the watermark was removed. **Sanitise claims the work.**

**Three layers.**

| Layer | Removes | Pasted text | Files | Status |
|---|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | **Yes** | Yes | **Provable now** |
| **Metadata** | C2PA content credentials, EXIF, XMP, generator tags | **No. Needs a file** | **Yes** | **Provable now** |
| **B. Statistical watermark** | Patterns in word choice, removed by rewriting | Yes | Yes | **Imminently provable** |

**Paste text and you get A and B. Upload a file and you get all three.**

**Business model.** Credit packs. One credit buys 1,000 words, a file with no words
is a flat credit. $4.99, $9.99 and $24.99 for 10, 25 and 100 credits. `04` entry 67.

**The landing page is the product.** `04` entry 20. The tool sits above the fold
and works without an account.

---

## 2. Target audience

**Consumers. B2C.** One person deciding for themselves in a few minutes. **There is
no buying committee, no procurement, no trial to team motion.** Every B2B instinct
a marketing skill has is wrong here.

**Two overlapping groups, and the site serves both.**

- **People who have just learned AI writing is watermarked** and that institutions
  can check. The majority. Often students, and not only students.
- **Somewhat more technical people** who understand what metadata is and want a
  content credential or a watermark off a file.

**They are on a phone.** Traffic expected from TikTok, and Jon has made mobile a
first class constraint rather than a later pass. `04` entry 70.

---

## 3. What they know and what they do not

**What they know:** the category. Marks exist, institutions can check, their work
might carry one. **They arrive informed and concerned, not curious.**

**What they do not know:** the mechanism. Which layer, which model, what is
actually detectable. **They cannot tell the three layers apart.**

**The consequence, and it is the central structural rule of the page.**

**Most of them came for the Claude text watermark, and that one cannot be shown.**
It is not a character, not metadata, not anything with a position in a document.
It is the words themselves. **So a page built entirely on "paste it and watch us
find it" has nothing to show the person who came for the main thing.**

**Therefore the page teaches.** What the three layers are, which applies to them,
what to expect from each. **Clear, confident, plain teaching is the conversion
mechanism here, not a detour from it.** Someone who understands why word choice
carries a mark understands why a rewrite is the answer, and that is who buys.

**Demonstration carries its weight where a mark is real and visible:** hidden
characters named and positioned, metadata read out of a file, and the producer
name. **"Made by Stability AI" is a headline finding, not a footnote.**

---

## 4. Problems and pain points

1. **They cannot see the marks.** That is the product. Characters are invisible,
   metadata sits in the file wrapper, the statistical mark is in word choice.
2. **They cannot check their own work.** No consumer tool tells them what their
   document carries before they hand it over.
3. **The mark flags people who did the work.** Anthropic's own material says a
   detected mark means Claude **processed** the content, not that Claude wrote it.
   **Someone who wrote their own essay and edited it with Claude carries the same
   mark as someone who generated the whole thing.** This is the emotional centre
   of the pitch and it is entirely factual.
4. **The stakes are high and the price is low.** That argues for confident and
   specific, not loud.

---

## 5. Competitive landscape

**Under-researched. Flagged rather than filled in. Do not write competitive copy
from this section without checking first.**

**Recorded:** GPTZero studied for layout, humanizeai.pro for tidiness,
deepai.org rejected.

**Structurally, three alternatives:**

- **Humanizers and detector-bypass tools.** They rewrite. **That is layer B
  alone.** As far as this project has checked, none touch invisible characters or
  file metadata.
- **Doing nothing.** The largest competitor by volume.
- **Rewriting by hand.** Slow, and it cannot touch metadata, because metadata is
  not in the words.

---

## 6. Differentiation

**1. Three layers, not one.** Competitors rewrite and stop. **Un-Claude does the
two provable layers first.**

**2. Metadata is the layer nobody else has.** A file from Claude, ChatGPT, Gemini,
Firefly or a hosted Stability endpoint carries a signed C2PA credential **that
anyone can read with a free public tool, today.** We remove it and show the file
before and after, byte verified.

**3. The engineering is real and specific.** A targeted structural rewrite that
breaks the verbatim word sequences the mark rides on, holding runs to three words,
with facts and length preserved and measured.

**4. Receipts, computed live.** Wording replaced, longest surviving original run,
figures carried through, length preserved.

**5. The producer name.** The scan says what made the file. It is the moment the
visitor watches the tool read their own document.

---

## 7. Objections

| Objection | The answer |
|---|---|
| **"Does it actually work?"** | **Layers A and metadata: yes, provably, and here are the marks and the file before and after.** Layer B: verification becomes available when Anthropic ships its detection API. Until then we describe the engineering and report what we measure. |
| **"So you cannot prove the rewrite works?"** | **A targeted structural rewrite that breaks the word sequences the mark depends on. Facts preserved. Length preserved.** We report the measured share of three word sequences broken. **We stop short of claiming a verified defeat, because nobody can verify it yet.** |
| **"Will it ruin my writing?"** | **Facts persist. Length is preserved.** Numbers, dates and names are checked against the original and the chunk retries if one drifts. Length holds within about a tenth. |
| **"Can my school actually detect this?"** | **Anthropic has committed publicly to a detection API anyone can use. It is not callable yet.** Coming, not live. See section 13. |

**Anti-personas.** Anyone with a PDF, not in version one. Anyone wanting a
guaranteed verified defeat of the text watermark, which nobody can offer yet.
Enterprise and team buyers, no such motion exists.

**"Is this cheating" is not answered on the landing page.** The site states what
the labs do and lets the visitor conclude. **Jon writes the mission page in his own
voice and will call the labs unethical, illegal and immoral there.** That is his
and it does not belong on the home page.

---

## 8. Switching dynamics

- **Push.** They found out the marking is real and universal, and their work may
  already carry it.
- **Pull.** A free instant scan needing no account that shows them something true
  about their own document.
- **Habit.** None. No incumbent. A first purchase in a category they learned about
  this week.
- **Urgency, and it is real rather than manufactured.** **Anthropic's detector is
  announced and not yet live.** That gap is the reason to act now.
- **Anxiety.** "Will this damage my work", answered by facts and length preserved.

---

## 9. Customer language

**Under-researched. Flagged rather than invented.**

**Confirmed vocabulary:** sanitise, hidden characters, metadata, watermark, scan,
content credential.

**"Metadata", never "provenance", anywhere a visitor can read it.** `04` entry 78
ruling 1. Metadata is the umbrella: EXIF, XMP, generator tags **and** C2PA
provenance. **Code identifiers keep the old name deliberately** and are not churn
worth spending.

**Needs research before use in copy:** the words this audience actually uses, and
**any named third party detection product, which must not appear on a guess.**

**Register.** Short sentences. Confident. Technical enough to sound engineered,
plain enough to read on a phone.

---

## 10. Brand voice

**Confident, technical, plain.** Big-technology marketing register: sounds
engineered, reads simply. **No hedging in the first screen. No lab report.**

**Restrained on the landing page.** State what the labs do, accurately, and let the
visitor conclude. Jon's register: "AI tools now mark what they make. Invisibly, and
without telling you." **No adjectives. The secrecy does the work.** The stronger
voice is Jon's and it lives on the mission page.

**Hard rules.**

- **No em dashes and no en dashes** anywhere a visitor reads. `docs/05` section 2.
  **Jon's style rule for his site and documents. It never governs the engine.**
- **"Sanitise", not "remove the watermark".**
- **"Un-Claude".** Capital U, capital C, hyphenated. Display name only.
- **Claude forward.** `04` entry 36. Capability is general, marketing leads with
  Claude, other labs named less prominently.

**Marketing may be enticing and deliberately ambiguous. It stops short of
explicitly false. Final wording authority is Jon's, on every sentence.**

---

## 11. Proof points

**Figures come from our own measured test data and from sourced public reporting.
Measure it, then say it. Do not put a number on the page that nobody ran.**

**Live and available:**

- **The producer name.** The scan says what made the file.
- **The file before and after**, byte verified.
- **Named hidden characters** with exact positions.
- **The live rewrite receipt:** wording replaced, longest surviving original run,
  figures carried through, length preserved.
- **The measured share of three word sequences broken by the rewrite**, which
  belongs beside the run length chart where it explains something.
- **The publication marquee.** Nine outlets on real artwork. **A logo goes in only
  if it links to a real article from that outlet about the watermark.** Citation,
  not endorsement.

**Live in the hero, and the rule that put it there.** `04` entry 78 ruling 3. Two
attempts failed identically: a claim about one layer is wrong for the other two.
**A claim in a whole-service slot must be true of the whole service.** What
replaced them: **Free**, **Nothing stored**, **Nothing lost**, sharing one job of
removing a reason not to try. **"Nothing stored" is measured:** uploads capped at
5 MB, held for the length of the request, deleted. Hidden below `lg`.

**Parked, with sources, in `docs/PARKED-CONTENT.md`.** Removed for placement, not
accuracy. Read why one came off before reinstating it.

**Not yet claimable.** Office documents were verified on `sample_ai.xlsx`, a test
file shipped with the engine, **not a real user document.** Get one real file
before Office documents are claimed.

---

## 12. Goals

**A credit purchase.** Jon's ruling.

**Billing ships before the site goes live**, so write for a working checkout rather
than around a missing one. Stripe is the remaining build, `CURRENT-HANDOFF.md`.

**The ladder:** a free scan, the finding lands, sign in, the paywall after 3
sanitises, the purchase.

---

## 13. The claims boundary

**Detection is imminent, and that is the argument rather than a caveat.**

**Anthropic has publicly committed to a text detection API "that you can use
yourself."** Confirmed 12 August 2026, further detail 15 August, interactive
explainer updated 16 August. **Not callable yet. No pricing or access tier
published.**

**Say imminent. Never say no detector exists and never imply none is coming.**

**Three facts from Anthropic's own public material. All usable, all on the record.**

1. **Anthropic says the mark can be defeated by rewriting with another model.**
   **The company that built the watermark describes the method that removes it.
   That is the strongest citation this product has.**
2. **A check returns a probability, never yes or no.** No binary verdict, so
   reducing the signal is the accurate frame and metrics are the right language.
3. **A detected mark means Claude processed the content, not that Claude wrote
   it.** It flags people who wrote their own work and edited it with Claude.

**What this changes commercially.** Verification is coming, which is the reason to
act now. **It is also the reason not to overclaim: when the API ships, every
sentence on this site becomes checkable at once.** Overclaiming here is a dated
liability, not only a dishonesty.

**What must never be said.**

| Never | Because |
|---|---|
| **Layer A removes Claude's text watermark** | Anthropic's mark is not Unicode, not metadata, not hidden characters. It is in the word choices. Their own documentation says so. `04` entry 37 |
| **We can currently prove a text watermark was removed** | Nobody can yet. **Imminent is the word** |
| **A school or employer can run Anthropic's detector today** | Not callable yet. Coming, not live |
| **We target the specific tokens Anthropic marked** | `04` entry 78 ruling 2. The key is Anthropic's, and their own detector returns a probability rather than a location. **Target the runs, which is true. Not the key, which nobody can** |
| **Anything about PDFs** | Not in version one |
| **"Provenance" where a visitor reads it** | The layer is called Metadata |

**The strongest honest Claude-first claim, `04` entry 68, updated for this week:**

> If Claude made you a file, it carries a signed credential anyone can read with a
> free public tool today. We remove it and show you the file before and after.
> Claude's text watermark is a separate mechanism, in the words themselves, and
> Anthropic is shipping a detector anyone can use. Our rewrite is engineered
> against it and we report what we measure.

**Certainty on files. Engineering and measurement on text. No claimed verification
until there is something to verify against.**
