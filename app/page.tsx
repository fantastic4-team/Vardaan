import Logo from "@/components/Logo";
import PixelTree from "@/components/PixelTree";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
import { site } from "@/lib/site";

const PERKS = [
  {
    title: "First in line",
    body: "Early-access members get into the Vardaan beta before public launch, in small, considered cohorts.",
  },
  {
    title: "Shape the product",
    body: "A direct line to the team. Your feedback decides what we build next — not a roadmap written in a vacuum.",
  },
  {
    title: "Founding pricing",
    body: "Everyone who joins during beta keeps founding-member pricing, locked in for as long as you stay.",
  },
];

const AVATARS = ["#334932", "#87A454", "#ACBE62", "#0b0b0b"];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/icon.svg` },
    { "@type": "WebSite", name: site.name, url: site.url, description: site.description },
  ],
};

export default function Home() {
  return (
    <RevealFooter>
      <div id="top" className="flex min-h-screen flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <Logo className="text-[26px]" />
            <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black/60">
              Beta
            </span>
          </a>
          <a
            href="#join"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-ink transition hover:border-black/25"
          >
            Join waitlist
          </a>
        </header>

        <main className="flex-1">
          <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/[0.02] py-1 pl-1.5 pr-3 text-xs text-black/70">
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  New
                </span>
                Vardaan Beta — early access is open
              </div>

              <h1 className="mt-6 text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[56px]">
                Grow something
                <br />
                worth keeping.
              </h1>

              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-black/60">
                Vardaan is in private beta. Join the waitlist to get early access, help shape the product, and
                lock in founding-member pricing.
              </p>

              <div id="join" className="mt-8 scroll-mt-24">
                <WaitlistForm id="hero" />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {AVATARS.map((c) => (
                    <span key={c} className="h-7 w-7 rounded-full border-2 border-white" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-sm text-black/55">
                  Joined by early adopters from teams around the world
                </p>
              </div>
            </div>

            <div className="fade-up [animation-delay:120ms]">
              <div className="flex aspect-[13/9] w-full items-center justify-center overflow-hidden rounded-xl border border-black/6 bg-white">
                <div className="scale-150 sm:scale-[1.75]">
                  <PixelTree />
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-black/40">Press and hold the tree</p>
            </div>
          </section>

          <section className="border-t border-black/6">
            <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/45">Early access</p>
              <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
                Why join the beta now
              </h2>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {PERKS.map((perk, i) => (
                  <div key={perk.title} className="rounded-xl border border-black/6 p-6">
                    <span className="font-logo text-lg font-extrabold text-black/25">0{i + 1}</span>
                    <h3 className="mt-6 text-lg font-bold text-ink">{perk.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-black/55">{perk.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-black/6">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8">
              <Logo className="text-5xl sm:text-7xl" />
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-black/60">
                Spots in each beta cohort are limited. Get on the list and we&apos;ll let you in as soon as there&apos;s
                room.
              </p>
              <div className="mt-8 flex w-full justify-center">
                <WaitlistForm id="footer" />
              </div>
            </div>
          </section>
        </main>
      </div>
    </RevealFooter>
  );
}
