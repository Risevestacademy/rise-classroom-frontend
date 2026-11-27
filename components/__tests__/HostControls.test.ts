import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultSessionSettings,
  endSessionForAll,
  latestSettings,
  mayShareScreen,
  muteParticipant,
  recordingProblem,
  removeParticipant,
  setScreenShare,
  startRecording,
} from "@/lib/live-room";
import { joinBlockFor, type SessionEntry } from "@/lib/live-sessions";
import { envelope, mockApi, reply } from "@/test/utils";

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

describe("room settings and permissions", () => {
  it("follows whichever host or moderator changed the settings last", () => {
    const older = { ...defaultSessionSettings, chat: false, updatedAt: 100 };
    const newer = { ...defaultSessionSettings, chat: true, reactions: false, updatedAt: 200 };
    expect(latestSettings([newer, older])).toBe(newer);
    expect(latestSettings([])).toBe(defaultSessionSettings);
    // Your own unchanged settings still beat the defaults.
    const own = { ...defaultSessionSettings, chat: false };
    expect(latestSettings([own])).toBe(own);
  });

  it("lets someone share once the host allows it mid-session", () => {
    expect(mayShareScreen(undefined, false)).toBe(false);
    expect(mayShareScreen({ canPublish: true, canPublishSources: [1, 2] }, true)).toBe(false);
    expect(mayShareScreen({ canPublish: true, canPublishSources: [1, 2, 3, 4] }, false)).toBe(true);
    expect(mayShareScreen({ canPublish: true, canPublishSources: [] }, false)).toBe(true);
    expect(mayShareScreen({ canPublish: false, canPublishSources: [] }, true)).toBe(false);
  });

  it("says why recording didn't start", async () => {
    mockApi({
      "POST /live-sessions/s-1/recording/start": reply(502, { message: "Failed to start session recording with media server" }),
    });
    const problem = await startRecording("s-1").catch((error: unknown) => error);
    expect(recordingProblem(problem)).toBe("Failed to start session recording with media server. Try again.");
    expect(recordingProblem(new Error("network"))).toBe("We couldn't start recording. Try again.");
  });
});
