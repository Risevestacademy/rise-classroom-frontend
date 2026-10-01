// Session token store. The backend accepts either its own session cookie or
// `Authorization: Bearer <token>`; we keep the token because the API lives on a
// different origin, where third-party cookie blocking makes the cookie
// unreliable in the browser.
const TOKEN_KEY = "rise.session_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage can be unavailable (private mode, quota). The session cookie is
    // still set by the backend, so sign-in shouldn't fail over this.
  }
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
