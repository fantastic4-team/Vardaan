// A portrait (3:4) soft-focus botanical poster: periwinkle sky, tall green stalks, big lavender
// petals, a slender stem with a drooping crown of leaves, broad dark-green arches, a bloom of fat
// petals glowing from white to lime, dark bushes and a coral flower up close. Every shape is
// shaded for volume (lit from the upper left, darker at the rim) and each depth layer is blurred
// a different amount. Heavy grain is added on top in CSS (see .poster-grain).
const W = 900;
const H = 1200;

// A fat, round-tipped petal standing on its base, rotated about the base.
function petal(x: number, base: number, top: number, w: number) {
  const h = base - top;
  return `M${x - w / 2} ${base} C${x - w / 2} ${top + h * 0.42} ${x - w * 0.36} ${top} ${x} ${top} C${x + w * 0.36} ${top} ${x + w / 2} ${top + h * 0.42} ${x + w / 2} ${base} Z`;
}

// A broad rounded arch rising from below the frame.
function arch(x0: number, x1: number, top: number, base = H + 60) {
  const mid = (x0 + x1) / 2;
  const w = x1 - x0;
  return `M${x0} ${base} C${x0} ${top + w * 0.15} ${mid - w * 0.36} ${top} ${mid} ${top} C${mid + w * 0.36} ${top} ${x1} ${top + w * 0.15} ${x1} ${base} Z`;
}

// A thick crescent leaf hanging from the crown point (cx, cy), swept out to `dir` (-1 or 1).
function crownLeaf(cx: number, cy: number, dir: number, reach: number, drop: number) {
  const ex = cx + dir * reach;
  const ey = cy + drop;
  // The tip hooks back inward, like a curling frond.
  return `M${cx} ${cy} C${cx + dir * reach * 0.3} ${cy - 95} ${ex + dir * 25} ${cy - 70} ${ex} ${ey} C${ex - dir * 22} ${ey - 30} ${ex - dir * 20} ${cy - 25} ${cx + dir * reach * 0.3} ${cy - 22} C${cx + dir * 25} ${cy - 18} ${cx + dir * 10} ${cy} ${cx} ${cy + 18} Z`;
}

const BLOOM_X = 450;
const BLOOM_BASE = 1150;
const BLOOM = [
  { angle: -44, top: 700, w: 200 },
  { angle: 44, top: 700, w: 200 },
  { angle: -22, top: 560, w: 235 },
  { angle: 22, top: 560, w: 235 },
  { angle: 0, top: 470, w: 255 },
];

