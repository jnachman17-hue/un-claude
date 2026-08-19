"""Build realistic fact-dense documents at several lengths.

Not repetition: each section gets its own company, people, numbers and dates, so
long documents carry many distinct facts rather than the same ones repeatedly.
"""
from __future__ import annotations
import io, sys
from pathlib import Path

COMPANIES = [
    ("Northwind Logistics","Marta Delacroix","Peter Okonkwo","Bergstrom Manufacturing","Rotterdam","Palermo Freight"),
    ("Calder Instruments","Yusuf Adeyemi","Hana Lindqvist","Verity Systems","Osaka","Tallgrass Optics"),
    ("Brightwater Foods","Ingrid Solberg","Tomas Barquero","Halloran Packaging","Lyon","Cedarvale Dairy"),
    ("Pellam Robotics","Ravi Chandrasekar","Nora Whitfield","Ashcombe Motors","Gdansk","Kite Automation"),
    ("Slate Harbour Media","Aiko Tanabe","Emmanuel Boateng","Farrow Publishing","Montreal","Blue Lark Studio"),
    ("Vantage Rail","Sofia Marchetti","Callum Frazier","Dunmore Steel","Valencia","Ironbridge Wagons"),
    ("Kestrel Analytics","Priya Raghunathan","Oscar Lindgren","Tenby Data","Cape Town","Northlight Metrics"),
    ("Amberline Energy","Jonas Kirchner","Leilani Fonoti","Sandpiper Grid","Trondheim","Quarry Point Solar"),
]

TEMPLATE = """{co} reported revenue of ${rev} million for the third quarter of {yr}, an increase of {g1} percent against the same period a year earlier. The company said the gain was driven almost entirely by its enterprise segment, which grew {g2} percent while the consumer division contracted by roughly {g3} percent. Chief executive {ceo} described the quarter as the strongest since the company listed in March {listed}.

The enterprise result was helped by three contracts signed in July, the largest of which was a five-year agreement with {partner} worth an estimated ${deal} million over its full term. Analysts had expected revenue between ${lo} million and ${hi} million, so the reported figure came in above the top of that range. Shares rose {sh} percent in after-hours trading before giving back about half of the gain the following morning.

Operating costs also rose, though more slowly than revenue. Total operating expenses reached ${opex} million, up {opg} percent year on year, with most of the increase attributable to headcount. {co} employed {staff} people at the end of September, compared with {staff0} twelve months earlier. {ceo} said the company expected hiring to slow in the fourth quarter and that headcount would likely finish the year below {cap}.

The board declared a dividend of {div} cents per share, payable on 14 November to shareholders of record as of 31 October. It is the fourth consecutive quarter in which {co} has paid a dividend, and the payout ratio now stands at approximately {ratio} percent of net income. Chief financial officer {cfo} said the board intended to keep the ratio below {rcap} percent while the company continues to invest in its network.

{co} also disclosed a one-off charge of ${charge},000 relating to the closure of its {city} warehouse, which ceased operations on 30 June. The company said the closure would reduce annual fixed costs by around ${save} million from {yr2} onward, and that the affected {aff} staff had either been redeployed within the group or offered severance. {cfo} said the charge was fully reflected in the third-quarter accounts.

Looking ahead, the company guided to full-year revenue of between ${fy1} million and ${fy2} million, which would represent growth of between {gr1} and {gr2} percent on the prior year. {ceo} cautioned that the fourth quarter is seasonally weaker for the consumer division and that the company was not assuming a recovery there before the second half of {yr3}. Its last acquisition was {target} for ${acq} million in August {acqyr}.
"""

def section(i: int) -> str:
    co, ceo, cfo, partner, city, target = COMPANIES[i % len(COMPANIES)]
    b = i + 1
    return TEMPLATE.format(
        co=co, ceo=ceo, cfo=cfo, partner=partner, city=city, target=target,
        rev=f"{4.2 + b*0.7:.1f}", yr=2025, g1=14 + b, g2=28 + b*2, g3=4 + b,
        listed=2018 + (b % 6), deal=f"{11.8 + b:.1f}", lo=f"{3.9 + b*0.7:.1f}",
        hi=f"{4.1 + b*0.7:.1f}", sh=5 + b, opex=f"{3.1 + b*0.5:.1f}", opg=9 + b,
        staff=400 + b*37, staff0=350 + b*31, cap=430 + b*40, div=10 + b,
        ratio=20 + b, rcap=30 + b, charge=480 + b*15, save=f"{1.3 + b*0.2:.1f}",
        yr2=2026, aff=40 + b*3, fy1=f"{16.5 + b*2:.1f}", fy2=f"{17.2 + b*2:.1f}",
        gr1=12 + b, gr2=18 + b, yr3=2026 + (b % 3), acq=f"{2.4 + b*0.3:.1f}",
        acqyr=2020 + (b % 5))

def build(target_words: int) -> str:
    parts, n = [], 0
    while n < target_words:
        s = section(len(parts))
        parts.append(s)
        n = len(" ".join(parts).split())
    return "\n\n".join(parts)

if __name__ == "__main__":
    out = Path(__file__).parent / "docs"
    out.mkdir(exist_ok=True)
    for target in (1000, 2000, 3000, 5000):
        t = build(target)
        p = out / f"doc_{target}.txt"
        p.write_text(t, encoding="utf-8")
        print(f"{p.name:<16} {len(t.split()):>6} words  {len(t):>7} chars")
