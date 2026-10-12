# Brief: Children's cassette player page (rebuild of /pages/modern-cassette-player)

Status: branch `claude/childrens-cassette-player-page` (stacked on `claude/childrens-cd-player-page`, PR #83), draft theme
`VBShopifyTheme/claude/childrens-cassette-player-page`, draft PR. **Not merged; awaiting owner check.** No LPS brief
existed for this page: the keyword work was done in the session of 12 Oct 2026 and is recorded here.

## Why this page
- The page already exists and is published: `/pages/modern-cassette-player` ("Voxblock : A Modern Cassette Player",
  published 9 Feb 2024, template `landing-1`, last edited 6 May 2024). It is a 700-word essay with no price, pack link or
  FAQ.
- Search Console, 90 days to 11 Oct: 1,429 impressions for cassette, CD and tape queries, 0 clicks. 1,262 of them are for
  "cassette player deals" (position 10), shopping intent we cannot serve. No queries for children's cassette players, so it
  does not compete with the CD player page.
- UK volumes (DataForSEO, Google Ads, 12 Oct): `childrens cassette player` 260 a month, 480 in Nov 2025 (Google folds
  "kids cassette player" into it); `modern cassette player` 140 (210 in Nov and Dec); `portable cassette player` 1,900
  and `cassette player` 14,800 are adult and music searches, out of scope.
- Results for "kids cassette player" (mobile, 12 Oct): AI overview, eBay, Reddit "Yoto player vs old fashioned
  cassettes", Amazon, Playpolis, Etsy, a 2014 blog. The overview says new kids' cassette players are rare and points to
  charity shops and eBay. People also ask: "Can you still buy cassette players in the UK?", "Is it still possible to buy
  a cassette player?", "What are some good kid-friendly cassette players?".

## What changed
1. New template `templates/page.childrens-cassette-player-alternative.json`: the CD page's structure with cassette copy
   (hero, trust row, why section, comparison table vs a children's cassette player with 10 rows, how it works, four age
   packs, three reviews, closing band, 7-question FAQ with FAQPage markup, cross-links, small print).
2. `layout/theme.liquid`: title "Children's Cassette Player Alternative | Voxblock" (49 characters) and a 152-character
   meta description, keyed on the template suffix, not the handle, so the live page keeps its current title until its
   template is switched.
3. `templates/page.childrens-cd-player-alternative.json`: one extra cross-link to this page.
4. Tracking (PostHog `vs_yoto_click`): `cassette_page_hero`, `cassette_page_table`, `cassette_page_pack`,
   `cassette_page_crosslink_*`.

## Decisions
- H1 "A modern children's cassette player, without the tapes": keeps "children's cassette player" and the old page's
  "modern" angle, and does not claim Voxblock plays cassettes. The page says it does not play cassettes in four places
  (why section, table row "Plays your old tapes: No", two FAQs).
- URL kept (`/pages/modern-cassette-player`): two years old, and "modern cassette player" is the secondary phrase.
- Cassette player price range "About £20 to £60" is dated 12 October 2026 (Amazon UK £19 to £59 and Google Shopping
  results). Voxblock's price is read live.
- Same copy rules as the CD page: sentence case, "children" in body copy, "kids" only in the meta description and
  verbatim reviews, "wifi" without a hyphen, never "no app".
- Reviews (verbatim): Harriet, E Joyce, Ian. None mention tapes (checked the reviews already on the site only).
- The old essay is not carried over as text. Its ideas (tactile, simple, screen-free, portable, a library you keep) are in
  the why section, how it works and the table. The old page also said Voxblock suits "children to the elderly"; that is
  dropped here (the older-listeners pages own that audience).

## Admin steps after merge
- Pages > "Voxblock : A Modern Cassette Player" (id 94496653467): set the theme template to
  `childrens-cassette-player-alternative`. Nothing changes on the live page until then.
- Add to the Compare menu with the other alternative pages.
- Search Console baseline on the day of the switch, then read at 4 and 8 weeks. Success at 8 weeks: page 1 for
  `childrens cassette player` or two long-tail terms.
- The CD page's cross-link to this page works at once; this page's link to the CD page needs the CD page published
  (it is unpublished until PR #83 merges).

## Open
- A photo of a child with the player suited to a "tape replacement" story (the hero reuses the Yoto and Toniebox photo).
- Reviews that mention cassettes or tapes (Trustpilot could not be opened from the build session).
