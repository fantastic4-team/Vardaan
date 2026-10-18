"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const W = 73;
const H = 81;
const MAX_HOLD_MS = 1200;
const LEAF_COLORS = ["#334932", "#4B6239", "#87A454", "#ACBE62"];

type Leaf = {
  id: number;
  burst: boolean;
  style: React.CSSProperties;
};

let leafId = 0;

function makeLeaf(burst: boolean, strength = 0.5): Leaf {
  const startTop = 11 + Math.random() * 29;
  // A leaf either drifts sideways in a straight line, or wanders with a random-walk sway.
  const drifts = Math.random() < 0.35;
  const drift = drifts ? (Math.random() - 0.5) * (burst ? 40 + strength * 40 : 70) : 0;
  const style: Record<string, string> = {
    "--x": `${20 + Math.random() * 52}%`,
    "--startTop": `${startTop}px`,
    "--fallDistance": `${H + 2 - startTop}px`,
    "--dur": `${burst ? 2 + Math.random() * 2.5 : 4.5 + Math.random() * 5}s`,
    "--delay": burst ? `${Math.random() * 0.3}s` : `${-Math.random() * 9}s`,
    "--rotation": `${(Math.random() < 0.5 ? -1 : 1) * (400 + Math.random() * 600)}deg`,
    "--drift": `${drift}px`,
    "--color": LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
  };
  let sway = 0;
  const bias = (Math.random() - 0.5) * (burst ? 2 + strength * 3 : 3);
  for (let i = 1; i <= 10; i++) {
    sway += bias + (Math.random() - 0.5) * 6;
    style[`--sway${i}`] = drifts ? "0px" : `${sway}px`;
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
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
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
