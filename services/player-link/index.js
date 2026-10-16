'use strict';
/*
 * Player link service (Catalyst project Voxblock-Storefront, Advanced I/O function, node20).
 * Reached only through the Shopify app proxy: https://voxblock.co.uk/apps/voxblock/players/<route>
 * Shopify signs every proxied request and adds logged_in_customer_id, so the signed-in customer is known
 * without any secret in the theme. See README.md for routes, data and setup.
 *
 * Env: SHOPIFY_SHOP, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET (app with write_customers, read_orders),
 *      KLAVIYO_PRIVATE_KEY, TOKEN_SECRET (long random string), STORE_URL (https://voxblock.co.uk),
 *      PROXY_PATH (/apps/voxblock/players)
 */
const express = require('express');
const crypto = require('crypto');

const env = process.env;
const STORE_URL = env.STORE_URL || 'https://voxblock.co.uk';
const PROXY_PATH = env.PROXY_PATH || '/apps/voxblock/players';
const API_VERSION = '2025-10';
const SOURCES = ['Voxblock website', 'Amazon', 'A shop', 'A gift', 'Other'];
const TOKEN_DAYS = 7;
const MAX_REQUESTS_PER_DAY = 5;
const RESEND_AFTER_HOURS = 24;

const app = express();
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

/* ---------- helpers ---------- */

const today = () => new Date().toISOString().slice(0, 10);
const b64url = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (key, text, enc = 'hex') => crypto.createHmac('sha256', key).update(text).digest(enc);
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const gid = (id) => (String(id).startsWith('gid://') ? String(id) : `gid://shopify/Customer/${id}`);
const num = (g) => String(g).split('/').pop();

// t***@g****.com
function mask(email) {
  const [local, domain = ''] = String(email).toLowerCase().split('@');
  const dot = domain.indexOf('.');
  const name = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  return `${local.charAt(0)}***@${name.charAt(0)}${'*'.repeat(Math.max(name.length - 1, 2))}${tld}`;
}

// Shopify app proxy signature: sorted "key=value" pairs (arrays joined by ","), no separator, HMAC-SHA256 hex.
function verifyProxy(query) {
  const { signature, ...rest } = query;
  if (!signature) return false;
  const message = Object.keys(rest).sort()
    .map((k) => `${k}=${Array.isArray(rest[k]) ? rest[k].join(',') : rest[k]}`).join('');
  const ts = Number(rest.timestamp || 0);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  return safeEqual(hmac(env.SHOPIFY_CLIENT_SECRET, message), String(signature));
}

function makeToken(payload) {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(env.TOKEN_SECRET, body, 'base64url')}`;
}
function readToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig || !safeEqual(hmac(env.TOKEN_SECRET, body, 'base64url'), sig)) return null;
  const p = JSON.parse(Buffer.from(body, 'base64url').toString());
  return p.x > Date.now() ? p : null;
}

// App proxy pages: Shopify renders "application/liquid" inside the theme (no charset suffix, or it is served raw).
function liquid(res, html) {
  res.status(200).setHeader('Content-Type', 'application/liquid');
  res.end(html);
}

/* ---------- Shopify Admin API ---------- */

let cachedToken = null;
async function adminToken() {
  if (cachedToken && cachedToken.until > Date.now()) return cachedToken.value;
  const r = await fetch(`https://${env.SHOPIFY_SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET, grant_type: 'client_credentials' }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Shopify token failed');
  cachedToken = { value: j.access_token, until: Date.now() + ((j.expires_in || 3600) - 300) * 1000 };
  return cachedToken.value;
}

async function gql(query, variables) {
  const r = await fetch(`https://${env.SHOPIFY_SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await adminToken() },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const CUSTOMER_FIELDS = `id email firstName
  metafield(namespace: "players", key: "data") { value }
  orders(first: 50, sortKey: CREATED_AT, reverse: true) { nodes {
    legacyResourceId createdAt cancelledAt displayFinancialStatus
    lineItems(first: 50) { nodes { id quantity product { productType tags } } } } }`;

async function getCustomer(id) {
  const d = await gql(`query($id: ID!) { customer(id: $id) { ${CUSTOMER_FIELDS} } }`, { id: gid(id) });
  return d.customer;
}
async function findCustomerByEmail(email) {
  const d = await gql(`query($q: String!) { customers(first: 1, query: $q) { nodes { ${CUSTOMER_FIELDS} } } }`,
    { q: `email:"${email.replace(/"/g, '')}"` });
  const c = d.customers.nodes[0];
  return c && c.email && c.email.toLowerCase() === email ? c : null;
}

