// Wide, soft-focus garden scenes for the section page headers, drawn in the same grainy style as the
// home poster but each with its own subject: a tulip field, a lotus pond, a daisy meadow and poppies.
// Layers are blurred by depth; grain is added on top in CSS (see .poster-grain).
const W = 1600;
const H = 700;

export type Scene = "tulips" | "lotus" | "daisies" | "poppies";

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

function Tulip({ p, x, y, s, color }: { p: string; x: number; y: number; s: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="0" width="10" height="260" rx="5" fill={`url(#${p}-stem)`} />
      <path d="M0 150 C -60 110 -80 60 -70 20 C -40 60 -15 100 0 150 Z" fill={`url(#${p}-leaf)`} />
      <path d={petal(-22, 10, -95, 62)} fill={`url(#${p}-${color})`} transform="rotate(-14 -22 10)" />
      <path d={petal(22, 10, -95, 62)} fill={`url(#${p}-${color})`} transform="rotate(14 22 10)" />
      <path d={petal(0, 14, -110, 66)} fill={`url(#${p}-${color})`} />
    </g>
  );
}

function Lotus({ p, x, y, s }: { p: string; x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="20" rx="120" ry="26" fill={`url(#${p}-pad)`} />
      {[-58, 58, -30, 30, 0].map((a, k) => (
        <path key={k} d={petal(0, 20, a === 0 ? -150 : Math.abs(a) === 30 ? -125 : -85, 64)} fill={`url(#${p}-lotus)`} transform={`rotate(${a} 0 20)`} />
      ))}
    </g>
  );
}

function Poppy({ p, x, y, s, tilt }: { p: string; x: number; y: number; s: number; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M0 10 C 10 120 -8 220 4 380" stroke={`url(#${p}-stem)`} strokeWidth="10" fill="none" strokeLinecap="round" />
      {[-70, 70, -25, 25].map((a, k) => (
        <ellipse key={k} cx="0" cy="-48" rx="46" ry="58" fill={`url(#${p}-coral)`} transform={`rotate(${a})`} />
      ))}
      <circle r="18" fill="#2b1a2e" />
      <circle r="8" fill="#f6e27a" opacity="0.8" />
    </g>
  );
}

function Daisy({ p, x, y, s, tilt }: { p: string; x: number; y: number; s: number; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M0 0 C 8 120 -6 240 4 420" stroke={`url(#${p}-stem)`} strokeWidth="12" fill="none" strokeLinecap="round" />
      {Array.from({ length: 14 }, (_, k) => (
        <ellipse key={k} cx="0" cy="-58" rx="17" ry="52" fill={`url(#${p}-daisy)`} transform={`rotate(${(k * 360) / 14})`} />
      ))}
      <circle r="32" fill={`url(#${p}-sun)`} />
    </g>
  );
}

