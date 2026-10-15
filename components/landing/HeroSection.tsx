import Image from "next/image";
import Link from "next/link";
import { CirclePlay } from "lucide-react";

import { cn } from "@/lib/utils";

const PRODUCT_TABS = ["Analytics", "Learning", "Community", "Chat", "Calender"];
const ACTIVE_TAB = "Learning";

export function HeroSection() {
  return (
    <section
      id="product"
      className="flex flex-col items-center bg-white px-4 pt-[192px] pb-[125px]"
    >
      <h1 className="w-full max-w-[760px] text-center text-[72px] leading-[80px] font-bold text-text-primary">
        Where better learning <em className="italic">takes shape.</em>
      </h1>

      <p className="mt-[12px] w-full max-w-[500px] text-center text-[16px] leading-6 font-medium text-text-secondary">
        Bring classes, learning materials, assignments, and progress together
        in one connected space built for educators and learners.
      </p>

      <div className="mt-[32px] flex items-center gap-4">
        <Link
          href="#solutions"
          className="flex h-[54px] items-center rounded-[16px] border border-neutral-200 bg-white px-6 text-[14px] leading-5 font-medium text-text-secondary"
        >
          Explore the platform
        </Link>
        <Link
          href="/onboarding/create-account"
          className="flex h-[54px] items-center rounded-[16px] bg-brand-950 px-6 text-[14px] leading-5 font-medium text-white ring-2 ring-brand-200"
        >
          Start for free
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Product areas"
        className="mt-[45px] flex h-[50px] items-center gap-2 rounded-full border border-neutral-300 bg-white p-1 shadow-[inset_0_2px_8px_rgb(0_0_0/0.04)]"
      >
        {PRODUCT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === ACTIVE_TAB}
            className={cn(
              "h-10 rounded-full px-4 text-[14px] leading-5 font-medium",
              tab === ACTIVE_TAB
                ? "bg-brand-50 text-brand-950"
                : "text-text-secondary"
            )}
          >
            {tab}
          </button>
        ))}
        <button
          type="button"
          aria-label="Play product tour"
          className="flex size-10 items-center justify-center rounded-full bg-white text-brand-950 shadow-[0_0_12px_rgb(0_0_0/0.04)]"
        >
          <CirclePlay className="size-5" strokeWidth={2.25} />
        </button>
      </div>

      <Image
        src="/landing/dashboard-mockup.png"
        alt="Rise Classroom curriculum dashboard"
        width={1208}
        height={861}
        unoptimized
        fetchPriority="high"
        className="mt-[28px] h-auto w-full max-w-[1208px]"
      />
    </section>
  );
}
