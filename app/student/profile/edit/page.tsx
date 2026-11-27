"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { LockedField } from "@/components/ui/locked-field";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import { LoadErrorPanel } from "@/components/control-tower/ControlTowerParts";
import {
  PROFILE_PATH,
  ProfileColumn,
  ProfileSubpageHeader,
  SectionCard,
} from "@/components/student-settings/ProfileParts";
import { ProfilePhoto } from "@/components/student-settings/ChangePhotoDialog";
import { ApiError } from "@/lib/api";
import {
  currentMembership,
  fullNameOf,
  isValidPhoneNumber,
  profileQueries,
  updateMyProfile,
  type MyProfile,
} from "@/lib/profile";
import { sessionQuery } from "@/lib/session-query";

export default function EditProfilePage() {
  const profile = useQuery(profileQueries.me());

  return (
    <ProfileColumn>
      <ProfileSubpageHeader
        title="Edit profile"
        description="Update your display name and phone number"
      />
      {profile.isPending ? (
        <EditProfileSkeleton />
      ) : profile.error || !profile.data ? (
        <LoadErrorPanel
          title="Couldn’t load your profile"
          onRetry={() => profile.refetch()}
        />
      ) : (
        <EditProfileForm profile={profile.data} />
      )}
    </ProfileColumn>
  );
}

function EditProfileForm({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialName = profile.displayName?.trim() ?? "";
  const initialPhone = profile.phoneNumber ?? "";
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [submitted, setSubmitted] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const nameError =
    submitted && !trimmedName && initialName ? "Enter a display name" : null;
  const phoneError =
    submitted && trimmedPhone && !isValidPhoneNumber(trimmedPhone)
      ? "Enter a valid phone number"
      : null;
  const isDirty = trimmedName !== initialName || trimmedPhone !== initialPhone;

  const save = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueries.me().queryKey, updated);
      // The sidebar and top bar read the name from the session.
      queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
      router.push(`${PROFILE_PATH}?updated=1`);
    },
    onError: (error) => {
      setSaveError(
        error instanceof ApiError && error.message
          ? error.message
          : "Check your internet connection and try again.",
      );
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!trimmedName && initialName) return;
    if (trimmedPhone && !isValidPhoneNumber(trimmedPhone)) return;
    if (!isDirty) {
      router.push(PROFILE_PATH);
      return;
    }
    save.mutate({
      ...(trimmedName !== initialName && { displayName: trimmedName }),
      ...(trimmedPhone !== initialPhone && { phoneNumber: trimmedPhone }),
    });
  };

  const membership = currentMembership(profile);

  return (
    <>
      <SectionCard className="p-4 sm:p-6">
        {/* Outside the form: the dialog's own submit would bubble into it through the portal. */}
        <ProfilePhoto profile={profile} className="mb-5" />
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <LockedWithNote
            label="Full name"
            value={fullNameOf(profile)}
            note="Contact your admin to change your full name"
          />

          <FormField
            label="Display name"
            invalid={!!nameError}
            error={nameError}
            inputProps={{
              size: "medium",
              leadingIcon: null,
              value: name,
              maxLength: 100,
              placeholder: "What should people call you?",
              autoComplete: "nickname",
              onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value),
            }}
          />

          <FormField
            label="Phone number"
            invalid={!!phoneError}
            error={phoneError}
            inputProps={{
              size: "medium",
              leadingIcon: null,
              value: phone,
              inputMode: "tel",
              autoComplete: "tel",
              placeholder: "+234 801 234 5678",
              onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                setPhone(event.target.value),
            }}
          />

          <LockedWithNote
            label="Email"
            value={profile.email}
            note="Contact your admin to change your email"
          />
          <LockedWithNote
            label="Track"
            value={membership?.track?.name ?? "Not enrolled"}
            note="Your track is set by your admin"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="medium"
              className="text-neutral-800"
              onClick={() => router.push(PROFILE_PATH)}
            >
              Cancel
            </Button>
            <Button type="submit" size="medium" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {saveError && (
        <SuccessToast
          tone="error"
          title="Couldn’t save your changes"
          message={saveError}
          onDismiss={() => setSaveError(null)}
        />
      )}
    </>
  );
}

function LockedWithNote({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div>
      <LockedField label={label} value={value} />
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-400">
        <Info className="h-3.5 w-3.5 shrink-0" />
        {note}
      </p>
    </div>
  );
}

function EditProfileSkeleton() {
  return (
    <SectionCard className="flex flex-col gap-5 p-4 sm:p-6">
      <Skeleton className="size-14 rounded-full" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </SectionCard>
  );
}
