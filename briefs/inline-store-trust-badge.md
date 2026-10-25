# Brief: inline store trust badge, replacing the floating Google widget

Status: built on branch `claude/inline-store-trust-badge`, draft theme
`VBShopifyTheme/claude/inline-store-trust-badge` (id 200601698688). Not merged.
Preview: `/products/<any product>?view=starter-pack&preview_theme_id=200601698688` (no product currently uses the
`starter-pack` template by default, so `view=` forces it), or open any starter-pack product on the draft theme editor.

## Why
Tom wanted the floating "Top Quality Store on Google" badge (bottom-left popup, screenshot in chat 25 Oct) removed,
but with the reassurance it gives kept somewhere inline in a template.

## What the widget was
`layout/theme.liquid` loaded `https://www.gstatic.com/shopping/merchant/merchantwidget.js` and called
`merchantwidget.start({ position: 'LEFT_BOTTOM' })`. This is Google's own Merchant Center script: it renders live,
Google-scored data (store rating, review count, shipping/returns/pricing/payment/website-quality marks) that we have
no API access to reproduce. Removing it also stops an unaccountable third-party script running on every page.

## Decision (Tom, 25 Oct 2026)
Recreate the same categories and the same numbers (5.0, 216 reviews, "Exceptional" on all five rows) as hand-maintained
theme-editor settings, dropping the "on Google" framing since it's no longer Google's own live badge — these become
the merchant's own claims to keep accurate, not an automated score.

## Change
- `layout/theme.liquid`: removed the MerchantWidget script block entirely.
- New block type `store_trust` on `main-product` (schema in `sections/main-product.liquid`): heading, rating, review
  count, reviews link, and five rows (shipping, returns [+ note], competitive pricing, payment options [+ note],
  website quality), each a plain text setting so Tom can edit the wording without a code change.
- New snippet `snippets/store-trust-badge.liquid` renders the card; wired into `snippets/product-info.liquid` under
  `when 'store_trust'`.
- New locale keys `product.store_trust.*` (row labels) in `locales/en.default.json`.
- New CSS (`.store-trust*`) in `assets/theme.css`, built from the theme's existing spacing tokens, border/radius
  variables and `.text-with-icon` / `.text-success` utilities (same pattern as the inventory "In stock" line).
- Added one `store_trust` block to `templates/product.starter-pack.json`, placed right after Buy buttons, linking
  "216 reviews" to `/pages/reasons-to-buy-voxblock` (the existing Trustpilot-reviews page). This is the only template
  it's on; it's a reusable `main-product` block so it can be dropped into any other product template from the theme
  editor once Tom's happy with it.

## Verified
- `shopify theme check` clean (the one `LiquidHTMLSyntaxError` in `theme.liquid` and the `OrphanedSnippet` warnings on
  `product-info.liquid` / `store-trust-badge.liquid` are pre-existing false positives, confirmed against `main` before
  this branch).
- Pushed to the draft theme; local file md5s match the theme API's `checksumMd5` for all four changed files checked.
- Previewed `gruffalo-and-friends-starter-pack?view=starter-pack&preview_theme_id=200601698688` on desktop and mobile
  (375px) widths: card reads cleanly under Buy buttons, above Product Details; "216 reviews" links to
  `/pages/reasons-to-buy-voxblock`; confirmed via network log that `merchantwidget.js` no longer loads on the page.

## Gaps / follow-ups
- Only on `product.starter-pack.json`. Tom said "try it out" there first — adding it elsewhere (other product
  templates, or the footer for something closer to the old widget's every-page reach) is a separate step.
- `ARCHITECTURE.md` (Drive, OPS folder) has a "Google Ads + Merchant Center" line that doesn't mention this widget by
  name, so nothing there is currently wrong — but once this branch is live, add a line noting the Merchant widget
  script is gone from `layout/theme.liquid`. Not done in this session since the branch isn't merged/published yet.
