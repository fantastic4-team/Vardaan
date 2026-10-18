"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const COLS = 18;
const ROWS = 20;
const PX = 4;

const DARK = "#334932";
const MID = "#87A454";
const LIGHT = "#ACBE62";
const BARK = "#6B4A2E";
const BARK_DARK = "#4A321F";
const LEAF_COLORS = [DARK, MID, LIGHT];

// Canopy is a union of circles; shading comes from distance to a light source up-left.
const BLOBS: [number, number, number][] = [
  [9, 5.5, 5.2],
  [5.2, 8.6, 4],
  [12.8, 8.6, 4],
  [9, 9.6, 4.6],
];

function buildPixels() {
  const pixels: { x: number; y: number; c: string }[] = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const inside = BLOBS.some(([bx, by, r]) => (cx - bx) ** 2 + (cy - by) ** 2 <= r * r);

      if (inside && y < 14) {
        const light = Math.hypot(cx - 6.5, cy - 3.5);
        // A deterministic dither so the canopy reads as foliage, not a gradient.
        const noise = ((x * 7 + y * 13) % 5) * 0.35;
        const d = light + noise;
        pixels.push({ x, y, c: d < 4.2 ? LIGHT : d < 8.2 ? MID : DARK });
        continue;
      }

      const trunk = y >= 12 && (x === 8 || x === 9);
      const root = y === 19 && (x === 7 || x === 10);
      if (trunk || root) {
        pixels.push({ x, y, c: x >= 9 || x === 10 ? BARK_DARK : BARK });
      }
    }
  }

  return pixels;
}

type Leaf = {
  id: number;
  burst: boolean;
  style: React.CSSProperties;
};

let leafId = 0;

function makeLeaf(burst: boolean): Leaf {
  const startTop = 8 + Math.random() * 34;
  const swayAmp = 2 + Math.random() * 8;
  const drift = burst ? (Math.random() - 0.5) * 70 : Math.random() < 0.2 ? (Math.random() - 0.5) * 70 : 0;
  const style: Record<string, string> = {
    "--x": `${25 + Math.random() * 50}%`,
    "--startTop": `${startTop}px`,
    "--fallDistance": `${83 - startTop}px`,
    "--dur": `${burst ? 1.6 + Math.random() * 1.6 : 4.5 + Math.random() * 5}s`,
    "--delay": burst ? `${Math.random() * 0.25}s` : `${-Math.random() * 9}s`,
    "--rotation": `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 640)}deg`,
    "--drift": `${drift}px`,
    "--color": LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
  };
  let phase = Math.random() * Math.PI * 2;
  for (let i = 1; i <= 10; i++) {
    phase += 0.6 + Math.random() * 0.4;
    style[`--sway${i}`] = drift ? "0px" : `${Math.sin(phase) * swayAmp}px`;
  }
  return { id: leafId++, burst, style: style as React.CSSProperties };
}

export default function PixelTree() {
  const pixels = useMemo(buildPixels, []);
  const [ambient, setAmbient] = useState<Leaf[]>([]);
  const [burst, setBurst] = useState<Leaf[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [intensity, setIntensity] = useState(0.5);

  // Leaves are randomised on the client only, to keep server and client markup identical.
  useEffect(() => {
    setAmbient(Array.from({ length: 8 }, () => makeLeaf(false)));
  }, []);

  const shake = useCallback(() => {
    setIntensity(0.45 + Math.random() * 0.55);
    setShakeKey((k) => k + 1);
    const fresh = Array.from({ length: 10 + Math.floor(Math.random() * 6) }, () => makeLeaf(true));
    setBurst((prev) => [...prev, ...fresh].slice(-40));
  }, []);

  const width = COLS * PX;
  const height = ROWS * PX;

  return (
    <div className="relative" style={{ width: width + 1, height: height + 1 }}>
      <button
        type="button"
        aria-label="Shake the tree"
        onClick={shake}
        className="block cursor-pointer touch-none select-none rounded-[2px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2891DF]"
      >
        <svg
          key={shakeKey}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
          className={shakeKey ? "tree-shake" : ""}
          style={{ ["--bounce-intensity" as string]: intensity }}
        >
          {pixels.map((p) => (
            <rect key={`${p.x}-${p.y}`} x={p.x * PX} y={p.y * PX} width={PX} height={PX} fill={p.c} />
          ))}
        </svg>
      </button>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
        {ambient.map((l) => (
          <span key={l.id} className="tree-leaf" style={l.style} />
        ))}
        {burst.map((l) => (
          <span key={l.id} className="tree-leaf burst" style={l.style} />
        ))}
      </div>
    </div>
  );
}
