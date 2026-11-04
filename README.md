# The Flooring Supply Centre — Shopify theme

Custom Shopify theme for **The Flooring Supply Centre**,
store `theflooringspecialistgroup.myshopify.com`, public domain `theflooringsupplycentre.ie`.

Built **on top of Shopify's Dawn 16.0.0**. Dawn provides the cart, checkout hand-off, predictive
search and accessibility plumbing; everything customer-facing is our own `fsg-` sections, snippets
and assets ("V8 Slate" design: muted slate blue, Manrope, clean and simple, few steps to checkout).

**At a glance**

- Work on **`dev`** → test on **TFSG – DEV** → merge to **`master`** → **TFSG – MASTER** (live once published).
- Everything custom is prefixed **`fsg-`**; Dawn's own files are left as close to stock as possible.
- Menus, collections, filters, pages and checkout branding are set in **Shopify admin**, not here.

1. [Start here](#1-start-here)
2. [Making changes and going live](#2-making-changes-and-going-live)
3. [Rules and checks](#3-rules-and-checks)
4. [Set up in Shopify admin](#4-set-up-in-shopify-admin)
5. [Troubleshooting](#5-troubleshooting)
6. [Handover — if the repository owner leaves](#6-handover--if-the-repository-owner-leaves)
7. Reference: [Files](#reference-files) · [Updating Dawn](#reference-updating-dawn)

---

## 1. Start here

**You need:** [Node.js](https://nodejs.org/) 18+, [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)
(`npm install -g @shopify/cli`), Git with access to this repository, and a Shopify **staff account**
with theme permissions (the CLI logs in with it).

**Run the local preview** from the repository folder:

```bash
git checkout dev
git pull
shopify theme dev --store theflooringspecialistgroup.myshopify.com
```

Then open `http://127.0.0.1:9292` — the page updates within a second or two of saving a file.

- Use the **`.myshopify.com` address** — `theflooringsupplycentre.ie` gives "You are not authorized".
- Run it **from the repository folder**, not your home directory.
- On the first run (and when the login expires, every few days) it shows a code and opens Shopify in
  your browser. Confirm it **within a few minutes** — codes expire.
- The terminal also prints a shareable preview link (`?preview_theme_id=…`) and a theme-editor link.
- Theme-editor changes on this *local Development theme* are **not** saved to your folder or GitHub.
  Make editor changes on **TFSG – DEV** instead.

---

## 2. Making changes and going live

| Where | Connected to | Who sees it |
|---|---|---|
| Local preview `http://127.0.0.1:9292` | Your working folder (temporary *Development* theme) | Only you |
| **TFSG – DEV** | branch **`dev`** | Team, via *Preview* in Shopify admin |
| **TFSG – MASTER** | branch **`master`** | Customers, once **published** |
| Fashionopolism | — | Old live theme, kept as a fallback |

Both themes are connected with the **Shopify GitHub integration** (Online Store → Themes → Add theme →
Connect from GitHub). A push to a branch syncs to its theme; theme-editor edits are committed back to
the branch by `shopify[bot]`.

```
 local  ──push──▶  dev  ──▶  TFSG – DEV  (test)  ──PR / merge──▶  master  ──▶  TFSG – MASTER (live)
```

1. **Pull first** — `shopify[bot]` may have committed editor changes: `git pull`.
2. **Build and check** on the local preview.
3. **Push to `dev`**:
   ```bash
   git add -A
   git commit -m "Describe the change"
   git push origin dev
   ```
   TFSG – DEV updates within a minute (occasionally up to ~10).
4. **Test on TFSG – DEV** (Online Store → Themes → TFSG – DEV → ⋯ → *Preview*): desktop and mobile,
   the pages you touched, and add to cart → cart → checkout.
5. **Merge `dev` into `master`** when approved — preferably with a **pull request** on GitHub so there
   is a record of what went live. Without a PR:
   ```bash
   git checkout master && git pull && git merge dev && git push origin master && git checkout dev
   ```
6. **Publish TFSG – MASTER** (Online Store → Themes → *Publish*):
   - The **first** time, this switches the live store from Fashionopolism to the new theme.
   - After that, **every merge to `master` goes live automatically** — only merge what was tested on DEV.
   - If another theme was published in the meantime (e.g. a temporary rollback), publish TFSG – MASTER
     again after merging.

**Never** commit straight to `master` or edit TFSG – MASTER in the theme editor.

**Rolling back:** fastest is to publish the previous theme (Fashionopolism or a duplicate). In code,
`git revert <commit>` on `master` and push — Shopify syncs the revert to the live theme.

Record each release in [`release-notes.md`](release-notes.md).

---

## 3. Rules and checks

- **Prefix everything custom with `fsg-`** — sections, snippets, assets and CSS classes.
- **Use the design tokens**, not hard-coded colours: colours, radius and font are set in Theme settings →
  *FSG design* and exposed as CSS variables (`--fsg-slate`, `--fsg-accent`, …) by `snippets/fsg-tokens.liquid`.
- **Keep it simple**: any product and the checkout should be a few steps away. Prefer fewer sections,
  clear labels and direct add-to-cart over decoration.
- **Make it editable**: new sections need a `{% schema %}` with sensible defaults and a preset.
- **Leave Dawn's files alone** where possible. The only intentional edits are in `layout/theme.liquid`,
  `config/settings_schema.json`, the header/footer section groups and the JSON templates.
- **Cart link**: the header's cart link must stay `<a id="cart-icon-bubble">` with the same inner markup
  as `sections/cart-icon-bubble.liquid` — Dawn's cart scripts re-render it.
- **Shopify rejects uploads that break these rules** (theme check does *not* catch them all):
  - `range` settings need **at least 3 steps** and at most 101 (`(max − min) / step`).
  - `url` and resource settings in JSON templates must point to something that **exists in the store**
    (e.g. a page). Leave them empty and fall back in Liquid instead.
  - If a section file is rejected, every template that uses it is rejected too.

**Before pushing anything substantial**, run `shopify theme check` (it uses Shopify's recommended
checks via `.theme-check.yml`; remaining warnings are all in Dawn's stock files — `fsg-` files should
be clean) and check by hand on the local preview: homepage, a collection, a product with options
(add to cart), cart, search, and one page on a phone-sized screen.

---

## 4. Set up in Shopify admin

These live in Shopify, not in this repository:

| Item | Where | Notes |
|---|---|---|
| Main menu `main-menu` | Online Store → Navigation | Level 1 = category bar, level 2 = mega-menu tiles; a level 3 turns that dropdown into list + panel. Also feeds the collection sidebar. |
| Footer menu `footer` | Online Store → Navigation | "Help" column in the footer |
| Collections | Products → Collections | Tiles use the first product's photo; empty collections are hidden on *All categories*. Menu nesting does **not** combine collections — each has its own products. |
| Shop all | Built in: `/collections/all` | Linked in the header ("Shop all", set in the theme's header settings) |
| Contact page | Online Store → Pages | Handle `contact`, template **contact** |
| Blog `news` | Online Store → Blog posts | Shown as "Guides & advice" |
| Filters | Search & Discovery app → Filters | Availability and Price today; add Size, Color, Product type, Vendor and they appear automatically |
| Product descriptions | Products | `Lead time: X–Y working days` sets the delivery estimate; bold labels (e.g. **MATERIAL**) with the value on the next line become the specifications card |
| Made-to-order products | Product tag `Logo Mats` | Shows the made-to-order message instead of stock delivery |
| Checkout & customer accounts | Settings → Checkout → Customize | Logo, colours and font — not part of the theme |

---

## 5. Troubleshooting

| Problem | Fix |
|---|---|
| Pushed to `dev` but TFSG – DEV didn't change | Sync can lag up to ~10 minutes. If it never arrives, a file was rejected: open it in Online Store → Themes → ⋯ → *Edit code*, paste the GitHub version and *Save* to see the exact error. |
| Homepage still shows the old layout after a push | `templates/index.json` was rejected — see the upload rules in section 3. |
| `You are not authorized to use the CLI` | Use `theflooringspecialistgroup.myshopify.com`, or your account has no staff access. |
| Local preview says `{"error":"unauthorized"}` | The CLI login expired. Stop `theme dev` (Ctrl+C), start it again and confirm the new code quickly. |
| `EADDRINUSE 127.0.0.1:9292` | Another `theme dev` is still running. Stop it, or add `--port 9293`. |
| My change disappeared after `git pull` | Someone edited the same file in the theme editor and `shopify[bot]` committed it. Resolve the merge; avoid editing the same thing in code and the editor at once. |

---

## 6. Handover — if the repository owner leaves

The GitHub integration depends on **this repository**, the **GitHub account that owns it** (currently
`ff-shanjoel`, `github.com/ff-shanjoel/webshop-revamp-dev`) and the **Shopify GitHub app authorised on
that account**. If the owner leaves or their account/email is closed, theme syncing stops. Before (or as
soon as possible after) they leave:

1. **Transfer the repository** to a company GitHub organisation or the new owner: GitHub → repository →
   *Settings* → *General* → *Danger Zone* → **Transfer ownership**. Use a company email/organisation from
   now on so this never depends on one person.
2. **Authorise the Shopify GitHub app** for the new owner: GitHub → *Settings* → *Applications* (or the
   organisation's *GitHub Apps*) → Shopify → give it access to this repository.
3. **Reconnect the themes**: in Online Store → Themes, check TFSG – DEV and TFSG – MASTER still show as
   connected. If not: *Add theme* → *Connect from GitHub* → this repository → `dev` / `master`.
   Reconnecting creates a new theme — if that happens to the live theme, publish the new TFSG – MASTER
   and delete the stale copy.
4. **Update local copies**: `git remote set-url origin <new-repository-url>`.
5. **Sort out Shopify staff access**: the new developer needs a staff account with theme permissions
   (for `shopify theme dev`); remove the departing person's access.
6. Update the owner name and URL in this section.

---

## Reference: files

<details>
<summary><strong>What each <code>fsg-</code> file does</strong> (click to open)</summary>

<br>

#### 🎨 Styles — `assets/`

| File | What it styles | Loaded |
|---|---|---|
| `fsg-base.css` | Shared styles, header, mega menu, search dropdown, footer, cart popup, long-form text, policy pages | Every page |
| `fsg-sections.css` | Homepage sections | Every page |
| `fsg-pages.css` | Product, collection, search, blog, article, page, contact, 404 and password pages | Only by those sections |
| `fsg-cart.css` | Cart page layout over Dawn's cart sections | Cart page |

#### ⚙️ Scripts — `assets/`

| File | What it does |
|---|---|
| `fsg-theme.js` | Sticky header, mega menu, mobile drawer, scroll reveal, FAQ, policy tidy-up |
| `fsg-product.js` | Product page: option steps → variant, gallery, delivery estimate, sticky add bar |
| `fsg-product-details.js` | Turns free-typed product descriptions into facts, specs and feature lists |

#### 🖼️ Logos and icons — `assets/`

| File | Used for |
|---|---|
| `fsg-logo-dark.png` | Header logo |
| `fsg-logo-light.png` | Footer logo (white) |
| `fsg-favicon.png` | Browser tab icon |
| `fsg-apple-touch-icon.png` | Phone home-screen icon |

#### 📐 Layouts — `layout/`

| File | What it is |
|---|---|
| `theme.liquid` | Dawn's layout + small FSG hooks (tokens, CSS/JS, favicon) |
| `fsg-password.liquid` | Layout for the "coming soon" password page |

#### 🧩 Sections — `sections/`

| Page | Sections |
|---|---|
| Every page | `fsg-header` (mega menu, search) · `fsg-footer` |
| Homepage & reusable content | `fsg-hero` · `fsg-collection-tiles` · `fsg-featured-products` · `fsg-promo-cards` · `fsg-help-band` · `fsg-range-banners` · `fsg-sectors-strip` · `fsg-guides` · `fsg-faq` |
| Product page | `fsg-main-product` · `fsg-related-products` |
| Collection pages (incl. Shop all) | `fsg-main-collection` |
| All categories | `fsg-list-collections` |
| Search results | `fsg-main-search` |
| Cart page | `fsg-cart-steps` · `fsg-cart-assist` (steps, help box + cart styles) |
| Blog | `fsg-main-blog` (listing) · `fsg-main-article` (single article) |
| Pages | `fsg-main-page` (general page) · `fsg-contact` (contact page) |
| Special pages | `fsg-main-404` (page not found) · `fsg-password` (coming soon) |

#### 🔁 Snippets — `snippets/`

| File | What it is |
|---|---|
| `fsg-tokens` | Design tokens (CSS variables) from Theme settings → *FSG design* |
| `fsg-icon` | Line icon set |
| `fsg-image` | Image with "use a product photo" fallback and focal point |
| `fsg-product-card` | Product card with quick add |
| `fsg-collection-tile` · `fsg-mega-tile` · `fsg-article-card` | Tiles and cards |
| `fsg-filter-sidebar` | Collection page sidebar: categories + filters (slide-in panel on phones) |
| `fsg-facets` | Filter + sort bar on the search results page |
| `fsg-favicon` | Favicon and touch-icon tags |

#### 📄 Templates and settings

| File | What it is |
|---|---|
| `templates/*.json` | Page templates that use the `fsg-` sections |
| `templates/gift_card.liquid` | Gift card page (standalone, redesigned) |
| `config/settings_schema.json` | Dawn's settings + the **FSG design** group (colours, radius, font) |

</details>

---

## Reference: updating Dawn

<details>
<summary><strong>How to bring in a new Dawn version safely</strong> (click to open)</summary>

Shopify releases new Dawn versions a few times a year (bug fixes, accessibility, new Shopify
features). They are **not applied automatically** — a GitHub-connected, customised theme never gets
Theme Store updates. We bring them in on a separate branch and test before anything reaches `dev`
or `master`.

### Why it is safe

- Our design is in **separate `fsg-` files**, which Dawn never touches.
- A branch called **`dawn-upstream`** holds **only stock Dawn**. Git compares old Dawn, new Dawn and
  our theme (a three-way merge), so Dawn's changes apply everywhere **except** lines we also changed —
  those few are flagged as conflicts for a person to decide.
- Project files (`README.md`, `LICENSE.md`, `release-notes.md`, `.gitignore`, `.theme-check.yml`,
  `.prettierrc.json`) are never touched, because only Dawn's theme folders are copied.

### Dawn files we changed — conflicts can only appear here

| File | What we changed | On conflict |
|---|---|---|
| `layout/theme.liquid` | 4 hooks: `{% render 'fsg-favicon' %}` (replaces Dawn's favicon block), `fsg-theme.js` after `global.js`, `fsg-tokens` + `fsg-base.css` + `fsg-sections.css` after `base.css` | Take Dawn's new file, re-add the 4 hooks |
| `config/settings_schema.json` | **FSG design** group appended at the end | Take Dawn's file, append the group again |
| `config/settings_data.json` | Store's theme settings (written by Shopify) | **Keep ours** |
| `sections/header-group.json`, `footer-group.json` | Use `fsg-header` / `fsg-footer` | **Keep ours** |
| `templates/*.json` | Use our `fsg-` sections | **Keep ours** |
| `templates/gift_card.liquid` | Fully redesigned | Keep ours; copy any new Dawn feature by hand |

### One-time setup (already done — repeat only on a new computer for the remote)

The first commit, `d4578e3`, is stock Dawn 16.0.0 (checked file-for-file against Shopify's `v16.0.0` tag).

```bash
git remote add dawn https://github.com/Shopify/dawn.git
git branch dawn-upstream d4578e3        # already created and pushed
git push origin dawn-upstream
```

`dawn-upstream` is **not** connected to any Shopify theme. Never commit our own work to it, and never
open a pull request from it.

### Step by step (replace `v17.0.0` with the new version)

1. **Read the release notes** at <https://github.com/Shopify/dawn/releases> for every version between
   ours and the new one; note anything about the cart, product form, predictive search or cart page.
2. **Start from an up-to-date `dev`:** `git checkout dev && git pull`
3. **Put the new stock Dawn on `dawn-upstream`** (only Dawn's theme folders — its repository also has
   its own README, licence and GitHub workflows we don't want):
   ```bash
   git fetch dawn --tags
   git checkout dawn-upstream
   git rm -r -q assets config layout locales sections snippets templates
   git checkout v17.0.0 -- assets config layout locales sections snippets templates
   git commit -m "Dawn v17.0.0"
   git push origin dawn-upstream
   ```
   If the new version adds a theme folder (e.g. `blocks`), check `git ls-tree --name-only v17.0.0`
   and add it to both commands.
4. **Merge into a new update branch**, not straight into `dev`:
   ```bash
   git checkout dev
   git checkout -b dawn-update-v17
   git merge dawn-upstream
   ```
5. **Resolve conflicts** (`git status` lists them):
   - *Keep ours* files:
     `git checkout --ours config/settings_data.json sections/header-group.json sections/footer-group.json templates/`
   - `layout/theme.liquid` and `config/settings_schema.json`: keep **both** sides where you can —
     Dawn's new lines **and** our hooks. For example:
     ```
     <<<<<<< HEAD
         {% render 'fsg-favicon' %}
     =======
         {%- if settings.favicon != blank -%} … Dawn's new favicon code … {%- endif -%}
     >>>>>>> dawn-upstream
     ```
     Keep `{% render 'fsg-favicon' %}`; if Dawn's version has an improvement (say a new icon size),
     copy it into `snippets/fsg-favicon.liquid`.
   - Finish: `git add -A && git commit`
6. **Check and test locally:** `shopify theme check`, then `shopify theme dev --store
   theflooringspecialistgroup.myshopify.com` and work through the table below on desktop and mobile.
7. **Ship it like any other change:** merge `dawn-update-v17` into `dev`, push, test on TFSG – DEV, then
   merge to `master`. Note the version in `release-notes.md` and update "Built on Dawn X" at the top.

If it goes badly, just delete the `dawn-update-…` branch — `dev` and `master` are untouched until you merge.

### What to test after an update

Our code relies on these parts of Dawn, so check them even when the merge is clean:

| Our feature | Relies on Dawn's | Check |
|---|---|---|
| Add to basket (product page, cards) | `assets/product-form.js`, `<product-form>` markup | Add a product with and without options; the cart badge updates |
| Cart popup and badge | `assets/cart-notification.js`, `sections/cart-icon-bubble.liquid` (copied in our header) | Popup appears after adding; badge count is right |
| Cart page | `sections/main-cart-items.liquid`, `main-cart-footer.liquid`, `assets/cart.js` (styled by `fsg-cart.css`) | Change quantity, remove an item, empty cart, checkout button |
| Search dropdown | `assets/predictive-search.js`, `sections/predictive-search.liquid` (styled by `fsg-base.css`) | Type a word: suggestions and products with prices appear |
| Filters and sort | Shopify filter objects (not Dawn) | Filter and sort on a collection and on search |
| General | `assets/global.js`, `base.css` helpers (`.hidden`, `.visually-hidden`), locale keys | No console errors; no "translation missing" text |

</details>

---

*Built on [Dawn](https://github.com/Shopify/dawn) by Shopify (MIT licence — see `LICENSE.md`).*
