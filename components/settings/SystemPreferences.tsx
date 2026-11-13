import {
  SettingsLinkRow,
  SettingsPageTitle,
  SettingsSection,
} from "@/components/settings/SettingsSection";
import { settingsRoutes } from "@/lib/settings";
import { systemPreferenceGroups } from "@/lib/system-preferences";

export function SystemPreferences(): React.JSX.Element {
  return (
    <>
      <SettingsPageTitle>System preferences</SettingsPageTitle>

      {systemPreferenceGroups.map((group) => (
        <SettingsSection
          key={group.title}
          title={group.title}
          description={group.description}
          className="gap-2 py-4"
        >
          {group.pages.map((page) => (
            <SettingsLinkRow
              key={page.slug}
              href={`${settingsRoutes.system}/${page.slug}`}
              label={page.title}
              description={page.description}
            />
          ))}
        </SettingsSection>
      ))}
    </>
  );
}
