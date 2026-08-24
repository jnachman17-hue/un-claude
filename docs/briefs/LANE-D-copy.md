MODEL: Opus 5, high effort. Seven items, all of them words. **No engine
logic, no credit maths, no new features.**

READ FIRST
1. **CLAUDE.md in full.** Section 7 (before you write a word a visitor
   reads) and section 8 (think like the visitor) govern this entire lane.
2. **`.claude/skills/unclaude-messaging/SKILL.md`** — it fires
   automatically on copy work. Let it, and obey it.
3. `docs/session-notes/f1-audit.md` — the claims section.
4. `docs/IMPLEMENTATION-BOARD.md`, Lane D.

TERRITORY:
  `apps/web/app/(marketing)/**` copy, FAQ and metadata
  `apps/web/app/(marketing)/(legal)/**`
  `packages/features/accounts/src/components/account-danger-zone.tsx`
  `apps/web/app/(marketing)/_components/workbench/workbench.tsx`
      — **ONE STRING, item 6. Nothing else in that file.**

**DO NOT TOUCH — ANOTHER SESSION IS LIVE IN THE ENGINE RIGHT NOW:**
  `apps/web/engine/**`, `apps/web/api/*.py`, `engine/**`
  `lib/server/credits.ts`, `app/api/**`, `app/auth/**`
  `docs/IMPLEMENTATION-BOARD.md`

**THE SITE IS LIVE AND TAKING REAL MONEY. Do NOT deploy. Do NOT push.**

═══════════════════════════════════════════════
THE ONE RULE FOR THIS WHOLE LANE
═══════════════════════════════════════════════
**Every change here brings a claim DOWN to what is true. Not one goes up.**

This site's entire argument is that its claims survive checking. The
findings below are the ones a curious visitor can disprove in about ten
seconds, using the receipt the product itself hands them. **That is worse
than a vague boast, because it invites the check and then fails it.**

**Where a true sentence is weaker than the false one, write the true one.**
Several of these have honest versions that are *better* copy — say so
rather than reaching for the strongest wording that survives.

═══════════════════════════════════════════════
1 — "100% of detectable marks removed" is false, and the honest
    version is a better line
═══════════════════════════════════════════════
`_components/hero-section.tsx:192`.

**Measured on the live site: the scanner found 15 invisible characters and
removed 12. Three are left behind ON PURPOSE** — `U+200E` LRM, `U+200F`
RLM and `U+061C` Arabic letter mark. They carry meaning in Arabic and
Hebrew, and stripping them would corrupt a real document. **The engine
even says so in a note it returns on every run. The engineering is
correct. The sentence is not.**

Anyone can scan, clean, and scan again and see three remain — and the
panel reports them.

**The honest version is a sophistication signal**, something in the
direction of *"every mark that can be safely removed — and we show you the
ones we deliberately keep, and why."* Do not copy that phrasing; write it
properly. **This is a case where the truth sells better.**

═══════════════════════════════════════════════
2 — "upload a file and you get all three"
═══════════════════════════════════════════════
`how-it-works/page.tsx` around line 128 — *"and all three do."*
Check `capabilities/page.tsx` for the same claim in other words.

**No accepted file type gets all three layers.** A Word document gets
layer A and metadata, not the rewrite. An image gets metadata. **Read
`engine-limits.md` for what each type actually receives and describe
exactly that.**

═══════════════════════════════════════════════
3 — the pricing page says "any size" and the product now refuses at 3.2 MB
═══════════════════════════════════════════════
Three places in `pricing/page.tsx`: the meta description (~109), the
feature label *"One Word document or picture, any size"* (~144), and the
FAQ answer (~227) which says *"one flat credit whatever its size."*

**A file lane shipped a browser-side limit at about 3.2 MB, with a message
that names the number.** So the page promises any size and the product
refuses. **"Any size" was about PRICE, not about acceptance** — the credit
does not change with size. Keep that true meaning and stop implying no
upload limit. Read the actual limit out of the code rather than trusting
3.2 as a round number.

═══════════════════════════════════════════════
4 — VERIFY BEFORE CHANGING: "quotes 1 credit, charges 5"
═══════════════════════════════════════════════
The audit found the pricing page quoting 1 credit for a file and charging
5. **Since then a ruling changed `.txt` to be priced by the word like a
paste, and the pricing copy was rewritten for it.**

**So this may already be correct. Check it against the code before
touching anything**, and if it is fixed, say so and move on. **Do not
"fix" a sentence that is now true.**

═══════════════════════════════════════════════
5 — the account-deletion warning describes a product that does not exist
═══════════════════════════════════════════════
`packages/features/accounts/src/components/account-danger-zone.tsx`.

It names **teams and subscriptions this product does not have**, and
**never mentions credits** — which are the one thing a customer actually
loses, including ones they paid for.

**A skeptic reframed this during the audit and the reframing matters:** the
danger is not the wrong nouns, it is that somebody deletes an account not
realising paid credits go with it. **Say what is actually destroyed.**

═══════════════════════════════════════════════
6 — a Word document is told "the picture itself is untouched"
═══════════════════════════════════════════════
`workbench.tsx:1107`. That sentence is written for an image and is shown
for a `.docx` too, where it is nonsense.

**ONE STRING. Nothing else in that file** — it belongs to another lane.
If it cannot be fixed without restructuring, write it up and leave it.

═══════════════════════════════════════════════
7 — the privacy sentence Jon is owed. The wording is already drafted.
═══════════════════════════════════════════════
`docs/POLICY-CHANGES-PENDING.md`, **the section beginning at line 171:
"23 August 2026, lane B: the privacy page needs one new sentence."**

A migration changed **what is retained after an account is deleted**, so
the record of a free-credit claim now survives deletion — deliberately,
because that is what stops five free credits being minted over and over
from one address. **The privacy policy does not say so, and it must.**

That section has the suggested wording, exactly what is retained, and
where it goes. **Use it. Rewrite it in the site's voice, do not widen
it**, and update `POLICY-CHANGES-PENDING.md` to record that it shipped.

═══════════════════════════════════════════════
NOT IN THIS LANE — do not attempt these
═══════════════════════════════════════════════
- **The four "enforced rather than promised" FAQ claims.** Three fail
  against the product's own receipt, and **most are not fixable by
  rewording** — *"it will not change your facts"* cannot be softened into
  something both true and worth saying while it still does. **That is the
  engine lane's work, running now.**
- **"A hard three-word ceiling"** (the receipt printed 6), **"nine classes
  checked"** (one class finds nothing), and **the advertised size ceiling.**
  All wait on measurements the engine lane is taking tonight.
- **The news logos.** Jon has ruled: no links, intentional. Leave them.

═══════════════════════════════════════════════
FINISHING
═══════════════════════════════════════════════
Jon is not a programmer and cannot check this by reading code. **Paste the
before and after of every sentence, in full**, as plain text he can read
aloud. For anything visual, show it at desktop and phone width.

**Where you found a claim already true, say so** — a checked-and-fine is a
result, not a gap.

A step you skipped is a step that failed. Say which, at the top.

Write `docs/session-notes/lane-d-copy.md`.

Before EVERY commit run `git diff --cached --name-only` and confirm only
your own files are listed — **another session is live in this repo** and a
`git add` in theirs leaves their paths staged for your commit. Never
`git add -A`, `git add .` or `git commit -a`. **Do NOT deploy or push.**
