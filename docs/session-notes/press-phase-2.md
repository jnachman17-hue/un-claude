# Press Phase 2: the review, before any email is written

**Written 23 August 2026.** Reviews `press-outreach-list.md` (Phase 1, 62 named
journalists), applies the two corrections in `docs/briefs/COWORK-2-press-review-and-draft.md`,
and recommends what to do.

**Jon changed the scope of this session partway through.** The brief asked this
session to draft the emails. Jon asked instead for the review plus a prompt he can
hand to Cowork for the drafting. His instruction governs, `CLAUDE.md` section 2.
**No emails are drafted here.** The drafting brief is `docs/briefs/COWORK-3-press-drafting.md`.

---

## 1. START HERE. Something outranks the press list, and it was not in either brief

**The two layers this product can prove are the two layers it did not write.**

That sentence is checkable from the repository in about five minutes, and it is
the sentence a technical reporter will land on. It is not on the Phase 1 list
because Phase 1 could not see the repository. Here is the evidence.

`apps/web/engine/PROVENANCE.md`, in the repository, first line:

> **This folder is a copy of `guillaumemeyer/watermarks-remover`, not our own work.**

Counting the changes to each engine file since the day it was copied:

```
FILE                 COMMITS   WHAT IT DOES              WHOSE WORK
text_unicode.py         1      Layer A, the characters   upstream, never modified
clean_text.py           1      Layer A, the cleaning     upstream, never modified
image_meta.py           2      Metadata layer            upstream, barely modified
rewrite_text.py         6      Layer B, the rewrite      upstream, modified by us
uc_chunk.py            12      Layer B chunking          OURS
uc_policy.py            2      Layer B policy            OURS
uc_leakguard.py         -      Layer B leak guard        OURS
```

**One commit means the file was copied in and never touched again.** The two
files that do the entire invisible-character layer have one commit each. They are
upstream's code, running unchanged.

**Read that against how the product is sold.** The pitch is that layers A and
metadata are provable and layer B is best effort. That is true and it is honest.
But the provable half is upstream's engineering, and the half we built is the half
nobody can verify. **Every file with a `uc_` prefix, meaning un-claude, is on the
unprovable layer.**

**This is not a licence problem.** MIT permits all of it, `UPSTREAM-LICENSE` is
present and intact, and the licence is satisfied. **It is an interview problem.**
Ax Sharma audits this exact category for a living, already has `watermarks-remover`
in his notes by name, and has already printed its author being candid about limits.
He is the most likely person on the list to ask, and the question he will ask is
not "did you comply with the licence." It is "what did you actually build."

**There is a good answer and it needs to be said first rather than extracted.**
The chunking, the policy and the leak guard are real engineering, they are the
reason a long document survives at all, and they are why this tool does something
upstream's does not. Say that, and the lineage is a normal open-source story. Let
it be discovered, and the story is that the tool selling candour was not candid
about itself.

**Before anyone is contacted, Jon needs one accurate paragraph** describing what
is upstream and what is his. The evidence above is enough to write it.

---

## 2. My read of the list. Write to nine, not sixty-two

**The Phase 1 list is good work.** Real articles read, real hooks, honest about its
own gaps, and its contact discipline held. The research is not the problem.

**The problem is that it ranks people by whether they will cover this, and the
question that matters is what they will write.** For roughly half of tier one, a
successful pitch produces a story that damages the product. The list sees this in
places and still ranks those names highly.

### The cut

**Wave one, five names.** Publish direct addresses, on the beat now, most likely to
write a straight product story.

| # | Who | Why this one |
|---|---|---|
| 1 | **Ashley Belanger, Ars Technica** | **New. Recovered this session.** She wrote un-claude's own argument, unprompted, as her subheading |
| 2 | **Thomas Claburn, The Register** | The only one who has covered both sides. Ran this exact story shape once with UnMarker |
| 3 | **Simon Hernandez-Arthur, Axios** | Most neutral stance found. Turns copy in a day |
| 4 | **Anthony Ha, TechCrunch** | Highest reach for a straight product story. Wrote the mechanism piece, not the outrage piece |
| 5 | **Beatrice Nolan, Fortune** | Owns the thread, publishes her email in her own copy |

**Wave two, four names.** Higher value, and every one of them tests before writing.
Only after wave one has gone cleanly.

| # | Who | Why this one |
|---|---|---|
| 6 | **Ax Sharma, BleepingComputer** | Best single fit anywhere. **Needs the section 1 answer settled first** |
| 7 | **Erik Ofgang, Tech & Learning** | Best exclusive on the list. Tests rather than moralises |
| 8 | **Tyler Kingkade, NBC News** | Nearest existing byline, national reach, genuine reason to return to him |
| 9 | **Sharon Goldman, Ground Level AI** | Most likely of anyone to get a three-layer product right, because that distinction is already her house style |

