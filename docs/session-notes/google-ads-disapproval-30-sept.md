# Google Ads: what is live, why it was disapproved, and what a fix actually means

**30 September 2026.** Jon asked for this as a summary. Nothing here was
changed in the ad account; this is a record of its state and of the policy.

---

## 1. The assets as they currently stand

**Descriptions, 4 of 4 used.**

| # | Text | Length |
|---|---|---|
| 1 | Remove the hidden AI watermarks that Claude, ChatGPT and Gemini leave behind. | 77/90 |
| 2 | Free to scan. See every watermark found, and exactly what was removed. | 70/90 |
| 3 | Paste text or drop a file. See exactly what is hidden and remove it for free. | 77/90 |
| 4 | Works on text and files. Free to scan, and no account is needed to start. | 73/90 |

**Headlines, 10.** Two are pinned: `Un-Claude` to position 1, and
`Claude Watermark Remover`.

| # | Text | Length | Pinned |
|---|---|---|---|
| 1 | Un-Claude | 9/30 | **position 1** |
| 2 | Official AI Watermark Remover | 29/30 | |
| 3 | AI Watermark Remover | 20/30 | |
| 4 | Claude Watermark Remover | 24/30 | **yes** |
| 5 | Free AI Watermark Remover | 25/30 | |
| 6 | Free Scan, No Sign Up | 21/30 | |
| 7 | ChatGPT Watermark Remover | 25/30 | |
| 8 | Free Scan, No Account Needed | 28/30 | |
| 9 | Results In Seconds | 18/30 | |
| 10 | See What Was Removed | 20/30 | |

**Seven of the ten headlines and all four descriptions name watermark removal
as the product.** That matters for section 4.

---

## 2. What Google said

Verbatim from the account:

> **Enabling dishonest behavior**
> Products or services that help users fake documents, cheat on exams, spy or
> wire-tap, or other dishonest behaviors aren't allowed.
>
> **What happens next.** To get your ad running, you need to fix the policy
> issues listed above. Edit the ad to fix the issue. When you save your
> changes, your ad will be automatically re-reviewed. Save without making
> changes. Your ad will not be re-reviewed and will remain disapproved.

**Timing:** the campaign was disapproved minutes after starting. It served
**9 clicks in total, on 6 and 7 September**, measured from `gclid` in PostHog,
and produced **zero checkouts**. Those nine are the only paid traffic this
project has ever had.

---

## 3. The policy, quoted rather than paraphrased

The link in the notice is `adspolicy/answer/6016086#362`, which is **"Enabling
dishonest behavior"**, policy 14 of 30 in Google's Advertising policies.

> Google Ads values honesty and fairness and doesn't allow the promotion of
> products or services that are designed to enable dishonest behavior.

The clause that applies, from the list of what is not allowed:

> **Services or products that enable academic dishonesty, like essay or thesis
> generators**

**★ THIS CORRECTS A BELIEF ALREADY RECORDED IN `06` ROW 98**, which says
"Google Ads bans 'essay or thesis generators'" and treats that as a category
Un-Claude sits outside because it generates nothing. **The actual rule is
broader than the example.** The prohibited category is products that *enable
academic dishonesty*; generators are given as an instance of it, introduced by
"like". A tool that takes AI-written coursework and makes it read as
human-written is inside the category on the plain words, whether or not it
writes anything.

**Row 98's wider conclusion still stands** — no enforcement action in this
space has ever reached a post-processing tool, and TEQSA's 615-domain blocklist
contains zero humanizers. **That is about enforcement risk. This is an ad
platform applying its own rule to its own inventory, which needs no regulator
and has already happened.**

---

## 4. Why this is not a copy problem

**Three things in the mechanics decide it.**

1. **Google re-reviews on save, and it reviews the landing page, not only the
   ad.** `un-claude.com` leads with AI watermark removal, sells credits whose
   dominant use is the rewrite, and says so in its own headline. Editing the ad
   text leaves the thing being reviewed substantially unchanged.
2. **The paid product is the rewrite.** Measured: 404 of 535 jobs are text, and
   every buyer's largest job is an essay of 2,000 to 7,500 words. Layers A and
   metadata are free-tier functions in practice. An ad that describes only the
   honest layers describes a part of the product that is not what the money
   buys.
3. **Vagueness fails a second policy.** Copy that clears the dishonesty review
   by not saying what the product does runs into Google's separate
   Misrepresentation policy. Threading between the two is not a wording
   problem with a solution; it is the absence of one.

**Recorded as a boundary, not as advice: this project will not produce ad copy
whose purpose is to clear a disapproval that the product itself earned.** That
is a circumvention of the platform's rule and it also breaks `CLAUDE.md`
section 4, which is the honesty rule this whole project runs on.

---

## 5. Two further exposures in the current assets, separate from the disapproval

Neither of these caused it, and both are live regardless of what happens next.

**"Official AI Watermark Remover".** "Official" asserts an authorised or
endorsed status. Un-Claude is not the official anything, and Google's
Misrepresentation policy covers implying an affiliation or endorsement that
does not exist. **This headline is a second, independent disapproval risk and
it is one that genuinely is a wording problem.** It should come out whatever
else happens.

**"Claude Watermark Remover" and "ChatGPT Watermark Remover".** These put
third-party trademarks in ad text. Google's trademark policy allows a rights
holder to file a complaint and have ad text restricted, and both Anthropic and
OpenAI enforce their marks. **The pinned `Claude Watermark Remover` guarantees
one of them appears in every impression.** `04` entry 36 already commits this
project to leading with Claude in marketing, so this is a recorded tension
rather than a new one, but the ad account is where it has teeth.

---

## 6. What a fix actually means, with costs

**A. Advertise a different product, at a different destination.** Stripping
EXIF, GPS and C2PA credentials from files is a genuine privacy function this
product already performs, with no dishonesty angle. It would need **its own
landing page that is actually about file privacy**, because Google reviews the
destination. Honest, legitimate, and a real product decision. **Cost:** a new
page and a smaller market. **This is the only route to Google Ads that does not
depend on a reviewer missing something.**

**B. Do not use this channel.** **Cost:** nothing measurable. See the
arithmetic below.

**C. Appeal.** Jon has declined, on the reasonable view that it will not
succeed.

### The arithmetic that applies whichever is chosen

**Break-even cost per click is about eleven cents.**

```
revenue per visitor = $39.97 / 361 visitors = $0.111   (last 9 days, measured)
                    = $49.98 / 334 visitors = $0.150   (the 9 days before)
```

That is the ceiling before Stripe's fees. Realistic CPCs on terms like "AI
watermark remover" are $1 to $3.

| CPC | Cost per purchase at the measured 0.90% | Revenue per purchase |
|---|---|---|
| $0.50 | $55 | $13.32 |
| $1.00 | $111 | $13.32 |
| $2.00 | $222 | $13.32 |

**At $2 a click the funnel would need to be about eighteen times better** —
conversion from 0.90% to roughly 16%, or average order from $13 to $240.

**This is the part that is worth arguing about and it is not a policy
question.** Paid search needs a product that converts hard or sells big. The
work that would make Google Ads viable — conversion rate and order value — is
the same work that makes every other channel better, and none of it is blocked
by anyone's policy.

**Jon's correction, accepted and recorded:** the 9 clicks are not evidence the
channel is weak. The campaign was killed minutes in and never ran. The
break-even arithmetic above is the honest case against it, and it stands on its
own.
