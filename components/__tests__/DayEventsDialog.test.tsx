import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DayEventsDialog } from "@/components/calendar/DayEventsDialog";
import { sampleEvents, type CalendarEvent } from "@/lib/calendar";

const event = (id: string, title: string, startTime: string): CalendarEvent => ({
  ...sampleEvents[0],
  id,
  title,
  date: "2026-11-25",
  endDate: "2026-11-25",
  startTime,
  endTime: "23:00",
  allDay: false,
  repeat: null,
});

const day = new Date(2026, 10, 25);

describe("DayEventsDialog", () => {
  it("lists every event on the day and opens one's details", async () => {
    const user = userEvent.setup();
    const events = [
      event("a", "Standup", "09:00"),
      event("b", "Design review", "11:00"),
      event("c", "Office hours", "14:00"),
      event("d", "Retro", "16:00"),
    ];
    render(
      <DayEventsDialog
        date={day}
        events={events}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole("dialog", { name: "Wednesday, November 25" });
    expect(within(dialog).getByText("4 events")).toBeInTheDocument();
    for (const { title } of events) {
      expect(within(dialog).getByText(title)).toBeInTheDocument();
    }

    await user.click(within(dialog).getByRole("button", { name: /Retro/ }));
    expect(await screen.findByRole("heading", { name: "Retro" })).toBeInTheDocument();
  });

  it("offers to create an event on an empty day", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <DayEventsDialog
        date={day}
        events={[]}
        onClose={vi.fn()}
        onCreate={onCreate}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(await screen.findByText("Nothing scheduled")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create event" }));
    expect(onCreate).toHaveBeenCalledWith(day);
  });
});
