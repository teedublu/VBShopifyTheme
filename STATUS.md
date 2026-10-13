# STATUS

## Working rule (owner, 11 Oct 2026)
Style changes are theme-wide: theme settings, `css-variables`, or a shared rule in `voxblock.css`. No colour, size or
button styling set on one section or template unless the owner explicitly agrees it, otherwise sections drift.
Contrast problems are fixed in the theme colour settings, never patched per section.

## App scripts (owner, 11 Oct)
- Done in `layout/theme.liquid` (homepage branch): Trustpilot script tags removed site-wide (no widgets used; invitations unaffected), the two legacy BOGOS "secomapp" script tags removed (BOGOS app embed stays), Zigpoll removed on the homepage only. Exact-match removals from content_for_header: if Shopify changes the format nothing is removed. Check free gifts still apply in the cart before merging.
- Open, own branch: PostHog loads three ways (theme script in layout/theme.liquid, "PostHog Custom Pixel", "VoxHog" pixel). Owner: needs care, separate branch.

## Copy rules (owner, site-wide, apply to every page)
- Sentence case for every heading, eyebrow and button; only names keep capitals (Voxblock, Roald Dahl, Yoto, UK).
- "Children" in body copy; "kids" only where people search with it (title tag, meta description, an FAQ question).
- No "no apps" claims (a Voxblock app is coming for MYO): say no downloads, no streaming, no wifi, no subscriptions, nothing to set up. Customer quotes stay as written.
- Facts: age range in copy is "toddlers to teens" (owner, 12 Oct; minimum age 3 stays in factual age answers), battery up to 16 hours, 350+ audiobooks, free UK delivery over £25, 100-day money-back guarantee. No prices hard-coded in copy.

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
- Homepage `/` (homepage-kids-player): new FAQ section, rewritten hero and Meet Voxblock copy.
- Children's CD player page `/pages/childrens-cd-player-alternative` (new template, once the page exists in admin).
- Children's cassette player page `/pages/modern-cassette-player` (new template, once switched in admin).

## Open: site-wide colour contrast (owner: must be resolved)
Measured on the draft theme 11 Oct (WCAG AA needs 4.5:1 for small text, 3:1 for large headings and buttons):
- Eyebrows in theme orange #ff9e57 on white/cream: 2.0:1 (fails). Owner chose the theme orange for now; fix by a deeper orange (e.g. #c2560f, ~4.6:1) as its own setting, keeping the button orange.
- Buttons: white text on orange #ff9e57 (2.0:1) and on light teal #4cb6ac (2.4:1); orange outline-button text (2.0:1).
- White headings on light-teal FAQ and newsletter bands (2.4:1): homepage, product pages, schools, landing pages.
- Cream stats ("350+", "30.5m") on the orange impact band (1.9:1): homepage.
One change in theme colour settings (accent, secondary button, band backgrounds), then rescan every template.
- Buttons now follow the theme everywhere (176 per-section colours cleared). Still separate from the theme button: CSS-built buttons in voxblock.css (`series-button`, `pack-chip`, `coming-soon-pill`, pack card add button) and the secondary "Add to cart" in light teal #4cb6ac. Bring these into the theme button styles in the contrast pass.

## 2026-10-13: Structured data fixes, PR A (JSON-LD correctness)
Branch `claude/jsonld-fixes-a`, draft PR into `main`, **awaiting owner check on its draft theme**. Review: LPS `claude/jsonld-review.md`.
- Shipping: `GB` (was `UK`, invalid); £3.50 under £25, free from £25 (owner, 13 Oct). Unconfirmed order cut-off time removed.
- Returns: `GB`; player and starter packs/bundles 100 days, free, by post; everything else 30 days, customer pays (owner, 13 Oct).
- Player, pack and other non-audiobook product pages now carry shippingDetails and hasMerchantReturnPolicy (they had none). Gift cards excluded. Weight uses UN/CEFACT codes, omitted when 0.
- Product JSON-LD only on /products/ pages: removed from `featured-audiobook-light` (audiobook, author, narrator, read-along pages) and from the audiogramme graph (owner agreed, 13 Oct).
- Video: real thumbnail (was the "no image" placeholder), https contentUrl, no empty embedUrl, section JSON-LD title on non-audiobook pages (player video was "Transcript of Voxblock Audiobook Player Audiobook"). No script when there is nothing to describe.
- Audiobook pages: image URL fixed (was a 404). Narrator pages: no placeholder image.
- Check after merge: Rich Results Test on player, a pack, an audiobook product, an audiobook page, homepage; Search Console Merchant listings and Videos reports in 2–4 weeks.
- Review 13 Oct (follow-up commit): YouTube videos get embedUrl only; video duration added; empty video script check hardened; gift cards (digital and physical) get no shipping/returns; fixed 1024 × 1024 image size claims removed.
- **Open before merge:** Shopify gives free UK delivery from £24.00 (Free Shipping ≥ £24.00, Standard £3.50 up to £24.99), but the site says over £25 and this PR uses £25. Travel Case and Headphones (£24.99) would show £3.50 here but ship free. Align Shopify to £25 or set `free_delivery_from` to 2400.
- **Open before merge:** Explorer Bundle + Voxblock Player (£99.99, type Accessories) gets the 30-day policy; schools packs and accessories assumed 30 days, customer pays.
- PR B (next): Organization node with @id, @id scheme, one product snippet, `| json` escaping, hard-coded dates, unused snippets, one FAQPage per page, character typing.

