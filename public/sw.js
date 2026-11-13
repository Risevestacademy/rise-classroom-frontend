/* The service worker behind push notifications. It shows what the backend pushes and opens the app when a notification is clicked; it caches nothing.*/

const settings = new URL(self.location.href).searchParams;
const homePath = settings.get("home") || "/";
const apiPath = settings.get("api") || "";

const icon = "/classroom-logo-teal.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});


function readPayload(data) {
  if (!data) return {};
  let payload;
  try {
    payload = data.json();
  } catch {
    return { body: data.text() };
  }
  if (!payload || typeof payload !== "object") return { body: String(payload) };
  return { ...payload, ...payload.notification };
}

/* Only pages of this app are opened, whatever the message asks for. */
function pathToOpen(url) {
  if (typeof url !== "string") return homePath;
  try {
    const target = new URL(url, self.location.origin);
    if (target.origin !== self.location.origin) return homePath;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return homePath;
  }
}

function openTabs() {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true });
}

/* Lets open pages refresh their notification lists. */
async function tellOpenTabs() {
  for (const tab of await openTabs()) {
    tab.postMessage({ type: "push-notifications-changed" });
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event.data);
  const details = payload.data && typeof payload.data === "object" ? payload.data : {};

  event.waitUntil(
    self.registration
      .showNotification(payload.title || "Rise Classroom", {
        body: payload.body || "",
        icon,
        badge: icon,
        tag: payload.id,
        data: { id: payload.id, url: payload.url || details.url },
      })
      .then(tellOpenTabs),
  );
});

async function markRead(id) {
  if (!id || !apiPath) return;
  try {
    await fetch(`${apiPath}/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    /* It stays unread in the app's list, where it can be opened again. */
  }
}

async function openApp(path) {
  const tabs = await openTabs();
  const tab = tabs.find((item) => "focus" in item);
  if (!tab) return self.clients.openWindow(path);

  await tab.focus();
  /* A notification that names a page takes the tab there. */
  if (path !== homePath && "navigate" in tab) await tab.navigate(path);
  return tab;
}

self.addEventListener("notificationclick", (event) => {
  const { id, url } = event.notification.data || {};
  event.notification.close();

  event.waitUntil(
    Promise.all([openApp(pathToOpen(url)), markRead(id).then(tellOpenTabs)]),
  );
});
