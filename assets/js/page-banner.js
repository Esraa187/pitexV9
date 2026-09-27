/* =========================================================================
   PITEX — page-banner.js
   Owns the compact internal-page banner only (.page-banner). Generic and
   page-agnostic — targets classes, not IDs or page-specific content, so
   this one file can be included on every internal page (About, Leadership,
   Certificates, Success Partners, Gallery, Services, Contact, ...) with no
   changes. Safe to include anywhere: no-ops immediately if .page-banner
   isn't on the page.

   Particles are NOT handled here — the banner opts into the site-wide
   .ambient-particles system (style.css + initAmbientParticleSections in
   main.js), the same one every other section already uses, so there's
   nothing particle-related to duplicate in this file.

   Same GSAP/easing language and hasGSAP/prefersReducedMotion gating as
   main.js/about.js — no duplicated animation utilities, just orchestration.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out' };

  document.addEventListener('DOMContentLoaded', () => {
    const banner = document.querySelector('.page-banner');
    if (!banner) return;

    initPageBannerEntrance(banner);
    initPageBannerParallax(banner);
  });

  /* =======================================================================
     ENTRANCE — banner fades in as a whole; the breadcrumb chip drops in
     from just above its resting spot; the title fades up with a soft
     blur-to-sharp resolve, landing last so it reads as the payoff.
     ======================================================================= */
  function initPageBannerEntrance(banner) {
    const crumb = banner.querySelector('.page-banner__crumb');
    const title = banner.querySelector('.page-banner__title');
    const subtitle = banner.querySelector('.page-banner__subtitle');

    if (prefersReducedMotion || !hasGSAP) return;

    gsap.set(banner, { opacity: 0, y: 14 });
    if (crumb) gsap.set(crumb, { opacity: 0, y: -14 });
    if (title) gsap.set(title, { opacity: 0, y: 26, filter: 'blur(6px)' });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

    tl.to(banner, { opacity: 1, y: 0, duration: 0.7 }, 0);
    if (crumb) tl.to(crumb, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
    if (title) {
      tl.to(title, { opacity: 1, y: 0, duration: 0.9, ease: EASE.out4 }, 0.22)
        .to(title, { filter: 'blur(0px)', duration: 0.7 }, 0.22);
    }
    if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.7 }, 0.4);
  }

  /* =======================================================================
     PARALLAX — very slow scroll-linked drift on the background image only;
     everything else stays still so the title never loses focus. Same
     quickTo/scrollTrigger idiom as initSectionParallax (main.js).
     ======================================================================= */
  function initPageBannerParallax(banner) {
    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) return;

    const bg = banner.querySelector('.page-banner__bg img');
    if (!bg) return;

    gsap.to(bg, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: banner, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
})();
