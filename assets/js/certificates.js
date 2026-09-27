/* =========================================================================
   PITEX — certificates.js
   Owns the Certificates page only: hero entrance (split-text title,
   badge/breadcrumb/subtitle fade, floating decorative shapes), the
   certificate gallery (stagger reveal + tilt/zoom/shine hover — same
   recipe as initInsightsSection in main.js), and the fullscreen
   certificate modal (open/close, focus trap, ESC/backdrop dismiss,
   body-scroll lock). Ambient particles on both sections are handled for
   free by main.js's initAmbientParticleSections() via the `.ambient-particles`
   class already used sitewide — not duplicated here. The Trust section
   (achievements.js) and the closing CTA (initFinalCTA in main.js) are
   reused verbatim and need no page-specific code at all.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out', back: 'back.out(1.7)' };

  document.addEventListener('DOMContentLoaded', () => {
    // FIX: previously this whole block was gated on `.certificates-hero`
    // existing, which caused initGallery()/initCertModal() to never run
    // on this page (the hero markup here uses the shared `.page-banner`
    // component, not `.certificates-hero`). Each init function now
    // guards itself internally, so the gallery/modal always initialize
    // regardless of which hero markup is present on the page.
    initHeroEntrance();
    initHeroShapesFloat();
    initGallery();
    initCertModal();
  });

  /* =======================================================================
     SPLIT TITLE — identical markup/classes to main.js's splitWords() (see
     about.js for the same convention) so the .split-mask/.split-word
     pre-states in animations.css apply for free, while preserving the
     inline <span class="text-primary-custom"> highlight run intact.
     ======================================================================= */
  function splitTitle(el) {
    const frag = document.createDocumentFragment();

    Array.from(el.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const words = child.textContent.trim().split(/\s+/).filter(Boolean);
        words.forEach((w, i) => {
          frag.appendChild(wrapWord(w));
          if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
        });
        frag.appendChild(document.createTextNode(' '));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const span = document.createElement(child.nodeName.toLowerCase());
        span.className = child.className;
        const words = child.textContent.trim().split(/\s+/).filter(Boolean);
        words.forEach((w, i) => {
          span.appendChild(wrapWord(w));
          if (i < words.length - 1) span.appendChild(document.createTextNode(' '));
        });
        frag.appendChild(span);
        frag.appendChild(document.createTextNode(' '));
      }
    });

    el.innerHTML = '';
    el.appendChild(frag);
    el.classList.remove('gsap-fade-up');
    el.style.opacity = '1';
    el.style.transform = 'none';
    return Array.from(el.querySelectorAll('.split-word'));

    function wrapWord(word) {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      const inner = document.createElement('span');
      inner.className = 'split-word';
      inner.textContent = word;
      mask.appendChild(inner);
      return mask;
    }
  }

  /* =======================================================================
     HERO ENTRANCE
     Guards itself: if this page's hero doesn't use `.certificates-hero`
     markup (e.g. it uses the shared `.page-banner` component instead),
     this simply does nothing — it no longer blocks gallery/modal init.
     ======================================================================= */
  function initHeroEntrance() {
    const hero = document.querySelector('.certificates-hero');
    if (!hero) return;

    const title = hero.querySelector('[data-split-title]');
    const others = Array.from(hero.querySelectorAll('.gsap-fade-up'));

    if (prefersReducedMotion) return;

    if (!hasGSAP) {
      others.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    const words = title ? splitTitle(title) : [];

    gsap.set(others, { opacity: 0, y: 30 });
    if (words.length) gsap.set(words, { y: '115%', rotate: 6, opacity: 0, filter: 'blur(10px)' });

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 }, delay: 0.15 });

    others.forEach((el, i) => {
      if (el === title) return;
      tl.to(el, { opacity: 1, y: 0, duration: 0.9 }, i * 0.12);
    });

    if (words.length) {
      tl.to(
        words,
        { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 },
        0.2
      );
    }
  }

  /* =======================================================================
     HERO DECORATIVE SHAPES — slow, continuous idle float, same "sine.inOut
     yoyo repeat -1" recipe used for achievement icons / logo float.
     Guards itself: no-op if there are no `.certificates-hero-shape`
     elements on the page.
     ======================================================================= */
  function initHeroShapesFloat() {
    if (prefersReducedMotion || !hasGSAP) return;

    const shapes = document.querySelectorAll('.certificates-hero-shape');
    if (!shapes.length) return;

    shapes.forEach((shape, i) => {
      gsap.to(shape, {
        y: '+=18',
        rotate: '+=6',
        duration: 5 + i * 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.3 * i,
      });
    });
  }

  /* =======================================================================
     GALLERY — stagger reveal on scroll, then per-card 3D tilt + image
     zoom + shine on hover (same recipe as initInsightsSection in main.js).
     ======================================================================= */
  function initGallery() {
    const section = document.querySelector('.certificates-gallery-section');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const cards = Array.from(section.querySelectorAll('.certificate-card'));

    if (prefersReducedMotion) return;

    if (!hasGSAP) {
      if (header) { header.style.opacity = '1'; header.style.transform = 'none'; }
      cards.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    if (header) gsap.set(header, { opacity: 0, y: 32 });
    gsap.set(cards, { opacity: 0, y: 50, scale: 0.95, filter: 'blur(8px)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(
      cards,
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE.expo, stagger: 0.1 },
      header ? '-=0.55' : 0
    );

    cards.forEach((card) => {
      const img = card.querySelector('.certificate-media img');
      if (!img) return;

      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.9, ease: EASE.out3 });
      const imgScaleTo = gsap.quickTo(img, 'scale', { duration: 1.1, ease: EASE.out3 });

      card.addEventListener('mouseenter', () => {
        liftTo(-10);
        imgScaleTo(1.08);
      });
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
        liftTo(0);
        imgScaleTo(1);
      });
    });
  }

  /* =======================================================================
     CERTIFICATE MODAL — fullscreen premium popup. Reads its content
     straight from each trigger card's data-* attributes, so the gallery
     stays the single source of truth (no duplicated content object).
     ======================================================================= */
  function initCertModal() {
    const modal = document.querySelector('.cert-modal');
    if (!modal) return;

    const backdrop = modal.querySelector('.cert-modal-backdrop');
    const panel = modal.querySelector('.cert-modal-panel');
    const closeBtn = modal.querySelector('.cert-modal-close');
    const img = modal.querySelector('.cert-modal-media img');
    // const eyebrow = modal.querySelector('.cert-modal-eyebrow');
    // const title = modal.querySelector('.cert-modal-title');
    // const desc = modal.querySelector('.cert-modal-desc');
    // const orgValue = modal.querySelector('[data-modal-org]');
    // const yearValue = modal.querySelector('[data-modal-year]');

    let lastFocused = null;
    let isOpen = false;

    document.querySelectorAll('.certificate-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key === 'Tab') trapFocus(e);
    });

    function openModal(card) {
      lastFocused = document.activeElement;

      img.src = card.dataset.image || '';
      img.alt = card.dataset.title ? `${card.dataset.title} certificate` : '';
      // eyebrow.textContent = card.dataset.category || 'Certification';
      // title.textContent = card.dataset.title || '';
      // desc.textContent = card.dataset.description || '';
      // orgValue.textContent = card.dataset.org || '';
      // yearValue.textContent = card.dataset.year || '';

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cert-modal-open');
      isOpen = true;

      if (prefersReducedMotion || !hasGSAP) {
        if (hasGSAP) gsap.set([backdrop, panel], { opacity: 1, scale: 1 });
      } else {
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(panel, { opacity: 0, scale: 0.92, y: 12 });
        gsap.to(backdrop, { opacity: 1, duration: 0.5, ease: 'sine.out' });
        gsap.to(panel, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' });
      }

      requestAnimationFrame(() => closeBtn.focus());
    }

    function closeModal() {
      if (!isOpen) return;
      isOpen = false;

      const finish = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cert-modal-open');
        img.src = '';
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      };

      if (prefersReducedMotion || !hasGSAP) {
        finish();
        return;
      }

      gsap.to(backdrop, { opacity: 0, duration: 0.35, ease: 'sine.in' });
      gsap.to(panel, { opacity: 0, scale: 0.94, y: 8, duration: 0.35, ease: 'sine.in', onComplete: finish });
    }

    function trapFocus(e) {
      const focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
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
  }
})();
