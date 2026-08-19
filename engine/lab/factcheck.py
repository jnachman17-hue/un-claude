"""Compare facts by VALUE, not by spelling.

Written after the naive version reported 18 lost facts when the model had merely
written 'thirty-four percent' for '34 percent'. In this project the harness is
usually the thing that is wrong. See docs/TRACK-A-NOTES.md.
"""
from __future__ import annotations
import re

UNITS = {"zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,
         "eight":8,"nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,
         "fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,"eighteen":18,
         "nineteen":19}
TENS = {"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,
        "eighty":80,"ninety":90}

def _words_to_numbers(text: str) -> set[str]:
    """Every number expressible in words, rendered as its digit string."""
    out=set()
    t=text.lower().replace("-", " ")
    toks=re.findall(r"[a-z]+", t)
    for i,w in enumerate(toks):
        if w in UNITS:
            out.add(str(UNITS[w]))
        if w in TENS:
            out.add(str(TENS[w]))
            if i+1 < len(toks) and toks[i+1] in UNITS and UNITS[toks[i+1]] < 10:
                out.add(str(TENS[w] + UNITS[toks[i+1]]))
    return out

def numbers_in(text: str) -> set[str]:
    """All numeric values present, however written. Digits and number-words."""
    out=set()
    for m in re.findall(r"\d[\d,]*(?:\.\d+)?", text):
        v = m.replace(",", "")
        v = v.rstrip("0").rstrip(".") if "." in v else v
        out.add(v)
    out |= _words_to_numbers(text)
    return out

NAME = re.compile(r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)+\b")
MONTHS = ("January February March April May June July August September October "
          "November December").split()

def names_in(text: str) -> set[str]:
    out=set()
    for n in NAME.findall(text):
        if n.split()[0] in MONTHS:
            continue
        out.add(n.lower())
    return out

def check(src: str, out: str) -> dict:
    sn, on = numbers_in(src), numbers_in(out)
    snames, onames = names_in(src), names_in(out)
    missing_nums = sorted(sn - on, key=lambda x: (len(x), x))
    missing_names = sorted(snames - onames)
    return dict(
        numbers_total=len(sn), numbers_kept=len(sn & on), numbers_missing=missing_nums,
        names_total=len(snames), names_kept=len(snames & onames), names_missing=missing_names,
    )
