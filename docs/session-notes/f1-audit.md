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

**The single most important thing: a 9,900-word document fails.** That is inside
the site's own advertised 10,000-word limit, it is the product's core case, and it
failed both times it was tried, after more than three minutes of the customer
waiting. The credit is correctly given back. The customer gets nothing.

**The second: the rewrite invents quotations.** Give it a direct quote from a named
person and it hands back different words, still inside quotation marks, still
attributed to that person. It did this three times out of three. For a student that
is a misquoted source — an academic misconduct problem caused by the tool they paid
to protect them, and invisible to them.

**The third: a short paste is charged and nothing is done.** Paste fewer than 16
words and you are charged a credit, your text comes back byte for byte identical,
and the screen does not say why.

**A security hole worth fixing this week:** any link beginning `https://un-claude.com/`
can be made to land the visitor on any other website, with no sign-in needed.

**And the good news, which is real.** The money boundary holds: a browser cannot
change the price, the quantity or where checkout returns to. The promise that a
failed run costs nothing is true, and the ledger proves it. Word documents come
back as valid, uncorrupted Word files. The 10,000-word limit is enforced in under a
second and charges nothing.

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
wired, wsj`.

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

**A Word document never gets the rewrite.** `layer_b_used: false`, confirmed twice
live. This is disclosed correctly on `/capabilities` ("Paste the text instead") and in
the pricing FAQ — **it is not a false claim.** But the homepage says "We sanitise
every kind of AI watermark in seconds" and the tool's own panel lists all three layers
for every input, and nothing says it at the moment of the upload, which is the moment
it matters. Same family as finding 4: correct, and silent.

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
