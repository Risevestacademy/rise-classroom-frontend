import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import {
  getPasswordResetErrorMessage,
  passwordResetQueries,
  requestPasswordReset,
  resetPassword,
} from "@/lib/password-reset";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const verified = {
  success: true,
  data: {
    status: "ok",
    email: "ada.obi@rise.edu",
    resetToken: "reset-jwt",
    expiresIn: 900,
  },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("requestPasswordReset", () => {
  it("posts the email to the forgot-password endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, message: "ok" }));

    await requestPasswordReset("ada.obi@rise.edu");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/backend/auth/forgot-password");
    expect(JSON.parse(init.body)).toEqual({ email: "ada.obi@rise.edu" });
  });
});

describe("verifyLink query", () => {
  // Verifying uses up the emailed link, so a second request would 404 and
  // report a perfectly good link as already used.
  it("only ever verifies a link once", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(verified));
    const queryClient = new QueryClient();
    const options = passwordResetQueries.verifyLink("email-token");

    const [first, second] = await Promise.all([
      queryClient.fetchQuery(options),
      queryClient.fetchQuery(options),
    ]);
    await queryClient.fetchQuery(options);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(verified.data);
    expect(second).toEqual(verified.data);
  });

  it("sends the token in the body, not the URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse(verified));

    await new QueryClient().fetchQuery(
      passwordResetQueries.verifyLink("email-token")
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("email-token");
    expect(JSON.parse(init.body)).toEqual({ token: "email-token" });
  });

  it("does not run without a token", () => {
    expect(passwordResetQueries.verifyLink("").enabled).toBe(false);
  });
});

describe("resetPassword", () => {
  it("authorises with the verified reset token as a bearer", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, message: "ok" }));

    await resetPassword(
      {
        email: "ada.obi@rise.edu",
        password: "NewPass123",
        confirmPassword: "NewPass123",
      },
      "reset-jwt"
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/backend/auth/reset-password");
    expect(init.headers.Authorization).toBe("Bearer reset-jwt");
    expect(JSON.parse(init.body)).toEqual({
      email: "ada.obi@rise.edu",
      password: "NewPass123",
      confirmPassword: "NewPass123",
    });
  });
});

describe("getPasswordResetErrorMessage", () => {
  it.each([
    [404, /invalid, has expired, or has already been used/],
    [401, /reset session has expired/],
    [403, /suspended/],
    [429, /wait a few minutes/],
  ])("explains a %i", (status, message) => {
    expect(
      getPasswordResetErrorMessage(new ApiError(status, "x", null))
    ).toMatch(message);
  });

  it("passes validation messages through", () => {
    expect(
      getPasswordResetErrorMessage(
        new ApiError(400, "Email does not match the reset link", null)
      )
    ).toBe("Email does not match the reset link");
  });

  it("names a connection problem for non-HTTP failures", () => {
    expect(getPasswordResetErrorMessage(new TypeError("fetch"))).toMatch(
      /couldn't reach the server/
    );
  });
});
