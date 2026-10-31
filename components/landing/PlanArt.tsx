// Art for the pricing cards, telling one story across the plans: a sprout at dawn (Beta), a full
// bloom in the morning (Plus) and a blossoming tree at golden hour (Family). Same soft, grainy
// style as the garden scenes; grain is added on top in CSS (see .poster-grain).
const W = 400;
const H = 150;

export type PlanArtKind = "sprout" | "bloom" | "tree";

const SKY: Record<PlanArtKind, [string, string, string]> = {
  sprout: ["#141a3d", "#3b46b8", "#8a7fe0"],
  bloom: ["#4c58dc", "#9d8cf0", "#f6b8c4"],
  tree: ["#3b46b8", "#c98fb8", "#f6cf7a"],
};

const SUN: Record<PlanArtKind, { x: number; y: number; r: number; color: string }> = {
  sprout: { x: 300, y: 112, r: 34, color: "#ffd6a6" },
  bloom: { x: 92, y: 46, r: 30, color: "#fff2c4" },
  tree: { x: 316, y: 92, r: 42, color: "#ffe39a" },
};

function hill(y: number, amp: number, phase: number) {
  let d = `M-10 ${H + 10} L-10 ${y}`;
  for (let x = -10; x <= W + 10; x += 20) d += ` L${x} ${(y + Math.sin(x / 70 + phase) * amp).toFixed(1)}`;
  return `${d} L${W + 10} ${H + 10} Z`;
}

function Sprout({ p }: { p: string }) {
  return (
    <g transform="translate(200 128)">
      <path d="M0 0 C -2 -18 3 -34 0 -52" stroke={`url(#${p}-stem)`} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M0 -36 C -14 -50 -36 -50 -46 -38 C -32 -30 -14 -28 0 -36 Z" fill={`url(#${p}-leaf)`} />
      <path d="M0 -46 C 14 -64 38 -66 50 -54 C 34 -42 14 -40 0 -46 Z" fill={`url(#${p}-leaf)`} />
      <ellipse cx="0" cy="-56" rx="6" ry="8" fill="#c9e877" />
    </g>
  );
}

function Bloom({ p }: { p: string }) {
  return (
    <g transform="translate(206 70)">
      <path d="M0 18 C 6 50 -4 70 2 90" stroke={`url(#${p}-stem)`} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M2 64 C 22 50 44 52 54 62 C 36 70 18 70 2 64 Z" fill={`url(#${p}-leaf)`} />
      {Array.from({ length: 8 }, (_, k) => (
        <ellipse key={k} cx="0" cy="-22" rx="13" ry="24" fill={`url(#${p}-petal)`} transform={`rotate(${k * 45})`} />
      ))}
      {Array.from({ length: 8 }, (_, k) => (
        <ellipse key={`i${k}`} cx="0" cy="-13" rx="8" ry="14" fill="#fff4f8" opacity="0.85" transform={`rotate(${k * 45 + 22.5})`} />
      ))}
      <circle r="10" fill={`url(#${p}-sun)`} />
    </g>
  );
}

function Tree({ p }: { p: string }) {
  const canopy = [
    [-30, -62, 30],
    [28, -64, 32],
    [0, -88, 34],
    [-46, -86, 22],
    [46, -90, 22],
  ];
  const blossoms = [
    [-40, -70], [-14, -96], [20, -80], [40, -60], [4, -66], [-26, -50], [30, -100], [-50, -92], [56, -84],
  ];
  return (
    <g transform="translate(170 136)">
      <path d="M-7 0 C -5 -22 -8 -40 -2 -58 L 4 -58 C 8 -40 6 -22 8 0 Z" fill="#5a3a2e" />
      <path d="M0 -44 C -12 -52 -20 -58 -26 -66 M2 -48 C 14 -56 22 -62 28 -70" stroke="#5a3a2e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {canopy.map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={`url(#${p}-leaf)`} />
      ))}
      {blossoms.map(([x, y], k) => (
        <circle key={`b${k}`} cx={x} cy={y} r={4.5} fill={`url(#${p}-petal)`} />
      ))}
      {/* Three small flowers at the foot of the tree: the family. */}
      {[78, 100, 118].map((x, k) => (
        <g key={`f${k}`} transform={`translate(${x} ${-4 - k * 2})`}>
          <path d={`M0 6 L0 ${-14 - k * 4}`} stroke={`url(#${p}-stem)`} strokeWidth="2.5" strokeLinecap="round" />
          <circle cy={-16 - k * 4} r={6 + k} fill={`url(#${p}-petal)`} />
          <circle cy={-16 - k * 4} r={2.4} fill="#f6e27a" />
        </g>
      ))}
    </g>
  );
}

export default function PlanArt({ kind, className = "" }: { kind: PlanArtKind; className?: string }) {
  const p = `plan-${kind}`;
  const sky = SKY[kind];
  const sun = SUN[kind];
  const petal = kind === "tree" ? ["#ffffff", "#ffc2d1", "#ff7a93"] : ["#ffffff", "#e8dcff", "#a688ec"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <linearGradient id={`${p}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f9f3b" />
          <stop offset="1" stopColor="#2b6a2d" />
        </linearGradient>
        <linearGradient id={`${p}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7330" />
          <stop offset="1" stopColor="#0f3519" />
        </linearGradient>
        <linearGradient id={`${p}-stem`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a8a35" />
          <stop offset="0.5" stopColor="#8bd255" />
          <stop offset="1" stopColor="#3a8a35" />
        </linearGradient>
        <radialGradient id={`${p}-leaf`} cx="0.3" cy="0.25" r="1">
          <stop offset="0" stopColor="#b5ea6a" />
          <stop offset="1" stopColor="#25652c" />
        </radialGradient>
        <radialGradient id={`${p}-petal`} cx="0.45" cy="0.3" r="0.9">
          <stop offset="0" stopColor={petal[0]} />
          <stop offset="0.55" stopColor={petal[1]} />
          <stop offset="1" stopColor={petal[2]} />
        </radialGradient>
        <radialGradient id={`${p}-sun`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff6a6" />
          <stop offset="1" stopColor="#f2b53c" />
        </radialGradient>
        <filter id={`${p}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={`${p}-far-blur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id={`${p}-crisp`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${p}-sky)`} />
      <circle cx={sun.x} cy={sun.y} r={sun.r} fill={sun.color} opacity="0.85" filter={`url(#${p}-soft)`} />
      {kind === "sprout" &&
        [
          [40, 22], [92, 40], [140, 16], [256, 30], [352, 18], [380, 52], [18, 60],
        ].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 1.4 : 1} fill="#ffffff" opacity="0.7" />)}

      <g filter={`url(#${p}-far-blur)`}>
        <path d={hill(108, 7, kind === "tree" ? 2 : 0.6)} fill={`url(#${p}-far)`} />
      </g>
      <path d={hill(128, 5, kind === "bloom" ? 3 : 1.5)} fill={`url(#${p}-near)`} />

      <g filter={`url(#${p}-crisp)`}>
        {kind === "sprout" && <Sprout p={p} />}
        {kind === "bloom" && <Bloom p={p} />}
        {kind === "tree" && <Tree p={p} />}
      </g>
    </svg>
  );
}
