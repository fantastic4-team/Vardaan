import { BRANDS } from "@/components/dashboard/BrandLogo";

// Large, transparent white icons engraved into the hero background, one for each thing Vardaan
// does: calling, its voice, reminders, Google Calendar and Gmail. They stay in view and
// slowly zoom in and out in place, each on its own beat.
const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const TILES: { x: string; y: string; size: number; delay: number; icon: React.ReactNode; label: string }[] = [
  {
    label: "Calls",
    x: "19%",
    y: "24%",
    size: 100,
    delay: 0,
    icon: (
      <path
        {...LINE}
        d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z"
      />
    ),
  },
  {
    label: "Google Calendar",
    x: "81%",
    y: "24%",
    size: 92,
    delay: 2,
    icon: <path fill="currentColor" fillOpacity={0.7} d={BRANDS.googlecalendar.d} />,
  },
  {
    label: "Reminders",
    x: "81%",
    y: "76%",
    size: 100,
    delay: 4,
    icon: (
      <>
        <path {...LINE} d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
        <path {...LINE} d="M10 19a2.2 2.2 0 0 0 4 0" />
      </>
    ),
  },
  {
    label: "Gmail",
    x: "19%",
    y: "76%",
    size: 92,
    delay: 6,
    icon: <path fill="currentColor" fillOpacity={0.7} d={BRANDS.gmail.d} />,
  },
];

// Bar heights for the voice waveform.
const VOICE = [0.35, 0.7, 1, 0.55, 0.85, 0.45, 0.95, 0.6, 0.4, 0.75, 0.5];

export default function HeroGlass() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {TILES.map((t) => (
        <span
          key={t.label}
          className="glass-icon absolute text-white"
          style={{ left: t.x, top: t.y, width: t.size, height: t.size, animationDelay: `${t.delay}s` }}
        >
          <svg viewBox="0 0 24 24" className="h-full w-full">
            {t.icon}
          </svg>
        </span>
      ))}

      {/* Vardaan's voice: a transparent waveform engraved under the phone, always moving. */}
      <span className="glass-voice absolute bottom-[2%] left-1/2 flex h-14 w-[220px] items-center justify-center gap-[6px]">
        {VOICE.map((h, k) => (
          <span key={k} className="wave-bar w-[5px] rounded-full bg-white" style={{ height: `${h * 60}%`, animationDelay: `${(k % 6) * 0.12}s` }} />
        ))}
      </span>
    </div>
  );
}
