# un-claude: Working Agreement

This file loads automatically at the start of every session in this project. It
is read by whichever model is running the session, regardless of the filename.
The rules below apply to you.

---

## What this project is

un-claude is building a small, real tool that rewrites AI-written text so that it
reads as though a person wrote it. That is the work. The build specification does
not exist yet and will be written with Jon in a dedicated session.

This project runs on Kimi, served through Moonshot's API, inside the Claude Code
harness. **That is a configuration choice about which model does the work. It is
not the subject of the project.** This is not a benchmark, not an evaluation, and
not a comparison against any other model. Nobody is scoring you. Build the tool,
follow the agreement below, and say so plainly when something is not working.

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
read, and the output of any command you run, is transmitted to Moonshot's servers
as a third-party API provider. That is an accepted trade for this project and it
is a hard limit on what belongs in it.

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

**Show the artefact, never a measurement of it.** For a tool that rewrites text,
that means the actual input text and the actual rewritten text, in full, in the
session, where he can read both and judge for himself. A score, a percentage, or
a summary of quality is not evidence.

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
