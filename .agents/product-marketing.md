# Un-Claude: product marketing context

**Written 19 August 2026.** This is the foundation document every marketing skill
reads before it writes a word. It is compressed from `CLAUDE.md`,
`apps/web/engine/ENGINE.md` section 2, and `docs/04-decision-log.md` entries 36,
37, 41, 47, 68 and 70. **Where those documents and this one disagree, they
govern and this file is the defect.**

**Section 13 is not optional. It is the reason this file exists.** A general
purpose conversion skill will reach for claims this product cannot make. Read it
before writing anything.

---

## 1. Product overview

**One liner.** Un-Claude finds the marks that identify text and files as AI
generated, and removes them.

**Category.** AI content sanitiser. Not a humanizer. The project was a humanizer
until 18 August 2026 and was deliberately rescoped, `04` entries 18 to 24.

**The word is "sanitise", not "remove the watermark".** Jon's ruling, `04` entry
70, and the reasoning is the honest one: for layer B nobody can say the watermark
was removed. **Sanitise claims the work, not the outcome.**

**What it actually does, in three layers.**

| Layer | Removes | Works on pasted text | Works on files | Provable |
|---|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | **Yes** | Yes | **Yes** |
| **Metadata** | C2PA provenance, EXIF, XMP, generator tags | **No. Needs a file** | **Yes** | **Yes** |
| **B. Statistical watermark** | Patterns in word choice, removed by rewriting | Yes | Yes | **No. Best effort** |

**Paste text and you get A and B. Upload a file and you get all three.**

**Business model.** Credit packs. One credit buys 1,000 words, a file with no
words is a flat credit. Packs at $4.99, $9.99 and $24.99 for 10, 25 and 100
credits. Free is unlimited scanning, 3 signed out credits with no rewrite, plus 2
more on signup. `04` entry 67, and `CURRENT-HANDOFF.md` section 2.

**The landing page is the product.** `04` entry 20. There is no separate
application behind a login. The tool sits above the fold and works without an
account.

---

## 2. Target audience

**The primary visitor is a student.** Coursework, essays, assignments, a thesis.
Ruled by Jon, 19 August 2026.

**They are on a phone.** Traffic is expected from TikTok and Jon has made mobile a
first class constraint, not a later pass. `04` entry 70. **Nothing is finished
until it is right on a small screen.**

**There is no buying committee, no procurement, no trial-to-team motion.** One
person, one decision, made in a few minutes, probably at night, probably close to
a deadline. Every B2B instinct a marketing skill has is wrong here.

**Secondary audiences exist and are not the target.** Freelancers delivering
client work and professionals producing documents inside a company both have
higher willingness to pay and a stronger metadata story. **They are not what the
page is written for.** Do not quietly re-aim the copy at them because they
monetise better.

---

## 3. Persona

**One persona. Not B2B, so there is no stakeholder map.**

**The student who has just found out.** They have learned that AI writing is now
watermarked and that schools and employers can check whether work was machine
produced. That is why they are here. They arrived informed and worried, not
curious.

**What they know:** the category. Invisible watermarks exist, institutions can
check, their work might carry one.

**What they do not know:** the mechanism. Which layer, which model, what is
actually detectable today versus announced. **They cannot tell the difference
between the three layers and they should not have to.**

**The single most important consequence.** Because they arrive already believing
the threat, **the page's job is not to convince them a problem exists.** It is to
show them what is actually in their own work, and fix it. Education is the second
job, not the first. A hero that explains watermarking to this person is a hero
that wasted its one chance.

---

## 4. Problems and pain points

1. **They cannot see the marks.** That is the definition of the product. The
   characters are invisible, the metadata is inside the file wrapper, the
   statistical mark is in word choice. Nothing shows on the page.
2. **They cannot check their own work.** No consumer tool tells a student what is
   in their document before they submit it.
3. **The consequence is not a refund, it is a misconduct hearing.** A grade, a
   module, a degree, a reputation. **The stakes are high and the price point is
   low, which is unusual and worth respecting in the copy.** It argues for calm
   and specific, not loud.
