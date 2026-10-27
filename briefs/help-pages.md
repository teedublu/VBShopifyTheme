# Help pages: one small set of help pages (26 Oct 2026)

Status: branch `claude/help-pages`, draft theme "Help pages (claude/help-pages)" (id 200687190400, duplicate of live +
changed files by API, checksums verified), draft PR. **Awaiting owner check, phone and desktop, then merge, then the
admin steps below.** Plan and decisions: LPS project doc `claude/help-pages-review.md`; light facts:
`claude/player-lights-reference.md`; design: canvas "Quick fixes page mockup" (artifact Cq9v6e46hbUrFBxTwKCXX3).

## Pages
| Page | URL (handle) | Template | Replaces |
|---|---|---|---|
| Help centre | /pages/help | `page.help` | help.voxblock.co.uk (Gorgias) |
| Using your player | /pages/player-guide | `page.player-guide` | audiobook-player-functionality, charging-your-voxblock, voxblock-quick-start-guide |
| Quick fixes | /pages/quick-fixes | `page.quick-fixes` | troubleshooting on voxblock-faq and voxblock-returns |
| Delivery and returns | /pages/delivery-and-returns | `page.delivery-and-returns` | delivery-information, voxblock-happiness-guarantee, voxblock-returns |
| FAQs | /pages/voxblock-faq (kept) | `page.faq` (rebuilt) | |
| Contact us | /pages/contact-us (kept) | `page.contact` (rebuilt) | /pages/contact |

The four new pages exist in admin, **unpublished** (created 26 Oct). Preview any template on the draft theme with
`/pages/voxblock-faq?preview_theme_id=200687190400&view=<suffix>`.

## Build
- Sections: `help-hero` (tinted band, Help centre trail + BreadcrumbList JSON-LD, H1, optional Ask Saga button via
  `data-saga-open`, jump links), `help-cards` (tiles or link cards; also the four-part promise), `help-topic` (one
  anchored topic: text, picture, numbered steps, table rows, note box, file downloads, links), `help-contact`
  ("Still not right?" band), `player-lights` (every light, linking to its quick fix), `quick-fixes`.
- Snippets: `player-light-icon` (play button / battery icons in the real LED colours), `help-icon`.
- Styles: voxblock.css "HELP PAGES" (theme-wide; `--led-*` LED colours and `--help-tint` defined once). Script:
  voxblock.js "HELP PAGES" and "QUICK FIXES".
- Quick fixes: one "Light" block per state (13), all answers rendered server-side (work without JS; with JS one shows
  beside the player). Deep links for customer service and Saga: `/pages/quick-fixes#light-<id>`:
  off, pulse, blue, green, orange, **pink**, volume, battery-off, battery-green, battery-red, battery-red-flashing,
  charging, charged; `#restart`; `#first-players` (players with a switch on the back). Flashing only under the
  pointer, never with reduced motion. Test mode: how to get out only. Players never called V1/V2.
- Titles and meta descriptions in `layout/theme.liquid`, keyed on the template suffix (help, player-guide,
  quick-fixes, delivery-and-returns, faq, contact): help-pages-review.md section 5. No negative words in titles or H1s.
- JSON-LD: BreadcrumbList on every page but the hub; one FAQPage on /pages/voxblock-faq ("The audiobooks" section).
- PostHog: `help_click` { target, page } (cards, links, contact band, Saga button, downloads);
  `quick_fix_view` { state, source: chip | tile | link }; `quick_fix_model` { model }.

## Copy decisions made in the build (owner to check)
- Delivery page puts the four-part promise first; "Repairs: 2-year guarantee and repairs for life" holds the H2 for the
  old returns searches. Statutory rights line links the refund policy.
- Audiobooks, accessories, school packs: "within 30 days, get in touch first, postage back is yours; damaged or faulty
  on arrival we put right at our cost" (13 Oct decision + legal floor).
- Registered (non-website) players: deliberately vague ("so we can look after it if it ever needs a repair") until
  the open question on which promise parts apply is answered.
- Contact form gets "What is it about?" (required dropdown) and "Order number" fields; the topic-led quick-fix
  suggestions are a "Quick answers" card row above the form, not a dynamic picker.
- FAQ trimmed: charging and troubleshooting answers now short with links; schools questions not added (no facts
  page yet). "Lights and quick fixes" keeps "Why is the play button pink?" for that search.

## Not done (owner go-ahead needed; live changes)
1. Publish the four pages after merge.
2. Redirects (301): audiobook-player-functionality, charging-your-voxblock, voxblock-quick-start-guide → player-guide;
   voxblock-returns, voxblock-happiness-guarantee, delivery-information → delivery-and-returns; contact → contact-us.
   register-your-player stays (it has the form).
3. Menus: Help drawer and footer Help list → the six pages; footer link "Returns" → "Delivery and returns".
4. Retire the Gorgias help centre (check its automations first) and point help.voxblock.co.uk at /pages/help.
5. Delete unpublished /pages/refunds and /pages/repair-your-voxblock-player.
6. Saga's facts file: Australia, original packaging, quick-fix links (help-fact-fixes.md section 9).
7. Update internal links to the old URLs (product pages, Klaviyo emails, printed quick start card / QR code).

## Open questions
Test-mode colour on shipping firmware (white or pink); how to leave firmware-update mode; bedtime still 20 minutes;
standby time; forever repair when a player can't be fixed; promise parts for registered players; 100 days from
purchase or delivery.
