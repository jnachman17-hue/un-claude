# BRIEF — the filename is a watermark and we are adding one of our own

**Written by the conductor, 25 August 2026. Paste this whole file into a fresh
session.**

**Found by Jon while using the product. This is a hole in the core promise and
half of it is our own doing.**

---

## 0. READ FIRST

Read `CLAUDE.md` in full. **Sections 1 (Jon is not a programmer), 4 (a run, not
an assertion), 7 (what the site may say) and 8 (think like the visitor) all
bite.** The **`unclaude-messaging` skill** governs any word a visitor reads.

**The verification standard:** an assertion carries no weight. Run it and paste
the real output.

---

## 1. THE DEFECT, IN ONE LINE EACH

A visitor downloads an image from ChatGPT. It is called
`ChatGPT Image Aug 25, 2026, 03_14_22 PM.png`. They upload it to un-claude,
which correctly strips the C2PA and EXIF metadata. Then:

```
uploaded :  ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
downloads:  cleaned-ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
```

**`apps/web/app/(marketing)/_components/workbench/workbench.tsx:1738`**

```tsx
download={`cleaned-${loaded.name}`}
```

**Two separate faults:**

1. **The tool's name survives.** We removed the mark nobody can see and left the
   one a human reads first. A file named `ChatGPT Image…` handed to a marker
   makes the invisible work irrelevant.
2. **★ WE ADD A TELL OF OUR OWN.** `cleaned-` announces that the file went
   through a watermark remover. **This is on every file this product has ever
   returned.** It is worse than the defect Jon reported, and it is entirely
   ours.

---

## 2. JON'S RULING — strip the tool name, keep the rest

**He has chosen this over the alternatives. Do not reopen it.**

```
ChatGPT Image Aug 25, 2026, 03_14_22 PM.png
   ->  Image Aug 25, 2026, 03_14_22 PM.png
```

**The conductor's recorded objection, so nobody re-derives it:** this makes the
product depend on a list of naming conventions that changes whenever a lab ships
a new export button, and **web research confirms even ONE tool has multiple
patterns** — a ChatGPT image saved from the thumbnail is named differently from
the same image saved from the edit view. **Jon has weighed this and ruled.
Build it so the list is trivial to extend, and move on.**

**Record the ruling in `docs/04-decision-log.md`** with the reasoning and the
objection.

---

## 3. YOUR TERRITORY

**Yours:** `apps/web/engine/**` · `apps/web/api/**` ·
`apps/web/app/(marketing)/_components/workbench/**` · `engine/tests/**` ·
`docs/04-decision-log.md` (the new entry only) ·
`docs/session-notes/strip-the-tool-name.md` (create it).

**NOT yours:** `apps/web/lib/engine/receipt.ts` (**ruled off-limits by Jon**) ·
`apps/web/lib/server/**` · `apps/web/app/api/stripe/**` · `supabase/**` ·
`vercel.json` · **`docs/IMPLEMENTATION-BOARD.md`, conductor only.**

**Hard rules:**
- **Never `git add -A`, `git add .`, `git commit -a`.** Stage by explicit path.
- **`git diff --cached` — THE DIFF, NOT THE FILE LIST — as its own SEPARATE
  step before every commit, and read it.** Three calls: add, check, commit.
  Other sessions have uncommitted work in `docs/04-decision-log.md`, which you
  also need. **Read its diff every time.**
- **Do not push or deploy.** Committing locally is yours.
- **No new dependencies.**

---

## 4. ★ ONE IMPLEMENTATION, NOT TWO

**Two implementations of one number is the trap this project has hit three
times.** Filename logic could plausibly live in `workbench.tsx` (which sets the
`download` attribute) or in `apps/web/api/_shared.py` (which already has
`safe_name`). **It must live in exactly one.**

**The conductor's recommendation: decide it in the ENGINE and return the
resulting name in the response, so the browser only ever renders what it is
given.** The engine is where the file is actually inspected, and it keeps the
browser from having an opinion. **If you choose otherwise, justify it.**

