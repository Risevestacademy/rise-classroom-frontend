import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";

export function TestimonialsSection() {
  return (
    <section
      data-testimonials
      data-bg="#080D38"
      data-bg-keep
      className="bg-brand-950 px-4 pt-[72px] pb-[72px] lg:pt-[100px] lg:pb-[100px]"
    >
      <div className="mx-auto w-full max-w-[1052px]">
        <h2
          data-reveal="scramble"
          className="text-[18px] leading-6 font-semibold text-white uppercase"
        >
          Words from our community
        </h2>

        <TestimonialCarousel />
      </div>
    </section>
  );
}
