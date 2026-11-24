"use client";

import * as React from "react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { AcademyStatusDialog } from "@/components/platform-admin/AcademyStatusDialog";
import {
  AcademyFacts,
  AwaitingSetupBadge,
  DetailsPanel,
  PanelField,
  PanelSection,
} from "@/components/platform-admin/DetailsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/calendar";
import { isAwaitingSetup, type Academy } from "@/lib/platform";
import { learnerCountLabel, learningSpaceLabel } from "@/lib/sign-up";

const notAvailable = "--";

const dateOrDash = (date: string | null | undefined) =>
  date ? shortDate(new Date(date)) : notAvailable;

export function AcademyDetailsPanel({
  academy,
  onClose,
}: {
  academy: Academy | null;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const suspended = academy?.status === "SUSPENDED";
  const application = academy?.application;

  return (
    <DetailsPanel
      title="Academy details"
      open={academy !== null}
      onClose={onClose}
      footer={
        academy && (
          <Button
            variant={suspended ? "primary" : "destructive"}
            size="lg"
            onClick={() => setConfirming(true)}
          >
            {suspended ? "Reactivate academy" : "Suspend academy"}
          </Button>
        )
      }
    >
      {academy && (
        <>
          <div className="flex items-center gap-3 border-b border-border-default py-4">
            <PersonAvatar name={academy.name} colorKey={academy.id} size={40} />
            <p className="min-w-0 flex-1 truncate font-work text-sm font-medium text-text-primary">
              {academy.name}
            </p>
            <StatusBadge academy={academy} />
          </div>

          <PanelSection title="Academy information">
            <AcademyFacts
              name={academy.name}
              website={application?.website ?? null}
              learningSpace={
                application
                  ? learningSpaceLabel(application.learningSpaceType)
                  : notAvailable
              }
              learners={
                application
                  ? learnerCountLabel(application.estimatedLearners)
                  : notAvailable
              }
            />
          </PanelSection>

          <PanelSection title="Super Admin">
            <SuperAdmin academy={academy} />
          </PanelSection>

          <PanelSection title="Account information">
            <div className="flex flex-col gap-3">
              <PanelField
                label="Date applied"
                value={dateOrDash(application?.createdAt)}
              />
              <PanelField
                label="Date created"
                value={dateOrDash(academy.createdAt)}
              />
              <PanelField
                label="Last active"
                value={dateOrDash(academy.admin?.lastActiveAt)}
              />
            </div>
          </PanelSection>

          <AcademyStatusDialog
            academy={academy}
            open={confirming}
            onOpenChange={setConfirming}
          />
        </>
      )}
    </DetailsPanel>
  );
}

export function StatusBadge({ academy }: { academy: Academy }) {
  if (isAwaitingSetup(academy)) return <AwaitingSetupBadge />;
  const suspended = academy.status === "SUSPENDED";
  return (
    <Badge variant="light" status={suspended ? "error" : "success"}>
      {suspended ? "Suspended" : "Active"}
    </Badge>
  );
}

function SuperAdmin({ academy }: { academy: Academy }) {
  const admin = academy.admin;
  if (!admin) {
    return (
      <p className="font-work text-sm text-text-secondary">{notAvailable}</p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <PersonAvatar name={admin.name} colorKey={admin.id} size={40} />
      <div className="min-w-0">
        <p className="truncate font-work text-sm font-medium text-text-primary">
          {admin.name}
        </p>
        <p className="truncate font-work text-xs text-text-secondary">
          {admin.email}
        </p>
      </div>
    </div>
  );
}
