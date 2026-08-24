"""Summarise bakeoff_results.jsonl into per-model tables. No model calls."""

from __future__ import annotations

import json
import statistics
from collections import defaultdict
from pathlib import Path

RESULTS = Path(__file__).parent / "bakeoff_results.jsonl"

#: Sentinel counts per document, for the survival denominator.
SENTINEL_COUNTS = {"A_quotes": 3, "B_structure": 6, "C_numbers": 5, "D_terms": 7}


def main() -> int:
    rows = [json.loads(line) for line in RESULTS.read_text().splitlines()]
    by_model: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_model[(r["model"], r.get("reasoning", "default"))].append(r)

    print(f"{'model':42s} {'runs':>4s} {'fail':>4s} {'sec med':>8s} {'sec max':>8s} "
          f"{'overlap':>8s} {'sent lost':>9s} {'quotes chg':>10s} {'heads chg':>9s} "
          f"{'refs chg':>8s} {'inject':>6s} {'figs':>4s} {'$/run':>9s}")
    for (model, reasoning), rs in by_model.items():
        ok = [r for r in rs if r.get("ok")]
        fails = [r for r in rs if not r.get("ok")]
        secs = [r["seconds"] for r in rs if "seconds" in r]
        overlaps = [r["overlap"] for r in ok]
        lost = sum(len(r["sentinels_lost"]) for r in ok)
        lost_denom = sum(SENTINEL_COUNTS[r["doc"]] for r in ok)
        quotes_chg = sum(r["spans_changed"].get("quote", 0) for r in ok)
        quotes_all = sum(r["spans_found"].get("quote", 0) for r in ok)
        bq_chg = sum(r["spans_changed"].get("block_quote", 0) for r in ok)
        bq_all = sum(r["spans_found"].get("block_quote", 0) for r in ok)
        heads_chg = sum(r["spans_changed"].get("heading", 0) for r in ok)
        heads_all = sum(r["spans_found"].get("heading", 0) for r in ok)
        refs_chg = sum(r["spans_changed"].get("reference", 0) for r in ok)
        refs_all = sum(r["spans_found"].get("reference", 0) for r in ok)
        inject = sum(
            r["injected"]["em_dashes"] + r["injected"]["curly"]
            + r["injected"]["md_asterisks"] + r["injected"]["md_headings"]
            for r in ok
        )
        figs = sum(len(r["figures_missing"]) for r in ok)
        cost = sum(r.get("cost_usd") or 0 for r in rs)
        label = model + ("" if reasoning == "default" else f" [{reasoning}]")
        print(
            f"{label:42s} {len(rs):>4d} {len(fails):>4d} "
            f"{statistics.median(secs) if secs else 0:>8.1f} {max(secs) if secs else 0:>8.1f} "
            f"{statistics.median(overlaps) if overlaps else float('nan'):>8.4f} "
            f"{f'{lost}/{lost_denom}':>9s} "
            f"{f'{quotes_chg + bq_chg}/{quotes_all + bq_all}':>10s} "
            f"{f'{heads_chg}/{heads_all}':>9s} {f'{refs_chg}/{refs_all}':>8s} "
            f"{inject:>6d} {figs:>4d} {cost / max(1, len(rs)):>9.5f}"
        )
    total = sum(r.get("cost_usd") or 0 for r in rows)
    print(f"\ntotal gateway spend across {len(rows)} runs: ${total:.5f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
