# Brief: Homepage targets the "kids audiobook player" search group

Status: branch `claude/homepage-kids-player` (from `main`), draft PR #74, draft theme `VBShopifyTheme/claude/homepage-kids-player` (id 199842660736, a duplicate of live with the changed files pushed by API). **Owner to check phone + desktop before merge.** Checked in the preview HTML: one H1, new title and description, FAQPage JSON-LD present.
Design: canvas "Voxblock Homepage SEO Mockup" (https://claude.ai/artifact/6iwDoA6GxW5VwMZDDgnbWW). Design system "Voxblock" (https://claude.ai/artifact/RvJWci3xEpbVTSCay6m9ph).

## Why
The homepage is the lead page for the kids player search group (~60 phrasings, roughly 1,700 UK searches a month: kids audio player, kids audiobook player, audio player for kids, story player for kids…). It ranks on page 1 for most but rarely top 3. Its title said "Children" while most searches say "kids", its H1 was "No screens. No wi-fi. No apps." and nothing above the fold used the searched words. Source: Search Console (UK, 90 days to 10 Oct 2026), DataForSEO, live Google UK results test (11 Oct).

## What changed (templates/index.json, layout/theme.liquid)
- **Title and meta description** (theme.liquid override, `request.page_type == 'index'`): "Kids Audiobook Player | Screen-Free Audio Player | Voxblock". Overrides the admin homepage title.
- **Hero** (`media_with_text_hjyKYh`): H1 "The screen-free audiobook player for children" (`title_tag` h1), eyebrow "No screens. No wi-fi. No downloads.", new hero line (ages 3 to 14+, no wifi/downloads/subscriptions), trust line (free UK delivery over £25, 100-day guarantee), second button "See how it works". No section-specific colours: heading, text and buttons use the theme styles (the earlier hero-only colour fixes were reverted; contrast is fixed theme-wide).
- **Meet Voxblock** (`rich_text_K9xkcG`): its `<h1>` becomes `<h2>` "An audio player for children that just works" (one H1 per page), with new copy: speaker/headphones, 16-hour battery, bedtime mode, 350+ audiobooks. "Trusted by families…" sentence kept.
- **Header** (`sections/header.liquid`): on the homepage the logo was wrapped in an `<h1>`; now a `<div>` with the same class, so the hero H1 is the only one.
- **Features hotspots**: heading "Features" → "Finally. Audiobooks without the fussy tech." (marketing line moved from the hero; subheading kept).
- **New FAQ** (`faq_home_prepurchase`, existing `faq` section, so FAQPage JSON-LD is emitted): 9 pre-purchase questions, placed before "Begin with our Starter Packs".
- Layout (owner chose the mockup, 11 Oct): hero text left-aligned in a cream rounded block beside a rounded image (media-with-text spacing "medium"); Meet Voxblock is now a media-with-text section (`media_with_text_meet`): image left (the Features hotspot photo, so it appears twice on the page), eyebrow, H2, two paragraphs, no button. The old rich-text version is disabled, not deleted, and still holds the "Trusted by families…" line. Only theme section options used; buttons are theme style.
- Everything else unchanged and in the same order.

## SEO check on the draft (11 Oct)
- Title 59 chars, meta description 160 chars, canonical `/`, indexable. One H1 (the hero), server-rendered. FAQPage JSON-LD with 9 questions, incl. "How does a kids audiobook player work?".
- Fixed: hero image (the largest image above the fold) was lazy-loaded; `media-with-text` now loads its image eagerly with high priority when it is the first section on any page. Hero image had no alt text; alt set on the Shopify file (also improves live).
- Left as is: the stats band renders "350+" and "30.5m" as H2s (theme impact-text section); the "Under 5's" age tile links to the player, not an age collection; hero PNG is 1.2 MB (Shopify serves ~390 KB WebP).

## SEO review (11 Oct, draft vs live, Google UK)
- On-page basics pass: Lighthouse SEO 100 (draft and live), one server-rendered H1, title/meta in length, canonical, WebSite + Organization + FAQPage + VideoObject schema, OG image set.
- Rank today: the live homepage is not in the top 12 organic results for "kids audiobook player" or "audio player for kids"; it is cited in Google's AI overview (quoting the old "Connectivity free" text). Page 1 is reviews and listicles (Wired, Rhubarb and Wren, Whinge Whinge Wine, Parents), Yoto's product page, retailers, Reddit/Mumsnet threads.
- Content: ~450 words of descriptive copy (830 incl. product cards). Yoto Mini's ranking page has ~1,300: age stages, specs, box contents, 15 FAQs.
- Gaps against what searchers ask (People also ask): best player for toddlers / 3-year-olds; what can my child listen to audiobooks on; alternatives to Tonies / Yoto.
- Generic H2s waste heading weight: "Testimonials", "Newsletter", "#wearevoxblock".
- Performance (Lighthouse mobile, lab): live 45, draft 40; LCP 8–9 s, TBT 1.3–1.8 s. Mostly script work in the page itself (apps and inline scripts, ~390 KB HTML) and theme.js; site-wide, not homepage copy. Check field data in PageSpeed Insights.
- Accessibility 86–89: contrast (open item), small tap targets, focusable items inside hidden carousels.

## Content added after the SEO review (11 Oct)
- Age tiles section: eyebrow "For every age", H2 "Audiobooks for children aged 3 to 14+", intro on how listening changes by age. Tiles now link to the age collections (`voxblock-audiobooks-under-5s`, `audiobooks-5-8-years`, `audiobooks-8-10-years`, `audiobooks-10-to-teens`) instead of the player page and filtered URLs; labels "Under 5s", "5 to 8 years", "8 to 10 years", "10 to teens".
- FAQ: 11 questions (was 9). Added "What can my child listen to audiobooks on?" and "Is Voxblock suitable for toddlers?" (both from Google's People also ask). Every answer expanded to 2–3 sentences, with links to the age collections, starter packs and the Yoto comparison.
- Headings: "Testimonials" → "What parents say about Voxblock"; "#wearevoxblock" → eyebrow, H2 "Follow Voxblock"; "Newsletter" → "Hear about new audiobooks first".
- Owner to confirm two claims: most 3 year olds can choose and play a story on their own; under 5s can choose and play by themselves.

## Performance (11 Oct, Lighthouse mobile lab)
- Cause of the slow hero (LCP 8–9 s): the hero image and text were faded in by theme JS (`reveal-on-scroll`), so they stayed invisible until scripts finished. `media-with-text` now skips the fade-in and loads its image eagerly when it is the first section on a page. Draft LCP 9.3 s → 3.8–4.4 s.
- Page frozen (TBT 1.3–2.6 s) is script and layout work, mostly not theme: 44 inline scripts (109 KB) and 62 script tags from apps and Shopify (BOGOS free gifts, Pandectes cookie banner, Klaviyo, PostHog, GTM, Facebook, OpenAI pixel, Trustpilot, Zigpoll, back-in-stock), Shopify pixels (287 KB), Shop Pay wallet preloads (674 KB, 69 low-priority requests after load). Style and layout 3.7 s from a 2,286-element page (two product carousels with 11 + 6 products, both hot-spot layouts, testimonials, logos).
- Owner decisions for TBT: which apps must run on the homepage (Zigpoll, BOGOS, back-in-stock are candidates to limit to cart/product pages); fewer products in "Best-selling audiobooks" (11 → 5); autoplay video below the fold set to play on click.

## Copy rules applied
Sentence case for every heading, eyebrow and button ("Best-selling audiobooks", not "Best-selling Audiobooks"); only names keep capitals (Voxblock, Roald Dahl, Yoto, UK). No "no apps" claims (owner, 11 Oct: a Voxblock-branded app is coming for MYO). Use no downloads, no streaming, no wifi, no subscriptions, nothing to set up. Customer quotes left as written.
"Children" in body copy and headings; "kids" in the title tag, meta description and one FAQ question, where people search with it. Facts: ages 3 to 14+ (owner confirmed min age 3), battery up to 16 hours (owner confirmed), 350+ audiobooks, free UK delivery over £25, 100-day money-back guarantee. No prices hard-coded.

## Not in the theme (owner actions in Shopify admin, after approval)
- 301 redirects to `/`: `/pages/kids-audio-player`, `/pages/audiobook-player-for-kids`, `/pages/reasons-to-buy-voxblock` (low traffic, compete with the homepage).
- `/pages/kids-audiobook-player-starter-pack`: keep (Google Ads landing page, 783 paid sessions in 90 days); change its SEO title to target "starter pack" rather than "kids audiobook player".
- `/pages/voxblock-faq` says "from age two": change to 3+.
- Site-wide: theme button colours still put white text on orange and on `#4cb6ac`; fix in a separate change.

## Measure
Baseline (UK, 90 days to 10 Oct): homepage 5,998 impressions, 117 clicks, average position 5.8 on player searches (kids and generic phrasings combined). Check Search Console 4 and 8 weeks after going live. Add the homepage to the next performance review.
