import * as React from "react";

import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-room-control text-room-text",
  info: "bg-info-surface text-icon-info",
  warning: "bg-warning-surface text-icon-warning",
  error: "bg-error-surface text-icon-error",
} as const;

/** A full-screen message in the room: before joining, after leaving, or when something went wrong. */
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
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
        <span className={cn("flex size-[64px] items-center justify-center rounded-full [&_svg]:size-7", tones[tone])}>
          {icon}
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl/8 font-semibold text-white">{title}</h2>
          {children && <div className="font-work text-sm/5 text-room-text-muted">{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/** The room's buttons: light on the dark canvas, red for leaving. */
export const roomButton = {
  primary:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-text-brand transition-colors hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-room-control disabled:text-room-text-muted",
  secondary:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-room-control px-5 text-sm font-medium text-room-text-strong transition-colors hover:bg-room-control-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  leave:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-room-leave px-5 text-sm font-medium text-white transition-colors hover:bg-room-leave-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
};
