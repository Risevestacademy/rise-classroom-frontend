import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { EventFormDialog, type EventDraft } from "@/components/calendar/EventFormDialog";
import { tracks } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const draft: EventDraft = {
  kind: "event",
  title: "",
  date: "2026-11-02",
  endDate: "2026-11-02",
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  repeat: null,
  trackIds: [],
  link: "",
  description: "",
  guests: [],
  permissions: { modify: false, invite: false, seeGuests: true },
  notifications: [10],
  color: "#000000",
};

function renderForm({
  mode = "create" as const,
  initial = draft,
}: { mode?: "create" | "edit"; initial?: EventDraft } = {}) {
  mockApi({ "GET /admin/tracks": envelope(tracks) });
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();
  const view = renderWithClient(
    <EventFormDialog
      open
      onOpenChange={onOpenChange}
      mode={mode}
      initial={initial}
      onSubmit={onSubmit}
      hasEvents={() => false}
    />
  );
  return { ...view, onSubmit, onOpenChange };
}

function pickTime(label: string, time: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: time } });
}

describe("EventFormDialog", () => {
  it("needs a title", async () => {
    const { user } = renderForm();
    const create = screen.getByRole("button", { name: "Create event" });

    expect(create).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Add title"), "   ");
    expect(create).toBeDisabled();
  });

  it("hands back the event with a trimmed title, then closes", async () => {
    const { user, onSubmit, onOpenChange } = renderForm();

    await user.type(screen.getByPlaceholderText("Add title"), "  Demo day ");
    await user.click(screen.getByRole("radio", { name: "Task" }));
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith({ ...draft, title: "Demo day", kind: "task" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the event's length when the start time moves", async () => {
    const { user, onSubmit } = renderForm({ initial: { ...draft, title: "Standup" } });

    pickTime("Start time", "11:30");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "11:30", endTime: "12:30" })
    );
  });

  it("won't end before it starts on the same day", async () => {
    const { user, onSubmit } = renderForm({ initial: { ...draft, title: "Standup" } });

    pickTime("End time", "08:00");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "09:00", endTime: "09:00" })
    );
  });

  it("hides the times for all-day events", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("checkbox", { name: "All day" }));

    expect(screen.queryByLabelText("Start time")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End time")).not.toBeInTheDocument();
  });

  it("edits an existing event", async () => {
    const { user, onSubmit } = renderForm({
      mode: "edit",
      initial: { ...draft, title: "Demo day" },
    });

    expect(screen.getByRole("heading", { name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add title")).toHaveValue("Demo day");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Demo day" }));
  });

  it("takes any minute, not just quarter hours", async () => {
    const { user, onSubmit } = renderForm({ initial: { ...draft, title: "Standup" } });

    pickTime("Start time", "10:07");
    pickTime("End time", "10:52");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "10:07", endTime: "10:52" })
    );
  });

  const weekly = {
    ...draft,
    title: "Standup",
    seriesId: "s-1",
    repeat: { frequency: "week", interval: 1, weekdays: [1], ends: { type: "never" } },
  } satisfies EventDraft;

  async function moveToTuesday(user: ReturnType<typeof renderWithClient>["user"]) {
    // 2 Nov 2026 is a Monday.
    await user.click(screen.getByRole("button", { name: /^Starts/ }));
    await user.click(await screen.findByRole("button", { name: "Tue Nov 03 2026" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
  }

  it("repeats on the new weekday when every event moves to another day", async () => {
    const { user, onSubmit } = renderForm({ mode: "edit", initial: weekly });

    await moveToTuesday(user);
    await user.click(screen.getByRole("radio", { name: "All events" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-11-03", repeat: { ...weekly.repeat, weekdays: [2] } }),
      "all"
    );
  });

  it("keeps the series' repeat when only one event moves", async () => {
    const { user, onSubmit } = renderForm({ mode: "edit", initial: weekly });

    await moveToTuesday(user);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-11-03", repeat: weekly.repeat }),
      "this"
    );
  });
});
