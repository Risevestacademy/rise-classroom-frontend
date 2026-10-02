import { queryOptions } from "@tanstack/react-query";

import { api, ApiError, type Envelope } from "@/lib/api";

/** What `POST /auth/reset-password/verify` hands back for a valid link. */
export type VerifiedResetLink = {
  status: "ok";
  email: string;
  /** Single-use JWT for `POST /auth/reset-password`, valid for 15 minutes. */
  resetToken: string;
  /** Seconds until `resetToken` expires. */
  expiresIn: number;
};

export type ResetPasswordInput = {
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Emails a reset link. The API answers the same way whether or not the address
 * has an account, so success here doesn't mean an email was actually sent.
 */
export function requestPasswordReset(email: string) {
  return api.post<{ success: boolean; message: string }>(
    "/auth/forgot-password",
    { email }
  );
}

async function verifyResetLink(token: string) {
  const { data } = await api.post<Envelope<VerifiedResetLink>>(
    "/auth/reset-password/verify",
    { token }
  );

  return data;
}

/** Sets the new password. Also signs the user out of every other session. */
export function resetPassword(input: ResetPasswordInput, resetToken: string) {
  return api.post<{ success: boolean; message: string }>(
    "/auth/reset-password",
    input,
    { headers: { Authorization: `Bearer ${resetToken}` } }
  );
}

export const passwordResetQueries = {
  /**
   * Verifying *uses up* the emailed link, so this must run exactly once per
   * visit: a second call — React's double-invoked dev effects, a refetch, a
   * remount — would 404 and wrongly report a valid link as used. The query
   * dedupes concurrent calls and is never refetched or evicted.
   */
  verifyLink: (token: string) =>
    queryOptions({
      queryKey: ["password-reset", "verify", token] as const,
      queryFn: () => verifyResetLink(token),
      enabled: token.length > 0,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
};

/** Turns a password-reset failure into something the user can act on. */
export function getPasswordResetErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  switch (error.status) {
    case 401:
      return "This reset session has expired. Request a new link and try again.";
    case 403:
      return "This account has been suspended. Please contact support.";
    case 404:
      return "This reset link is invalid, has expired, or has already been used.";
    case 429:
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
