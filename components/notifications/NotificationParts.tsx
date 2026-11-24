"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Megaphone,
  MessageSquareText,
  Paperclip,
  Video,
  type LucideIcon,
} from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatShortDate,
  notificationTime,
  senderRoleLabels,
  type Announcement,
  type StudentNotification,
} from "@/lib/student-notifications";
import { cn } from "@/lib/utils";
import { notificationText } from "@/lib/notification-text";

/* The API's notification types are free-form, so match on what they mention. */
const typeIcons: [RegExp, LucideIcon][] = [
  [/ANNOUNCEMENT/, Megaphone],
  [/LIVE|CLASS|RECORDING|SESSION/, Video],
  [/MENTOR|NOTE|FEEDBACK|CHECK_?IN/, MessageSquareText],
  [/CONTROL_?TOWER|WEEKLY|REMINDER/, CalendarDays],
  [/ASSIGN|SUBMISSION|GRADE|REVIEW/, ClipboardList],
];

export function iconForType(type: string): LucideIcon {
  const upper = type.toUpperCase();
  return typeIcons.find(([pattern]) => pattern.test(upper))?.[1] ?? Bell;
}

export function NotificationIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800",
        className,
      )}
    >
      {React.createElement(iconForType(type), {
        className: "size-[18px]",
        strokeWidth: 1.75,
      })}
    </span>
  );
}

/** Keeps its width when read so rows stay aligned. */
export function UnreadDot({ unread }: { unread: boolean }) {
  return (
    <span
      aria-label={unread ? "Unread" : undefined}
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        unread ? "bg-brand-primary" : "bg-transparent",
      )}
    />
  );
}

/** Small count next to a tab or nav item. */
export function CountBadge({
  count,
  tone = "dark",
}: {
  count: number;
  tone?: "dark" | "warning";
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
        tone === "dark"
          ? "bg-brand-primary text-white"
          : "bg-surface-warning-badge text-text-warning",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const rowCard =
  "flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-left transition-colors hover:border-neutral-300 sm:gap-5";

export function NotificationRow({
  notification,
  href,
  onSelect,
}: {
  notification: StudentNotification;
  /** Where the row leads, if anywhere; it's marked read either way. */
  href?: string;
  onSelect: () => void;
}) {
  const unread = !notification.isRead;
  const content = (
    <>
      <UnreadDot unread={unread} />
      <NotificationIcon type={notification.type} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-neutral-800",
            unread ? "text-base" : "text-sm",
          )}
        >
          {notification.title}
        </span>
        <span className="mt-0.5 block truncate font-work text-xs text-neutral-500">
          {notificationText(notification.body)}
        </span>
      </span>
      <span className="shrink-0 font-work text-xs text-neutral-500">
        {notificationTime(notification.createdAt)}
      </span>
    </>
  );

  return href ? (
    <Link href={href} onClick={onSelect} className={rowCard}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onSelect} className={rowCard}>
      {content}
    </button>
  );
}

export function AnnouncementRow({
  announcement,
  href,
  onSelect,
}: {
  announcement: Announcement;
  href: string;
  onSelect: () => void;
}) {
  const unread = !announcement.isRead;
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(rowCard, "items-start py-5")}
    >
      <span className="mt-2">
        <UnreadDot unread={unread} />
      </span>
      <PersonAvatar
        name={announcement.sender.name}
        colorKey={announcement.sender.id}
        size={40}
        className="bg-neutral-100 text-neutral-800"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate text-neutral-800",
              unread ? "text-base" : "text-sm",
            )}
          >
            {announcement.title}
          </span>
          <span className="shrink-0 font-work text-xs text-neutral-500">
            {formatShortDate(announcement.createdAt)}
          </span>
        </span>
        <span className="mt-1 block truncate font-work text-xs text-neutral-500">
          {announcement.body.replace(/\s+/g, " ")}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-work text-xs">
          <span className="text-neutral-800">{announcement.sender.name}</span>
          <span className="text-neutral-500">
            · {senderRoleLabels[announcement.sender.role]}
          </span>
          {announcement.isPinned && (
            <span className="ml-1 rounded-full bg-surface-warning-badge px-2 py-0.5 text-text-warning">
              Pinned
            </span>
          )}
          {announcement.attachments.length > 0 && (
            <Paperclip
              aria-label="Has attachment"
              className="ml-1 size-3.5 text-neutral-500"
            />
          )}
        </span>
      </span>
    </Link>
  );
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-work text-xs font-medium tracking-wider text-neutral-500 uppercase">
      {children}
    </p>
  );
}

/** The grey box the empty, caught-up and error states sit in. */
export function NoticeBox({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-neutral-100 px-6 py-20 text-center">
      <Icon className="mb-3 size-5 text-neutral-800" strokeWidth={1.75} />
      <p className="text-base text-neutral-800">{title}</p>
      <p className="max-w-72 font-work text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Loading notifications">
      {[3, 2].map((rows, group) => (
        <div key={group}>
          <Skeleton className="mb-3 h-3 w-16" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: rows }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-5 rounded-xl border border-neutral-200 bg-white px-4 py-4"
              >
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
