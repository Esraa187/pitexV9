(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.ceo-section')) initCeoSection();
    if (document.querySelector('.chairman-values')) initChairmanValues();
    if (document.querySelector('.stats-section')) initStatsSection();
    if (document.querySelector('.exec-section')) initExecTeamSection();
  });

/* =======================================================================
     MESSAGE FROM THE CEO — badge fade-down, quote-mark scale-in, portrait
     clip-path reveal (left-to-right wipe, paired with the same fade+scale
     used by the Story section's image reveal), sentence-level quote
     stagger (reuses the .gsap-stagger-item primitive — same recipe as the
     About Story stat row, just applied to quote sentences instead of
     numbers) and a hand-drawn signature line (stroke-dashoffset draw).
     Image hover/tilt, glow and the badge's lift + magnetic pull are NOT
     duplicated here — they run for free via main.js's
     initImageInteraction()/initMagnetic(), generalized to target every
     .about-media/.cert-card on the page rather than only the first.
     Same gsap.set()-then-ScrollTrigger.create(once) idiom as every other
     section in this file.
     ======================================================================= */
  function initCeoSection() {
    const section = document.querySelector('.ceo-section');
    if (!section) return;

    const particles = document.getElementById('ceoParticles');
    const media = section.querySelector('.about-media');
    const frame = section.querySelector('.about-media__frame');
    const cert = section.querySelector('.cert-card');
    const badge = section.querySelector('.about-content__badge');
    const mark = section.querySelector('.ceo-quote-mark');
    const sentences = Array.from(section.querySelectorAll('.ceo-quote__sentence'));
    const signature = section.querySelector('.ceo-signature');
    const sigName = section.querySelector('.ceo-signature__name');
    const sigRole = section.querySelector('.ceo-signature__role');
    const sigPath = section.querySelector('.ceo-signature__line path');

    initCeoParallax(section, frame);

    if (sigPath && hasGSAP) {
      const len = sigPath.getTotalLength();
      sigPath.style.strokeDasharray = String(len);
      sigPath.style.strokeDashoffset = String(len);
    }

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      if (particles) particles.style.opacity = '1';
      if (sigPath) sigPath.style.strokeDashoffset = '0';
      return;
    }

    if (media) {
      media.classList.remove('gsap-slide-left');
      gsap.set(media, { opacity: 1, x: 0 });
    }
    if (particles) gsap.set(particles, { opacity: 0 });
    if (frame) gsap.set(frame, { opacity: 0, scale: 0.94, clipPath: 'inset(0 100% 0 0)' });
    if (cert) gsap.set(cert, { opacity: 0, y: 40, scale: 0.8, rotate: -6 });
    if (badge) gsap.set(badge, { opacity: 0, y: -20 });
    if (mark) gsap.set(mark, { opacity: 0, scale: 0.6 });
    if (sentences.length) gsap.set(sentences, { opacity: 0, y: 16 });
    if (signature) gsap.set(signature, { opacity: 0, y: 20 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 74%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (particles) tl.to(particles, { opacity: 1, duration: 1.3, ease: 'sine.out' }, 0);
        if (frame) tl.to(frame, { opacity: 1, scale: 1, clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: EASE.expo }, 0.05);
        if (cert) {
          tl.to(cert, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.7)' }, '-=0.55')
            .add(() => startCeoBadgeFloat(cert));
        }
        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, '-=0.9');
        if (mark) tl.to(mark, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)' }, '-=0.55');
        if (sentences.length) tl.to(sentences, { opacity: 1, y: 0, duration: 0.7, stagger: 0.16 }, '-=0.35');
        if (signature) tl.to(signature, { opacity: 1, y: 0, duration: 0.8 }, '-=0.15');
        if (sigPath) tl.to(sigPath, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, '-=0.55');
      },
    });
  }

  /** Same pointer-driven drift recipe as initStoryParallax/initMvParallax
   *  above, scoped to the CEO portrait frame and its two ambient blobs. */
  function initCeoParallax(section, frame) {
    if (prefersReducedMotion || !hasGSAP) return;

    const frameTo = frame
      ? { x: gsap.quickTo(frame, 'x', { duration: 1.1, ease: EASE.out3 }), y: gsap.quickTo(frame, 'y', { duration: 1.1, ease: EASE.out3 }) }
      : null;
    const blobs = section.querySelectorAll('.ceo-blob');
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    section.addEventListener('mousemove', (e) => {
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      if (frameTo) { frameTo.x(px * 12); frameTo.y(py * 12); }
      blobTos.forEach((b, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        b.x(px * 20 * dir);
        b.y(py * 20 * dir);
      });
    });

    section.addEventListener('mouseleave', () => {
      if (frameTo) { frameTo.x(0); frameTo.y(0); }
      blobTos.forEach((b) => { b.x(0); b.y(0); });
    });
  }

  /** Same gentle idle float as the Story/Journey badges. */
  function startCeoBadgeFloat(el) {
    if (!el || prefersReducedMotion || !hasGSAP) return;
    gsap.to(el, { y: '+=14', duration: 2.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }




  /* =======================================================================
     CHAIRMAN'S CORE VALUES — heading (badge/title/subtitle) animates
     first as a single fade-up group, then the six cards cascade in with
     a fade-up + slight scale (0.95 -> 1) and a small stagger, matching
     the exec-team cascade rhythm used elsewhere in this file. Icon fill,
     title color, divider width, tag fill and number opacity are all
     plain CSS :hover rules (leadership.css) — not duplicated here. The
     one transform-based hover (card lift) is GSAP-owned via quickTo,
     same convention as initExecCardHover/initStatsStripHover below.
     ======================================================================= */
  function initChairmanValues() {
    const section = document.querySelector('.chairman-values');
    if (!section) return;

    const cards = Array.from(section.querySelectorAll('.value-card'));

    initValueCardHover(cards);

    const badge = section.querySelector('.section-badge');
    const heading = section.querySelector('.section-title');
    const subtitle = section.querySelector('.section-subtitle');

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) return;

    if (badge) gsap.set(badge, { opacity: 0, y: -18 });
    if (heading) gsap.set(heading, { opacity: 0, y: 26 });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 22 });
    if (cards.length) gsap.set(cards, { opacity: 0, y: 36, scale: 0.95 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 76%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.75 }, 0);
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.85 }, '-=0.5');
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.8 }, '-=0.55');

        if (cards.length) {
          tl.to(cards, {
            opacity: 1, y: 0, scale: 1,
            duration: 0.85, ease: EASE.expo, stagger: 0.12,
          }, '-=0.3');
        }
      },
    });
  }

  /** Card lift on hover — the only transform involved, so GSAP-owned
   *  (quickTo), same recipe as initExecCardHover/initStatsStripHover. */
  function initValueCardHover(cards) {
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;
    cards.forEach((card) => {
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.45, ease: EASE.out3 });
      card.addEventListener('mouseenter', () => liftTo(-8));
      card.addEventListener('mouseleave', () => liftTo(0));
    });
  }

   /* =======================================================================
     3. EXECUTIVE TEAM — cards cascade in one after another (fade +
     translateY + scale + slight alternating rotation), never together.
     Hover: image/avatar zoom via quickTo (GSAP-owns-transform); the
     gradient border glow, background scrim, light sweep and badge glow
     are all plain CSS :hover rules (leadership.css) — not duplicated here.
     ======================================================================= */
  function initExecTeamSection() {
    const section = document.querySelector('.exec-section');
    if (!section) return;

    const badge = section.querySelector('.section-header .section-badge');
    const heading = section.querySelector('#exec-title');
    const subtitle = section.querySelector('.section-subtitle');
    const cards = Array.from(section.querySelectorAll('.exec-card'));
    const particles = document.getElementById('execParticles');

    initExecCardHover(cards);

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      if (particles) particles.style.opacity = '1';
      return;
    }

    if (particles) gsap.set(particles, { opacity: 0 });
    if (badge) gsap.set(badge, { opacity: 0, y: -20 });
    if (heading) gsap.set(heading, { opacity: 0, y: 28 });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 24 });
    cards.forEach((card, i) => {
      gsap.set(card, { opacity: 0, y: 54, scale: 0.92, rotate: i % 2 === 0 ? -3 : 3 });
    });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 76%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0.05);
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.9 }, '-=0.55');
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.85 }, '-=0.55');

        tl.to(cards, {
          opacity: 1, y: 0, scale: 1, rotate: 0,
          duration: 0.95, ease: EASE.expo, stagger: 0.16,
        }, '-=0.35');
      },
    });
  }

  function initExecCardHover(cards) {
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;
    cards.forEach((card) => {
      const media = card.querySelector('.exec-card__media');
      if (!media) return;
      const scaleTo = gsap.quickTo(media, 'scale', { duration: 0.8, ease: EASE.out3 });
      card.addEventListener('mouseenter', () => scaleTo(1.08));
      card.addEventListener('mouseleave', () => scaleTo(1));
    });
  }

  /* =======================================================================
     COMPANY STATISTICS STRIP — numbers fade up with a 0.15s stagger only
     (no blur/rotation choreography here — deliberately plainer than the
     other sections on this page, to match the "minimal, not flashy"
     brief for this strip). The counters themselves are NOT
     re-implemented here: every `[data-count-to]` element on this page is
     already driven by the single shared initCounters() in main.js — a
     page-local duplicate would violate the one-counter-engine rule this
     codebase already follows (see achievements.js's own note on this).
     This file only owns entrance + the hover number-scale (transform,
     hence GSAP); the hover glow and label brighten are pure CSS.
     ======================================================================= */
  function initStatsSection() {
    const section = document.querySelector('.stats-strip');
    if (!section) return;

    initStatsStripEntrance(section);
    initStatsStripHover(section);
  }

  function initStatsStripEntrance(section) {
    const items = Array.from(section.querySelectorAll('.stat-item'));
    if (!items.length || prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) return;

    gsap.set(items, { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out3, stagger: 0.15 });
      },
    });
  }

  /** Number scale on hover — the one transform involved, so GSAP-owned;
   *  same quickTo recipe used across this file. Glow + label brighten
   *  are pure CSS (see .stat-item::after / .stat-item__label in
   *  leadership.css). */
  function initStatsStripHover(section) {
    if (prefersReducedMotion || !hasGSAP) return;

    section.querySelectorAll('.stat-item').forEach((item) => {
      const value = item.querySelector('.stat-item__value');
      if (!value) return;
      const scaleTo = gsap.quickTo(value, 'scale', { duration: 0.6, ease: EASE.out3 });

      item.addEventListener('mouseenter', () => scaleTo(1.06));
      item.addEventListener('mouseleave', () => scaleTo(1));
    });
  }

  })();