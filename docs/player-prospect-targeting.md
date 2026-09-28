# Player prospect targeting: theme build notes

Theme side of "Player prospects: find them, answer their objection, convert or capture" (28 Sep 2026), plus the
"Help me choose" starter-pack finder from the Help Me Choose mock-ups. Folders outside the theme structure, like this
one, are ignored by Shopify's GitHub sync.

## What's in the theme

| File | What it does |
|---|---|
| `snippets/vb-targeting.liquid` (rendered in `layout/theme.liquid`) | Page context for the profile script, and a blocking script that reads the stored profile and sets `<html data-vb-mode data-vb-arm data-vb-age>` before the page paints |
| `assets/vb-profile.js` | Builds `vb_profile`, scores it, records PostHog person properties, reads the PostHog flags, opens the Klaviyo exit form and (optionally) the welcome pop-ups, forwards Klaviyo form events to PostHog. Exposes `window.VBProfile` |
| `assets/vb-sections.js` | Help me choose behaviour, links that open it, click tracking |
| `assets/vb-targeting.css` | Styles for everything below, plus the "who sees what" rules |
| `sections/vb-help-me-choose.liquid` + `snippets/vb-hmc-*.liquid`, `snippets/vb-bundle-books.liquid` | Help me choose: age, favourite, gift, then "Your match" |
| `main-collection` block "Help me choose" (`snippets/vb-hmc-launch.liquid`) | The "Not sure which pack?" card in the collection grid |
| `sections/vb-age-picks.liquid` + `snippets/vb-mini-card.liquid`, `snippets/vb-age-codes.liquid` | Age picks: starter packs by age for prospects, top books by age for owners, tabs and "Have a Voxblock player yet?" for everyone else. In each row, products whose oldest age is that one come first, so neighbouring ages show different packs |
| `sections/vb-player-banner.liquid` | "Plays on the Voxblock player — starter packs from £69.99" on audiobook pages |
| `config/settings_schema.json` | Theme settings > Visitor targeting |

Placed in templates:

- `collection.starter-pack-collection`: grid card (position 2), Help me choose (19 blocks, below), Age picks above the grid
- `index`: Age picks after the age tiles
- `product.audiobook`: Player banner under the breadcrumbs, Age picks after the tabs
- `cart`: Age picks under the basket

## What each visitor sees

| | Prospect | Owner | Unknown |
|---|---|---|---|
| Age picks | "Starter packs for 5–8s", tabs for the other ages | "Top-selling books for 5–8s" | Age tabs + "Have a Voxblock player yet? Yes / Not yet" (shows packs; the section can show books instead) |
| Audiobook pages | Player banner with "See starter packs" | Nothing | Softer line with a link |
| Exit form | Yes, not on a paid visit | Never | Only once a player or pack is in the basket |
| Help me choose | Everyone | Everyone | Everyone |

Experiment control group (prospects and unknown): Age picks and the banner are hidden, there's no exit form, and the
welcome pop-ups can be left on (see Klaviyo). Help me choose and its grid card show for everyone unless their
"Hide for the experiment control group" setting is ticked. Owners are outside the experiment and always get the owner
behaviour.

## The profile

Stored as `vb_profile` in `localStorage` when the visitor has given preferences or analytics consent (Shopify customer
privacy API, which Pandectes feeds), otherwise in `sessionStorage` for the visit. "Remember visitors between visits"
changes this to always or never, for when the PECR decision is made.

Signals (each counts once per visit; scores halve after 30 days without new evidence):

| Towards prospect | Pts | Towards owner | Pts |
|---|---|---|---|
| Paid click on a player-acquisition campaign (IDs in settings), any Meta paid click, any ChatGPT `cmpn_` click | +3 | Arrival from a Klaviyo email (`_kx`, `utm_medium=email`, `utm_source=klaviyo`) | +4 |
| `utm_term` or on-site search containing player, yoto, tonie, screen free, for kids | +2 | Account, order, address or login page | +3 |
| How it works page | +3 | 2+ audiobooks in the basket and no player or pack | +2 |
| Compare page (`/pages/voxblock-vs-yoto`, or a template or address with "compare" or "-vs-") | +3 | Logged in with a player or pack order | sets owner |
| Player page | +2 | PostHog flag `has-bought-player` | sets owner |
| Starter or intro pack page | +2 | "Yes" to "Have a Voxblock player yet?" | sets owner |
| Player or pack in the basket | +4 | | |
| Opening Help me choose (not in the spec) | +3 | | |
| "Not yet" to "Have a Voxblock player yet?" | sets prospect | | |

