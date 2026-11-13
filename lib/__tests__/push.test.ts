import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  decodeVapidKey,
  describeDevice,
  disablePush,
  enablePush,
  getPushState,
  restorePush,
  writePushChoice,
} from "@/lib/push";

/* "AQID" is the bytes 1, 2, 3. */
const publicKey = "AQID";
const keyBytes = new Uint8Array([1, 2, 3]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fakeSubscription(key: Uint8Array = keyBytes) {
  return {
    endpoint: "https://push.example/abc",
    options: { applicationServerKey: key.buffer },
    toJSON: () => ({
      endpoint: "https://push.example/abc",
      keys: { p256dh: "p256dh-key", auth: "auth-secret" },
    }),
    unsubscribe: vi.fn(async () => true),
  };
}

type FakeSubscription = ReturnType<typeof fakeSubscription>;

/* A browser that supports push, with `existing` already subscribed. */
function stubBrowser({
  permission = "granted",
  existing = null,
}: {
  permission?: NotificationPermission;
  existing?: FakeSubscription | null;
} = {}) {
  const created = fakeSubscription();
  const pushManager = {
    getSubscription: vi.fn(async () => existing),
    subscribe: vi.fn(async () => created),
  };
  const registration = { pushManager };
  const serviceWorker = {
    register: vi.fn(async () => registration),
    getRegistration: vi.fn(async () => registration),
    ready: Promise.resolve(registration),
  };
  const requestPermission = vi.fn(async () => permission);

  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: serviceWorker,
  });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission, requestPermission });

  return { pushManager, serviceWorker, requestPermission, created };
}

/* Answers the API calls and records them as "METHOD path". */
function stubApi(unsubscribeStatus = 200) {
  const calls: { route: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname.replace("/api/backend", "");
      calls.push({
        route: `${init.method} ${path}`,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (path.endsWith("/public-key")) {
        return json({ success: true, data: { publicKey } });
      }
      if (path.endsWith("/unsubscribe")) {
        return json({ success: unsubscribeStatus === 200 }, unsubscribeStatus);
      }
      return json({ success: true, data: {} }, 201);
    }),
  );
  return calls;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
  window.sessionStorage.clear();
});

describe("without push support", () => {
  it("reports the browser as unsupported and does nothing", async () => {
    const calls = stubApi();

    expect(await getPushState()).toBe("unsupported");
    expect(await enablePush("/student/dashboard")).toBe("unsupported");
    await disablePush();
    expect(calls).toEqual([]);
  });
});

describe("getPushState", () => {
  it("is blocked once the user has refused notifications", async () => {
    stubBrowser({ permission: "denied" });
    expect(await getPushState()).toBe("blocked");
  });

  it("is off until this browser has a subscription", async () => {
    stubBrowser({ permission: "default" });
    expect(await getPushState()).toBe("off");

    stubBrowser({ permission: "granted" });
    expect(await getPushState()).toBe("off");
  });

  it("is on with permission and a subscription", async () => {
    stubBrowser({ existing: fakeSubscription() });
    expect(await getPushState()).toBe("on");
  });
});

