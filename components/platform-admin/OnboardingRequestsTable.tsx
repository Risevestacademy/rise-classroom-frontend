import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { shortDate } from "@/lib/calendar";
import type {
  OnboardingRequest,
  OnboardingRequestStatus,
} from "@/lib/platform-sample-data";

const statusBadges: Record<
  OnboardingRequestStatus,
  { label: string; status: "info" | "warning" }
> = {
  NEW: { label: "New", status: "info" },
  PENDING: { label: "Pending", status: "warning" },
};

export function OnboardingRequestsTable({
  requests,
}: {
  requests: OnboardingRequest[];
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-120 text-left text-sm">
        <thead className="bg-neutral-100 font-work text-xs text-text-secondary">
          <tr>
            <th className="rounded-l-lg px-4 py-3 font-medium">Academy</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="w-12 rounded-r-lg px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="font-work text-text-primary">
          {requests.map((request) => {
            const badge = statusBadges[request.status];
            return (
              <tr key={request.id} className="border-b border-border-default last:border-b-0">
                <td className="px-4 py-3">{request.academy}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {shortDate(new Date(request.submittedAt))}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="light" status={badge.status}>
                    {badge.label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {/* PENDING-BACKEND: requests can't be approved or declined yet. */}
                  <button
                    type="button"
                    disabled
                    aria-label={`${request.academy} actions`}
                    title="Reviewing requests isn't available yet"
                    className="rounded-md p-1 text-text-disabled disabled:cursor-not-allowed"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
