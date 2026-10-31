"use client";

import { createContext, useContext, useState } from "react";

// Keeps the hero's two halves in step: the phone on the right reports which request it is playing,
// and the row of steps on the left highlights the same one.
const SceneContext = createContext<{ scene: number; setScene: (n: number) => void }>({ scene: 0, setScene: () => {} });

export function HeroSync({ children }: { children: React.ReactNode }) {
  const [scene, setScene] = useState(0);
  return <SceneContext.Provider value={{ scene, setScene }}>{children}</SceneContext.Provider>;
}

export const useHeroScene = () => useContext(SceneContext);

// How long one scene plays on the phone, so the progress line fills in step with it.
export const SCENE_MS = 6800;

const STEPS = [
  {
    label: "Reminders",
    tile: "tile-amber",
    icon: (
      <>
        <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </>
    ),
  },
  {
    label: "Emails",
    tile: "tile-rose",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  },
  {
    label: "Research",
    tile: "tile-leaf",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.8-4.8" />
      </>
    ),
  },
];

export function HeroSteps() {
  const { scene } = useHeroScene();
  return (
    <div aria-hidden="true" className="mt-7 flex flex-wrap gap-2 lg:mt-[clamp(20px,4vh,40px)]">
      {STEPS.map((s, i) => {
        const active = i === scene;
        return (
          <span
            key={s.label}
            className={`relative flex items-center gap-2 overflow-hidden rounded-full border py-1.5 pl-1.5 pr-3.5 text-[13px] transition-colors duration-500 ${
              active ? "border-white/25 bg-white/[0.07] text-ink" : "border-white/[0.08] text-ink/50"
            }`}
          >
            <span className={`glass-tile nav-tile ${s.tile} flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-500 ${active ? "" : "opacity-50"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                {s.icon}
              </svg>
            </span>
            {s.label}
            {active && <span key={scene} className="step-progress absolute bottom-0 left-0 h-[2px] bg-[#8ccbff]" style={{ animationDuration: `${SCENE_MS}ms` }} />}
          </span>
        );
      })}
    </div>
  );
}
