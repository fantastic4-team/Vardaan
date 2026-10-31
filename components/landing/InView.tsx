"use client";

import { useEffect, useRef } from "react";

// Fades its content up the first time it scrolls into view.
export default function InView({ children, className = "", i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.shown = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`in-view ${className}`} style={{ "--i": i } as React.CSSProperties}>
      {children}
    </div>
  );
}
