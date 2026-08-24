"""E-16: pick the attribution rule on numbers, not on one sample.

Three candidate rules are implemented here as pure predicates over
(pre, post) — the same two windows uc_spans._quote_attributed receives —
and scored against an adversarial corpus of 46 fiction dialogue lines
(NONE may freeze) and 30 real attribution shapes (ALL should freeze).

  R0  shipping — reportive verb in the attributive position, or a citation
  R1  the brief's hypothesis — R0, but a BARE PRONOUN subject is not
      attribution
  R2  R1, and the trailing-tag path is dropped entirely: attribution is a
      pre-quote verb with a named subject, or a citation
  R3  R1, and the trailing-tag path survives only INVERTED ("...," wrote
      Orwell), never as a subject-verb dialogue tag ("...," she argued)

Run:  python engine/lab/attribution_rules_eval.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "web" / "engine"))

from uc_spans import _ATTRIBUTION, _CITATION, _SENTENCE_END, _CUE_WINDOW, _POST_WINDOW, _QUOTE  # noqa: E402

# --------------------------------------------------------------------------
# The subject test
# --------------------------------------------------------------------------

_PRONOUNS = {"i", "you", "he", "she", "it", "we", "they",
             "him", "her", "them", "me", "us"}
#: Words that sit between a subject and its verb and are not the subject:
#: auxiliaries, and the adverbs that pile up in front of a reportive verb.
_SKIP = {"had", "has", "have", "having", "was", "were", "is", "are", "am",
         "be", "been", "being", "would", "will", "could", "should", "may",
         "might", "must", "can", "did", "does", "do", "not", "never",
         "also", "then", "once", "again", "later", "further", "already",
         "still", "even", "only", "just", "so", "and", "but", "who", "which",
         "that", "later", "afterwards", "afterward", "however"}

_WORD = re.compile(r"[A-Za-z][\w'’-]*")


def _token_before(s: str, idx: int) -> str:
    """The subject-bearing word before position `idx`, auxiliaries skipped."""
    for m in reversed(list(_WORD.finditer(s[:idx]))):
        w = m.group(0)
        if w.lower() in _SKIP or w.lower().endswith("ly"):
            continue
        return w
    return ""


def _token_after(s: str, idx: int) -> str:
    for m in _WORD.finditer(s[idx:]):
        w = m.group(0)
        if w.lower() in _SKIP or w.lower().endswith("ly"):
            continue
        return w
    return ""


def _is_pronoun(word: str) -> bool:
    return word.lower() in _PRONOUNS


# --------------------------------------------------------------------------
# The rules
# --------------------------------------------------------------------------


def r0(pre: str, post: str) -> bool:
    """Shipping."""
    for vm in _ATTRIBUTION.finditer(pre):
        if not _SENTENCE_END.search(pre[vm.end():]):
            return True
    near = post[:_POST_WINDOW]
    vm = _ATTRIBUTION.search(near)
    if vm and not _SENTENCE_END.search(near[: vm.start()]):
        return True
    return bool(_CITATION.search(pre) or _CITATION.search(post))


def _cited(pre: str, post: str) -> bool:
    return bool(_CITATION.search(pre) or _CITATION.search(post))


def r1(pre: str, post: str) -> bool:
    """A bare pronoun subject is not attribution."""
    for vm in _ATTRIBUTION.finditer(pre):
        if _SENTENCE_END.search(pre[vm.end():]):
            continue
        if _is_pronoun(_token_before(pre, vm.start())):
            continue
        return True
    near = post[:_POST_WINDOW]
    vm = _ATTRIBUTION.search(near)
    if vm and not _SENTENCE_END.search(near[: vm.start()]):
        before = _token_before(near, vm.start())
        after = _token_after(near, vm.end())
        subject = before or after
        if not _is_pronoun(subject):
            return True
    return _cited(pre, post)


def r2(pre: str, post: str) -> bool:
    """No trailing-tag path at all: pre-quote named subject, or a citation."""
    for vm in _ATTRIBUTION.finditer(pre):
        if _SENTENCE_END.search(pre[vm.end():]):
            continue
        if _is_pronoun(_token_before(pre, vm.start())):
            continue
        return True
    return _cited(pre, post)


def r3(pre: str, post: str) -> bool:
    """Trailing tags survive only INVERTED: «"...," wrote Orwell»."""
    for vm in _ATTRIBUTION.finditer(pre):
        if _SENTENCE_END.search(pre[vm.end():]):
            continue
        if _is_pronoun(_token_before(pre, vm.start())):
            continue
        return True
    near = post[:_POST_WINDOW]
    vm = _ATTRIBUTION.search(near)
    if vm and not _SENTENCE_END.search(near[: vm.start()]):
        # inverted iff nothing but punctuation stands between the closing
        # mark and the verb, and a named subject follows it
        if not _WORD.search(near[: vm.start()]) and not _is_pronoun(
                _token_after(near, vm.end())):
            return True
    return _cited(pre, post)


RULES = {"R0 shipping": r0, "R1 pronoun": r1, "R2 pre-only": r2, "R3 inverted": r3}

# --------------------------------------------------------------------------
# THE CORPUS. Fiction: none may freeze. Attribution: all should freeze.
# --------------------------------------------------------------------------

FICTION = [
    # --- pronoun subject, trailing tag (the 17 the brief found) ---
    '"You never once asked me," she argued, and turned to the window.',
    '"Don\'t go down to the water after dark," he warned, shouldering the pack.',
    '"Your hands are shaking again," she noted, setting the cup down.',
    '"You always leave before the music stops," he observed, watching her coat.',
    '"I was nowhere near the barn that night," he claimed, and nobody believed him.',
    '"I will not be going with you," she stated, folding the last of the linen.',
    '"This house is finished with the lot of them," he declared from the top step.',
    '"You have your mother\'s temper," she remarked, without looking up.',
    '"I saw what I saw," he insisted, though the lamp had been out an hour.',
    '"I should have written sooner," she acknowledged, and the silence went on.',
    '"Then there is nothing left to settle," he concluded, and reached for his hat.',
    '"That money was mine before it was ever his," she asserted, hands flat.',
    '"I locked the gate the same as every night," he maintained, meeting her eye.',
    '"You have the story backwards," she contended, pouring the last of the tea.',
    '"Mind the second stair," he cautioned, holding the lamp low for her.',
    '"Not one word of this leaves the kitchen," she emphasised, and shut the door.',
    '"The road is under three feet of water," he reported, out of breath.',
    # --- NAMED CHARACTER subject, trailing tag: the case R1 cannot see ---
    '"You told him where the boat was moored," Aldous observed, closing the shutter.',
    '"There were four men on that quay," Ruth argued, and would not sit down.',
    '"Then we are already too late," Marcus concluded, and went up without the lamp.',
    '"I never touched the ledger," Hetty insisted, though her hands said otherwise.',
    '"The tide turns at four," Da Silva noted, and spat over the harbour wall.',
    '"Nobody is coming for us," Father Brennan stated, and put out the candles.',
    '"Keep the dogs inside tonight," Mrs Alder warned, and bolted her own door.',
    '"You were seen at the quarry," Inspector Voss remarked, opening his notebook.',
    # --- the boy / the old man: a common noun subject, trailing tag ---
    '"The bridge is out past the mill," the boy reported, still holding the reins.',
    '"I have buried better men than him," the old woman remarked, and laughed.',
    '"You will want the far room," the innkeeper observed, taking down a key.',
    # --- tag BEFORE the line, pronoun and named ---
    'She argued, "You never once asked me," and turned to the window.',
    'He insisted, "I saw what I saw," though the lamp had been out an hour.',
    'Marcus concluded, "Then we are already too late," and reached for his hat.',
    'Ruth observed, "You always leave before the music stops."',
    # --- inverted fiction tags ---
    '"Mind the second stair," cautioned Aldous, holding the lamp low for her.',
    '"I never touched the ledger," insisted Hetty, though her hands said otherwise.',
    # --- epistolary fiction (the brief names this one) ---
    'She wrote: "My dearest Thomas, the barn is standing and the geese are not."',
    'He had written that "the winter would finish what the fever started."',
    # --- narration using a reportive verb in its plain sense near a line ---
    '"We move at dark," she said, and nobody argued with her about the hour.',
    '"Take the long field," he said. The dogs observed them from the gate.',
    # --- interior monologue and thought quotes ---
    '"They know the bridge is out," she thought, and noted the empty road.',
    # --- dialogue with a year in it (must not read as a citation) ---
    '"I have not been back since 1987," she insisted, and would say nothing more.',
    '"He died in the spring of 2019," Marcus observed, and closed the gate.',
    # --- a question and an exclamation ---
    '"And if the water is over the ford?" she argued, already knowing the answer.',
    '"Not one step further!" he declared, and the dogs went flat in the grass.',
    # --- dialect / no tag at all, adjacent narration ---
    '"Aye, and the rest," he said. His brother maintained the fiction all evening.',
    '"Let it burn," she said, and it was later reported that she watched it.',
]

ATTRIBUTION = [
    # --- pre-quote, named source: the 4 shapes E-9 protects ---
    'As Smith puts it, "the change in start time did more for attendance than any intervention we had previously funded."',
    'Orwell wrote that "the great enemy of clear language is insincerity."',
    'The committee concluded that the scheme had "acted without malice and without competence in equal measure."',
    'Acton observed that "power tends to corrupt" long before the century proved him right.',
    # --- citation shapes, the strongest signal ---
    'The finding was blunt: "attendance rose in every quartile" (Smith, 2019, p. 47).',
    '"Later start times moved the whole distribution" (Harrison, 2020).',
    'The review called the effect "small but durable" (p. 112).',
    '"The transport line rose by eleven percent," the district found (Okonkwo, 2021, pp. 88-104).',
    # --- according to ---
    'According to the 2019 review, "no district in the sample reversed the change."',
    'According to Harrison, the effect was "small but durable" across three cohorts.',
    # --- named institutional sources, pre-quote ---
    'The Department for Education reported that uptake was "well short of the target set in 2018."',
    'The 2019 review concluded that "the evidence base is thinner than the policy assumes."',
    'A Home Office memorandum stated that the scheme was "operating outside its own guidance."',
    'Professor Hale argued that the reform had "solved a problem nobody had measured."',
    'The auditor noted that the reserve had been "spent twice and accounted for once."',
    'The judgment declared the practice "incompatible with the statutory duty."',
    'Keynes maintained that the long run was "a misleading guide to current affairs."',
    'The World Health Organization cautioned that coverage remained "dangerously uneven."',
    'The tribunal asserted that the dismissal was "procedurally defective throughout."',
    'The inspectorate emphasised that the failings were "systemic, not individual."',
    'Dr Okonkwo acknowledged that the sample was "too small to settle the question."',
    'The minister claimed the programme had been "delivered under budget."',
    'The chairman contended that the figures were "presented to mislead."',
    'The 2021 audit described the contingency reserve as "a fiction maintained for the minutes."',
    'The panel termed the delay "unconscionable in a case of this kind."',
    # --- inverted, named source ---
    '"The great enemy of clear language is insincerity," wrote Orwell in 1946.',
    '"Attendance rose in every quartile," reported the district in its annual return.',
    # --- block-quote lead-ins (colon shapes; scored on the lead-in) ---
    'The report concluded:',
    'As Harrison puts it:',
    'The minutes recorded, in full:',
]


def _windows(line: str) -> tuple[str, str] | None:
    """The (pre, post) windows for the FIRST quotation in the line."""
    m = _QUOTE.search(line)
    if not m:
        return None
    return (line[max(0, m.start() - _CUE_WINDOW): m.start()],
            line[m.end(): m.end() + _CUE_WINDOW])


def main() -> int:
    cases: list[tuple[str, str, bool]] = []
    for line in FICTION:
        w = _windows(line)
        if w is None:
            print(f"!! no quotation found, skipped: {line[:50]}")
            continue
        cases.append((line, "fiction", False))
    for line in ATTRIBUTION:
        if _QUOTE.search(line):
            cases.append((line, "attribution", True))
        else:
            cases.append((line, "attribution", True))   # block-quote lead-in

    print(f"corpus: {len(FICTION)} fiction lines (none may freeze), "
          f"{len(ATTRIBUTION)} attribution shapes (all should freeze)")
    print()
    header = f"{'':<52}" + "".join(f"{n:<14}" for n in RULES)
    print(header)
    print("-" * len(header))

    tally = {n: {"fp": [], "fn": []} for n in RULES}
    for line, kind, want in cases:
        w = _windows(line)
        lead_in = w is None
        if lead_in:                        # block-quote lead-in: pre only
            pre, post = line, ""
        else:
            pre, post = w
        row = f"  {kind[:4]} {line[:44]:<45}"
        for name, fn in RULES.items():
            got = fn(pre, post)
            if lead_in:
                # uc_spans' block_quote branch: a lead-in ending in a colon
                # counts on its own. Fiction almost never introduces invented
                # text that way.
                got = got or pre.rstrip().endswith(":")
            ok = (got == want)
            row += f"{'freeze' if got else 'free':<7}{'' if ok else 'X':<7}"
            if not ok:
                tally[name]["fp" if got else "fn"].append(line)
        print(row)

    print()
    print("=" * 78)
    print("SCORE — fiction wrongly frozen (the expensive error) / "
          "attribution wrongly freed")
    print("=" * 78)
    for name in RULES:
        fp, fn = len(tally[name]["fp"]), len(tally[name]["fn"])
        print(f"  {name:<14} wrongly FROZEN {fp:>2}/{len(FICTION)}   "
              f"wrongly FREE {fn:>2}/{len(ATTRIBUTION)}")
    print()
    for name in RULES:
        if tally[name]["fp"] or tally[name]["fn"]:
            print(f"--- {name} misses ---")
            for line in tally[name]["fp"]:
                print(f"    FROZEN fiction : {line[:70]}")
            for line in tally[name]["fn"]:
                print(f"    FREED  source  : {line[:70]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
