/* =========================================================================
   PITEX — product-details.js
   Drives the single reusable Product Details template (product-details.html).
   Reads `?id=<productId>` from the URL, looks the product up in
   products-data.js, and renders every dynamic piece of the page from that
   one record — nothing here is hardcoded per product. Related-product
   cards and their hover/tilt/favorite wiring reuse the exact same
   renderProductCard()/wireProductCards() used on products.html and
   index.html (products-data.js) — never duplicated. Falls back to the
   first product in the catalog if the URL has none/an unknown id, so the
   template never renders blank.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out', back: 'back.out(1.7)' };

  // Bilingual-field helper, available to every function below via closure.
  // Falls back to returning the value unchanged if it's already a plain
  // string (so this file never breaks on a field that hasn't been
  // converted to { en, ar } yet).
  const pick = (v) => (window.I18N && window.I18N.pick ? window.I18N.pick(v) : (typeof v === 'string' ? v : (v && v.en) || ''));
  // Stable-key helper: for logic that BRANCHES on a bilingual field's
  // value (e.g. "is this in stock?"), always compare the English key,
  // never the currently-displayed translation — the English value is the
  // stable internal identifier regardless of UI language.
  const enKey = (v) => (typeof v === 'string' ? v : (v && v.en) || '');
  const labelFor = (dict, key) => (window.PitexProducts && window.PitexProducts.labelFor ? window.PitexProducts.labelFor(dict, key) : key);

  let product = null;
  let galleryImages = [];
  let currentIndex = 0;
  let lightboxIndex = 0;

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.PitexProducts) return;

    product = resolveProduct();
    if (!product) return;
    galleryImages = (product.images && product.images.length ? product.images : [product.image]);

    let relatedGrid = null;

    function paint() {
      populateHero(product);
      populateInfo(product);
      renderSpecifications(product);
      renderFeatures(product);
      renderAboutCards(product);
      relatedGrid = renderRelated(product);
      wireProductNavigation(relatedGrid);
      if (window.PitexQuoteModal) window.PitexQuoteModal.init(product);
    }

    populateShowcase(product);
    paint();
    renderGallery(product);

    initLightbox();
    initShowcaseInteractions();
    initScrollProgress();
    initFloatingShapes();
    preloadGalleryImages();

    initHeroEntrance();
    initShowcaseEntrance();
    initGridEntrance('.specs-table-wrap', '.specs-section');
    initGridEntrance('.features-grid .feat-card', '.features-details-section');
    initGridEntrance('.about-card', '.about-part-section');
    initGridEntrance('.gallery-masonry__item', '.gallery-details-section');
    initGridEntrance(relatedGrid ? relatedGrid.querySelectorAll('.product-card') : [], '.related-details-section');
    initCtaEntrance();
    initDividers();
    initScrollIndicator();

    // Dynamic-content requirement: re-paint all product text (specs,
    // features, related-product cards, quote modal…) on language switch —
    // no re-fetch, no re-animation.
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(() => {
        paint();
        window.I18N.snapReveal(document.body);
      });
    }
  });

  function resolveProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return window.PitexProducts.getProductById(id) || window.PitexProducts.data[0] || null;
  }

  /* =======================================================================
     HERO — breadcrumb, badge, title, description, status pill, background.
     ======================================================================= */
  function populateHero(p) {
    document.title = pick(p.title) + ' | PITEX Production Lines';

    const breadcrumbCat = document.querySelector('[data-breadcrumb-category]');
    if (breadcrumbCat) {
      breadcrumbCat.textContent = pick(p.categoryLabel);
      breadcrumbCat.setAttribute('href', 'products.html?category=' + p.category);
    }
    const breadcrumbProduct = document.querySelector('[data-breadcrumb-product]');
    if (breadcrumbProduct) breadcrumbProduct.textContent = pick(p.title);

    const bg = document.querySelector('[data-hero-bg]');
    if (bg) { bg.src = p.image; bg.alt = p.alt; }

    const title = document.querySelector('[data-hero-title]');
    if (title) {
      const words = pick(p.title).split(' ');
      const last = words.pop();
      title.innerHTML = words.join(' ') + ' <span class="text-accent">' + last + '</span>';
    }

    const desc = document.querySelector('[data-hero-desc]');
    if (desc) desc.textContent = pick(p.description);

    const statusEl = document.querySelector('[data-hero-status]');
    if (statusEl) {
      if (pick(p.status)) {
        statusEl.hidden = false;
        statusEl.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> ' + pick(p.status);
      } else {
        statusEl.hidden = true;
      }
    }
  }

  /* =======================================================================
     PRODUCT SHOWCASE — main image, thumbnails, prev/next, keyboard,
     swipe, counter, spotlight, skeleton preloading.
     ======================================================================= */
  function populateShowcase(p) {
    const track = document.querySelector('[data-showcase-track]');
    if (track) {
      track.innerHTML = galleryImages
        .map((src, i) => '<img src="' + src + '" alt="' + pick(p.title) + ' — view ' + (i + 1) + '" ' +
          'loading="' + (i === 0 ? 'eager' : 'lazy') + '" style="opacity:' + (i === 0 ? '1' : '0') + '" />')
        .join('');
    }

    const thumbs = document.querySelector('[data-showcase-thumbs]');
    if (thumbs) {
      if (galleryImages.length > 1) {
        thumbs.innerHTML = galleryImages
          .map((src, i) => '<button type="button" class="showcase-thumb' + (i === 0 ? ' is-active' : '') +
            '" data-showcase-thumb data-index="' + i + '" aria-label="View image ' + (i + 1) + ' of ' + galleryImages.length + '">' +
            '<img src="' + src + '" alt="" loading="lazy" /></button>')
          .join('');
      } else {
        thumbs.hidden = true;
      }
    }

    const counter = document.querySelector('[data-showcase-counter]');
    if (counter) {
      if (galleryImages.length > 1) {
        counter.hidden = false;
        counter.textContent = '1 / ' + galleryImages.length;
      } else {
        counter.hidden = true;
      }
    }

    const prevBtn = document.querySelector('[data-showcase-prev]');
    const nextBtn = document.querySelector('[data-showcase-next]');
    [prevBtn, nextBtn].forEach((btn) => { if (btn) btn.hidden = galleryImages.length <= 1; });

    currentIndex = 0;
  }

  function goToShowcaseIndex(index) {
    if (!galleryImages.length) return;
    const next = (index + galleryImages.length) % galleryImages.length;
    if (next === currentIndex) return;

    const track = document.querySelector('[data-showcase-track]');
    const imgs = track ? track.querySelectorAll('img') : [];
    const outgoing = imgs[currentIndex];
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

    document.querySelectorAll('[data-showcase-thumb]').forEach((t) => {
      t.classList.toggle('is-active', Number(t.dataset.index) === next);
    });

    const counter = document.querySelector('[data-showcase-counter]');
    if (counter && !counter.hidden) counter.textContent = (next + 1) + ' / ' + galleryImages.length;

    currentIndex = next;
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

    document.querySelectorAll('[data-showcase-thumb]').forEach((t) => {
      t.addEventListener('click', () => goToShowcaseIndex(Number(t.dataset.index)));
    });

    const prevBtn = document.querySelector('[data-showcase-prev]');
    const nextBtn = document.querySelector('[data-showcase-next]');
    if (prevBtn) prevBtn.addEventListener('click', () => goToShowcaseIndex(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToShowcaseIndex(currentIndex + 1));

    // Keyboard navigation when the showcase has focus.
    main.setAttribute('tabindex', '0');
    main.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goToShowcaseIndex(currentIndex - 1);
      if (e.key === 'ArrowRight') goToShowcaseIndex(currentIndex + 1);
      if (e.key === 'Enter') openLightbox(currentIndex);
    });

    // Swipe support on mobile.
    let touchStartX = 0;
    main.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) goToShowcaseIndex(currentIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Click opens the fullscreen lightbox.
    main.addEventListener('click', () => openLightbox(currentIndex));

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
     PRODUCT INFO PANEL — name, category, description, badges, icon list.
     ======================================================================= */
  function populateInfo(p) {
    const category = document.querySelector('[data-info-category]');
    if (category) category.textContent = pick(p.categoryLabel);

    const title = document.querySelector('[data-info-title]');
    if (title) title.textContent = pick(p.title);

    const desc = document.querySelector('[data-info-desc]');
    if (desc) desc.textContent = pick(p.longDescription) || pick(p.description);

    const badges = document.querySelector('[data-info-badges]');
    if (badges) {
      const parts = [];
      parts.push('<span class="status-pill status-pill--category">' + pick(p.categoryLabel) + '</span>');
      if (pick(p.availability)) {
        const inStock = enKey(p.availability) === 'In Stock';
        parts.push('<span class="status-pill ' + (inStock ? 'status-pill--available' : 'status-pill--order') + '">' +
          '<i class="bi ' + (inStock ? 'bi-check-circle-fill' : 'bi-clock-history') + '" aria-hidden="true"></i>' + pick(p.availability) + '</span>');
      }
      if (p.exportReady) {
        parts.push('<span class="status-pill status-pill--export"><i class="bi bi-globe2" aria-hidden="true"></i>Export Ready</span>');
      }
      if (pick(p.warranty)) {
        parts.push('<span class="status-pill status-pill--warranty"><i class="bi bi-patch-check-fill" aria-hidden="true"></i>' + pick(p.warranty) + '</span>');
      }
      badges.innerHTML = parts.join('');
    }

    const iconList = document.querySelector('[data-info-icon-list]');
    if (iconList && p.specifications && p.specifications.length) {
      const specLabels = (window.PitexProducts && window.PitexProducts.SPEC_LABELS) || {};
      iconList.innerHTML = p.specifications.slice(0, 3).map((s) => {
        const icon = (window.PitexProducts.SPEC_ICONS && window.PitexProducts.SPEC_ICONS[s.label]) || 'bi-check-circle';
        return '<div class="feature-item"><span class="feature-item__icon" aria-hidden="true"><i class="bi ' + icon + '"></i></span>' +
          '<div><h4 class="feature-item__title">' + labelFor(specLabels, s.label) + '</h4><p class="feature-item__text">' + s.value + '</p></div></div>';
      }).join('');
    }
  }

  /* =======================================================================
     SPECIFICATIONS — elegant cards, not paragraphs.
     ======================================================================= */
  function renderSpecifications(p) {
    const tbody = document.querySelector('[data-specs-table]');
    if (!tbody || !p.specifications) return;

    const specLabels = (window.PitexProducts && window.PitexProducts.SPEC_LABELS) || {};
    tbody.innerHTML = p.specifications.map((s) =>
      '<tr><td class="specs-table__label">' + labelFor(specLabels, s.label) + '</td><td class="specs-table__value">' + s.value + '</td></tr>'
    ).join('');
  }

  /* =======================================================================
     FEATURES — premium grid with animated icons (tilt comes free from
     initCardTilt() in main.js, which targets .feature-card).
     ======================================================================= */
  function renderFeatures(p) {
    const grid = document.querySelector('[data-features-grid]');
    if (!grid || !p.features) return;

    const featureLabels = (window.PitexProducts && window.PitexProducts.FEATURE_LABELS) || {};
    grid.innerHTML = p.features.map((f) =>
      '<div class="col-12 col-sm-6 col-lg-4">' +
      '<article class="card feature-card feat-card shadow-sm-custom radius-lg h-100">' +
      '<div class="card-icon" aria-hidden="true"><i class="bi ' + f.icon + '"></i></div>' +
      '<h3 class="card-title">' + labelFor(featureLabels, f.title) + '</h3>' +
      '<p class="card-text">' + pick(f.text) + '</p>' +
      '</article></div>'
    ).join('');
  }

  /* =======================================================================
     ABOUT THIS SPARE PART — four cards (Applications, Industries Served,
     Manufacturing Quality, Export Information), built from the product
     record so nothing here is hardcoded per product.
     ======================================================================= */
  function renderAboutCards(p) {
    const wrap = document.querySelector('[data-about-grid]');
    if (!wrap) return;

    const t = window.I18N && window.I18N.t ? window.I18N.t : (key, vars) => key;
    const lang = window.I18N && window.I18N.getLanguage ? window.I18N.getLanguage() : 'en';
    const listSep = lang === 'ar' ? '، ' : ', ';

    const applicationsText = (p.applications && p.applications.length)
      ? t('pages.productDetails.aboutCards.applicationsText', {
          list: p.applications.slice(0, 3).map(pick).join(listSep).toLowerCase(),
          category: (pick(p.categoryLabel) || 'production').toLowerCase(),
        })
      : (pick(p.longDescription) || pick(p.description) || '');

    const materialSpec = (p.specifications || []).find((s) => s.label === 'Material');
    const qualityText = materialSpec
      ? t('pages.productDetails.aboutCards.qualityTextWithMaterial', { material: materialSpec.value })
      : t('pages.productDetails.aboutCards.qualityTextGeneric');

    const exportText = p.exportReady
      ? t('pages.productDetails.aboutCards.exportTextReady')
      : t('pages.productDetails.aboutCards.exportTextOnRequest');

    const cards = [
      { icon: 'bi-gear-wide-connected', title: t('pages.productDetails.aboutCards.applicationsTitle'), text: applicationsText },
      { icon: 'bi-diagram-3', title: t('pages.productDetails.aboutCards.industriesTitle'), text: t('pages.productDetails.aboutCards.industriesText') },
      { icon: 'bi-shield-check', title: t('pages.productDetails.aboutCards.qualityTitle'), text: qualityText },
      { icon: 'bi-truck', title: t('pages.productDetails.aboutCards.exportTitle'), text: exportText },
    ];

    wrap.innerHTML = cards.map((c) =>
      '<div class="about-card gsap-stagger-item">' +
      '<div class="about-card__icon" aria-hidden="true"><i class="bi ' + c.icon + '"></i></div>' +
      '<div><h3 class="about-card__title">' + c.title + '</h3><p class="about-card__text">' + c.text + '</p></div>' +
      '</div>'
    ).join('');
  }

  /* =======================================================================
     PRODUCT GALLERY — responsive masonry of every image, opens the same
     lightbox as the main showcase.
     ======================================================================= */
  function renderGallery(p) {
    const wrap = document.querySelector('[data-gallery-masonry]');
    if (!wrap) return;

    if (galleryImages.length < 2) {
      const section = document.querySelector('.gallery-details-section');
      if (section) section.hidden = true;
      return;
    }

    wrap.innerHTML = galleryImages.map((src, i) =>
      '<figure class="gallery-masonry__item" data-gallery-item data-index="' + i + '" tabindex="0" role="button" ' +
      'aria-label="Open image ' + (i + 1) + ' of ' + galleryImages.length + ' in fullscreen">' +
      '<img src="' + src + '" alt="' + pick(p.title) + ' — gallery image ' + (i + 1) + '" loading="lazy" />' +
      '<figcaption class="gallery-masonry__overlay"><span class="gallery-masonry__view" aria-hidden="true"><i class="bi bi-arrows-fullscreen"></i></span></figcaption>' +
      '</figure>'
    ).join('');

    wrap.querySelectorAll('[data-gallery-item]').forEach((item) => {
      item.addEventListener('click', () => openLightbox(Number(item.dataset.index)));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(Number(item.dataset.index)); }
      });
    });
  }

  function preloadGalleryImages() {
    galleryImages.forEach((src) => { const img = new Image(); img.src = src; });
  }

  /* =======================================================================
     RELATED PRODUCTS — same category first, same renderProductCard()/
     wireProductCards() component used everywhere else.
     ======================================================================= */
  function renderRelated(p) {
    const grid = document.getElementById('relatedDetailsGrid');
    if (!grid) return null;

    const related = window.PitexProducts.getSameCategoryProducts(p.id, 3);
    grid.innerHTML = related
      .map((item) => window.PitexProducts.renderProductCard(item, { ctaLabel: 'View Details', showBadges: true }))
      .join('');

    window.PitexProducts.wireProductCards(grid);
    return grid;
  }

  function wireProductNavigation(grid) {
    if (!grid) return;
    grid.querySelectorAll('[data-product-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = link.getAttribute('data-product-id');
        const card = link.closest('.product-card');
        if (window.PitexTransition) {
          window.PitexTransition.navigate('product-details.html?id=' + id, card);
        } else {
          window.location.href = 'product-details.html?id=' + id;
        }
      });
    });
  }

  /* =======================================================================
     LIGHTBOX — fullscreen viewer shared by the showcase and the gallery.
     ======================================================================= */
  function initLightbox() {
    const lb = document.getElementById('productLightbox');
    if (!lb) return;

    const stage = lb.querySelector('[data-lightbox-stage]');
    const counter = lb.querySelector('[data-lightbox-counter]');
    const closeBtn = lb.querySelector('[data-lightbox-close]');
    const prevBtn = lb.querySelector('[data-lightbox-prev]');
    const nextBtn = lb.querySelector('[data-lightbox-next]');
    const backdrop = lb.querySelector('[data-lightbox-backdrop]');

    function render(animate) {
      const src = galleryImages[lightboxIndex];
      if (!stage) return;
      const img = new Image();
      img.src = src;
      img.alt = product ? pick(product.title) + ' — image ' + (lightboxIndex + 1) : '';
      stage.innerHTML = '';
      stage.appendChild(img);
      if (animate && !prefersReducedMotion && hasGSAP) {
        gsap.fromTo(img, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: EASE.out3 });
      }
      if (counter) counter.textContent = (lightboxIndex + 1) + ' / ' + galleryImages.length;
      const multi = galleryImages.length > 1;
      if (prevBtn) prevBtn.hidden = !multi;
      if (nextBtn) nextBtn.hidden = !multi;
    }

    window.__pitexOpenLightbox = function (index) {
      lightboxIndex = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      render(false);
      if (closeBtn) closeBtn.focus();
    };

    window.__pitexCloseLightbox = function () {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    function step(dir) {
      lightboxIndex = ((lightboxIndex + dir) % galleryImages.length + galleryImages.length) % galleryImages.length;
      render(true);
    }

    if (closeBtn) closeBtn.addEventListener('click', window.__pitexCloseLightbox);
    if (backdrop) backdrop.addEventListener('click', window.__pitexCloseLightbox);
    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') window.__pitexCloseLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function openLightbox(index) {
    if (window.__pitexOpenLightbox) window.__pitexOpenLightbox(index);
  }

  /* =======================================================================
     SCROLL PROGRESS INDICATOR
     ======================================================================= */
  function initScrollProgress() {
    const fill = document.querySelector('[data-scroll-progress-fill]');
    if (!fill) return;

    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.width = pct + '%';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* =======================================================================
     FLOATING DECORATIVE SHAPES — idle drift in the hero.
     ======================================================================= */
  function initFloatingShapes() {
    const shapes = document.querySelectorAll('.floating-shape');
    if (!shapes.length || prefersReducedMotion || !hasGSAP) return;

    shapes.forEach((shape, i) => {
      gsap.to(shape, {
        y: 22 + i * 6,
        x: i % 2 === 0 ? 14 : -14,
        rotate: i % 2 === 0 ? 12 : -12,
        duration: 6 + i * 1.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }

  /* =======================================================================
     ANIMATED SECTION DIVIDERS
     ======================================================================= */
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

  /* =======================================================================
     ENTRANCES — same fade/blur/stagger language used across the site.
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

    const bg = hero.querySelector('.page-hero__bg img');
    if (bg) {
      gsap.to(bg, {
        y: 60,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    const tl = gsap.timeline({ defaults: { ease: EASE.out3 }, delay: 0.2 });
    if (particles) tl.to(particles, { opacity: 1, duration: 1.2, ease: 'sine.out' }, 0);
    tl.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.1);
  }

  function initShowcaseEntrance() {
    const section = document.querySelector('.showcase-section');
    if (!section || prefersReducedMotion || !hasGSAP) return;

    const media = section.querySelector('.showcase-media');
    const info = section.querySelector('.showcase-info');
    const infoEls = info ? info.children : [];

    if (media) gsap.set(media, { opacity: 0, x: -40 });
    if (info) gsap.set(infoEls, { opacity: 0, y: 26 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (media) tl.to(media, { opacity: 1, x: 0, duration: 1.1 }, 0);
    if (info) tl.to(infoEls, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.15);
  }

  function initGridEntrance(itemsOrSelector, sectionSelector) {
    if (prefersReducedMotion || !hasGSAP) return;
    const section = document.querySelector(sectionSelector);
    if (!section || section.hidden) return;

    const items = typeof itemsOrSelector === 'string'
      ? Array.from(section.querySelectorAll(itemsOrSelector))
      : Array.from(itemsOrSelector || []);
    if (!items.length) return;

    const header = section.querySelector('.section-header');
    if (header) gsap.set(header, { opacity: 0, y: 30 });
    gsap.set(items, { opacity: 0, y: 40, scale: 0.95, filter: 'blur(6px)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      defaults: { ease: EASE.out3 },
    });

    if (header) tl.to(header, { opacity: 1, y: 0, duration: 1 }, 0);
    tl.to(items, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: EASE.expo, stagger: 0.07 }, header ? '-=0.4' : 0);
  }

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

  function initScrollIndicator() {
    const btn = document.querySelector('[data-scroll-indicator]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const target = document.getElementById('showcase');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
})();
