# Brief: Children's CD player page

Status: branch `claude/childrens-cd-player-page`, draft theme `VBShopifyTheme/claude/childrens-cd-player-page`, draft PR.
**Not merged; awaiting owner check.** Source brief: LPS `briefs/brief-childrens-cd-player-page.md` (written 12 Oct 2026,
SEO plan locked 11 Oct). Keyword group: Children's CD player, 1,000 UK searches a month (2,900 in November); the site
does not rank for it today.

## What changed
1. New template `templates/page.childrens-cd-player-alternative.json`, built from the alternative-page structure
   (PR #77, `page.alternative-to-toniebox`). Sections, top to bottom:
   hero (`media-with-text`) · trust row (`press`, IndyBest + Trustpilot) · "Why parents still look for a CD player"
   (`rich-text`, 121 words) · comparison table, Voxblock vs a children's CD player (10 rows) · "How it works"
   (`story-steps`, 3 steps) · starter packs (`featured-collection`, four packs, `#packs`) · three parent reviews
   (`testimonials`) · closing band (`rich-text`) · FAQ (6 questions, emits FAQPage JSON-LD) · cross-links ·
   "How we compared" small print.
2. Title and meta description set in `layout/theme.liquid` for page handle `childrens-cd-player-alternative`
   (title: "Children's CD Player Alternative: Audiobooks | Voxblock", 55 characters).
3. Homepage FAQ "What can my child listen to audiobooks on?" gets one line linking to the page (`templates/index.json`).
4. Two optional settings on shared sections, both off by default so other pages are unchanged:
   `story-steps` gets `anchor_id`; `comparison-table` gets `cta_track` (button tracking name).
5. Tracking (PostHog `vs_yoto_click` { target, page }): `cd_page_hero` (+ `_secondary`), `cd_page_table` (+ `_sticky`),
   `cd_page_pack` (closing band, + `_player`), `cd_page_crosslink_*` on the cross-links.

## Decisions taken from the brief
- Honesty rule held: the page says in three places that Voxblock does not play CDs (why section, table row "Plays your
  old CDs: No", FAQ). The table keeps that row with a cross for Voxblock.
- Prices are not hard-coded for Voxblock: the table reads the player price live from `voxblock-player`; pack cards read
  theirs. The CD player range ("About £25 to £60", checked 12 October 2026) is dated in the column note and the small
  print.
- Packs shown in age order: Little Listeners (under 5s), Gruffalo and Friends, Roald Dahl Selection, The Percy Jackson
  (all active and published). The brief names the same four.
- "kids" appears only in the meta description. "wifi" without a hyphen, as in the brief and STATUS copy rules.
- Reviews are copied word for word from live templates (Ian, E Joyce, Laura).

## Differences from the brief, for the owner to confirm
- **Title tag:** the brief's draft ("Children's CD Player Alternative: Audiobooks, No Discs | Voxblock") is 65 characters
  against its own 60 limit. Built with the 55-character version without "No discs". The meta description (147) carries
  "No discs to scratch".
- **Row label:** "Wifi or app needed" became "Wifi or downloads needed", to follow the "never no app" rule (a Voxblock
  app is coming for MYO).
- **Stories row:** "350+ unabridged audiobooks" became "350+ audiobooks, from picture books to unabridged novels";
  the catalogue holds abridged titles too.
- **Price row:** no price row in the table body; prices sit in the column headers (live for Voxblock).
- **Closing band added** (as on the Yoto and Toniebox pages) so `cd_page_pack` has a button to track. Pack-card clicks
  themselves are not tracked, as on the sibling pages.
- **Table images:** none. There is no licensed CD-player photo, and one picture against a blank slot looks lopsided.
- **Brief says packs "match the 9 Oct decision":** that decision picked Young Explorers for 5 to 8; the brief and the page
  use Gruffalo and Friends.

## Open questions from the brief
1. URL: built for `/pages/childrens-cd-player-alternative` (the brief's proposal). The shorter `/pages/childrens-cd-player`
   ranks better but is less honest. Changing it needs one handle in admin and the `page.handle` check in
   `layout/theme.liquid`; the template name is independent of the URL.
2. Hero photo: reuses `player-boy-listening-independance.jpg` (child with player and a book, headphones on), the same
   photo as the Yoto and Toniebox pages. Swap if a better "CD replacement" photo exists.
3. Reviews mentioning CDs or tapes: not checked (Trustpilot could not be opened from the build session). The three
   reviews shown are general. Replace with CD or tape mentions if there are any.

## Admin steps after merge (not in the theme)
- Page created in admin on 12 Oct, **unpublished** (id 763270693248, title "Children's CD player alternative", handle
  `childrens-cd-player-alternative`, template suffix `childrens-cd-player-alternative`). Publish it only after this
  branch is merged: until then the live theme has no such template and would render the default page layout. Title and
  meta come from `layout/theme.liquid`, so the admin SEO fields can stay empty.
- Add the page to the Compare menu next to the Yoto and Toniebox alternative pages (Navigation).
- Add one link from the blog post `/blogs/news/what-90s-childhood-got-right-about-entertainment` (it already mentions CD
  players and ranks 4th for "screen free childhood").
- Search Console baseline on launch day (0 impressions for `childrens cd player` on 12 Oct), then read at 4 and 8 weeks.

## Paid search
Shopping-Players-Packs-06 carries a `cd` negative (28 Sep), so it will not show for these searches. Consider a small
Search ad group in Test-02 (`[childrens cd player]`, `"kids cd player"`) at the £0.60 cap once the page is live. Decide in GRO.
