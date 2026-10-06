"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { StatusSelect } from "@/components/ui/status-select";
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

const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

type EditUserDialogProps = {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelf: boolean;
};

export function EditUserDialog(props: EditUserDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-130">
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

        <StatusSelect
          value={status}
          onChange={setStatus}
          options={userStatusLabels}
          disabledOptions={suspendBlocked ? ["SUSPENDED"] : undefined}
        >
          {suspendBlocked ? (
            <p className="text-xs text-neutral-400">
              You can&apos;t suspend your own account.
            </p>
          ) : status === "SUSPENDED" && user.status !== "SUSPENDED" ? (
            <p className="text-xs text-neutral-400">
              Suspending signs them out everywhere.
            </p>
          ) : null}
        </StatusSelect>
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
