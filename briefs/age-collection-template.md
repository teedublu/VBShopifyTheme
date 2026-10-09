# Brief: Age audiobook collections (template `collection.audiobooks-landing-cat`)

Status: built on branch `claude/age-collection-template`, draft theme `VBShopifyTheme/claude/age-collection-template`
(id 199795245440, a duplicate of the live theme with the changed files pushed by API). **Not merged; awaiting owner check
on phone + desktop.** Design canvas: "Age Collection Template".

## Why
PostHog, 30 days to 9 Oct, sessions by first page: the age collections are mostly non-brand organic visits from parents
who do not own a player yet, and very few of them reach the player or packs.

| First page | Sessions | Bounce | Added player/pack | Purchased |
|---|---|---|---|---|
| /collections/audiobooks-5-8-years | 224 | 52% | 1.3% | 0.4% |
| /collections/audiobooks-8-10-years | 104 | 62% | 1.0% | 1.0% |
| /collections/audiobooks-10-to-teens | 40 | 63% | — | 0% |

On 375x812 the first product started at ~927px, under a 100+ word orange banner. The player was explained only in a small
"Learn more" tile after nine products, with no price.

## What changed
Template uses (collections): voxblock-audiobooks-under-5s, audiobooks-5-8-years, audiobooks-8-10-years,
audiobooks-10-to-teens, childrens-mystery-audiobooks. (Older listeners has its own template, not changed.)
1. `sections/collection-age-intro.liquid` (new): cream band with eyebrow, H1, one line, trust row (4.9 on Trustpilot,
   free delivery over £25, money-back guarantee → /pages/voxblock-happiness-guarantee), age tabs, and a
   "New to Voxblock? Start here" starter pack card (image, contents, live price, Save %, colour swatches, add to basket,
   "See all packs", "Player only, £49.99" = cheapest player variant). One "Age collection" block per collection sets
   tab label, H1, eyebrow, line, age wording and featured pack:
   under 5s → Little Listeners; 5–8 → Young Explorers; 8–10 → Roald Dahl Selection; 10+ → Percy Jackson.
   Collections without a block (Mystery) get the section defaults and Young Explorers.
2. "Already have a player?" + "90 stories for ages 5–8" line above the grid.
3. `main-collection` gets a block type `promotion_howto` (`snippets/collection-howto-promo.liquid`): full-width row
   before product 7 with the IMG_5604 photo, three steps, "No screen, no downloads, no subscription", buttons to starter
   packs and player only. Sort is now shown.
4. `sections/collection-about.liquid` (new): the collection description, closed `<details>` under the grid.
5. Cart drawer: `snippets/cart-player-prompt.liquid` shown when the basket has audiobooks (types Audiobooks, Audiobooks
   Bundle, Older Audiobooks) but nothing with a player (types Player, Starter Pack, Schools Pack, or tag Player Bundle).
   Offers the starter pack (setting, default young-explorers-starter-pack) or the player's cheapest variant;
   "I already have a player" hides it in that browser (localStorage `vb_has_player`). Setting "Show the prompt" in the
   cart drawer section turns it off. Applies site-wide, not only on these pages.
6. Signed-in customers who have bought a player never see the pack card, the how-it-works row or the basket prompt
   (`snippets/customer-owns-player.liquid`, checks their orders).
7. Old banner, image link blocks, bottom image banner and the two old promo tiles are kept in the template, disabled.

## Tracking (PostHog)
- `age_collection_click` { target: tab:<handle> | starter_add | pack_title | all_packs | player | howto_packs |
  howto_player, collection }
- `cart_player_prompt` { action: shown | add_pack | add_player | dismiss } (`shown` once per page view)
Re-read 30 days after launch: same session funnel as the baseline (sessions by first page; player/pack ATC =
`product_added_to_cart` with a bumper-colour variant; purchase = `checkout_completed`), plus prompt shown → add rate.

## Verified on the draft theme (built-in browser)
375x812: H1, trust row, tabs and the pack card with price and button above the fold; how-it-works row before product 7;
no horizontal overflow; no Liquid errors on all five collections; correct pack / H1 / current tab / count per collection.
Swatch changes the variant added. Basket: audiobook only → prompt shows; adding the player from it → prompt gone.
1280: two-column band (text + tabs left, pack card right).

## Open / flags
- Prices use the site-wide "accent strong" colour, currently #ff9e57 in settings_data (light orange, below 4.5:1 on white).
  The theme default is #C2560F. Changing the setting fixes every price at once (pack cards too).
- Featured pack per age is a guess for 8–10 (Roald Dahl Selection, ages 5–10) and 10+ (Percy Jackson); change in the
  theme editor block.
- Owner recognition only works for signed-in customers; others rely on "I already have a player".
- Collection SEO titles/meta (separate task) are unchanged.
