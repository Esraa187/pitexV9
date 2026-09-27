/* =========================================================================
   PITEX — gallery.js
   Owns the Gallery page only: hero entrance (split-text title, badge/
   breadcrumb/subtitle fade, floating decorative shapes — identical recipe
   to certificates.js), the intro fade-up, the masonry gallery (stagger
   reveal + zoom/rotate/glow hover, same family as initInsightsSection /
   initGallery in main.js / certificates.js), and the fullscreen lightbox
   (open/close, prev/next, keyboard + swipe navigation, focus trap,
   image counter, body-scroll lock). Ambient particles on the hero are
   handled for free by main.js's initAmbientParticleSections() via the
   `.ambient-particles` class already used sitewide — not duplicated
   here. The closing CTA (final-cta-section) is reused verbatim and
   needs no page-specific code at all.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out', back: 'back.out(1.7)' };

  document.addEventListener('DOMContentLoaded', () => {
    initHeroShapesFloat();
    initIntroReveal();
    initMasonry();
    initLightbox();
  });

  /* =======================================================================
     SPLIT TITLE — identical markup/classes to certificates.js's
     splitTitle() so the .split-mask/.split-word pre-states in
     animations.css apply for free.
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
     HERO DECORATIVE SHAPES — slow, continuous idle float, same recipe
     used sitewide for achievement icons / certificate hero shapes.
     ======================================================================= */
  function initHeroShapesFloat() {
    if (prefersReducedMotion || !hasGSAP) return;

    document.querySelectorAll('.gallery-hero-shape').forEach((shape, i) => {
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
     INTRO — simple centered fade-up reveal on scroll.
     ======================================================================= */
  function initIntroReveal() {
    const section = document.querySelector('.gallery-intro-section');
    if (!section) return;

    const els = Array.from(section.querySelectorAll('.gsap-fade-up'));
    if (!els.length) return;

    if (prefersReducedMotion || !hasGSAP) {
      els.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    gsap.set(els, { opacity: 0, y: 28 });
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: EASE.out3,
      stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });
  }

  /* =======================================================================
     MASONRY GALLERY — fade-up + slight scale, staggered with a small
     random delay per card, then per-card zoom/rotate/lift on hover.
     ======================================================================= */
  function initMasonry() {
    const section = document.querySelector('.gallery-section');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const cards = Array.from(section.querySelectorAll('.gallery-card'));

    if (!hasGSAP || prefersReducedMotion) {
      if (header) { header.style.opacity = '1'; header.style.transform = 'none'; }
      cards.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    } else {
      if (header) gsap.set(header, { opacity: 0, y: 32 });
      gsap.set(cards, { opacity: 0, y: 46, scale: 0.94 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 78%', once: true },
        defaults: { ease: EASE.out3 },
      });

      if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
      cards.forEach((card, i) => {
        // Small randomized offset layered on top of the base stagger so
        // the reveal reads as organic rather than metronomic.
        const jitter = Math.random() * 0.12;
        tl.to(
          card,
          { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EASE.expo },
          (header ? 0.35 : 0) + i * 0.07 + jitter
        );
      });

      // Hover zoom is pure CSS now (gallery.css) — clean, consistent
      // 300ms transform with no per-card GSAP wiring needed.
    }

    cards.forEach((card, i) => {
      card.addEventListener('click', () => openLightbox(i));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });
  }

  /* =======================================================================
     LIGHTBOX — fullscreen popup extending the certificate-modal recipe
     with prev/next, an image counter and swipe support. Reads its
     content straight from each card's data-* attributes, so the gallery
     stays the single source of truth (no duplicated content array).
     ======================================================================= */
  let cardsCache = null;
  let currentIndex = 0;
  let isOpen = false;
  let lastFocused = null;

  function getCards() {
    if (!cardsCache) cardsCache = Array.from(document.querySelectorAll('.gallery-card'));
    return cardsCache;
  }

  function openLightbox(index) {
    const modal = document.querySelector('.gallery-lightbox');
    if (!modal) return;
    lastFocused = document.activeElement;
    currentIndex = index;
    isOpen = true;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-lightbox-open');

    renderSlide(true);

    const backdrop = modal.querySelector('.gallery-lightbox-backdrop');
    const stage = modal.querySelector('.gallery-lightbox-stage');

    if (prefersReducedMotion || !hasGSAP) {
      if (backdrop) backdrop.style.opacity = '1';
      if (stage) { stage.style.opacity = '1'; stage.style.transform = 'none'; }
    } else {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(stage, { opacity: 0, scale: 0.94 });
      gsap.to(backdrop, { opacity: 1, duration: 0.45, ease: 'sine.out' });
      gsap.to(stage, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' });
    }

    requestAnimationFrame(() => {
      const closeBtn = modal.querySelector('.gallery-lightbox-close');
      if (closeBtn) closeBtn.focus();
    });
  }

  function closeLightbox() {
    const modal = document.querySelector('.gallery-lightbox');
    if (!modal || !isOpen) return;
    isOpen = false;

    const backdrop = modal.querySelector('.gallery-lightbox-backdrop');
    const stage = modal.querySelector('.gallery-lightbox-stage');

    const finish = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('gallery-lightbox-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    if (prefersReducedMotion || !hasGSAP) {
      finish();
      return;
    }

    gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: 'sine.in' });
    gsap.to(stage, { opacity: 0, scale: 0.96, duration: 0.3, ease: 'sine.in', onComplete: finish });
  }

  function goTo(step) {
    const cards = getCards();
    if (!cards.length) return;
    currentIndex = (currentIndex + step + cards.length) % cards.length;
    renderSlide(false);
  }

  function renderSlide(isFirstOpen) {
    const modal = document.querySelector('.gallery-lightbox');
    const cards = getCards();
    const card = cards[currentIndex];
    if (!modal || !card) return;

    const img = modal.querySelector('.gallery-lightbox-frame img');

    const apply = () => {
      img.src = card.dataset.image || '';
      img.alt = card.dataset.title ? `${card.dataset.title} — PITEX gallery` : 'PITEX gallery image';

      if (prefersReducedMotion || !hasGSAP) {
        img.classList.add('is-visible');
      } else {
        requestAnimationFrame(() => img.classList.add('is-visible'));
      }
    };

    if (isFirstOpen || prefersReducedMotion || !hasGSAP) {
      apply();
      return;
    }

    img.classList.remove('is-visible');
    window.setTimeout(apply, 160);
  }

  function initLightbox() {
    const modal = document.querySelector('.gallery-lightbox');
    if (!modal) return;

    const backdrop = modal.querySelector('.gallery-lightbox-backdrop');
    const closeBtn = modal.querySelector('.gallery-lightbox-close');
    const prevBtn = modal.querySelector('.gallery-lightbox-nav--prev');
    const nextBtn = modal.querySelector('.gallery-lightbox-nav--next');
    const stage = modal.querySelector('.gallery-lightbox-stage');

    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(1));

    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { goTo(-1); return; }
      if (e.key === 'ArrowRight') { goTo(1); return; }
      if (e.key === 'Tab') trapFocus(e);
    });

    // Swipe support (mobile) — horizontal drag on the stage advances slides.
    let touchStartX = null;
    if (stage) {
      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });

      stage.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 40) return;
        goTo(dx > 0 ? -1 : 1);
      }, { passive: true });
    }

    function trapFocus(e) {
      const focusable = modal.querySelectorAll(
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
