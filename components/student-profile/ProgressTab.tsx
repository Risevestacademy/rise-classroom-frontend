"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";

import { MoreHorizontal } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  learningItems,
  modules,
  trackProgress,
  type LearningItem,
  type LearningItemStatus,
} from "@/app/admin/students/[id]/profile-data";
import { BrandBadge, Card, CardHeader, ProgressBar } from "./shared";

const itemStatus: Record<
  LearningItemStatus,
  { label: string; text: string }
> = {
  attended: { label: "Attended", text: "text-text-success" },
  absent: { label: "Absent", text: "text-text-error" },
  graded: { label: "Graded", text: "text-text-success" },
  pending: { label: "Pending", text: "text-text-warning" },
  notSubmitted: { label: "Not submitted", text: "text-text-error" },
};

const noteTone = {
  warning: "text-text-warning",
  error: "text-text-error",
};

export function ProgressTab({
  track,
  cohort,
}: {
  track?: string;
  cohort?: string;
}) {
  const [moduleId, setModuleId] = React.useState(modules[0].id);
  const current = modules.find((item) => item.id === moduleId) ?? modules[0];
  const items = learningItems[current.id] ?? [];

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,309fr)_minmax(0,811fr)]">
      <Card className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              title={track ? `${track} Track` : trackProgress.name}
              className="truncate text-lg/6 font-semibold text-text-primary"
            >
              {track ? `${track} Track` : trackProgress.name}
            </h2>
            {cohort && (
              <p className="truncate font-work text-[13px]/[18px] text-text-secondary">
                {cohort}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1 text-right">
            <p className="text-lg/6 font-semibold text-text-primary">
              {trackProgress.value}%
            </p>
            <p className="font-work text-[13px]/[18px] text-text-secondary">
              Overall progress
            </p>
          </div>
        </div>
        <ProgressBar value={trackProgress.value} />

        <ul className="flex flex-col">
          {modules.map((item) => {
            const active = item.id === current.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setModuleId(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 p-2 text-left",
                    active
                      ? "rounded-lg bg-brand-100"
                      : "border-b border-border-default hover:bg-surface-background",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span
                      className={cn(
                        "text-base font-medium",
                        active ? "text-text-primary" : "text-text-secondary",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="truncate font-work text-sm text-text-primary">
                      {item.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
                    {item.progress === null ? "--" : `${item.progress}%`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="gap-3">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-[449px] min-w-0 flex-col gap-3">
              <p className="font-work text-sm font-medium text-text-secondary">
                {current.label}
              </p>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-text-primary">
                  {current.name}
                </h2>
                {current.description && (
                  <p className="line-clamp-2 font-work text-sm text-text-secondary">
                    {current.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-1 md:w-[191px]">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-black">
                  {current.progress === null ? "--" : `${current.progress}%`}
                </span>
                <ProgressBar value={current.progress ?? 0} className="flex-1" />
              </div>
              {current.total !== undefined && (
                <p className="font-work text-sm text-text-secondary">
                  {current.completed} of {current.total} learning items
                  completed
                </p>
              )}
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-3 rounded-xl bg-surface-subtle p-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
          <CardHeader
            size="h4"
            title="Learning items"
            subtitle="Lessons, assignments and quizzes in this module."
          />
          {items.length === 0 ? (
            <p className="py-10 text-center font-work text-sm text-text-secondary">
              No learning items to show for this module yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <LearningItemCard key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function LearningItemCard({ item }: { item: LearningItem }) {
  const status = itemStatus[item.status];

  return (
    <li className="flex min-h-[208px] flex-col justify-between gap-4 rounded-xl bg-surface-default p-4 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <BrandBadge className={status.text}>{status.label}</BrandBadge>
          <LearningItemMenu item={item} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-lg/6 font-semibold text-black">{item.title}</p>
          <p className="text-sm font-medium text-text-secondary">
            {item.kind === "liveClass" ? "Live class" : "Assignment"}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1 text-sm font-medium text-text-secondary">
          <p>{item.date}</p>
          <p className={cn(item.note.tone && noteTone[item.note.tone])}>
            {item.note.text}
          </p>
        </div>
        {item.score && (
          <BrandBadge
            className={
              item.status === "graded"
                ? "text-text-info"
                : "text-text-default-badge"
            }
          >
            {item.score}
          </BrandBadge>
        )}
      </div>
    </li>
  );
}

/** The "…" menu on a learning item. The design doesn't show where it leads yet. */
function LearningItemMenu({ item }: { item: LearningItem }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            variant="tertiary"
            size="icon-sm"
            aria-label={`${item.title} options`}
            className="text-icon-primary border-none"
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="bg-surface-subtle font-work text-sm text-text-primary shadow-[0_1px_3px_rgb(0_0_0/0.15)] outline-none">
            <Menu.Item className="flex cursor-pointer p-2.5 outline-none data-highlighted:bg-neutral-200">
              {item.kind === "liveClass"
                ? "View class details"
                : "View assignment"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
