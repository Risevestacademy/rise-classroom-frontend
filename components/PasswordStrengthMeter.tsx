import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  evaluatePassword,
  passwordRequirement,
  passwordStrengthMeta,
  strengthSegments,
} from "@/lib/password-strength";

/** Strength bar plus a live checklist of the password rules. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { strength, filledSegments } = evaluatePassword(password);

  return (
    <>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: strengthSegments }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < filledSegments
                ? strength && passwordStrengthMeta[strength].barColor
                : "bg-neutral-300"
            )}
          />
        ))}
      </div>

      <p className="mt-1.5 text-xs text-neutral-600">
        {strength
          ? passwordStrengthMeta[strength].label
          : "Must contain at least;"}
      </p>
      <ul className="flex flex-col gap-1">
        {passwordRequirement.map((requirement) => {
          const met = requirement.test(password);
          return (
            <li
              key={requirement.key}
              className="flex items-center gap-1.5 text-xs"
            >
              <span
                className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded-full text-neutral-50",
                  met ? "bg-semantic-text-success" : "bg-neutral-300"
                )}
              >
                {met ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : (
                  <X className="size-2.5" strokeWidth={3} />
                )}
              </span>
              <span className={met ? "text-neutral-700" : "text-neutral-500"}>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
