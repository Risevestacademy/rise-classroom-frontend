function getApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to your .env.local file."
    );
  }

  return url;
}

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
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`
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

async function request<T>(
  method: string,
  path: string,
  { body, query, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...init,
    method,
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
    const message =
      (isJson && data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : undefined) ?? response.statusText;

    throw new ApiError(response.status, message, data);
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
