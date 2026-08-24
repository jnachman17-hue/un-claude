"""E-16: the freeze must never take a novel's dialogue.

D2 rules that only ATTRIBUTED quotations freeze, for one reason: the model
chose every word of invented dialogue, so it is the MOST watermarked text in
the document. Freezing it hands the customer back the worst part untouched
after charging them for a rewrite.

The rule shipped in E-9 got this wrong on 35 of the 45 fiction lines below,
because seventeen of the reportive verbs it keyed on — argued, warned,
observed, concluded … — are also standard dialogue tags. E-9's own D2 demo
missed it: that short story happened to use only `said`, `asked` and
`replied`, the three tags already off the list, so the demo passed on the
story's word choices rather than on the rule.

`test_every_attribution_verb_has_a_fiction_line` is the lock: adding a verb
to `uc_spans._ATTRIBUTION` without adding a dialogue line for it here fails
the suite. The regression cannot come back quietly.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "apps" / "web" / "engine"))

from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_spans import _ATTRIBUTION, detect_protected_spans   # noqa: E402

TIERS = ("structure", "quotes")


# --------------------------------------------------------------------------
# Fiction. Not one word of any of these may freeze.
# --------------------------------------------------------------------------

#: (the verb, a realistic line of novel dialogue using it)
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


def test_no_fiction_dialogue_line_freezes_a_single_word():
    frozen = []
    for verb, line in FICTION_LINES:
        spans = _frozen_spans(line)
        if spans:
            frozen.append((verb, line, [s["text"] for s in spans]))
    assert frozen == [], (
        f"{len(frozen)} of {len(FICTION_LINES)} fiction dialogue lines froze. "
        "D2: invented dialogue is the most watermarked text in the document "
        "and must never be handed back untouched.\n"
        + "\n".join(f"  {v}: {ln}\n    froze {sp}" for v, ln, sp in frozen)
    )


def test_every_real_attribution_shape_still_freezes():
    missed = []
    for name, line in ATTRIBUTION_SHAPES:
        if not _frozen_spans(line):
            missed.append((name, line))
    assert missed == [], (
        f"{len(missed)} of {len(ATTRIBUTION_SHAPES)} real attribution shapes "
        "stopped freezing:\n" + "\n".join(f"  {n}: {ln}" for n, ln in missed)
    )


def _top_level_branches(pattern: str) -> list[str]:
    """The alternatives of `\\b(?: a | b | c )\\b`, nested groups intact."""
    inner = pattern
    inner = inner[inner.index("(?:") + 3: inner.rindex(")")]
    out, depth, start = [], 0, 0
    for i, ch in enumerate(inner):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "|" and depth == 0:
            out.append(inner[start:i])
            start = i + 1
    out.append(inner[start:])
    return [b for b in (b.strip() for b in out) if b]


def test_every_attribution_verb_has_a_fiction_line():
    """THE LOCK. A new cue verb with no dialogue line for it fails here.

    E-9 narrowed the verb list and shipped, and seventeen of the verbs it
    kept were dialogue tags. The only defence that survives a future edit is
    a test that reads the live pattern rather than a copy of it.
    """
    corpus = {verb.lower() for verb, _ in FICTION_LINES}
    uncovered = []
    for branch in _top_level_branches(_ATTRIBUTION.pattern):
        rx = re.compile(branch.replace(r"\s+", " ") + r"\Z", re.IGNORECASE)
        if not any(rx.match(word) for word in corpus):
            uncovered.append(branch)
    assert uncovered == [], (
        "These cue verbs in uc_spans._ATTRIBUTION have no fiction dialogue "
        "line in this corpus, so nothing proves they do not freeze a novel: "
        f"{uncovered}"
    )


def test_the_same_story_freezes_the_same_however_the_author_tags_dialogue():
    """The product-level statement of the bug, in one assertion.

    Two identical stories, differing only in which dialogue tags the author
    reached for. Before E-16 the second froze 33.6% of itself and the first
    froze nothing.
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

    assert plain_ff["fraction"] == 0.0, plain_ff
    assert fancy_ff["fraction"] == 0.0, fancy_ff
    assert plain_ff["frozen_words"] == fancy_ff["frozen_words"] == 0


def test_a_pronoun_subject_is_a_dialogue_tag_not_an_attribution():
    """D2's residual, pinned so a future session sees it is deliberate.

    «The auditor ... She wrote that "..."» goes FREE. That frees epistolary
    fiction, which is the point, and it also frees real attribution carried
    by a pronoun, which is the price. Being wrong toward free costs a few
    reworded phrases; being wrong toward frozen hands back a paid-for
    rewrite undone.
    """
    text = (
        "The auditor's verdict took one paragraph. She wrote that the "
        'committee had "acted without malice and without competence in '
        'equal measure."'
    )
    quotes = [s for s in detect_protected_spans(text) if s["kind"] == "quote"]
    assert len(quotes) == 1
    assert quotes[0]["attributed"] is False

    named = text.replace("She wrote", "The auditor wrote")
    quotes = [s for s in detect_protected_spans(named) if s["kind"] == "quote"]
    assert quotes[0]["attributed"] is True


def test_a_trailing_tag_never_attributes_but_a_citation_still_does():
    """The other residual: an UNCITED trailing attribution goes free."""
    uncited = '"The great enemy of clear language is insincerity," wrote Orwell in 1946.'
    quotes = [s for s in detect_protected_spans(uncited) if s["kind"] == "quote"]
    assert quotes[0]["attributed"] is False

    cited = '"The great enemy of clear language is insincerity" (Orwell, 1946).'
    quotes = [s for s in detect_protected_spans(cited) if s["kind"] == "quote"]
    assert quotes[0]["attributed"] is True