## 2026-10-12: Children's cassette player page (build)
Branch `claude/childrens-cassette-player-page` (stacked on the CD page branch, PR #83), draft theme
`VBShopifyTheme/claude/childrens-cassette-player-page`, draft PR, **awaiting owner check**. Record: `briefs/childrens-cassette-player-page.md`.
- Rebuilds the existing `/pages/modern-cassette-player` (live since Feb 2024, a text essay, 1,429 impressions, 0 clicks) on a new
  template `page.childrens-cassette-player-alternative`, targeting "children's cassette player" (260 a month, 480 in Nov) with
  "modern cassette player" (140) secondary. Same structure and copy rules as the CD page.
- Title/meta are keyed on the template suffix, so nothing changes on the live page until its template is switched in admin.
- Admin after merge: switch that page's template, add to the Compare menu.

## 2026-10-12: Children's CD player page (build)
Branch `claude/childrens-cd-player-page`, draft theme `VBShopifyTheme/claude/childrens-cd-player-page`, draft PR into `main`,
**awaiting owner check on the draft theme**. Brief: LPS `briefs/brief-childrens-cd-player-page.md`. Full record,
differences from the brief and open questions: `briefs/childrens-cd-player-page.md`.
- New template `page.childrens-cd-player-alternative` (alternative-page structure): hero, trust row, "why parents still
  look for a CD player", comparison table vs a children's CD player, how it works, four age packs, three reviews, closing
  band, 6-question FAQ, cross-links, small print. Title/meta set in `layout/theme.liquid`. One FAQ line added on the homepage.
- Shared sections: `story-steps` gets an optional `anchor_id`; `comparison-table` an optional `cta_track`. Both off by default.
- Tracking: PostHog `vs_yoto_click` targets `cd_page_hero`, `cd_page_table`, `cd_page_pack`.
- Admin: page created unpublished 12 Oct (handle `childrens-cd-player-alternative`, this template); publish after merge.
  Then add to the Compare menu and link from the 90s childhood blog post. Open: URL choice, hero photo, CD/tape reviews (see the brief file).
- Copy note: the brief says "toddlers to teens" (12 Oct) while the copy rules above say "ages 3 to 14+"; the page follows the brief.

## 2026-10-12: Reviews page section, "toddlers to teens" copy (build)
Branch `claude/reviews-section-toddlers-teens`, PR into `main`, **awaiting owner check on its draft theme**.
- `page.reasons-to-buy` (Voxblock reviews page): homepage "Reading for pleasure / Connectivity free / Travel companion"
  image carousel (`multiple-images-with-text`) added after the reasons cards. Copy fix in both copies: "Designed with
  kids in mind" and "rough and tumble kids" → "children" (body-copy rule).
- Age range "3 to 14+" → "toddlers to teens" (owner, 12 Oct): homepage hero line, age heading and FAQ answer;
  reviews page; both alternative pages; homepage, starter pack and reviews meta descriptions in `layout/theme.liquid`.
  Factual "made for children aged 3 and over" answers unchanged.
- `/pages/reduce-screen-time` rebuilt as a parent's guide, new template `page.reduce-screen-time` (hero, quick answer
  citing the DfE under-5s guidance of March 2026, seven ways as benefit cards, why audiobooks, reviews, four best-seller
  packs, 6-question FAQ, links to the screen-time blog posts). Title/meta override in `layout/theme.liquid`, keyed on the
  template suffix so it only applies once the page's template is switched: "How to Reduce Screen Time for Kids: 7 Ways | Voxblock". Targets how to reduce screen time (480/mo UK), reduce /
  reducing screen time (210 each), less screen time (70, Jan peak 320); "how much screen time is too much" (720) and
  "screen time recommendations by age" (590) stay with the blog post, linked from the FAQ. **After merge (admin):** set
  the page's template to `reduce-screen-time` (it is on `landing-page-problem` today). Preview before then with
  `?view=reduce-screen-time`.
