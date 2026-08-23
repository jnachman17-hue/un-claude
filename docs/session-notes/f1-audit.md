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

**One security hole worth closing this week.** Any link beginning
`https://un-claude.com/` can be made to land the visitor on any other website, signed
out, no account needed. That is a ready-made phishing link wearing your domain.

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

**Fix sketch.** Either do not charge when the rewrite is skipped, or show the reason
and say plainly that only layer A ran. Charging silently is the worst of the three.

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

**I could not reproduce it in 8 live runs** across 730, 2,553 and 4,800 words. So it
happens, it happens on some documents and not others, and nobody yet knows how often.
It is recorded here as real-but-unquantified rather than confirmed or dismissed,
because both of those would be a guess.

---
# FOUND BY THE FLEET, THEN RE-RUN BY THE CONDUCTOR

Fourteen agents probed the live site. Three of their most serious findings were
re-run independently by hand, because a finding nobody probed twice is exactly this
project's characteristic failure. These three reproduced.

### A. If Cloudflare is blocked, the visitor is walked all the way to a dead end (HIGH)

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

### B. Deleting an account destroys paid credits, and the warning is about a product this is not (HIGH)

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

Ranked by what protects a paying customer soonest, not by how hard it is.

**1. Stop the rewrite touching anything inside quotation marks.** A fabricated quote
attributed to a real person is the only defect here that can damage a student's
academic record, and they cannot see it. Everything else on this list is money or
friction; this one is their degree. Protected spans, passed through untouched.

**2. Make the advertised size limit a size that finishes.** Today the page sells
10,000 words and 9,900 fails after three and a half minutes. 6,000 words completed —
in 196 seconds, against a 240-second cut-off, with four retries. That is not a
margin. Either drop the limit to something that reliably completes, or take long
documents as a job the customer comes back to rather than one they sit and wait for.
**Do this before any marketing spend**, because the Pro pack is sold as "a
dissertation, with room to spare".

**3. Do not charge for a rewrite that did not run — and stop the screen saying it
did.** Under 16 words the customer pays a credit, gets their own text back byte for
byte, and reads "Rewritten · Measured, not estimated". The engine already writes a
clear, correct explanation that nothing displays. Show it, and refund the credit.

**4. Close the open redirect.** `/auth/callback` should only ever send a browser to a
path on this site. One condition, and it removes a ready-made phishing link that
starts with your own domain.

**5. Move the file-size check into the browser, at about 3.2 MB of actual file.**
Right now Vercel rejects the upload before any of your code runs, so the polite
message you already wrote can never be shown. Phone photos routinely exceed this and
the pricing page says "any size".

**6. Fix the six claims that are checkable and wrong.** These cost nothing but copy
and they are the ones that will be checked first:
   - "Upload a file and you get all three" — no accepted file type gets all three.
   - "a hard three-word ceiling" — your own receipt printed 6.
   - "Nine classes ... checked" — the lookalike-letter class finds nothing.
   - "About four college essays" — your own calculator makes it three.
   - "in seconds" — your own price line says three minutes.
   - "94 to 100% of the original length kept" — live receipts came back 102% to 114%.

**7. Put a link behind the news logos, or take them down.** Nine national mastheads
scroll across the homepage under 13-pixel grey type. Either every logo links to the
piece it refers to, or the section goes. On a site now taking money from Americans,
implied endorsement is a category regulators recognise, and this is the one thing on
the list that could arrive as a letter rather than a refund request.

**8. Tell the visitor when Cloudflare is the problem.** They currently reach a dead
end that blames their internet and invites them to retry forever.

**9. Rewrite the account-deletion warning.** It talks about teams and subscriptions
that do not exist and never mentions the credits they paid for and are about to lose.

**10. Give every page its own share tags.** Nine pages, one line each. The canonical
work already did exactly this and the Open Graph tags were missed.

**11. The two numbers about money that are wrong on screen.** The header credit count
freezes at page load while the chip beside it updates, and the credit history prints
dates in UTC so anyone in the Americas sees tomorrow. Both are the same family as the
word counter that lied.

**12. Give the paste box and the file input a name.** Two attributes. Right now the
product's two primary controls are unnamed to a screen reader, and one of them is in
the tab order.

**13. Schedule the ledger backup while it is still 84 rows and 30 accounts.** Only
one row on the whole ledger could be rebuilt from Stripe. This is the cheapest this
decision will ever be.

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
