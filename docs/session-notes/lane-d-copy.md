# Lane D: seven wording fixes, and one of them overruled

**24 August 2026.** Copy only. No engine logic, no credit arithmetic, no new
features, nothing deployed and nothing pushed.

**Item 1 was shipped, then reverted by Jon the same day, and a different change
went in instead.** Both are written up in full under item 1, and the rulings are
`04` entries 134 and 135. **The other six stand as approved.**

**How to read this.** Every change below is printed in full, before and after, as
plain text you can read aloud. Nothing is summarised and no change is described
rather than shown.

---

# WHAT I DID NOT DO. Read this first

**Three things could not be verified the way the rest were, and all three are
named here rather than left out.**

1. **The account deletion warning was never rendered on screen.** It lives behind
   a sign-in at `/home/settings`, there is no local Supabase in this project
   (`06` row 11), and signing in against the live hosted database would create a
   real account on a site taking real money. **The new sentence is plain text in
   a box that already held three sentences, so the layout risk is close to zero,
   but I did not look at it and I am not claiming I did.** Anyone with a real
   account can confirm it in five seconds.

2. **One paragraph on the pricing page was rendered at phone width and measured
   at desktop width, but not photographed at desktop width.** The preview pane
   returned blank frames below the fold at 1280px, repeatably, with no console
   errors. What I do have for it: it renders correctly at 375px (the harder
   case, photographed below), and at 1280px the page's horizontal overflow
   measures **0 pixels**. The paragraph is capped at `max-w-[62ch]`, so it cannot
   overflow. **Everything else changed in this lane was photographed at both
   widths.**

3. **The new sentence in the workbench panel was never seen on screen.**
   Producing it needs a scan that finds direction marks followed by a paid
   clean, and the local engine at `UC_ENGINE_URL` is not running in this project
   (Lane E hit the same wall). **What I have instead is the exact text it
   produces for every count, printed from the actual expression under item 1**,
   plus a clean typecheck. A real run is the confirmation and it needs the
   engine up.

**And one thing I deliberately did not run.** `oxfmt` reports formatting issues
in `pricing/page.tsx`, `how-it-works/page.tsx` and `workbench.tsx`. **It
reports the same issues on the versions already committed at HEAD**, checked by
extracting them from git and running the formatter on those. So the formatter
disagrees with the repo's committed state, and running it would have produced a
large diff of other people's lines inside a copy-only commit. **I left the
formatting exactly as I found it.** If this is meant to be clean, it is a
separate job for whoever owns the whole tree.

---

# THE RESULT IN ONE TABLE

| # | Finding | State |
|---|---|---|
| 1 | "100% of detectable marks removed" | **Reverted by Jon.** The panel changed instead. `04` 134 and 135 |
| 2 | "upload a file and you get all three" | **Fixed in three places** |
| 3 | "any size" against a 3.2 MB refusal | **Fixed in four places**, one of which nobody had spotted |
| 4 | "quotes 1 credit, charges 5" | **Already true. Checked against the code and left alone** |
| 5 | The account deletion warning | **Fixed.** Not rendered, see above |
| 6 | A Word document told "the picture itself is untouched" | **Fixed.** One string, nothing else in that file |
| 7 | The privacy sentence Jon is owed | **Shipped**, from the drafted wording, plus a date bump |

**Typecheck: `exit 0`.** Run over the whole web app after every change.

---

# 1. REVERTED BY JON, AND THE PANEL CHANGED INSTEAD

**This item was done, then overruled the same day. Both halves are recorded
because the reasoning is the reusable part.** The rulings are in `04` entries 134
and 135.

## What I shipped first, and it is no longer in the product

`apps/web/app/(marketing)/_components/hero-section.tsx`, the middle of the three
lines under the headline.

**BEFORE**

> 100% of detectable marks removed

**BRIEFLY AFTER, NOW REVERTED**

> Every mark that is safe to remove

