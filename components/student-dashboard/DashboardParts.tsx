import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "error" | "info" | "neutral" | "brand";

const tileTone: Record<Tone, string> = {
  success: "bg-surface-success-badge text-text-success",
  info: "bg-surface-info-badge text-text-info",
  brand: "bg-surface-brand text-brand-primary",
  warning: "bg-surface-warning-badge text-text-warning",
  error: "bg-surface-error-badge text-text-error",
  neutral: "bg-neutral-100 text-neutral-500",
};

/** Small tinted icon square at the start of a list row. */
export function IconTile({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        tileTone[tone]
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** A white dashboard card. It grows to fill its column so empty states sit centred. */
export function DashboardCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl bg-white px-6 pt-8 pb-6 shadow-sm",
        className
      )}
    >
      <h2 className="text-xl font-medium text-neutral-800">{title}</h2>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/**
 * The design's empty state: an icon in a circle, a title and a line of help,
 * centred in whatever space the card has. `onGrey` is for grey cards, where
 * the circle turns white.
 */
export function CardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  onGrey = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  onGrey?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
      <span
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-full text-neutral-800",
          onGrey ? "bg-white" : "bg-neutral-100"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-medium text-neutral-800">{title}</p>
      <p className="max-w-72 text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
