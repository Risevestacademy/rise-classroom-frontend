import Link from "next/link";

import { MoreHorizontal } from "@/assets/icons";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const progressBar: Record<TrackKey, string> = {
  design: "bg-brand-primary",
  frontend: "bg-text-success",
  backend: "bg-[#932a6e]",
  mobile: "bg-[#7038b8]",
};

export type TrackCardStat = {
  icon: React.ReactNode;
  /** Null while it's loading. */
  value: number | string | null;
  label: string;
  tone: string;
  labelTone?: string;
};

/**
 * A track as a card: status, name, students, three figures and how far
 * through it the students are. Used on the Tracks page and a cohort's Tracks tab.
 */
export function TrackCard({
  name,
  active,
  students,
  stats,
  progress,
  progressMessage = "Progress couldn't be loaded",
  colorKey,
  href,
  menu,
}: {
  name: string;
  active: boolean;
  students: number | null;
  stats: TrackCardStat[];
  /** Null while it's loading; undefined when it isn't available. */
  progress: number | null | undefined;
  /** Shown in place of the bar when progress isn't available. */
  progressMessage?: string;
  colorKey: TrackKey;
  /** Makes the whole card a link to the track. */
  href?: string;
  /** Replaces the options button. */
  menu?: React.ReactNode;
}) {
  return (
    <article className="relative rounded-3xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]">
      <div className="flex items-center justify-between">
        <Badge
          variant="light"
          status={active ? "success" : "neutral"}
          size="lg"
          className="font-work font-normal"
        >
          {active ? "Active" : "Suspended"}
        </Badge>
        {/* Above the card's link, so it stays clickable. */}
        <div className="relative z-10">
          {menu ?? (
            <button
              type="button"
              aria-label={`${name} options`}
              className="flex size-8 items-center justify-center text-text-primary"
            >
              <MoreHorizontal className="size-4" />
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-text-primary">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl">
            {name}
          </Link>
        ) : (
          name
        )}
      </h3>
      {students === null ? (
        <Skeleton className="mt-[3px] h-5 w-20" />
      ) : (
        <p className="mt-[3px] font-work text-sm text-text-secondary">
          {students} {students === 1 ? "student" : "students"}
        </p>
      )}

      <div className="mt-[15px] flex flex-wrap gap-6">
        {stats.map((stat) => (
          <TrackStat key={stat.label} {...stat} />
        ))}
      </div>

      {progress === null ? (
        <>
          <Skeleton className="mt-3.5 h-4 w-24" />
          <Skeleton className="mt-1 h-2 w-full rounded-full" />
        </>
      ) : progress === undefined ? (
        <p className="mt-3.5 font-work text-xs text-text-secondary">{progressMessage}</p>
      ) : (
        <>
          <p className="mt-3.5 text-xs font-medium text-text-primary">{progress}% Complete</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className={cn("h-full rounded-full", progressBar[colorKey])}
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </article>
  );
}

function TrackStat({ icon, value, label, tone, labelTone = tone }: TrackCardStat) {
  return (
    <div className="grid min-w-[85px] grid-cols-[24px_auto] gap-x-3 first:min-w-[97px]">
      {icon}
      {value === null ? (
        <Skeleton className="h-6 w-8" />
      ) : (
        <p className={cn("text-lg font-semibold", tone)}>{value}</p>
      )}
      <p className={cn("col-start-2 font-work text-sm", labelTone)}>{label}</p>
    </div>
  );
}