export default function GardenScene({ scene, className = "" }: { scene: Scene; className?: string }) {
  // SVG ids are shared by the whole page, so each scene namespaces its gradients and filters.
  const p = `gs-${scene}`;
  const rand = rng(scene === "tulips" ? 7 : scene === "lotus" ? 19 : scene === "daisies" ? 31 : 43);
  const sky =
    scene === "tulips"
      ? ["#5560e6", "#8a93f4"]
      : scene === "lotus"
        ? ["#3b46b8", "#7f6fd6"]
        : scene === "daisies"
          ? ["#5a4fc8", "#f19aa8"]
          : ["#4c58dc", "#b9b4f6"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id={`${p}-hill-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f9f3b" />
          <stop offset="1" stopColor="#2b6a2d" />
        </linearGradient>
        <linearGradient id={`${p}-hill-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7330" />
          <stop offset="1" stopColor="#0f3519" />
        </linearGradient>
        <linearGradient id={`${p}-stem`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a8a35" />
          <stop offset="0.5" stopColor="#8bd255" />
          <stop offset="1" stopColor="#3a8a35" />
        </linearGradient>
        <radialGradient id={`${p}-leaf`} cx="0.3" cy="0.2" r="1">
          <stop offset="0" stopColor="#a6e05e" />
          <stop offset="1" stopColor="#25652c" />
        </radialGradient>
        <radialGradient id={`${p}-coral`} cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffb3c7" />
          <stop offset="0.6" stopColor="#ff5d6e" />
          <stop offset="1" stopColor="#e2301f" />
        </radialGradient>
        <radialGradient id={`${p}-lilac`} cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e3d6ff" />
          <stop offset="1" stopColor="#a688ec" />
        </radialGradient>
        <radialGradient id={`${p}-white`} cx="0.4" cy="0.25" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#eef1fb" />
          <stop offset="1" stopColor="#c9e877" />
        </radialGradient>
        <linearGradient id={`${p}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6fe0" />
          <stop offset="1" stopColor="#1f2a7a" />
        </linearGradient>
        <radialGradient id={`${p}-pad`} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#8fd25a" />
          <stop offset="1" stopColor="#24622b" />
        </radialGradient>
        <linearGradient id={`${p}-lotus`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3ee" />
          <stop offset="0.55" stopColor="#ff9cc4" />
          <stop offset="1" stopColor="#ff5d72" />
        </linearGradient>
        <radialGradient id={`${p}-daisy`} cx="0.5" cy="0.2" r="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7e4ff" />
        </radialGradient>
        <radialGradient id={`${p}-sun`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff6a6" />
          <stop offset="1" stopColor="#f2b53c" />
        </radialGradient>
        <filter id={`${p}-far`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={`${p}-mid`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={`${p}-near`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id={`${p}-front`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${p}-sky)`} />

      {scene === "tulips" && (
        <>
          <g filter={`url(#${p}-far)`}>
            <path d={hill(380, 40, 0.4)} fill={`url(#${p}-hill-far)`} />
            {Array.from({ length: 18 }, (_, k) => (
              <Tulip p={p} key={k} x={60 + k * 90 + rand() * 30} y={380 + rand() * 30} s={0.45} color={["coral", "lilac", "white"][k % 3]} />
            ))}
          </g>
          <g filter={`url(#${p}-mid)`}>
            <path d={hill(500, 30, 2)} fill={`url(#${p}-hill-near)`} />
            {Array.from({ length: 10 }, (_, k) => (
              <Tulip p={p} key={k} x={120 + k * 160 + rand() * 50} y={470 + rand() * 30} s={0.85} color={["white", "coral", "lilac"][k % 3]} />
            ))}
          </g>
          <g filter={`url(#${p}-front)`}>
            <Tulip p={p} x={1460} y={360} s={1.9} color="coral" />
            <Tulip p={p} x={1220} y={470} s={1.4} color="lilac" />
          </g>
        </>
      )}

      {scene === "lotus" && (
        <>
          <g filter={`url(#${p}-far)`}>
            {Array.from({ length: 22 }, (_, k) => (
              <rect key={k} x={k * 75 + rand() * 30} y={170 + rand() * 80} width="14" height="300" rx="7" fill={`url(#${p}-stem)`} opacity="0.8" />
            ))}
            <path d={hill(330, 18, 1)} fill={`url(#${p}-hill-far)`} />
          </g>
          <rect y="360" width={W} height={H - 360} fill={`url(#${p}-water)`} />
          <g filter={`url(#${p}-mid)`}>
            {Array.from({ length: 9 }, (_, k) => (
              <ellipse key={k} cx={100 + k * 180 + rand() * 60} cy={420 + rand() * 60} rx="80" ry="16" fill={`url(#${p}-pad)`} />
            ))}
            <Lotus p={p} x={420} y={430} s={0.6} />
            <Lotus p={p} x={880} y={420} s={0.55} />
          </g>
          <g filter={`url(#${p}-near)`}>
            <Lotus p={p} x={1180} y={560} s={1.2} />
            <Lotus p={p} x={1440} y={520} s={0.9} />
          </g>
          <g filter={`url(#${p}-front)`}>
            <ellipse cx="1500" cy="690" rx="320" ry="60" fill={`url(#${p}-pad)`} />
          </g>
        </>
      )}

      {scene === "daisies" && (
        <>
          <circle cx="1240" cy="250" r="120" fill="#ffd6a6" opacity="0.55" filter={`url(#${p}-front)`} />
          <g filter={`url(#${p}-far)`}>
            <path d={hill(430, 50, 1.4)} fill={`url(#${p}-hill-far)`} />
            {Array.from({ length: 20 }, (_, k) => (
              <Daisy p={p} key={k} x={40 + k * 82 + rand() * 30} y={430 + rand() * 40} s={0.32} tilt={(rand() - 0.5) * 20} />
            ))}
          </g>
          <g filter={`url(#${p}-mid)`}>
            <path d={hill(540, 26, 3)} fill={`url(#${p}-hill-near)`} />
            {Array.from({ length: 30 }, (_, k) => (
              <path key={k} d={`M${k * 55 + rand() * 30} ${H} q ${(rand() - 0.5) * 60} -150 ${(rand() - 0.5) * 30} -${200 + rand() * 120}`} stroke={`url(#${p}-stem)`} strokeWidth="9" fill="none" strokeLinecap="round" />
            ))}
          </g>
          <g filter={`url(#${p}-near)`}>
            <Daisy p={p} x={1050} y={330} s={0.9} tilt={-8} />
            <Daisy p={p} x={1330} y={260} s={1.15} tilt={10} />
          </g>
          <g filter={`url(#${p}-front)`}>
            <Daisy p={p} x={1540} y={480} s={1.6} tilt={-14} />
          </g>
        </>
      )}
      {scene === "poppies" && (
        <>
          <g filter={`url(#${p}-far)`}>
            <path d={hill(360, 70, 0.8)} fill={`url(#${p}-hill-far)`} />
            {Array.from({ length: 26 }, (_, k) => (
              <Poppy p={p} key={k} x={30 + k * 62 + rand() * 30} y={350 + rand() * 60} s={0.3} tilt={(rand() - 0.5) * 24} />
            ))}
          </g>
          <g filter={`url(#${p}-mid)`}>
            <path d={hill(500, 40, 2.4)} fill={`url(#${p}-hill-near)`} />
            {Array.from({ length: 9 }, (_, k) => (
              <Poppy p={p} key={k} x={160 + k * 165 + rand() * 50} y={460 + rand() * 40} s={0.6} tilt={(rand() - 0.5) * 20} />
            ))}
          </g>
          <g filter={`url(#${p}-near)`}>
            <Poppy p={p} x={1160} y={300} s={1.05} tilt={-10} />
          </g>
          <g filter={`url(#${p}-front)`}>
            <Poppy p={p} x={1450} y={260} s={1.7} tilt={12} />
          </g>
        </>
      )}
    </svg>
  );
}
