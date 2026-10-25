import {
  cohortStatusLabels,
  type CohortStatus,
} from "@/app/admin/cohorts/cohort-data";
import { cn } from "@/lib/utils";

/** Every status sits on the brand surface; only the text colour changes. */
const statusText: Record<CohortStatus, string> = {
  active: "text-text-success",
  upcoming: "text-text-info",
  completed: "text-text-default-badge",
  terminated: "text-text-error",
};

export function CohortStatusBadge({
  status,
  size = "lg",
  className,
}: {
  status: CohortStatus;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-surface-brand font-medium whitespace-nowrap",
        size === "lg" ? "h-7 p-2 text-sm" : "h-6 p-1.5 text-xs",
        statusText[status],
        className,
      )}
    >
      {cohortStatusLabels[status]}
    </span>
  );
}
