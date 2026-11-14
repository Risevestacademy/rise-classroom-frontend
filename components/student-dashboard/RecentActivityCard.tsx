"use client";

import { useMemo } from "react";
import { Activity, ClipboardList, StickyNote, Video, type LucideIcon } from "lucide-react";

import {
  CardEmptyState,
  DashboardCard,
  IconTile,
  type Tone,
} from "@/components/student-dashboard/DashboardParts";
import { getSampleActivity, type SampleActivity } from "@/lib/dashboard-sample-data";

// No activity endpoint exists yet. Sample data fills this in local development
// only, so deployed builds never show made-up activity to real students.
const SHOW_SAMPLE_DATA = process.env.NODE_ENV === "development";

const activityIcon: Record<SampleActivity["kind"], { icon: LucideIcon; tone: Tone }> = {
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

export function RecentActivityCard({ className }: { className?: string }) {
  const activity = useMemo(() => (SHOW_SAMPLE_DATA ? getSampleActivity() : []), []);

  return (
    <DashboardCard title="Recent Activity" className={className}>
      {activity.length === 0 ? (
        <CardEmptyState
          icon={Activity}
          title="No activity yet"
          description="New recordings, assignments and mentor notes will show up here."
        />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {activity.map((item) => {
            const { icon, tone } = activityIcon[item.kind];
            return (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <IconTile icon={icon} tone={tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{item.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">
                  {timeAgo(item.minutesAgo)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
