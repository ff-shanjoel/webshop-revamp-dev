# CLAUDE.md — The Flooring Supply Centre (TFSG) Shopify theme

Instructions for Claude Code (and any developer) working in this repository. Read this first, then
[`README.md`](README.md) for the full how-to. When this file and the README disagree, the README is the
user-facing source of truth — fix whichever is out of date.

---

## 1. What this project is

- A custom Shopify theme for **The Flooring Supply Centre** (brands: **Facility Flooring** and
  **4EarthSolutions**), built **on top of Shopify's Dawn 16.0.0**.
- Store: `theflooringspecialistgroup.myshopify.com` · public domain `theflooringsupplycentre.ie`.
- Design concept **"V8 Slate"**: muted slate blue, Manrope font, radius 8, max width 1320px,
  Chadwicks.ie / Pittman.ie-style clean layout.
- Everything customer-facing is our own **`fsg-`** sections, snippets and assets. Dawn supplies the
  cart, checkout hand-off, predictive search and accessibility plumbing.
- The **live store still runs the old Fashionopolism theme**. Our themes are unpublished drafts until
  launch.

## 2. Branches, themes and who does what

| Branch | Shopify theme | Purpose |
|---|---|---|
| `dev` | **TFSG – DEV** | All work lands here first |
| `master` | **TFSG – MASTER** | Approved work only, via pull request from `dev` (not published yet) |
| `dawn-upstream` | — | Stock Dawn only, used for three-way Dawn updates (README → "Updating Dawn") |

- Both themes sync through the **Shopify GitHub integration**. A push syncs to the theme (usually
  under a minute, sometimes ~10). Theme-editor edits are committed back by `shopify[bot]`, so
  **always `git pull` before starting**.
- **The user commits and pushes themselves.** Do not commit, push, merge or open PRs unless asked.
  At the end of a change, give them a ready-to-paste commit message.
- **Commit messages become the release notes** (`.github/workflows/release.yml` creates a GitHub
  Release on every merge to `master`). Write the subject as one plain sentence about what changed,
  e.g. "Add cart quantity loader and fix mobile price overlap". Bullets underneath are fine.
  Do **not** add entries to `release-notes.md` — it is frozen history up to PR #4.
- Never commit straight to `master` and never edit TFSG – MASTER in the theme editor.

## 3. Standing rules from the user (always follow)

1. **Keep the UX clean and simple.** Any product and the checkout should be a few steps away. Prefer
   fewer sections, clear labels and direct add-to-cart. Don't add content-heavy sections for their own
   sake.
2. **Update `README.md` with every change** (new/renamed files, settings, Shopify admin dependencies,
   gotchas, workflow) and **say so in the closing message** ("README updated: …" or
   "Reminder: README still needs …"). README structure: 6 numbered sections + 2 fold-out references
   (file tables grouped by Styles / Scripts / Logos / Layouts / Sections / Snippets / Templates;
   Updating Dawn). Put changes in the right place; don't add new top-level sections without need.
   - New `fsg-` file → row in the matching table in "Reference: files".
   - New Shopify admin dependency → section 4 table. New gotcha → section 5.
   - Dawn core file edited → "Dawn files we changed" table.
3. **Ask before risky or outward-facing actions** — anything that changes the live store (see §6),
   sends email/forms, or deletes data.
4. When the user asks for **"just tell me, don't change anything"**, only answer.
5. **Emails for the client**: short, simple English, no "your", no questions unless asked. Sign off
   "Joel". Give them in a fenced/quoted block ready to paste.
6. Pronouns: use they/them for people unless stated.

## 4. Code conventions

- **Prefix everything custom with `fsg-`**: sections, snippets, assets and CSS classes.
- **Design tokens, not hard-coded colours.** Theme settings → *FSG design* → CSS variables from
  `snippets/fsg-tokens.liquid` (`--fsg-slate`, `--fsg-slate-dark`, `--fsg-accent`, `--fsg-ink`,
  `--fsg-ink-2`, `--fsg-ink-3`, `--fsg-mist`, `--fsg-mist-2`, `--fsg-line`, `--fsg-white`,
  `--fsg-radius`, `--fsg-radius-lg`, `--fsg-gutter`, `--fsg-max`, `--fsg-font`, …).
