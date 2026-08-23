# F1 — the full audit of the live site

**Run 22–23 August 2026.** un-claude.com was live and taking real money throughout.
Nothing was bought, nothing was deployed, no configuration was changed, and no
production data was touched except throwaway accounts whose email begins
`f1-audit-`. Those are deleted at the end of this note.

**How to read this.** Every finding below carries the actual output it came from,
pasted in, so it can be judged without reading any code. Where something could not
be reproduced, that is said in the finding rather than left out.

**Two words used throughout.** *Layer A* is the invisible characters — real
characters that sit between your words and display as nothing. *Layer B* is the
rewrite, which changes the wording to break the statistical watermark. Layer A and
the file metadata are provable. **Layer B is best effort and nothing below claims
otherwise** — no public detector exists, so nobody can check whether a statistical
watermark was removed, including us.

---

## THE SHORT VERSION

**One thing is badly wrong and it is the thing the product is sold on.** The rewrite
invents quotations. Give it a direct quote from a named person and it hands back
different words, still inside quotation marks, still attributed to that person. Three
times out of three. For a student that is a misquoted source — an academic misconduct
problem caused by the tool they paid to protect them, and invisible to them.

**The advertised size is roughly twice what works.** The site sells 10,000 words. On
production 6,000 completes in 196 seconds against a 240-second cut-off; 7,500, 8,500
and 9,900 all fail after about three and a half minutes. The customer waits and gets
nothing. Their credits do come back.

**Two ways the site takes money for nothing.** A paste under 16 words is charged a
credit, comes back byte for byte identical, and the screen says "Rewritten · Measured,
not estimated". And if a customer's connection drops mid-job they are charged and, so
far as I could see, not refunded.

**One security hole worth closing while it is cheap.** Any link beginning
`https://un-claude.com/` can be made to land the visitor on any other website, signed
out, no account needed. Three skeptics reproduced it and then talked me down from
"high" to "medium", on the grounds that a phishing link is only worth what the domain's
reputation is worth and this domain is two days old. **They are right, and it is still
one line of code — cheapest now, before the name is worth stealing.**

**Several claims are wrong in ways a curious visitor can disprove in ten seconds** —
"100% of detectable marks removed", "a hard three-word ceiling" (the site's own receipt
printed 6), "nine classes checked" (one of the nine finds nothing), "upload a file and
you get all three" (no file type gets all three). On a site whose whole argument is
that its claims survive checking, these are the expensive ones.

**And the news logos need a link or need to go.** Nine national mastheads scroll across
the homepage under 13-pixel grey type with nothing behind them.

**Now the good news, and it is substantial.** The two layers this product can actually
prove both work, and I tested them properly rather than taking them on trust. The
scanner found 15 of 15 planted invisible characters. A JPEG carrying a real C2PA
content-credential block had it found, named, removed, and confirmed absent in the
returned bytes. A Word document came back uncorrupted with every word intact and its
author name gone, and the panel told the truth about what it did and did not do. The
money boundary holds — no browser can change the price. Six simultaneous jobs against
one balance never overspent. The ledger passes every integrity check. And a credit
sells for between 67 and 135 times what it costs to run.

---

# EVERY FINDING, IN ONE TABLE

The report below grew as the audit ran, so findings are numbered in one section,
lettered in another, and a few have sections of their own. **This table is the whole
list in one place.** Everything marked "conductor" was reproduced by hand against the
live site with the output pasted in.

| # | severity | finding | verified by |
|---|---|---|---|
| 1 | **CRITICAL** | A 9,900-word document fails after 3½ minutes; the site advertises 10,000 | conductor, twice |
| 1b | **HIGH** | The tool inserts em dashes and curly apostrophes — the marks it exists to remove | conductor, 8 of 8 runs |
| 2 | **HIGH** | The rewrite invents quotations and leaves them attributed to a named person | conductor, 3 of 3 runs |
| 3 | MEDIUM | Any `un-claude.com` link can redirect to any website, signed out *(skeptics downgraded from high)* | conductor + 3 skeptics |
| 4 / C | **HIGH** | A paste under 16 words is charged a credit, returns identical text, and the screen says "Rewritten" | conductor + agent |
| A | MEDIUM | If Cloudflare is blocked the visitor hits an unrecoverable dead end that blames their internet *(downgraded)* | conductor + 3 skeptics |
| B | MEDIUM | The delete-account warning names teams and subscriptions that do not exist and never mentions credits *(reframed by a skeptic)* | conductor + 3 skeptics |
| E | **HIGH** | Any file over 3.2 MB fails; the site's own size message can never fire | conductor + agent |
| M | **HIGH** | "Upload a file and you get all three" — no accepted file type gets all three | conductor + 2 agents |
| N | **HIGH** | The site promises a three-word ceiling; its own receipt printed 6 | conductor |
| — | **HIGH** | Three of the four "enforced rather than promised" FAQ claims fail against the product's own receipt | conductor |
| — | **HIGH** | The refund tool says money is owed on a payment already refunded in full | conductor + skeptic |
| 5 | MEDIUM | The rewrite returns documents 6–14% longer and calls it "Length 114% kept" | conductor, 8 runs |
| 6 | MEDIUM | On repetitive text the rewrite silently deleted 22–29% of the document | conductor, twice |
| 7 | MEDIUM | A date vanished; the field designed to flag that came back empty | conductor |
| 8 | MEDIUM | The credit history prints dates in UTC, so the Americas see tomorrow | conductor |
| 9 | MEDIUM | The "words cleaned" counter goes backwards on reload | conductor, 4 loads |
| 10 | MEDIUM | The pricing page quotes 1 credit for a file and charges 5 | conductor |
| 11 | MEDIUM | Sixteen news logos under "The story, as covered by:" with no link to anything | conductor + agent |
| D | MEDIUM | The served page is a menu and a footer; 483 KB of script draws the rest | conductor |
| G | MEDIUM | Every page's link preview shows the homepage | conductor, 9 pages |
| H | MEDIUM | Header credit count and workbench chip disagree on screen | conductor, screenshot |
| L | MEDIUM | The only support channel is a `mailto:` that does nothing without a mail app | conductor |
| O | MEDIUM | "Nine classes checked" — the lookalike-letter class finds nothing | conductor |
| — | MEDIUM | A dropped connection charges the customer and does not refund | conductor, watched 8 min |
| — | MEDIUM | The credit check runs before the file check, so you can be told to pay for a job that will be refused | conductor |
| — | MEDIUM | A whitespace-only paste is charged a credit | conductor |
| — | MEDIUM | The domain has no MX records, so `support@un-claude.com` cannot exist | conductor |
| — | MEDIUM | No page has a main landmark or a skip link | conductor, 10 pages |
| — | HIGH (a11y) | After a scan the result becomes one button — a screen reader cannot read it | agent + conductor |
| — | HIGH (a11y) | Nothing announces working, finished or failed | conductor |
| 12 | LOW | The file input is in the tab order with no name; the paste box has only a placeholder | conductor |
| 13 | LOW | The header credit chip wraps onto two lines | conductor, both widths |
| I | LOW | A Word document is told "the picture itself is untouched" | conductor |
| Q | LOW | The privacy policy describes a cost record the database never writes | agent + conductor |
| — | LOW | "100% of detectable marks removed" — 15 found, 12 removed, 3 kept on purpose | conductor |

**And what passed** — the price boundary, the failure refund, the 10,000-word refusal,
Word-document integrity, layer A detection, the C2PA metadata layer, concurrency, the
ledger's integrity, every internal link, and the speed of the site itself. Those are in
"WHAT PASSED" and in the two layer sections, with their evidence.

---

# WHAT WAS FOUND — worst first

Everything in this section was run by the conductor against https://un-claude.com or
the live database, and the output pasted below is the real output.

---

## CRITICAL

### 1. A 9,900-word document fails, and 9,900 is inside the limit the site advertises

**What a student sees.** I pasted my dissertation chapter. It said "Rewriting" for
three and a half minutes. Then it said the rewrite could not be completed and to try
again. I got my credits back, so I have not lost money — but I have lost four
minutes and I still do not know whether this site can do the thing I came for.

**Tried twice. Failed twice.**

```
THE 10,000-WORD CASE ON PRODUCTION — never run before.
words in: 9900 | base64 chars: 89168 | balance before: 25
HTTP 400 | WALL CLOCK 227.8 seconds
BODY: {"ok":false,"code":"layer_b_failed","message":"The rewrite could not be
       completed. Nothing was charged. Please try again."}
```

```
words in: 9900 | base64 chars: 89168
HTTP 400 | WALL CLOCK 198.1 seconds
BODY: {"ok":false,"code":"layer_b_failed","message":"The rewrite could not be
       completed. Nothing was charged. Please try again."}
```

**The credit really did come back — the live ledger, not a report:**

```
id 1041    -10 spend            words_in=  9900   2026-08-23T06:24:24Z
id 1072    +10 operation_refund words_in=     -   2026-08-23T06:27:41Z
```

**Why this is the worst thing on the list.** The pricing page sells the Pro pack as
*"A dissertation, with room to spare"* and its calculator goes up to 100,000 words.
The engine cannot finish 9,900. The one case the product is sold on is the case that
does not work.

**It is also slow enough to be its own problem.** 198 and 228 seconds. The site
gives up at 240. There is no margin, and the time is not caused by length — it is
caused by how many times the internal fact-check demands a retry, which is why a
smaller document can take longer than a bigger one.

**Fix sketch.** Either lower the advertised limit to a size that actually completes,
or split long documents into jobs that are submitted and collected rather than waited
on. The current limit is a promise the engine cannot keep.

---

## HIGH

### 1b. The tool that removes AI signatures inserts the most famous one

**What a student sees.** Their teacher says the long dash is how she spots ChatGPT.
Their essay had none. It comes back with several, and every apostrophe has changed
shape.

**Eight live runs of my own, two different documents. Every single one:**

```
input -> output                          em-dash      curly apostrophe
varied2500 -> run 1                       0 -> 6            0 -> 18
varied2500 -> run 2                       0 -> 9            0 -> 22
varied2500 -> run 3                       0 -> 7            0 -> 22
varied2500 -> run 4                       0 -> 7            0 -> 22
varied2500 -> run 5                       0 -> 7            0 -> 16
essay      -> run 1                       0 -> 5            0 ->  6
essay      -> run 2                       0 -> 7            0 ->  6
essay      -> run 3                       0 -> 10           0 ->  7
```

**Zero going in. Never zero coming out. Eight times out of eight.**

**One of them, from my own run, in full:**

> "...notes imply she did not. Public sentiment eventually aligned with the contested
> appraisal**—**but only after a wait of close to two years."

**The engine agent measured how it scales**, and it scales with length: 100 words → 1
em dash, 1,000 → 6, 2,500 → 16, 5,000 → 34, **10,000 → 95**. It also found the same
run converting every straight apostrophe to a curly one, and — on some documents —
inserting markdown asterisks around headings and numbers, which paste into Word as
literal stars the student has to delete by hand.

**Why this belongs near the top.** The product exists to remove the marks that identify
writing as machine-made. The em dash and the curly apostrophe are among the most
commonly cited stylistic tells in the public conversation about spotting AI writing —
**I have not measured how many teachers actually use them, and this note does not claim
to**, but they are the marks the discussion is about, and the tool is adding them every
time, in proportion to how much the customer paid.

**What is measured, and is not a matter of opinion:** the customer's document goes in
with none and comes back with several, and **nothing in the product tells them.** The
scan checks invisible characters; an em dash is visible, so it is not looked for, and
the receipt does not mention punctuation at all.

**It is also the cheapest thing on this list to fix**: a post-pass that maps em dashes
back to the punctuation the customer used, restores straight apostrophes, and strips
markdown the input never had. It changes no meaning and needs no model.

