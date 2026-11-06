import Link from "next/link";

import { HandDrawn } from "@/components/landing/HandDrawn";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { LineShapes } from "@/components/landing/LineShapes";
import { RollText } from "@/components/landing/RollText";

export function HeroSection() {
  return (
    <section
      id="product"
      data-bg="#FFFFFF"
      className="relative isolate flex flex-col items-center overflow-hidden px-4 pt-[132px] pb-14 lg:pt-[200px] lg:pb-18"
    >
      <div
        aria-hidden
        className="graph-paper absolute inset-x-0 top-0 -z-20 h-[880px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_20%,#000_20%,transparent_80%)]"
      />
      <LineShapes
        shapes={[
          {
            shape: "circle",
            className: "top-[180px] left-[9%] text-brand-300",
            drift: -0.3,
          },
          {
            shape: "zigzag",
            className: "top-[420px] left-[14%] w-14 text-brand-400",
            drift: -0.15,
          },
          {
            shape: "triangle",
            className: "top-[200px] right-[11%] rotate-12 text-brand-400",
            drift: -0.25,
          },
          {
            shape: "square",
            className: "top-[440px] right-[8%] -rotate-12 text-brand-300",
            drift: -0.4,
          },
        ]}
      />

      <h1
        data-intro="title"
        className="w-full max-w-[880px] text-center text-[44px] leading-[1.14] font-black tracking-[-0.04em] text-brand-950 sm:text-[60px] lg:text-[84px]"
      >
        Where better learning{" "}
        <HandDrawn strokeClassName="text-brand-400">takes shape.</HandDrawn>
      </h1>

      <p
        data-intro="sub"
        className="mt-7 w-full max-w-[500px] text-center text-[17px] leading-7 text-text-secondary"
      >
        Bring classes, learning materials, assignments, and progress together in
        one connected space built for educators and learners.
      </p>

      <div data-intro="ctas" className="mt-9 flex items-center gap-3">
        <Link
          href="#how-it-works"
          className="btn-press flex h-12 items-center justify-center rounded-[14px] border border-border-default bg-white px-5 text-[15px] font-semibold text-text-primary [--press:var(--color-border-strong)]"
        >
          <RollText>See how it works</RollText>
        </Link>
        <Link
          href="/sign-up"
          className="btn-press flex h-12 items-center justify-center rounded-[14px] bg-brand-700 px-5 text-[15px] font-semibold text-white"
        >
          <RollText>Start for free</RollText>
        </Link>
      </div>

      <HeroShowcase />
    </section>
  );
}
