import { api, ApiError } from "@/lib/api";
import { clearAuthToken, setAuthToken } from "@/lib/auth-token";

export type Role = "SUPERADMIN" | "INSTRUCTOR" | "STUDENT";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type OnboardingStatus = "INVITED" | "COMPLETED";

export type AuthUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  image?: string | null;
  displayName?: string | null;
  onboardingStatus: OnboardingStatus;
  onboardedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionResponse = {
  user: AuthUser;
  session: AuthSession;
};

export type Credentials = {
  email: string;
  password: string;
};

/**
 * One sign-in endpoint for every role — the backend reads the role off the
 * account, so students, instructors and admins all post here.
 */
export async function signIn(credentials: Credentials) {
  const data = await api.post<SessionResponse>(
    "/auth/sign-in/email",
    credentials
  );

  if (data?.session?.token) {
    setAuthToken(data.session.token);
  }

  return data;
}

/** Returns `null` when there is no active session. */
export function getSession() {
  return api.get<SessionResponse | null>("/auth/get-session");
}

export async function signOut() {
  try {
    await api.post<{ success: boolean }>("/auth/sign-out");
  } finally {
    clearAuthToken();
  }
}

/**
 * Where a user belongs right after signing in. Users who were invited but
 * never onboarded finish their profile first.
 */
export function landingPathFor(user: AuthUser) {
  if (user.role === "SUPERADMIN") return "/admin/dashboard";

  const isInstructor = user.role === "INSTRUCTOR";

  if (user.onboardingStatus === "INVITED") {
    return isInstructor
      ? "/instructor/complete-profile"
      : "/student/complete-profile";
  }

  return isInstructor ? "/instructor/dashboard" : "/student/dashboard";
}

/**
 * Sign-in failures, in the words we want users to read. The backend currently
 * answers bad credentials with a 500 and an empty body, so that case is folded
 * into one message that is true whether the details were wrong or the server
 * hiccuped.
 */
export function getSignInErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  if (error.status === 401 || error.status === 403) {
    return "Incorrect email or password.";
  }

  if (error.status === 429) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  if (error.status >= 500) {
    return "We couldn't sign you in. Please check your details and try again.";
  }

  return error.message || "We couldn't sign you in. Please try again.";
}