---

### 2. The rewrite invents quotations and leaves them attributed to a real person

**What a student sees.** Nothing. That is the problem. The quotation marks are still
there, the name is still there, the sentence reads well — and the words inside the
quotation marks are not the words the source wrote.

**Three runs out of three, on the live site. The input, once:**

> Scholars have long disagreed about the purpose of the university essay. Marsh
> (2024) put it bluntly: **"The essay is no longer a private act of thinking, but a
> negotiation with a machine."** Others resist that framing. As Okonkwo notes, **"we
> have been negotiating with our tools since the first printing press, and the essay
> survived."**

**What came back:**

```
RUN 1  quote1_survived=false  quote2_survived=false  charged=1
  ...In a direct assessment from 2024, Marsh declared, "Writing an essay now means
  engaging with an algorithm rather than simply working through ideas alone."
  ...Okonkwo counters by pointing out, "Humanity has always adapted its methods to
  new instruments—even the printing press didn't erase the essay."

RUN 2  quote1_survived=false  quote2_survived=false  charged=1
  ...In stark terms, Marsh's 2024 assessment declared, "Essays are no longer
  solitary reflections—they've become exchanges with an algorithm."
  ...Okonkwo counters by arguing, "Humanity has always adapted to its instruments,
  from the printing press onward, and essays endured regardless."

RUN 3  quote1_survived=false  quote2_survived=false  charged=1
  ...Marsh (2024) declared that essays are "now a back-and-forth with an algorithm
  rather than a solitary reflection."
```

**This is worse than the board records it.** `LAUNCH-CHECKLIST` item 6f says the
rewrite "alters quoted text". What it actually does is **produce a new, fluent,
plausible quotation and leave it in quotation marks under the original name**. A
student cannot spot that by reading. A marker who checks the source finds a quote
that does not exist, and the consequence lands on the student.

**Fix sketch.** Protect spans inside quotation marks and pass them through the
rewrite untouched. There is no quote handling anywhere in the engine today.

---

### 3. Any un-claude.com link can be made to send a visitor to any other website
*(I first called this HIGH. Three skeptics reproduced it and argued it down to MEDIUM,
and they were right — the reasoning is below.)*

**What a student sees.** A link that starts `https://un-claude.com/`, so they trust
it, and a browser that lands somewhere else entirely. If that somewhere else is a
copy of the sign-in page, they type their password into it.

**Live, signed out, no account needed:**

```
next=https://example.com/         HTTP/2 307  location: https://example.com/
next=//example.com                HTTP/2 307  location: //example.com
next=https://evil.example/phish   HTTP/2 307  location: https://evil.example/phish
next=/home                        HTTP/2 307  location: /home
```

**Why it is medium and not high, in the skeptics' words rather than mine.** All three
reproduced it. The consequence skeptic then made the point I had missed: *"The callback
carries no token to the attacker's site (the code is exchanged server-side), so nothing
leaks; this is purely a phishing dressing — and un-claude.com is a two-day-old domain
with ~40 accounts, so its name buys a phisher almost nothing today."* **A phishing link
is worth what the domain's reputation is worth, and this domain has none yet.** That
will change, which is the argument for fixing it now while it is one line.

**Fix sketch.** `/auth/callback` should only ever redirect to a path on this site.
Reject anything with a scheme or a leading `//`.

---

### 4. A short paste is charged a credit and nothing at all is done to it

**What a student sees.** The first thing anyone does is paste one sentence to check
the tool works. It takes a credit and hands back exactly what they typed.

**The whole transaction, live:**

```
balance BEFORE : 36
HTTP           : 200
charged        : 1  balance in response: 35
report.stats   : {"input_length":39,"output_length":39,"removed":{},"replaced":{},
                  "removed_count":0,"replaced_count":0,"nfkc_changed":false}
layer_b        : {"skipped":"input_too_short","min_words":16,"words_in":8,
                  "reason":"The rewrite needs at least 16 words and this is 8.
                            Hidden characters and file data were still removed."}
INPUT  bytes   : 39 "A short note about nothing much at all."
OUTPUT bytes   : 39 "A short note about nothing much at all."
IDENTICAL      : true
balance AFTER  : 35
newest ledger row: {"id":895,"delta":-1,"reason":"spend","endpoint":"clean",
                    "words_in":8,"cost_usd":null}
```

Nothing was removed. Nothing was rewritten. It cost us nothing to run — `cost_usd`
is empty. The customer paid a credit.

**And the engine wrote the explanation the customer never sees.** That `reason`
sentence is well written and completely correct. It is in the response and nothing
on the page renders it. This is `LAUNCH-CHECKLIST` P2, confirmed live, with the
charge attached: the board records the silence, not the credit.

**It goes further than short pastes. One space costs a credit.**

```
an empty string              HTTP 400  no_file        balance 26 -> 26   (correctly refused)
a single space               HTTP 200  charged 1      balance 26 -> 25   input " "  output " "
spaces and newlines only     HTTP 200  charged 1      balance 25 -> 24   identical in and out
one word "Hello"             HTTP 200  charged 1      balance 24 -> 23   identical in and out
```

An empty box is guarded. **A box containing one space is not.** A customer who taps
the box, brushes the space bar and presses the button pays a credit for a space. With
five free credits, a stranger can burn the lot on nothing and never learn why.

**Fix sketch.** Either do not charge when the rewrite is skipped, or show the reason
and say plainly that only layer A ran. Charging silently is the worst of the three.
And the guard that already refuses an empty string should refuse a blank one too.

---
## MEDIUM

### 5. The rewrite hands back a longer document than you gave it, and calls that a feature

**What a student sees.** An essay with a 2,500-word limit comes back at 2,800.
Three hundred words over, and they would be marked down for it. The receipt on
screen says **"Length 114% — of the original kept"**, which reads like good news.

**Measured on the live site. Same 2,553-word input, five runs:**

| run | words in | words out | change |
|---|---|---|---|
| 1 | 2,553 | 2,698 | +5.7% |
| 2 | 2,553 | 2,833 | +11.0% |
| 3 | 2,553 | 2,763 | +8.2% |
| 4 | 2,553 | 2,784 | +9.0% |
| 5 | 2,553 | 2,748 | +7.6% |

**It depends on size.** At 730 words the length is roughly held (−8%, +4%, −3%
across three runs). Above about 2,000 words it runs consistently long. A separate
agent measured +14% at both 2,484 and 5,106 words.

**Fix sketch.** The existing guard only catches output that is far too long. A
tighter ceiling near the input length, and a receipt that says "300 words longer
than you gave us" instead of "114% kept", would both help.

---

### 6. On repetitive text the rewrite quietly deleted a third of the document

**What a student sees.** Nothing warns them. The document is simply shorter.

**Live, a 4,800-word text file:**

```
CHARGED       : 5 credits
usage         : {"words_in":4800,"words_out":3398,"seconds":82.587,"ok":true}
paragraphs in/out: 1 / 154   structure_kept: false
```

**1,402 words gone, and the engine knew.** `structure_kept: false` is the engine's
own verdict on its own output, and it returned the result anyway without telling
anyone.

**Stated honestly: this was repetitive text and it does not happen to ordinary
prose.** On varied writing the length holds or grows (finding 5). But a document
with repetition in it — a reference list, a table, a survey instrument, a legal
schedule — is a document a student may well upload, and there is no floor stopping
the rewrite from collapsing it.

---

### 7. A number vanished from the document, and the field designed to flag that was empty

**What a student sees.** Nothing. A date is simply missing from one sentence.

**Live, on a 2,553-word document containing ten mentions of the year 1974:**

```
FIGURES THAT LOST OCCURRENCES (in -> out):
    1974 : 10 -> 9

The engine's own receipt reported: figuresIn 53, figuresKept 47, figuresToCheck []
```

The engine counted 53 figures going in and 47 surviving. `figuresToCheck` — the
field whose entire job is to tell the customer which numbers to go and verify — came
back **empty**. The tool noticed and said nothing.

**Worth knowing:** the engine's count of "figures" and a plain count of the numbers
in the text disagree, so the 53/47 pair cannot be taken at face value either. What is
certain is the independently checked one: a year disappeared, and nothing said so.

---

### 8. The credit history shows tomorrow's date

**What a student sees.** They buy credits on Saturday evening and their history says
Sunday. If they ever match it against a bank statement, the dates do not line up.

**Live, on the wallet page, against the real timestamp in the database:**

```
DB row: [{"id":534,"delta":40,"reason":"adjustment",
          "created_at":"2026-08-23T01:54:18.516286+00:00"}]
Local (America/Los_Angeles): 8/22/2026, 6:54:18 PM
Displayed on /home:          "Aug 23, 2026"
```

The transaction happened at 6:54pm on the 22nd in California. The page says the 23rd.
The date is being printed in UTC instead of the customer's own time zone, so everyone
in the Americas sees tomorrow's date on anything done after late afternoon.

This is the money-display defect family again — the same one as the frozen header
count (6d) and the word counter that lied (B6). It is on the page that is a
financial record.

---

### 9. The "words cleaned" figure goes backwards when you reload the page

**Four consecutive fresh loads of the homepage:**

```
load 1:  2,783,981
load 2:  2,784,460
load 3:  2,783,987   <-- 473 lower than the load before it
load 4:  2,784,148
```

**This is not a complaint about the counter existing.** Decision 71 ruled that a
seeded figure rising on a clock is acceptable and why, and that ruling governs. The
finding is narrower: the component's own documentation states that it is *"anchored
to a fixed instant, not to page load"* and that *"a counter that restarts on refresh
is the tell that gives fake ones away."* On the live site it does restart on refresh.
It fails the one honesty property it was built to have, on a site whose whole
argument is that it does not overclaim.

---

### 10. The pricing page quotes one credit for a file and charges five

**What a student sees.** The page says files are one credit each whatever their
size. They upload a term paper as a `.txt` and are charged five.

**Live, a 4,800-word `.txt`:**

```
pricing page says: "One Word document or picture, any size" = 1 credit,
                   "Files are one credit each whatever their size"
CHARGED       : 5 credits
usage         : {"kind":"text","extension":".txt","words_in":4800,"layer_b_used":true}
```

**Both halves of the page are on the same page.** Further down, the FAQ gets it
right: *"One credit sanitises 1,000 words of text, whether you paste it in or upload
it as a .txt file."* But the summary bullets at the top and the caption under the
calculator say the opposite, and the summary is what people read.

This follows from Jon's ruling B7a — make `.txt` behave exactly like a paste — which
is the right call. The copy was updated in four places and these two were missed.

---

### 11. Sixteen news organisations' logos, and not one link to an article

**What a visitor sees.** Under the line **"The story, as covered by:"** a scrolling
band of CNN, ABC News and Forbes. It is the standard "as featured in" trust badge,
and it will be read as press coverage of un-claude.

**Live, from the homepage HTML — no link, no citation, no date:**

```html
<img src="/images/outlets/cnn.svg"    alt="CNN">
<img src="/images/outlets/abc.svg"    alt="ABC News">
<img src="/images/outlets/forbes.svg" alt="Forbes">
```

**Sixteen logo files are shipped and every one serves 200 on the live site:**
`abc, axios, cnet, cnn, forbes, fortune, guardian, npr, nyt, register, techcrunch,
wired, wsj`. Nine of them scroll past in the marquee.

**And it is far more prominent than the description suggests.** In a full-width
screenshot of the live homepage the logos — CNET, THE WALL STREET JOURNAL, The
Guardian, WIRED, The New York Times, CNN — run edge to edge at roughly 40 pixels
tall across the whole viewport. The qualifying line above them, *"The story, as
covered by:"*, is 13-pixel grey type. On a phone, scrolling, nobody reads the
13-pixel line.

