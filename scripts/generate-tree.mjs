// Generates the pixel-art tree used on the landing page: public/images/tree.png (73x81).
// Run with `node scripts/generate-tree.mjs [scale]`; an optional scale writes an enlarged preview too.
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";

const W = 73;
const H = 81;
const px = new Array(W * H).fill(null);

let seed = 20261018;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const LEAF = ["#1f2e1f", "#334932", "#4b6239", "#6b8a45", "#87a454", "#acbe62"].map(hex);
const BARK = ["#2e1f14", "#4a3220", "#6b4a2e", "#8a6440"].map(hex);
const GRASS = ["#334932", "#4b6239", "#87a454", "#acbe62"].map(hex);

const set = (x, y, c) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c;
};
const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? px[y * W + x] : null);

// ---- Ground: a soft grass mound with tufts ----
const groundY = 77;
for (let x = 14; x <= 58; x++) {
  const t = Math.abs(x - 36) / 22;
  const top = groundY + Math.round(t * t * 2.5);
  for (let y = top; y <= 79; y++) set(x, y, y === top ? GRASS[2] : GRASS[y - top > 1 ? 0 : 1]);
  if (rand() < 0.45 && t < 0.95) set(x, top - 1, GRASS[rand() < 0.5 ? 2 : 3]);
  if (rand() < 0.12 && t < 0.8) set(x, top - 2, GRASS[3]);
}

// ---- Trunk, roots and branches ----
function limb(x0, y0, x1, y1, w0, w1) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t + Math.sin(t * 5 + x0) * 0.6;
    const y = y0 + (y1 - y0) * t;
    const w = w0 + (w1 - w0) * t;
    for (let dx = -w / 2; dx <= w / 2; dx += 0.5) {
      const rel = (dx + w / 2) / Math.max(w, 1);
      const shade = rel < 0.25 ? 3 : rel < 0.55 ? 2 : rel < 0.85 ? 1 : 0;
      set(x + dx, y, BARK[shade]);
    }
  }
}
limb(36, 78, 35, 50, 8, 4.5);
limb(33, 78, 27, 79, 3, 1.5);
limb(39, 78, 46, 79, 3, 1.5);
limb(35, 60, 22, 44, 3.5, 1.5);
limb(36, 58, 50, 42, 3.5, 1.5);
limb(35, 52, 31, 36, 3, 1.5);
limb(36, 54, 42, 34, 2.5, 1.2);
// Bark texture: a few knots and grooves.
for (const [x, y] of [[35, 70], [37, 66], [34, 63], [36, 74]]) set(x, y, BARK[0]);

// ---- Canopy: overlapping clumps, each lit from the upper left ----
const clumps = [];
for (let i = 0; i < 46; i++) {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand());
  const cx = 36 + Math.cos(a) * d * 26;
  const cy = 30 + Math.sin(a) * d * 19;
  if (cy > 44 && Math.abs(cx - 36) < 10) continue; // keep the trunk visible under the crown
  clumps.push({ cx, cy, r: 5 + rand() * 4.5 });
}
// Sort so lower clumps are drawn first and upper ones overlap them.
clumps.sort((a, b) => b.cy - a.cy);

const canopy = new Array(W * H).fill(-1);
for (const { cx, cy, r } of clumps) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const edgeNoise = (rand() - 0.5) * 1.6;
      if (dx * dx + dy * dy > (r + edgeNoise) ** 2 || x < 0 || x >= W || y < 0 || y >= H) continue;
      // Local light: distance from the clump's lit point; global light: higher is brighter.
      const local = Math.hypot(dx + r * 0.45, dy + r * 0.45) / (r * 1.6);
      const global = (y - 8) / 44 + Math.max(0, (x - 36) / 60);
      let v = 5.2 - local * 3.2 - global * 2.2 + (rand() - 0.5) * 0.9;
      canopy[y * W + x] = Math.max(1, Math.min(5, Math.round(v)));
    }
  }
}
// Edge pixels of the crown get the darkest tone for a crisp silhouette.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const v = canopy[y * W + x];
    if (v < 0) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => {
      const nx = x + ox;
      const ny = y + oy;
      return nx < 0 || nx >= W || ny < 0 || ny >= H || canopy[ny * W + nx] < 0;
    });
    const below = y + 1 < H && canopy[(y + 1) * W + x] < 0;
    set(x, y, LEAF[edge ? (below ? 0 : Math.min(v, 1)) : v]);
  }
}
// Scatter a few loose leaves around the crown.
for (let i = 0; i < 18; i++) {
  const a = rand() * Math.PI * 2;
  const x = 36 + Math.cos(a) * (29 + rand() * 4);
  const y = 30 + Math.sin(a) * (21 + rand() * 3);
  if (!get(Math.round(x), Math.round(y))) set(x, y, LEAF[2 + Math.floor(rand() * 3)]);
}

// ---- PNG encoding ----
function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(scale) {
  const w = W * scale;
  const h = H * scale;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const c = px[Math.floor(y / scale) * W + Math.floor(x / scale)];
      const o = y * (w * 4 + 1) + 1 + x * 4;
      if (c) [raw[o], raw[o + 1], raw[o + 2], raw[o + 3]] = [...c, 255];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/tree.png", png(1));
const preview = Number(process.argv[2]);
if (preview > 1) writeFileSync(process.argv[3] ?? "tree-preview.png", png(preview));
console.log("wrote public/images/tree.png");
