import AsciiArt from "@/components/AsciiArt";
import Logo from "@/components/Logo";
import NextMonth from "@/components/NextMonth";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
import { ASCII_TREE } from "@/lib/ascii-tree";
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

        <nav aria-label="Main" className="reveal flex justify-center pt-7" style={step(0)}>
          <a href="#top" className="flex items-center gap-2.5">
            <Logo height={20} priority className="invert" />
            <span className="beta-glass">Beta</span>
          </a>
        </nav>

        <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-12 px-6 pb-16 pt-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 lg:pt-6">
          <div className="max-w-[640px]">
            <h1
              className="reveal font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[64px] lg:text-[80px]"
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

          {/* The full ASCII tree on the black page, with a stepped blue panel acting as a window onto
              it: inside the panel the same tree shows in lime. Sizes are in em of the character size,
              so the two layers stay aligned at every breakpoint. */}
          <div className="reveal justify-self-center text-[5.2px] sm:text-[7.4px] lg:text-[9px] lg:justify-self-end" style={step(4)}>
            <AsciiArt art={ASCII_TREE} className="ascii" wrapperClassName="ascii-stage">
              <div aria-hidden="true" className="ascii-bar" />
              <div className="ascii-panel">
                <pre data-ascii-mirror aria-hidden="true" className="ascii ascii-on-blue ascii-mirror">
                  {ASCII_TREE}
                </pre>
              </div>
            </AsciiArt>
          </div>
        </main>
      </div>
    </RevealFooter>
  );
}
