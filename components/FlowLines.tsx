// Static, hand-drawn-looking ribbons of contour lines flowing across the whole page. Each ribbon
// follows a smooth spine; its lines are offsets of that spine whose spacing swells and narrows,
// with a slight wobble so they read as drawn by hand. Generated deterministically at build time.
const STROKE = "#E0532B";
const W = 1600;
const H = 1000;

type Pt = [number, number];

type Ribbon = {
  spine: Pt[];
  lines: number;
  gap: number;
  seed: number;
};

const RIBBONS: Ribbon[] = [
  // A long band across the top that rises into a swell, like the reference.
  {
    spine: [[-80, 300], [100, 280], [200, 180], [330, 240], [470, 140], [620, 90], [760, 40], [900, 90], [1010, 55], [1130, 135], [1260, 95], [1400, 175], [1680, 120]],
    lines: 7,
    gap: 12,
    seed: 11,
  },
  // The main band, sweeping right through the middle of the page.
  {
    spine: [[-80, 540], [140, 480], [320, 575], [510, 445], [700, 520], [880, 390], [1060, 470], [1240, 580], [1420, 490], [1680, 545]],
    lines: 8,
    gap: 13,
    seed: 5,
  },
  // Along the bottom.
  {
    spine: [[-80, 760], [120, 820], [260, 745], [420, 860], [600, 905], [780, 880], [950, 935], [1100, 860], [1240, 905], [1380, 820], [1520, 880], [1680, 800]],
    lines: 7,
    gap: 12,
    seed: 23,
  },
  // A gentler band down the left edge.
  {
    spine: [[180, -80], [255, 120], [165, 300], [245, 470], [125, 640], [190, 820], [100, 1080]],
    lines: 5,
    gap: 12,
    seed: 37,
  },
  // Running off the top-right corner.
  {
    spine: [[1250, -80], [1345, 90], [1305, 235], [1455, 345], [1405, 520], [1560, 640], [1700, 700]],
    lines: 5,
    gap: 12,
    seed: 41,
  },
];

// Catmull-Rom through the control points, sampled densely.
function sample(points: Pt[], perSegment = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function ribbonPaths({ spine, lines, gap, seed }: Ribbon): string[] {
  const pts = sample(spine);
  const n = pts.length;
  // Unit normals along the spine.
  const normals = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len] as Pt;
  });

  const paths: string[] = [];
  for (let k = 0; k < lines; k++) {
    const offset = k - (lines - 1) / 2;
    let d = "";
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // The band swells and narrows along its length. The hand-drawn wobble is shared by the whole
      // band, with only a hair of per-line variation, so neighbouring lines never cross.
      const swell = 0.9 + 0.3 * Math.sin(t * 7 + seed) + 0.1 * Math.sin(t * 19 + seed * 2);
      const wobble = 1.4 * Math.sin(t * 47 + seed) + 0.7 * Math.sin(t * 113 + seed) + 0.35 * Math.sin(t * 89 + k * 2.1);
      const o = offset * gap * swell + wobble;
      const x = pts[i][0] + normals[i][0] * o;
      const y = pts[i][1] + normals[i][1] * o;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

const PATHS = RIBBONS.flatMap(ribbonPaths);

export default function FlowLines() {
  return (
    <svg
      aria-hidden="true"
      className="flow-lines pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke={STROKE}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
