import { BACKEND_API_URL } from "@/lib/backend-url";

/**
 * In the browser this is the same-origin proxy path (`/api/backend`) so the
 * backend's SameSite=Lax session cookie counts as first-party. On the server
 * there is no proxy to go through, so we talk to the backend directly.
 */
function getApiUrl() {
  const url =
    typeof window === "undefined"
      ? BACKEND_API_URL
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

/** What was sent, kept on an `ApiError` so a failure can be traced. */
export type ApiRequestInfo = {
  method: string;
  url: string;
  body?: unknown;
  /** Ids the backend's host logs the request under (Render, Cloudflare). */
  requestIds?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  request?: ApiRequestInfo;

  constructor(
    status: number,
    message: string,
    body: unknown,
    request?: ApiRequestInfo,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.request = request;
  }
}

/**
 * Everything known about a failed request: route, status, message, what was
 * sent, what came back, and the ids to look it up in the backend's logs.
 */
export function apiErrorDetails(error: unknown) {
  if (!(error instanceof ApiError)) {
    return {
      message: error instanceof Error ? error.message : String(error),
      error,
    };
  }
  const { request } = error;
  return {
    route: request ? `${request.method} ${request.url}` : undefined,
    status: error.status,
    message: error.message,
    requestBody: request?.body,
    responseBody: error.body,
    requestIds: request?.requestIds,
    at: new Date().toISOString(),
  };
}

const requestIdHeaders = ["rndr-id", "cf-ray", "x-request-id"];

function requestIdsOf(response: Response) {
  const ids: Record<string, string> = {};
  for (const name of requestIdHeaders) {
    const value = response.headers.get(name);
    if (value) ids[name] = value;
  }
  return ids;
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

/**
 * Set by `lib/query.server.ts`: reads the incoming request's cookies, so
 * server-rendered pages call the API as the signed-in user. This file is
 * shared with the browser, so it can't import `next/headers` itself.
 */
let readServerCookie: (() => Promise<string | null>) | undefined;

export function setServerCookieReader(read: () => Promise<string | null>) {
  readServerCookie = read;
}

/**
 * A server render waits on the API, so a slow or cold backend is cut off
 * here and the browser loads the data instead.
 */
const SERVER_TIMEOUT_MS = 8_000;

async function serverDefaults(
  headers: HeadersInit | undefined,
  signal: RequestInit["signal"],
): Promise<{ cookie: Record<string, string>; signal?: AbortSignal | null }> {
  if (typeof window !== "undefined" || !readServerCookie) return { cookie: {} };

  const hasCookie = new Headers(headers).has("cookie");
  const cookie = hasCookie ? null : await readServerCookie();
  return {
    cookie: cookie ? { cookie } : {},
    signal: signal ?? AbortSignal.timeout(SERVER_TIMEOUT_MS),
  };
}

async function request<T>(
  method: string,
  path: string,
  { body, query, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const server = await serverDefaults(headers, init.signal);

  const url = buildUrl(path, query);
  const response = await fetch(url, {
    ...init,
    signal: server.signal ?? init.signal,
    method,
    // Auth is the backend's HttpOnly session cookie, so nothing is attached by
    // hand here. The backend ignores `Authorization: Bearer` entirely.
    credentials: init.credentials ?? "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...server.cookie,
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
    const error = new ApiError(
      response.status,
      extractMessage(isJson, data, response),
      data,
      {
        method,
        url,
        body: isFormData ? "[FormData]" : body,
        requestIds: requestIdsOf(response),
      },
    );
    // Server errors are logged in development with everything needed to report them.
    if (response.status >= 500 && process.env.NODE_ENV === "development") {
      console.error(`[api] ${method} ${url} failed`, apiErrorDetails(error));
    }
    throw error;
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
