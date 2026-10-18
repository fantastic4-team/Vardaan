"use client";

import { useEffect, useRef } from "react";

const SPACING = 7; // px between dot centres
const DOT = "#ecf8a8";
const GROW_MS = 1500; // the tree grows in from the base of its trunk
const FADE_MS = 420; // each dot's own grow-in
const FRAME_MS = 33;
const POINTER_RADIUS = 9; // in cells
const CROWN = 0.68; // rows above this fraction of the tree are foliage and catch the wind
// The panel's top part is narrower than its stepped base (see .dot-panel), so the tree is fitted
// inside that narrower width.
const USABLE_WIDTH = 0.84;

type Cell = { level: number; reveal: number; crown: boolean };

function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// A blue dot-matrix panel: the whole panel is a faint grid of dots, and the image (the tree)
// is drawn into it as larger, brighter dots sampled from its pixels.
export default function DotMatrix({ src, className = "" }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let cells: Cell[] = [];
    let image: HTMLImageElement | null = null;
    let start = performance.now();
    let pointer: { c: number; r: number } | null = null;
    let visible = true;
    let raf = 0;
    let last = 0;

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(width / SPACING);
      rows = Math.floor(height / SPACING);
      cells = new Array(cols * rows).fill(null).map(() => ({ level: 0, reveal: 0, crown: false }));
      if (!image) return;

      // Fit the tree into the panel's narrower top part, standing near the bottom edge.
      const ratio = image.naturalWidth / image.naturalHeight;
      const usable = Math.floor(cols * USABLE_WIDTH);
      let th = Math.round(rows * 0.84);
      let tw = Math.round(th * ratio);
      if (tw > usable * 0.92) {
        tw = Math.round(usable * 0.92);
        th = Math.round(tw / ratio);
      }
      const ox = Math.round((usable - tw) / 2);
      const oy = rows - th - Math.max(2, Math.round(rows * 0.05));

      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(image, ox, oy, tw, th);
      const px = octx.getImageData(0, 0, cols, rows).data;

      const baseC = ox + tw / 2;
      const baseR = oy + th;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          const a = px[i + 3] / 255;
          if (a < 0.3) continue;
          const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255 / a;
          const dist = Math.hypot((c - baseC) / cols, (baseR - r) / rows);
          cells[r * cols + c] = {
            level: Math.min(1, Math.max(0.15, (lum - 0.1) / 0.6)),
            reveal: dist * GROW_MS + hash(r, c) * 260,
            crown: r < oy + th * CROWN,
          };
        }
      }
    };

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = DOT;
      const offX = (width - (cols - 1) * SPACING) / 2;
      const offY = (height - (rows - 1) * SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c];
          const x = offX + c * SPACING;
          const y = offY + r * SPACING;
          let radius = 0.75;
          let alpha = 0.38;

          if (cell.level > 0) {
            const p = reduced ? 1 : Math.min(1, Math.max(0, (t - cell.reveal) / FADE_MS));
            const eased = 1 - (1 - p) ** 3;
            const full = 0.9 + cell.level * 1.9;
            radius = 0.75 + (full - 0.75) * eased;
            alpha = 0.38 + (0.5 + cell.level * 0.5 - 0.38) * eased;

            if (!reduced && p === 1 && cell.crown) {
              // A slow wind wave rippling through the crown.
              const wave = Math.sin(c * 0.22 - t * 0.0012 + r * 0.1) * Math.sin(r * 0.06 + t * 0.0005);
              if (wave > 0.4) radius *= 1 + (wave - 0.4) * 0.45;
            }
          }

          if (pointer && !reduced) {
            const d = Math.hypot(c - pointer.c, r - pointer.r);
            if (d < POINTER_RADIUS) {
              const k = 1 - d / POINTER_RADIUS;
              radius *= 1 + k * k * 1.4;
              alpha = Math.min(1, alpha + k * 0.5);
            }
          }

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, y, Math.min(radius, SPACING * 0.48), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < FRAME_MS) return;
      last = now;
      draw(now - start);
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const offX = (box.width - (cols - 1) * SPACING) / 2;
      const offY = (box.height - (rows - 1) * SPACING) / 2;
      pointer = { c: (e.clientX - box.left - offX) / SPACING, r: (e.clientY - box.top - offY) / SPACING };
    };
    const onLeave = () => (pointer = null);

    const ro = new ResizeObserver(() => {
      layout();
      if (reduced) draw(Infinity);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      image = img;
      layout();
      start = performance.now();
      if (reduced) draw(Infinity);
      else raf = requestAnimationFrame(frame);
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [src]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
