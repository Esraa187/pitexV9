/* =========================================================================
   PITEX — export-map.js
   Global Export Map section. Renders a vector (SVG) dot-matrix world map
   from plain lon/lat data, draws animated export routes from PITEX HQ to
   each location in window.PitexExportMap.locations, and wires up
   hover/click/keyboard marker popups. Countries can be added or removed
   by editing export-map-data.js only — nothing here needs to change.

   Follows the same conventions as the rest of the site's page-specific
   scripts (hero.js, header.js, production-lines.js): a self-contained
   IIFE, prefersReducedMotion + hasGSAP guards, the shared EASE language,
   and a scroll-triggered reveal timeline built with GSAP + ScrollTrigger
   (already registered by main.js, loaded first).
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const EASE = { out3: 'power3.out', out4: 'power4.out', expo: 'expo.out', back: 'back.out(1.8)' };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Resolves a bilingual { en, ar } field (or a plain string, untouched)
  // against the currently active language via the shared LanguageManager
  // — the same helper products-data.js / categories-data.js use, so the
  // map follows the site's one localization system instead of inventing
  // its own. Falls back to the field itself if I18N hasn't loaded yet.
  function pick(field) {
    if (window.I18N && typeof window.I18N.pick === 'function') return window.I18N.pick(field);
    if (field === null || field === undefined) return '';
    return typeof field === 'string' ? field : field.en || '';
  }

  // Equirectangular projection tuned to a 1000x500 viewBox, cropped to
  // roughly -58..78 latitude so Antarctica's empty space isn't wasted.
  const VB_W = 1000;
  const VB_H = 500;
  const LAT_MAX = 78;
  const LAT_MIN = -58;

  function project([lon, lat]) {
    const x = ((lon + 180) / 360) * VB_W;
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H;
    return [x, y];
  }

  // -------------------------------------------------------------------
  // DESKTOP vs MOBILE VIEW WINDOW
  //
  // The map is a single, unchanged equirectangular projection (project(),
  // above) — desktop and mobile never get different data or different
  // marker coordinates. What differs is which *rectangle* of that
  // projection each breakpoint asks the SVG (and every HTML marker/label
  // layered on top of it) to display:
  //
  //   WORLD_VIEW  — the entire 1000x500 viewBox. Desktop and tablet use
  //                 this untouched, so the complete world map stays
  //                 visible; only the stage's own CSS width/height grows
  //                 to make that same full map bigger on screen.
  //
  //   MOBILE_VIEW — a sub-rectangle covering Europe + North Africa + the
  //                 Mediterranean + the Middle East (where every PITEX
  //                 location sits), computed from a lon/lat box via the
  //                 same project() used for markers so it always lines
  //                 up exactly. Below 768px the SVG's viewBox is swapped
  //                 to this rectangle — the browser then scales that
  //                 smaller region up to fill the stage, which is the
  //                 "zoom" — while HQ/markers/land keep their real,
  //                 unmoved geographic coordinates.
  //
  // MOBILE MAP FIX — root cause & rationale (why a view window at all)
  //
  // Every marker/label/popup is a plain HTML element layered on top of
  // the SVG, positioned with `left/top` as a *percentage of the stage
  // element*. That only lines up with what the SVG actually draws as
  // long as the stage's own aspect ratio matches the *visible viewBox
  // rectangle's* aspect ratio exactly — true by construction on desktop
  // (whole 1000:500 box, stage kept at that same ratio), but not once a
  // taller mobile stage (more breathing room for labels) or a cropped
  // mobile viewBox (the zoom above) enters the picture. "meet" just
  // letterboxes the mismatch, scaling to fit and centering — but a raw
  // left/top percentage of the *full* stage ignores that letterbox
  // offset, so markers/labels drift away from the coastline they're
  // supposed to sit on.
  //
  // The fix: replicate the SVG's own "meet" math in JS (contentBox) for
  // *whichever* view window is currently active, and convert a viewBox
  // coordinate to a percentage of the stage through that same math
  // (projectToStagePct). At the exact aspect ratio match, offsetX/offsetY
  // come out to 0; at any other ratio, or any other view window, it
  // stays pixel-accurate. This makes the map correct at any stage aspect
  // ratio *and* any view window, so neither can regress again if either
  // is tweaked further.
  // -------------------------------------------------------------------
  const WORLD_VIEW = { x: 0, y: 0, w: VB_W, h: VB_H };

  // Lon/lat box loosely bounding every PITEX location + HQ, with margin
  // for label breathing room. Kept in degrees (not raw viewBox numbers)
  // so it stays readable/adjustable on its own if locations change.
  const MOBILE_FOCUS_GEO = { lonMin: -24, lonMax: 58, latMin: 10, latMax: 60 };

  function computeMobileView() {
    const [x0, y0] = project([MOBILE_FOCUS_GEO.lonMin, MOBILE_FOCUS_GEO.latMax]);
    const [x1, y1] = project([MOBILE_FOCUS_GEO.lonMax, MOBILE_FOCUS_GEO.latMin]);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const MOBILE_VIEW = computeMobileView();

  // Matches export-map.css's `@media (max-width: 767.98px)` mobile
  // breakpoint exactly — the only place the zoomed view window applies.
  // Tablet and desktop always use WORLD_VIEW (the full world).
  const MOBILE_BREAKPOINT = 767.98;
  function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }
  function currentView() {
    return isMobileViewport() ? MOBILE_VIEW : WORLD_VIEW;
  }

  // Keeps the SVG's own viewBox in sync with currentView() so the land
  // silhouette it draws is cropped/zoomed to exactly the same rectangle
  // every HTML marker/label is being projected against below.
  function syncSvgViewBox(svg) {
    const v = currentView();
    svg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
  }

  function contentBox(containerW, containerH, view) {
    const scale = Math.min(containerW / view.w, containerH / view.h);
    const contentW = view.w * scale;
    const contentH = view.h * scale;
    return {
      scale,
      view,
      offsetX: (containerW - contentW) / 2,
      offsetY: (containerH - contentH) / 2,
    };
  }

  function projectToStagePct([x, y], box, containerW, containerH) {
    const px = box.offsetX + (x - box.view.x) * box.scale;
    const py = box.offsetY + (y - box.view.y) * box.scale;
    return [(px / containerW) * 100, (py / containerH) * 100];
  }

  document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('export-map');
    if (!section || !window.PitexExportMap) return;
    try {
      init(section);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[PITEX] export-map init failed — revealing section without animation:', err);
      section.querySelectorAll('.export-map-stage-wrap, .export-map-stats-wrap, .section-header').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  });

  function init(section) {
    const stage = section.querySelector('[data-export-stage]');
    const svg = section.querySelector('[data-export-svg]');
    const markersLayer = section.querySelector('[data-export-markers]');
    const popupsLayer = section.querySelector('[data-export-popups]');
    const labelsLayer = section.querySelector('[data-export-labels]');
    if (!stage || !svg || !markersLayer || !popupsLayer) return;

    const { hq, locations } = window.PitexExportMap;

    // Desktop/tablet render the full WORLD_VIEW; mobile renders the
    // cropped MOBILE_VIEW (see the block above project()). Set once up
    // front so land already draws zoomed-in on a mobile page load, and
    // again on every resize below so crossing the breakpoint updates it.
    syncSvgViewBox(svg);

    const parallaxGroup = document.createElementNS(SVG_NS, 'g');
    parallaxGroup.setAttribute('data-parallax-group', '');
    svg.appendChild(parallaxGroup);

    renderWorldLand(parallaxGroup);
    const hqXY = project(hq.coords);
    const { routePaths, routeFlowPaths } = renderRoutes(parallaxGroup, hqXY, locations);

    // Several locations sit only a few viewBox-units apart at world scale
    // (Jordan/Palestine, the North-Africa coastline, the Gulf) — close
    // enough that rendering every marker at its exact geographic position
    // leaves them touching or overlapping. visualPositions gives each
    // marker a *display* position with breathing room, while keeping
    // hqXY/project() (hqXY/geoXY below) as the geographic source of truth
    // for anything that needs the real coordinate — currently the short
    // connector line drawn wherever a marker actually got moved.
    const visualPositions = computeVisualPositions(hq, hqXY, locations);
    renderMarkerOffsetLeaders(parallaxGroup, visualPositions);

    const { markerEls, reposition: repositionMarkers } = renderMarkers(
      stage, markersLayer, popupsLayer, hq, hqXY, locations, routePaths, visualPositions
    );
    const labels = labelsLayer ? initLabels(stage, labelsLayer, locations, markerEls) : null;

    // One shared, debounced resize handler for both layers. Order matters:
    // markers must be repositioned first (contentBox/projectToStagePct)
    // since the label layout reads each marker's freshly-updated
    // btn.style.left/top to know where its point sits.
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        syncSvgViewBox(svg); // crop in/out if the mobile breakpoint was crossed
        repositionMarkers();
        if (labels) labels.recompute();
      }, 150);
    });

    wirePopupDismissal(section, markerEls);
    initParallax(stage, parallaxGroup);
    initReveal(section, stage, routePaths, routeFlowPaths, markerEls, labels);
  }

  /* =======================================================================
     WORLD LAND — real, recognizable country/continent coastlines, not a
     decorative shape. The path data (window.PitexExportMapWorld.landPath,
     loaded from export-map-world.js before this file) is pre-projected
     into this exact same VB_W x VB_H / project() space, so it lines up
     with every marker and route with no extra alignment code needed here.
     ======================================================================= */
  function renderWorldLand(parent) {
    const data = window.PitexExportMapWorld;
    if (!data || !data.landPath) return;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'world-land');

    // A very subtle top-to-bottom tonal shift on the landmass — the
    // "soft illustration" depth the redesign calls for, without any
    // per-region gradients or extra rendering cost. Stop colors live in
    // CSS (export-map.css .export-map-land-stop-start/-end) alongside
    // every other color in this section; this just wires up the
    // <linearGradient> the fill references.
    const defs = document.createElementNS(SVG_NS, 'defs');
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', 'export-map-land-gradient');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y2', '1');
    const stopStart = document.createElementNS(SVG_NS, 'stop');
    stopStart.setAttribute('offset', '0%');
    stopStart.setAttribute('class', 'export-map-land-stop-start');
    const stopEnd = document.createElementNS(SVG_NS, 'stop');
    stopEnd.setAttribute('offset', '100%');
    stopEnd.setAttribute('class', 'export-map-land-stop-end');
    gradient.append(stopStart, stopEnd);
    defs.appendChild(gradient);
    group.appendChild(defs);

    const land = document.createElementNS(SVG_NS, 'path');
    land.setAttribute('class', 'export-map-land');
    land.setAttribute('d', data.landPath);
    land.setAttribute('fill-rule', 'nonzero');

    group.appendChild(land);
    parent.appendChild(group);
  }

  /* =======================================================================
     ROUTES — curved SVG paths from HQ to every location, plus a second
     dashed "flow" path on top that runs a continuous marching-dash
     animation once the reveal completes.
     ======================================================================= */
  function renderRoutes(parent, hqXY, locations) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'routes');

    const routePaths = [];
    const routeFlowPaths = [];

    locations.forEach((loc) => {
      const destXY = project(loc.coords);
      const d = curvedPath(hqXY, destXY);

      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('class', 'route-line');
      line.setAttribute('d', d);
      line.setAttribute('data-route-for', loc.id);
      group.appendChild(line);
      routePaths.push(line);

      const flow = document.createElementNS(SVG_NS, 'path');
      flow.setAttribute('class', 'route-flow');
      flow.setAttribute('d', d);
      flow.setAttribute('data-route-for', loc.id);
      group.appendChild(flow);
      routeFlowPaths.push(flow);
    });

    parent.appendChild(group);
    return { routePaths, routeFlowPaths };
  }

  function curvedPath(p1, p2) {
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const bend = Math.min(dist * 0.16, 60);
    const cx = mx + nx * bend;
    const cy = my + ny * bend;
    return `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  /* =======================================================================
     VISUAL DECLUTTER — every marker's *geographic* position stays exactly
     what project(loc.coords) says (routes, aria labels, anything else that
     cares, are untouched). This computes a separate *display* position —
     using export-map-declutter.js's generic point-relaxation helper — that
     markers/labels are actually rendered at, so crowded regions (the
     Mediterranean/North-Africa/Gulf cluster in this dataset) get real
     breathing room instead of overlapping dots. Returns a Map keyed by
     location id: { x, y, geoX, geoY, dist } in viewBox units.
     ======================================================================= */
  function computeVisualPositions(hq, hqXY, locations) {
    const helper = window.PitexExportMapDeclutter;
    const geo = [
      { id: hq.id, x: hqXY[0], y: hqXY[1], weight: 2.4 },
      ...locations.map((loc) => {
        const [x, y] = project(loc.coords);
        return { id: loc.id, x, y, weight: loc.important ? 1.3 : 1 };
      }),
    ];

    if (!helper || typeof helper.declutter !== 'function') {
      // Helper failed to load for some reason — fall back to the real
      // geographic positions rather than breaking the map.
      const map = new Map();
      geo.forEach((p) => map.set(p.id, { x: p.x, y: p.y, geoX: p.x, geoY: p.y, dist: 0 }));
      return map;
    }

    const relaxed = helper.declutter(geo, {
      minDist: 36,
      bounds: { minX: 16, minY: 16, maxX: VB_W - 16, maxY: VB_H - 16 },
    });

    const geoById = new Map(geo.map((p) => [p.id, p]));
    const map = new Map();
    relaxed.forEach((p) => {
      const real = geoById.get(p.id);
      map.set(p.id, { x: p.x, y: p.y, geoX: real.x, geoY: real.y, dist: p.dist });
    });
    return map;
  }

  // Short, low-contrast connector from a marker's real geographic point to
  // where it's actually displayed — drawn only where the declutter pass
  // moved a marker enough for the gap to otherwise look unexplained. Lives
  // in the same SVG viewBox space as the land/routes, so it lines up with
  // the HTML marker buttons (positioned via projectToStagePct) without any
  // extra math.
  function renderMarkerOffsetLeaders(parent, visualPositions) {
    const MIN_VISIBLE_OFFSET = 3; // viewBox units — below this the line adds noise, not clarity
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'marker-offset-leaders');

    visualPositions.forEach((pos) => {
      if (pos.dist < MIN_VISIBLE_OFFSET) return;
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('class', 'export-marker-offset-leader');
      line.setAttribute(
        'd',
        `M ${pos.geoX.toFixed(1)} ${pos.geoY.toFixed(1)} L ${pos.x.toFixed(1)} ${pos.y.toFixed(1)}`
      );
      group.appendChild(line);
    });

    parent.appendChild(group);
  }

  /* =======================================================================
     MARKERS + POPUPS — real <button>/<div> elements laid on top of the
     SVG via percentage positioning, so hover/click/focus and the popup
     cards stay simple, accessible HTML rather than SVG foreignObject.
     ======================================================================= */
  function markerAriaLabel(loc) {
    return loc.isHQ
      ? `${pick(loc.label)} — ${pick(loc.country)}`
      : `${pick(loc.country)}, ${pick(loc.label)} — ${pick(loc.project)}, installed ${loc.year}, ${pick(loc.statusLabel)}`;
  }

  function renderMarkers(stage, markersLayer, popupsLayer, hq, hqXY, locations, routePaths, visualPositions) {
    const all = [{ ...hq, coords: hq.coords, isHQ: true }, ...locations.map((l) => ({ ...l, isHQ: false }))];
    const markerEls = [];
    const registry = []; // { loc, btn, popup, x, y } — kept so a language switch
    // can refresh text in place instead of tearing down and rebuilding markers,
    // and so reposition() can re-derive every element's % position (x/y are
    // the original, unchanging viewBox coordinates) whenever the stage's
    // aspect ratio changes across a responsive breakpoint.

    all.forEach((loc) => {
      // Prefer the decluttered display position; project()/hqXY (the real
      // geographic point) is only the fallback if for some reason a
      // location is missing from visualPositions.
      const visual = visualPositions && visualPositions.get(loc.id);
      const [x, y] = visual ? [visual.x, visual.y] : (loc.isHQ ? hqXY : project(loc.coords));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'export-marker' + (loc.isHQ ? ' export-marker--hq' : '');
      btn.setAttribute('data-location-id', loc.id);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', markerAriaLabel(loc));

      const pulse1 = document.createElement('span');
      pulse1.className = 'export-marker__pulse';
      pulse1.setAttribute('aria-hidden', 'true');
      const pulse2 = document.createElement('span');
      pulse2.className = 'export-marker__pulse export-marker__pulse--delay';
      pulse2.setAttribute('aria-hidden', 'true');
      // Static ring+center: white disc + thin PITEX-blue ring behind a
      // small solid blue dot, per the "clean modern marker" redesign —
      // the ring is the marker's resting state, the pulses above are the
      // looping animation layered behind it.
      const ring = document.createElement('span');
      ring.className = 'export-marker__ring';
      ring.setAttribute('aria-hidden', 'true');
      const dot = document.createElement('span');
      dot.className = 'export-marker__dot';
      dot.setAttribute('aria-hidden', 'true');
      ring.appendChild(dot);

      btn.append(pulse1, pulse2, ring);

      // The "PITEX HQ" tag is NOT a static child of this button — it's
      // rendered by initLabels() as a real label participating in the
      // same collision-avoidance layout as every country label (see
      // section there), so it can never sit on top of a nearby marker.

      const popup = buildPopup(loc);
      btn.setAttribute('aria-controls', popup.id);
      popupsLayer.appendChild(popup);

      const relatedRoute = routePaths.find((p) => p.getAttribute('data-route-for') === loc.id);

      let pinned = false;

      function open() {
        closeAllExcept(markersLayer, btn);
        popup.classList.add('is-open');
        popup.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-active');
        if (relatedRoute) relatedRoute.classList.add('is-highlighted');
      }
      function close() {
        if (pinned) return;
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-active');
        if (relatedRoute) relatedRoute.classList.remove('is-highlighted');
      }

      btn.addEventListener('mouseenter', open);
      btn.addEventListener('mouseleave', close);
      btn.addEventListener('focus', open);
      btn.addEventListener('blur', close);

      btn.addEventListener('click', (e) => {
        spawnRipple(btn, e);
        pinned = !pinned;
        if (pinned) {
          open();
        } else {
          close();
        }
      });

      btn.__pitexClosePopup = () => {
        pinned = false;
        close();
      };

      registry.push({ loc, btn, popup, x, y });

      markersLayer.appendChild(btn);
      markerEls.push(btn);
    });

    // Re-render is deliberately *in place*: the same <button>/<div>
    // elements just get fresh text/attributes, so listeners, pinned/open
    // state, and GSAP references all stay valid — no duplicate markers,
    // no re-running init().
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => {
        registry.forEach(({ loc, btn, popup }) => {
          btn.setAttribute('aria-label', markerAriaLabel(loc));
          popup.innerHTML = popupContent(loc);
        });
      });
    }

    // Positions every marker/popup as a % of the *stage*, matching
    // exactly where the SVG itself renders that viewBox coordinate
    // (see contentBox/projectToStagePct above) — correct at any stage
    // aspect ratio, called once up front and again on every resize.
    function reposition() {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const box = contentBox(rect.width, rect.height, currentView());

      registry.forEach(({ btn, popup, x, y }) => {
        const [leftPct, topPct] = projectToStagePct([x, y], box, rect.width, rect.height);
        btn.style.left = leftPct.toFixed(2) + '%';
        btn.style.top = topPct.toFixed(2) + '%';

        popup.style.left = leftPct.toFixed(2) + '%';
        popup.style.top = topPct.toFixed(2) + '%';
        popup.classList.toggle('export-popup--below', topPct < 26);
        popup.classList.remove('export-popup--edge-left', 'export-popup--edge-right');
        if (leftPct < 16) popup.classList.add('export-popup--edge-left');
        else if (leftPct > 84) popup.classList.add('export-popup--edge-right');
      });
    }

    reposition();

    return { markerEls, reposition };
  }

  function installedLabel() {
    return window.I18N && typeof window.I18N.t === 'function'
      ? window.I18N.t('pages.home.exportMap.popup.installed')
      : 'Installed';
  }

  function popupContent(loc) {
    const statusClass = 'export-status--' + loc.status;
    const metaRow = loc.isHQ
      ? `<p class="export-popup__project">${escapeHTML(pick(loc.detail) || '')}</p>`
      : `<p class="export-popup__project">${escapeHTML(pick(loc.project))}</p>
         <div class="export-popup__meta">
           <span>${escapeHTML(pick(loc.detail))}: <strong>${escapeHTML(pick(loc.capacity))}</strong></span>
         </div>
         <div class="export-popup__meta">
           <span>${escapeHTML(installedLabel())}: <strong>${loc.year}</strong></span>
           <span class="export-status ${statusClass}">${escapeHTML(pick(loc.statusLabel))}</span>
         </div>`;

    return `
      <div class="export-popup__head">
        <span class="export-popup__flag" aria-hidden="true">${loc.flag}</span>
        <span class="export-popup__country">${escapeHTML(pick(loc.country))}</span>
      </div>
      <p class="export-popup__city">${escapeHTML(pick(loc.label))}</p>
      ${metaRow}
    `;
  }

  function buildPopup(loc) {
    const popup = document.createElement('div');
    popup.className = 'export-popup';
    popup.id = 'export-popup-' + loc.id;
    popup.setAttribute('role', 'tooltip');
    popup.setAttribute('aria-hidden', 'true');
    // left/top and the edge/below modifier classes are set by
    // renderMarkers()'s reposition(), which runs immediately after this
    // element is created (and again on every resize) — see contentBox().

    popup.innerHTML = popupContent(loc);

    return popup;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function closeAllExcept(markersLayer, exceptBtn) {
    markersLayer.querySelectorAll('.export-marker').forEach((el) => {
      if (el !== exceptBtn && typeof el.__pitexClosePopup === 'function') el.__pitexClosePopup();
    });
  }

  function spawnRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 2.6;
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${(e.clientX || rect.left + rect.width / 2) - rect.left - size / 2}px`;
    ripple.style.top = `${(e.clientY || rect.top + rect.height / 2) - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function wirePopupDismissal(section) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      section.querySelectorAll('.export-marker').forEach((el) => {
        if (typeof el.__pitexClosePopup === 'function') el.__pitexClosePopup();
      });
    });
    document.addEventListener('click', (e) => {
      if (section.contains(e.target)) return;
      section.querySelectorAll('.export-marker').forEach((el) => {
        if (typeof el.__pitexClosePopup === 'function') el.__pitexClosePopup();
      });
    });
  }

  /* =======================================================================
     DESTINATION LABELS — always-on country/region tags next to every
     marker. All collision-avoidance geometry lives in the standalone
     export-map-labels.js module; this function only turns that layout
     into real elements and keeps them in sync with the markers that
     renderMarkers() already built (nothing here re-implements marker or
     popup logic — hover/focus/click just forward to the existing button
     via native events so the current open/close/highlight code runs
     unchanged).
     ======================================================================= */
  function initLabels(stage, labelsLayer, locations, markerEls) {
    if (!window.PitexExportMapLabels) return null;

    const leaderSvg = document.createElementNS(SVG_NS, 'svg');
    leaderSvg.setAttribute('class', 'export-label-leaders');
    leaderSvg.setAttribute('preserveAspectRatio', 'none');
    stage.insertBefore(leaderSvg, labelsLayer);

    const byId = new Map(markerEls.map((btn) => [btn.getAttribute('data-location-id'), btn]));
    const hqBtn = byId.get('hq');
    const state = new Map();

    // PITEX HQ gets a label through the exact same pipeline as every
    // country — same collision layout, same leader-line system — so it
    // is guaranteed (by construction, not by luck) to never sit on top
    // of a nearby marker. It just uses a fixed id/text/style and goes
    // first in priority so it claims the cleanest spot around itself.
    const labelSources = [
      { id: 'hq', isHQ: true, text: 'PITEX HQ' },
      ...locations.map((loc) => ({ id: loc.id, isHQ: false, loc, important: !!loc.important })),
    ];

    labelSources.forEach((src) => {
      const btn = byId.get(src.id);
      if (!btn) return;

      const el = document.createElement('div');
      el.className = 'export-label' + (src.isHQ ? ' export-label--hq' : '');
      el.setAttribute('aria-hidden', 'true');
      const text = src.isHQ ? src.text : pick(src.loc.country);
      el.innerHTML = `<span class="export-label__text">${escapeHTML(text)}</span>`;
      labelsLayer.appendChild(el);

      const leader = document.createElementNS(SVG_NS, 'path');
      leader.setAttribute('class', 'export-label__leader' + (src.isHQ ? ' export-label__leader--hq' : ''));
      leaderSvg.appendChild(leader);

      wireLabelSync(btn, el, leader);
      state.set(src.id, { el, leader, btn, isHQ: src.isHQ, important: src.important, loc: src.loc });
    });

    function tier() {
      const w = window.innerWidth;
      if (w <= 575.98) return 'mobile';
      if (w <= 991.98) return 'tablet';
      return 'desktop';
    }

    function pctToPx(btn, rect) {
      return [(parseFloat(btn.style.left) / 100) * rect.width, (parseFloat(btn.style.top) / 100) * rect.height];
    }

    function recompute() {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      leaderSvg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

      const currentTier = tier();
      const font = currentTier === 'desktop' ? '700 11px Manrope, sans-serif' : '700 10px Manrope, sans-serif';
      const markerRadius = currentTier === 'mobile' ? 11 : 13;

      const avoidPoints = [];
      if (hqBtn) {
        const [hx, hy] = pctToPx(hqBtn, rect);
        avoidPoints.push({ x: hx, y: hy });
      }

      // Every location gets a label at every tier — including mobile.
      // "important" only sets placement *priority* below (important
      // countries get first pick of the clean, unambiguous ring
      // positions; the rest still get placed, just after), it no longer
      // hides labels outright. The collision layout in
      // export-map-labels.js (12 candidate directions x 5 ring
      // distances, plus a forced least-overlap fallback) is what makes
      // that viable in the smaller mobile stage.
      const points = [];
      state.forEach((entry, id) => {
        const [x, y] = pctToPx(entry.btn, rect);
        const text = entry.isHQ ? 'PITEX HQ' : pick(entry.loc.country);
        const priority = entry.isHQ ? -1 : (entry.important ? 0 : 1);
        points.push({ id, x, y, text, priority });
      });

      const placed = window.PitexExportMapLabels.layout({
        width: rect.width, height: rect.height, points, avoidPoints, font, markerRadius,
      });
      const placedById = new Map(placed.map((p) => [p.id, p]));

      state.forEach((entry, id) => {
        const p = placedById.get(id);
        entry.el.classList.toggle('export-label--compact', currentTier !== 'desktop');
        if (!p) {
          entry.el.style.visibility = 'hidden';
          entry.el.style.pointerEvents = 'none';
          entry.leader.style.opacity = '0';
          return;
        }
        entry.el.style.visibility = '';
        entry.el.style.pointerEvents = '';
        entry.el.style.left = ((p.x / rect.width) * 100).toFixed(2) + '%';
        entry.el.style.top = ((p.y / rect.height) * 100).toFixed(2) + '%';

        if (p.leader) {
          const [ex, ey] = clipToBoxEdge(p.pointX, p.pointY, p.x, p.y, p.w / 2, p.h / 2);
          entry.leader.setAttribute('d', `M ${p.pointX.toFixed(1)} ${p.pointY.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`);
          entry.leader.style.opacity = '';
        } else {
          entry.leader.style.opacity = '0';
        }
      });
    }

    recompute();

    // Resize handling lives in one shared, debounced listener set up by
    // init() (it needs to reposition markers first, then re-run this),
    // so recompute is exposed instead of this module scheduling its own.

    // Arabic/English country names differ in pixel width, so a language
    // switch has to both swap the label text *and* re-run the collision
    // layout — same label/leader elements, refreshed in place, not
    // recreated.
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => {
        state.forEach((entry) => {
          if (entry.isHQ) return; // fixed text, not translated
          const textEl = entry.el.querySelector('.export-label__text');
          if (textEl) textEl.textContent = pick(entry.loc.country);
        });
        recompute();
      });
    }

    return {
      labelEls: Array.from(state.values()).map((s) => s.el),
      leaderEls: Array.from(state.values()).map((s) => s.leader),
      recompute,
    };
  }

  // Finds where the segment from the point to the label's center first
  // crosses the label's box, so the leader line stops at its edge
  // instead of running underneath the text.
  function clipToBoxEdge(px, py, cx, cy, halfW, halfH) {
    const dx = cx - px, dy = cy - py;
    if (dx === 0 && dy === 0) return [cx, cy];
    const tx = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
    const ty = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty, 1);
    return [cx - dx * t, cy - dy * t];
  }

  // Hovering/focusing/clicking a label mirrors the same interaction on its
  // marker button by forwarding native events to it — the existing
  // open()/close()/is-active logic inside renderMarkers() runs as-is, so
  // the glow/enlarge/tooltip behavior never has to be duplicated here.
  function wireLabelSync(btn, labelEl, leaderEl) {
    const activate = () => {
      labelEl.classList.add('is-active');
      leaderEl.classList.add('is-active');
    };
    const deactivate = () => {
      labelEl.classList.remove('is-active');
      leaderEl.classList.remove('is-active');
    };
    btn.addEventListener('mouseenter', activate);
    btn.addEventListener('mouseleave', deactivate);
    btn.addEventListener('focus', activate);
    btn.addEventListener('blur', deactivate);

    labelEl.addEventListener('mouseenter', () => btn.dispatchEvent(new Event('mouseenter')));
    labelEl.addEventListener('mouseleave', () => btn.dispatchEvent(new Event('mouseleave')));
    labelEl.addEventListener('click', (e) => {
      btn.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY }));
    });
  }

  /* =======================================================================
     PARALLAX — subtle pointer-tracked drift on the background dot/route
     layer only, matching the hero section's mouse-parallax recipe.
     Markers/popups stay put so click targets never move under the cursor.
     ======================================================================= */
  function initParallax(stage, parallaxGroup) {
    if (prefersReducedMotion || !hasGSAP) return;

    const moveTo = gsap.quickTo(parallaxGroup, 'x', { duration: 1.1, ease: EASE.out3 });
    const moveToY = gsap.quickTo(parallaxGroup, 'y', { duration: 1.1, ease: EASE.out3 });

    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      moveTo(px * -10);
      moveToY(py * -6);
    });
    stage.addEventListener('mouseleave', () => {
      moveTo(0);
      moveToY(0);
    });
  }

  /* =======================================================================
     REVEAL — badge → title → description → map → routes → markers →
     legend → stats, scroll-triggered once, power4/expo easing with
     stagger, mirroring the choreography used across the rest of the site.
     ======================================================================= */
  function initReveal(section, stage, routePaths, routeFlowPaths, markerEls, labels) {
    const badge = section.querySelector('.section-badge');
    const title = section.querySelector('.section-title');
    const desc = section.querySelector('.section-subtitle');
    const legend = section.querySelector('.export-map-legend');
    const statsWrap = section.querySelector('.export-map-stats-wrap');
    const labelEls = labels ? labels.labelEls : [];
    const leaderEls = labels ? labels.leaderEls : [];

    if (prefersReducedMotion || !hasGSAP) {
      stage.classList.add('is-revealed');
      return;
    }

    gsap.set([badge, title, desc], { opacity: 0, y: 28 });
    gsap.set(stage, { opacity: 0, y: 44, scale: 0.97 });
    gsap.set(markerEls, { opacity: 0, scale: 0.25, transformOrigin: 'center' });
    if (legend) gsap.set(legend, { opacity: 0, y: 16 });
    if (statsWrap) gsap.set(statsWrap, { opacity: 0, y: 34 });
    gsap.set(routeFlowPaths, { opacity: 0 });
    if (labelEls.length) gsap.set(labelEls, { opacity: 0 });
    if (leaderEls.length) gsap.set(leaderEls, { opacity: 0 });

    routePaths.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 72%', once: true },
    });

    tl.to(badge, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out4 })
      .to(title, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out4 }, '-=0.45')
      .to(desc, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out4 }, '-=0.5')
      .to(stage, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: EASE.expo }, '-=0.35')
      .to(routePaths, { strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: EASE.out3 }, '-=0.55')
      .to(markerEls, { opacity: 1, scale: 1, duration: 0.65, stagger: 0.035, ease: EASE.back }, '-=0.7')
      .to(routeFlowPaths, { opacity: 0.85, duration: 0.6 }, '-=0.3');

    if (leaderEls.length) tl.to(leaderEls, { opacity: 1, duration: 0.5 }, '-=0.45');
    if (labelEls.length) tl.to(labelEls, { opacity: 1, duration: 0.5, stagger: 0.025, ease: EASE.out3 }, '-=0.4');

    tl.add(() => stage.classList.add('is-revealed'), '-=0.2');

    if (legend) tl.to(legend, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out4 }, '-=0.5');
    if (statsWrap) tl.to(statsWrap, { opacity: 1, y: 0, duration: 0.9, ease: EASE.out4 }, '-=0.4');
  }
})();
