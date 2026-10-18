import type { Metadata } from "next";
import Image from "next/image";
import SectionPage from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Vardaan is built by Fantastic 4: frontend, backend and full stack, AI/ML, and database engineering under one roof.",
  alternates: { canonical: "/team" },
};

type Links = { website?: string; github?: string; linkedin?: string };

// Photos live in public/images/team. Links left empty point to "#" as placeholders until the real
// URLs are filled in.
const TEAM: { name: string; role: string; photo: string; links: Links }[] = [
  {
    name: "Souradeep Pradhan",
    role: "Frontend Developer",
    photo: "/images/team/souradeep (2).png",
    links: { website: "", github: "https://github.com/pradhan-not-found", linkedin: "" },
  },
  {
    name: "Aniruddha Das",
    role: "Backend & Full Stack Engineer",
    photo: "/images/team/aniruddha.png",
    links: { website: "", github: "", linkedin: "" },
  },
  {
    name: "Sampurna",
    role: "AI/ML Engineer",
    photo: "/images/team/sampurna.png",
    links: { website: "", github: "", linkedin: "" },
  },
  {
    name: "Sattwik",
    role: "Database Manager",
    photo: "/images/team/sattwik.png",
    links: { website: "", github: "", linkedin: "" },
  },
];

// The photos have white backgrounds; multiplying them over a poster colour turns the white into
// that colour, and the grain on top gives the printed texture.
const TONES = [
  "linear-gradient(180deg, #c9cdfb 0%, #8a96f2 100%)",
  "linear-gradient(180deg, #e7f6a6 0%, #a9d65a 100%)",
  "linear-gradient(180deg, #ffd6df 0%, #ff98ad 100%)",
  "linear-gradient(180deg, #ece2ff 0%, #b79df0 100%)",
];

const ICONS: Record<keyof Links, { label: string; path: React.ReactNode }> = {
  website: {
    label: "Website",
    path: (
      <>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  github: {
    label: "GitHub",
    path: (
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.2 10.2 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
      />
    ),
  },
  linkedin: {
    label: "LinkedIn",
    path: (
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
      />
    ),
  },
};

function SocialLinks({ name, links }: { name: string; links: Links }) {
  const items = Object.keys(ICONS) as (keyof Links)[];
  return (
    <ul className="mt-3 flex items-center gap-3.5 sm:mt-4 sm:gap-4">
      {items.map((key) => (
        <li key={key}>
          <a
            href={links[key] || "#"}
            {...(links[key] ? { target: "_blank", rel: "noreferrer" } : {})}
            aria-label={`${name} on ${ICONS[key].label}`}
            title={ICONS[key].label}
            className="block text-ink/55 transition hover:text-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
              {ICONS[key].path}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Team() {
  return (
    <SectionPage
      eyebrow="Team"
      title="Built by Fantastic 4."
      intro="Four engineers across frontend, backend, AI/ML and data, building the agent we wish our own families had."
      scene="poppies"
    >
      <div className="nav-grid grid grid-cols-2 border-l border-t lg:grid-cols-4">
        {TEAM.map((member, i) => (
          <div key={member.name} className="nav-grid min-w-0 border-b border-r p-3 sm:p-5 lg:p-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[12px]" style={{ background: TONES[i % TONES.length] }}>
              <Image
                src={member.photo}
                alt={member.name}
                fill
                loading="eager"
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover object-top mix-blend-multiply saturate-[0.9] contrast-[1.05]"
              />
              <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
            </div>
            <h2 className="mt-4 text-[15px] font-medium leading-snug text-ink sm:mt-5 sm:text-[18px]">{member.name}</h2>
            <p className="mt-1 text-[12px] leading-snug text-ink/60 sm:text-[14px]">{member.role}</p>
            <SocialLinks name={member.name} links={member.links} />
          </div>
        ))}
      </div>
    </SectionPage>
  );
}
