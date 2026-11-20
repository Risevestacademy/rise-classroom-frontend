"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SquareLock } from "@/assets/icons";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import {
  SettingsPageTitle,
  settingsCardClass,
} from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";
import { evaluatePassword } from "@/lib/password-strength";
import { profileRoutes } from "@/lib/profile";
import { cn } from "@/lib/utils";

/*
 * PENDING-BACKEND: there's no change-password endpoint yet, so Update password
 * stays off even when the form is valid.
 */
const canChangePassword = false;

export function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const { allRequirementsMet } = evaluatePassword(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid =
    current.length > 0 && allRequirementsMet && confirm === next;

  return (
    <>
      <SettingsPageTitle
        backHref={profileRoutes.personal}
        backLabel="Back to personal profile"
      >
        Personal profile / Password
      </SettingsPageTitle>

      <form
        onSubmit={(event) => event.preventDefault()}
        className={cn(settingsCardClass, "mt-6 max-w-[609px] p-4")}
      >
        <h3 className="text-base text-text-primary">Change password</h3>

        <div className="mt-5 flex flex-col gap-5">
          <PasswordRow
            id="current-password"
            label="Current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <PasswordRow
            id="new-password"
            label="New password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
          >
            <PasswordStrengthMeter password={next} />
          </PasswordRow>
          <PasswordRow
            id="confirm-password"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          >
            {mismatch && (
              <p className="text-xs text-text-error">
                Passwords don&apos;t match.
              </p>
            )}
          </PasswordRow>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(profileRoutes.personal)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!valid || !canChangePassword}>
            Update password
          </Button>
        </div>
      </form>
    </>
  );
}

function PasswordRow({
  id,
  label,
  value,
  onChange,
  autoComplete,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <label
        htmlFor={id}
        className="font-work text-sm text-text-primary sm:pt-2.5"
      >
        {label}
      </label>
      <div className="flex w-full flex-col gap-1.5 sm:max-w-[274px]">
        <Input
          id={id}
          size="small"
          type={visible ? "basic" : "password"}
          leadingIcon={<SquareLock />}
          trailingIcon={
            <PasswordVisibilityToggle
              visible={visible}
              onToggle={() => setVisible((shown) => !shown)}
            />
          }
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
        />
        {children}
      </div>
    </div>
  );
}
