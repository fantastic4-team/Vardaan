import Logo from "@/components/Logo";
import NextMonth from "@/components/NextMonth";
import PosterArt from "@/components/PosterArt";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
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
    <RevealFooter>
      <div id="top" className="relative flex min-h-svh flex-col overflow-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        {/* Navbar: a thin maroon bar on top, then a dotted grid with the brand boxed in its own cell. */}
        <header className="reveal relative z-10" style={step(0)}>
          <div aria-hidden="true" className="h-1.5 bg-[#5a2620]" />
          <nav aria-label="Main" className="nav-grid border-b">
            <div className="mx-auto flex w-full max-w-[1200px] items-stretch px-6 sm:px-10">
              <a href="#top" className="nav-grid flex items-center border-x px-6 py-5 sm:px-10 sm:py-6" aria-label="Vardaan home">
                <Logo height={24} priority className="invert" />
              </a>
              <div className="nav-grid flex items-center border-r px-5">
                <span className="beta-glass">Beta</span>
              </div>
              <div className="nav-grid ml-auto hidden items-center border-x px-6 sm:flex">
                <a href="#join" className="text-[13px] text-ink/75 transition hover:text-ink">
                  Join waitlist
                </a>
              </div>
            </div>
          </nav>
        </header>

        <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-12 px-6 pb-16 pt-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 lg:pt-10">
          <div className="max-w-[600px]">
            <h1
              className="reveal font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[64px] lg:text-[76px]"
              style={step(1)}
            >
              The AI agent you can call for anything.
            </h1>

            <p className="reveal mt-7 max-w-[440px] text-[15px] leading-[22px] text-ink/75" style={step(2)}>
              Vardaan is a voice-first AI agent. Call, say what you need in Hindi, English or Hinglish, and it gets
              done &mdash; quietly in the background, or live with you on the line. No apps, no screens, no typing.
            </p>

            <div id="join" className="reveal mt-10 max-w-[440px] scroll-mt-24" style={step(3)}>
              <WaitlistForm id="hero" />
              <p className="mt-3 text-[13px] text-mute">
                Beta spots open for{" "}
                <a href="#join" className="text-ink underline underline-offset-2">
                  <NextMonth />
                </a>
                .
              </p>
            </div>
          </div>

          {/* A portrait poster card: soft-focus botanical art, grain, and the wordmark set into the petals. */}
          <figure
            className="poster-card poster-art-in relative aspect-[3/4] w-[min(100%,340px)] justify-self-center overflow-hidden sm:w-[400px] lg:w-[440px] lg:justify-self-end"
            style={{ animationDelay: "250ms" }}
          >
            <PosterArt className="absolute inset-0 h-full w-full" />
            <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
            <p aria-hidden="true" className="poster-wordmark poster-wordmark-in absolute inset-x-0 top-[66%] text-center text-[60px] sm:text-[78px] lg:text-[86px]">
              vardaan
            </p>
            <figcaption className="absolute inset-x-0 bottom-5 flex justify-center">
              <Logo height={11} className="invert opacity-90" />
              <span className="sr-only">Vardaan Beta</span>
            </figcaption>
          </figure>
        </main>
      </div>
    </RevealFooter>
  );
}
