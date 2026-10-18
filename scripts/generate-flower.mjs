// Generates the pixel-art flower for the vision section: public/images/flower.png (56x84).
// Run with `node scripts/generate-flower.mjs [scale] [previewPath]`.
import { writeFileSync, mkdirSync } from "fs";
import { encodePng } from "./png.mjs";

const W = 56;
const H = 84;
const px = new Array(W * H).fill(null);

let seed = 7041993;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PETAL = ["#c4573a", "#de7d4f", "#eba55c", "#f4c656", "#f9dc72", "#fdeea6", "#fff8d6"].map(hex);
const STEM = ["#3d5229", "#4b6239", "#6b8a45", "#c99a3c"].map(hex);
const LEAF = ["#3d5229", "#5a7a35", "#7fa443", "#a5c95a", "#c9e07d"].map(hex);

const set = (x, y, c) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c;
};

// ---- Leaves: tapered blades growing out from the stem ----
function leaf(x0, y0, len, angle, width, droop) {
  for (let t = 0; t <= 1; t += 0.5 / len) {
    const bend = droop * t * t;
    const cx = x0 + Math.cos(angle) * len * t;
    const cy = y0 + Math.sin(angle) * len * t + bend;
    const w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35);
    // Perpendicular to the blade direction.
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    for (let s = -w; s <= w; s += 0.5) {
      if (rand() < 0.06 && Math.abs(s) > w - 1.2) continue; // ragged edge
      const side = s / Math.max(w, 0.01); // -1 top edge .. 1 bottom edge
      let v = 3 - side * 1.6 - t * 0.6 + (rand() - 0.5) * 1.2;
      if (Math.abs(s) < 0.5) v = 1.5; // midrib
      set(cx + nx * s, cy + ny * s, LEAF[Math.max(0, Math.min(4, Math.round(v)))]);
    }
  }
}

// ---- Stem ----
const stemX = (y) => 29 + Math.sin(y / 9) * 0.8;
for (let y = 30; y <= 80; y++) {
  const x = stemX(y);
  set(x - 1, y, STEM[rand() < 0.7 ? 1 : 0]);
  set(x, y, STEM[y > 40 && rand() < 0.6 ? 3 : 2]);
  if (rand() < 0.25) set(x + 1, y, STEM[0]);
}

leaf(28, 62, 22, Math.PI + 0.3, 6, 5);
leaf(30, 58, 22, -0.28, 5.5, 6);
leaf(28, 71, 14, Math.PI + 0.15, 3.8, 3);
leaf(30, 42, 9, -0.55, 2.2, 1.5);
leaf(28, 38, 8, Math.PI + 0.5, 2, 1.5);

// Ground: a few scattered tufts at the base.
for (let x = 16; x <= 42; x++) {
  if (rand() < 0.4) set(x, 81 + Math.floor(rand() * 2), LEAF[1 + Math.floor(rand() * 3)]);
  if (rand() < 0.15) set(x, 80, LEAF[2 + Math.floor(rand() * 2)]);
}

// ---- Sepals cupping the bloom ----
for (let x = 21; x <= 37; x++) {
  const d = Math.abs(x - 29) / 8;
  const y = 29 + Math.round(d * 1.5);
  if (rand() < 0.75) set(x, y, LEAF[1 + Math.floor(rand() * 2)]);
  if (d < 0.5 && rand() < 0.7) set(x, y + 1, LEAF[1]);
}

// ---- Bloom: a dome of thin petals radiating from a point just below its centre ----
const bx = 28.5;
const by = 20;
const petals = 40;
const phases = Array.from({ length: petals }, () => rand());
for (let y = 0; y < 36; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - bx;
    const dy = y + 0.5 - by;
    const a = Math.atan2(dy, dx); // -PI..PI, upper half is negative
    const r = Math.hypot(dx / 1.05, dy);
    if (dy > 9) continue;

    // Which petal strand this pixel sits on, and how far along it.
    const p = ((a + Math.PI) / (2 * Math.PI)) * petals;
    const idx = Math.floor(p) % petals;
    const across = Math.abs((p % 1) - 0.5) * 2; // 0 centre of petal .. 1 gap
    const reach = 14 + phases[idx] * 6 - (dy > 0 ? dy * 0.9 : 0);
    if (r > reach || (across > 0.9 && r > 7) || (r > reach - 1.5 && across > 0.6)) continue;

    // Petals are warm orange at the base, pale yellow toward the tips; lit from the top.
    const along = r / reach;
    // Every few petals carries a deeper orange streak, like the reference bloom.
    const tint = idx % 3 === 0 ? -1.3 : idx % 5 === 0 ? -0.7 : 0;
    let v = 2 + along * 3.4 - across * 1.6 + tint + (dy < -8 ? 0.5 : 0) + (dy > 2 ? -0.8 : 0) + (rand() - 0.5) * 1.2;
    if (r < 4) v = 1 + rand();
    set(x, y, PETAL[Math.max(0, Math.min(6, Math.round(v)))]);
  }
}
// A few loose petal tips around the bloom for a soft, hand-made edge.
for (let i = 0; i < 26; i++) {
  const a = -Math.PI * (0.03 + rand() * 0.94);
  const d = 17 + rand() * 5;
  set(bx + Math.cos(a) * d * 1.05, by + Math.sin(a) * d, PETAL[3 + Math.floor(rand() * 3)]);
}

mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/flower.png", encodePng(px, W, H, 1));
const preview = Number(process.argv[2]);
if (preview > 1) writeFileSync(process.argv[3] ?? "flower-preview.png", encodePng(px, W, H, preview));
console.log("wrote public/images/flower.png");
