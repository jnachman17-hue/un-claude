# Lane C — workbench and wallet

**23 August 2026.** Board items W-1 to W-10. **Nothing was deployed and nothing
was pushed.** Everything below was run against a local build and, where a number
is quoted from the live site, it is the F1 audit's measurement and is labelled as
such.

**All ten items are done.** Four things are stated first because they are either
a cost, a limit on the evidence, or a decision somebody else has to make.

---

## Read these four first

### 1. W-10 costs something, and Jon should know what

Jon's ruling was: below 16 words the Sanitise button is disabled. It is, and it
works. **The cost is that a short paste carrying hidden characters can no longer
be cleaned at all.**

Layers A and metadata are the two provable ones and they work perfectly well on
six words. Before today a six-word paste with three zero-width characters in it
cost a credit and came back genuinely clean of those three; now the button is
refused because the third layer would not have run. The visitor is told the
reason and can add words, which is a real way out, but they cannot clean the
thing they actually pasted.

**Jon's ruling is implemented exactly as given**, because it is his call and the
overwhelming majority of short pastes carry nothing to remove. The narrower rule
that would keep both properties — refuse only when the scan also found nothing —
is written up as row 91 in `06-assumptions-and-open-questions.md` with a trigger.
**It is a one-line change if he wants it.**

### 2. The wallet could not be opened, so the list was made openable

`/home` needs a real, non-anonymous session against the hosted Supabase and there
is no local one (`06` row 11). Two of these ten items are on that page. Rather
than describe them, the history list was moved into its own component and a
development-only page renders it with fabricated rows:

```
/dev/wallet             82 rows, page 1
/dev/wallet?page=4      the last page of 82
/dev/wallet?total=8     a history that fits on one page
```

**Same component, same markup, same stylesheet as the real wallet**, which
renders it with the customer's real rows. Development builds only.

The same problem applied to the header, which is gated on a signed-in session:
pinning a balance ending `:account` on `/dev/credits` now renders the real
signed-in header row. Also development only, also compiled out of production.
**Both are how W-1, W-2, W-5 and W-6 were put on screen at all.**

### 3. W-4 touched a route the money lane cares about. Here is exactly what changed

**The diff on `app/api/tool/clean/route.ts` is purely additive — 105 lines added,
zero removed:**

```
$ git diff --stat apps/web/app/api/tool/clean/route.ts
 apps/web/app/api/tool/clean/route.ts | 105 +++++++++++++++++++++++++++++++++++
 1 file changed, 105 insertions(+)

$ git diff apps/web/app/api/tool/clean/route.ts | grep -E '^-[^-]'
 (none — the change is purely additive)
```

No line touching the price, the spend, the refund or the ledger was altered.
Nothing was moved past them; a new check was put in front of them.

### 4. One accessibility finding is reported, not fixed, and that was the ask

W-8's unresolved item — the scan result wrapped in a `<button>` — was checked
rather than inherited. **What was found is below and it is worse than "not
supported" and better than the agent's version.** No change was made to that
wrapper: the brief asked for a check, and a proper fix needs a real screen
reader, which this session did not have either.

---

## W-1 — the header credit count was frozen and lied. Fixed.

### What it was

`site-header-account-section.tsx` fetched `/api/credits` **once on mount into its
own `useState` and never read it again.** The workbench chip fifty pixels below
took its number from the sanitise response. So the two disagreed the moment a
credit was spent. The audit photographed it: **seven at the top of the page, six
in the middle, at the same instant, both about money.**

### What was done

There is one balance now. A module-level store in
`_components/workbench/credits.ts` holds it, both components read it through a
React subscription, and whoever learns a newer number publishes it.

**Nothing polls.** The balance moves on three occasions and each already has a
moment attached: a sanitise answers with the new balance, a refused sanitise
triggers a refetch, and coming back to the tab after buying credits fires
`focus`. The header listens for the third. **The home page now makes one
`/api/credits` call on load instead of two** — the store shares one request
between its readers.

### The evidence

Driven in a real browser at desktop width, with the balance pinned to 5 on an
account. **The reply from `/api/tool/clean` was stubbed** so that no real credit
was spent and no session was created; everything after the reply — the success
branch, the publish, the store, the header's subscription — is the shipped code.

