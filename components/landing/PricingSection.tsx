import Link from "next/link";

import { RollText } from "@/components/landing/RollText";

import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "contact@riseclassroom.com";

const PLANS = [
  {
    status: "Available",
    title: "Free to start",
    body: "For independent instructors and small learning communities getting started with Rise Classroom.",
    cta: { label: "Get started for free", href: "/sign-up" },
    featured: true,
  },
  {
    status: "Coming later",
    title: "For organizations",
    body: "For academies, schools, and teams managing learning at scale.",
    cta: {
      label: "Talk to our team",
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Rise Classroom for organizations")}`,
    },
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      data-bg="#FFFFFF"
      className="flex flex-col items-center bg-white px-4 pt-[72px] pb-[72px] lg:pt-[100px] lg:pb-[100px]"
    >
      <h2
        data-reveal="chars"
        className="text-center text-[36px] leading-[44px] font-bold text-text-primary lg:text-[48px] lg:leading-[56px]"
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

      <ul className="mt-12 grid lg:mt-[80px] w-full max-w-[947px] gap-[15px] md:grid-cols-2">
        {PLANS.map((plan) => (
          <li
            key={plan.title}
            data-pricing-card
            data-tilt
            className={cn(
              "rounded-[16px] p-6 lg:p-10",
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
              <RollText>{plan.cta.label}</RollText>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
