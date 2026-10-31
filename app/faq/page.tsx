import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import { FAQS } from "@/lib/landing";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Vardaan, the voice-first AI agent you can call for anything.",
  alternates: { canonical: "/faq" },
};


export default function Faq() {
  return (
    <SectionPage
      eyebrow="FAQ"
      title="Questions, answered."
      intro="Everything you need to know about Vardaan and the private beta. Can't find what you're looking for? Join the waitlist and ask us directly."
      scene="daisies"
    >
      <div className="nav-grid max-w-[880px] border-t">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="faq-item nav-grid group border-b">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[18px] text-ink">
              {q}
              <span
                aria-hidden="true"
                className="text-[22px] leading-none text-ink/50 transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-[680px] pb-7 text-[15px] leading-[25px] text-ink/65">{a}</p>
          </details>
        ))}
      </div>
    </SectionPage>
  );
}
