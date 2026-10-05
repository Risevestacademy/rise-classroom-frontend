"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getUpdateUserErrorMessage,
  updateUser,
  userChanges,
  type AdminUser,
  type UpdateUserInput,
  type UpdateUserResult,
} from "@/lib/admin";
import type { UserStatus } from "@/lib/auth";

const nameSchema = z.string().trim().min(1);
const emailSchema = z.string().trim().email();

type EditUserDialogProps = {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelf: boolean;
};

export function EditUserDialog(props: EditUserDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[520px]">
        {props.open && <EditUserForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, onOpenChange, isSelf }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = React.useState(user.firstName);
  const [lastName, setLastName] = React.useState(user.lastName);
  const [email, setEmail] = React.useState(user.email);
  const [status, setStatus] = React.useState<UserStatus>(user.status);
  const [result, setResult] = React.useState<UpdateUserResult | null>(null);

  const trimmed = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
  };

  const emailChanged = trimmed.email !== user.email;
  const firstNameError = nameSchema.safeParse(trimmed.firstName).success
    ? undefined
    : "First name is required.";
  const lastNameError = nameSchema.safeParse(trimmed.lastName).success
    ? undefined
    : "Last name is required.";
  const emailError =
    emailChanged && !emailSchema.safeParse(trimmed.email).success
      ? "Please enter a valid email address."
      : undefined;

  const changes = userChanges(user, { firstName, lastName, email, status });
  const hasChanges = Object.keys(changes).length > 0;
  const canSave =
    hasChanges && !firstNameError && !lastNameError && !emailError;

  const save = useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(user.id, input),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setResult(data);
    },
  });

  if (result) {
    const notifiedAddress = result.user.email;
    const notice =
      result.emailSent && user.onboardingStatus === "INVITED"
        ? `We sent a fresh onboarding link to ${notifiedAddress}.`
        : result.emailSent
          ? `We sent a notice to ${notifiedAddress}.`
          : "Your changes are live.";

    return (
      <>
        <DialogHeader>
          <DialogTitle>Changes saved</DialogTitle>
          <DialogDescription>{notice}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button variant="primary" size="medium" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  const suspendBlocked = isSelf;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>
          Update {user.displayName ?? user.name}&apos;s name, email or status.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="First name"
            required
            error={firstNameError}
            inputProps={{
              type: "basic",
              value: firstName,
              onChange: (event) => setFirstName(event.target.value),
              placeholder: "First name",
            }}
          />
          <FormField
            label="Last name"
            required
            error={lastNameError}
            inputProps={{
              type: "basic",
              value: lastName,
              onChange: (event) => setLastName(event.target.value),
              placeholder: "Last name",
            }}
          />
        </div>

        <FormField
          label="Email"
          required
          error={emailError}
          hint={
            emailChanged
              ? user.onboardingStatus === "INVITED"
                ? "They'll get a fresh onboarding link at this address."
                : "They'll get a notice at this address."
              : undefined
          }
          inputProps={{
            type: "email",
            value: email,
            onChange: (event) => setEmail(event.target.value),
            placeholder: "name@example.com",
          }}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-neutral-800">Status</p>
          <div className="grid grid-cols-2 gap-2">
            {(["ACTIVE", "SUSPENDED"] as const).map((option) => {
              const disabled = option === "SUSPENDED" && suspendBlocked;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={status === option}
                  disabled={disabled}
                  onClick={() => setStatus(option)}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    status === option
                      ? "border-brand-primary bg-brand-primary text-neutral-0"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {option === "ACTIVE" ? "Active" : "Suspended"}
                </button>
              );
            })}
          </div>
          {suspendBlocked ? (
            <p className="text-xs text-neutral-400">
              You can&apos;t suspend your own account.
            </p>
          ) : status === "SUSPENDED" && user.status !== "SUSPENDED" ? (
            <p className="text-xs text-neutral-400">
              Suspending signs them out everywhere.
            </p>
          ) : null}
        </div>
      </div>

      {save.isError && (
        <p className="mt-4 text-sm text-semantic-text-error">
          {getUpdateUserErrorMessage(save.error)}
        </p>
      )}

      <DialogFooter className="mt-6 sm:justify-end">
        <Button variant="secondary" size="medium" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          disabled={!canSave || save.isPending}
          onClick={() => save.mutate(changes)}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}
