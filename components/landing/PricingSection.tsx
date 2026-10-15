import Link from "next/link";

import { cn } from "@/lib/utils";

const PLANS = [
  {
    status: "Available",
    title: "Free to start",
    body: "For independent instructors and small learning communities getting started with Rise Classroom.",
    cta: { label: "Get started for free", href: "/onboarding/create-account" },
    featured: true,
  },
  {
    status: "Coming later",
    title: "For organizations",
    body: "For academies, schools, and teams managing learning at scale.",
    // TODO: no contact destination yet.
    cta: { label: "Talk to our team", href: "#pricing" },
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="flex flex-col items-center bg-white px-4 pt-[100px] pb-[254px]"
    >
      <h2
        data-reveal="lines"
        className="text-center text-[48px] leading-[56px] font-bold text-text-primary"
      >
        Start free.
        <br />
        Grow with Rise.
      </h2>
      <p
        data-reveal="up"
        className="mt-[8px] w-full max-w-[501px] text-center text-[16px] leading-6 font-medium text-text-secondary"
      >
        Everything you need to get started, with room to grow as your learning
        community expands.
      </p>

      <ul
        data-reveal-group
        className="mt-[80px] grid w-full max-w-[947px] gap-[15px] md:grid-cols-2"
      >
        {PLANS.map((plan) => (
          <li
            key={plan.title}
            data-reveal-item
            data-tilt
            className={cn(
              "rounded-[16px] p-10",
              plan.featured
                ? "bg-neutral-50 shadow-[0_1px_2px_rgb(17_24_25/0.12),0_0_0_1px_rgb(17_24_25/0.04)]"
                : "border border-neutral-200 bg-white"
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-full px-2 text-[14px] leading-5 font-medium",
                plan.featured
                  ? "bg-success-surface text-success-text"
                  : "bg-neutral-100 text-text-primary"
              )}
            >
              {plan.featured && (
                <span aria-hidden className="relative mr-[6px] flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-current" />
                </span>
              )}
              {plan.status}
            </span>
            <h3 className="mt-8 text-[24px] leading-8 font-semibold text-black">
              {plan.title}
            </h3>
            <p className="mt-2 max-w-[384px] font-work text-[14px] leading-5 text-text-secondary">
              {plan.body}
            </p>
            <Link
              href={plan.cta.href}
              className={cn(
                "landing-btn mt-10 inline-flex h-10 items-center rounded-[8px] px-4 text-[14px] leading-5 font-medium",
                plan.featured
                  ? "landing-shine bg-brand-950 text-white"
                  : "border border-neutral-200 bg-white text-brand-950 [--btn-fill:var(--color-neutral-100)]"
              )}
            >
              {plan.cta.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
