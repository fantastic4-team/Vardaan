import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Vardaan, the voice-first AI agent you can call for anything.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "What is Vardaan?",
    a: "Vardaan is a voice-first AI agent that acts on your behalf. You call it, explain what you need in your own words, and it either completes the task in the background or helps you live on the call.",
  },
  {
    q: "Which languages does it understand?",
    a: "Hindi, English and Hinglish, including the way people naturally mix them in conversation.",
  },
  {
    q: "Do I need a smartphone or an app?",
    a: "No. Vardaan works from any phone. There is nothing to install and nothing to type.",
  },
  {
    q: "How does Vardaan tell me a task is done?",
    a: "It reports back the way that suits you: a callback, an SMS or a WhatsApp message.",
  },
  {
    q: "Will it act without asking me?",
    a: "Not on anything that matters. When information is missing or a decision carries real consequences, Vardaan calls you back for approval instead of guessing.",
  },
  {
    q: "What is the difference between Call & Cut and Talk & Help?",
    a: "With Call & Cut you hang up and Vardaan finishes the task in the background. With Talk & Help you stay on the line for real-time support, like understanding a bill or drafting a reply together.",
  },
  {
    q: "When can I start using it?",
    a: "Vardaan is in private beta and new spots open every month. Join the waitlist and we'll invite you as soon as there is room.",
  },
];

export default function Faq() {
  return (
    <SectionPage
      eyebrow="FAQ"
      title="Questions, answered."
      intro="Everything you need to know about Vardaan and the private beta. Can't find what you're looking for? Join the waitlist and ask us directly."
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
