// Generates the pixel-art flower for the vision section: public/images/flower.png (40x60).
// Run with `node scripts/generate-flower.mjs [scale] [previewPath]`.
import { writeFileSync, mkdirSync } from "fs";
import { encodePng } from "./png.mjs";

const W = 40;
const H = 60;
const px = new Array(W * H).fill(null);

let seed = 3127;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// Bloom: warm streak tones, then yellows from deep to pale.
const STREAK = ["#d9785a", "#e89a74", "#efb48c"].map(hex);
const PETAL = ["#e9b546", "#f5cf4f", "#f9df6e", "#fcea98", "#fff5c8"].map(hex);
const STEM = { dark: hex("#4f6b2c"), mid: hex("#7a9a3a"), gold: hex("#d9a63e") };
const LEAF = ["#4f7a2c", "#6f9a36", "#93bd48", "#b5d55e", "#d2e88a"].map(hex);

const set = (x, y, c) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c;
};
const pick = (arr, v) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(v)))];

// ---- Stem: two pixels wide, green on the left with a gold highlight on the right ----
for (let y = 17; y <= 56; y++) {
  set(19, y, rand() < 0.85 ? STEM.mid : STEM.dark);
  set(20, y, y > 22 && rand() < 0.8 ? STEM.gold : STEM.mid);
}

// ---- Leaves: broad, lush blades low on the stem ----
function leaf(x0, y0, dir, len, width, lift) {
  for (let i = 0; i <= len; i++) {
    const t = i / len;
    const cx = x0 + dir * i;
    const cy = y0 - lift * Math.sin(t * Math.PI * 0.8) + t * t * 2;
    const w = width * Math.sin(Math.PI * Math.min(1, 0.15 + t)) * (1 - t * 0.3);
    for (let s = -w; s <= w; s += 1) {
      if (Math.abs(s) > w - 1 && rand() < 0.3) continue;
      // Lighter on the upper side, darker underneath and toward the stem.
      const v = 1.9 - (s / Math.max(w, 1)) * 1.5 + t * 0.5 + (rand() - 0.5) * 1.6;
      set(cx, cy + s, pick(LEAF, v));
    }
  }
}
leaf(18, 40, -1, 15, 4.2, 3);
leaf(21, 38, 1, 14, 4, 4);
leaf(18, 46, -1, 11, 3.2, 1);
leaf(18, 20, -1, 4, 1.2, 1);
leaf(21, 21, 1, 5, 1.4, 1.5);

// Ground tufts.
for (let x = 11; x <= 29; x++) {
  if (rand() < 0.45) set(x, 57 + (rand() < 0.5 ? 0 : 1), pick(LEAF, 1 + rand() * 3));
}
set(16, 56, LEAF[2]);
set(23, 56, LEAF[3]);

// ---- Bloom: a dense dome of petals fanning out from a point under its centre ----
const bx = 19.5;
const by = 14;
const PETALS = 26;
const petalLen = Array.from({ length: PETALS }, () => rand());
const petalStreak = Array.from({ length: PETALS }, (_, i) => (i % 3 === 0 ? 2 : i % 4 === 1 ? 1 : 0));

for (let y = 0; y < 22; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - bx;
    const dy = y + 0.5 - by;
    const a = Math.atan2(dy, dx); // upper half is negative
    const p = ((a + Math.PI) / (2 * Math.PI)) * PETALS;
    const idx = Math.floor(p) % PETALS;
    const across = Math.abs((p % 1) - 0.5) * 2;

    // Top of the dome reaches higher; the underside droops a little below the centre.
    const upper = dy <= 0;
    const reach = upper ? 11 + petalLen[idx] * 4 - across * 2.2 : 13 - dy * 1.6 + petalLen[idx] * 2 - across * 2;
    const r = Math.hypot(dx * 0.92, dy);
    if (r > reach || dy > 5) continue;

    const along = r / Math.max(reach, 1);
    // Petals carry warm streaks along their centre line, strongest near the base.
    const streak = petalStreak[idx];
    if (streak && across < 0.45 && along > 0.25 && rand() < 0.75) {
      set(x, y, pick(STREAK, (streak === 2 ? 0 : 1) + along * 1.6 + (rand() - 0.5)));
      continue;
    }
    const v = 0.5 + along * 2.6 - across * 0.8 + (upper ? 0.3 : -0.8) + (rand() - 0.5) * 1.4;
    set(x, y, pick(PETAL, v));
  }
}
// Petal tips poking out of the silhouette.
for (let i = 0; i < 14; i++) {
  const a = -Math.PI * (0.05 + rand() * 0.9);
  const d = 14 + rand() * 2.5;
  set(bx + (Math.cos(a) * d) / 0.92, by + Math.sin(a) * d, pick(PETAL, 2 + rand() * 2));
}
// Sepals under the bloom.
for (const [x, y, c] of [[16, 18, 2], [17, 18, 1], [18, 18, 2], [21, 18, 2], [22, 18, 1], [23, 18, 3], [19, 18, 1], [20, 18, 1], [15, 17, 3], [24, 17, 2]]) {
  set(x, y, LEAF[c]);
}

mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/flower.png", encodePng(px, W, H, 1));
const preview = Number(process.argv[2]);
if (preview > 1) writeFileSync(process.argv[3] ?? "flower-preview.png", encodePng(px, W, H, preview));
console.log("wrote public/images/flower.png");
