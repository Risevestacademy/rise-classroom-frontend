/** The design only has the heading so far; the testimonials themselves are still to come. */
export function TestimonialsSection() {
  return (
    <section
      data-testimonials
      data-bg="#080D38"
      data-bg-keep
      className="h-[480px] bg-brand-950 px-4 pt-[72px] lg:h-[904px] lg:px-[100px] lg:pt-[100px]"
    >
      <h2
        data-reveal="scramble"
        className="text-[18px] leading-6 font-semibold text-white uppercase"
      >
        Words from our community
      </h2>
    </section>
  );
}
