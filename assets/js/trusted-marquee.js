/* =========================================================================
   PITEX — trusted-marquee.js
   Renders the homepage "Trusted by Industry Leaders" marquee from
   window.PITEX_PARTNERS (assets/js/partners-data.js — load that script
   first). Two identical groups are rendered back-to-back so the CSS
   `trusted-marquee-scroll` keyframe (style.css) can loop seamlessly at
   the 50% mark; the second group is aria-hidden as a duplicate.

   The marquee's continuous scroll + hover-to-pause are pure CSS
   (style.css) — this file only owns building the card markup.
   ========================================================================= */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', renderTrustedMarquee);

  function renderTrustedMarquee() {
    const track = document.getElementById('trustedMarqueeTrack');
    if (!track || !Array.isArray(window.PITEX_PARTNERS) || !window.PITEX_PARTNERS.length) return;

    const groupHTML = (hidden) => `
      <div class="trusted-marquee__group" data-trusted-group${hidden ? ' aria-hidden="true"' : ''}>
        ${window.PITEX_PARTNERS.map((partner) => `
          <div class="trusted-card" tabindex="${hidden ? '-1' : '0'}">
            <div class="card-sweep" aria-hidden="true"></div>
            <img
              class="trusted-card__logo-img"
              src="${partner.logo}"
              alt="${escapeAttr(partner.name)} logo"
              loading="lazy"
              onerror="this.closest('.trusted-card').classList.add('trusted-card--empty'); this.remove();"
            >
          </div>
        `).join('')}
      </div>
    `;

    track.innerHTML = groupHTML(false) + groupHTML(true);
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
})();
