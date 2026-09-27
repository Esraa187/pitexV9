/* =========================================================================
   PITEX — contact.js
   Owns everything specific to the Contact Us page that main.js doesn't
   already provide for free:
     - entrance choreography for the Get In Touch row, the How Can We
       Help form/Connect grid, and the map section (the hero and the
       final CTA are already animated by main.js because they reuse
       .page-hero / .final-cta-section verbatim)
     - the contact form's client-side validation, loading state and
       success state (submission itself is simulated — no backend wired)
     - premium micro-interactions: copy-email-to-clipboard, subtle card
       tilt on the Connect With Us panel, a small stagger on the social
       icons, and smooth-scroll from the CTA buttons down to the form
   Buttons already get magnetic pull + ripple + press-bounce for free from
   initMagnetic()/initButtonPremium() in main.js (class-selector based),
   so none of that is duplicated here.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    initGetInTouchEntrance();
    initContactHelpEntrance();
    initMapEntrance();
    initCardTiltLite('.contact-help-panel--connect');
    initSocialStagger();
    initCopyEmail();
    initClickToCallAndMap();
    initContactForm();
    initScrollToForm();
  });

  /* =======================================================================
     GET IN TOUCH — minimal horizontal info row: fade up + stagger, no
     card scale (the row is intentionally light/flat, not card-like).
     ======================================================================= */
  function initGetInTouchEntrance() {
    const section = document.querySelector('.get-in-touch-section');
    if (!section) return;
    const header = section.querySelector('.section-header');
    const items = Array.from(section.querySelectorAll('.get-in-touch-item'));

    if (prefersReducedMotion || !hasGSAP) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    gsap.set(items, { opacity: 0, y: 24, filter: 'blur(4px)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(items, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: EASE.expo, stagger: 0.08 }, header ? '-=0.45' : 0);
  }

  /* =======================================================================
     HOW CAN WE HELP? — form panel slides in from the start edge, the
     Connect With Us panel from the end edge (logical, so it mirrors
     correctly in RTL), fields stagger in after.
     ======================================================================= */
  function initContactHelpEntrance() {
    const section = document.querySelector('.contact-help-section');
    if (!section) return;
    const header = section.querySelector('.section-header');
    const formPanel = section.querySelector('.contact-help-panel--form');
    const connectPanel = section.querySelector('.contact-help-panel--connect');
    const fields = Array.from(section.querySelectorAll('.form-group-custom, .contact-submit-btn'));
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const offset = isRTL ? -60 : 60;

    if (prefersReducedMotion || !hasGSAP) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    if (formPanel) gsap.set(formPanel, { opacity: 0, x: -offset });
    if (connectPanel) gsap.set(connectPanel, { opacity: 0, x: offset });
    gsap.set(fields, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    if (formPanel) tl.to(formPanel, { opacity: 1, x: 0, duration: 1.1, ease: EASE.expo }, header ? '-=0.5' : 0);
    if (connectPanel) tl.to(connectPanel, { opacity: 1, x: 0, duration: 1.1, ease: EASE.expo }, formPanel ? '-=0.9' : 0);
    tl.to(fields, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out3, stagger: 0.07 }, '-=0.5');
  }

  /* =======================================================================
     MAP SECTION — zoom reveal for the frame, slide-in for the details card.
     ======================================================================= */
  function initMapEntrance() {
    const section = document.querySelector('.contact-map-section');
    if (!section) return;
    const header = section.querySelector('.section-header');
    const details = section.querySelector('.contact-map-details');
    const frame = section.querySelector('.contact-map-frame');
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const offset = isRTL ? -50 : 50;

    if (prefersReducedMotion || !hasGSAP) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    if (frame) gsap.set(frame, { opacity: 0, scale: 0.92, filter: 'blur(6px)' });
    if (details) gsap.set(details, { opacity: 0, x: offset });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    if (frame) tl.to(frame, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: EASE.expo }, '-=0.5');
    if (details) tl.to(details, { opacity: 1, x: 0, duration: 1.1, ease: EASE.expo }, '-=0.85');
  }

  /* =======================================================================
     CONNECT WITH US — small stagger-in for the social icon row, once the
     panel itself has settled (kept separate from initContactHelpEntrance
     since it targets a different trigger so it always fires, even if a
     browser can't feature-detect scroll direction reliably).
     ======================================================================= */
  function initSocialStagger() {
    const items = document.querySelectorAll('.connect-social__item');
    if (!items.length || prefersReducedMotion || !hasGSAP) return;
    gsap.set(items, { opacity: 0, y: 14 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: EASE.out3,
      stagger: 0.06,
      scrollTrigger: { trigger: '.contact-help-panel--connect', start: 'top 80%', once: true },
    });
  }

  /* =======================================================================
     VERY SUBTLE CARD TILT — lighter-weight version of initCardTilt() in
     main.js (which is scoped only to .feature-card); reused here for the
     Connect With Us panel with a gentler max angle.
     ======================================================================= */
  function initCardTiltLite(selector) {
    if (prefersReducedMotion || !hasGSAP) return;
    const cards = document.querySelectorAll(selector);

    cards.forEach((card) => {
      gsap.set(card, { transformPerspective: 800, transformOrigin: 'center' });
      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const yTo = gsap.quickTo(card, 'y', { duration: 0.9, ease: EASE.out3 });

      card.addEventListener('mouseenter', () => yTo(-6));
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotateYTo(px * 5);
        rotateXTo(-py * 5);
      });
      card.addEventListener('mouseleave', () => {
        rotateXTo(0);
        rotateYTo(0);
        yTo(0);
      });
    });
  }

  /* =======================================================================
     COPY EMAIL TO CLIPBOARD
     ======================================================================= */
  function initCopyEmail() {
    document.querySelectorAll('[data-copy-email]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const email = el.getAttribute('data-copy-email');
        if (!email || !navigator.clipboard) return;
        e.preventDefault();
        navigator.clipboard.writeText(email).then(() => {
          const hint = el.querySelector('[data-copy-hint]');
          if (!hint) return;
          const original = hint.textContent;
          hint.textContent = 'Copied to clipboard!';
          setTimeout(() => { hint.textContent = original; }, 2000);
        });
      });
    });
  }

  /* =======================================================================
     CLICK-TO-CALL / CLICK-ADDRESS-TO-MAP are handled natively via
     tel:/mailto:/maps href attributes in the markup — nothing to wire
     here beyond making sure they don't fight the tilt handlers above,
     which they don't (tilt only reads pointer position).
     ======================================================================= */
  function initClickToCallAndMap() {
    // Intentionally minimal: native anchor behavior already covers it.
  }

  /* =======================================================================
     SMOOTH SCROLL FROM CTA BUTTONS TO THE FORM
     ======================================================================= */
  function initScrollToForm() {
    document.querySelectorAll('[data-scroll-to-form]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById('contactForm');
        if (!target) return;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        const firstField = target.querySelector('input, textarea');
        if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 600);
      });
    });
  }

  /* =======================================================================
     CONTACT FORM — validation, animated loading state, animated success
     state. This is a front-end simulation only (no backend endpoint
     exists in this project), matching the same honesty as the rest of
     the site's placeholder CTAs.
     ======================================================================= */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitBtn = form.querySelector('.contact-submit-btn');
    const successPanel = document.getElementById('contactSuccess');
    const fieldsWrap = document.getElementById('contactFormFields');

    const rules = {
      fullName: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      phone: (v) => v.trim() === '' || /^[+\d][\d\s().-]{6,}$/.test(v.trim()),
      subject: (v) => v.trim().length >= 2,
      message: (v) => v.trim().length >= 10,
    };

    function validateField(name) {
      const field = form.elements[name];
      if (!field) return true;
      const group = field.closest('.form-group-custom');
      const ok = rules[name](field.value);
      if (group) group.classList.toggle('has-error', !ok);
      return ok;
    }

    ['fullName', 'email', 'phone', 'subject', 'message'].forEach((name) => {
      const field = form.elements[name];
      if (field) field.addEventListener('blur', () => validateField(name));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const names = ['fullName', 'email', 'phone', 'subject', 'message'];
      const allValid = names.map(validateField).every(Boolean);
      if (!allValid) {
        const firstInvalid = form.querySelector('.has-error .form-input-custom');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!submitBtn) return;
      submitBtn.classList.add('is-loading');

      // Simulated network round-trip — swap for a real endpoint when one exists.
      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success');

        setTimeout(() => {
          if (fieldsWrap) fieldsWrap.style.display = 'none';
          if (successPanel) {
            successPanel.classList.add('is-visible');
            if (hasGSAP && !prefersReducedMotion) {
              gsap.from(successPanel.children, {
                opacity: 0,
                y: 20,
                duration: 0.7,
                ease: EASE.out3,
                stagger: 0.08,
              });
            }
          }
        }, 500);
      }, 1400);
    });
  }
})();
