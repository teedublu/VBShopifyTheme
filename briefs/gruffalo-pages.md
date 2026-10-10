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

## Round 2 (owner: "top bar good, rest needs work"; teacher CTA; audiobooks in the classroom)
Visitors look like teachers: Gruffalo/character visits are 44% weekday 8am–4pm vs 30% site-wide, 62% desktop vs 33%.
Design: "Gruffalo Pages" canvas. Built:
- Story hero: under the sample, two routes side by side: **At home** (starter pack card) and **In the classroom**
  (email sign-up to Klaviyo "Schools Monthly Email Newsletter" XRcgpd, source "Story page: classroom card", plus
  "School packages, with 10% off for schools" → schools-packs collection). "See school packs" link removed.
- `snippets/school-signup.liquid` + voxblock.js handler (Klaviyo client subscriptions API, same as back-in-stock),
  PostHog `school_signup` { form: hero | band, page }.
- New sections: `character-features` ("What does the Gruffalo look like?": 6 feature cards + 3 short answers with
  the live answer text, Gruffalo page only), `classroom-band` ("Audiobooks work in the classroom": 3 points, sign-up,
  "See school packages" → /pages/audiobook-players-for-schools, "Free teaching resources" → /pages/school-resources),
  `story-steps` (cast page: "In what order do the characters appear?", keeps the "How the cast works" paragraph),
  `story-home-band` (3D cover image kept for Google Images, live starter pack and audiobook prices).
- `character-cast` gets an optional link ("See the full cast guide").
- Character page order: hero, features, "Who else is in the story?" (cast cards), More about / Why it matters (bio),
  classroom band, Gruffalo FAQ (+ "Can children listen to The Gruffalo without a screen?"), character FAQ, more links,
  home band. Old answers / doors / tertiary / listening sections kept, disabled. This also fixes Owl/Fox/Snake
  showing the Gruffalo answers.
- Cast page: hero, full cast grid, story steps, classroom band, cast FAQ, home band.
- SEO guardrails kept: same H1s, titles, metas, FAQ questions, image files, 3D cover. Rendered main text: Gruffalo
  1,199 words (live 1,217), cast 780 (live 591).
- Checked 1366x768 and 375x812 on the-gruffalo, owl, cast: no horizontal scroll, no Liquid errors, two sign-up forms
  per page render. The sign-up was not submitted (would add a real profile); test it with your own email.

## Round 3 (review against live, 10 Oct)
Search Console, 90 days: character page 846 Google Images clicks vs 196 web (81% images); cast page 602 vs 477.
PostHog, 90 days: 2,811 sessions started on the six character/cast pages; 0 purchases in-session, 2 add-to-carts,
13 sample plays. Goal set: keep the traffic, capture teachers (school sign-up, school packages), get the sample
played; sales are a bonus.
- The 3D cover (the page's only Gruffalo image on live, so the likely Images ranker) now sits beside "What does the
  Gruffalo look like?" at up to 836px, alt "The Gruffalo audiobook cover, showing the Gruffalo and Mouse in the deep
  dark wood". Also kept in the home band (now up to 836px).
- Short answers "Is the Gruffalo real?" / "What does Gruffalo mean?" removed (still in the FAQ); added "Who created
  the Gruffalo?".
- Watch after launch: Images and web clicks for both URLs against the numbers above, weekly for 8 weeks.

## Checked (draft theme, round 1)
1366x768: on /pages/character/the-gruffalo the whole hero (sample at 413px, pack at 498px) ends at 723px. Cast, Owl,
Fox, Snake render with their own art, H1 and intro; no Liquid errors; no horizontal overflow. 375x812: art, H1, intro,
sample, and the top of the pack card in the first screen. Sample button toggles the shared player.
Structured data: BreadcrumbList, FAQPage, Person; no Product markup on these pages (not a Merchant Center feed cause).

## Not done / flags
- The empty "character_faq" on the Gruffalo page is intentional (hidden on the-gruffalo; shown on Owl/Fox/Snake).
- Owl's bio in Shopify starts with a level-1 heading, so the Owl page has two H1s. Change it to a level-2 heading in
  the metaobject.
- Set up a Klaviyo welcome flow on the Schools list so classroom sign-ups get a first email of ideas.
- Mouse uses the default character template and is unchanged.
- No per-character sample buttons on the cast grid: there is one sample (The Gruffalo), so one button in the hero.
- Re-read 30 days after launch: same table, plus `story_hero_click` by target and `school_signup` count.
