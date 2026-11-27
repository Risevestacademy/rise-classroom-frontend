"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, ClipboardList, StickyNote, Video, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  CardEmptyState,
  DashboardCard,
  IconTile,
  type Tone,
} from "@/components/student-dashboard/DashboardParts";
import { studentAssignmentQueries } from "@/lib/student-assignments";
import { recentActivity, type ActivityItem } from "@/lib/student-dashboard";
import { useStudentCurriculum } from "@/lib/student-lessons";
import { studentNotificationQueries } from "@/lib/student-notifications";
import { useCurrentMinute } from "@/lib/use-current-minute";

const activityIcon: Record<ActivityItem["kind"], { icon: LucideIcon; tone: Tone }> = {
  recording: { icon: Video, tone: "success" },
  assignment: { icon: ClipboardList, tone: "brand" },
  note: { icon: StickyNote, tone: "info" },
  event: { icon: Video, tone: "success" },
};

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "always" });

function timeAgo(minutes: number) {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return relativeFormat.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeFormat.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return relativeFormat.format(-days, "day");
  return relativeFormat.format(-Math.floor(days / 7), "week");
}

/** Work handed in, reviews of it and notifications, newest first. */
export function RecentActivityCard({ className }: { className?: string }) {
  const now = useCurrentMinute();
  const curriculum = useStudentCurriculum();
  const enrollmentId = curriculum.enrollmentId ?? "";
  const submissions = useQuery({
    ...studentAssignmentQueries.enrollmentSubmissions(enrollmentId),
    enabled: enrollmentId.length > 0,
  });
  const notifications = useQuery(studentNotificationQueries.notifications());

  const isPending =
    now === null ||
    curriculum.isPending ||
    notifications.isPending ||
    (enrollmentId !== "" && submissions.isPending);
  const failed = notifications.isError && submissions.isError;
  const activity = isPending
    ? []
    : recentActivity(
        notifications.data?.items ?? [],
        submissions.data?.items ?? [],
        curriculum.topics
      );

  return (
    <DashboardCard title="Recent Activity" className={className}>
      {isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <CardEmptyState
          icon={Activity}
          title={failed ? "We couldn't load your activity" : "No activity yet"}
          description={
            failed
              ? "Check your connection, then refresh the page."
              : "Submissions, feedback and live class updates will show up here."
          }
        />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {activity.map((item) => {
            const { icon, tone } = activityIcon[item.kind];
            return (
              <li key={item.key} className="flex items-center gap-4 py-3">
                <IconTile icon={icon} tone={tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{item.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">
                  {timeAgo(Math.max(0, Math.floor(((now ?? 0) - Date.parse(item.at)) / 60_000)))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
