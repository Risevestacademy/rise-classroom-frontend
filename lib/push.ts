import { api, ApiError, type Envelope } from "@/lib/api";

/* Web push for this browser: registering the service worker, subscribing with
   the browser's push service, and telling the API where to send notifications.
   Everything here is browser-only. */

/* `blocked` means the user refused notifications in the browser, which only
   they can undo, in the browser's site settings. */
export type PushState = "unsupported" | "blocked" | "on" | "off";

/* What the user last chose for an account on this browser. Unset until they
   answer the prompt. */
export type PushChoice = "on" | "off";

/* The message the service worker sends pages when notifications change. */
export const pushChangedMessage = "push-notifications-changed";

const workerPath = "/sw.js";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

const choiceKey = (userId: string) => `push-notifications:${userId}`;

export function readPushChoice(userId: string): PushChoice | null {
  try {
    const choice = window.localStorage.getItem(choiceKey(userId));
    return choice === "on" || choice === "off" ? choice : null;
  } catch {
    return null;
  }
}

export function writePushChoice(userId: string, choice: PushChoice): void {
  try {
    window.localStorage.setItem(choiceKey(userId), choice);
  } catch {
    /* Without storage the prompt simply shows again next visit. */
  }
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration(workerPath);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted") return "off";
  return (await currentSubscription()) ? "on" : "off";
}

/* The VAPID key arrives base64url-encoded; the browser wants the bytes. */
export function decodeVapidKey(key: string): Uint8Array<ArrayBuffer> {
  const padded = key.padEnd(key.length + ((4 - (key.length % 4)) % 4), "=");
  const raw = window.atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function sameKey(current: ArrayBuffer | null, key: Uint8Array): boolean {
  if (!current) return false;
  const bytes = new Uint8Array(current);
  return (
    bytes.length === key.length && bytes.every((byte, at) => byte === key[at])
  );
}

async function registerWorker(
  homePath: string,
): Promise<ServiceWorkerRegistration> {
  const settings = new URLSearchParams({
    home: homePath,
    api: process.env.NEXT_PUBLIC_API_URL ?? "",
  });
  await navigator.serviceWorker.register(`${workerPath}?${settings}`, {
    scope: "/",
    updateViaCache: "none",
  });
  return navigator.serviceWorker.ready;
}

/* Reuses the browser's subscription unless the backend's key has changed,
   which would leave the old one unable to receive anything. */
async function browserSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
  const { data } = await api.get<Envelope<{ publicKey: string }>>(
    "/push-subscriptions/public-key",
  );
  const key = decodeVapidKey(data.publicKey);

  const existing = await registration.pushManager.getSubscription();
  if (existing && sameKey(existing.options.applicationServerKey, key)) {
    return existing;
  }
  await existing?.unsubscribe();
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
}

type DeviceInfo = {
  browser?: string;
  platform: "DESKTOP" | "MOBILE";
  os?: "WINDOWS" | "LINUX" | "MACOS" | "ANDROID" | "IOS";
};

const systems: [RegExp, NonNullable<DeviceInfo["os"]>][] = [
  [/android/i, "ANDROID"],
  [/iphone|ipad|ipod/i, "IOS"],
  [/windows/i, "WINDOWS"],
  [/mac os/i, "MACOS"],
  [/linux/i, "LINUX"],
];

/* Edge and Opera also say "Chrome", and Chrome also says "Safari", so the
   order matters. */
const browsers: [RegExp, string][] = [
  [/edg\//i, "Edge"],
  [/opr\//i, "Opera"],
  [/firefox/i, "Firefox"],
  [/chrome|crios/i, "Chrome"],
  [/safari/i, "Safari"],
];

export function describeDevice(userAgent: string): DeviceInfo {
  const os = systems.find(([pattern]) => pattern.test(userAgent))?.[1];
  return {
    browser: browsers.find(([pattern]) => pattern.test(userAgent))?.[1],
    platform: os === "ANDROID" || os === "IOS" ? "MOBILE" : "DESKTOP",
    os,
  };
}

/* The API creates the subscription or reactivates one it already has. */
async function subscribe(homePath: string): Promise<void> {
  const registration = await registerWorker(homePath);
  const subscription = await browserSubscription(registration);
  const { endpoint, keys } = subscription.toJSON();

  await api.post("/push-subscriptions/subscribe", {
    endpoint,
    p256dh: keys?.p256dh,
    auth: keys?.auth,
    ...describeDevice(navigator.userAgent),
  });
}

/* Asks the browser for permission if it hasn't been given, then subscribes.
   `homePath` is where a clicked notification lands by default. */
export async function enablePush(homePath: string): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission === "denied") return "blocked";
  if (permission !== "granted") return "off";

  await subscribe(homePath);
  return "on";
}

/* Stops notifications to this browser. The browser's subscription is dropped
   even if the API can't be told, so nothing more can arrive here. */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const subscription = await currentSubscription();
  if (!subscription) return;

  try {
    await api.post("/push-subscriptions/unsubscribe", {
      endpoint: subscription.endpoint,
    });
  } catch (error) {
    /* The API answers 404 when it never had this subscription. */
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  } finally {
    await subscription.unsubscribe();
  }
}

/* Re-registers a user who turned notifications on here before: after signing
   back in, or when the browser has dropped its subscription. Never prompts. */
export async function restorePush(
  userId: string,
  homePath: string,
): Promise<void> {
  if (!isPushSupported() || Notification.permission !== "granted") return;
  if (readPushChoice(userId) !== "on") return;
  /* Once per browser tab is enough while the subscription is still there. */
  const restoredKey = `push-notifications-restored:${userId}`;
  const restored = window.sessionStorage.getItem(restoredKey) === "yes";
  if (restored && (await currentSubscription())) return;

  await subscribe(homePath);
  window.sessionStorage.setItem(restoredKey, "yes");
}
