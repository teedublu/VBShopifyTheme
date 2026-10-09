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
- 9 Oct: Famous Five series: `books` = Five On A Treasure Island, Five Go Adventuring Again, Five Run Away Together;
  `reading_order` on; `colour` = #BFE6DD (sea green from the covers; teal H1 4.24:1, body text 6.1:1).
- 9 Oct: new Character entries for the Famous Five, published, no photos (the series page shows their initials):
  Julian (`julian-kirrin`), Dick (`dick-kirrin`), Anne (`anne-kirrin`), George (`george-kirrin`), Timmy
  (`timmy-the-dog`). Linked through all three Famous Five audiobooks' `characters` field, in that order.
  Photo filenames to use: `famous-five-<name>-character.png`.
- 9 Oct: Horrid Henry series: `books` = Horrid Henry and Friends, Super School Stories, Perfect Pet Tales (story
  collections, so `reading_order` off); `colour` = #CDE7F6 (blue of Henry's jumper; teal H1 4.46:1, text 6.4:1).
- 9 Oct: new Character entries for Horrid Henry, published, no photos yet: Perfect Peter (`perfect-peter`), Moody
  Margaret (`moody-margaret`), Rude Ralph (`rude-ralph`), Sour Susan (`sour-susan`). Linked with the existing Horrid
  Henry entry through all three audiobooks' `characters` field. Photos to come from the owner's line-up picture
  (Peter is not in it); filenames `horrid-henry-<name>-character.png`.
- 9 Oct: photos attached to Julian, Dick, Anne, George, Timmy (`famous-five-<name>-character.png`) and Moody
  Margaret, Rude Ralph, Sour Susan (`horrid-henry-<name>-character.png`), cut from the owner's line-up pictures.
  Perfect Peter has none (not in the picture), so the page shows his initials.
- Pippi's own character photo is still the wide 1000x407 banner (also the series image), so it crops to a slice
  in the series page's circle; a square portrait would fix that. The new images have no alt text.

## Measurement
PostHog `series_page_click` { target: hero_books | pill_author | pill_narrator | pill_age | pill_genre | bundle |
add_all | add_book | book_title | book_image | related,
series, product }. Sample plays already send `sample_played` (assets/voxblock.js).

- 9 Oct: character handles renamed to `<name>-<series handle>` with redirects from the old ones (13 entries:
  tommy/annika/mr-nelson/horse-pippi-longstocking, julian/dick/anne/george/timmy-famous-five,
  perfect-peter/moody-margaret/rude-ralph/sour-susan-horrid-henry). `captain-longstocking` kept: it already names
  the series. Title characters keep plain handles (pippi-longstocking, horrid-henry).
- 9 Oct, next ten series (ranked by 12-month units), done:
  - New manual collections, published to the Online Store, books in reading order (every existing series has one,
    and the live series template shows placeholder products without one): percy-jackson-audiobooks,
    the-faraway-tree-audiobooks, the-gruffalo-audiobooks, ember-spark-audiobooks, the-worst-witch-audiobooks,
    baby-aliens-audiobooks, dave-pigeon-audiobooks.
  - Series created and published, each with books, reading order, colour (from the covers, all pass contrast),
    tagline, description, collection, image (first cover) and bundle where one exists: paddington, percy-jackson,
    the-faraway-tree, the-gruffalo, ember-spark, the-worst-witch, baby-aliens (reading order off: standalone
    stories), horrible-histories (off: non-fiction, chronological), the-boy-who-grew-dragons (the Ultimate Guide is
    last and shows as Book 6), dave-pigeon. Reading order off for Paddington too (story collections).
  - 37 characters, published, no photos (initials), linked through each audiobook's `characters` field:
    Paddington household (Mr/Mrs Brown, Judy, Jonathan, Mrs Bird, Mr Curry; Paddington and Mr Gruber already
    existed); Percy Jackson (Percy, Annabeth Chase, Grover Underwood, Luke Castellan); The Gruffalo's Child (linked
    with the Gruffalo, Mouse, Snake, Owl, Fox on that book; The Gruffalo audiobook unchanged); The Faraway Tree (Joe,
    Beth, Frannie, Moonface, Silky, Saucepan Man; this edition's names); Ember Spark (Ember, Rusty Fizzbang, Arno,
    Jasper Hornswoggle, Jasper on books 1-2 only); The Worst Witch (Mildred Hubble, Maud Spellbody, Ethel Hallow,
    Miss Hardbroom, Miss Cackle, Tabby); Baby Aliens (Izzy, Jodie, Zach, Maisie); The Boy Who Grew Dragons (Tomas,
    Flicker, Grandad; Aura from book 4); Dave Pigeon (Dave, Skipper). Horrible Histories has none.
  - "More series to try" now shows every other published series (limit 50, was 8).

## Checked on the branch's draft theme (id 199773421952), 9 Oct
- /pages/series/famous-five: photos crop to the face, book ages, pills and Good to know links all render; blurbs
  show apostrophes correctly (metafield_text double-encodes them, so blurbs come from metafield_tag | strip_html).
- /pages/character/dick-kirrin: hero circle shows the face; "Meet the others" (sections/character-cast.liquid, the
  shared snippets/character-card.liquid) lists the other four.
- The GitHub sync silently rejects a section whose schema name is over 25 characters, and then any template using
  it; a rejected template only resyncs when the file itself changes again.

## Open
- Review on the branch's draft theme, phone and desktop, all 8 series.
- Delete the API-made duplicate `VBShopifyTheme/claude/series-page` (id 199773192576): made by mistake, nothing was
  uploaded to it, identical to live. The connector cannot delete themes.
- Fields `books`, `reading_order`, `tagline`, `colour`, `bundle` were added to the Series definition on 9 Oct (empty on
  all 8 entries). Fill `books` + `reading_order` for ordered series, `bundle` for Unicorn Academy.
- 37 series with 2+ stocked titles have no Series entry yet (list in the bookdata2 session of 1 Oct).
- No listening time anywhere in Shopify; the mockup's "[Listening time]" is not built.
