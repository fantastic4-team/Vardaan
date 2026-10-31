import ChatDemo from "@/components/landing/ChatDemo";
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

// Glossy icon tiles in the garden's colours: rose, sky, violet and leaf (see .glass-tile).
const TONES = ["tile-rose", "tile-sky", "tile-violet", "tile-leaf"];

// The header of each mode card: a phone call as Vardaan shows it. Call & Cut has ended and
// Vardaan is working through the task; Talk & Help is live, with the voice waveform moving.
const WAVE = [
  0.3, 0.5, 0.75, 0.45, 0.9, 0.6, 1, 0.7, 0.4, 0.85, 0.55, 0.95, 0.65, 0.35, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7, 1, 0.55, 0.8, 0.45, 0.65, 0.9, 0.4,
  0.75, 0.5, 0.3,
];

function ModeArt({ live }: { live: boolean }) {
  return (
    <div className="mode-art absolute inset-0 flex items-center justify-center px-6 pb-2 pt-12">
      <div className="w-full max-w-[320px] rounded-[16px] border border-white/[0.12] bg-[#16151d]/85 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <span className="mic-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-[#0b1626]">V</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium text-ink">Vardaan</p>
            <p className="text-[11.5px] text-ink/50">{live ? "On call · 0:07" : "Call ended · 0:42"}</p>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${
              live ? "border-[#8fcf3c]/35 bg-[#8fcf3c]/12 text-[#c9e877]" : "border-white/15 bg-white/[0.05] text-ink/60"
            }`}
          >
            {live ? "Live" : "Working"}
          </span>
        </div>

        {live ? (
          <div className="mt-4 flex h-12 items-center justify-between gap-[3px]" aria-hidden>
            {WAVE.map((h, k) => (
              <span key={k} className="wave-bar w-[4px] rounded-full bg-[linear-gradient(180deg,#b9e0ff_0%,#74bdf8_100%)]" style={{ height: `${h * 100}%`, animationDelay: `${(k % 8) * 0.11}s` }} />
            ))}
          </div>
        ) : (
          <ol className="mt-3.5 space-y-2 text-[12px]">
            {[
              { label: "Find the landlord's email", state: "done" },
              { label: "Draft the message", state: "done" },
              { label: "Call you back to approve", state: "now" },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    s.state === "done" ? "bg-[#8fcf3c]/20 text-[#c9e877]" : "border border-[#8ccbff]/60"
                  }`}
                >
                  {s.state === "done" ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-2.5 w-2.5">
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8ccbff]" />
                  )}
                </span>
                <span className={s.state === "done" ? "text-ink/55 line-through decoration-white/20" : "text-ink/90"}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className={`nav-grid scroll-mt-6 border-t ${GUTTER} py-24 lg:py-32`}>
      <SectionHeading
        id="features-title"
        eyebrow="Features"
        title="One call. Everything handled."
        intro="Talk to Vardaan the way you would to someone you trust. It understands your language, remembers what matters, and gets the work done, whether you hang up or stay on the line."
      />

      {/* The two modes: a garden scene, what the mode is, and a short sample of the conversation. */}
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {MODES.map((m, i) => (
          <InView key={m.name} i={i} className="h-full">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/20">
              <div aria-hidden="true" className="relative h-60 overflow-hidden">
                <ModeArt live={i === 1} />
                <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[12px] text-ink/90 lg:left-8 lg:top-7">
                  Mode {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col px-6 pb-7 lg:px-8 lg:pb-9">
                <h3 className="text-[28px] font-medium tracking-[-0.02em] text-ink">{m.name}</h3>
                <p className="mt-2 max-w-[460px] text-[15px] leading-[24px] text-ink/65">{m.body}</p>
                <ChatDemo ask={m.example} reply={m.reply} live={i === 1} />
              </div>
            </article>
          </InView>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <InView key={f.title} i={i % 4} className="h-full">
            <div className="h-full rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_100%)] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
              <span className={`glass-tile ${TONES[i % TONES.length]} flex h-14 w-14 items-center justify-center rounded-[16px]`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-7 w-7">
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
