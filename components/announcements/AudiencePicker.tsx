"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { useQuery } from "@tanstack/react-query";

import {
  ArrowDown01,
  ArrowRight01,
  Mentor,
  Teacher,
  Tie,
  Track,
  UserMultiple,
} from "@/assets/icons";
import { toggle } from "@/components/ui/filter-fields";
import { adminQueries } from "@/lib/admin";
import {
  audienceLabel,
  audienceRoles,
  type AnnouncementAudience,
  type AudienceRole,
} from "@/lib/announcements";
import { cn } from "@/lib/utils";

const roleIcons: Record<AudienceRole, React.ComponentType<{ className?: string }>> = {
  STUDENT: UserMultiple,
  INSTRUCTOR: Teacher,
  MENTOR: Mentor,
};

const popupClass =
  "rounded-lg bg-white p-2 shadow-[0_6px_14px_rgb(15_13_38/0.14)] outline-none";
const rowClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-2 text-text-primary outline-none select-none data-[highlighted]:bg-surface-subtle data-[popup-open]:bg-surface-subtle";

function Popup({
  className,
  sub,
  children,
}: {
  className?: string;
  sub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        className="z-50 outline-none"
        side={sub ? "right" : "bottom"}
        align="start"
        sideOffset={sub ? 12 : 4}
        alignOffset={sub ? -8 : 0}
      >
        <Menu.Popup className={cn(popupClass, className)}>{children}</Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Menu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(rowClass, "h-8 text-sm")}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]",
          checked
            ? "border-brand-950 bg-brand-950 text-white"
            : "border-text-secondary bg-white",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
            <path d="m2.5 6.25 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </Menu.CheckboxItem>
  );
}

/**
 * The announcement form's Audience field: everyone, a single role, or a
 * specific group of roles or tracks.
 */
export function AudiencePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: AnnouncementAudience | null;
  onChange: (value: AnnouncementAudience | null) => void;
}) {
  const tracksQuery = useQuery(adminQueries.tracks("ACTIVE"));
  const roles = value?.type === "ROLES" ? value.roles : [];
  const tracks = value?.type === "TRACKS" ? value.tracks : [];

  const setRoles = (next: AudienceRole[]) =>
    onChange(next.length ? { type: "ROLES", roles: next } : null);
  const setTracks = (next: { id: string; name: string }[]) =>
    onChange(next.length ? { type: "TRACKS", tracks: next } : null);

  const options = [
    { key: "EVERYONE", label: "Everyone", hint: "All members in the academy", icon: UserMultiple },
    ...audienceRoles.map((role) => ({ key: role.value, label: role.label, hint: role.hint, icon: roleIcons[role.value] })),
  ];

  return (
    <Menu.Root>
      <Menu.Trigger
        id={id}
        className="flex h-9 w-full min-w-0 items-center gap-2.5 rounded-lg border border-border-default px-2.5 text-left text-sm text-text-primary outline-none transition-colors hover:bg-surface-subtle focus-visible:border-border-focus data-[popup-open]:border-border-focus"
      >
        <UserMultiple className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {value ? audienceLabel(value) : "Select audience"}
        </span>
        <ArrowDown01 className="size-4 shrink-0" />
      </Menu.Trigger>

      <Popup className="w-65">
        {options.map(({ key, label, hint, icon: Icon }) => (
          <Menu.Item
            key={key}
            onClick={() =>
              onChange(
                key === "EVERYONE"
                  ? { type: "EVERYONE" }
                  : { type: "ROLES", roles: [key as AudienceRole] },
              )
            }
            className={cn(rowClass, "h-11")}
          >
            <Icon className="size-5 shrink-0" />
            <span className="flex flex-col">
              <span className="text-xs font-medium">{label}</span>
              <span className="text-[11px]/4 text-text-secondary">{hint}</span>
            </span>
          </Menu.Item>
        ))}

        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger className={cn(rowClass, "mt-1 h-9.5")}>
            <UserMultiple className="size-5 shrink-0" />
            <span className="flex-1 text-xs font-medium">Specific group</span>
            <ArrowRight01 className="size-4.5 shrink-0" />
          </Menu.SubmenuTrigger>

          <Popup sub className="flex w-44.5 flex-col gap-1">
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={cn(rowClass, "h-9")}>
                <Track className="size-5 shrink-0" />
                <span className="flex-1 text-xs font-medium">By track</span>
                <ArrowRight01 className="size-4.5 shrink-0" />
              </Menu.SubmenuTrigger>
              <Popup sub className="w-54.5">
                {tracksQuery.isPending ? (
                  <p className="px-2 py-1.5 text-sm text-text-muted">Loading tracks…</p>
                ) : tracksQuery.isError ? (
                  <Menu.Item
                    closeOnClick={false}
                    onClick={() => tracksQuery.refetch()}
                    className={cn(rowClass, "h-8 text-sm text-text-error")}
                  >
                    Couldn&apos;t load tracks. Retry
                  </Menu.Item>
                ) : tracksQuery.data?.length ? (
                  tracksQuery.data.map((track) => (
                    <CheckRow
                      key={track.id}
                      label={track.name}
                      checked={tracks.some((item) => item.id === track.id)}
                      onCheckedChange={(checked) =>
                        setTracks(
                          checked
                            ? [...tracks, { id: track.id, name: track.name }]
                            : tracks.filter((item) => item.id !== track.id),
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-sm text-text-muted">No active tracks</p>
                )}
              </Popup>
            </Menu.SubmenuRoot>

            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={cn(rowClass, "h-9")}>
                <Tie className="size-5 shrink-0" />
                <span className="flex-1 text-xs font-medium">By role</span>
                <ArrowRight01 className="size-4.5 shrink-0" />
              </Menu.SubmenuTrigger>
              <Popup sub className="w-54.5">
                {audienceRoles.map((role) => (
                  <CheckRow
                    key={role.value}
                    label={role.label}
                    checked={roles.includes(role.value)}
                    onCheckedChange={(checked) =>
                      setRoles(toggle(roles, role.value, checked))
                    }
                  />
                ))}
              </Popup>
            </Menu.SubmenuRoot>
          </Popup>
        </Menu.SubmenuRoot>
      </Popup>
    </Menu.Root>
  );
}
