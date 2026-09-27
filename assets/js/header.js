/* =========================================================================
   PITEX — header.js
   Owns everything new the header needs: load-in reveal, sticky/compact +
   hide-on-scroll state, active-link tracking, the Solutions mega menu,
   the language switcher, and the mobile fullscreen offcanvas.

   Deliberately does NOT touch button hover/magnetic/ripple — the header's
   CTA uses the shared .btn-primary-custom class, so main.js's existing
   initMagnetic()/initButtonPremium() (which query that class globally)
   already own it. Load this file after main.js.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE_OUT = 'power3.out';

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    initRevealOnLoad(header);
    initScrollState(header);
    initActiveLinkTracking(header);
    initMegaMenu(header);
    initProductionLineActiveState();
    initLanguageSwitch();
    initMobileNav(header);
    initMobileAccordion();
  });

  /* =======================================================================
     LOAD REVEAL — logo → nav → language → button, fade + Y + blur, small
     stagger. Same "fadeBlur" language main.js uses elsewhere.
     ======================================================================= */
  function initRevealOnLoad(header) {
    const logo = header.querySelector('[data-header-logo]');
    const navItems = Array.from(header.querySelectorAll('.site-header__item'));
    const langSwitch = header.querySelector('[data-lang-switch]');
    const cta = header.querySelector('[data-header-cta]');
    const hamburger = header.querySelector('[data-hamburger]');

    if (prefersReducedMotion || !hasGSAP) {
      // No animation path: everything is already visible by default (no
      // inline styles were ever applied), so there's nothing to reset.
      startLogoFloat(logo);
      return;
    }

    const fadeBlur = { opacity: 0, y: -16, filter: 'blur(6px)' };
    gsap.set(logo, fadeBlur);
    gsap.set(navItems, { opacity: 0, y: -14 });
    if (langSwitch) gsap.set(langSwitch, fadeBlur);
    if (cta) gsap.set(cta, fadeBlur);
    if (hamburger) gsap.set(hamburger, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { duration: 0.75, ease: EASE_OUT }, delay: 0.15 });
    tl.to(logo, { opacity: 1, y: 0, filter: 'blur(0px)' })
      .to(navItems, { opacity: 1, y: 0, stagger: 0.06 }, '-=0.5')
      .to(langSwitch, { opacity: 1, y: 0, filter: 'blur(0px)' }, '-=0.45')
      .to(cta, { opacity: 1, y: 0, filter: 'blur(0px)' }, '-=0.5')
      .to(hamburger, { opacity: 1, duration: 0.4 }, '-=0.4');

    startLogoFloat(logo);
  }

  function startLogoFloat(logo) {
    if (!logo || prefersReducedMotion || !hasGSAP) return;
    gsap.to(logo, { y: '+=4', duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
  }

  /* =======================================================================
     SCROLL STATE — the header is fixed and always visible; the only
     thing that changes on scroll is `.is-scrolled`, toggled once past a
     small threshold (compact height + glass background + shadow). A
     lightweight rAF-throttled scroll listener keeps this to one class
     toggle per threshold crossing — no per-frame layout cost, and the
     header itself never hides or moves.
     ======================================================================= */
  function initScrollState(header) {
    const SCROLLED_AT = 30;
    let ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > SCROLLED_AT);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
    initHeaderOffset(header);
  }

  /**
   * The header is `position: fixed`, so it's out of document flow —
   * without this, its content would sit on top of the page's first
   * section. Measures the header's *actual* rendered height (which
   * changes between expanded/compact) and writes it to --header-h so
   * body's padding-top (in header.css) always matches exactly, instead
   * of relying on a guessed pixel constant that drifts if copy/branding
   * changes the header's real height.
   */
  function initHeaderOffset(header) {
    function setOffset() {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    }
    setOffset();

    if ('ResizeObserver' in window) {
      new ResizeObserver(setOffset).observe(header);
    } else {
      window.addEventListener('resize', setOffset);
    }
  }

  /* =======================================================================
     ACTIVE LINK TRACKING — IntersectionObserver keeps the underline on
     whichever nav-mapped section currently owns the viewport center.
     Pure DOM API, so it works with or without GSAP.
     ======================================================================= */
  function initActiveLinkTracking(header) {
    const links = Array.from(header.querySelectorAll('[data-nav-link], [data-mega-trigger]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute('data-section');
      const section = id && document.getElementById(id);
      if (section) map.set(section, link);
    });
    if (!map.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const activeLink = map.get(entry.target);
          if (!activeLink) return;
          links.forEach((l) => l.classList.remove('is-active'));
          activeLink.classList.add('is-active');
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    map.forEach((_, section) => observer.observe(section));
  }

  /* =======================================================================
     PRODUCTION LINE ACTIVE STATE — the Production Lines dropdown routes
     to products.html?category=<slug>, a single shared template for six
     different pages, so (unlike every other nav item) the "current page"
     can't be baked into the HTML at build time. On load, read the URL and
     mark the matching trigger + dropdown item active — desktop mega-menu
     and mobile submenu both, since each keeps its own markup.
     ======================================================================= */
  function initProductionLineActiveState() {
    const path = (window.location.pathname.split('/').pop() || 'index.html');
    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get('category');

    const onOverviewPage = path === 'production-lines.html';
    const onCategoryPage = path === 'products.html' && !!categorySlug;
    if (!onOverviewPage && !onCategoryPage) return;

    // Highlight both link forms (desktop label link + mobile label
    // link) — target by stable id rather than aria-controls, since the
    // desktop trigger is now a separate icon-only toggle button and no
    // longer carries the visible label.
    document
      .querySelectorAll('#navProductionLines, #navProductionLinesMobile')
      .forEach((link) => link.classList.add('is-active'));

    if (!onCategoryPage) return;

    // Highlight the specific line — matches on the href's query string so
    // it works regardless of how the rest of the URL is formed.
    document
      .querySelectorAll(
        '#productionLinesMenu a[href*="category=' + categorySlug + '"], ' +
        '#mobileProductionLinesMenu a[href*="category=' + categorySlug + '"]'
      )
      .forEach((item) => item.classList.add('is-active'));
  }

  /* =======================================================================
     MEGA MENU — hover (desktop, with a short open-delay to avoid
     accidental triggers while the cursor passes over the nav, and a
     short close-delay to avoid flicker when moving into the panel) +
     click/keyboard toggle, Escape to close, click-outside to close.
     Generalized to support every `[data-mega-item]` in the header
     (Company, Production Lines, ...) — each gets its own isolated
     open/close timers so hovering one never affects another.
     ======================================================================= */
  function initMegaMenu(header) {
    const items = Array.from(header.querySelectorAll('[data-mega-item]'));
    items.forEach(setupMegaItem);

    function setupMegaItem(item) {
      const trigger = item.querySelector('[data-mega-trigger]');
      const panel = item.querySelector('[data-mega-panel]');
      // Present only on items where the parent label is itself a real
      // page link (Production Lines) rather than a toggle-only button
      // (Company) — lets ArrowDown open the panel from the link without
      // triggering navigation.
      const navLink = item.querySelector('[data-mega-link]');
      if (!trigger || !panel) return;

      let openTimer = null;
      let closeTimer = null;
      const menuItems = () => Array.from(panel.querySelectorAll('[role="menuitem"]'));

      function open() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function close() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function scheduleOpen() {
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        openTimer = setTimeout(open, 120);
      }
      function scheduleClose() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 180);
      }

      item.addEventListener('mouseenter', scheduleOpen);
      item.addEventListener('mouseleave', scheduleClose);

      trigger.addEventListener('click', () => {
        item.classList.contains('is-open') ? close() : open();
      });

      // Enter/Space/ArrowDown open the panel and move focus inside it —
      // the standard "menu button" keyboard pattern.
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
          menuItems()[0]?.focus();
        }
      });

      // If the label is also a real link, ArrowDown opens the panel and
      // moves focus inside it too — but Enter/Space are left alone so
      // the link still navigates normally.
      if (navLink) {
        navLink.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            open();
            menuItems()[0]?.focus();
          }
        });
      }

      // Arrow keys cycle focus between items inside the open panel;
      // Escape closes and returns focus to the trigger.
      panel.addEventListener('keydown', (e) => {
        const menu = menuItems();
        const currentIndex = menu.indexOf(document.activeElement);

        if (e.key === 'Escape') {
          close();
          trigger.focus();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          menu[(currentIndex + 1) % menu.length]?.focus();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          menu[(currentIndex - 1 + menu.length) % menu.length]?.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (!item.contains(e.target)) close();
      });
    }
  }

  /* =======================================================================
     LANGUAGE SWITCH — toggle dropdown, select a language, close on
     outside click / Escape. UI-only: no i18n system exists yet, so this
     just swaps the displayed label pending real translations.
     ======================================================================= */
  function initLanguageSwitch() {
    const switches = document.querySelectorAll('[data-lang-switch]');

    switches.forEach((switchEl) => {
      const trigger = switchEl.querySelector('[data-lang-trigger]');
      const menu = switchEl.querySelector('[data-lang-menu]');
      const currentLabel = switchEl.querySelector('[data-lang-current]');
      if (!trigger || !menu) return;

      function close() {
        switchEl.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function toggle() {
        const isOpen = switchEl.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      }

      trigger.addEventListener('click', toggle);

      menu.querySelectorAll('button[data-lang]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (currentLabel) currentLabel.textContent = btn.getAttribute('data-lang').toUpperCase();
          menu.querySelectorAll('button[data-lang]').forEach((b) => {
            b.closest('[role="option"]')?.setAttribute('aria-selected', 'false');
          });
          btn.closest('[role="option"]')?.setAttribute('aria-selected', 'true');
          close();
        });
      });

      document.addEventListener('click', (e) => {
        if (!switchEl.contains(e.target)) close();
      });
      switchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          close();
          trigger.focus();
        }
      });
    });

    // Mobile offcanvas language pills (plain group, no dropdown).
    document.querySelectorAll('.mobile-nav__lang button[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav__lang button[data-lang]').forEach((b) =>
          b.setAttribute('aria-selected', 'false')
        );
        btn.setAttribute('aria-selected', 'true');
      });
    });
  }

  /* =======================================================================
     MOBILE ACCORDION — tap-to-expand Company submenu inside the offcanvas.
     Height animation lives entirely in CSS (grid-template-rows trick);
     this just toggles the class + aria-expanded.
     ======================================================================= */
  function initMobileAccordion() {
    document.querySelectorAll('[data-mobile-group]').forEach((group) => {
      const toggle = group.querySelector('[data-mobile-toggle]');
      if (!toggle) return;

      toggle.addEventListener('click', () => {
        const isExpanded = group.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', String(isExpanded));
      });
    });
  }

  /* =======================================================================
     MOBILE FULLSCREEN OFFCANVAS — hamburger toggle, backdrop/link close,
     Escape close, focus trap while open, body scroll lock.
     ======================================================================= */
  function initMobileNav() {
    const hamburger = document.querySelector('[data-hamburger]');
    const nav = document.querySelector('[data-mobile-nav]');
    if (!hamburger || !nav) return;

    const backdrop = nav.querySelector('[data-mobile-backdrop]');
    const closeBtn = nav.querySelector('[data-mobile-close]');
    const panel = nav.querySelector('.mobile-nav__panel');
    const links = Array.from(nav.querySelectorAll('[data-mobile-link]'));
    let lastFocused = null;

    function focusablesIn(el) {
      return Array.from(
        el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
    }

    function open() {
      lastFocused = document.activeElement;
      nav.classList.add('is-open');
      nav.setAttribute('aria-hidden', 'false');
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('mobile-nav-open');
      const focusables = focusablesIn(panel);
      if (focusables.length) focusables[0].focus();
    }

    function close() {
      nav.classList.remove('is-open');
      nav.setAttribute('aria-hidden', 'true');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('mobile-nav-open');
      if (lastFocused) lastFocused.focus();
    }

    hamburger.addEventListener('click', () => {
      nav.classList.contains('is-open') ? close() : open();
    });
    if (backdrop) backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    links.forEach((link) => link.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
      if (!nav.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        close();
        return;
      }

      // Simple focus trap.
      if (e.key === 'Tab') {
        const focusables = focusablesIn(panel);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Collapse the mobile nav if the viewport grows into desktop range
    // (e.g. rotating a tablet), so it never gets stuck open behind the
    // now-visible desktop nav.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991.98 && nav.classList.contains('is-open')) close();
    });
  }
})();
