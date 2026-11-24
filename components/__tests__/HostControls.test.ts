import { afterEach, describe, expect, it, vi } from "vitest";

import { endSessionForAll, muteParticipant, removeParticipant, setScreenShare } from "@/lib/live-room";
import { joinBlockFor, type SessionEntry } from "@/lib/live-sessions";
import { envelope, mockApi } from "@/test/utils";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("host controls", () => {
  it("calls the backend's host-control endpoints with a person's user id", async () => {
    const ok = envelope({});
    const api = mockApi({
      "POST /live-sessions/s-1/participants/u-2/mute": ok,
      "DELETE /live-sessions/s-1/participants/u-2": ok,
      "POST /live-sessions/s-1/screen-share": ok,
      "POST /live-sessions/s-1/end": ok,
    });

    await muteParticipant("s-1", "u-2");
    await removeParticipant("s-1", "u-2");
    await setScreenShare("s-1", "u-2", "block");
    await endSessionForAll("s-1");

    expect(api.bodies("POST /live-sessions/s-1/screen-share")).toEqual([{ identity: "u-2", action: "block" }]);
    expect(api.fetchMock).toHaveBeenCalledTimes(4);
  });
});

describe("joinBlockFor", () => {
  it("tells someone the host removed them", () => {
    const entry = {
      join: { eligible: true, canJoinNow: false, blockedReason: "REMOVED", canStart: false },
    } as SessionEntry;
    expect(joinBlockFor(entry)).toBe("removed");
  });
});
