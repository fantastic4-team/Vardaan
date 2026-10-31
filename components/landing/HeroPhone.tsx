"use client";

import { useEffect, useState } from "react";

// The phone floating over the hero art: a live call with Vardaan that plays on a loop. You ask for
// a reminder, Vardaan replies, and a "Reminder set" card pops out beside the phone. Reduced motion
// shows the finished call.
type Step = 0 | 1 | 2 | 3;
const TIMING: Record<Step, number> = { 0: 900, 1: 1300, 2: 1200, 3: 4200 };

const WAVE = [0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.65, 0.4, 0.8, 0.55, 0.95, 0.7, 0.45, 0.85, 0.6, 0.3, 0.7, 0.9, 0.5, 0.65, 0.4, 0.8];

const PHONE = (
  <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
);

function Glyph({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

function FloatCard({ show, tile, icon, title, sub, className }: { show: boolean; tile: string; icon: React.ReactNode; title: string; sub: string; className: string }) {
  return (
    <div
      className={`hero-card absolute flex items-center gap-3 rounded-[14px] border border-white/15 bg-[#14131c]/90 py-2.5 pl-2.5 pr-4 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.75)] ${show ? "is-in" : ""} ${className}`}
    >
      <span className={`glass-tile nav-tile ${tile} flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]`}>
        <Glyph>{icon}</Glyph>
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[12.5px] font-medium text-ink">{title}</span>
        <span className="block whitespace-nowrap text-[11px] text-ink/60">{sub}</span>
      </span>
    </div>
  );
}

export default function HeroPhone() {
  const [step, setStep] = useState<Step>(0);
  const [still, setStill] = useState(false);
  const [seconds, setSeconds] = useState(12);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setStep(3);
    }
  }, []);

  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => setStep((s) => ((s + 1) % 4) as Step), TIMING[step]);
    return () => clearTimeout(t);
  }, [step, still]);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [still]);

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-left">
      <div className="hero-float relative">
        {/* Phone frame */}
        <div className="relative h-[470px] w-[236px] rounded-[44px] border border-white/20 bg-[#0b0a10] p-[8px] shadow-[0_40px_90px_-30px_rgba(10,8,40,0.85),inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:h-[520px] sm:w-[260px]">
          <div className="flex h-full flex-col overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#2c2b58_0%,#17162d_48%,#0f0e17_100%)] px-4 pt-3">
            <div className="flex items-center justify-between px-1.5 text-[10.5px] font-medium text-ink/85">
              <span>9:41</span>
              <span className="h-[20px] w-[76px] rounded-full bg-black" />
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 16 12" aria-hidden className="h-2.5 w-3 fill-current">
                  <rect x="0" y="8" width="3" height="4" rx="1" />
                  <rect x="4.3" y="5.5" width="3" height="6.5" rx="1" />
                  <rect x="8.6" y="3" width="3" height="9" rx="1" />
                  <rect x="12.9" y="0" width="3" height="12" rx="1" />
                </svg>
                <span className="h-2.5 w-[18px] rounded-[3px] border border-current p-[1.5px]">
                  <span className="block h-full w-3/4 rounded-[1px] bg-current" />
                </span>
              </span>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="ring-pulse absolute inset-0 rounded-full border border-[#8ccbff]/50" />
                <span className="ring-pulse absolute inset-0 rounded-full border border-[#8ccbff]/50 [animation-delay:1.2s]" />
                <span className="mic-button relative flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-semibold text-[#0b1626]">V</span>
              </span>
              <p className="mt-3 text-[16px] font-medium text-ink">Vardaan</p>
              <p className="mt-0.5 text-[11.5px] text-[#c9e877] tabular-nums">On call · {clock}</p>
            </div>

            {/* Transcript */}
            <div className="mt-4 flex min-h-[132px] flex-1 flex-col justify-end gap-2 pb-1">
              <p className={`chat-in ml-auto max-w-[88%] rounded-[14px] rounded-br-[4px] bg-[#8ccbff] px-3 py-2 text-[11.5px] leading-[16px] text-[#0b1626] ${step >= 1 ? "is-in" : ""}`}>
                Remind me to call Maa on Sunday at 7.
              </p>
              <div className="relative">
                <span className={`chat-in absolute bottom-0 left-0 flex h-[30px] items-center gap-1 rounded-[14px] rounded-bl-[4px] bg-white/[0.1] px-3 ${step === 2 ? "is-in" : ""}`}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                <p className={`chat-in max-w-[88%] rounded-[14px] rounded-bl-[4px] bg-white/[0.1] px-3 py-2 text-[11.5px] leading-[16px] text-ink/90 ${step === 3 ? "is-in" : ""}`}>
                  Done. I&apos;ll ring you on Sunday at 7 pm to call Maa.
                </p>
              </div>
            </div>

            <div className="mt-3 flex h-8 items-center justify-between gap-[2px] px-1">
              {WAVE.map((h, k) => (
                <span key={k} className="wave-bar w-[3px] rounded-full bg-[linear-gradient(180deg,#b9e0ff_0%,#74bdf8_100%)]" style={{ height: `${h * 100}%`, animationDelay: `${(k % 8) * 0.11}s` }} />
              ))}
            </div>

            <div className="mb-6 mt-4 flex items-center justify-center gap-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.1] text-ink/85">
                <Glyph className="h-[18px] w-[18px]">
                  <path d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3.5" />
                </Glyph>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff5d6e] text-white shadow-[0_8px_20px_-8px_#ff5d6e]">
                <Glyph className="h-[18px] w-[18px]">
                  <path d="M3.5 13.5c4.7-4.2 12.3-4.2 17 0l-2.2 2.2-3-1.2v-2.3a10 10 0 0 0-6.6 0v2.3l-3 1.2z" />
                </Glyph>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.1] text-ink/85">
                <Glyph className="h-[18px] w-[18px]">
                  <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
                </Glyph>
              </span>
            </div>
          </div>
        </div>

        {/* Cards that pop out beside the phone */}
        <FloatCard
          show={step === 3}
          tile="tile-amber"
          icon={
            <>
              <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
              <path d="M10 19a2.2 2.2 0 0 0 4 0" />
            </>
          }
          title="Reminder set"
          sub="Call Maa · Sun, 7:00 pm"
          className="-left-[54%] top-[18%] hidden sm:flex"
        />
        <FloatCard
          show
          tile="tile-rose"
          icon={
            <>
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="m4 7 8 6 8-6" />
            </>
          }
          title="Email drafted"
          sub="Waiting for your OK"
          className="-right-[50%] bottom-[22%] hidden sm:flex"
        />
        <FloatCard
          show
          tile="tile-leaf"
          icon={PHONE}
          title="Calls you back"
          sub="When the task is done"
          className="-right-[44%] top-[8%] hidden xl:flex"
        />
      </div>
    </div>
  );
}
