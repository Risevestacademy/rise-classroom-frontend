"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

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
import { getUpdateUserErrorMessage, updateUser, type UpdateUserInput } from "@/lib/admin";
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

export function PersonalProfile({
  passwordHref = profileRoutes.password,
}: {
  passwordHref?: string;
}) {
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
              <SettingsLinkRow href={passwordHref} label="Password" />
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
  const { data: session } = useQuery(sessionQuery());
  // Only superadmins can change names and email, through the admin API.
  const canEditAccount = session?.user.role === "SUPERADMIN";
  const [firstName, setFirstName] = React.useState(me.firstName);
  const [lastName, setLastName] = React.useState(me.lastName);
  const [email, setEmail] = React.useState(me.email);
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
  const profileChanged = nameChanged || phoneChanged || !!image || isPreset;

  const account = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
  };
  const accountChanges: UpdateUserInput = {};
  if (account.firstName !== me.firstName) accountChanges.firstName = account.firstName;
  if (account.lastName !== me.lastName) accountChanges.lastName = account.lastName;
  if (account.email !== me.email) accountChanges.email = account.email;
  const accountChanged = Object.keys(accountChanges).length > 0;
  const firstNameError = account.firstName ? null : "First name is required.";
  const lastNameError = account.lastName ? null : "Last name is required.";
  const emailError =
    accountChanges.email !== undefined && !z.email().safeParse(account.email).success
      ? "Please enter a valid email address."
      : null;

  const canSubmit =
    (displayName.trim().length > 0 || !nameChanged) &&
    !phoneInvalid &&
    !firstNameError &&
    !lastNameError &&
    !emailError &&
    (profileChanged || accountChanged);

  const save = useMutation({
    mutationFn: async () => {
      let emailSent = false;
      if (accountChanged) {
        try {
          const { data } = await updateUser(me.id, accountChanges);
          emailSent = Boolean(data.emailSent);
        } catch (error) {
          throw new Error(getUpdateUserErrorMessage(error));
        }
      }
      if (profileChanged) {
        await updateMyProfile({
          displayName: nameChanged ? displayName.trim() : undefined,
          phoneNumber: phoneChanged ? phone.e164 : undefined,
          image: isPreset ? await presetAvatarFile(selected) : image,
        });
      }
      return emailSent;
    },
    onSuccess: (emailSent) => {
      void queryClient.invalidateQueries({ queryKey: profileQueries.me().queryKey });
      void queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
      if (accountChanged) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      }
      setToast({
        title: "Profile updated",
        message: emailSent
          ? `We sent a notice to ${account.email}.`
          : "Your personal profile has been saved.",
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
      {canEditAccount ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <AccountInput
              id="profile-first-name"
              label="First name"
              value={firstName}
              onChange={setFirstName}
              error={firstNameError}
            />
            <AccountInput
              id="profile-last-name"
              label="Last name"
              value={lastName}
              onChange={setLastName}
              error={lastNameError}
            />
          </div>
          <AccountInput
            id="profile-email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            error={emailError}
            hint={
              accountChanges.email !== undefined && !emailError
                ? "You'll sign in with this address. We'll send a notice there."
                : undefined
            }
          />
        </>
      ) : (
        <LockedField
          label="Full name"
          value={`${me.firstName} ${me.lastName}`.trim()}
        />
      )}
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

function AccountInput({
  id,
  label,
  type = "basic",
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  label: string;
  type?: "basic" | "email";
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        size="medium"
        leadingIcon={null}
        maxLength={100}
        aria-invalid={Boolean(error)}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
      />
      {error ? (
        <p className="text-xs text-text-error">{error}</p>
      ) : (
        hint && <p className="text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
}