```
BEFORE the press   header pill "5 credits"   workbench chip "5 left"
AFTER  the press   header pill "4 credits"   workbench chip "4 left"

read straight out of the DOM after the press:
{"header_pill":"4 credits","workbench_chip":"4left","they_agree":true,
 "live_region_says":"Sanitised","pill_box":[76,31],"pill_lines":"one line"}
```

Both numbers moved in the same frame. **No navigation, no reload, no polling.**

---

## W-2 — the header credit chip wrapped onto two lines. Fixed.

### What it was

The pill sits in a flex row, and a flex child is allowed to shrink below its own
content. At phone width the row is: hamburger, a 32-pixel gap, the pill, the
avatar. There was not enough room, so the pill broke in half inside a rounded
shape sized for one line.

### What was done

Two changes, and the second is the one that matters.

1. `whitespace-nowrap` and `shrink-0` on the pill, so it cannot wrap and is not
   the item the row chooses to squeeze.
2. **The wide gap is desktop-only now.** Jon's `gap-8` was asked for so the
   navigation LINKS would not hug the account controls. Below `md` there are no
   links — the whole navigation is one hamburger — so 32 pixels were being spent
   next to nothing in the one place with no width to spare. `gap-3 md:gap-8`.
   **His desktop spacing is untouched.**

Without the second change, "do not wrap" would have become "overflow the row".

### The evidence, measured at 375 pixels wide

The "before" was produced by putting the old classes back on the live element and
measuring it, so it is this build rather than a memory:

```
BEFORE   pill 66 x 50 px   -> TWO LINES  ("5" above, "credits" below)
AFTER    pill 76 x 31 px   -> one line

page overflows sideways: false   (scrollWidth 375 = clientWidth 375)
```

Both were photographed at phone width and at desktop width.

---

## W-3 — the file-size message could never fire. Fixed.

### What it was

Over about 3.2 MB the request never arrives: Vercel answers `413` in plain text
before our code runs, and the workbench — which parses JSON — falls back to
"Something went wrong". The product's own polite message is set on the base64
length at about 5.5 MB and **has never been shown to anybody.**

### What was done

The check moved into the browser, into `takeFile`, before the upload is
attempted, and it is measured against `file.size` — the number the visitor's own
file manager shows them — rather than an encoded length they will never see.

**3,200,000 bytes, which is the largest size the audit measured passing on the
live site**, not a guess:

```
3.20 MB raw / 4.27 MB encoded  ->  200 OK          (audit, live)
3.30 MB raw / 4.40 MB encoded  ->  413 Too Large   (audit, live)
```

### The evidence

A 4.1 MB PNG handed to the real upload handler:

> **That file is 4.1 MB. The limit is 3.2 MB. Try a smaller one.**

Instant, and the network panel shows **no request was made at all** — nothing was
uploaded, so nothing had to fail. The box returned to its empty editable state.

### One thing this does NOT fix, and it belongs to Lane D

**The pricing page says "One Word document or picture, any size."** That was
already untrue and is now demonstrably untrue at a specific number. The copy is
Lane D's territory. `C-9` on the board is the row for it.

---

## W-4 — paying for a job that would then be refused. Fixed.

### What it was

The credit check ran before the file check. With the account at zero, **all ten
of the audit's deliberately broken inputs returned `402 insufficient_credits`** —
including the six the site would have refused for free anyway. A visitor is told
to buy credits for a job that will never run, tops up, comes back, and is then
told their file is not supported.

### What was done

**The order, and nothing else.** The route now runs the same acceptance test the
engine runs — the extension, and whether the file's own bytes agree with the name
it arrived under — before the session and the spend. The engine still re-runs it
and remains the authority; this copy exists only to change which answer the
customer hears first.

An extension check alone would have caught **one** of the audit's six. The
content check is what catches a PNG renamed `.docx`.

### The evidence: the same twelve inputs through both implementations

The engine's own `uc_policy.accepted()` in Python, against the live route over
HTTP. The route refuses a bad format at the front door with `400 bad_format`;
anything it accepts falls through to the session gate at `401 no_session`.

