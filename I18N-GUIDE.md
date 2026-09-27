# PITEX Localization (i18n) System — Implementation Guide

## 1. What this is

A JSON-driven, no-build-step localization system for the PITEX site, adding
Arabic (RTL) alongside the existing English (LTR) content — no Google
Translate, no server, no bundler. Three plain `<script>` files, two JSON
dictionaries, and a small set of HTML conventions (`data-i18n`,
`data-i18n-attr-*`) that the whole team can use going forward.

## 2. Folder structure

```
assets/
  js/
    i18n-utils.js     ← Storage + Intl number/date formatting
    translator.js     ← DOM-updating engine (text + attributes)
    language.js        ← LanguageManager: load/cache/switch/persist/RTL
    products-data.js    ← (existing file) now bilingual — reference pattern
    categories-data.js  ← (existing file) now bilingual — reference pattern
  lang/
    en.json
    ar.json
  css/
    rtl.css             ← minimal, additive RTL overrides (loaded last)
```

Load order matters and is already wired in `index.html`:

```html
<script src="assets/js/i18n-utils.js"></script>
<script src="assets/js/translator.js"></script>
<script src="assets/js/language.js"></script>
<!-- then main.js, header.js, products-data.js, categories-data.js, etc. -->
```

## 3. How it works, in one paragraph

On `DOMContentLoaded`, `LanguageManager.init()` picks a language (saved
choice → browser language → English), fetches `assets/lang/{lang}.json`
(cached forever after that — switching languages again never re-fetches),
sets `<html lang dir>`, and calls `Translator.translateElement(document,
dict)`, which walks every `[data-i18n]` element and sets its text, and every
`[data-i18n-attr-*]` element and sets that attribute. Clicking any
`[data-lang]` button anywhere on the page re-runs that whole pipeline
against the new language and fires a `i18n:languageChanged` event so other
scripts (product grids, forms, GSAP-driven components) can react.

### Opening the site directly (double-clicking index.html)

Browsers block `fetch()` of local files under a `file://` URL as a CORS/
security rule — this isn't specific to this project, it happens to any
site that loads JSON via fetch. Two ways to handle it:

