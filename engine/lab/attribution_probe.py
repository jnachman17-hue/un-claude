"""E-16: does the attribution cue fire on ordinary novel dialogue?

Three probes against the SHIPPING detector, no model involved, no money spent.

  A  one realistic novel dialogue line per reportive verb on
     uc_spans._ATTRIBUTION, plus the three narrative tags that are already
     off the list. None of the twenty may freeze.
  B  two short stories of the same length and the same content, differing
     ONLY in which dialogue tags the author used. Neither may freeze a word.
  C  the five attribution shapes that MUST keep freezing — the ones D2 is
     protecting — plus a read-out of which tags E-9's own D2 demo story uses.

Run:  python engine/lab/attribution_probe.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "web" / "engine"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from uc_freeze import freeze_fraction, plan_freeze          # noqa: E402
from uc_wordcount import count_words                        # noqa: E402

TIERS = ("structure", "quotes")

# --------------------------------------------------------------------------
# A — one novel sentence per verb. Realistic fiction, nothing contrived.
# --------------------------------------------------------------------------

FICTION_LINES = [
    ("argued",       '"You never once asked me," she argued, and turned to the window.'),
    ("warned",       '"Don\'t go down to the water after dark," he warned, shouldering the pack.'),
    ("noted",        '"Your hands are shaking again," she noted, setting the cup down between them.'),
    ("observed",     '"You always leave before the music stops," he observed, watching her coat.'),
    ("claimed",      '"I was nowhere near the barn that night," he claimed, and nobody believed him.'),
    ("stated",       '"I will not be going with you," she stated, folding the last of the linen.'),
    ("declared",     '"This house is finished with the lot of them," he declared from the top step.'),
    ("remarked",     '"You have your mother\'s temper," she remarked, without looking up from the stove.'),
    ("insisted",     '"I saw what I saw," he insisted, though the lamp had been out for an hour.'),
    ("acknowledged", '"I should have written sooner," she acknowledged, and the silence went on.'),
    ("concluded",    '"Then there is nothing left to settle," he concluded, and reached for his hat.'),
    ("reported",     '"The road is under three feet of water," the boy reported, out of breath.'),
    ("asserted",     '"That money was mine before it was ever his," she asserted, hands flat on the table.'),
    ("maintained",   '"I locked the gate the same as every night," he maintained, meeting her eye.'),
    ("contended",    '"You have the story backwards," she contended, pouring the last of the tea.'),
    ("cautioned",    '"Mind the second stair," he cautioned, holding the lamp low for her.'),
    ("emphasised",   '"Not one word of this leaves the kitchen," she emphasised, and shut the door.'),
    # already off the list — the control
    ("said",         '"We can\'t stay here another night," she said, watching the road.'),
    ("asked",        '"And if the water\'s over the ford?" she asked, already knowing the answer.'),
    ("replied",      '"Then we move at dark," Marcus replied, rolling the tarpaulin as he spoke.'),
]

# --------------------------------------------------------------------------
# B — the same story twice. Only the four dialogue tags differ.
# --------------------------------------------------------------------------

_STORY = """The lamp had been burning in the front room since before either of them came down, and neither would put it out.

"You told him where the boat was moored," she {t1}, pushing the shutter closed against the wind.

"I told him nothing he could not have counted off the harbour wall himself," Aldous {t2}, and set the poker back against the grate.

"There were four men on that quay at first light and not one of them a fisherman," she {t3}. "You saw the same as I did."

"Then we are already too late to matter," he {t4}, and went up the stairs without the lamp.

She stood a while in the dark of the passage, listening to the boards over her head, and thought about the boat and the four men and the length of the harbour wall."""

STORY_A = _STORY.format(t1="said", t2="replied", t3="asked", t4="said")
STORY_B = _STORY.format(t1="insisted", t2="observed", t3="argued", t4="concluded")

# --------------------------------------------------------------------------
# C — the attribution shapes that must KEEP freezing.
# --------------------------------------------------------------------------

ATTRIBUTED_SHAPES = [
    ("puts it",      'As Smith puts it, "the change in start time did more for attendance than any intervention we had previously funded."'),
    ("named + wrote", 'Orwell wrote that "the great enemy of clear language is insincerity" and the line has outlived its essay.'),
    ("citation shape", 'The finding was blunt: "attendance rose in every quartile" (Smith, 2019, p. 47).'),
    ("named body",   'The committee concluded that the scheme had "acted without malice and without competence in equal measure."'),
    ("named person", 'Acton observed that "power tends to corrupt" long before the century proved him right.'),
]


def _frozen(text: str) -> list[dict]:
    return plan_freeze(text, TIERS)


def main() -> int:
    print("=" * 74)
    print("TEST A — one realistic novel dialogue line per verb (none may freeze)")
    print("=" * 74)
    wrong = []
    for verb, line in FICTION_LINES:
        spans = _frozen(line)
        flag = "FROZEN  <-- WRONG" if spans else "free"
        if spans:
            wrong.append(verb)
        print(f"  {verb:<14} {flag}")
        for s in spans:
            print(f"                   {s['kind']}: {s['text'][:60]!r}")
    print()
    print(f"FICTION DIALOGUE LINES TESTED: {len(FICTION_LINES)}   (none should ever freeze)")
    print(f"WRONGLY FROZEN: {len(wrong)}")
    print("Frozen: " + (" · ".join(wrong) if wrong else "(none)"))
    print("Free:   " + " · ".join(v for v, _ in FICTION_LINES if v not in wrong))

    print()
    print("=" * 74)
    print("TEST B — same story, same length, only the dialogue tags differ")
    print("=" * 74)
    for name, story, tags in (
        ("A", STORY_A, "said / replied / asked / said"),
        ("B", STORY_B, "insisted / observed / argued / concluded"),
    ):
        ff = freeze_fraction(story, TIERS)
        spans = _frozen(story)
        print(f"  Story {name} — {tags}")
        print(f"    words {ff['words']}   frozen {ff['fraction'] * 100:.1f}% "
              f"({ff['frozen_words']} words, {len(spans)} spans)")
        for s in spans:
            print(f"      {s['kind']}: {s['text'][:70]!r}")
    print()

    print("=" * 74)
    print("TEST C — the attribution shapes that MUST keep freezing")
    print("=" * 74)
    missed = []
    for name, line in ATTRIBUTED_SHAPES:
        spans = _frozen(line)
        if not spans:
            missed.append(name)
        print(f"  {name:<16} {'frozen' if spans else 'FREE  <-- WRONG'}")
        for s in spans:
            print(f"                   {s['kind']}: {s['text'][:60]!r}")
    print()
    print(f"ATTRIBUTION SHAPES TESTED: {len(ATTRIBUTED_SHAPES)}   (all should freeze)")
    print(f"WRONGLY FREE: {len(missed)}   {missed}")

    print()
    print("=" * 74)
    print("TEST C2 — the dialogue tags in E-9's own D2 demo story (5.3)")
    print("=" * 74)
    from freeze_measure import STORY as E9_STORY
    import re
    tags = re.findall(r'["”],?\s+(?:\w+\s+)?(\w+)[,.]', E9_STORY)
    print(f"  tags found in the E-9 demo story: {sorted(set(tags))}")
    ff = freeze_fraction(E9_STORY, TIERS)
    print(f"  E-9 story freezes {ff['fraction'] * 100:.1f}% of {ff['words']} words")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
