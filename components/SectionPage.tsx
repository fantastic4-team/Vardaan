import Link from "next/link";
import RevealFooter from "@/components/RevealFooter";
import SiteNav from "@/components/SiteNav";

const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

// Shared shell for the section pages: navbar, a short header, the content, and a closing call
// to join the waitlist.
export default function SectionPage({ eyebrow, title, intro, children }: Props) {
  return (
    <RevealFooter>
      <div id="top" className="min-h-svh">
        <SiteNav />

        <main className="px-[max(1.5rem,calc(6vw+1.75rem))] pb-24 pt-14 lg:pt-20">
          <p className="reveal text-[12px] uppercase tracking-[0.18em] text-mute" style={step(0)}>
            {eyebrow}
          </p>
          <h1
            className="reveal mt-4 max-w-[820px] text-[clamp(36px,5.4vw,64px)] font-medium leading-[1.02] tracking-[-0.03em] text-ink"
            style={step(1)}
          >
            {title}
          </h1>
          <p className="reveal mt-6 max-w-[560px] text-[16px] leading-[26px] text-ink/70 lg:text-[17px] lg:leading-[28px]" style={step(2)}>
            {intro}
          </p>

          <div className="reveal mt-14 lg:mt-20" style={step(3)}>
            {children}
          </div>

          <div className="nav-grid mt-20 flex flex-col items-start justify-between gap-6 border-t pt-10 sm:flex-row sm:items-center">
            <p className="max-w-[460px] text-[20px] leading-[28px] text-ink">
              Vardaan is in private beta. Join the waitlist to get early access.
            </p>
            <Link href="/#join" className="waitlist-button inline-flex h-11 items-center rounded-[10px] px-6 text-[14px]">
              Join waitlist
            </Link>
          </div>
        </main>
      </div>
    </RevealFooter>
  );
}

// A bordered grid of numbered cards, matching the dotted navbar.
export function CardGrid({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="nav-grid grid border-l border-t sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={item.title} className="nav-grid border-b border-r p-7 lg:p-9">
          <span className="text-[12px] tabular-nums text-mute">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="mt-8 text-[19px] font-medium leading-[26px] text-ink">{item.title}</h2>
          <p className="mt-3 text-[15px] leading-[24px] text-ink/65">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
