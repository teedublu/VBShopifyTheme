# STATUS

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