function dataOf(c) {
  let d = {};
  try { d = JSON.parse((c.metafield && c.metafield.value) || '{}'); } catch (e) { d = {}; }
  return { nicknames: {}, linked: [], shared: [], pending: [], requests: [], blocked: [], ...d };
}
async function saveData(customerId, data) {
  const d = await gql(`mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`, {
    m: [{ ownerId: gid(customerId), namespace: 'players', key: 'data', type: 'json', value: JSON.stringify(data) }],
  });
  if (d.metafieldsSet.userErrors.length) throw new Error(d.metafieldsSet.userErrors[0].message);
}

// Same rule as the theme (snippets/customer-owns-player): one entry per player unit, key <order id>-<line item id>-<unit>.
function playerUnits(c) {
  const units = [];
  for (const o of c.orders.nodes) {
    if (o.cancelledAt || ['REFUNDED', 'VOIDED'].includes(o.displayFinancialStatus)) continue;
    for (const li of o.lineItems.nodes) {
      const type = ((li.product && li.product.productType) || '').toLowerCase();
      const tags = (li.product && li.product.tags) || [];
      if (!['player', 'starter pack', 'schools pack'].includes(type) && !tags.includes('Player Bundle')) continue;
      for (let u = 1; u <= li.quantity; u++) {
        units.push({ key: `${o.legacyResourceId}-${num(li.id)}-${u}`, bought: o.createdAt.slice(0, 10) });
      }
    }
  }
  return units;
}

/* ---------- Klaviyo ---------- */

async function sendLinkEmail(email, props) {
  const r = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${env.KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json', Accept: 'application/json', revision: '2024-10-15',
    },
    body: JSON.stringify({ data: { type: 'event', attributes: {
      metric: { data: { type: 'metric', attributes: { name: 'Player link requested' } } },
      profile: { data: { type: 'profile', attributes: { email } } },
      properties: props,
      unique_id: props.request_id,
    } } }),
  });
  if (r.status >= 300) throw new Error(`Klaviyo ${r.status}`);
}

/* ---------- routes ---------- */

// Every route must come through the app proxy.
app.use((req, res, next) => {
  if (!verifyProxy(req.query)) return res.status(401).json({ ok: false });
  next();
});
const signedInId = (req) => req.query.logged_in_customer_id || '';

