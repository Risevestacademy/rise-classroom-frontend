import { GridRow } from "@/components/landing/GridRow";
import { ProductDemo } from "@/components/landing/product-demo/ProductDemo";

export function ProductDemoSection() {
  return (
    <section id="tour" data-bg="#FFFFFF">
      <GridRow innerClassName="py-12 lg:px-3 lg:pt-[56px] lg:pb-[58px]">
        <h2
          data-reveal="up"
          className="font-tomato text-[20px] leading-7 font-bold text-black"
        >
          One classroom. Every role.
        </h2>
        <p
          data-reveal="up"
          className="mt-1 max-w-[520px] font-tomato text-[20px] leading-[26px] text-[#8C8C8C]"
        >
          See how students, instructors, mentors and admins each run their part of
          the programme.
        </p>
      </GridRow>

      {/* The extra height is how long the device stays pinned to the screen. */}
      <div
        data-tour-track
        className="relative border-b border-border-default motion-safe:h-[200svh]"
      >
        <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-6 sm:px-8 lg:px-6 motion-safe:sticky motion-safe:top-0 motion-safe:h-svh">
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/4 -z-10 mx-auto h-3/4 max-w-[1300px] bg-[radial-gradient(closest-side,rgb(233_235_255/0.9),transparent)]"
          />
          <ProductDemo />
        </div>
      </div>
    </section>
  );
}
