import FlowLines from "@/components/FlowLines";
import CurrentMonth from "@/components/CurrentMonth";
import Logo from "@/components/Logo";
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

export default function Home() {
  return (
    <RevealFooter>
      <div id="top" className="relative flex min-h-svh items-center justify-center overflow-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <FlowLines />

        <main className="relative z-10 w-full max-w-[360px] px-5 py-24 sm:px-0">
          <h1 className="reveal flex items-center gap-2.5" style={{ "--i": 0 } as React.CSSProperties}>
            <Logo height={26} priority />
            <span className="beta-glass">Beta</span>
            <span className="sr-only"> &mdash; the AI agent you can call for anything</span>
          </h1>

          <p className="reveal mt-8" style={{ "--i": 1 } as React.CSSProperties}>
            Dear friend,
          </p>
          <p className="reveal mt-[22px] text-mute" style={{ "--i": 2 } as React.CSSProperties}>
            Most everyday tasks still ask for an app, a screen and your patience. We think they should only take a
            phone call.
          </p>
          <p className="reveal mt-[22px] text-mute" style={{ "--i": 3 } as React.CSSProperties}>
            Vardaan is an AI agent you can call for anything. Tell it what you need, in Hindi, English or Hinglish.
            Hang up and it quietly finishes the work, or stay on the line and think it through together.
          </p>
          <p className="reveal mt-[22px] text-mute" style={{ "--i": 4 } as React.CSSProperties}>
            We&apos;re letting people in slowly. Beta spots open for{" "}
            <a href="#join" className="text-ink underline underline-offset-2">
              <CurrentMonth />
            </a>
            .
          </p>

          <div id="join" className="reveal mt-8 scroll-mt-32" style={{ "--i": 5 } as React.CSSProperties}>
            <WaitlistForm id="hero" />
          </div>
        </main>
      </div>
    </RevealFooter>
  );
}
