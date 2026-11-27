"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckIcon, CircleCheck, WifiOff } from "lucide-react";

import {
  AlertCircle,
  ArrowLeft01,
  Assignments,
  BookOpen01,
  Delete02,
  Filter,
  Mentor,
  MoreVertical,
  Notification02,
  UserMultiple,
  Video,
} from "@/assets/icons";
import { GroupLabel, NoticeBox } from "@/components/notifications/NotificationParts";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  categoryOf,
  liveSessionAction,
  liveSessionIdOf,
  notificationCategories,
  notificationStamp,
  useAdminNotifications,
  type AdminNotification,
  type NotificationCategory,
} from "@/lib/admin-notifications";
import {
  liveSessionQueries,
  sessionDate,
  sessionTime,
  typeNames,
} from "@/lib/live-sessions";
import { notificationText } from "@/lib/notification-text";
import { groupByDay } from "@/lib/student-notifications";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread";

const card = "rounded-2xl bg-surface-default";
const iconButton =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
const menuItem =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-text-primary hover:bg-surface-subtle focus:bg-surface-subtle";

const categoryIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  live: Video,
  assignments: Assignments,
  students: UserMultiple,
  mentorship: Mentor,
  lessons: BookOpen01,
  general: Notification02,
};

const timeOfDay = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** The Figma `bell-dot`: marks a notification as unread. */
function BellDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15.833 9.167v1.463c0 .663.264 1.299.733 1.768l.502.502c.277.277.432.652.432 1.043 0 .814-.66 1.474-1.474 1.474H3.974c-.814 0-1.474-.66-1.474-1.474 0-.391.155-.766.432-1.043l.502-.502c.469-.469.733-1.105.733-1.768V8.333A5.833 5.833 0 0 1 10 2.5" />
      <path d="M12.919 15.417a2.917 2.917 0 0 1-5.833 0" />
      <path d="M17.5 4.167a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
    </svg>
  );
}

