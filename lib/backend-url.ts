/** The backend itself, for server-side requests and the `/api/backend` rewrite. */
export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  "https://rise-classroom-backend-0r0f.onrender.com/api/v1";
