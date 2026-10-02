import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import {
  getSession,
  getSignInErrorMessage,
  landingPathFor,
  signIn,
  signOut,
  type AuthUser,
} from "@/lib/auth";

const API_URL = "/api/backend";

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "faa62b61-d62a-4e10-b52d-b94f622f4a8e",
    name: "Super Admin",
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@riseclassroom.com",
    role: "SUPERADMIN",
    status: "ACTIVE",
    emailVerified: true,
    displayName: null,
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
  vi.stubEnv("NEXT_PUBLIC_API_URL", API_URL);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("signIn", () => {
  // The deployed API returns `{redirect, token, user}` — not the nested
  // `session` object the Swagger docs describe.
  it("reads the real sign-in response shape", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        redirect: false,
        token: "uVPLJq0TU8OoLb4WtL9lsdSQuN0kSC1e",
        user: makeUser(),
      })
    );

    const result = await signIn({
      email: "superadmin@riseclassroom.com",
      password: "SuperAdminPassword123!",
    });

    expect(result.user.role).toBe("SUPERADMIN");
    expect(result.token).toBe("uVPLJq0TU8OoLb4WtL9lsdSQuN0kSC1e");
  });

  it("posts to the single sign-in endpoint through the same-origin proxy", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ redirect: false, token: "t", user: makeUser() })
    );

    await signIn({
      email: "superadmin@riseclassroom.com",
      password: "SuperAdminPassword123!",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`${API_URL}/auth/sign-in/email`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "superadmin@riseclassroom.com",
      password: "SuperAdminPassword123!",
    });
  });

  // Auth rides on the HttpOnly cookie, so the request must opt into sending it
  // and must not try to set an Authorization header the backend ignores.
  it("sends credentials and no bearer token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ redirect: false, token: "t", user: makeUser() })
    );

    await signIn({ email: "a@b.com", password: "pw" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("surfaces an ApiError when the backend rejects the credentials", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: "Unauthorized" }, 401)
    );

    await expect(
      signIn({ email: "a@b.com", password: "nope" })
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getSession", () => {
  it("returns null when there is no active session", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the user and session when signed in", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        session: {
          id: "6422cfd0-f35d-4480-899e-a497253eebab",
          userId: "faa62b61-d62a-4e10-b52d-b94f622f4a8e",
          token: "uVPLJq0TU8OoLb4WtL9lsdSQuN0kSC1e",
          expiresAt: "2026-10-09T10:44:13.927Z",
        },
        user: makeUser(),
      })
    );

    const session = await getSession();
    expect(session?.user.email).toBe("superadmin@riseclassroom.com");
    expect(session?.session.token).toBeTruthy();
  });
});

describe("signOut", () => {
  it("posts to the sign-out endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await signOut();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/auth/sign-out");
    expect(init.method).toBe("POST");
  });
});

describe("landingPathFor", () => {
  it("sends each role to its own area", () => {
    expect(landingPathFor(makeUser({ role: "SUPERADMIN" }))).toBe(
      "/admin/dashboard"
    );
    expect(landingPathFor(makeUser({ role: "INSTRUCTOR" }))).toBe(
      "/instructor/dashboard"
    );
    expect(landingPathFor(makeUser({ role: "STUDENT" }))).toBe(
      "/student/dashboard"
    );
  });

  it("sends invited users to finish their profile first", () => {
    expect(
      landingPathFor(
        makeUser({ role: "INSTRUCTOR", onboardingStatus: "INVITED" })
      )
    ).toBe("/instructor/complete-profile");

    expect(
      landingPathFor(makeUser({ role: "STUDENT", onboardingStatus: "INVITED" }))
    ).toBe("/student/complete-profile");
  });
});

describe("getSignInErrorMessage", () => {
  it("does not reveal which half of the credentials was wrong", () => {
    expect(
      getSignInErrorMessage(new ApiError(401, "Unauthorized", null))
    ).toBe("Incorrect email or password.");
  });

  it("explains the rate limit", () => {
    expect(
      getSignInErrorMessage(new ApiError(429, "Too many requests", null))
    ).toMatch(/wait a few minutes/i);
  });

  // The deployed backend answers bad credentials with a bodyless 500.
  it("stays useful when the server returns an opaque failure", () => {
    expect(
      getSignInErrorMessage(new ApiError(500, "Internal Server Error", ""))
    ).toBe("We couldn't sign you in. Please check your details and try again.");
  });

  it("names a connection problem for non-HTTP failures", () => {
    expect(getSignInErrorMessage(new TypeError("Failed to fetch"))).toMatch(
      /couldn't reach the server/i
    );
  });
});
