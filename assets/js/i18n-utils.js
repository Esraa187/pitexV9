/* =========================================================================
   PITEX — i18n-utils.js
   Small, dependency-free helpers shared by language.js and translator.js:
     • Storage      — safe localStorage wrapper (never throws)
     • NumberFormat — locale-aware number formatting (Intl)
     • DateFormat   — locale-aware date formatting (Intl)

   Everything hangs off a single global namespace, `window.I18N`, so plain
   <script> tags (no bundler, no ES module graph) can share it — the same
   pattern already used by window.PitexProducts, window.PitexCategories,
   etc. elsewhere in this codebase.
   ========================================================================= */

window.I18N = window.I18N || {};

(function (I18N) {
  'use strict';

  /* Maps our internal language codes to BCP-47 locale tags Intl expects. */
  const LOCALE_MAP = {
    en: 'en-US',
    ar: 'ar-EG',
  };

  function toLocale(lang) {
    return LOCALE_MAP[lang] || 'en-US';
  }

  /* =======================================================================
     STORAGE — wraps localStorage so a private-browsing / storage-disabled
     environment degrades to "language resets on refresh" instead of a
     hard crash anywhere language.js touches it.
     ======================================================================= */
  const Storage = {
    get(key, fallback) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (err) {
        return false;
      }
    },
  };

  /* =======================================================================
     NUMBER FORMAT — "1,250" (en) vs "١٬٢٥٠" (ar), via Intl.NumberFormat.
     Falls back to the raw number as a string if Intl is unavailable.
     ======================================================================= */
  const NumberFormat = {
    format(value, lang, options) {
      const num = Number(value);
      if (Number.isNaN(num)) return String(value);
      try {
        return new Intl.NumberFormat(toLocale(lang), options).format(num);
      } catch (err) {
        return String(num);
      }
    },
  };

  /* =======================================================================
     DATE FORMAT — locale-aware date/time formatting.
     `value` accepts a Date, timestamp, or any string Date() can parse.
     ======================================================================= */
  const DateFormat = {
    format(value, lang, options) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const opts = options || { year: 'numeric', month: 'long', day: 'numeric' };
      try {
        return new Intl.DateTimeFormat(toLocale(lang), opts).format(date);
      } catch (err) {
        return date.toISOString().slice(0, 10);
      }
    },
  };

  I18N.Storage = Storage;
  I18N.NumberFormat = NumberFormat;
  I18N.DateFormat = DateFormat;
  I18N.toLocale = toLocale;
})(window.I18N);