**Why this is a finding and not a matter of taste.** The charitable reading — that
these outlets covered *AI watermarking*, not us — is defensible, and it is probably
what was meant. But a reader cannot check it, because nothing links anywhere. On a
site that now takes money from Americans, showing named companies' trademarks under
a coverage line with no article behind it is an implied endorsement, and that is a
category regulators recognise.

**The contrast makes the point.** The same homepage cites Anthropic properly — the
word "Anthropic" links to `anthropic.com/news/claude-text-watermark`, which returns
200. The site knows how to source a claim. It did not source this one.

---
## LOW

### 12. Someone using a screen reader meets an unnamed button on the way to the tool

**Live, from the homepage.** The file-upload control is one pixel square, invisible
on screen, **in the keyboard tab order**, and has no name of any kind:

```
{ "tag": "INPUT", "type": "file", "class": "sr-only",
  "width": 1, "height": 1, "tabIndex": 0,
  "aria-label": null, "labels": 0, "hidden": false }
```

A blind student tabbing through the page reaches it and is told nothing about what it
is. The paste box next to it has no label either — only a placeholder, which
disappears the moment they start typing:

```
{ "tag": "TEXTAREA", "aria-label": null, "aria-labelledby": null,
  "labels": 0, "aria-describedby": null,
  "placeholder": "Paste your text here, or drop a file anywhere in this box." }
```

These two controls **are** the product. Accessibility was never started (G1), so this
is a first look rather than a pass — a real pass needs a screen reader, which this
audit did not have.

---

### 13. The credit chip in the top bar breaks onto two lines

Confirmed live at both desktop and phone width, signed in: the pill reads "35" on one
line and "credits" underneath. This is `LAUNCH-CHECKLIST` 6e, still open, now with
live evidence at both widths. It is the first thing a paying customer sees.

---

# WHAT PASSED — checked, not assumed

These were probed against the live site and were correct. They are here because a
clean result that nobody records gets re-investigated next month.

### The money boundary holds
A browser cannot move the price. Every tampered request still came back at $4.99:

```
honest starter   HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered price   HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered qty     HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
tampered urls    HTTP 200 | echoed pack: {"id":"starter","name":"Starter","cents":499}
```
`price_cents`, `amount`, `unit_amount`, `currency`, `quantity: 1000`, `credits: 99999`,
`success_url` and `cancel_url` were all injected and all ignored. The returned address
is `checkout.stripe.com` every time. **No card form was opened and nothing was paid.**

### "A failed operation costs nothing" is true
Proven on the live ledger, on a run that really did fail:
```
id 1041    -10 spend            words_in= 9900   06:24:24Z
id 1072    +10 operation_refund words_in=    -   06:27:41Z
```

### The 10,000-word limit is real, fast and free
```
words in: 10064
HTTP 400 | WALL CLOCK 0.8 seconds
{"ok":false,"code":"too_many_words","message":"That is longer than 10,000 words,
 which is the most the rewrite can do in one go. Split it and run it in parts."}
balance after: 25   (unchanged)
```
Clear, honest, actionable, and it costs the customer nothing to find out.

### A Word document comes back as a valid Word document
A 3,000-word `.docx`, uploaded to the live site and the returned bytes opened:
```
zip integrity (None = ok): None
members: ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'docProps/core.xml']
words in output document.xml: 3000
actions: ["scrub docProps/core.xml field dc:creator",
          "scrub docProps/core.xml field cp:lastModifiedBy"]
```
Every one of the 3,000 words survived unchanged and the author name was removed. **A
corrupted document would be worse than an uncleaned one, and it is not corrupted.**

### The development pages are not exposed
`/dev/credits` and `/dev/states` both return `307` on the live site. A 404 page
returns a real 404 status. `GET /api/tool/scan` returns 405.

### The one claim the homepage sources, it sources correctly
`anthropic.com/news/claude-text-watermark` → HTTP 200.

---

# WHAT WAS MEASURED — production numbers that did not exist before

`LAUNCH-CHECKLIST` B11 has been open since the start: every timing this project held
was taken on a laptop, with no network, no base64 and no cold start, against a
different model. These are the real ones, taken through https://un-claude.com.

| words in | result | wall clock | credits | what it cost us |
|---|---|---|---|---|
| 8 | rewrite skipped, text unchanged | ~1 s | 1 | $0 |
| 40 (`.txt`) | rewritten | ~1 s | 1 | — |
| 47 (paste) | rewritten | 3.1 s | 1 | $0.00045 |
| 730 | rewritten, 3 chunks | ~8 s | 1 | — |
| 2,553 | rewritten, 8 chunks, 1–3 retries | 14.3 s | 3 | $0.0094 |
| 3,000 (`.docx`) | metadata only, **no rewrite** | 0.8 s | 1 | $0 |
| 4,800 (`.txt`) | rewritten, 2 retries | 83.4 s | 5 | $0.0248 |
| 9,900 | **FAILED** | 198 s / 228 s | 0 (refunded) | — |
| 10,064 | refused, correctly | 0.8 s | 0 | $0 |

**The margin is healthy and nobody had the number.** 4,800 words cost $0.0248 to run
and sold for 5 credits — $2.50 at the Starter price, $1.25 at Pro. That is between
50 and 100 times cost.

**Time does not track length, it tracks retries.** 2,553 words took 14 seconds; 4,800
took 83. The difference is how many times the internal fact-check demanded another go.
So no promise about how long a document of a given size will take can be true.

**A Word document never gets the rewrite** — `layer_b_used: false`, confirmed twice
live. **And the interface says so properly, which I initially doubted and then went
and checked.** A 3,000-word `.docx` was uploaded through the real file picker on the
live site, and the panel reads:

```
Statistical watermark        NOT REWRITTEN
  A Word document is cleaned of its metadata and its hidden characters. Its
  wording is not rewritten, so a statistical mark in the writing itself would
  stay. Paste the text instead to have it rewritten.

Metadata                     2 REMOVED
  Stripped, and the file was re-read afterwards to confirm nothing was left.
  1615 bytes in, 1593 out.
  Removed - scrub docProps/core.xml field dc:creator
  Removed - scrub docProps/core.xml field cp:lastModifiedBy
```

It also correctly identified the file as Claude's: *"This file names Claude as its
maker, in a signed record anyone can read with a free tool."* **That is item B7 fixed,
deployed and working**, told plainly at the moment of the upload with the remedy
attached. It is the best-written thing in the product.

---
# WHAT THIS AUDIT COULD NOT COVER, AND WHY

A step that was skipped is a step that failed. These are the gaps, stated plainly.

### Live Stripe could not be read at all
The Stripe key on this laptop is a **test-mode** key. The live key exists only inside
Vercel, and the command to read it was **blocked by this machine's permission
system**. I did not work around it.

**What that means concretely.** Nothing below could be checked: which webhook events
are actually configured on the live Stripe endpoint; whether the live charge and
refund records match the ledger; whether a second partial refund on one payment
behaves; anything about disputes. Everything about Stripe in this note is either
observed **through un-claude.com itself** (which does use the live key) or read from
the ledger's own copies of the Stripe identifiers.

**This is the exact trap that produced the Radar failure on 22 August** — a feature
that works in test mode because Stripe gives paid features away there, and is absent
in live. Any Stripe conclusion drawn from this laptop is worthless. If Jon wants the
live reconciliation done, it needs either the live key made readable or a check run
by him from the Stripe dashboard.

### Nobody used a screen reader
Finding 12 is read from the live page's own markup and computed styles. It is
accurate as far as it goes and it is not an accessibility pass. Colour contrast,
focus order, announcement of the "Rewriting" state and everything that needs a real
assistive technology were **not** tested.

### The card form was never opened
By instruction, and correctly. The payment path was verified up to the point where
Stripe's page begins and no further. That leg was already proven with real money on
22 August and checked against the live ledger.

### The browser pane could not be given to the agents
The in-app browser is one shared window for the whole session, so fourteen agents
could not each drive it. Everything visual in this note was done by the conductor by
hand, plus phone-width rendering through the repo's own Chrome harness. The agents
worked from the served HTML, the JavaScript bundles and the live API.

### The divider defect could not be reproduced by the conductor
One agent found the tool's internal `---` divider line scattered through finished
documents — 7 of them in a 2,484-word essay, 14 in a 5,106-word one — and quoted the
bytes. **The mechanism is real and confirmed in the engine's source**: `\n\n---\n` is
the literal boundary between the instructions and the customer's text in the prompt,
so the model can copy it into its answer.

**I could not reproduce it in 13 live runs** across eight different shapes of input:
730, 2,553 and 4,800 words of ordinary prose; real essay prose; punctuation soup; a
document of bare headings; numbers only; and a plain control. Zero dividers, and zero
occurrences of the prompt's own language, in every one.

**So: two agents reproduced it with the bytes quoted, and the conductor could not
reproduce it thirteen times.** The mechanism is confirmed in the engine's source —
`\n\n---\n` really is the literal boundary between the instructions and the customer's
text — so it is not imaginary. It is intermittent, and **nobody knows how often**. It is
recorded as real-but-unquantified rather than confirmed or dismissed, because both of
those would be a guess. **Settling it needs a proper measurement run, not a fix on
faith.**

**One thing that did turn up while chasing it, and is new.** An eighteen-word list of
ordinary nouns — `apple bicycle mountain window telephone garden ocean pencil...` — came
back `HTTP 400 layer_b_failed`. It is over the sixteen-word floor and it is not long.
**So length is not the only thing that makes the rewrite fail**, and a student pasting a
bibliography, a glossary or a list of terms may hit the same wall. That is worth a look
in whatever session takes finding 1.

---
# FOUND BY THE FLEET, THEN RE-RUN BY THE CONDUCTOR

Fourteen agents probed the live site. Three of their most serious findings were
re-run independently by hand, because a finding nobody probed twice is exactly this
project's characteristic failure. These three reproduced.

### A. If Cloudflare is blocked, the visitor is walked all the way to a dead end (MEDIUM)
*(I called this HIGH; the skeptics reproduced both halves and settled on MEDIUM, because
nothing measures how many visitors actually hit it. The dead end itself is not in doubt.)*

**What a student sees.** They paste an essay. The scan works. It tells them a
statistical watermark is presumed present and that they have 2 free credits. They
click Sanitise and get **"We could not start a session. Please try again."** They try
again. Same thing. Their wifi is fine.

**Reproduced by blocking `challenges.cloudflare.com` — which is what a pi-hole, a
privacy extension, or some campus and office networks do:**

```
--- AFTER CLICKING SANITISE ---
Sanitise it   1
Upload a file
We could not start a session. Please try again.
WHAT WE FOUND
Sanitise to remove it   2 free
Hidden characters      NONE FOUND
Statistical watermark  PRESUMED PRESENT
```

**Why it is worse than a plain outage.** The free scan still works, so the site looks
alive. The message blames the connection and suggests retrying, and retrying can
never work. And the hero says *"Free. No account needed"*, so the visitor cannot even
guess that signing up might help. Every step before the wall works perfectly, which
is what makes it expensive: they spend their attention and get nothing.

### B. The warning before an irreversible money-destroying click describes a different product (MEDIUM)
*(Originally written as "deleting an account destroys paid credits". The consequence
skeptic reframed it and improved it: losing your credits when you ask to delete your
account is the expected outcome and every service does it — that half is not a defect.
What survives, and is a defect, is the warning.)*

**The live text, from the settings page, word for word:**

> Danger Zone — Some actions cannot be undone. Please be careful.
> **Delete your Account**
> This will delete your account and **the accounts you own**. Furthermore, we will
> immediately **cancel any active subscriptions**. This action cannot be undone.

There are no "accounts you own" — there are no teams here. There are no
subscriptions; the pricing page says so in its own words: *"No subscription, no
monthly reset, nothing to cancel."*

