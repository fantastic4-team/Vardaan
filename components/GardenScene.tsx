// Wide, soft-focus garden scenes for the section page headers, drawn in the same grainy style as the
// home poster but each with its own subject: a tulip field, a lotus pond and a daisy meadow at dusk.
// Layers are blurred by depth; grain is added on top in CSS (see .poster-grain).
const W = 1600;
const H = 700;

export type Scene = "tulips" | "lotus" | "daisies";

// A fat, round-tipped petal standing on (x, base), pointing up to `top`.
function petal(x: number, base: number, top: number, w: number) {
  const h = base - top;
  return `M${x - w / 2} ${base} C${x - w / 2} ${top + h * 0.42} ${x - w * 0.36} ${top} ${x} ${top} C${x + w * 0.36} ${top} ${x + w / 2} ${top + h * 0.42} ${x + w / 2} ${base} Z`;
}

// A rolling hill across the whole width.
function hill(y: number, amp: number, phase: number) {
  let d = `M-50 ${H + 50} L-50 ${y}`;
  for (let x = -50; x <= W + 50; x += 50) d += ` L${x} ${(y + Math.sin(x / 260 + phase) * amp).toFixed(1)}`;
  return `${d} L${W + 50} ${H + 50} Z`;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function Tulip({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="0" width="10" height="260" rx="5" fill="url(#gs-stem)" />
      <path d="M0 150 C -60 110 -80 60 -70 20 C -40 60 -15 100 0 150 Z" fill="url(#gs-leaf)" />
      <path d={petal(-22, 10, -95, 62)} fill={`url(#gs-${color})`} transform="rotate(-14 -22 10)" />
      <path d={petal(22, 10, -95, 62)} fill={`url(#gs-${color})`} transform="rotate(14 22 10)" />
      <path d={petal(0, 14, -110, 66)} fill={`url(#gs-${color})`} />
    </g>
  );
}

function Lotus({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="20" rx="120" ry="26" fill="url(#gs-pad)" />
      {[-58, 58, -30, 30, 0].map((a, k) => (
        <path key={k} d={petal(0, 20, a === 0 ? -150 : Math.abs(a) === 30 ? -125 : -85, 64)} fill="url(#gs-lotus)" transform={`rotate(${a} 0 20)`} />
      ))}
    </g>
  );
}

function Daisy({ x, y, s, tilt }: { x: number; y: number; s: number; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M0 0 C 8 120 -6 240 4 420" stroke="url(#gs-stem)" strokeWidth="12" fill="none" strokeLinecap="round" />
      {Array.from({ length: 14 }, (_, k) => (
        <ellipse key={k} cx="0" cy="-58" rx="17" ry="52" fill="url(#gs-daisy)" transform={`rotate(${(k * 360) / 14})`} />
      ))}
      <circle r="32" fill="url(#gs-sun)" />
    </g>
  );
}

export default function GardenScene({ scene, className = "" }: { scene: Scene; className?: string }) {
  const rand = rng(scene === "tulips" ? 7 : scene === "lotus" ? 19 : 31);
  const sky =
    scene === "tulips" ? ["#5560e6", "#8a93f4"] : scene === "lotus" ? ["#3b46b8", "#7f6fd6"] : ["#5a4fc8", "#f19aa8"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id="gs-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f9f3b" />
          <stop offset="1" stopColor="#2b6a2d" />
        </linearGradient>
        <linearGradient id="gs-hill-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7330" />
          <stop offset="1" stopColor="#0f3519" />
        </linearGradient>
        <linearGradient id="gs-stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a8a35" />
          <stop offset="0.5" stopColor="#8bd255" />
          <stop offset="1" stopColor="#3a8a35" />
        </linearGradient>
        <radialGradient id="gs-leaf" cx="0.3" cy="0.2" r="1">
          <stop offset="0" stopColor="#a6e05e" />
          <stop offset="1" stopColor="#25652c" />
        </radialGradient>
        <radialGradient id="gs-coral" cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffb3c7" />
          <stop offset="0.6" stopColor="#ff5d6e" />
          <stop offset="1" stopColor="#e2301f" />
        </radialGradient>
        <radialGradient id="gs-lilac" cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e3d6ff" />
          <stop offset="1" stopColor="#a688ec" />
        </radialGradient>
        <radialGradient id="gs-white" cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#eef1fb" />
          <stop offset="1" stopColor="#c9e877" />
        </radialGradient>
        <linearGradient id="gs-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6fe0" />
          <stop offset="1" stopColor="#1f2a7a" />
        </linearGradient>
        <radialGradient id="gs-pad" cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#8fd25a" />
          <stop offset="1" stopColor="#24622b" />
        </radialGradient>
        <linearGradient id="gs-lotus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3ee" />
          <stop offset="0.55" stopColor="#ff9cc4" />
          <stop offset="1" stopColor="#ff5d72" />
        </linearGradient>
        <radialGradient id="gs-daisy" cx="0.5" cy="0.2" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7e4ff" />
        </radialGradient>
        <radialGradient id="gs-sun" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff6a6" />
          <stop offset="1" stopColor="#f2b53c" />
        </radialGradient>
        <filter id="gs-far" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="gs-mid" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="gs-near" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id="gs-front" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#gs-sky)" />

      {scene === "tulips" && (
        <>
          <g filter="url(#gs-far)">
            <path d={hill(380, 40, 0.4)} fill="url(#gs-hill-far)" />
            {Array.from({ length: 18 }, (_, k) => (
              <Tulip key={k} x={60 + k * 90 + rand() * 30} y={380 + rand() * 30} s={0.45} color={["coral", "lilac", "white"][k % 3]} />
            ))}
          </g>
          <g filter="url(#gs-mid)">
            <path d={hill(500, 30, 2)} fill="url(#gs-hill-near)" />
            {Array.from({ length: 10 }, (_, k) => (
              <Tulip key={k} x={120 + k * 160 + rand() * 50} y={470 + rand() * 30} s={0.85} color={["white", "coral", "lilac"][k % 3]} />
            ))}
          </g>
          <g filter="url(#gs-front)">
            <Tulip x={1460} y={360} s={1.9} color="coral" />
            <Tulip x={1220} y={470} s={1.4} color="lilac" />
          </g>
        </>
      )}

      {scene === "lotus" && (
        <>
          <g filter="url(#gs-far)">
            {Array.from({ length: 22 }, (_, k) => (
              <rect key={k} x={k * 75 + rand() * 30} y={170 + rand() * 80} width="14" height="300" rx="7" fill="url(#gs-stem)" opacity="0.8" />
            ))}
            <path d={hill(330, 18, 1)} fill="url(#gs-hill-far)" />
          </g>
          <rect y="360" width={W} height={H - 360} fill="url(#gs-water)" />
          <g filter="url(#gs-mid)">
            {Array.from({ length: 9 }, (_, k) => (
              <ellipse key={k} cx={100 + k * 180 + rand() * 60} cy={420 + rand() * 60} rx="80" ry="16" fill="url(#gs-pad)" />
            ))}
            <Lotus x={420} y={430} s={0.6} />
            <Lotus x={880} y={420} s={0.55} />
          </g>
          <g filter="url(#gs-near)">
            <Lotus x={1180} y={560} s={1.2} />
            <Lotus x={1440} y={520} s={0.9} />
          </g>
          <g filter="url(#gs-front)">
            <ellipse cx="1500" cy="690" rx="320" ry="60" fill="url(#gs-pad)" />
          </g>
        </>
      )}

      {scene === "daisies" && (
        <>
          <circle cx="1240" cy="250" r="120" fill="#ffd6a6" opacity="0.55" filter="url(#gs-front)" />
          <g filter="url(#gs-far)">
            <path d={hill(430, 50, 1.4)} fill="url(#gs-hill-far)" />
            {Array.from({ length: 20 }, (_, k) => (
              <Daisy key={k} x={40 + k * 82 + rand() * 30} y={430 + rand() * 40} s={0.32} tilt={(rand() - 0.5) * 20} />
            ))}
          </g>
          <g filter="url(#gs-mid)">
            <path d={hill(540, 26, 3)} fill="url(#gs-hill-near)" />
            {Array.from({ length: 30 }, (_, k) => (
              <path key={k} d={`M${k * 55 + rand() * 30} ${H} q ${(rand() - 0.5) * 60} -150 ${(rand() - 0.5) * 30} -${200 + rand() * 120}`} stroke="url(#gs-stem)" strokeWidth="9" fill="none" strokeLinecap="round" />
            ))}
          </g>
          <g filter="url(#gs-near)">
            <Daisy x={1050} y={330} s={0.9} tilt={-8} />
            <Daisy x={1330} y={260} s={1.15} tilt={10} />
          </g>
          <g filter="url(#gs-front)">
            <Daisy x={1540} y={480} s={1.6} tilt={-14} />
          </g>
        </>
      )}
    </svg>
  );
}
