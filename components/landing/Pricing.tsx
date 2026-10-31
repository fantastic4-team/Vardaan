import Link from "next/link";
import PlanArt from "@/components/landing/PlanArt";
import InView from "@/components/landing/InView";
import SectionHeading, { GUTTER } from "@/components/landing/SectionHeading";
import { PLANS } from "@/lib/landing";

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className={`nav-grid scroll-mt-6 border-t ${GUTTER} py-24 lg:py-32`}>
      <SectionHeading
        id="pricing-title"
        eyebrow="Pricing"
        title="Free while we're in beta."
        intro="Use everything Vardaan does today at no cost. Paid plans arrive after the beta, and you'll hear from us well before anything changes."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <InView key={p.name} i={i} className="h-full">
            {/* The available plan gets a light-blue border and glow; the others a plain one. */}
            <article
              className={`relative h-full rounded-[22px] border ${
                p.highlight ? "border-[#8ccbff]/35 shadow-[0_0_0_1px_rgba(140,203,255,0.06),0_30px_70px_-35px_rgba(140,203,255,0.5)]" : "border-white/10"
              }`}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-[21px] bg-[#171615]">
                <div aria-hidden="true" className="relative h-36 overflow-hidden">
                  <PlanArt kind={p.art} className="absolute inset-0 h-full w-full" />
                  <div className="poster-grain absolute inset-0" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,22,21,0)_0%,rgba(23,22,21,0)_55%,#171615_100%)]" />
                </div>

                <div className="relative -mt-3 flex flex-1 flex-col px-7 pb-8 lg:px-8">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[20px] font-medium tracking-[-0.01em] text-ink">{p.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                        p.highlight ? "border-[#8ccbff]/30 bg-[#8ccbff]/15 text-[#b9e0ff]" : "border-white/10 bg-black/30 text-ink/60"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-6 flex items-end gap-3">
                    <p className="flex items-start leading-none">
                      <span className="mr-1 mt-[9px] text-[22px] font-medium text-ink/55">₹</span>
                      <span className="text-[60px] font-medium leading-none tracking-[-0.03em] text-ink tabular-nums">{p.price}</span>
                    </p>
                    <span className="mb-1 text-[13px] leading-[17px] text-ink/50">{p.period}</span>
                  </div>
                  <p className="mt-4 min-h-[44px] text-[14px] leading-[22px] text-ink/60">{p.blurb}</p>

                  <Link
                    href={p.cta.href}
                    className={`mt-6 flex h-11 items-center justify-center rounded-[12px] text-[14px] font-medium transition ${
                      p.highlight
                        ? "waitlist-button"
                        : "border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_100%)] text-ink/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/25 hover:text-ink"
                    }`}
                  >
                    {p.cta.label}
                  </Link>

                  <p className="mt-8 text-[12px] uppercase tracking-[0.14em] text-ink/40">What's included</p>
                  <ul className="mt-4 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[14px] leading-[21px] text-ink/75">
                        <span
                          className={`mt-[2px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full ${
                            p.highlight ? "bg-[#8ccbff]/15 text-[#8ccbff]" : "bg-white/[0.06] text-ink/50"
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[11px] w-[11px]">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </InView>
        ))}
      </div>

      <p className="mt-6 text-[13px] text-ink/45">Prices in Indian rupees. Paid plans are not available yet.</p>
    </section>
  );
}