4. **They are out of time.** Close to a deadline, on a phone.

---

## 5. Competitive landscape

**This section is under-researched and is flagged as such rather than filled in.**
Do not write competitive copy from it without checking first.

**Known and recorded.** From the design review that set the site's direction:
GPTZero was studied for layout, humanizeai.pro for tidiness, deepai.org was
rejected.

**Structurally, three alternatives:**

- **Humanizers and detector-bypass tools.** They rewrite. **That is layer B
  alone.** None of them, as far as this project has checked, touch invisible
  characters or file metadata.
- **Doing nothing.** The largest competitor by volume. Beaten by showing them
  something real in their own work within seconds.
- **Rewriting it themselves by hand.** Slow, and it does not touch metadata at
  all, because metadata is not in the words.

---

## 6. Differentiation

**1. Three layers, not one.** Competitors rewrite. Rewriting is the only one of
the three that cannot be proved. **Un-Claude does the two provable ones first and
for free.**

**2. Metadata is the layer nobody else has.** A file made by Claude, ChatGPT,
Gemini, Firefly or a hosted Stability endpoint carries a signed C2PA credential.
**Anyone can read it with a free public tool.** Un-Claude removes it and shows the
file before and after, byte verified.

**3. It tells you which parts are proved.** Layers A and metadata are
deterministic and countable. Layer B is best effort and says so. **In a category
built on overclaiming, the honesty is the differentiator, not a handicap.** It is
also the only defensible position once Anthropic ships the detector it confirmed
is in development.

**4. Receipts, computed live.** Percentage of wording replaced, longest surviving
run of original words, figures carried through, length preserved. `04` entry 47.

**5. The producer name is the moment the product works.** When a scan identifies
what made a file, **"made by Stability AI" is a headline finding, not a
footnote.** `04` entry 70. That single line is the most persuasive thing on the
page, because it is the visitor watching the tool read their own file.

---

## 7. Objections and anti-personas

| Objection | The honest answer |
|---|---|
| **"Does it actually work?"** | For layers A and metadata, yes, and here are the marks and the file before and after. For layer B, nobody can verify removal, including us, and we say so. |
| **"Will it ruin my writing?"** | Facts survive character for character and that rule outranks every other. Length is preserved, a rewrite under 70% of its input is treated as a failure. |
| **"Is this cheating?"** | See section 10. The site states that AI tools mark what they make, invisibly and without telling you, and lets the visitor draw the conclusion. |
| **"Can my school actually detect this?"** | **Careful. This is the dangerous one. See section 13.** |

**Anti-personas.**

- **Anyone with a PDF.** Not in version one, so nothing about PDFs is claimed at
  all. `04` entry 37.
- **Anyone wanting a guarantee against a text detector.** No such guarantee
  exists and offering one would be false.
- **Enterprise or team buyers.** No such motion exists.

---

## 8. Switching dynamics

- **Push.** They found out watermarking is real and they have already submitted
  work, or are about to.
- **Pull.** A scan that is free, instant, needs no account, and shows them
  something true about their own document in under a second.
- **Habit.** None. There is no incumbent. This is a first purchase in a category
  they learned about this week.
- **Anxiety.** Two, and they are the ones to solve in the copy: **"will this
  damage my work"** and **"am I paying for something I cannot check".** The second
  is real and is answered by giving the provable layers away free and charging for
  the rewrite.

---

## 9. Customer language

**Under-researched. Flagged rather than invented.**

**Confirmed vocabulary, from the product and its documents:** sanitise, hidden
characters, metadata, watermark, scan.

**"Metadata", never "provenance", anywhere a visitor can read it.** `04` entry 78
ruling 1. Metadata is the umbrella: EXIF, XMP, generator tags **and** C2PA
provenance. Provenance is one signed thing inside it, so the old label named the
narrowest part of what the layer actually strips. **Code identifiers keep the old
name deliberately** (`provenanceFound`, `id: 'provenance'`, `has_c2pa`) because
nobody reads them and renaming them is churn.

