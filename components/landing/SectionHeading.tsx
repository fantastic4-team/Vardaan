import InView from "@/components/landing/InView";

// Page gutter shared by every landing section, matching the hero and navbar.
export const GUTTER = "px-[max(1.5rem,calc(6vw+1.75rem))]";

export default function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <InView className="max-w-[640px]">
      <p className="text-[12px] uppercase tracking-[0.18em] text-ink/55">{eyebrow}</p>
      <h2 id={id} className="mt-4 text-[clamp(32px,4.2vw,54px)] font-medium leading-[1.04] tracking-[-0.03em] text-ink">{title}</h2>
      {intro && <p className="mt-5 max-w-[520px] text-[16px] leading-[26px] text-ink/65 lg:text-[17px] lg:leading-[28px]">{intro}</p>}
    </InView>
  );
}
