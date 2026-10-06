# Brief: Starter Pack collection redesign

Status: built on branch `claude/trusting-shannon-lvl85h`, draft theme `VBShopifyTheme/claude/trusting-shannon-lvl85h`
(id 199560855936). **Not merged. PR only after the owner has checked phone + desktop preview.**
Note: `briefs/_TEMPLATE.md`, HANDOFF.md and claude/page-building-blocks.md do not exist in this repo, so this follows a
plain template (why / what / data / settings / measurement / gaps).

## Why
1,244 first-ever visits started on /collections/voxblock-starter-pack-collection in the 90 days to 6 Oct (88% of
landers, ~70% paid, 90%+ phone). The first product started at 946px on 375x812.

## What changed (template `collection.starter-pack-collection.json`)
1. Empty rich_text removed. 2. 779px media-with-text hero replaced by section `collection-pack-intro` (peach band,
eyebrow, H1, one line, small crop of SP_Page-Hero_Image). 3. Pack explainer in the same section; prices read live from
the collection / `voxblock-player` (Intro £59.99, Starter from £69.99, player £49.99 at build time; nothing hard-coded).
4. Sticky age bar (`snippets/collection-age-bar.liquid`): All packs / Under 5 / 5 to 8 / 10+ / Gift sets, count, sort.
AJAX through the theme's `facet:update`; GET-form fallback without JS; `aria-pressed`, 44px targets; a chip is hidden
if its Search & Discovery filter value does not exist. 5. Bar sticks at `--sticky-area-height` (measured header +
announcement height), verified 46px mobile / 72px desktop on the real preview. 6. Pack cards (`product-card-pack`,
selected by section setting `card_style = pack`): contents line, age line, Save %, Bestseller, swatches, price #C2560F,
price/swatches pinned bottom (all cards in a row equal height). 7. Order set in Shopify (see data). 8. "Help me choose":
slot built (desktop bar link, mobile card) but `help_url` is blank, so it is not shown. 9. Reviews, image-with-text,
FAQ unchanged. Old hero/banner sections disabled, promo video block disabled.

## Data changes in Shopify
- Collection manual order: Young Explorers, Little Listeners, Zeepy first, then the rest (live now; original order not
  recorded elsewhere: restore by re-ordering in admin if the redesign is dropped).
- Zeepy Sleep Intro Pack copy: "Voxblock player, the Zeepy Sleep Podcast on its own bedtime block, a bumper and a charging
  cable"; included in the grid (contents confirmed by owner).
- New boolean metafield `pack.gift_set` (storefront readable, admin filterable), true on the-ultimate-gift-bundle.
  **Needs enabling in Search & Discovery > Filters** (no API) before the Gift sets chip appears.

## Verification (draft theme, Chromium against the real preview)
390x844: first row prices end at 834px (fold 844). 1440 desktop: 5 columns, equal card heights, price rows aligned, bar
stuck directly under header, no horizontal overflow. Real data: 18 packs, ordered as above. Filtering: chip click
updates the URL and requests the section without navigation. Not testable here: Shopify CDN is blocked in this sandbox
(Shop pay script error in console is that), and physical phone.

## Measurement
Event `collection_filter_used` { filter, collection } fires on every chip click ("all" when reset).
Baseline (sessions entering on this page, 90 days to 8 Jul-6 Oct, PostHog; cart = `product_added_to_cart`, purchase =
`checkout_completed`, same session; first_visit = person's first-ever event is in that session):

| Channel | Visit | Sessions | Carts | Cart % | Purchases | Purch % |
|---|---|---|---|---|---|---|
| Paid Social | first | 493 | 14 | 2.8 | 0 | 0 |
| Paid AI | first | 315 | 2 | 0.6 | 0 | 0 |
| Internal | returning | 171 | 8 | 4.7 | 2 | 1.17 |
| Direct | first | 159 | 3 | 1.9 | 0 | 0 |
| Referral | first | 119 | 9 | 7.6 | 1 | 0.84 |
| Direct | returning | 109 | 4 | 3.7 | 1 | 0.92 |
| Organic Search | first | 97 | 8 | 8.2 | 2 | 2.06 |
| Organic Search | returning | 65 | 7 | 10.8 | 2 | 3.08 |
| Paid Search | first | 57 | 0 | 0 | 0 | 0 |
| Paid Social | returning | 45 | 3 | 6.7 | 0 | 0 |
(smaller rows omitted: Organic Social, Email, Referral returning, Paid AI returning, Paid Unknown, Internal first.)
Caveats: same-session conversion only; sessions that later purchase elsewhere are not counted; small numbers.
Re-read 30 days after launch with the same query (sessions table `$entry_pathname`, events by `$session_id`).

## Known gaps / flags
- Gift sets chip hidden until the Search & Discovery filter is enabled.
- Ultimate Gift Bundle carries age "Under 5" from its metafield: check that is intended.
- Desktop shows 5 per row (canvas) vs 4 previously approved: setting `products_per_row_desktop`.
- Default sort label reads "Featured" (manual order), not "Bestselling".
- Contents line follows "named books where short" (else "Player + N stories"), not the canvas's hand-written lines.
- "Help me choose" chooser exists only on the `starter-pack-finder` branch; set `help_url` when it ships.
- Stray tag "1001 Nights" noticed on a product; FF Intro and Zeepy lack the "Intro Pack" tag (the intro tile handles
  this by bundle size).
