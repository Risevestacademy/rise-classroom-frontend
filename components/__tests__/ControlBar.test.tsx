import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ControlBar, type ControlBarProps } from "@/components/live-room/ControlBar";

const setup = (overrides: Partial<ControlBarProps> = {}) => {
  const props: ControlBarProps = {
    micOn: true,
    cameraOn: true,
    sharing: false,
    handRaised: false,
    isHost: false,
    canShareScreen: true,
    blocked: {},
    onToggleMic: vi.fn(),
    onToggleCamera: vi.fn(),
    onToggleShare: vi.fn(),
    onToggleHand: vi.fn(),
    onReact: vi.fn(),
    onFeedback: vi.fn(),
    onOpenSettings: vi.fn(),
    onLeave: vi.fn(),
    onEndForAll: vi.fn(),
    ...overrides,
  };
  render(<ControlBar {...props} />);
  return props;
};

describe("ControlBar More menu", () => {
  it.each([
    ["Present your screen", "onToggleShare"],
    ["Session settings", "onOpenSettings"],
  ] as const)("offers %s from More, for the phone layout", async (item, handler) => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(await screen.findByRole("menuitem", { name: item }));
    expect(props[handler]).toHaveBeenCalledOnce();
  });

  it("keeps settings on the bar with no More menu where the browser can't present", () => {
    setup({ canShareScreen: false });
    expect(screen.queryByRole("button", { name: "More options" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Session settings" })).not.toHaveClass("max-sm:hidden");
  });
});
