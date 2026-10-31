"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const NAV_LINKS = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
  { href: "/team", label: "Team" },
];

// Dotted-grid navbar: brand cell on the left, section links boxed in the middle, and a solid
// Sign up button on the right. On phones the links move into a menu opened from the right.
export default function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

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

        <div className="my-auto ml-auto mr-[max(1rem,6vw)] flex items-center gap-2 sm:gap-3 lg:ml-0">
          <Link
            href="/login"
            className="hidden items-center px-2 py-1 text-[13px] font-medium text-ink/75 transition hover:text-ink sm:inline-flex 2xl:text-[14px]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="waitlist-button flex h-7 items-center whitespace-nowrap rounded-[7px] px-3 text-[12px] leading-none sm:h-[30px] sm:px-4 sm:text-[13px] 2xl:h-[34px] 2xl:px-5 2xl:text-[14px]"
          >
            Sign up
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-white/[0.12] text-ink/80 transition hover:text-ink lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden className="h-[18px] w-[18px]">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="nav-grid absolute inset-x-0 top-full border-b bg-page px-[max(1rem,6vw)] pb-5 pt-2 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.8)] lg:hidden">
          <div className="flex flex-col">
            {links("nav-grid relative border-b py-3.5 text-[15px]")}
            <Link href="/login" className="py-3.5 text-[15px] text-ink/75 transition hover:text-ink">
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
