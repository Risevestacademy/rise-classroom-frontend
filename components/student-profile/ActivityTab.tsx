"use client";

import * as React from "react";

import { Download02 } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  activityFilters,
  activitySummary,
  activityTimeline,
} from "@/app/admin/students/[id]/profile-data";
import { ActivityTimeline, Card, CardHeader, type TimelineGroup } from "./shared";

export function ActivityTab({ firstName }: { firstName: string }) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,730fr)_minmax(0,383fr)]">
      <ActivityCard
        subtitle={`A timeline of ${firstName}'s learning activity on Rise Classroom`}
        filters={activityFilters}
        groups={activityTimeline}
      />

      <section className="flex flex-col gap-3 rounded-xl bg-brand-100 p-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
        <h2 className="text-lg/6 font-semibold text-text-primary">
          Activity at a glance
        </h2>
        {/* The design leaves an empty 8px row under the title. */}
        <div aria-hidden className="h-2" />
        <div className="flex flex-col gap-8">
          {activitySummary.map((row, index) => (
            <div key={index} className="flex justify-between gap-4">
              {row.map((metric, metricIndex) => (
                <div
                  key={metric.label}
                  className={cn(
                    "flex flex-col gap-3",
                    metricIndex === 0 ? "w-[115px]" : "w-[78px]",
                  )}
                >
                  <p className="font-work text-xs font-medium text-text-secondary">
                    {metric.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    <p className="text-lg/6 font-semibold text-black">
                      {metric.value}
                    </p>
                    <p className="font-work text-[13px]/[18px] text-text-secondary">
                      {metric.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * The "Activity" card: an Export button, filter pills and the timeline.
 * Shared by the student and mentor profiles.
 */
export function ActivityCard<K extends string>({
  subtitle,
  filters,
  groups,
  className,
}: {
  subtitle: string;
  filters: readonly { value: K | "all"; label: string }[];
  groups: {
    label: string;
    items: (TimelineGroup["items"][number] & { kind: K })[];
  }[];
  className?: string;
}) {
  const [filter, setFilter] = React.useState<K | "all">("all");

  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => filter === "all" || item.kind === filter,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader
        title="Activity"
        subtitle={subtitle}
        subtitleClassName="text-text-primary"
        action={
          // PENDING-BACKEND: nothing to export until activity comes from the API.
          <Button
            variant="secondary"
            size="sm"
            className="border-border-default text-text-secondary"
          >
            <Download02 className="size-4" />
            Export
          </Button>
        }
      />

      <div
        role="group"
        aria-label="Filter activity"
        className="flex flex-wrap gap-2"
      >
        {filters.map((item) => {
          const active = item.value === filter;
          return (
            <Button
              key={item.value}
              variant="secondary"
              size="sm"
              pill
              aria-pressed={active}
              onClick={() => setFilter(item.value)}
              className={cn(
                // Filter pills are filled, without the secondary button's border.
                "border-transparent hover:border-transparent",
                active
                  ? "bg-brand-100 text-text-brand hover:bg-brand-100"
                  : "bg-surface-subtle text-text-muted hover:bg-neutral-200",
              )}
            >
              {item.label}
            </Button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center font-work text-sm text-text-secondary">
          No activity of this kind yet.
        </p>
      ) : (
        <ActivityTimeline groups={visible} />
      )}
    </Card>
  );
}
