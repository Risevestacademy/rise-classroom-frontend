"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { AvatarChoices, ProfileEditDialog } from "@/components/profile/ProfileParts";
import { apiErrorDetails } from "@/lib/api";
import {
  displayNameOf,
  presetAvatarFile,
  presetAvatars,
  profileQueries,
  updateMyProfile,
  type MyProfile,
} from "@/lib/profile";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

/** Upload a photo or pick one of the preset avatars. Mount it only while open. */
export function ChangePhotoDialog({
  profile,
  onClose,
  onSaved,
}: {
  profile: MyProfile;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [upload, setUpload] = React.useState<{ file: File; url: string } | null>(null);
  const [selected, setSelected] = React.useState("current");
  const [imageError, setImageError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (upload) URL.revokeObjectURL(upload.url);
    };
  }, [upload]);

  const isPreset = presetAvatars.includes(selected);

  const save = useMutation({
    mutationFn: async () =>
      updateMyProfile({
        image: isPreset ? await presetAvatarFile(selected) : upload?.file,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueries.me().queryKey, updated);
      void queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
      onSaved?.();
      onClose();
    },
  });

  const avatar = (src?: string | null) => (
    <PersonAvatar
      name={displayNameOf(profile)}
      src={src === undefined ? profile.image : src}
      colorKey={profile.id}
      size={80}
    />
  );

  const choices = [
    { key: "current", label: "Current picture", node: avatar() },
    ...(upload ? [{ key: "upload", label: "Uploaded picture", node: avatar(upload.url) }] : []),
    ...presetAvatars.map((src, index) => ({
      key: src,
      label: `Avatar ${index + 1}`,
      node: avatar(src),
    })),
  ];

  return (
    <ProfileEditDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Change photo"
      canSubmit={selected !== "current"}
      isPending={save.isPending}
      error={imageError ?? (save.isError ? apiErrorDetails(save.error).message : null)}
      onSubmit={() => save.mutate()}
    >
      <AvatarChoices
        choices={choices}
        selected={selected}
        disabled={save.isPending}
        className="border-t-0 pt-0"
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

/** The student's avatar with a camera badge that opens the change-photo dialog. */
export function ProfilePhoto({
  profile,
  size = 56,
  onSaved,
  className,
}: {
  profile: MyProfile;
  size?: React.ComponentProps<typeof PersonAvatar>["size"];
  onSaved?: () => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Change photo"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
          className,
        )}
      >
        <PersonAvatar
          name={displayNameOf(profile)}
          src={profile.image}
          colorKey={profile.id}
          size={size}
        />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-neutral-800 text-white transition-transform group-hover:scale-110">
          <Camera className="size-3" />
        </span>
      </button>
      {open && (
        <ChangePhotoDialog profile={profile} onClose={() => setOpen(false)} onSaved={onSaved} />
      )}
    </>
  );
}
