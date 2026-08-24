"""Every marker label is a product claim: the pattern may only match what
its own label describes.

Lane E measured the mismatches on 23 August 2026 (lane-e-security.md, S-5):
the marker labelled "in today's fast-paced world/landscape" fired on the
ordinary words "in the world" and moved a human paragraph from CLEAN to LOW.
These tests hold every sentence from that audit, in both directions.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT.parent / "apps" / "web" / "engine"
sys.path.insert(0, str(SCRIPTS))

from score_stylometry import scan_ai_phrases, score_text_stylometry  # noqa: E402


def _labels(text: str) -> set[str]:
    return {m.phrase for m in scan_ai_phrases(text)}


# --- ordinary human sentences from the Lane E audit: must NOT fire -----------

@pytest.mark.parametrize(
    "sentence",
    [
        "The tallest mountain in the world is Everest.",
        "In the era of steam, Manchester doubled in size.",
        "Frogs are sensitive to changes in the environment.",
        "Wordsworth wrote about the human place in the landscape.",
        "My grandmother served as a reminder that grief passes.",
        "The scar serves as a reminder of the accident.",
        "Photosynthesis plays a key role in the carbon cycle.",
        "The hippocampus plays a vital role in memory.",
        "The appeal ultimately failed.",
        "She ultimately chose medicine over law.",
    ],
)
def test_ordinary_english_does_not_fire(sentence):
    assert _labels(sentence) == set()


# --- the phrases the labels actually claim: MUST still fire ------------------

@pytest.mark.parametrize(
    ("sentence", "label"),
    [
        (
            "In today's fast-paced world, businesses must adapt.",
            "in today's fast-paced world/landscape",
        ),
        (
            "In the ever-evolving landscape of technology, change is constant.",
            "in today's fast-paced world/landscape",
        ),
        (
            "Trade unions played a pivotal role in the strike.",  # the label's own past tense
            "plays a pivotal/crucial role",
        ),
        ("It plays a crucial role in the process.", "plays a pivotal/crucial role"),
        ("The award serves as a beacon of hope.", "serves as a beacon/catalyst/cornerstone"),
        ("It is crucial to note that rates fell.", "it is important/crucial to note"),
        ("Ultimately, the committee agreed.", "ultimately,"),
        ("The plan failed. Ultimately, nobody paid.", "ultimately,"),
    ],
)
def test_labelled_phrases_still_fire(sentence, label):
    assert label in _labels(sentence)


# --- Lane E's A/B, end to end: three ordinary words must not move the score --
#
# Their measurement: the same paragraph, twice, with "in the world" swapped
# for "on the planet" and nothing else, went from CLEAN (0.1225) to LOW (0.46)
# on that marker alone. After the fix the two must score identically.

EVEREST_A = (
    "The tallest mountain in the world is Everest, and people have been "
    "trying to climb it for a century. The first confirmed ascent came in "
    "1953. Hundreds now attempt the climb every season, and the mountain "
    "has become crowded enough that queues form below the summit on clear "
    "mornings, which worries the guides. Weather can turn in an hour. The "
    "debate about permits, safety and crowding continues in Kathmandu every "
    "spring, and no season passes without it flaring up somewhere."
)
EVEREST_B = EVEREST_A.replace("in the world", "on the planet")


def test_three_ordinary_words_no_longer_move_the_score():
    a = score_text_stylometry(EVEREST_A)
    b = score_text_stylometry(EVEREST_B)
    assert a.matched_markers == b.matched_markers == []
    assert a.ai_ngram_density == b.ai_ngram_density == 0.0
    assert a.score == b.score
    assert a.confidence_level == b.confidence_level
