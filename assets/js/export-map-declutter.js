/* =========================================================================
   PITEX — export-map-declutter.js
   Pure geometry helper that gives visually-crowded markers breathing room
   without ever moving their real geographic position.

   The problem it solves: several PITEX locations (Jordan/Palestine, the
   North-Africa coastline, the Gulf) sit only a few pixels apart at world-map
   scale. Rendering every marker at its exact projected lon/lat leaves them
   overlapping or touching — no amount of marker/label styling fixes that,
   the *positions* themselves are too close together.

   declutter() runs a small, deterministic relaxation pass over a set of
   points already projected into the map's own coordinate space (the same
   1000x500 viewBox export-map.js projects every marker/route into): any two
   points closer than `minDist` are gently pushed apart, with a soft pull
   back toward each point's real coordinate every iteration so nothing drifts
   far from where it actually belongs. It is intentionally NOT random —
   same input always produces the same output — so the layout is stable
   across reloads and resizes, unlike ad-hoc per-marker CSS offsets.

   The output is a *visual* position per point plus how far it moved from
   its real one; export-map.js uses that distance to decide whether a short
   connector line back to the true coordinate is warranted.

   Stateless and framework-agnostic, same conventions as
   export-map-labels.js: no DOM access, plain data in and out.
   ========================================================================= */

window.PitexExportMapDeclutter = (function () {
  'use strict';

  /**
   * @param {Array} points [{ id, x, y, weight }] — x/y in a shared
   *   coordinate space; weight (default 1) controls how readily a point
   *   yields ground to whatever is crowding it — give higher-priority
   *   points (e.g. the headquarters) a higher weight so they move less
   *   than their neighbors do.
   * @param {Object} [opts]
   * @param {number} [opts.minDist=36] minimum center-to-center distance
   *   two points should keep, in the same units as x/y.
   * @param {number} [opts.anchorStrength=0.05] how strongly each point is
   *   pulled back toward its real coordinate every iteration — this is
   *   what keeps the relaxation local instead of a long chain reaction
   *   pushing a point arbitrarily far across the map.
   * @param {number} [opts.iterations=260]
   * @param {Object|null} [opts.bounds] optional { minX, minY, maxX, maxY }
   *   clamp so points never relax past the visible map area.
   * @returns {Array} [{ id, x, y, dx, dy, dist }] — visual position, the
   *   offset from the real coordinate, and its magnitude.
   */
  function declutter(points, opts) {
    const {
      minDist = 36,
      anchorStrength = 0.05,
      iterations = 260,
      bounds = null,
    } = opts || {};

    const pts = points.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      ox: p.x,
      oy: p.y,
      weight: p.weight || 1,
    }));

    for (let iter = 0; iter < iterations; iter++) {
      // Pull every point gently back toward its real coordinate first.
      pts.forEach((p) => {
        p.x += (p.ox - p.x) * anchorStrength;
        p.y += (p.oy - p.y) * anchorStrength;
      });

      // Then resolve overlaps, splitting the correction between both
      // points in inverse proportion to their weight — a heavier/
      // higher-priority point moves less than the one crowding it.
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          if (dist >= minDist) continue;
          if (dist < 0.001) {
            // Near-identical real coordinates (two cities a few km apart
            // at map scale) — nudge apart on a fixed axis first so the
            // repulsion below has a direction to push along.
            dx = 1;
            dy = 0.001;
            dist = 1;
          }
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          const totalWeight = a.weight + b.weight;
          const aShare = (b.weight / totalWeight) * overlap * 0.5;
          const bShare = (a.weight / totalWeight) * overlap * 0.5;
          a.x -= nx * aShare;
          a.y -= ny * aShare;
          b.x += nx * bShare;
          b.y += ny * bShare;
        }
      }

      if (bounds) {
        pts.forEach((p) => {
          p.x = Math.min(bounds.maxX, Math.max(bounds.minX, p.x));
          p.y = Math.min(bounds.maxY, Math.max(bounds.minY, p.y));
        });
      }
    }

    return pts.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      dx: p.x - p.ox,
      dy: p.y - p.oy,
      dist: Math.hypot(p.x - p.ox, p.y - p.oy),
    }));
  }

  return { declutter };
})();
