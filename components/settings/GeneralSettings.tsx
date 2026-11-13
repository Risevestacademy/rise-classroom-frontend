"use client";

import * as React from "react";

import {
  SettingsPageTitle,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/SettingsSection";
import { SelectInput } from "@/components/ui/select";
import {
  defaultGeneralSettings,
  generalSettingGroups,
  type GeneralSettingKey,
} from "@/lib/general-settings";

export function GeneralSettings(): React.JSX.Element {
  /* No backend yet. */
  const [values, setValues] = React.useState(defaultGeneralSettings);

  const setValue = (key: GeneralSettingKey, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <>
      <SettingsPageTitle>General settings</SettingsPageTitle>

      {generalSettingGroups.map((group) => (
        <SettingsSection key={group.title} title={group.title}>
          {group.settings.map((setting) => (
            <SettingsRow
              key={setting.key}
              label={setting.label}
              description={setting.description}
            >
              <SelectInput
                aria-label={setting.label}
                value={values[setting.key]}
                onChange={(value) => setValue(setting.key, value)}
                options={setting.options}
                className="h-9 w-full border-transparent bg-surface-subtle px-2.5 hover:bg-neutral-200 sm:w-50"
              />
            </SettingsRow>
          ))}
        </SettingsSection>
      ))}
    </>
  );
}