---

## 5. THE JOB

### 5.1 Kill the `cleaned-` prefix

**Not a design question. It is a tell we invented.** Remove it.

### 5.2 Strip the tool name

**A starting list, which you must VERIFY rather than trust** — the conductor
assembled it partly from memory and web results that were thin:

```
ChatGPT Image <date>.png                    OpenAI
DALL·E <datetime> - <prompt>.png            OpenAI   (note the · U+00B7)
Gemini_Generated_Image_<id>.png             Google
Firefly <...>.jpg                           Adobe
Copilot / Bing Image Creator                OIG.<id>.jpeg, _<uuid>.jpeg
Midjourney                                  <user>_<prompt>_<uuid>.png
Claude / Grok / Meta AI                     UNKNOWN — find out
```

**Verify each against a real download where you can**, and **say in your note
which ones you confirmed and which you took on trust.** An unverified pattern
that never fires is worse than no pattern, because it looks like coverage.

**Make the list ONE named constant with the reasoning beside it**, so adding a
new tool is a one-line change by someone who has never read the rest of the
file.

### 5.3 The edge cases — every one of these must be handled and tested

| Case | Requirement |
|---|---|
| **The name is ONLY the tool name** (`ChatGPT.png`) | Stripping leaves nothing. **Must never produce an empty name or a bare extension.** Decide a fallback and justify it |
| **Leftover separators** (` Image…`, `_Image_…`) | Trim leading/trailing spaces, underscores, hyphens, commas |
| **The extension** | **Preserved exactly.** A file that will not open is a far worse failure than a bad name |
| **Case** | Match case-insensitively — `chatgpt image.png` |
| **Unicode** | `DALL·E` contains U+00B7. Match it |
| **A name the customer chose** | `my essay.docx` must come back **byte-identical.** Never touch a name with no tool in it |
| **Midjourney** | The tool name does not appear at all — it is `<user>_<prompt>_<uuid>`. **Out of scope for stripping. Report it and do not guess** |

### 5.4 Tell the customer

**The name changing silently is its own problem** — they will think the download
broke. `CLAUDE.md` section 4: show the artefact.

**Surface it the way every other finding is surfaced**, in the existing report:
what the name was, what it is now, and why. **Wording is governed by the
messaging skill.** Do not write a new claim; describe what happened.

### 5.5 One thing to CHECK and report, not fix

**A Word document carries an internal title property**, separate from the
filename, which may hold the same tell. **Find out whether the existing metadata
strip already removes it.** If it does, say so. **If it does not, report it and
do not fix it here** — that is a metadata question and a separate job.

---

## 6. HOW TO PROVE IT

- **A real file, end to end.** Upload a genuinely AI-named file to a running
  instance, clean it, download it, and **paste the before and after filenames.**
  Not a unit test — the actual round trip.
- **The customer-named control:** upload `my essay.docx` and prove it comes back
  **byte-identical in name.**
- **Every edge case in 5.3 as a test**, including the empty-stem case.
- **Full engine suite.** Baseline **`842 passed, 1 skipped`.** Paste the real
  result and name any test you changed.
- `tsc --noEmit` clean.
- **Rendered and looked at**, desktop and phone, if anything appears on screen.

## 7. WHAT TO HAND BACK

`docs/session-notes/strip-the-tool-name.md`, **written as you go.** The before
and after filenames in full, which patterns you verified against a real download
and which you did not, the fallback you chose and why, and **a section titled
"What I could not prove."**

**Say plainly which AI tools you could NOT confirm.** The next person needs to
know where the coverage actually ends — a list that looks complete and is not is
the failure mode this whole approach carries.

Commit locally by explicit path. **Leave nothing uncommitted.** Do not push.

## 8. MODEL AND EFFORT

**Opus, high reasoning effort.** It is small code with a lot of edge cases, it
touches the one thing a customer looks at first, and the `cleaned-` prefix has
been leaking on every file this product has ever produced.
