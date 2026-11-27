import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { AuthUser, SessionResponse } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

const companion = vi.hoisted(() => ({ planted: true, quiet: false, growth: 2 }));

vi.mock("@/components/mascot/Companion", () => ({
  useCompanion: () => companion,
}));
/* The real mascot animates with browser APIs the test DOM doesn't have. */
vi.mock("@/components/mascot/InteractiveMascot", () => ({
  InteractiveMascot: ({ label }: { label: string }) => <span>{label}</span>,
}));

const { ControlTowerTour, controlTowerTourSteps, useControlTowerTour } =
  await import("@/components/control-tower/ControlTowerTour");

const user = { id: "student-1", role: "STUDENT" } as AuthUser;
const seenKey = "control-tower-tour-seen:student-1";

function Page() {
  const tour = useControlTowerTour();
  return (
    <>
      <h1 data-tour="header">Control Tower</h1>
      <div data-tour="plan" />
      <div data-tour="check-in" />
      <div data-tour="reflection" />
      <button type="button" data-tour="save">
        Save
      </button>
      <button type="button" data-tour="menu" onClick={tour.start}>
        Take the tour
      </button>
      {tour.open && <ControlTowerTour onClose={tour.close} />}
    </>
  );
}

function renderPage() {
  const client = new QueryClient();
  client.setQueryData(sessionQuery().queryKey, { user } as SessionResponse);
  render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

const tour = () => screen.queryByRole("dialog");

beforeEach(() => {
  localStorage.clear();
  Object.assign(companion, { planted: true, quiet: false });
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});

describe("Control Tower tour", () => {
  it("opens by itself on a first visit, with Leafy", async () => {
    renderPage();

    expect(
      await screen.findByRole("dialog", { name: "Welcome to Control Tower" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leafy, your learning companion")).toBeInTheDocument();
    expect(screen.getByText(`1 of ${controlTowerTourSteps.length}`)).toBeInTheDocument();
  });

  it("stays closed once seen, while Leafy is quiet, or before Leafy is planted", async () => {
    localStorage.setItem(seenKey, "1");
    renderPage();
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(tour()).not.toBeInTheDocument();

    localStorage.clear();
    companion.quiet = true;
    renderPage();
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(tour()).not.toBeInTheDocument();

    companion.quiet = false;
    companion.planted = false;
    renderPage();
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(tour()).not.toBeInTheDocument();
  });

  it("walks forward and back, and remembers it was finished", async () => {
    const events = renderPage();
    await screen.findByRole("dialog", { name: "Welcome to Control Tower" });

    await events.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Plan your week" })).toBeInTheDocument();

    await events.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("dialog", { name: "Welcome to Control Tower" }),
    ).toBeInTheDocument();

    for (let step = 1; step < controlTowerTourSteps.length; step += 1) {
      await events.keyboard("{ArrowRight}");
    }
    expect(screen.getByRole("dialog", { name: "Look back any time" })).toBeInTheDocument();

    await events.click(screen.getByRole("button", { name: "Done" }));
    expect(tour()).not.toBeInTheDocument();
    expect(localStorage.getItem(seenKey)).toBe("1");
  });

  it("ends on Escape and can be replayed from the start", async () => {
    const events = renderPage();
    await screen.findByRole("dialog", { name: "Welcome to Control Tower" });
    await events.click(screen.getByRole("button", { name: "Next" }));

    await events.keyboard("{Escape}");
    expect(tour()).not.toBeInTheDocument();
    expect(localStorage.getItem(seenKey)).toBe("1");

    await events.click(screen.getByRole("button", { name: "Take the tour" }));
    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "Welcome to Control Tower" }),
      ).toBeInTheDocument(),
    );
  });
});
