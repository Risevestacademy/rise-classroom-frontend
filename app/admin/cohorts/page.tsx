"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Add01,
  Cohorts as CohortsIcon,
  Track,
  UserMultiple,
} from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortActionsMenu } from "@/components/cohorts/CohortActionsMenu";
import { CohortStatusBadge } from "@/components/cohorts/CohortStatusBadge";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { SuccessToast } from "@/components/ui/toast";
import { getProgramOptionsErrorMessage } from "@/lib/admin";
import { cohortQueries } from "@/lib/cohorts";
import { cn } from "@/lib/utils";
import { type CohortStatus, type CohortSummary } from "./cohort-data";

type Filter = "all" | CohortStatus;

type Toast = { title: string; message: string };

const filters = [
  { value: "all", label: "All cohorts" },
  { value: "active", label: "Active" },
  // Spelling kept from the design.
  { value: "upcoming", label: "Upcomimg" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
] as const;

const cardSurface: Record<CohortStatus, string> = {
  active: "bg-brand-50",
  upcoming: "bg-info-surface",
  completed: "bg-success-surface",
  terminated: "bg-error-surface",
};

export default function CohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { created, updated } = React.use(searchParams);
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [statusToast, setStatusToast] = React.useState<Toast | null>(null);
  const dismissStatusToast = React.useCallback(() => setStatusToast(null), []);
  const cohortsQuery = useQuery(cohortQueries.summaries());
  const cohorts = cohortsQuery.data ?? [];

  const dismissToast = React.useCallback(
    () => router.replace("/admin/cohorts", { scroll: false }),
    [router],
  );

  const visible =
    filter === "all"
      ? cohorts
      : cohorts.filter((cohort) => cohort.status === filter);

  return (
    <>
      <AdminTopNav breadcrumb={["Academy", "Cohorts"]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Cohorts</h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Manage student groups and monitor their progress
            </p>
          </div>
          {cohorts.length > 0 && <CreateCohortLink />}
        </div>

        <CohortTabs
          label="Filter cohorts"
          tabs={filters}
          value={filter}
          onChange={setFilter}
          className="mt-6"
        />

        {cohortsQuery.isError ? (
          <p className="mt-8 font-work text-sm text-text-error">
            {getProgramOptionsErrorMessage(cohortsQuery.error)}
          </p>
        ) : cohortsQuery.isPending ? null : visible.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((cohort) => (
              <li key={cohort.id}>
                <CohortCard cohort={cohort} onStatusChanged={setStatusToast} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {created && (
        <SuccessToast
          title="New Cohort created"
          message={
            <>
              &ldquo;{created}&rdquo; has been successfully created and added
              to cohorts
            </>
          }
          onDismiss={dismissToast}
        />
      )}

      {updated && (
        <SuccessToast
          title="Cohort updated"
          message={<>&ldquo;{updated}&rdquo; has been successfully updated</>}
          onDismiss={dismissToast}
        />
      )}

      {statusToast && (
        <SuccessToast
          title={statusToast.title}
          message={statusToast.message}
          onDismiss={dismissStatusToast}
        />
      )}
    </>
  );
}

function CreateCohortLink({ label = "Create cohort" }: { label?: string }) {
  return (
    <Link
      href="/admin/cohorts/create"
      className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-interactive-primary-hover"
    >
      <Add01 className="size-5" />
      {label}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-4 pt-[231px] pb-16 text-center lg:-mr-8">
      <CohortsIcon className="size-[84px] text-brand-primary" />
      <p className="mt-[17px] text-2xl font-semibold text-text-primary">
        No cohort yet
      </p>
      <p className="mt-0.5 max-w-[372px] font-work text-sm text-text-secondary">
        Create your first cohort. Manage student groups and monitor their
        progress
      </p>
      <div className="mt-[23px]">
        {/* Label kept from the design. */}
        <CreateCohortLink label="Add assignment" />
      </div>
    </div>
  );
}

function CohortCard({
  cohort,
  onStatusChanged,
}: {
  cohort: CohortSummary;
  onStatusChanged: (toast: Toast) => void;
}) {
  const completed = cohort.status === "completed";

  return (
    <article
      className={cn(
        "relative rounded-3xl p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]",
        cardSurface[cohort.status],
      )}
    >
      <div className="flex items-center justify-between">
        <CohortStatusBadge status={cohort.status} />
        <CohortActionsMenu cohort={cohort} onStatusChanged={onStatusChanged} />
      </div>

      <h2 className="mt-3 text-xl font-semibold text-text-primary">
        <Link
          href={`/admin/cohorts/${cohort.id}`}
          className="after:absolute after:inset-0 after:rounded-3xl"
        >
          {cohort.name}
        </Link>
      </h2>
      <p className="mt-1 font-work text-xs text-text-secondary">
        {cohort.startDate} - {cohort.endDate}
      </p>

      <div className="mt-4 flex gap-8">
        <CardStat icon={UserMultiple} value={cohort.students} label="Students" />
        <CardStat icon={Track} value={cohort.tracks} label="Tracks" />
      </div>

      <p className="mt-3.5 text-xs font-medium text-text-primary">
        {completed ? "Completed" : `${cohort.progress}% Complete`}
      </p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-primary"
          style={{ width: `${cohort.progress}%` }}
        />
      </div>
      {countdown(cohort) && (
        <p className="mt-1 text-right font-work text-xs text-text-secondary">
          {countdown(cohort)}
        </p>
      )}
    </article>
  );
}

/** Days to kick off for upcoming cohorts, days left for active ones, nothing once ended. */
function countdown(cohort: CohortSummary) {
  if (cohort.status === "upcoming") return `${cohort.daysToStart} days to kick off`;
  if (cohort.status === "active") return `${cohort.daysLeft} days left`;
  return null;
}

function CardStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[24px_auto] gap-x-3">
      <Icon className="size-6 text-text-primary" />
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      <p className="col-start-2 font-work text-sm text-text-secondary">
        {label}
      </p>
    </div>
  );
}
