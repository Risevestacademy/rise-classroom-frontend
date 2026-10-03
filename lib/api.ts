/**
 * In the browser this is the same-origin proxy path (`/api/backend`) so the
 * backend's SameSite=Lax session cookie counts as first-party. On the server
 * there is no proxy to go through, so we talk to the backend directly.
 */
function getApiUrl() {
  const url =
    typeof window === "undefined"
      ? (process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL)
      : process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to your .env.local file."
    );
  }

  return url;
}

/** Every resource endpoint wraps its payload in `{ success, data }`. */
export type Envelope<T> = {
  success: boolean;
  data: T;
};

/** Shape the API uses for paginated collections. */
export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
  query?: Record<string, QueryValue>;
};

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const target = path.startsWith("http")
    ? path
    : `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  // The browser base is a relative proxy path, so it needs an origin to
  // resolve against.
  const url = new URL(
    target,
    typeof window === "undefined" ? undefined : window.location.origin
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function extractMessage(
  isJson: boolean,
  data: unknown,
  response: Response
): string {
  if (isJson && data && typeof data === "object" && "message" in data) {
    const message = (data as { message: unknown }).message;

    // The API returns a string for single errors and an array for field-level
    // validation failures.
    if (Array.isArray(message)) {
      const joined = message.filter(Boolean).map(String).join(" ");
      if (joined) return joined;
    }

    if (typeof message === "string" && message.trim()) return message;
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

async function request<T>(
  method: string,
  path: string,
  { body, query, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...init,
    method,
    // Auth is the backend's HttpOnly session cookie, so nothing is attached by
    // hand here. The backend ignores `Authorization: Bearer` entirely.
    credentials: init.credentials ?? "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(isJson, data, response),
      data
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
