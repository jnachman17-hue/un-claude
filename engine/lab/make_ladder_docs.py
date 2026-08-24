"""The document-size ladder for E-16 job 2: 500 to 10,000 words.

WHY NOT THE EXISTING CORPUS. `docs/doc_*.txt` is fact-dense company reporting
with no heading, no quotation and no reference in it, so it freezes 0% and a
"freeze ON" run against it measures nothing. E-9 closed with mask survival at
scale explicitly unmeasured. These documents carry the real shape — headings,
attributed quotations with citations, introduced block quotes, a reference
list — so the mask count grows with the document and the ceiling is measured
on the product as it actually runs.

Each section gets its own institution, author, year and numbers: a 10,000-word
document carries about 27 distinct sets of facts rather than one set 27 times,
which is what the fact guard and the model both react to.

Run:  python engine/lab/make_ladder_docs.py
"""

from __future__ import annotations

from pathlib import Path

TOPICS = [
    ("school start times", "adolescent attendance", "Fairmont", "Smith",
     "Journal of School Health", "transport"),
    ("rural broadband subsidy", "small business formation", "Kelso County",
     "Harrison", "Regional Economics Review", "civil works"),
    ("the vacant property levy", "housing turnover", "Ardwick", "Okonkwo",
     "Urban Policy Quarterly", "enforcement"),
    ("free school meals", "attainment at key stage two", "Brenton", "Ferreira",
     "British Educational Research Journal", "kitchen capacity"),
    ("the night bus extension", "shift worker retention", "Cowley", "Nakamura",
     "Transport Policy", "driver recruitment"),
    ("supervised toothbrushing", "extractions under general anaesthetic",
     "Tyneside", "Aluko", "Community Dental Health", "staff time"),
    ("the cycle lane on Beckett Road", "collisions at the junction", "Marsden",
     "Lindqvist", "Accident Analysis and Prevention", "loading bays"),
    ("the library reopening", "adult literacy enrolment", "Dunwich", "Barquero",
     "Journal of Librarianship", "the heating plant"),
    ("the fluoride reversal", "decayed missing filled teeth", "Portbury",
     "Chandrasekar", "Public Health Reports", "the water contract"),
    ("term-time holiday fines", "persistent absence", "Halloway", "Solberg",
     "Educational Review", "the appeals backlog"),
]

SECTION = """{heading}

{place} changed {topic} in September {y0}, and the effect on {outcome} was
larger than anything the authority had funded in the preceding decade. In the
first full year {outcome} moved by {g1} percent against a comparison group of
{n} similar districts, and the gap had not closed three years later. The
figure is not in dispute; what the figure is worth is.

{author} ({y1}) put the result in the plainest terms available at the time,
and the sentence has been quoted in every business case written since: "the
change in {topic} did more for {outcome} than any intervention we had
previously funded, including the {y2} programme that consumed the whole of the
improvement budget" ({author}, {y1}, p. {page}). The claim survived two
replications and one failed replication in a district that had already made a
timetable change of its own.

The {y1} review of {n2} districts reached the same conclusion by a different
route. Its authors concluded that "the evidence base is thinner than the
policy assumes, and thicker than its critics allow" — a sentence that has been
quoted by both sides of the argument since, usually with the second clause
removed. What the review actually recommended was a staged rollout with a
control group, which no authority has yet attempted.

The dissent is worth stating in full, because it is normally paraphrased into
something weaker. The minority report recorded:

    We do not dispute the attendance figure. We dispute that it was
    purchased at the price stated. The {cost} line rose in the first
    year and has not returned to its previous level in any district
    that made the change, and no business case before this committee
    has carried that number forward beyond year two.

The {cost} ledger tells the other half of the story, and it is the half that
arrives first. {place} runs its service in two tiers, and the change pushed
the second tier into the same window as the first. The authority bought {buses}
vehicles and hired {drivers} staff, and the {cost} line rose by about {g2}
percent in the first year and by a further {g3} percent in the second. None of
that appears in the {outcome} figures, and all of it appears in the budget
papers.

"The money came out of the same envelope either way," the finance officer
said, and nobody at the meeting argued the point. A second officer observed
that the envelope had been empty since {y2}. Neither remark made the minutes,
which recorded only that the committee had noted the report.

What the {y3} follow-up added was duration. The effect on {outcome} was
undiminished at three years in {n3} of the {n} districts, which is the finding
that matters for a business case and the one most often left out of the
summary. The {cost} increase was also undiminished. A policy that buys a
durable gain with a durable cost is a different proposition from one that buys
a durable gain with a one-off cost, and the papers rarely say which is which.
"""

CLOSING = """Conclusion

The {outcome} result is real, the duration result is real, and the {cost} cost
is real. The only dishonest position is the one that mentions two of the
three. Authorities weighing the change should price the {cost} line first,
because it is the part that arrives on the first morning and never goes away.

References
"""

