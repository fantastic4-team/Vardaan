import GardenScene from "@/components/GardenScene";
import InView from "@/components/landing/InView";
import SectionHeading, { GUTTER } from "@/components/landing/SectionHeading";
import { FEATURES, MODES, type FeatureIcon } from "@/lib/landing";

// Outline icons on one 24px grid with the same stroke as the dashboard's.
const ICONS: Record<FeatureIcon, React.ReactNode> = {
  phone: (
    <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
  ),
  language: (
    <>
      <path d="M4 5h9M8.5 3v2M6 5c.6 3.2 2.8 6 6 7.5M11 5c-.8 3.6-3.3 6.6-7 8" />
      <path d="m12.5 21 4-10 4 10M14 17.5h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12.2 2.3 2.3 4.2-4.6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  memory: (
    <>
      <path d="M12 4.5C10.4 3 8 3 6.5 3.5 4.5 4.2 3.5 6 3.5 8c-1 .8-1.5 2-1.5 3.2 0 1.6.9 3 2.2 3.6-.2 2.2 1.4 4.2 3.6 4.4 1.2 1.3 3 1.6 4.2.8" />
      <path d="M12 4.5c1.6-1.5 4-1.5 5.5-1 2 .7 3 2.5 3 4.5 1 .8 1.5 2 1.5 3.2 0 1.6-.9 3-2.2 3.6.2 2.2-1.4 4.2-3.6 4.4-1.2 1.3-3 1.6-4.2.8" />
      <path d="M12 4.5V20" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  message: <path d="M20 15.5a2 2 0 0 1-2 2H8l-4.5 3.5V5.5a2 2 0 0 1 2-2H18a2 2 0 0 1 2 2z" />,
  log: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
};

// Icon tile colours, taken from the garden art: sky, violet, poppy and leaf.
const TONES = [
  "bg-[#8ccbff]/12 text-[#b9e0ff] ring-1 ring-inset ring-[#8ccbff]/20",
  "bg-[#a99bff]/12 text-[#c7b8ff] ring-1 ring-inset ring-[#a99bff]/20",
  "bg-[#ff8fa3]/12 text-[#ffb4c1] ring-1 ring-inset ring-[#ff8fa3]/20",
  "bg-[#acbe62]/14 text-[#d4e59a] ring-1 ring-inset ring-[#acbe62]/25",
];

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className={`nav-grid scroll-mt-6 border-t ${GUTTER} py-24 lg:py-32`}>
      <SectionHeading
        id="features-title"
        eyebrow="Features"
        title="One phone call. Everything handled."
        intro="Vardaan works the way you already do: you talk, it listens, and it gets on with it. Two ways to use it, one assistant behind both."
      />

      {/* The two modes: a garden scene, what the mode is, and a short sample of the conversation. */}
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {MODES.map((m, i) => (
          <InView key={m.name} i={i} className="h-full">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/20">
              <div aria-hidden="true" className="relative h-48 overflow-hidden sm:h-56">
                <GardenScene scene={m.scene} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.03]" />
                <div className="poster-grain absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(23,22,21,0)_0%,#171615_100%)]" />
                <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[12px] text-ink/90 lg:left-8 lg:top-7">
                  Mode {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col px-6 pb-7 lg:px-8 lg:pb-9">
                <h3 className="text-[28px] font-medium tracking-[-0.02em] text-ink">{m.name}</h3>
                <p className="mt-2 max-w-[460px] text-[15px] leading-[24px] text-ink/65">{m.body}</p>
                <div className="mt-auto space-y-2.5 pt-7">
                  <p className="ml-auto w-fit max-w-[88%] rounded-[16px] rounded-br-[5px] bg-[#8ccbff] px-4 py-2.5 text-[14px] leading-[21px] text-[#0b1626]">
                    {m.example}
                  </p>
                  <p className="w-fit max-w-[88%] rounded-[16px] rounded-bl-[5px] border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[14px] leading-[21px] text-ink/90">
                    {m.reply}
                  </p>
                </div>
              </div>
            </article>
          </InView>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <InView key={f.title} i={i % 4} className="h-full">
            <div className="h-full rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_100%)] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
              <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${TONES[i % TONES.length]}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
                  {ICONS[f.icon]}
                </svg>
              </span>
              <h3 className="mt-6 text-[17px] font-medium tracking-[-0.01em] text-ink">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-[22px] text-ink/60">{f.body}</p>
            </div>
          </InView>
        ))}
      </div>
    </section>
  );
}