- Main stylesheets: `assets/fsg-base.css` (header, footer, shared), `assets/fsg-sections.css`
  (homepage/reusable sections), `assets/fsg-pages.css` (inner pages — **only loaded by sections that
  include it**, not on the homepage), `assets/fsg-cart.css`.
- Scope resets with `:where(.fsg)` so they don't beat component styles; watch specificity against
  Dawn and against our own older media-query rules (e.g. the slider needed
  `.fsg-featured__grid.fsg-featured__grid--slider`).
- Sections must have a `{% schema %}` with sensible defaults and a **preset**. Prefer adding a
  **setting/toggle** for a new layout so it can be switched back in the theme editor
  (e.g. tiles `layout`, featured `slider`, help band `show_form`).
- Scroll fade-in uses `.fsg-rv` (IntersectionObserver). Don't put `.fsg-rv` on items inside a
  horizontal scroller — sideways items never trigger it and stay invisible.
- Images: render with `snippets/fsg-image.liquid` (image picker → product-photo fallback, srcset,
  lazy except `eager: true` for above-the-fold).
- Icons: `snippets/fsg-icon.liquid` (`{% render 'fsg-icon', icon: 'phone', size: 18 %}`); add new
  paths there.
- **Leave Dawn's files alone** where possible. Intentional edits only in `layout/theme.liquid`
  (4 hooks), `config/settings_schema.json` (FSG design group), header/footer section groups and the
  JSON templates. Dawn's `#cart-icon-bubble` markup and `product-form` quick add must keep working.
- Mobile: form fields at least **16px** font (stops iPhone zoom); no horizontal page scroll at 375px.
- Dawn's cart CSS gives cells fixed widths for its table layout (e.g. `.cart-item__details` 35rem /
  50rem). Our cart is a grid, so override with `width: auto; min-width: 0`, and always test the cart
  at ~1024px (summary column beside the items) as well as desktop and phone.

## 5. Shopify upload rules (theme check does not catch all of these)

- `range` settings need **≥ 3 steps** and ≤ 101 (`(max − min) / step`); JSON values must sit on a step.
- `url` and resource settings in JSON templates must point to something that **exists in the store**.
  Leave empty and fall back in Liquid instead.
- If a section file is rejected, every template using it is rejected too (symptom: DEV shows the old
  layout). Diagnose via Online Store → Themes → ⋯ → *Edit code* → paste the file → *Save*.

## 6. The live store shares data with our themes — be careful

Products, **collections**, **menus**, pages, files and checkout settings are **shared by every theme**,
including the live Fashionopolism theme.

- **`main-menu` is shared** → the "Shop all" and "Shop by business" header links are added by the theme
  (header settings `show_shop_all`, `business_label`, `business_link`), not by the menu. At launch,
  consider a separate menu for the new theme.
- The 8 client categories were created as new collections and products were **added, not moved**
  (old collections untouched). Tidy old collections only at launch, with the user's say-so.
- Creating pages/collections makes them reachable by URL on the live store, but nothing on the live
  theme links to them.

## 7. Local preview and checks

```bash
git checkout dev && git pull
shopify theme dev --store theflooringspecialistgroup.myshopify.com   # → http://127.0.0.1:9292
shopify theme check                                                   # fsg- files should be clean
```

- Use the `.myshopify.com` address. Login codes expire in minutes; `{"error":"unauthorized"}` means
  re-run and confirm the code. `EADDRINUSE :9292` means a preview is already running (reuse it).
- The preview injects a Shopify bar (`#PBarNextFrameWrapper`) — remove it in the browser before
  measuring or screenshotting.
- **Always verify visually** on desktop (~1024 and ~1366 wide) and on a phone (375×812): homepage,
  a collection, a product with options (add to cart), cart, search. Check no horizontal overflow.
- This is a Windows machine (Git Bash + PowerShell). Python is not installed; use Node (e.g. `sharp`
  in a scratch folder) for image work.

## 8. Working with the Shopify Admin connector (if available)

Admin API **2026-10** rejects deprecated fields. Things that work:

