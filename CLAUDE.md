# un-claude: Working Agreement

This file loads automatically at the start of every session in this project. It
is read by whichever model is running the session, regardless of the filename.
The rules below apply to you.

---

## What this project is

un-claude removes AI watermarks from text and files. A user pastes text or
uploads a document, the tool finds the marks that identify it as machine
generated, and removes them.

**An AI watermark is a mark an AI tool leaves behind saying it wrote something.**
Some are characters you cannot see, sitting invisibly between the visible words.
Some are hidden notes tucked inside the file itself. Some are patterns in which
words the model chose. None of them show up on the page, and most people carrying
one have no idea it is there.

**Three layers, and the difference between them decides everything.**

| Layer | What it removes | Works on pasted text | Provable |
|---|---|---|---|
| **A. Invisible characters** | Zero width characters, unusual spaces, direction and tag marks | **Yes** | **Yes** |
| **Metadata** | Hidden data inside a file's wrapper: C2PA provenance, EXIF, XMP, generator tags | **No.** Needs a file | **Yes** |
| **B. Statistical watermark** | Patterns in word choice, removed by rewriting | **Yes** | **No. Best effort** |

**Paste text and you get A and B. Upload a file and you get all three.**

**Layer B is best effort and is never presented otherwise,** in these documents,
in the interface, or to a user. See section 4.

**The tool lives on the landing page and works without an account.** There is no
separate application behind the login. Built once, wrapped twice: a stranger gets
marketing underneath it, a signed in user gets their credit balance instead.

**Rescoped 18 August 2026, session 4.** This project was an AI text humanizer
until that date. Anything in `docs/` still describing a humanizer, a rewriting
engine owned as a separate workstream, or a metrics panel measuring sentence
rhythm is history. See `04-decision-log.md` entries 18 to 24.


---

## 1. Who you are working with

Jon is not a programmer. He directs this project by describing outcomes, not by
writing or reviewing code. Three consequences follow, and none are negotiable.

**Explain in plain English.** Define any technical term the first time you use
it. If you catch yourself writing a sentence he would have to look something up
to understand, rewrite it.

**He cannot check your work by reading it.** Verification has to come from
somewhere other than his judgment of your code. See section 4.

**He wants pushback, not agreement.** If an instruction rests on a wrong premise,
say so before executing it. Building the wrong thing correctly is a failure.
Recommend, do not enumerate: when he needs a decision, give him your pick and the
reasoning, not a menu of five options with no position taken.

---

## 2. Precedence: what governs what

When two sources of guidance disagree, this is the order of authority.

1. **Jon's explicit instructions in the session.** Highest authority.
2. **The documents in `docs/`.** Where a document decides a question, that answer
   governs. Do not substitute your own judgment, convention, or outside guidance
   for something a document has already settled.
3. **Skills and outside convention.** These may inform anything the documents
   leave open. They may never override anything the documents have decided.
4. **Your own judgment.** Last.

When these conflict, **surface it rather than resolving it quietly.** Name the
governing document by file and heading, state what the other source recommended,
and say plainly that the document governs. Do not split the difference, and do
not pick a side without saying you did.

---

## 3. The boundary: what never leaves this folder

Everything in this session, including Jon's prompts, the contents of any file you
read, and the output of any command you run, is transmitted to Anthropic as the
API provider. That is an accepted trade for this project and it is a hard limit
on what belongs in it.

**Corrected 18 August 2026.** This paragraph named Moonshot until Kimi was
retired. The provider changed. **The rules below did not, and do not relax.** A
different third party is still a third party.

**Never read, open, summarise, quote, or include:**

- Any file outside `~/un-claude`. This project is self-contained by design.
- **`~/Documents/GitHub/Blotter-Claude`, specifically and by name.** That is a
  separate live project that must remain untouched. Do not read it, do not
  reference it, and do not run any command whose path reaches into it.
- Personal data of any kind: email, contacts, calendars, messages, financial
  records, identity documents.
- Credentials, keys, or tokens belonging to anything other than this project.

If a task appears to require any of the above, stop and ask. The likeliest
correct answer is that the task does not belong in this project.

---

## 4. Verification: how something becomes "done"

Because Jon cannot check your work by reading it, **an assertion that something
works carries no weight here.** The standard:

**Run it and show the real output.** Not a description of what the output would
be. The output itself, pasted in.

**Show the artefact, never a measurement of it.** The actual thing, in full, in
the session, where Jon can read it and judge for himself. A score, a percentage,
or a summary of quality is not evidence.

**What that means layer by layer, because this product splits in two.**

- **Layers A and metadata are deterministic**, meaning the same input always
  produces the same output with no judgment involved. Proof is the marks
  themselves: which characters were found, where they were, and the file before
  and after. This is countable, so **"it worked" is a fact here, not an
  opinion.** Show the count and show the marks.
- **Layer B cannot be proved and must never be reported as though it were.** The
  engine's own documentation calls it best effort. Whether a statistical
  watermark was removed is not directly checkable by us or by anyone else. Show
  the input and the output in full, and say plainly that the removal is
  unverified. **Reporting layer B with the confidence of the other two is the
  single easiest way to make this project dishonest.**

**A step you skipped is a step that failed.** Never report something as verified
if you did not verify it. Say you skipped it and say why.

**State failures first and plainly.** If something does not work, lead with that
sentence. Do not bury it under what did work. One plain sentence, then the fix.
No extended apology and no self-criticism.

---

## 5. Stop and ask before

- Overriding anything already decided in `docs/`.
- Running any command that touches files outside this project folder.
- Installing anything, adding a dependency, or downloading a file.
- Pushing to GitHub. Committing locally is yours to do. Publishing is Jon's call.
- Publishing anything anywhere under Jon's name.

Staging rule, carried over from a project where ignoring it caused real damage:
**stage files by explicit path.** Never `git add -A`, `git add .`, or
`git commit -a`.

---

## 6. Write things down at the moment they happen

There is no memory between sessions other than the files in `docs/`. Continuity
runs entirely through them.

| When you notice | Write it to | With |
|---|---|---|
| A decision Jon has made | `docs/04-decision-log.md` | the reasoning, not only the outcome |
| A question that is open | `docs/06-assumptions-and-open-questions.md` | a working position, why it is unresolved, and a trigger for revisiting |
| An operational fact learned the hard way | `docs/07-runbook.md` | what went wrong, and what to do instead |
| Where the next session picks up | `docs/CURRENT-HANDOFF.md` | rewritten at session end |

**Write it at the moment it happens, not at the end of the session.** A session
that ends unexpectedly loses everything that was not yet written down.

`docs/CURRENT-HANDOFF.md` holds resumption context only. It must never be the
only place a confirmed decision is recorded.
