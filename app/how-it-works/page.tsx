import type { Metadata } from "next";
import SectionPage, { CardGrid } from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Call Vardaan, describe what you need in Hindi, English or Hinglish, and it plans the steps, confirms the details and gets it done.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    title: "Call and say what you need",
    body: "Dial in from any phone and explain the task in your own words, in Hindi, English or Hinglish. No app, no screen, no typing.",
  },
  {
    title: "Vardaan plans and confirms",
    body: "It understands the intent, breaks the task into steps and reads back the important details before doing anything.",
  },
  {
    title: "It gets done, and you hear back",
    body: "Vardaan completes the task and reports back by callback, SMS or WhatsApp, so you always know where things stand.",
  },
];

const MODES = [
  {
    name: "Call & Cut",
    body: "Hang up and let Vardaan work in the background: filling a form, sending a professional email, contacting a business, tracking a request or making a booking. It reports back when it is done.",
  },
  {
    name: "Talk & Help",
    body: "Stay on the line for real-time support: think through a decision, understand a document or bill, get step-by-step guidance in an unfamiliar situation, or draft a reply together.",
  },
];

export default function HowItWorks() {
  return (
    <SectionPage
      eyebrow="How it works"
      title="One phone call, start to finish."
      intro="Vardaan turns a phone call into a capable personal agent. You describe the task, it plans the steps, confirms the details and takes the work off your hands."
    >
      <CardGrid items={STEPS} />

      <h2 className="mt-20 text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.02em] text-ink">Two ways to use it</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MODES.map((mode) => (
          <div key={mode.name} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-7 lg:p-9">
            <h3 className="text-[22px] font-medium text-ink">{mode.name}</h3>
            <p className="mt-3 text-[15px] leading-[24px] text-ink/65">{mode.body}</p>
          </div>
        ))}
      </div>

      <div className="nav-grid mt-20 grid gap-10 border-t pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <h2 className="text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.02em] text-ink">It asks before it acts</h2>
        <p className="text-[16px] leading-[26px] text-ink/70">
          Vardaan remembers your preferences and context, so every call gets faster. When information is missing or a
          decision carries real consequences, it calls you back for approval instead of guessing.
        </p>
      </div>
    </SectionPage>
  );
}
