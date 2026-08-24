# COWORK TASK 3: PRESS EMAILS. Draft only, send nothing.

**Attach these three files to the Cowork session before starting:**
`.agents/product-marketing.md`, `.claude/skills/unclaude-messaging/SKILL.md`, and
`docs/session-notes/press-phase-2.md`.

---

## WHAT THIS TASK IS

Jon built un-claude.com, a live consumer tool that removes AI watermarks from text
and files. Phase 1 researched 62 journalists. **Phase 2 reviewed that list and cut
it to nine.** You are drafting nine emails, one per person, and nothing else.

**DRAFTS ONLY. SEND NOTHING. CONTACT NOBODY.** Every send is Jon's own click, one
at a time, spaced out. If you find yourself using a send tool, stop.

**These drafts are being held on purpose.** The product currently makes three
claims that fail against its own receipt, and they are being fixed in a parallel
workstream. Jon sends when they are true. **So write emails that will still be
true in two weeks:** no "launching today", no "this week", nothing that goes stale.
Referring to the journalist's own article by its date is fine and expected.

---

## THE PRODUCT, IN THE ONLY TERMS YOU MAY USE

**Three layers. Two are provable. One is not, and the site says so.**

| Layer | What it removes | Provable? | How an email may sound |
|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | **Yes, deterministic and counted** | **Fully confident.** Name the marks and their positions |
| **Metadata** | C2PA content credentials, EXIF, XMP, generator tags. Needs a file | **Yes, byte verified before and after** | **Fully confident.** This is what strips a signed credential |
| **B. Statistical rewrite** | Patterns in word choice, removed by rewriting | **No. Best effort, and nobody can verify it, including us** | Describe the engineering. **Never claim a verified removal** |

**The reason layer B cannot be proven: Anthropic has committed to a detection API
and has not shipped one.** Nobody can check whether a statistical watermark was
removed. **The word is "imminent", never "impossible" and never "already".**

### DO NOT PUT THESE SENTENCES IN ANY EMAIL

These are live on the site today and **all three are false against the product's
own receipt.** An email carrying one, sent to a journalist who tests, is the single
worst outcome available.

- ❌ "a hard three-word ceiling on surviving sequences"
- ❌ "length is held within a tenth"
- ❌ "every number, date and name is checked" / "zero figures lost"
- ❌ "breaks over 90% of three-word sequences"
- ❌ "upload a file and you get all three layers"

**What you may say about layer B instead, which is true:** it is a targeted
structural rewrite that breaks the verbatim word sequences the watermark rides on,
routed through a model that is not Claude so the mark cannot be reapplied mid
rewrite, and **it reports what it did on a per job receipt.** Then say plainly that
whether the statistical mark is gone cannot be verified by us or by anyone else
until Anthropic ships the detector.

**That admission is the pitch. Do not bury it, do not soften it, and do not put it
last.** Every one of these nine people has read a category full of tools claiming
proof. Being the one that states its own boundary before being asked is the entire
reason any of them would write.

---

## THE UPSTREAM QUESTION. Jon fills this in before you start

The engine began as a copy of `guillaumemeyer/watermarks-remover`, MIT licensed, by
Guillaume Meyer. The licence is satisfied. **Ax Sharma named that project in print
on 13 August and quoted Meyer being candid about its limits**, so the reporter most
likely to cover this already has the lineage in his notes.

**JON'S DECISION, PASTE IT HERE BEFORE STARTING:**

> ______________________________________________________________________

**If the decision is to disclose** (the Phase 2 recommendation): the Ax Sharma email
leads with it, in Jon's own words, before the pitch. The other eight do not need to
raise it, but **no email may imply the engine was built from nothing.**

**If the decision is not to disclose:** no email mentions it, and Jon needs a
prepared answer for the interview, because it will be asked.

---

## THE NINE, WITH THEIR HOOKS

**Wave one, five names. Straight product story, all publish direct addresses.**

**1. Ashley Belanger, Ars Technica.** "Claude's new Scarlet Letter watermark is
invisible for now", 13 August 2026. **Her subheading, unprompted: "The mark flags
anything Claude processed, even human writing it only edited."** In the body she
writes that a model level watermark cannot tell wholesale generation from a comma
fix, that Claude will mark editing done on original writing despite the law
exempting it, that any decent metadata editing tool removes the information from
images, and that how thoroughly it watermarks is unknown until a detection tool
ships. **She has written this product's whole argument without being pitched.** No
published contact captured yet: **find a published Ars Technica press or author
contact, or record that there is none. Do not guess an address.**

**2. Thomas Claburn, The Register.** "Anthropic says text watermarking scheme relies
on inconsequential words", 15 August 2026. `tclaburn@theregister.com`, published on
his author page. He also wrote the UnMarker piece in July 2025 about the Waterloo
tool that dropped SynthID image detection from 100% to roughly 21%, so **he has run
this exact story shape before.** He noted Anthropic relies on C2PA for file
metadata, "for which there are already open source removal tools". He closed the 15
August piece with "Hey Claude, what's another word for performative compliance?"

**3. Simon Hernandez-Arthur, Axios.** "Anthropic's text watermarks signal new front
in AI detection", 12 August 2026. `simon.hernandez-arthur@axios.com`. He logged the
point that matters most to the buyer: **content may carry a mark even if Claude was
used solely to proofread, format or translate human written copy.** Axios turns copy
in a day and the format is very short. **This is a news hit, not a feature. Keep the
email shorter than the others.**