**What needs checking before it is used in copy:** the words students actually
use. Likely candidates are "flagged", "detector", "caught", and named detection
products. **None of these have been researched for this project, and a named
third party product must not appear in copy on a guess.**

**Register.** They are worried, on a phone, in a hurry. Short sentences. No
jargon in the first screen. **Nothing that sounds like a lab report and nothing
that sounds like a sales page.**

---

## 10. Brand voice

**Restrained. State the fact and let the visitor conclude.** Jon's ruling, 19
August 2026, on how openly the site takes a moral position.

**The register, in Jon's own draft:** "AI tools now mark what they make.
Invisibly, and without telling you." **No adjectives. The secrecy does the
work.** The site does not call the labs unethical, illegal or immoral in its own
voice. It reports what they do, accurately, and that is more damning and far
harder to attack.

**Hard formatting rules.**

- **No em dashes and no en dashes.** Anywhere a visitor reads: headings,
  subheadings, body copy, button labels. `docs/05-working-agreement.md` section 2.
  **This is Jon's style rule for his own site and documents. It says nothing about
  the engine and must never leak into what the tool does to a user's text.**
- **"Sanitise", not "remove the watermark".** `04` entry 70.
- **"Un-Claude".** Capital U, capital C, hyphenated, display name only. Domain and
  identifiers stay lowercase.

**Claude forward, deliberately.** `04` entry 36. The capability is general and
works on output from any model. **The marketing leads with Claude** because that
is the name, the news and the reason the product exists. Other labs are named on
the site, less prominently.

**Marketing may be enticing and deliberately ambiguous. It stops short of
explicitly false. Final wording authority is Jon's, on every sentence.**

---

## 11. Proof points

**Every figure on this site is real. None are invented.** `04` entry 47. Jon asked
for invented metrics and the assistant declined and sourced real ones instead.
**Anthropic has a detector in development, which is the day every invented number
in this category becomes checkable at once.**

**What is live in the hero, and the rule that put it there.** `04` entry 78
ruling 3. Two earlier attempts failed the same way: **a claim about one layer is
wrong for the other two.** "Every mark shown in place" over-promises for Claude
text, which has no visible mark. "Zero figures changed" is meaningless over a PNG.

**So a claim in a whole-service slot must be true of the whole service.** What
replaced them: **Free**, **Nothing stored**, **Nothing lost.** One shared job,
removing a reason not to try, which is what a stranger needs before pasting a
confidential document into a site found on TikTok. **"Nothing stored" is
measured:** uploads capped at 5 MB, held in a temporary folder for the length of
the request, deleted. **Hidden below `lg`**, because on a phone they take space
the product needs.

**Live proof that is not a statistic, and is stronger than one.**

- **The producer name.** The scan says what made the file. See section 6.
- **The file before and after**, byte verified.
- **The named hidden characters**, with exact positions.
- **The live rewrite receipt:** wording replaced, longest surviving original run,
  figures carried through, length preserved.
- **The publication marquee.** Nine outlets on real artwork, **and a logo goes in
  only if it links to a real article from that outlet about the watermark.**
  Citation, not endorsement.

**Figures that are real but currently parked, in `docs/PARKED-CONTENT.md`.** Do
not reinstate any of these without reading why it came off. They were removed for
placement, not accuracy: 5 of 8 providers marking files, 2.5bn ChatGPT prompts a
day, Claude marking from August 2026, 100% of metadata removed, 90%+ of three word
sequences broken, 0 figures lost. **Two have a stated home:** the 90%+ belongs
beside the run length chart on the receipt where it explains something, and the
August 2026 card carries a caution that its closing line about no public tool
existing must not be shouted on the front page.

**Not yet provable and therefore not claimable.** Office documents were verified
on `sample_ai.xlsx`, a test file shipped with the engine, **not a real
OpenAI-produced document.** Get one real file before Office documents are claimed.

---

## 12. Goals

**The destination is a credit purchase.** Jon's ruling, 19 August 2026.

