import CurrentMonth from "@/components/CurrentMonth";
import Logo from "@/components/Logo";
import PixelPlant from "@/components/PixelPlant";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
import { site } from "@/lib/site";

const LEAF_COLORS = ["#334932", "#4B6239", "#87A454", "#ACBE62"];
// tree.png is 604x672; keep that ratio at every size.
const TREE_RATIO = 672 / 604;

// Trees scattered around the letter. Higher on the page reads as farther away, so those are
// smaller and lighter. Positions keep clear of the 360px text column in the middle.
const TREES = [
  { className: "left-[5%] top-[58%] hidden md:block", width: 150, opacity: 1, delay: 160 },
  { className: "left-[15%] top-[24%] hidden lg:block", width: 76, opacity: 0.8, delay: 240 },
  { className: "left-[22%] top-[76%] hidden lg:block", width: 64, opacity: 0.9, delay: 320 },
  { className: "right-[6%] top-[50%] hidden md:block", width: 128, opacity: 1, delay: 200 },
  { className: "right-[17%] top-[18%] hidden lg:block", width: 64, opacity: 0.75, delay: 280 },
  { className: "right-[23%] top-[74%] hidden lg:block", width: 92, opacity: 0.95, delay: 360 },
  // Phones: a small pair at the foot of the page.
  { className: "bottom-14 left-[8%] md:hidden", width: 72, opacity: 1, delay: 200 },
  { className: "bottom-20 right-[10%] md:hidden", width: 54, opacity: 0.85, delay: 280 },
];

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

        {TREES.map((tree, i) => {
          const height = Math.round(tree.width * TREE_RATIO);
          return (
            <div
              key={i}
              className={`fade-up absolute ${tree.className}`}
              style={{ opacity: tree.opacity, animationDelay: `${tree.delay}ms` }}
            >
              <PixelPlant
                src="/images/tree.png"
                alt=""
                label="Shake the tree"
                width={tree.width}
                height={height}
                colors={LEAF_COLORS}
                spawnX={[15, 80]}
                spawnY={[height * 0.1, height * 0.55]}
                pieceSize={Math.max(2, Math.round(tree.width / 50))}
              />
            </div>
          );
        })}

        <main className="fade-up relative z-10 w-full max-w-[360px] px-5 py-24 sm:px-0">
          <h1 className="flex items-center gap-2.5">
            <Logo className="text-[34px]" />
            <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-mute">
              Beta
            </span>
          </h1>

          <p className="mt-8">Dear friend,</p>
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

          <p className="mt-4 pl-3 text-[13px] text-mute">Press and hold any tree.</p>
        </main>
      </div>
    </RevealFooter>
  );
}
