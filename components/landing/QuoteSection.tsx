import { GridRow } from "@/components/landing/GridRow";

export function QuoteSection() {
  return (
    <section data-bg="#FFFFFF">
      <GridRow innerClassName="flex justify-center py-[72px] lg:px-[14px] lg:pt-[124px] lg:pb-[104px]">
        <p
          data-reveal="up"
          className="w-full max-w-[771px] text-center text-[22px] leading-[28px] font-semibold text-black lg:text-[28px] lg:leading-[34px]"
        >
          Great learning experiences need more than good teaching. They need the
          right structure, the right tools, and a space where everyone can make
          progress.
        </p>
      </GridRow>
    </section>
  );
}
