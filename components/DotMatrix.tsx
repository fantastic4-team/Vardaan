"use client";

import { useEffect, useRef } from "react";

// A dot-matrix voice spectrogram on a blue panel. Columns are frequencies and rows are time:
// speech shows up as bright bands (formants) with fine vertical harmonic streaks, arriving in
// syllable-sized bursts with quiet gaps, and the whole thing drifts slowly upward like a live call.
const SPACING = 7; // px between dot centres
const DOT = "#ecf8a8";
const SCROLL = 0.0045; // rows per millisecond
const INTRO_MS = 1100; // rows fade in from the bottom
const FRAME_MS = 33;
const POINTER_RADIUS = 9; // in cells
// Frequencies span slightly wider than the panel so the right edge never looks cut off.
const USABLE_WIDTH = 0.95;

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// Smooth 1D value noise in [0, 1].
function noise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Loudness of the "voice" at frequency x (0..1 across the usable width) and time y (in rows).
function intensity(x: number, y: number, col: number) {
  // Syllables: frequent bursts of sound over a quiet floor, so no part of the panel goes blank.
  const speech = 0.22 + 0.78 * smoothstep(0.3, 0.56, noise(y * 0.16)) * (0.6 + 0.4 * noise(y * 0.37 + 50));
  // Three formants whose centres glide slowly, like vowels changing.
  const f1 = 0.16 + 0.07 * noise(y * 0.05 + 10);
  const f2 = 0.43 + 0.13 * noise(y * 0.05 + 20);
  const f3 = 0.72 + 0.07 * noise(y * 0.05 + 30);
  const band = (c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
  const formants = band(f1, 0.07) + 0.8 * band(f2, 0.08) + 0.55 * band(f3, 0.06);
  // Harmonics: fine vertical streaks across the spectrum, a little stronger at low frequencies.
  const harmonics = 0.5 * (0.5 + 0.5 * Math.cos(col * 1.05)) * Math.exp(-x * 0.55);
  // Each column (frequency bin) has its own gain, which breaks the bands into distinct streaks.
  const gain = 0.45 + 0.85 * hash(col * 3.1 + 0.5) ** 2;
  const grain = 0.14 * hash(col * 31.7 + Math.floor(y) * 7.3);
  return speech * (formants + harmonics) * gain + grain * speech;
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
    let pointer: { c: number; r: number } | null = null;
    let visible = true;
    let raf = 0;
    let last = 0;
    const start = performance.now();

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(width / SPACING);
      rows = Math.floor(height / SPACING);
    };

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = DOT;
      const offX = (width - (cols - 1) * SPACING) / 2;
      const offY = (height - (rows - 1) * SPACING) / 2;
      const usable = cols * USABLE_WIDTH;
      const scroll = reduced ? 0 : t * SCROLL;

      for (let r = 0; r < rows; r++) {
        // Rows are sampled in threes so edges step like the reference's blocky clusters.
        const y = Math.floor((r + scroll) / 3) * 3;
        const intro = reduced ? 1 : smoothstep(0, 1, (t - ((rows - r) / rows) * INTRO_MS * 0.7) / 400);
        for (let c = 0; c < cols; c++) {
          const x = c / usable;
          let level = x > 1.05 ? 0 : intensity(x, y, c);
          let radius = 0.75;
          let alpha = 0.38;

          if (level > 0.18) {
            level = Math.min(1, (level - 0.18) / 0.8);
            const full = 0.9 + level * 1.9;
            radius = 0.75 + (full - 0.75) * intro;
            alpha = 0.38 + (0.55 + level * 0.45 - 0.38) * intro;
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
          ctx.arc(offX + c * SPACING, offY + r * SPACING, Math.min(radius, SPACING * 0.48), 0, Math.PI * 2);
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
