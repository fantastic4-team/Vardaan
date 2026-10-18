import CurrentMonth from "@/components/CurrentMonth";
import Logo from "@/components/Logo";
import PixelPlant from "@/components/PixelPlant";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
import { site } from "@/lib/site";

// The flower is 40x60 art drawn at 5x, so every art pixel is a crisp 5px square.
const FLOWER_SCALE = 5;
const PETAL_COLORS = ["#f5cf4f", "#f9df6e", "#fcea98", "#e89a74", "#efb48c"];
const LEAF_COLORS = ["#334932", "#4B6239", "#87A454", "#ACBE62"];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/images/logo.png` },
    { "@type": "WebSite", name: site.name, url: site.url, description: site.description },
  ],
};

function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <figure className="shrink-0 snap-start">
      <div className="flex aspect-square w-[min(420px,calc(100vw-2.5rem))] items-center justify-center overflow-hidden rounded-[28px] bg-card">
        {children}
      </div>
      <figcaption className="mt-3 flex gap-1.5 px-1">
        <span>{title}</span>
        <span className="text-mute">{note}</span>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <RevealFooter>
      <div id="top" className="min-h-svh pb-28">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <nav
          aria-label="Main"
          className="fixed left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card/90 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur"
        >
          <a href="#top" className="flex h-9 items-center rounded-full bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <Logo className="text-[15px]" />
          </a>
          <a href="#join" className="flex h-9 items-center rounded-full px-4 text-mute transition hover:text-ink">
            Beta
          </a>
        </nav>

        <main>
          <section className="fade-up mx-auto w-full max-w-[360px] px-5 pt-[200px] sm:px-0 sm:pt-[225px]">
            <h1 className="sr-only">Vardaan — private beta</h1>
            <p>Dear friend,</p>
            <p className="mt-[22px] text-mute">
              Vardaan &mdash; Sanskrit for &ldquo;boon&rdquo; &mdash; is a small, quiet tool we&apos;re building for
              doing your best work, without the noise.
            </p>
            <p className="mt-[22px] text-mute">
              We&apos;re letting people in slowly. Beta spots open for{" "}
              <a href="#join" className="text-ink underline underline-offset-2">
                <CurrentMonth />
              </a>
              .
            </p>

            <div id="join" className="mt-8 scroll-mt-32">
              <WaitlistForm id="hero" />
            </div>
          </section>

          <section
            aria-label="Things to play with"
            className="fade-up mt-40 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [animation-delay:120ms] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ paddingInline: "max(1.25rem, calc((100vw - 360px) / 2))", scrollPaddingInline: "max(1.25rem, calc((100vw - 360px) / 2))" }}
          >
            <Card title="Flower" note="Press and hold">
              <PixelPlant
                src="/images/flower.png"
                alt="Pixel-art flower"
                label="Shake the flower"
                width={40 * FLOWER_SCALE}
                height={60 * FLOWER_SCALE}
                colors={PETAL_COLORS}
                spawnX={[12, 82]}
                spawnY={[1 * FLOWER_SCALE, 16 * FLOWER_SCALE]}
                pieceSize={FLOWER_SCALE}
                pixelated
              />
            </Card>
            <Card title="Tree" note="Press and hold">
              <PixelPlant
                src="/images/tree.png"
                alt="Pixel-art tree"
                label="Shake the tree"
                width={146}
                height={162}
                colors={LEAF_COLORS}
                spawnX={[15, 80]}
                spawnY={[20, 90]}
                pieceSize={3}
              />
            </Card>
          </section>
        </main>
      </div>
    </RevealFooter>
  );
}
