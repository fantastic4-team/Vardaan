"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const W = 73;
const H = 81;
const GROUND = 77;
const MAX_HOLD_MS = 1200;
const LEAF_COLORS = ["#2b4f23", "#3f722c", "#5e9635", "#87b743", "#b3d466"];

type Leaf = {
  id: number;
  burst: boolean;
  style: React.CSSProperties;
};

let leafId = 0;

function makeLeaf(burst: boolean, strength = 0.5): Leaf {
  const startTop = 10 + Math.random() * 40;
  const swayAmp = 1.5 + Math.random() * (burst ? 4 + strength * 8 : 6);
  const drift = burst
    ? (Math.random() - 0.5) * (30 + strength * 70)
    : Math.random() < 0.2
      ? (Math.random() - 0.5) * 70
      : 0;
  const style: Record<string, string> = {
    "--x": `${18 + Math.random() * 64}%`,
    "--startTop": `${startTop}px`,
    "--fallDistance": `${GROUND - startTop + Math.random() * 3}px`,
    "--dur": `${burst ? 1.8 + Math.random() * 2.2 : 4.5 + Math.random() * 5}s`,
    "--delay": burst ? `${Math.random() * 0.3}s` : `${-Math.random() * 9}s`,
    "--rotation": `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 640)}deg`,
    "--drift": `${drift}px`,
    "--color": LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
  };
  let phase = Math.random() * Math.PI * 2;
  for (let i = 1; i <= 10; i++) {
    phase += 0.6 + Math.random() * 0.4;
    style[`--sway${i}`] = drift && !burst ? "0px" : `${Math.sin(phase) * swayAmp}px`;
  }
  return { id: leafId++, burst, style: style as React.CSSProperties };
}

export default function PixelTree() {
  const [ambient, setAmbient] = useState<Leaf[]>([]);
  const [burst, setBurst] = useState<Leaf[]>([]);
  const [pressed, setPressed] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [intensity, setIntensity] = useState(0.5);
  const pressStart = useRef<number | null>(null);

  // Leaves are randomised on the client only, to keep server and client markup identical.
  useEffect(() => {
    setAmbient(Array.from({ length: 8 }, () => makeLeaf(false)));
  }, []);

  const press = useCallback(() => {
    if (pressStart.current !== null) return;
    pressStart.current = performance.now();
    setPressed(true);
  }, []);

  // The longer the hold, the stronger the spring and the more leaves come down.
  const release = useCallback(() => {
    if (pressStart.current === null) return;
    const held = Math.min(performance.now() - pressStart.current, MAX_HOLD_MS) / MAX_HOLD_MS;
    pressStart.current = null;
    const strength = 0.3 + held * 0.7;
    setPressed(false);
    setIntensity(strength);
    setBounceKey((k) => k + 1);
    const count = Math.round(4 + held * 22 + Math.random() * 3);
    setBurst((prev) => [...prev, ...Array.from({ length: count }, () => makeLeaf(true, strength))].slice(-60));
  }, []);

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <button
        type="button"
        aria-label="Shake the tree"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            press();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") release();
        }}
        className="block touch-none cursor-pointer select-none rounded-[2px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2891DF]"
        style={{ width: W, height: H }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={bounceKey}
          src="/images/tree.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          width={W}
          height={H}
          className={`tree-img ${pressed ? "is-pressed" : bounceKey ? "is-bouncing" : ""}`}
          style={{ ["--bounce-intensity" as string]: intensity }}
        />
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
