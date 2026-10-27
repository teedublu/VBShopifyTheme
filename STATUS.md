# STATUS

## Pricing rule (owner, 20 Oct 2026)
The theme never calculates a price. Every price shown is the variant's real price and compare-at price from Shopify,
so product pages, cards, cart and checkout always agree. Offers are set on the product itself (price £5.99, compare-at
£9.99), not with tags. The tag-driven "Offer pricing" feature (`snippets/offer-price.liquid`, its JS/CSS, theme
settings, badge colours and `OFFER_PRICING.md`) was removed after 1001 Nights showed £5.99 on cards but charged £9.99
in the cart (tagged `offer-599`, no matching automatic discount existed).

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
- Tone (owner, 15 Oct): plain, simple and direct. No over-effusive marketing phrasing ("dive into", "captivating", "spark imagination", "thrilling", "bring to life"). Say what the books are, who they suit and how they play.
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
- Help pages (help-pages branch): /pages/quick-fixes (interactive section, 13 answers in the page), /pages/player-guide (picture-led, 7 images), /pages/help, /pages/delivery-and-returns, /pages/voxblock-faq, /pages/contact-us. Once published.
- Story layout, now the default character.json / audiobook.json (every character and audiobook page except Gruffalo, bestseller and musical-story templates): pack match loops the starter pack collection (60 products) twice per page; characters with no `main_book` also scan their collection and the series lists in each of six sections. Samples: /pages/character/dave-pigeon, /pages/character/alex-rider (no main_book), /pages/audiobook/matilda (no series).

## Open: site-wide colour contrast (owner: must be resolved)
Measured on the draft theme 11 Oct (WCAG AA needs 4.5:1 for small text, 3:1 for large headings and buttons):
- Eyebrows in theme orange #ff9e57 on white/cream: 2.0:1 (fails). Owner chose the theme orange for now; fix by a deeper orange (e.g. #c2560f, ~4.6:1) as its own setting, keeping the button orange.
- Buttons: white text on orange #ff9e57 (2.0:1) and on light teal #4cb6ac (2.4:1); orange outline-button text (2.0:1).
- White headings on light-teal FAQ and newsletter bands (2.4:1): homepage, product pages, schools, landing pages.
- Cream stats ("350+", "30.5m") on the orange impact band (1.9:1): homepage.
One change in theme colour settings (accent, secondary button, band backgrounds), then rescan every template.
- Buttons now follow the theme everywhere (176 per-section colours cleared). Still separate from the theme button: CSS-built buttons in voxblock.css (`series-button`, `pack-chip`, `coming-soon-pill`, pack card add button) and the secondary "Add to cart" in light teal #4cb6ac. Bring these into the theme button styles in the contrast pass.

## 2026-10-26: Help pages (help centre, player guide, quick fixes, delivery and returns, FAQ, contact)
Branch `claude/help-pages`, draft PR, draft theme "Help pages (claude/help-pages)" (id 200687190400, duplicate of live + changed files by API, checksums verified). **Awaiting owner check, then merge, then the admin steps in the brief.** Brief: `briefs/help-pages.md`.
- Six pages replace twelve plus the Gorgias help centre. New templates `page.help`, `page.player-guide`, `page.quick-fixes`, `page.delivery-and-returns`; `page.faq` and `page.contact` rebuilt. New pages created in admin **unpublished** (handles help, player-guide, quick-fixes, delivery-and-returns).
- Quick fixes: real player photo (Files: quick-fixes-player-front.webp, orange bumper; quick-fixes-book-charlie.webp, cover straightened from the 3D render) with the play button glow, battery strip and buttons to press placed over it by % (drawing kept as fallback; added 27 Oct) with a chip per light; links `/pages/quick-fixes#light-<id>` for customer service and Saga. Never V1/V2.
- Titles/metas by template suffix in `layout/theme.liquid`. Redirects, menus, publishing and Gorgias retirement not done.