```
INPUT                                ENGINE  ROUTE HTTP + code            AGREE
--------------------------------------------------------------------------------
a .docx that is not a zip at all     False   400 bad_format               yes
a zip with no word/document.xml      False   400 bad_format               yes
a .png that is not a PNG             False   400 bad_format               yes
a real PNG renamed .docx             False   400 bad_format               yes
a single null byte                   False   400 bad_format               yes
a .pdf                               False   400 bad_format               yes
a real .docx                         True    401 no_session               yes
a real PNG                           True    401 no_session               yes
a real JPEG                          True    401 no_session               yes
ordinary pasted text                 True    401 no_session               yes
a whitespace-only paste              True    401 no_session               yes
a .csv of prose                      False   400 bad_format               yes

every case agrees with the engine: True
```

**Twelve for twelve.** The direction that matters is that this copy must never be
STRICTER than the engine's, because a file it wrongly refuses is a customer
turned away; a file it wrongly lets through is simply refused one step later,
exactly as today.

And the order itself, with the new check temporarily switched off and then back
on, against the same two inputs:

```
BEFORE  a .pdf                    -> 401 no_session: Your session expired.
        a real PNG renamed .docx  -> 401 no_session: Your session expired.

AFTER   a .pdf                    -> 400 bad_format: That file type is not
                                     supported. Use text, a Word document,
                                     PNG or JPG.
        a real PNG renamed .docx  -> 400 bad_format: (the same)
```

The account gate is no longer the first thing an unsupported file meets.

---

## W-5 — the wallet rendered every ledger row. Fixed, and the finding was wrong

**The board says there is no pagination. There was a `.limit(50)`, added on
21 August, and that is worse rather than better.** The audit measured the page at
210,693 bytes and reported "every row rendered", which was an inference; what was
actually happening is that an account with more than fifty entries **silently
stopped having a history**, with no second page, no "load more" and no sentence
anywhere saying anything had been left out. On the page that is its financial
record.

### What was done

Real pagination. Twenty-five rows a page, newest first, with ordinary links.

**One row more than the page shows is fetched, and that is the whole mechanism.**
Asking the database for a total count would be a second query on every wallet
load to render a number nobody needs. Twenty-six rows come back, twenty-five are
shown, and the twenty-sixth answers "is there anything older" and is thrown away.

They are links rather than buttons because the page is server-rendered: an older
page costs no JavaScript, the back button behaves, and a customer can bookmark a
page of their own history. **"Older" and "Newer" rather than "Next" and
"Previous"**, because the list is in time order.

### The evidence

Photographed at desktop and phone width on `/dev/wallet`:

```
page 1 of 82   25 rows,  "1 to 25, newest first"    [Older]
page 4 of 82    7 rows,  "76 to 82, newest first"   [Newer]
```

The last page offers no "Older", the first offers no "Newer", and with a history
short enough to fit the footer does not appear at all.

---

## W-6 — credit history printed UTC dates. Fixed.

### What it was

The page renders on the server, and a server has no idea where the person reading
it is standing. **The audit's measurement, against the real database:**

```
the row was written   2026-08-23T01:54:18Z
the customer was in   America/Los_Angeles
the wallet said       "Aug 23, 2026"
```

Six fifty-four in the evening on the 22nd in California, printed as the 23rd. So
everyone in the Americas saw tomorrow's date on anything they did after late
afternoon.

### What was done

A `LocalDate` component. The server still renders a real date, deliberately
pinned to UTC so its output is identical on every machine and hydration has
something stable to match, and the browser replaces it with the same instant in
the visitor's own zone the moment it mounts. Two renders rather than one, which
is the price of the server not being able to know this.

**The time is shown as well as the day**, because the reason the audit gave for
caring was somebody matching this against a bank statement, and the hour is what
makes that possible.

### The evidence

The same instant, formatted for four places:

```
the row in the database   : 2026-08-23T01:54:18.516286+00:00
what the server renders   : Aug 23, 2026 · 1:54 AM
a customer in Los Angeles : Aug 22, 2026 · 6:54 PM
a customer in New York    : Aug 22, 2026 · 9:54 PM
a customer in Berlin      : Aug 23, 2026 · 3:54 AM
```

