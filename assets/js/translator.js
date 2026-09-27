/* =========================================================================
   PITEX — translator.js
   The Translator is a pure DOM-updating engine. It knows nothing about
   *how* a dictionary was loaded or *which* language is active — language.js
   owns that. Given a dictionary object and a root element, it:

     1. Walks every [data-i18n] element and sets its text content from the
        dictionary (dot-path lookup, e.g. data-i18n="hero.title").
     2. Walks every [data-i18n-attr-*] element and sets that specific
        attribute instead (placeholder, aria-label, title, alt, value…).
     3. Optionally interpolates {{placeholders}} inside a translated string
        using a per-element data-i18n-vars="key:value,key2:value2" map.

   Because #2 is a *prefix* convention (data-i18n-attr-placeholder,
   data-i18n-attr-aria-label, data-i18n-attr-title, data-i18n-attr-alt,
   data-i18n-attr-value, ...) it supports "everything visible to users"
   from the spec without inventing a new attribute per case, and it keeps
   working for attributes nobody has thought of yet.

   translateElement(container) is exported so dynamically-inserted markup
   (cards rendered from fetch()'d JSON, modals, tabs, tooltips, pagination,
   anything built at runtime) can be localized the same way the static
   page was, right after it's inserted into the DOM.
   ========================================================================= */

window.I18N = window.I18N || {};

(function (I18N) {
  'use strict';

  /**
   * Resolves a dot-path ("hero.slide1.title") against a nested dictionary.
   * Returns `undefined` if any segment is missing, never throws.
   */
  function resolve(dict, path) {
    if (!dict || !path) return undefined;
    return path.split('.').reduce((node, segment) => {
      return node && Object.prototype.hasOwnProperty.call(node, segment)
        ? node[segment]
        : undefined;
    }, dict);
  }

  /**
   * Interpolates {{token}} placeholders in `str` using a plain object of
   * values, e.g. interpolate("Showing {{count}} results", { count: 12 }).
   */
  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, token) => {
      return Object.prototype.hasOwnProperty.call(vars, token) ? vars[token] : match;
    });
  }

  /** Parses data-i18n-vars="name:John,count:3" into { name:'John', count:'3' }. */
  function parseVars(raw) {
    if (!raw) return null;
    const out = {};
    raw.split(',').forEach((pair) => {
      const [key, ...rest] = pair.split(':');
      if (!key) return;
      out[key.trim()] = rest.join(':').trim();
    });
    return out;
  }

  /**
   * Translates a single element's text content in place, given a resolved
   * string. Text-only by default (XSS-safe); an element can opt into raw
   * HTML (e.g. a title with a manual <br>) via data-i18n-html="true" —
   * used sparingly, and only ever fed by our own trusted JSON files.
   */
  function applyText(el, value) {
    if (value === undefined) return;
    const vars = parseVars(el.getAttribute('data-i18n-vars'));
    const finalValue = interpolate(value, vars);
    if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = finalValue;
    } else {
      el.textContent = finalValue;
    }
  }

  /** Translates every data-i18n-attr-* attribute present on `el`. */
  function applyAttributes(el, dict) {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.indexOf('data-i18n-attr-') !== 0) return;
      const targetAttr = attr.name.replace('data-i18n-attr-', '');
      const value = resolve(dict, attr.value);
      if (value === undefined) return;
      const vars = parseVars(el.getAttribute('data-i18n-vars'));
      el.setAttribute(targetAttr, interpolate(value, vars));
    });
  }

  /**
   * Translates `container` (defaults to the whole document) against
   * `dict`. Safe to call repeatedly and safe to call on freshly-inserted
   * fragments — this is the function fetch-driven pages must call after
   * rendering dynamic markup.
   */
  function translateElement(container, dict) {
    const root = container || document;
    if (!dict) return;

    // Text nodes.
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      applyText(el, resolve(dict, el.getAttribute('data-i18n')));
    });
    // The root itself, if it was passed in already carrying data-i18n.
    if (root !== document && root.hasAttribute && root.hasAttribute('data-i18n')) {
      applyText(root, resolve(dict, root.getAttribute('data-i18n')));
    }

    // Attributes (placeholder, aria-label, title, alt, value, …).
    root.querySelectorAll('*').forEach((el) => applyAttributes(el, dict));
    if (root !== document && root.attributes) applyAttributes(root, dict);
  }

  I18N.Translator = {
    resolve,
    interpolate,
    translateElement,
  };

  // Convenience top-level alias used throughout the codebase and by
  // dynamically-rendered components: I18N.translateElement(container).
  I18N.translateElement = function (container) {
    const dict = I18N.getDictionary ? I18N.getDictionary() : null;
    translateElement(container, dict);
  };
})(window.I18N);
