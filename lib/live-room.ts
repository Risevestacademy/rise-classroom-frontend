import { api, ApiError, type Envelope } from "@/lib/api";

/** What the room needs to connect: the LiveKit server and a signed join token. */
export type JoinCredentials = { url: string; token: string };

/** The chip shown beside someone's name in the participants list. */
const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Admin",
  SUPERADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  MENTOR: "Mentor",
};

export const roleLabel = (platformRole: string) => roleLabels[platformRole] ?? "";

/** Why someone can't join yet, matching `canJoin.reason` in the proposed API. */
export type JoinBlock = "too_early" | "not_eligible" | "ended" | "cancelled" | "removed";

/**
 * Participant attributes the room shares. The backend's token doesn't set
 * any, so each person sets their own role and label once connected.
 */
export const ROLE_ATTRIBUTE = "role";
/** The person's platform role, shown as a chip in the participants list, e.g. "Admin". */
export const LABEL_ATTRIBUTE = "label";
/** A link to the person's profile photo, for their tile and avatar. */
export const AVATAR_ATTRIBUTE = "avatar";
export const HAND_ATTRIBUTE = "hand";
/** A feedback signal someone has left up, e.g. "slower". */
export const FEEDBACK_ATTRIBUTE = "feedback";
/** Data channel topic for emoji reactions. */
export const REACTIONS_TOPIC = "reactions";
/** Data channel topic the host uses to tell everyone the session has ended. */
export const SESSION_TOPIC = "rise.session";

/** One-off reactions that float up the room. */
export const reactionEmojis = ["💖", "😩", "😂", "😍", "😝", "🤒", "😭", "😳", "🤓", "😎", "👏🏾"] as const;

/** Feedback that stays on someone's tile until they clear it. */
export const feedbackOptions = [
  { value: "yes", label: "Answering Yes", emoji: "👍🏾" },
  { value: "no", label: "Answering No", emoji: "❌" },
  { value: "go", label: "Asking You to Go", emoji: "➡️" },
  { value: "slower", label: "Slower", emoji: "🐌" },
  { value: "faster", label: "Faster", emoji: "🛼" },
] as const;

/**
 * The host's Session settings, shared through the host's own `settings`
 * attribute so everyone in the room, including late joiners, can follow them.
 */
export const SETTINGS_ATTRIBUTE = "settings";

export const videoQualityOptions = [
  { value: "auto", label: "Auto (Recommended)" },
  { value: "high", label: "High (720p)" },
  { value: "standard", label: "Standard (360p)" },
  { value: "low", label: "Low (180p)" },
] as const;

export const recordingVisibilityOptions = [
  { value: "academy", label: "Academy members" },
  { value: "invited", label: "Invited participants" },
  { value: "hosts", label: "Hosts only" },
] as const;

export type SessionSettings = {
  microphone: boolean;
  camera: boolean;
  screenShare: boolean;
  chat: boolean;
  reactions: boolean;
  handRaising: boolean;
  // PENDING-BACKEND: who may join is decided when the backend signs a join
  // token, and who may watch a recording on the server, so these only
  // remember the host's choice for now. Auto-record does start recording.
  locked: boolean;
  invitedOnly: boolean;
  waitingRoom: boolean;
  reentry: boolean;
  autoRecord: boolean;
  recordingVisibility: (typeof recordingVisibilityOptions)[number]["value"];
  muteOnEntry: boolean;
  camerasOffOnEntry: boolean;
  videoQuality: (typeof videoQualityOptions)[number]["value"];
};

export const defaultSessionSettings: SessionSettings = {
  microphone: true,
  camera: true,
  screenShare: true,
  chat: true,
  reactions: true,
  handRaising: true,
  locked: false,
  invitedOnly: true,
  waitingRoom: false,
  reentry: true,
  autoRecord: false,
  recordingVisibility: "academy",
  muteOnEntry: false,
  camerasOffOnEntry: false,
  videoQuality: "auto",
};

export function parseSessionSettings(value?: string): SessionSettings {
  if (!value) return defaultSessionSettings;
  try {
    return { ...defaultSessionSettings, ...JSON.parse(value) };
  } catch {
    return defaultSessionSettings;
  }
}

export type Feedback = (typeof feedbackOptions)[number]["value"];
export const feedbackFor = (value?: string) => feedbackOptions.find((option) => option.value === value);

/**
 * A two-hour join token from the backend, with the powers the session gives
 * the signed-in person. Only works once the session is live.
 */
export async function fetchJoinCredentials(sessionId: string): Promise<JoinCredentials> {
  try {
    const { data } = await api.post<Envelope<JoinCredentials>>(`/live-sessions/${sessionId}/token`, {}, { cache: "no-store" });
    return { url: data.url, token: data.token };
  } catch (error) {
    throw new Error(
      error instanceof ApiError && error.message ? error.message : "Couldn't get a token to join this session.",
    );
  }
}

// PENDING-BACKEND: host controls. A browser can't mute or remove someone else
// in LiveKit, so these go through the backend, which uses LiveKit's server API.
// They fail until the endpoints from the API contract exist.
/** Mutes someone's microphone. Only they can unmute it again. */
export const muteParticipant = (sessionId: string, identity: string) =>
  api.post(`/live-sessions/${sessionId}/participants/${encodeURIComponent(identity)}/mute`);

/** Removes someone for the rest of the session, until a host readmits them. */
export const removeParticipant = (sessionId: string, identity: string) =>
  api.delete(`/live-sessions/${sessionId}/participants/${encodeURIComponent(identity)}`);

/** Hosts and moderators keep their microphones and cameras. */
export const muteEveryone = (sessionId: string) => api.post(`/live-sessions/${sessionId}/mute-all`);

export const turnOffAllCameras = (sessionId: string) => api.post(`/live-sessions/${sessionId}/cameras-off`);

/**
 * `stop` ends someone's current share; `allow` and `block` decide whether they
 * may share for the rest of the session, and still apply after they rejoin.
 */
export const setScreenShare = (sessionId: string, identity: string, action: "stop" | "allow" | "block") =>
  api.post(`/live-sessions/${sessionId}/screen-share`, { identity, action });

export const endSessionForAll = (sessionId: string) =>
  api.post(`/live-sessions/${sessionId}/end`);

/** Records the room on the server; it runs until the session ends. Hosts and moderators only. */
export const startRecording = (sessionId: string) =>
  api.post(`/live-sessions/${sessionId}/recording/start`, {});
