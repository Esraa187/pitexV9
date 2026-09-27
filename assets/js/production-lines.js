/* =========================================================================
   PITEX — production-lines.js
   Owns the homepage "Production Lines" preview grid (unchanged — actual
   product cards, via products-data.js) and the production-lines.html
   category-selection page: hero, intro, the 5 category cards
   (categories-data.js), stats band and the "Need help choosing?" CTA.
   Card markup itself always lives in categories-data.js / products-data.js
   and is never duplicated here — this file only renders it into the
   right container and choreographs it. Safe to include on any page:
   every entry point checks its container exists before doing anything.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };
  const PAGE_SIZE = 5;

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.PitexProducts) return;
    initHomePreview();
    initCategoriesPage();
  });

  /* Builds the homepage "Production Lines" preview cards straight from
     categories-data.js — the single source of truth for the SIX
     production-line categories — so the name shown on every card is
     always the real production line name, never an individual machine's
     product title. Markup/classes are identical to renderProductCard()'s
     output (.product-card / .product-card__media / .product-card__body /
     etc.) so the existing production-lines.css styling, hover-tilt and
     scroll entrance animation keep working with zero changes. */
  function productionLineCardsMarkup(categories) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key) => key;
    return categories
      .map(
        (cat) => '\n      <div class="col-12 col-sm-6 col-lg-4">\n' +
          '        <article class="product-card gsap-stagger-item" data-category="' + cat.slug + '">\n' +
          '          <div class="product-card__media">\n' +
          '            <img src="' + cat.image + '" alt="' + cat.alt + '" loading="lazy" width="600" height="450" />\n' +
          '            <div class="product-overlay" aria-hidden="true"></div>\n' +
          '            <div class="card-sweep" aria-hidden="true"></div>\n' +
          '          </div>\n' +
          '          <div class="product-card__body">\n' +
          '            <h3 class="product-title">' + pick(cat.label) + '</h3>\n' +
          '            <p class="product-text">' + pick(cat.shortDesc) + '</p>\n' +
          '            <div class="product-card__footer">\n' +
          '              <a href="products.html?category=' + cat.slug + '" class="link-arrow product-link">\n' +
          '                ' + t('common.buttons.learnMore') + '\n' +
          '                <i class="bi bi-arrow-right" aria-hidden="true" data-rtl-flip></i>\n' +
          '              </a>\n' +
          '            </div>\n' +
          '          </div>\n' +
          '        </article>\n' +
          '      </div>'
      )
      .join('');
  }

  /* =======================================================================
     HOMEPAGE PREVIEW — first N cards (default: all 6 lines), same card
     component, entrance choreography modeled on
     initMachineryCards/initApplicationCards in main.js: header fade-up,
     cards blur/scale/stagger in on scroll.
     ======================================================================= */
  function initHomePreview() {
    const grid = document.getElementById('homeProductsGrid');
    if (!grid) return;
    if (!window.PitexCategories) return;

    const count = parseInt(grid.getAttribute('data-preview-count'), 10) || window.PitexCategories.data.length;

    function paint() {
      grid.innerHTML = productionLineCardsMarkup(window.PitexCategories.data.slice(0, count));
      window.PitexProducts.wireProductCards(grid);
    }

    paint();
    animateSectionEntrance(grid.closest('.production-preview-section'), grid);

    // Dynamic-content requirement: re-paint (text only, no re-animation)
    // every time the active language changes.
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(() => {
        paint();
        window.I18N.snapReveal(grid);
      });
    }
  }

  function animateSectionEntrance(section, grid) {
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const header = section.querySelector('.section-header');
    const cta = section.querySelector('.production-preview-cta');
    const cards = Array.from(grid.querySelectorAll('.product-card'));

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 46, scale: 0.94, filter: 'blur(8px)' });
    if (cta) gsap.set(cta, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(
      cards,
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE.expo, stagger: 0.08 },
      header ? '-=0.4' : 0
    );
    if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3');
  }

  /* =======================================================================
     CATEGORIES PAGE (production-lines.html) — hero, intro, 5 category
     cards, stats band, "Need help choosing?" CTA.
     ======================================================================= */
  function initCategoriesPage() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid || !window.PitexCategories) return;

    function paint() {
      grid.innerHTML = window.PitexCategories.data
        .map((cat, i) => window.PitexCategories.renderCategoryCard(cat, i))
        .join('');
      wireCategoryCards(grid);
    }

    paint();
    animateCategoriesEntrance(grid);
    initHeroEntrance();
    initScrollIndicator();

    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(() => {
        paint();
        window.I18N.snapReveal(grid);
      });
    }
  }

  function animateCategoriesEntrance(grid) {
    const section = grid.closest('.categories-section');
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const header = section.querySelector('.section-header');
    const cards = Array.from(grid.querySelectorAll('.category-card'));

    if (header) gsap.set(header, { opacity: 0, y: 34 });
    gsap.set(cards, { opacity: 0, y: 60, scale: 0.94 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: EASE.expo, stagger: 0.14 }, header ? '-=0.5' : 0.2);
  }

  /* =======================================================================
     PER-CARD INTERACTIONS — 3D tilt + image parallax on hover (same
     recipe as the retired initMachineryCards in main.js), plus the
     premium page-transition on click before navigating to the category's
     Products page.
     ======================================================================= */
  function wireCategoryCards(grid) {
    grid.querySelectorAll('.category-card').forEach((card) => {
      const img = card.querySelector('.category-card__media img');
      const icon = card.querySelector('.category-card__icon');

      card.addEventListener('click', (e) => {
        e.preventDefault();
        const href = card.getAttribute('href');
        if (window.PitexTransition) {
          window.PitexTransition.navigate(href, card);
        } else {
          window.location.href = href;
        }
      });

      if (prefersReducedMotion || !hasGSAP) return;

      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: EASE.out3 });
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: EASE.out3 });
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.9, ease: EASE.out3 });
      const imgScaleTo = img ? gsap.quickTo(img, 'scale', { duration: 1.1, ease: EASE.out3 }) : null;
      const imgXTo = img ? gsap.quickTo(img, 'x', { duration: 1, ease: EASE.out3 }) : null;
      const imgYTo = img ? gsap.quickTo(img, 'y', { duration: 1, ease: EASE.out3 }) : null;
      const iconYTo = icon ? gsap.quickTo(icon, 'y', { duration: 0.8, ease: EASE.out3 }) : null;

      card.addEventListener('mouseenter', () => {
        liftTo(-12);
        if (imgScaleTo) imgScaleTo(1.14);
        if (iconYTo) iconYTo(-3);
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotateYTo(px * 9);
        rotateXTo(-py * 9);
        if (imgXTo) imgXTo(px * -14);
        if (imgYTo) imgYTo(py * -14);
      });

      card.addEventListener('mouseleave', () => {
        rotateXTo(0);
        rotateYTo(0);
        liftTo(0);
        if (imgScaleTo) imgScaleTo(1);
        if (imgXTo) imgXTo(0);
        if (imgYTo) imgYTo(0);
        if (iconYTo) iconYTo(0);
      });
    });
  }

  /* =======================================================================
     HERO ENTRANCE — badge/breadcrumb/title/desc fade-blur-up, same
     "fadeBlur" language header.js uses for its own load reveal.
     ======================================================================= */
  function initHeroEntrance() {
    const hero = document.querySelector('.page-hero');
    if (!hero) return;

    const particles = document.getElementById('heroParticles');
    const els = hero.querySelectorAll('.gsap-fade-up');

    if (prefersReducedMotion || !hasGSAP) {
      if (particles) particles.style.opacity = '1';
      return;
    }

    gsap.set(els, { opacity: 0, y: 34 });
    if (particles) gsap.set(particles, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 }, delay: 0.2 });
    if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
    tl.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.1);
  }

  function initScrollIndicator() {
    const btn = document.querySelector('[data-scroll-indicator]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const target = document.getElementById('categories');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
})();
