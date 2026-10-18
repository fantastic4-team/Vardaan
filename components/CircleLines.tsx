// Abstract circular line work behind the page: concentric rings around the letter like sound
// waves, two slowly turning dashed orbits with a dot riding each, a soft pulse travelling
// outwards, and a pair of large off-centre arcs. Purely decorative.
const CX = 800;
const CY = 500;
const RINGS = [210, 290, 380, 480, 590, 710, 850, 1000];

export default function CircleLines() {
  return (
    <svg
      aria-hidden="true"
      className="circle-lines pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        {/* Clear around the letter, full strength through the middle distance, fading at the edges. */}
        <radialGradient id="cl-fade" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={950}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="26%" stopColor="#fff" stopOpacity="0" />
          <stop offset="40%" stopColor="#fff" stopOpacity="1" />
          <stop offset="80%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="cl-mask">
          <rect width="1600" height="1000" fill="url(#cl-fade)" />
        </mask>
      </defs>

      <g mask="url(#cl-mask)" stroke="#000" vectorEffect="non-scaling-stroke">
        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            strokeOpacity={i % 3 === 1 ? 0.05 : 0.08}
            strokeDasharray={i % 3 === 1 ? "2 7" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <g className="cl-orbit cl-orbit-slow">
          <circle cx={CX} cy={CY} r={380} strokeOpacity={0.12} strokeDasharray="1 14" vectorEffect="non-scaling-stroke" />
          <circle cx={CX + 380} cy={CY} r={3.5} fill="#000" fillOpacity={0.35} stroke="none" />
        </g>
        <g className="cl-orbit cl-orbit-reverse">
          <circle cx={CX} cy={CY} r={710} strokeOpacity={0.1} strokeDasharray="40 18 2 18" vectorEffect="non-scaling-stroke" />
          <circle cx={CX} cy={CY - 710} r={3} fill="#000" fillOpacity={0.3} stroke="none" />
        </g>

        <circle className="cl-pulse" cx={CX} cy={CY} r={210} strokeOpacity={0.14} vectorEffect="non-scaling-stroke" />
        <circle className="cl-pulse cl-pulse-late" cx={CX} cy={CY} r={210} strokeOpacity={0.14} vectorEffect="non-scaling-stroke" />

        <circle cx={140} cy={1010} r={430} strokeOpacity={0.07} vectorEffect="non-scaling-stroke" />
        <circle cx={140} cy={1010} r={520} strokeOpacity={0.05} strokeDasharray="2 8" vectorEffect="non-scaling-stroke" />
        <circle cx={1500} cy={40} r={300} strokeOpacity={0.07} vectorEffect="non-scaling-stroke" />
        <circle cx={1500} cy={40} r={360} strokeOpacity={0.05} strokeDasharray="2 8" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