**My argument was that the audit measured 15 invisible characters found and 12
removed**, the three left being `U+200E`, `U+200F` and `U+061C`, which
`engine/text_unicode.py` preserves on purpose because they carry meaning in
Arabic and Hebrew.

## Jon's ruling, and he is right

**The line is back to "100% of detectable marks removed", byte for byte.**
`git checkout` against the previous commit, so the file is identical to the one
that was there before this lane touched it. Not to be changed again for this
reason.

**His reasoning.** Those preserved marks matter to a vanishingly small share of
real scans. **Rewording the site's headline promise to defend that share is the
tail wagging the dog.** "100% of detectable marks removed" is directionally
correct for what actually happens to what actually gets uploaded, and a hero
bullet is not where a format edge case gets adjudicated.

**What this ruling does NOT do**, stated because a later session will find this
note before it finds the ruling: it is about **this line and this cause**. The
other six items in this lane were approved in the same message. **It does not
loosen the claims boundary generally**, and nothing in
`.claude/skills/unclaude-messaging/SKILL.md` changed.

## The other half: the panel stopped calling it a failure

**And this is the change that makes the 100% line sit right.** Since 18 August
(commit `dc46c5a`, not this lane) the workbench had told a paying customer:

```
3 could not be removed. Read the result before you use it.
```

**That described a deliberate engineering choice as a failure**, and then sent
the customer off to inspect their own document about it. **A hero promising 100%
above a panel saying three things could not be removed was the real
incoherence**, and it was the panel that was wrong.

**Jon's wording, now in the product.** The real rendered output, printed for each
count rather than described:

```
stillPresent=1   ->  1 formatting mark was left in place intentionally. Every other hidden character watermark has been stripped.
stillPresent=3   ->  3 formatting marks were left in place intentionally. Every other hidden character watermark has been stripped.
stillPresent=12  ->  12 formatting marks were left in place intentionally. Every other hidden character watermark has been stripped.
```

**Why the line could not simply be deleted, which is why I asked before doing
it.** The branch directly underneath ends *"the text was read back to confirm
none are left"*. Dropping the sentence would have fallen through to that one and
printed something false every time marks remained. **It had to be replaced, not
removed.**

**This is the second string this lane changed in `workbench.tsx`**, against a
brief that allowed one. Jon authorised it in the session, which outranks the
brief, `CLAUDE.md` section 2.

## What I could not verify about it

**I did not see this sentence on screen in the running tool.** Producing it needs
a scan that finds direction marks and then a paid clean, and the local engine at
`UC_ENGINE_URL` is not running in this project (Lane E hit the same wall). **What
I have instead is the exact text for every count, printed above from the actual
expression.** Typecheck exit 0. A real run is the confirmation, and it needs the
engine up.

---

# 2. "UPLOAD A FILE AND YOU GET ALL THREE". NO FILE TYPE GETS ALL THREE

## What each input actually receives, read out of the engine

Sourced from `docs/session-notes/engine-limits.md` section 14.1, where every row
has a run behind it:

| You give it | Hidden characters | Metadata | The rewrite |
|---|---|---|---|
| Pasted text | **yes** | no wrapper, so nothing to read | **yes** |
| A `.txt` file | **yes** | no wrapper, so nothing to read | **yes** |
| A Word document | **yes** | **yes** | **no** |
| A PNG or a JPG | no text in it | **yes** | no text in it |

