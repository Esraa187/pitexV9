/* =========================================================================
   PITEX — quote-validation.js
   Pure validation rules for the Request a Quote modal. Kept separate from
   quote-modal.js so the rule set can be unit-tested / reused on its own —
   no DOM wiring lives in here beyond the has-error class toggle contract
   already used by the Contact form (.form-group-custom / .quote-field
   + .has-error + .form-error-text, see contact.js / contact.css).
   ========================================================================= */
(function () {
  'use strict';

  // Required fields for the quote request, per the brief.
  const RULES = {
    quantity: (v) => Number(v) >= 1 && Number.isFinite(Number(v)),
    country: (v, ctx) => {
      const val = v.trim().toLowerCase();
      if (!val) return false;
      const list = (ctx && ctx.countries) || [];
      return list.some((c) => c.toLowerCase() === val);
    },
    company: (v) => v.trim().length >= 2,
    fullName: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: (v) => /^[+\d][\d\s().-]{6,}$/.test(v.trim()),
  };

  const REQUIRED_FIELDS = Object.keys(RULES);

  /**
   * Validates one field, toggles the `.has-error` class on its
   * `.quote-field` wrapper, and returns whether it's currently valid.
   */
  function validateField(form, name, ctx) {
    const field = form.elements[name];
    const rule = RULES[name];
    if (!field || !rule) return true;

    const ok = rule(field.value, ctx);
    const wrap = field.closest('.quote-field');
    if (wrap) wrap.classList.toggle('has-error', !ok);
    return ok;
  }

  /** Validates every required field; returns true only if all pass. */
  function validateAll(form, ctx) {
    return REQUIRED_FIELDS.map((name) => validateField(form, name, ctx)).every(Boolean);
  }

  /**
   * Cheap read-only check (no DOM mutation) used to enable/disable the
   * submit button live as the person types, without flashing error
   * states before a field has been touched.
   */
  function isFormValid(form, ctx) {
    return REQUIRED_FIELDS.every((name) => {
      const field = form.elements[name];
      const rule = RULES[name];
      return field && rule && rule(field.value, ctx);
    });
  }

  /**
   * Read-only check for a single field (no DOM mutation, no class
   * toggling). Lets quote-modal.js clear an existing error the moment
   * a fix is typed, without ever adding a new error before blur/submit.
   */
  function checkField(form, name, ctx) {
    const field = form.elements[name];
    const rule = RULES[name];
    if (!field || !rule) return true;
    return rule(field.value, ctx);
  }

  window.PitexQuoteValidation = {
    REQUIRED_FIELDS,
    validateField,
    validateAll,
    isFormValid,
    checkField,
  };
})();