- Starter pack blocks on the homepage and reviews page pointed at unpublished `-pack-set` products, so they fell back to
  the collection order (no Gruffalo). Now the four best-sellers: Gruffalo, Little Listeners, Roald Dahl, Percy Jackson.
  `product.player.json` "Frequently bought together": the five unpublished `-set` packs removed from its list (no visible
  change; it already showed the six published items).
- Admin, done 12 Oct (not theme): Mouse character metaobject moved to the `gruffalo` template (story hero, classroom
  band, FAQ); checked live: one H1 "Mouse in The Gruffalo", title/meta unchanged.

## 2026-10-11: Homepage targets "kids audiobook player" searches (build)
Branch `claude/homepage-kids-player`, PR #74 into `main`, **final check done 11 Oct, ready to merge** (draft theme 199842660736 synced).
Full record, baseline and admin follow-ups: `briefs/homepage-kids-player.md`.
Also carries the site-wide heading and eyebrow clean-up (formerly PR #75, closed): heading sizes from Theme settings > Heading size (Small), colour from Heading teal, size classes still allowed for styled marketing lines, one eyebrow style (theme orange, 12/13px, 20px line height, 8px above its heading). Affects every page; the draft theme has all changed templates.
- Title/meta override for the homepage in `layout/theme.liquid`: "Kids Audiobook Player | Screen-Free Audio Player | Voxblock".
- `templates/index.json`: hero H1 "The screen-free audiobook player for children" + new hero line + second button; Meet Voxblock
  H1 → H2 with new copy; Features heading → "Finally. Audiobooks without the fussy tech."; new 9-question FAQ before starter packs.
- `sections/header.liquid`: homepage logo wrapper h1 → div, so the hero H1 is the only H1.
- Hero colour overrides removed (owner, 11 Oct): heading, text and button colours come from the theme. Contrast to be fixed theme-wide (see Open item).

## 2026-10-11: Pack contents, extra kit items (build)
Branch `claude/pack-contents-extra-kit`. Found on /products/the-ultimate-gift-bundle: the kit showed only the standard
player, bumper and cable, but the bundle also has headphones and a travel case.
- New product metafield `pack.kit_extras` ("Extra kit items", list of products, definition created in Shopify). The
  section shows the three standard items, then each product listed there (picture + title without "Voxblock ").
  Set on The Ultimate Gift Bundle: Voxblock Headphones, Voxblock Travel Case. Empty on every other pack.
- Theme code can't read native bundle components (Liquid has no field for them; only the Admin/Storefront APIs do),
  so the kit and book lists stay hand-kept metafields. Owner chose to keep it that way rather than sync.
- Book and total lengths under an hour read "25 m", not "0 h 25 m".
- Still open: the gift bundle has no colour option, so the player tile can't match its Green player.

## 2026-10-11: Starter pack "What's in the box" (build)
Branch `claude/starter-pack-whats-included`, draft PR #78, **not previewed yet**: needs a draft theme on the branch.
- Round 2 (owner): a separate full-width section **below** the main product area, not a block in the buy column, so
  it adds content without getting in the way of Add to basket. New section `pack-contents`
  (sections/pack-contents.liquid → snippets/pack-contents.liquid), placed after `main` on `product.starter-pack-bundle`.
  The "What's included" accordion in the buy column is back as it was. Phone: kit tiles in a row, then book cards;
  desktop: kit in a column, books as three cards. Cream band. Renders nothing on a product with no `bundles.products`.
- Player kit: three product pickers with name + caption (player, bumper, USB cable). Player and bumper pictures follow
  the colour swatch (variant image whose title = pack colour; voxblock.js swaps on variant:change). The bumper has no
  Blue variant, so on Blue it keeps the picture it had.
- Books: every product in `bundles.products` with cover, narrator (`book.narrators`), length (`book.duration` read as
  hours.minutes, e.g. 3.15 = 3 h 15 m: unconfirmed), Unabridged, ages, and a sample button. The button is a normal
  `.bookpreview`, so it plays through the shared player and sends `sample_played`; voxblock.js now also sets
  `--sample-progress` on the playing button for the bar.
- Value line "£79.99 together · £100.96 bought separately" from the variant's compare-at. Note: the items' current
  prices add to £107.96 (player 49.99, bumper 15, cable 2, books 13.99 + 13.99 + 12.99), so compare-at undersells.
- Round 3 (owner): sample buttons are now the site's standard `.bookpreview` button (same markup as product cards,
  no custom bar). Intro copy: "It arrives charged, so just drop in a book and press play." Player and bumper pictures
  match the pack colour; the bumper has no Blue variant, so the section takes an extra picture per item
  (`Bumper_Blue_Only.png` for Blue). Jump link "See what's in the box and hear the stories" under the description
  (Custom Liquid block → `#whats-in-the-box`). Title eyebrow "Audiobook player + stories" (new `eyebrow` setting on
  the main-product title block, `[count]` = books in the pack). One-book packs (Zeepy Sleep Intro Pack uses this
  template) get "Your audiobook" as the heading.
