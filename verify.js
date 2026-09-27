// Minimal harness to exercise the real label-collision algorithm
// (export-map-labels.js) against the real project() + reposition math
// (mirrored from export-map.js) using the real country data
// (export-map-data.js), to check for actual overlaps at various stage
// sizes without needing a browser.

global.window = global;

// --- shim canvas text measurement (approximate; real font not available
// in Node, but consistent enough to catch algorithmic overlap issues) ---
global.document = {
  createElement(tag) {
    if (tag === 'canvas') {
      return {
        getContext() {
          return {
            font: '',
            measureText(text) {
              // bold 11px Manrope ~ 6.6px/char average (rough, but stable)
              const perChar = this.font.includes('10px') ? 6.1 : 6.7;
              return { width: text.length * perChar };
            },
          };
        },
      };
    }
    return {};
  },
};

require('./assets/js/export-map-data.js');
require('./assets/js/export-map-labels.js');

const { hq, locations } = window.PitexExportMap;
const Labels = window.PitexExportMapLabels;

const VB_W = 1000, VB_H = 500, LAT_MAX = 78, LAT_MIN = -58;
function project([lon, lat]) {
  const x = ((lon + 180) / 360) * VB_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H;
  return [x, y];
}
function contentBox(containerW, containerH) {
  const scale = Math.min(containerW / VB_W, containerH / VB_H);
  const contentW = VB_W * scale, contentH = VB_H * scale;
  return { scale, offsetX: (containerW - contentW) / 2, offsetY: (containerH - contentH) / 2 };
}
function projectToStagePx([x, y], box) {
  return [box.offsetX + x * box.scale, box.offsetY + y * box.scale];
}

const countryNames = { en: 1 }; // just to pick .en
function pick(field) { return typeof field === 'string' ? field : field.en; }

// stage sizes: [label, width, height] approximating container-custom
// (max 1220px, clamp(20,4vw,32) padding-inline) at common viewports,
// with export-map.css's responsive aspect-ratio breakpoints applied.
const viewports = [1920, 1440, 1280, 1024, 768, 390];
function stageFor(vw) {
  const padPref = vw * 0.04;
  const pad = Math.min(32, Math.max(20, padPref)) * 2;
  const w = Math.min(1220, vw - pad);
  let h;
  if (vw <= 420) h = w * 0.82;
  else if (vw <= 767.98) h = w * 0.68;
  else h = w * 0.5;
  return { w, h };
}

let anyOverlap = false;

viewports.forEach((vw) => {
  const { w: width, h: height } = stageFor(vw);
  const box = contentBox(width, height);
  const [hx, hy] = projectToStagePx(project(hq.coords), box);

  const points = locations.map((loc) => {
    const [x, y] = projectToStagePx(project(loc.coords), box);
    return { id: loc.id, x, y, text: pick(loc.country), priority: loc.important ? 0 : 1 };
  });

  const currentTier = vw <= 575.98 ? 'mobile' : vw <= 991.98 ? 'tablet' : 'desktop';
  const font = currentTier === 'desktop' ? '700 11px Manrope, sans-serif' : '700 10px Manrope, sans-serif';
  const markerRadius = currentTier === 'mobile' ? 11 : 13;

  const placed = Labels.layout({
    width, height, points, avoidPoints: [{ x: hx, y: hy }], font, markerRadius,
  });

  // check pairwise overlap between placed label boxes
  const boxes = placed.map((p) => ({ id: p.id, x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }));
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const collide = !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
      if (collide) overlaps.push(`${a.id} <-> ${b.id}`);
    }
  }
  // check overlap with HQ marker circle
  const hqOverlaps = [];
  boxes.forEach((b) => {
    const nx = Math.max(b.x, Math.min(hx, b.x + b.w));
    const ny = Math.max(b.y, Math.min(hy, b.y + b.h));
    if (Math.hypot(hx - nx, hy - ny) < markerRadius) hqOverlaps.push(b.id);
  });
  // out-of-bounds check
  const oob = boxes.filter((b) => b.x < 0 || b.y < 0 || b.x + b.w > width || b.y + b.h > height).map((b) => b.id);

  console.log(`\n=== viewport ${vw}px  ->  stage ${width.toFixed(0)}x${height.toFixed(0)} (${currentTier}) ===`);
  if (overlaps.length) { anyOverlap = true; console.log('  LABEL OVERLAPS:', overlaps.join(', ')); }
  else console.log('  label overlaps: none');
  if (hqOverlaps.length) { anyOverlap = true; console.log('  HQ MARKER OVERLAPS:', hqOverlaps.join(', ')); }
  if (oob.length) { anyOverlap = true; console.log('  OUT OF BOUNDS:', oob.join(', ')); }
});

console.log('\n' + (anyOverlap ? '⚠ some overlaps detected (see above)' : '✓ no overlaps at any tested viewport'));
