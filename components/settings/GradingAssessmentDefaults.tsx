"use client";

import * as React from "react";

import {
  SettingsCheckboxList,
  SettingsRadioList,
} from "@/components/settings/SettingsControls";
import { SettingsCard } from "@/components/settings/SettingsSection";
import {
  assessmentTypes,
  defaultAssessmentTypes,
  gradeScale,
  gradingSystems,
  type GradingSystem,
} from "@/lib/system-preferences";
import { cn } from "@/lib/utils";

/* No backend yet. */

export function GradingAssessmentDefaults(): React.JSX.Element {
  const [gradingSystem, setGradingSystem] =
    React.useState<GradingSystem>("percentage");
  const [types, setTypes] = React.useState(defaultAssessmentTypes);

  return (
    <>
      <SettingsCard
        title="Grading system"
        description="Choose how student performance is graded across your academy"
        titleId="grading-system"
      >
        <SettingsRadioList
          aria-labelledby="grading-system"
          choices={gradingSystems}
          value={gradingSystem}
          onChange={setGradingSystem}
        />
      </SettingsCard>

      <GradeScaleCard />

      <SettingsCard
        title="Assessment types"
        description="Choose the assessment types available to instructors when creating learning assessments."
        titleId="assessment-types"
      >
        <SettingsCheckboxList
          aria-labelledby="assessment-types"
          choices={assessmentTypes}
          value={types}
          onChange={setTypes}
        />
      </SettingsCard>
    </>
  );
}

/* PENDING-DESIGN: the ranges are shown as fixed values; there's no design
   for changing them. */
function GradeScaleCard() {
  return (
    <SettingsCard
      title="Grade scale"
      description="Define the grade ranges for letter grades"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-x-2 border-spacing-y-4 text-left">
          <tbody>
            <ScaleRow
              label="Letter grade"
              values={gradeScale.map(({ grade }) => grade)}
              cellClassName="bg-brand-50 text-lg"
            />
            <ScaleRow
              label="Range (percentage)"
              values={gradeScale.map(({ range }) => range)}
              cellClassName="bg-surface-subtle font-work text-sm"
            />
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

function ScaleRow({
  label,
  values,
  cellClassName,
}: {
  label: string;
  values: string[];
  cellClassName: string;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="pr-2 font-work text-sm font-normal whitespace-nowrap text-text-primary"
      >
        {label}
      </th>
      {values.map((value) => (
        <td key={value}>
          <span
            className={cn(
              "flex h-9 min-w-20 flex-1 items-center justify-center rounded-md px-2 whitespace-nowrap text-text-primary",
              cellClassName,
            )}
          >
            {value}
          </span>
        </td>
      ))}
    </tr>
  );
}
