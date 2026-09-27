/* =========================================================================
   PITEX — page-transition.js
   Shared "premium" navigation used whenever a card should visibly scale
   and the background should fade before the browser actually changes
   page (category cards on production-lines.html, product cards on
   products.html). One overlay, created lazily and reused — never
   duplicate this element or this timeline per page.
   ========================================================================= */

window.PitexTransition = (function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  function ensureOverlay() {
    let overlay = document.getElementById('pageTransitionOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pageTransitionOverlay';
      overlay.className = 'page-transition-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '<i class="bi bi-gear-fill page-transition-overlay__gear"></i>';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  /**
   * @param {string} url        destination to navigate to
   * @param {HTMLElement} [originEl] the card that was clicked, scaled
   *   slightly before the overlay covers it
   */
  function navigate(url, originEl) {
    if (!url) return;

    if (prefersReducedMotion || !hasGSAP) {
      window.location.href = url;
      return;
    }

    const overlay = ensureOverlay();
    const gear = overlay.querySelector('.page-transition-overlay__gear');

    overlay.classList.add('is-active');
    gsap.set(overlay, { opacity: 0 });
    gsap.set(gear, { rotate: 0, scale: 0.8, opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => { window.location.href = url; },
    });

    if (originEl) {
      gsap.set(originEl, { transformOrigin: 'center', zIndex: 5 });
      tl.to(originEl, { scale: 1.045, duration: 0.35, ease: 'power2.out' }, 0);
    }

    tl.to(overlay, { opacity: 1, duration: 0.5 }, originEl ? 0.08 : 0);
    tl.to(gear, { opacity: 1, scale: 1, rotate: 200, duration: 0.6, ease: 'power2.out' }, '-=0.35');
  }

  return { navigate };
})();
