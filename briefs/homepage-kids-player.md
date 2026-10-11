# Brief: Homepage targets the "kids audiobook player" search group

Status: branch `claude/homepage-kids-player` (from `main`), draft PR into `main`. **Owner to check on a draft theme, phone + desktop, before merge.**
Design: canvas "Voxblock Homepage SEO Mockup" (https://claude.ai/artifact/6iwDoA6GxW5VwMZDDgnbWW). Design system "Voxblock" (https://claude.ai/artifact/RvJWci3xEpbVTSCay6m9ph).

## Why
The homepage is the lead page for the kids player search group (~60 phrasings, roughly 1,700 UK searches a month: kids audio player, kids audiobook player, audio player for kids, story player for kids…). It ranks on page 1 for most but rarely top 3. Its title said "Children" while most searches say "kids", its H1 was "No screens. No wi-fi. No apps." and nothing above the fold used the searched words. Source: Search Console (UK, 90 days to 10 Oct 2026), DataForSEO, live Google UK results test (11 Oct).

## What changed (templates/index.json, layout/theme.liquid)
- **Title and meta description** (theme.liquid override, `request.page_type == 'index'`): "Kids Audiobook Player | Screen-Free Audio Player | Voxblock". Overrides the admin homepage title.
- **Hero** (`media_with_text_hjyKYh`): H1 "The screen-free audiobook player for children" (`title_tag` h1), subheading "No screens. No wi-fi. No apps.", new hero line (ages 3 to 14+, no wifi/apps/subscriptions), trust line (free UK delivery over £25, 100-day guarantee), second button "See how it works". Heading colour `#4cb6ac` → `#197177` (2.4:1 → 5.7:1), text `#4a4a4a`, button text `#1d3f43` on orange (5.6:1; was white, 2.0:1).
- **Meet Voxblock** (`rich_text_K9xkcG`): its `<h1>` becomes `<h2>` "An audio player for children that just works" (one H1 per page), with new copy: speaker/headphones, 16-hour battery, bedtime mode, 350+ audiobooks. "Trusted by families…" sentence kept.
- **Features hotspots**: heading "Features" → "Finally. Audiobooks without the fussy tech." (marketing line moved from the hero; subheading kept).
- **New FAQ** (`faq_home_prepurchase`, existing `faq` section, so FAQPage JSON-LD is emitted): 9 pre-purchase questions, placed before "Begin with our Starter Packs".
- Everything else unchanged and in the same order.

## Copy rules applied
"Children" in body copy and headings; "kids" in the title tag, meta description and one FAQ question, where people search with it. Facts: ages 3 to 14+ (owner confirmed min age 3), battery up to 16 hours (owner confirmed), 350+ audiobooks, free UK delivery over £25, 100-day money-back guarantee. No prices hard-coded.

## Not in the theme (owner actions in Shopify admin, after approval)
- 301 redirects to `/`: `/pages/kids-audio-player`, `/pages/audiobook-player-for-kids`, `/pages/reasons-to-buy-voxblock` (low traffic, compete with the homepage).
- `/pages/kids-audiobook-player-starter-pack`: keep (Google Ads landing page, 783 paid sessions in 90 days); change its SEO title to target "starter pack" rather than "kids audiobook player".
- `/pages/voxblock-faq` says "from age two": change to 3+.
- Site-wide: theme button colours still put white text on orange and on `#4cb6ac`; fix in a separate change.

## Measure
Baseline (UK, 90 days to 10 Oct): homepage 5,998 impressions, 117 clicks, average position 5.8 on player searches (kids and generic phrasings combined). Check Search Console 4 and 8 weeks after going live. Add the homepage to the next performance review.
