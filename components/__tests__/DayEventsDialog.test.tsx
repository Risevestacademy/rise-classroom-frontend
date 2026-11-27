import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { DayEventsDialog } from "@/components/calendar/DayEventsDialog";
import { blankDraft } from "@/components/calendar/EventFormDialog";
import type { CalendarEvent } from "@/lib/calendar";
import { renderWithClient } from "@/test/utils";

const event = (id: string, title: string, startTime: string): CalendarEvent => ({
  ...blankDraft(new Date(2026, 10, 25)),
  organizer: "admin@example.com",
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
    const events = [
      event("a", "Standup", "09:00"),
      event("b", "Design review", "11:00"),
      event("c", "Office hours", "14:00"),
      event("d", "Retro", "16:00"),
    ];
    const { user } = renderWithClient(
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
    const onCreate = vi.fn();
    const { user } = renderWithClient(
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
