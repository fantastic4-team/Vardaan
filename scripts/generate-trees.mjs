// Generates the extra tree types scattered around the landing page, in the same chunky pixel style
// as public/images/tree.png: public/images/trees/{pine,autumn,blossom,birch,cypress}.png.
// Each tree is drawn on a 46x52 grid and written at 8x so it downscales smoothly on the page.
// Run with `node scripts/generate-trees.mjs`.
import { writeFileSync, mkdirSync } from "fs";
import { encodePng } from "./png.mjs";

const W = 46;
const H = 52;
const SCALE = 8;
const GROUND = 48;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const pal = (...cs) => cs.map(hex);

const GRASS = pal("#3f5f2c", "#5a7f36", "#7fa448", "#a9c76a");
const FLOWERS = pal("#f2c4cf", "#ffffff", "#b9d3ec", "#f6e27a");
const BARK = pal("#3b2e26", "#54433a", "#6e5b4e", "#8a7565");

function canvas(seed) {
  const px = new Array(W * H).fill(null);
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && x < W && y >= 0 && y < H && c) px[y * W + x] = c;
  };
  const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? px[y * W + x] : null);
  return { px, rand, set, get };
}

const pick = (arr, v) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(v)))];

// A grassy mound with a few tiny flowers, like the base of the original tree.
function ground(c, cx, half, fallen = null) {
  for (let x = Math.round(cx - half); x <= cx + half; x++) {
    const t = Math.abs(x - cx) / half;
    const top = GROUND + Math.round(t * t * 1.5);
    for (let y = top; y <= GROUND + 2; y++) c.set(x, y, pick(GRASS, y === top ? 2 + c.rand() : 1 - (y - top) * 0.5));
    if (c.rand() < 0.5) c.set(x, top - 1, pick(GRASS, 1.5 + c.rand() * 2));
    if (c.rand() < 0.14 && t < 0.9) c.set(x, top - 1 - Math.round(c.rand()), FLOWERS[Math.floor(c.rand() * FLOWERS.length)]);
    if (fallen && c.rand() < 0.22) c.set(x, top, fallen[Math.floor(c.rand() * fallen.length)]);
  }
}

// A tapering limb, lit from the left.
function limb(c, x0, y0, x1, y1, w0, w1, bark = BARK) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const w = w0 + (w1 - w0) * t;
    for (let dx = -w / 2; dx <= w / 2; dx += 0.5) {
      const rel = (dx + w / 2) / Math.max(w, 1);
      c.set(x + dx, y, bark[rel < 0.3 ? 3 : rel < 0.6 ? 2 : rel < 0.85 ? 1 : 0]);
    }
  }
}

// Foliage built from overlapping clumps. Each pixel is shaded by where it sits in its own clump
// (lit from the upper left) plus the crown as a whole, with a little dither for texture.
function foliage(c, clumps, colors, { light = [-0.45, -0.45], gaps = 0.04, accent = null, accentRate = 0 } = {}) {
  const shade = new Array(W * H).fill(-1);
  const top = Math.min(...clumps.map((k) => k.cy - k.r));
  const bottom = Math.max(...clumps.map((k) => k.cy + k.r));
  for (const { cx, cy, r } of [...clumps].sort((a, b) => b.cy - a.cy)) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy > (r + (c.rand() - 0.5) * 1.3) ** 2 || x < 0 || x >= W || y < 0 || y >= H) continue;
        const local = Math.hypot(dx + r * -light[0], dy + r * -light[1]) / (r * 1.7);
        const global = (y - top) / Math.max(bottom - top, 1);
        const n = colors.length - 1;
        shade[y * W + x] = n + 0.4 - local * n * 0.75 - global * n * 0.45 + (c.rand() - 0.5) * 1.1;
      }
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = shade[y * W + x];
      if (v === -1) continue;
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => {
        const nx = x + ox;
        const ny = y + oy;
        return nx < 0 || nx >= W || ny < 0 || ny >= H || shade[ny * W + nx] === -1;
      });
      if (!edge && c.rand() < gaps) continue; // small holes let the branches show through
      if (accent && c.rand() < accentRate) {
        c.set(x, y, accent[Math.floor(c.rand() * accent.length)]);
        continue;
      }
      c.set(x, y, pick(colors, edge && y > top + 3 ? Math.min(v, 1) : v));
    }
  }
}

function clumpsIn(c, cx, cy, rx, ry, count, rMin, rMax) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = c.rand() * Math.PI * 2;
    const d = Math.sqrt(c.rand());
    out.push({ cx: cx + Math.cos(a) * d * rx, cy: cy + Math.sin(a) * d * ry, r: rMin + c.rand() * (rMax - rMin) });
  }
  return out;
}

// Loose leaves or petals floating just outside the crown.
function scatter(c, cx, cy, rx, ry, count, colors) {
  for (let i = 0; i < count; i++) {
    const a = c.rand() * Math.PI * 2;
    const d = 1 + c.rand() * 0.18;
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    if (!c.get(Math.round(x), Math.round(y))) c.set(x, y, colors[Math.floor(c.rand() * colors.length)]);
  }
}

