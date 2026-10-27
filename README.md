# The Flooring Supply Centre — Shopify theme

Custom Shopify theme for **The Flooring Supply Centre**,
store `theflooringspecialistgroup.myshopify.com`, public domain `theflooringsupplycentre.ie`.

The theme is built **on top of Shopify's Dawn 16.0.0**. Dawn provides the cart, checkout hand-off,
predictive search and accessibility plumbing; everything customer-facing has been redesigned with
our own `fsg-` sections, snippets and assets ("V8 Slate" design: muted slate blue, Manrope, clean
and simple, few steps from browsing to checkout).

---

## Contents

- [Environments and branches](#environments-and-branches)
- [Getting started (local development)](#getting-started-local-development)
- [Deployment workflow](#deployment-workflow)
- [Updating Dawn](#updating-dawn)
- [Project structure](#project-structure)
- [Conventions](#conventions)
- [Store content the theme relies on](#store-content-the-theme-relies-on)
- [Quality checks](#quality-checks)
- [Troubleshooting](#troubleshooting)
- [Ownership and handover](#ownership-and-handover)

---

## Environments and branches

| Where | What it is | Connected to | Who sees it |
|---|---|---|---|
| Local preview `http://127.0.0.1:9292` | `shopify theme dev` — a temporary *Development* theme that updates within seconds of saving a file | Your working folder | Only you (share link available) |
| **TFSG – DEV** (unpublished theme) | Testing / review theme | GitHub branch **`dev`** | Team, via *Preview* in Shopify admin |
| **TFSG – MASTER** | Approved, production-ready theme | GitHub branch **`master`** | Customers, once it is **published** |
| Fashionopolism (old live theme) | Previous theme, kept as a fallback | — | Customers until TFSG – MASTER is published |

Both Shopify themes are connected through the **Shopify GitHub integration**
(Online Store → Themes → Add theme → Connect from GitHub). Every push to a branch is synced to the
theme connected to it, and edits made in the Shopify theme editor are committed back to that branch
by `shopify[bot]`.

---

## Getting started (local development)

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli): `npm install -g @shopify/cli`
- Git, and access to this repository
- A Shopify **staff account** on the store with theme permissions (the CLI logs in with it)

### Run the local preview

```bash
git checkout dev
git pull
shopify theme dev --store theflooringspecialistgroup.myshopify.com
```

- Always use the **permanent `.myshopify.com` domain** — the CLI rejects `theflooringsupplycentre.ie`
  and other vanity domains with "You are not authorized".
- Run it **from the repository folder**, not your home directory.
- The first run (and again when the login expires, roughly every few days) prints a verification
  code and opens Shopify in your browser. Confirm the code **within a few minutes** — codes expire.
- Open `http://127.0.0.1:9292`. Saving a file updates the page within a second or two.
- The terminal also prints a shareable preview link (`?preview_theme_id=…`) and a theme-editor link.

> Changes made in the theme editor of the *local Development theme* are **not** saved back to your
> folder or to GitHub. Make editor changes on **TFSG – DEV** instead.

---

## Deployment workflow

```
 local (shopify theme dev)  ──push──▶  dev  ──▶  TFSG – DEV   (test & review)
                                        │
                                   merge (PR)
                                        ▼
                                      master ──▶  TFSG – MASTER (published = live)
```

1. **Develop locally** on the `dev` branch with `shopify theme dev` (see above).
2. **Pull before you start** — `shopify[bot]` may have committed theme-editor changes:
   `git pull`.
3. **Commit and push to `dev`** when a change is ready for testing:
   ```bash
   git add -A
   git commit -m "Describe the change"
   git push origin dev
   ```
   Shopify syncs the push to **TFSG – DEV** (usually within a minute; occasionally up to ~10).
4. **Test on TFSG – DEV**: Online Store → Themes → TFSG – DEV → ⋯ → *Preview*. Check desktop and
   mobile, the pages you touched, and add-to-cart → cart → checkout.
5. **Merge `dev` into `master`** once everything is approved (a pull request on GitHub is the
   recommended route, so there's a record of what went live):
   ```bash
   git checkout master
   git pull
   git merge dev
   git push origin master
   git checkout dev
   ```
6. **Publish TFSG – MASTER**: Online Store → Themes → TFSG – MASTER → *Publish*.
   - The **first** time, this switches the live store from Fashionopolism to the new theme.
   - After that, TFSG – MASTER *is* the live theme, so **every merge to `master` goes live
     automatically** once Shopify finishes syncing. Only merge what has been tested on DEV.
   - If a theme other than TFSG – MASTER was published in the meantime (e.g. a temporary rollback),
     publish TFSG – MASTER again after merging.

**Never commit straight to `master`**, and never edit TFSG – MASTER in the theme editor — do it on
DEV, test, then merge.

### Rolling back

- Fastest: publish the previous theme (Fashionopolism or a duplicate) in Online Store → Themes.
- In code: `git revert <commit>` on `master` and push; Shopify syncs the revert to the live theme.

---

## Updating Dawn

Shopify releases new Dawn versions a few times a year (bug fixes, accessibility, support for new
Shopify features). **They are not applied automatically** to this theme: a theme connected to
GitHub and customised like this one never gets Theme Store updates. We bring them in ourselves,
on a branch, and test before anything reaches `dev` or `master`.

### Why this is safe

- Everything custom is in **separate `fsg-` files**, which Dawn never touches, so updates can't
  overwrite our design.
- We keep a branch called **`dawn-upstream`** that contains **only stock Dawn**. Git compares old
  stock Dawn, new stock Dawn and our theme (a three-way merge), so Dawn's changes are applied
  everywhere **except** where we changed the same lines. Those few places are flagged as
  conflicts for a person to decide.
- The only Dawn files we have changed are listed below, so you know in advance where to look.

### Dawn files we have changed (expect conflicts only here)

| File | What we changed | When it conflicts |
|---|---|---|
| `layout/theme.liquid` | 4 hooks: `{% render 'fsg-favicon' %}` (replaces Dawn's favicon block), `fsg-theme.js` after `global.js`, and `fsg-tokens` + `fsg-base.css` + `fsg-sections.css` after `base.css` | Take Dawn's new file, then re-add these 4 hooks |
| `config/settings_schema.json` | Appended the **FSG design** settings group at the end | Take Dawn's file and append the FSG design group again |
| `config/settings_data.json` | The store's theme settings (written by Shopify) | **Always keep ours** |
| `sections/header-group.json`, `sections/footer-group.json` | Use `fsg-header` / `fsg-footer` | **Always keep ours** |
| `templates/*.json` | Use our `fsg-` sections | **Always keep ours** |
| `templates/gift_card.liquid` | Fully redesigned | Keep ours; copy over any new Dawn feature by hand |

Project files (`README.md`, `LICENSE.md`, `release-notes.md`, `.gitignore`, `.theme-check.yml`,
`.prettierrc.json`) are never touched by an update, because only Dawn's theme folders are copied.

### One-time setup

Do this once. The repository's first commit, `d4578e3`, is stock Dawn 16.0.0. Its theme folders
were checked file-for-file against Shopify's official `v16.0.0` tag, so it is the correct starting point:

```bash
git remote add dawn https://github.com/Shopify/dawn.git
git branch dawn-upstream d4578e3
git push origin dawn-upstream
```

`dawn-upstream` is **not** connected to any Shopify theme. Never commit our own work to it.

### Updating, step by step

Replace `v17.0.0` with the Dawn version you are installing.

1. **Read the release notes** at <https://github.com/Shopify/dawn/releases> for every version
   between ours and the new one. Note anything about the cart, product form, predictive search or
   cart page (see *What to test* below).
2. **Start from an up-to-date `dev`**:
   ```bash
   git checkout dev
   git pull
   ```
3. **Put the new stock Dawn on `dawn-upstream`**. This copies Dawn's **theme folders** exactly
   (Dawn's repository also has its own README, licence and GitHub workflows, which we don't want):
   ```bash
   git fetch dawn --tags
   git checkout dawn-upstream
   git rm -r -q assets config layout locales sections snippets templates
   git checkout v17.0.0 -- assets config layout locales sections snippets templates
   git commit -m "Dawn v17.0.0"
   git push origin dawn-upstream
   ```
   If a new Dawn version adds a theme folder (for example `blocks`), check with
   `git ls-tree --name-only v17.0.0` and add it to both commands.
4. **Merge it into a new update branch**, not straight into `dev`:
   ```bash
   git checkout dev
   git checkout -b dawn-update-v17
   git merge dawn-upstream
   ```
5. **Resolve conflicts** (`git status` lists them):
   - Files marked *Always keep ours* in the table above:
     ```bash
     git checkout --ours config/settings_data.json sections/header-group.json sections/footer-group.json templates/
     ```
   - `layout/theme.liquid` and `config/settings_schema.json`: open each conflict and keep **both**
     sides where you can (Dawn's new lines **and** our hooks). Example:
     ```
     <<<<<<< HEAD
         {% render 'fsg-favicon' %}
     =======
         {%- if settings.favicon != blank -%} … Dawn's new favicon code … {%- endif -%}
     >>>>>>> dawn-upstream
     ```
     Keep `{% render 'fsg-favicon' %}`, and if Dawn's version has an improvement (say a new icon
     size), copy it into `snippets/fsg-favicon.liquid`.
   - Then finish the merge:
     ```bash
     git add -A
     git commit
     ```
6. **Check and test locally**:
   ```bash
   shopify theme check
   shopify theme dev --store theflooringspecialistgroup.myshopify.com
   ```
   Work through *What to test* below on desktop and mobile.
7. **Ship it like any other change**: merge `dawn-update-v17` into `dev`, push, test on
   TFSG – DEV, then merge to `master` (see [Deployment workflow](#deployment-workflow)).
   Note the Dawn version in `release-notes.md`, and update "Built on Dawn X" at the top of this file.

If an update goes badly, simply delete the `dawn-update-…` branch. `dev` and `master` are untouched
until you merge.

### What to test after an update

Our `fsg-` code relies on a few pieces of Dawn. These are where an update is most likely to break
something, even when the merge is clean:

| Our feature | Relies on Dawn's | Check |
|---|---|---|
| Add to basket (product page, product cards) | `assets/product-form.js` and its `<product-form>` markup | Add a product with options and one without; the cart badge updates |
| Cart popup and badge | `assets/cart-notification.js`, `sections/cart-icon-bubble.liquid` (our header copies its markup) | Popup appears after adding; badge count is right |
| Cart page | `sections/main-cart-items.liquid`, `main-cart-footer.liquid`, `assets/cart.js` (`fsg-cart.css` styles their classes) | Change quantity, remove an item, empty cart, checkout button |
| Search dropdown | `assets/predictive-search.js` and `sections/predictive-search.liquid` (`fsg-base.css` styles their classes) | Type a word: suggestions and products with prices appear |
| Filters and sort | Shopify filter objects (not Dawn) | Apply a filter and sort on a collection and on search |
| General | `assets/global.js`, `base.css` helpers (`.hidden`, `.visually-hidden`), locale keys | No console errors; text is not showing as "translation missing" |

---

## Project structure

Standard Shopify theme layout. Everything custom is prefixed **`fsg-`**:

```
assets/
  fsg-base.css            Shared styles, header, mega menu, search dropdown, footer, cart popup,
                          long-form text, policy pages (loaded on every page)
  fsg-sections.css        Homepage sections (loaded on every page)
  fsg-pages.css           Product, collection, search, blog, article, page, contact, 404,
                          password pages (loaded by those sections only)
  fsg-cart.css            Cart page layout over Dawn's cart sections
  fsg-theme.js            Sticky header, mega menu, mobile drawer, scroll reveal, FAQ, policy tidy-up
  fsg-product.js          Product page: option steps → variant, gallery, delivery estimate, sticky bar
  fsg-product-details.js  Turns free-typed product descriptions into facts / specs / feature lists
  fsg-logo-dark.png       Header logo        fsg-logo-light.png   Footer logo (white)
  fsg-favicon.png         Browser icon       fsg-apple-touch-icon.png  Phone home-screen icon
layout/
  theme.liquid            Dawn layout + small FSG hooks (tokens, CSS/JS, favicon)
  fsg-password.liquid     Layout for the "coming soon" password page
sections/
  fsg-header / fsg-footer                 Header (mega menu, search) and footer
  fsg-hero, fsg-collection-tiles,
  fsg-featured-products, fsg-promo-cards,
  fsg-help-band, fsg-range-banners,
  fsg-sectors-strip, fsg-guides, fsg-faq  Homepage / reusable content sections
  fsg-main-product, fsg-related-products  Product page
  fsg-main-collection, fsg-list-collections  Collection page, "All categories"
  fsg-main-search                         Search results
  fsg-cart-steps, fsg-cart-assist         Cart page additions (steps, help box + cart styles)
  fsg-main-blog, fsg-main-article         Blog listing and article
  fsg-main-page, fsg-contact              Generic page, contact page
  fsg-main-404, fsg-password              404 and coming-soon pages
snippets/
  fsg-tokens              Design tokens (CSS variables) from Theme settings → FSG design
  fsg-icon                Line icon set
  fsg-image               Image with "use a product photo" fallback + focal point
  fsg-product-card        Product card with quick add
  fsg-collection-tile, fsg-mega-tile, fsg-article-card   Tiles and cards
  fsg-facets              Filter + sort bar shared by collection and search pages
  fsg-favicon             Favicon / touch icon tags
templates/
  *.json                  Page templates using the fsg- sections
  gift_card.liquid        Gift card page (standalone, redesigned)
config/
  settings_schema.json    Dawn settings + "FSG design" group (colours, radius, font)
```

Dawn's own files are kept as close to stock as possible so future Dawn updates stay manageable.
The only intentional edits to Dawn core files are in `layout/theme.liquid`,
`config/settings_schema.json`, the section groups and the JSON templates.

---

## Conventions

- **Prefix everything custom with `fsg-`** (sections, snippets, assets, CSS classes).
- **Design tokens**: colours, radius and font live in Theme settings → *FSG design* and are exposed
  as CSS variables (`--fsg-slate`, `--fsg-accent`, …) by `snippets/fsg-tokens.liquid`. Use the
  variables, not hard-coded colours.
- **Keep it simple**: customers should reach any product and the checkout in a few steps. Prefer
  fewer sections, clear labels and direct add-to-cart over decoration.
- **Everything editable**: new sections need a `{% schema %}` with sensible defaults and a preset.
- **Schema rules Shopify enforces on upload** (theme check does *not* catch all of these):
  - `range` settings need **at least 3 steps** and at most 101 (`(max - min) / step`).
  - `url` / resource settings in JSON templates must point to things that **exist in the store**
    (e.g. a page handle). Leave them empty and fall back in Liquid instead.
  - If a section file is rejected, every template using it is rejected too.
- **Cart**: the header cart link must stay `<a id="cart-icon-bubble">` with the same inner markup
  as `sections/cart-icon-bubble.liquid` — Dawn's cart scripts re-render it.

---

## Store content the theme relies on

These live in Shopify admin, not in this repository:

| Item | Where | Notes |
|---|---|---|
| Main menu (`main-menu`) | Online Store → Navigation | Level 1 = category bar, level 2 = mega-menu tiles. A level 3 switches that dropdown to list + panel. |
| Footer menu (`footer`) | Online Store → Navigation | "Help" column in the footer |
| Collections | Products → Collections | Tiles use the first product's photo. Empty collections are hidden on *All categories*. |
| Contact page | Online Store → Pages | Handle `contact`, template **contact** |
| Blog `news` | Online Store → Blog posts | Shown as "Guides & advice" |
| Filters | Search & Discovery app → Filters | Availability and Price today; add Size, Color, Product type, Vendor |
| Product descriptions | Products | `Lead time: X–Y working days` sets the delivery estimate on the product page; bold labels (e.g. **MATERIAL**) with the value on the next line become the specifications card. |
| Made-to-order products | Product tag `Logo Mats` | Shows the made-to-order delivery message instead of stock delivery |
| Checkout & customer accounts branding | Settings → Checkout → Customize | Not part of the theme |

---

## Quality checks

Run before pushing anything substantial:

```bash
shopify theme check
```

Also check by hand on the local preview: homepage, a collection, a product with options
(add to cart), cart, search, and one page on a phone-sized screen.

`.theme-check.yml` uses Shopify's recommended checks. The remaining warnings are all in Dawn's
untouched stock files; `fsg-` files should always come back clean.

---

## Troubleshooting

| Problem | Cause / fix |
|---|---|
| Pushed to `dev` but TFSG – DEV didn't change | Shopify's sync can lag up to ~10 minutes. If it never arrives, a file was rejected — open the file in Online Store → Themes → ⋯ → *Edit code*, paste the GitHub version and *Save* to see the exact error. |
| Homepage still shows the old layout after a push | `templates/index.json` was rejected (see the schema rules above). |
| `You are not authorized to use the CLI` | Wrong store domain — use `theflooringspecialistgroup.myshopify.com` — or your account has no staff access. |
| Local preview says `{"error":"unauthorized"}` | The CLI login expired. Stop `theme dev` (Ctrl+C) and start it again; confirm the new code quickly. |
| `EADDRINUSE 127.0.0.1:9292` | Another `theme dev` is still running in the background. Stop it, or use `--port 9293`. |
| My change disappeared after `git pull` | Someone edited the same file in the theme editor and `shopify[bot]` committed it. Resolve the merge, and avoid editing the same thing in code and the editor at once. |

---

## Ownership and handover

The GitHub integration ties three things together: **this repository**, the **GitHub account that
owns it** (currently `ff-shanjoel`, `github.com/ff-shanjoel/webshop-revamp-dev`) and the
**Shopify store's authorisation of the Shopify GitHub app** on that account. If the person who owns
the repository leaves the company, or their account/email is closed, theme syncing will stop.

Before (or as soon as possible after) someone leaves:

1. **Transfer the repository** to a company-owned GitHub organisation or to the new owner's account:
   GitHub → repository → *Settings* → *General* → *Danger Zone* → **Transfer ownership**.
   Use a company email / organisation going forward so this doesn't depend on one person.
2. **Install and authorise the Shopify GitHub app** on the new owner/organisation:
   GitHub → *Settings* → *Applications* (or the organisation's *GitHub Apps*) → Shopify → grant
   access to this repository.
3. **Reconnect the themes in Shopify**: Online Store → Themes → for TFSG – DEV and TFSG – MASTER,
   check they still show as connected; if not, *Add theme* → *Connect from GitHub* → pick the
   repository again and choose `dev` / `master`.
   Reconnecting creates a new theme — if this happens to the live theme, publish the new
   TFSG – MASTER and delete the stale copy.
4. **Update local clones**: `git remote set-url origin <new-repository-url>`.
5. **Check Shopify staff access**: make sure the new developer has a staff account with theme
   permissions (needed for `shopify theme dev`), and remove the departing person's access.
6. Update the owner name/URL in this section.

---

*Built on [Dawn](https://github.com/Shopify/dawn) by Shopify (MIT licence — see `LICENSE.md`).*
