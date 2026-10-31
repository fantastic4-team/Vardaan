import Link from "next/link";
import PosterArt from "@/components/PosterArt";
import Faq from "@/components/landing/Faq";
import Features from "@/components/landing/Features";
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
      <div id="top" className="relative flex min-h-svh flex-col overflow-hidden lg:h-svh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <SiteNav />

        {/* Split screen: the letter on the left, the full poster on the right. */}
        <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-2 lg:grid-rows-1">
          <div className="flex min-h-0 min-w-0 flex-col justify-between gap-6 px-[max(1.5rem,calc(6vw+1.75rem))] py-7 lg:py-[clamp(28px,7vh,72px)] lg:pr-12">
            <div className="lg:pt-[clamp(8px,4vh,40px)]">
              <a
                href="#join"
                className="group reveal mb-5 inline-flex items-center gap-3 text-[13px] text-ink/80 transition hover:text-ink lg:mb-7"
                style={step(1)}
              >
                <span className="new-glow">New</span>
                Private beta is now open
              </a>
              <h1
                className="reveal text-[clamp(34px,5.4vh,46px)] font-medium leading-[1.02] tracking-[-0.03em] text-ink sm:text-[clamp(46px,7.4vh,66px)] lg:text-[clamp(50px,8.4vh,76px)]"
                style={step(1)}
              >
                The AI agent you can call for anything.
              </h1>

              <p
                className="reveal mt-4 max-w-[460px] text-[14px] leading-[21px] text-ink/75 sm:text-[15px] sm:leading-[22px] lg:mt-[clamp(20px,5vh,56px)] lg:text-[17px] lg:leading-[28px]"
                style={step(2)}
              >
                Vardaan is a voice-first AI agent. Call, say what you need in your own language, and it gets
                done, quietly in the background or live with you on the line. No apps, no screens, no typing.
              </p>
            </div>

            <div className="reveal max-w-[440px] 2xl:max-w-[480px]" style={step(3)}>
              <div className="flex flex-wrap items-center gap-3">
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

          {/* The poster art fills the whole right panel: the full composition sits in the middle and
              the scene continues out to the panel's edges. */}
          <figure className="poster-art-in nav-grid relative min-h-[120px] overflow-hidden lg:min-h-0 border-t lg:h-auto lg:border-l lg:border-t-0">
            <PosterArt className="absolute inset-0 h-full w-full" />
            <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
            <figcaption className="sr-only">Vardaan Beta</figcaption>
          </figure>
        </main>
      </div>

      <Features />
      <Pricing />
      <Faq />
      <SiteFooter />
    </>
  );
}
