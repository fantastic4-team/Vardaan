"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_HOLD_MS = 1200;

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Colours of the falling pieces (leaves or petals). */
  colors: string[];
  /** Horizontal band, in % of the width, where pieces start. */
  spawnX: [number, number];
  /** Vertical band, in px from the top, where pieces start. */
  spawnY: [number, number];
  /** Size of each falling piece, in px. */
  pieceSize?: number;
  pixelated?: boolean;
  label?: string;
};

type Piece = {
  id: number;
  burst: boolean;
  style: React.CSSProperties;
};

let pieceId = 0;

export default function PixelPlant({
  src,
  alt,
  width,
  height,
  colors,
  spawnX,
  spawnY,
  pieceSize = 2,
  pixelated = false,
  label = "Shake the plant",
}: Props) {
  const [ambient, setAmbient] = useState<Piece[]>([]);
  const [burst, setBurst] = useState<Piece[]>([]);
  const [pressed, setPressed] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [intensity, setIntensity] = useState(0.5);
  const pressStart = useRef<number | null>(null);

  const makePiece = useCallback(
    (isBurst: boolean, strength = 0.5): Piece => {
      const startTop = spawnY[0] + Math.random() * (spawnY[1] - spawnY[0]);
      // A piece either drifts sideways in a straight line, or wanders with a random-walk sway.
      const drifts = Math.random() < 0.35;
      const spread = width * 0.5;
      const drift = drifts ? (Math.random() - 0.5) * (isBurst ? spread * (0.6 + strength * 0.6) : spread) : 0;
      const style: Record<string, string> = {
        "--x": `${spawnX[0] + Math.random() * (spawnX[1] - spawnX[0])}%`,
        "--startTop": `${startTop}px`,
        "--fallDistance": `${height + 2 - startTop}px`,
        "--size": `${pieceSize}px`,
        "--dur": `${isBurst ? 2 + Math.random() * 2.5 : 4.5 + Math.random() * 5}s`,
        "--delay": isBurst ? `${Math.random() * 0.3}s` : `${-Math.random() * 9}s`,
        "--rotation": `${(Math.random() < 0.5 ? -1 : 1) * (400 + Math.random() * 600)}deg`,
        "--drift": `${drift}px`,
        "--color": colors[Math.floor(Math.random() * colors.length)],
      };
      let sway = 0;
      const step = width / 24;
      const bias = (Math.random() - 0.5) * step * (isBurst ? 0.6 + strength : 0.8);
      for (let i = 1; i <= 10; i++) {
        sway += bias + (Math.random() - 0.5) * step * 1.6;
        style[`--sway${i}`] = drifts ? "0px" : `${sway}px`;
      }
      return { id: pieceId++, burst: isBurst, style: style as React.CSSProperties };
    },
    [colors, height, pieceSize, spawnX, spawnY, width],
  );

  // Pieces are randomised on the client only, to keep server and client markup identical.
  useEffect(() => {
    setAmbient(Array.from({ length: 8 }, () => makePiece(false)));
  }, [makePiece]);

  const press = useCallback(() => {
    if (pressStart.current !== null) return;
    pressStart.current = performance.now();
    setPressed(true);
  }, []);

  // The longer the hold, the stronger the spring and the more pieces come down.
  const release = useCallback(() => {
    if (pressStart.current === null) return;
    const held = Math.min(performance.now() - pressStart.current, MAX_HOLD_MS) / MAX_HOLD_MS;
    pressStart.current = null;
    const strength = 0.3 + held * 0.7;
    setPressed(false);
    setIntensity(strength);
    setBounceKey((k) => k + 1);
    const count = Math.round(4 + held * 22 + Math.random() * 3);
    setBurst((prev) => [...prev, ...Array.from({ length: count }, () => makePiece(true, strength))].slice(-60));
  }, [makePiece]);

  return (
    <div className="relative" style={{ width, height }}>
      <button
        type="button"
        aria-label={label}
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
        className="block touch-none cursor-pointer select-none rounded-[2px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2891DF]"
        style={{ width, height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={bounceKey}
          src={src}
          alt={alt}
          draggable={false}
          width={width}
          height={height}
          className={`plant-img ${pressed ? "is-pressed" : bounceKey ? "is-bouncing" : ""}`}
          style={{
            width,
            height,
            imageRendering: pixelated ? "pixelated" : undefined,
            ["--bounce-intensity" as string]: intensity,
          }}
        />
      </button>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
        {ambient.map((p) => (
          <span key={p.id} className="plant-piece" style={p.style} />
        ))}
        {burst.map((p) => (
          <span key={p.id} className="plant-piece burst" style={p.style} />
        ))}
      </div>
    </div>
  );
}
