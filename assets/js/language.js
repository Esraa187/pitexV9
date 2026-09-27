/* =========================================================================
   PITEX — language.js
   LanguageManager: the single source of truth for "what language is the
   site in right now". Owns:

     • Loading assets/lang/{lang}.json once and caching it in memory
       (subsequent switches are instant — no repeat network requests).
     • Persisting the chosen language to localStorage and restoring it on
       the next visit.
     • Setting <html lang="…" dir="…"> so RTL/LTR follows automatically.
     • Re-running the Translator over the whole document on every switch.
     • Notifying the rest of the app (production line cards, forms, GSAP-
       driven components, etc.) via a CustomEvent so nothing has to poll.
     • Wiring the existing .lang-switch dropdown + mobile-nav language
       pills already present in the markup.

   Load order on every page: i18n-utils.js → translator.js → language.js.
   language.js is the only one of the three that touches the DOM outside
   of translateElement(), and the only one aware of "en" / "ar" as
   concrete values — swapping in a third language later means editing
   SUPPORTED_LANGUAGES here and dropping in assets/lang/xx.json. Nothing
   else in the architecture needs to change.
   ========================================================================= */

window.I18N = window.I18N || {};

(function (I18N) {
  'use strict';

  const SUPPORTED_LANGUAGES = ['en', 'ar'];
  const DEFAULT_LANGUAGE = 'en';
  const RTL_LANGUAGES = ['ar'];
  const STORAGE_KEY = 'pitex_lang';
  const LANG_FILE_PATH = (lang) => `${getBasePath()}assets/lang/${lang}.json`;

  const cache = Object.create(null); // { en: {...}, ar: {...} }
  const changeListeners = [];
  let currentLanguage = DEFAULT_LANGUAGE;
  let loadingPromise = null;

  /**
   * Resolves translation JSON relative to the current page regardless of
   * which folder depth it's served from. Every page in this project lives
   * at the site root, so this is intentionally simple; if pages ever move
   * into subfolders, this is the one place to teach it a real base path.
   */
  function getBasePath() {
    return '';
  }

  function isRTL(lang) {
    return RTL_LANGUAGES.indexOf(lang) !== -1;
  }

  /** Returns the embedded fallback dictionary for `lang`, if one was
   *  generated (see assets/js/lang-inline-data.js), otherwise null. */
  function getInlineFallback(lang) {
    const inline = window.__PITEX_I18N_INLINE__;
    return (inline && inline[lang]) || null;
  }

  /** Fetches + caches assets/lang/{lang}.json. Safe to call repeatedly.
   *  Falls back to the embedded copy (lang-inline-data.js) if the fetch
   *  fails for any reason — most commonly because the page was opened
   *  directly as a file:// URL, where browsers block fetch() of local
   *  files as a CORS/security rule. This keeps the site working the
   *  moment someone double-clicks index.html, while still preferring the
   *  real JSON files (the source of truth) whenever they're reachable. */
  function loadLanguage(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);

    // The real JSON is still the source of truth, so always fetch it —
    // but never make the *first* paint wait on that network round-trip.
    // assets/js/lang-inline-data.js is loaded synchronously in <head>
    // (see EARLY LANGUAGE INIT in every page), so a byte-for-byte copy
    // of both dictionaries is already sitting in memory with zero
    // latency. If we have it, use it immediately and let the fetch
    // below quietly become the cache of record for every subsequent
    // read/switch — this is what makes the very first translateElement()
    // pass independent of network speed, which is what actually
    // eliminates the English/Arabic flash (see I18N-GUIDE.md §10).
    const inlineFallback = getInlineFallback(lang);

    const networkPromise = fetch(LANG_FILE_PATH(lang), { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${lang}.json (${res.status})`);
        return res.json();
      })
      .then((dict) => {
        cache[lang] = dict;
        return dict;
      })
      .catch((err) => {
        if (inlineFallback) {
          console.warn(
            `[I18N] Could not fetch assets/lang/${lang}.json (${err.message}). ` +
            'Using the embedded fallback copy instead — this is expected when ' +
            'the page is opened via a file:// URL. Serve the site over http(s) ' +
            '(see I18N-GUIDE.md) to load the JSON files directly.'
          );
          cache[lang] = cache[lang] || inlineFallback;
          return cache[lang];
        }
        throw err;
      });

    if (inlineFallback) {
      cache[lang] = inlineFallback;
      return Promise.resolve(inlineFallback);
    }

    return networkPromise;
  }

  /** Returns the currently-active dictionary (used by Translator). */
  function getDictionary() {
    return cache[currentLanguage] || null;
  }

  function getLanguage() {
    return currentLanguage;
  }

  /** Applies <html lang dir> — the one line that makes RTL/LTR "just work". */
  function applyDocumentDirection(lang) {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', isRTL(lang) ? 'rtl' : 'ltr');
  }

  /**
   * Un-hides the page (see the EARLY LANGUAGE INIT block in <head>) the
   * moment the first translateElement() pass has actually happened.
   * Safe to call on every setLanguage() (not just the first) — removing
   * an already-removed class is a no-op.
   */
  function revealDocument() {
    if (window.__PITEX_I18N_TIMEOUT__) {
      clearTimeout(window.__PITEX_I18N_TIMEOUT__);
      window.__PITEX_I18N_TIMEOUT__ = null;
    }
    document.documentElement.classList.remove('i18n-boot');
  }

  function notifyChange(lang) {
    changeListeners.forEach((cb) => {
      try {
        cb(lang);
      } catch (err) {
        console.error('[I18N] onChange listener threw:', err);
      }
    });
    document.dispatchEvent(
      new CustomEvent('i18n:languageChanged', { detail: { language: lang } })
    );
  }

  /**
   * Switches the active language: loads the JSON if needed (only once
   * ever, per language), updates storage + <html>, re-translates the
   * whole document, updates the switcher UI, and notifies subscribers so
   * dynamic content (product cards, dates, numbers…) can re-render.
   */
  function setLanguage(lang) {
    if (SUPPORTED_LANGUAGES.indexOf(lang) === -1) lang = DEFAULT_LANGUAGE;

    loadingPromise = loadLanguage(lang).then((dict) => {
      currentLanguage = lang;
      I18N.Storage.set(STORAGE_KEY, lang);
      applyDocumentDirection(lang);
      I18N.Translator.translateElement(document, dict);
      updateSwitcherUI(lang);
      revealDocument();
      notifyChange(lang);
      return dict;
    });

    return loadingPromise;
  }

  /** Registers a callback fired after every successful language switch. */
  function onChange(callback) {
    if (typeof callback === 'function') changeListeners.push(callback);
  }

  /**
   * Convenience translate-by-key helper for code that needs a string
   * outside the DOM (e.g. building an alert message dynamically).
   */
  function t(key, vars) {
    const dict = getDictionary();
    const value = I18N.Translator.resolve(dict, key);
    return value === undefined ? key : I18N.Translator.interpolate(value, vars);
  }

  /* =======================================================================
     SWITCHER UI — wires the desktop .lang-switch dropdown and the mobile
     offcanvas .mobile-nav__lang pills that already exist in the markup.
     header.js still owns opening/closing the dropdown (pure UI chrome);
     this owns *what happens* when a language button is actually clicked.
     ======================================================================= */
  const LANGUAGE_LABELS = { en: 'EN', ar: 'AR' };

  function updateSwitcherUI(lang) {
    document.querySelectorAll('[data-lang-switch]').forEach((switchEl) => {
      const currentLabel = switchEl.querySelector('[data-lang-current]');
      if (currentLabel) currentLabel.textContent = LANGUAGE_LABELS[lang] || lang.toUpperCase();

      switchEl.querySelectorAll('button[data-lang]').forEach((btn) => {
        const selected = btn.getAttribute('data-lang') === lang;
        const option = btn.closest('[role="option"]');
        if (option) option.setAttribute('aria-selected', String(selected));
        btn.classList.toggle('is-active', selected);
      });
    });

    document.querySelectorAll('.mobile-nav__lang button[data-lang]').forEach((btn) => {
      btn.setAttribute('aria-selected', String(btn.getAttribute('data-lang') === lang));
    });
  }

  function bindSwitcherClicks() {
    // Event delegation on <body> — works for every switcher instance,
    // including any added later (mega menus, footer language pills, etc.)
    document.body.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-lang]');
      if (!btn) return;
      const lang = btn.getAttribute('data-lang');
      if (!lang || lang === currentLanguage) return;
      setLanguage(lang);
    });
  }

  /**
   * Boots the whole system: figure out the initial language (saved choice
   * → browser language → default), load it, translate the document, wire
   * the switcher. Called once on DOMContentLoaded from the bottom of this
   * file — nothing else needs to remember to call this.
   */
  function init() {
    const saved = I18N.Storage.get(STORAGE_KEY, null);
    const browserLang = (navigator.language || '').slice(0, 2);
    const computed =
      (saved && SUPPORTED_LANGUAGES.indexOf(saved) !== -1 && saved) ||
      (SUPPORTED_LANGUAGES.indexOf(browserLang) !== -1 && browserLang) ||
      DEFAULT_LANGUAGE;

    // The EARLY LANGUAGE INIT script in <head> already ran this exact
    // same logic (same STORAGE_KEY, same fallback order) before first
    // paint, and already set <html lang dir> accordingly. Reuse its
    // result instead of recomputing, so there's one source of truth and
    // zero chance of the early paint and this init disagreeing. Falls
    // back to recomputing if that script didn't run for some reason
    // (blocked, disabled, etc.).
    const initial = window.__PITEX_INITIAL_LANG__ || computed;

    bindSwitcherClicks();
    setLanguage(initial);
  }

  /**
   * snapReveal(container) — call this after re-rendering dynamic markup
   * inside an I18N.onChange() callback (never on the initial paint).
   *
   * Cards/rows built by renderProductCard(), renderCategoryCard(), the
   * workflow timeline, etc. carry classes like .gsap-stagger-item that
   * CSS hides (opacity:0) until a GSAP scroll-triggered entrance
   * animation reveals them — see .js-anim .gsap-stagger-item in
   * animations.css. A language switch replaces those DOM nodes with
   * fresh ones that were never targeted by that entrance animation, so
   * without this they would stay invisible forever after the first
   * switch. This snaps them straight to their "settled" visible state
   * instead of re-running the reveal animation.
   */
  function snapReveal(container) {
    if (!container) return;
    const selector = '.gsap-stagger-item, .gsap-fade-up, .gsap-fade-in, .gsap-scale-in, .gsap-slide-in-left, .gsap-slide-in-right';
    container.querySelectorAll(selector).forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  }

  I18N.LanguageManager = {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    init,
    setLanguage,
    getLanguage,
    getDictionary,
    isRTL,
    onChange,
    t,
  };

  // Flat aliases — this is the everyday API the rest of the codebase (and
  // dynamic-data renderers like products-data.js) actually calls.
  I18N.getLanguage = getLanguage;
  I18N.getDictionary = getDictionary;
  I18N.setLanguage = setLanguage;
  I18N.isRTL = isRTL;
  I18N.onChange = onChange;
  I18N.t = t;
  I18N.snapReveal = snapReveal;

  /**
   * pick() — the helper the "dynamic data" requirement asks for by name:
   *   title.textContent = I18N.pick(product.title)
   * Given either a { en, ar } object or a plain string, returns the
   * string for the current language (falling back to English, then to
   * whatever value exists, so a partially-translated dataset never
   * renders blank).
   */
  I18N.pick = function (field) {
    if (field === null || field === undefined) return '';
    if (typeof field === 'string') return field;
    const lang = getLanguage();
    return field[lang] ?? field[DEFAULT_LANGUAGE] ?? Object.values(field)[0] ?? '';
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.I18N);
