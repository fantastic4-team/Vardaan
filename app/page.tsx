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
      <div id="top" className="relative flex min-h-svh flex-col overflow-hidden lg:h-svh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        {/* Navbar: a dotted grid across the full width. The brand sits in its own cell on the left and
            Join waitlist is a solid block flush to the top right. */}
        <header className="reveal relative z-10" style={step(0)}>
          <nav aria-label="Main" className="nav-grid flex items-stretch border-b">
            <a
              href="#top"
              className="nav-grid ml-[max(1rem,6vw)] flex items-center gap-3 border-x px-4 py-3.5 sm:px-7"
              aria-label="Vardaan Beta home"
            >
              <Logo height={22} priority className="invert" />
              <span className="beta-glass">Beta</span>
            </a>
            <a
              href="#join"
              className="waitlist-button ml-auto mr-[max(1rem,6vw)] flex items-center whitespace-nowrap px-4 text-[13px] sm:px-7 sm:text-[14px]"
            >
              Join waitlist
            </a>
          </nav>
        </header>

        {/* Split screen: the letter on the left, the poster filling the right half. */}
        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <div className="flex min-h-0 min-w-0 flex-col justify-between gap-6 px-[max(1.5rem,calc(6vw+1.75rem))] py-7 lg:py-[clamp(28px,7vh,72px)] lg:pr-12">
            <div>
              <h1
                className="reveal font-display text-[clamp(32px,5vh,44px)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[clamp(44px,7vh,64px)] lg:text-[clamp(48px,8vh,72px)]"
                style={step(1)}
              >
                The AI agent you can call for anything.
              </h1>

              <p
                className="reveal mt-4 max-w-[460px] text-[14px] leading-[21px] text-ink/75 sm:text-[15px] sm:leading-[22px] lg:mt-[clamp(20px,5vh,56px)] lg:text-[17px] lg:leading-[28px]"
                style={step(2)}
              >
                Vardaan is a voice-first AI agent. Call, say what you need in Hindi, English or Hinglish, and it gets
                done &mdash; quietly in the background, or live with you on the line. No apps, no screens, no typing.
              </p>
            </div>

            <div id="join" className="reveal max-w-[440px] scroll-mt-24" style={step(3)}>
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

          {/* The poster fills the whole right half: soft-focus botanical art, grain, and the wordmark
              set into the petals. */}
          <figure className="poster-art-in nav-grid @container relative min-h-[34svh] overflow-hidden border-t lg:min-h-0 lg:border-l lg:border-t-0">
            <PosterArt className="absolute inset-0 h-full w-full" />
            <div aria-hidden="true" className="poster-grain pointer-events-none absolute inset-0" />
            <p
              aria-hidden="true"
              className="poster-wordmark poster-wordmark-in absolute inset-x-0 top-[64%] text-center text-[min(17cqw,180px)]"
            >
              vardaan
            </p>
            <figcaption className="absolute inset-x-0 bottom-6 flex justify-center">
              <Logo height={12} className="invert opacity-90" />
              <span className="sr-only">Vardaan Beta</span>
            </figcaption>
          </figure>
        </main>
      </div>
    </RevealFooter>
  );
}
