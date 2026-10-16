# Player link service

Backend for the account page's "Your players" card (`sections/account-player-registration.liquid`). The theme can't
send email or save data to a customer, so this small service does it. **Not deployed yet.**

Runs as a Catalyst Advanced I/O function in the existing project **Voxblock-Storefront** (org Voxblock), reached only
through a **Shopify app proxy**, so every call arrives signed by Shopify with the signed-in customer's ID. No secret
in the theme.

## Flow
1. Signed-in customer A enters an email + where the player came from → `POST /apps/voxblock/players/request`.
2. Service emails that address through Klaviyo (metric **Player link requested**, template `klaviyo-email.html`)
   with **Yes** / **No**. The screen always says the same thing, so it can't be used to test whether an email is a
   customer or has a player.
3. **Yes** → link page → the answer is posted (link scanners that open emails don't trigger it) → redirect to
   `/account` (Shopify asks them to sign in first if needed).
   - Email has player orders on the site: those players appear in A's account as "Linked with t\*\*\*@g\*\*\*\*.com";
     the holder sees "Shared with a\*\*\*@h\*\*\*\*.co.uk" on the same players. Either side can **Unlink** (removes it
     from both).
   - No player orders behind that email (Amazon, a shop, a gift, or A's own email): a player is registered on A,
     dated the day it was confirmed.
4. **No** → nothing linked, and that account can't send this email more requests.
5. "This player belongs to" names are saved per player and copied to the linked account.

## Routes (all via the app proxy, all check Shopify's signature, max 5 min clock skew)
| Route | Who | Does |
|---|---|---|
| `POST /request` email, source | signed-in customer | rate limit (5/day; same email once per 24h), store pending, send Klaviyo event |
| `GET /confirm?a=yes\|no&t=` | anyone with the email link | Liquid page that auto-posts the answer |
| `POST /confirm` a, t | token holder | link / register / decline + block |
| `POST /nickname` key, name | signed-in customer who can see that player | save name (30 chars), copy to linked account |
| `POST /unlink` link | either side of the link | remove from both accounts |

Tokens: HMAC-signed (TOKEN_SECRET), 7 days, contain requester ID, email, source, request ID. Re-clicking Yes does
nothing new.

## Data: customer metafield `players.data` (JSON), written only by this service
```json
{
  "nicknames": { "6012345678-1500012345-1": "Isla" },
  "linked":  [{ "key": "…", "bought": "2025-11-28", "registered": "2026-10-16", "source": "A gift", "owner": "t***@g****.com", "link": "l_x", "peer": "123" }],
  "shared":  [{ "key": "…", "with": "a***@h****.co.uk", "link": "l_x", "peer": "456" }],
  "pending": [{ "email": "t***@g****.com", "sent": "2026-10-16T10:00:00Z", "id": "x" }],
  "requests": [1792000000000],
  "blocked": ["789"]
}
```
Player keys match the theme: `<order id>-<line item id>-<unit>` for bought players, `r_<id>` for registered ones.
The theme never prints `peer`, `requests` or `blocked`.

## Setup (owner, in this order)
1. **Shopify app** (the one whose client ID is already in `shopify_proxy`'s env): scopes `read_customers`,
   `write_customers`, `read_orders`; **App proxy**: prefix `apps`, subpath `voxblock`, URL
   `https://<catalyst domain>/server/player_link/players` → storefront path `/apps/voxblock/players`.
   Orders older than 60 days need `read_all_orders` for linking older players.
2. **Metafield definition** in Shopify admin: Customers → `players.data`, type JSON, storefront access **read**.
3. **Catalyst**: deploy this folder as function `player_link` in Voxblock-Storefront (`catalyst deploy`), env vars
   `SHOPIFY_SHOP`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `KLAVIYO_PRIVATE_KEY` (scope events:write),
   `TOKEN_SECRET` (new random 32+ chars), `STORE_URL`, `PROXY_PATH`. Move to Production when tested.
4. **Klaviyo**: flow on metric "Player link requested" with `klaviyo-email.html` (send one test event first so the
   metric exists).
5. Test on the draft theme with two test customers: request → email → Yes → both accounts → nickname → unlink.

## Abuse and how it's handled
- **Claiming someone else's player**: nothing links until the person behind that email clicks Yes.
- **Finding out who's a customer**: same response for every email; nothing about the email is shown until it's
  confirmed, and then only masked.
- **Spamming someone with emails**: 5 requests per account per day, one per email per 24h, and No blocks that
  account from asking that email again.
- **Forged calls**: only accepted through the app proxy with Shopify's signature; tokens are signed and expire.
- **Email scanners clicking links**: the link opens a page that posts the answer; scanners that only fetch don't act.
- **Fresh guarantee on an old player**: registered (non-website) players run from the confirmation date. Owner
  decision: accept, or ask for a receipt when a guarantee claim is made (recommended: keep the receipt rule in the
  guarantee terms).
