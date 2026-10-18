"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
  { href: "/team", label: "Team" },
];

// Dotted-grid navbar: brand cell on the left, section links boxed in the middle, and a solid
// Join waitlist block on the right. On phones the links move to a scrollable row underneath.
export default function SiteNav() {
  const pathname = usePathname();

  const links = (className: string) =>
    NAV_LINKS.map(({ href, label }) => {
      const active = pathname === href;
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`${className} transition ${active ? "text-ink" : "text-ink/60 hover:text-ink"}`}
        >
          {label}
          {active && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-px bg-ink/70 lg:inset-x-4" />}
        </Link>
      );
    });

  return (
    <header className="relative z-10">
      <nav aria-label="Main" className="nav-grid flex items-stretch border-b">
        <Link
          href="/"
          className="nav-grid ml-[max(1rem,6vw)] flex items-center gap-3 border-x px-4 py-3.5 sm:px-7"
          aria-label="Vardaan Beta home"
        >
          <span className="font-poster text-[19px] font-semibold uppercase leading-none tracking-[0.02em] text-ink sm:text-[21px] 2xl:text-[24px]">Vardaan</span>
          <span className="beta-glass">Beta</span>
        </Link>

        <div className="mx-auto hidden items-stretch lg:flex">
          {links("nav-grid relative flex items-center whitespace-nowrap border-r px-5 text-[14px] first:border-l xl:px-6 2xl:px-8 2xl:text-[15px]")}
        </div>

        <Link
          href="/#join"
          className="waitlist-button my-auto ml-auto mr-[max(1rem,6vw)] flex h-8 items-center whitespace-nowrap rounded-[8px] px-3 text-[12px] lg:ml-0 sm:h-[34px] sm:px-4 sm:text-[13px] 2xl:h-10 2xl:px-5 2xl:text-[14px]"
        >
          Join waitlist
        </Link>
      </nav>

      <div className="nav-grid flex border-b lg:hidden">
        {links("nav-grid relative flex flex-1 items-center justify-center whitespace-nowrap border-r px-1.5 py-2.5 text-[12px] last:border-r-0 sm:text-[13px]")}
      </div>
    </header>
  );
}
