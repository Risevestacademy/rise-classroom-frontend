"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, Hourglass, MoreHorizontal, ToggleRight } from "lucide-react";

import { ArrowRight02, Mortarboard } from "@/assets/icons";
import { MetricCard } from "@/components/MetricCard";
import { AllClearState } from "@/components/platform-admin/AllClearState";
import { OnboardingRequestsTable } from "@/components/platform-admin/OnboardingRequestsTable";
import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";
import { ActivityTimeline } from "@/components/student-profile/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shortDate } from "@/lib/calendar";
import {
  isActiveAcademy,
  isAwaitingSetup,
  setupAdmin,
  type Academy,
} from "@/lib/platform";
import {
  onboardingRequests,
  platformAcademies as academies,
  platformActivity,
} from "@/lib/platform-sample-data";
import { sessionQuery } from "@/lib/session-query";
import { cn, greeting } from "@/lib/utils";

const cardClass =
  "rounded-xl bg-surface-default shadow-[0_1px_3px_0_rgb(0_0_0/0.15)]";

/* How many rows each dashboard card shows before "View all". */
const previewLimit = 4;
const recentAcademiesLimit = 3;

/* The designs show "--" for a figure with nothing to count yet. */
const figure = (count: number) => count || "--";

export function PlatformAdminDashboard() {
  const session = useQuery(sessionQuery());
  const awaitingSetup = academies.filter(isAwaitingSetup);
  const activeCount = academies.filter(isActiveAcademy).length;
  const recentAcademies = academies.filter(setupAdmin).slice(0, recentAcademiesLimit);
  const isEmpty = academies.length === 0 && onboardingRequests.length === 0;

  return (
    <>
      <PlatformTopNav page="Dashboard" href="/platform-admin/dashboard" />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {/* Capped so cards don't stretch apart on wide screens. */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">
              {session.isPending ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                `${greeting()}, ${session.data?.user.firstName ?? "Admin"}`
              )}
            </h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Here&apos;s what&apos;s happening across academy onboarding.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          
            <MetricCard
              title="Pending Request"
              value={figure(onboardingRequests.length)}
              icon={Clock}
              iconClassName="bg-surface-warning-badge text-text-warning"
              className="min-h-0"
            />
            <MetricCard
              title="Total Academies"
              value={figure(academies.length)}
              icon={Mortarboard}
              iconClassName="bg-surface-brand text-text-success"
              className="min-h-0"
            />
            <MetricCard
              title="Awaiting set-up"
              value={figure(awaitingSetup.length)}
              icon={Hourglass}
              iconClassName="bg-[#fdeafc] text-[#960b93]"
              className="min-h-0"
            />
            <MetricCard
              title="Active academies"
              value={figure(activeCount)}
              icon={ToggleRight}
              iconClassName="bg-surface-brand text-text-info"
              className="min-h-0"
            />
          </div>

          {isEmpty ? (
            <AllClearState />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
                <section className={cn(cardClass, "flex min-w-0 flex-col gap-4 p-6")}>
                  <CardHeader
                    title="Recent onboarding requests"
                    subtitle="The latest academy applications that need your attention"
                    action={<ViewAllLink href="/platform-admin/onboarding-requests" />}
                  />
                  {onboardingRequests.length > 0 ? (
                    <OnboardingRequestsTable
                      requests={onboardingRequests.slice(0, previewLimit)}
                    />
                  ) : (
                    <CardMessage>No onboarding requests to review.</CardMessage>
                  )}
                </section>

                <section className={cn(cardClass, "flex min-w-0 flex-col gap-4 p-6")}>
                  <CardHeader
                    title="Approved and awaiting setup"
                    subtitle="Applicants who haven't completed their setup"
                  />
                  {awaitingSetup.length > 0 ? (
                    <ul className="flex flex-col">
                      {awaitingSetup.slice(0, previewLimit).map((academy) => (
                        <AwaitingSetupRow key={academy.id} academy={academy} />
                      ))}
                    </ul>
                  ) : (
                    <CardMessage>Every approved academy has finished its setup.</CardMessage>
                  )}
                </section>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_4fr]">
                <section className={cn(cardClass, "flex min-w-0 flex-col gap-4 p-6")}>
                  <CardHeader
                    title="Recently created Academies"
                    subtitle="Academies that have completed setup and are now active on Rise Classroom"
                    action={<ViewAllLink href="/platform-admin/academies" />}
                  />
                  {recentAcademies.length > 0 ? (
                    <RecentAcademiesTable academies={recentAcademies} />
                  ) : (
                    <CardMessage>No academy has finished its setup yet.</CardMessage>
                  )}
                </section>

                <section className={cn(cardClass, "flex min-w-0 flex-col gap-3 p-6")}>
                  <CardHeader
                    title="Recent Activity"
                    subtitle="A timeline of important platform activities."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        title="The activity log isn't available yet"
                        className="border-neutral-200 text-neutral-800"
                      >
                        View all
                        <ArrowRight02 className="size-4" />
                      </Button>
                    }
                  />
                  {platformActivity.length > 0 ? (
                    <ActivityTimeline groups={platformActivity} />
                  ) : (
                    <CardMessage>No activity to show yet.</CardMessage>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function AwaitingSetupRow({ academy }: { academy: Academy }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-work text-sm font-medium text-text-primary">
          {academy.name}
        </p>
        <p className="mt-0.5 font-work text-xs text-text-secondary">
          Approved {shortDate(new Date(academy.createdAt))}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled
        title="Resending the invite isn't available to program admins yet"
        className="shrink-0 border-neutral-200 text-neutral-800"
      >
        Resend email
      </Button>
    </li>
  );
}

function RecentAcademiesTable({ academies }: { academies: Academy[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-140 text-left text-sm">
        <thead className="bg-neutral-100 font-work text-xs text-text-secondary">
          <tr>
            <th className="rounded-l-lg px-4 py-3 font-medium">Academy</th>
            <th className="px-4 py-3 font-medium">Created on</th>
            <th className="px-4 py-3 font-medium">Super Admin</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="w-12 rounded-r-lg px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="font-work text-text-primary">
          {academies.map((academy) => {
            const admin = setupAdmin(academy);
            const suspended = academy.status === "SUSPENDED";
            return (
              <tr key={academy.id} className="border-b border-border-default last:border-b-0">
                <td className="px-4 py-3">{academy.name}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {shortDate(new Date(academy.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <p>
                    {admin?.firstName} {admin?.lastName}
                  </p>
                  <p className="text-xs text-text-secondary">{admin?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="light" status={suspended ? "error" : "success"}>
                    {suspended ? "Suspended" : "Active"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled
                    aria-label={`${academy.name} actions`}
                    title="Managing academies isn't available yet"
                    className="rounded-md p-1 text-text-disabled disabled:cursor-not-allowed"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CardMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center font-work text-sm text-text-muted">{children}</p>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      nativeButton={false}
      render={<Link href={href} />}
      className="shrink-0 border-neutral-200 text-neutral-800"
    >
      View all
      <ArrowRight02 className="size-4" />
    </Button>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg leading-6 font-semibold text-text-primary">{title}</h2>
        <p className="font-work text-sm text-text-secondary">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
