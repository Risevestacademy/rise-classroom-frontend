import {
  Users,
  Layers,
  Magnet,
  AlertCircle,
  PenTool,
  Code2,
  Database,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui/circular-progress";
import { AdminTopNav } from "@/components/AdminTopNav";

const metrics = [
  {
    title: "Participants",
    value: "80",
    description: "Total active participants",
    icon: Users,
    iconWrapperClassName: "bg-primary-50 text-primary-500",
  },
  {
    title: "Active Tracks",
    value: "4",
    description: "Design · Frontend · Backend · Mobile Engineering",
    icon: Layers,
    iconWrapperClassName:
      "bg-semantic-surface-success-badge text-semantic-text-success",
  },
  {
    title: "Engagement",
    value: "86%",
    description: "This week",
    icon: Magnet,
    iconWrapperClassName: "bg-[#FDEAFC] text-[#960B93]",
  },
  {
    title: "At Risk",
    value: "14",
    description: "Students needing attention",
    icon: AlertCircle,
    iconWrapperClassName:
      "bg-semantic-surface-error-badge text-semantic-text-error",
    trend: "5 new this week",
  },
];

const trackHealth = [
  { label: "Design", value: 91, icon: PenTool, className: "text-primary-500" },
  {
    label: "Frontend",
    value: 82,
    icon: Code2,
    className: "text-semantic-text-info",
  },
  { label: "Backend", value: 74, icon: Database, className: "text-[#960B93]" },
  {
    label: "Mobile Engineering",
    value: 88,
    icon: Smartphone,
    className: "text-[#7C3AED]",
  },
];

const recentActivity = [
  { title: "New student enrolled in Frontend Track", time: "12 minutes ago" },
  {
    title: "Instructor submitted grading for Backend cohort",
    time: "1 hour ago",
  },
  {
    title: "Mentor added feedback on Mobile Engineering project",
    time: "3 hours ago",
  },
  { title: "Track milestone completed for Design cohort", time: "Yesterday" },
];

const upcomingActivities = [
  { title: "Live Q&A — Frontend Track", date: "Today, 4:00 PM" },
  { title: "Assignment deadline — Backend cohort", date: "Tomorrow, 11:59 PM" },
  { title: "Mentor check-in — Mobile Engineering", date: "Fri, 2:00 PM" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopNav />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Good Morning, Admin
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Here&apos;s what&apos;s happening across your program
              </p>
            </div>
            <WeekFilter />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardCard
              title="Program Health"
              subtitle="Overall program health across all tracks"
              action={<WeekFilter />}
            >
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                <CircularProgress value={84}>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-neutral-900">
                      84%
                    </span>
                    <span className="text-xs text-neutral-500">
                      Overall health
                    </span>
                  </div>
                </CircularProgress>

                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Track Health
                  </h3>
                  {trackHealth.map((track) => (
                    <div
                      key={track.label}
                      className="flex items-center gap-2 sm:gap-3"
                    >
                      <track.icon
                        className={cn("h-4 w-4 shrink-0", track.className)}
                      />
                      <span className="w-20 shrink-0 truncate text-sm text-neutral-700 sm:w-36">
                        {track.label}
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-neutral-200">
                        <div
                          className={cn(
                            "h-2 rounded-full bg-current",
                            track.className,
                          )}
                          style={{ width: `${track.value}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-900">
                        {track.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="mt-6 flex items-center gap-1 text-sm font-medium text-primary-500"
              >
                View detailed progress
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </DashboardCard>

            <DashboardCard
              title="Attention Required"
              subtitle="Items that may need your attention"
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-semantic-surface-success-badge text-semantic-text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="font-semibold text-neutral-900">All caught up!</p>
                <p className="max-w-64 text-sm text-neutral-500">
                  There are no pending items that need your attention right now.
                </p>
              </div>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardCard
              title="Recent Activity"
              subtitle="What's happening across your program"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-primary-500"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              }
            >
              <ul className="space-y-4">
                {recentActivity.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    <div>
                      <p className="text-sm text-neutral-900">{item.title}</p>
                      <p className="text-xs text-neutral-500">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </DashboardCard>

            <DashboardCard
              title="Upcoming Activities"
              subtitle="What's coming up next"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-primary-500"
                >
                  Schedule activity
                </button>
              }
            >
              <ul className="space-y-4">
                {upcomingActivities.map((item) => (
                  <li
                    key={item.title}
                    className="flex flex-col gap-1 rounded-lg border border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {item.title}
                    </p>
                    <p className="text-xs whitespace-nowrap text-neutral-500">
                      {item.date}
                    </p>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </div>
        </div>
      </main>
    </>
  );
}

function WeekFilter() {
  return (
    <button
      type="button"
      className="flex h-10 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
    >
      This week
      <ChevronDown className="h-4 w-4 text-neutral-500" />
    </button>
  );
}

function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconWrapperClassName,
}: {
  title: string;
  value: string;
  description: string;
  trend?: string;
  icon: React.ElementType;
  iconWrapperClassName: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-300 bg-white p-5">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconWrapperClassName,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
      </div>
      <p className="text-sm text-neutral-500">{description}</p>
      {trend && (
        <p className="flex items-center gap-1 text-xs font-medium text-semantic-text-error">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {trend}
        </p>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-neutral-300 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
