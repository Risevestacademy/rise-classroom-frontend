"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type LegalSection = { id: string; title: string };

/* How far below the top of the screen a section's heading has to pass before
   it counts as the one being read. Clears the nav with some room to spare. */
const activeLine = 140;

/* The sticky contents list beside a legal page. It highlights the section
   being read and jumps to a section on click (Lenis smooths the jump). */
export function LegalContents({ sections }: { sections: LegalSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = sections[0]?.id;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= activeLine) {
          current = section.id;
        }
      }
      /* At the very bottom the last sections can't scroll up to the line, so
         the last one wins once there's nothing left to scroll. */
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = sections[sections.length - 1]?.id;
      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav aria-label="On this page">
      <ul className="flex flex-col">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id} className="border-t border-neutral-200">
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block px-3 py-3.5 font-work text-[14px] leading-5 tracking-[-0.01em] transition-colors hover:text-text-primary",
                  active ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
