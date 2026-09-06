# Where the traffic is coming from, measured

**6 September 2026.** Jon: visitors and email signups at a record while he is
posting nothing anywhere, shadowbanned on TikTok. Question: where is it coming
from, and how should that change the marketing.

**Everything below excludes Jon's own IP and his two home cities**, which the
dashboard filters and which a naive query does not: 244 of 597 US "visitors"
were Hermosa Beach before that filter was applied.

---

## 1. It is a STEP CHANGE on 24 August, not a climb

Real visitors per day:

```
20-23 Aug     5,  8,  5, 10
24 Aug       47   <- the step
25-31 Aug    58, 17, 59, 94, 62, 55, 41
1-6 Sept     42, 51, 54, 43, 33, 29   <- easing
```

**Something happened on 24 August and it is now decaying.** That decay curve is
the shape of a single piece of content circulating, not of a channel that has
been switched on.

**What shipped that day:** the SEO fix (`c63f853`, `0746943`), which put the
homepage's 1,234 words back into the HTML for the first time. Before it, Google
was served 75 words and no `<h1>`.

---

## 2. Where they come from, and the quality gap is the finding

Thirty days:

```
source    people   scanned a document   pages each
direct      547          122  (22%)        1.32
search       68           33  (49%)        1.70
reddit       63            8  (13%)        1.06
other        32            5  (16%)        1.58
```

**Search traffic is more than twice as likely to use the product as direct, and
nearly four times as likely as Reddit. There are only 68 of them.**

**Reddit traffic bounces.** 1.06 pages each and 13% doing anything. It is
curiosity, not intent.

## 3. The direct traffic is HUMAN, and that was tested rather than assumed

122 of the 547 pasted a real document. The user agents are ordinary consumer
browsers, the largest single block being **190 people on an iPhone**. No crawler
agents appear. Two data-centre cities (Council Bluffs, Ashburn) sit in the US
city list and are the only obvious bot contamination.

**Direct, iPhone-heavy, landing on `/`, no referrer, decaying from a single
date** is the signature of a link being passed around inside apps that strip
referrers: iOS Reddit, TikTok's in-app browser, iMessage, WhatsApp, Discord.

---

## 4. WE ARE NOT RANKING FOR THE MONEY QUERY

Searching "remove Claude AI text watermark tool free" returns **nine
competitors and not un-claude.com**:

```
removeclaudewatermark.org   textwatermark.org      claudewatermark.com
gptcleanup.com              claudewatermark.rip    ninjahumanizer.com
gpt-watermark-remover.com   cudekai.com            overchat.ai
```

**Almost all are exact-match domains.** They are winning the query this product
is built for.

**CORRECTION, made the same day. An earlier version of this note said Google
Search Console was not verified. THAT WAS WRONG, and Jon caught it by opening
it.** The property exists, is verified as a DOMAIN property, and has been
collecting since about 18 August.

**How the mistake was made, because it is a repeatable one:** verification was
checked by looking for a verification FILE in `public/` and a META TAG on the
homepage. A domain property uses neither. It verifies by DNS TXT record, and the
three `google-site-verification` TXT records on `un-claude.com` had already been
seen in this same session and were written off as Google Workspace. **Check the
TXT records before concluding a property does not exist.**

**AND SEARCH CONSOLE CONFIRMS THE 24 AUGUST STEP FROM GOOGLE'S OWN SIDE.** Web
search clicks were flat at zero until 22 August, then 2, then **12 on 24
August**, the day the SEO fix shipped, with a second peak of 10 on 26 August.
**58 total clicks** in the window, which matches the 68 people PostHog counted
from search over a longer one. The SEO fix worked and the timing is no longer a
hypothesis.

---

## 5. The email list carries almost no signal, and that is the honest answer

**221 accounts, 36 with an email address.** The rest are anonymous guests.

```
24  gmail.com
 2  un-claude.com   (internal)
 2  university addresses: uci.edu, asu.edu
 8  domains seen exactly once
```

**Only two university addresses.** The student thesis is not confirmed by the
list, and a list of 24 gmail addresses cannot tell anybody where traffic came
from. **No individual address was read or printed:** aggregated by domain only,
per `CLAUDE.md` section 3.

**Signups are genuinely accelerating**, which matches Jon's impression:

```
21-31 Aug   4, 2, 2, 1, 0, 0, 2, 0, 1, 1, 1
1-6 Sept    1, 5, 5, 3, 1, 5
```

**Purchases: 6 rows, $54.94 gross, most recently two on 5 September.**

---

## 6. NOT ONE CAMPAIGN TAG EXISTS

Of 951 people, **949 arrived with no `utm_source` at all**; two carried
`source=ig`. So no link Jon has ever shared is attributable. Every future
share needs a tag or this question recurs forever.

---

## 7. What could not be determined

**Which specific post or video started it on 24 August.** Reddit's public search
refuses this client, no indexed Reddit post mentions the domain, and the
`agent-reach` skill's backends (`agent-reach`, `opencli`, `mcporter`, `twitter`)
are not installed on this machine, so the social platforms could not be swept.
**The Reddit app referrer `android-app://com.reddit.frontpage/` carries no thread
URL**, so PostHog cannot say which subreddit. Only one real thread was
identified, `r/Startup_Ideas`, and it sent 2 people.

**Recommended instruments, in order of value:**

1. **Read Search Console's Queries report.** It is already verified and already
   holding the answer to "what are we ranking for". Nothing needs building.
2. **NOT a "how did you hear about us" question.** Jon refused it as friction and
   he is right, because the data already exists without it. PostHog's first-touch
   referrer attributes signups with nothing asked of anybody: of 14 signups, 10
   first arrived direct, 3 from Google, 1 internal. Of everyone who reached
   checkout, 3 first arrived direct and 1 from a Google account.
3. **UTM tags on every link ever shared again.** 949 of 951 people carried none.
