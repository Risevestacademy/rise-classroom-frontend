import { FaqSection } from "@/components/landing/FaqSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingMotion } from "@/components/landing/motion/LandingMotion";
import { PricingSection } from "@/components/landing/PricingSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ValuePropSection } from "@/components/landing/ValuePropSection";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      {/* Sits above the sticky footer and lifts away to reveal it. */}
      <main
        data-landing-main
        className="relative z-10 overflow-clip rounded-b-[40px]"
      >
        <HeroSection />
        <ValuePropSection />
        <SolutionSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
      <LandingMotion />
    </>
  );
}