// The full 3:4 poster is always visible in the middle (the viewBox is fitted with "meet"), and
// the scene carries on past its edges with overflow visible, so the art fills a box of any shape
// without cropping or stretching. The wordmark and signature are drawn in, so they stay aligned.
export default function PosterArt({ className = "" }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Vardaan"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className={className}
    >
      <defs>
        <linearGradient id="pa-sky" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#535ce6" />
          <stop offset="1" stopColor="#6f7cf2" />
        </linearGradient>
        {/* Volume shading: lit from the upper left, darkening toward the far rim. */}
        <radialGradient id="pa-stalk" cx="0.3" cy="0.2" r="1">
          <stop offset="0" stopColor="#8fd25a" />
          <stop offset="0.55" stopColor="#4c9c3e" />
          <stop offset="1" stopColor="#24622b" />
        </radialGradient>
        <radialGradient id="pa-arch" cx="0.35" cy="0.12" r="0.95">
          <stop offset="0" stopColor="#2f7330" />
          <stop offset="0.45" stopColor="#174a1f" />
          <stop offset="1" stopColor="#0b2b16" />
        </radialGradient>
        <radialGradient id="pa-leaf" cx="0.3" cy="0.2" r="1">
          <stop offset="0" stopColor="#a6e05e" />
          <stop offset="0.6" stopColor="#4f9f3b" />
          <stop offset="1" stopColor="#25652c" />
        </radialGradient>
        <linearGradient id="pa-stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a8a35" />
          <stop offset="0.45" stopColor="#8bd255" />
          <stop offset="1" stopColor="#3a8a35" />
        </linearGradient>
        <radialGradient id="pa-white" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#e6e9ff" />
          <stop offset="1" stopColor="#b9c0ef" />
        </radialGradient>
        <linearGradient id="pa-bloom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f6ff" />
          <stop offset="0.2" stopColor="#eef1fb" />
          <stop offset="0.4" stopColor="#d3ec86" />
          <stop offset="0.62" stopColor="#97d03a" />
          <stop offset="1" stopColor="#5fa82a" />
        </linearGradient>
        <radialGradient id="pa-bloom-rim" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2c6a1f" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="pa-lilac" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#efe6ff" />
          <stop offset="1" stopColor="#c3a9f2" />
        </radialGradient>
        <radialGradient id="pa-bush" cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#2f6b3a" />
          <stop offset="0.6" stopColor="#1b4a33" />
          <stop offset="1" stopColor="#10302a" />
        </radialGradient>
        <radialGradient id="pa-coral" cx="0.5" cy="0.9" r="1">
          <stop offset="0" stopColor="#ff2f1f" />
          <stop offset="0.45" stopColor="#ff5d6e" />
          <stop offset="0.8" stopColor="#ff9cc4" />
          <stop offset="1" stopColor="#d9a4ff" />
        </radialGradient>

        <filter id="pa-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="glow" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="soft" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="soft" />
          </feMerge>
        </filter>
        <filter id="pa-far" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pa-mid" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="pa-near" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="pa-front" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Sky well past every edge, so wide or tall boxes never show a gap. */}
      <rect x={-1600} y={-1600} width={W + 3200} height={H + 3200} fill="#5f6bec" />
      <rect width={W} height={H} fill="url(#pa-sky)" />

      {/* Extension: stalks, lavender petals and arches carrying the scene out to the sides. */}
      <g filter="url(#pa-far)">
        <path d={arch(-420, -250, -200)} fill="url(#pa-stalk)" />
        <path d={arch(1080, 1230, -180)} fill="url(#pa-stalk)" />
        <path d={arch(1500, 1640, -150)} fill="url(#pa-stalk)" opacity="0.9" />
        <path d={arch(-760, -620, -120)} fill="url(#pa-stalk)" opacity="0.9" />
      </g>
      <g filter="url(#pa-mid)">
        {[
          [1080, 560, 150, 12],
          [1210, 520, 160, 0],
          [-180, 520, 150, -10],
          [-320, 560, 150, 4],
        ].map(([x, base, w, a], k) => (
          <path key={k} d={petal(x, base, base - 330, w)} fill="url(#pa-lilac)" transform={`rotate(${a} ${x} ${base})`} />
        ))}
        <path d={arch(-700, -120, 420)} fill="url(#pa-arch)" />
        <path d={arch(980, 1560, 400)} fill="url(#pa-arch)" />
        <path d={arch(1450, 2000, 480)} fill="url(#pa-arch)" opacity="0.9" />
        <path d={arch(-1150, -600, 470)} fill="url(#pa-arch)" opacity="0.9" />
        <rect x={-1600} y={H - 40} width={W + 3200} height={1700} fill="#173f24" />
      </g>

      {/* Far: tall stalks reaching out of the top of the frame. */}
      <g filter="url(#pa-far)">
        <path d={arch(400, 600, -200)} fill="url(#pa-stalk)" />
        <path d={arch(740, 900, -160)} fill="url(#pa-stalk)" opacity="0.95" />
      </g>

      {/* Lavender petals, large and soft, top right. */}
      <g filter="url(#pa-mid)">
        {[
          [560, 470, 150, -8],
          [690, 420, 160, 0],
          [820, 440, 160, 8],
          [930, 520, 150, 16],
        ].map(([x, base, w, a], k) => (
          <path key={k} d={petal(x, base, base - 340, w)} fill="url(#pa-lilac)" transform={`rotate(${a} ${x} ${base})`} />
        ))}
      </g>

      {/* Broad dark arches behind the bloom. */}
      <g filter="url(#pa-mid)">
        <path d={arch(-140, 330, 400)} fill="url(#pa-arch)" />
        <path d={arch(520, 1020, 370)} fill="url(#pa-arch)" />
        <path d={arch(170, 460, 640)} fill="url(#pa-arch)" opacity="0.9" />
      </g>

      {/* A slender stem with a drooping crown of leaves and two white petals. */}
      <g filter="url(#pa-near)">
        <rect x="282" y="300" width="24" height="760" rx="12" fill="url(#pa-stem)" />
        <path d="M294 300 C 250 220 190 175 120 185 C 175 215 235 265 270 315 Z" fill="url(#pa-white)" />
        <path d="M294 300 C 338 220 398 175 468 185 C 413 215 353 265 318 315 Z" fill="url(#pa-white)" />
        {[
          [-1, 170, 95],
          [1, 170, 95],
          [-1, 120, 120],
          [1, 120, 120],
          [-1, 60, 115],
          [1, 60, 115],
        ].map(([dir, reach, drop], k) => (
          <path key={k} d={crownLeaf(294, 318, dir, reach, drop)} fill="url(#pa-leaf)" />
        ))}
        <ellipse cx="294" cy="322" rx="34" ry="26" fill="#2f7a33" />
      </g>

      {/* The bloom: fat petals glowing from white at the tips to lime at the base. */}
      <g filter="url(#pa-near)">
        {BLOOM.map(({ angle, top, w }, k) => (
          <g key={k} transform={`rotate(${angle} ${BLOOM_X} ${BLOOM_BASE})`}>
            <path d={petal(BLOOM_X, BLOOM_BASE, top, w)} fill="url(#pa-bloom)" />
            <path d={petal(BLOOM_X, BLOOM_BASE, top, w)} fill="url(#pa-bloom-rim)" />
          </g>
        ))}
      </g>

      {/* Front: dark bushes and a coral flower, very close to the lens. */}
      <g filter="url(#pa-front)">
        <path d={arch(-260, 260, 760)} fill="url(#pa-bush)" />
        <path d={arch(-60, 500, 1060)} fill="url(#pa-bush)" />
        <path d={arch(760, 1080, 820)} fill="url(#pa-bush)" />
        {[
          [560, 1240, 170, -26],
          [870, 1240, 170, 26],
          [650, 1230, 190, -10],
          [780, 1230, 190, 10],
          [715, 1250, 200, 0],
        ].map(([x, base, w, a], k) => (
          <path key={k} d={petal(x, base, base - 290, w)} fill="url(#pa-coral)" transform={`rotate(${a} ${x} ${base})`} />
        ))}
      </g>
      {/* Extension in front: bushes along the bottom on both sides. */}
      <g filter="url(#pa-front)">
        <path d={arch(-700, -140, 840)} fill="url(#pa-bush)" />
        <path d={arch(1020, 1600, 860)} fill="url(#pa-bush)" />
        <path d={arch(-1300, -650, 900)} fill="url(#pa-bush)" />
        <path d={arch(1500, 2200, 900)} fill="url(#pa-bush)" />
      </g>

      {/* Wordmark set softly into the bloom, and the logo as a signature. */}
      <g className="poster-wordmark-in">
        <text
          x={W / 2}
          y={888}
          textAnchor="middle"
          fill="#ecf7b4"
          filter="url(#pa-glow)"
          style={{ fontFamily: "var(--font-poster)", fontWeight: 600, fontSize: 171, letterSpacing: "-0.035em" }}
        >
          vardaan
        </text>
      </g>
      <image href="/images/logo.png" x={W / 2 - 52} y={1140} width={104} height={18} style={{ filter: "invert(1)", opacity: 0.9 }} />
    </svg>
  );
}
