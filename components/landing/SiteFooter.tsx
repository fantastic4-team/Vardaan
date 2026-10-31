import Link from "next/link";
import GardenScene from "@/components/GardenScene";
import InView from "@/components/landing/InView";
import { GUTTER } from "@/components/landing/SectionHeading";
import WaitlistForm from "@/components/WaitlistForm";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/use-cases", label: "Use cases" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/team", label: "Team" },
      { href: "https://github.com/fantastic4-team/Vardaan", label: "GitHub" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Sign up" },
      { href: "/login", label: "Log in" },
      { href: "/app", label: "Dashboard" },
    ],
  },
];

// Closing call to action and the site footer for the landing page.
export default function SiteFooter() {
  return (
    <>
      <section className="nav-grid relative overflow-hidden border-t">
        <div aria-hidden="true" className="absolute inset-0">
          <GardenScene scene="poppies" className="absolute inset-0 h-full w-full" />
          <div className="poster-grain absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,19,18,0.94)_0%,rgba(20,19,18,0.8)_42%,rgba(20,19,18,0.2)_80%,rgba(20,19,18,0)_100%)]" />
        </div>
        <InView className={`relative ${GUTTER} py-24 lg:py-32`}>
          <h2 className="max-w-[640px] text-[clamp(34px,4.6vw,60px)] font-medium leading-[1.02] tracking-[-0.03em] text-ink">
            Pick up the phone. Vardaan does the rest.
          </h2>
          <p className="mt-5 max-w-[460px] text-[16px] leading-[26px] text-ink/70">Free during the private beta. Set up in minutes.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="waitlist-button flex h-11 items-center rounded-[10px] px-6 text-[14px] font-semibold">
              Create free account
            </Link>
            <Link
              href="/how-it-works"
              className="flex h-11 items-center rounded-[10px] border border-white/15 bg-white/[0.04] px-5 text-[14px] font-medium text-ink transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              See how it works
            </Link>
          </div>
        </InView>
      </section>

      <footer className="nav-grid border-t bg-[#0e0d0c]">
        <div className={`${GUTTER} pb-10 pt-16 lg:pt-20`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
            <div className="max-w-[400px]">
              <div className="flex items-center gap-3">
                <span className="font-poster text-[28px] font-semibold uppercase leading-none tracking-[0.02em] text-ink">Vardaan</span>
                <span className="beta-glass">Beta</span>
              </div>
              <p className="mt-4 text-[14px] leading-[22px] text-ink/55">The AI agent you can call for anything. Updates on the beta, straight to your inbox.</p>
              <div id="join" className="mt-6 scroll-mt-24">
                <WaitlistForm id="footer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="text-[12px] uppercase tracking-[0.14em] text-ink/40">{col.title}</p>
                  <ul className="mt-5 space-y-3 text-[14px]">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        {l.href.startsWith("http") ? (
                          <a href={l.href} target="_blank" rel="noreferrer" className="text-ink/70 transition hover:text-ink">
                            {l.label}
                          </a>
                        ) : (
                          <Link href={l.href} className="text-ink/70 transition hover:text-ink">
                            {l.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <p
            aria-hidden="true"
            className="footer-wordmark font-poster mt-16 select-none overflow-hidden text-center text-[clamp(36px,12.5vw,280px)] lg:text-[clamp(64px,15.5vw,280px)] font-semibold uppercase leading-[0.86] tracking-[-0.02em]"
          >
            Vardaan
          </p>

          <div className="nav-grid mt-10 flex flex-col gap-3 border-t pt-6 text-[13px] text-ink/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Vardaan. Made in India by Fantastic 4.</p>
            <a href="#top" className="transition hover:text-ink">
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
