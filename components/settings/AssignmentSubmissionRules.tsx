"use client";

import * as React from "react";

import {
  SettingsRadioList,
  SettingsSelectField,
  SettingsSwitch,
} from "@/components/settings/SettingsControls";
import { SettingsCard } from "@/components/settings/SettingsSection";
import {
  deadlineDurations,
  deadlineModes,
  latePenalties,
  latePolicies,
  resubmissionGrades,
  resubmissionLimits,
  type DeadlineMode,
  type LatePolicy,
} from "@/lib/system-preferences";

/* No backend yet. */

export function AssignmentSubmissionRules(): React.JSX.Element {
  return (
    <>
      <SubmissionDeadlineCard />
      <LateSubmissionsCard />
      <ResubmissionsCard />
    </>
  );
}

function SubmissionDeadlineCard() {
  const [mode, setMode] = React.useState<DeadlineMode>("instructor");
  const [duration, setDuration] = React.useState("7");

  return (
    <SettingsCard
      title="Submission deadline"
      description="Define how deadlines work for assignments"
      titleId="submission-deadline"
    >
      <SettingsRadioList
        aria-labelledby="submission-deadline"
        choices={deadlineModes}
        value={mode}
        onChange={setMode}
        renderExtra={(choice) =>
          choice === "default" && (
            <SettingsSelectField
              label="Default duration"
              value={duration}
              onChange={setDuration}
              options={deadlineDurations}
              disabled={mode !== "default"}
              className="w-50"
            />
          )
        }
      />
    </SettingsCard>
  );
}

/* A card whose switch turns its fields on; they're hidden while it's off. */
function ToggleCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <SettingsCard
      title={title}
      description={description}
      titleId={id}
      action={
        <SettingsSwitch
          aria-labelledby={id}
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      }
    >
      {enabled && (
        <div className="flex flex-wrap gap-x-8 gap-y-4">{children}</div>
      )}
    </SettingsCard>
  );
}

function LateSubmissionsCard() {
  const [policy, setPolicy] = React.useState<LatePolicy>("penalty");
  const [penalty, setPenalty] = React.useState("10");

  return (
    <ToggleCard
      id="late-submissions"
      title="Late submissions"
      description="Control whether students can submit after the deadline"
    >
      <SettingsSelectField
        label="Late submission policy"
        value={policy}
        onChange={setPolicy}
        options={latePolicies}
        className="w-50"
      />
      {policy === "penalty" && (
        <SettingsSelectField
          label="Penalty"
          value={penalty}
          onChange={setPenalty}
          options={latePenalties}
          className="w-26"
        >
          <span className="font-work text-sm text-text-secondary">
            grade reduction
          </span>
        </SettingsSelectField>
      )}
    </ToggleCard>
  );
}

function ResubmissionsCard() {
  const [limit, setLimit] = React.useState("2");
  const [gradeToUse, setGradeToUse] = React.useState("latest");

  return (
    <ToggleCard
      id="resubmissions"
      title="Resubmissions"
      description="Set if and how students can resubmit their work"
    >
      <SettingsSelectField
        label="Maximum resubmissions"
        value={limit}
        onChange={setLimit}
        options={resubmissionLimits}
        className="w-50"
      />
      <SettingsSelectField
        label="Grades to use"
        value={gradeToUse}
        onChange={setGradeToUse}
        options={resubmissionGrades}
        className="w-56"
      />
    </ToggleCard>
  );
}
