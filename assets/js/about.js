/* =========================================================================
   PITEX — about.js
   Owns the About Hero only. Same GSAP/easing language and split-text
   recipe as main.js (splitWords/splitLines), same hero-entrance/scroll-
   indicator pattern as production-lines.js. Every entry point checks its
   element exists first, so this file is safe to include on any page.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.about-hero')) return;
    initAboutHeroEntrance();
    initAboutHeroParallax();
    initTrustBarMarquee();
    initScrollIndicator();
    initAboutStorySection();
    initWhyUsSection();
    initFacilitiesSection();
    initMissionVisionSection();
    initJourneySection();
    initFaqSection();
  });

  /**
   * Splits the hero heading into words, each wrapped in an overflow-hidden
   * mask — identical markup/classes to main.js's splitWords() so the
   * .split-mask/.split-word pre-states in animations.css apply for free.
   * The <em> highlight is preserved as its own run of words so the
   * italic/gradient styling in about.css still targets real <em> tags.
   */
  function splitTitle(el) {
    const fullText = el.textContent.trim();
    el.setAttribute('aria-label', fullText);

    const frag = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const words = child.textContent.trim().split(/\s+/).filter(Boolean);
        words.forEach((w, i) => {
          frag.appendChild(wrapWord(w));
          if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
        });
      } else if (child.nodeName === 'EM') {
        const words = child.textContent.trim().split(/\s+/).filter(Boolean);
        const em = document.createElement('em');
        words.forEach((w, i) => {
          em.appendChild(wrapWord(w));
          if (i < words.length - 1) em.appendChild(document.createTextNode(' '));
        });
        frag.appendChild(em);
      }
      frag.appendChild(document.createTextNode(' '));
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
     HERO ENTRANCE — split-text title reveal, staggered badge/breadcrumb/
     description, background particles fade, trust bar fade-up.
     ======================================================================= */
  function initAboutHeroEntrance() {
    const hero = document.querySelector('.about-hero');
    const title = hero.querySelector('[data-split-title]');
    const trustBar = hero.querySelector('.trust-bar');
    const particles = hero.querySelector('.about-hero__particles');
    const bg = hero.querySelector('[data-hero-zoom]');
    const others = Array.from(hero.querySelectorAll('.gsap-fade-up')).filter((el) => el !== trustBar);

    if (prefersReducedMotion || !hasGSAP) {
      if (particles) particles.style.opacity = '1';
      return;
    }

    const words = title ? splitTitle(title) : [];

    gsap.set(others, { opacity: 0, y: 34 });
    if (trustBar) gsap.set(trustBar, { opacity: 0, y: 24 });
    if (particles) gsap.set(particles, { opacity: 0 });
    if (words.length) gsap.set(words, { y: '115%', rotate: 6, opacity: 0, filter: 'blur(10px)' });
    if (bg) gsap.set(bg, { filter: 'blur(14px)', scale: 1.14 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 }, delay: 0.15 });

    if (bg) {
      tl.to(bg, { filter: 'blur(0px)', scale: 1.08, duration: 1.6, ease: EASE.out4 }, 0);
    }
    if (particles) tl.to(particles, { opacity: 1, duration: 1.4, ease: 'sine.out' }, 0.1);

    // Breadcrumb + badge first
    tl.to(others.filter((el) => !el.matches('.about-hero__desc')), { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.15);

    // Split-word title reveal
    if (words.length) {
      tl.to(words, { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 }, 0.35);
    }

    // Description paragraph fade, after the title has mostly landed
    const desc = hero.querySelector('.about-hero__desc');
    if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5');

    // Trust bar fades up last
    if (trustBar) tl.to(trustBar, { opacity: 1, y: 0, duration: 0.9 }, '-=0.3');
  }

  /* =======================================================================
     PARALLAX — mouse-movement depth across bg/blobs/blueprint, plus a
     gentle scroll-linked drift on the decorative field. Same quickTo
     recipe as initSectionParallax in main.js.
     ======================================================================= */
  function initAboutHeroParallax() {
    if (prefersReducedMotion || !hasGSAP) return;

    const hero = document.querySelector('.about-hero');
    const bg = hero.querySelector('[data-hero-zoom]');
    const blueprint = hero.querySelector('.about-hero__blueprint');
    const blobs = hero.querySelectorAll('.about-hero__blob');

    const bgTo = bg ? { x: gsap.quickTo(bg, 'x', { duration: 1.2, ease: EASE.out3 }), y: gsap.quickTo(bg, 'y', { duration: 1.2, ease: EASE.out3 }) } : null;
    const bpTo = blueprint ? { x: gsap.quickTo(blueprint, 'x', { duration: 1, ease: EASE.out3 }) } : null;
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      if (bgTo) { bgTo.x(px * -14); bgTo.y(py * -10); }
      if (bpTo) bpTo.x(px * 10);
      blobTos.forEach((b, i) => {
        b.x(px * (i % 2 === 0 ? 22 : -22));
        b.y(py * 18);
      });
    });

    if (!window.ScrollTrigger) return;
    const field = hero.querySelector('.about-hero__particles');
    if (field) {
      gsap.to(field, {
        y: -60,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  /* =======================================================================
     TRUST BAR — seamless marquee loop (duplicated <ul> in the HTML so the
     translate can wrap from -50% back to 0 with no visible seam). Pauses
     on hover/focus for readability; reduced-motion users get a static,
     manually-scrollable strip instead (handled in about.css).
     ======================================================================= */
  function initTrustBarMarquee() {
    if (prefersReducedMotion || !hasGSAP) return;

    const track = document.querySelector('[data-trust-track]');
    if (!track) return;

    const lists = track.querySelectorAll('.trust-bar__track');
    if (lists.length < 2) return;

    const tween = gsap.to(lists, {
      xPercent: -100,
      duration: 26,
      ease: 'none',
      repeat: -1,
    });

    track.addEventListener('mouseenter', () => tween.timeScale(0.15));
    track.addEventListener('mouseleave', () => tween.timeScale(1));
    track.addEventListener('focusin', () => tween.timeScale(0.15));
    track.addEventListener('focusout', () => tween.timeScale(1));
  }

  function initScrollIndicator() {
    const btn = document.querySelector('[data-scroll-indicator]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const target = document.getElementById('story');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* =======================================================================
     ABOUT STORY SECTION — entrance + parallax.
     Same choreography language as the homepage's about-section timeline
     (main.js: initAboutMasterTimeline) — image reveal, glow, cert-card
     drop-in + idle float, badge/heading/paragraph fade-up, stat-card
     stagger — kept as a page-local copy rather than reusing that
     function directly because it hardcodes homepage-only IDs
     (#about-title, #aboutParticles) and an exact 2-item feature list,
     neither of which this section has. Image hover/tilt and the cert
     card's magnetic pull still come for free from main.js's
     initImageInteraction/initMagnetic, which target .about-media/
     .cert-card generically on any page — not duplicated here.
     ======================================================================= */
  function initAboutStorySection() {
    const section = document.querySelector('.about-story-section');
    if (!section) return;

    const particles = document.getElementById('storyParticles');
    const media = section.querySelector('.about-media');
    const frame = section.querySelector('.about-media__frame');
    const glow = section.querySelector('.about-media__glow');
    const cert = section.querySelector('.cert-card');
    const badge = section.querySelector('.about-content__badge');
    const heading = section.querySelector('#story-title');
    const paragraphs = Array.from(section.querySelectorAll('.about-content__desc'));
    const statItems = Array.from(section.querySelectorAll('.about-stats .inline-stat'));
    const statIcons = Array.from(section.querySelectorAll('.about-stats .inline-stat__icon'));
    const cta = section.querySelector('.about-content__cta');

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      if (particles) particles.style.opacity = '1';
      if (glow) glow.style.opacity = '0.55';
      return;
    }

    if (media) {
      media.classList.remove('gsap-slide-left');
      gsap.set(media, { opacity: 1, x: 0 });
    }
    if (particles) gsap.set(particles, { opacity: 0 });
    if (frame) gsap.set(frame, { opacity: 0, x: -70, scale: 0.94 });
    if (glow) gsap.set(glow, { opacity: 0 });
    if (cert) gsap.set(cert, { opacity: 0, y: 50, scale: 0.78, rotate: -8 });
    if (statItems.length) gsap.set(statItems, { opacity: 0, y: 24 });
    if (statIcons.length) gsap.set(statIcons, { scale: 0.9 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (particles) tl.to(particles, { opacity: 1, duration: 1.4, ease: 'sine.out' }, 0);
        if (frame) tl.to(frame, { opacity: 1, x: 0, scale: 1, duration: 1.4, ease: EASE.expo }, 0.1);
        if (glow) tl.to(glow, { opacity: 0.55, duration: 1.2 }, '-=0.9');
        if (cert) {
          tl.to(cert, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.7)' }, '-=0.7')
            .add(() => startStoryCertFloat(cert));
        }

        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5');
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.9 }, '-=0.45');
        if (paragraphs.length) {
          tl.to(paragraphs, { opacity: 1, y: 0, duration: 0.85, stagger: 0.15 }, '-=0.4');
        }
        if (statItems.length) {
          tl.to(statItems, { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: EASE.out3 }, '-=0.25');
        }
        if (statIcons.length) {
          tl.to(statIcons, { scale: 1, duration: 0.65, stagger: 0.12, ease: 'back.out(2)' }, '<');
        }
        if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.85 }, '-=0.2');
      },
    });

    initStoryParallax(section, frame);
  }

  /** Same gentle up/down idle loop as the homepage cert card. */
  function startStoryCertFloat(cert) {
    if (!cert || prefersReducedMotion || !hasGSAP) return;
    gsap.to(cert, { y: '+=16', duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /**
   * Very subtle pointer-driven drift on the image frame + ambient blobs,
   * same recipe/strength as initSectionParallax in main.js.
   */
  function initStoryParallax(section, frame) {
    if (prefersReducedMotion || !hasGSAP) return;

    const frameTo = frame
      ? { x: gsap.quickTo(frame, 'x', { duration: 1.1, ease: EASE.out3 }), y: gsap.quickTo(frame, 'y', { duration: 1.1, ease: EASE.out3 }) }
      : null;
    const blobs = section.querySelectorAll('.ambient-blob');
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    section.addEventListener('mousemove', (e) => {
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      if (frameTo) { frameTo.x(px * 10); frameTo.y(py * 10); }
      blobTos.forEach((b, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        b.x(px * 22 * dir);
        b.y(py * 22 * dir);
      });
    });

    section.addEventListener('mouseleave', () => {
      if (frameTo) { frameTo.x(0); frameTo.y(0); }
      blobTos.forEach((b) => { b.x(0); b.y(0); });
    });
  }

  /* =======================================================================
     WHY CHOOSE US — entrance + idle float + scroll parallax.
     Same gsap.set()-then-ScrollTrigger.create(once) idiom as
     initAboutStorySection: header fades up, the collage's three photo
     layers cascade in (shape -> main -> secondaries -> badges) with a
     slight upward move, then the feature rows (pre-hidden by
     `.gsap-slide-right` in animations.css) fade in and slide from the
     right with a stagger. The outer `.why-us-collage` wrapper is left
     untouched by the entrance timeline on purpose — only its children
     animate — so initWhyUsParallax can drive the wrapper's own `y`
     continuously off scroll position without ever fighting the entrance
     tweens on its children (different elements, same as the Story
     section's frame/media split).
     ======================================================================= */
  function initWhyUsSection() {
    const section = document.querySelector('.why-us-section');
    if (!section) return;

    const collage = section.querySelector('.why-us-collage');
    const shape = section.querySelector('.why-us-collage__shape');
    const main = section.querySelector('.why-us-collage__main');
    const secondaries = Array.from(section.querySelectorAll('.why-us-collage__secondary'));
    const badges = Array.from(section.querySelectorAll('.why-us-badge'));
    const badge = section.querySelector('.section-badge');
    const heading = section.querySelector('#why-us-title');
    const subtitle = section.querySelector('.section-subtitle');
    const items = Array.from(section.querySelectorAll('.why-us-item'));

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      const fallbackEls = [collage, badge, heading, subtitle, ...items].filter(Boolean);
      fallbackEls.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    if (collage) collage.classList.remove('gsap-slide-left');
    if (shape) gsap.set(shape, { opacity: 0, scale: 0.85 });
    if (main) gsap.set(main, { opacity: 0, y: 40, scale: 0.96 });
    if (secondaries.length) gsap.set(secondaries, { opacity: 0, y: 30, scale: 0.9 });
    if (badges.length) gsap.set(badges, { opacity: 0, y: 16, scale: 0.85 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0);
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.9 }, '-=0.55');
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.85 }, '-=0.55');

        if (shape) tl.to(shape, { opacity: 1, scale: 1, duration: 1, ease: 'sine.out' }, '-=0.5');
        if (main) tl.to(main, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out' }, '-=0.75');
        if (secondaries.length) {
          tl.to(secondaries, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.15, ease: 'back.out(1.6)' }, '-=0.7');
        }
        if (badges.length) {
          tl.to(badges, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(2)' }, '-=0.4')
            .add(() => startWhyUsBadgeFloat(badges));
        }
        if (items.length) {
          tl.to(items, { opacity: 1, x: 0, duration: 0.7, stagger: 0.12 }, '-=0.5');
        }
      },
    });

    initWhyUsParallax(collage);
  }

  /** Gentle, staggered up/down idle loop on each floating stat badge —
   *  same recipe as startStoryCertFloat, just three lighter instances so
   *  they read as independently drifting rather than moving in lockstep. */
  function startWhyUsBadgeFloat(badges) {
    if (!badges.length || prefersReducedMotion || !hasGSAP) return;
    badges.forEach((b, i) => {
      gsap.to(b, {
        y: '+=10',
        duration: 2.4 + i * 0.35,
        delay: i * 0.25,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }

  /** Subtle continuous scroll-linked float on the collage wrapper — scrubs
   *  gently with scroll position rather than an idle loop, per the
   *  "floating while scrolling" brief. Targets `.why-us-collage`, not its
   *  children, so it never touches a property the entrance timeline (or
   *  the badge idle float) animates on those children. */
  function initWhyUsParallax(collage) {
    if (!collage || prefersReducedMotion || !hasGSAP) return;

    gsap.to(collage, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: collage,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  /* =======================================================================
     MISSION · VISION · CORE VALUES — badge slide-down, split-word heading
     reveal (reuses splitTitle() above), subtitle fade-up, then cards
     cascade in one after another (opacity + rise + slight rotation +
     blur, settling with an expo ease), followed by the precision-quote
     panel. Same gsap.set()-then-ScrollTrigger.create(once) idiom as
     initAboutStorySection. Card hover tilt/lift/border-glow/light-sweep
     is NOT duplicated here — it already runs for free via main.js's
     initCardTilt() since these panels reuse .feature-card. Only the
     icon's idle float + hover rotate are new, and both are GSAP-owned
     (quickTo/to on distinct transform sub-properties) so they layer
     cleanly with initCardTilt's whole-card tilt instead of fighting it.
     ======================================================================= */
  function initMissionVisionSection() {
    const section = document.querySelector('.mv-section');
    if (!section) return;

    const badge = section.querySelector('.section-badge');
    const heading = section.querySelector('#mv-title');
    const subtitle = section.querySelector('.section-subtitle');
    const cards = Array.from(section.querySelectorAll('.mv-card'));
    const icons = Array.from(section.querySelectorAll('.mv-card__icon'));
    const quote = section.querySelector('.mv-quote');
    const blobs = section.querySelectorAll('.mv-blob');

    initMvCardHover(cards);

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      startIconIdle(icons);
      return;
    }

    if (badge) gsap.set(badge, { opacity: 0, y: -22 });
    const words = heading ? splitTitle(heading) : [];
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 26 });
    if (cards.length) {
      cards.forEach((card, i) => {
        gsap.set(card, { opacity: 0, y: 60, rotate: i % 2 === 0 ? -3 : 3, filter: 'blur(8px)' });
      });
    }
    if (quote) gsap.set(quote, { opacity: 0, y: 30 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0);
        if (words.length) {
          tl.to(words, { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 }, 0.15);
        }
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.9 }, '-=0.6');
        if (cards.length) {
          tl.to(cards, { opacity: 1, y: 0, rotate: 0, filter: 'blur(0px)', duration: 1, ease: EASE.expo, stagger: 0.18 }, '-=0.35');
        }
        if (quote) tl.to(quote, { opacity: 1, y: 0, duration: 0.9 }, '-=0.3');

        startIconIdle(icons);
      },
    });

    initMvParallax(section, blobs);
  }

  /** Very subtle continuous breathing float — same recipe as the
   *  homepage achievement icons (achievements.js: initIconFloat). */
  function startIconIdle(icons) {
    if (!icons.length || prefersReducedMotion || !hasGSAP) return;
    icons.forEach((icon, i) => {
      gsap.to(icon, {
        y: '+=5',
        duration: 2.6 + i * 0.25,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 0.3,
      });
    });
  }

  /** Icon hover rotate + scale — GSAP quickTo on rotation/scale only, so
   *  it composes with the idle float's 'y' tween and with initCardTilt's
   *  whole-card rotationX/Y/scale (main.js) instead of colliding with them. */
  function initMvCardHover(cards) {
    if (!cards.length || prefersReducedMotion || !hasGSAP) return;
    cards.forEach((card) => {
      const icon = card.querySelector('.mv-card__icon');
      if (!icon) return;
      const rotateTo = gsap.quickTo(icon, 'rotate', { duration: 0.7, ease: EASE.out3 });
      const scaleTo = gsap.quickTo(icon, 'scale', { duration: 0.7, ease: EASE.out3 });
      card.addEventListener('mouseenter', () => { rotateTo(6); scaleTo(1.08); });
      card.addEventListener('mouseleave', () => { rotateTo(0); scaleTo(1); });
    });
  }

  /** Same gentle pointer-driven blob drift as initStoryParallax above. */
  function initMvParallax(section, blobs) {
    if (prefersReducedMotion || !hasGSAP || !blobs.length) return;
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    section.addEventListener('mousemove', (e) => {
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      blobTos.forEach((b, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        b.x(px * 20 * dir);
        b.y(py * 20 * dir);
      });
    });

    section.addEventListener('mouseleave', () => {
      blobTos.forEach((b) => { b.x(0); b.y(0); });
    });
  }

  /* =======================================================================
     COMPANY JOURNEY — badge fade-down, split-word heading reveal (reuses
     splitTitle() above), subtitle fade-up, then the connector line draws
     itself (paired with a trailing blurred glow tween) while each
     milestone lands in a tight stagger: icon scale+rotate, year slide-up,
     title/description fade. Same gsap.set()-then-ScrollTrigger idiom as
     initTimeline() in main.js; a second, `once:false` ScrollTrigger per
     item keeps marking milestones "active" (and pulsing the one
     currently in view) as the user scrolls past them, matching "line
     fills, steps stay lit, active step breathes."
     ======================================================================= */
  function initJourneySection() {
    const section = document.querySelector('.journey-section');
    if (!section) return;

    const particles = document.getElementById('journeyParticles');
    const badge = section.querySelector('.section-badge');
    const heading = section.querySelector('#journey-title');
    const subtitle = section.querySelector('.section-subtitle');
    const journeyBadge = section.querySelector('.journey-badge');
    const line = section.querySelector('.timeline-line__fill');
    const glow = section.querySelector('.timeline-line__glow');
    const items = Array.from(section.querySelectorAll('.timeline-item'));

    initJourneyHover(items);

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      if (particles) particles.style.opacity = '1';
      if (journeyBadge) journeyBadge.style.opacity = '1';
      return;
    }

    if (particles) gsap.set(particles, { opacity: 0 });
    if (badge) gsap.set(badge, { opacity: 0, y: -22 });
    const words = heading ? splitTitle(heading) : [];
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 26 });
    if (journeyBadge) gsap.set(journeyBadge, { opacity: 0, y: -16, scale: 0.9 });
    if (line) gsap.set(line, { scaleX: 0, scaleY: 0 });
    if (glow) gsap.set(glow, { scaleX: 0, scaleY: 0 });
    gsap.set(items, { opacity: 0, y: 34 });
    items.forEach((item) => {
      gsap.set(item.querySelector('.timeline-icon'), { scale: 0.4, rotate: -70 });
      gsap.set(item.querySelector('.timeline-number'), { scale: 0, y: 12 });
      gsap.set(item.querySelector('.timeline-title'), { opacity: 0, y: 10 });
      gsap.set(item.querySelector('.timeline-text'), { opacity: 0, y: 10 });
    });

    const isMobileLayout = () => window.innerWidth < 768;
    const isTabletGrid = () => window.innerWidth >= 768 && window.innerWidth < 992;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 72%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0.05);
        if (words.length) {
          tl.to(words, { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 }, 0.2);
        }
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.9 }, '-=0.6');
        if (journeyBadge) {
          tl.to(journeyBadge, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.7)' }, '-=0.5')
            .add(() => startJourneyBadgeFloat(journeyBadge));
        }

        if (line && !isTabletGrid()) {
          tl.to(line, { [isMobileLayout() ? 'scaleY' : 'scaleX']: 1, duration: 1.2, ease: EASE.expo }, '-=0.35');
          if (glow) tl.to(glow, { [isMobileLayout() ? 'scaleY' : 'scaleX']: 1, duration: 1.2, ease: EASE.expo }, '<0.08');
        }

        items.forEach((item, i) => {
          const icon = item.querySelector('.timeline-icon');
          const number = item.querySelector('.timeline-number');
          const title = item.querySelector('.timeline-title');
          const text = item.querySelector('.timeline-text');
          const pos = i === 0 ? '-=0.5' : '-=0.62';

          tl.to(item, { opacity: 1, y: 0, duration: 0.55 }, pos)
            .to(icon, { scale: 1, rotate: 0, duration: 0.65, ease: 'back.out(2.2)' }, '<')
            .to(number, { scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.4')
            .to(title, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
            .to(text, { opacity: 1, y: 0, duration: 0.5 }, '-=0.32');
        });
      },
    });

    // Persistent per-item activation (mirrors initTimeline in main.js):
    // stays lit once scrolled past, and the currently-in-view milestone
    // gets a breathing accent ring layered on top of that lit state.
    let pulseTween = null;
    items.forEach((item) => {
      const ring = item.querySelector('.timeline-icon__ring');

      ScrollTrigger.create({
        trigger: item,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => {
          item.classList.add('is-active');
          startRingPulse(ring);
        },
        onEnterBack: () => {
          item.classList.add('is-active');
          startRingPulse(ring);
        },
        onLeave: () => stopRingPulse(ring),
        onLeaveBack: () => stopRingPulse(ring),
      });
    });

    function startRingPulse(ring) {
      if (!ring) return;
      gsap.killTweensOf(ring);
      gsap.set(ring, { opacity: 0.6, scale: 1 });
      gsap.to(ring, { scale: 1.25, opacity: 0, duration: 1.6, ease: 'sine.out', repeat: -1 });
    }
    function stopRingPulse(ring) {
      if (!ring) return;
      gsap.killTweensOf(ring);
      gsap.to(ring, { opacity: 0, duration: 0.4 });
    }
  }

  /** Same gentle up/down idle loop as the homepage cert card
   *  (startStoryCertFloat above), just applied to the corner badge. */
  function startJourneyBadgeFloat(el) {
    if (!el || prefersReducedMotion || !hasGSAP) return;
    gsap.to(el, { y: '+=10', duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /** Hover: lift the item + scale/rotate the icon via quickTo (transform,
   *  GSAP-owned); the glow ring, border and light-sweep are plain CSS
   *  :hover transitions (non-transform), same ownership split as
   *  initTimelineInteractions in main.js. */
  function initJourneyHover(items) {
    if (!items.length || prefersReducedMotion || !hasGSAP) return;

    items.forEach((item) => {
      const icon = item.querySelector('.timeline-icon');
      if (!icon) return;

      const liftTo = gsap.quickTo(item, 'y', { duration: 0.5, ease: EASE.out3 });
      const rotateTo = gsap.quickTo(icon, 'rotate', { duration: 0.6, ease: EASE.out3 });
      const scaleTo = gsap.quickTo(icon, 'scale', { duration: 0.6, ease: EASE.out3 });
      const number = item.querySelector('.timeline-number');

      item.addEventListener('mouseenter', () => {
        liftTo(-6);
        scaleTo(1.1);
        if (number) gsap.to(number, { y: -5, duration: 0.4, ease: 'back.out(1.7)', yoyo: true, repeat: 1 });
      });

      item.addEventListener('mousemove', (e) => {
        const r = icon.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        rotateTo(px * 12);
      });

      item.addEventListener('mouseleave', () => {
        liftTo(0);
        scaleTo(1);
        rotateTo(0);
      });
    });
  }
  



  /* =======================================================================
     MANUFACTURING FACILITIES SHOWCASE — badge fade-down, split-word
     heading reveal (reuses splitTitle() above), subtitle fade-up, then
     each row reveals in turn: opacity + rise + a clip-path wipe that
     shrinks from an inset frame to full-bleed while a blur lifts off,
     staggered per card within the row. Floating badges pop in last with
     a back-ease, then pick up the same idle float as the cert-card/
     journey-badge. Same gsap.set()-then-ScrollTrigger.create(once) idiom
     as every other section in this file.
     Per-card hover (image zoom + parallax, content reveal, subtle 3D
     tilt) is a new interaction this page doesn't have anywhere else, so
     it's owned by initFacilityHover() below rather than reused — but it
     follows the exact same GSAP-owns-transform / CSS-owns-opacity split
     as initCardTilt() in main.js. The border glow, overlay darkening and
     light sweep are NOT duplicated here; those are plain CSS :hover
     rules in about.css (card-sweep reused as-is from style.css).
     ======================================================================= */
  function initFacilitiesSection() {
    const section = document.querySelector('.facilities-section');
    if (!section) return;

    const particles = document.getElementById('facilitiesParticles');
    const badge = section.querySelector('.section-header .section-badge');
    const heading = section.querySelector('#facilities-title');
    const subtitle = section.querySelector('.section-subtitle');
    const rows = Array.from(section.querySelectorAll('.facility-row'));
    const items = Array.from(section.querySelectorAll('.facility-item'));
    const floatBadges = Array.from(section.querySelectorAll('.facility-badge'));
    const blobs = section.querySelectorAll('.facilities-blob');

    initFacilityHover(items);
    initFacilityParallax(section, blobs);

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      if (particles) particles.style.opacity = '1';
      return;
    }

    if (particles) gsap.set(particles, { opacity: 0 });
    if (badge) gsap.set(badge, { opacity: 0, y: -22 });
    const words = heading ? splitTitle(heading) : [];
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 26 });
    items.forEach((item) => {
      gsap.set(item, {
        opacity: 0,
        y: 46,
        filter: 'blur(7px)',
        clipPath: 'inset(14% 14% 14% 14% round 30px)',
      });
    });
    if (floatBadges.length) gsap.set(floatBadges, { opacity: 0, y: 18, scale: 0.82 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0.05);
        if (words.length) {
          tl.to(words, { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 }, 0.2);
        }
        if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.9 }, '-=0.6');

        rows.forEach((row, ri) => {
          const rowItems = Array.from(row.querySelectorAll('.facility-item'));
          if (!rowItems.length) return;
          tl.to(rowItems, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            duration: 1.15,
            ease: EASE.expo,
            stagger: 0.15,
          }, ri === 0 ? '-=0.3' : '-=0.65');
        });

        if (floatBadges.length) {
          tl.to(floatBadges, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.15 }, '-=0.5')
            .add(() => floatBadges.forEach((b) => startFacilityBadgeFloat(b)));
        }
      },
    });
  }

  /** Same gentle up/down idle loop as the homepage cert card / journey badge. */
  function startFacilityBadgeFloat(el) {
    if (!el || prefersReducedMotion || !hasGSAP) return;
    gsap.to(el, { y: '+=9', duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /**
   * Per-card hover: image zoom + cursor-driven parallax, a very subtle
   * whole-card 3D tilt, and the icon/name/category/description content
   * block rising into view. All transform-based, all GSAP quickTo/to —
   * never CSS transitions — so it composes cleanly with the CSS-only
   * overlay/sweep/border-glow hover rules in about.css.
   */
  function initFacilityHover(items) {
    if (!items.length) return;

    items.forEach((item) => {
      const img = item.querySelector('.facility-media img');
      const content = item.querySelector('.facility-content');
      const icon = item.querySelector('.facility-icon');

      if (prefersReducedMotion || !hasGSAP) return;

      gsap.set(item, { transformPerspective: 1000, transformOrigin: 'center' });
      if (content) gsap.set(content, { y: 28, opacity: 0 });
      if (icon) gsap.set(icon, { y: 10, opacity: 0, scale: 0.7 });

      const rotateXTo = gsap.quickTo(item, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(item, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const imgXTo = img ? gsap.quickTo(img, 'x', { duration: 1.1, ease: EASE.out3 }) : null;
      const imgYTo = img ? gsap.quickTo(img, 'y', { duration: 1.1, ease: EASE.out3 }) : null;

      item.addEventListener('mouseenter', () => {
        if (img) gsap.to(img, { scale: 1.045, filter: 'brightness(0.92) contrast(1.04)', duration: 1.2, ease: EASE.out3 });
        if (content) gsap.to(content, { y: 0, opacity: 1, duration: 0.7, ease: EASE.out3 });
        if (icon) gsap.to(icon, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)', delay: 0.05 });
      });

      item.addEventListener('mousemove', (e) => {
        const r = item.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotateYTo(px * 2.5);
        rotateXTo(-py * 2.5);
        if (imgXTo) imgXTo(px * -6);
        if (imgYTo) imgYTo(py * -6);
      });

      item.addEventListener('mouseleave', () => {
        if (img) gsap.to(img, { scale: 1.015, filter: 'brightness(1) contrast(1)', duration: 1.2, ease: EASE.out3 });
        if (content) gsap.to(content, { y: 28, opacity: 0, duration: 0.6, ease: EASE.out3 });
        if (icon) gsap.to(icon, { y: 10, opacity: 0, scale: 0.7, duration: 0.5 });
        rotateXTo(0);
        rotateYTo(0);
        if (imgXTo) imgXTo(0);
        if (imgYTo) imgYTo(0);
      });
    });
  }

  /** Same gentle pointer-driven blob drift as initStoryParallax/initMvParallax. */
  function initFacilityParallax(section, blobs) {
    if (prefersReducedMotion || !hasGSAP || !blobs.length) return;
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    section.addEventListener('mousemove', (e) => {
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      blobTos.forEach((b, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        b.x(px * 20 * dir);
        b.y(py * 20 * dir);
      });
    });

    section.addEventListener('mouseleave', () => {
      blobTos.forEach((b) => { b.x(0); b.y(0); });
    });
  }

  /* =======================================================================
     FREQUENTLY ASKED QUESTIONS — badge fade-down, split-word heading
     reveal (reuses splitTitle() above), description fade, support panel
     slide-in from the left, then accordion items cascade in (opacity +
     rise + blur settle, same recipe as initMissionVisionSection's card
     reveal). Same gsap.set()-then-ScrollTrigger.create(once) idiom as
     every other section in this file.
     ======================================================================= */
  function initFaqSection() {
    const section = document.querySelector('.faq-section');
    if (!section) return;

    const badge = section.querySelector('.faq-intro .section-badge');
    const heading = section.querySelector('#faq-title');
    const desc = section.querySelector('.faq-intro .section-description');
    const support = section.querySelector('.faq-support');
    const items = Array.from(section.querySelectorAll('.faq-item'));
    const floatBadge = section.querySelector('.faq-support__badge');
    const blobs = section.querySelectorAll('.faq-blob');

    initFaqAccordion(items);

    if (prefersReducedMotion || !hasGSAP || !window.ScrollTrigger) {
      startFaqBadgeFloat(floatBadge);
      return;
    }

    if (badge) gsap.set(badge, { opacity: 0, y: -22 });
    const words = heading ? splitTitle(heading) : [];
    if (desc) gsap.set(desc, { opacity: 0, y: 26 });
    if (support) gsap.set(support, { opacity: 0, x: -50 });
    if (items.length) {
      items.forEach((item) => gsap.set(item, { opacity: 0, y: 40, filter: 'blur(6px)' }));
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out3 } });

        if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0);
        if (words.length) {
          tl.to(words, { y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: EASE.expo, stagger: 0.02 }, 0.15);
        }
        if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.9 }, '-=0.6');
        if (support) tl.to(support, { opacity: 1, x: 0, duration: 1, ease: EASE.out4 }, '-=0.55');
        if (items.length) {
          tl.to(items, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: EASE.expo, stagger: 0.14 }, '-=0.7');
        }

        startFaqBadgeFloat(floatBadge);
      },
    });

    initFaqParallax(section, blobs);
  }

  /**
   * Wires up click + keyboard behavior for every accordion item.
   * Height, the content fade/rise, the accent line growth and the
   * active-item lift are GSAP tweens (transform + height, so they never
   * fight the plain CSS transitions that ride the `.is-open` class for
   * border/background/icon-rotation — same ownership split as the rest
   * of the site). Falls back to an instant, non-animated toggle when
   * GSAP or motion is unavailable. Single-open accordion: opening an
   * item closes whichever one was previously open. Arrow/Home/End keys
   * move focus between questions per the standard accordion pattern.
   */
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
      gsap.set(panel, { height: inner.scrollHeight }); // lock to current px before collapsing

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

  /** Very subtle continuous idle float for the panel's floating chat
   *  badge — same recipe as startIconIdle/startStoryCertFloat above. */
  function startFaqBadgeFloat(badge) {
    if (!badge || prefersReducedMotion || !hasGSAP) return;
    gsap.to(badge, { y: '+=8', duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /** Same gentle pointer-driven blob drift as the rest of the page's
   *  section-scoped parallax helpers. */
  function initFaqParallax(section, blobs) {
    if (prefersReducedMotion || !hasGSAP || !blobs.length) return;
    const blobTos = Array.from(blobs).map((b) => ({
      x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'sine.out' }),
      y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'sine.out' }),
    }));

    section.addEventListener('mousemove', (e) => {
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      blobTos.forEach((b, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        b.x(px * 20 * dir);
        b.y(py * 20 * dir);
      });
    });

    section.addEventListener('mouseleave', () => {
      blobTos.forEach((b) => { b.x(0); b.y(0); });
    });
  }

})();
