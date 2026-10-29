import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

import type { AuthUser, SessionResponse } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

const requireRole = vi.fn<() => Promise<SessionResponse | null>>();

vi.mock("@/lib/session.server", () => ({
  requireRole: () => requireRole(),
}));

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/dashboard",
}));

const { RoleGate } = await import("@/components/RoleGate");

const user = {
  id: "1",
  name: "Ada Obi",
  firstName: "Ada",
  role: "SUPERADMIN",
} as AuthUser;

function UserName() {
  const { data } = useQuery(sessionQuery());
  return <p>{data?.user.firstName ?? "loading"}</p>;
}

async function renderGate() {
  const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");

  const client = new QueryClient();
  const gate = await RoleGate({ role: "SUPERADMIN", children: <UserName /> });
  render(<QueryClientProvider client={client}>{gate}</QueryClientProvider>);

  return { fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  replace.mockReset();
});

describe("RoleGate", () => {
  it("hands the server's session to the page, so nothing waits on it", async () => {
    requireRole.mockResolvedValue({
      user,
      session: {} as SessionResponse["session"],
    });

    const { fetchMock } = await renderGate();

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to fetching in the browser when the server couldn't check", async () => {
    requireRole.mockResolvedValue(null);

    const { fetchMock } = await renderGate();

    expect(screen.getByText("loading")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });
});
