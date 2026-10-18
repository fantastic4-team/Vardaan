"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
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
          {active && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px bg-ink/70" />}
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
          <Logo height={22} priority className="invert" />
          <span className="beta-glass">Beta</span>
        </Link>

        <div className="mx-auto hidden items-stretch md:flex">
          {links("nav-grid relative flex items-center border-r px-5 text-[14px] first:border-l lg:px-6")}
        </div>

        <Link
          href="/#join"
          className="waitlist-button ml-auto mr-[max(1rem,6vw)] flex items-center whitespace-nowrap px-4 text-[13px] md:ml-0 sm:px-7 sm:text-[14px]"
        >
          Join waitlist
        </Link>
      </nav>

      <div className="nav-grid flex overflow-x-auto border-b [scrollbar-width:none] md:hidden">
        {links("nav-grid relative flex shrink-0 items-center border-r px-4 py-2.5 text-[13px]")}
      </div>
    </header>
  );
}
