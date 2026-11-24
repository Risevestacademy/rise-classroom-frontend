import * as React from "react";

import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-surface-subtle text-icon-primary",
  info: "bg-info-surface text-icon-info",
  warning: "bg-warning-surface text-icon-warning",
  error: "bg-error-surface text-icon-error",
} as const;

/** A full-page message outside the call: before joining, after leaving, or when something went wrong. */
export function RoomStatus({
  icon,
  tone = "neutral",
  title,
  children,
  actions,
}: {
  icon: React.ReactNode;
  tone?: keyof typeof tones;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div role="status" className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6 text-center">
        <span className={cn("flex size-[64px] items-center justify-center rounded-full [&_svg]:size-7", tones[tone])}>
          {icon}
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl/8 font-semibold text-text-primary">{title}</h2>
          {children && <div className="text-base/6 text-text-secondary">{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/** Buttons outside the call, from the design's "Join live session" button. */
export const roomButton = {
  primary:
    "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[3px] border-brand-400 bg-interactive-primary-default px-5 text-base font-medium text-white transition-colors hover:bg-interactive-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:border-transparent disabled:bg-interactive-primary-disabled",
  secondary:
    "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border-default bg-white px-5 text-base font-medium text-text-brand transition-colors hover:border-border-strong hover:bg-interactive-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
};
