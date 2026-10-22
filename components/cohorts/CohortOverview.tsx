import { Code, Database, Lightbulb, PenLine, Smartphone } from "lucide-react";

import {
  AlertCircle,
  ArrowUpRight01,
  Calendar03,
  MoreVertical,
  UserMultiple,
  UserRemove01,
} from "@/assets/icons";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";
import type { CohortDetail } from "@/lib/cohorts";
import { cn } from "@/lib/utils";

const cardClass = "rounded-xl bg-white shadow-[0_2px_4px_rgb(17_24_25/0.06)]";

export const trackStyles: Record<
  TrackKey,
  { icon: React.ComponentType<{ className?: string }>; box: string; bar: string }
> = {
  design: { icon: PenLine, box: "bg-brand-100 text-brand-primary", bar: "bg-brand-primary" },
  frontend: { icon: Code, box: "bg-info-surface text-text-info", bar: "bg-text-info" },
  backend: { icon: Database, box: "bg-[#fdeafc] text-[#960b93]", bar: "bg-[#960b93]" },
  mobile: { icon: Smartphone, box: "bg-[#fdeafc] text-[#960b93]", bar: "bg-[#960b93]" },
};

// PENDING-BACKEND: the API has no progress, health or engagement data, so
// these show as 0 until it does.
const engagementMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export function CohortOverview({ cohort }: { cohort: CohortDetail }) {
  const overview = {
    trackNames: cohort.trackNames,
    overallProgress: 0,
    progressChange: "--",
    healthScore: 0,
    health: [
      { value: 0, note: "0% of the cohort", trend: undefined },
      { value: 0, note: "Students needing attention", trend: undefined },
      { value: 0, note: "0% of the cohort", trend: undefined },
    ],
    completionByTrack: cohort.trackList.map((track) => ({
      id: track.id,
      track: track.track,
      label: track.name,
      value: 0,
    })),
    engagement: engagementMonths.map((month) => ({ month, value: 0 })),
  };

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<UserMultiple className="size-5" />}
          iconClass="bg-info-surface text-text-info"
          label="Students"
          value={cohort.students}
          note="Total students"
        />
        <SummaryCard
          icon={<StackedRowsIcon />}
          iconClass="bg-success-surface text-text-success"
          label="Tracks"
          value={cohort.tracks}
          // The separator sticks to the next name so a wrap starts with "·", as in the design.
          note={overview.trackNames.join(" · ")}
        />
        <SummaryCard
          icon={<ProgressIcon />}
          iconClass="bg-[#fdeafc] text-[#960b93]"
          label="Overall progress"
          value={`${overview.overallProgress}%`}
          note={
            <span className="text-text-success">{overview.progressChange}</span>
          }
        />
        <SummaryCard
          icon={<Calendar03 className="size-5" />}
          iconClass="bg-info-surface text-text-info"
          label={cohort.status === "upcoming" ? "Days to kick off" : "Days remaining"}
          value={
            cohort.status === "upcoming"
              ? cohort.daysToStart
              : cohort.status === "active"
                ? cohort.daysLeft
                : "--"
          }
          note={
            cohort.status === "upcoming"
              ? "Days until the cohort starts"
              : cohort.status === "active"
                ? "Days until end of cohort"
                : "This cohort has ended"
          }
        />
      </div>

      <h2 className="mt-[21px] text-xl font-semibold text-text-primary">
        Cohort health
      </h2>
      <p className="mt-[3px] font-work text-sm text-text-secondary">
        A snapshot of student engagement performance and wellbeing
      </p>

      <section
        aria-label="Cohort health"
        className={cn(cardClass, "relative mt-4 p-6 pb-10 xl:max-w-[1126px]")}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
          <HealthGauge score={overview.healthScore} />

          <div className="min-w-0 flex-1 lg:ml-[26px]">
            <div className="grid gap-4 md:grid-cols-3">
              <HealthCard
                icon={<UserMultiple className="size-5" />}
                iconClass="bg-info-surface text-text-info"
                label="On track"
                value={overview.health[0].value}
                note={overview.health[0].note}
              />
              <HealthCard
                icon={<AlertCircle className="size-5" />}
                iconClass="bg-surface-error-badge text-text-error"
                label="At Risk"
                value={overview.health[1].value}
                note={overview.health[1].note}
                trend={overview.health[1].trend}
              />
              <HealthCard
                icon={<UserRemove01 className="size-5" />}
                iconClass="bg-[#fdeafc] text-[#960b93]"
                label="Inactive"
                value={overview.health[2].value}
                note={overview.health[2].note}
              />
            </div>
            <p className="mt-2 inline-flex items-center gap-2 rounded bg-brand-100 px-2 py-1.5 font-work text-xs text-text-secondary">
              <Lightbulb className="size-4 shrink-0 text-brand-primary" />
              Cohort health is based on attendance, assignment completion and
              overall engagement.
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cohort health options"
          className="absolute right-[64px] bottom-[28px] hidden text-text-primary lg:block"
        >
          <MoreVertical className="size-5" />
        </button>
      </section>

      <div className="mt-7 grid gap-4 lg:grid-cols-[487px_451px]">
        <section className={cn(cardClass, "p-6")}>
          <h2 className="text-lg leading-6 font-semibold text-text-primary">
            Completion rate by track
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {overview.completionByTrack.map((row) => {
              const style = trackStyles[row.track];
              const Icon = style.icon;
              return (
                <li key={row.id} className="flex h-8 items-center">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      style.box,
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="ml-3 w-[174px] shrink-0 font-work text-sm text-text-primary">
                    {row.label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
                    <span
                      className={cn("block h-full rounded-full", style.bar)}
                      style={{ width: `${row.value}%` }}
                    />
                  </span>
                  <span className="ml-3.5 w-8 shrink-0 font-work text-sm text-text-primary">
                    {row.value}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={cn(cardClass, "bg-brand-50 p-6 pb-7")}>
          <h2 className="text-lg leading-6 font-semibold text-text-primary">
            Engagement over time
          </h2>
          <EngagementChart data={overview.engagement} />
        </section>
      </div>
    </>
  );
}

function SummaryCard({
  icon,
  iconClass,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <div className={cn(cardClass, "flex h-40 gap-3 p-5")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
        <p className="mt-2 font-work text-[13px] leading-[18px] text-text-secondary">{note}</p>
      </div>
    </div>
  );
}

function HealthCard({
  icon,
  iconClass,
  label,
  value,
  note,
  trend,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number;
  note: string;
  trend?: string;
}) {
  return (
    <div className={cn(cardClass, "flex h-40 gap-3 p-5")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
        <p className="mt-2 font-work text-[13px] leading-[18px] text-text-secondary">{note}</p>
        {trend && (
          <p className="mt-1 flex items-center gap-1 font-work text-xs text-text-error">
            <ArrowUpRight01 className="size-4" />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

/** A 210° arc gauge open at the bottom; the dark part is the score out of 100. */
function HealthGauge({ score }: { score: number }) {
  const radius = 82;
  const sweep = 210;
  const circumference = 2 * Math.PI * radius;
  const arc = (circumference * sweep) / 360;
  const filled = (arc * score) / 100;
  const gap = 18;

  return (
    <div className="relative mx-auto h-[150px] w-[200px] shrink-0 lg:mx-0 lg:mt-[5px] lg:ml-[6px]">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-x-0 top-0 h-[200px] w-[200px] rotate-[165deg]"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className="stroke-brand-100"
          strokeDasharray={`${arc - filled - gap} ${circumference}`}
          strokeDashoffset={-(filled + gap)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className="stroke-brand-primary"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-x-0 top-[52px] text-center">
        <p className="text-2xl font-semibold text-text-primary">{score}</p>
        <p className="mt-1 text-base text-text-success">Healthy</p>
      </div>
    </div>
  );
}

function EngagementChart({
  data,
}: {
  data: readonly { month: string; value: number }[];
}) {
  const max = Math.max(...data.map((point) => point.value));

  return (
    <div className="mt-3 flex h-[170px] items-end gap-3">
      {data.map((point) => (
        <div
          key={point.month}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
        >
          <span className="text-xs font-medium text-text-primary">
            {point.value}%
          </span>
          <span
            className={cn(
              "mt-1 w-full rounded",
              point.value === max
                ? "bg-brand-500"
                : point.value < 20
                  ? "bg-brand-100"
                  : "bg-brand-200",
            )}
            // 80% is a 129px bar in the design.
            style={{ height: `${point.value * 1.6125}px` }}
          />
          <span className="mt-[5px] font-work text-xs text-text-secondary">
            {point.month}
          </span>
        </div>
      ))}
    </div>
  );
}

function StackedRowsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      {[4, 10, 16].map((y) => (
        <rect
          key={y}
          x="4"
          y={y}
          width="16"
          height="4"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