**The purchase flow does not exist yet.** No Stripe account, no products, no
checkout, no pricing page. `CURRENT-HANDOFF.md` section 2. **So optimising the
page for purchase today optimises for a door that is not there.**

**The live ladder, in order. Optimise the highest rung that currently exists.**

1. **A completed scan by a signed out stranger.** Free, no account, unlimited.
   This is the moment the product proves itself and it is the real hero metric
   today.
2. **The producer name landing.** They see what made their file. `04` entry 70.
3. **Signing in with Google.** Live and branded. Earns 2 more credits.
4. **Hitting the paywall after 3 sanitises.** Real now, fires without calling the
   engine.
5. **Buying credits.** **Blocked on Stripe, which is Jon's to open.** Until then
   the page should make the value of a credit obvious without promising a
   checkout that will 404.

---

## 13. The claims boundary. Read this before writing anything

**This section exists because the highest converting sentence available to this
product is false, and a conversion skill will find it.**

**The visitor believes their school can detect AI writing through invisible
watermarks. That belief is half right, and the half that is wrong is the half
that would convert best.**

| What is true today | What is not true today |
|---|---|
| **Claude marks generated files.** Signed C2PA since 2 August 2026, on SVG, PNG and JPG. **Anyone can read it with a free public tool.** Provable, live, removable, and we show the file before and after | **Claude's text watermark is not detectable by anyone but Anthropic.** No public detector exists. No marked model is shipping publicly. **A school cannot check it today** |
| **Invisible characters are a real, present tell.** Newer ChatGPT models emit narrow no-break spaces in longer responses. Observable, countable, and it catches people now | **Layer A does not remove Claude's watermark.** Anthropic adds no hidden characters. Saying it does is false. `04` entry 37 |
| **We remove marks**, in the framed way above | **PDFs.** Not in version one. Claim nothing |
| **Word documents** are in scope | **Office documents proven on a real user file.** Not yet. See section 11 |

**So the strongest honest Claude-first claim is `04` entry 68, and it is stronger
than the false one:**

> If Claude made you a file, it carries a signed credential anyone can read with a
> free public tool. We remove it, and we show you the file before and after.
> Claude's text watermark is a separate mechanism, rolling out, and no detector
> for it exists anywhere. Our rewrite is the published defence and we call it best
> effort because that is what it is.

**Certainty about files, today. Best effort on text, labelled.**

**Two more boundaries, from `04` entry 78 ruling 2, on how the rewrite is
described.**

| May say about the rewrite | May not say |
|---|---|
| It runs through a model that is **not Claude**, because rewriting Claude's text with Claude re-applies the mark at full strength | **That we target the token sequences Claude used.** The key is Anthropic's, no public detector exists, and nothing can identify which tokens carry the mark |
| Every number, date and name is checked against the original, and the chunk retries if one drifts | |
| Length is held within about a tenth | |

**And Jon's warning on this, which is the harder half and is unsolved.** *"An
average person has no idea what 'we break the runs the mark rides on, and we
measure how many survive' means."* **True. The wording is open**, `04` entry 77.

**Where the layer B disclosure sits is a choice. Whether it exists is not.** `04`
entry 78, standing steer. It is labelled best effort **at the result, at the point
of purchase, and in the terms**, per `04` entry 23. **It does not headline the
home page.** Jon: *"why is that screaming at you at the very front of this website
when that's kind of why we're here and we want your payment?"* **Do not read the
honesty rule as an instruction to lead with the limitation.**

**Three sentences that must never appear on this site.**

1. Any sentence saying or implying that a school, employer or detector **can
   currently detect Claude's text watermark.** It cannot. Nothing can.
2. Any sentence saying **layer A removes Claude's watermark.**
3. Any invented number, counter or measurement of any kind.

**And the standing rule underneath all three.** Layers A and metadata are
deterministic, so "it worked" is a fact, and the copy may be confident. **Layer B
is unverifiable and must never be reported with the confidence of the other two.
Reporting it that way is the single easiest way to make this project dishonest.**
`CLAUDE.md` section 4.
