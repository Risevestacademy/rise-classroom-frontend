import { ApplicationStatusBadge } from "@/components/platform-admin/ApplicationDetailsPanel";
import { shortDate } from "@/lib/calendar";
import type { OrganizationApplication } from "@/lib/platform";

/* The dashboard's preview of applications still waiting on a decision. */
export function RecentRequests({
  applications,
}: {
  applications: OrganizationApplication[];
}): React.JSX.Element {
  return (
    <ul className="flex flex-col">
      {applications.map((application) => (
        <li
          key={application.id}
          className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="truncate font-work text-sm font-medium text-text-primary">
              {application.academyName}
            </p>
            <p className="mt-0.5 truncate font-work text-xs text-text-secondary">
              {application.fullName} · Applied{" "}
              {shortDate(new Date(application.createdAt))}
            </p>
          </div>
          <ApplicationStatusBadge application={application} />
        </li>
      ))}
    </ul>
  );
}
