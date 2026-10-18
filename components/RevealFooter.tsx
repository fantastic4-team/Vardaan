"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/components/SiteNav";

const WHEEL_THRESHOLD = 140;
const TOUCH_THRESHOLD = 60;
const WHEEL_RESET_MS = 250;

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function atBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
}

export default function RevealFooter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const footerRef = useRef<HTMLElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // wheelDistance accumulates scroll past the end of the page (or back up while open).
    // Once it crosses the threshold the footer is shown or hidden.
    let wheelDistance = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    // A wheel gesture only counts if it started at the bottom, so trackpad momentum from
    // flinging down the page doesn't pop the footer open the moment the end is reached.
    let gestureActive = false;
    let gestureFromBottom = false;
    // touchStartY is where the current swipe began; the swipe length decides the same thing on mobile.
    let touchStartY: number | null = null;

    const onWheel = (e: WheelEvent) => {
      const isOpen = openRef.current;
      if (!gestureActive) {
        gestureActive = true;
        gestureFromBottom = atBottom();
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        gestureActive = false;
        wheelDistance = 0;
      }, WHEEL_RESET_MS);

      if (!isOpen && !(e.deltaY > 0 && gestureFromBottom && atBottom())) return;
      if (isOpen && e.deltaY >= 0) return;

      if (Math.sign(e.deltaY) !== Math.sign(wheelDistance)) wheelDistance = 0;
      wheelDistance += e.deltaY;

      if (!isOpen && wheelDistance > WHEEL_THRESHOLD) {
        setOpen(true);
        wheelDistance = 0;
      } else if (isOpen && wheelDistance < -WHEEL_THRESHOLD) {
        setOpen(false);
        wheelDistance = 0;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const swipe = touchStartY - e.touches[0].clientY; // positive = swiping up
      if (!openRef.current && swipe > TOUCH_THRESHOLD && atBottom()) {
        setOpen(true);
        touchStartY = null;
      } else if (openRef.current && swipe < -TOUCH_THRESHOLD) {
        setOpen(false);
        touchStartY = null;
      }
    };

    const onTouchEnd = () => {
      touchStartY = null;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) setOpen(false);
      // Arrow/Home/End keys move the caret while typing in the waitlist form; leave those alone.
      if (isTyping(e.target)) return;
      if (["End", "PageDown", "ArrowDown"].includes(e.key) && atBottom() && !openRef.current) setOpen(true);
      if (["Home", "PageUp", "ArrowUp"].includes(e.key) && openRef.current) setOpen(false);
    };

    // Dragging the scrollbar away from the bottom also closes it.
    const onScroll = () => {
      if (openRef.current && !atBottom()) setOpen(false);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(wheelTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div
        className="reveal-shift relative z-10 bg-page transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          transform: open ? `translateY(-${height}px)` : undefined,
          boxShadow: open ? "0 24px 48px -24px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {children}
      </div>

      <footer
        id="site-footer"
        ref={footerRef}
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-0 border-t border-white/10 bg-[#0e0d0c] transition-opacity duration-500 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-12 sm:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-3">
                <span className="font-poster text-[30px] font-semibold uppercase leading-none tracking-[0.02em] text-ink">Vardaan</span>
                <span className="beta-glass">Beta</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                The AI agent you can call for anything. Now in private beta.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm sm:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Product</p>
                <ul className="mt-4 space-y-2.5">
                  {NAV_LINKS.slice(1).map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} onClick={() => setOpen(false)} className="text-white/70 hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/#join" onClick={() => setOpen(false)} className="text-white/70 hover:text-ink">
                      Join waitlist
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Team</p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a href="https://github.com/fantastic4-team/Vardaan" target="_blank" rel="noreferrer" className="text-white/70 hover:text-ink">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Vardaan. All rights reserved.</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="cursor-pointer hover:text-ink"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
