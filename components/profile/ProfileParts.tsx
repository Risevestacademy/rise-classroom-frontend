"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ImagePlus, X } from "lucide-react";

import { Edit02 } from "@/assets/icons";
import { settingsCardClass } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { PROFILE_IMAGE_TYPES, validateProfileImage } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/* The avatar, name and link at the top of a profile page. */
export function ProfileHeaderCard({
  avatar,
  name,
  detail,
  editLabel,
  onEdit,
}: {
  avatar: React.ReactNode;
  name: string;
  detail?: React.ReactNode;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        settingsCardClass,
        "mt-6 flex max-w-[609px] items-center gap-4 p-4",
      )}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-medium text-text-primary">{name}</p>
        {detail && (
          <p className="mt-0.5 truncate font-work text-sm text-text-primary underline">
            {detail}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={editLabel}
        onClick={onEdit}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-default text-icon-primary hover:bg-surface-subtle"
      >
        <Edit02 className="size-4" />
      </button>
    </div>
  );
}

/* A card of read-only details, each value in a grey pill. */
export function ProfileInfoCard({
  title,
  rows,
  wideValues = false,
}: {
  title: string;
  rows: { label: string; value?: string | null }[];
  /* Personal details sit in fixed-width pills; dates hug their text. */
  wideValues?: boolean;
}) {
  return (
    <section
      className={cn(settingsCardClass, "mt-4 max-w-[609px] px-4 pt-4 pb-2")}
    >
      <h3 className="text-base text-text-primary">{title}</h3>
      <dl className="mt-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-h-12 items-center justify-between gap-4"
          >
            <dt className="font-work text-sm text-text-primary">{row.label}</dt>
            <dd
              className={cn(
                "flex h-9 items-center truncate rounded-lg bg-surface-subtle px-3 font-work text-sm text-text-primary",
                wideValues && "w-full max-w-[266px]",
              )}
            >
              {row.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* The narrow edit dialog both profile pages open: fields, then Cancel / Update. */
export function ProfileEditDialog({
  open,
  onOpenChange,
  title,
  canSubmit,
  isPending = false,
  error,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  canSubmit: boolean;
  isPending?: boolean;
  error?: string | null;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="w-[416px] p-0 sm:p-0"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit && !isPending) onSubmit();
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border-default px-4 py-4 sm:px-6">
            <DialogPrimitive.Title className="text-base font-medium text-text-primary">
              {title}
            </DialogPrimitive.Title>
            <DialogClose
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-lg text-icon-primary hover:bg-surface-subtle"
            >
              <X className="size-4" />
            </DialogClose>
          </div>

          <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
            {children}
            {error && <p className="text-xs text-text-error">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-border-default px-4 py-4 sm:px-6">
            <DialogClose render={<Button type="button" variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? "Updating…" : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type AvatarChoice = { key: string; label: string; node: React.ReactNode };

/* An upload tile followed by avatars to pick from; the picked one is ringed. */
export function AvatarChoices({
  choices,
  selected,
  onSelect,
  onUpload,
  onError,
  disabled = false,
  className,
}: {
  choices: AvatarChoice[];
  selected: string;
  onSelect: (key: string) => void;
  onUpload: (file: File) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 justify-items-center gap-4 border-t border-border-default pt-5",
        className,
      )}
    >
      <label
        className={cn(
          "flex size-20 cursor-pointer items-center justify-center rounded-full bg-surface-subtle text-icon-primary hover:bg-neutral-200 has-focus-visible:ring-2 has-focus-visible:ring-border-focus",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <ImagePlus className="size-6" />
        <span className="sr-only">Upload an image</span>
        <input
          type="file"
          accept={PROFILE_IMAGE_TYPES.join(",")}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const problem = validateProfileImage(file);
            onError(problem);
            if (!problem) onUpload(file);
          }}
        />
      </label>
      {choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          aria-label={choice.label}
          aria-pressed={choice.key === selected}
          disabled={disabled}
          onClick={() => onSelect(choice.key)}
          className={cn(
            "flex size-20 items-center justify-center self-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-not-allowed",
            choice.key === selected &&
              "ring-2 ring-brand-primary ring-offset-2",
          )}
        >
          {choice.node}
        </button>
      ))}
    </div>
  );
}