And read straight out of the live DOM on `/dev/wallet`, in a browser set to
America/Los_Angeles:

```
{"tz":"America/Los_Angeles","firstTimeEl":"Aug 22, 2026 · 6:54 PM",
 "iso":"2026-08-23T01:54:18.000Z","hydrated":true}
```

**Exactly the audit's case, now right.** No hydration warning: the two-pass
approach means the server and the first client render agree.

---

## W-7 — the "words cleaned" counter went backwards. Fixed, and it is quieter now

### What it was

A burst used to **add an invented 18 to 578 words** to whatever was on screen, on
a gap averaging four seconds — roughly forty words a second — while the anchored
figure underneath rises at one. So the longer the page stayed open the further
the number floated above the truth, and a reload dropped it back to the clock.

The audit's four loads:

```
load 1:  2,783,981
load 2:  2,784,460
load 3:  2,783,987   <- 473 lower than the load before it
load 4:  2,784,148
```

It also failed the one honesty property the component's own documentation claims
for it: anchored to a fixed instant, the same for everyone, not restarting on
refresh.

### What was done

**The burst is a reveal now, not an increment.** The value shown is always the
clock-derived total and nothing else, so it is identical in every browser looking
at the same moment and can only go up. The rhythm still chooses WHEN the display
catches up: it holds still, then jumps by whatever accrued while it was holding.

### The honest cost, and Jon should hear it plainly

At 1.05 words a second a jump is now worth the seconds that preceded it — **nine
to twenty-seven words on an ordinary gap, changing the last two digits** — where
it used to be worth hundreds. **The counter is quieter than it was.** That is
what a monotonic counter at this product's stated rate looks like. The
alternative was a number that could not survive somebody pressing reload twice,
on a site whose whole argument is that it does not overclaim.

**The way to get the motion back is to make it real**, and it is already written
in the component: `words_in` on the ledger is the true figure, and summing that
column on top of SEED makes every jump a real document. That needs a route the
money lane owns, so it is a handoff rather than a change here.

### The evidence: four consecutive fresh loads, this build

```
load 1:  2,868,365
load 2:  2,868,380
load 3:  2,868,387
load 4:  2,868,395

ever went down: false
```

And across a reload with the page left open in between, which is the case that
used to fail worst:

```
before the reload  2,868,361
after  the reload  2,868,365     went backwards: false
```

---

## W-8 — screen readers. Four things done, one thing checked and reported

### The skip link and the `main` landmark

**Checked on all nine marketing pages, and all nine now have both:**

```
/                    http=200  <main>=1  skip-link=1  <h1>=1
/pricing             http=200  <main>=1  skip-link=1  <h1>=1
/how-it-works        http=200  <main>=1  skip-link=1  <h1>=1
/capabilities        http=200  <main>=1  skip-link=1  <h1>=1
/mission             http=200  <main>=1  skip-link=1  <h1>=1
/contact             http=200  <main>=1  skip-link=1  <h1>=1
/terms-of-service    http=200  <main>=1  skip-link=1  <h1>=1
/privacy-policy      http=200  <main>=1  skip-link=1  <h1>=1
/cookie-policy       http=200  <main>=1  skip-link=1  <h1>=1
```

The link is the first focusable thing in the document, invisible until focused.
Measured in the browser:

```
unfocused   1 x 1 px      (screen-reader only)
focused    80 x 55 px     at top 12, left 12
target     <main>, whose first heading is "If Claude wrote it, it's marked."
```

`main` carries no classes on the marketing pages: every page under that layout
returns a plain block element with no sizing that depends on its parent, so an
unstyled wrapper changes no pixel of any of the nine. On the wallet it does carry
the flex classes, because `PageBody` is `flex-1` and expects a flex column
parent — a plain block there would have taken its height away.

**The tenth page the audit checked, `/auth/sign-in`, is the security session's
territory and was not touched.** It still has neither. Handoff below.