Mode: a purchase, then a declared answer, fixes it; otherwise owner at 5+ owner points, prospect at 3+ prospect points,
else unknown (owner wins ties). Age: an age filter or an Age picks tab +3 to that band, a book or pack view +1 to each of
its bands; the answer to Help me choose's first question (or a `?vb_age=` link) fixes it for 18 months. Bands are those
scoring 3+ and at least half the top band, highest first, most recent first on a tie.

A paid arrival (Google, Microsoft, ChatGPT `cmpn_`, or a paid `utm_medium`) suppresses the exit form for the rest of
that visit (a visit ends after 30 minutes without a page view).

PostHog: person properties `vb_mode`, `vb_mode_basis`, `vb_age_bands`, `vb_prospect_score`, `vb_owner_score` (sent when
they change), super properties `vb_mode` and `vb_arm` on every event.

Events: `help_me_choose_opened|step|result|add_to_basket|product_click|all_packs|closed`, `age_picks_tab`,
`age_picks_pack`, `age_picks_book`, `age_picks_view_all`, `player_banner_click`, `player_declared`, `age_declared`,
`exit_form_triggered`, `exit_form_answer`, `welcome_popup_triggered`, and Klaviyo form events as
`klaviyo_form_open|close|submit|step|redirect` (with `form_role` exit/welcome/other; email, phone and name fields are
dropped).

## Set-up outside the theme

Nothing below is needed for the site to work. Until it's done, everyone gets the new behaviour, the exit form is off and
the welcome pop-ups carry on as now.

### Shopify data

1. Import `book.age_groups` onto the starter and intro packs (`claude/starter-pack-age-bands-2026-09-28.csv`). Until
   then Age picks works out a pack's ages from the books in its `bundles.products` metafield (every book must be in the
   band), which only 10 of the 21 packs have: the 5–8 and 8–10 rows share three packs and 10+ shows one. With the
   bands imported, every row is different (10+ has three packs).
2. Fill `bundles.products` on the packs that lack it: Paddington Starter Pack, Paddington Bear Intro Pack, Famous Five
   Starter Pack, Little Listeners, Young Explorers, The Percy Jackson Starter Pack, Fairy Tales Intro Pack, Zeepy Sleep
   Intro Pack, The Gruffalo Intro Pack, Mina Mistry Intro Pack, Charlie and the Chocolate Factory Intro Pack. It drives
   "What's included" on product pages and the "Player + …" lines in Help me choose. The Help me choose blocks for those
   packs carry the book list as text in the meantime.
3. Optional: automated collections per age (packs and books, sorted best selling) and pick them in Age picks. Without
   them it uses Voxblock Starter Pack Bundles and Audiobooks Global filtered by age.

### PostHog

1. Person property `has_bought_player`: in the checkout custom pixel's `checkout_completed` handler, add
   `$set: { has_bought_player: true }` to the event when a line item's product type is Player or Starter Pack (or its
   title contains "player", "starter pack" or "intro pack").
2. Feature flag `has-bought-player`: boolean, release condition person property `has_bought_player` = true, 100%.
3. Experiment on flag `player-prospect-targeting`, variants `control` and `test`, 100% rollout, no release conditions
   (the theme never reads the flag for owners, so they record no exposure). Primary metric: player/pack orders per
   visitor; secondary: player/pack add to basket, `klaviyo_form_submit` with `form_role = exit`,
   `exit_form_triggered`.
4. Add `has_player` to the `purchase_attribution` view.

Flag keys can be changed in Theme settings > Visitor targeting.

### Klaviyo

**Exit form** (new popup, Behaviors: "Only show on custom trigger"). A custom trigger overrides the form's own
targeting, so the theme decides who sees it and how often (once per 14 days by default, never after an email is given).

