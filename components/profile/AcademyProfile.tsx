"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { PersonAvatar } from "@/components/PersonAvatar";
import {
  AvatarChoices,
  ProfileEditDialog,
  ProfileHeaderCard,
  ProfileInfoCard,
} from "@/components/profile/ProfileParts";
import { SettingsPageTitle } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import { LockedField } from "@/components/ui/locked-field";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";

/*
 * PENDING-BACKEND: the session only carries the academy's id and name. There's
 * no logo, website or dates yet, and no endpoint an academy admin can update
 * them with, so those show "—" and the dialog's Update stays off.
 */
export function AcademyProfile() {
  const { data: session, isPending } = useQuery(sessionQuery());
  const [editing, setEditing] = React.useState(false);
  const name = session?.user.organizationName ?? "Your academy";
  const logo = (
    <PersonAvatar
      name={name}
      colorKey={session?.user.organizationId ?? undefined}
      size={80}
    />
  );

  return (
    <>
      <SettingsPageTitle>Academy profile</SettingsPageTitle>

      {isPending ? (
        <Skeleton className="mt-6 h-28 max-w-[609px] rounded-2xl" />
      ) : (
        <ProfileHeaderCard
          avatar={logo}
          name={name}
          editLabel="Edit academy profile"
          onEdit={() => setEditing(true)}
        />
      )}

      <ProfileInfoCard
        title="Academy information"
        rows={[
          { label: "Date applied" },
          { label: "Date approved" },
          { label: "Last active" },
        ]}
      />

      <ProfileEditDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit academy profile"
        canSubmit={false}
        onSubmit={() => {}}
      >
        <LockedField label="Academy name" value={name} />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="academy-website"
            className="text-sm font-medium text-neutral-800"
          >
            Website
          </label>
          <Input
            id="academy-website"
            type="website"
            size="medium"
            placeholder="youracademy.com"
          />
        </div>
        <AvatarChoices
          choices={[{ key: "initials", label: "Academy initials", node: logo }]}
          selected="initials"
          onSelect={() => {}}
          onUpload={() => {}}
          onError={() => {}}
          disabled
        />
      </ProfileEditDialog>
    </>
  );
}