// POST /request  email, source  → email that address with Yes / No. Same answer whatever the email is.
app.post('/request', async (req, res) => {
  try {
    const me = signedInId(req);
    if (!me) return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    const email = String(req.body.email || '').trim().toLowerCase();
    const source = String(req.body.source || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || !SOURCES.includes(source)) {
      return res.json({ ok: false, message: 'Add an email and where the player came from.' });
    }

    const requester = await getCustomer(me);
    const data = dataOf(requester);
    const dayAgo = Date.now() - 864e5;
    data.requests = data.requests.filter((t) => t > dayAgo);
    if (data.requests.length >= MAX_REQUESTS_PER_DAY) {
      return res.json({ ok: false, message: 'That\'s a lot of requests today. Please try again tomorrow.' });
    }
    const masked = mask(email);
    const recent = data.pending.find((p) => p.email === masked && Date.parse(p.sent) > Date.now() - RESEND_AFTER_HOURS * 36e5);
    if (recent) return res.json({ ok: true }); // already sent today: say ok, don't resend

    const target = await findCustomerByEmail(email);
    const blocked = target && dataOf(target).blocked.includes(num(requester.id));
    const n = crypto.randomBytes(9).toString('base64url');
    data.requests.push(Date.now());
    if (!blocked) data.pending.push({ email: masked, sent: new Date().toISOString(), id: n });
    await saveData(requester.id, data);
    if (blocked) return res.json({ ok: true }); // the holder said no to this account before: stay quiet

    const isSelf = email === requester.email.toLowerCase();
    const token = makeToken({ r: num(requester.id), e: email, s: source, n, x: Date.now() + TOKEN_DAYS * 864e5 });
    await sendLinkEmail(email, {
      request_id: n,
      is_self: isSelf,
      requester_name: requester.firstName || '',
      requester_email: mask(requester.email),
      source,
      yes_url: `${STORE_URL}${PROXY_PATH}/confirm?a=yes&t=${encodeURIComponent(token)}`,
      no_url: `${STORE_URL}${PROXY_PATH}/confirm?a=no&t=${encodeURIComponent(token)}`,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// GET /confirm?a=yes|no&t=…  → a page in the theme that POSTs the answer (email scanners that open links don't act).
app.get('/confirm', (req, res) => {
  const a = req.query.a === 'no' ? 'no' : 'yes';
  const t = String(req.query.t || '').replace(/[^A-Za-z0-9._-]/g, '');
  liquid(res, `
<div class="container" style="max-width:560px;padding-block:48px;text-align:center">
  <h1 class="h3">${a === 'yes' ? 'Linking your player' : 'Not linking this player'}</h1>
  <form method="post" action="${PROXY_PATH}/confirm" id="player-confirm">
    <input type="hidden" name="a" value="${a}"><input type="hidden" name="t" value="${t}">
    <p>${a === 'yes' ? 'One moment…' : 'One moment…'}</p>
    <noscript><button class="button" type="submit">${a === 'yes' ? 'Yes, link it' : 'No, don\'t link it'}</button></noscript>
  </form>
  <script>document.getElementById('player-confirm').submit();</script>
</div>`);
});

// POST /confirm  a, t
app.post('/confirm', async (req, res) => {
  const page = (title, text) => liquid(res,
    `<div class="container" style="max-width:560px;padding-block:48px;text-align:center"><h1 class="h3">${title}</h1><p>${text}</p></div>`);
  try {
    const p = readToken(req.body.t);
    if (!p) return page('This link has expired', 'Ask for a new confirmation email from your account page.');
    const requester = await getCustomer(p.r);
    if (!requester) return page('This link has expired', 'Ask for a new confirmation email from your account page.');
    const rData = dataOf(requester);
    const link = `l_${p.n}`;
    rData.pending = rData.pending.filter((x) => x.id !== p.n);
    const target = await findCustomerByEmail(p.e);

    if (req.body.a === 'no') {
      await saveData(requester.id, rData);
      if (target && num(target.id) !== p.r) {
        const tData = dataOf(target);
        if (!tData.blocked.includes(p.r)) tData.blocked.push(p.r);
        await saveData(target.id, tData);
      }
      return page('Done, nothing linked', 'We won\'t send you more requests from that account.');
    }

    const already = rData.linked.some((x) => x.link === link);
    if (!already) {
      const isSelf = p.e === requester.email.toLowerCase();
      const units = target && !isSelf ? playerUnits(target) : [];
      if (units.length) {
        // Holder's own players → shown in the requester's account; holder sees "Shared with" + Unlink.
        const tData = dataOf(target);
        for (const u of units) {
          rData.linked.push({ key: u.key, bought: u.bought, registered: today(), source: p.s, owner: mask(p.e), link, peer: num(target.id) });
          tData.shared.push({ key: u.key, with: mask(requester.email), link, peer: p.r });
          if (tData.nicknames[u.key]) rData.nicknames[u.key] = tData.nicknames[u.key];
        }
        await saveData(target.id, tData);
      } else if (isSelf && p.s === 'Voxblock website' && playerUnits(requester).length) {
        // Their own website order: already listed from their orders, nothing to add.
      } else {
        // No player orders behind that email (Amazon, shop, gift, or their own email): register a player.
        rData.linked.push({ key: `r_${p.n}`, bought: null, registered: today(), source: p.s, owner: isSelf ? '' : mask(p.e), link, peer: null });
      }
    }
    await saveData(requester.id, rData);
    // Account page; Shopify sends them to sign in first if they aren't.
    return res.redirect(302, `${STORE_URL}/account`);
  } catch (e) {
    console.error(e);
    return page('Sorry, that didn\'t work', 'Please try the link again in a minute.');
  }
});

// POST /nickname  key, name   (signed-in customer, own or linked player; copied to the linked account too)
app.post('/nickname', async (req, res) => {
  try {
    const me = signedInId(req);
    if (!me) return res.status(401).json({ ok: false });
    const key = String(req.body.key || '');
    const name = String(req.body.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
    const c = await getCustomer(me);
    const data = dataOf(c);
    const own = playerUnits(c).some((u) => u.key === key);
    const linked = data.linked.find((x) => x.key === key);
    if (!own && !linked) return res.status(403).json({ ok: false });

    const setName = (d) => { if (name) d.nicknames[key] = name; else delete d.nicknames[key]; };
    setName(data);
    await saveData(c.id, data);
    const peers = new Set([...(linked && linked.peer ? [linked.peer] : []), ...data.shared.filter((x) => x.key === key).map((x) => x.peer)]);
    for (const peer of peers) {
      const pc = await getCustomer(peer);
      if (!pc) continue;
      const pd = dataOf(pc);
      setName(pd);
      await saveData(pc.id, pd);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// POST /unlink  link   (either side can unlink; removes it from both accounts)
app.post('/unlink', async (req, res) => {
  try {
    const me = signedInId(req);
    if (!me) return res.status(401).json({ ok: false });
    const link = String(req.body.link || '');
    const c = await getCustomer(me);
    const data = dataOf(c);
    const mine = [...data.linked, ...data.shared].filter((x) => x.link === link);
    if (!mine.length) return res.status(404).json({ ok: false });

    const drop = (d) => {
      d.linked.filter((x) => x.link === link).forEach((x) => { if (x.peer) delete d.nicknames[x.key]; });
      d.linked = d.linked.filter((x) => x.link !== link);
      d.shared = d.shared.filter((x) => x.link !== link);
    };
    drop(data);
    await saveData(c.id, data);
    const peer = mine.find((x) => x.peer);
    if (peer) {
      const pc = await getCustomer(peer.peer);
      if (pc) { const pd = dataOf(pc); drop(pd); await saveData(pc.id, pd); }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

module.exports = app;
