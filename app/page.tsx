import { FaqSection } from "@/components/landing/FaqSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ValuePropSection } from "@/components/landing/ValuePropSection";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <ValuePropSection />
        <SolutionSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </>
  );
}