**And it never mentions credits**, which is the only thing the customer actually
loses and the only thing they may have paid for. Deletion cascades — verified
independently: a throwaway account was funded, spent from, deleted, and its ledger
rows went with it.

**Also worth Jon's eye.** That whole page is untouched starter-kit boilerplate:
profile-picture upload, multi-factor authentication, name and email management —
features this product does not use and does not display anywhere. It is the one page
a paying customer opens to manage their money, and it does not mention money.

### C. A short paste tells the customer the rewrite happened (HIGH)

The agent found what finding 4 above missed: not only is the credit taken silently,
the screen **actively says the rewrite ran**. Its evidence: the panel reads
`Statistical watermark: Rewritten`, headed *"What the rewrite changed"* and labelled
*"Measured, not estimated"* — with `Replaced 0% of your wording`, `Length 100% kept`,
and every bar on the chart at 100%.

So the interface is not merely silent about the skipped rewrite. It reports it as
done, and puts the word "Measured" next to it.

---
### D. The page a visitor is served contains a menu and a footer, and nothing else (MEDIUM)

**Measured on the live homepage.** Strip out the `<script>` tags — which is what a
browser has on screen until half a megabyte of JavaScript has downloaded and run —
and this is the entire page:

```
bytes of <body> INCLUDING scripts : 131,261
bytes of <body> EXCLUDING scripts :   7,821
visible text outside <script>     :     373 chars

'Un - Claude  How it works  What we do  Our Mission  Pricing  Sign In  Sign Up
 Un - Claude  AI tools mark what they make, invisibly and without telling you.
 Un-Claude finds those marks and sanitises them.  © Copyright 2026 Un-Claude.
 All Rights Reserved.  Product ... Account ... Legal ...'
```

The headline, the paste box, the Scan button, the coverage panel and the counter are
**not in the page at all**. They are built by JavaScript after it arrives.

**How much JavaScript. 28 files, 494,734 bytes compressed on the wire.** The two
largest are 103 KB and 74 KB. On a good connection nobody notices. On a phone on
campus wifi the visitor sees a logo, a menu and a footer with an empty middle, and a
reasonable person concludes the site is broken and leaves.

**What this is NOT, said plainly so nobody chases it.** It is **not** an SEO problem.
Everything a search engine or a link preview reads from the page head is properly
server-rendered and correct — checked:

```
<title>Un-Claude · AI Watermark Remover</title>
<link rel="canonical" href="https://un-claude.com"/>
<meta name="description" ...>
og:title, og:description, og:url, og:site_name, og:image (1200x630), og:image:alt
twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image
```

And the preview image is real: `HTTP 200, image/png, 56,293 bytes, 1200 x 630`.

---
### E. Any file over about 3.2 MB fails, and the site's own size limit can never fire (HIGH)

**What a student sees.** They drag in a photo from their phone. It fails. Nothing
tells them the file is too big, or what size would work. They try again and it fails
again.

**The cliff, measured to the tenth of a megabyte on the live site:**

```
3.20 MB raw / 4.27 MB base64  ->  HTTP 200  OK
3.30 MB raw / 4.40 MB base64  ->  HTTP 413  Request Entity Too Large
3.40 MB raw / 4.54 MB base64  ->  HTTP 413  Request Entity Too Large
3.50 MB raw / 4.67 MB base64  ->  HTTP 413  Request Entity Too Large
5.00 MB raw / 6.67 MB base64  ->  HTTP 413  Request Entity Too Large
```

**The response is not from us. This is the whole body of it:**

```
Request Entity Too Large

FUNCTION_PAYLOAD_TOO_LARGE

sfo1::jv4rf-1787467141930-71f146a74fba
```

**Why that matters more than the limit itself.** The application has its own polite
message — *"That file is over the 5 MB limit. Try a smaller one."* — and **it can
never be shown to anybody.** It is set to trigger at 7,500,000 base64 characters,
about 5.5 MB. Vercel refuses the request at about 4.5 MB first, before our code runs
at all. So the guard is real, correct, well-worded, and unreachable.

And because Vercel's reply is plain text rather than the JSON the interface expects,
the workbench cannot read it and falls back to a generic failure.

**A file is turned into base64 to be sent, which makes it a third bigger.** That is
why a 3.3 MB photo becomes a 4.4 MB request. The site's limit is written in the wrong
units and in the wrong place.

**And the pricing page says: "One Word document or picture, any size."** A 4 MB photo
off a phone is an entirely ordinary thing to upload.

**Fix sketch.** Move the size check into the browser, before the upload is attempted,
and set it against the raw file size the user can actually see — about 3.2 MB — not
against the base64 length. Then the honest message becomes reachable and the pricing
copy can be made true.

---
### F. Six jobs fired at one account at the same time — the credits held (PASS)

`LAUNCH-CHECKLIST` G4 (concurrent-user stress) had never been run. Six simultaneous
sanitise requests were sent from one live account holding 10 credits, each job
costing 2. Five should succeed and one should be refused.

```
balance before: 10 | each job is 1140 words
  job 1: HTTP 200  ok charged=2 balance=8
  job 2: HTTP 402  insufficient_credits: This needs 2 credits and you have 0.
  job 3: HTTP 200  ok charged=2 balance=6
  job 4: HTTP 200  ok charged=2 balance=0
  job 5: HTTP 200  ok charged=2 balance=2
  job 6: HTTP 200  ok charged=2 balance=4

full ledger for this account:
   id 1319    +5 adjustment
   id 1320    +2 anon_grant
   id 1321    +3 signup_grant
   id 1325    -2 spend    words=1140
   id 1331    -2 spend    words=1140
   id 1332    -2 spend    words=1140
   id 1334    -2 spend    words=1140
   id 1336    -2 spend    words=1140
   SUM = 0   (never negative)
```

**Exactly five spends, one clean refusal, and the balance never went below zero.**
Nobody can spend credits they do not have by clicking fast or opening several tabs.
The atomic spend in the database does its job.

---
### G. Share any page and the preview shows the homepage (MEDIUM)

**What a student sees.** They send a friend the pricing link. The preview bubble in
the chat says *"Un-Claude · AI Watermark Remover"* with the front-page blurb about
scanning for watermarks. Nothing about prices. Every page they share looks the same.

**Checked on all nine live pages. Titles and canonicals are per-page and right. The
share tags are the homepage's, every time:**

```
/                    title Un-Claude · AI Watermark Remover   canonical https://un-claude.com
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/how-it-works        title How it works · Un-Claude           canonical .../how-it-works
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/pricing             title Pricing · Un-Claude                canonical .../pricing
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/capabilities        title What we do · Un-Claude             canonical .../capabilities
                     og:url https://un-claude.com   og:title Un-Claude · AI Watermark Remover
/mission /contact /terms-of-service /privacy-policy /cookie-policy — all the same
```

**The pattern is worth naming, because it is the same mistake in two places and only
one was caught.** The canonical work (D6) got nine of nine right. The Open Graph tags
need exactly the same per-page treatment and never got it — the root value leaks down
onto every page, which is precisely what standing rule D14 warns about for canonicals.

**Why it costs money.** The pricing page is the one people share when recommending a
paid tool. Its preview says nothing about pricing.

---
### H. Two different credit counts on the same screen, photographed (MEDIUM)

`LAUNCH-CHECKLIST` 6d says the header credit count freezes at page load and does not
move when you spend. Reproduced live, and both wrong numbers are visible at once in a
single screen of text taken straight after a sanitise:

```
Your credits
7 credits          <-- the header, still showing the balance from page load
...
WHAT WE REMOVED
Read the result before you use it
6
left               <-- the workbench chip, showing the real balance
```

Seven at the top of the page, six in the middle, at the same instant, both about
money. The customer has no way to know which is real without navigating away and back.

**The chip below it also wraps onto two lines** — that is 6e, and it is visible in
the same capture: the number and the word "credits" land on separate lines.

### I. A Word document is told the picture is untouched (LOW)

In the same live capture, the metadata panel for a `.docx` reads:

> "Stripped, and the file was re-read afterwards to confirm nothing was left. 1615
> bytes in, 1593 out, **and the picture itself is untouched.**"

A Word document is not a picture. The sentence was written for images and is reused
for every file type. It is the only wrong note in an otherwise very well-written
panel.

---
### J. The ledger itself is sound — every integrity check passed (PASS)

Run against the whole live ledger, with this audit's own throwaway accounts excluded
so the numbers are the real product's:

```
LIVE LEDGER, excluding this audit's throwaway accounts
  rows                : 85
  distinct accounts   : 30
  rows by reason      : {"anon_grant":24, "spend":40, "operation_refund":3,
                         "signup_grant":8, "adjustment":8, "purchase":1,
                         "money_refund":1}
  accounts with a NEGATIVE balance : 0   (none)
  ledger rows with delta = 0       : 0   (the table forbids it)
  duplicate payment intents        : 0
```

Nobody is in credit they did not earn, nobody is in debt, and no payment has been
counted twice. **The append-only guard is genuinely on in production** — on a
throwaway account a row was inserted, then an attempt was made to change it and to
delete it, and both were refused by the database.

### K. What losing the database would actually cost, as a number (context for E2)

`LAUNCH-CHECKLIST` E2 has been calling this a total loss of the money record and E2a
correctly softened it. Here is the real figure, today:

```
RECONSTRUCTIBLE FROM STRIPE if the database were lost :  1 row
NOT RECONSTRUCTIBLE (grants, spends, refunds, adjustments) : 84 rows across 30 accounts
```

**Only one purchase has ever been made, and it carries its Stripe payment intent, so
that one row could be rebuilt.** Everything else — who was granted what, who has spent
what — is only here.

**The honest reading: the stakes are small today and they only grow.** Thirty
accounts is a cheap thing to protect and a cheap thing to lose. Both of those stop
being true at the first hundred customers. This is the least painful moment this
decision will ever have.

---
### L. The only way to reach anybody is a mail app the visitor may not have (MEDIUM)

The contact page looks like a form — Subject, Your message, Send message — and it is
not one. There is no `<form>` tag on the page. The button opens the visitor's own mail
application with a draft. The page says so, honestly:

> "Or email unclaudeapp@gmail.com. **Nothing is sent from this page and nothing you
> type here is stored.** Your address is used to reply..."

**Where it breaks.** A student on a phone who reads mail through a browser rather than
a mail app taps Send message and nothing happens. They have typed out their problem
and it goes nowhere. This is `LAUNCH-CHECKLIST` E9, with the live consequence attached:
**this is the only support channel on a site that takes payments**, and it fails
silently for a plausible slice of the audience.

**One related thing for Jon, not a defect.** A customer who disputes a charge sees
`UN-CLAUDE.COM` on their card statement and is asked to write to a Gmail address. A
`support@un-claude.com` address costs nothing and answers that mismatch. A dispute
costs about $24.50 against a refund's ~$0.56, so anything that keeps a confused
customer emailing rather than calling their bank pays for itself immediately.

