import CurrentMonth from "@/components/CurrentMonth";
import Logo from "@/components/Logo";
import PixelPlant from "@/components/PixelPlant";
import RevealFooter from "@/components/RevealFooter";
import WaitlistForm from "@/components/WaitlistForm";
import { site } from "@/lib/site";

// Each kind of tree, its image's height/width ratio and the colours of what falls from it.
const KINDS = {
  oak: { src: "/images/tree.png", ratio: 672 / 604, colors: ["#334932", "#4B6239", "#87A454", "#ACBE62"] },
  pine: { src: "/images/trees/pine.png", ratio: 52 / 46, colors: ["#2c4a33", "#3d6340", "#567f50"] },
  autumn: { src: "/images/trees/autumn.png", ratio: 52 / 46, colors: ["#a8482a", "#c8642f", "#de8a3a", "#efb04d"] },
  blossom: { src: "/images/trees/blossom.png", ratio: 52 / 46, colors: ["#e3a1b3", "#f0c1cd", "#fadde4", "#fff3f6"] },
  birch: { src: "/images/trees/birch.png", ratio: 52 / 46, colors: ["#6f9440", "#93b752", "#b6d16c", "#d3e48f"] },
  cypress: { src: "/images/trees/cypress.png", ratio: 52 / 46, colors: ["#2a4731", "#3a5f3f", "#527a4f"] },
};

// Trees scattered around the letter. Higher on the page reads as farther away, so those are
// smaller and lighter. Positions keep clear of the 360px text column in the middle.
const TREES: { kind: keyof typeof KINDS; className: string; width: number; opacity: number; delay: number }[] = [
  { kind: "oak", className: "left-[5%] top-[58%] hidden md:block", width: 150, opacity: 1, delay: 160 },
  { kind: "pine", className: "left-[15%] top-[22%] hidden lg:block", width: 78, opacity: 0.85, delay: 240 },
  { kind: "blossom", className: "left-[22%] top-[74%] hidden lg:block", width: 84, opacity: 0.95, delay: 320 },
  { kind: "autumn", className: "right-[6%] top-[50%] hidden md:block", width: 132, opacity: 1, delay: 200 },
  { kind: "cypress", className: "right-[17%] top-[14%] hidden lg:block", width: 70, opacity: 0.8, delay: 280 },
  { kind: "birch", className: "right-[23%] top-[70%] hidden lg:block", width: 88, opacity: 0.95, delay: 360 },
  // Phones: a small pair at the foot of the page.
  { kind: "oak", className: "bottom-14 left-[8%] md:hidden", width: 72, opacity: 1, delay: 200 },
  { kind: "blossom", className: "bottom-16 right-[10%] md:hidden", width: 62, opacity: 0.95, delay: 280 },
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
          const kind = KINDS[tree.kind];
          const height = Math.round(tree.width * kind.ratio);
          return (
            <div
              key={i}
              className={`fade-up absolute ${tree.className}`}
              style={{ opacity: tree.opacity, animationDelay: `${tree.delay}ms` }}
            >
              <PixelPlant
                src={kind.src}
                alt=""
                label="Shake the tree"
                width={tree.width}
                height={height}
                colors={kind.colors}
                spawnX={[15, 80]}
                spawnY={[height * 0.1, height * 0.55]}
                pieceSize={Math.max(2, Math.round(tree.width / 50))}
              />
            </div>
          );
        })}

        <main className="fade-up relative z-10 w-full max-w-[360px] px-5 py-24 sm:px-0">
          <h1 className="flex items-center gap-2.5">
            <Logo height={26} priority />
            <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-mute">
              Beta
            </span>
            <span className="sr-only"> &mdash; the AI agent you can call for anything</span>
          </h1>

          <p className="mt-8">Dear friend,</p>
          <p className="mt-[22px] text-mute">
            Vardaan is an AI agent you can call for anything. Say what you need in Hindi, English or Hinglish, and
            it gets done. No apps, no screens, no typing.
          </p>
          <p className="mt-[22px] text-mute">
            <span className="text-ink">Call &amp; Cut.</span> Hang up, and Vardaan finishes the task in the
            background, then reports back by call, SMS or WhatsApp.
          </p>
          <p className="mt-[22px] text-mute">
            <span className="text-ink">Talk &amp; Help.</span> Stay on the line for live help with a decision, a
            document or a reply.
          </p>
          <p className="mt-[22px] text-mute">
            Beta spots open for{" "}
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
