"use client";

import { useQuery } from "@tanstack/react-query";

import { PersonAvatar } from "@/components/PersonAvatar";
import type { ApplicationDecision } from "@/components/platform-admin/ApplicationDecisionDialog";
import {
  AcademyFacts,
  AwaitingSetupBadge,
  DetailsPanel,
  PanelField,
  PanelSection,
} from "@/components/platform-admin/DetailsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shortDate } from "@/lib/calendar";
import {
  isApplicationAwaitingSetup,
  isOpenApplication,
  platformQueries,
  type ApplicationEvent,
  type ApplicationStatus,
  type OrganizationApplication,
} from "@/lib/platform";
import { learnerCountLabel, learningSpaceLabel } from "@/lib/sign-up";

const statuses: Record<
  ApplicationStatus,
  { label: string; tone: "info" | "warning" | "success" | "error" }
> = {
  NEW: { label: "New", tone: "info" },
  INFO_REQUESTED: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  DECLINED: { label: "Declined", tone: "error" },
};

export function ApplicationStatusBadge({
  application,
}: {
  application: OrganizationApplication;
}): React.JSX.Element {
  if (isApplicationAwaitingSetup(application)) return <AwaitingSetupBadge />;
  const { label, tone } = statuses[application.status];
  return (
    <Badge variant="light" status={tone}>
      {label}
    </Badge>
  );
}

const eventLabels: Record<ApplicationEvent["type"], string> = {
  SUBMITTED: "Application submitted",
  INFO_REQUESTED: "More information requested",
  RESUBMITTED: "Applicant replied",
  APPROVED: "Application approved",
  DECLINED: "Application declined",
};

/* One application: who applied, their academy, and what's happened to it.
   An application still in review can be approved or declined from here. */
export function ApplicationDetailsPanel({
  application,
  onClose,
  onDecide,
}: {
  application: OrganizationApplication | null;
  onClose: () => void;
  onDecide: (decision: ApplicationDecision) => void;
}): React.JSX.Element {
  return (
    <DetailsPanel
      title="Application details"
      open={application !== null}
      onClose={onClose}
      footer={
        application &&
        isOpenApplication(application) && (
          <>
            {application.status === "NEW" && (
              <Button
                variant="secondary"
                size="lg"
                className="border-neutral-200 text-neutral-800"
                onClick={() => onDecide("request-info")}
              >
                Request info
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              className="border-neutral-200 text-neutral-800"
              onClick={() => onDecide("decline")}
            >
              Decline
            </Button>
            <Button size="lg" onClick={() => onDecide("approve")}>
              Approve
            </Button>
          </>
        )
      }
    >
      {application && <ApplicationBody application={application} />}
    </DetailsPanel>
  );
}

function ApplicationBody({
  application,
}: {
  application: OrganizationApplication;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border-default py-4">
        <PersonAvatar
          name={application.fullName}
          colorKey={application.id}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-work text-sm font-medium text-text-primary">
            {application.fullName}
          </p>
          <p className="truncate font-work text-xs text-text-secondary">
            {application.email}
          </p>
        </div>
        <ApplicationStatusBadge application={application} />
      </div>

      <PanelSection title="Academy information">
        <AcademyFacts
          name={application.academyName}
          website={application.website}
          learningSpace={learningSpaceLabel(application.learningSpaceType)}
          learners={learnerCountLabel(application.estimatedLearners)}
        />
      </PanelSection>

      <PanelSection title="Application">
        <div className="flex flex-col gap-3">
          <PanelField
            label="Date applied"
            value={shortDate(new Date(application.createdAt))}
          />
          <PanelField
            label="Date reviewed"
            value={
              application.reviewedAt
                ? shortDate(new Date(application.reviewedAt))
                : "--"
            }
          />
        </div>
      </PanelSection>

      <PanelSection title="History">
        <ApplicationHistory applicationId={application.id} />
      </PanelSection>
    </>
  );
}

function ApplicationHistory({ applicationId }: { applicationId: string }) {
  const details = useQuery(platformQueries.application(applicationId));

  if (details.isPending) return <Skeleton className="h-10 w-full" />;
  if (details.isError) {
    return (
      <p className="font-work text-sm text-text-secondary">
        We couldn&apos;t load the history.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {details.data.events.map((event) => (
        <li key={event.id} className="font-work">
          <p className="text-sm text-text-primary">{eventLabels[event.type]}</p>
          <p className="text-xs text-text-secondary">
            {shortDate(new Date(event.createdAt))} ·{" "}
            {event.actor?.name ?? "Applicant"}
          </p>
          {event.message && (
            <p className="mt-1 rounded-lg bg-surface-default p-2 text-sm break-words text-text-primary">
              {event.message}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
