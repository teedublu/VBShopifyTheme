#!/usr/bin/env python3
"""Pre-flight check for landing-page templates. Run in CI on the PR.

  python3 bin/check-page.py                  # adwords + landing templates
  python3 bin/check-page.py templates/x.json  # specific files
  python3 bin/check-page.py --placeholders-only --all   # whole theme, text checks only

Exits 1 if any ERROR is found. WARNINGs never fail the build.

Checks
  1. placeholder text that should never reach production
  2. every shopify://shop_images/ reference resolves in the Files library
  3. every referenced image has alt text
  4. FAQ blocks match content/messaging.yml, and cite nothing the bank cannot answer
  5. over-long headings (warning only)
"""
import json, re, sys, os, glob, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_TITLE, MAX_SUBHEADING = 60, 90

PLACEHOLDERS = [
    (r'\[Answer to be added\]', 'unfilled answer'),
    (r'\bLorem ipsum\b',        'lorem ipsum'),
    (r'\[insert\b',             'insert marker'),
    (r'\bTBC\b',                'TBC'),
    (r'\bTODO\(',               'TODO marker'),
    (r'\bXXX\b',                'XXX marker'),
    (r'Use this text to share information about your brand',  'unedited Shopify boilerplate'),
    (r'\bPlaceholder\b',        'placeholder'),
]

def strip_comments(s):  return re.sub(r'/\*.*?\*/', '', s, flags=re.S)
def txt(s):             return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(s or ''))).strip()
def norm(s):            return re.sub(r'[^a-z0-9 ]', '', txt(s).lower()).strip()

def load_bank():
    p = os.path.join(ROOT, 'content/messaging.yml')
    if not os.path.exists(p): return None
    raw = open(p, encoding='utf-8').read()
    try:
        import yaml
        return yaml.safe_load(raw)
    except ImportError:
        pass
    # stdlib fallback: reads only the `faq:` list of id/q/a. Anything unexpected -> None,
    # so a parse we do not fully understand disables the check rather than mis-reporting.
    faq, cur = [], None
    for line in raw.splitlines():
        if re.match(r'^\s*#', line) or not line.strip(): continue
        m = re.match(r'^  - id:\s*(\S+)\s*$', line)
        if m:
            cur = {'id': m.group(1)}; faq.append(cur); continue
        m = re.match(r'^    (q|a|note):\s*"(.*)"\s*$', line)
        if m and cur: cur[m.group(1)] = m.group(2).replace('\\"', '"'); continue
        m = re.match(r'^    aliases:\s*\[(.*)\]\s*$', line)
        if m and cur: cur['aliases'] = re.findall(r'"([^"]*)"', m.group(1)); continue
        if re.match(r'^    \w+:', line) and cur: return None   # shape we do not handle
    return {'faq': faq} if faq else None

def walk(node, path=()):
    """Yield (dotted-path, string) for every string in the template."""
    if isinstance(node, dict):
        for k, v in node.items(): yield from walk(v, path + (str(k),))
    elif isinstance(node, list):
        for n, v in enumerate(node): yield from walk(v, path + (str(n),))
    elif isinstance(node, str):
        yield '.'.join(path), node

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    if '--all' in flags:
        files = sorted(glob.glob(os.path.join(ROOT, 'templates/**/*.json'), recursive=True))
    elif args:
        files = [os.path.join(ROOT, a) for a in args]
    else:
        files = sorted(glob.glob(os.path.join(ROOT, 'templates/page.adwords-*.json')) +
                       glob.glob(os.path.join(ROOT, 'templates/page.landing-*.json')))

    assets = {}
    ap = os.path.join(ROOT, 'content/assets.json')
    if os.path.exists(ap):
        assets = {a['filename']: a for a in json.load(open(ap))['assets']}

    bank = load_bank()
    by_q = {}
    if bank:
        # A question can be phrased differently from page to page; aliases map the
        # variants onto one canonical answer instead of forking the bank.
        for e in bank.get('faq', []):
            for q in ([e['q']] if e.get('q') else []) + list(e.get('aliases') or []):
                by_q[norm(q)] = e

    errors, warnings = [], []
    def err(f, m):  errors.append("%s: %s" % (os.path.relpath(f, ROOT), m))
    def warn(f, m): warnings.append("%s: %s" % (os.path.relpath(f, ROOT), m))

    for f in files:
        try:
            doc = json.loads(strip_comments(open(f, encoding='utf-8').read()))
        except Exception as e:
            err(f, "does not parse: %s" % e); continue

        strings = list(walk(doc))
        # Claim control is absolute on pages we buy traffic for; elsewhere the bank
        # governs drift on questions it knows, and stays out of the way on the rest.
        paid = bool(re.search(r'page\.(adwords|landing)', os.path.basename(f)))

        # 1. placeholders
        for path, s in strings:
            for pat, label in PLACEHOLDERS:
                if re.search(pat, s, re.I):
                    err(f, "%s at %s -- %r" % (label, path, txt(s)[:70]))

        if '--placeholders-only' in flags: continue

        # 2 + 3. image references
        for path, s in strings:
            for fname in re.findall(r'shopify://shop_images/([^"\\\s]+)', s):
                a = assets.get(fname)
                if a is None:
                    err(f, "image not in the index: %s (run bin/index-assets.py)" % fname); continue
                if a.get('shopify_id') is None:
                    err(f, "image is not in the Shopify Files library: %s -- it may be "
                           "served from CDN cache only and can disappear" % fname); continue
                if a.get('exists') is False:
                    err(f, "image returns 404: %s" % fname); continue
                if a.get('exists') is None:
                    warn(f, "image existence unverified: %s" % fname)
                if not (a.get('alt') or '').strip():
                    err(f, "image has no alt text: %s" % fname)

        # 4. FAQ blocks against the bank
        for sec in doc.get('sections', {}).values():
            if sec.get('type') != 'faq': continue
            if bank is None:
                warn(f, "FAQ section present but content/messaging.yml is unreadable"); break
            for bid, b in (sec.get('blocks') or {}).items():
                st = b.get('settings', {})
                q, a = st.get('title'), txt(st.get('content'))
                if not q: continue
                entry = by_q.get(norm(q))
                if entry is None:
                    (err if paid else warn)(
                        f, "FAQ %s asks a question the bank cannot answer: %r" % (bid, txt(q)[:60]))
                elif 'TODO(messaging)' in (entry.get('a') or ''):
                    err(f, "FAQ %s uses bank entry '%s', which is unresolved" % (bid, entry['id']))
                elif norm(a) != norm(entry.get('a', '')):
                    err(f, "FAQ %s does not match bank entry '%s'\n      page: %s\n      bank: %s"
                        % (bid, entry['id'], txt(a)[:80], txt(entry.get('a'))[:80]))

        # 5. heading length
        for path, s in strings:
            if path.endswith('.title') and len(s) > MAX_TITLE:
                warn(f, "title %d chars (max %d) at %s -- %r" % (len(s), MAX_TITLE, path, s[:50]))
            if path.endswith('.subheading') and len(s) > MAX_SUBHEADING:
                warn(f, "subheading %d chars (max %d) at %s" % (len(s), MAX_SUBHEADING, path))

    for w in warnings: print("WARN  %s" % w)
    for e in errors:   print("ERROR %s" % e)
    print("\n%d file(s) checked | %d error(s) | %d warning(s)" % (len(files), len(errors), len(warnings)))
    if bank is None: print("note: messaging bank not loaded -- FAQ checks skipped")
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main())