### Hold, do not drop

**Simon Willison, Geoffrey Fowler, Freddie deBoer, andrea saez.** All four are
valuable and all four break the product in public if it is not clean. Section 4
sets what has to be true first.

**Willison is the sharpest example and the list missed it.** He maintains the Curly
Quote and Em Dash Highlighter. The F1 audit measured this product **inserting** em
dashes and curly apostrophes on eight runs out of eight, zero going in, never zero
coming out. Send him a URL today and the first thing he does is run the output
through his own tool, and it lights up. **That is the most predictable outcome on
this entire list.** Phase 1 could not have known it, because it was working from
the stale lab numbers rather than the audit.

### Do not contact, beyond the four Phase 1 already excluded

**The whole adversarial cluster.** Deck, Rubinson, Sadeghi, Silverman, Mantzarlis,
Pfefferkorn, Williams, Golding, Mahadevan, Rose, Garina, Leibowicz. Phase 1 calls
these "flagged, not recommended" and then tables them with contacts, which invites
a mistake later. **They are a monitoring list, not an outreach list.** Researching
them was right: their objections, captured well in Phase 1's "four objections"
section, are interview preparation. Contacting them is volunteering to be the case
study.

**Add to the hard no list:**

- **Retraction Watch.** Phase 1 says "never pitch this outlet on evasion" and then
  keeps it in a table with an email in it. Move it.
- **Derek Newton, The Cheat Sheet.** Phase 1 calls him the highest risk on the list
  and it is right. He has already mocked a bypass vendor's press release.
- **Zvi Mowshowitz.** Phase 1 argues an accurate hostile piece may beat a friendly
  one. **I disagree.** He will write that removal shows consciousness of guilt, to
  an audience that will never buy, and it becomes a citation everyone else reaches
  for. His useful quote about rewriting in your own words can be cited without
  handing him the story.
- **404 Media, for now.** Koebler's thesis is that the watermark proves AI companies
  do not understand writing. A sanitiser is the villain in that frame. Not a never,
  but not in the first two waves.

**One thing in the education opening.** Phase 1 is right that no education trade has
touched the Anthropic mark and right that this is an opening. But the education beat
spent three years concluding stop detecting, not sell students a countermeasure, so
a paid student-facing tool is the worst possible first story on that beat. **Ofgang
is the exception because he tests instead of moralising.** That is why he is in wave
two and the rest of the education names are not.

---

## 3. The upstream disclosure. Options, and my recommendation

**This is Jon's decision. The brief says so and I am not making it.**

**One fact reframes it.** `PROVENANCE.md` already says, in the repository:

> A visible attribution on the website is not required by the licence, but **is planned**.

**So this was decided already and never shipped.** The question is not whether to
attribute. It is whether to ship the thing already decided before the press are
contacted, or after.

| | Option 1: stay silent | Option 2: ship the credit first |
|---|---|---|
| **What it is** | Keep `PROVENANCE.md` in the repo, nothing on the site, answer honestly if asked | Put the already-planned credit line live before a single email goes |
| **Licence** | Satisfied | Satisfied |
| **If Sharma finds it** | Discovered lineage. "The tool that sells candour was not candid about itself" | Nothing to find. He reads it on the page |
| **Cost** | None now | A line of copy and an hour |
| **What it does to the pitch** | Leaves a live round in the chamber | **Turns the liability into the pitch** |

**My recommendation: Option 2, and tell Guillaume Meyer before the press.**

The reasoning. Sharma quoted Meyer volunteering that his tool removes metadata only
for now and that stripping the actual marks may not be available today. **That is
the candour benchmark Sharma is measuring this whole category against, and it was
set by the author of the code un-claude runs.** Un-Claude is in a position to
continue that sentence rather than contradict it: Meyer said the rewrite was not
there, and this is what was built on top, and here is exactly what can and cannot
be proven about it. **That is a better story than the one where lineage is absent.**

**Notifying Meyer costs a short email and forecloses the worst version**, which is
an upstream author who first learns about a commercial product built on his code
from a reporter asking him for comment.

**What I am not recommending.** Do not go further than a credit line and a short
page. This does not need a confession, and overcorrecting into "we barely built
anything" is both untrue and unhelpful. The `uc_` files are real work.

---

## 4. Send timing. Draft now, send later, and here is the specific gate

**I agree with the conductor's recommendation and Jon should accept it.** Drafting
costs nothing to hold. Sending into the current state costs the news window and the
product's best ground at once.

**But "wait for the claims to be fixed" is too vague to act on.** Here is the
checkable version, drawn from the F1 audit and the implementation board.

### Must be true before ANY email goes

