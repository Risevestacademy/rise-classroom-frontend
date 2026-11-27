import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import type { LiveSession } from "@/lib/live-sessions";

/** A notification as `/notifications` returns it. */
export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  /** Who caused it, or null for system notifications. */
  actor?: { id: string; name: string; image?: string | null; role: string } | null;
  /** e.g. `{ liveSessionId, scheduledStartAt, live }` for live sessions. */
  data?: Record<string, unknown>;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsPage = {
  items: AdminNotification[];
  unreadCount: number;
  totalItems: number;
  nextPage: number | null;
};

const PAGE_SIZE = 50;

async function getNotificationsPage(page: number): Promise<NotificationsPage> {
  const { data, metadata } = await api.get<
    Envelope<AdminNotification[]> & {
      metadata: {
        unreadCount: number;
        pagination?: { totalItems: number; hasNext: boolean };
      };
    }
  >("/notifications", { query: { page, limit: PAGE_SIZE } });
  return {
    items: data,
    unreadCount: metadata.unreadCount,
    totalItems: metadata.pagination?.totalItems ?? data.length,
    nextPage: metadata.pagination?.hasNext ? page + 1 : null,
  };
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch("/notifications/read-all");
}

export function deleteNotification(id: string) {
  return api.delete(`/notifications/${id}`);
}

export const adminNotificationKeys = {
  list: () => ["admin", "notifications"] as const,
};

export const adminNotificationQueries = {
  list: () =>
    infiniteQueryOptions({
      queryKey: adminNotificationKeys.list(),
      queryFn: ({ pageParam }) => getNotificationsPage(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      staleTime: 60_000,
    }),
};

export type NotificationCategory =
  | "live"
  | "assignments"
  | "students"
  | "mentorship"
  | "lessons"
  | "general";

export const notificationCategories: { value: NotificationCategory; label: string }[] = [
  { value: "live", label: "Live sessions" },
  { value: "assignments", label: "Assignments & tasks" },
  { value: "students", label: "Student progress" },
  { value: "mentorship", label: "Mentorship" },
  { value: "lessons", label: "Lessons & recordings" },
  { value: "general", label: "General" },
];

export function categoryOf(type: string): NotificationCategory {
  if (type.startsWith("LIVE_")) return "live";
  if (/^(ASSIGNMENT|TASK)_|^FEEDBACK/.test(type)) return "assignments";
  if (type.startsWith("STUDENT_")) return "students";
  if (type.startsWith("MENTOR_")) return "mentorship";
  if (type === "NEW_LESSONS_AND_RECORDINGS") return "lessons";
  return "general";
}

/** The live session a notification is about, if any. */
export function liveSessionIdOf(notification: AdminNotification) {
  const fromData = notification.data?.liveSessionId;
  if (typeof fromData === "string") return fromData;
  return notification.entityType === "LIVE_SESSION" ? notification.entityId ?? null : null;
}

export type NotificationAction = { label: string; href: string };

/** The detail pane's main button, from the session's status right now. */
export function liveSessionAction(
  session: Pick<LiveSession, "id" | "status">,
): NotificationAction | null {
  if (session.status === "live") {
    return { label: "Join session", href: `/admin/live/${session.id}` };
  }
  if (session.status === "cancelled") return null;
  return {
    label: "View live session",
    href: `/admin/live-sessions?session=${session.id}`,
  };
}

/** "Today at 6:47 AM", "Yesterday at 9:47 AM", then "Sep 22 at 9:47 AM". */
export function notificationStamp(date: string, now = new Date()) {
  const value = new Date(date);
  const time = value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(value)) / 86_400_000);
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  const label = value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(value.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
  return `${label} at ${time}`;
}

type Cache = InfiniteData<NotificationsPage, number>;

/** The admin's notifications, with ways to mark them read and delete them. */
export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery(adminNotificationQueries.list());
  const pages = query.data?.pages ?? [];
  const notifications = pages.flatMap((page) => page.items);
  const queryKey = adminNotificationKeys.list();

  /* Changes show straight away; a failed save reloads the real state. */
  async function patch(change: (items: AdminNotification[]) => {
    items: AdminNotification[];
    unreadDrop: number;
    totalDrop: number;
  }) {
    await queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData<Cache>(queryKey, (current) => {
      if (!current) return current;
      const results = current.pages.map((page) => change(page.items));
      const unreadDrop = results.reduce((sum, result) => sum + result.unreadDrop, 0);
      const totalDrop = results.reduce((sum, result) => sum + result.totalDrop, 0);
      return {
        ...current,
        pages: current.pages.map((page, index) => ({
          ...page,
          items: results[index].items,
          unreadCount: Math.max(0, page.unreadCount - unreadDrop),
          totalItems: Math.max(0, page.totalItems - totalDrop),
        })),
      };
    });
  }
  const reload = () => queryClient.invalidateQueries({ queryKey });

  const read = useMutation({
    mutationFn: (ids?: string[]) =>
      ids
        ? Promise.all(ids.map(markNotificationRead))
        : markAllNotificationsRead(),
    onMutate: (ids) =>
      patch((items) => ({
        items: items.map((item) =>
          !ids || ids.includes(item.id) ? { ...item, isRead: true } : item,
        ),
        unreadDrop: ids
          ? items.filter((item) => ids.includes(item.id) && !item.isRead).length
          : Infinity,
        totalDrop: 0,
      })),
    onError: reload,
  });

  const removal = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(deleteNotification)),
    onMutate: (ids) =>
      patch((items) => ({
        items: items.filter((item) => !ids.includes(item.id)),
        unreadDrop: items.filter((item) => ids.includes(item.id) && !item.isRead).length,
        totalDrop: items.filter((item) => ids.includes(item.id)).length,
      })),
    onError: reload,
  });

  /** One notification, several, or with no argument, all of them. */
  function markRead(ids?: string | string[]) {
    if (ids === undefined) return read.mutate(undefined);
    const unread = [ids]
      .flat()
      .filter((id) => notifications.find((item) => item.id === id)?.isRead === false);
    if (unread.length > 0) read.mutate(unread);
  }

  return {
    notifications,
    unreadCount: pages[0]?.unreadCount ?? 0,
    totalCount: pages[0]?.totalItems ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
    markRead,
    remove: removal.mutate,
    isRemoving: removal.isPending,
  };
}
