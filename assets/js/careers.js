/* =========================================================================
   PITEX — careers.js
   Owns everything specific to the Careers page that main.js / page-banner.js
   don't already provide for free:
     - entrance choreography + 3D tilt wiring for the job-opportunity cards
       (new component; the hero, Why Join cards, Hiring Process timeline,
       application-form panel entrance and FAQ section entrance are already
       animated because they reuse .page-banner / .applications-section /
       .process-section / .contact-section / .faq-section verbatim)
     - "Apply Now" on a job card → smooth-scrolls to the form and
       pre-selects that job in the Position dropdown
     - the FAQ accordion open/close interaction (initFaqAccordion is
       private to about.js, so the same small function is re-declared here
       rather than exporting internals across pages)
     - the application form's client-side validation, loading state, and
       opening the post-submit success modal
     - the success modal's open/close behavior and its "Send CV via
       WhatsApp" deep link, built from the submitted name + position

   Buttons already get magnetic pull + ripple + press-bounce for free from
   initMagnetic()/initButtonPremium() in main.js (class-selector based), and
   job cards get 3D tilt for free from initCardTilt() via the shared
   `.feature-card` class — none of that is duplicated here.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  // Replace with the real PITEX HR WhatsApp number (international format,
  // digits only, no leading +).
  const WHATSAPP_NUMBER = '393511234567';

  document.addEventListener('DOMContentLoaded', () => {
    initJobsEntrance();
    initApplyNowButtons();
    initFaqAccordion(Array.from(document.querySelectorAll('.faq-section .faq-item')));
    initApplicationForm();
    initModal();
    initScrollToForm();
  });

  /* =======================================================================
     JOB CARDS — fade up + stagger on scroll, same choreography language
     as the Machinery/Application card grids elsewhere on the site. Tilt/
     lift/border-glow/sweep already come free from initCardTilt() + the
     shared .feature-card CSS, so this only owns the entrance.
     ======================================================================= */
  function initJobsEntrance() {
    const section = document.querySelector('.jobs-section');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const cards = Array.from(section.querySelectorAll('.job-card'));
    const note = section.querySelector('.jobs-note');

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 46, scale: 0.94, filter: 'blur(8px)' });
    if (note) gsap.set(note, { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });
        if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
        tl.to(
          cards,
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE.expo, stagger: 0.12 },
          '-=0.55'
        );
        if (note) tl.to(note, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3');
      },
    });
  }

  /* =======================================================================
     APPLY NOW — scrolls to the application form and pre-selects the
     matching option in the Position dropdown, same smooth-scroll recipe
     as initScrollToForm() below (kept separate since this one also needs
     to set a form value first).
     ======================================================================= */
  function initApplyNowButtons() {
    const buttons = document.querySelectorAll('[data-apply-job]');
    const positionField = document.getElementById('appPosition');
    const target = document.getElementById('apply');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const job = btn.getAttribute('data-apply-job');
        if (positionField && job) {
          const optionExists = Array.from(positionField.options).some((o) => o.value === job);
          if (optionExists) positionField.value = job;
        }
        if (!target) return;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        const firstField = document.getElementById('appFullName');
        if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 600);
      });
    });
  }

  function initScrollToForm() {
    document.querySelectorAll('[data-scroll-to-form]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById('apply');
        if (!target) return;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        const firstField = document.getElementById('appFullName');
        if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 600);
      });
    });
  }

  /* =======================================================================
     FAQ ACCORDION — same interaction as about.js's initFaqAccordion:
     single-open accordion, GSAP height/opacity tween with an instant
     fallback, Arrow/Home/End keyboard navigation between questions.
     ======================================================================= */
  function initFaqAccordion(items) {
    if (!items.length) return;

    const buttons = items.map((item) => item.querySelector('.faq-item__question'));
    let openItem = null;

    items.forEach((item) => {
      const button = item.querySelector('.faq-item__question');
      if (!button) return;

      button.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        if (openItem && openItem !== item) closeFaqItem(openItem);
        if (wasOpen) {
          closeFaqItem(item);
          openItem = null;
        } else {
          openFaqItem(item);
          openItem = item;
        }
      });

      button.addEventListener('keydown', (e) => {
        const i = buttons.indexOf(button);
        let target = null;
        if (e.key === 'ArrowDown') target = buttons[(i + 1) % buttons.length];
        else if (e.key === 'ArrowUp') target = buttons[(i - 1 + buttons.length) % buttons.length];
        else if (e.key === 'Home') target = buttons[0];
        else if (e.key === 'End') target = buttons[buttons.length - 1];
        if (target) {
          e.preventDefault();
          target.focus();
        }
      });
    });

    function openFaqItem(item) {
      const button = item.querySelector('.faq-item__question');
      const panel = item.querySelector('.faq-item__panel');
      const inner = item.querySelector('.faq-item__panel-inner');
      const accent = item.querySelector('.faq-item__accent');

      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');

      if (prefersReducedMotion || !hasGSAP) {
        panel.style.height = 'auto';
        inner.style.opacity = '1';
        inner.style.transform = 'none';
        if (accent) { accent.style.opacity = '1'; accent.style.transform = 'scaleY(1)'; }
        return;
      }

      gsap.killTweensOf([panel, inner, accent, item]);
      gsap.set(inner, { opacity: 0, y: 14 });
      if (accent) gsap.set(accent, { transformOrigin: 'top' });

      const targetHeight = inner.scrollHeight;
      const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });
      tl.to(panel, { height: targetHeight, duration: 0.6, ease: 'power3.inOut' }, 0)
        .to(item, { y: -4, duration: 0.5 }, 0)
        .to(inner, { opacity: 1, y: 0, duration: 0.5 }, 0.15)
        .set(panel, { height: 'auto' });
      if (accent) tl.to(accent, { scaleY: 1, opacity: 1, duration: 0.6 }, 0);
    }

    function closeFaqItem(item) {
      const button = item.querySelector('.faq-item__question');
      const panel = item.querySelector('.faq-item__panel');
      const inner = item.querySelector('.faq-item__panel-inner');
      const accent = item.querySelector('.faq-item__accent');

      button.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');

      if (prefersReducedMotion || !hasGSAP) {
        item.classList.remove('is-open');
        panel.style.height = '0px';
        inner.style.opacity = '0';
        if (accent) { accent.style.opacity = '0'; accent.style.transform = 'scaleY(0)'; }
        return;
      }

      gsap.killTweensOf([panel, inner, accent, item]);
      gsap.set(panel, { height: inner.scrollHeight });

      const tl = gsap.timeline({
        defaults: { ease: EASE.out3 },
        onComplete: () => item.classList.remove('is-open'),
      });
      tl.to(inner, { opacity: 0, y: 10, duration: 0.35 }, 0)
        .to(panel, { height: 0, duration: 0.5, ease: 'power3.inOut' }, 0.05)
        .to(item, { y: 0, duration: 0.4 }, 0);
      if (accent) tl.to(accent, { scaleY: 0, opacity: 0, duration: 0.45 }, 0);
    }
  }

  /* =======================================================================
     APPLICATION FORM — validation, animated loading state, then opens the
     success modal (front-end simulation only, no backend endpoint exists
     in this project — same honesty as contact.js).
     ======================================================================= */
  function initApplicationForm() {
    const form = document.getElementById('applicationForm');
    if (!form) return;

    const submitBtn = form.querySelector('.contact-submit-btn');

    const rules = {
      fullName: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      phone: (v) => /^[+\d][\d\s().-]{6,}$/.test(v.trim()),
      country: (v) => v.trim().length >= 2,
      position: (v) => v.trim() !== '',
      experience: (v) => v.trim() !== '',
      message: (v) => v.trim().length >= 10,
      agree: (el) => el.checked,
    };

    function validateField(name) {
      const field = form.elements[name];
      if (!field) return true;
      const group = field.closest('.form-group-custom') || field.closest('.form-checkbox-row');
      const ok = name === 'agree' ? rules.agree(field) : rules[name](field.value);
      if (group) group.classList.toggle('has-error', !ok);
      return ok;
    }

    ['fullName', 'email', 'phone', 'country', 'position', 'experience', 'message'].forEach((name) => {
      const field = form.elements[name];
      if (field) field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'blur', () => validateField(name));
    });
    if (form.elements.agree) {
      form.elements.agree.addEventListener('change', () => validateField('agree'));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const names = ['fullName', 'email', 'phone', 'country', 'position', 'experience', 'message', 'agree'];
      const allValid = names.map(validateField).every(Boolean);
      if (!allValid) {
        const firstInvalid = form.querySelector(
          '.has-error .form-input-custom, .has-error input[type="checkbox"]'
        );
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
          openApplicationModal({
            name: form.elements.fullName.value.trim(),
            position: form.elements.position.value.trim(),
          });
          submitBtn.classList.remove('is-success');
          form.reset();
        }, 500);
      }, 1400);
    });
  }

  /* =======================================================================
     SUCCESS MODAL + WHATSAPP HANDOFF
     ======================================================================= */
  function initModal() {
    const modal = document.getElementById('applicationModal');
    if (!modal) return;

    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', () => closeApplicationModal());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeApplicationModal();
    });
  }

  function openApplicationModal({ name, position }) {
    const modal = document.getElementById('applicationModal');
    const whatsappBtn = document.getElementById('sendWhatsappBtn');
    if (!modal) return;

    if (whatsappBtn) {
      const message =
        `Hello PITEX HR,\n\nMy name is ${name}.\nI have just submitted my application for the position of ${position}.\nPlease find my CV attached.\n\nThank you.`;
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      whatsappBtn.onclick = () => window.open(waUrl, '_blank', 'noopener');
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (!prefersReducedMotion && hasGSAP) {
      const panel = modal.querySelector('.app-modal__panel');
      const icon = modal.querySelector('.app-modal__icon');
      gsap.fromTo(panel, { opacity: 0, scale: 0.92, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: EASE.out4 });
      if (icon) {
        gsap.fromTo(
          icon,
          { scale: 0, rotate: -30 },
          { scale: 1, rotate: 0, duration: 0.7, delay: 0.15, ease: 'back.out(1.8)' }
        );
      }
    }
  }

  function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
})();
