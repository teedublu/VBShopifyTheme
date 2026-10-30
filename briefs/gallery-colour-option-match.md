# Brief: pack pages show the chosen colour's picture

Status: built on branch `claude/gallery-colour-option-match`, draft theme `VBShopifyTheme/claude/gallery-colour-option-match`
(id 200533246336). Not merged. Preview a product with `?preview_theme_id=200533246336`.

## Why
Owner report 23 Oct: on /products/young-explorers-starter-pack the picture does not change when a colour is chosen.

## Cause
Impact's per-variant picture sets use alt-text tags: a picture whose alt contains `#<OptionName>_<Value>` is hidden unless
that value is selected (`snippets/product-gallery.liquid` for the first render, `_getFilteredMediaIndexes` in
`assets/theme.js.liquid` after a change). The option name in the tag had to match the product's option name exactly.
Most older packs call the option "Color" and work. The newer packs call it "Colour" (Seriously Funny, Big Adventures,
Magical Worlds, Curious Minds, Finding Your Place, Worst Witch, Paddington, Percy Jackson starter packs) or "Voxblock
Audiobook Player (Color)" (The Gruffalo, Mina Mistry and Charlie intro packs, Adventure and Mystery starter pack, Explorer
bundle) while their tags say `#Color_...`. The first render hid the other colours, then the first colour click made the
script match nothing and showed everything, so the big first picture (always orange) stayed put. Young Explorers, Little
Listeners and Zeepy Sleep had no tags at all.

## Change
Loose name matching in both places (see STATUS.md entry). No settings or template changes.

## Data changes in Shopify (live)
Alt text tagged `#Colour_<Colour>` on the colour pictures of young-explorers-starter-pack, little-listeners-starter-pack
and zeepy-sleep-intro-pack. Verified by clicking every colour on the live pages.

## Measurement / checks
Draft theme: every colour on four products, plus first load with `?variant=`. Reproduce with the browser console:
click each `variant-picker input[type=radio]`, then read the first `.product-gallery__media:not([hidden])` and its `img.alt`.

## Gaps
Young Explorers has a duplicate orange pack picture (shows twice on Orange). Product cards and swatches
(`product-card-pack`, `starter-pack-card`) still use `options_by_name[color_label]`, not changed here.
