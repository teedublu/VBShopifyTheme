# Brief: Gruffalo character + cast pages

Status: branch `claude/gruffalo-pages`, draft theme `VBShopifyTheme/claude/gruffalo-pages` (id 199796130176), draft PR.
**Not merged; awaiting owner check.**

## Why (PostHog, 30 days to 9 Oct; Search Console 9 Sep to 8 Oct)
| Landing page | Sessions | Google | Phone | Bounce | Median time | Avg scroll | Reached player/pack |
|---|---|---|---|---|---|---|---|
| /pages/characters/the-gruffalo (cast) | 813 | 80% | 35% | 59% | 10s | 25% | 0.4% |
| /pages/character/the-gruffalo | 609 | 86% | 19% | 81% | 8s | 30% | 0.3% |
Top searches: "gruffalo characters", "gruffalo" (largely Google Images), "the gruffalo", Fox / Owl / Mouse.
Before: the character page's Starter Pack button was at 4,662px of 7,974 on 1366x768 (visitors reach ~2,400px);
the cast page had no product or pack link at all.

## What changed
1. New section `sections/story-hero.liquid`: character artwork (setting, else the metaobject's first photo, else the
   first photo of the first item in its `list`), eyebrow, H1, intro, one-minute sample (`.bookpreview`, same player as
   elsewhere), the Gruffalo and Friends Starter Pack (live price, was price, Save %), "Just the audiobook, £9.99",
   "See school packs" and an optional extra link. Desktop: text + actions left, art right, all within 768px.
2. `templates/metaobject/character.gruffalo.json` (the-gruffalo, owl, fox, snake): story hero replaces the old hero and
   the separate listen section (both kept, disabled); "Take the story further" + "Just the audiobook" move up to sit
   after the quick answers.
   Owl, Fox and Snake used to show the H1 "What is a Gruffalo?"; they now get "[name] in The Gruffalo" and their own
   description (setting `main_handle` = the-gruffalo).
3. `templates/metaobject/characters.gruffalo.json` (cast page): story hero replaces the intro (kept, disabled), with
   "Read the story overview" as the extra link; the bottom listening block now links to the product, and its copy says
   "downloads" instead of "app".
4. Redirect `/authors/julia-donaldson` → `/pages/author/julia-donaldson` (the link sits in the Gruffalo character's bio
   in Shopify; it was a 404).
5. Tracking: PostHog `story_hero_click` { target: pack | audiobook | schools | secondary, page }; samples already send
   `sample_played`.

## Checked (draft theme)
1366x768: on /pages/character/the-gruffalo the whole hero (sample at 413px, pack at 498px) ends at 723px. Cast, Owl,
Fox, Snake render with their own art, H1 and intro; no Liquid errors; no horizontal overflow. 375x812: art, H1, intro,
sample, and the top of the pack card in the first screen. Sample button toggles the shared player.
Structured data: BreadcrumbList, FAQPage, Person; no Product markup on these pages (not a Merchant Center feed cause).

## Not done / flags
- The empty "character_faq" on the Gruffalo page is intentional (hidden on the-gruffalo; shown on Owl/Fox/Snake).
- Owl's bio in Shopify starts with a level-1 heading, so the Owl page has two H1s. Change it to a level-2 heading in
  the metaobject.
- Owl, Fox and Snake still show the Gruffalo-specific "answers" and Gruffalo FAQ sections from the shared template.
- Mouse uses the default character template and is unchanged.
- No per-character sample buttons on the cast grid: there is one sample (The Gruffalo), so one button in the hero.
- Re-read 30 days after launch: same table, plus `story_hero_click` by target.