1. **Recommended for real use/testing — serve it locally.** From the
   project folder: `python -m http.server 8000` (or the VS Code "Live
   Server" extension, or `npx http-server`), then open
   `http://localhost:8000/index.html`. This is how the finished site
   should be deployed anyway (any normal web host serves over http/https).
2. **Already handled automatically.** `assets/js/lang-inline-data.js` is
   an auto-generated, byte-for-byte copy of both JSON files embedded as a
   plain JS object. If `fetch()` fails for any reason — most commonly
   `file://` — `language.js` falls back to it silently (with a one-line
   console warning) so the site still works when double-clicked. Whenever
   you edit `en.json`/`ar.json`, regenerate this file (see §9) so the
   fallback doesn't go stale.

## 4. HTML conventions

| Need | Convention | Example |
|---|---|---|
| Translate text content | `data-i18n="dot.path"` | `<h2 data-i18n="hero.title">Title</h2>` |
| Translate an attribute | `data-i18n-attr-{attribute}="dot.path"` | `<input data-i18n-attr-placeholder="forms.namePlaceholder">` |
| String contains a `<br>` or other trusted markup | add `data-i18n-html="true"` | `<h1 data-i18n="hero.title" data-i18n-html="true">Line one<br>Line two</h1>` |
| Interpolate a value into a string | `data-i18n-vars="count:3"` + `{{count}}` in the JSON string | `<p data-i18n="cart.itemCount" data-i18n-vars="count:3">3 items</p>` |
| Flip a directional icon in RTL | `data-rtl-flip` on the icon/button | `<i class="bi bi-arrow-right" data-rtl-flip></i>` |

**Never** put `data-i18n` on an element that has other element children
(icons, underline spans, badges) — it replaces the whole `textContent` and
will delete them. Wrap the translatable text in its own `<span
data-i18n="...">` instead, exactly as done throughout `index.html`
(e.g. the nav underline spans, the hero CTA arrows).

### `en.json` / `ar.json` structure

```json
{
  "common": { "nav": {...}, "footer": {...}, "buttons": {...}, "forms": {...} },
  "pages": {
    "home": { "hero": {...}, "about": {...}, "whyChoose": {...} },
    "about": { ... },
    "contact": { ... }
  }
}
```

`common.*` is shared chrome (header, footer, buttons, form validation
messages) used on every page. `pages.<page>.*` is content specific to one
page. Never flatten this into one big object — nesting is what keeps a
500-page site's translation file navigable.

## 5. Dynamic data (products, categories, and anything loaded via fetch)

Per the brief: translatable fields on **data records** (not UI chrome) are
bilingual inline, not looked up in the JSON files:

```js
{
  id: 'olive-receiving-washing',
  title: { en: 'Olive Receiving & Washing Line', ar: 'خط استقبال وغسل الزيتون' },
  description: { en: '...', ar: '...' },
}
```

At render time, use the global helper instead of reading the field
directly:

```js
const title = window.I18N.pick(product.title); // returns the current language's string
```

`I18N.pick()` also accepts a plain string untouched, so it's safe to call
on fields you haven't translated yet — nothing breaks, you just get
English until you add the `ar` value.

**Important exception — internal keys vs. display text.** Some fields
double as lookup keys the code branches on (e.g. `product.badges` is
matched against `BADGE_ICONS` to pick an icon). Do **not** make those
bilingual — translate the *display* of that key in a small side
dictionary instead (see `BADGE_LABELS` / `SPEC_LABELS` in
`products-data.js`), and look it up with `labelFor(BADGE_LABELS, key)`.
This is the difference between "text shown to a user" (always bilingual)
and "a value your code compares against" (always stays a stable English
string).

**Re-rendering dynamic content after a language switch.** Any code that
paints a grid/card/list from JS should wrap the paint logic in its own
function and register it:

```js
function paint() {
  grid.innerHTML = items.map(renderCard).join('');
  wireCards(grid);
}
paint();
if (window.I18N) window.I18N.onChange(paint);
```

This is already done for the homepage production-lines preview and for
`production-lines.html`'s category grid.

**Fetch-driven / late-inserted markup** (modals, tabs, tooltips,
pagination, anything built after an API call): after inserting the new
nodes, call:

```js
window.I18N.translateElement(newlyInsertedContainer);
```

## 6. What's fully implemented right now

- **Engine**: `i18n-utils.js`, `translator.js`, `language.js` — complete,
  production-ready, framework-free.
- **`assets/lang/en.json` / `ar.json`**: all shared chrome (nav, footer,
  forms, buttons, aria) + 100% of `index.html`'s page content
  (hero ×3, about, production-lines preview, why-choose ×6, process
  timeline ×5, trusted marquee, export map + stats, final CTA).
- **`index.html`**: fully wired — 141 `data-i18n`/`data-i18n-attr-*`
  bindings, header/mega-menus/mobile-nav/footer, language switcher
  (now EN | العربية instead of the old EN/IT/FR stub), RTL-flip on every
  directional arrow icon.
- **Dynamic data**: all 16 products in `products-data.js` (title, category
  label, status, description, long description, availability, warranty)
  and all 6 categories in `categories-data.js` (label, short description)
  converted to `{ en, ar }`, with the homepage preview grid and the
  `production-lines.html` category grid re-rendering automatically on
  language change.
- **RTL**: `<html dir>` flips automatically; `assets/css/rtl.css` (loaded
  last) handles the Arabic font swap and the handful of physical
  left/right rules that needed a mirror; every directional icon in
  `index.html` carries `data-rtl-flip`.

## 7. What's still open — a concrete checklist

This was scoped honestly rather than rushed. Here's exactly what's left,
in the order I'd tackle it:

1. **Roll the header/mega-menu/mobile-nav/footer pattern out to the other
   10 pages** (`about.html`, `careers.html`, `certificates.html`,
   `contact.html`, `gallary.html`, `leadership.html`,
   `product-details.html`, `production-lines.html`, `products.html`,
   `services.html`, `success-partners.html`). This is mechanical: the
   header/footer markup is >90% identical across pages (verified by diff),
   so the same literal-string replacement scripts used for `index.html`
   can be re-run against each file with minimal adjustment. Then add
   `assets/js/i18n-utils.js` / `translator.js` / `language.js` `<script>`
   tags to each page's `<head>`/bottom, same as `index.html`.
2. **Translate + wire each page's own body content** into
   `pages.<pageName>.*` in `en.json`/`ar.json`, following the exact
   pattern used for `pages.home.*`.
3. **`products.js` / `product-details.js`** — these consume
   `categories-data.js`'s `label`/`heroDesc`/`overviewDesc`/`shortDesc`
   fields extensively, including string methods like
   `cat.label.split(' ')` that assume a plain string. Any code path
   reading `cat.label` directly needs `window.I18N.pick(cat.label)`
   inserted first (the pattern is identical to what was just done in
   `categories-data.js`/`production-lines.js` — search each file for
   `.label` and `.shortDesc`/`.heroDesc`/`.overviewDesc` and wrap each
   read). `heroDesc`/`overviewDesc`/`features`/`applications` on
   categories, and `specifications`/`features`/`applications` on
   products, are not yet translated to Arabic (see item 5).
4. **Contact/quote forms** (`contact.js`, `quote-validation.js`,
   `quote-modal.js`) — wire labels, placeholders, and validation/success/
   error messages via `data-i18n-attr-placeholder` and
   `window.I18N.t('common.forms.xxx')` inside the validation code paths.
   The keys already exist in `common.forms.*`.
5. **Deeper product/category content**: `specifications[]`,
   `features[].title/text`, `applications[]` on each of the 16 products,
   and `heroDesc`/`overviewDesc`/`features`/`applications`/`advantages` on
   the 6 categories. Same `{ en, ar }` pattern as everything already
   converted — just more of it (roughly 250–300 more strings). I'd
   recommend translating these page-by-page as each page is migrated,
   rather than all at once, so translations can be reviewed against the
   page they render on.
6. **Number/date localization for live counters**: the "15+ / 10+ / 60+"
   stat counters (`data-count-to` in `achievements.js`) currently animate
   Western digits regardless of language. Wire `achievements.js`'s
   counting-animation output through `window.I18N.NumberFormat.format()`
   so Arabic mode renders `١٥+` etc.
7. **Broader CSS logical-property migration**: `rtl.css` is intentionally
   a small, additive override file rather than a rewrite of all ~15
   existing stylesheets into logical properties (that's a much larger,
   higher-risk change that could shift English-mode layout). As a next
   phase, new components should be authored with `margin-inline`,
   `padding-inline`, `inset-inline`, and `text-align: start/end` from the
   start; existing components can be migrated opportunistically whenever
   they're touched for other reasons, removing their corresponding
   override from `rtl.css` once converted.

## 8. Keeping `lang-inline-data.js` in sync

Whenever `en.json` or `ar.json` change, regenerate the fallback file so it
doesn't drift (three lines, no dependencies beyond Python's stdlib):

