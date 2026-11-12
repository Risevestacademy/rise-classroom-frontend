import Link from "next/link";

import { HeroBackground } from "@/components/landing/HeroBackground";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { RollText } from "@/components/landing/RollText";

export function HeroSection() {
  return (
    // data-bg is white so the page behind is already white for the marquee;
    // data-bg-keep holds the hero's own dark backdrop.
    <section
      id="product"
      data-bg="#FFFFFF"
      data-bg-keep
      className="relative isolate flex flex-col items-center px-4 font-tomato pt-[128px] pb-[64px] lg:pt-[228px] lg:pb-[50px]"
    >
      <HeroBackground />

      <h1
        data-intro="title"
        className="w-full max-w-[760px] text-center text-[40px] leading-[48px] font-bold text-white lg:text-[72px] lg:leading-[80px]"
      >
        Where better learning <em className="italic">takes shape.</em>
      </h1>

      <p
        data-intro="sub"
        className="mt-[12px] w-full max-w-[501px] text-center text-[16px] leading-6 font-medium text-[#9E9E9E]"
      >
        Bring classes, learning materials, assignments, and progress together in
        one connected space built for educators and learners.
      </p>

      <div data-intro="ctas" className="mt-[32px] flex items-center gap-4">
        <Link
          href="#solutions"
          data-magnetic
          className="landing-btn flex h-[56px] items-center justify-center rounded-full border border-border-strong px-4 text-[14px] leading-5 font-medium text-white [--btn-fill:rgb(255_255_255/0.1)] lg:w-[185px]"
        >
          <RollText>Explore the platform</RollText>
        </Link>
        <Link
          href="/sign-up"
          data-magnetic
          className="landing-btn flex h-[56px] items-center justify-center rounded-full border-2 border-brand-200 bg-surface-background px-4 text-[14px] leading-5 font-medium text-brand-950 [--btn-fill:var(--color-brand-50)] lg:w-[137px]"
        >
          <RollText>Start for free</RollText>
        </Link>
      </div>

      <HeroShowcase />
    </section>
  );
}
