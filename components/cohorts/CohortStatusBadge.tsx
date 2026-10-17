import { Badge } from "@/components/ui/badge";
import {
  cohortStatusLabels,
  type CohortStatus,
} from "@/app/admin/cohorts/cohort-data";
import { cn } from "@/lib/utils";

const badgeProps = {
  active: { variant: "light", status: "success" },
  upcoming: { variant: "stroked", status: "info" },
  completed: { variant: "stroked", status: "neutral" },
  terminated: { variant: "light", status: "error" },
} as const;

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
    <Badge
      {...badgeProps[status]}
      size={size}
      className={cn("font-work font-normal", className)}
    >
      {cohortStatusLabels[status]}
    </Badge>
  );
}