export function AdminNotificationsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [tab, setTab] = React.useState<Tab>("all");
  const [category, setCategory] = React.useState<NotificationCategory | null>(null);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [confirming, setConfirming] = React.useState<string[] | null>(null);

  const {
    notifications,
    unreadCount,
    totalCount,
    isPending,
    isError,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
    markRead,
    remove,
    isRemoving,
  } = useAdminNotifications();

  const inCategory = category
    ? notifications.filter((item) => categoryOf(item.type) === category)
    : notifications;
  const visible = tab === "unread" ? inCategory.filter((item) => !item.isRead) : inCategory;
  const selected = notifications.find((item) => item.id === selectedId) ?? null;

  const selecting = checked.size > 0;
  const allChecked = visible.length > 0 && visible.every((item) => checked.has(item.id));

  const select = (id: string | null) =>
    router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  // Opening a notification, from here or the bell panel, reads it.
  React.useEffect(() => {
    if (selected && !selected.isRead) markRead(selected.id);
  }, [selected, markRead]);

  function toggleChecked(id: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    if (!confirming) return;
    const ids = confirming;
    remove(ids, {
      onSuccess: () => {
        setConfirming(null);
        setChecked(new Set());
        if (selectedId && ids.includes(selectedId)) select(null);
      },
    });
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 pt-6 pb-6 sm:px-6 lg:px-8">
      <div className={cn(selected && "max-lg:hidden")}>
        <h1 className="text-2xl font-semibold text-text-primary">Notifications</h1>
        <p className="mt-1 text-sm text-text-secondary">Activity and updates across your academy</p>
      </div>

      <div className="mt-8 flex min-h-0 flex-1 gap-4 lg:h-[calc(100vh-177px)] lg:min-h-[560px] lg:flex-none">
        <section
          aria-label="Notification list"
          className={cn(
            card,
            "flex min-h-0 w-full flex-col pt-8 lg:w-[428px] lg:shrink-0",
            selected && "max-lg:hidden",
          )}
        >
          <div className="flex items-center gap-4 px-6">
            <Checkbox
              aria-label={allChecked ? "Clear selection" : "Select all notifications"}
              checked={allChecked}
              indeterminate={selecting && !allChecked}
              disabled={visible.length === 0}
              onCheckedChange={() =>
                setChecked(allChecked ? new Set() : new Set(visible.map((item) => item.id)))
              }
              className="size-5"
            />

            {selecting ? (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="text-sm font-medium text-text-primary">{checked.size} selected</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={() => {
                      markRead([...checked]);
                      setChecked(new Set());
                    }}
                  >
                    <CircleCheck />
                    Mark as read
                  </Button>
                  <button
                    type="button"
                    aria-label="Delete selected"
                    onClick={() => setConfirming([...checked])}
                    className={cn(iconButton, "border border-border-default")}
                  >
                    <Delete02 className="size-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div role="tablist" aria-label="Filter notifications" className="flex gap-3 rounded-xl bg-surface-subtle p-1">
                  {(
                    [
                      { value: "all", label: "All", count: totalCount },
                      { value: "unread", label: "Unread", count: unreadCount },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.value}
                      onClick={() => setTab(item.value)}
                      className={cn(
                        "h-8 cursor-pointer rounded-lg border border-transparent px-3 text-sm whitespace-nowrap text-text-secondary transition-colors",
                        tab === item.value && "border-border-default bg-surface-default text-text-primary",
                      )}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>
                <CategoryMenu value={category} onChange={setCategory} />
              </div>
            )}
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {isPending ? (
              <ListSkeleton />
            ) : isError ? (
              <NoticeBox
                icon={WifiOff}
                title="Couldn't load notifications"
                description="Check your internet connection and try again."
                action={
                  <Button variant="secondary" size="medium" onClick={() => refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : visible.length === 0 ? (
              <EmptyList
                tab={tab}
                filtered={category !== null}
                onReset={() => {
                  setTab("all");
                  setCategory(null);
                }}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {groupByDay(visible).map((group) => (
                  <section key={group.label}>
                    <GroupLabel>{group.label}</GroupLabel>
                    <ul className="flex flex-col gap-4">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                          {selecting && (
                            <Checkbox
                              aria-label={`Select ${item.title}`}
                              checked={checked.has(item.id)}
                              onCheckedChange={() => toggleChecked(item.id)}
                              className="mt-[18px] size-5"
                            />
                          )}
                          <NotificationListRow
                            notification={item}
                            active={item.id === selectedId}
                            onSelect={() => select(item.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                {hasMore && (
                  <Button
                    variant="secondary"
                    size="medium"
                    disabled={isLoadingMore}
                    onClick={() => loadMore()}
                    className="self-center"
                  >
                    {isLoadingMore ? "Loading…" : "Load older notifications"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Notification details"
          className={cn(card, "min-h-0 min-w-0 flex-1 overflow-y-auto p-6 sm:p-8", !selected && "max-lg:hidden")}
        >
          {selected ? (
            <NotificationDetail
              key={selected.id}
              notification={selected}
              onBack={() => select(null)}
              onDelete={() => setConfirming([selected.id])}
              onMarkAllRead={() => markRead()}
              canMarkAllRead={unreadCount > 0}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <Bell className="mb-3 size-5 text-text-primary" strokeWidth={1.75} />
              <p className="text-base text-text-primary">No notification selected</p>
              <p className="max-w-72 text-sm text-text-secondary">
                Choose a notification to see its details and what you can do next.
              </p>
            </div>
          )}
        </section>
      </div>

      <DeleteConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        itemName={
          confirming?.length === 1
            ? (notifications.find((item) => item.id === confirming[0])?.title ?? "this notification")
            : `${confirming?.length ?? 0} notifications`
        }
        isPending={isRemoving}
        onConfirm={confirmDelete}
      />
    </main>
  );
}

function NotificationIcon({ notification }: { notification: AdminNotification }) {
  if (notification.actor) {
    return (
      <PersonAvatar
        name={notification.actor.name}
        src={notification.actor.image}
        size={40}
      />
    );
  }
  if (notification.type === "STUDENT_DANGER") {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-error-badge text-text-error">
        <AlertCircle className="size-5" />
      </span>
    );
  }
  const Icon = categoryIcons[categoryOf(notification.type)];
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-primary">
      <Icon className="size-5" />
    </span>
  );
}

function NotificationListRow({
  notification,
  active,
  onSelect,
}: {
  notification: AdminNotification;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active || undefined}
      className={cn(
        "flex w-full min-w-0 cursor-pointer items-start gap-2.5 rounded-lg py-2 text-left transition-colors hover:bg-surface-subtle hover:px-3",
        active && "bg-surface-subtle px-3",
      )}
    >
      <NotificationIcon notification={notification} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text-primary">{notification.title}</span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-text-secondary">
          {notificationText(notification.body)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs text-text-primary">{timeOfDay(notification.createdAt)}</span>
        {!notification.isRead && <span aria-label="Unread" className="size-2 rounded-full bg-text-error" />}
      </span>
    </button>
  );
}

function NotificationDetail({
  notification,
  onBack,
  onDelete,
  onMarkAllRead,
  canMarkAllRead,
}: {
  notification: AdminNotification;
  onBack: () => void;
  onDelete: () => void;
  onMarkAllRead: () => void;
  canMarkAllRead: boolean;
}) {
  const sessionId = liveSessionIdOf(notification);

  return (
    <article className="flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1 self-start text-sm text-text-secondary hover:text-text-primary lg:hidden"
        >
          <ArrowLeft01 className="size-4" />
          All notifications
        </button>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-text-primary">{notification.title}</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              {notificationStamp(notification.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* PENDING-BACKEND: the API can mark notifications read but not unread. */}
            <button
              type="button"
              aria-label="Mark as unread"
              title="Marking as unread isn't available yet"
              disabled
              className={iconButton}
            >
              <BellDot className="size-5" />
            </button>
            <button type="button" aria-label="Delete notification" onClick={onDelete} className={iconButton}>
              <Delete02 className="size-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="More actions" className={iconButton}>
                <MoreVertical className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 rounded-xl border border-neutral-100 bg-surface-default p-1.5 shadow-lg ring-0"
              >
                <DropdownMenuItem disabled={!canMarkAllRead} onClick={onMarkAllRead} className={menuItem}>
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem className={menuItem} render={<Link href="/admin/settings/notifications" />}>
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex max-w-[501px] flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="text-lg font-semibold text-text-primary">{notificationText(notification.body)}</p>
          {sessionId && <LiveSessionSummary sessionId={sessionId} />}
        </div>
        {sessionId && <LiveSessionButton sessionId={sessionId} />}
      </div>
    </article>
  );
}

const statusChips = {
  live: { label: "Live now", className: "bg-surface-error-badge text-text-error" },
  upcoming: { label: "Upcoming", className: "bg-surface-info-badge text-text-info" },
  completed: { label: "Ended", className: "bg-surface-default-badge text-text-default-badge" },
  cancelled: { label: "Cancelled", className: "bg-surface-default-badge text-text-default-badge" },
} as const;

function LiveSessionSummary({ sessionId }: { sessionId: string }) {
  const query = useQuery(liveSessionQueries.session(sessionId));

  if (query.isPending) return <Skeleton className="h-[116px] rounded-lg" />;
  if (query.isError) {
    return (
      <p className="rounded-lg bg-surface-subtle p-5 text-sm text-text-secondary">
        We couldn&rsquo;t load this session.{" "}
        <button type="button" onClick={() => query.refetch()} className="cursor-pointer font-medium text-text-primary underline">
          Try again
        </button>
      </p>
    );
  }
  const session = query.data;
  if (!session) {
    return (
      <p className="rounded-lg bg-surface-subtle p-5 text-sm text-text-secondary">
        This session is no longer available.
      </p>
    );
  }

  const chip = statusChips[session.status];
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface-subtle p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-lg font-semibold text-text-primary">{session.title}</p>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", chip.className)}>
          {chip.label}
        </span>
      </div>
      <p className="text-sm text-text-secondary">
        {sessionDate(session.date)} · {sessionTime(session)}
        <br />
        {typeNames[session.type]}
        {session.hostName && ` · Hosted by ${session.hostName}`}
      </p>
    </div>
  );
}

function LiveSessionButton({ sessionId }: { sessionId: string }) {
  const query = useQuery(liveSessionQueries.session(sessionId));
  const action = query.data ? liveSessionAction(query.data) : null;
  if (!action) return null;
  return (
    <Link href={action.href} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "self-start")}>
      {action.label === "Join session" && <Video className="size-5" />}
      {action.label}
    </Link>
  );
}

function CategoryMenu({
  value,
  onChange,
}: {
  value: NotificationCategory | null;
  onChange: (value: NotificationCategory | null) => void;
}) {
  const options = [{ value: null, label: "All notifications" }, ...notificationCategories];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={value ? `Filter: ${notificationCategories.find((c) => c.value === value)?.label}` : "Filter notifications"}
        className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-default bg-surface-default text-text-primary hover:bg-surface-subtle"
      >
        <Filter className="size-5" />
        {value && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-primary" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 rounded-xl border border-neutral-100 bg-surface-default p-1.5 shadow-lg ring-0"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value ?? "all"}
            onClick={() => onChange(option.value)}
            className={cn(menuItem, option.value === value && "bg-surface-subtle")}
          >
            {option.label}
            {option.value === value && (
              <span className="flex size-4 items-center justify-center rounded-full border border-text-primary">
                <CheckIcon className="size-2.5" />
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyList({
  tab,
  filtered,
  onReset,
}: {
  tab: Tab;
  filtered: boolean;
  onReset: () => void;
}) {
  if (tab === "unread" || filtered) {
    return (
      <NoticeBox
        icon={CircleCheck}
        title={tab === "unread" && !filtered ? "You're all caught up" : "Nothing here"}
        description={
          tab === "unread" && !filtered
            ? "You have no unread notifications."
            : "No notifications match this filter."
        }
        action={
          <Button variant="secondary" size="medium" onClick={onReset}>
            Show all notifications
          </Button>
        }
      />
    );
  }
  return (
    <NoticeBox
      icon={Bell}
      title="No notifications yet"
      description="Updates across your academy will show up here."
    />
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-label="Loading notifications">
      <Skeleton className="h-4 w-16" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-start gap-2.5 py-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
