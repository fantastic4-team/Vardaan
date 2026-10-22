"use client";

import { useEffect, useState } from "react";

// "On this page" menu that highlights the section currently being read.
export default function DocsToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => Boolean(el));

    // The active section is the last heading that has scrolled past a line 30% down the screen.
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = sections[0]?.id;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
      }
      // At the very bottom, the last section wins even if its heading never reaches the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1]?.id;
      }
      if (current) setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-8 lg:self-start">
      <p className="text-[12px] uppercase tracking-[0.16em] text-mute">On this page</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] lg:block lg:space-y-1 lg:border-l lg:border-white/10">
        {items.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                onClick={() => setActive(t.id)}
                aria-current={on ? "location" : undefined}
                className={`relative block transition lg:-ml-px lg:border-l lg:py-1 lg:pl-4 ${
                  on ? "text-ink lg:border-[#8ccbff]" : "text-ink/55 hover:text-ink lg:border-transparent"
                }`}
              >
                {t.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
