"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SCENE_MS, useHeroScene } from "@/components/landing/HeroSync";

// The phone in the hero: a photo of a hand holding a phone, with a live call with Vardaan playing
// behind its transparent screen (public/images/hero-hand.png), so the fingertips stay in front. A glowing blue card holds
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

const ICONS = {
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  phone: (
    <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
  ),
  check: <path d="m5.5 12.5 4 4 9-9.5" />,
};

type Card = { tile: string; icon: React.ReactNode; title: string; sub: string };

// For each scene: the result (top left) and what happens next (bottom right).
const CARDS: [Card, Card][] = [
  [
    { tile: "tile-amber", icon: ICONS.bell, title: "Reminder set", sub: "Call Maa · Sun 7 pm" },
    { tile: "tile-sky", icon: ICONS.phone, title: "Call scheduled", sub: "I'll ring you Sunday" },
  ],
  [
    { tile: "tile-rose", icon: ICONS.mail, title: "Email drafted", sub: "To Mr Sen" },
    { tile: "tile-violet", icon: ICONS.check, title: "Needs your OK", sub: "Approve before sending" },
  ],
  [
    { tile: "tile-leaf", icon: ICONS.search, title: "Researching", sub: "Phones under ₹15k" },
    { tile: "tile-sky", icon: ICONS.phone, title: "Call back", sub: "When picks are ready" },
  ],
];

// A card floating beside the phone: a glossy icon, a bold title and a short line. Solid white, in
// a fixed spot clear of the phone: top left beside its top corner, bottom right beside the hand.
function ResultCard({ card, spot, leaving, delay }: { card: Card; spot: string; leaving: boolean; delay: number }) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`hero-card-in absolute hidden w-[188px] items-center gap-3 rounded-[16px] border border-[#e7ebf3] bg-white py-3 pl-3 pr-3.5 shadow-[0_22px_44px_-18px_rgba(30,50,110,0.4),0_2px_5px_rgba(30,50,110,0.06)] transition-[opacity,transform] duration-500 ease-out sm:flex ${
        leaving ? "translate-y-1 opacity-0" : ""
      } ${spot}`}
    >
      <span className={`glass-tile nav-tile ${card.tile} flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]`}>
        <Glyph className="h-[17px] w-[17px]">{card.icon}</Glyph>
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-[17px] text-[#121833]">{card.title}</span>
        <span className="mt-0.5 block whitespace-nowrap text-[11.5px] leading-[15px] text-[#6b7287]">{card.sub}</span>
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
      // One continuous call: the next request replaces the last reply straight away, and the cards
      // stay up until the new reply swaps them, so nothing ever goes blank.
      setCaption({ key: ++key, who: "You", text: line.ask });
      setLeaving(false);
      at(1200, () => setSpeaking(true));
      at(1600, () => setCaption({ key: ++key, who: "Vardaan", text: line.reply }));
      at(1600, () => setCard({ key, index: line.card }));
      at(3800, () => setSpeaking(false));
      at(SCENE_MS - 320, () => setLeaving(true));
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-end justify-center text-left">
      {/* The photo is 1121 by 1403; shown 700 tall, its screen sits at (139, 63), 276 by 598. */}
      <div className="hand-stage relative h-[700px] w-[559px] shrink-0">
        <div className="absolute left-[139px] top-[63px] flex h-[598px] w-[276px] flex-col overflow-hidden rounded-[34px] bg-[#f1f3f7] px-3 pt-[38px]">
          {/* iPhone status bar, laid out around the photo's camera cutout (96 to 182 px across). */}
          <div className="absolute inset-x-0 top-[12px] flex h-[18px] items-center text-[#0e0f12]">
            <span className="flex w-[96px] justify-center text-[13px] font-semibold tracking-[-0.01em]">9:41</span>
            <span className="ml-auto flex w-[94px] items-center justify-center gap-[5px]">
              <svg viewBox="0 0 17 11" aria-hidden className="h-[10px] w-[16px] fill-current">
                <rect x="0" y="7" width="3" height="4" rx="0.8" />
                <rect x="4.6" y="5" width="3" height="6" rx="0.8" />
                <rect x="9.2" y="2.6" width="3" height="8.4" rx="0.8" />
                <rect x="13.8" y="0" width="3" height="11" rx="0.8" />
              </svg>
              <span className="relative flex h-[11px] w-[23px] items-center rounded-[3.5px] border border-current/40 p-[1.5px]">
                <span className="h-full w-[78%] rounded-[2px] bg-current" />
                <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r-[1px] bg-current/40" />
              </span>
            </span>
          </div>

          {/* The glowing call card: name and timer, the live line as a quote, and the voice orb. */}
          <div className="call-glow relative mt-2 flex flex-1 flex-col items-center rounded-[30px] px-5 pt-7 text-center">
            <p className="text-[14px] font-medium text-white/85">Vardaan</p>
            <p className="mt-0.5 text-[11.5px] text-white/70 tabular-nums">{clock}</p>

            <div className={`flex flex-1 flex-col items-center justify-center transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}>
              {caption && (
                <div key={caption.key} className="msg-in">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/60">{caption.who}</p>
                  <p className="mt-1.5 text-[17px] font-medium leading-[23px] text-white">&ldquo;{caption.text}&rdquo;</p>
                </div>
              )}
            </div>

            <span className={`voice-orb mb-9 ${speaking ? "is-speaking" : ""}`} />
          </div>

          {/* Controls: mute, end call and keypad on a soft tray. */}
          <div className="mx-auto mb-5 mt-3 flex w-full items-center justify-between rounded-full bg-[#e3e6ec] px-2 py-2">
            {/* Filled call icons from Google's Material icon set (Apache 2.0). */}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f8] text-[#3c4150]">
              <svg viewBox="0 0 24 24" aria-hidden className="h-[21px] w-[21px] fill-current">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              </svg>
            </span>
            <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[linear-gradient(160deg,#ff7a63_0%,#f0452f_100%)] text-white shadow-[0_10px_22px_-10px_#f0452f]">
              <svg viewBox="0 0 24 24" aria-hidden className="h-[24px] w-[24px] fill-current">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            </span>
            <span className="grid h-12 w-12 grid-cols-3 place-content-center gap-[3px] rounded-full bg-[#f4f5f8] px-[14px]">
              {Array.from({ length: 9 }, (_, k) => (
                <span key={k} className="h-[4.5px] w-[4.5px] rounded-full bg-[#3c4150]" />
              ))}
            </span>
          </div>
        </div>

        {/* The hand and phone, on top: the screen is transparent, so the call shows through. */}
        <Image src="/images/hero-hand.png" alt="" width={1121} height={1403} priority className="hand-photo absolute inset-0 h-full w-full select-none" />

        {/* What the latest request did, top left, and what happens next, bottom right. */}
        {card && (
          <>
            <ResultCard key={`a${card.key}`} card={CARDS[card.index][0]} spot="-left-[66px] top-[6%]" leaving={false} delay={0} />
            <ResultCard key={`b${card.key}`} card={CARDS[card.index][1]} spot="left-[444px] top-[68%]" leaving={false} delay={0} />
          </>
        )}
      </div>
    </div>
  );
}
