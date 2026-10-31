"use client";

import { useEffect, useState } from "react";
import { SCENE_MS, useHeroScene } from "@/components/landing/HeroSync";

// The phone in the hero: a live call with Vardaan on a light call screen. A glowing blue card holds
// the live line of the call as a large quote (your request, then Vardaan's reply) above a voice orb
// that swirls and swells while Vardaan speaks. The result eases in as a card beside the phone.
// Reduced motion shows one finished exchange.
const SCRIPT = [
  { ask: "Remind me to call Maa on Sunday at 7.", reply: "Done. I'll ring you on Sunday at 7 pm.", card: 0 },
  { ask: "Email my landlord the kitchen tap is leaking.", reply: "Drafted it. I'll call you to approve before it goes.", card: 1 },
  { ask: "Find a good phone under ₹15,000 for Papa.", reply: "On it. I'll call you back with three picks.", card: 2 },
];

type Caption = { key: number; who: "You" | "Vardaan"; text: string };

function Glyph({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

const CARDS = [
  {
    tile: "tile-amber",
    title: "Reminder set",
    sub: "Call Maa · Sun, 7:00 pm",
    icon: (
      <>
        <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </>
    ),
  },
  {
    tile: "tile-rose",
    title: "Email drafted",
    sub: "Waiting for your OK",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  },
  {
    tile: "tile-leaf",
    title: "Researching",
    sub: "Calls you back when done",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.8-4.8" />
      </>
    ),
  },
];

function ResultCard({ index, side, leaving }: { index: number; side: "left" | "right"; leaving: boolean }) {
  const c = CARDS[index];
  return (
    <div
      className={`hero-card-in absolute hidden items-center gap-3 rounded-[16px] border border-white/80 bg-white/85 py-2.5 pl-2.5 pr-4 shadow-[0_20px_44px_-18px_rgba(30,50,110,0.45)] transition-[opacity,transform] duration-500 ease-out sm:flex ${
        leaving ? "translate-y-1 opacity-0" : ""
      } ${side === "left" ? "-left-[60%] top-[30%]" : "-right-[60%] top-[50%]"}`}
    >
      <span className={`glass-tile nav-tile ${c.tile} flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]`}>
        <Glyph>{c.icon}</Glyph>
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[12.5px] font-medium text-[#1b2140]">{c.title}</span>
        <span className="block whitespace-nowrap text-[11px] text-[#5b6383]">{c.sub}</span>
      </span>
    </div>
  );
}

export default function HeroPhone() {
  const [caption, setCaption] = useState<Caption | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [card, setCard] = useState<{ key: number; index: number } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [still, setStill] = useState(false);
  const [seconds, setSeconds] = useState(12);
  const { setScene } = useHeroScene();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setCaption({ key: 1, who: "Vardaan", text: SCRIPT[0].reply });
      setCard({ key: 1, index: 0 });
      return;
    }
    // Each scene: your request, Vardaan thinking and speaking, its reply and result, then fade out.
    let timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    let key = 0;
    function play(i: number) {
      const line = SCRIPT[i % SCRIPT.length];
      timers = [];
      setScene(i % SCRIPT.length);
      setCaption(null);
      setCard(null);
      setLeaving(false);
      at(300, () => setCaption({ key: ++key, who: "You", text: line.ask }));
      at(2100, () => setSpeaking(true));
      at(2600, () => setCaption({ key: ++key, who: "Vardaan", text: line.reply }));
      at(3000, () => setCard({ key, index: line.card }));
      at(5200, () => setSpeaking(false));
      at(SCENE_MS - 600, () => setLeaving(true));
      at(SCENE_MS, () => play(i + 1));
    }
    play(0);
    return () => timers.forEach(clearTimeout);
  }, [setScene]);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [still]);

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-left">
      <div className="relative">
        {/* Phone: a silver titanium edge with side buttons, a thin black bezel, and a light screen. */}
        <span className="absolute -left-[3px] top-[108px] h-7 w-[3px] rounded-l-[2px] bg-[linear-gradient(90deg,#c9ccd3,#8b8f98)]" />
        <span className="absolute -left-[3px] top-[148px] h-12 w-[3px] rounded-l-[2px] bg-[linear-gradient(90deg,#c9ccd3,#8b8f98)]" />
        <span className="absolute -left-[3px] top-[206px] h-12 w-[3px] rounded-l-[2px] bg-[linear-gradient(90deg,#c9ccd3,#8b8f98)]" />
        <span className="absolute -right-[3px] top-[160px] h-16 w-[3px] rounded-r-[2px] bg-[linear-gradient(270deg,#c9ccd3,#8b8f98)]" />
        <div className="relative h-[470px] w-[236px] rounded-[46px] bg-[linear-gradient(145deg,#eef0f4_0%,#a9adb6_25%,#d8dbe1_50%,#9a9ea7_75%,#e4e6eb_100%)] p-[2.5px] shadow-[0_60px_100px_-35px_rgba(30,50,110,0.55),0_25px_45px_-25px_rgba(20,30,70,0.45)] sm:h-[520px] sm:w-[260px]">
          <div className="h-full rounded-[44px] bg-[#0b0c10] p-[6px]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-[#f1f3f7] px-3 pt-3">
              <div className="flex items-center justify-between px-3 text-[10.5px] font-semibold text-[#1b1d24]">
                <span>9:41</span>
                <span className="h-[20px] w-[76px] rounded-full bg-[#0b0c10]" />
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

              {/* The glowing call card: name and timer, the live line as a quote, and the voice orb. */}
              <div className="call-glow relative mt-3 flex flex-1 flex-col items-center rounded-[30px] px-5 pt-6 text-center">
                <p className="text-[13px] font-medium text-white/85">Vardaan</p>
                <p className="mt-0.5 text-[11px] text-white/70 tabular-nums">{clock}</p>

                <div className={`flex flex-1 flex-col items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
                  {caption && (
                    <div key={caption.key} className="msg-in">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/60">{caption.who}</p>
                      <p className="mt-1.5 text-[15.5px] font-medium leading-[21px] text-white">&ldquo;{caption.text}&rdquo;</p>
                    </div>
                  )}
                </div>

                <span className={`voice-orb mb-8 ${speaking ? "is-speaking" : ""}`} />
              </div>

              {/* Controls: mute, end call and keypad on a soft tray. */}
              <div className="mx-auto mb-4 mt-3 flex w-full items-center justify-between rounded-full bg-[#e3e6ec] px-2 py-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f5f8] text-[#6b7080]">
                  <Glyph className="h-[18px] w-[18px]">
                    <path d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3.5M4 4l16 16" />
                  </Glyph>
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(160deg,#ff7a63_0%,#f0452f_100%)] text-white shadow-[0_10px_22px_-10px_#f0452f]">
                  <Glyph className="h-[19px] w-[19px]">
                    <path d="M3.5 13.5c4.7-4.2 12.3-4.2 17 0l-2.2 2.2-3-1.2v-2.3a10 10 0 0 0-6.6 0v2.3l-3 1.2z" />
                  </Glyph>
                </span>
                <span className="grid h-11 w-11 grid-cols-3 place-content-center gap-[3px] rounded-full bg-[#f4f5f8] px-[13px]">
                  {Array.from({ length: 9 }, (_, k) => (
                    <span key={k} className="h-[4px] w-[4px] rounded-full bg-[#4a4f5e]" />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The result of the latest request, alternating sides. */}
        {card && <ResultCard key={card.key} index={card.index} side={card.index % 2 ? "right" : "left"} leaving={leaving} />}
      </div>
    </div>
  );
}
