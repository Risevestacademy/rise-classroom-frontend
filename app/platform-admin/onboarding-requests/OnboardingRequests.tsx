"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { AllClearState } from "@/components/platform-admin/AllClearState";
import {
  ApplicationDecisionDialog,
  type ApplicationDecision,
} from "@/components/platform-admin/ApplicationDecisionDialog";
import { ApplicationDetailsPanel } from "@/components/platform-admin/ApplicationDetailsPanel";
import { ApplicationsTable } from "@/components/platform-admin/ApplicationsTable";
import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isAwaitingSetup,
  platformQueries,
  type OrganizationApplication,
} from "@/lib/platform";

/* The designs show "--" for a figure with nothing to count yet. */
const figure = (count: number) => count || "--";

type Figure = { value: React.ReactNode; isPending: boolean };

export function OnboardingRequests() {
  const applicationsQuery = useQuery(platformQueries.applications());
  const academiesQuery = useQuery(platformQueries.academies());
  const applications = applicationsQuery.data ?? [];
  const stat = (count: number) => (applicationsQuery.isError ? "—" : figure(count));

  return (
    <RequestsView
      total={{ value: stat(applications.length), isPending: applicationsQuery.isPending }}
      fresh={{
        value: stat(applications.filter(({ status }) => status === "NEW").length),
        isPending: applicationsQuery.isPending,
      }}
      awaitingSetup={{
        value: academiesQuery.isError
          ? "—"
          : figure((academiesQuery.data ?? []).filter(isAwaitingSetup).length),
        isPending: academiesQuery.isPending,
      }}
    >
      <RequestsBody
        applications={applications}
        isPending={applicationsQuery.isPending}
        isError={applicationsQuery.isError}
        onRetry={() => applicationsQuery.refetch()}
      />
    </RequestsView>
  );
}

const loadingFigure: Figure = { value: "--", isPending: true };

export function OnboardingRequestsLoading() {
  return (
    <RequestsView
      total={loadingFigure}
      fresh={loadingFigure}
      awaitingSetup={loadingFigure}
    >
      <Skeleton className="h-64 w-full rounded-xl" />
    </RequestsView>
  );
}

function RequestsView({
  total,
  fresh,
  awaitingSetup,
  children,
}: {
  total: Figure;
  fresh: Figure;
  awaitingSetup: Figure;
  children: React.ReactNode;
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
            <StatCard
              title="Total Requests"
              value={total.value}
              loading={total.isPending}
            />
            <StatCard
              title="New Requests"
              value={fresh.value}
              loading={fresh.isPending}
            />
            <StatCard
              title="Awaiting set-up"
              value={awaitingSetup.value}
              loading={awaitingSetup.isPending}
            />
          </div>

          {children}
        </div>
      </main>
    </>
  );
}

type Deciding = {
  application: OrganizationApplication;
  decision: ApplicationDecision;
};

function RequestsBody({
  applications,
  isPending,
  isError,
  onRetry,
}: {
  applications: OrganizationApplication[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [deciding, setDeciding] = React.useState<Deciding | null>(null);
  /* The dialog keeps its application while it closes. */
  const [lastDecided, setLastDecided] = React.useState<OrganizationApplication | null>(null);
  if (deciding && deciding.application !== lastDecided) {
    setLastDecided(deciding.application);
  }
  const viewing =
    applications.find((application) => application.id === viewingId) ?? null;

  if (isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-work text-sm text-text-secondary">
          We couldn&apos;t load the onboarding requests.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="border-neutral-200 text-neutral-800"
        >
          Try again
        </Button>
      </div>
    );
  }
  if (applications.length === 0) return <AllClearState />;

  return (
    <>
      <ApplicationsTable
        applications={applications}
        onView={(application) => setViewingId(application.id)}
        onDecide={(application, decision) =>
          setDeciding({ application, decision })
        }
      />
      <ApplicationDetailsPanel
        application={viewing}
        onClose={() => setViewingId(null)}
        onDecide={(decision) =>
          viewing && setDeciding({ application: viewing, decision })
        }
      />
      {lastDecided && (
        <ApplicationDecisionDialog
          application={lastDecided}
          decision={deciding?.decision ?? null}
          onClose={() => setDeciding(null)}
        />
      )}
    </>
  );
}