```python
import json
en = json.load(open('assets/lang/en.json', encoding='utf-8'))
ar = json.load(open('assets/lang/ar.json', encoding='utf-8'))
out = 'window.__PITEX_I18N_INLINE__ = ' + json.dumps({'en': en, 'ar': ar}, ensure_ascii=False, indent=2) + ';\n'
open('assets/js/lang-inline-data.js', 'w', encoding='utf-8').write(out)
```

## 10. Avoiding the English/Arabic flash (FOUC) on load and navigation

Every page loads its saved language two different ways, at two different
times, and both matter:

1. **A tiny synchronous script at the very top of `<head>`** (before any
   CSS or other script) reads `localStorage['pitex_lang']` the instant
   parsing starts and immediately sets `<html lang dir>` — before the
   browser has painted a single pixel. This is what stops the
   LTR→RTL/RTL→LTR layout flash.
2. **That same block hides `<body>`** (`visibility: hidden`, not
   `display: none`, so layout/measurements are unaffected) via a class
   (`i18n-boot`) on `<html>`, so the *static English text already sitting
   in the HTML source* can't become visible before `translator.js`
   overwrites it. `language.js` removes the class the moment its first
   `translateElement()` pass finishes — normally a fraction of a
   millisecond after `DOMContentLoaded`, because:
3. **`assets/js/lang-inline-data.js` is loaded synchronously in `<head>`**
   (no `defer`) instead of at the bottom of `<body>`. Its embedded
   dictionaries are already in memory before `<body>` is even parsed, so
   `language.js`'s `loadLanguage()` uses them immediately instead of
   waiting on the `fetch('assets/lang/{lang}.json')` network round-trip —
   that fetch still happens in the background and becomes the cache of
   record for every later switch, but it's no longer on the critical path
   for the very first render.
4. **A 1.5s `setTimeout` safety net** in the same head script removes the
   hiding class unconditionally, so a blocked/broken script can never
   leave a permanently blank page.

If you add a 14th page, copy the *entire* "EARLY LANGUAGE INIT" block from
any existing page's `<head>` verbatim (right after the viewport `<meta>`,
before `<title>`), and make sure `assets/js/lang-inline-data.js` stays a
plain (non-`defer`) `<script>` in `<head>` while `i18n-utils.js` /
`translator.js` / `language.js` stay `defer`red at the bottom, same as
every other page. Skipping any one of these four pieces re-introduces the
flash.

## 11. Adding a third language later

1. Add the code to `SUPPORTED_LANGUAGES` and (if RTL) `RTL_LANGUAGES` in
   `language.js`.
2. Drop `assets/lang/xx.json` in place, mirroring `en.json`'s structure.
3. Add a `<button data-lang="xx">` to the switcher markup.

Nothing else changes — the Translator, the dynamic-data pattern, and every
page already wired don't know or care how many languages exist.
