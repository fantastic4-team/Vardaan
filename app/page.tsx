import Link from "next/link";
import Faq from "@/components/landing/Faq";
import Features from "@/components/landing/Features";
import HeroPhone from "@/components/landing/HeroPhone";
import Pricing from "@/components/landing/Pricing";
import SiteFooter from "@/components/landing/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { site } from "@/lib/site";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/images/logo.png` },
    { "@type": "WebSite", name: site.name, url: site.url, description: site.description },
  ],
};

const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function Home() {
  return (
    <>
      <div id="top" className="relative overflow-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <SiteNav />

        {/* Centred hero: the headline and actions, then a live call on a phone in the middle, over a
            soft glow with rings radiating out like a call signal. */}
        <main className="relative px-5 pt-14 text-center sm:pt-20 lg:pt-24">
          <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2">
            {[520, 760, 1000].map((size, k) => (
              <span
                key={size}
                className="hero-ring absolute left-1/2 top-1/2 rounded-full border border-[#8ccbff]/[0.14]"
                style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, animationDelay: `${k * 1.3}s` }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-[920px]">
            <a
              href="#join"
              className="group reveal mb-6 inline-flex items-center gap-3 text-[13px] text-ink/80 transition hover:text-ink"
              style={step(1)}
            >
              <span className="new-glow">New</span>
              Private beta is now open
            </a>
            <h1
              className="reveal text-[clamp(38px,8vw,80px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink"
              style={step(1)}
            >
              The AI agent you can call for anything.
            </h1>

            <p
              className="reveal mx-auto mt-6 max-w-[600px] text-[15px] leading-[24px] text-ink/75 sm:text-[17px] sm:leading-[28px]"
              style={step(2)}
            >
              Call, say what you need in your own language, and it gets done, quietly in the background or
              live with you on the line. No apps, no screens, no typing.
            </p>

            <div className="reveal mt-8" style={step(3)}>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="waitlist-button flex h-12 items-center justify-center rounded-[12px] px-7 text-[15px] font-medium tracking-[-0.01em]"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-[12px] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_100%)] px-7 text-[15px] font-medium tracking-[-0.01em] text-ink/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/25 hover:text-ink"
                >
                  Log in
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-ink/45">Free during the private beta. Works on any phone.</p>
            </div>
          </div>

          <figure className="reveal relative mx-auto mt-12 h-[560px] max-w-[980px] sm:mt-16 sm:h-[620px]" style={step(4)}>
            <HeroPhone />
            <figcaption className="sr-only">A call with Vardaan: you ask for a reminder and it sets one.</figcaption>
          </figure>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(20,19,18,0)_0%,#141312_100%)]" />
        </main>
      </div>

      <Features />
      <Pricing />
      <Faq />
      <SiteFooter />
    </>
  );
}
