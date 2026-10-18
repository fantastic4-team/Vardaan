// A static field of hand-drawn-looking contour lines covering the whole page, edge to edge.
// Every line starts from an evenly spaced row and is displaced by the same smooth wave field.
// Because the field changes slowly from one row to the next, neighbouring lines stay roughly
// parallel and never cross, while their spacing gently swells and tightens like a topographic map.
// Generated deterministically at build time.
const W = 1600;
const H = 1000;
const SPACING = 9;
const STEP_X = 20;

// Vertical displacement for the line that starts at row `y0`, at horizontal position `x`.
// Its rate of change with y0 stays well below 1, which is what keeps lines from crossing.
function displacement(x: number, y0: number) {
  return (
    38 * Math.sin(x / 270 + y0 / 190) +
    16 * Math.sin(x / 120 - y0 / 95 + 1.3) +
    7 * Math.sin(x / 55 + y0 / 60 + 0.4) +
    // A faint, shared hand-drawn tremor.
    0.8 * Math.sin(x / 9 + y0 / 40)
  );
}

function linePaths(): string[] {
  const paths: string[] = [];
  for (let y0 = -80; y0 <= H + 80; y0 += SPACING) {
    let d = "";
    for (let x = -40; x <= W + 40; x += STEP_X) {
      const y = y0 + displacement(x, y0);
      d += `${x === -40 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

const PATHS = linePaths();

export default function FlowLines() {
  return (
    <svg
      aria-hidden="true"
      className="flow-lines pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="#000"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
