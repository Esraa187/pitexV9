/* =========================================================================
   PITEX — export-map-labels.js
   Pure layout helper for the Global Export Map's always-on destination
   labels. Given a list of points in real pixel space (already projected
   by export-map.js), it returns a non-overlapping position for every
   label — tried on a ring of candidate directions around the point, using
   actual canvas text measurement so collision checks match what will be
   rendered on screen — plus whether a leader line is needed to reconnect
   a label that had to be pushed away from its point.

   Stateless and framework-agnostic: export-map.js is the only caller, and
   it stays the single place that turns this layout data into real DOM /
   SVG elements, so nothing about the map's existing rendering is
   duplicated here.
   ========================================================================= */

(function () {
  'use strict';

  let measureCtx = null;
  function measureTextWidth(text, font) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }

  // Candidate directions around a point, in preference order. Angle 0 is
  // to the right, increasing clockwise. "anchor" says which edge of the
  // label box sits at the candidate position. 12 directions (roughly
  // 30-40° apart) give the search enough granularity to slip labels into
  // gaps within dense clusters (e.g. the Mediterranean/Middle East)
  // before it has to fall back to a farther ring.
  const DIRECTIONS = [
    { angle: 0, anchor: 'start' },
    { angle: 180, anchor: 'end' },
    { angle: -40, anchor: 'start' },
    { angle: 40, anchor: 'start' },
    { angle: -140, anchor: 'end' },
    { angle: 140, anchor: 'end' },
    { angle: -90, anchor: 'mid' },
    { angle: 90, anchor: 'mid' },
    { angle: -70, anchor: 'start' },
    { angle: 70, anchor: 'start' },
    { angle: -110, anchor: 'end' },
    { angle: 110, anchor: 'end' },
  ];

  function boxFor(px, py, w, h, angle, anchor, radius) {
    const rad = (angle * Math.PI) / 180;
    const ax = px + Math.cos(rad) * radius;
    const ay = py + Math.sin(rad) * radius;
    let x;
    if (anchor === 'start') x = ax;
    else if (anchor === 'end') x = ax - w;
    else x = ax - w / 2;
    return { x, y: ay - h / 2, w, h, anchorX: ax, anchorY: ay };
  }

  function boxesOverlap(a, b, pad) {
    return !(
      a.x + a.w + pad < b.x ||
      b.x + b.w + pad < a.x ||
      a.y + a.h + pad < b.y ||
      b.y + b.h + pad < a.y
    );
  }

  function boxOverlapsCircle(box, cx, cy, r, pad) {
    const nx = Math.max(box.x - pad, Math.min(cx, box.x + box.w + pad));
    const ny = Math.max(box.y - pad, Math.min(cy, box.y + box.h + pad));
    return Math.hypot(cx - nx, cy - ny) < r;
  }

  // Does the straight leader-line segment (px,py)->(ax,ay) pass within `r`
  // of an unrelated point's marker circle? Used so a label's leader line
  // never cuts across a *different* country's marker — important once
  // several points sit close together (e.g. the Mediterranean cluster),
  // where a line drawn toward the "best" empty spot for label A could
  // otherwise visually read as pointing at neighboring marker B instead.
  function segmentDistToPoint(px, py, ax, ay, cx, cy) {
    const dx = ax - px, dy = ay - py;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(cx - px, cy - py);
    let t = ((cx - px) * dx + (cy - py) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(cx - (px + t * dx), cy - (py + t * dy));
  }

  function countLeaderCrossings(pt, anchorX, anchorY, others, markerRadius) {
    let n = 0;
    for (let i = 0; i < others.length; i++) {
      const o = others[i];
      if (o.x === pt.x && o.y === pt.y) continue;
      if (segmentDistToPoint(pt.x, pt.y, anchorX, anchorY, o.x, o.y) < markerRadius * 0.85) n++;
    }
    return n;
  }

  /**
   * @param {Object} opts
   * @param {number} opts.width  Available width in px (e.g. stage rect width)
   * @param {number} opts.height Available height in px
   * @param {Array}  opts.points [{ id, x, y, text }]
   * @param {Array}  [opts.avoidPoints] extra {x,y} markers labels shouldn't sit on top of
   * @param {string} [opts.font] CSS font shorthand used to measure label width
   * @param {number} [opts.markerRadius] px radius reserved around every point
   * @param {number} [opts.ringNear] px gap for the first (preferred) ring
   * @param {number} [opts.ringFar]  px gap for the fallback ring
   * @returns {Array} [{ id, x, y, w, h, anchorSide, leader, pointX, pointY }]
   */
  function layout(opts) {
    const {
      width, height, points, avoidPoints = [],
      font = '700 11px Manrope, sans-serif',
      paddingX = 9, paddingY = 5, lineHeight = 12,
      markerRadius = 12, rings = [8, 22, 42, 70, 105],
      labelGap = 5, boundsMargin = 6,
    } = opts;

    const placedBoxes = [];
    const results = [];
    const others = avoidPoints.concat(points.map((p) => ({ x: p.x, y: p.y })));

    const sorted = points
      .map((p, i) => ({ ...p, __i: i }))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.__i - b.__i);

    sorted.forEach((pt) => {
      const w = measureTextWidth(pt.text, font) + paddingX * 2;
      const h = lineHeight + paddingY * 2;

      let best = null;
      let bestCrossings = Infinity;
      let bestFallbackScore = -Infinity;

      rings.forEach((ringGap, ringIdx) => {
        if (best && !best.forced) return; // already found a clean spot on a closer ring
        const radius = ringGap + markerRadius;
        let ringHasClean = false;

        DIRECTIONS.forEach((dir) => {
          const box = boxFor(pt.x, pt.y, w, h, dir.angle, dir.anchor, radius);

          let collides =
            box.x < boundsMargin || box.y < boundsMargin ||
            box.x + box.w > width - boundsMargin || box.y + box.h > height - boundsMargin;

          for (let i = 0; !collides && i < placedBoxes.length; i++) {
            if (boxesOverlap(box, placedBoxes[i], labelGap)) collides = true;
          }
          for (let i = 0; !collides && i < others.length; i++) {
            const o = others[i];
            if (o.x === pt.x && o.y === pt.y) continue;
            if (boxOverlapsCircle(box, o.x, o.y, markerRadius, labelGap)) collides = true;
          }

          // Anchor point the leader line would actually be drawn to/from
          // (clipped to the box edge later, but the box center is a close
          // enough stand-in for scoring which direction the line travels).
          const crossings = countLeaderCrossings(pt, box.x + box.w / 2, box.y + box.h / 2, others, markerRadius);

          if (!collides) {
            // Among directions that don't overlap anything, prefer the one
            // whose leader line doesn't cut across an unrelated marker —
            // ties broken by DIRECTIONS' existing preference order (first
            // candidate found at the lowest crossing count wins).
            if (!ringHasClean || crossings < bestCrossings) {
              best = { box, dir, ringIdx };
              bestCrossings = crossings;
              ringHasClean = true;
            }
          } else if (!best) {
            let score = 0;
            for (let i = 0; i < placedBoxes.length; i++) {
              if (boxesOverlap(box, placedBoxes[i], 0)) score -= 1;
            }
            score -= crossings * 0.5;
            if (score > bestFallbackScore) {
              bestFallbackScore = score;
              best = { box, dir, ringIdx, forced: true };
            }
          }
        });
      });

      placedBoxes.push(best.box);
      results.push({
        id: pt.id,
        x: best.box.x + best.box.w / 2,
        y: best.box.y + best.box.h / 2,
        w: best.box.w,
        h: best.box.h,
        anchorSide: best.dir.anchor,
        leader: best.ringIdx > 0 || !!best.forced,
        pointX: pt.x,
        pointY: pt.y,
      });
    });

    return results;
  }

  window.PitexExportMapLabels = { layout, measureTextWidth };
})();
