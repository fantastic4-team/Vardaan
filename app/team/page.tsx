import type { Metadata } from "next";
import Image from "next/image";
import SectionPage from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "Team",
  description: "Vardaan is built by Fantastic 4, a small team working across frontend, backend, cloud and applied AI.",
  alternates: { canonical: "/team" },
};

// Photos live in public/images/team. Roles come from the Fantastic 4 team README; add the
// missing ones here when they're confirmed.
const TEAM: { name: string; role?: string; photo: string; github?: string }[] = [
  {
    name: "Souradeep Pradhan",
    role: "Team Lead & Frontend Engineering",
    photo: "/images/team/souradeep (2).png",
    github: "https://github.com/pradhan-not-found",
  },
  { name: "Aniruddha Das", role: "Backend Engineering & Systems", photo: "/images/team/aniruddha.png" },
  { name: "Sampurna", photo: "/images/team/sampurna.png" },
  { name: "Sattwik", photo: "/images/team/sattwik.png" },
];

// The photos have white backgrounds; multiplying them over a poster colour turns the white into
// that colour, and the grain on top gives the printed texture.
const TONES = [
  "linear-gradient(180deg, #c9cdfb 0%, #8a96f2 100%)",
  "linear-gradient(180deg, #e7f6a6 0%, #a9d65a 100%)",
  "linear-gradient(180deg, #ffd6df 0%, #ff98ad 100%)",
  "linear-gradient(180deg, #ece2ff 0%, #b79df0 100%)",
];

export default function Team() {
  return (
    <SectionPage
      eyebrow="Team"
      title="Built by Fantastic 4."
      intro="A small team working across frontend, backend, cloud and applied AI, building the agent we wish our own families had."
      scene="poppies"
    >
      <div className="nav-grid grid border-l border-t sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((member, i) => (
          <div key={member.name} className="nav-grid border-b border-r p-5 lg:p-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[12px]" style={{ background: TONES[i % TONES.length] }}>
              <Image
                src={member.photo}
                alt={member.name}
                fill
                loading="eager"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top mix-blend-multiply saturate-[0.9] contrast-[1.05]"
              />
              <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
            </div>
            <h2 className="mt-5 text-[18px] font-medium text-ink">{member.name}</h2>
            {member.role && <p className="mt-1 text-[14px] text-ink/60">{member.role}</p>}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-[13px] text-ink/70 underline underline-offset-2 transition hover:text-ink"
              >
                GitHub
              </a>
            )}
          </div>
        ))}
      </div>
    </SectionPage>
  );
}
