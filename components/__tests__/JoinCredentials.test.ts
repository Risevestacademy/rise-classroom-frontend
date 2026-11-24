import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJoinCredentials } from "@/lib/live-room";
import { envelope, mockApi, reply } from "@/test/utils";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchJoinCredentials", () => {
  it("gets the join token from the backend", async () => {
    const api = mockApi({
      "POST /live-sessions/s-1/token": envelope({
        token: "jwt",
        url: "wss://rise.livekit.cloud",
        roomName: "rise-session-1",
        identity: "u-1",
        name: "Ada",
        role: "HOST",
        expiresIn: 7200,
      }),
    });

    await expect(fetchJoinCredentials("s-1")).resolves.toEqual({ url: "wss://rise.livekit.cloud", token: "jwt" });
    expect(api.bodies("POST /live-sessions/s-1/token")).toEqual([{}]);
  });

  it("passes on why the backend refused", async () => {
    mockApi({ "POST /live-sessions/s-1/token": reply(409, { success: false, message: "This session has ended" }) });

    await expect(fetchJoinCredentials("s-1")).rejects.toThrow("This session has ended");
  });
});
