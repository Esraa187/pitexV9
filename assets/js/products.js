/* =========================================================================
   PITEX — products.js
   Drives the single reusable Production Line Details template
   (products.html). Reads `?category=<slug>` from the URL, looks the
   category up in categories-data.js, and fills in every category-driven
   piece of the page: the compact line banner (breadcrumb, title, short
   subtitle — same .page-banner component as every other internal page),
   the merged "About This Line + Gallery" showcase (info panel — badge,
   title, description, spec badges, Request Quote / Download Brochure —
   plus an interactive main-image + thumbnail gallery with fullscreen
   lightbox), the fixed complete-process workflow timeline (highlighting
   this category's stage — currently unused, its HTML is commented out),
   and the "Machines Included" grid — plain, non-navigating cards
   (.product-card shell, reused as-is from production-lines.css) showing
   only image + name; the site no longer has a separate Product Details
   page, so nothing here links out to one. Falls back to the first
   category if the URL has none/an unknown slug, so the template never
   renders blank.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out' };

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.PitexProducts || !window.PitexCategories) return;

    const category = resolveCategory();
    if (!category) return;

    function paint() {
      populateHero(category);
      populateAboutLine(category);
      renderWorkflow(category);
      renderProducts(category);
    }

    // Built once, outside the repaint loop (same pattern as product-
    // details.js's populateShowcase): the thumbnail click handlers wired
    // up by initShowcaseInteractions() below are bound to these exact DOM
    // nodes, so the gallery must not be rebuilt on a language switch.
    populateLineGallery(category);
    paint();

    initAboutLineEntrance();
    initShowcaseInteractions();
    initLineLightbox();
    initWorkflowEntrance();
    initMachinesEntrance(document.getElementById('productsGrid'));
    initCtaEntrance();
    initDividers();

    // Dynamic-content requirement: re-paint all category/product text (no
    // re-animation, no re-fetch — everything is already in memory) on
    // every language switch.
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(() => {
        paint();
        window.I18N.snapReveal(document.body);
      });
    }
  });

  function resolveCategory() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('category');
    return window.PitexCategories.bySlug(slug) || window.PitexCategories.data[0] || null;
  }

  /* =======================================================================
     LINE BANNER — breadcrumb, title, short subtitle and background image
     for the compact .page-banner (same shared component as every other
     internal page). Request Quote / Download Brochure and the spec badge
     row have moved down into the showcase info panel (populateAboutLine)
     since the banner itself carries no buttons, matching every other
     internal-page banner on the site.
     ======================================================================= */
  function populateHero(cat) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key, vars) => key;
    const label = pick(cat.label);
    const heroDesc = pick(cat.heroDesc);

    document.title = t('pages.products.docTitle', { label });

    const breadcrumb = document.querySelector('[data-breadcrumb-category]');
    if (breadcrumb) breadcrumb.textContent = label;

    const bg = document.querySelector('[data-hero-bg]');
    if (bg) {
      bg.src = cat.image;
      bg.alt = cat.alt;
    }

    const title = document.querySelector('[data-hero-title]');
    if (title) {
      const words = label.split(' ');
      title.innerHTML = words.slice(0, -1).join(' ') +
        ' <span class="text-accent">' + words.slice(-1) + '</span>';
    }

    const desc = document.querySelector('[data-hero-desc]');
    if (desc) desc.textContent = heroDesc;

    // Request Quote — reuses the same quote-modal.js/.whatsapp.js component
    // as product-details.html, initialized with the whole line as the
    // "product" (no single machine to tie it to on this page).
    if (window.PitexQuoteModal) {
      window.PitexQuoteModal.init({
        title: label,
        image: cat.image,
        categoryLabel: t('pages.products.badge'),
      });
    }

    // Download Brochure — only shown if this category actually has one.
    // Lives in the showcase info panel now (About This Line + Gallery
    // section), next to Request Quote — same element/attribute, just
    // relocated out of the compact page banner.
    const brochure = document.querySelector('[data-hero-brochure]');
    if (brochure) {
      if (cat.brochure) {
        brochure.href = cat.brochure;
        brochure.hidden = false;
      } else {
        brochure.hidden = true;
      }
    }
  }

  /* =======================================================================
     ABOUT THIS LINE — badge, title, description and spec badges (left
     info panel of the merged showcase section). Reuses .showcase-info*
     (product-details.css) as-is. The interactive gallery on the right is
     populated separately below (populateLineGallery).
     ======================================================================= */
  function populateAboutLine(cat) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const title = document.querySelector('[data-overview-title]');
    if (title) title.textContent = pick(cat.label);

    const desc = document.querySelector('[data-overview-desc]');
    if (desc) desc.textContent = pick(cat.overviewDesc);

    // Spec badges (Automation / Capacity / Export Ready / …) + throughput —
    // same category fields the old (unused) hero badge row was built from,
    // now actually shown, right next to the line's own description.
    const badgesWrap = document.querySelector('[data-info-badges]');
    if (badgesWrap) {
      const icons = (window.PitexProducts && window.PitexProducts.BADGE_ICONS) || {};
      const badgeLabels = (window.PitexProducts && window.PitexProducts.BADGE_LABELS) || {};
      const labelFor = (window.PitexProducts && window.PitexProducts.labelFor) || ((dict, key) => (dict[key] ? pick(dict[key]) : key));
      const badges = (cat.badges || []).map((b) => ({ label: labelFor(badgeLabels, b), icon: icons[b] || 'bi-check-circle' }));
      if (cat.capacity) badges.push({ label: cat.capacity, icon: 'bi-speedometer2' });

      badgesWrap.innerHTML = badges
        .map((b) => '<span class="feature-badge"><i class="bi ' + b.icon + '" aria-hidden="true"></i>' + b.label + '</span>')
        .join('');
    }
  }

  function initAboutLineEntrance() {
    const section = document.querySelector('.about-line-section');
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const content = section.querySelector('.about-line-info');
    const media = section.querySelector('.showcase-media');
    const contentEls = content ? content.querySelectorAll('.gsap-fade-up') : [];

    if (contentEls.length) gsap.set(contentEls, { opacity: 0, y: 26 });
    if (media) gsap.set(media, { opacity: 0, x: 40 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (contentEls.length) tl.to(contentEls, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0);
    if (media) tl.to(media, { opacity: 1, x: 0, duration: 1.1 }, 0.1);
  }

  /* =======================================================================
     LINE GALLERY — interactive main image + thumbnail strip, built from
     every image for this line (the category's own photo + each of its
     machines' photos). Same shared .showcase-media/.showcase-main/
     .showcase-thumbs component and interaction pattern (thumbnail click,
     active state, crossfade, keyboard arrows, swipe, spotlight hover,
     skeleton preload) as product-details.html's product showcase —
     clicking the main image or a thumbnail opens the fullscreen lightbox
     below (initLineLightbox) instead of navigating anywhere.
     ======================================================================= */
  let lineGalleryImages = [];
  let lineShowcaseIndex = 0;

  function buildLineGalleryImages(cat) {
    const products = window.PitexProducts.byCategory(cat.slug) || [];
    const seen = new Set();
    const images = [];
    [cat.image, ...products.map((p) => p.image)].forEach((src) => {
      if (src && !seen.has(src)) { seen.add(src); images.push(src); }
    });
    return images;
  }

  function populateLineGallery(cat) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key, vars) => key;
    const catLabel = pick(cat.label);
    lineGalleryImages = buildLineGalleryImages(cat);
    lineShowcaseIndex = 0;

    const track = document.querySelector('[data-showcase-track]');
    if (track) {
      track.innerHTML = lineGalleryImages
        .map((src, i) => '<img src="' + src + '" alt="' + catLabel + ' — ' + t('common.aria.galleryImage', { index: i + 1 }) + '" ' +
          'loading="' + (i === 0 ? 'eager' : 'lazy') + '" style="opacity:' + (i === 0 ? '1' : '0') + '" />')
        .join('');
    }

    const thumbs = document.querySelector('[data-showcase-thumbs]');
    if (thumbs) {
      if (lineGalleryImages.length > 1) {
        thumbs.hidden = false;
        thumbs.innerHTML = lineGalleryImages
          .map((src, i) => '<button type="button" class="showcase-thumb' + (i === 0 ? ' is-active' : '') +
            '" data-showcase-thumb data-index="' + i + '" aria-label="' + t('common.aria.openGalleryImage', { index: i + 1, total: lineGalleryImages.length }) + '">' +
            '<img src="' + src + '" alt="" loading="lazy" /></button>')
          .join('');
      } else {
        thumbs.hidden = true;
        thumbs.innerHTML = '';
      }
    }

    const counter = document.querySelector('[data-showcase-counter]');
    if (counter) {
      if (lineGalleryImages.length > 1) {
        counter.hidden = false;
        counter.textContent = '1 / ' + lineGalleryImages.length;
      } else {
        counter.hidden = true;
      }
    }
  }

  function goToLineShowcaseIndex(index) {
    if (!lineGalleryImages.length) return;
    const next = (index + lineGalleryImages.length) % lineGalleryImages.length;
    if (next === lineShowcaseIndex) return;

    const track = document.querySelector('[data-showcase-track]');
    const imgs = track ? track.querySelectorAll('img') : [];
    const outgoing = imgs[lineShowcaseIndex];
    const incoming = imgs[next];

    if (outgoing && incoming) {
      if (prefersReducedMotion || !hasGSAP) {
        outgoing.style.opacity = '0';
        incoming.style.opacity = '1';
      } else {
        gsap.set(incoming, { opacity: 0, scale: 1.06 });
        gsap.to(outgoing, { opacity: 0, duration: 0.45, ease: 'sine.out' });
        gsap.to(incoming, { opacity: 1, scale: 1, duration: 0.75, ease: EASE.out3 });
      }
    }

    document.querySelectorAll('[data-showcase-thumb]').forEach((th) => {
      th.classList.toggle('is-active', Number(th.dataset.index) === next);
    });

    const counter = document.querySelector('[data-showcase-counter]');
    if (counter && !counter.hidden) counter.textContent = (next + 1) + ' / ' + lineGalleryImages.length;

    lineShowcaseIndex = next;
  }

  function initShowcaseInteractions() {
    const main = document.querySelector('[data-showcase-main]');
    if (!main) return;

    // Loaded-state → hides the skeleton shimmer once the first image paints.
    const firstImg = main.querySelector('.showcase-main__track img');
    const markLoaded = () => main.classList.add('is-loaded');
    if (firstImg) {
      if (firstImg.complete) markLoaded();
      else firstImg.addEventListener('load', markLoaded, { once: true });
    }

    document.querySelectorAll('[data-showcase-thumb]').forEach((th) => {
      th.addEventListener('click', () => goToLineShowcaseIndex(Number(th.dataset.index)));
    });

    // Keyboard navigation when the showcase has focus.
    main.setAttribute('tabindex', '0');
    main.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goToLineShowcaseIndex(lineShowcaseIndex - 1);
      if (e.key === 'ArrowRight') goToLineShowcaseIndex(lineShowcaseIndex + 1);
      if (e.key === 'Enter') openLineLightbox(lineShowcaseIndex);
    });

    // Swipe support on mobile.
    let touchStartX = 0;
    main.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) goToLineShowcaseIndex(lineShowcaseIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Click opens the fullscreen lightbox.
    main.addEventListener('click', () => openLineLightbox(lineShowcaseIndex));

    // Soft spotlight following the mouse over the main image.
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
      main.addEventListener('mousemove', (e) => {
        const r = main.getBoundingClientRect();
        main.style.setProperty('--spot-x', ((e.clientX - r.left) / r.width * 100) + '%');
        main.style.setProperty('--spot-y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    }
  }

  /* =======================================================================
     LINE LIGHTBOX — fullscreen viewer for the gallery grid above. Same
     open/close/next/prev/keyboard/click-outside behaviour as product-
     details.js's lightbox, own element ids/variables so both pages can
     each run their own instance without colliding.
     ======================================================================= */
  let lineLightboxIndex = 0;

  function openLineLightbox(index) {
    if (window.__pitexOpenLineLightbox) window.__pitexOpenLineLightbox(index);
  }

  function initLineLightbox() {
    const lb = document.getElementById('lineLightbox');
    if (!lb) return;

    const stage = lb.querySelector('[data-line-lightbox-stage]');
    const counter = lb.querySelector('[data-line-lightbox-counter]');
    const closeBtn = lb.querySelector('[data-line-lightbox-close]');
    const prevBtn = lb.querySelector('[data-line-lightbox-prev]');
    const nextBtn = lb.querySelector('[data-line-lightbox-next]');
    const backdrop = lb.querySelector('[data-line-lightbox-backdrop]');

    function render(animate) {
      const src = lineGalleryImages[lineLightboxIndex];
      if (!stage || !src) return;
      const t = window.I18N && window.I18N.t ? window.I18N.t : (key, vars) => key;
      const img = new Image();
      img.src = src;
      img.alt = t('common.aria.galleryImage', { index: lineLightboxIndex + 1 });
      stage.innerHTML = '';
      stage.appendChild(img);
      if (animate && !prefersReducedMotion && hasGSAP) {
        gsap.fromTo(img, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: EASE.out3 });
      }
      if (counter) counter.textContent = (lineLightboxIndex + 1) + ' / ' + lineGalleryImages.length;
      const multi = lineGalleryImages.length > 1;
      if (prevBtn) prevBtn.hidden = !multi;
      if (nextBtn) nextBtn.hidden = !multi;
    }

    window.__pitexOpenLineLightbox = function (index) {
      if (!lineGalleryImages.length) return;
      lineLightboxIndex = ((index % lineGalleryImages.length) + lineGalleryImages.length) % lineGalleryImages.length;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      render(false);
      if (closeBtn) closeBtn.focus();
    };

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function step(dir) {
      lineLightboxIndex = ((lineLightboxIndex + dir) % lineGalleryImages.length + lineGalleryImages.length) % lineGalleryImages.length;
      render(true);
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* =======================================================================
     PRODUCTION WORKFLOW — the six production lines shown in the order
     product typically moves through them; each stage maps 1:1 to a
     category slug, so exactly one stage highlights as "You Are Here" on
     every category page. Reuses the .timeline / .timeline-item / .timeline-
     icon primitives from style.css — same component as the About page
     milestones.
     ======================================================================= */
  const PRODUCTION_STAGES = [
    { titleKey: 'common.nav.categories.oliveGrading', icon: 'bi-funnel', categorySlugs: ['olive-grading-line'] },
    { titleKey: 'common.nav.categories.pittingSlicing', icon: 'bi-scissors', categorySlugs: ['pitting-slicing-line'] },
    { titleKey: 'common.nav.categories.pepperCucumber', icon: 'bi-bullseye', categorySlugs: ['pepper-cucumber-perforation-line'] },
    { titleKey: 'common.nav.categories.pickleMixing', icon: 'bi-arrow-repeat', categorySlugs: ['pickle-mixing-line'] },
    { titleKey: 'common.nav.categories.fillingPasteurization', icon: 'bi-thermometer-half', categorySlugs: ['filling-pasteurization-line'] },
    { titleKey: 'common.nav.categories.roasting', icon: 'bi-fire', categorySlugs: ['roasting-line'] },
  ];

  function renderWorkflow(cat) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key) => key;
    const timeline = document.querySelector('[data-workflow-timeline]');
    if (!timeline) return;

    timeline.querySelectorAll('.timeline-item').forEach((el) => el.remove());

    const subtitle = document.querySelector('[data-workflow-subtitle]');
    if (subtitle) {
      subtitle.textContent = t('pages.products.workflowSubtitle', { label: pick(cat.label) });
    }

    const items = PRODUCTION_STAGES.map((stage, i) => {
      const isCurrent = stage.categorySlugs.includes(cat.slug);
      const tag = isCurrent ? '<span class="workflow-current-tag">' + t('pages.products.youAreHere') + '</span>' : '';
      const classes = 'timeline-item' + (isCurrent ? ' is-current' : '');
      const tagAttr = isCurrent ? ' aria-current="step"' : '';

      return '<div class="' + classes + '" role="listitem"' + tagAttr + '>' +
        '<div class="timeline-icon" aria-hidden="true"><i class="bi ' + stage.icon + '"></i></div>' +
        '<div class="timeline-body">' +
        '<span class="timeline-number">' + (i + 1) + '</span>' +
        '<span class="timeline-title">' + t(stage.titleKey) + '</span>' +
        tag +
        '</div></div>';
    }).join('');

    // Keep the connecting line as the first child (already in the markup).
    timeline.insertAdjacentHTML('beforeend', items);
  }

  function initWorkflowEntrance() {
    const section = document.querySelector('.workflow-section');
    if (!section) return;

    const line = section.querySelector('.timeline-line__fill');
    const items = Array.from(section.querySelectorAll('.timeline-item'));
    const header = section.querySelector('.section-header');

    if (prefersReducedMotion || !hasGSAP) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    if (line) gsap.set(line, { scaleX: 0, scaleY: 0 });
    items.forEach((item) => {
      gsap.set(item.querySelector('.timeline-icon'), { scale: 0.4, opacity: 0 });
      gsap.set(item.querySelector('.timeline-number'), { scale: 0, y: 10, opacity: 0 });
      gsap.set(item.querySelector('.timeline-title'), { opacity: 0, y: 10 });
    });

    const isMobileLayout = () => window.innerWidth < 768;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    if (line) tl.to(line, { [isMobileLayout() ? 'scaleY' : 'scaleX']: 1, duration: 1.1 }, header ? '-=0.5' : 0);
    items.forEach((item, i) => {
      tl.to(item.querySelector('.timeline-icon'), { scale: 1, opacity: 1, duration: 0.6 }, 0.3 + i * 0.12)
        .to(item.querySelector('.timeline-number'), { scale: 1, y: 0, opacity: 1, duration: 0.5 }, '<0.05')
        .to(item.querySelector('.timeline-title'), { opacity: 1, y: 0, duration: 0.5 }, '<0.05');
    });
  }

  /* =======================================================================
     MACHINES INCLUDED — clean, minimal grid. Reuses .product-card as-is
     (production-lines.css) for the shell/border/shadow/hover-lift, but
     each card renders ONLY the machine image + name — no description, no
     badges, no button, no link. The site no longer has a separate Product
     Details page, so cards are plain <div>s (not <a>s) and don't navigate
     anywhere; wireProductCards() still gives them the same hover-lift
     image scale used everywhere else .product-card appears.
     ======================================================================= */
  function renderProducts(cat) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return null;

    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key, vars) => key;
    const products = window.PitexProducts.byCategory(cat.slug);
    const label = pick(cat.label);

    const titleEl = document.querySelector('[data-products-title]');
    if (titleEl) titleEl.textContent = t('pages.products.machinesTitle', { label });

    const countEl = document.querySelector('[data-products-count]');
    if (countEl) {
      countEl.textContent = products.length === 0
        ? t('common.misc.machinesComingSoon')
        : products.length === 1
          ? t('common.misc.machineSingular', { count: products.length })
          : t('common.misc.machinePlural', { count: products.length });
    }

    grid.innerHTML = products.map((p) => (
      '<div class="product-card machine-card">' +
        '<div class="product-card__media">' +
          '<img src="' + p.image + '" alt="' + p.alt + '" loading="lazy" width="600" height="450" />' +
          '<div class="product-overlay" aria-hidden="true"></div>' +
          '<div class="card-sweep" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="product-card__body machine-card__body">' +
          '<h3 class="product-title machine-card__title">' + pick(p.title) + '</h3>' +
        '</div>' +
      '</div>'
    )).join('');

    if (window.PitexProducts.wireProductCards) window.PitexProducts.wireProductCards(grid);
    return grid;
  }

  function initMachinesEntrance(grid) {
    if (!grid || prefersReducedMotion || !hasGSAP) return;
    const section = document.querySelector('.products-grid-section');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const cards = Array.from(grid.querySelectorAll('.product-card'));
    if (!cards.length) return;

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    gsap.set(cards, { opacity: 0, y: 50, scale: 0.96 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 1, ease: EASE.expo, stagger: 0.1 }, header ? '-=0.4' : 0);
  }

  /* =======================================================================
     ENTRANCES — same fade/blur/stagger language used across the site.
     The line banner itself (.page-banner) now animates generically via
     page-banner.js — same component as every other internal page — so
     there's no page-specific hero entrance here anymore.
     ======================================================================= */
  function initCtaEntrance() {
    const section = document.querySelector('.cta-band');
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const header = section.querySelector('.section-header');
    const actions = section.querySelector('.cta-band__actions');

    if (header) gsap.set(header, { opacity: 0, y: 30 });
    if (actions) gsap.set(actions, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');
  }

  function initDividers() {
    const dividers = document.querySelectorAll('.section-divider__fill');
    if (!dividers.length) return;

    if (prefersReducedMotion || !hasGSAP) {
      dividers.forEach((d) => { d.style.transform = 'scaleX(1)'; });
      return;
    }

    dividers.forEach((d) => {
      gsap.fromTo(d, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.1,
        ease: EASE.out3,
        scrollTrigger: { trigger: d, start: 'top 85%', once: true },
      });
    });
  }

})();
