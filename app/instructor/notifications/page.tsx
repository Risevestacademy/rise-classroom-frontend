"use client";

import * as React from "react";
import Link from "next/link";
import { Switch } from "@base-ui/react/switch";
import {
  Bell,
  CalendarDays,
  CheckIcon,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Megaphone,
  Paperclip,
  Video,
  type LucideIcon,
} from "lucide-react";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  instructorAnnouncements,
  instructorNotifications,
  instructorNotificationRoleLabels,
  isInstructorItemRead,
  markAllInstructorItemsRead,
  markInstructorItemRead,
  type InstructorAnnouncement,
  type InstructorNotification,
  type InstructorNotificationKind,
  type InstructorAnnouncementRole,
} from "@/lib/instructor-notifications";
import { cn } from "@/lib/utils";

const NOTIFICATIONS_PATH = "/instructor/notifications";

type Tab = "all" | "announcements" | "activity";
type SenderFilter = "all" | InstructorAnnouncementRole;

const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "announcements", label: "Announcements" },
  { value: "activity", label: "Activity" },
];

const senderFilters: { value: SenderFilter; label: string }[] = [
  { value: "all", label: "All senders" },
  { value: "PROGRAM_COORDINATOR", label: "Program coordinator" },
  { value: "INSTRUCTOR", label: "Instructors" },
];

const notificationIcons: Record<InstructorNotificationKind, LucideIcon> = {
  assignment: ClipboardList,
  announcement: Megaphone,
  "live-class": Video,
  calendar: CalendarDays,
};

export default function NotificationsPage() {
  return (
    <>
      <InstructorNavbar
        breadcrumb={[
          "Communication",
          { label: "Notifications", href: NOTIFICATIONS_PATH },
        ]}
      />
      <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 p-6">
        <Notifications />
      </main>
    </>
  );
}

