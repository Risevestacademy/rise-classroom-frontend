"use client";

import * as React from "react";
import Link from "next/link";

import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { SettingsPageTitle } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";
import { evaluatePassword } from "@/lib/password-strength";

export default function InstructorPasswordPage() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const { allRequirementsMet } = evaluatePassword(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = current.length > 0 && allRequirementsMet && confirm === next;

  return (
    <>
      <SettingsPageTitle
        backHref="/instructor/profile"
        backLabel="Back to personal profile"
      >
        Personal profile / Password
      </SettingsPageTitle>

      <form
        className="mt-6 max-w-[609px] rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <h3 className="text-base text-text-primary">Change password</h3>

        <div className="mt-5">
            <div className="flex flex-col gap-5">
              <PasswordField
                id="current-password"
                label="Current password"
                value={current}
                onChange={setCurrent}
              />
              <PasswordField
                id="new-password"
                label="New password"
                value={next}
                onChange={setNext}
              >
                <PasswordStrengthMeter password={next} />
              </PasswordField>
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
              >
                {mismatch && (
                  <p className="text-xs text-text-error">Passwords don&apos;t match.</p>
                )}
              </PasswordField>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button render={<Link href="/instructor/profile" />} variant="secondary" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={!valid}>
                Update password
              </Button>
            </div>
        </div>
      </form>
    </>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <label htmlFor={id} className="pt-2.5 text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="flex w-full flex-col gap-1.5 sm:max-w-[274px]">
        <Input
          id={id}
          size="small"
          type={visible ? "basic" : "password"}
          leadingIcon={null}
          trailingIcon={
            <PasswordVisibilityToggle
              visible={visible}
              onToggle={() => setVisible((shown) => !shown)}
            />
          }
          value={value}
          autoComplete={id === "current-password" ? "current-password" : "new-password"}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
        />
        {children}
      </div>
    </div>
  );
}
