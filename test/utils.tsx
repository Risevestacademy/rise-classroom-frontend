import { vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** `{ success, data }`, the envelope every resource endpoint returns. */
export function envelope<T>(data: T) {
  return { success: true, data };
}

type Reply = { status: number; body: unknown };

/** A non-2xx answer for a mocked route. */
export function reply(status: number, body: unknown = {}): Reply {
  return { status, body };
}

type Handler = unknown | Reply | ((body: unknown) => unknown);

function isReply(value: unknown): value is Reply {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "body" in value
  );
}

/**
 * Stubs `fetch` with the backend's routes, keyed by `"METHOD /path"` (no query
 * string). A value is sent back as a 200, `reply()` sets another status, and a
 * function gets the parsed request body. Anything else fails the request, so a
 * missing mock shows up as an error instead of a hang.
 */
export function mockApi(routes: Record<string, Handler>) {
  const requests: { key: string; url: URL; body: unknown }[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api\/backend/, "");
    const key = `${init?.method ?? "GET"} ${path}`;
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    requests.push({ key, url, body });

    if (!(key in routes)) throw new TypeError(`Unmocked request: ${key}`);

    const handler = routes[key];
    const result = typeof handler === "function" ? await handler(body) : handler;
    const { status, body: payload } = isReply(result)
      ? result
      : { status: 200, body: result };

    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");

  return {
    fetchMock,
    /** Request bodies sent to one route, in order. */
    bodies: (key: string) =>
      requests.filter((request) => request.key === key).map((r) => r.body),
    /** Full URLs (with query strings) requested for one route. */
    urls: (key: string) =>
      requests.filter((request) => request.key === key).map((r) => r.url),
  };
}

/** Renders inside a fresh React Query client with retries off. */
export function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");

  return {
    client,
    invalidate,
    user: userEvent.setup(),
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}