function Notifications() {
  const [tab, setTab] = React.useState<Tab>("all");
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [sender, setSender] = React.useState<SenderFilter>("all");
  const [, setReadRevision] = React.useState(0);

  const isNotificationUnread = (item: InstructorNotification) =>
    !isInstructorItemRead(item.id, item.isRead);
  const isAnnouncementUnread = (item: InstructorAnnouncement) =>
    !isInstructorItemRead(item.id, item.isRead);

  const unreadCount =
    instructorNotifications.filter(isNotificationUnread).length +
    instructorAnnouncements.filter(isAnnouncementUnread).length;
  const announcementUnreadCount =
    instructorAnnouncements.filter(isAnnouncementUnread).length;

  function markRead(id: string) {
    markInstructorItemRead(id);
    setReadRevision((revision) => revision + 1);
  }

  function markAllRead() {
    markAllInstructorItemsRead();
    setReadRevision((revision) => revision + 1);
  }

  const isEmpty =
    instructorNotifications.length === 0 && instructorAnnouncements.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-[650px] flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Notifications
          </h1>
          <p className="mt-1 font-work text-sm text-neutral-500">
            Updates about your classes, students, and activities
          </p>
        </div>
        {!isEmpty && (
          <Button
            variant="secondary"
            size="medium"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="shrink-0 bg-white"
          >
            <CircleCheck />
            <span className="hidden sm:inline">Mark all as read</span>
          </Button>
        )}
      </div>

      {isEmpty ? (
        <NoticePanel
          icon={Bell}
          title="No notifications yet"
          description="Updates about your classes, students, and activities will appear here."
        />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList
              aria-label="Notification type"
              className="flex !h-auto items-center gap-1 rounded-xl bg-neutral-100 p-1"
            >
              {tabs.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-normal text-neutral-600 transition-colors hover:text-neutral-800 data-active:bg-white data-active:text-neutral-800 data-active:shadow-sm"
                >
                  {item.label}
                  {item.value === "announcements" && (
                    <span className="flex items-center">
                      <CountBadge count={announcementUnreadCount} />
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex flex-wrap items-center gap-4">
              {tab === "announcements" && (
                <SenderMenu value={sender} onChange={setSender} />
              )}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
                <Switch.Root
                  checked={unreadOnly}
                  onCheckedChange={setUnreadOnly}
                  className="flex h-4 w-7 shrink-0 items-center rounded-full bg-neutral-300 p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 data-[checked]:bg-brand-primary"
                >
                  <Switch.Thumb className="size-3 rounded-full bg-white transition-transform data-[checked]:translate-x-3" />
                </Switch.Root>
                Unread only
              </label>
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <NotificationList
              tab="all"
              unreadOnly={unreadOnly}
              isUnread={isNotificationUnread}
              onRead={markRead}
              onShowAll={() => setUnreadOnly(false)}
            />
          </TabsContent>

          <TabsContent value="announcements" className="mt-0">
            <AnnouncementList
              sender={sender}
              unreadOnly={unreadOnly}
              isUnread={isAnnouncementUnread}
              onRead={markRead}
              onShowAll={() => setUnreadOnly(false)}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <NotificationList
              tab="activity"
              unreadOnly={unreadOnly}
              isUnread={isNotificationUnread}
              onRead={markRead}
              onShowAll={() => setUnreadOnly(false)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function NotificationList({
  tab,
  unreadOnly,
  isUnread,
  onRead,
  onShowAll,
}: {
  tab: Exclude<Tab, "announcements">;
  unreadOnly: boolean;
  isUnread: (item: InstructorNotification) => boolean;
  onRead: (id: string) => void;
  onShowAll: () => void;
}) {
  const inTab =
    tab === "activity"
      ? instructorNotifications.filter((item) => item.kind !== "announcement")
      : instructorNotifications;
  const visible = unreadOnly ? inTab.filter(isUnread) : inTab;

  if (visible.length === 0) {
    if (unreadOnly && inTab.length > 0) {
      return <CaughtUp onShowAll={onShowAll} />;
    }
    return (
      <NoticePanel
        icon={Bell}
        title={tab === "activity" ? "No activity yet" : "No notifications yet"}
        description="Updates about your classes, students, and activities will appear here."
      />
    );
  }

  const groups = groupByDay(visible);
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label}>
          <GroupLabel>{group.label}</GroupLabel>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <li key={item.id}>
                <NotificationItem
                  item={item}
                  unread={isUnread(item)}
                  onRead={() => onRead(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NotificationItem({
  item,
  unread,
  onRead,
}: {
  item: InstructorNotification;
  unread: boolean;
  onRead: () => void;
}) {
  const Icon = notificationIcons[item.kind];
  const className =
    "flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-left hover:bg-neutral-50";
  const content = (
    <>
      <UnreadDot unread={unread} />
      <NotificationIcon icon={Icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-neutral-800">
          {item.title}
        </span>
        <span className="mt-0.5 block truncate font-work text-xs text-neutral-500">
          {item.body}
        </span>
      </span>
      <span className="shrink-0 font-work text-xs text-neutral-500">
        {timeAgo(item.createdAt)}
      </span>
    </>
  );

  return item.announcementId ? (
    <Link
      href={`${NOTIFICATIONS_PATH}/announcements/${item.announcementId}`}
      onClick={onRead}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onRead} className={className}>
      {content}
    </button>
  );
}

function AnnouncementList({
  sender,
  unreadOnly,
  isUnread,
  onRead,
  onShowAll,
}: {
  sender: SenderFilter;
  unreadOnly: boolean;
  isUnread: (item: InstructorAnnouncement) => boolean;
  onRead: (id: string) => void;
  onShowAll: () => void;
}) {
  const fromSender =
    sender === "all"
      ? instructorAnnouncements
      : instructorAnnouncements.filter((item) => item.sender.role === sender);
  const visible = unreadOnly ? fromSender.filter(isUnread) : fromSender;

  if (visible.length === 0) {
    if (unreadOnly && fromSender.length > 0) {
      return <CaughtUp onShowAll={onShowAll} />;
    }
    return (
      <NoticePanel
        icon={Megaphone}
        title="No announcements yet"
        description={
          instructorAnnouncements.length > 0
            ? "No announcements from this sender yet."
            : "Announcements from your program coordinator and instructors will appear here."
        }
      />
    );
  }

  const byNewest = [...visible].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const sections = [
    { label: "Pinned", items: byNewest.filter((item) => item.isPinned) },
    { label: "Latest", items: byNewest.filter((item) => !item.isPinned) },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.label}>
          <GroupLabel>{section.label}</GroupLabel>
          <ul className="flex flex-col gap-3">
            {section.items.map((item) => (
              <li key={item.id}>
                <AnnouncementItem
                  item={item}
                  unread={isUnread(item)}
                  onRead={() => onRead(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AnnouncementItem({
  item,
  unread,
  onRead,
}: {
  item: InstructorAnnouncement;
  unread: boolean;
  onRead: () => void;
}) {
  const initials = item.sender.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`${NOTIFICATIONS_PATH}/announcements/${item.id}`}
      onClick={onRead}
      className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 hover:bg-neutral-50"
    >
      <span className="mt-3">
        <UnreadDot unread={unread} />
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-800">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate text-neutral-800",
              unread ? "text-base" : "text-sm",
            )}
          >
            {item.title}
          </span>
          <time className="shrink-0 font-work text-xs text-neutral-500">
            {formatShortDate(item.createdAt)}
          </time>
        </span>
        <span className="mt-1 block truncate font-work text-xs text-neutral-500">
          {item.body.split(/\n/)[0]}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-work text-xs">
          <span className="text-neutral-800">{item.sender.name}</span>
          <span className="text-neutral-500">
            · {instructorNotificationRoleLabels[item.sender.role]}
          </span>
          {item.isPinned && (
            <span className="ml-1 rounded-full bg-surface-warning-badge px-2 py-0.5 text-text-warning">
              Pinned
            </span>
          )}
          {item.attachments.length > 0 && (
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

function SenderMenu({
  value,
  onChange,
}: {
  value: SenderFilter;
  onChange: (value: SenderFilter) => void;
}) {
  const current = senderFilters.find((item) => item.value === value)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-800 hover:bg-neutral-50">
        {current.label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-60 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg ring-0"
      >
        {senderFilters.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-100 focus:bg-neutral-100",
              item.value === value && "bg-neutral-100",
            )}
          >
            {item.label}
            {item.value === value && (
              <span className="flex size-4 items-center justify-center rounded-full border border-neutral-800">
                <CheckIcon className="size-2.5" />
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CaughtUp({ onShowAll }: { onShowAll: () => void }) {
  return (
    <NoticePanel
      icon={CircleCheck}
      title="You're all caught up"
      description="You have no unread notifications."
      action={
        <Button variant="secondary" className="bg-white" onClick={onShowAll}>
          Show all notifications
        </Button>
      }
    />
  );
}

function NoticePanel({
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
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-100 px-6 py-10 text-center">
      <Icon className="mb-2 size-5 text-neutral-800" strokeWidth={1.75} />
      <p className="text-base text-neutral-800">{title}</p>
      <p className="max-w-72 font-work text-sm text-neutral-500">
        {description}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-work text-xs font-medium tracking-wider text-neutral-500 uppercase">
      {children}
    </h2>
  );
}

function UnreadDot({ unread }: { unread: boolean }) {
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

function NotificationIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-xs font-medium text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function groupByDay(items: InstructorNotification[]) {
  const groups = new Map<string, InstructorNotification[]>();
  for (const item of items) {
    const label = dayGroup(item.createdAt);
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }
  return ["Today", "Yesterday", "Earlier"]
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

function dayGroup(date: string) {
  const now = new Date();
  const value = new Date(date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfValue = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
  const days = Math.round(
    (startOfToday.getTime() - startOfValue.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60_000),
  );
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatShortDate(date);
}