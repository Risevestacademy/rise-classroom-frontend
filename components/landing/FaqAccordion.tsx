"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type Faq = { question: string; answer: string };

/** One answer open at a time; the first starts open, as in the design. */
export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <ul
      data-reveal-group
      className="flex flex-col border-t border-border-default lg:max-w-[680px] lg:flex-1"
    >
      {items.map((faq, index) => {
        const isOpen = open === index;
        const buttonId = `${id}-question-${index}`;
        const panelId = `${id}-answer-${index}`;

        return (
          <li
            key={faq.question}
            data-reveal-item
            className="border-b border-border-default"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="group flex w-full items-center gap-5 py-6 text-left text-[17px] leading-6 font-semibold text-text-primary lg:text-[19px]"
              >
                <span className="w-7 shrink-0 font-work text-[14px] font-semibold text-brand-500 tabular-nums">
                  0{index + 1}
                </span>
                <span className="flex-1 transition-colors group-hover:text-brand-700">
                  {faq.question}
                </span>
                <PlusMinusIcon open={isOpen} />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-[560px] pb-7 pl-12 text-[16px] leading-7 text-text-secondary">
                  {faq.answer}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** A plus whose vertical bar folds away into a minus when open. */
function PlusMinusIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default text-brand-950 transition-colors group-hover:border-brand-950"
    >
      <span className="absolute h-[2px] w-[12px] rounded-full bg-current" />
      <span
        className={cn(
          "absolute h-[12px] w-[2px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          open ? "scale-y-0 rotate-90" : "scale-y-100",
        )}
      />
    </span>
  );
}
