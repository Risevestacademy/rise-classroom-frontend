"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isValidPhoneNumber } from "libphonenumber-js";

import { PersonAvatar } from "@/components/PersonAvatar";
import {
  AvatarChoices,
  ProfileEditDialog,
  ProfileHeaderCard,
  ProfileInfoCard,
} from "@/components/profile/ProfileParts";
import { useSettings } from "@/components/settings/SettingsContext";
import {
  SettingsLinkRow,
  SettingsPageTitle,
  settingsCardClass,
} from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import { LockedField } from "@/components/ui/locked-field";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorDetails } from "@/lib/api";
import {
  presetAvatarFile,
  presetAvatars,
  profileQueries,
  profileRoutes,
  updateMyProfile,
  type MyProfile,
} from "@/lib/profile";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

export function PersonalProfile() {
  const { data: me, isPending, isError } = useQuery(profileQueries.me());
  const [editing, setEditing] = React.useState(false);

  const fullName = me ? `${me.firstName} ${me.lastName}`.trim() : "";

  return (
    <>
      <SettingsPageTitle>Personal profile</SettingsPageTitle>

      {isError ? (
        <p className="mt-6 font-work text-sm text-text-error">
          We couldn&apos;t load your profile. Refresh to try again.
        </p>
      ) : isPending ? (
        <>
          <Skeleton className="mt-6 h-28 max-w-[609px] rounded-2xl" />
          <Skeleton className="mt-4 h-60 max-w-[609px] rounded-2xl" />
        </>
      ) : (
        <>
          <ProfileHeaderCard
            avatar={<MyAvatar me={me} />}
            name={me.displayName || fullName}
            detail={me.email}
            editLabel="Edit personal profile"
            onEdit={() => setEditing(true)}
          />

          <ProfileInfoCard
            title="Personal information"
            wideValues
            rows={[
              { label: "Full name", value: fullName },
              { label: "Nick name", value: me.displayName },
              { label: "Email address", value: me.email },
              { label: "Phone number", value: me.phoneNumber },
            ]}
          />

          <section className="mt-8 max-w-[609px]">
            <h3 className="text-lg font-medium text-text-primary">Security</h3>
            <div className={cn(settingsCardClass, "mt-3 px-4 py-2")}>
              <SettingsLinkRow href={profileRoutes.password} label="Password" />
            </div>
          </section>

          {/* Remounts on open so the form starts from the saved profile. */}
          {editing && (
            <EditPersonalProfileDialog me={me} onClose={() => setEditing(false)} />
          )}
        </>
      )}
    </>
  );
}

function MyAvatar({ me, src }: { me: MyProfile; src?: string | null }) {
  return (
    <PersonAvatar
      name={me.displayName || `${me.firstName} ${me.lastName}`}
      src={src === undefined ? me.image : src}
      colorKey={me.id}
      size={80}
    />
  );
}

function EditPersonalProfileDialog({
  me,
  onClose,
}: {
  me: MyProfile;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { setToast } = useSettings();
  const [displayName, setDisplayName] = React.useState(me.displayName ?? "");
  const [phone, setPhone] = React.useState({
    national: me.phoneNumber ?? "",
    e164: me.phoneNumber ?? "",
  });
  const [upload, setUpload] = React.useState<{ file: File; url: string } | null>(
    null,
  );
  const [selected, setSelected] = React.useState("current");
  const [imageError, setImageError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (upload) URL.revokeObjectURL(upload.url);
    };
  }, [upload]);

  const isPreset = presetAvatars.includes(selected);
  const image = selected === "upload" ? upload?.file : undefined;
  const nameChanged = displayName.trim() !== (me.displayName ?? "");
  const phoneChanged = phone.e164 !== (me.phoneNumber ?? "");
  const phoneInvalid =
    phone.national.trim() !== "" && !isValidPhoneNumber(phone.e164 || "");
  const canSubmit =
    displayName.trim().length > 0 &&
    !phoneInvalid &&
    (nameChanged || phoneChanged || !!image || isPreset);

  const save = useMutation({
    mutationFn: async () =>
      updateMyProfile({
        displayName: nameChanged ? displayName.trim() : undefined,
        phoneNumber: phoneChanged ? phone.e164 : undefined,
        image: isPreset ? await presetAvatarFile(selected) : image,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueries.me().queryKey, updated);
      void queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
      setToast({
        title: "Profile updated",
        message: "Your personal profile has been saved.",
      });
      onClose();
    },
  });

  const choices = [
    { key: "current", label: "Current picture", node: <MyAvatar me={me} /> },
    ...(upload
      ? [
          {
            key: "upload",
            label: "Uploaded picture",
            node: <MyAvatar me={me} src={upload.url} />,
          },
        ]
      : []),
    ...presetAvatars.map((src, index) => ({
      key: src,
      label: `Avatar ${index + 1}`,
      node: <MyAvatar me={me} src={src} />,
    })),
  ];

  return (
    <ProfileEditDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Edit personal profile"
      canSubmit={canSubmit}
      isPending={save.isPending}
      error={
        imageError ?? (save.isError ? apiErrorDetails(save.error).message : null)
      }
      onSubmit={() => save.mutate()}
    >
      <LockedField
        label="Full name"
        value={`${me.firstName} ${me.lastName}`.trim()}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-nickname"
          className="text-sm font-medium text-neutral-800"
        >
          Nickname
        </label>
        <Input
          id="profile-nickname"
          size="medium"
          leadingIcon={null}
          maxLength={100}
          placeholder="What should people call you?"
          value={displayName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setDisplayName(event.target.value)
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-phone"
          className="text-sm font-medium text-neutral-800"
        >
          Phone number
        </label>
        <Input
          id="profile-phone"
          type="phone-number"
          size="medium"
          defaultNumber={me.phoneNumber}
          invalid={phoneInvalid}
          onValueChange={({ national, e164 }) => setPhone({ national, e164 })}
        />
        {phoneInvalid && (
          <p className="text-xs text-text-error">
            Enter a valid phone number for that country.
          </p>
        )}
      </div>
      <AvatarChoices
        choices={choices}
        selected={selected}
        onSelect={setSelected}
        onError={setImageError}
        onUpload={(file) => {
          setUpload({ file, url: URL.createObjectURL(file) });
          setSelected("upload");
        }}
      />
    </ProfileEditDialog>
  );
}
