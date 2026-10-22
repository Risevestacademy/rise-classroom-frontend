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
import { Card, CardHeader } from "./shared";

type Filter = (typeof activityFilters)[number]["value"];

export function ActivityTab({ firstName }: { firstName: string }) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const groups = activityTimeline
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => filter === "all" || item.kind === filter,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,730fr)_minmax(0,383fr)]">
      <Card className="gap-4">
        <CardHeader
          title="Activity"
          subtitle={`A timeline of ${firstName}'s learning activity on Rise Classroom`}
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
          {activityFilters.map((item) => {
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

        {groups.length === 0 ? (
          <p className="py-10 text-center font-work text-sm text-text-secondary">
            No activity of this kind yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-8">
                <p className="text-sm font-medium text-black">{group.label}</p>
                <ol className="relative ml-[22px] flex flex-col gap-[38px] border-l-2 border-border-strong pl-4">
                  {group.items.map((item) => (
                    <li key={item.time + item.title} className="relative">
                      <span className="absolute top-1 -left-[21px] size-2 rounded-full bg-border-strong" />
                      <p className="font-work text-xs font-medium text-text-secondary">
                        {item.time}
                      </p>
                      <p className="mt-1 font-work text-sm font-medium tracking-[-0.01em] text-black">
                        {item.title}
                      </p>
                      <p className="mt-1 font-work text-[13px]/[18px] text-text-secondary">
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="flex flex-col gap-3 rounded-xl bg-brand-100 p-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
        <h2 className="text-lg/6 font-semibold text-text-primary">
          Activity at a glance
        </h2>
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
