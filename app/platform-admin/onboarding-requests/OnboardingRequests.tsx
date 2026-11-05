"use client";

import { AllClearState } from "@/components/platform-admin/AllClearState";
import { OnboardingRequestsTable } from "@/components/platform-admin/OnboardingRequestsTable";
import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";
import { StatCard } from "@/components/StatCard";
import { isAwaitingSetup } from "@/lib/platform";
import { onboardingRequests, platformAcademies } from "@/lib/platform-sample-data";

/* The designs show "--" for a figure with nothing to count yet. */
const figure = (count: number) => count || "--";

export function OnboardingRequests() {
  const awaitingCount = platformAcademies.filter(isAwaitingSetup).length;
  const newCount = onboardingRequests.filter(
    ({ status }) => status === "NEW",
  ).length;

  return (
    <>
      <PlatformTopNav
        page="Onboarding requests"
        href="/platform-admin/onboarding-requests"
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">
              Onboarding requests
            </h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Review applications from academies and instructors who want to get
              started with Rise Classroom.
            </p>
          </div>

          <div className="grid max-w-[900px] grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Total Requests" value={figure(onboardingRequests.length)} />
            <StatCard title="New Requests" value={figure(newCount)} />
            <StatCard title="Awaiting set-up" value={figure(awaitingCount)} />
          </div>

          {onboardingRequests.length > 0 ? (
            <section className="rounded-xl bg-surface-default p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.15)]">
              <OnboardingRequestsTable requests={onboardingRequests} />
            </section>
          ) : (
            <AllClearState />
          )}
        </div>
      </main>
    </>
  );
}
