import { AudienceSection } from "@/components/landing/AudienceSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingMotion } from "@/components/landing/motion/LandingMotion";
import { PricingSection } from "@/components/landing/PricingSection";
import { ValueCards } from "@/components/landing/ValueCards";
// Hidden until we have real testimonials.
// import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
        <ValueCards />
        <HowItWorks />
        <AudienceSection />
        {/* <TestimonialsSection /> */}
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
      <LandingMotion />
    </>
  );
}
