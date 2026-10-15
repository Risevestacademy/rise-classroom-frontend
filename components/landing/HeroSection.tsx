import Link from "next/link";

import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { RollText } from "@/components/landing/RollText";

export function HeroSection() {
  return (
    <section
      id="product"
      data-bg="#FFFFFF"
      className="flex flex-col items-center bg-white px-4 pt-[128px] pb-[64px] lg:pt-[192px] lg:pb-[125px]"
    >
      <h1
        data-intro="title"
        className="w-full max-w-[760px] text-center text-[40px] leading-[48px] lg:text-[72px] lg:leading-[80px] font-bold text-text-primary"
      >
        Where better learning <em className="italic">takes shape.</em>
      </h1>

      <p
        data-intro="sub"
        className="mt-[12px] w-full max-w-[500px] text-center text-[16px] leading-6 font-medium text-text-secondary"
      >
        Bring classes, learning materials, assignments, and progress together in
        one connected space built for educators and learners.
      </p>

      <div data-intro="ctas" className="mt-[32px] flex items-center gap-4">
        <Link
          href="#solutions"
          data-magnetic
          className="landing-btn flex h-[54px] items-center rounded-[16px] border border-neutral-200 bg-white px-5 lg:px-6 text-[14px] leading-5 font-medium text-text-secondary [--btn-fill:var(--color-neutral-100)]"
        >
          <RollText>Explore the platform</RollText>
        </Link>
        <Link
          href="/onboarding/create-account"
          data-magnetic
          className="landing-btn flex h-[54px] items-center rounded-[16px] bg-brand-950 px-5 lg:px-6 text-[14px] leading-5 font-medium text-white ring-2 ring-brand-200"
        >
          <RollText>Start for free</RollText>
        </Link>
      </div>

      <HeroShowcase />
    </section>
  );
}