**One correction to the audit.** It recorded `<h1>=0` on the home page. On this
build the served HTML carries one. That is a difference between this build and
what was measured on production in the middle of an audit, not a fix — nothing
here changed the hero — and it should be re-measured on the live site rather than
assumed either way.

### The paste box and the file input

```
BEFORE  textarea      aria-label: null, aria-labelledby: null, labels: 0
                      (a placeholder only, which vanishes on the first keystroke)
        file input    aria-label: null, labels: 0, tabIndex: 0, 1px square

AFTER   textarea      aria-label: "Your text"
        file input    aria-label: "Upload a file"
```

In the computed accessibility tree the file control now reads
`button "Upload a file" type="file"` where it used to be nameless.

**One thing worth knowing:** there are now two tab stops both called "Upload a
file" — the invisible input, and the visible button that clicks it. That is
better than one of them being nameless, and it is not ideal. Noted as row 92 in
`06`.

### The status line

`role="status"` on a span that is **always in the document** — a live region
inserted at the same moment as its text is frequently not announced at all.

**Only the state goes inside it.** The price beside it changes on every keystroke
("12 words = 1", "13 words = 1"), so wrapping the whole line would make a screen
reader talk over somebody while they were still typing, which is worse than the
silence it replaces. The price and the two limit messages explain a **disabled
button**, so they are attached to that button with `aria-describedby` and read
when it is reached instead.

Read out of the computed tree straight after a finished job:

```
status [ref_35]
   generic "Sanitised" [ref_36]
```

### The unresolved one: the result wrapped in a button. Checked, not inherited

**Measured in the finished state, with the customer's own text in the box:**

```
button "Edit this text" [ref_30]
   generic "The committee reviewed the proposal carefully and agreed that
            further study was warranted before any..." [ref_31]
```

and from the DOM:

```
{"phase":"cleaned","role":"button","tabIndex":0,
 "ariaLabel":"Edit this text","textInside":"The committee reviewed the ..."}
```

**Three things, and the middle one is new.**

1. **The customer's text is still present in the tree**, as a child of the
   button. The agent's strongest claim — that it is stripped out — is **not
   supported**, and the conductor was right to downgrade it.

2. **But the wrapper carries `aria-label="Edit this text"`, and an aria-label
   replaces the contents when the accessible name is computed.** So the name of
   that control is "Edit this text" and nothing else. A screen-reader user who
   tabs to the result hears "Edit this text, button" and **does not hear their
   document.** That part is now settled rather than suspected.

3. Whether they can reach the text another way depends on the screen reader.
   Under the ARIA rule for presentational children a button's descendants may be
   flattened, and screen readers differ on whether browse mode still exposes
   them. **That half is still unresolved and still needs ten minutes with
   VoiceOver, which nobody has done.**

**No change was made**, because the brief asked for a check and because the
obvious fix touches an interaction with a documented history of breaking. The
proposed fix is row 93 in `06`: after a job is finished the result does not need
a click-to-edit affordance at all — there is a "Start over" button beside it, and
clicking the result currently discards the finished work.

---

## W-9 — every page's link preview showed the home page. Fixed.

### What it was

Next merges metadata **shallowly**. A page that sets `title` and `description`
and nothing else inherits the root's whole `openGraph` object, root url and all.
The canonical work got nine of nine right; this got nine of nine wrong, and it is
the same leak standing rule D14 warns about.

### What was done

One shared `shareTags()` helper in `lib/share-tags.ts`, spread into each page's
own `metadata`. Nine copies of something that must agree is how the leak happens;
this is also Next's own documented remedy for its shallow merge.

### A regression this caused, caught before it shipped

**Setting a page-level `openGraph` also drops the generated share image**, because
`app/opengraph-image.tsx` is a file convention that Next attaches by writing into
`openGraph.images`. First measurement after the change: all nine pages had correct
titles and **no `og:image` at all, including the home page, which had one before.**
The card is now named explicitly in the helper.

### The evidence, all nine pages

