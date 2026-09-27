/* =========================================================================
   PITEX — success.js
   Owns the Services page "Customer Success & Case Studies" section:
   badge → heading → paragraph → featured story → case cards → logo strip →
   gallery entrance sequence, plus the section's own hover physics (featured
   story tilt + cursor-follow light, story-card lift, gallery card tilt +
   zoom). Button ripple/magnetic/lift, stat counters, the client marquee's
   continuous scroll and Lenis/ScrollTrigger core are already wired globally
   by main.js and need no re-initialization here — this file only owns what
   is new for this section. Safe on any page: every entry point checks its
   container exists before doing anything.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', expo: 'expo.out', back: 'back.out(1.7)' };

  document.addEventListener('DOMContentLoaded', () => {
    initSuccessEntrance();
    initFeaturedStoryInteraction();
    initStoryCardLift();
    initGalleryCards();
  });

  /* =======================================================================
     ENTRANCE — badge/title/subtitle fade up, then featured story scales
     in, case cards stagger in beside it, the metrics widget pops, the logo
     strip fades, and the gallery cascades in. One timeline, same
     "opacity + y + scale (+blur where it's a big element)" language as
     every other section on the site.
     ======================================================================= */
  function initSuccessEntrance() {
    const section = document.querySelector('.success-section');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const link = section.querySelector('.case-studies-link');
    const featured = section.querySelector('.success-featured');
    const stories = Array.from(section.querySelectorAll('.success-story-card'));
    const widget = section.querySelector('.success-metrics-widget');
    const marqueeLabel = section.querySelector('.success-marquee-label');
    const marquee = section.querySelector('.trusted-marquee');
    const galleryCards = Array.from(section.querySelectorAll('.success-gallery-card'));

    if (prefersReducedMotion || !hasGSAP) return;

    if (header) gsap.set(header, { opacity: 0, y: 32 });
    if (link) gsap.set(link, { opacity: 0, x: 24 });
    if (featured) gsap.set(featured, { opacity: 0, y: 50, scale: 0.96, clipPath: 'inset(4% round 32px)' });
    gsap.set(stories, { opacity: 0, y: 46, scale: 0.95 });
    if (widget) gsap.set(widget, { opacity: 0, y: 24, scale: 0.94 });
    if (marqueeLabel) gsap.set(marqueeLabel, { opacity: 0 });
    if (marquee) gsap.set(marquee, { opacity: 0, y: 16 });
    gsap.set(galleryCards, { opacity: 0, y: 56, scale: 0.94, filter: 'blur(6px)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    if (link) tl.to(link, { opacity: 1, x: 0, duration: 0.9 }, '-=0.6');
    if (featured) {
      tl.to(
        featured,
        { opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% round 32px)', duration: 1.2, ease: EASE.expo },
        '-=0.35'
      );
    }
    tl.to(stories, { opacity: 1, y: 0, scale: 1, duration: 1, ease: EASE.expo, stagger: 0.16 }, '-=0.85');
    if (widget) tl.to(widget, { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EASE.back }, '-=0.3');
    if (marqueeLabel) tl.to(marqueeLabel, { opacity: 1, duration: 0.8 }, '-=0.15');
    if (marquee) tl.to(marquee, { opacity: 1, y: 0, duration: 1 }, '-=0.5');
    if (galleryCards.length) {
      tl.to(
        galleryCards,
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE.expo, stagger: 0.12 },
        '-=0.4'
      );
    }
  }

  /* =======================================================================
     FEATURED STORY — pointer-driven 3D tilt + image zoom/parallax (same
     recipe as initCaseStudies in main.js), plus a soft cursor-follow light
     that tracks the pointer via GSAP quickTo (transform-only, GPU-cheap).
     ======================================================================= */
  function initFeaturedStoryInteraction() {
    const card = document.querySelector('.success-featured');
    if (!card || prefersReducedMotion || !hasGSAP) return;

    const img = card.querySelector('.success-featured__media img');
    const glass = card.querySelector('.success-featured__glass');
    const kpi = card.querySelector('.success-featured__kpi');
    const light = card.querySelector('.success-featured__cursor-light');

    gsap.set(card, { transformPerspective: 1400, transformOrigin: 'center' });

    const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
    const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
    const imgScaleTo = img ? gsap.quickTo(img, 'scale', { duration: 1.2, ease: EASE.out3 }) : null;
    const imgXTo = img ? gsap.quickTo(img, 'x', { duration: 1.1, ease: EASE.out3 }) : null;
    const imgYTo = img ? gsap.quickTo(img, 'y', { duration: 1.1, ease: EASE.out3 }) : null;
    const glassTo = glass
      ? { x: gsap.quickTo(glass, 'x', { duration: 1, ease: EASE.out3 }), y: gsap.quickTo(glass, 'y', { duration: 1, ease: EASE.out3 }) }
      : null;
    const kpiTo = kpi
      ? { x: gsap.quickTo(kpi, 'x', { duration: 0.9, ease: EASE.out3 }), y: gsap.quickTo(kpi, 'y', { duration: 0.9, ease: EASE.out3 }) }
      : null;
    const lightXTo = light ? gsap.quickTo(light, 'x', { duration: 0.5, ease: 'sine.out' }) : null;
    const lightYTo = light ? gsap.quickTo(light, 'y', { duration: 0.5, ease: 'sine.out' }) : null;

    card.addEventListener('mouseenter', () => {
      if (imgScaleTo) imgScaleTo(1.08);
      if (light) gsap.to(light, { opacity: 1, duration: 0.4, ease: 'sine.out' });
    });

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      rotateYTo(px * 4);
      rotateXTo(-py * 4);
      if (imgXTo) imgXTo(px * -18);
      if (imgYTo) imgYTo(py * -18);
      if (glassTo) { glassTo.x(px * -5); glassTo.y(py * -5); }
      if (kpiTo) { kpiTo.x(px * -5); kpiTo.y(py * -5); }
      if (lightXTo) lightXTo(e.clientX - r.left);
      if (lightYTo) lightYTo(e.clientY - r.top);
    });

    card.addEventListener('mouseleave', () => {
      rotateXTo(0);
      rotateYTo(0);
      if (imgScaleTo) imgScaleTo(1);
      if (imgXTo) imgXTo(0);
      if (imgYTo) imgYTo(0);
      if (glassTo) { glassTo.x(0); glassTo.y(0); }
      if (kpiTo) { kpiTo.x(0); kpiTo.y(0); }
      if (light) gsap.to(light, { opacity: 0, duration: 0.5, ease: 'sine.out' });
    });
  }

  /* =======================================================================
     STORY CARDS — gentle lift + very light tilt on hover. Deliberately
     subtler than the featured story (max ~5px) per the section's own
     "everything expensive, nothing loud" brief.
     ======================================================================= */
  function initStoryCardLift() {
    const cards = document.querySelectorAll('.success-story-card');
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;

    cards.forEach((card) => {
      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const liftTo = gsap.quickTo(card, 'y', { duration: 0.8, ease: EASE.out3 });
      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: EASE.out3 });

      card.addEventListener('mouseenter', () => liftTo(-5));
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotateYTo(px * 2.5);
        rotateXTo(-py * 2.5);
      });
      card.addEventListener('mouseleave', () => {
        liftTo(0);
        rotateXTo(0);
        rotateYTo(0);
      });
    });
  }

  /* =======================================================================
     PROJECT GALLERY — same pointer-driven tilt + image zoom/filter recipe
     as initMachineryCards in main.js (the .solution-card family), scoped
     here since these instances live outside .machinery-section. The
     description/CTA reveal itself is a pure CSS opacity transition
     (success.css); this only owns the transform-based physics.
     ======================================================================= */
  function initGalleryCards() {
    const cards = document.querySelectorAll('.success-gallery-card');
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;

    cards.forEach((card) => {
      const img = card.querySelector('.solution-media img');
      const title = card.querySelector('.solution-title');
      if (!img) return;

      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.9, ease: EASE.out3 });
      const imgScaleTo = gsap.quickTo(img, 'scale', { duration: 1.1, ease: EASE.out3 });

      card.addEventListener('mouseenter', () => {
        liftTo(-8);
        imgScaleTo(1.12);
        if (title) gsap.to(title, { y: -4, duration: 0.7, ease: EASE.out3 });
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotateYTo(px * 6);
        rotateXTo(-py * 6);
      });

      card.addEventListener('mouseleave', () => {
        rotateXTo(0);
        rotateYTo(0);
        liftTo(0);
        imgScaleTo(1);
        if (title) gsap.to(title, { y: 0, duration: 0.7, ease: EASE.out3 });
      });
    });
  }
})();
