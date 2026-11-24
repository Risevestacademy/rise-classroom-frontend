import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope } from "@/lib/api";
import {
  fieldTime,
  fromDateKey,
  monthNames,
  weekdayNames,
} from "@/lib/calendar";
import type { JoinBlock } from "@/lib/live-room";

type Person = {
  id: string;
  name: string;
  displayName?: string | null;
  image?: string | null;
};

/** A session as the API returns it. */
export type ApiLiveSession = {
  id: string;
  title: string;
  description?: string | null;
  roomName: string;
  type:
    | "TOWNHALL"
    | "TRACK_MEETING"
    | "MENTORSHIP_GROUP"
    | "MENTORSHIP_PAIR"
    | "EXPLICIT_INVITE";
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  hostId: string;
  host?: Person | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  timezone?: string | null;
  track?: { id: string; name: string } | null;
  cohort?: { id: string; name: string } | null;
  /** Mentorship sessions: the mentor, and for a pair, the mentorship. */
  mentorId?: string | null;
  mentorshipId?: string | null;
  /** Set on the sessions of a repeating series. */
  seriesId?: string | null;
};

/** `GET /live-sessions/:id/entry`: whether, and how, the signed-in user may join. */
export type SessionEntry = {
  session: Pick<
    ApiLiveSession,
    | "id"
    | "title"
    | "description"
    | "type"
    | "status"
    | "scheduledStartAt"
    | "scheduledEndAt"
    | "timezone"
  > & {
    host?: Person | null;
  };
  participant: {
    userId: string;
    platformRole: string;
    sessionRole: "HOST" | "MODERATOR" | "PARTICIPANT";
  };
  join: {
    eligible: boolean;
    canJoinNow: boolean;
    blockedReason: "NOT_STARTED" | "ENDED" | "CANCELLED" | null;
    canStart: boolean;
  };
  permissions: {
    canJoin: boolean;
    canViewParticipants: boolean;
    canReadChat: boolean;
    canSendChat: boolean;
    canPublishMedia: boolean;
    canShareScreen: boolean;
    canModerate: boolean;
  };
  chat: {
    canRead: boolean;
    canSend: boolean;
    maxLength: number;
    realtimeTopic: string;
  };
};

export type SessionParticipant = {
  userId: string;
  name: string;
  displayName?: string | null;
  image?: string | null;
  platformRole: string;
  sessionRole: SessionEntry["participant"]["sessionRole"];
  /** Only shown to hosts and moderators. */
  email?: string;
};

export type ChatMessage = {
  id: string;
  body: string;
  clientMessageId?: string | null;
  createdAt: string;
  sender: Person & { sessionRole?: SessionEntry["participant"]["sessionRole"] };
};

/** A session ready to show, in the session's own time zone. */
export type LiveSession = {
  id: string;
  title: string;
  description: string;
  type: ApiLiveSession["type"];
  timeZone: string;
  seriesId: string | null;
  status: "live" | "upcoming" | "completed" | "cancelled";
  /** "2026-11-23", in the session's time zone. */
  date: string;
  /** "19:00" */
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
  /** The day it ends, in the session's time zone. */
  endDate: string;
  trackId: string | null;
  trackName: string;
  hostId: string;
  hostName: string;
  mentorId: string | null;
  mentorshipId: string | null;
};

/** Rise runs on Lagos time; a session can name another zone. */
export const DEFAULT_TIME_ZONE = "Africa/Lagos";

const statuses = {
  LIVE: "live",
  SCHEDULED: "upcoming",
  ENDED: "completed",
  CANCELLED: "cancelled",
} as const;

export const typeNames: Record<ApiLiveSession["type"], string> = {
  TOWNHALL: "Town hall",
  TRACK_MEETING: "Track meeting",
  MENTORSHIP_GROUP: "Mentorship",
  MENTORSHIP_PAIR: "Mentorship",
  EXPLICIT_INVITE: "Invite only",
};

