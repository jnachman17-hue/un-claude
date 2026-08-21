# Legal reconciliation, applied — 21 August 2026

**What this is.** The corrections drafted in `legal-reconciliation.md` sections
2B and 2C, applied to the two pages they were written for. Two files changed and
nothing else:

- `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx`
- `apps/web/app/(marketing)/(legal)/terms-of-service/page.tsx`

The cookie policy was already rewritten and committed earlier today and was not
touched. Both pages now carry **Last updated: 21 August 2026**.

**Every replacement sentence was re-checked against the code as it stands today
rather than trusted from the report.** The report is reliable and almost all of
it held. One thing did not, and it is the most important item in this note.

---

## 1. The one place the code contradicted the report

### Deleting your account does not delete your data. The report assumed it did.

**What the report said**, in section 1.11 and again in decision D5, and what it
therefore drafted into the privacy policy:

> Because `credit_ledger.account_id` is declared `on delete cascade`, deleting
> the account takes the ledger history with it.

> If you delete your account, your account record and your whole credit history
> are deleted with it.

**That sentence would have been false, so it was not written.** Here is the
evidence, because this is a claim about a chain of three links and only two of
them exist.

**Link one exists.** The credit ledger really does cascade from the account
table, `apps/web/supabase/migrations/20260819180000_credit_ledger.sql`:

```sql
account_id  uuid  not null references public.accounts (id) on delete cascade,
```

**Link two does not exist.** The account table does not reference the sign-in
table at all. This is the whole of its key column, from
`20241219010757_schema.sql`:

```sql
id  uuid unique not null default extensions.uuid_generate_v4(),
```

No `references auth.users`. No `on delete cascade`. A search of every `.sql`
file in the repository finds exactly one `on delete cascade` in the entire
schema, and it is link one. There is no delete trigger on the sign-in table
either: the only two triggers on it fire on user **created** and on email
**updated**.

**Link three confirms it.** The delete button calls one thing,
`packages/features/accounts/src/server/services/delete-personal-account.service.ts`:

```ts
await params.adminClient.auth.admin.deleteUser(userId);
```

Nothing else. Nothing anywhere in the application deletes a row from the
accounts table.

**So what actually happens when someone presses "delete account":** their
sign-in is destroyed and they can never reach the account again. Their account
record, which holds their **email address and their name**, and their entire
credit history, both stay in the database.

**Two consequences, and they are different sizes.**

**For the page, which is what this session could fix:** the privacy policy now
says what the code does. It says deletion removes the sign-in for good, says
plainly that this does not by itself erase the record, and says to write in and
we will remove it. That is honest, and asking for erasure is a real right people
can exercise, so the policy is not weakened by describing it accurately.

**For the code, which this session could not fix and did not try:** a button
labelled "delete account" that leaves the account behind is a defect, not a
policy. It belongs to whoever owns the database. **When it is fixed, the privacy
policy sentence changes in the same deployment,** and it changes into the
stronger sentence the report originally drafted. The page's header comment
records this so the next session does not have to rediscover it.

**Why nobody caught it before.** The report checked the ledger's own migration,
found a real cascade, and reasonably stopped there. The missing link is in a
starter-kit file from December that nobody had reason to reread.

---

## 2. What was checked and held, so nobody re-audits it

Every one of these was confirmed against the code today, not taken on trust.

| Claim | Where it was checked |
|---|---|
| `uc.free-sanitises.v1` no longer exists | Only the privacy policy still mentioned it. Nothing writes or reads it |
| A guest account is created on first use | `workbench/credits.ts`, `signInAnonymously` |
| `uc-guest` is a one-year cookie holding the guest's identity | `api/tool/clean/route.ts`, httpOnly, 365 days |
| The free allowance is a server-side ledger, not a browser count | `credit_ledger.sql`, `spend_credits` locks the account row |
| The ledger keeps date, file-or-paste, word count, cost and our own cost | The migration's columns, one by one |
| Credits: 2 on first use, 3 more for an account, once each | `lib/server/credits.ts`, enforced by two partial unique indexes |
| Guest credits move to a real account on sign-up | `mergeGuestInto` |
| A failed run refunds automatically and shows in the history | `refund()` writes an `operation_refund` row; `/home` renders it |
| Cloudflare Turnstile loads on every page | `components/root-providers.tsx`, above everything |
| PostHog stores nothing on the device | `persistence: 'memory'`, `respect_dnt: true` |
| Submitted content is not retained | Temp directories in the engine; no table holds it |
| Server logs carry a file extension, never a file name, never content | `api/_shared.py`, `usage_record` |
| The rewrite goes to Mistral through Vercel AI Gateway | `WATERMARKS_REWRITE_MODEL=mistral/mistral-small`, `ENGINE.md` section 6 |

**One further correction, smaller.** The report's drafted line "a file with no
words in it costs one credit" does not match the code, and neither did the
sentence already on the page. The real rule, identical in
`workbench/credits.ts` and in the clean route: **an uploaded file is one flat
credit whatever its size, unless it is a plain text file being sent through the
rewrite, which is priced by its words like a paste.** Word count does not decide
a file's price. The terms now say that. It agrees with the pricing page, which
was already right.

