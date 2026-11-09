"use client";

import { useQuery } from "@tanstack/react-query";

import { AllClearState } from "@/components/platform-admin/AllClearState";
import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";
import { StatCard } from "@/components/StatCard";
import { isAwaitingSetup, platformQueries } from "@/lib/platform";

/* The designs show "--" for a figure with nothing to count yet. */
const figure = (count: number) => count || "--";

export function OnboardingRequests() {
  const academiesQuery = useQuery(platformQueries.academies());

  return (
    <RequestsView
      awaitingSetup={
        academiesQuery.isError
          ? "—"
          : figure((academiesQuery.data ?? []).filter(isAwaitingSetup).length)
      }
      isPending={academiesQuery.isPending}
    />
  );
}

export function OnboardingRequestsLoading() {
  return <RequestsView awaitingSetup="--" isPending />;
}

function RequestsView({
  awaitingSetup,
  isPending,
}: {
  awaitingSetup: React.ReactNode;
  isPending: boolean;
}) {
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
            <StatCard title="Total Requests" value="--" />
            <StatCard title="New Requests" value="--" />
            <StatCard
              title="Awaiting set-up"
              value={awaitingSetup}
              loading={isPending}
            />
          </div>

          <AllClearState />
        </div>
      </main>
    </>
  );
}
