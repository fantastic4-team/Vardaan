"use client";

import { useEffect, useRef } from "react";

// A fine dot-matrix panel in the style of the reference: every cell holds a small dot, and each
// column is made of blocky runs of brightness (a few discrete levels), so the panel reads as
// vertical streaks of data. Columns drift slowly at slightly different speeds.
const SPACING = 5; // px between dot centres
const DOT = "#e6f6a2";
const LEVELS = 5;
const FRAME_MS = 50;
const POINTER_RADIUS = 8; // in cells
const LOOP = 4; // each column's pattern repeats every LOOP panel heights

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Pre-rendered dot sprites, one per brightness level, so a frame is just thousands of blits.
// The extra top level is only reached under the pointer.
function makeSprites(dpr: number) {
  return Array.from({ length: LEVELS + 1 }, (_, level) => {
    const t = Math.min(1, level / (LEVELS - 1));
    const radius = (0.55 + t * 1.05) * (level >= LEVELS ? 1.25 : 1);
    const alpha = 0.32 + t * 0.68;
    const size = Math.ceil(SPACING * dpr);
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = DOT;
    g.globalAlpha = alpha;
    g.beginPath();
    g.arc(size / 2, size / 2, radius * dpr, 0, Math.PI * 2);
    g.fill();
    return c;
  });
}

export default function DotMatrix({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let sprites: HTMLCanvasElement[] = [];
    let columns: { runs: Uint8Array; speed: number }[] = [];
    let pointer: { c: number; r: number } | null = null;
    let visible = true;
    let raf = 0;
    let last = 0;
    const start = performance.now();

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cols = Math.floor(width / SPACING);
      rows = Math.floor(height / SPACING);
      sprites = makeSprites(dpr);

      // Each column gets its own "temperature" and is filled with runs of a few rows to a dozen,
      // each run holding one brightness level biased by that temperature.
      const rand = rng(20261018);
      columns = Array.from({ length: cols }, () => {
        const heat = rand() < 0.22 ? 0.75 + rand() * 0.25 : rand() * 0.55;
        const length = rows * LOOP;
        const runs = new Uint8Array(length);
        for (let i = 0; i < length; ) {
          const run = 2 + Math.floor(rand() ** 1.6 * 16);
          const v = Math.min(1, Math.max(0, heat + (rand() - 0.5) * 0.7));
          const level = rand() < 0.18 ? 0 : Math.round(v * (LEVELS - 1));
          runs.fill(level, i, Math.min(length, i + run));
          i += run;
        }
        return { runs, speed: 0.6 + rand() * 1.2 };
      });
    };

    const draw = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const step = SPACING * dpr;
      const offX = (canvas.width - cols * step) / 2;
      const offY = (canvas.height - rows * step) / 2;
      const intro = reduced ? 1 : Math.min(1, t / 900);

      for (let c = 0; c < cols; c++) {
        const { runs, speed } = columns[c];
        const length = runs.length;
        // Columns slide downward at their own pace (about one row per second on average).
        const shift = reduced ? 0 : Math.floor((t / 1000) * speed);
        for (let r = 0; r < rows; r++) {
          let level = runs[(((r - shift) % length) + length) % length];
          // On load the pattern sweeps in from the top; below the sweep only base dots show.
          if (r / rows > intro) level = 0;
          if (pointer) {
            const d = Math.hypot(c - pointer.c, r - pointer.r);
            if (d < POINTER_RADIUS) level = Math.min(LEVELS, level + Math.round((1 - d / POINTER_RADIUS) * 3));
          }
          ctx.drawImage(sprites[level], offX + c * step, offY + r * step);
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < FRAME_MS) return;
      last = now;
      draw(now - start);
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const offX = (box.width - cols * SPACING) / 2;
      const offY = (box.height - rows * SPACING) / 2;
      pointer = { c: (e.clientX - box.left - offX) / SPACING - 0.5, r: (e.clientY - box.top - offY) / SPACING - 0.5 };
    };
    const onLeave = () => (pointer = null);

    const ro = new ResizeObserver(() => {
      layout();
      if (reduced) draw(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    layout();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
