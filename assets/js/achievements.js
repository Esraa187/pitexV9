/* =========================================================================
   PITEX — achievements.js
   Owns the "Proven Excellence" company-statistics section: entrance
   choreography (badge → title → description → cards) and the cards'
   idle icon float + hover lift/rotate. Counting itself is NOT duplicated
   here — every `[data-count-to]` element, including this section's, is
   already picked up by the shared initCounters() in main.js. Border glow,
   icon background pulse, the diagonal sweep, and the accent-line expand
   are pure CSS hover affordances (see achievements.css) — this file only
   owns the transforms GSAP is responsible for project-wide.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    const section = document.querySelector('.achievements-section');
    if (!section) return;

    initEntrance(section);
    initIconFloat(section);
    initCardHover(section);
  });

  /* =======================================================================
     ENTRANCE — badge, title, description each fade up in sequence, then
     cards stagger in with opacity/y/scale/blur/rotation, matching the
     "fade + blur + very subtle rotation" language used for the Production
     Lines preview cards and the Machinery solution cards.
     ======================================================================= */
  function initEntrance(section) {
    const badge = section.querySelector('.section-badge');
    const title = section.querySelector('.section-title');
    const desc = section.querySelector('.section-subtitle');
    const cards = Array.from(section.querySelectorAll('.achievement-card'));

    if (prefersReducedMotion || !hasGSAP) return;

    gsap.set([badge, title, desc].filter(Boolean), { opacity: 0, y: 28 });
    gsap.set(cards, { opacity: 0, y: 54, scale: 0.92, rotate: -1.5, filter: 'blur(10px)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      defaults: { ease: EASE.out3, duration: 0.9 },
    });

    if (badge) tl.to(badge, { opacity: 1, y: 0 }, 0);
    if (title) tl.to(title, { opacity: 1, y: 0, duration: 1 }, 0.15);
    if (desc) tl.to(desc, { opacity: 1, y: 0 }, 0.32);

    tl.to(
      cards,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        filter: 'blur(0px)',
        duration: 1.1,
        ease: EASE.expo,
        stagger: 0.14,
      },
      0.5
    );
  }

  /* =======================================================================
     ICON IDLE FLOAT — very subtle continuous breathing motion, same
     recipe as the header logo's startLogoFloat() in header.js.
     ======================================================================= */
  function initIconFloat(section) {
    if (prefersReducedMotion || !hasGSAP) return;

    section.querySelectorAll('.achievement-icon').forEach((icon, i) => {
      gsap.to(icon, {
        y: '+=5',
        scale: 1.04,
        duration: 2.6 + i * 0.15,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.4 * i,
      });
    });
  }

  /* =======================================================================
     CARD HOVER — lift + icon rotate (GSAP-owned transforms). Everything
     else on hover (glow, background brighten, sweep, accent width) is
     pure CSS in achievements.css.
     ======================================================================= */
  function initCardHover(section) {
    if (prefersReducedMotion || !hasGSAP) return;

    section.querySelectorAll('.achievement-card').forEach((card) => {
      const icon = card.querySelector('.achievement-icon');
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.8, ease: EASE.out3 });
      const iconRotateTo = icon ? gsap.quickTo(icon, 'rotation', { duration: 0.8, ease: EASE.out3 }) : null;

      card.addEventListener('mouseenter', () => {
        liftTo(-10);
        if (iconRotateTo) iconRotateTo(8);
      });
      card.addEventListener('mouseleave', () => {
        liftTo(0);
        if (iconRotateTo) iconRotateTo(0);
      });
    });
  }
})();