**4. Anthony Ha, TechCrunch.** "Anthropic shares more details about how Claude's new
watermarks will work", 15 August 2026. `anthony.ha@techcrunch.com`. He wrote the
mechanism explainer rather than the outrage piece, and **specifically noted that
Anthropic disclosed no timing for the detection API.** A tool shipping into that gap
is a legitimate product story.

**5. Beatrice Nolan, Fortune.** "Anthropic plans to add an invisible mark to AI
text", 11 August 2026. `beatrice.nolan@fortune.com`, published in her own copy. She
broke the story and was on NPR explaining it on 17 August. **Her piece contains the
hinge: the mark travels with copied text and may survive light editing, but a heavy
rewrite or a translation may knock it out.** A product built on structural rewriting
is the direct continuation of her own sentence. **Caution: she writes inside an "AI
slop" frame, so be precise, and she is the person most likely to know exactly what
Anthropic has and has not shipped.**

**Wave two, four names. Higher value, every one tests before writing.**

**6. Ax Sharma, BleepingComputer.** "AI 'watermark removers' flood the web. Almost
none can prove they work.", 13 August 2026. `ax@axsharma.com`. **The best fit
anywhere.** His piece is an independent audit of this exact category and he arrived
at the same three layer taxonomy independently. He names competing tools and
concludes none of their claims about the text watermark can be verified. **The pitch
is: here is the one that states its own boundary before you ask.** See the upstream
section above, this email is gated on it.

**7. Erik Ofgang, Tech & Learning.** "AI Humanizers: Everything Teachers Need To
Know", 6 October 2025. `erik.ofgang@futurenet.com`. **The only journalist found who
actually sat down and tested humanizer tools, published his method, and came away
"less worried".** He will test. Layers A and metadata survive a test. **Write to him
assuming he will run a long document through it.**

**8. Tyler Kingkade, NBC News.** "To avoid accusations of AI cheating, college
students are turning to AI", 28 January 2026. He publishes a tips invitation in his
articles; newsroom `tips@nbcuni.com`. **The only mainstream reporting that treats
these tools as a market with a measured size: 33.9 million visits across 43 tools in
a month, reported from the students' side.** He quotes a student: "it's a very weird
feeling, because the school is using AI to tell us that we're using AI". **His piece
predates Anthropic's mark and never mentions watermarking, which is a genuine,
non manufactured reason to come back to him.** His sympathy is for the falsely
accused, not for evasion, so he will ask what this does for someone who did submit
AI work. **Have an answer.**

**9. Sharon Goldman, Ground Level AI.** "Invisible AI watermarks won't stop bad
actors. But they are a 'really big deal' for good ones". `sharon@groundlevel-ai.com`.
She went to Soheil Feizi at Maryland, who told her "we broke all of them". She runs
her own publication now, so she can commission herself and go long. **Of everyone
here she is the most likely to write a piece that accurately reflects a three layer
product where two layers are provable and one is not, because that distinction is
already her house style.**

---

## DO NOT DRAFT FOR THESE

**Held until the engine work lands, they are not cut:** Simon Willison, Geoffrey
Fowler, Freddie deBoer, andrea saez. All four break the product in public if it is
not clean. **Willison maintains an em dash and curly quote highlighter and the tool
currently inserts both.** Phase 3 handles them.

**Not contacted at all:** the adversarial cluster listed in `press-phase-2.md`
section 2, plus Retraction Watch, Derek Newton, Zvi Mowshowitz and 404 Media.
**If you think one of these should get an email, say so in your notes. Do not draft
it.**

---

## THE EXCLUSIVE. Only one person can have it

**Phase 1 marked six people as exclusive candidates. An exclusive offered to six
people is a lie that all six will discover.**

**Offer the exclusive first look to exactly one: Ax Sharma.** Being the exception in
a category he has already audited is a story only he can write. **Everyone else is
offered an interview and hands on access to test it themselves**, which is worth
more to most of them anyway and can be offered to all eight without conflict.

**Sequencing for Jon, put it at the top of your output:** Sharma goes first and
alone, with a one week window. If he passes or does not reply, the exclusive moves
to Erik Ofgang. Wave one goes after that window closes, offering access rather than
exclusivity.

---

## RULES FOR EVERY DRAFT

- **Jon writes as himself. He built it.** Not a neutral observer and not a tipster.
  A founder is a better source, and the sending address makes anything else
  implausible.
- **From `unclaudeapp@gmail.com`.** Never the un-claude.com domain. Cold outreach
  must not touch the deliverability of transactional email.
- **One email per person, built from their actual article.** Quote the specific line
  of theirs you are answering. **A template with a name swapped in will be obvious
  to all nine of these people and is worse than sending nothing.**
- **Short.** These are working reporters. Subject line, then under 200 words for
  wave one, under 150 for Axios. The honest boundary about layer B is not an
  optional cut.
- **No em dashes and no en dashes anywhere.** Jon's standing style rule. It also
  matters here specifically: the em dash is a cited AI writing tell and these
  recipients know it.
- **Say which offer fits and why**, in one line, at the end.
- **Lead with the mechanism, not the mission.** No moral framing about the labs in
  a press email. State what the tool does and what it cannot prove.

---

## OUTPUT

**One file, `press-emails-phase-2.md`,** containing:

1. **The sequencing note** from the exclusive section, at the top.
2. **The nine drafts**, each with recipient, address, subject line and body, in the
   order they should be sent.
3. **A short note per draft** saying which of their sentences you used and why that
   offer fits them.
4. **Anything you could not do**, named plainly. A missing contact recorded as
   missing is a complete answer. **A guessed address is not.**

**Published press contacts only.** A tips address, a newsroom address, or a work
address the person publishes for the purpose of being contacted. **Never guess a
format, never permute, never use a scraped database.**
