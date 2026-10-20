"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type Faq = { question: string; answer: string };

/** One answer open at a time; the first starts open, as in the design. */
export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <ul data-reveal-group className="flex flex-col gap-3 lg:w-[759px]">
      {items.map((faq, index) => {
        const isOpen = open === index;
        const buttonId = `${id}-question-${index}`;
        const panelId = `${id}-answer-${index}`;

        return (
          <li
            key={faq.question}
            data-reveal-item
            className="rounded-[12px] bg-neutral-50"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-start justify-between gap-6 p-6 text-left text-[16px] leading-6 font-medium text-text-primary"
              >
                {faq.question}
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
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "-mt-px px-6 pb-6 font-work text-[16px] leading-6",
                    // The design shows the first answer in the secondary colour.
                    index === 0 ? "text-text-secondary" : "text-text-primary"
                  )}
                >
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
      className="relative flex size-6 shrink-0 items-center justify-center"
    >
      <span className="absolute h-[2px] w-[14px] rounded-full bg-current" />
      <span
        className={cn(
          "absolute h-[14px] w-[2px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          open ? "scale-y-0 rotate-90" : "scale-y-100"
        )}
      />
    </span>
  );
}
