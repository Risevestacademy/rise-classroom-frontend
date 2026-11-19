import Link from "next/link";

import { RollText } from "@/components/landing/RollText";

/* Heights of the steps along the bottom of the card, in percent. */
const STEPS = [14, 20, 26, 34, 42, 50, 60, 70, 80, 90, 100];

export function FinalCta() {
  return (
    <section data-bg="#FFFFFF" className="px-4 pb-18 lg:pb-20">
      <div
        data-cta
        className="relative isolate mx-auto flex max-w-[1200px] flex-col items-center overflow-hidden rounded-[40px] bg-brand-950 px-6 pt-16 pb-[200px] text-center lg:rounded-[48px] lg:pt-19 lg:pb-[260px]"
      >
        <h2
          data-reveal="lines"
          className="max-w-[760px] text-[40px] leading-[1.05] font-black tracking-[-0.04em] text-white lg:text-[72px]"
        >
          Give your learners room to rise.
        </h2>
        <p className="mt-6 max-w-[440px] text-[17px] leading-7 text-brand-200">
          Bring your classes, learners, and progress together today. It&apos;s
          free to start.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="btn-press flex h-12 items-center rounded-[14px] bg-white px-6 text-[15px] font-semibold text-brand-950 [--press:var(--color-brand-400)]"
          >
            <RollText>Start for free</RollText>
          </Link>
          <Link
            href="/sign-in"
            className="btn-press flex h-12 items-center rounded-[14px] border border-brand-700 bg-brand-900 px-6 text-[15px] font-semibold text-white [--press:var(--color-brand-700)]"
          >
            <RollText>Sign in</RollText>
          </Link>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex h-[150px] items-end gap-1.5 px-6 lg:h-[200px] lg:gap-2 lg:px-10"
        >
          {STEPS.map((height, index) => (
            <span
              key={height}
              data-cta-step
              style={{ height: `${height}%` }}
              className={
                index === STEPS.length - 1
                  ? "flex-1 origin-bottom rounded-t-[10px] bg-brand-400"
                  : "flex-1 origin-bottom rounded-t-[10px] bg-brand-800"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
