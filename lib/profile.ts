import * as React from "react";
import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope } from "@/lib/api";
import type { Role, UserStatus } from "@/lib/auth";

type NamedRef = { id: string; name: string };

/** A cohort and track the user belongs to: enrollments for a student. */
export type Membership = {
  cohort?: NamedRef & {
    status?: string;
    startDate?: string;
    endDate?: string;
    totalWeeks?: number;
    currentWeek?: number | null;
  };
  track?: NamedRef;
};

export const profileBasePath = "/admin/profile";

export const profileRoutes = {
  academy: `${profileBasePath}/academy`,
  personal: `${profileBasePath}/personal`,
  password: `${profileBasePath}/personal/password`,
} as const;

const avatarPeople = [
  "james-brown",
  "sophia-williams",
  "arthur-taylor",
  "emma-wright",
  "matthew-johnson",
  "laura-perez",
  "wei-chen",
  "lena-muller",
  "juma-omondi",
  "natalia-nowak",
  "ravi-patel",
  "nuray-aksoy",
];

/* The design system's illustrated and cartoon avatars, in public/avatars. */
export const presetAvatars = ["illustration", "cartoon"].flatMap((style) =>
  avatarPeople.map((person) => `/avatars/${style}-${person}.png`),
);

/** Turns a preset avatar into a file `PATCH /me` can take as the new photo. */
export async function presetAvatarFile(src: string) {
  const blob = await fetch(src).then((response) => response.blob());
  return new File([blob], src.split("/").pop()!, { type: "image/png" });
}

/** Shape of `GET /me`. */
export type MyProfile = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phoneNumber: string | null;
  location: string | null;
  description: string | null;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
  onboardedAt: string | null;
  createdAt: string;
  organization: NamedRef | null;
  memberships: Membership[];
};

/** What `PATCH /me` accepts. First name, last name, email and track are admin-only. */
export type UpdateMyProfileInput = {
  displayName?: string;
  phoneNumber?: string;
  location?: string;
  description?: string;
  image?: File | null;
};

/** Older name used on feat/student-profile. */
export type UpdateProfileInput = UpdateMyProfileInput;

/** Shape of `GET /students/me/mentor`; `null` when no mentor is assigned. */
export type MyMentorship = {
  id: string;
  active: boolean;
  assignedAt: string;
  mentor: { id: string; name: string; email: string; role: string };
} | null;

async function getMyProfile() {
  const { data } = await api.get<Envelope<MyProfile>>("/me");
  return data;
}

async function getMyMentor() {
  try {
    const { data } = await api.get<Envelope<MyMentorship>>("/students/me/mentor");
    return data ?? null;
  } catch (error) {
    // The API answers 404 for a student who has no mentor yet.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Sent as multipart so a new photo can go in the same request. */
export async function updateMyProfile({ image, ...fields }: UpdateMyProfileInput) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) body.append(key, value);
  }
  if (image) body.append("image", image);

  const { data } = await api.patch<Envelope<MyProfile>>("/me", body);
  return data;
}

export const profileQueries = {
  me: () =>
    queryOptions({
      queryKey: ["me"] as const,
      queryFn: getMyProfile,
    }),

  mentor: () =>
    queryOptions({
      queryKey: ["me", "mentor"] as const,
      queryFn: getMyMentor,
    }),
};

/** First and last name, as set by an admin. */
export function fullNameOf(profile: Pick<MyProfile, "firstName" | "lastName">) {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

/** What the user goes by: their display name, or their full name until they set one. */
export function displayNameOf(
  profile: Pick<MyProfile, "firstName" | "lastName" | "displayName">,
) {
  return profile.displayName?.trim() || fullNameOf(profile);
}

/** The track they're on now: the first membership the API lists. */
export function currentMembership(profile: MyProfile): Membership | undefined {
  return profile.memberships?.[0];
}

/**
 * Mirrors the API's rule: 7 to 15 digits, optionally starting with +, once
 * spaces, dashes, dots and brackets are stripped.
 */
export function isValidPhoneNumber(value: string) {
  return /^\+?\d{7,15}$/.test(value.replace(/[\s\-.()]/g, ""));
}

/* ---------- Notification preferences ---------- */

export type NotificationPreferenceKey =
  | "liveClassReminders"
  | "newLessons"
  | "assignmentDeadlines"
  | "feedback";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const notificationPreferenceOptions: {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}[] = [
  {
    key: "liveClassReminders",
    label: "Live class reminders",
    description: "A reminder before each live class",
  },
  {
    key: "newLessons",
    label: "New lessons and recordings",
    description: "When a lesson or recording is added",
  },
  {
    key: "assignmentDeadlines",
    label: "Assignment deadlines",
    description: "A reminder before an assignment is due",
  },
  {
    key: "feedback",
    label: "Feedback and reviews",
    description: "When an instructor reviews your work",
  },
];

const defaultPreferences: NotificationPreferences = {
  liveClassReminders: true,
  newLessons: true,
  assignmentDeadlines: true,
  feedback: true,
};

/*
 * PENDING-BACKEND: there's no endpoint for a student's notification
 * preferences yet, so they're kept in this browser until there is.
 */
const PREFERENCES_KEY = "rise:student-notification-preferences";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedPreferences = defaultPreferences;

function readPreferences(): NotificationPreferences {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFERENCES_KEY);
  } catch {
    // Storage can be blocked; fall back to the defaults.
  }
  if (raw === cachedRaw) return cachedPreferences;
  cachedRaw = raw;
  try {
    cachedPreferences = { ...defaultPreferences, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    cachedPreferences = defaultPreferences;
  }
  return cachedPreferences;
}

function subscribePreferences(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useNotificationPreferences() {
  const preferences = React.useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    () => defaultPreferences,
  );

  const setPreference = React.useCallback(
    (key: NotificationPreferenceKey, value: boolean) => {
      const next = { ...readPreferences(), [key]: value };
      try {
        window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      } catch {
        // Keep the change for this visit even if it can't be stored.
        cachedRaw = JSON.stringify(next);
        cachedPreferences = next;
      }
      listeners.forEach((listener) => listener());
    },
    [],
  );

  return { preferences, setPreference };
}