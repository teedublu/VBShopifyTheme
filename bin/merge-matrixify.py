#!/usr/bin/env python3
"""Join a Matrixify Files export onto content/assets.json.

Adds the Shopify file ID and current alt text to each referenced asset, so the
alt-drafting pass knows what already exists and the import sheet can address
files by ID rather than by name.

Usage: python3 bin/merge-matrixify.py working/Matrixify_Image_export.xlsx
"""
import json, os, sys, collections
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_export(path):
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True)['Files']
    rows = ws.iter_rows(values_only=True)
    hdr = [h for h in next(rows)]
    idx = {h: i for i, h in enumerate(hdr) if h}
    out = []
    for r in rows:
        if not r or not r[idx['File Name']]: continue
        out.append({
            "id": r[idx['ID']], "filename": r[idx['File Name']],
            "alt": (r[idx['Alt Text']] or "").strip() if r[idx['Alt Text']] else "",
            "type": r[idx['Type']], "mime": r[idx['Mime Type']],
            "width": r[idx['Width']], "height": r[idx['Height']],
            "bytes": r[idx['Size Bytes']], "created": r[idx['Created At']],
        })
    return out

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else 'working/Matrixify_Image_export.xlsx'
    files = load_export(os.path.join(ROOT, src))
    by_name = collections.defaultdict(list)
    for f in files: by_name[f['filename']].append(f)

    p = os.path.join(ROOT, 'content', 'assets.json')
    d = json.load(open(p))
    matched = ambiguous = with_alt = 0
    for a in d['assets']:
        cands = by_name.get(a['filename'], [])
        if not cands:
            a['shopify_id'] = None; a['match'] = 'not_found'; continue
        if len(cands) > 1:
            cands = sorted(cands, key=lambda c: c['created'] or 0, reverse=True)
            a['match'] = 'ambiguous(%d)' % len(cands); ambiguous += 1
        else:
            a['match'] = 'ok'
        f = cands[0]
        a['shopify_id'] = f['id']
        a['alt'] = f['alt'] or None
        matched += 1
        if f['alt']: with_alt += 1

    d['_counts'].update({
        "library_total": len(files),
        "matched_to_library": matched,
        "ambiguous_name": ambiguous,
        "referenced_with_alt": with_alt,
        "referenced_missing_alt": matched - with_alt,
    })
    json.dump(d, open(p, 'w'), indent=1, default=str)

    lib_alt = sum(1 for f in files if f['alt'])
    print("LIBRARY   %d files | %d have alt (%.0f%%) | %d missing"
          % (len(files), lib_alt, 100*lib_alt/len(files), len(files)-lib_alt))
    print("REFERENCED %d | matched %d | not found %d | ambiguous name %d"
          % (len(d['assets']), matched, len(d['assets'])-matched, ambiguous))
    print("           %d have alt | %d MISSING alt  <-- the job"
          % (with_alt, matched - with_alt))
    nf = [a['filename'] for a in d['assets'] if a['match'] == 'not_found']
    if nf: print("not found:", nf[:10])

if __name__ == '__main__':
    main()