describe("enablePush", () => {
  it("subscribes nothing when the user refuses", async () => {
    const browser = stubBrowser({ permission: "denied" });
    const calls = stubApi();

    expect(await enablePush("/student/dashboard")).toBe("blocked");
    expect(browser.serviceWorker.register).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("stays off when the browser's question is closed unanswered", async () => {
    stubBrowser({ permission: "default" });
    stubApi();

    expect(await enablePush("/student/dashboard")).toBe("off");
  });

  it("registers the worker, subscribes and tells the API", async () => {
    const browser = stubBrowser();
    const calls = stubApi();
    vi.stubGlobal("navigator", navigator);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0 Safari/537.36",
    );

    expect(await enablePush("/student/dashboard")).toBe("on");

    expect(browser.serviceWorker.register).toHaveBeenCalledWith(
      "/sw.js?home=%2Fstudent%2Fdashboard&api=%2Fapi%2Fbackend",
      { scope: "/", updateViaCache: "none" },
    );
    expect(browser.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });
    expect(calls).toEqual([
      { route: "GET /push-subscriptions/public-key", body: undefined },
      {
        route: "POST /push-subscriptions/subscribe",
        body: {
          endpoint: "https://push.example/abc",
          p256dh: "p256dh-key",
          auth: "auth-secret",
          browser: "Chrome",
          platform: "DESKTOP",
          os: "WINDOWS",
        },
      },
    ]);
  });

  it("keeps the browser's subscription when the key hasn't changed", async () => {
    const existing = fakeSubscription();
    const browser = stubBrowser({ existing });
    const calls = stubApi();

    await enablePush("/admin/dashboard");

    expect(browser.pushManager.subscribe).not.toHaveBeenCalled();
    expect(existing.unsubscribe).not.toHaveBeenCalled();
    expect(calls.map((call) => call.route)).toContain(
      "POST /push-subscriptions/subscribe",
    );
  });

  it("replaces a subscription made with an old key", async () => {
    const existing = fakeSubscription(new Uint8Array([9, 9, 9]));
    const browser = stubBrowser({ existing });
    stubApi();

    await enablePush("/admin/dashboard");

    expect(existing.unsubscribe).toHaveBeenCalled();
    expect(browser.pushManager.subscribe).toHaveBeenCalled();
  });
});

describe("disablePush", () => {
  it("tells the API and drops the browser's subscription", async () => {
    const existing = fakeSubscription();
    stubBrowser({ existing });
    const calls = stubApi();

    await disablePush();

    expect(calls).toEqual([
      {
        route: "POST /push-subscriptions/unsubscribe",
        body: { endpoint: "https://push.example/abc" },
      },
    ]);
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  it("is fine with the API never having had the subscription", async () => {
    const existing = fakeSubscription();
    stubBrowser({ existing });
    stubApi(404);

    await expect(disablePush()).resolves.toBeUndefined();
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  it("still drops the browser's subscription when the API fails", async () => {
    const existing = fakeSubscription();
    stubBrowser({ existing });
    stubApi(500);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(disablePush()).rejects.toThrow();
    expect(existing.unsubscribe).toHaveBeenCalled();
  });
});

describe("restorePush", () => {
  it("leaves a user who never turned notifications on alone", async () => {
    const browser = stubBrowser();
    const calls = stubApi();

    await restorePush("user-1", "/student/dashboard");

    expect(browser.serviceWorker.register).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("never asks for permission", async () => {
    const browser = stubBrowser({ permission: "default" });
    writePushChoice("user-1", "on");

    await restorePush("user-1", "/student/dashboard");

    expect(browser.requestPermission).not.toHaveBeenCalled();
    expect(browser.serviceWorker.register).not.toHaveBeenCalled();
  });

  it("subscribes again for a user who had notifications on", async () => {
    stubBrowser();
    const calls = stubApi();
    writePushChoice("user-1", "on");

    await restorePush("user-1", "/student/dashboard");

    expect(calls.map((call) => call.route)).toEqual([
      "GET /push-subscriptions/public-key",
      "POST /push-subscriptions/subscribe",
    ]);
  });

  it("doesn't repeat itself while the subscription is still there", async () => {
    stubBrowser({ existing: fakeSubscription() });
    const calls = stubApi();
    writePushChoice("user-1", "on");

    await restorePush("user-1", "/student/dashboard");
    await restorePush("user-1", "/student/dashboard");

    expect(calls).toHaveLength(2);
  });
});

describe("decodeVapidKey", () => {
  it("decodes base64url, with or without padding", () => {
    expect(decodeVapidKey("AQID")).toEqual(keyBytes);
    expect(Array.from(decodeVapidKey("-_8"))).toEqual([251, 255]);
  });
});

describe("describeDevice", () => {
  it("tells browsers that share a user agent apart", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/142.0 Safari/537.36 Edg/142.0",
      ),
    ).toEqual({ browser: "Edge", platform: "DESKTOP", os: "WINDOWS" });
    expect(
      describeDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
      ),
    ).toEqual({ browser: "Safari", platform: "DESKTOP", os: "MACOS" });
  });

  it("counts phones as mobile", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36",
      ),
    ).toEqual({ browser: "Chrome", platform: "MOBILE", os: "ANDROID" });
    expect(
      describeDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ browser: "Safari", platform: "MOBILE", os: "IOS" });
  });
});
