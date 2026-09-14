#!/usr/bin/env python3
"""Generate alt text for product cover art from the product title.

Only for files attached to exactly ONE product -- a file shared across products is a
single MediaImage with a single alt field, so a product-specific description would be
wrong everywhere else it appears.

Roles are inferred from the filename prefix and follow the wording already used by the
1,450 images that have alt (e.g. "<Title> audiobook front cover").
"""
import csv, re, sys, os, collections, urllib.parse
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def fn(s): return urllib.parse.unquote(s.split('?')[0].rsplit('/',1)[-1]) if s else None
def has_ab(t): return bool(re.search(r'audiobook', t, re.I))
def art(t):
    """Prefix 'the' only when the title does not already start with an article."""
    return t if re.match(r'^(the|a|an)\b', t, re.I) else "the " + t
def ab(t): return t if has_ab(t) else t + " audiobook"

ROLES = [
    (r'^3D-FRONT-',   lambda t: "%s front cover" % t if has_ab(t) else "%s audiobook front cover" % t),
    (r'^3D-BACK-',    lambda t: "%s back cover"  % t if has_ab(t) else "%s audiobook back cover"  % t),
    # No leading article: titles vary between "The Worst Witch ..." and "Zog and Friends ...",
    # and "in the The ..." was the result of assuming one.
    (r'^3D-[Bb]undle|^3D-BUNDLE', lambda t: "Front covers of the audiobooks in %s" % t
        if re.search(r'\bbundle\b', t, re.I) else "Front covers of the audiobooks in the %s bundle" % t),
    # These are placeholder graphics reading "Cover Artwork Coming Soon". They sit on bundle
    # products, so the product title names the bundle, not the individual book -- describing
    # what is actually on screen is both accurate and all we can honestly say.
    (r'^COMING-SOON-', lambda t: "Audiobook cover artwork coming soon"),
    # Marketing tile: orange panel naming the title and author with running time and age
    # guidance, above the audiobook seated in a player. Restricted to the -300x510 render;
    # other Book-* files are a mixed bag.
    # No leading article: the title starts the sentence, and many already begin with one.
    (r'^Book-.*-300x510', lambda t: "%s in a Voxblock player, with running time and age guidance" % ab(t)),
    # A hand lifting the audiobook from a shelf of other Voxblock audiobooks.
    (r'^product-book-bookshelf-', lambda t: "A hand taking %s from a shelf of Voxblock audiobooks" % art(ab(t))),
]
def role(f):
    for pat, mk in ROLES:
        if re.search(pat, f): return mk
    return None

def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT,'working/products.csv'), encoding='utf-8-sig')))
    tid = title = status = None
    att = collections.defaultdict(set); miss = set(); titles = {}
    for r in rows:
        if r.get('Title'): title = r['Title']
        if r.get('Status'): status = r['Status']
        src = r.get('Image Src')
        if not src: continue
        f = fn(src); att[f].add(title); titles[f] = (title, status)
        if not (r.get('Image Alt Text') or '').strip(): miss.add(f)

    ws = openpyxl.load_workbook(os.path.join(ROOT,'working/Matrixify_Image_export.xlsx'),
                                read_only=True, data_only=True)['Files']
    it = ws.iter_rows(values_only=True); hdr = list(next(it)); i = {h:n for n,h in enumerate(hdr) if h}
    lib = {}
    for r in it:
        if r and r[i['File Name']]: lib[r[i['File Name']]] = (r[i['ID']], r[i['Link']])

    done = set()
    p = os.path.join(ROOT,'content/alt-drafts.csv')
    if os.path.exists(p): done = {r['File Name'] for r in csv.DictReader(open(p))}

    out, skipped = [], collections.Counter()
    for f in sorted(miss):
        if f in done: skipped['already drafted'] += 1; continue
        mk = role(f)
        if not mk: skipped['no template for this role'] += 1; continue
        if len(att[f]) != 1: skipped['shared across products'] += 1; continue
        if f not in lib: skipped['not in Files library'] += 1; continue
        t, st = titles[f]
        # A single book's cover attached to a BUNDLE product would inherit the bundle's
        # title and describe the wrong thing. Leave those for a human.
        if re.search(r'^3D-(FRONT|BACK)-', f) and re.search(r'\bbundle\b', t, re.I):
            skipped['single cover on a bundle product'] += 1; continue
        idv, link = lib[f]
        out.append([idv, f, 'UPDATE', mk(t.strip()), link, st])

    dest = os.path.join(ROOT,'content/alt-drafts-covers.csv')
    with open(dest,'w',newline='',encoding='utf-8') as fh:
        w = csv.writer(fh); w.writerow(['ID','File Name','Command','Alt Text','Link','_status'])
        w.writerows(out)
    print("generated %d rows -> content/alt-drafts-covers.csv" % len(out))
    print("by status:", dict(collections.Counter(r[5] for r in out)))
    print("skipped:", dict(skipped))
    print("\nsample:")
    for r in out[:8]: print("   %-52s %s" % (r[1][:52], r[3]))

if __name__ == '__main__': main()