/** The date ("2026-11-23") and time ("19:00") of an instant in a time zone. */
export function zonedParts(iso: string, timeZone = DEFAULT_TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export const personName = (person?: Person | null) =>
  person?.displayName || person?.name || "";

/** How long past its end a session still counts as live, for classes that run over. */
export const OVERRUN_MS = 60 * 60_000;

/**
 * The status to show. The backend never closes a session by itself: one
 * nobody started stays SCHEDULED, and one nobody ended stays LIVE. So a
 * scheduled session whose time is over, or a live one an hour past its end,
 * shows as completed.
 * PENDING-BACKEND: drop this once sessions end on their own.
 */
function shownStatus(
  session: ApiLiveSession,
  now: number,
): LiveSession["status"] {
  const end = Date.parse(session.scheduledEndAt);
  if (session.status === "SCHEDULED" && end <= now) return "completed";
  if (session.status === "LIVE" && end + OVERRUN_MS <= now) return "completed";
  return statuses[session.status];
}

export function toLiveSession(
  session: ApiLiveSession,
  now = Date.now(),
): LiveSession {
  const zone = session.timezone || DEFAULT_TIME_ZONE;
  const start = zonedParts(session.scheduledStartAt, zone);
  return {
    id: session.id,
    title: session.title,
    description: session.description ?? "",
    type: session.type,
    timeZone: zone,
    seriesId: session.seriesId ?? null,
    status: shownStatus(session, now),
    date: start.date,
    startTime: start.time,
    endTime: zonedParts(session.scheduledEndAt, zone).time,
    startsAt: session.scheduledStartAt,
    endsAt: session.scheduledEndAt,
    endDate: zonedParts(session.scheduledEndAt, zone).date,
    trackId: session.track?.id ?? null,
    trackName:
      session.track?.name ?? session.cohort?.name ?? typeNames[session.type],
    hostId: session.hostId,
    hostName: personName(session.host),
    mentorId: session.mentorId ?? null,
    mentorshipId: session.mentorshipId ?? null,
  };
}

/** "Sat, Nov 7 2026" */
export function sessionDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  return `${weekdayNames[date.getDay()].slice(0, 3)}, ${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()} ${date.getFullYear()}`;
}

/** "7:00 PM - 8:00 PM" */
export function sessionTime(
  session: Pick<LiveSession, "startTime" | "endTime">,
) {
  const clock = (time: string) => fieldTime(time).replace(/(AM|PM)$/, " $1");
  return `${clock(session.startTime)} - ${clock(session.endTime)}`;
}

/** "Wed, September 24 9:00 PM", as on the design's entrance screen. */
export function sessionWhen(session: Pick<LiveSession, "date" | "startTime">) {
  const date = fromDateKey(session.date);
  const time = fieldTime(session.startTime).replace(/(AM|PM)$/, " $1");
  return `${weekdayNames[date.getDay()].slice(0, 3)}, ${monthNames[date.getMonth()]} ${date.getDate()} ${time}`;
}

/** The session's start and end as moments in time. */
export const sessionSpan = (
  session: Pick<LiveSession, "startsAt" | "endsAt">,
) => ({
  start: new Date(session.startsAt),
  end: new Date(session.endsAt),
});

/** Why the signed-in user can't join yet, if anything. A host can start it. */
export function joinBlockFor(entry: SessionEntry): JoinBlock | undefined {
  if (!entry.join.eligible) return "not_eligible";
  if (entry.join.blockedReason === "ENDED") return "ended";
  if (entry.join.blockedReason === "CANCELLED") return "cancelled";
  if (entry.join.blockedReason === "NOT_STARTED" && !entry.join.canStart)
    return "too_early";
  return undefined;
}

/** What the backend lets someone do once they're in the room. */
export type RoomAccess = {
  userId: string;
  sessionRole: SessionEntry["participant"]["sessionRole"];
  /** e.g. "INSTRUCTOR", for the label beside their name. */
  platformRole: string;
  canShareScreen: boolean;
  canModerate: boolean;
  canReadChat: boolean;
  canSendChat: boolean;
  chatMaxLength: number;
};

