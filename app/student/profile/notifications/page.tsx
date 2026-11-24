"use client";

import { SettingsSwitch } from "@/components/settings/SettingsControls";
import {
  ProfileColumn,
  ProfileSubpageHeader,
  SectionCard,
} from "@/components/student-settings/ProfileParts";
import {
  notificationPreferenceOptions,
  useNotificationPreferences,
} from "@/lib/profile";

export default function NotificationSettingsPage() {
  const { preferences, setPreference } = useNotificationPreferences();

  return (
    <ProfileColumn>
      <ProfileSubpageHeader
        title="Notification settings"
        description="Choose what you want to be notified about"
      />
      <SectionCard className="overflow-hidden">
        <ul className="divide-y divide-neutral-200">
          {notificationPreferenceOptions.map((option) => {
            const labelId = `notification-${option.key}`;
            return (
              <li
                key={option.key}
                className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p id={labelId} className="text-sm font-medium text-neutral-800">
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{option.description}</p>
                </div>
                <SettingsSwitch
                  aria-labelledby={labelId}
                  checked={preferences[option.key]}
                  onCheckedChange={(checked) => setPreference(option.key, checked)}
                />
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </ProfileColumn>
  );
}
