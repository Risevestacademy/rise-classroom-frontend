import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthGuard } from "@/components/AuthGuard";
import type { AuthUser } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";
import { mockApi, reply } from "@/test/utils";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/dashboard",
}));

const user = { id: "1", firstName: "Ada", role: "SUPERADMIN" } as AuthUser;

function renderGuard({ signedIn }: { signedIn: boolean }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (signedIn) client.setQueryData(sessionQuery().queryKey, { user, session: {} } as never);
  render(
    <QueryClientProvider client={client}>
      <AuthGuard role="SUPERADMIN">
        <p>page</p>
      </AuthGuard>
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  replace.mockReset();
});

describe("AuthGuard", () => {
  it("shows the service unavailable screen when the backend is down, instead of signing out", async () => {
    mockApi({ "GET /auth/get-session": reply(503) });
    renderGuard({ signedIn: false });

    expect(await screen.findByText("The service is temporarily unavailable.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows the timed out screen when the backend is too slow", async () => {
    mockApi({ "GET /auth/get-session": reply(504) });
    renderGuard({ signedIn: false });

    expect(await screen.findByText("The request timed out.")).toBeInTheDocument();
  });

  it("asks them to sign in again when the session ends mid-visit", async () => {
    mockApi({ "GET /auth/get-session": null });
    const client = renderGuard({ signedIn: true });
    expect(screen.getByText("page")).toBeInTheDocument();

    await client.invalidateQueries({ queryKey: sessionQuery().queryKey });

    expect(await screen.findByText("You need to sign in")).toBeInTheDocument();
    expect(screen.getByText("Sign in").closest("a")).toHaveAttribute(
      "href",
      "/sign-in?next=%2Fadmin%2Fdashboard",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends someone who arrives without a session straight to sign-in", async () => {
    mockApi({ "GET /auth/get-session": null });
    renderGuard({ signedIn: false });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/sign-in?next=%2Fadmin%2Fdashboard"));
  });
});
