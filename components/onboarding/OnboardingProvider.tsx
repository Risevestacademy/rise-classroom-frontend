"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import {
  getOnboardingErrorMessage,
  onboardingQueries,
  type OnboardingDetails,
} from "@/lib/onboarding";

type OnboardingContextValue = {
  token: string;
  details: OnboardingDetails;
  isInstructor: boolean;
  /** Builds an onboarding URL that keeps the invite token attached. */
  hrefFor: (path: string) => string;
  /**
   * The password chosen on the create-account step. Held in memory only — the
   * backend takes it together with the display name in a single call at the
   * end, and it must never touch the URL or browser storage.
   */
  password: string;
  setPassword: (password: string) => void;
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(
  null
);

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>.");
  }

  return context;
}

export function OnboardingLoading() {
  return (
    <OnboardingShell>
      <Skeleton className="mx-auto my-10 h-[140px] w-full rounded-2xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </OnboardingShell>
  );
}

function OnboardingProblem({ message }: { message: string }) {
  return (
    <OnboardingShell>
      <div className="my-10 flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-semantic-surface-error-badge text-semantic-text-error">
          <AlertCircle className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-bold text-neutral-900">
          We can&apos;t open this invitation
        </h1>
        <p className="max-w-sm text-sm text-neutral-600">{message}</p>
        <Button
          variant="primary"
          size="lg"
          className="mt-2 w-full max-w-xs cursor-pointer rounded-full"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          Go to sign in
        </Button>
      </div>
    </OnboardingShell>
  );
}

/**
 * Loads the invite behind `?token=` once and shares it across every onboarding
 * step. Steps only render once the link is known to be valid.
 */
export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = React.useState("");

  const detailsQuery = useQuery(onboardingQueries.details(token));

  const hrefFor = React.useCallback(
    (path: string) => `${path}?token=${encodeURIComponent(token)}`,
    [token]
  );

  if (!token) {
    return (
      <OnboardingProblem message="This page needs the link from your invitation email. Open the email and click the button again." />
    );
  }

  if (detailsQuery.isPending) return <OnboardingLoading />;

  if (detailsQuery.isError) {
    return (
      <OnboardingProblem
        message={getOnboardingErrorMessage(detailsQuery.error)}
      />
    );
  }

  return (
    <OnboardingContext.Provider
      value={{
        token,
        details: detailsQuery.data,
        isInstructor: detailsQuery.data.role === "INSTRUCTOR",
        hrefFor,
        password,
        setPassword,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