## 2026-10-26: Dave Pigeon story pages (character + audiobook) on the Gruffalo layout
Branch `claude/dave-pigeon-story-pages`, draft PR, draft theme "Dave Pigeon story pages (claude/dave-pigeon-story-pages)" (id 200663368064, duplicate of live + 9 files by API, checksums verified). **Awaiting owner check, then merge, then the admin steps below.**
- New templates `templates/metaobject/character.story.json` and `audiobook.story.json`: same sections as the Gruffalo pages (story hero with sample, starter pack card and "just the audiobook", cast cards, FAQ, "At home" band), but every setting falls back to the page's own data, so any character or audiobook can use them by setting its template to `story`. Preview without changing anything: add `?view=story` to the page URL.
- `story-hero` / `story-home-band`: empty audiobook = the page's book (audiobook entry's product, or the character's `main_book`); empty artwork = character photo, else the 3D book cover; empty intro = character description, else the book's short blurb; "Find the pack that holds this story" (`snippets/story-pack-handle.liquid`, first pack in the starter pack collection whose `bundles.products` holds the book: Young Explorers for Dave Pigeon). Text settings take [name], [name_in_book], [book], [book_short], [author], [narrator], [more]. Gruffalo pages unchanged (checked: character, Owl, Mouse, cast page).
- `faq`: questions and answers on metaobject pages can use [name], [book], [book_short], [book_url], [author] (" by [author]" drops out when there is none). Text without them prints as before.
- `character-cast`: on an audiobook page lists that book's characters; intro takes [book_short].
- Bug fixes, all pages: `item-grid` printed "Liquid error: invalid url input" for every character with no photo (fallback image was a string); it now shows no image and links via the entry's own URL. Default `character.json`: "View Audiobook" linked to an empty href (`main_book.value.url` does not exist); now links to the book's product page. Copy: "no apps", "kids", "over 200 titles" fixed in that template.
- Round 2 (owner feedback, 26 Oct): new section `story-books` on both templates: every audiobook the character is in (series books whose audiobook entry lists the character), links to the series, author and narrator pages, and "Bundles with [name]" (series bundle + up to 2 starter packs holding the books). Audiobook pages list the other books in the series. Snippets `story-series-handle` (series holding a book) and `story-book-card` (series-page book row). FAQ: "Which audiobooks is [name] in?" via [books_sentence] (plain text: Shopify escapes HTML put into rich text by replace).
- Breadcrumbs, all character and audiobook pages in a series: trail goes through the series page and drops the series name from the book title (Audiobooks › Dave Pigeon › Racer!, Characters › Dave Pigeon › Skipper; "Dave Pigeon series › Dave Pigeon" when the names match). Characters not in a series: book title cut at the colon. Gruffalo trails unchanged.
- Admin, after merge (not done; live content): add Dave Pigeon / Skipper bios (drafted in the PR); page titles "Dave Pigeon: Character Guide | Voxblock" and "Skipper in Dave Pigeon: Character Guide | Voxblock". (No template switch needed any more: see round 3.)
- Round 3 (owner: "update all other series/characters to the latest templates", 26 Oct): the story templates replace the default `character.json` and `audiobook.json` (the `.story` files are gone), so every character and audiobook entry without its own template gets the new layout with no admin step: 13 series, 59 series characters, 64 series audiobooks, plus the non-series ones. Audited all 128 pages on the draft theme: no Liquid errors, one H1 (Owl's second H1 is in its bio, as before), valid JSON-LD, no unreplaced [tokens]. Live today, by contrast: every character page has a dead "View the audiobook" button and 26 series audiobook pages print item-grid Liquid errors.
- New `snippets/story-work-handle.liquid`: the audiobook a page is about (itself; a character's `main_book`; else for older characters with no main book, the first linked product in the character's `collection`, else the first series audiobook listing the character). Used by story-hero, story-books, story-home-band, faq, breadcrumbs and character-cast, so Alex Rider, Horrid Henry, Pippi, Paddington Bear, Mr Gruber, Dr Watson and Sherlock Holmes now get their books, series links and crumbs.
- `[name_in_book]` uses the series name when there is one ("Annabeth Chase in Percy Jackson", not the full book title; just the name when one holds the other: "Paddington Bear"). FAQ leaves out questions that need a book, and the home band hides, on a page with no book.
- Data, admin (write was blocked from here): set `main_book` on the characters that have none. Series: alex-rider → Alex Rider: Stormbreaker; pippi-longstocking → Pippi Longstocking; paddington-bear and mr-gruber → A Bear Called Paddington; horrid-henry → Horrid Henry and Friends; dr-watson and sherlock-holmes → A Study in Scarlet. Not in a series (these pages have no book until it is set): winnie-the-pooh → Winnie-the-Pooh; peppa-pig → At Home with Peppa; bing-bunny → Bing Playtime Stories and Songs; old-bear → Old Bear and Friends; shifty-mc-gifty → Shifty McGifty and Slippery Sam: The Spooky School; moomintroll, moominpappa, moominmamma, sniff, snork, snorkmaiden → Finn Family Moomintroll; peter-rabbit → The Tale of Peter Rabbit and Other Stories; willy-wonka → Charlie and the Chocolate Factory; mina-mistry → Mina Mistry Investigates: The Case of the Disappearing Pets. maggie-sparks → Maggie Sparks and the Monster Baby (its `collection` is wrongly the Mina Mistry collection, so the page currently says "Maggie Sparks in Mina Mistry Investigates").

## 2026-10-23: Pack pages show the chosen colour's picture (colour option name match)
Branch `claude/gallery-colour-option-match`, draft PR, draft theme `VBShopifyTheme/claude/gallery-colour-option-match` (id 200533246336, duplicate of live + two files by API, checksums verified). **Awaiting owner check, then merge.** Brief: `briefs/gallery-colour-option-match.md`.
- Bug: on desktop the gallery is a grid, so a variant change cannot scroll to the picture. The theme instead hides other colours' pictures using alt-text tags (`#Color_Green`), and the tag's name had to equal the product's option name exactly. Newer packs name the option "Colour" or "Voxblock Audiobook Player (Color)", so the script matched nothing: after the first colour click every picture un-hid and the big first picture never followed the variant (reported on /products/young-explorers-starter-pack).
- Fix: `snippets/product-gallery.liquid` (server side) and `_getFilteredMediaIndexes` in `assets/theme.js.liquid` (browser) now compare names loosely: "colour" = "color", an exact name wins, otherwise an option name that contains the tag's name counts ("Voxblock Audiobook Player (Color)" matches `#Color_...`). A tag with no underscore is ignored instead of throwing. Both places carry a comment to keep them in step.
- Checked on the draft theme by clicking every colour: Seriously Funny (option Colour, tags #Color), The Gruffalo Intro Pack (option "Voxblock Audiobook Player (Color)"), Young Explorers (Colour, tags #Colour), Famous Five Starter Pack (Color, regression): the first visible picture is the chosen colour and only one colour picture shows. Also checked on first load with ?variant= (server-rendered `hidden`). Logic unit-tested (13 cases) with node.
- Data (live, 23 Oct): young-explorers-starter-pack, little-listeners-starter-pack and zeepy-sleep-intro-pack had no colour tags at all; tagged `#Colour_<Colour>` in the media alt text. Young Explorers still has a duplicate orange pack image (shows twice on Orange).
- New packs: tag colour pictures in the media alt text as `<Pack> with <colour> bumper #Color_<Colour>`; any option name now works.

## 2026-10-23: Find a bookshop page (map, stockist enquiry)
Branch `claude/find-a-bookshop`, draft PR, draft theme "Find a bookshop (claude/find-a-bookshop)" (id 200531444096, duplicate of live + changed files by API, checksums verified). **Awaiting owner check, phone and desktop.** Design: canvas "Find a bookshop redesign".
- `templates/page.stockists.json` (the template /pages/find-a-bookshop uses) now: `stockist-hero`, `stockist-finder`, `stockist-suggest`, `stockist-join`. Old banner, page body, multi-column list and photo carousel removed.
- `stockist-finder`: shops are the "Stockist" metaobject (created 23 Oct: name, street, town, postcode, country, latitude, longitude, website, link label, photo, "Show on the map"; 12 entries, coordinates from postcodes.io). Edit in admin > Content > Metaobjects > Stockist, live on save (no theme change). List rendered in Liquid (works without JS). Map is Leaflet 1.9.4 from cdnjs with OpenStreetMap standard tiles (credited), loaded when the section nears the screen. CARTO tiles now need an API key (tried, showed "API key required"). Search filters by text; a UK postcode or district is looked up on api.postcodes.io and the list sorts by distance; "Use my location" does the same. Dashed "Your bookshop here?" invite pins (blocks) link to #join. Coordinates are postcode centres; correct a pin in the metaobject if needed.
- `stockist-suggest` and `stockist-join` are Shopify contact forms (to the store contact email), hidden field "Form" = "Bookshop suggestion" / "Stockist enquiry". Two contact forms on one page: thank-you shows for the form named in the redirect hash (snippet `stockist-form-thanks-script`).
- Benefit copy (owner, 23 Oct): demo players, table-top displays, POS cards, marketing material; no minimum order, fair margin, a real person to speak to.
- Not done: Darling Reads appears in the old photo carousel but not in the shop list (owner to confirm). Admin SEO (23 Oct, live): title "Where to buy Voxblock: independent UK bookshops | Voxblock" (58), meta 144 chars. Page is a Brand/navigational page, not an SEO lead page; measure on enquiries and directions clicks.
- Links: Google Maps "Directions" links are rel=nofollow (utility, not endorsement); bookshop website links stay followed (owner asked 23 Oct; nofollow would not keep link value on our page).
- Tracking (vs_yoto_click targets): fab_hero_find, fab_hero_join, fab_hero_tile, fab_row, fab_pin, fab_directions, fab_website, fab_locate, fab_postcode, fab_invite_pin, fab_empty_suggest, fab_suggest_submit, fab_shop_packs, fab_enquiry_submit, fab_enquiry_email.
- Performance review: `/pages/find-a-bookshop` (Leaflet ~40KB + tiles, lazy).

## 2026-10-22: Player buy box (from price, photo colour tiles, opt-out link)
Branch `claude/player-bumper-picker`, **draft PR #100** (https://github.com/teedublu/VBShopifyTheme/pull/100), draft theme "Player buy box (claude/player-bumper-picker)" (id 200444903808, files checksum-verified against the branch head). **Awaiting owner check on phone and desktop before marking ready.** Design: canvas "Player page variant picker" (desktop + mobile; predates the photo tiles, not updated).
Why: since the 24 Sep reorder "No bumper" is the first variant, so the page opened on the £49.99 plain player and took 12% of player sales (33% when it was first and £39.99); every "£49.99" ad lands on it. Reordering in the admin sets the 23 bundles containing a player variant to draft, so the order is left alone and the theme sets the default.
- Default: variant picker block setting "Preselected option value" (player = Orange), else the first available non-opt-out value; only when the URL has no `?variant=` (a `?variant=` link always wins, ads can still land on No bumper on purpose). Passed to gallery, product info, picker and buy buttons.
- Headline (Price block, "Show from price"): `from <product.price_min>` on load, then the selected variant's own price once a value is chosen, theme price colour (`--accent-strong`). Note beside it from three Price block settings (from note, "including {option} bumper", opt-out note). Small inline script swaps state on `variant:change` and on re-click of the selected value.
- Colour chooser: photo tiles (`option-value` type `photo`) using the product image whose alt has `#Color_<value>` + keyword "front and back view" (setting "Photo tile image keyword"), fallback the variant's own photo. Names screen-reader only; the picker's own "Bumper colour: X" label is visually hidden.
- Opt-out: "Prefer it without the bumper? <variant price>" text link in the same radio group.
- CSS at the end of `voxblock.css.liquid`; locale key `product.price.from_price_lowercase` (English only).
- Not checked in a live browser: headline/note switching, opt-out, cart variant, Shop Pay button and sticky bar following the selection.
- Fragile: tile images rely on image alt text keeping `#Color_<value>` and "front and back view".
- Open: Shopping feed offer should stay the No bumper variant so "from £49.99" and the feed price agree.
- Open, separate: a test cart showed a 12.5% product discount (-£7.49) on the player. Not a code or automatic discount; likeliest the UpPromote Affiliate app's discount function (live 20 Oct 14:34), unconfirmed. Check its referral discount and any affiliate cookie.
- Performance review: `/products/voxblock-audiobook-player` (new picker markup, no new requests).

## 2026-10-16: Refer a friend page (3 Golden Tokens)
Branch `claude/refer-a-friend`, draft PR #96, draft theme "Refer a friend (claude/refer-a-friend)" (id 200116863360, duplicate of live + changed files by API). **Awaiting owner check, phone and desktop.** Review: LPS `claude/refer-a-friend-review.md`; data plan: LPS `claude/referrals-catalyst-plan.md`.
- New sections `referral-intro` (signed out: offer + button to /account; signed in: `referrals.code` with copy, share link `/discount/<code>`, WhatsApp, email; `#N/A`/blank code gets a contact line; token count behind a setting, off) and `referral-rewards` (products read live + £30 e-gift card tile); snippet `referral-token`.
- Removed: code-resend form, Scottish Book Trust carousel, all-caps note, "Shop here" to the player. Footer trust item now "Refer a friend" (site-wide).
- Liquid notes: `empty` is a keyword (always truthy), never a render parameter name; `url` settings only accept `/collections` defaults (Shopify silently rejected the section until they were text settings).
- After merge (admin): page SEO title and meta still sell the old offer.
- 16 Oct round 2: photographed Golden Token (`assets/golden-token.webp` 640px, `golden-token-240.webp`, cut from the owner's photo) in the hero (three fanned, float and shine animation, off for reduced motion), the offer line and a "3 Golden Tokens" badge on each reward. New section `referral-steps` (gold markers): step 1 shows the signed-in customer's code with copy and share instead of "log in to your account". Code and share UI in snippet `referral-share` (hero + step 1). "Been sent a code?" now `media-with-text` with the children's photo. Not checked signed in (needs a customer login on the preview).
- Performance review: `/pages/refer-a-friend` (hero coin images load eagerly, 66KB webp).

## 2026-10-15: Author and narrator pages (compact intro, books near the top)
Branch `claude/author-narrator-pages`, draft PR, draft theme `VBShopifyTheme/claude/author-narrator-pages` (id 200079049088, a duplicate of live with the changed files pushed by API). **Awaiting owner check, phone and desktop.**
- New section `person-intro` replaces the tall banner with the giant initials circle: eyebrow, small initials circle (52px phone, 72px desktop; never a photo, see below), H1 name, first 30 words of the bio with "Read more" to the full bio (#bio), trust row. Same `.age-intro` / `.age-pack` styles as the age collections.
- Starter pack: "Person pack" block override (Roald Dahl, Julia Donaldson, Enid Blyton set), else the published pack holding most of the person's books (main book + first 24 in their collection), else the player. Card on desktop (1000px+), one-line pack strip on phones. Hidden for signed-in player owners.
- Card markup moved from `collection-age-intro` into `snippets/starter-pack-card` (shared; age collection card output checked identical to live).
- Books straight after the intro (24, #books, H2 "Audiobooks by / narrated by <name>"); full bio gets an H2 "About <name>"; FAQ and promo copy rewritten to the copy rules ("no app" removed, sentence case, plain tone); per-section orange heading text on the book row cleared.
- Tracking: `age_collection_click` with collection `author:<handle>` / `narrator:<handle>`; targets strip, read_bio, pack_title, starter_add / player_add, all_packs, player.
- Photos (owner, 15 Oct): author and narrator photos were taken down after a complaint about an unlicensed image; no provenance, so **initials only** for now (sourcing licensed photos may come later). Nothing reads the author/narrator photos field any more: `person-intro`; Person JSON-LD in `microdata-author` / `microdata-narrator` (the photo URL was still published on the live site); `person-avatar` forces initials for both types (covers the index lists, the old hero and the audiobook-page author/narrator boxes); `metaobjects-list`, `multi-column-audiobooks`, `metaobject-header` and `item-grid` skip the photos field for both types. Character art is a separate case and unchanged. The files themselves are still in Shopify Files and the metaobject photos fields: owner to remove.
- Data notes: Enid Blyton's collection holds Famous Five bundles, not the books in the Famous Five pack; some bios start with photo credits or effusive copy (Julia Donaldson, Sarah Ovens).
- Performance review: `/pages/author/roald-dahl`, `/pages/narrator/sarah-ovens` (pack match loops over the pack collection on each render).

## 2026-10-15: Theme collections (dinosaurs, mystery, funny...) on the age template
Branch `claude/theme-collections`, draft PR, **awaiting owner check on a draft theme**. Template `collection.audiobooks-landing-cat` (age + ~45 theme/series/seasonal collections).
- Theme collections (no "Age collection" block) read H1, intro line and starter pack from collection metafields `landing.heading`, `landing.intro`, `landing.starter_pack` (definitions created in admin 15 Oct); fallback to the collection title and section defaults.
- Their age buttons now filter the same collection (Search & Discovery `filter.p.m.book.age_groups`, with counts, "All ages" first, empty ages hidden, rel=nofollow) instead of linking to the age collections. Age collections keep their tabs.
- "More story themes" row above the About text, from `landing.related` (labels from `landing.short_name`).
- Grid: "How it works" video card (same as the starter pack collection) at position 3; the "How Voxblock works" row moved from 7 to 12.
- Filled in admin for dinosaurs only (live theme ignores these fields until merge). Dinosaurs and dragons collections share one rule ("Dinosaurs & Dragons"), so they hold the same 22 stories: owner to decide merge or split.
- Collection `<title>` now reads the admin SEO title (`global.title_tag`) directly in `layout/theme.liquid`: on 15 Oct the dinosaurs collection kept showing its plain title on the live site although its SEO title was set.
- Admin 15 Oct: mystery collection SEO title, meta, description and landing fields set ("best mystery audiobooks for kids": 10,609 impressions, 0 clicks in 90 days). Duplicate collections awaiting owner approval to merge: dragons > dinosaurs, mysteries > mystery, action > adventure, magic > fantasy, musical stories > music.
- Admin 15 Oct: theme copy (SEO title, meta, description with age-sorted picks, landing heading/intro/short name/related, 3-question `landing.faq`) set on adventure, fantasy, funny, bedtime calm, facts and learning, short stories, music, unicorns, wellbeing, favourite characters; FAQ added to mystery and dinosaurs. Collection FAQ renders in `collection-about` with FAQPage JSON-LD. Fairies = unicorns (same rule): redirect fairies > unicorns created, owner to untick Online Store on fairies.
- Performance review: `/collections/childrens-dinosaurs-audiobooks` (video card in the grid).
- Sync note: Shopify's GitHub sync silently rejected `collection-age-intro` while a schema `header` had 60 characters; it synced once shortened. Keep schema header content short (under 50 characters) and check the file's checksum on the draft theme after pushing.

## 2026-10-13: Product-group SEO fixes
Branch `claude/product-group-seo-fixes`, draft PR, **awaiting owner check on a draft theme**. Audit and full list: LPS `claude/seo-fixes-product-group.md`.
- H1s: kids starter pack page (`page.adwords-generic` hero now H1 "Audiobook starter packs: stories they can play themselves"), accessories collection (H1 "Headphones and accessories for Voxblock"), how it works ("How the Voxblock audiobook player works"; step titles H3). Starter pack collection H1 now leads with "Audiobook starter packs"; product grid gets a screen-reader H2 (new `grid_heading` setting on `main-collection`, empty by default).
- Starter pack collection FAQ: owner-support questions replaced with six pre-purchase questions ("Questions before you buy").
- Copy rules: "no app(s)" removed (pack template, how it works), "£15" delivery line fixed, sentence case on eyebrows/buttons/labels, "kids" to "children" in body copy, player ages "3 to 5 / 5 to 8 / 8 years to teens", typos.
- Breadcrumbs: player and accessories products now Home > product; packs Home > Starter packs > pack; starter pack and accessories collections Home > collection (was Home > Our Content > Audiobooks > ...). BreadcrumbList JSON-LD follows.
- Homepage meta trimmed to 153 characters (`layout/theme.liquid`).
- Done in admin 13 Oct (not in this PR): SEO titles/metas on 18 published packs, player, starter pack and accessories collections, how it works page; player image alts.
- Not done: option name "Color" to "Colour" (product images use `#Color_<value>` alt tags for the variant-image mapping; renaming the option would break it). Basket Suggestions collection still holds unpublished packs (cart drawer links 404); remove them in admin.
- Cart drawer recommendations: one list for empty and filled carts, read from a collection (theme editor › Cart drawer › Recommendations collection, default Basket Suggestions; up to 10, in the collection's manual order), new snippet `cart-recommendations`. Players and packs are left out when the cart already has a player or pack. The player prompt now offers the player only (no starter pack: the shopper already has stories in the cart); its player is a product picker (`player_prompt_player`), replacing the typed handles. Basket Suggestions (13 Oct): player, Gruffalo pack, headphones, travel case, Charlie and the Chocolate Factory, A Bear Called Paddington, Peter Pan.
- Basket images: line items and small product cards use one square image box (`voxblock.css`), so tall audiobook covers no longer dwarf the player and accessories.
- Performance review: starter pack collection, how it works, player, pack products.

## 2026-10-13: Hotfix, Organization JSON-LD snippet rejected by Shopify
After #89 merged, Shopify's GitHub sync rejected `snippets/jsonld-organization.liquid`, so every page printed "Liquid error (snippets/microdata-schema line 16): Could not find asset snippets/jsonld-organization.liquid" in its head. Cause: a quoted string containing a closing brace inside an output tag (the search target); Shopify ends an output tag at the first closing brace. Fix: build the string with assign. Rule for this theme: no braces inside quoted strings in output tags; check with a Shopify-style tokenizer scan, not only a local Liquid renderer.

## 2026-10-13: Structured data, PR B (JSON-LD consistency)
Branch `claude/jsonld-fixes-b`, stacked on PR A (`claude/jsonld-fixes-a`, #87), draft PR, **awaiting owner check on its draft theme**. Review: LPS `claude/jsonld-review.md` items 7–14.
- One Organization node on every page (`snippets/jsonld-organization`, @id `{shop}/#organization`, from Settings > Brand); WebSite on the homepage only. Other blocks point to it (`snippets/jsonld-org-ref`) for publisher, seller and author.
- One Product generator: `snippets/jsonld-product`, rendered in the layout for every product page (audiobooks included). Removed: `microdata-audiobook-as-product`, `microdata-product-variants`, `microdata-organisation`, `microdata-snippet-bisac_codes`, `microdata-snippet-publisher`. Brand "Voxblock" for every product: Voxblock is the publisher; the Shopify vendor is internal only and never used in structured data (owner, 13 Oct).
- @id scheme: product `{url}#product`, audiobook `{page}#audiobook`, author/narrator `{page}#person`, character `{page}#character`, series `{page}#series`, collection `{url}#collection`, FAQ `{canonical}#faq`, article `{url}#article`.
- Audiobook pages: all authors and narrators; offer points at the Product; ISBN only when a 978/979 13-digit barcode; duration from the book metafield; print edition as `exampleOfWork`; BISAC/Thema list fixed; removed `potentialAction`, Shopify publish date, block height/width, fixed 5-minute sample duration.
- Characters are `Thing` (fictional character) with `subjectOf` their main audiobook; quotes point at them.
- Collections: list of product pages (was every item typed Audiobook with a `#audiobook` URL). No `nextPage`/`previousPage`.
- FAQ sections: new "Include in structured data" setting (default on); every FAQPage on a page shares @id `{canonical}#faq`, so the FAQ page's seven sections form one entity.
- Video section: new "Upload date" setting (blank keeps 2022-08-31).
- Every value through `| json`; https everywhere; no `priceValidUntil`; blog dates with time zone.
- Owner to do: set "Upload date" on each video section; change the Organization description in Settings > Brand (it says "no need for any apps").

## 2026-10-13: Structured data fixes, PR A (JSON-LD correctness)
Branch `claude/jsonld-fixes-a`, draft PR into `main`, **awaiting owner check on its draft theme**. Review: LPS `claude/jsonld-review.md`.
- Shipping: `GB` (was `UK`, invalid); £3.50 under £24, free from £24 (matches Shopify rates). Unconfirmed order cut-off time removed.
- Returns: `GB`; player and starter packs/bundles 100 days, free, by post; everything else 30 days, customer pays (owner, 13 Oct).
- Player, pack and other non-audiobook product pages now carry shippingDetails and hasMerchantReturnPolicy (they had none). Gift cards excluded. Weight uses UN/CEFACT codes, omitted when 0.
- Product JSON-LD only on /products/ pages: removed from `featured-audiobook-light` (audiobook, author, narrator, read-along pages) and from the audiogramme graph (owner agreed, 13 Oct).
- Video: real thumbnail (was the "no image" placeholder), https contentUrl, no empty embedUrl, section JSON-LD title on non-audiobook pages (player video was "Transcript of Voxblock Audiobook Player Audiobook"). No script when there is nothing to describe.
- Audiobook pages: image URL fixed (was a 404). Narrator pages: no placeholder image.
- Check after merge: Rich Results Test on player, a pack, an audiobook product, an audiobook page, homepage; Search Console Merchant listings and Videos reports in 2–4 weeks.
- Review 13 Oct (follow-up commit): YouTube videos get embedUrl only; video duration added; empty video script check hardened; gift cards (digital and physical) get no shipping/returns; fixed 1024 × 1024 image size claims removed.
- Free delivery in JSON-LD follows Shopify's Domestic rates: free from £24.00, £3.50 below (owner, 13 Oct). Accessories and schools packs: 30 days, customer pays (owner confirmed).
- Explorer Bundle + Voxblock Player retyped to Starter Pack by the owner (13 Oct), so it gets the 100-day policy.
- Identifiers: sku, productID and GTIN left out when blank (native bundles have none); barcode only as a GTIN of valid length. Audiobook bundle pages now have one Product (the audiobook section outputs Product only for type Audiobooks). Charging Plug barcode (failed GTIN-8 check) removed in Shopify by the owner.
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

## 2026-10-12: Product title, price and breadcrumbs consistent (build)
Branch `claude/product-title-price-crumbs`, draft PR #85, draft theme 199895646592 (duplicate of live + changed files by API). Starts from main after the owner's admin reorder of the player and
starter-pack buy boxes (Shopify sync commits 2b365cf, 394c732, 4394bb8: buy buttons now straight under the price).
- Title: every product page H1 uses the theme's Large heading size (24px phone). The title block's "Style" setting
  now only applies in quick view (the player was Medium, 22px).
- Price: plain and pack (bundle-price) prices on the product page both use `--text-h2`, the same size as the
  title. Before: plain prices 36px (240%), pack prices ~20px. Cards unchanged. One rule in voxblock.css.
- Order: price block moved straight under the title in 9 templates (badge or short text sat between them):
  accessories, audiobook, gruffalo, intro-pack-bundle, product (default), myo-product, player-senior, school-product,
  starter-pack. pre-order (theme default, unused) left alone.
- Breadcrumbs: phone shows one back link to the parent page ("‹ Voxblock Starter Pack Bundles"), desktop the full
  trail on one line; smaller, quieter text; section spacing via the theme variable. 73px → 33px on phones.
  BreadcrumbList JSON-LD unchanged in shape. Non-audiobook products (player, accessories, schools) now start at Home
  instead of "Our Content".
- Phone gallery on audiobook and gruffalo templates: dots like every other product (was free scroll, which shows
  side peeks and a thumbnail strip). Desktop layouts still differ per template (grid_highlight, thumbnails left,
  thumbnails bottom): owner to choose one.
- Gallery opens on the selected variant's picture (snippets/product-gallery.liquid used product.selected_variant,
  which is only set with ?variant= in the URL, so packs opened on the first image: green Gruffalo while Orange was
  selected). Fixes every product; variant images in Shopify were already right. Checked on the draft theme.
- Pack contents intro: "No downloads, no wifi, nothing to set up." (was "no app"). Player description was already
  clean after the owner's admin edit.
- Starter packs: "What's in the box" moved into the buy column (new main-product block `pack_contents`, same snippet,
  phone layout at every width on a light panel, value line off) after the description, above the icons. Full-width
  section removed from the template; jump link block removed; titles block (`bundle`) disabled. Owner happy (12 Oct).
  Book titles typed into some pack descriptions in Shopify still show (Gruffalo, Roald Dahl, Bedtime, Adventure).
- Checked on live pages at 375px with the CSS injected: pack Add to cart bottom 849 → 803px (inside the first
  screen), player 696px. Confirmed on the draft theme: same measurements, no Liquid errors; owner to check.

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

## 2026-10-15: /collections/audiobooks header (draft, stacked on #91)
Branch `claude/audiobooks-collection-header` (base `claude/theme-collections`). Why: the 3-slide carousel filled the first mobile screen, the page had no H1, and only 12 of 3,596 sessions (0.3%, 30 days to 15 Oct) clicked a slide, against 126 (3.5%) for the icon row.
- Template `collection.audiobooks`: carousel switched off (kept in the template, disabled); new short `collection-age-intro` band at the top (H1, one line, trust row; pack card off because these visitors are mostly owners), then the icon row, then the grid. Roald Dahl moves into the grid as a promo tile at position 7, same images and link.
- H1 comes from the collection metafield `landing.heading` (set in admin: "Children's audiobooks"); without it, the collection title.
- Icon row labels in sentence case (Bestsellers, New releases, Under 5s, 5–8 years, 8–10 years, 10 to teens). `collection-link-blocks` now sends `age_collection_click` with target `link:<label>`; image alt emptied (the label is the link text).
- Measure 14 days after launch: bounce and single-page rate for sessions landing here (28.7% / 51.1% before), icon-row clicks, Roald Dahl collection visits from this page, player or pack ATC per session.
- Performance review: /collections/audiobooks (the carousel image was the LCP element).
- 15 Oct, after #92 went live unchecked (no errors; first products now ~560px down on a 375px phone, was ~925px). Follow-up branch `claude/audiobooks-collection-fixes`: Roald Dahl tile text moved to the top of the image (it sat across the books at the bottom); eyebrow removed (it repeated the H1 "Audiobooks"); new `show_grid_head` setting on `collection-age-intro` (default on) switched off here, as the grid already prints "396 products". Trust row cut to two items so it fits one line on phones 360px and wider: "4.9 on Trustpilot" and "100-day guarantee" (delivery dropped here: the announcement bar above already says free UK delivery over £25). Still open (admin): collection metafield `landing.heading` = "Children's audiobooks".

## 2026-10-26: Audiobook bundle pages show what's in the bundle; dark series hero eyebrow
Branch `claude/bundle-info-ua-colour`. Previewed on the draft theme 200663368064.
- New section `bundle-books` on `product.audiobook-bundle.json` (every audiobook bundle): "What's in this bundle" with each book (cover, blurb, ages, sample, link; no price or Add to cart, via `story-book-card` `show_buy: false`), links to the series page, authors and narrators (max 6), and the characters across the books. Also breadcrumbs and the author/narrator line in the buy box.
- Details tab: the empty "More info" row is gone on products with no audiobook entry (bundles).
- Series hero: on a dark series colour the eyebrow uses the hero text colour (theme orange was 3.8:1 on Unicorn Academy purple).
- Data (done 26 Oct): Unicorn Academy series colour #7A2E9E (white text 7.7:1).
- Data (done 26 Oct, owner approved): `bundles.products` filled on 46 active bundles that had none, from each bundle's own Shopify bundle components (the "-set" twins hold the same lists but aren't published). Includes Classics, Famous Five, Horrible Histories, Percy Jackson, Ember Spark, Zog, Winnie-the-Pooh, Loki, the age and Summer bundles and the audio + print / literacy ladder bundles. These pages now also show "Bought separately". Print books in audio + print bundles aren't on the online store, so only the audiobook shows in "What's in this bundle". Summer Adventure Bundle includes Agents of the Wild, which is a draft product, so only 2 of its 3 books show.
