import Link from "next/link";
import InView from "@/components/landing/InView";
import { GUTTER } from "@/components/landing/SectionHeading";
import { FAQS } from "@/lib/landing";

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`nav-grid scroll-mt-6 border-t ${GUTTER} py-24 lg:py-32`}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <InView className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-[12px] uppercase tracking-[0.18em] text-ink/55">FAQ</p>
          <h2 id="faq-title" className="mt-4 text-[clamp(32px,4.2vw,54px)] font-medium leading-[1.04] tracking-[-0.03em] text-ink">
            Questions, answered.
          </h2>
          <p className="mt-5 max-w-[400px] text-[16px] leading-[26px] text-ink/65">
            Everything you need to know about Vardaan and the private beta. Want the technical details?{" "}
            <Link href="/docs" className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-white/70">
              Read the docs
            </Link>
            .
          </p>
        </InView>

        <InView i={1} className="nav-grid border-t">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="faq-item nav-grid group border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] text-ink lg:text-[18px]">
                {q}
                <span aria-hidden="true" className="text-[22px] leading-none text-ink/50 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[620px] pb-7 text-[15px] leading-[25px] text-ink/65">{a}</p>
            </details>
          ))}
        </InView>
      </div>
    </section>
  );
}
