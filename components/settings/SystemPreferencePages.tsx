"use client";

import { AssignmentSubmissionRules } from "@/components/settings/AssignmentSubmissionRules";
import { GradingAssessmentDefaults } from "@/components/settings/GradingAssessmentDefaults";
import { LearningMaterialsPreferences } from "@/components/settings/LearningMaterialsPreferences";
import { SettingsPageTitle } from "@/components/settings/SettingsSection";
import { settingsRoutes } from "@/lib/settings";
import type { SystemPreferencePage as SystemPreferencePageInfo } from "@/lib/system-preferences";

/* The designed pages, by the slug in `systemPreferenceGroups`. */
const pages: Record<string, React.ComponentType> = {
  "assignment-submissions": AssignmentSubmissionRules,
  "grading-assessment": GradingAssessmentDefaults,
  "learning-materials": LearningMaterialsPreferences,
};

export function SystemPreferencePage({
  page,
}: {
  page: SystemPreferencePageInfo;
}): React.JSX.Element {
  const Content = pages[page.slug];

  return (
    <>
      <SettingsPageTitle
        backHref={settingsRoutes.system}
        backLabel="Back to System preferences"
      >
        System preferences / {page.title}
      </SettingsPageTitle>
      {Content ? (
        <div className="mt-4">
          <Content />
        </div>
      ) : (
        /* PENDING-DESIGN: this page isn't designed yet. */
        <p className="mt-3 font-work text-sm text-text-secondary">
          These settings aren&apos;t available yet.
        </p>
      )}
    </>
  );
}
