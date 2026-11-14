"use client";

import * as React from "react";

import { SettingsSwitch } from "@/components/settings/SettingsControls";
import {
  SettingsPageTitle,
  SettingsRow,
  SettingsSection,
  settingsSelectClass,
} from "@/components/settings/SettingsSection";
import { MultiSelectInput } from "@/components/ui/select";
import {
  notificationChannels,
  notificationEvents,
  notificationRecipientDefaults,
  notificationRecipientLabels,
  type NotificationRecipient,
  type NotificationToggle,
} from "@/lib/notification-settings";
import { cn } from "@/lib/utils";

type Toggles = {
  values: Record<string, boolean>;
  set: (key: string, checked: boolean) => void;
};

/* A switch per item, all on to begin with. */
function useToggles(items: NotificationToggle[]): Toggles {
  const [values, setValues] = React.useState(() =>
    Object.fromEntries(items.map((item) => [item.key, true])),
  );
  return {
    values,
    set: (key, checked) =>
      setValues((current) => ({ ...current, [key]: checked })),
  };
}

export function NotificationSettings(): React.JSX.Element {
  /* PENDING-BACKEND: notification settings can't be loaded or saved yet. */
  const channels = useToggles(notificationChannels);
  const events = useToggles(notificationEvents);
  const recipients = useToggles(notificationRecipientDefaults);
  const [eventRecipients, setEventRecipients] = React.useState<
    Record<string, NotificationRecipient[]>
  >(() =>
    Object.fromEntries(
      notificationEvents.map((event) => [event.key, event.recipients]),
    ),
  );

  return (
    <>
      <SettingsPageTitle>Notifications</SettingsPageTitle>
      <ToggleSection
        title="Notification channels"
        description="Choose the channels to use for academy notifications"
        items={notificationChannels}
        toggles={channels}
      />
      <ToggleSection
        title="Notification events"
        description="Select the events that should trigger notifications and who should receive them."
        items={notificationEvents}
        toggles={events}
        renderExtra={(event) => (
          <EventRecipients
            eventLabel={event.label}
            value={eventRecipients[event.key]}
            onChange={(value) =>
              setEventRecipients((current) => ({
                ...current,
                [event.key]: value,
              }))
            }
            disabled={!events.values[event.key]}
          />
        )}
      />
      <ToggleSection
        title="Recipient default"
        description="Set the default recipients for academy notifications"
        items={notificationRecipientDefaults}
        toggles={recipients}
      />
    </>
  );
}

function ToggleSection({
  title,
  description,
  items,
  toggles,
  renderExtra,
}: {
  title: string;
  description: string;
  items: NotificationToggle[];
  toggles: Toggles;
  /* Sits before an item's switch. */
  renderExtra?: (item: NotificationToggle) => React.ReactNode;
}) {
  return (
    <SettingsSection title={title} description={description}>
      {items.map((item) => {
        const labelId = `notification-${item.key}`;
        return (
          <SettingsRow
            key={item.key}
            label={item.label}
            description={item.description}
            labelId={labelId}
          >
            {renderExtra?.(item)}
            <SettingsSwitch
              aria-labelledby={labelId}
              checked={toggles.values[item.key]}
              onCheckedChange={(checked) => toggles.set(item.key, checked)}
            />
          </SettingsRow>
        );
      })}
    </SettingsSection>
  );
}

function EventRecipients({
  eventLabel,
  value,
  onChange,
  disabled,
}: {
  eventLabel: string;
  value: NotificationRecipient[];
  onChange: (value: NotificationRecipient[]) => void;
  disabled: boolean;
}) {
  return (
    <MultiSelectInput
      aria-label={`Who receives "${eventLabel}"`}
      value={value}
      /* No "all" option is offered, so this is always a list. */
      onChange={(next) => onChange(next === "all" ? [] : next)}
      options={notificationRecipientLabels}
      placeholder="No one"
      disabled={disabled}
      className={cn(settingsSelectClass, "w-50 max-sm:flex-1")}
    />
  );
}
