import { BRANDS } from "@/components/dashboard/BrandLogo";

// Two rows of glassy rings above and below the hero phone, each holding a white logo for what
// Vardaan does. The rows slide side by side in opposite directions and fade out at the edges, so
// the logos never pass behind the phone.
const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const LOGOS: Record<string, React.ReactNode> = {
  calls: (
    <path
      {...LINE}
      d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z"
    />
  ),
  calendar: <path fill="currentColor" d={BRANDS.googlecalendar.d} />,
  gmail: <path fill="currentColor" d={BRANDS.gmail.d} />,
  whatsapp: <path fill="currentColor" d={BRANDS.whatsapp.d} />,
  reminders: (
    <>
      <path {...LINE} d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
      <path {...LINE} d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  research: (
    <>
      <circle {...LINE} cx="10.5" cy="10.5" r="6.5" />
      <path {...LINE} d="m20 20-4.8-4.8" />
    </>
  ),
  memory: (
    <>
      <path {...LINE} d="M12 4.5C10.4 3 8 3 6.5 3.5 4.5 4.2 3.5 6 3.5 8c-1 .8-1.5 2-1.5 3.2 0 1.6.9 3 2.2 3.6-.2 2.2 1.4 4.2 3.6 4.4 1.2 1.3 3 1.6 4.2.8" />
      <path {...LINE} d="M12 4.5c1.6-1.5 4-1.5 5.5-1 2 .7 3 2.5 3 4.5 1 .8 1.5 2 1.5 3.2 0 1.6-.9 3-2.2 3.6.2 2.2-1.4 4.2-3.6 4.4-1.2 1.3-3 1.6-4.2.8" />
      <path {...LINE} d="M12 4.5V20" />
    </>
  ),
  languages: (
    <>
      <path {...LINE} d="M4 5h9M8.5 3v2M6 5c.6 3.2 2.8 6 6 7.5M11 5c-.8 3.6-3.3 6.6-7 8" />
      <path {...LINE} d="m12.5 21 4-10 4 10M14 17.5h5" />
    </>
  ),
};

const TOP = ["calls", "calendar", "gmail", "reminders", "whatsapp", "research", "memory", "languages"];
const BOTTOM = ["gmail", "languages", "calls", "memory", "calendar", "research", "whatsapp", "reminders"];

function Row({ items, className, reverse }: { items: string[]; className: string; reverse?: boolean }) {
  // The list is drawn twice so the slide loops without a gap.
  return (
    <div className={`hero-marquee absolute inset-x-0 overflow-hidden ${className}`}>
      <div className={`hero-marquee-track flex w-max gap-5 ${reverse ? "is-reverse" : ""}`}>
        {[...items, ...items].map((key, i) => (
          <span key={i} className="hero-ring-logo flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white">
            <svg viewBox="0 0 24 24" className="h-7 w-7">
              {LOGOS[key]}
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HeroGlass() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Row items={TOP} className="top-[6%]" />
      <Row items={BOTTOM} className="bottom-[6%]" reverse />
    </div>
  );
}
