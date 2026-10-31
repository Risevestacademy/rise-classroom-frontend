// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/lib/auth";

const requestHeaders = new Headers();

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders,
}));

// The real redirect() throws to stop rendering; this mirrors that so the code
// after it never runs.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { requireRole } = await import("@/lib/session.server");

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "faa62b61-d62a-4e10-b52d-b94f622f4a8e",
    name: "Ada Obi",
    firstName: "Ada",
    lastName: "Obi",
    email: "ada@riseclassroom.com",
    role: "SUPERADMIN",
    status: "ACTIVE",
    emailVerified: true,
    onboardingStatus: "COMPLETED",
    createdAt: "2026-09-30T17:55:56.774Z",
    updatedAt: "2026-10-02T07:22:08.749Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  for (const key of [...requestHeaders.keys()]) requestHeaders.delete(key);
  requestHeaders.set("cookie", "better-auth.session_token=abc");
  requestHeaders.set("x-pathname", "/admin/students?page=2");

  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requireRole", () => {
  it("returns the session when the role matches", async () => {
    const session = { user: makeUser(), session: {} };
    fetchMock.mockResolvedValue(jsonResponse(session));

    await expect(requireRole("SUPERADMIN")).resolves.toEqual(session);
  });

  it("asks the backend directly, passing the request's cookies on", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: makeUser(), session: {} }));

    await requireRole("SUPERADMIN");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https?:\/\/.+\/auth\/get-session$/);
    expect(init.headers.cookie).toBe("better-auth.session_token=abc");
    expect(init.cache).toBe("no-store");
  });

  it("sends signed-out users to sign-in, back to where they were", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));

    await expect(requireRole("SUPERADMIN")).rejects.toThrow(
      "REDIRECT /sign-in?next=%2Fadmin%2Fstudents%3Fpage%3D2"
    );
  });

  it("treats a 401 as signed out", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401));

    await expect(requireRole("SUPERADMIN")).rejects.toThrow("REDIRECT /sign-in");
  });

  it("skips the backend when there's no cookie at all", async () => {
    requestHeaders.delete("cookie");
    requestHeaders.delete("x-pathname");

    await expect(requireRole("SUPERADMIN")).rejects.toThrow(/^REDIRECT \/sign-in$/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends other roles to their own landing page", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ user: makeUser({ role: "STUDENT" }), session: {} })
    );

    await expect(requireRole("SUPERADMIN")).rejects.toThrow(
      "REDIRECT /student/dashboard"
    );
  });

  it("sends mentors to the mentor dashboard, not back into a loop", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ user: makeUser({ role: "MENTOR" }), session: {} })
    );

    await expect(requireRole("STUDENT")).rejects.toThrow(
      "REDIRECT /mentor/dashboard"
    );
  });

  it("sends invited users to onboarding", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        user: makeUser({ role: "INSTRUCTOR", onboardingStatus: "INVITED" }),
        session: {},
      })
    );

    await expect(requireRole("SUPERADMIN")).rejects.toThrow(
      "REDIRECT /onboarding"
    );
  });

  // A slow or sleeping backend shouldn't sign anyone out; the browser check
  // takes over instead.
  it("leaves it to the browser when the backend is down", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(requireRole("SUPERADMIN")).resolves.toBeNull();
  });

  it("leaves it to the browser when the backend errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Boom" }, 503));

    await expect(requireRole("SUPERADMIN")).resolves.toBeNull();
  });
});