REFERENCE = ("{author}, J. A., & Lindsay, R. B. ({y1}). {topic_title} and "
             "{outcome}. {journal}, {vol}({iss}), {p0}-{p1}.")


def section(i: int) -> str:
    topic, outcome, place, author, journal, cost = TOPICS[i % len(TOPICS)]
    b = i + 1
    return SECTION.format(
        heading=f"{b}. {place}: {topic.capitalize()}",
        place=place, topic=topic, outcome=outcome, author=author, cost=cost,
        y0=2015 + (b % 7), y1=2017 + (b % 6), y2=2011 + (b % 5),
        y3=2021 + (b % 4), g1=7 + b, g2=9 + b, g3=3 + (b % 6),
        n=14 + b, n2=20 + b * 3, n3=9 + (b % 6),
        page=31 + b * 7, buses=3 + (b % 5), drivers=5 + (b % 9),
    )


def reference(i: int) -> str:
    topic, outcome, _place, author, journal, _cost = TOPICS[i % len(TOPICS)]
    b = i + 1
    return REFERENCE.format(
        author=author, y1=2017 + (b % 6), topic_title=topic.capitalize(),
        outcome=outcome, journal=journal, vol=80 + b, iss=1 + (b % 4),
        p0=100 + b * 13, p1=100 + b * 13 + 8 + (b % 9),
    )


def _unwrap(text: str) -> str:
    """Join hard-wrapped lines back into one line per paragraph.

    A REAL FINDING, recorded rather than worked around: uc_spans._QUOTE is
    `"([^"\n]{12,600})"`, so a quotation containing a newline is not detected
    at all — a hard-wrapped document loses its quote protection silently. The
    ladder is unwrapped because that is what a paste out of Word or Docs looks
    like, not to dodge the problem. See the session note.
    """
    out = []
    for para in text.split("\n\n"):
        lines = para.split("\n")
        if any(line.startswith("    ") for line in lines):
            out.append(para)                       # a block quote: leave it
        else:
            out.append(" ".join(line.strip() for line in lines if line.strip()))
    return "\n\n".join(out)


def _units(i: int) -> list[str]:
    """One section as fillable units, the block quote welded to its lead-in.

    Paragraph granularity, not section granularity: sections run about 550
    words, so filling by section put the 500 and 1,000-word rungs at the same
    length. The lead-in and the block quote travel together because the
    lead-in's colon is what makes the block quote attributed at all.
    """
    paras = [p for p in section(i).split("\n\n") if p.strip()]
    units, k = [], 0
    while k < len(paras):
        if k + 1 < len(paras) and paras[k].rstrip().endswith(":"):
            units.append(paras[k] + "\n\n" + paras[k + 1])
            k += 2
        else:
            units.append(paras[k])
            k += 1
    return units


def build(target_words: int) -> str:
    # Land UNDER the target, never over: the 10,000-word rung has to be a
    # document the site would actually accept (UC_MAX_WORDS defaults to
    # 10,000), or the top of the ladder measures something no customer can
    # submit.
    topic, outcome, _place, _author, _journal, cost = TOPICS[0]
    tail = CLOSING.format(outcome=outcome, cost=cost)
    body: list[str] = []
    i, pending = 0, []
    while True:
        if not pending:
            pending = _units(i)
            i += 1
        unit = pending[0]
        refs_now = "\n\n".join(reference(k) for k in range(min(max(i, 1), 6)))
        reserve = len((tail + " " + refs_now).split())
        projected = len(" ".join(body + [unit]).split()) + reserve
        if body and projected > target_words:
            break
        body.append(pending.pop(0))
    refs = "\n\n".join(reference(k) for k in range(min(max(i, 1), 6)))
    return _unwrap("\n\n".join(body) + "\n\n" + tail + "\n" + refs + "\n")


LADDER = (500, 1000, 2000, 3000, 5000, 7500, 10000)

if __name__ == "__main__":
    import sys
    out = Path(__file__).parent / "docs"
    out.mkdir(exist_ok=True)
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "apps" / "web" / "engine"))
    from uc_freeze import freeze_fraction
    from uc_wordcount import count_words

    print(f"{'file':<22}{'words':>7}{'chunks':>8}{'frozen':>9}  spans")
    for target in LADDER:
        text = build(target)
        p = out / f"ladder_{target}.txt"
        p.write_text(text, encoding="utf-8")
        ff = freeze_fraction(text, ("structure", "quotes"))
        chunks = -(-count_words(text) // 350)
        print(f"{p.name:<22}{ff['words']:>7}{chunks:>8}"
              f"{ff['fraction'] * 100:>8.1f}%  {ff['spans']}")
