/* =========================================================================
   PITEX — quote-modal.js
   Drives the "Request a Quote" modal on the Product Details page: fills
   the read-only product header from the current product record, wires
   the searchable country combobox, keeps the submit button's disabled
   state in sync with quote-validation.js, and on submit builds a
   WhatsApp message via quote-whatsapp.js, opens it in a new tab, closes
   the modal and shows a success toast. This is a B2B quote request, not
   checkout — there is no backend call.
   ========================================================================= */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', back: 'back.out(1.7)' };

  /**
   * pick() — resolves a { en, ar } field (or a plain string, for safety)
   * to the string for the current language. Mirrors window.I18N.pick so
   * this module degrades gracefully if language.js hasn't loaded yet.
   */
  function pick(field) {
    if (window.I18N && typeof window.I18N.pick === 'function') return window.I18N.pick(field);
    if (field === null || field === undefined) return '';
    if (typeof field === 'string') return field;
    return field.en ?? Object.values(field)[0] ?? '';
  }

  function t(key, vars) {
    if (window.I18N && typeof window.I18N.t === 'function') return window.I18N.t(key, vars);
    return key;
  }

  // Reasonably complete, bilingual country list for the destination-country combobox.
  const COUNTRIES = [
    { en: 'Afghanistan', ar: 'أفغانستان' },
    { en: 'Albania', ar: 'ألبانيا' },
    { en: 'Algeria', ar: 'الجزائر' },
    { en: 'Andorra', ar: 'أندورا' },
    { en: 'Angola', ar: 'أنغولا' },
    { en: 'Argentina', ar: 'الأرجنتين' },
    { en: 'Armenia', ar: 'أرمينيا' },
    { en: 'Australia', ar: 'أستراليا' },
    { en: 'Austria', ar: 'النمسا' },
    { en: 'Azerbaijan', ar: 'أذربيجان' },
    { en: 'Bahamas', ar: 'باهاماس' },
    { en: 'Bahrain', ar: 'البحرين' },
    { en: 'Bangladesh', ar: 'بنغلاديش' },
    { en: 'Barbados', ar: 'باربادوس' },
    { en: 'Belarus', ar: 'بيلاروسيا' },
    { en: 'Belgium', ar: 'بلجيكا' },
    { en: 'Belize', ar: 'بليز' },
    { en: 'Benin', ar: 'بنين' },
    { en: 'Bhutan', ar: 'بوتان' },
    { en: 'Bolivia', ar: 'بوليفيا' },
    { en: 'Bosnia and Herzegovina', ar: 'البوسنة والهرسك' },
    { en: 'Botswana', ar: 'بوتسوانا' },
    { en: 'Brazil', ar: 'البرازيل' },
    { en: 'Brunei', ar: 'بروناي' },
    { en: 'Bulgaria', ar: 'بلغاريا' },
    { en: 'Burkina Faso', ar: 'بوركينا فاسو' },
    { en: 'Burundi', ar: 'بوروندي' },
    { en: 'Cambodia', ar: 'كمبوديا' },
    { en: 'Cameroon', ar: 'الكاميرون' },
    { en: 'Canada', ar: 'كندا' },
    { en: 'Chad', ar: 'تشاد' },
    { en: 'Chile', ar: 'تشيلي' },
    { en: 'China', ar: 'الصين' },
    { en: 'Colombia', ar: 'كولومبيا' },
    { en: 'Comoros', ar: 'جزر القمر' },
    { en: 'Costa Rica', ar: 'كوستاريكا' },
    { en: "Cote d'Ivoire", ar: 'ساحل العاج' },
    { en: 'Croatia', ar: 'كرواتيا' },
    { en: 'Cuba', ar: 'كوبا' },
    { en: 'Cyprus', ar: 'قبرص' },
    { en: 'Czech Republic', ar: 'جمهورية التشيك' },
    { en: 'Denmark', ar: 'الدنمارك' },
    { en: 'Djibouti', ar: 'جيبوتي' },
    { en: 'Dominican Republic', ar: 'جمهورية الدومينيكان' },
    { en: 'Ecuador', ar: 'الإكوادور' },
    { en: 'Egypt', ar: 'مصر' },
    { en: 'El Salvador', ar: 'السلفادور' },
    { en: 'Estonia', ar: 'إستونيا' },
    { en: 'Ethiopia', ar: 'إثيوبيا' },
    { en: 'Fiji', ar: 'فيجي' },
    { en: 'Finland', ar: 'فنلندا' },
    { en: 'France', ar: 'فرنسا' },
    { en: 'Gabon', ar: 'الغابون' },
    { en: 'Gambia', ar: 'غامبيا' },
    { en: 'Georgia', ar: 'جورجيا' },
    { en: 'Germany', ar: 'ألمانيا' },
    { en: 'Ghana', ar: 'غانا' },
    { en: 'Greece', ar: 'اليونان' },
    { en: 'Guatemala', ar: 'غواتيمالا' },
    { en: 'Guinea', ar: 'غينيا' },
    { en: 'Guyana', ar: 'غيانا' },
    { en: 'Haiti', ar: 'هايتي' },
    { en: 'Honduras', ar: 'هندوراس' },
    { en: 'Hungary', ar: 'المجر' },
    { en: 'Iceland', ar: 'آيسلندا' },
    { en: 'India', ar: 'الهند' },
    { en: 'Indonesia', ar: 'إندونيسيا' },
    { en: 'Iran', ar: 'إيران' },
    { en: 'Iraq', ar: 'العراق' },
    { en: 'Ireland', ar: 'أيرلندا' },
    { en: 'Israel', ar: 'إسرائيل' },
    { en: 'Italy', ar: 'إيطاليا' },
    { en: 'Jamaica', ar: 'جامايكا' },
    { en: 'Japan', ar: 'اليابان' },
    { en: 'Jordan', ar: 'الأردن' },
    { en: 'Kazakhstan', ar: 'كازاخستان' },
    { en: 'Kenya', ar: 'كينيا' },
    { en: 'Kuwait', ar: 'الكويت' },
    { en: 'Kyrgyzstan', ar: 'قيرغيزستان' },
    { en: 'Laos', ar: 'لاوس' },
    { en: 'Latvia', ar: 'لاتفيا' },
    { en: 'Lebanon', ar: 'لبنان' },
    { en: 'Lesotho', ar: 'ليسوتو' },
    { en: 'Liberia', ar: 'ليبيريا' },
    { en: 'Libya', ar: 'ليبيا' },
    { en: 'Liechtenstein', ar: 'ليختنشتاين' },
    { en: 'Lithuania', ar: 'ليتوانيا' },
    { en: 'Luxembourg', ar: 'لوكسمبورغ' },
    { en: 'Madagascar', ar: 'مدغشقر' },
    { en: 'Malawi', ar: 'مالاوي' },
    { en: 'Malaysia', ar: 'ماليزيا' },
    { en: 'Maldives', ar: 'المالديف' },
    { en: 'Mali', ar: 'مالي' },
    { en: 'Malta', ar: 'مالطا' },
    { en: 'Mauritania', ar: 'موريتانيا' },
    { en: 'Mauritius', ar: 'موريشيوس' },
    { en: 'Mexico', ar: 'المكسيك' },
    { en: 'Moldova', ar: 'مولدوفا' },
    { en: 'Monaco', ar: 'موناكو' },
    { en: 'Mongolia', ar: 'منغوليا' },
    { en: 'Montenegro', ar: 'الجبل الأسود' },
    { en: 'Morocco', ar: 'المغرب' },
    { en: 'Mozambique', ar: 'موزمبيق' },
    { en: 'Myanmar', ar: 'ميانمار' },
    { en: 'Namibia', ar: 'ناميبيا' },
    { en: 'Nepal', ar: 'نيبال' },
    { en: 'Netherlands', ar: 'هولندا' },
    { en: 'New Zealand', ar: 'نيوزيلندا' },
    { en: 'Nicaragua', ar: 'نيكاراغوا' },
    { en: 'Niger', ar: 'النيجر' },
    { en: 'Nigeria', ar: 'نيجيريا' },
    { en: 'North Macedonia', ar: 'مقدونيا الشمالية' },
    { en: 'Norway', ar: 'النرويج' },
    { en: 'Oman', ar: 'عُمان' },
    { en: 'Pakistan', ar: 'باكستان' },
    { en: 'Panama', ar: 'بنما' },
    { en: 'Papua New Guinea', ar: 'بابوا غينيا الجديدة' },
    { en: 'Paraguay', ar: 'باراغواي' },
    { en: 'Peru', ar: 'بيرو' },
    { en: 'Philippines', ar: 'الفلبين' },
    { en: 'Poland', ar: 'بولندا' },
    { en: 'Portugal', ar: 'البرتغال' },
    { en: 'Qatar', ar: 'قطر' },
    { en: 'Romania', ar: 'رومانيا' },
    { en: 'Russia', ar: 'روسيا' },
    { en: 'Rwanda', ar: 'رواندا' },
    { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
    { en: 'Senegal', ar: 'السنغال' },
    { en: 'Serbia', ar: 'صربيا' },
    { en: 'Seychelles', ar: 'سيشل' },
    { en: 'Sierra Leone', ar: 'سيراليون' },
    { en: 'Singapore', ar: 'سنغافورة' },
    { en: 'Slovakia', ar: 'سلوفاكيا' },
    { en: 'Slovenia', ar: 'سلوفينيا' },
    { en: 'Somalia', ar: 'الصومال' },
    { en: 'South Africa', ar: 'جنوب أفريقيا' },
    { en: 'South Korea', ar: 'كوريا الجنوبية' },
    { en: 'South Sudan', ar: 'جنوب السودان' },
    { en: 'Spain', ar: 'إسبانيا' },
    { en: 'Sri Lanka', ar: 'سريلانكا' },
    { en: 'Sudan', ar: 'السودان' },
    { en: 'Suriname', ar: 'سورينام' },
    { en: 'Sweden', ar: 'السويد' },
    { en: 'Switzerland', ar: 'سويسرا' },
    { en: 'Syria', ar: 'سوريا' },
    { en: 'Taiwan', ar: 'تايوان' },
    { en: 'Tajikistan', ar: 'طاجيكستان' },
    { en: 'Tanzania', ar: 'تنزانيا' },
    { en: 'Thailand', ar: 'تايلاند' },
    { en: 'Togo', ar: 'توغو' },
    { en: 'Trinidad and Tobago', ar: 'ترينيداد وتوباغو' },
    { en: 'Tunisia', ar: 'تونس' },
    { en: 'Turkey', ar: 'تركيا' },
    { en: 'Turkmenistan', ar: 'تركمانستان' },
    { en: 'Uganda', ar: 'أوغندا' },
    { en: 'Ukraine', ar: 'أوكرانيا' },
    { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
    { en: 'United Kingdom', ar: 'المملكة المتحدة' },
    { en: 'United States', ar: 'الولايات المتحدة' },
    { en: 'Uruguay', ar: 'أوروغواي' },
    { en: 'Uzbekistan', ar: 'أوزبكستان' },
    { en: 'Venezuela', ar: 'فنزويلا' },
    { en: 'Vietnam', ar: 'فيتنام' },
    { en: 'Yemen', ar: 'اليمن' },
    { en: 'Zambia', ar: 'زامبيا' },
    { en: 'Zimbabwe', ar: 'زيمبابوي' },
  ];

  let product = null;
  let modal, panel, form, submitBtn, formWrap;
  let countryInput, countryList, countryWrap;
  let toast, toastTimer;
  let lastFocused = null;
  let countryListDetached = false;

  function init(currentProduct) {
    product = currentProduct;

    modal = document.getElementById('quoteModal');
    if (!modal) return;

    panel = modal.querySelector('.quote-modal__panel');
    form = document.getElementById('quoteForm');
    formWrap = modal.querySelector('[data-quote-form-wrap]');
    submitBtn = modal.querySelector('[data-quote-submit]');
    toast = document.getElementById('quoteToast');

    countryWrap = modal.querySelector('[data-country-select]');
    countryInput = document.getElementById('quoteCountry');
    countryList = document.getElementById('quoteCountryList');

    wireOpenTriggers();
    wireCloseTriggers();
    wireCountrySelect();
    wireLiveValidation();
    wireTouchedState();
    wireSubmit();
    wireLanguageChange();
  }

  /**
   * Keeps an already-open modal in sync when the language switcher is
   * used mid-flow: the read-only product header (title/category, both
   * bilingual fields) and the country dropdown (bilingual option list +
   * the "No matching countries" empty state) all need to re-render in
   * the new language, without touching whatever the person already typed.
   */
  function wireLanguageChange() {
    if (!window.I18N || typeof window.I18N.onChange !== 'function') return;
    window.I18N.onChange(() => {
      if (!modal || !modal.classList.contains('is-open')) return;
      populateProductHeader();
      if (countryWrap && countryWrap.classList.contains('is-open')) {
        renderCountryOptions(countryInput.value);
      }
    });
  }

  /* ------------------------------------------------------------------- */
  /* Open / close                                                         */
  /* ------------------------------------------------------------------- */

  function wireOpenTriggers() {
    document.querySelectorAll('[data-open-quote-modal]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
  }

  function wireCloseTriggers() {
    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !modal.classList.contains('is-open')) return;
      // If the country dropdown is open, Escape closes that first.
      if (countryWrap && countryWrap.classList.contains('is-open')) {
        closeCountryList();
        return;
      }
      closeModal();
    });

    modal.addEventListener('keydown', trapFocus);
  }

  function openModal() {
    lastFocused = document.activeElement;
    populateProductHeader();
    resetForm();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    animateOpen();

    const firstField = form ? form.querySelector('.quote-field__input:not([readonly])') : null;
    if (firstField) setTimeout(() => firstField.focus(), prefersReducedMotion ? 0 : 350);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    closeCountryList();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function animateOpen() {
    if (prefersReducedMotion || !hasGSAP || !panel) return;

    const fields = form ? form.querySelectorAll('.quote-field') : [];
    const actions = modal.querySelector('.quote-modal__actions');

    gsap.set(panel, { opacity: 0, scale: 0.95, y: 12 });
    gsap.set(fields, { opacity: 0, y: 18 });
    if (actions) gsap.set(actions, { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out4 } });
    // clearProps: 'transform' removes the inline transform GSAP would
    // otherwise leave behind once the tween completes. A lingering
    // transform (even translate3d(0,0,0)) creates a new stacking
    // context on every .quote-field, which used to trap the country
    // dropdown's z-index inside the country field's own paint order —
    // exactly why it rendered behind the rows below it. Clearing it
    // once the entrance animation finishes restores normal stacking.
    tl.to(panel, { opacity: 1, scale: 1, y: 0, duration: 0.45 })
      .to(fields, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: EASE.out3, clearProps: 'transform' }, '-=0.2');
    if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.4, ease: EASE.out3, clearProps: 'transform' }, '-=0.15');
  }

  function populateProductHeader() {
    if (!product) return;
    const img = modal.querySelector('[data-quote-product-image]');
    const category = modal.querySelector('[data-quote-product-category]');
    const title = modal.querySelector('[data-quote-product-title]');
    const nameInput = modal.querySelector('[data-quote-product-name]');

    if (img) { img.src = product.image || ''; img.alt = pick(product.title) || ''; }
    if (category) category.textContent = pick(product.categoryLabel) || '';
    if (title) title.textContent = pick(product.title) || '';
    if (nameInput) nameInput.value = pick(product.title) || '';
  }

  function resetForm() {
    if (form) form.reset();
    if (product) {
      const nameInput = modal.querySelector('[data-quote-product-name]');
      if (nameInput) nameInput.value = pick(product.title) || '';
    }
    form.querySelectorAll('.quote-field').forEach((f) => {
      f.classList.remove('has-error');
      f.classList.remove('is-touched');
    });
    closeCountryList();
    updateSubmitState();
  }

  /* ------------------------------------------------------------------- */
  /* Focus trap                                                           */
  /* ------------------------------------------------------------------- */

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(
      panel.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]')
    ).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------- */
  /* "Touched" state — keeps floating labels pinned up permanently once   */
  /* the person has interacted with a field, even if it's later blurred   */
  /* empty/invalid. See .is-touched in product-details.css.               */
  /* ------------------------------------------------------------------- */

  function markTouched(field) {
    const wrap = field.closest('.quote-field');
    if (wrap) wrap.classList.add('is-touched');
  }

  function wireTouchedState() {
    if (!form) return;
    form.querySelectorAll('.quote-field__input').forEach((field) => {
      field.addEventListener('focus', () => markTouched(field));
    });
  }

  /* ------------------------------------------------------------------- */
  /* Country combobox                                                     */
  /* ------------------------------------------------------------------- */

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function renderCountryOptions(query) {
    const q = (query || '').trim();
    const names = COUNTRIES.map((c) => pick(c));
    const matches = (q ? names.filter((c) => c.toLowerCase().includes(q.toLowerCase())) : names).slice(0, 40);

    if (!matches.length) {
      countryList.innerHTML = '<li class="quote-country-list__empty" role="presentation">' +
        escapeHtml(t('common.forms.noMatchingCountries')) + '</li>';
      return;
    }

    const re = q ? new RegExp('(' + escapeRegExp(q) + ')', 'ig') : null;
    countryList.innerHTML = matches
      .map((c) => {
        const label = re ? escapeHtml(c).replace(re, '<mark>$1</mark>') : escapeHtml(c);
        return '<li role="option" tabindex="-1">' + label + '</li>';
      })
      .join('');
  }

  /**
   * Positions the (portalled) dropdown against the country input's
   * current on-screen rect. Called on open and again on scroll/resize
   * so it tracks the field even though it now lives on <body>, outside
   * the modal panel's own scroll container.
   */
  function positionCountryList() {
    if (!countryWrap || !countryWrap.classList.contains('is-open')) return;
    const rect = countryInput.getBoundingClientRect();
    countryList.style.top = Math.round(rect.bottom + 8) + 'px';
    countryList.style.left = Math.round(rect.left) + 'px';
    countryList.style.width = Math.round(rect.width) + 'px';
  }

  function openCountryList() {
    // Move the listbox to <body> the first time it opens so it is a
    // sibling of the modal, not a descendant — this takes it out of
    // the modal panel's overflow-y: auto (no more clipping) and out
    // from under any stacking context created on ancestor .quote-field
    // elements (no more "appears behind the rows below" bug).
    if (!countryListDetached) {
      document.body.appendChild(countryList);
      countryListDetached = true;
    }

    renderCountryOptions(countryInput.value);
    positionCountryList();

    countryList.classList.add('is-open');
    countryList.setAttribute('aria-hidden', 'false');
    countryInput.setAttribute('aria-expanded', 'true');
    countryWrap.classList.add('is-open');
  }

  function closeCountryList() {
    if (!countryList || !countryWrap) return;
    countryList.classList.remove('is-open');
    countryList.setAttribute('aria-hidden', 'true');
    countryInput.setAttribute('aria-expanded', 'false');
    countryWrap.classList.remove('is-open');
  }

  function wireCountrySelect() {
    if (!countryInput || !countryList) return;

    countryInput.addEventListener('focus', openCountryList);
    countryInput.addEventListener('input', () => {
      openCountryList();
      clearErrorIfNowValid('country');
      updateSubmitState();
    });

    countryList.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li[role="option"]');
      if (!li) return;
      e.preventDefault();
      countryInput.value = li.textContent;
      closeCountryList();
      validateFieldLive('country');
      countryInput.focus();
    });

    countryInput.addEventListener('keydown', (e) => {
      if (!countryWrap.classList.contains('is-open')) return;
      const options = Array.from(countryList.querySelectorAll('li[role="option"]'));
      if (!options.length) return;
      const activeIndex = options.findIndex((o) => o.classList.contains('is-active'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = options[Math.min(activeIndex + 1, options.length - 1)] || options[0];
        options.forEach((o) => o.classList.remove('is-active'));
        next.classList.add('is-active');
        next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = options[Math.max(activeIndex - 1, 0)];
        options.forEach((o) => o.classList.remove('is-active'));
        prev.classList.add('is-active');
        prev.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const active = options[activeIndex] || options[0];
        if (active) {
          e.preventDefault();
          countryInput.value = active.textContent.replace(/<[^>]*>/g, '');
          closeCountryList();
          validateFieldLive('country');
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (countryWrap && !countryWrap.contains(e.target) && !countryList.contains(e.target)) {
        closeCountryList();
      }
    });

    // Keep the dropdown glued to the input if the modal panel scrolls,
    // the window resizes, or the viewport reflows for any other reason.
    // Capture phase so this also fires for scrolls inside the modal
    // panel's own overflow-y: auto container (which don't bubble).
    window.addEventListener('scroll', positionCountryList, true);
    window.addEventListener('resize', positionCountryList);
  }

  /* ------------------------------------------------------------------- */
  /* Validation wiring (delegates rules to quote-validation.js)           */
  /* ------------------------------------------------------------------- */

  function validationCtx() {
    return { countries: COUNTRIES.map((c) => pick(c)) };
  }

  function validateFieldLive(name) {
    if (window.PitexQuoteValidation) {
      window.PitexQuoteValidation.validateField(form, name, validationCtx());
    }
    updateSubmitState();
  }

  /**
   * While the person is still typing we never *add* an error — only
   * clear one that's already showing, the moment the field becomes
   * valid. New errors only ever appear on blur or submit.
   */
  function clearErrorIfNowValid(name) {
    if (!window.PitexQuoteValidation) return;
    const field = form.elements[name];
    if (!field) return;
    const wrap = field.closest('.quote-field');
    if (!wrap || !wrap.classList.contains('has-error')) return;
    if (window.PitexQuoteValidation.checkField(form, name, validationCtx())) {
      wrap.classList.remove('has-error');
    }
  }

  function updateSubmitState() {
    if (!submitBtn || !window.PitexQuoteValidation) return;
    const valid = window.PitexQuoteValidation.isFormValid(form, validationCtx());
    submitBtn.disabled = !valid;
  }

  function wireLiveValidation() {
    if (!form || !window.PitexQuoteValidation) return;
    window.PitexQuoteValidation.REQUIRED_FIELDS.forEach((name) => {
      const field = form.elements[name];
      if (!field || name === 'country') return; // country handled by wireCountrySelect
      field.addEventListener('input', () => {
        clearErrorIfNowValid(name);
        updateSubmitState();
      });
      field.addEventListener('blur', () => validateFieldLive(name));
    });
  }

  /* ------------------------------------------------------------------- */
  /* Submit → WhatsApp hand-off                                           */
  /* ------------------------------------------------------------------- */

  function wireSubmit() {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.PitexQuoteValidation || !window.PitexQuoteWhatsApp) return;

      const allValid = window.PitexQuoteValidation.validateAll(form, validationCtx());
      updateSubmitState();
      if (!allValid) {
        const firstInvalid = form.querySelector('.has-error .quote-field__input');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const data = {
        productName: form.elements.productName.value,
        quantity: form.elements.quantity.value,
        country: form.elements.country.value,
        company: form.elements.company.value,
        fullName: form.elements.fullName.value,
        email: form.elements.email.value,
        phone: form.elements.phone.value,
      };

      const url = window.PitexQuoteWhatsApp.buildWhatsAppUrl(data);
      window.open(url, '_blank', 'noopener');

      closeModal();
      showToast();
    });
  }

  /* ------------------------------------------------------------------- */
  /* Success toast                                                        */
  /* ------------------------------------------------------------------- */

  function showToast() {
    if (!toast) return;
    clearTimeout(toastTimer);

    toast.hidden = false;
    toast.setAttribute('aria-hidden', 'false');
    toast.classList.add('is-visible');

    if (!prefersReducedMotion && hasGSAP) {
      gsap.fromTo(
        toast,
        { opacity: 0, x: 60, y: -12 },
        { opacity: 1, x: 0, y: 0, duration: 0.5, ease: EASE.back }
      );
    }

    toastTimer = setTimeout(hideToast, 3000);
  }

  function hideToast() {
    if (!toast) return;
    if (!prefersReducedMotion && hasGSAP) {
      gsap.to(toast, {
        opacity: 0,
        x: 60,
        duration: 0.4,
        ease: EASE.out3,
        onComplete: () => {
          toast.classList.remove('is-visible');
          toast.setAttribute('aria-hidden', 'true');
        },
      });
    } else {
      toast.classList.remove('is-visible');
      toast.setAttribute('aria-hidden', 'true');
    }
  }

  window.PitexQuoteModal = { init };
})();
