import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

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
  attachments: [],
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

async function pickTime(
  user: ReturnType<typeof renderWithClient>["user"],
  label: string,
  time: string
) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: time }));
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
    await user.click(screen.getByRole("radio", { name: "task" }));
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith({ ...draft, title: "Demo day", kind: "task" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the event's length when the start time moves", async () => {
    const { user, onSubmit } = renderForm({ initial: { ...draft, title: "Standup" } });

    await pickTime(user, "Start time", "11:30AM");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "11:30", endTime: "12:30" })
    );
  });

  it("won't end before it starts on the same day", async () => {
    const { user, onSubmit } = renderForm({ initial: { ...draft, title: "Standup" } });

    await pickTime(user, "End time", "8:00AM");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "09:00", endTime: "09:00" })
    );
  });

  it("hides the times for all-day events", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("checkbox", { name: "All day" }));

    expect(screen.queryByRole("combobox", { name: "Start time" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "End time" })).not.toBeInTheDocument();
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
});