- Step 1 "Before you go — what's holding you back?"
  - How does it work? → `/pages/how-does-it-work?vb_exit=how`
  - Which pack suits my child? → next step with four age buttons →
    `/collections/voxblock-starter-pack-collection?vb_exit=age&vb_age=u5#help-me-choose=u5` (and `5-8`, `8-10`, `10+`),
    which opens Help me choose on that age's favourites
  - Comparing with Yoto or Tonies → `/pages/voxblock-vs-yoto?vb_exit=compare`
  - It's a bit much right now → step with the Klarna line and email for a single-use code (success shows the code)
  - Just looking → close
- Put the form ID in Theme settings > Visitor targeting > Exit form ID.

**Welcome pop-ups** (`UG5z6F` desktop, `TZkSsi` mobile). The theme can't stop a Klaviyo auto-trigger, so:

- To run the experiment: set both forms to "Only show on custom trigger", then set "15% welcome pop-ups" to
  "Experiment control group only". The theme then opens them for the control group with their current rules (desktop:
  after 20s, 60% scroll or exit intent, GB only; mobile: after 40s or 60% scroll; same excluded pages; not for
  identified Klaviyo profiles; not again within 5 or 2 days of closing; never after signing up). The rules are in
  `WELCOME_RULES` in `assets/vb-profile.js`.
- To retire them: "Off" (with the forms still on custom trigger, or set to draft).
- Leave on "Klaviyo decides" until then: owners and paid arrivals will still see them.

### Zigpoll

Retire the exit-intent poll in Zigpoll and keep the post-purchase poll. The theme can't show Zigpoll to one experiment
group only, so either retire it for everyone when the experiment starts or keep it for everyone.

## Help me choose

Blocks in the section (Theme editor > Voxblock Starter Pack Bundles collection > Help me choose):

| Age | Favourite → match | Start smaller | Also a good fit |
|---|---|---|---|
| Under 5 | The Gruffalo → Gruffalo and Friends | The Gruffalo Intro | Little Listeners |
| | Peppa Pig → Peppa Pig Starter | Peppa Pig Intro | Little Listeners |
| | Paddington → Paddington Starter | Paddington Bear Intro | Little Listeners |
| | Bing → Bing Intro | | Little Listeners |
| | Mix → Little Listeners ("Three much-loved first stories, ready to play") | | Gruffalo and Friends |
| | Gift upsell → The Ultimate Gift Bundle | | |
| 5 to 8 | Paddington → Paddington Starter | Paddington Bear Intro | Worst Witch Starter |
| | The Worst Witch → Worst Witch Starter | Worst Witch Intro | Famous Five Starter |
| | The Famous Five → Famous Five Starter | Famous Five Intro | Roald Dahl Selection |
| | Fairy tales → Fairy Tales Intro | | Bedtime Stories |
| | Mix → Young Explorers | | Roald Dahl Selection |
| 8 to 10 | Roald Dahl → Roald Dahl Selection | Charlie and the Chocolate Factory Intro | Percy Jackson |
| | Percy Jackson → Percy Jackson | | Famous Five Starter |
| | The Famous Five → Famous Five Starter | Famous Five Intro | Roald Dahl Selection |
| | The Worst Witch → Worst Witch Starter | Worst Witch Intro | Roald Dahl Selection |
| | Mix → Roald Dahl Selection | Charlie and the Chocolate Factory Intro | Percy Jackson |
| 10 and over | Percy Jackson → Percy Jackson | | Famous Five Starter |
| | The Famous Five → Famous Five Starter | Famous Five Intro | Percy Jackson |
| | Mix → Percy Jackson | | Famous Five Starter |

Tiles use the pack photo until cover art is added to each Favourite block. The result headline is the block's own, or
the gift / family headline. "Player colour" starts on Orange where it's in stock.

Links: `#help-me-choose` opens it on any page that has the section; `#help-me-choose=5-8` skips to that age's
favourites. Elsewhere, the grid card button goes to its link with the same hash.

## Still open (from the spec)

- Consent: the default keeps the profile across visits only with consent; confirm with whoever owns GDPR.
- Discount size and expiry for the exit form's step 2 code; whether to keep, gate or test `15WELCOME`.
- 10+ has three packs; Help me choose offers two favourites for that age.
- The age claim ("3 to 11" vs "toddlers to teens") before any objection 6 copy is added.
