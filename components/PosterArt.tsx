// A portrait (3:4), soft-focus botanical poster: a blue-violet sky, tall dark leaves, a stem with a
// crown of leaves, pale lavender petals, a fan of petals fading from white to lime in the
// middle, dark bushes and a coral bloom in front. Each depth layer is blurred a different
// amount; film grain is added on top in CSS (see .poster-grain).
const W = 900;
const H = 1200;

// A tall petal standing on `base`, pointed at the top, rotated about its base.
function petal(x: number, base: number, top: number, w: number) {
  const h = base - top;
  return `M${x - w / 2} ${base} C${x - w / 2} ${top + h * 0.34} ${x - w * 0.14} ${top} ${x} ${top} C${x + w * 0.14} ${top} ${x + w / 2} ${top + h * 0.34} ${x + w / 2} ${base} Z`;
}

// A rounded arch, like a broad leaf seen edge-on rising from the ground.
function arch(x0: number, x1: number, top: number, base = H + 40) {
  const mid = (x0 + x1) / 2;
  const w = x1 - x0;
  return `M${x0} ${base} C${x0} ${top + w * 0.2} ${mid - w * 0.3} ${top} ${mid} ${top} C${mid + w * 0.3} ${top} ${x1} ${top + w * 0.2} ${x1} ${base} Z`;
}

const FAN_X = 450;
const FAN_BASE = 1270;
const FAN = [
  { angle: -30, top: 640, w: 140 },
  { angle: -15, top: 540, w: 160 },
  { angle: 0, top: 460, w: 175 },
  { angle: 15, top: 540, w: 160 },
  { angle: 30, top: 640, w: 140 },
];

export default function PosterArt({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id="pa-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a5fe0" />
          <stop offset="0.6" stopColor="#6c78ee" />
          <stop offset="1" stopColor="#8a96f2" />
        </linearGradient>
        <linearGradient id="pa-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7a35" />
          <stop offset="1" stopColor="#173f22" />
        </linearGradient>
        <linearGradient id="pa-stalk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f9b3a" />
          <stop offset="0.5" stopColor="#7cc84a" />
          <stop offset="1" stopColor="#3a8a35" />
        </linearGradient>
        <linearGradient id="pa-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fd24c" />
          <stop offset="1" stopColor="#2f7d33" />
        </linearGradient>
        <linearGradient id="pa-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f4ff" />
          <stop offset="0.38" stopColor="#eef3dc" />
          <stop offset="0.7" stopColor="#c6e86a" />
          <stop offset="1" stopColor="#86c63a" />
        </linearGradient>
        <linearGradient id="pa-lilac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#ece4fb" />
          <stop offset="1" stopColor="#b9a6ee" />
        </linearGradient>
        <radialGradient id="pa-coral" cx="0.5" cy="0.85" r="0.9">
          <stop offset="0" stopColor="#ff3b2f" />
          <stop offset="0.55" stopColor="#ff6f8f" />
          <stop offset="1" stopColor="#e2a6ff" />
        </radialGradient>
        <radialGradient id="pa-bush" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#2f6f37" />
          <stop offset="1" stopColor="#123522" />
        </radialGradient>
        <radialGradient id="pa-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <filter id="pa-far" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="pa-mid" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="pa-near" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="pa-front" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#pa-sky)" />

      {/* Far: tall stalks and broad dark arches. */}
      <g filter="url(#pa-far)">
        <path d={arch(560, 700, -140)} fill="url(#pa-stalk)" opacity="0.9" />
        <path d={arch(330, 440, -60)} fill="url(#pa-stalk)" opacity="0.75" />
        <path d={arch(-80, 360, 560)} fill="url(#pa-dark)" />
        <path d={arch(560, 1000, 500)} fill="url(#pa-dark)" />
      </g>

      {/* Middle: lilac petals top right, and a slender stem with a crown of leaves. */}
      <g filter="url(#pa-mid)">
        {[
          [600, 330, 110],
          [710, 290, 120],
          [820, 330, 110],
          [910, 390, 100],
        ].map(([x, top, w], k) => (
          <path key={k} d={petal(x, top + 330, top - 160, w)} fill="url(#pa-lilac)" />
        ))}
        <rect x="238" y="330" width="22" height="900" rx="11" fill="url(#pa-stalk)" />
        {[-150, -110, -60, 60, 110, 150].map((a, k) => (
          <path
            key={k}
            d="M249 330 C 270 270 360 250 440 300 C 400 300 320 300 249 340 Z"
            fill="url(#pa-leaf)"
            transform={`rotate(${a < 0 ? 180 + a + 90 : a - 90 + 90} 249 330) ${a < 0 ? "scale(-1 1) translate(-498 0)" : ""}`}
          />
        ))}
        <path d="M249 300 C 220 230 160 200 100 210 C 160 240 200 280 230 320 Z" fill="#f2f1ff" />
        <path d="M249 300 C 278 230 338 200 398 210 C 338 240 298 280 268 320 Z" fill="#f2f1ff" />
      </g>

      {/* Near: the fan of petals in the middle, white at the tips fading to lime. */}
      <g filter="url(#pa-near)">
        {FAN.map(({ angle, top, w }, k) => (
          <path key={k} d={petal(FAN_X, FAN_BASE, top, w)} fill="url(#pa-petal)" transform={`rotate(${angle} ${FAN_X} ${FAN_BASE})`} />
        ))}
      </g>

      {/* Front: dark bushes and a coral bloom, heavily blurred as if very close to the lens. */}
      <g filter="url(#pa-front)">
        <ellipse cx="20" cy="1050" rx="250" ry="320" fill="url(#pa-bush)" />
        <ellipse cx="230" cy="1230" rx="220" ry="130" fill="url(#pa-bush)" />
        <ellipse cx="900" cy="980" rx="190" ry="320" fill="url(#pa-bush)" />
        {[
          [600, 1150, -24],
          [685, 1125, 0],
          [770, 1155, 24],
          [645, 1190, -10],
          [730, 1195, 12],
        ].map(([x, y, a], k) => (
          <ellipse key={k} cx={x} cy={y} rx="70" ry="120" fill="url(#pa-coral)" transform={`rotate(${a} ${x} ${y + 100})`} />
        ))}
      </g>

      <rect width={W} height={H} fill="url(#pa-vignette)" />
    </svg>
  );
}
