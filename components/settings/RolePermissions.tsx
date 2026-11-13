"use client";

import * as React from "react";

import { SettingsSwitch } from "@/components/settings/SettingsControls";
import {
  SettingsPageTitle,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/SettingsSection";
import type { AcademyRole } from "@/lib/role-permissions";
import { settingsRoutes } from "@/lib/settings";

/* What one role is allowed to do, a switch per area. */
export function RolePermissions({
  role,
}: {
  role: AcademyRole;
}): React.JSX.Element {
  /* PENDING-BACKEND: role permissions can't be loaded or saved yet. */
  const [enabled, setEnabled] = React.useState(() =>
    Object.fromEntries(
      role.permissions.map((permission) => [permission.key, permission.enabled]),
    ),
  );

  return (
    <>
      <SettingsPageTitle
        backHref={settingsRoutes.roles}
        backLabel="Back to Roles & Permissions"
      >
        Roles &amp; Permissions / {role.name}
      </SettingsPageTitle>

      <SettingsSection title={role.name} description={role.description}>
        {role.permissions.map((permission) => {
          const labelId = `permission-${permission.key}`;
          return (
            <SettingsRow
              key={permission.key}
              label={permission.label}
              description={permission.description}
              labelId={labelId}
            >
              <SettingsSwitch
                aria-labelledby={labelId}
                checked={enabled[permission.key]}
                disabled={role.locked}
                onCheckedChange={(checked) =>
                  setEnabled((current) => ({
                    ...current,
                    [permission.key]: checked,
                  }))
                }
              />
            </SettingsRow>
          );
        })}
      </SettingsSection>
    </>
  );
}
