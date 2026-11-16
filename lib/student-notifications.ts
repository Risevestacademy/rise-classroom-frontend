import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import { sampleAnnouncements } from "@/lib/announcement-sample-data";

/** A notification as `/notifications` returns it. */
export type StudentNotification = {
  id: string;
  title: string;
  body: string;
  /** Free-form on the API, e.g. "ASSIGNMENT_DUE", "ANNOUNCEMENT", "LIVE_CLASS". */
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type StudentNotifications = {
  items: StudentNotification[];
  unreadCount: number;
};

export type AnnouncementSenderRole = "PROGRAM_COORDINATOR" | "INSTRUCTOR";

export type AnnouncementAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number | null;
};

export type Announcement = {
  id: string;
  title: string;
  /** Plain text; blank lines separate paragraphs. */
  body: string;
  sender: { id: string; name: string; role: AnnouncementSenderRole };
  isPinned: boolean;
  isRead: boolean;
  attachments: AnnouncementAttachment[];
  createdAt: string;
};

export const senderRoleLabels: Record<AnnouncementSenderRole, string> = {
  PROGRAM_COORDINATOR: "Program coordinator",
  INSTRUCTOR: "Instructor",
};

export const NOTIFICATIONS_PATH = "/student/notifications";
export const ANNOUNCEMENTS_PATH = `${NOTIFICATIONS_PATH}?tab=announcements`;

export function announcementHref(id: string) {
  return `${NOTIFICATIONS_PATH}/announcements/${id}`;
}

/** Announcement notifications belong to the Announcements side of the page. */
export function isAnnouncementNotification(notification: StudentNotification) {
  return notification.type.toUpperCase().includes("ANNOUNCEMENT");
}

/* ---------------------------------------------------------------- API */

async function getNotifications(): Promise<StudentNotifications> {
  const { data, metadata } = await api.get<
    Envelope<StudentNotification[]> & { metadata: { unreadCount: number } }
  >("/notifications", { query: { limit: 50 } });
  return { items: data, unreadCount: metadata.unreadCount };
}

function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`);
}

function markAllNotificationsRead() {
  return api.patch("/notifications/read-all");
}

/*
 * PENDING-BACKEND(announcements): there is no announcements endpoint yet. In
 * local development the page shows sample announcements so the flow can be
 * reviewed against the design; deployed builds show the empty state. Swap
 * these for `api.get("/announcements")` / `api.get("/announcements/:id")`
 * once it exists.
 */
const useSampleAnnouncements = process.env.NODE_ENV === "development";

async function getAnnouncements(): Promise<Announcement[]> {
  return useSampleAnnouncements ? sampleAnnouncements() : [];
}

async function getAnnouncement(id: string): Promise<Announcement | null> {
  const items = await getAnnouncements();
  return items.find((item) => item.id === id) ?? null;
}

export const studentNotificationKeys = {
  notifications: () => ["student", "notifications"] as const,
  announcements: () => ["student", "announcements"] as const,
  announcement: (id: string) => ["student", "announcements", id] as const,
};

export const studentNotificationQueries = {
  notifications: () =>
    queryOptions({
      queryKey: studentNotificationKeys.notifications(),
      queryFn: getNotifications,
      staleTime: 60_000,
    }),
  announcements: () =>
    queryOptions({
      queryKey: studentNotificationKeys.announcements(),
      queryFn: getAnnouncements,
      staleTime: 60_000,
    }),
  announcement: (id: string) =>
    queryOptions({
      queryKey: studentNotificationKeys.announcement(id),
      queryFn: () => getAnnouncement(id),
    }),
};

/* -------------------------------------------------------------- hooks */

/** The student's notifications and a way to mark them read. */
export function useStudentNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery(studentNotificationQueries.notifications());
  const notifications = query.data?.items ?? [];
  const queryKey = studentNotificationKeys.notifications();

  /* Marks them read straight away; a failed save reloads the real state. */
  const mutation = useMutation({
    mutationFn: (id?: string) =>
      id ? markNotificationRead(id) : markAllNotificationsRead(),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<StudentNotifications>(
        queryKey,
        (current) =>
          current && {
            items: current.items.map((item) =>
              id === undefined || item.id === id
                ? { ...item, isRead: true }
                : item,
            ),
            unreadCount: id ? Math.max(0, current.unreadCount - 1) : 0,
          },
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });

  function markRead(id?: string) {
    if (id && notifications.find((item) => item.id === id)?.isRead) return;
    if (!id && notifications.every((item) => item.isRead)) return;
    mutation.mutate(id);
  }

  return {
    notifications,
    unreadCount: query.data?.unreadCount ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    markRead,
  };
}

/** Announcements for the student's cohort and a way to mark them read. */
export function useAnnouncements() {
  const queryClient = useQueryClient();
  const query = useQuery(studentNotificationQueries.announcements());
  const announcements = query.data ?? [];

  /* PENDING-BACKEND(announcements): read state is only kept in the cache. */
  function markRead(id?: string) {
    queryClient.setQueryData<Announcement[]>(
      studentNotificationKeys.announcements(),
      (current) =>
        current?.map((item) =>
          id === undefined || item.id === id ? { ...item, isRead: true } : item,
        ),
    );
  }

  return {
    announcements,
    unreadCount: announcements.filter((item) => !item.isRead).length,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    markRead,
  };
}

/* ------------------------------------------------------------ display */

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type DayGroup = "Today" | "Yesterday" | "Earlier";

export function dayGroupFor(date: string, now = new Date()): DayGroup {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(new Date(date)).getTime()) / DAY_MS,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

/** Today, Yesterday and Earlier, in that order, leaving out empty ones. */
export function groupByDay<T extends { createdAt: string }>(
  items: T[],
  now = new Date(),
) {
  const groups: { label: DayGroup; items: T[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const item of items) {
    groups.find((group) => group.label === dayGroupFor(item.createdAt, now))!
      .items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
}

/** "Sep 22" */
export function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Sep 24, 4:12 PM" */
export function formatDateTime(date: string) {
  const value = new Date(date);
  return `${formatShortDate(date)}, ${value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/** "2h ago" today, "Yesterday", then "Sep 22". */
export function notificationTime(date: string, now = new Date()) {
  const group = dayGroupFor(date, now);
  if (group === "Yesterday") return "Yesterday";
  if (group === "Earlier") return formatShortDate(date);
  const minutes = Math.floor((now.getTime() - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/** "2h", "1d", "3w" — the popover's compact time. */
export function compactTime(date: string, now = new Date()) {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - new Date(date).getTime()) / 60_000),
  );
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
