import type { Metadata } from "next";
import SectionPage, { CardGrid } from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "Complaints, appointments, refunds, emails and more. See what you can hand off to Vardaan with a single phone call.",
  alternates: { canonical: "/use-cases" },
};

const TASKS = [
  { title: "File a complaint", body: "Describe the problem once. Vardaan files it with the right business or service and follows up." },
  { title: "Reschedule an appointment", body: "Move a doctor's visit, a service booking or a meeting without waiting on hold." },
  { title: "Chase a pending refund", body: "Vardaan tracks the request, contacts the business and tells you when the money is on its way." },
  { title: "Send a professional email", body: "Say what you want to communicate. Vardaan drafts it, confirms it with you and sends it." },
  { title: "Compare your options", body: "Plans, prices or providers: Vardaan does the research and walks you through the choice." },
  { title: "Understand a document or bill", body: "Stay on the line and go through a confusing letter, bill or form together, step by step." },
];

const PEOPLE = [
  { title: "Parents and elders", body: "Simple online work without depending on someone else to do it for them." },
  { title: "Shopkeepers and daily workers", body: "Paperwork and follow-ups handled, so working hours stay working hours." },
  { title: "Busy professionals", body: "Repetitive coordination taken off the plate, leaving time for meaningful work." },
  { title: "People on the move", body: "Driving, travelling or away from a screen, and still able to get things done." },
];

export default function UseCases() {
  return (
    <SectionPage
      eyebrow="Use cases"
      title="Hand it off. Hear back when it's done."
      intro="Getting things done today means switching between apps, navigating confusing websites and waiting on hold. Vardaan is one place you can turn to and say: handle this for me."
      scene="lotus"
    >
      <CardGrid items={TASKS} />

      <h2 className="mt-20 text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.02em] text-ink">Built for everyone</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PEOPLE.map((person) => (
          <div key={person.title} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-[17px] font-medium text-ink">{person.title}</h3>
            <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{person.body}</p>
          </div>
        ))}
      </div>
    </SectionPage>
  );
}
