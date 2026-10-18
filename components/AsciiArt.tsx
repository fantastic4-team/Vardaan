"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// Same density ramp the art was generated with: index 0 is empty, higher is denser.
const RAMP = " .,:;i1tfLCG08@";
const FRAME_MS = 42; // ~24fps is plenty for text and keeps the work light.
const GROW_MS = 1300; // how long the tree takes to grow in from the base of the trunk
const SCRAMBLE_MS = 240; // how long each character flickers before it settles
const POINTER_RADIUS = 7; // in character cells
const CROWN = 0.7; // rows above this fraction of the height are foliage and catch the wind

// Cheap deterministic hash so the "random" flicker is stable within a time slice.
function hash(a: number, b: number, c: number) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type Props = {
  art: string;
  className?: string;
  wrapperClassName?: string;
  /** Extra layers; any <pre data-ascii-mirror> inside receives the same text every frame. */
  children?: React.ReactNode;
};

// Animated ASCII art: it grows in from the base of the trunk with each character flickering
// before it settles, a slow wind ripples through the crown, and characters near the pointer
// scatter. Text is written straight to the <pre> (and any mirror layers) each frame, so React
// doesn't re-render, and every layer stays in perfect step.
export default function AsciiArt({ art, className = "", wrapperClassName = "", children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLPreElement>(null);

  const targets = () => [
    ref.current,
    ...Array.from(wrapRef.current?.querySelectorAll<HTMLPreElement>("pre[data-ascii-mirror]") ?? []),
  ];
  const write = (text: string) => targets().forEach((t) => t && (t.textContent = text));

  // Start blank before the first paint so the finished art never flashes ahead of the intro.
  useLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) write("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(art);
      return;
    }

    const lines = art.split("\n");
    const rows = lines.length;
    const cols = Math.max(...lines.map((l) => l.length));
    const target = lines.map((l) => Array.from(l.padEnd(cols, " ")).map((ch) => Math.max(0, RAMP.indexOf(ch))));

    // Each cell appears after a delay that grows with its distance from the base of the trunk.
    const revealAt = target.map((row, r) =>
      row.map((_, c) => {
        const dx = (c - cols / 2) / cols;
        const dy = (rows - r) / rows;
        return Math.hypot(dx * 0.9, dy) * GROW_MS * 0.8 + hash(r, c, 1) * GROW_MS * 0.25;
      }),
    );

    let pointer: { r: number; c: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      pointer = {
        c: ((e.clientX - box.left) / box.width) * cols,
        r: ((e.clientY - box.top) / box.height) * rows,
      };
    };
    const onLeave = () => (pointer = null);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    const start = performance.now();
    let last = 0;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < FRAME_MS) return;
      last = now;
      const t = now - start;
      const slice = Math.floor(t / 90);
      const windSlice = Math.floor(t / 220);

      let out = "";
      for (let r = 0; r < rows; r++) {
        const row = target[r];
        for (let c = 0; c < cols; c++) {
          const g = row[c];
          if (g === 0) {
            out += " ";
            continue;
          }
          const at = revealAt[r][c];
          if (t < at) {
            out += " ";
            continue;
          }
          if (t < at + SCRAMBLE_MS) {
            out += RAMP[1 + Math.floor(hash(r, c, slice) * (RAMP.length - 1))];
            continue;
          }

          let idx = g;

          // Wind: a slow wave drifts across the crown; where it peaks, leaves flutter a step.
          if (r < rows * CROWN) {
            const wave = Math.sin(c * 0.16 - t * 0.0011 + r * 0.09) * Math.sin(r * 0.05 + t * 0.0004);
            if (wave > 0.72 && hash(r, c, windSlice) < 0.45) {
              idx = Math.min(RAMP.length - 1, Math.max(1, idx + (hash(c, r, windSlice) < 0.5 ? -1 : 1)));
            }
          }

          // Pointer: characters near the cursor scatter, more strongly closer in.
          if (pointer) {
            const d = Math.hypot((c - pointer.c) * 0.6, r - pointer.r);
            if (d < POINTER_RADIUS && hash(r, c, slice) > d / POINTER_RADIUS) {
              idx = 1 + Math.floor(hash(c, r, slice) * (RAMP.length - 1));
            }
          }

          out += RAMP[idx];
        }
        if (r < rows - 1) out += "\n";
      }
      write(out);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art]);

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName}`}>
      <pre ref={ref} aria-hidden="true" className={className}>
        {art}
      </pre>
      {children}
    </div>
  );
}
