/* =========================================================================
   PITEX — services.js
   Owns the Services page hero: load-in choreography (breadcrumb → badge →
   headline → paragraph → buttons → stats → image → floating cards) and the
   subtle mouse-parallax on the media frame + its two floating cards.
   Stat counters, button ripple/magnetic/lift, Lenis and ScrollTrigger are
   all already wired globally by main.js and need no re-initialization here
   — this file only owns what's new for this page. Safe on any page: every
   entry point checks its container exists before doing anything.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', back: 'back.out(1.7)', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    initHeroEntrance();
    initMediaParallax();
    initServicesGridEntrance();
    initServiceTiles();
  });

  /* =======================================================================
     HERO ENTRANCE — same "fade-blur-up, staggered" language used by
     production-lines.js's initHeroEntrance, extended with a scale-in for
     the media frame and a delayed pop for the two floating cards.
     ======================================================================= */
  function initHeroEntrance() {
    const hero = document.querySelector('.service-hero');
    if (!hero) return;

    const particles = document.getElementById('serviceHeroParticles');
    const staggerEls = hero.querySelectorAll('.gsap-fade-up');
    const frame = hero.querySelector('.service-hero__frame');
    const glow = hero.querySelector('.service-hero__glow');
    const kpiChip = hero.querySelector('.hero-kpi-chip');
    const infoCard = hero.querySelector('.hero-info-card');

    if (prefersReducedMotion || !hasGSAP) {
      if (particles) particles.style.opacity = '1';
      return;
    }

    gsap.set(staggerEls, { opacity: 0, y: 34 });
    if (particles) gsap.set(particles, { opacity: 0 });
    if (frame) gsap.set(frame, { opacity: 0, scale: 0.94, y: 24 });
    if (glow) gsap.set(glow, { opacity: 0 });
    if (kpiChip) gsap.set(kpiChip, { opacity: 0, y: -16, scale: 0.9 });
    if (infoCard) gsap.set(infoCard, { opacity: 0, y: 24, scale: 0.96 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 }, delay: 0.15 });

    if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
    tl.to(staggerEls, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.05);
    if (glow) tl.to(glow, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0.3);
    if (frame) tl.to(frame, { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: EASE.expo }, 0.35);
    if (kpiChip) tl.to(kpiChip, { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EASE.back }, 0.75);
    if (infoCard) tl.to(infoCard, { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EASE.back }, 0.85);
  }

  /* =======================================================================
     MEDIA PARALLAX — very subtle pointer-tracked depth across the image,
     the KPI chip and the info card, plus a soft continuous image drift.
     Same quickTo recipe as main.js's initSectionParallax pointer-parallax
     and initMagnetic's magnetize(), scoped locally so it never touches
     any element outside this hero. Transform-only (GPU-friendly).
     ======================================================================= */
  function initMediaParallax() {
    const media = document.querySelector('.service-hero__media');
    if (!media || prefersReducedMotion || !hasGSAP) return;

    const frame = media.querySelector('.service-hero__frame');
    const img = media.querySelector('.service-hero__frame img');
    const kpiChip = media.querySelector('.hero-kpi-chip');
    const infoCard = media.querySelector('.hero-info-card');

    const frameTo = frame
      ? { x: gsap.quickTo(frame, 'x', { duration: 1.1, ease: EASE.out3 }), y: gsap.quickTo(frame, 'y', { duration: 1.1, ease: EASE.out3 }) }
      : null;
    const imgTo = img ? gsap.quickTo(img, 'scale', { duration: 1, ease: EASE.out3 }) : null;
    const kpiTo = kpiChip
      ? { x: gsap.quickTo(kpiChip, 'x', { duration: 0.8, ease: EASE.out3 }), y: gsap.quickTo(kpiChip, 'y', { duration: 0.8, ease: EASE.out3 }) }
      : null;
    const cardTo = infoCard
      ? { x: gsap.quickTo(infoCard, 'x', { duration: 0.9, ease: EASE.out3 }), y: gsap.quickTo(infoCard, 'y', { duration: 0.9, ease: EASE.out3 }) }
      : null;

    media.addEventListener('mouseenter', () => {
      if (imgTo) imgTo(1.05);
    });

    media.addEventListener('mousemove', (e) => {
      const r = media.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      if (frameTo) {
        frameTo.x(px * 10);
        frameTo.y(py * 10);
      }
      if (kpiTo) {
        kpiTo.x(px * -14);
        kpiTo.y(py * -14);
      }
      if (cardTo) {
        cardTo.x(px * -10);
        cardTo.y(py * -10);
      }
    });

    media.addEventListener('mouseleave', () => {
      if (imgTo) imgTo(1);
      if (frameTo) {
        frameTo.x(0);
        frameTo.y(0);
      }
      if (kpiTo) {
        kpiTo.x(0);
        kpiTo.y(0);
      }
      if (cardTo) {
        cardTo.x(0);
        cardTo.y(0);
      }
    });
  }

  /* =======================================================================
     SERVICES GRID — ENTRANCE
     Badge → title → paragraph (existing .gsap-fade-up stagger idiom, same
     as the hero above), then the six cards reveal once with a stagger +
     slight scale/rotation correction. Falls back to the plain CSS visible
     state (see animations.css) when GSAP is unavailable or motion is
     reduced — no extra work needed here for that case.
     ======================================================================= */
  function initServicesGridEntrance() {
    const section = document.querySelector('.services-grid');
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const header = section.querySelector('.services-grid__header');
    const headerEls = header ? header.querySelectorAll('.gsap-fade-up') : [];
    const cards = section.querySelectorAll('.service-tile');

    if (headerEls.length) {
      gsap.set(headerEls, { opacity: 0, y: 32 });
      gsap.to(headerEls, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: EASE.out3,
        stagger: 0.12,
        scrollTrigger: { trigger: header, start: 'top 82%', once: true },
      });
    }

    if (cards.length) {
      gsap.set(cards, { opacity: 0, y: 50, scale: 0.94, rotate: -1.5 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.85,
        ease: EASE.out3,
        stagger: 0.12,
        scrollTrigger: { trigger: '.services-grid__row', start: 'top 84%', once: true },
      });
    }
  }

  /* =======================================================================
     SERVICES GRID — CARD TILT + PARALLAX
     Same pointer-driven quickTo recipe as the media parallax above (and as
     main.js's initCardTilt for the homepage feature cards), tuned down to
     this spec's "very subtle" ask: ~2-3deg tilt, a small lift, and a max
     6px positional drift. The cursor-follow glow is plain CSS reading the
     --mx/--my custom properties set here, so it never competes with GSAP
     for the `transform` property on the same element.
     ======================================================================= */
  function initServiceTiles() {
    const cards = document.querySelectorAll('.service-tile');
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;

    cards.forEach((card) => {
      gsap.set(card, { transformPerspective: 900, transformOrigin: 'center' });

      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const xTo = gsap.quickTo(card, 'x', { duration: 0.9, ease: EASE.out3 });
      const yTo = gsap.quickTo(card, 'y', { duration: 0.9, ease: EASE.out3 });
      const scaleTo = gsap.quickTo(card, 'scale', { duration: 0.9, ease: EASE.out3 });

      card.addEventListener('mouseenter', () => {
        scaleTo(1.02);
        yTo(-10);
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;

        rotateYTo(px * 5);
        rotateXTo(-py * 5);
        xTo(px * 6);
        yTo(-10 + py * 6);

        card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
        card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
      });

      card.addEventListener('mouseleave', () => {
        rotateXTo(0);
        rotateYTo(0);
        xTo(0);
        yTo(0);
        scaleTo(1);
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }
})();