export const roomAccess = (entry: SessionEntry): RoomAccess => ({
  userId: entry.participant.userId,
  sessionRole: entry.participant.sessionRole,
  platformRole: entry.participant.platformRole,
  canShareScreen: entry.permissions.canShareScreen,
  canModerate: entry.permissions.canModerate,
  canReadChat: entry.chat.canRead,
  canSendChat: entry.chat.canSend,
  chatMaxLength: entry.chat.maxLength,
});

/** The entry details as a session to show. */
export const entrySession = (entry: SessionEntry) =>
  toLiveSession({
    ...entry.session,
    roomName: "",
    hostId: entry.session.host?.id ?? "",
  });

type ListFilter = { from?: string; to?: string; mentorId?: string };

/** Every session the signed-in user can see between two instants (all of them without a range). */
async function listLiveSessions(range: ListFilter) {
  const items: ApiLiveSession[] = [];
  let cursor: string | undefined;
  // A few pages is plenty for a week, or the whole list until it's paginated on screen.
  for (let page = 0; page < 5; page += 1) {
    const { data } = await api.get<
      Envelope<{ items: ApiLiveSession[]; nextCursor?: string | null }>
    >("/live-sessions", {
      query: { ...range, limit: 100, cursor },
    });
    items.push(...data.items);
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return items
    .map(toLiveSession)
    .filter((session) => session.status !== "cancelled");
}

/** Who came to a finished session, from `GET /live-sessions/:id/attendance`. */
export type AttendanceRecord = {
  userId: string;
  name: string;
  displayName?: string | null;
  image?: string | null;
  /** Present once connected for 5 minutes and 60% of the session. */
  status: "PRESENT" | "ABSENT";
  connectedSeconds: number;
};

type ApiAttendance = {
  attendances: {
    user: {
      id: string;
      name: string;
      displayName?: string | null;
      image?: string | null;
    };
    status: AttendanceRecord["status"];
    totalConnectedSeconds: number;
  }[];
};

/** A session's recording, from `GET /live-sessions/:id/recording`. */
export type SessionRecording = {
  id: string;
  status: "NOT_STARTED" | "RECORDING" | "PROCESSING" | "READY" | "FAILED";
  durationSeconds: number | null;
};

export const liveSessionKeys = {
  all: ["live-sessions"] as const,
  list: (range: ListFilter) => ["live-sessions", "list", range] as const,
  participants: (id: string) => ["live-sessions", id, "participants"] as const,
  attendance: (id: string) => ["live-sessions", id, "attendance"] as const,
  recording: (id: string) => ["live-sessions", id, "recording"] as const,
  recordingUrl: (id: string) =>
    ["live-sessions", id, "recording", "url"] as const,
  chat: (id: string) => ["live-sessions", id, "chat"] as const,
};

export const liveSessionQueries = {
  list: (range: ListFilter = {}) =>
    queryOptions({
      queryKey: liveSessionKeys.list(range),
      queryFn: () => listLiveSessions(range),
    }),

  /** `null` when the session wasn't recorded. */
  recording: (id: string) =>
    queryOptions({
      queryKey: liveSessionKeys.recording(id),
      queryFn: async () => {
        try {
          return (
            await api.get<Envelope<SessionRecording>>(
              `/live-sessions/${id}/recording`,
            )
          ).data;
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      },
      retry: false,
    }),

  /** A link to watch it, valid for an hour. */
  recordingUrl: (id: string) =>
    queryOptions({
      queryKey: liveSessionKeys.recordingUrl(id),
      queryFn: async () =>
        (
          await api.get<Envelope<{ signedUrl: string }>>(
            `/live-sessions/${id}/recording/url`,
          )
        ).data.signedUrl,
      // A fresh link would restart the video, so keep this one while watching.
      staleTime: 50 * 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    }),

  /** Present first, then the rest. */
  attendance: (id: string) =>
    queryOptions({
      queryKey: liveSessionKeys.attendance(id),
      queryFn: async (): Promise<AttendanceRecord[]> =>
        (
          await api.get<Envelope<ApiAttendance>>(
            `/live-sessions/${id}/attendance`,
          )
        ).data.attendances
          .map((record) => ({
            userId: record.user.id,
            name: record.user.name,
            displayName: record.user.displayName,
            image: record.user.image,
            status: record.status,
            connectedSeconds: record.totalConnectedSeconds,
          }))
          .sort(
            (a, b) =>
              Number(b.status === "PRESENT") - Number(a.status === "PRESENT"),
          ),
      retry: false,
    }),

  participants: (id: string) =>
    queryOptions({
      queryKey: liveSessionKeys.participants(id),
      queryFn: async () =>
        (
          await api.get<
            Envelope<{ items: SessionParticipant[]; total: number }>
          >(`/live-sessions/${id}/participants`)
        ).data.items,
    }),

  /** The latest page of chat, oldest first. */
  chat: (id: string) =>
    queryOptions({
      queryKey: liveSessionKeys.chat(id),
      queryFn: async () =>
        (
          await api.get<Envelope<{ items: ChatMessage[] }>>(
            `/live-sessions/${id}/chat/messages`,
            { query: { limit: 100 } },
          )
        ).data.items,
      staleTime: Infinity,
    }),
};

export const getSessionEntry = async (
  id: string,
  options?: { cookie?: string },
) =>
  (
    await api.get<Envelope<SessionEntry>>(`/live-sessions/${id}/entry`, {
      cache: "no-store",
      headers: options?.cookie ? { cookie: options.cookie } : undefined,
    })
  ).data;

export const getLiveSession = async (
  id: string,
  options?: { cookie?: string },
) =>
  (
    await api.get<Envelope<ApiLiveSession>>(`/live-sessions/${id}`, {
      cache: "no-store",
      headers: options?.cookie ? { cookie: options.cookie } : undefined,
    })
  ).data;

export const startLiveSession = (id: string) =>
  api.post(`/live-sessions/${id}/start`);

export const sendChatMessage = async (
  id: string,
  body: string,
  clientMessageId: string,
) =>
  (
    await api.post<
      Envelope<{
        message: ChatMessage;
        delivered: boolean | null;
        duplicate: boolean;
      }>
    >(`/live-sessions/${id}/chat/messages`, { body, clientMessageId })
  ).data;

export type LiveSessionType = ApiLiveSession["type"];

/** `POST /live-sessions`. Which ids are needed depends on the type; see `sessionTypes`. */
export type CreateLiveSessionInput = {
  type: LiveSessionType;
  title: string;
  description?: string;
  hostId?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone: string;
  cohortId?: string;
  trackId?: string;
  mentorId?: string;
  mentorshipId?: string;
  studentProfileId?: string;
  inviteeIds?: string[];
};

/** `POST /live-sessions/series`: a session that repeats, as an iCalendar RRULE. */
export type CreateLiveSessionSeriesInput = Omit<
  CreateLiveSessionInput,
  "scheduledEndAt"
> & {
  rrule: string;
  endsOn?: string;
  defaultDurationMinutes: number;
};

export const createLiveSession = async (input: CreateLiveSessionInput) =>
  (await api.post<Envelope<ApiLiveSession>>("/live-sessions", input)).data;

export const createLiveSessionSeries = async (
  input: CreateLiveSessionSeriesInput,
) => (await api.post<Envelope<unknown>>("/live-sessions/series", input)).data;

/** `PATCH /live-sessions/:id`. Who it's for and who hosts it can't change. */
export type UpdateLiveSessionInput = {
  /** Required for a session in a series. */
  scope?: "THIS_OCCURRENCE" | "THIS_AND_FUTURE_OCCURRENCES";
  title?: string;
  description?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  timezone?: string;
};

export const updateLiveSession = async (
  id: string,
  input: UpdateLiveSessionInput,
) =>
  (await api.patch<Envelope<ApiLiveSession>>(`/live-sessions/${id}`, input))
    .data;

export const cancelLiveSession = (id: string) =>
  api.post(`/live-sessions/${id}/cancel`, {});

/** The instant a wall-clock date and time ("2026-11-23", "19:00") happen in a time zone. */
export function zonedTimeToIso(
  date: string,
  time: string,
  timeZone = DEFAULT_TIME_ZONE,
) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const wanted = Date.UTC(year, month - 1, day, hours, minutes);
  let guess = wanted;
  // Twice settles it, even across a daylight-saving change.
  for (let i = 0; i < 2; i += 1) {
    const shown = zonedParts(new Date(guess).toISOString(), timeZone);
    const [y, m, d] = shown.date.split("-").map(Number);
    const [h, min] = shown.time.split(":").map(Number);
    guess += wanted - Date.UTC(y, m - 1, d, h, min);
  }
  return new Date(guess).toISOString();
}

/** How early the host can go in and start a session. */
export const START_WINDOW_MS = 15 * 60_000;

/**
 * Where a session stands right now, for its badge and whether Join works.
 * Staff (`early`) can go in from 15 minutes before the start, so the host can
 * start it; students can join once it's live.
 */
export function sessionStanding(
  session: LiveSession,
  now: number,
  { early = true }: { early?: boolean } = {},
) {
  if (session.status === "live")
    return { joinable: true, label: "Live now", status: "success" } as const;
  if (session.status !== "upcoming")
    return { joinable: false, label: "Ended", status: "neutral" } as const;
  const { start, end } = sessionSpan(session);
  // Never started, and its time is over.
  if (end.getTime() <= now)
    return { joinable: false, label: "Ended", status: "neutral" } as const;
  const joinable = early && start.getTime() - now <= START_WINDOW_MS;
  const minutes = Math.ceil((start.getTime() - now) / 60_000);
  if (minutes <= 0)
    return { joinable, label: "Starting soon", status: "info" } as const;
  const label =
    minutes < 60
      ? `In ${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`
      : `In ${Math.round(minutes / 60)} ${minutes < 90 ? "Hour" : "Hours"}`;
  return { joinable, label, status: "info" } as const;
}

const DAY_MS = 86_400_000;

/** "Today", "Tomorrow" or "In 9 days", counted in the session's time zone. */
export function daysUntil(session: LiveSession, now: number) {
  const today = zonedParts(new Date(now).toISOString(), session.timeZone).date;
  const days = Math.round(
    (Date.parse(`${session.date}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      DAY_MS,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * The next month of sessions, from the start of yesterday so nothing on
 * today is missed in any time zone. Whole days keep the query key steady.
 */
export function upcomingRange(now: number, days = 31) {
  const day = Math.floor(now / DAY_MS) * DAY_MS;
  const iso = (ms: number) => new Date(ms).toISOString().replace(".000Z", "Z");
  return { from: iso(day - DAY_MS), to: iso(day + (days + 1) * DAY_MS) };
}

/** A student's sessions with their mentor: their own pair sessions and the mentor's groups. */
export const isMentorshipWith = (
  session: LiveSession,
  mentor: { id: string; mentorshipId: string },
) =>
  (session.type === "MENTORSHIP_PAIR" &&
    session.mentorshipId === mentor.mentorshipId) ||
  (session.type === "MENTORSHIP_GROUP" && session.mentorId === mentor.id);

/** Sessions someone hosts or mentors in. */
export const isRunBy = (session: LiveSession, userId: string) =>
  session.hostId === userId || session.mentorId === userId;

/** A session as a row of the "Upcoming sessions" cards. */
export function toUpcomingSession(session: LiveSession, now: number) {
  return {
    id: session.id,
    date: sessionDate(session.date),
    time: sessionTime(session),
    until: session.status === "live" ? "Live now" : daysUntil(session, now),
  };
}

/** Sessions still to come or running now: live ones first, then soonest first. */
export function stillAhead(sessions: LiveSession[], now: number) {
  return sessions
    .filter(
      (session) =>
        session.status === "live" ||
        (session.status === "upcoming" && Date.parse(session.endsAt) > now),
    )
    .sort((a, b) =>
      a.status === b.status
        ? a.startsAt.localeCompare(b.startsAt)
        : a.status === "live"
          ? -1
          : 1,
    );
}