| Item | What it is | Board ID |
|---|---|---|
| The three failing promises | "Enforced rather than promised" fails three ways against the product's own receipt | **C-1** |
| The three-word ceiling | The site says three in three places. Its own receipt printed **6** | **C-3** |
| "Upload a file and get all three" | **No accepted file type gets all three.** A `.docx` never gets the rewrite | **C-2** |
| **The repair pass ships** | The tool inserts em dashes and curly apostrophes, 8 runs out of 8. Fix is measured: 359 em dashes to 0, at no cost | **E-1** |
| Old free copies of the site | Still on the internet, giving the paid product away | **Finding 0** |
| The upstream credit | Section 3 above | |

**Why E-1 is on a press gate and not just an engineering one.** Every name in wave
one and wave two will paste output somewhere. The em dash is the single most cited
public tell for AI writing. A tool that removes AI marks and adds the most famous
one is a headline, and it is a funny one, which is worse.

### Must also be true before the testers are contacted

Willison, Fowler, Ofgang, deBoer, saez, Sharma.

| Item | What it is |
|---|---|
| **Invented quotations** | The rewrite changes words inside quotation marks and leaves them attributed to a real person. Three runs out of three. **This one cannot be reworded away** |
| The ninth character class | "Nine classes checked" and one of the nine finds nothing. Either it works or the number becomes eight |

**The window is real and it does not close next week.** Anthropic has published no
detection API and no timing for one. The story stays live until it ships. That is
the argument for getting this right rather than getting it out.

---

## 5. Gap recovery. What I got, and what is genuinely unreachable

**The most useful finding here is about the blockage itself, and it changes what
Cowork should be asked to do.**

**Phase 1 called The Verge, Wired, Ars Technica, CNET, ZDNet and PCMag "network
refusals, not paywalls," and recommended re-running them from an unrestricted
connection. That will not work.** Those sites block Anthropic's crawler at the
publisher's end, deliberately. Retrying the same research in Cowork fails
identically, every time. It is not a connection problem and there is no unrestricted
connection that fixes it.

**Recovered here, using a normal browser session rather than the crawler:**

**1. Ashley Belanger, Ars Technica.** "Claude's new Scarlet Letter watermark is
invisible for now," 13 August 2026. Her subheading, unprompted:

> **The mark flags anything Claude processed, even human writing it only edited.**

**That is this product's emotional centre, written by a reporter at a major tech
outlet, without being pitched.** She goes further in the body. She writes that a
model-level watermark cannot tell wholesale generation from a comma fix, so Claude
may stamp exactly the content the law was written to leave alone. She writes that
despite being explicitly exempted by the law, Claude will mark editing work done on
original writing. She writes that for images and video, any decent metadata editing
tool will remove the information, which concedes the metadata layer in print. And
she writes that how thoroughly it watermarks will not be known until Anthropic
releases a detection tool that can be tested, which is the "imminent, not callable"
fact in her own words.

**She is now my number one, ahead of everyone Phase 1 ranked.** The hook is not
manufactured, the reach is high, and the argument is already hers. **Her caution is
that she is critical of the watermark, which is not the same as friendly to a
removal product, and Ars readers test things.**

**2. Jess Weatherbed, The Verge.** Covered it twice: "Claude will apply invisible
watermarks to AI text and images," 11 August, and "Anthropic explains how Claude's
invisible text watermarks will work," 17 August. **Two pieces in a week means she
owns the beat at The Verge.** I did not read the bodies and I have not found a
published contact for her. **Check her basing before contacting: The Verge staffs
writers in the UK, and the US-only rule may exclude her.**

**Genuinely unreachable from here:**

- **Wired.** Blocked by policy in the browser as well as to the crawler. No route.
- **CNET, ZDNet, PCMag.** Not attempted, scope was narrowed. The crawler will fail.
- **The obfuscated emails** Phase 1 listed: Rubinson, Kaylee Williams, Indicator,
  Nieman Lab, Gizmodo, Glen Dickson, the Harvard Crimson bylines. **Most of these
  belong to people section 2 recommends not contacting**, so the yield is much
  lower than Phase 1 estimated. Not worth an hour.

**What I did not do, and why.** I did not read the robots-disallowed pages Phase 1
declined to circumvent, and I did not guess or permute a single address.

---

## 6. What now

1. **Jon decides the upstream question, section 3.** Nothing else can start.
2. **Jon accepts or rejects draft-now-send-later, section 4.**
3. **The prompt for Cowork is `docs/briefs/COWORK-3-press-drafting.md`**, ready to
   paste once 1 and 2 are answered. It carries the corrected numbers, the cut list,
   the claims boundary and the two recovered bylines.
4. **The engine and claims work in section 4 is the actual gate**, and it is already
   on the implementation board in lanes A and D. Press waits on it.