const TREES = {
  pine(c) {
    const greens = pal("#1f3527", "#2c4a33", "#3d6340", "#567f50", "#7c9e66");
    ground(c, 23, 13, pal("#3d6340", "#567f50"));
    limb(c, 23, GROUND, 23, 38, 4, 3);
    // Stacked tiers, each a jagged triangle overlapping the one below.
    const tiers = [
      [4, 12, 5],
      [9, 19, 8],
      [15, 27, 11],
      [21, 34, 14],
      [27, 41, 17],
    ];
    for (const [apex, base, half] of tiers.reverse()) {
      for (let y = apex; y <= base; y++) {
        const t = (y - apex) / (base - apex);
        const w = half * t + 0.5;
        for (let x = Math.floor(23 - w); x <= 23 + w; x++) {
          const rel = (x - (23 - w)) / (2 * w + 0.01);
          const edge = Math.abs(x - 23) > w - 1;
          if (edge && c.rand() < 0.35) continue;
          const v = 3.6 - rel * 2.4 - t * 1.2 + (c.rand() - 0.5) * 1.1;
          c.set(x, y, pick(greens, y === base || edge ? Math.min(v, 1.4) : v));
        }
        if (y === base) for (let k = 0; k < 3; k++) c.set(23 - half + c.rand() * half * 2, y + 1, greens[1]);
      }
    }
    c.set(23, 3, greens[3]);
    return greens.slice(1, 4);
  },

  autumn(c) {
    const leaves = pal("#7a2f1d", "#a8482a", "#c8642f", "#de8a3a", "#efb04d", "#f6cf72");
    ground(c, 23, 15, leaves.slice(2, 5));
    limb(c, 23, GROUND, 22, 30, 5, 3);
    limb(c, 22, 36, 14, 25, 2.4, 1.2);
    limb(c, 23, 34, 32, 24, 2.4, 1.2);
    foliage(c, clumpsIn(c, 23, 20, 15, 12, 30, 4, 7), leaves, { gaps: 0.015 });
    scatter(c, 23, 20, 20, 16, 14, leaves.slice(2, 6));
    return leaves.slice(1, 5);
  },

  blossom(c) {
    const pinks = pal("#9e5468", "#c97a90", "#e3a1b3", "#f0c1cd", "#fadde4", "#fff3f6");
    ground(c, 23, 16, pal("#f0c1cd", "#fadde4", "#e3a1b3"));
    limb(c, 22, GROUND, 21, 33, 4.5, 3);
    limb(c, 21, 36, 9, 26, 2.6, 1.2);
    limb(c, 22, 35, 36, 25, 2.6, 1.2);
    limb(c, 21, 33, 22, 18, 2, 1);
    // A wide, airy crown with branches showing through the gaps.
    foliage(c, clumpsIn(c, 23, 21, 19, 9, 34, 3, 5.5), pinks, {
      gaps: 0.03,
      accent: pal("#87a454", "#acbe62"),
      accentRate: 0.03,
    });
    scatter(c, 23, 21, 23, 13, 18, pinks.slice(3));
    return pinks.slice(2, 6);
  },

  birch(c) {
    const greens = pal("#4f7032", "#6f9440", "#93b752", "#b6d16c", "#d3e48f");
    const birchBark = pal("#8c8a84", "#c9c5bb", "#e6e2d8", "#f6f3ec");
    ground(c, 23, 11);
    limb(c, 23, GROUND, 23, 14, 3.4, 2, birchBark);
    limb(c, 23, 30, 31, 20, 1.6, 1, birchBark);
    limb(c, 23, 26, 16, 17, 1.6, 1, birchBark);
    // Dark lenticel marks on the pale bark.
    for (let y = 18; y < GROUND; y += 2 + Math.floor(c.rand() * 3)) {
      c.set(22 + Math.round(c.rand()), y, hex("#2e2a26"));
      if (c.rand() < 0.4) c.set(23, y, hex("#4a4540"));
    }
    // A light, loose crown made of small separate clumps.
    foliage(c, clumpsIn(c, 23, 16, 12, 13, 22, 2.5, 4.5), greens, { gaps: 0.03 });
    scatter(c, 23, 16, 15, 16, 16, greens.slice(2));
    return greens.slice(1, 5);
  },

  cypress(c) {
    const greens = pal("#1d3324", "#2a4731", "#3a5f3f", "#527a4f", "#6f9461");
    ground(c, 23, 10);
    limb(c, 23, GROUND, 23, 42, 3, 2.5);
    // A tall flame: clumps stacked along a narrowing column.
    const clumps = [];
    for (let y = 5; y <= 40; y += 2) {
      const t = (y - 5) / 35;
      const w = 2.5 + Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * 5.5;
      clumps.push({ cx: 23 + (c.rand() - 0.5) * 2, cy: y, r: w * (0.75 + c.rand() * 0.3) });
    }
    foliage(c, clumps, greens, { light: [-0.6, -0.2], gaps: 0.03 });
    return greens.slice(1, 4);
  },
};

mkdirSync("public/images/trees", { recursive: true });
const leafColors = {};
let seed = 90210;
for (const [name, draw] of Object.entries(TREES)) {
  const c = canvas(seed++);
  leafColors[name] = draw(c).map((rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""));
  writeFileSync(`public/images/trees/${name}.png`, encodePng(c.px, W, H, SCALE));
  console.log(`wrote public/images/trees/${name}.png`);
}
console.log("falling-piece colours:", JSON.stringify(leafColors));
