import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CHAT_TOPIC, useSessionChat } from "@/components/live-room/useSessionChat";
import { envelope, mockApi } from "@/test/utils";

const publish = vi.fn(() => Promise.resolve());
let onPacket: (packet: { payload: Uint8Array }) => void = () => {};

vi.mock("@livekit/components-react", () => ({
  useDataChannel: (_topic: string, handler: typeof onPacket) => {
    onPacket = handler;
    return { send: publish };
  },
}));

const message = (id: string, body: string, createdAt: string) => ({
  id,
  body,
  createdAt,
  sender: { id: `user-${id}`, name: "Ada Obi" },
});

function renderChat() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useSessionChat("s-1", true), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  publish.mockClear();
});

describe("useSessionChat", () => {
  it("loads the history, adds what arrives in the room once, and passes on what the backend couldn't", async () => {
    const sent = message("m-3", "On my way", "2026-11-23T18:02:00Z");
    const api = mockApi({
      "GET /live-sessions/s-1/chat/messages": envelope({ items: [message("m-1", "Hi", "2026-11-23T18:00:00Z")] }),
      "POST /live-sessions/s-1/chat/messages": envelope({ message: sent, delivered: false, duplicate: false }),
    });
    const { result } = renderChat();
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    const arrived = new TextEncoder().encode(
      JSON.stringify({ type: "chat.message", message: message("m-2", "Hello", "2026-11-23T18:01:00Z") }),
    );
    act(() => onPacket({ payload: arrived }));
    act(() => onPacket({ payload: arrived }));
    expect(result.current.messages.map((m) => m.body)).toEqual(["Hi", "Hello"]);

    await act(() => result.current.send("On my way"));
    expect(api.bodies("POST /live-sessions/s-1/chat/messages")[0]).toMatchObject({ body: "On my way" });
    expect(result.current.messages.map((m) => m.body)).toEqual(["Hi", "Hello", "On my way"]);
    expect(publish).toHaveBeenCalledWith(expect.any(Uint8Array), { reliable: true, topic: CHAT_TOPIC });
  });

  it("shows a message as soon as it's sent, and takes it back if saving fails", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) =>
        init?.method === "POST"
          ? new Promise<Response>((resolve) => (finish = resolve))
          : Promise.resolve(Response.json(envelope({ items: [] }))),
      ),
    );
    const { result } = renderChat();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let sent: Promise<unknown> = Promise.resolve();
    act(() => {
      sent = result.current.send("Be right there").catch(() => "failed");
    });
    expect(result.current.messages).toMatchObject([{ body: "Be right there", pending: true }]);

    await act(async () => {
      finish(Response.json({ message: "Chat is off" }, { status: 403 }));
      expect(await sent).toBe("failed");
    });
    expect(result.current.messages).toEqual([]);
  });
});
