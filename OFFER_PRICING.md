# Offer pricing (automatic discount shown on the storefront)

Products keep their real list price (£9.99). An automatic discount in Shopify takes money off in the cart and
checkout; the theme mirrors that discount on product cards, search, product pages, quick view and cart-drawer
recommendations. Cart and checkout lines use Shopify's real discount data, never the tag logic.

## Setup

| Offer | Product tag | Smart collection | Automatic discount | Theme settings |
|---|---|---|---|---|
| £5.99 | `offer-599` | Offer – £5.99 (`offer-599`) | "Online offer": £4.00 off each item | `offer_tag`, `offer_amount_off` = 400 |
| £7.99 | `offer-799` | Offer – £7.99 (`offer-799`) | "Online offer – £2 off": £2.00 off each item | `offer_tag_2`, `offer_amount_off_2` = 200 |

- The tag in the theme settings, the tag in the collection rule and the amount in the discount MUST all match.
- Both automatic discounts must have "Combines with product discounts" ticked (Shopify applies only the single best
  automatic product discount per cart unless every discount involved allows combining). Without it, a cart with a
  £5.99-offer book and a £7.99-offer book discounts only one of them.
- A product with both tags gets the larger amount in the theme (Shopify applies the better discount).
- Theme settings: Customize > Theme settings > "Offer pricing". `offer_enabled` only controls the storefront
  display. Turning it off does NOT stop the discount; disable the automatic discounts in Shopify admin too.
- Logic lives in `snippets/offer-price.liquid`, wired in via `snippets/price-list.liquid` and
  `snippets/product-badges.liquid`; variant switching is handled in `assets/voxblock.js.liquid`.
- To add a book to an offer: add the tag and set the price to £9.99 with no compare-at price.
- Starter packs and bundles that use compare-at for "sum of components" are not changed by this.

## Known limitations

1. **Price filter**: Shopify's collection price filter uses the real price, so offer books (£9.99) are outside
   a "£0–£9" band and fall in "£9–£10". The theme cannot change this. Usage is very low (17 collection pageviews,
   9 visitors in 90 days to 5 Oct 2026). The price-range filter can be removed in the Search & Discovery app.
2. **Sort by price**: Shopify sorts by the real price, so offer books sort as £9.99, not the offer price.
   Usage is low (25 visitors, 42 sessions in the same 90 days, mostly "low to high"). Price sort options could
   be hidden in `snippets/collection-top-bar.liquid` and `snippets/facets-vertical.liquid` if needed.

## Other things to be aware of

- Google Shopping, Meta, TikTok and Klaviyo catalogs still send £9.99. Google may flag a price mismatch against
  the £5.99 / £7.99 shown on the page. Fix with a Merchant Center supplemental feed (`sale_price`) or promotions.
- Product JSON-LD still states the real price (£9.99) by design.
- The `custom.badges` metafield no longer contains "Online offer" (the theme's offer badge replaces it), so
  there is no "Online offer" value to filter by on collections.
- Variant dropdown labels in the no-JavaScript fallback (`snippets/variant-picker.liquid`) show the list price.
- If a tagged product's first variant costs no more than the amount off, the offer is not shown for it.

---

# Bundle pricing (packs and audiobook bundles)

Product cards for the product types in the theme setting "Bundle pricing > Product types treated as bundles"
(default `Starter Pack, Audiobooks Bundle`) use the compare-at price (the "sum of the parts") to emphasise the saving
instead of a strikethrough:

- top-left badge: `Bundle saves £20.97` (replaces the plain "Save x%" badge)
- price row: `£79.99 [saves 21%]` (percentage) with `Bought separately £100.96` underneath

Notes:
- Only applies when compare-at is above price. Packs with compare-at equal to (or below) price render as before.
- The "Bought separately" line is absolutely positioned, so cards stay exactly the same height as other cards.
- The "saves" chip hides when the price row is under ~248px wide (card under ~270px), and under ~232px the wording shortens to `Worth £100.96`
  (CSS container queries on the price row, see `assets/voxblock.css.liquid`).
- Logic: `snippets/bundle-price.liquid`, called from `price-list` (cards only, via `bundle_layout: true`) and
  `product-badges`. Card snippets: `product-card-starterpack` and `product-card-audiobooks`.
- An active offer (offer tag) takes priority over the bundle layout.
- Product page price block is NOT changed yet (still the standard compare-at strikethrough).
