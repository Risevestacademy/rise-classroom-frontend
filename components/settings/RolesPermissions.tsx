import {
  SettingsLinkRow,
  SettingsPageTitle,
  SettingsSection,
} from "@/components/settings/SettingsSection";
import { academyRoles } from "@/lib/role-permissions";
import { settingsRoutes } from "@/lib/settings";

export function RolesPermissions(): React.JSX.Element {
  return (
    <>
      <SettingsPageTitle>Roles &amp; Permissions</SettingsPageTitle>

      <SettingsSection title="Academy roles" className="gap-0 py-3">
        {academyRoles.map((role) => (
          <SettingsLinkRow
            key={role.slug}
            href={`${settingsRoutes.roles}/${role.slug}`}
            label={role.name}
          />
        ))}
      </SettingsSection>
    </>
  );
}
