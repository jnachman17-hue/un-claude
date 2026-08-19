"""Run documents of increasing length against the LIVE site and record what happens.

The 60 second ceiling is Vercel's and does not exist locally, so this must hit
production to mean anything.
"""
from __future__ import annotations
import base64, io, json, sys, time, urllib.error, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from factcheck import numbers_in                     # noqa: E402
from measure import shingle_overlap, longest_run     # noqa: E402

URL = "https://un-claude.com/api/clean"
DOCS = Path(__file__).parent / "docs"


def call(text: str, layer_b: bool, timeout: int = 120):
    body = json.dumps({
        "file": base64.b64encode(text.encode()).decode(),
        "name": "paste.txt",
        "options": {"layer_b": True} if layer_b else {},
    }).encode()
    req = urllib.request.Request(URL, data=body,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r), time.time() - t0, None
    except urllib.error.HTTPError as e:
        return None, time.time() - t0, f"HTTP {e.code}"
    except Exception as e:
        return None, time.time() - t0, f"{type(e).__name__}"


def main() -> int:
    print(f"{'document':<12} {'words':>7} {'layerB':>7} {'secs':>7} {'result':<10} "
          f"{'numbers':>10} {'ov3':>7} {'run':>5}")
    print("=" * 82)
    rows = []
    for f in sorted(DOCS.glob("doc_*.txt"), key=lambda p: int(p.stem.split("_")[1])):
        src = f.read_text(encoding="utf-8")
        words = len(src.split())
        sn = numbers_in(src)
        for lb in (False, True):
            d, secs, err = call(src, lb)
            if err or not (d and d.get("ok")):
                detail = err or (d or {}).get("code", "unknown")
                print(f"{f.stem:<12} {words:>7} {str(lb):>7} {secs:>7.1f} "
                      f"{'FAILED':<10} {detail}")
                rows.append(dict(doc=f.stem, words=words, layer_b=lb, secs=secs,
                                 ok=False, error=detail))
                continue
            out = base64.b64decode(d["cleaned"]).decode()
            on = numbers_in(out)
            ov = shingle_overlap(src, out, 3)
            lr = longest_run(src, out)
            print(f"{f.stem:<12} {words:>7} {str(lb):>7} {secs:>7.1f} {'ok':<10} "
                  f"{len(sn & on):>4}/{len(sn):<5} {ov*100:>6.1f}% {lr:>5}")
            rows.append(dict(doc=f.stem, words=words, layer_b=lb, secs=secs, ok=True,
                             numbers_kept=len(sn & on), numbers_total=len(sn),
                             ov3=ov, longest=lr, out_words=len(out.split())))
    io.open(Path(__file__).parent / "longtest_results.json", "w").write(
        json.dumps(rows, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