- Round 4 (owner: "keep the site wide styling on heading and eyebrows"): no custom type styles. The section is
  wrapped like the theme's own (section-properties, colour settings, background #fff7f0 set in the template) and
  headed with snippets/section-header.liquid (`.subheading` eyebrow, `.h2` heading); group and book titles are `.h6`,
  small text uses `.text-sm` / `.text-xs` / `.text-subdued`, the jump link is `.link`. The product title eyebrow is
  `.subheading` (the orange uppercase rule is gone). CSS in voxblock.css.liquid is layout only.
- Round 5 (owner: headings and eyebrow still didn't match): rebased onto main, which now has one heading hierarchy
  and one `.subheading` eyebrow style site-wide (PR #79 era). The preview was built on the older main, whose bold H1
  rule made the product title heavier. Section titles are now bare h3 (groups) and h4 (books) so they take their
  level's site-wide size; main's own title `eyebrow` setting is used (duplicate removed), `[count]` still supported.
- Check on preview: all four colours (Blue bumper picture is a different render style), phone and desktop width,
  sample play/pause, the jump link clears the sticky header, Zeepy Sleep Intro Pack.

## 2026-10-10: /pages/voxblock-vs-yoto one CTA everywhere + sticky table header (build)
Branch `claude/vs-yoto-buy-buttons`, draft PR #71 into `main`, **awaiting owner check on draft theme 199807009152**.
- Round 3 (owner): every button reads just "Shop now" (no "from £x"; hero setting `show_from_price` off). Full size
  for page-level buttons (hero, closing band); slim (`button--sm`) on cards, the table column and the sticky header.
- Round 2 (owner: "Keep same CTA for all buttons"): Add to basket dropped. Every button on the page is the theme's
  primary button "Shop starter packs · from £x" → starter pack collection (`snippets/vs-cta.liquid`, live "from").
  Used in: hero (unchanged), Player vs player column 1, its sticky header ("Shop packs"), the Gruffalo pack card,
  and the closing teal band (was the Gruffalo pack product; "Player on its own" outline button kept as secondary).
- Hero: Voxblock card image/name link to the player; no button inside the card (setting `show_card_button`, off).
- `comparison-table`: optional Column 1 product (link + live price), optional button collection, optional compact
  sticky header, "Image fit" setting. All default off; other templates unchanged.
- `price-breakdown`: optional per-card button collection; every card gets the same footer so totals line up
  (checked: all three totals at the same height on desktop). Default off.
- Book comparison: Voxblock column photo = `product-book-bookshelf-the-gruffalo.png`, Fill. Yoto column photo =
  `Yoto_card_on_table.jpg` (uploaded by the owner 10 Oct, cropped from a third-party blog photo; owner cleared use).
- Tracking: PostHog `vs_yoto_click` { target: table_cta | table_sticky_cta | pack_card_cta | table_player_page, page }
  (voxblock.js); hero keeps `vs_yoto_hero_click` (+ target `player_page`).

## 2026-10-09: Gruffalo character + cast pages (build)
Branch `claude/gruffalo-pages`, draft PR into `main`, **awaiting owner check on draft theme 199796130176**.
Full record and flags: `briefs/gruffalo-pages.md`.
- New `story-hero` section: artwork + H1 + sample + starter pack + audiobook in the first screen, on
  `metaobject/character.gruffalo` (Gruffalo, Owl, Fox, Snake) and `metaobject/characters.gruffalo` (cast page).
- Owl/Fox/Snake no longer have the H1 "What is a Gruffalo?". Redirect /authors/julia-donaldson added in Shopify.
- Round 2 (9 Oct): hero now has "At home" (pack) and "In the classroom" (Klaviyo school sign-up + school packages)
  routes; new sections character-features, classroom-band, story-steps, story-home-band; ranking content kept.
- Tracking: PostHog `story_hero_click`, `school_signup`. Performance review: add /pages/character/the-gruffalo and
  the cast page.

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

## Duplicate player pages (2026-10-11)
- GSC (90 days): the homepage already ranks 2–8 for screen-free and "kids audio player" searches, so the two extra player pages only competed with it.
- Live now: /pages/kids-audio-player and /pages/audiobook-player-for-kids are unpublished, with 301 redirects to /.
- /pages/reasons-to-buy-voxblock becomes the Voxblock reviews page (template page.reasons-to-buy, PR #79). After merge, set its template in admin.
- A screen-free page draft is parked (not committed); only revisit it if the homepage loses screen-free rankings.
