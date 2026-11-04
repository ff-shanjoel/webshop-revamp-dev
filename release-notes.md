# Release notes

Changes to The Flooring Supply Centre theme, newest first. Work lands on `dev` first; when it is
merged to `master` (by pull request), move its entry from **Unreleased** to **Released to `master`**
under the merge date.

Based on [Dawn 16.0.0](https://github.com/Shopify/dawn/releases) by Shopify. Dawn's own release
history lives on GitHub; it is not repeated here.

> TFSG – MASTER is **not yet the published theme** — the live store still runs Fashionopolism.
> "Released to `master`" means approved and synced to TFSG – MASTER, ready to publish.

---

## Unreleased (on `dev`)

### Cart quantity loader
- Changing a quantity on the cart page now shows a clear loading state on that row: a sliding
  accent bar along the top, a tinted border, the row dimmed and a small spinner where the price
  goes. With reduced motion on, the bar stays still.
- Fixed on phones: the line total no longer overlaps the product name.

### Cart popup polish
- Close button on the "Item added to your cart" popup is now a round button lined up with the
  heading (Dawn's negative margins pushed it into the corner); green tick in a soft circle and a
  divider under the header.

### 4 November 2026
- README simplified into six numbered sections with fold-out references; the file reference is now
  grouped tables.

---

## Released to `master`

### 4 November 2026 — pull request #2
- **Shop all** page (`/collections/all`) and a **Shop all** link in the header menu and phone menu.
- **Filter sidebar** on Shop all and every collection page: categories grouped like the menu,
  availability and price filters, active-filter tags; a slide-in **Filters** panel on phones.
- README: how to bring in Dawn updates safely; `dawn-upstream` branch set up.

### 27 October 2026 — pull request #1
- **404 page** redesigned: search box, quick links and popular category tiles.
- **Favicon** and phone home-screen icon from the FSC mark.
- **Coming-soon (password) page** redesigned, with its own `fsg-password` layout.
- **Gift card page** redesigned (balance card, copyable code, QR code, Apple Wallet, print).
- Fixed a full-width loading spinner that flashed in the header search on a hard refresh.
- Added the project README; restored `LICENSE.md`, `.theme-check.yml`, `.prettierrc.json`,
  `.gitignore` and these release notes, which held misplaced theme code from the original export.
- **Hero** uses a wide AluClick entrance-mat photo; new *Photo focus* setting.
- **New FSC logo**: dark version in the header, white version in the footer.
- **Blog, article, general page and contact page** templates; **policy pages** tidied into
  paragraphs and headings with a side menu.
- **Product details** rebuilt from descriptions: facts chips, specifications card, feature lists,
  steps and PDF downloads. The delivery estimate uses each product's own lead time.
- **Search results page** with filters; filter bar shared with collection pages.
- **Cart page and cart popup** redesigned (steps, summary, help box); **All categories** page.
- **Product page** (option steps, delivery estimate with cut-off countdown, sticky add to basket)
  and **collection page** (filters, sort, category chips, delivery line on cards).
- **Header** (utility bar, search, call button, cart), **mega menu** as photo tiles, **footer** and
  **homepage** (hero, categories, best sellers, promo cards, help band); category bar tinted; search
  results dropdown restyled with photos and prices.
- Fixes for Shopify GitHub sync: range settings need 3+ steps; no links to missing pages.
