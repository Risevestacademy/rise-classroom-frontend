"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  MoreVertical,
  WifiOff,
} from "lucide-react";
import { Field } from "@base-ui/react/field";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { promptGroups, type Answers } from "./week-answers";

export const CONTROL_TOWER_PATH = "/student/control-tower";
export const PREVIOUS_WEEKS_PATH = `${CONTROL_TOWER_PATH}/previous-weeks`;

/** "/student/control-tower/previous-weeks/2026-01-19" for the week starting then. */
export function previousWeekPath(weekStart: string) {
  return `${PREVIOUS_WEEKS_PATH}/${weekStart.slice(0, 10)}`;
}

/** Every Control Tower screen sits in one centred column. */
export function ControlTowerColumn({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-180 flex-col gap-6">{children}</div>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      {children}
    </div>
  );
}

export function WeekStatusBadge({ completed }: { completed: boolean }) {
  return (
    <Badge variant="light" status={completed ? "success" : "error"} size="sm">
      {completed ? "Completed" : "Missed"}
    </Badge>
  );
}

/** The three prompt cards. Read-only fields keep the same look, just without editing. */
export function WeekFields({
  answers,
  onChange,
  readOnly = false,
  intro,
}: {
  answers: Answers;
  onChange: (key: keyof Answers, value: string) => void;
  readOnly?: boolean;
  /** Shown at the top of the first card. */
  intro?: React.ReactNode;
}) {
  return (
    <>
      {promptGroups.map((group, index) => (
        <Card key={group.section ?? "plan"}>
          {index === 0 && intro}
          {group.section && (
            <Badge variant="light" status="info" size="sm" className="-mb-2">
              {group.section}
            </Badge>
          )}
          {group.prompts.map((prompt) => (
            <Field.Root key={prompt.key} className="flex flex-col gap-2">
              <Field.Label className="text-sm font-medium text-neutral-800">
                {prompt.label}
              </Field.Label>
              <Textarea
                className="min-h-24"
                placeholder={readOnly ? "" : prompt.placeholder}
                value={answers[prompt.key]}
                readOnly={readOnly}
                onChange={(event) => onChange(prompt.key, event.target.value)}
              />
            </Field.Root>
          ))}
        </Card>
      ))}
    </>
  );
}

const menuItem =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-100 focus:bg-neutral-100";

export function ControlTowerMenu({
  onViewPreviousWeeks,
  onHowItWorks,
}: {
  onViewPreviousWeeks: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg ring-0"
      >
        <DropdownMenuItem className={menuItem} onClick={onViewPreviousWeeks}>
          <CalendarDays className="h-4 w-4" />
          View previous weeks
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItem} onClick={onHowItWorks}>
          <Info className="h-4 w-4" />
          How Control Tower works
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Back button and "Control tower > Previous weeks > Week 1" trail. Links go
 * through `onNavigate` so a page with unsaved answers can ask first.
 */
export function Crumbs({
  backHref,
  trail,
  onNavigate,
}: {
  backHref: string;
  trail: { label: string; href?: string }[];
  onNavigate?: (href: string) => void;
}) {
  const intercept = (href: string) => (event: React.MouseEvent) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(href);
  };

  return (
    <nav aria-label="Control Tower" className="flex items-center gap-3 text-sm">
      <Link
        href={backHref}
        aria-label="Back"
        onClick={intercept(backHref)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <ol className="flex min-w-0 items-center gap-2">
        {trail.map((crumb, index) => (
          <li key={crumb.label} className="flex min-w-0 items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                onClick={intercept(crumb.href)}
                className="truncate text-neutral-500 hover:text-neutral-800"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-neutral-800">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-neutral-100 px-6 py-16 text-center">
      {children}
    </div>
  );
}

export function LoadErrorPanel({
  title,
  message = "Check your internet connection and try again.",
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Panel>
      <WifiOff className="mb-3 h-6 w-6 text-neutral-800" />
      <p className="font-medium text-neutral-800">{title}</p>
      <p className="max-w-sm text-sm text-neutral-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="medium" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Panel>
  );
}

export function NoPreviousWeeksPanel() {
  return (
    <Panel>
      <CalendarDays className="mb-3 h-6 w-6 text-neutral-800" />
      <p className="font-medium text-neutral-800">No previous weeks yet</p>
      <p className="max-w-64 text-sm text-neutral-500">
        Your completed weekly Control Tower entries will appear here.
      </p>
    </Panel>
  );
}

export function WeekFieldsSkeleton() {
  return (
    <>
      {[2, 2, 3].map((count, card) => (
        <div
          key={card}
          className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"
        >
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function WeekListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