---

## 3. The missing markers, and how each was closed

**No marker shipped. Neither page contains the word MISSING.**

| Marker | Resolution |
|---|---|
| Last updated date | 21 August 2026 on both |
| Cloudflare Turnstile | Claimed exactly what was measured on the live homepage: it runs on every page, sees the IP address and ordinary browser details, and **stores nothing on the device under our domain**. No more than that |
| Credit-history retention | No period invented. The page says we keep it for as long as we hold the account, that nothing deletes it automatically afterwards, and to ask us. See section 1 for why it could not say the stronger thing |
| Vercel log retention | **No figure invented and none guessed.** The sentence says the logs sit with our hosting company and are kept for a limited period set by its platform rather than by us. **Still needs Jon to read the real number off the Vercel dashboard.** If it turns out to be short, saying so is a selling point and the sentence should be strengthened |
| The model provider | Named at provider level, not model level: "Today that model comes from Mistral", reached through Vercel AI Gateway. A model upgrade no longer falsifies the page. Added the durable half of decision D6: **the companies that can see submitted text are the ones in the table, and the table is updated before a new one is used.** That is a promise Jon can keep, where a model name is a fact that expires |
| The data controller | **Omitted, deliberately.** No person named, no company invented. Recorded as outstanding here and in the page's header comment |

**The disclosure that mattered most was not softened.** It is now the second half
of the opening paragraph, inside the bordered lead block a reader cannot skim
past: *"if you use the optional rewrite, your text is sent to another company's
AI model to be rewritten, and comes straight back. Nothing else you submit ever
leaves our systems."*

---

## 4. What was deliberately left alone

Honouring sections 2B and 2C, which each name what stays.

**On the terms:** "What Un-Claude does", **"What we can and cannot promise"**,
"Acceptable use", "Availability", "Liability", "Ending your use", "Changes" and
"Contact" are untouched, character for character. The claims boundary is the
strongest section on the site and nothing here weakens it. Acceptable use was
left alone for the reason D4 gives: naming the legitimate uses before the
prohibition is what makes the prohibition credible, and a broader prohibition
would read as knowingly unenforced.

**On the privacy policy:** "When you write to us", "Children" and "Changes" are
untouched. The Google and password sign-in paragraphs are untouched.

**Not added, on purpose:** the terms have **no** entity or governing-law section.
That is decision D1 and it is Jon's. The existing header comment explaining the
absence is still there and still correct.

**One heading was renamed** and it is worth flagging because it was not in the
report: "What we store if you create an account" became **"What we store about
your account"**. The old heading had become misleading, because a guest account
is created for someone who creates nothing.

---

## 5. Handoffs. Not this session's files

**5.1 Nobody ever agrees to the terms.** Report item 1.7. There is no acceptance
line under either sign-up button and the checkbox flag is unset, so the only
route to the terms is a footer link. **Every protective clause in that document
is only as strong as the acceptance behind it, and right now there is none.**
The sign-up page was edited tonight by the mobile session, so the line was not
added here. It is one sentence:

> By creating an account you agree to our Terms of Service and Privacy Policy.

**This matters before the site takes payment, not after.**

**5.2 The disclosure line at the tool's own button.** Report section 2D. The
people most likely to care are the ones who never sign up, and the workbench is
where the decision to paste is actually made:

> Your text is processed and deleted, never stored. The optional rewrite sends
> it to an AI model to be rewritten.

**5.3 The account-deletion defect.** Section 1 of this note. Owner: whoever holds
the database. The fix is a foreign key or a delete trigger. **When it lands, the
privacy policy sentence changes in the same deployment.**

**5.4 Entries for the permanent documents.** Written here rather than into
`04-decision-log.md` and `06-assumptions-and-open-questions.md` because two other
sessions are live and `06` is already modified in the working tree. Whoever
merges this note should carry across: the deletion-cascade finding as a runbook
entry and an open question; the provider-not-model rule as a decision; and the
Vercel retention figure as an open question with "read the dashboard" as its
trigger.

---

## 6. What was not verified, said plainly

- **Vercel's real log retention window.** Needs the dashboard. The page is
  written so that it is not wrong without the number, but it is not as strong as
  it could be.
- **Whether PostHog autocapture has ever recorded workbench text.** Needs the
  PostHog interface. Report item 4.1(c), still open.
- **The deletion behaviour was proved from the schema, not by running it.** There
  is no local Supabase in this project (`06` row 11), so this is static evidence:
  no foreign key, no delete trigger, no delete statement in the application. It
  is unambiguous, but it was not executed against a live database.
- **Nothing here is legal advice** and nobody in this session is a lawyer. This
  reconciles two documents against the code they describe. It does not review
  them as contracts.

---

## 7. Verification

Both pages were rendered on the running dev server and read end to end as a
visitor, at desktop and at 375px. The privacy policy's third-party table scrolls
inside its own box at phone width and the page itself does not scroll sideways,
which is the shared `Table` component behaving as designed. `tsc --noEmit`
across the web app exits 0 with no output, and oxlint reports nothing on either
file. **The full rendered text of both pages was pasted into the session for Jon
to read as words rather than as code.**

Neither page was deployed.
