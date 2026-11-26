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

  it("offers the floating window from More, even where the browser can't present", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    setup({ canShareScreen: false, floating: { open: false, available: true, onToggle } });

    await user.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.queryByRole("menuitem", { name: "Present your screen" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("menuitem", { name: "Float the call" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("can't float the call while nobody's camera is on", async () => {
    const user = userEvent.setup();
    setup({ floating: { open: false, available: false, onToggle: vi.fn() } });

    await user.click(screen.getByRole("button", { name: "More options" }));
    expect(await screen.findByRole("menuitem", { name: "Float the call (no cameras on)" })).toHaveAttribute("aria-disabled", "true");
  });
});
