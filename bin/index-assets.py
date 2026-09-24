#!/usr/bin/env python3
"""Build content/assets.json: an index of the Shopify Files this theme references.

Scans templates/, sections/, snippets/, config/ for shopify://shop_images/<file>
references, then probes the Shopify CDN for each one to confirm it resolves and
to read its real pixel dimensions.

Fields left null (alt, description, tags) are backfilled from the Shopify Admin
API -- see claude/landing-page-content-pipeline.md.
"""
import json, re, os, struct, sys, glob, collections, datetime
import concurrent.futures as cf, urllib.request, urllib.error

CDN = "https://cdn.shopify.com/s/files/1/0531/2872/4635/files/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _strings(node):
    """Every string value in a decoded JSON document."""
    if isinstance(node, dict):
        for v in node.values(): yield from _strings(v)
    elif isinstance(node, list):
        for v in node: yield from _strings(v)
    elif isinstance(node, str):
        yield node

def collect_refs():
    """Collect shopify://shop_images/ references.

    JSON templates are DECODED before scanning: Shopify writes some references with
    escaped solidi ("shopify:\\/\\/shop_images\\/x.png"), which a raw-text grep silently
    misses. Liquid and other non-JSON files fall back to a regex over the raw text.
    """
    used = collections.defaultdict(list)
    pat = re.compile(r'shopify://shop_images/([^"\\\s]+)')
    for g in ['templates/**/*.json', 'sections/*', 'snippets/*', 'config/*.json']:
        for f in glob.glob(os.path.join(ROOT, g), recursive=True):
            if not os.path.isfile(f): continue
            rel = os.path.relpath(f, ROOT)
            try: raw = open(f, encoding='utf-8', errors='ignore').read()
            except Exception: continue
            names = set()
            if f.endswith('.json'):
                try:
                    doc = json.loads(re.sub(r'/\*.*?\*/', '', raw, flags=re.S))
                    for s in _strings(doc): names |= set(pat.findall(s))
                except Exception:
                    names |= set(pat.findall(raw))
            else:
                names |= set(pat.findall(raw))
            for n in names: used[n].append(rel)
    return {k: sorted(v) for k, v in used.items()}

def dims(b):
    if b[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', b[16:24])
    if b[:6] in (b'GIF87a', b'GIF89a'):
        return struct.unpack('<HH', b[6:10])
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
        c = b[12:16]
        if c == b'VP8X': return (int.from_bytes(b[24:27],'little')+1, int.from_bytes(b[27:30],'little')+1)
        if c == b'VP8 ': return (struct.unpack('<H', b[26:28])[0] & 0x3fff, struct.unpack('<H', b[28:30])[0] & 0x3fff)
        if c == b'VP8L':
            n = int.from_bytes(b[21:25],'little'); return ((n & 0x3FFF)+1, ((n>>14) & 0x3FFF)+1)
    if b[:2] == b'\xff\xd8':
        i = 2
        while i < len(b)-9:
            if b[i] != 0xFF: i += 1; continue
            m = b[i+1]
            if m in (0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF):
                h, w = struct.unpack('>HH', b[i+5:i+9]); return (w, h)
            if m in (0xD8,0xD9) or 0xD0 <= m <= 0xD7: i += 2; continue
            i += 2 + struct.unpack('>H', b[i+2:i+4])[0]
    return (None, None)

def probe(item):
    name, where = item
    rec = {"filename": name, "url": CDN + name, "exists": None, "probe": "not_run",
           "width": None, "height": None, "aspect": None, "orientation": None,
           "bytes": None, "content_type": None,
           "alt": None, "description": None, "tags": [],
           "use_count": len(where), "used_by": where}
    req = urllib.request.Request(rec["url"], headers={
        "Range": "bytes=0-65535", "User-Agent": "voxblock-asset-indexer/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            rec["exists"] = True; rec["probe"] = "ok"
            rec["content_type"] = r.headers.get("Content-Type")
            cr = r.headers.get("Content-Range")
            if cr and "/" in cr: rec["bytes"] = int(cr.rsplit("/", 1)[-1])
            w, h = dims(data)
            rec["width"], rec["height"] = w, h
            if w and h:
                rec["aspect"] = round(w / h, 3)
                rec["orientation"] = ("square" if abs(w - h) / max(w, h) < 0.02
                                      else "landscape" if w > h else "portrait")
    except urllib.error.HTTPError as e:
        rec["http_status"] = e.code
        # Only a real 404/410 proves the file is gone. Anything else (403 from an
        # egress proxy, 5xx, timeout) leaves existence UNKNOWN -- never report it
        # as broken, or the guard will fail every page for a network fault.
        rec["exists"] = False if e.code in (404, 410) else None
        rec["probe"] = "http_%d" % e.code
    except Exception as e:
        rec["probe"] = "unreachable"
        rec["probe_error"] = "%s: %s" % (type(e).__name__, e)
    return rec

def main():
    used = collect_refs()
    prev = {}
    pj = os.path.join(ROOT, 'content', 'assets.json')
    if os.path.exists(pj):
        try: prev = {a['filename']: a for a in json.load(open(pj))['assets']}
        except Exception: pass
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        recs = sorted(ex.map(probe, sorted(used.items())), key=lambda r: r["filename"])
    # A blocked or failed probe must not erase a previously verified result, or running
    # this from a sandbox would downgrade the whole index to "unverified".
    for r in recs:
        if r["probe"] in ("unreachable", "not_run") and r["filename"] in prev:
            old = prev[r["filename"]]
            for k in ("exists", "width", "height", "aspect", "orientation", "bytes",
                      "content_type", "alt", "description", "tags", "shopify_id", "match"):
                if old.get(k) not in (None, [], ""): r[k] = old[k]
            if old.get("exists") is not None: r["probe"] = "cached"

    broken  = [r for r in recs if r["exists"] is False]
    unknown = [r for r in recs if r["exists"] is None]
    out = {
        "_comment": "Generated by bin/index-assets.py. Do not hand-edit.",
        "_generated": datetime.date.today().isoformat(),
        "_cdn_base": CDN,
        "_counts": {"referenced": len(recs), "resolved": len(recs) - len(broken) - len(unknown),
                    "broken": len(broken), "unverified": len(unknown)},
        "assets": recs,
    }
    os.makedirs(os.path.join(ROOT, "content"), exist_ok=True)
    p = os.path.join(ROOT, "content", "assets.json")
    json.dump(out, open(p, "w"), indent=1)
    print("referenced %d | resolved %d | BROKEN %d | unverified %d"
          % (len(recs), len(recs) - len(broken) - len(unknown), len(broken), len(unknown)))
    for r in broken:
        print("  BROKEN %-60s HTTP %s" % (r["filename"], r.get("http_status")))
    if unknown:
        print("  NOTE: %d files could not be reached (%s). Existence is unknown, not broken."
              % (len(unknown), unknown[0].get("probe_error", unknown[0].get("probe"))[:60]))
    print("wrote", os.path.relpath(p, ROOT))
    return 0

if __name__ == "__main__":
    sys.exit(main())
