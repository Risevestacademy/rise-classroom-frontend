"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@base-ui/react/switch";
import {
  Bell,
  CheckIcon,
  ChevronDown,
  CircleCheck,
  Megaphone,
  WifiOff,
} from "lucide-react";

import {
  AnnouncementRow,
  CountBadge,
  GroupLabel,
  NoticeBox,
  NotificationListSkeleton,
  NotificationRow,
} from "@/components/notifications/NotificationParts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ANNOUNCEMENTS_PATH,
  NOTIFICATIONS_PATH,
  announcementHref,
  groupByDay,
  isAnnouncementNotification,
  useAnnouncements,
  useStudentNotifications,
  type AnnouncementSenderRole,
} from "@/lib/student-notifications";
import { cn } from "@/lib/utils";

type Tab = "all" | "announcements" | "activity";
type SenderFilter = "all" | AnnouncementSenderRole;

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

function toTab(value: string | null): Tab {
  return value === "announcements" || value === "activity" ? value : "all";
}

export default function NotificationsPage() {
  return (
    <React.Suspense fallback={<NotificationsColumn><NotificationListSkeleton /></NotificationsColumn>}>
      <Notifications />
    </React.Suspense>
  );
}

function NotificationsColumn({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-180 flex-col gap-6">{children}</div>;
}

function Notifications() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = toTab(searchParams.get("tab"));
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [sender, setSender] = React.useState<SenderFilter>("all");

  const notifications = useStudentNotifications();
  const announcements = useAnnouncements();

  const activity = notifications.notifications.filter(
    (item) => !isAnnouncementNotification(item),
  );
  const activityUnread = activity.filter((item) => !item.isRead).length;
  const anyUnread = notifications.unreadCount > 0 || announcements.unreadCount > 0;

  const isPending =
    tab === "announcements" ? announcements.isPending : notifications.isPending;
  const isError =
    tab === "announcements" ? announcements.isError : notifications.isError;
  const isEmpty =
    !notifications.isPending &&
    !announcements.isPending &&
    notifications.notifications.length === 0 &&
    announcements.announcements.length === 0;

  function selectTab(next: Tab) {
    router.replace(
      next === "all" ? NOTIFICATIONS_PATH : `${NOTIFICATIONS_PATH}?tab=${next}`,
      { scroll: false },
    );
  }

  function markAllRead() {
    notifications.markRead();
    announcements.markRead();
  }

  return (
    <NotificationsColumn>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-800">Notifications</h1>
          <p className="mt-1 font-work text-sm text-neutral-500">
            Updates about your classes, assignments and mentor
          </p>
        </div>
        {!isEmpty && !notifications.isError && (
          <Button
            variant="secondary"
            size="medium"
            onClick={markAllRead}
            disabled={!anyUnread}
            className="shrink-0 bg-white"
          >
            <CircleCheck />
            <span className="hidden sm:inline">Mark all as read</span>
          </Button>
        )}
      </div>

      {isEmpty && !isError ? (
        <NoticeBox
          icon={Bell}
          title="No notifications yet"
          description="Updates about your classes, assignments and mentor will appear here."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Notification type" className="flex items-center gap-1">
              {tabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.value}
                  onClick={() => selectTab(item.value)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-4 text-sm text-neutral-600 transition-colors hover:text-neutral-800",
                    tab === item.value && "bg-neutral-100 text-neutral-800",
                  )}
                >
                  {item.label}
                  {item.value === "announcements" && (
                    <CountBadge count={announcements.unreadCount} />
                  )}
                  {item.value === "activity" && <CountBadge count={activityUnread} />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
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

          {isPending ? (
            <NotificationListSkeleton />
          ) : isError ? (
            <NoticeBox
              icon={WifiOff}
              title="Couldn't load notifications"
              description="Check your internet connection and try again."
              action={
                <Button
                  variant="secondary"
                  className="bg-white"
                  onClick={() =>
                    tab === "announcements"
                      ? announcements.refetch()
                      : notifications.refetch()
                  }
                >
                  Try again
                </Button>
              }
            />
          ) : tab === "announcements" ? (
            <AnnouncementList
              sender={sender}
              unreadOnly={unreadOnly}
              onShowAll={() => setUnreadOnly(false)}
            />
          ) : (
            <NotificationList
              tab={tab}
              unreadOnly={unreadOnly}
              onShowAll={() => setUnreadOnly(false)}
            />
          )}
        </>
      )}
    </NotificationsColumn>
  );
}

function CaughtUp({ onShowAll }: { onShowAll: () => void }) {
  return (
    <NoticeBox
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

function NotificationList({
  tab,
  unreadOnly,
  onShowAll,
}: {
  tab: Exclude<Tab, "announcements">;
  unreadOnly: boolean;
  onShowAll: () => void;
}) {
  const { notifications, markRead } = useStudentNotifications();
  const inTab =
    tab === "activity"
      ? notifications.filter((item) => !isAnnouncementNotification(item))
      : notifications;
  const visible = unreadOnly ? inTab.filter((item) => !item.isRead) : inTab;

  if (visible.length === 0) {
    if (unreadOnly && inTab.length > 0) return <CaughtUp onShowAll={onShowAll} />;
    return (
      <NoticeBox
        icon={Bell}
        title={tab === "activity" ? "No activity yet" : "No notifications yet"}
        description="Updates about your classes, assignments and mentor will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByDay(visible).map((group) => (
        <section key={group.label}>
          <GroupLabel>{group.label}</GroupLabel>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <NotificationRow
                key={item.id}
                notification={item}
                href={isAnnouncementNotification(item) ? ANNOUNCEMENTS_PATH : undefined}
                onSelect={() => markRead(item.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AnnouncementList({
  sender,
  unreadOnly,
  onShowAll,
}: {
  sender: SenderFilter;
  unreadOnly: boolean;
  onShowAll: () => void;
}) {
  const { announcements, markRead } = useAnnouncements();
  const fromSender =
    sender === "all"
      ? announcements
      : announcements.filter((item) => item.sender.role === sender);
  const visible = unreadOnly
    ? fromSender.filter((item) => !item.isRead)
    : fromSender;

  if (visible.length === 0) {
    if (unreadOnly && fromSender.length > 0) return <CaughtUp onShowAll={onShowAll} />;
    return (
      <NoticeBox
        icon={Megaphone}
        title="No announcements yet"
        description={
          announcements.length > 0
            ? "No announcements from this sender yet."
            : "Announcements from your program coordinator and instructors will appear here."
        }
      />
    );
  }

  const byNewest = [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sections = [
    { label: "Pinned", items: byNewest.filter((item) => item.isPinned) },
    { label: "Latest", items: byNewest.filter((item) => !item.isPinned) },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.label}>
          <GroupLabel>{section.label}</GroupLabel>
          <div className="flex flex-col gap-3">
            {section.items.map((item) => (
              <AnnouncementRow
                key={item.id}
                announcement={item}
                href={announcementHref(item.id)}
                onSelect={() => markRead(item.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
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