- **Upload images to Files**: `stagedUploadsCreate` (resource `IMAGE`, `httpMethod: POST`) → POST the
  file with the returned form parameters → `fileCreate` with `originalSource` = `resourceUrl`,
  descriptive `filename` and `alt`. Reference in templates as `shopify://shop_images/<filename>`.
- **Create collections**: `collectionCreate(collection: CollectionCreateInput)` with `sources`
  (`productType` conditions for automatic, `selections` for hand-picked). The old `input`/`ruleSet`
  and `collectionAddProducts` are deprecated → use `collectionUpdate(collection: { id, sourcesToCreate })`.
- New collections are unpublished: `publishablePublish` to **both** publications
  (`gid://shopify/Publication/57113247899` and `…/117925380251`), like existing collections.
- `Publication.name` is deprecated → `catalog { title }`. `collection(handle:)` doesn't exist → query
  `collections(query: "handle:x")`.
- Pages: `pageCreate(page: { title, handle, templateSuffix, isPublished, body })`.
- Checkout branding is **not** reachable via the connector (access denied) — done by hand in admin.

## 9. Content standards

- **Photos**: 1200×900 (4:3) WebP under ~200 KB for cards; hero is wider (currently 1596×941). File
  names `fsc-<product>-<application>-<place>.webp`; always set alt text. Replace a photo with
  **Replace** in Files (a same-name upload gets renamed).
- Contact details used across the theme: **(085) 1234 899**, **info@facilityflooring.ie**.
- Blog handle `news` (shown as "Guides & advice"). Contact page handle `contact` (template `contact`).
- Product descriptions drive the product page: `Lead time: X–Y working days` → delivery estimate;
  bold labels with values below → specifications card; PDF links → download buttons. Products tagged
  `Logo Mats` are made-to-order.

## 10. Current state of the homepage (Nov 2026) — and what was rejected

Order: hero → **Shop by category** (8 large cards with photo + one-line description + count) →
**Best sellers** (one row with left/right arrows and page dots, "View all" top right) → 2 promo
cards → help band **with a contact form** (phone/email as a small line under it).

The 8 categories (collection handles): `entrance-matting` (auto by type), `tactiles-accessibility`,
`trims` (shown as Trims & Profiles), `movement-joints`, `wall-corner-protection` (auto by type),
`car-park-site-safety`, `floor-finishes`, `stock-clearance`. Empty categories show
"Coming soon · ask us" and the collection page offers a quote.

Also: **Shop by business type** page `/pages/shop-by-business-type` (template `business-types`,
section `fsg-business-types`), linked from the header.

**Rejected by the client — don't re-propose unless asked:** compact category tiles (small photo beside
the name), and the "shortened" homepage (4 best sellers, 3-card promo row, hidden help band). The
`compact` tile layout and a `contact` promo block still exist as options but are unused.
Rollback point before these experiments: commit `540e7aa`.

## 11. Open items / deferred (check with the user before starting)

- Checkout and customer-account logo/branding (manual in Shopify admin).
- **Product schema (structured data) is missing** from `fsg-main-product` (lost when replacing Dawn's
  product section) — user said "not now".
- Contact page to be created in admin by the user; then link it wherever needed.
- At launch: a new-theme main menu with the 8 categories; decide what to do with old collections;
  remove COVID items from menus; flag €0-priced products.
- Floor Finishes has sealers/coatings only — no actual flooring products yet.
- Ask the client for the original entrance-mat lobby photo (current copy is 800×600).
- SEO/CRO checklist lives in a Google Sheet ("Facility-Flooring-Revamp-SEO-CRO-Checklist", tab
  *Design & Templates*, columns: Facility Flooring Webshop / FF website / TMC Website). The webshop
  column was filled on 6 Nov 2026; FF website and TMC columns are still empty.

## 12. Handy references

- README sections: 1 Start here · 2 Making changes and going live · 3 Rules and checks · 4 Set up in
  Shopify admin · 5 Troubleshooting · 6 Handover · Reference: files · Reference: updating Dawn.
- Repository owner: `ff-shanjoel` (`github.com/ff-shanjoel/webshop-revamp-dev`) — see README §6 if
  ownership changes.
