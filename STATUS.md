# STATUS

## Performance: pages to check in the next site performance review
Owner's standing request (9 Oct): every page we improve gets its performance checked in the next site performance
review, phone first (Lighthouse / Core Web Vitals, plus server render time). Add each improved page type here.
- Series pages `/pages/series/<handle>` (PR #65): per-book data pass (authors, narrators, characters, facts), three
  eager hero covers, BookSeries JSON-LD. Sample: pippi-longstocking, the-boy-who-grew-dragons (6 books), paddington.
- Character pages `/pages/character/<handle>` (PR #65): character-cast section. Sample: dick-famous-five.
- Audiobook product pages (PR #65): "Series link" block scans every series' book list on each render. Sample:
  pippi-longstocking-goes-aboard, akimbo-and-the-lions (collection fallback, the slower path).
- /pages/voxblock-vs-yoto (vs-hero) and /collections/voxblock-starter-pack-collection (pack redesign), both improved
  earlier.

## 2026-10-09: Age audiobook collections, new template (build)
Branch `claude/age-collection-template`, draft PR into `main`, **awaiting owner check on draft theme 199795245440**.
Full record, baseline and flags: `briefs/age-collection-template.md`.
- `collection.audiobooks-landing-cat` (under 5s, 5–8, 8–10, 10-to-teens, mystery): new `collection-age-intro` section
  (short band, trust row, age tabs, featured starter pack), "How Voxblock works" grid row (`promotion_howto` block in
  main-collection), description moved to `collection-about` under the grid. Old sections kept, disabled.
- Cart drawer (site-wide): "Stories play on a Voxblock player" prompt when the basket has stories but no player.
- Tracking: PostHog `age_collection_click`, `cart_player_prompt`.
- Performance review: add /collections/audiobooks-5-8-years (sample) to the next check.

## 2026-10-09: Series pages, one template for every series (build)
Branch `claude/series-page`, PR teedublu/VBShopifyTheme#65 into `main`, **awaiting owner review on the branch's
draft theme (199773421952)**. Full record, data model and open items: `briefs/series-page.md`.
- New `sections/series-page.liquid` (hero, books, characters, about), `sections/series-related.liquid`,
  `snippets/series-jsonld.liquid`; `templates/metaobject/series.json` rebuilt; CSS block at the end of voxblock.css.
- Works with today's data: books = series collection products linked to an audiobook entry (bundles, packs and
  strays left out). Optional Series fields `books`, `reading_order`, `tagline`, `colour`, `bundle` improve it.
- Tracking: PostHog `series_page_click` { target, series, product }.

## 2026-10-08: /pages/voxblock-vs-yoto mobile-first hero, "Option B" (merged)
Built on `claude/practical-wright-7z6szw`, previewed on draft theme `VBShopifyTheme/claude/practical-wright-7z6szw`
(id 199704314240, a duplicate of the live theme with the changed files pushed by API). Owner approved on 8 Oct and the
branch was merged to main by pull request; the GitHub integration then updates the live theme from main.
- New section `sections/vs-hero.liquid` replaces the media-with-text hero and the `press` quote at the top of
  `templates/page.voxblock-vs-yoto.json`. Everything from "1 · The player on its own" down is unchanged, with two
  deliberate exceptions (below). Rendered HTML was diffed against live before merge.
- Live, nothing hard-coded: Voxblock price = cheapest variant of `voxblock-player` (No bumper, £49.99; Orange/Green/Red/Blue
  are £59.99); button "from" = cheapest available product in `voxblock-starter-pack-collection` (£59.99).
  Yoto prices are section settings. The H1 "£40 less" = Yoto Mini setting minus live player price; if that cannot be worked
  out (equal/negative, unreadable, other currency) the H1 falls back to wording without a number.
- Tracking: PostHog `vs_yoto_hero_click` { target: starter_packs | full_comparison, page }. No pixel events.
- Yoto prices last checked 8 Oct against Google-indexed uk.yotoplay.com pages only (the site is blocked from the sandbox):
  Mini (4th Gen) £89.99, Player (4th Gen) £119.99, unchanged. The page still says "checked 24 September 2026": re-check in
  a browser, then bump `prices_checked` in the VS hero section settings and the footnote text.
- Two changes outside the hero, both agreed with the owner: (1) "Similar yet different" now says "nothing to set up"
  instead of "no app to set up" (copy rule); (2) the repo's "Gruffalo Starter Pack" button link
  (`gruffalo-and-friends-starter-pack`, published) replaces the live theme's `...-pack-set` link, an unpublished duplicate
  product that 404s. The live theme had been edited in the theme editor without that edit reaching the repo.
- Still open, not changed: the "Player on its own · £49.99" button links to the Orange variant (£59.99); hero says IndyBest
  2025 but the footnote says 2026; the footnote says both Yoto players are on pre-order, but the Mini's listed dispatch
  date was 30 Sep.

## 2026-10-06: Starter pack collection, age bands and copy (GRO)

Scope: the 18 products in /collections/voxblock-starter-pack-collection that are active and published to the
Online Store (9 drafts/archived duplicates in the collection were left alone). Proposal approved "as proposed";
full table in `working/starter-pack-age-bands-proposal.md` (git-ignored, local only).

Applied, then re-read from the store to confirm (all 18 products checked):
- `book.age_groups` metafield (existing filter metafield, values 35/58/810/12 = Under 5's / 5 to 8 years /
  8 to 10 years / 10 to teens) changed on 4 packs, the other 14 already matched:
  bedtime-stories-starter-pack -> ["35","58"]; famous-five-intro-pack and famous-five-starter-pack -> ["58","810"];
  the-percy-jackson-starter-pack -> ["12"].
- Tag `Gift Set` added to the-ultimate-gift-bundle (gift flag for the "Gift sets" chip; not an age value).
- Descriptions: "no app(s)" replaced in 16 products ("no downloads, no streaming" in the standard copy, "no downloads"
  in the three custom ones); Bedtime Stories now lists "Old Bear and Friends"; Young Explorers lists
  "Wigglesbottom Primary Vol. 1". No "no app" remains in any of the 18.

Decisions taken (defaults): Famous Five = 5 to 8 + 8 to 10 (books are 5-12); Percy Jackson = 10 to teens only;
Young Explorers = 5 to 8 only.

Still open:
- zeepy-sleep-intro-pack: NOT changed. Components are only the player + Zeepy Sleep Podcast, but the copy calls it the
  "Sleep Starter Bundle", mentions "a collection of stories" and never mentions player, bumper or cable. Draft copy is in
  the proposal (marked CONFIRM CONTENTS). Needs contents confirmed.
- Gift sets filter: currently a tag. If Search & Discovery can't filter on it, create a `pack.gift_set` metafield instead.
- Search & Discovery: age_groups filter must be enabled for the packs' collection and the "Gift Set" chip built.
- Description link problems found, not fixed (out of scope): paddington-starter-pack links go to voxblock.co.uk/<handle>
  without /products/; roald-dahl-selection-starter-pack links "Charlie and the Chocolate Factory" to the George's
  Marvellous Medicine page; worst-witch-starter-pack has an empty stray link to A Bear Called Paddington.
- Correction to the earlier proposal message: 16 products needed the copy change (13 standard + 3 custom), not 17.
- Note: STATUS.md / HANDOFF.md for the GRO project were not found in VBShopifyTheme or any repo I could list, so this
  entry is in a new STATUS.md here. Move it to the GRO repo if that is where STATUS.md lives.


## Starter pack collection redesign (build)
Built on `claude/trusting-shannon-lvl85h`, draft theme 199560855936, **awaiting owner check on phone + desktop; no PR/merge yet**.
Full record, baseline table and flags: `briefs/starter-pack-collection-redesign.md`.
Open: enable `pack.gift_set` as a Search & Discovery filter (Gift sets chip); set `help_url` when the chooser ships;
decide 4 vs 5 per row on desktop; 30-day PostHog re-read after launch.
