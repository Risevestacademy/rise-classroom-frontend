import { Suspense } from "react";

import {
  OnboardingLoading,
  OnboardingProvider,
} from "@/components/onboarding/OnboardingProvider";

// The provider reads `?token=` with useSearchParams, so it sits behind a
// Suspense boundary to keep the route prerenderable.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </Suspense>
  );
}