**So the sentence was false of every file type this product accepts.** A Word
document is never rewritten, and that was ruled deliberately ("Word documents are
just metadata. Keep it that way"). A picture has no words at all.

**The `/capabilities` page has had this right the whole time**, in a matrix that
says exactly the table above. Three other places contradicted it.

## 2a. `how-it-works/page.tsx`, under "Three marks, three places."

**BEFORE**

> Paste text and the first and third apply to you. Upload a file and all three do.

**AFTER**

> Paste text, or upload a text file, and you get hidden characters and the
> statistical watermark. A Word document gets hidden characters and metadata. A
> picture gets metadata alone.

**Two changes, not one.** The claim came down, and the ordinals went. "The first
and third" points at a list that on a phone has not appeared yet, which is
`SKILL.md` test 1 exactly. **Now each sentence names the marks, and the three
names are word for word the three row titles sitting immediately underneath.**

## 2b. `pricing/page.tsx`, under "One price, three different jobs"

**BEFORE**

> You never choose a layer and you are never charged differently for one. The
> tool reads what you gave it and runs whatever applies. Paste text and you get
> the first and the third. Upload a file and you get all three.

**AFTER**

> You never choose a layer and you are never charged differently for one. The
> tool reads what you gave it and runs whatever applies. Paste text, or upload a
> text file, and you get the invisible characters and the statistical watermark.
> A Word document gets the invisible characters and its file metadata. A picture
> gets its file metadata alone.

**The names used are this page's own card names**, which are "Invisible
characters", "File metadata" and "The statistical watermark", not the
`how-it-works` names. Matching each page to its own cards was the right call for
a reader; **the two pages calling the same three things by different names is a
real defect and it is bigger than this lane.** See the handoffs.

## 2c. `pricing/page.tsx`, the FAQ "What can I put through it?"

**BEFORE**

> Pasted text, Word documents, PNG and JPG. Paste text and you get the invisible
> characters and the rewrite. Upload a file and you get the metadata as well.

**AFTER**

> Pasted text, Word documents, PNG and JPG. Paste text, or upload a .txt file,
> and you get the invisible characters and the rewrite. A Word document gets the
> invisible characters and the metadata, and its wording is not rewritten. A PNG
> or a JPG has no text in it, so it gets the metadata alone.

**"and its wording is not rewritten" is the sentence that had to be in there.**
Somebody buying a credit for a Word document should not find that out afterwards.

## The same false sentence is in CLAUDE.md, and that is where it came from

`CLAUDE.md`, "What this project is":

> **Paste text and you get A and B. Upload a file and you get all three.**

**That is the source of all three site instances and it is outside this lane's
territory, so I have not touched it.** It should say what the table above says.
Flagging rather than editing, per section 2 and section 5.

---

# 3. THE PAGE PROMISED ANY SIZE; THE PRODUCT REFUSES AT 3.2 MB

## The number, read out of the code rather than assumed

`apps/web/app/(marketing)/_components/workbench/encode.ts`:

```js
export const MAX_UPLOAD_BYTES = 3_200_000;

/** "4.1 MB". One decimal, and the same MB a file manager shows. */
export function megabytes(bytes) { return `${(bytes / 1_000_000).toFixed(1)} MB`; }
```

and the refusal the customer reads, from `workbench.tsx`:

```
That file is 4.4 MB. The limit is 3.2 MB. Try a smaller one.
```

**So the product says "3.2 MB" out loud, and the pricing page said there was no
limit.** 3.2 is not a rounded guess: the comment records 3.20 MB passing and 3.30
MB returning 413.

**"Any size" was always about PRICE, meaning the credit does not change with
size, and that meaning is kept everywhere below.**

## 3a. The meta description, which is also the link preview

**BEFORE**

> Five credits free, then packs from $4.99. One credit sanitises 1,000 words of
> text. A Word document or picture is one credit, any size. Credits never expire.

**AFTER**

> Five credits free, then packs from $4.99. One credit sanitises 1,000 words of
> text. A Word document or picture is one credit, up to 3.2 MB. Credits never
> expire.

## 3b. The "What one credit buys" label

**BEFORE**

> One Word document or picture, any size

**AFTER**

> One Word document or picture, up to 3.2 MB

## 3c. The FAQ "What exactly is a credit?", and a worse contradiction inside it

**BEFORE**

> One credit sanitises 1,000 words of text, whether you paste it in or upload it
> as a .txt file. Both get the full rewrite, and a rewrite is priced by the word
> because the words are the work. A Word document, a PNG or a JPG is one flat
> credit whatever its size: those have their metadata and hidden characters
> removed rather than their wording rewritten, and stripping a 4 MB photograph
> and a 40 KB one is the same piece of work. Every job rounds up to a whole
> credit.

**AFTER**

> One credit sanitises 1,000 words of text, whether you paste it in or upload it
> as a .txt file. Both get the full rewrite, and a rewrite is priced by the word
> because the words are the work. A Word document, a PNG or a JPG is one flat
> credit at any size we accept, which is up to 3.2 MB: those have their metadata
> and hidden characters removed rather than their wording rewritten, and
> stripping a 3 MB photograph and a 40 KB one is the same piece of work. Every
> job rounds up to a whole credit.

**The extra find, and it was worse than the one on the board.** That answer
offered **"a 4 MB photograph"** as its example. **This product refuses a 4 MB
photograph.** So the page was not only promising no limit in the abstract, it was
naming a specific file the product would turn away. **It now reads 3 MB, which is
a file that actually works.**

## 3d. One layout consequence, found by looking at it

"up to 3.2 MB" is longer than "any size", and at desktop width it wrapped with
**"MB" orphaned on a line by itself.** I added `text-balance` to that one label,
so it now breaks as "One Word document or / picture, up to 3.2 MB". Photographed
below at both widths.

**What I did NOT do to fix it: insert a non-breaking space.** A non-breaking
space is `U+00A0`, one of the exact characters this product finds and removes and
teaches visitors to fear. **Putting one in our own markup to tidy a line break
would have been absurd.**

---

# 4. CHECKED, AND ALREADY TRUE. NOTHING CHANGED

**The audit found the pricing page quoting 1 credit for a file and charging 5.
It is fixed and I did not touch it.**

**What the code actually does.** The server, at
`app/api/tool/clean/route.ts:398`:

```js
textLike && wantsRewrite ? creditsForWords(wordsIn) : isFile ? 1 : creditsForWords(wordsIn);
```

The browser, in `workbench/credits.ts`, mirroring it:

```js
if (textLike && input.wantsRewrite) return byWords;
return input.isFile ? 1 : byWords;
```

**The same rule, twice.** Anything the engine will rewrite is priced by the word;
everything else is one flat credit.

**And what the page says**, unchanged by me:

> One credit sanitises 1,000 words of text, whether you paste it in or upload it
> as a .txt file. Both get the full rewrite, and a rewrite is priced by the word
> because the words are the work.

That is the rule, stated correctly. **The `.txt` ruling of 21 August closed this
and the copy was already rewritten for it.**

**The repo's own drift guard agrees, run read-only this session:**

```
Does the PRICE agree with the WORK about what a file is?
==================================================================
engine TEXT_EXTS       .css .csv .go .js .json .py .rs .text .toml .txt .yaml .yml
route ENGINE_TEXT_EXTS .css .csv .go .js .json .py .rs .text .toml .txt .yaml .yml
engine CONTAINER_EXTS  .docx .epub .htm .html .markdown .md .mdx .odt .pdf .pptx .svg .xlsx

  PASS  nothing the engine rewrites is priced as a flat file
  PASS  nothing priced by the word is refused a rewrite by the engine
  PASS  nothing priced as text is a CONTAINER to the engine
==================================================================
The price and the work agree on every extension.

exit=0
```

**A checked-and-fine is a result. This one is closed.**

---

# 5. THE DELETION WARNING DESCRIBED A DIFFERENT PRODUCT

**The text is not in the file the brief named.** `account-danger-zone.tsx` renders
`account.deleteAccountDescription` through the translation system; the words live
in `apps/web/i18n/messages/en/account.json`, `en` is the only locale, and that key
is used nowhere else in the repo. **I edited the string and left a comment in the
component saying where it went, so the next session does not go looking.**

**BEFORE**

> This will delete your account and the accounts you own. Furthermore, we will
> immediately cancel any active subscriptions. This action cannot be undone.

**AFTER**

> This deletes your account, your sign-in and your entire credit history. Any
> credits still on your balance go with it, including ones you paid for. This
> cannot be undone.

**The old one was the starter kit's, describing a product with teams and monthly
subscriptions. This product has neither.** But the skeptic's reframing in the
audit is the reason this mattered: **the danger was never the wrong nouns, it was
that somebody deletes an account without realising paid credits go too.**

**That they do go is not an opinion.** The balance is the sum of `credit_ledger`
rows; `20260821130000_account_deletion_cascade.sql` makes the sign-in cascade to
the account row and the account row cascade to the ledger. Delete the account and
every row is gone in the same moment, purchased ones included. **The old sentence
never said the word "credits" at all.**

**Something I decided not to add, and you may want it.** The privacy policy
already says *"If you want a refund, ask for it first."* **That sentence would do
real good in the red box too**, where the person is actually about to press the
button. I left it out because a refund instruction is a new claim rather than a
correction, and this lane was for bringing claims down. **One line, if you want
it.**

---

# 6. A WORD DOCUMENT WAS TOLD "THE PICTURE ITSELF IS UNTOUCHED"

`workbench.tsx`. **This was the one string the brief allowed in that file.** A
second one changed later in the session, on Jon's direct instruction, and it is
under item 1.

**BEFORE**

> Stripped, and the file was re-read afterwards to confirm nothing was left. 24104
> bytes in, 23880 out, and the picture itself is untouched.

**AFTER**

> Stripped, and the file was re-read afterwards to confirm nothing was left. 24104
> bytes in, 23880 out, and nothing you can see was changed.

**Why that wording and not something more specific.** The line is shown for every
file type, so it needs one phrase true of all of them, and the measured evidence
supports exactly this one. From `engine-limits.md`: PNG **pixels byte-identical**,
JPEG **scan data byte-identical**, DOCX **zip valid, parts present, XML parses,
text unchanged**. The invisible characters that layer A removes from a Word
document are, by definition, not visible. **So "nothing you can see was changed"
is the strongest sentence that is true of a picture and of a document at once.**

```diff
-              : `Stripped, ... ${bytes_out} out, and the picture itself is untouched.`
+              : `Stripped, ... ${bytes_out} out, and nothing you can see was changed.`
```

```diff
-              ? `${stillPresent} could not be removed. Read the result before you use it.`
+                `${stillPresent} formatting ${stillPresent === 1 ? 'mark was' : 'marks were'} left in place intentionally. Every other hidden character watermark has been stripped.`
```

**Those are the only two lines of `workbench.tsx` this lane touched.**

---

# 7. THE PRIVACY SENTENCE, SHIPPED

**Taken from `docs/POLICY-CHANGES-PENDING.md`, the section beginning "23 August
2026, lane B: the privacy page needs one new sentence", rewritten into this
page's voice and not widened.**

## Why it was owed

Free credits could be minted from one address without limit: delete the account,
sign up again, collect another five. Three rounds on the live database collected
fifteen. **The guard against it lived on the credit ledger, and deleting an
account deletes the ledger, so the guard was deleted along with the thing it was
guarding against.** `20260823120100_grant_claims_survive_deletion.sql` moved the
record somewhere the deletion cannot reach. **The privacy policy did not say so.**

**It is live.** The board records the migration applied and deployed, and the fix
verified on production: five free credits on the first sign-up and zero on the
second and third, where it had been five, five, five that morning. **So the
published policy has been describing less retention than actually happens.
Shipping this closes that gap rather than opening one.**

## The sentence that had to change first

**BEFORE** (end of the deletion paragraph under "Your rights")

> ... and your sign-in is destroyed with them. Because we do not retain submitted
> content, there is nothing else to delete.

**AFTER**

> ... and your sign-in is destroyed with them. Because we do not retain submitted
> content, there is nothing of yours left beyond one small record, and here is
> exactly what that is.

## The new paragraph, in full

> We keep a scrambled fingerprint of your email address, and not the address
> itself. It is there for one reason: the free credits you get for signing up are
> meant to be once per person, and without it anyone could delete their account
> and collect them again and again. What we keep is the fingerprint, the date it
> was first given, and which free credits it was. The fingerprint cannot be
> turned back into your address, although somebody who already holds it and a
> guess at your address can check whether the two match. It carries no name, no
> balance, no credit history, and nothing about anything you cleaned here.

**The two things the drafted wording forbade, both honoured.** It never calls the
fingerprint anonymous, because it is a one-way hash of a real address and someone
with a guess can confirm a match, and that sentence is in there explicitly. And it
never implies we can read the address back, because we cannot.

**One more change on that page: the date.** `Last updated: 21 August 2026` became
`24 August 2026`, because the policy now says something different.

## One judgement call, and it is yours to overrule

**The page has a section called "What we store about your account", and the
fingerprint is not mentioned there, only in the deletion section.** That is what
the drafted wording specified ("One paragraph. Nothing else on the page becomes
wrong") and a document governs over my judgement, `CLAUDE.md` section 2.

**But a reader working top to bottom meets "what we store" long before they meet
"what survives deletion".** The fingerprint is written when the free credits are
claimed, not when the account is deleted, so a second mention up there would be
accurate. **I did not add it. Say the word and it is one sentence.**

---

# RENDERED AND LOOKED AT

Dev server on **port 3003** (`web-d`), chosen so it could not collide with the
engine lane running in the same repo.

| What | Desktop 1280px | Phone 375px |
|---|---|---|
| Hero, the three lines | photographed while my version was in place, then **reverted to the original**, so what ships is the layout that was already live | not applicable, hidden on a phone |
| `how-it-works`, "Three marks, three places" | **photographed** | **photographed** |
| Pricing, "What one credit buys" | **photographed** | **photographed** |
| Pricing, "One price, three different jobs" | measured, 0px overflow. **Not photographed, see the top of this note** | **photographed** |
| Privacy policy, the new paragraph | measured, 0px overflow | **photographed** |
| The deletion warning | **not rendered at all, see the top of this note** | **not rendered** |

**Horizontal overflow measured 0 pixels on every page checked, at both widths.**

---

# HANDOFFS

| To | What |
|---|---|
| **Whoever owns `workbench.tsx`** | **Done this session, in Jon's own wording**, and no longer a handoff. See item 1. What is still owed is **seeing it on screen**, which needs the local engine running |
| **Jon** | **`CLAUDE.md` says "Upload a file and you get all three."** It is the origin of the three site instances I fixed and it is not mine to edit |
| **Jon or the workbench lane** | **The three layers have two different sets of names.** `how-it-works` says Hidden characters / Metadata / Statistical watermark; `pricing` says Invisible characters / File metadata / The statistical watermark. One grammar per repeated element, `SKILL.md` test 2. Picking one set is a decision, not a copy fix |
| **Whoever owns `lib/engine/client.ts`** | Line 58 still says *"That file is larger than 5 MB. Try a smaller one."* It is now unreachable, because the browser refuses at 3.2 MB first. Dead, not wrong, but it is a fourth number in a product that should have one |
| **Whoever owns the drift guards** | **"3.2 MB" is now hardcoded in three copy strings on the pricing page** while the real limit is `MAX_UPLOAD_BYTES` in `encode.ts`. Two numbers that have to agree with nothing forcing them to, which is the exact shape `verify-pricing-matches-engine.mjs` exists to prevent elsewhere |
| **Jon** | The refund reminder in the account deletion box. One sentence, item 5 |
| **Whoever owns the tree** | `oxfmt` disagrees with three files as already committed at HEAD. Not caused by this lane and not fixed by it |

---

# NOT ATTEMPTED, AS BRIEFED

- **The four "enforced rather than promised" FAQ claims.** The engine lane's.
- **"A hard three-word ceiling", "nine classes checked", the advertised size
  ceiling.** All waiting on the engine lane's measurements.
- **The news logos.** Jon has ruled: no links, intentional.
