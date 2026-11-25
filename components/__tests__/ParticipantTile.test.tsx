import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Track, type Participant } from "livekit-client";

import { ParticipantTile } from "@/components/live-room/ParticipantTile";

const audio = vi.hoisted(() => ({ bands: [0, 0, 0] }));

vi.mock("@livekit/components-react", () => ({
  isTrackReference: () => false,
  useConnectionQualityIndicator: () => ({ quality: "excellent" }),
  useIsMuted: () => false,
  useIsSpeaking: () => true,
  useMultibandTrackVolume: () => audio.bands,
  useParticipantAttributes: () => ({ attributes: {} }),
  useParticipantTracks: () => [],
  VideoTrack: () => null,
}));

const participant = { identity: "1", name: "Ada Obi", isLocal: false, attributes: {} } as unknown as Participant;
const trackRef = { participant, source: Track.Source.Camera };

describe("ParticipantTile voice bars", () => {
  it("settles when a loud speaker goes quiet instead of re-rendering forever", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    // A raised voice, then near silence: the peaks have a long way to fall.
    audio.bands = [1, 1, 1];
    const { rerender } = render(<ParticipantTile trackRef={trackRef} />);
    audio.bands = [0.55, 0.55, 0.55];
    rerender(<ParticipantTile trackRef={trackRef} />);
    rerender(<ParticipantTile trackRef={trackRef} />);

    expect(screen.getByRole("article", { name: "Ada Obi" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