```
PAGE                 og:title                           og:url                                   og:image
/                    Un-Claude · AI Watermark Remover   https://un-claude.com                    /opengraph-image
/pricing             Pricing · Un-Claude                https://un-claude.com/pricing            /opengraph-image
/how-it-works        How it works · Un-Claude           https://un-claude.com/how-it-works       /opengraph-image
/capabilities        What we do · Un-Claude             https://un-claude.com/capabilities       /opengraph-image
/mission             Our mission · Un-Claude            https://un-claude.com/mission            /opengraph-image
/contact             Contact · Un-Claude                https://un-claude.com/contact            /opengraph-image
/terms-of-service    Terms of Service · Un-Claude       https://un-claude.com/terms-of-service   /opengraph-image
/privacy-policy      Privacy Policy · Un-Claude         https://un-claude.com/privacy-policy     /opengraph-image
/cookie-policy       Cookie Policy · Un-Claude          https://un-claude.com/cookie-policy      /opengraph-image

distinct (og:title, og:description) pairs across the nine pages: 9
```

Nine distinct pairs where there used to be one, and the image serves 200 and
56,293 bytes of `image/png`.

**One thing given up:** the file convention normally appends a content hash to
the image path as a cache buster, and naming the path by hand loses it. If the
card's design is ever changed, a chat app that has already cached a preview may
keep the old picture for a while. That is the smaller of the two problems.

---

## W-10 — say when the rewrite did not run. Done, to Jon's ruling.

### What it was

A paste under sixteen words was charged a credit, came back byte for byte
identical, and the panel said **"Rewritten · Measured, not estimated"** with 0%
replaced above the numbers that contradicted it. The engine returned a `reason`
string explaining itself on every one of those responses and **no file in this
product read it.**

### What was done

**The minimum is at the front door**, per Jon's ruling. Below sixteen words the
Sanitise button is disabled and the reason sits beside it. **The free scan is
untouched and still runs at any length.**

A whitespace-only box is the same case and is caught by the same test, because it
counts zero words. The audit charged a credit for a single space.

The panel caption was changed too: it used to read "Sanitise to remove it"
pointing straight at a button that had just been greyed out, which is the
interface arguing with itself.

**The pre-flight freeze percentage (D4) was deliberately not built.** It depends
on engine work that has not shipped.

### The evidence

An eight-word paste, scanned, in a real browser:

> **8 words. The rewrite needs at least 16, so nothing is charged for this. Add
> a little more.**

and beside it the Sanitise button greyed out and unpressable, with the free scan
result complete underneath: "Hidden characters — none found", "Metadata — needs a
file", "Statistical watermark — presumed present". **The scan still ran and still
cost nothing.**

The number 16 mirrors `UC_LAYER_B_MIN_WORDS` in `engine/server.py`, which is what
actually enforces it.

---

## Handoffs — things found here that belong to somebody else

| To | What |
|---|---|
| **Security session** | `/auth/sign-in` still has no `main` landmark and no skip link. It is the tenth page in the audit's table and the only one this session could not touch. The pattern to copy is in `app/(marketing)/layout.tsx` |
| **Money session** | The "words cleaned" counter can be made real by summing `words_in` on the ledger and adding it to `SEED`. That needs a route the money lane owns. It would also give the counter its motion back, which W-7 cost it |
| **Lane D (copy)** | The pricing page says "One Word document or picture, any size." The browser now refuses at 3.2 MB with a message naming the number. Board row C-9 |
| **Whoever owns `app/home/layout.tsx`** | The wallet has a `main` landmark now but no skip link, because the link has to be the first focusable thing in the document and that is in shared kit code |

---

## What was not done, and why

**No screen reader was run.** Everything in W-8 is markup and computed
accessibility tree, which is the same evidence class the audit had. The one
finding that needs VoiceOver is still open and is labelled as such.

**The wallet was never opened as a real signed-in customer.** There is no local
Supabase. The list was verified through the real component with fabricated rows,
and the date arithmetic was verified against the exact timestamp from the audit's
own measurement. The pagination query itself — `.range(from, from + PAGE_SIZE)`
against the live ledger — has not been run against real data.

**W-1's spend was driven with a stubbed reply from `/api/tool/clean`**, so no real
credit was spent and no row was written to the live ledger. Everything after the
reply is the shipped code. It is labelled that way in W-1 above.

**Nothing was deployed and nothing was pushed.**
