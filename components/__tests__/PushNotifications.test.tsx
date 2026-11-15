import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { AuthUser, SessionResponse } from "@/lib/auth";
import type { PushState } from "@/lib/push";
import { sessionQuery } from "@/lib/session-query";

const push = vi.hoisted(() => ({
  getPushState: vi.fn<() => Promise<PushState>>(),
  enablePush: vi.fn<(homePath: string) => Promise<PushState>>(),
  disablePush: vi.fn(async () => undefined),
  restorePush: vi.fn(async () => undefined),
}));

vi.mock("@/lib/push", async (original) => ({
  ...(await original<typeof import("@/lib/push")>()),
  ...push,
}));

const { PushNotifications, usePushMenuItem } = await import(
  "@/components/PushNotifications"
);
const { readPushChoice, writePushChoice } = await import("@/lib/push");

const user = { id: "user-1", role: "STUDENT" } as AuthUser;

function MenuItem() {
  const item = usePushMenuItem();
  if (!item) return <p>no item</p>;
  return (
    <button type="button" disabled={item.disabled} onClick={item.onClick}>
      {item.label}
    </button>
  );
}

function renderPush(state: PushState) {
  push.getPushState.mockResolvedValue(state);
  const client = new QueryClient();
  client.setQueryData(sessionQuery().queryKey, { user } as SessionResponse);
  render(
    <QueryClientProvider client={client}>
      <PushNotifications />
      <MenuItem />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

const prompt = () => screen.queryByRole("heading", { name: "Turn on notifications" });

beforeEach(() => {
  Object.values(push).forEach((mock) => mock.mockClear());
});

describe("PushNotifications", () => {
  it("offers notifications to a user who hasn't answered yet", async () => {
    renderPush("off");

    expect(await screen.findByRole("heading", { name: "Turn on notifications" })).toBeInTheDocument();
    expect(push.restorePush).toHaveBeenCalledWith("user-1", "/student/dashboard");
  });

  it.each(["unsupported", "blocked", "on"] as const)(
    "stays out of the way when notifications are %s",
    async (state) => {
      renderPush(state);

      await waitFor(() => expect(push.getPushState).toHaveBeenCalled());
      expect(prompt()).not.toBeInTheDocument();
    },
  );

  it("doesn't ask again after 'Not now'", async () => {
    const user = renderPush("off");

    await user.click(await screen.findByRole("button", { name: "Not now" }));

    await waitFor(() => expect(prompt()).not.toBeInTheDocument());
    expect(readPushChoice("user-1")).toBe("off");
    expect(push.enablePush).not.toHaveBeenCalled();
  });

  it("stays quiet for a user who already said no here", async () => {
    writePushChoice("user-1", "off");
    renderPush("off");

    await waitFor(() => expect(push.getPushState).toHaveBeenCalled());
    expect(prompt()).not.toBeInTheDocument();
  });

  it("turns notifications on and remembers it", async () => {
    push.enablePush.mockResolvedValue("on");
    const user = renderPush("off");

    await user.click(await screen.findByRole("button", { name: "Turn on" }));

    await waitFor(() => expect(prompt()).not.toBeInTheDocument());
    expect(push.enablePush).toHaveBeenCalledWith("/student/dashboard");
    expect(readPushChoice("user-1")).toBe("on");
  });

  it("keeps offering when the browser's question is closed unanswered", async () => {
    push.enablePush.mockResolvedValue("off");
    const user = renderPush("off");

    await user.click(await screen.findByRole("button", { name: "Turn on" }));

    await waitFor(() => expect(push.enablePush).toHaveBeenCalled());
    expect(prompt()).toBeInTheDocument();
    expect(readPushChoice("user-1")).toBeNull();
  });

  it("says so when turning on fails", async () => {
    push.enablePush.mockRejectedValue(new Error("offline"));
    const user = renderPush("off");

    await user.click(await screen.findByRole("button", { name: "Turn on" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notifications couldn't be turned on",
    );
  });
});

describe("usePushMenuItem", () => {
  it("has nothing to offer where push isn't supported", async () => {
    renderPush("unsupported");

    await waitFor(() => expect(push.getPushState).toHaveBeenCalled());
    expect(screen.getByText("no item")).toBeInTheDocument();
  });

  it("explains that the browser is blocking notifications", async () => {
    renderPush("blocked");

    expect(
      await screen.findByRole("button", { name: "Notifications blocked in browser" }),
    ).toBeDisabled();
  });

  it("turns notifications off for this browser", async () => {
    const user = renderPush("on");
    const turnOff = await screen.findByRole("button", {
      name: "Turn off notifications",
    });
    push.getPushState.mockResolvedValue("off");

    await user.click(turnOff);

    expect(
      await screen.findByRole("button", { name: "Turn on notifications" }),
    ).toBeInTheDocument();
    expect(push.disablePush).toHaveBeenCalled();
    expect(readPushChoice("user-1")).toBe("off");
    expect(prompt()).not.toBeInTheDocument();
  });
});
