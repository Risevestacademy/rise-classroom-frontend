"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";

import type { ApplicationDecision } from "@/components/platform-admin/ApplicationDecisionDialog";
import { ApplicationStatusBadge } from "@/components/platform-admin/ApplicationDetailsPanel";
import { shortDate } from "@/lib/calendar";
import {
  isOpenApplication,
  type ApplicationStatus,
  type OrganizationApplication,
} from "@/lib/platform";
import { cn } from "@/lib/utils";

type StatusFilter = ApplicationStatus | "ALL";

/* Pending (INFO_REQUESTED) has no tab of its own in the designs; those
   applications show under All requests. */
const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All requests" },
  { value: "NEW", label: "New" },
  { value: "APPROVED", label: "Approved" },
  { value: "DECLINED", label: "Declined" },
];

const itemClass =
  "flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100";

const cellClass = "border-r border-neutral-200 px-3";

type RowActions = {
  onView: (application: OrganizationApplication) => void;
  onDecide: (
    application: OrganizationApplication,
    decision: ApplicationDecision,
  ) => void;
};

/* Every onboarding request, filterable by status. */
export function ApplicationsTable({
  applications,
  ...actions
}: RowActions & {
  applications: OrganizationApplication[];
}): React.JSX.Element {
  const [status, setStatus] = React.useState<StatusFilter>("ALL");

  const rows =
    status === "ALL"
      ? applications
      : applications.filter((application) => application.status === status);

  return (
    <section className="rounded-xl bg-surface-default p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.15)] sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Applications</h2>
        <p className="mt-1 font-work text-sm text-text-secondary">
          {applications.length}{" "}
          {applications.length === 1 ? "request" : "requests"}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Filter by status"
        className="mt-4 flex max-w-full gap-3 overflow-x-auto"
      >
        {statusFilters.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "h-10 shrink-0 cursor-pointer rounded-full px-4 font-work text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-brand-primary-disabled/60 font-medium text-brand-primary"
                  : "bg-neutral-100 text-text-muted hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-neutral-100 font-work text-sm text-text-primary">
            <tr className="h-11">
              <th className={`${cellClass} font-normal`}>Academy</th>
              <th className={`${cellClass} font-normal`}>Applicant</th>
              <th className={`${cellClass} font-normal`}>Email</th>
              <th className={`${cellClass} font-normal`}>Status</th>
              <th className={`${cellClass} font-normal`}>Submitted on</th>
              <th className="w-14 px-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="font-work text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-text-muted">
                  No requests with this status.
                </td>
              </tr>
            ) : (
              rows.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  {...actions}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApplicationRow({
  application,
  onView,
  onDecide,
}: RowActions & { application: OrganizationApplication }) {
  return (
    <tr className="h-[52px]">
      <td className={`${cellClass} text-base text-text-primary`}>
        <button
          type="button"
          onClick={() => onView(application)}
          className="text-left hover:underline"
        >
          {application.academyName}
        </button>
      </td>
      <td className={`${cellClass} text-base text-text-primary`}>
        {application.fullName}
      </td>
      <td className={`${cellClass} text-text-secondary`}>{application.email}</td>
      <td className={cellClass}>
        <ApplicationStatusBadge application={application} />
      </td>
      <td className={`${cellClass} text-text-secondary`}>
        {shortDate(new Date(application.createdAt))}
      </td>
      <td className="px-3">
        <Menu.Root>
          <Menu.Trigger
            aria-label={`${application.academyName} actions`}
            className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={6} className="z-50">
              <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                <Menu.Item
                  onClick={() => onView(application)}
                  className={itemClass}
                >
                  View details
                </Menu.Item>
                {application.status === "NEW" && (
                  <Menu.Item
                    onClick={() => onDecide(application, "request-info")}
                    className={itemClass}
                  >
                    Request more info
                  </Menu.Item>
                )}
                {isOpenApplication(application) && (
                  <>
                    <Menu.Item
                      onClick={() => onDecide(application, "approve")}
                      className={itemClass}
                    >
                      Approve
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => onDecide(application, "decline")}
                      className={itemClass}
                    >
                      Decline
                    </Menu.Item>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </td>
    </tr>
  );
}
