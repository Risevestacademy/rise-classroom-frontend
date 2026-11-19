import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Cohort, Track } from "@/lib/admin";
import { api, type Envelope, type Paginated } from "@/lib/api";
import type { OnboardingStatus, UserStatus } from "@/lib/auth";

// Curriculum requests for instructors live in `features/curriculum/api.ts`,
// shared with admins.

export type WeeklyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "OVERDUE";

/** An instructor's assignment to one track within one cohort. */
export type InstructorTrack = {
  id: string;
  instructorId: string;
  trackId: string;
  cohortId: string;
  track: Track;
  cohort?: Cohort;
};

export type InstructorStudent = {
  id: string;
  enrollmentId: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    onboardingStatus: OnboardingStatus;
  };
};

export type InstructorStudentListItem = {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  status: "Active" | "Inactive";
};

export function toInstructorStudentListItems(
  students: InstructorStudent[],
): InstructorStudentListItem[] {
  const byId = new Map<string, InstructorStudentListItem>();

  students.forEach(({ enrollmentId, user }) => {
    byId.set(user.id, {
      id: user.id,
      enrollmentId,
      name: user.name,
      email: user.email,
      status: user.status === "ACTIVE" ? "Active" : "Inactive",
    });
  });

  return Array.from(byId.values());
}

export type WeeklyTask = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: WeeklyTaskStatus;
  submissionLink?: string | null;
  submittedAt?: string | null;
  isLate: boolean;
  reviewedAt?: string | null;
  feedback?: string | null;
  topic?: { id: string; title?: string } | null;
};

export type WeeklyTaskFilters = {
  cohortId?: string;
  trackId?: string;
  studentId?: string;
  status?: WeeklyTaskStatus;
  week?: string;
  page?: number;
  limit?: number;
};

export type NotificationRecord = {
  id: string;
  userId?: string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
};

export type NotificationFilters = {
  page?: number;
  limit?: number;
};

export type CreateNotificationPayload = {
  title: string;
  message?: string;
  body?: string;
  type?: string;
  metadata?: Record<string, unknown>;
};

export type PaginatedNotifications = Paginated<NotificationRecord> & {
  unreadCount?: number;
};

async function listMyTracks() {
  const { data } =
    await api.get<Envelope<InstructorTrack[]>>("/instructor/tracks");

  return data;
}

async function listStudents(params: { cohortId?: string; trackId?: string }) {
  const { data } = await api.get<Envelope<InstructorStudent[]>>(
    "/instructor/students",
    { query: params },
  );

  return data;
}

async function listWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { data } = await api.get<Envelope<Paginated<WeeklyTask>>>(
    "/instructor/weekly-tasks",
    { query: filters },
  );

  return data;
}

/** Number of matching tasks, without pulling a full page of rows. */
async function countWeeklyTasks(filters: WeeklyTaskFilters = {}) {
  const { total } = await listWeeklyTasks({ ...filters, page: 1, limit: 1 });
  return total;
}

async function listNotifications(filters: NotificationFilters = {}) {
  const { data } = await api.get<Envelope<PaginatedNotifications>>(
    "/notifications",
    { query: filters },
  );

  return data;
}

async function getNotificationById(id: string) {
  const { data } = await api.get<Envelope<NotificationRecord>>(
    `/notifications/${id}`,
  );

  return data;
}

export async function createNotification(payload: CreateNotificationPayload) {
  const { data } = await api.post<Envelope<NotificationRecord>>(
    "/notifications",
    payload,
  );

  return data;
}

export async function markNotificationAsRead(id: string) {
  const { data } = await api.patch<Envelope<NotificationRecord>>(
    `/notifications/${id}/read`,
  );

  return data;
}

export async function markAllNotificationsAsRead() {
  return api.patch<{ success: boolean; message: string }>(
    "/notifications/read-all",
  );
}

export async function deleteNotificationById(id: string) {
  return api.delete<{ success: boolean; message: string }>(
    `/notifications/${id}`,
  );
}

export const instructorKeys = {
  myTracks: () => ["instructor", "tracks"] as const,
  students: (params: { cohortId?: string; trackId?: string }) =>
    ["instructor", "students", params] as const,
  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", filters] as const,
  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    ["instructor", "weekly-tasks", "count", filters] as const,
  notifications: (filters: NotificationFilters = {}) =>
    ["instructor", "notifications", filters] as const,
  notificationDetail: (id: string) =>
    ["instructor", "notifications", "detail", id] as const,
};

export const instructorQueries = {
  // Track assignments change rarely, so they can stay cached longer.
  myTracks: () =>
    queryOptions({
      queryKey: instructorKeys.myTracks(),
      queryFn: listMyTracks,
      staleTime: 5 * 60_000,
    }),

  students: (params: { cohortId?: string; trackId?: string }) =>
    queryOptions({
      queryKey: instructorKeys.students(params),
      queryFn: () => listStudents(params),
      enabled: Boolean(params.trackId && params.cohortId),
    }),

  weeklyTasks: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTasks(filters),
      queryFn: () => listWeeklyTasks(filters),
    }),

  weeklyTaskCount: (filters: WeeklyTaskFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.weeklyTaskCount(filters),
      queryFn: () => countWeeklyTasks(filters),
    }),

  notifications: (filters: NotificationFilters = {}) =>
    queryOptions({
      queryKey: instructorKeys.notifications(filters),
      queryFn: () => listNotifications(filters),
    }),

  notificationDetail: (id: string) =>
    queryOptions({
      queryKey: instructorKeys.notificationDetail(id),
      queryFn: () => getNotificationById(id),
      enabled: Boolean(id),
    }),
};

const instructorNotificationFilters = { page: 1, limit: 50 };

/** Instructor notifications backed by the notifications API. */
export function useInstructorNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery(
    instructorQueries.notifications(instructorNotificationFilters),
  );
  const queryKey = instructorKeys.notifications(instructorNotificationFilters);
  const notifications = query.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: async (id?: string): Promise<void> => {
      if (id) {
        await markNotificationAsRead(id);
      } else {
        await markAllNotificationsAsRead();
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<PaginatedNotifications>(
        queryKey,
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              id === undefined || item.id === id
                ? { ...item, isRead: true }
                : item,
            ),
            unreadCount:
              id === undefined
                ? 0
                : Math.max(
                    0,
                    (current.unreadCount ??
                      current.items.filter((item) => !item.isRead).length) - 1,
                  ),
          },
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  function markRead(id?: string) {
    if (id && notifications.find((item) => item.id === id)?.isRead) return;
    mutation.mutate(id);
  }

  return {
    notifications,
    unreadCount:
      query.data?.unreadCount ??
      notifications.filter((item) => !item.isRead).length,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    markRead,
    isMarkReadError: mutation.isError,
  };
}