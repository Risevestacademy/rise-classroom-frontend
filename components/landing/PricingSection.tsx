import Link from "next/link";

import { GridRow } from "@/components/landing/GridRow";
import { RollText } from "@/components/landing/RollText";

import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "contact@riseclassroom.com";

const PLANS = [
  {
    status: "Available",
    title: "Free to start",
    body: "Everything you need to organize your classes, share learning materials & keep learners moving forward",
    cta: { label: "Start for free", href: "/sign-up" },
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
    <section id="pricing" data-bg="#FFFFFF">
      <GridRow innerClassName="py-12 lg:px-[32px] lg:py-[46px]">
        <h2
          data-reveal="chars"
          className="text-[32px] leading-[38px] font-bold text-text-primary"
        >
          Start free.
          <br />
          Grow with Rise.
        </h2>
        <p
          data-reveal="up"
          className="mt-2 max-w-[389px] text-[16px] leading-6 font-medium text-text-secondary"
        >
          Everything you need to get started, with room to grow as your learning
          community expands.
        </p>
      </GridRow>

      <GridRow className="px-0" innerClassName="grid md:grid-cols-2">
        {PLANS.map((plan, index) => (
          <div
            key={plan.title}
            className={cn(
              "px-4 py-10 lg:p-[40px]",
              index > 0 &&
                "border-t border-border-default md:border-t-0 md:border-l",
            )}
          >
            <div
              data-pricing-card
              className="flex h-full flex-col items-start gap-[80px] md:min-h-[360px] md:justify-between md:gap-0"
            >
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-2 font-tomato text-[14px] leading-5 font-medium",
                  plan.featured
                    ? "bg-success-surface text-text-success"
                    : "bg-surface-subtle text-text-primary",
                )}
              >
                {plan.status}
              </span>
              <div className="flex w-full flex-col items-start gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-[24px] leading-8 font-semibold text-black">
                    {plan.title}
                  </h3>
                  <p className="text-[14px] leading-5 text-text-secondary">
                    {plan.body}
                  </p>
                </div>
                <Link
                  href={plan.cta.href}
                  className={cn(
                    "landing-btn inline-flex h-10 items-center rounded-full px-4 font-tomato text-[14px] leading-5 font-medium",
                    plan.featured
                      ? "landing-shine bg-interactive-primary-default text-interactive-primary-text"
                      : "border border-border-default bg-white text-text-brand [--btn-fill:var(--color-neutral-100)]",
                  )}
                >
                  <RollText>{plan.cta.label}</RollText>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </GridRow>
    </section>
  );
}
