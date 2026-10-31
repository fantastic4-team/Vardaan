"use client";

import { useEffect, useRef, useState } from "react";

// A short call transcript that plays out while it's on screen: the user's line arrives, Vardaan
// "types", then replies. It holds, fades, and starts again. Reduced motion shows the final state.
type Step = 0 | 1 | 2 | 3; // nothing, user line, typing, reply

const TIMING: Record<Step, number> = { 0: 500, 1: 1100, 2: 1300, 3: 5200 };

export default function ChatDemo({ ask, reply }: { ask: string; reply: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(3);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setStep((s) => ((s + 1) % 4) as Step), TIMING[step]);
    return () => clearTimeout(t);
  }, [visible, step]);

  return (
    <div ref={ref} className="mt-auto pt-7">
      <div className="flex min-h-[132px] flex-col justify-end gap-2.5">
        <p
          className={`chat-in ml-auto w-fit max-w-[88%] rounded-[16px] rounded-br-[5px] bg-[#8ccbff] px-4 py-2.5 text-[14px] leading-[21px] text-[#0b1626] ${step >= 1 ? "is-in" : ""}`}
        >
          {ask}
        </p>
        <div className="relative">
          <span
            aria-hidden="true"
            className={`chat-in absolute bottom-0 left-0 flex h-[42px] items-center gap-1 rounded-[16px] rounded-bl-[5px] border border-white/10 bg-white/[0.06] px-4 ${step === 2 ? "is-in" : ""}`}
          >
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <p
            className={`chat-in w-fit max-w-[88%] rounded-[16px] rounded-bl-[5px] border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[14px] leading-[21px] text-ink/90 ${step === 3 ? "is-in" : ""}`}
          >
            {reply}
          </p>
        </div>
      </div>
    </div>
  );
}
