import { api } from "@/lib/api";

/** What the room needs to connect: the LiveKit server and a signed join token. */
export type JoinCredentials = { url: string; token: string };

/** Why someone can't join yet, matching `canJoin.reason` in the proposed API. */
export type JoinBlock = "too_early" | "not_eligible" | "ended" | "cancelled";

/** Participant attributes the join token and the room share. */
export const ROLE_ATTRIBUTE = "role";
/** The person's platform role, shown as a chip in the participants list, e.g. "Admin". */
export const LABEL_ATTRIBUTE = "label";
export const HAND_ATTRIBUTE = "hand";
/** A feedback signal someone has left up, e.g. "slower". */
export const FEEDBACK_ATTRIBUTE = "feedback";
/** Data channel topic for emoji reactions. */
export const REACTIONS_TOPIC = "reactions";

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

export type Feedback = (typeof feedbackOptions)[number]["value"];
export const feedbackFor = (value?: string) => feedbackOptions.find((option) => option.value === value);

// PENDING-BACKEND: becomes `POST /live-sessions/:id/join`, which also decides
// whether the user may join yet. Until then the dev-only token route signs one.
export async function fetchJoinCredentials(sessionId: string): Promise<JoinCredentials> {
  const params = new URLSearchParams({ session: sessionId, tab: crypto.randomUUID().slice(0, 8) });
  const response = await fetch(`/api/live-room/token?${params}`, { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Couldn't get a token to join this session.");
  }
  return response.json();
}

// PENDING-BACKEND: host controls. A browser can't mute or remove someone else
// in LiveKit, so these go through the backend, which uses LiveKit's server API.
// They fail until the endpoints from the API contract exist.
export const setParticipantMuted = (sessionId: string, identity: string, muted: boolean) =>
  api.post(`/live-sessions/${sessionId}/participants/${encodeURIComponent(identity)}/mute`, { muted });

export const removeParticipant = (sessionId: string, identity: string) =>
  api.delete(`/live-sessions/${sessionId}/participants/${encodeURIComponent(identity)}`);

export const muteEveryone = (sessionId: string) => api.post(`/live-sessions/${sessionId}/mute-all`);

export const turnOffAllCameras = (sessionId: string) => api.post(`/live-sessions/${sessionId}/cameras-off`);

export const setScreenShareAllowed = (sessionId: string, allowed: boolean) =>
  api.post(`/live-sessions/${sessionId}/screen-share`, { allowed });

export const endSessionForAll = (sessionId: string) =>
  api.post(`/live-sessions/${sessionId}/end`);
