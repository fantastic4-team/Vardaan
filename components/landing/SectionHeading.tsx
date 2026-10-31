import InView from "@/components/landing/InView";

// Page gutter shared by every landing section, matching the hero and navbar.
export const GUTTER = "px-[max(1.5rem,calc(6vw+1.75rem))]";

// Section header: eyebrow and headline on the left, the intro beside it on wide screens.
export default function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <InView className="nav-grid grid gap-6 border-b pb-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16 lg:pb-12">
      <div>
        <p className="text-[12px] uppercase tracking-[0.18em] text-ink/55">{eyebrow}</p>
        <h2 id={id} className="mt-5 max-w-[620px] text-balance text-[clamp(34px,4.4vw,58px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink">
          {title}
        </h2>
      </div>
      {intro && <p className="max-w-[460px] text-[16px] leading-[26px] text-ink/60 lg:justify-self-end lg:text-[17px] lg:leading-[28px]">{intro}</p>}
    </InView>
  );
}