**Confirmed while I was there:** the refund policy really is discoverable — "refund"
appears 11 times on `/pricing` (including the small print, *"Unspent credits are
refundable for 30 days at the price you paid"*) and 20 times in the terms. C3 holds.

---
### M. "Upload a file and you get all three" — no file the tool accepts gets all three (HIGH)

Found by the copy agent, and it is the sharpest catch of the run because **this
project's own working agreement says it too**: *"Paste text and you get A and B.
Upload a file and you get all three."*

**Checked against my own live runs, file type by file type:**

| what you upload | invisible characters | metadata | the rewrite |
|---|---|---|---|
| `.txt` | yes | **nothing to remove — a text file has no wrapper** | yes |
| `.docx` | yes | yes | **no** — `layer_b_used: false`, confirmed twice |
| `.png` / `.jpg` | **no text to check** | yes | **no text to rewrite** |
| pasted text | yes | no file, so none | yes |

**There is no input that receives all three.** The live pricing page says *"Paste text
and you get the first and the third. Upload a file and you get all three."* A student
who uploads their essay as a Word file because the page told them uploading gets
everything pays a credit and never gets the rewrite — which is the layer they came for.

**The interface itself is honest about this** (see the panel quoted earlier: *"NOT
REWRITTEN ... Paste the text instead"*). The pages that sell the product are not.
The fix is copy, not code, and `CLAUDE.md`'s own summary table needs the same
correction.

**Three independent confirmations.** The copy agent and the legal agent found this
separately, and my own live `.docx` run measured it. The legal agent also found the
sentence on `/how-it-works`: *"Paste text and the first and third apply to you. Upload
a file and all three do."* — and noted that the same pricing page contradicts itself
four screens further down.

### N. The site promises a three-word ceiling and its own receipt reports six (HIGH)

**The live pages say, in three places:**

> `/how-it-works` heading: **"Three words in a row, maximum"**
> homepage FAQ: **"a hard three-word ceiling on surviving sequences"**
> the workbench: "Three words in a row is the most that survives"

**My own receipt, from a 2,553-word run on the live site earlier tonight:**

```
"longestRun": 6,
"runs": [{"length":3,...},{"length":4,...},{"length":5,...},{"length":6,...}]
```

The receipt the site puts on screen to prove the claim is the thing that disproves it.
A reader who checks — which is exactly the reader this site says it wants — finds the
number wrong on the same screen.

### O. "Nine classes of invisible character checked" — one of the nine finds nothing (MEDIUM)

**The claim, on two live pages and in the tool itself:**

> "Nine classes of invisible character checked on every scan. Each one is named, given
> its exact position, and the text is read back afterwards to confirm none remain.
> **You see the count.**"

**A sentence containing eleven Cyrillic lookalike letters hidden inside English
words — `rаpid`, `cоmmittee`, `repоrt`, `wаs`, `рublished` — scanned live:**

```
text contains 11 Cyrillic lookalike letters inside English words
suspicious_total : 0
hits             : []
classes the engine says it checks: strip, bidi, tag_chars, variation_selector,
                                   zwj_family, private_use, space, confusable, other_cf
```

`confusable` is on the engine's own list of nine and it found none of the eleven. The
workbench then tells the reader *"None in this text. 9 classes checked."*

**Why it is worth fixing rather than rewording.** Swapping Latin letters for
identical-looking Cyrillic ones is a real, widely used trick for slipping past text
matching. A student told their document is clean of all nine classes has been told
something the product did not check.

---
### P. The tool's own estimate says three minutes; the hero says seconds; the job then fails (adds to finding 1)

Captured live from the workbench with a 9,900-word paste in the box:

```
Sanitise it   10
9,900 words  =  10  ·  takes up to about 3 minutes
```

**The homepage, at the top of the same page:** *"We sanitise every kind of AI
watermark in seconds."*

So the product contradicts its own headline at the moment of the sale — which is the
honest half. The unhonest half is that **the job does not take about three minutes.
It takes three and a half and then fails** (198s and 228s, both times).

**The 402 is well done, and worth saying so.** When the same paste met an account
without enough credits, the screen read:

```
This needs 10 credits and you have 6. Scanning stays free and unlimited.
[ Get credits ]   [ Back to the scan ]
```

Exact numbers, a reassurance, and two ways forward. That is what every error message
in the product should look like — and it is the model for fixing findings 4 and E.

---
# WHAT TO DO, IN ORDER

Ranked by what protects a paying customer soonest, not by how hard it is. Revised
after the engine and accessibility results landed.

**1. Strip the tool's own fingerprints out of the output.** A post-pass that maps em
dashes back to the punctuation the customer used, restores straight apostrophes, and
removes markdown the input never had. **This is the cheapest item on the list and
close to the most valuable**, because right now the product adds the exact mark its
audience uses to spot machine writing — 95 of them in a 10,000-word essay. It needs no
model, changes no meaning, and can ship on its own.

**2. Stop the rewrite touching anything inside quotation marks.** A fabricated quote
attributed to a real person is the only defect here that can damage a student's
academic record, and they cannot see it. Everything else is money or friction; this
one is their degree.

**3. Make the advertised size a size that finishes.** 6,000 words completes in 196
seconds against a 240-second cut-off. 7,500, 8,500 and 9,900 all fail. Either drop the
limit to what reliably completes, or take long documents as a job the customer returns
to. **Do this before any marketing spend** — the Pro pack is sold as "a dissertation,
with room to spare".

**4. Do not charge for a rewrite that did not run — and stop the screen saying it
did.** Under 16 words the customer pays a credit, gets their own text back byte for
byte, and reads "Rewritten · Measured, not estimated". The engine already writes the
correct explanation; nothing displays it.

**5. Close the open redirect.** `/auth/callback` should only send a browser to a path
on this site. One condition, and it removes a phishing link wearing your own domain.

**6. Move the file-size check into the browser, at about 3.2 MB of actual file.**
Vercel rejects the upload before your code runs, so the polite message you already
wrote can never be shown. Phone photos routinely exceed this and the page says "any
size".

**7. Fix the claims that are checkable and wrong.** Copy only, and they are the ones a
careful reader will check first:
   - "Will it change my meaning, my facts, or my numbers? **No, and this is enforced
     rather than promised**" — three of its four enforcement promises fail against the
     product's own receipt.
   - "Upload a file and you get all three" — no accepted file type gets all three.
   - "a hard three-word ceiling" — your own receipt printed 6.
   - "100% of detectable marks removed" — 15 found, 12 removed, 3 deliberately kept.
   - "Nine classes ... checked" — the lookalike-letter class finds nothing.
   - "About four college essays" — your own calculator makes it three.
   - "in seconds" — your own price line says three minutes.

**8. Put a link behind the news logos, or take them down.** Nine national mastheads
scroll across the homepage under 13-pixel grey type with nothing behind them. This is
the one item that could arrive as a letter rather than a refund request.

**9. Give the tool a voice for screen readers.** Three things: stop wrapping the result
in a single button so it can be read; put `role="status"` on the line that says
"Rewriting" / "Sanitised" / the errors; name the paste box and the file input. A blind
student can currently pay and not hear the result.

**10. Tell the visitor when Cloudflare is the problem**, instead of a dead end that
blames their internet and invites them to retry forever.

**11. Rewrite the account-deletion warning.** It talks about teams and subscriptions
that do not exist and never mentions the credits they paid for and are about to lose.

**12. Add MX records and a real support address.** One DNS change closes three things:
`support@un-claude.com` becoming possible, a home for the DMARC reports, and the trust
gap when a customer sees `UN-CLAUDE.COM` on a statement and is asked to email a Gmail
account. A dispute costs ~$24.50; a refund ~$0.56.

**13. Give every page its own share tags.** Nine pages, one line each. The canonical
work already did exactly this and Open Graph was missed.

**14. The three numbers about money that are wrong on screen.** The header credit count
freezes at page load while the chip beside it updates; the credit history prints dates
in UTC so the Americas see tomorrow; and the receipt can report "Length 4000% of the
original kept" under a heading reading "Measured, not estimated".

**15. Record what a run costs.** The `cost_usd` column exists, the engine returns the
figure on every response, the privacy policy already tells customers it is stored, and
nothing writes it. It is the difference between knowing the margin and rebuilding it by
hand, as this note had to.

**16. Schedule the ledger backup while it is still 84 rows and 30 accounts.** Only one
row on the whole ledger could be rebuilt from Stripe.

---

# THE SIZE CEILING, SETTLED — the board's longest-open question

`LAUNCH-CHECKLIST` B3 set an "honest limit at 10,000 words" and B11 recorded that
nothing had ever been measured on production. Both are now answered. Every row below
was run through https://un-claude.com against a funded account with the developer
credit bypass off.

| words in | result | wall clock | retries | words back | charged | cost to us |
|---|---|---|---|---|---|---|
| 730 | ok | ~8 s | 0 | 670–760 | 1 | — |
| 2,553 | ok | 14.3 s | 1–3 | 2,698–2,833 | 3 | $0.0094 |
| 4,800 | ok | 83.4 s | 2 | 3,398 | 5 | $0.0248 |
| **6,000** | **ok** | **196.3 s** | **4** | **4,670** | 6 | $0.0562 |
| **7,500** | **FAILED** | **192.9 s** | — | — | 0, refunded | — |
| **8,500** | **FAILED** | **197.7 s** | — | — | 0, refunded | — |
| **9,900** | **FAILED** | **198 s / 227.8 s** | — | — | 0, refunded | — |
| 10,064 | refused, correctly | 0.8 s | — | — | 0 | $0 |

**The real ceiling is between 6,000 and 7,500 words. The site advertises 10,000.**

**Every failure gave the money back, and the ledger proves it four separate times:**

```
    -6 spend              words=6000        (succeeded, kept)
    -8 spend              words=7500
    +8 operation_refund
    -9 spend              words=8500
    +9 operation_refund
```

**The failures all land between 192 and 198 seconds**, whether the document is 7,500
words or 9,900. That is the signature of a fixed internal cut-off, not of a job that
grows too big — which matters, because it means the fix is not "make it faster for
long documents", it is "stop starting jobs that cannot finish inside the window, and
say so up front".

**And 6,000 is not a comfortable pass.** 196 seconds against a 240-second cut-off,
reached only after four retries. Whether a 6,000-word document works depends on how
many times the internal fact-check happens to demand another attempt, which is not
something a customer can predict and not something the page can promise.

**This is why the timings could not be extrapolated from the laptop.** The local
measurement was 10,464 words in 78.7 seconds. On production the same size does not
finish at all. Nothing about that gap is mysterious — network, base64, cold start and
a different model — but it is the concrete reason B11 mattered.

**A cost figure Jon has never had.** 6,000 words cost **5.6 cents** to run and sold
for 6 credits — $3.00 at the Starter price, $1.50 at Pro. Even at the worst pack
price that is a 27x margin, and the retries are already in the number.

---
# LAYER A, TESTED PROPERLY — the one layer that can be proved

Fifteen different invisible characters, one from each family the engine names, planted
in ordinary prose and put through the live site.

**Detection: fifteen out of fifteen. Nothing was missed.**

```
PLANTED: 15 distinct invisible characters
SCAN FOUND: suspicious_total = 15
   U+00A0 NO-BREAK SPACE          U+061C ARABIC LETTER MARK    U+180E MONGOLIAN VOWEL SEP
   U+2009 THIN SPACE              U+200B ZERO WIDTH SPACE      U+200C ZERO WIDTH NON-JOINER
   U+200D ZERO WIDTH JOINER       U+200E LEFT-TO-RIGHT MARK    U+200F RIGHT-TO-LEFT MARK
   U+202F NARROW NO-BREAK SPACE   U+2060 WORD JOINER           U+E000 PRIVATE USE
   U+FE0F VARIATION SELECTOR-16   U+FEFF ZERO WIDTH NBSP       U+E0041 TAG LATIN CAPITAL A

PLANTED BUT NOT REPORTED BY THE SCAN: (none)
```

**That is a genuine, countable pass and it deserves saying plainly: the scanner
works.** This is the layer the product can prove, and it proved it.

**Removal: twelve of the fifteen. Three are left behind on purpose.**

```
removed_count: 9 | replaced_count: 3
STILL PRESENT IN THE CLEANED TEXT: U+200E LRM, U+200F RLM, U+061C ARABIC LETTER MARK
RE-SCAN of the cleaned text: suspicious_total = 3   hits: ["U+061C","U+200E","U+200F"]
```

**And leaving them is the right call.** The engine says so in its own note, which the
scan returns on every run:

> "Load-bearing invisibles are preserved by default during cleaning: ... RTL
> directional marks/paired embeddings, and orthographic Arabic/Syriac Cf marks.
> **Inspection still reports bidi controls.**"

Those three characters carry meaning in Arabic and Hebrew. Stripping them would
corrupt a real document. **The engineering is correct.**

### The problem is that two sentences on the live site say otherwise (MEDIUM)

> Homepage hero: **"100% of detectable marks removed"**
> `/capabilities`: "Nine classes of invisible character checked on every scan. Each
> one is named, given its exact position, and **the text is read back afterwards to
> confirm none remain.** You see the count."

The tool detected 15 and removed 12. Read the text back and 3 remain. **Any curious
visitor can disprove both sentences in about ten seconds** — scan, clean, scan again —
and this is a site whose entire argument is that its claims survive checking.

**The fix is a sentence, not a change to the engine.** Something like "every mark that
can be safely removed, and we show you the ones we deliberately keep and why" is both
true and a better sales line, because it demonstrates the care rather than asserting a
round number.

---
### The plumbing under the site is correct (PASS)

```
http://un-claude.com/          308 -> https://un-claude.com/
https://www.un-claude.com/     308 -> https://un-claude.com/
http://www.un-claude.com/      308 -> https://www.un-claude.com/   (then to the apex)

robots.txt:  User-Agent: *  /  Allow: /  /  Sitemap: https://un-claude.com/sitemap.xml

every URL in the sitemap, fetched:
  /  200   /how-it-works 200   /capabilities 200   /mission 200   /contact 200
  /pricing 200   /cookie-policy 200   /terms-of-service 200   /privacy-policy 200
```

Every redirect is a permanent 308, the sitemap is complete and every address in it
answers. Nothing here is broken.

**One gap worth a line of robots.txt:** `Allow: /` with no exclusions means the
sign-in, sign-up, password-reset and account pages are open to search engines. Nobody
is harmed, but a stranger searching for the product can land on a bare "Update
Password" screen, and one of those pages carries the homepage's own title, so two
pages claim to be "Un-Claude · AI Watermark Remover".

---
# THE ECONOMICS, MEASURED — numbers Jon has never had

Every figure here comes from the `cost_usd` the AI Gateway itself reported on live
runs tonight, not from arithmetic on a token count.

| what | measured cost to us |
|---|---|
| 2,553 words | $0.0094 |
| 4,800 words | $0.0248 |
| 6,000 words | $0.0562 |
| **so, roughly** | **0.37 cents per 1,000 words — i.e. per credit sold** |

**What a credit costs versus what it sells for**

| pack | price per credit | cost to run | margin |
|---|---|---|---|
| Starter $4.99 / 10 | 50¢ | ~0.37¢ | **135x** |
| Plus $9.99 / 25 | 40¢ | ~0.37¢ | **108x** |
| Pro $24.99 / 100 | 25¢ | ~0.37¢ | **67x** |

**The pricing is not the problem, and it is not close.** Even the cheapest pack sells
a credit for 67 times what it costs, with the fact-guard retries already inside the
number.

**What the free tier costs.** A brand-new signed-up account is given 5 credits and can
spend them all on the rewrite, which is the only layer that costs real money:

- an anonymous visitor: 2 credits = 2,000 words ≈ **0.7 cents**
- a signed-up account: 5 credits = 5,000 words ≈ **1.9 cents**

**So a hundred strangers cost about 70 cents and a hundred signups about $1.90.** That
is a cheap way to buy a trial, and it means the free tier is not a leak worth
engineering against — including the forged-guest-cookie item (E13) that was
deliberately left open. **The worst that hole can do is give away about 0.7 cents at a
time**, which is the missing number that makes leaving it open the obviously right
call rather than a gamble.

**One caveat, and it is the reason to keep watching.** These figures are for
`mistral/mistral-medium` at tonight's gateway prices. The model has already changed
once (`mistral-small` to `mistral-medium`, which made the prompt-leak defect three
times worse). If it changes again, every number in this section changes with it, and
nothing in the product records what a job cost — see the ledger's empty `cost_usd`
column, which the ledger agent flagged and which is the one thing that would make this
table self-maintaining.

---

### Q. The privacy policy describes a record the database does not keep (LOW)

**The live privacy policy:**

> "Each time you clean something, one line is added to your credit history. It records
> the date and time, whether the input was a file or pasted text, how many words it
> contained, and how many credits it cost, **along with what the run cost us to
> perform.**"

**The live database:** the `cost_usd` column is empty on every spend row that exists.
Words, credits, input kind and timing are all recorded faithfully. What the run cost
is not recorded at all.

**Nobody is harmed** — the policy claims we store *more* than we do, which is the safe
direction. **But it is the reason the economics table earlier in this note had to be
assembled by hand from live runs**, and the reason it will go stale the next time the
model changes. One column, already in the schema, already populated in the engine's
own response, and nothing writes it.

---
# THE METADATA LAYER, TESTED END TO END — and it works (PASS)

This is the other layer the product can prove, and it had never been checked on
production against a real content-credential block.

**A JPEG was built carrying a C2PA block the way a real AI-generated image carries
one** — an APP11/JUMBF segment with the `c2pa` identifier and a claim generator
naming Claude — plus an ordinary EXIF block.

**The live scan found it:**

```
{
 "format": "jpeg",
 "has_c2pa": true,
 "has_ai_metadata": true,
 "findings": [
  "JPEG APP11 segment (JUMBF/C2PA common)",
  "JPEG APP11: c2pa, C2PA, Claude, c2pa, C2PA, jumb, JUMB"
 ],
 "findings_confidence": ["confirmed", "probable"],
 "tools": { "c2patool": {"available": false}, "exiftool": {"available": false} }
}
```

**The live clean removed it, and said exactly what it did:**

```
"actions": ["drop APP11 (C2PA/JUMBF)", "drop APP1", "copied remainder after non-marker byte"],
"bytes_in": 1083915, "bytes_out": 1083711,
"still_has_c2pa": false, "still_has_ai_metadata": false, "post_findings": []
```

**Checked independently against the returned bytes, not taken on report:**

```
before:  segments [APP11, APP0, APP1]   c2pa: yes   jumb: yes   claim_generator: yes   "Claude": yes
after:   segments [APP0]                c2pa: NO    jumb: NO    claim_generator: NO    "Claude": NO
```

**Every trace gone, and the picture itself untouched.** A plain EXIF-only JPEG was
tested the same way and its whole EXIF block was removed while the image data stayed
byte-identical.

**One thing that looked alarming and is not.** The scan reports
`c2patool: available: false` and `exiftool: available: false` — neither external tool
is installed on the production function. **That does not matter**: the engine does its
own byte-level scan of the file's segments and, as shown above, both finds and removes
the content credentials without them. I chased this expecting the metadata layer to be
dead in production and it is not. Worth writing down so nobody else chases it.

---
# STILL BEING CHECKED WHEN THIS WAS WRITTEN — leads, not verdicts

**Read this section differently from every other section.** Everything above was
reproduced against the live site by hand, with the output pasted in. Everything below
was found by one agent and **has not yet been through the three skeptics**, so it is a
lead worth following rather than a finding to act on.

**Why they are unadjudicated.** The audit was designed so every finding faces three
independent agents each trying to refute it, one of which re-runs the reproduction
command itself. Those skeptics were still queued behind the remaining dimension
probes when this note was written. **They are not "refuted" and they are not
"confirmed" — nobody has checked them yet.**

**Two of them I did adjudicate myself and they are covered above:** the homepage
shipping no content (section D — the SEO half of that claim is wrong; the page head is
correctly server-rendered) and the `---` divider leaking into documents (I could not
reproduce it in 8 live runs; see "what this audit could not cover").

**Nine of the fourteen dimensions had reported when this was written.** Dimensions 4
(the engine), 10 (accessibility), 11 (performance), 12 (friction) and 13 (failure
modes) and 14 (operations) were still running.

| severity | what | dimension | live? | already known |
|---|---|---|---|---|
| **high** | If you refund someone who has deleted their account, the site rejects the refund message from Stripe over a... | 1 | yes | — |
| **high** | The tool's own internal divider line gets scattered through the customer's finished document | 5 | yes | — |
| **high** | The homepage sends Google an empty page — no headline, no words, nothing but the menu and the footer | 9 | yes | — |
| **medium** | The ledger records what every job earned but never what it cost, so nothing can tell whether a job made mon... | 2 | yes | — |
| **medium** | Every rewrite tells the customer's browser exactly what the job cost us, which model ran it, and how long o... | 2 | yes | — |
| **medium** | The tool Jon is told to run before refunding says money is still owed on a payment that has already been re... | 1 | yes | — |
| **medium** | Guest credits really can be left behind when the confirmation email is opened on another device, and nothin... | 3 | yes | H1 |
| **medium** | A 5,000-word essay failed outright on the first live attempt, then worked on the second | 5 | yes | B11 |
| **medium** | The homepage answers "Will it change my meaning, my facts, or my numbers?" with a flat No, on the one layer... | 7 | yes | — |
| **medium** | The Starter pack says it covers about four college essays. By the site's own calculator it covers three. | 7 | yes | — |
| **medium** | Plain text files are missing from every list of what you can upload, and they are the one upload charged by... | 7 | yes | — |
| **medium** | The website is missing five of the six standard browser safety headers on every page, including the pages t... | Dimension 6 | yes | — |
| **medium** | HYPOTHESIS, not confirmed: every free scan may write the visitor's raw IP address into our own database, an... | 8 | **no** | — |
| **low** | On a refund row the money column stores Stripe's running total, so adding the refund rows up says more mone... | 2 | yes | — |
| **low** | The instruction printed at the top of the money-record reader does not work — it crashes | 1 | yes | — |
| **low** | The site sends none of the standard browser security headers except HSTS | Security | yes | — |
| **low** | The rewrite response tells any caller which AI model, gateway, temperature and prompt size it uses | Security | yes | — |
| **low** | Live evidence suggests the P1 prompt-leak fix is ALREADY deployed, though the checklist says it is not | Security | yes | P1 |
| **low** | The sign-up page promises 3 free credits and a brand-new account is actually given 5 | 3 | yes | B12 |
| **low** | Signing out on one device signs you out of every device, with no warning | 3 | yes | — |
| **low** | The sign-up page shows the same terms sentence twice and its Google button says "Sign in" on a page headed ... | 3 | yes | — |
| **low** | The sign-in failure page tells the browser tab it is the homepage | 3 | yes | — |
| **low** | If copying the clean text fails, the button does nothing at all and never says why | 5 | yes | — |
| **low** | Six sign-in and account pages are open to Google with no address of their own, and two of them wear another... | 9 | yes | — |
| **low** | The site has no structured data in the pages it serves, and the one piece that was written never gets there | 9 | yes | D12 |
| **low** | The pricing page's search-result summary is two characters over the length Google shows | 9 | yes | — |
| **low** | The site has no web app manifest, so saving it to a phone home screen gives a generic tile | 9 | yes | — |
| **low** | A heading says every major lab has signed up. The table an inch to the right says one has not. | 7 | yes | — |
| **low** | An FAQ asks about PDFs and never answers, and never mentions images, which the tool has always accepted. | 7 | yes | 6c |
| **low** | The cookie policy says exactly three things are stored on your device. A signed-in customer who collapses t... | 8 | yes | — |

**The three worth looking at first, if only these are ever followed up:**

1. **Refunding someone who has already deleted their account.** The agent reports that
   Stripe's refund message is rejected by the site over and over for about three days,
   with nobody watching. Plausible, unverified, and it touches real money.
2. **The ledger never records what a job cost.** Confirmed independently by the legal
   agent against the privacy policy, and it is the reason the economics table in this
   note had to be assembled by hand.
3. **The rewrite response hands any caller the model name, the gateway, the
   temperature and the length of the internal prompt.** Two agents found this
   separately. It is reconnaissance for exactly the prompt-injection family that
   produced the P1 defect.

---
# THE FOUR ENFORCEMENT PROMISES, MEASURED AGAINST MY OWN LIVE RUNS (HIGH)

The homepage FAQ makes four specific, checkable promises about the rewrite. They are
not marketing adjectives — they are engineering claims, stated as enforced. **They are
also inside the page's FAQPage structured data**, which is the text Google may show
directly in a search result.

**Promise 1, live, verbatim:**

> **"Will it change my meaning, my facts, or my numbers?"**
> "**No, and this is enforced rather than promised.** Every number, date and name is
> checked against your original and the section retries if one drifts. **Length is
> held within a tenth**, and the receipt shows the figures carried through."

**Promise 2, live, verbatim:**

> "Ours is a purpose-built engine, not a prompt: **a hard three-word ceiling on
> surviving sequences** ... every number, date and name checked against your original
> with a retry if one drifts, and length held within a tenth. Across our test set it
> **breaks over 90% of three-word sequences with zero figures lost**."

**What I measured on the live site tonight:**

| the promise | what happened |
|---|---|
| "it will not change my facts" | **A quotation attributed to a named person came back with different words inside the quotation marks. Three runs out of three.** A quotation is a fact about what someone said. |
| "every number ... checked" | **One of ten mentions of the year 1974 was dropped.** The engine's own receipt said 53 figures in, 47 kept, and its "figures to check" list was empty. |
| "length is held within a tenth" | **Broken in both directions and by a wide margin.** 2,553 → 2,833 words is +11.0%. 4,800 → 3,398 is −29%. 6,000 → 4,670 is −22%. |
| "a hard three-word ceiling" | **My own receipt from a live run printed `"longestRun": 6`.** |

**Why this cluster matters more than any single item in it.** "Enforced rather than
promised" is the strongest sentence on the site, and it is the one a careful reader
will believe. It is also the one they can check, because the product hands them the
receipt to check it with. Three of the four promises fail against that same receipt.

**And it is the one part of the copy that is not fixable by rewording alone.** "Length
is held within a tenth" can be softened. "It will not change your facts" cannot be
softened into something that is both true and worth saying — a student needs their
quotations and figures intact, and today they are not guaranteed to be. **That is the
engine work, and it is the same work as finding 2.**

---
# OPERATIONS — the domain, the mail and the certificate

```
A record        un-claude.com -> 76.76.21.21   (Vercel)
MX              (none at all)
SPF at the root (none)
DMARC           v=DMARC1; p=reject;            (no rua= reporting address)
DKIM            resend selector present
TLS             Let's Encrypt, 18 Aug 2026 -> 16 Nov 2026, auto-renewing
```

**The certificate is healthy** and renews itself. Nothing to do.

**DMARC is set to `p=reject`, which is the strict setting and the right one.** With no
`rua=` address nobody ever sees the reports, which is `LAUNCH-CHECKLIST` E7 and is
confirmed here. E8 (no SPF at the root) is confirmed too; DKIM carries alignment, so
outbound mail still authenticates.

**The one worth acting on: the domain cannot receive email at all.** There are no MX
records. That means:

- `support@un-claude.com`, which is the address a confused customer will guess, does
  not exist and never bounces into anyone's inbox.
- The DMARC reporting address in E7 has nowhere to point until this changes.
- It is why the contact page is a `mailto:` to a Gmail address (finding L), and why a
  customer who disputes a charge sees `UN-CLAUDE.COM` on their statement and is asked
  to write to a personal-looking Gmail account.

**This is one DNS change and it closes three items at once** — a real support address,
a home for the DMARC reports, and the trust mismatch at the moment a customer is
deciding between emailing you and calling their bank. A dispute costs about $24.50; a
refund costs about $0.56.

---
# THE CONNECTION-DROP CASE — charged, and not refunded (MEDIUM)

Nobody had tested what happens when the customer's connection dies mid-job. It is the
student on a train, the phone that locks, the tab closed by accident. **With jobs
running for minutes, that window is wide.**

**Run live: a 2,553-word paste, connection dropped by the client at 6 seconds.**

```
balance before: 58
>>> connection dropped by the client at 6s (the train goes into a tunnel)
client saw: AbortError - This operation was aborted
balance immediately after the drop: 55        <- 3 credits taken
```

**Then watched for eight minutes.** For reference, the two genuine server-side failures
earlier that night were refunded after 3 minutes 11 seconds and 3 minutes 16 seconds,
so the window was known:

```
  +1 min: refunds after row 1630: none
  +2 min: none
  ...
  +8 min: none

CONCLUSION: no refund after 8 minutes. The credit was kept.
```

The ledger shows `id 1630, -3 spend, words=2553` with no matching `operation_refund`,
while every server-side failure that night has one.

**This is not a coding mistake, and saying so matters.** The credit is spent up front,
the engine does the work, and the answer is delivered to a browser that is no longer
there. From the server's point of view the operation succeeded. From the customer's
point of view they paid and got nothing, and the pricing page says *"A failed run costs
nothing. The credits go straight back to your balance."*

**It compounds the size problem.** A job that takes three minutes has three minutes in
which a phone can lock or a train can enter a tunnel. Shortening the jobs (finding 1)
shrinks this one too.

---
# ACCESSIBILITY — never started, and now opened (G1)

The accessibility agent did the fullest pass, and it was scrupulous about what it
could not see: no browser, no screen reader, no zoom testing. What follows is what I
re-ran and confirmed myself, plus its strongest finding.

### No page has a main landmark and no page has a skip link (MEDIUM)

**Checked on ten live pages. Not one has any of them:**

```
/                      <main>=0  role=main=0  skip-link=0  <h1>=0
/pricing               <main>=0  role=main=0  skip-link=0  <h1>=1
/how-it-works          <main>=0  role=main=0  skip-link=0  <h1>=1
/capabilities          <main>=0  role=main=0  skip-link=0  <h1>=1
/mission               <main>=0  role=main=0  skip-link=0  <h1>=1
/contact               <main>=0  role=main=0  skip-link=0  <h1>=1
/terms-of-service      <main>=0  role=main=0  skip-link=0  <h1>=1
/privacy-policy        <main>=0  role=main=0  skip-link=0  <h1>=1
/cookie-policy         <main>=0  role=main=0  skip-link=0  <h1>=1
/auth/sign-in          <main>=0  role=main=0  skip-link=0  <h1>=0
```

Every visit, on every page, a screen-reader user walks past the logo, four menu links
and two buttons before reaching anything they came for, with no way to jump.

**The homepage has no `<h1>` in the page it serves** — a consequence of everything
being drawn by JavaScript (section D), not a separate defect.

### After a scan, the result becomes a single button — a blind student cannot read what they paid for (HIGH)

The agent's sharpest catch. Once a scan completes, the whole text panel is wrapped in:

```
role: "button", tabIndex: 0, "aria-label": "Edit this text"
```

**I saw this myself in the browser's own accessibility tree** — before the scan it read
`textbox "Paste your text here..."`, and afterwards the same region read
`button "Edit this text"`.

Under the ARIA rule for presentational children, everything inside a button collapses
into its label. So a screen reader announces *"Edit this text, button"* and will not
read out the essay, will not say where the hidden characters were, and after the
customer pays, will not read back the clean text either. **They have bought a result
they cannot hear.**

Stated honestly: this rests on the ARIA specification and on the live markup, not on a
screen-reader run. Nobody put VoiceOver on it. It is the first thing to check with one.

### Nothing announces that the tool is working, has finished, or has failed (HIGH)

The whole served homepage contains **one** `aria-live` region and no `role="status"` or
`role="alert"` on the status line that carries "Rewriting", "Sanitised" and every error
message. A sighted user watches the button change for up to three minutes. A screen
reader user gets silence, and never hears the error at all.

### The colours on the part that takes the money are the hardest to read (MEDIUM)

Measured from the live stylesheet's own tokens: the muted grey used for the scan
results (`#6A6963` on `#FAF9F5`), the white label on the orange Sanitise button
(`--mark #D97756`), and the pale white numbers on the "Most popular" pricing card all
fall below the readable minimum. **The card you most want a customer to read is the
one they can read least**, including "25,000 words" and "40¢ a credit" — the two
numbers they use to choose a pack.

### What nobody did, and it should be said plainly

No screen reader was run. No zoom or reflow testing at 320px or 400%. No keyboard tab
order was walked in a real browser. No axe-core, no Lighthouse. **This is a first look
that found real things, not an accessibility pass**, and G1 should still be treated as
open.

---
# THE REFUND TOOL TELLS JON TO REFUND MONEY THAT IS ALREADY REFUNDED (HIGH)

`CURRENT-HANDOFF.md` tells Jon to run `stripe-refund-check.mjs` **before refunding
anyone**, and the webhook route points at it too. It is the one thing standing between
him and a mistake with real money.

**Run tonight against the only real purchase the site has ever taken — the $4.99 pack
that was bought and then fully refunded on 22 August:**

```
ACCOUNT          3c559e2e-0b73-4bd8-8c7c-5daebd0248ce
PAYMENT          pi_3U74cIHwIcwEXjEP0HaPlfow
PURCHASED        10 credits for $4.99
                 2026-08-22  (1 days ago)

BALANCE NOW      1 credits
SPENT (lifetime) 2 credits
ALREADY REFUNDED 10 credits

>> REFUNDABLE    1 of 10 credits
>> THAT IS       $0.50 of $4.99
...
Refund in the Stripe dashboard.
```

**It prints "ALREADY REFUNDED 10 credits" and then, four lines later, tells him to
refund another 50 cents.**

**Two separate errors, both confirmed:** the already-refunded figure is calculated and
displayed but never subtracted from the refundable one; and the balance it works from
includes free grant credits, so the 1 credit it is offering to refund is a **signup
gift the customer never paid for**.

**Fifty cents today.** But this is a decision aid on the path where money leaves, it
will be run before every refund from now on, and it is wrong in the direction of
paying out too much. It was found by the money agent, re-run by the reproduction
skeptic against the live database, and re-run again here.

**One thing the skeptic caught that is mine, not the product's.** The briefing I wrote
for the fourteen agents repeated the broken command from that script's own header —
`cd apps/web && node scripts/read-ledger.mjs`, which crashes because the script reads
its environment relative to itself. It must be run from `apps/web/scripts/`. Several
agents lost time to it before working it out.

---
# PERFORMANCE, MEASURED ON THE LIVE SITE (dimension 11)

The performance agent never returned — it died with the run's second usage limit. This
section is the conductor's own measurement.

### Delivering the page is genuinely fast, and that deserves saying

**Three runs per page, the middle one reported:**

| page | TTFB | total | HTML size | Vercel cache | compression |
|---|---|---|---|---|---|
| `/` | 228 ms | 237 ms | 25.0 KB | HIT | brotli |
| `/pricing` | 146 ms | 150 ms | 30.3 KB | HIT | brotli |
| `/how-it-works` | 241 ms | 249 ms | 33.1 KB | HIT | brotli |
| `/capabilities` | 183 ms | 188 ms | 26.8 KB | HIT | brotli |
| `/mission` | 201 ms | 213 ms | 20.5 KB | HIT | brotli |
| `/contact` | 172 ms | 182 ms | 18.1 KB | HIT | brotli |
| `/terms-of-service` | 197 ms | 203 ms | 25.8 KB | HIT | brotli |
| `/privacy-policy` | 144 ms | 161 ms | 28.0 KB | HIT | brotli |
| `/cookie-policy` | 145 ms | 158 ms | 20.8 KB | HIT | brotli |

**Every page a cache hit, every page brotli-compressed, every page under 250 ms.**
Nothing to fix here.

### What arrives after the page is the problem

```
HTML                        25 KB
CSS                          (2 files)
JavaScript   28 files      483 KB
images       18 files       ~33 KB   (all SVG except one 6.8 KB PNG — nothing to fix)
PostHog      array.js        81 KB
Cloudflare Turnstile        (loaded on top)
                          -------
a first visit             ~620 KB, of which ~564 KB is script
```

**And none of the page's content exists until that script has run** (section D). So the
fast HTML buys nothing: the visitor gets a menu and a footer in 230 ms and then waits
on half a megabyte of JavaScript for the headline and the tool.

**One line item worth a decision.** PostHog is **81 KB — about one sixth of all the
script on the page** — and `LAUNCH-CHECKLIST` G3 records that nothing is instrumented:
no funnel, and nothing measuring the different-device gap (H1) that the board calls the
most likely real-world failure left. **The site is paying the weight and not getting
the answers.** Either instrument it or drop it; carrying it unused is the worst of both.

### What could not be measured

No Core Web Vitals. LCP, CLS and INP need a real browser with field or lab
instrumentation, and I had one shared browser and no Lighthouse. **I did not estimate
them and will not present a guess as a measurement.** What can be said from the numbers
above is that LCP is bounded below by the script parse, because the largest element on
the page does not exist until then.

The engine's cold start was also not isolated: production is warm most of the time now,
and I could not establish a genuinely cold function with confidence.

---
# OPERATIONS — the deploy gap, and two corrections to the board (dimension 14)

The operations agent never returned; this is the conductor's own work.

### Correction 1: almost everything the board lists as "awaiting deploy" is live

`LAUNCH-CHECKLIST` records P1 as "FIXED — AWAITING DEPLOY" and item 6a says "a second
deploy is pending ... W7's seven fixes are committed and verified locally but **are not
on the live site**". **Tested one at a time against production:**

| item | what it is | live? | how I know |
|---|---|---|---|
| **P1** | the prompt-leak fix — rules moved into a system role | **DEPLOYED** | a 29-word paste, rewrite ran, response reports `message_roles: system+user` |
| **P2** | the 16-word floor below which the rewrite is skipped | **DEPLOYED** | `{"skipped":"input_too_short","min_words":16}` |
| **B7a** | `.txt` behaves like a paste — priced by the word and rewritten | **DEPLOYED** | a 4,800-word `.txt` with the rewrite on: `charged 5`, `layer_b_used: true` |
| **B7** | a Word document says "NOT REWRITTEN" instead of "Rewriting" | **DEPLOYED** | the live panel, quoted earlier in this note |
| **W7** | nav label changed to "What we do" | **DEPLOYED** | live homepage: "What we do" ×4, "Capabilities" ×0 |
| **D6** | canonical on every page | **DEPLOYED** | 9 of 9 checked |

**One caution I hit myself and it is worth passing on.** My first attempt at this table
got two of them wrong — I tested P1 with a 16-word input, which is below the floor so
the rewrite never ran and the field I was looking for was absent; and I tested the
`.txt` pricing with the rewrite switched off, which is the case that has always cost 1
credit. Both looked like "NOT DEPLOYED" and both were my own test error. **A negative
result from a badly-built probe is the same shape as the phantom findings this audit
exists to prevent.**

**What genuinely is still broken on the live site** — these are open defects, not
undeployed fixes: the header credit count freezing (6d), the credit chip wrapping (6e),
the rewrite altering quotations (6f), and the stale FAQ answer (6c).

### Correction 2: the "nothing is pushed" risk is closed

The board's tracked risk #5 says *"Nothing is pushed (E4). 76 commits exist only on this
machine"*, and item 4 says *"109 commits exist only on this laptop while the site is
live."*

```
commits on this laptop:      250
commits not on GitHub:       5      (and 5 of those are this audit's own, from tonight)
newest on GitHub:            069de01 "Two launch briefs, to be run from their own chats"
```

**Everything that existed before this session is on GitHub.** The laptop is no longer
the only copy. That risk can come off the board.

### Still true, and still worth doing

Nothing is watching production (E1, no Sentry) and nothing backs up the ledger (E2).
Both stand. The backup's real stakes are in the section above: 84 rows across 30
accounts, of which exactly one could be rebuilt from Stripe.

---
# ERROR HANDLING AND FAILURE MODES (dimension 13)

That agent died with the run's usage limit too. This is the conductor's own pass.

### Ten deliberately broken inputs, sent to the live site

**Correctly refused, and nothing charged:**

```
a .docx that is not a zip at all           400  bad_format
a zip with no word/document.xml            400  bad_format
a .png that is not a PNG                   400  bad_format
a real PNG renamed .docx                   400  bad_format
a single null byte                         400  bad_format
a .pdf                                     400  bad_format
```

All six get the same message, and it is a good one: **"That file type is not supported.
Use text, a Word document, PNG or JPG."** Clear, and it names the way out.

**This answers an open question on the board.** `LAUNCH-CHECKLIST` B2a says *"`.pdf` is
in the engine's `CONTAINER_EXTS` while 04 entry 26 says PDF is deliberately unsupported
— nobody knows what a PDF upload does today."* **It is refused, cleanly, free of
charge.** That item can be closed.

**Accepted and charged one credit each:**

```
text that is only whitespace               200  OK  charged=1  kind=text
text that is only emoji                    200  OK  charged=1  kind=text
text that is only invisible characters     200  OK  charged=1  kind=text
a .jpg with a truncated scan               200  OK  charged=1  kind=image
```

**The whitespace one is a defect** and it is the same family as finding 4: a customer
whose paste silently failed, or who hit the button with an empty-looking box, is
charged a credit to have nothing done to nothing. The "only invisible characters" case
is the opposite — that is a legitimate document that is entirely watermark, and
charging for it is right.

### The credit check runs before the file check, and it costs a sale (MEDIUM)

**With the account at zero, all ten of those inputs returned the same thing:**

```
HTTP 402  insufficient_credits: This needs 1 credit and you have 0.
```

Including the six the site would have refused anyway.

**So a visitor can be told to buy credits for a job that will never run.** They top up,
come back, and are then told their file is not supported. The same ordering showed up
on the 45,000-word paste earlier: quoted 45 credits for a document that is over the
10,000-word limit and would be refused at any price.

**Cheap fix, and it is a conversion fix rather than a bug fix:** validate the format and
the size before pricing, so "we cannot use this file" always beats "you need to pay
first".

---
# FRICTION AND THE VISITOR'S JOURNEY (dimension 12)

The friction agent died with the run's usage limit. This is the conductor's own walk,
done as the visitor the working agreement names: a student on a phone who wants a
document unwatermarked and knows nothing yet.

### The path to a first result is genuinely short, and that is the best thing about the product

```
land on the homepage  ->  paste  ->  click "Scan it"
   one click, no fields, no account, no card, and the scan is free and unlimited
```

Then one more click sanitises it, using the two free credits a stranger is given
without asking for anything. **Two clicks and zero form fields from arriving to having
a cleaned document.** Very few paid tools get a visitor to value that fast, and nothing
in this audit should obscure it.

**Every internal link on the site works** — all ten, checked:

```
/auth/sign-in 200   /auth/sign-up 200   /capabilities 200   /contact 200
/cookie-policy 200  /how-it-works 200   /mission 200        /pricing 200
/privacy-policy 200 /terms-of-service 200
```

### The walls, in the order a visitor meets them

**1. Cloudflare has to load, or nothing works and the site blames their internet.**
This is the first wall and the worst, because it is invisible and unrecoverable — see
finding A. Everything before it works perfectly, which is what makes it expensive.

**2. Two free credits, then five.** Generous and clearly signposted. The one confusion
is on the same line as the counter: **"Scanning is always free"** sits directly beside
a chip reading **"1 left"**, and a first-time visitor cannot tell what the counter is
counting. One of those two phrases should say what it applies to.

**3. Then the price, and the pricing page is the strongest page on the site.** The
calculator, the "your five free credits already cover this" line, the four small
reassurances, and the honest layer table are all good work. Its defects are the
arithmetic ones already listed: "about four college essays" for a pack its own
calculator makes three, and "files are one credit each whatever their size" beside a
`.txt` that is charged by the word.

### The dead ends, all reachable, all reproduced

| dead end | what the visitor does next |
|---|---|
| Cloudflare blocked | retries forever; nothing else is offered |
| a 3.3 MB photo | gets a generic failure; is never told the size limit |
| a 9,900-word document | waits three and a half minutes, then is told to try again — which fails again |
| the contact form with no mail app | taps Send message and nothing happens |
| zero credits + an unsupported file | is told to buy credits for a job that will be refused anyway |

**Four of those five end with the visitor being invited to retry something that cannot
succeed.** That is the single most consistent shape in this audit, and it is worth
naming as one thing rather than five: **when this product fails, it does not say why,
and it suggests trying again.**

---
# THE DIFFERENT-DEVICE GAP (H1), GIVEN A NUMBER FOR THE FIRST TIME

`LAUNCH-CHECKLIST` H1 calls this *"the most likely real-world failure left in the
funnel, and nothing measures it"*: a guest earns credits on a laptop, opens the
confirmation email on a phone with no guest cookie, and the merge cannot fire.

**Counted on the live database tonight:**

```
anonymous guest accounts                    23
real accounts (excluding this audit's)       8
rows in guest_conversions                    7

guests still holding credits                12   (13 credits between them)
guests who spent everything                 10
```

**The merge is working for almost everyone who converts.** Seven of the eight real
accounts have a conversion row, which means the guest's credits followed them into
their account exactly as designed.

**The upper bound on the damage is one account.** Exactly one real account has no
conversion row — and that is either someone who signed up directly without ever
guesting (which decision B12 confirms is normal and expected), or someone who hit H1.
**Nothing in the data tells the two apart**, which is precisely what H1 says.

**So the honest position, which is better than the board's:** the gap is real, the
mechanism is real, and at today's volume it has affected **at most one person out of
eight, and possibly nobody.** The twelve guests holding credits are overwhelmingly
people who have not come back yet, not people who lost anything.

**What would settle it** is one column: record on the conversion row whether a guest
cookie was present. Then "converted with credits carried" and "converted with nothing
to carry" become countable, and this stops being a matter of opinion. That is a smaller
job than the analytics work G3 describes, and it answers the question G3 was raised for.

---
# SECURITY HEADERS — five of the six standard ones are absent (MEDIUM)

**The complete header block the live site returns, with the routine ones stripped out:**

```
HTTP/2 200
access-control-allow-origin: *
cache-control: public, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000
x-vercel-cache: HIT
```

**Checked one at a time:**

```
PRESENT  strict-transport-security
missing  content-security-policy
missing  x-frame-options
missing  x-content-type-options
missing  referrer-policy
missing  permissions-policy
```

**And the same on `/auth/sign-in`** — the page where people type their password:

```
missing  content-security-policy   (sign-in page)
missing  x-frame-options           (sign-in page)
```

**What each missing one actually allows, in plain terms.** `x-frame-options` is the one
that matters most here: without it another website can load the un-claude sign-in page
inside an invisible frame on top of its own, so a visitor believes they are clicking
one thing and are really clicking another. `content-security-policy` is the safety net
that limits the damage if a bad script ever reaches a page. The other three are smaller:
they stop a browser guessing file types wrongly, control what address is leaked to other
sites, and switch off browser features the site does not use.

**Nothing is broken today and no customer is affected today.** These are missing safety
nets rather than an open door, which is why this sits at medium and not higher.

**It pairs badly with the open redirect (finding 3), though, and the pair is worth
seeing together:** an attacker can already produce a link that starts with
`https://un-claude.com/` and lands wherever they like, and the sign-in page can be
framed. Those two are individually modest and jointly make a convincing phishing setup
out of your own domain. Closing the redirect is the cheaper half and closes most of it.

---
