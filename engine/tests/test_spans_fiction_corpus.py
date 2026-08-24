"""Every quotation freezes, and nothing about its surroundings changes that.

**Inverted 24 August 2026 on Jon's ruling.** This file was built by E-16 to
assert the opposite — that none of these fiction dialogue lines freezes —
because the freeze then tried to protect only quotations it judged to be
sourced. Two sessions built such a judgement and both failed on ordinary text,
for a reason no amount of care fixes:

    "Power tends to corrupt," Acton observed.      <- real
    "Mind the second stair," Aldous observed.      <- fiction

Quote, comma, capitalised name, reportive verb, in both. The difference is
world knowledge, not syntax. Jon: "any quotation is frozen and kept across the
board. There's no delineation between novel dialogue and real quotation."

**The corpus is kept and its assertion turned over**, because it is the same
49 lines that proved the old rule broken and they now prove the new rule
whole. `test_the_surrounding_words_never_decide` is the lock that replaces
E-16's cue-list lock: it puts ONE quotation into fourteen different
surroundings and requires the identical answer from all of them, so any future
attempt to read the context and decide fails the suite.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "apps" / "web" / "engine"))

from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_spans import detect_protected_spans                 # noqa: E402

TIERS = ("structure", "quotes")


# --------------------------------------------------------------------------
# Fiction. EVERY quotation in these lines must freeze — that is the ruling.
# The first element used to be the reportive verb that wrongly triggered the
# old cue; it is kept only as a label, because the verb no longer decides
# anything and that is the whole point.
# --------------------------------------------------------------------------
FICTION_LINES = [
    ("argued", '"You never once asked me," she argued, and turned to the window.'),
    ("argues", '"He argues with the weather," she said. "It has never once given way."'),
    ("warned", '"Don\'t go down to the water after dark," he warned, shouldering the pack.'),
    ("warns", '"He warns everyone about the ford," she said. "Nobody listens to him."'),
    ("noted", '"Your hands are shaking again," she noted, setting the cup down.'),
    ("notes", '"He notes every penny," she said, "and he has never once been wrong."'),
    ("observed", '"You always leave before the music stops," he observed, watching her coat.'),
    ("observes", '"Nobody observes the fast any more," the priest said, and poured for them both.'),
    ("claimed", '"I was nowhere near the barn that night," he claimed, and nobody believed him.'),
    ("claims", '"He claims the land is his," she said. "The map in the hall says otherwise."'),
    ("stated", '"I will not be going with you," she stated, folding the last of the linen.'),
    ("states", '"The lease states nothing of the kind," he said, and put the paper down.'),
    ("declared", '"This house is finished with the lot of them," he declared from the top step.'),
    ("remarked", '"You have your mother\'s temper," she remarked, without looking up.'),
    ("remarks", '"He remarks on it every winter," she said, "and every winter I ignore him."'),
    ("insisted", '"I saw what I saw," he insisted, though the lamp had been out an hour.'),
    ("insists", '"She insists on the long road," Marcus said, and shouldered the second pack.'),
    ("acknowledged", '"I should have written sooner," she acknowledged, and the silence went on.'),
    ("acknowledges", '"Nobody acknowledges the debt now," he said, and put out the candles.'),
    ("concluded", '"Then there is nothing left to settle," he concluded, and reached for his hat.'),
    ("reported", '"The road is under three feet of water," he reported, out of breath.'),
    ("reports", '"He reports to nobody but himself," she said, and let the gate swing shut."'),
    ("asserted", '"That money was mine before it was ever his," she asserted, hands flat.'),
    ("asserts", '"He asserts it loudly enough," she said, "which is how I know it is a lie."'),
    ("maintained", '"I locked the gate the same as every night," he maintained, meeting her eye.'),
    ("maintains", '"She maintains the graves herself," he said, "and has done for thirty years."'),
    ("contended", '"You have the story backwards," she contended, pouring the last of the tea.'),
    ("contends", '"He contends with the river every spring," she said, "and the river wins."'),
    ("cautioned", '"Mind the second stair," he cautioned, holding the lamp low for her.'),
    ("emphasised", '"Not one word of this leaves the kitchen," she emphasised, and shut the door.'),
    ("emphasized", '"Not one word," she emphasized again, and turned the key in the pantry door.'),
    ("emphasise", '"They emphasise the wrong things," he said, and folded the newspaper away.'),
    ("described", '"You described him perfectly," she said, "down to the coat and the limp."'),
    ("describes", '"He describes a man I have never met," she said, and closed the ledger.'),
    ("describe", '"They describe it as an accident," he said. "It was nothing of the kind."'),
    ("termed", '"He termed it a mercy," she said, "and slept perfectly well afterwards."'),
    ("wrote", 'She wrote: "My dearest Thomas, the barn is standing and the geese are not."'),
    ("writes", '"He writes every week," she said, "and I have not opened one of them."'),
    ("writing", '"You are writing to him again," he observed, and she did not deny it.'),
    ("puts it", '"He puts it plainly enough," she said, and handed the letter back unread.'),
    ("according to", '"According to him the bridge is sound," she said. "He has not seen it."'),
    # --- named characters, not pronouns: the case the subject test alone misses
    ("named character", '"You told him where the boat was moored," Aldous observed, closing the shutter.'),
    ("named character", '"There were four men on that quay," Ruth argued, and would not sit down.'),
    ("common noun subject", '"The bridge is out past the mill," the boy reported, holding the reins.'),
    # --- inverted dialogue tags
    ("inverted", '"Mind the second stair," cautioned Aldous, holding the lamp low for her.'),
    ("inverted", '"I never touched the ledger," insisted Hetty, though her hands said otherwise.'),
    # --- a year inside dialogue must not read as a citation
    ("year in dialogue", '"I have not been back since 1987," she insisted, and would say nothing more.'),
    # --- the three tags E-9 had already freed: still free
    ("said", '"We can\'t stay here another night," she said, watching the road.'),
    ("asked", '"And if the water\'s over the ford?" she asked, already knowing the answer.'),
    ("replied", '"Then we move at dark," Marcus replied, rolling the tarpaulin as he spoke.'),
]

# --------------------------------------------------------------------------
# Real attribution. Every one of these must still freeze.
# --------------------------------------------------------------------------

ATTRIBUTION_SHAPES = [
    ("named source, puts it",
     'As Smith puts it, "the change in start time did more for attendance '
     'than any intervention we had previously funded."'),
    ("named source, wrote that",
     'Orwell wrote that "the great enemy of clear language is insincerity."'),
    ("named body, concluded that",
     'The committee concluded that the scheme had "acted without malice and '
     'without competence in equal measure."'),
    ("named person, observed that",
     'Acton observed that "power tends to corrupt" long before the century '
     "proved him right."),
    ("citation shape, no verb",
     'The finding was blunt: "attendance rose in every quartile" '
     "(Smith, 2019, p. 47)."),
    ("citation shape, page only",
     'The review called the effect "small but durable" (p. 112).'),
    ("according to a dated review",
     'According to the 2019 review, "no district in the sample reversed the '
     'change."'),
    ("institution, reported that",
     "The Department for Education reported that uptake was "
     '"well short of the target set in 2018."'),
    ("dated review, concluded that",
     'The 2019 review concluded that "the evidence base is thinner than the '
     'policy assumes."'),
    ("titled person, argued that",
     'Professor Hale argued that the reform had "solved a problem nobody had '
     'measured."'),
]


def _frozen_spans(text):
    return plan_freeze(text, TIERS)


# --------------------------------------------------------------------------


def test_every_fiction_dialogue_line_freezes_its_quotation():
    """THE INVERSION. Every one of these froze nothing before the ruling."""
    missed = []
    for label, line in FICTION_LINES:
        quotes = [s for s in detect_protected_spans(line) if s["kind"] == "quote"]
        if not quotes:
            missed.append((label, line, "no quotation detected at all"))
            continue
        frozen = [s for s in _frozen_spans(line) if s["kind"] == "quote"]
        if len(frozen) < len(quotes):
            missed.append((label, line,
                           f"{len(quotes)} quotations, {len(frozen)} frozen"))
    assert missed == [], (
        f"{len(missed)} of {len(FICTION_LINES)} lines did not freeze every "
        "quotation in them. Jon, 24 August 2026: any quotation is frozen and "
        "kept across the board.\n"
        + "\n".join(f"  {a}: {b}\n    {c}" for a, b, c in missed)
    )


def test_every_real_attribution_shape_still_freezes():
    """Unchanged by the ruling: these froze before and they freeze now."""
    missed = []
    for name, line in ATTRIBUTION_SHAPES:
        if not _frozen_spans(line):
            missed.append((name, line))
    assert missed == [], (
        f"{len(missed)} of {len(ATTRIBUTION_SHAPES)} real attribution shapes "
        "stopped freezing:\n" + "\n".join(f"  {n}: {ln}" for n, ln in missed)
    )


#: ONE quotation, fourteen surroundings. Every context that either of the two
#: deleted rules keyed on is here: reportive verb before and after, pronoun
#: and named and common-noun subjects, inversion, a colon lead-in, a citation,
#: and no cue whatsoever.
SAME_QUOTE = "the bridge is out and the ford is over the stones"
SURROUNDINGS = [
    ("no cue at all",        'The sign read "{q}" in faded letters.'),
    ("pronoun, trailing",    '"{q}," she argued, and turned to the window.'),
    ("pronoun, leading",     'She argued, "{q}," and turned to the window.'),
    ("named, trailing",      '"{q}," Aldous observed, closing the shutter.'),
    ("named, leading",       'Aldous observed, "{q}," and closed the shutter.'),
    ("common noun",          '"{q}," the boy reported, still holding the reins.'),
    ("inverted",             '"{q}," cautioned Aldous, holding the lamp low.'),
    ("narrative tag",        '"{q}," she said, watching the empty road.'),
    ("published source",     'Orwell wrote that "{q}" and the line outlived him.'),
    ("institution",          'The committee concluded that "{q}" in its report.'),
    ("citation after",       'The review found "{q}" (Smith, 2019, p. 47).'),
    ("citation before",      'Smith (2019) found that "{q}" in every quartile.'),
    ("colon lead-in",        'The minutes recorded: "{q}"'),
    ("mid-sentence",         'Everyone knew "{q}" long before the meeting.'),
]


def test_the_surrounding_words_never_decide():
    """THE LOCK, and it replaces E-16's cue-list lock.

    E-16's lock read `uc_spans._ATTRIBUTION` and required a dialogue line for
    every verb on it. That list is gone, and a lock tied to a deleted constant
    protects nothing. This one is tied to the RULING instead: the same
    quotation, in fourteen surroundings covering every cue either deleted rule
    ever keyed on, must get the identical answer.

    Any future change that reads the words around a quotation and decides from
    them fails here, whatever mechanism it uses.
    """
    answers = {}
    for name, template in SURROUNDINGS:
        line = template.format(q=SAME_QUOTE)
        frozen = [s for s in _frozen_spans(line) if s["kind"] == "quote"]
        answers[name] = bool(frozen) and SAME_QUOTE in frozen[0]["text"]

    free = sorted(n for n, ok in answers.items() if not ok)
    assert free == [], (
        "The same quotation froze in some surroundings and not others, so "
        "something is reading the context and deciding. It must not: "
        f"free in {free}"
    )


def test_the_detector_no_longer_reports_an_attributed_field():
    """Structural half of the lock: the field itself must stay gone.

    While `attributed` exists on a span, something downstream can start
    honouring it again and no behavioural test would notice until a customer
    did.
    """
    text = (
        'Orwell wrote that "the great enemy of clear language is insincerity."'
        '\n\n"Mind the second stair," he cautioned, holding the lamp low.'
    )
    spans = detect_protected_spans(text)
    assert spans, "fixture broken: nothing detected"
    carrying = [s for s in spans if "attributed" in s]
    assert carrying == [], (
        "detect_protected_spans is still emitting an `attributed` field: "
        f"{carrying}"
    )


def test_the_same_story_freezes_the_same_however_the_author_tags_dialogue():
    """Kept from E-16, and it is a stronger statement now.

    Before the ruling this passed by freezing NOTHING in either story. It now
    passes by freezing the SAME quotations in both — which is the invariant
    that actually matters, and the one the old rule broke: the author's choice
    of dialogue tag must not change what the customer is charged for or what
    comes back.
    """
    story = (
        "The lamp had been burning in the front room since before either of "
        "them came down, and neither would put it out.\n\n"
        '"You told him where the boat was moored," she {t1}, pushing the '
        "shutter closed against the wind.\n\n"
        '"I told him nothing he could not have counted off the harbour wall '
        'himself," Aldous {t2}, and set the poker back against the grate.\n\n'
        '"There were four men on that quay at first light and not one of '
        'them a fisherman," she {t3}. "You saw the same as I did."\n\n'
        '"Then we are already too late to matter," he {t4}, and went up the '
        "stairs without the lamp."
    )
    plain = story.format(t1="said", t2="replied", t3="asked", t4="said")
    fancy = story.format(t1="insisted", t2="observed", t3="argued",
                         t4="concluded")

    plain_ff = freeze_fraction(plain, TIERS)
    fancy_ff = freeze_fraction(fancy, TIERS)

    assert plain_ff["frozen_words"] == fancy_ff["frozen_words"], (
        f"the dialogue tags changed the freeze: {plain_ff} vs {fancy_ff}")
    assert plain_ff["spans"] == fancy_ff["spans"]
    # And it is no longer passing by freezing nothing.
    assert plain_ff["frozen_words"] > 0, plain_ff
    assert plain_ff["spans"].get("quote") == 5, plain_ff


def test_a_pronoun_subject_freezes_exactly_like_a_named_one():
    """E-16 pinned the opposite of this as a deliberate residual.

    «The auditor ... She wrote that "..."» went FREE, and so did epistolary
    fiction, and that was the accepted price of the old rule. Both freeze now,
    and so does the same sentence with the source named.
    """
    text = (
        "The auditor's verdict took one paragraph. She wrote that the "
        'committee had "acted without malice and without competence in '
        'equal measure."'
    )
    assert [s for s in _frozen_spans(text) if s["kind"] == "quote"]

    named = text.replace("She wrote", "The auditor wrote")
    assert [s for s in _frozen_spans(named) if s["kind"] == "quote"]


def test_an_uncited_trailing_attribution_freezes_now():
    """The other E-16 residual, also gone."""
    uncited = '"The great enemy of clear language is insincerity," wrote Orwell in 1946.'
    assert [s for s in _frozen_spans(uncited) if s["kind"] == "quote"]

    cited = '"The great enemy of clear language is insincerity" (Orwell, 1946).'
    assert [s for s in _frozen_spans(cited) if s["kind"] == "quote"]


def test_a_short_scare_quote_is_still_not_a_quotation():
    """The 12-character floor in _QUOTE, and it is deliberately untouched.

    «the so-called "gig economy"» is not a quotation and must not freeze. The
    ruling widened WHOSE quotations count, not what counts as one.
    """
    text = ('Everyone in the department now talks about the so-called "gig '
            'economy" as though the phrase had always been there.')
    assert [s for s in detect_protected_spans(text) if s["kind"] == "quote"] == []
    assert freeze_fraction(text, TIERS)["frozen_words"] == 0
