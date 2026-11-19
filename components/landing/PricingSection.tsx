import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RiseMark } from "@/components/landing/RiseMark";
import { RollText } from "@/components/landing/RollText";

const CONTACT_EMAIL = "contact@riseclassroom.com";

export function PricingSection() {
  return (
    <section id="pricing" data-bg="#FFFFFF" className="px-4 py-19 lg:py-[128px]">
      <div className="mx-auto max-w-[1040px]">
        <div className="text-center">
          <RiseMark className="mx-auto" />
          <h2
            data-reveal="lines"
            className="mt-6 text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-brand-950 lg:text-[56px]"
          >
            Start free.
            <br />
            Grow with Rise.
          </h2>
          <p
            data-reveal="up"
            className="mx-auto mt-6 max-w-[500px] text-[17px] leading-7 text-text-secondary"
          >
            Everything you need to get started, with room to grow as your
            learning community expands.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-[1.15fr_1fr] lg:mt-16">
          <li data-pricing-card>
            <div className="flex h-full flex-col rounded-[32px] bg-brand-950 p-8 text-white lg:p-10">
              <span className="inline-flex h-7 w-fit items-center gap-2 rounded-full bg-success-surface px-2.5 text-[13px] font-semibold text-success-text">
                <span aria-hidden className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-current" />
                </span>
                Available now
              </span>
              <h3 className="mt-8 text-[20px] font-semibold text-brand-200">
                Free to start
              </h3>
              <p className="mt-1 text-[64px] leading-none font-black tracking-[-0.04em]">
                Free
              </p>
              <p className="mt-4 mb-12 max-w-[380px] text-[15px] leading-6 text-brand-100/70">
                For independent instructors and small learning communities
                getting started with Rise Classroom.
              </p>
              <Link
                href="/sign-up"
                className="btn-press mt-auto flex h-13 items-center justify-center rounded-[16px] bg-white text-[15px] font-semibold text-brand-950 [--press:var(--color-brand-400)]"
              >
                <RollText>Get started for free</RollText>
              </Link>
            </div>
          </li>

          <li
            data-pricing-card
            className="flex flex-col rounded-[32px] bg-brand-50 p-8 lg:p-10"
          >
            <span className="inline-flex h-7 w-fit items-center rounded-full bg-white px-2.5 text-[13px] font-semibold text-text-primary">
              Coming later
            </span>
            <h3 className="mt-8 text-[20px] font-semibold text-text-secondary">
              For organizations
            </h3>
            <p className="mt-1 text-[64px] leading-none font-black tracking-[-0.04em] text-brand-950">
              Let&apos;s talk
            </p>
            <p className="mt-4 mb-12 max-w-[340px] text-[15px] leading-6 text-text-secondary">
              For academies, schools, and teams managing learning at scale.
            </p>
            <Link
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Rise Classroom for organizations")}`}
              className="group btn-press mt-auto flex h-13 items-center justify-center gap-2 rounded-[16px] border border-border-default bg-white text-[15px] font-semibold text-brand-950 [--press:var(--color-border-strong)]"
            >
              Talk to our team
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
