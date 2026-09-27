/* =========================================================================
   PITEX — success-partners.js
   Renders the Success Partners grid from window.PITEX_PARTNERS
   (assets/js/partners-data.js — load that script first) and owns the
   grid's scroll entrance on this page. Hover effects (lift, shadow) are
   plain CSS transitions on .partner-card (success-partners.css) — not
   duplicated here in JS.

   Same hasGSAP/prefersReducedMotion gating and EASE vocabulary as the
   rest of the project (main.js) — no duplicated animation utilities.
   Lenis smooth scroll, ambient particles, header/mobile-nav and the
   footer are already wired generically by main.js/header.js on every
   page and need no page-specific code here.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out' };

  document.addEventListener('DOMContentLoaded', () => {
    renderPartnerCards();
    initPartnerCardsAnimation();
  });

  /* =======================================================================
     RENDER — one <article class="partner-card"> per partner, containing
     ONLY an <img>. No name, no description, no icon markup — matches the
     "real logo -> clean card -> nothing else" spec.

     If a logo file hasn't been added to assets/images/partners/ yet, the
     card falls back to a neutral, clearly-labeled "logo not added yet"
     placeholder tile instead of a broken-image icon or a fabricated logo.
     ======================================================================= */
  function renderPartnerCards() {
    const grid = document.getElementById('partnersGrid');
    if (!grid || !Array.isArray(window.PITEX_PARTNERS)) return;

    grid.innerHTML = window.PITEX_PARTNERS.map((partner) => `
      <article class="card partner-card gsap-stagger-item">
        <img
          class="partner-card__logo"
          src="${partner.logo}"
          alt="${escapeAttr(partner.name)} logo"
          loading="lazy"
          onerror="this.closest('.partner-card').classList.add('partner-card--empty'); this.remove();"
        >
        <span class="partner-card__empty-note" aria-hidden="true">Logo not added yet</span>
      </article>
    `).join('');
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  /* =======================================================================
     PARTNERS GRID — fade-up, staggered entrance as the grid scrolls into
     view. Falls back to the plain CSS pre-state (fully visible) when
     motion is reduced or GSAP isn't available.
     ======================================================================= */
  function initPartnerCardsAnimation() {
    const grid = document.querySelector('.partners-grid');
    if (!grid) return;

    const header = document.querySelector('.partners-section .section-header');
    const cards = Array.from(grid.querySelectorAll('.partner-card'));
    if (!cards.length) return;

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) return;

    if (header) {
      gsap.set(header, { opacity: 0, y: 28 });
      ScrollTrigger.create({
        trigger: header,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(header, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out3 }),
      });
    }

    gsap.set(cards, { opacity: 0, y: 36 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: EASE.out3,
        stagger: 0.12,
      }),
    });
  }
})();
