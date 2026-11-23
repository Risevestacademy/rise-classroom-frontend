import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { SessionSettingsDialog } from "@/components/live-room/SessionSettings";
import { defaultSessionSettings } from "@/lib/live-room";

const setActiveMediaDevice = vi.fn(() => Promise.resolve());

vi.mock("@livekit/components-react", () => ({
  useMediaDeviceSelect: ({ kind }: { kind: string }) => ({
    devices: [{ deviceId: "default", label: `Default ${kind}` }, { deviceId: "usb", label: `USB ${kind}` }],
    activeDeviceId: "default",
    setActiveMediaDevice,
  }),
}));

function renderSettings(isHost: boolean) {
  const onChange = vi.fn();
  render(
    <SessionSettingsDialog open onOpenChange={() => {}} isHost={isHost} settings={defaultSessionSettings} onChange={onChange} />,
  );
  return onChange;
}

describe("SessionSettingsDialog", () => {
  it("gives the host every section and saves a permission change", () => {
    const onChange = renderSettings(true);

    for (const name of ["Participants & permissions", "Access & security", "Audio & video", "Recording"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("switch", { name: "Allow participant chat" }));
    expect(onChange).toHaveBeenCalledWith({ chat: false });

    fireEvent.click(screen.getByRole("button", { name: "Access & security" }));
    fireEvent.click(screen.getByRole("switch", { name: "Lock session" }));
    expect(onChange).toHaveBeenCalledWith({ locked: true });
  });

  it("only lets everyone else pick their own devices", () => {
    renderSettings(false);

    expect(screen.queryByRole("button", { name: "Participants & permissions" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Audio & video" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Default microphone" })).toHaveTextContent("System default");
    expect(screen.getByRole("combobox", { name: "Default camera" })).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
