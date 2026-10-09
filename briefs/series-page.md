# Brief: Series page template (every /pages/series/<handle>)

Status: branch `claude/series-page` (from `main`), pushed to GitHub. **Owner to connect it as a draft theme and review
phone + desktop on all 8 series; PR into `main` only after that.**
Design: canvas "Series Page Mockup" (https://claude.ai/artifact/NwbC8DPGv8wVUjpmK1j25m), drawn for Pippi Longstocking.

## Why
The old template was a heading, the series' long description and a product carousel of the series collection. The
collection mixes single books with bundles (both copies of each pack), starter packs and unrelated items (Pippi's
showed "Summer Younger Listeners Bundle" and the Younger Listeners Starter Pack), so the carousel was not a list of
the series' books. Nothing linked a book to its series, which is why every Series entry showed 0 references.

## What changed
- New section `sections/series-page.liquid` with four blocks (hero, books, characters, about). One data pass at the
  top resolves the books and gathers authors, narrators, characters, reading levels, key stages, ATOS range and
  genres from each book's audiobook entry, so every block reads the same list.
- New section `sections/series-related.liquid`: the other series, from the Series metaobjects (new series appear
  automatically).
- New snippet `snippets/series-jsonld.liquid`: BookSeries structured data with the books (positions when ordered).
- `templates/metaobject/series.json`: breadcrumbs, series page, the existing "how to listen" video, more series,
  microdata. The old rich text and featured collection sections are removed.
- CSS: "SERIES PAGE" block at the end of `assets/voxblock.css.liquid`. The H1 keeps the site-wide H1 style.

## Data: what the page reads
Works today with no data changes. Each optional Series field below improves it when added to the definition:

| Field (key) | Type | Used for | Without it |
|---|---|---|---|
| `books` | list.product_reference | the books, in reading order | products in `collection` linked to an audiobook entry, in collection order |
| `reading_order` | boolean | numbers, "Listen in order", "Start with book 1" | no numbers (best-selling order is not a reading order) |
| `tagline` | single_line_text_field | hero line | `page_description` |
| `colour` | color | hero band | block setting (#ffead7); text turns white on dark colours |
| `bundle` | product_reference | "The whole series" | collection product titled "<series> … Audiobook Bundle", static `-set` copies skipped; else an "Add all" form |

The bundle saving is the bundle's own books (`bundles.products`) bought singly minus the bundle price, shown only when
positive. Unicorn Academy has several bundles; the fallback picks none of them unless one is set in `bundle`.

## Data changes in Shopify
- 9 Oct: Series definition gained `books`, `reading_order`, `tagline`, `colour`, `bundle`.
- 9 Oct: Pippi Longstocking series: `books` = Pippi Longstocking, Goes Aboard, In the South Seas; `reading_order` on.
- 9 Oct: Pippi Longstocking series `colour` = #FFD23F (the mockup yellow; teal H1 on it is 3.96:1, passes as large
  bold text; body text 5.7:1).
- 9 Oct: new Character entries, published (photos attached the same day, `pippi-longstocking-<name>-character.png`): Tommy (`tommy-settergren`), Annika (`annika-settergren`),
  Mr Nelson (`mr-nelson`), Captain Longstocking (`captain-longstocking`), Pippi's horse (`pippis-horse`). Father and
  horse names are placeholders: the names this translation uses were not known. Linked through each Pippi audiobook's
  `characters` field (Pippi first; Captain Longstocking on Goes Aboard and South Seas only), so they also appear on
  the audiobook pages and have their own /pages/character/<handle> pages.
- Pippi's own character photo is still the wide 1000x407 banner (also the series image), so it crops to a slice
  in the series page's circle; a square portrait would fix that. The new images have no alt text.

## Measurement
PostHog `series_page_click` { target: hero_books | pill_author | pill_narrator | pill_age | pill_genre | bundle |
add_all | add_book | book_title | book_image | related,
series, product }. Sample plays already send `sample_played` (assets/voxblock.js).

## Not checked yet
Nothing has been rendered: Liquid needs a Shopify theme to run. `shopify theme check` is clean for the new files
(one OrphanedSnippet warning on `series-jsonld`, a false positive: the section renders it).

## Open
- Review on the branch's draft theme, phone and desktop, all 8 series.
- Delete the API-made duplicate `VBShopifyTheme/claude/series-page` (id 199773192576): made by mistake, nothing was
  uploaded to it, identical to live. The connector cannot delete themes.
- Fields `books`, `reading_order`, `tagline`, `colour`, `bundle` were added to the Series definition on 9 Oct (empty on
  all 8 entries). Fill `books` + `reading_order` for ordered series, `bundle` for Unicorn Academy.
- 37 series with 2+ stocked titles have no Series entry yet (list in the bookdata2 session of 1 Oct).
- No listening time anywhere in Shopify; the mockup's "[Listening time]" is not built.
