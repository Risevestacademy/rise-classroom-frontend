import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { CreateTrackDialog } from "@/components/CreateTrackDialog";
import { EditTrackDialog } from "@/components/EditTrackDialog";
import { adminKeys } from "@/lib/admin";
import { makeTrack } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

describe("CreateTrackDialog", () => {
  async function fillBasics(view: ReturnType<typeof renderWithClient>) {
    await view.user.click(screen.getByRole("button", { name: "Create track" }));
    await view.user.type(screen.getByLabelText(/Track name/), " Data Science ");
    await view.user.type(screen.getByLabelText(/Description/), "Python and statistics");
    await view.user.click(screen.getByRole("button", { name: "Next" }));
  }

  it("needs a name and a description", async () => {
    mockApi({});
    const { user } = renderWithClient(<CreateTrackDialog />);

    await user.click(screen.getByRole("button", { name: "Create track" }));
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    await user.type(screen.getByLabelText(/Track name/), "Data Science");
    expect(next).toBeDisabled();

    await user.type(screen.getByLabelText(/Description/), "   ");
    expect(next).toBeDisabled();
  });

  it("creates the track after review", async () => {
    const api = mockApi({ "POST /admin/tracks": envelope(makeTrack({ id: "new" })) });
    const view = renderWithClient(<CreateTrackDialog />);

    await fillBasics(view);
    expect(screen.getByText("Python and statistics")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Create track" }));

    expect(await screen.findByText("Track created successfully")).toBeInTheDocument();
    expect(screen.getByText("The Data Science track has been added to your program.")).toBeInTheDocument();
    expect(api.bodies("POST /admin/tracks")).toEqual([
      { name: "Data Science", description: "Python and statistics" },
    ]);
  });

  // The invite dialogs read the ACTIVE list, so a new track has to show up
  // there straight away, not after the five-minute cache runs out.
  it("refreshes every track list, including the active one", async () => {
    mockApi({ "POST /admin/tracks": envelope(makeTrack({ id: "new" })) });
    const view = renderWithClient(<CreateTrackDialog />);
    view.client.setQueryData(adminKeys.tracks("ACTIVE"), []);
    view.client.setQueryData(adminKeys.tracks(), []);

    await fillBasics(view);
    await view.user.click(screen.getByRole("button", { name: "Create track" }));
    await screen.findByText("Track created successfully");

    const state = (status?: "ACTIVE") =>
      view.client.getQueryState(adminKeys.tracks(status));
    expect(state("ACTIVE")?.isInvalidated).toBe(true);
    expect(state()?.isInvalidated).toBe(true);
  });

  it("shows the error and keeps the details", async () => {
    mockApi({ "POST /admin/tracks": reply(409, { message: "Track name already taken" }) });
    const view = renderWithClient(<CreateTrackDialog />);

    await fillBasics(view);
    await view.user.click(screen.getByRole("button", { name: "Create track" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Track name already taken");
    await view.user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText(/Track name/)).toHaveValue(" Data Science ");
  });

  it("starts empty after closing", async () => {
    mockApi({});
    const view = renderWithClient(<CreateTrackDialog />);

    await view.user.click(screen.getByRole("button", { name: "Create track" }));
    await view.user.type(screen.getByLabelText(/Track name/), "Data Science");
    await view.user.click(screen.getByRole("button", { name: "Cancel" }));
    await view.user.click(screen.getByRole("button", { name: "Create track" }));

    expect(screen.getByLabelText(/Track name/)).toHaveValue("");
  });
});

describe("EditTrackDialog", () => {
  const track = makeTrack({ id: "t1", name: "Frontend", description: "React and CSS" });

  function mockBackend(routes: Record<string, unknown> = {}, role = "SUPERADMIN") {
    return mockApi({
      "GET /auth/get-session": { user: { id: "me", role }, session: {} },
      "GET /admin/tracks/t1": envelope(track),
      ...routes,
    });
  }

  async function openEditor() {
    const view = renderWithClient(<EditTrackDialog trackId="t1" trackName="Frontend" />);
    const trigger = screen.getByRole("button", { name: "Edit Frontend" });
    await vi.waitFor(() => expect(trigger).toBeEnabled());
    await view.user.click(trigger);
    await screen.findByDisplayValue("Frontend");
    return view;
  }

  it("is only open to super admins", async () => {
    mockBackend({}, "INSTRUCTOR");
    renderWithClient(<EditTrackDialog trackId="t1" trackName="Frontend" />);

    const trigger = screen.getByRole("button", { name: "Edit Frontend" });
    await vi.waitFor(() =>
      expect(trigger).toHaveAttribute("title", "Only super admins can do this")
    );
    expect(trigger).toBeDisabled();
  });

  it("saves only what changed and refreshes the tracks", async () => {
    const api = mockBackend({ "PATCH /admin/tracks/t1": envelope(track) });
    const { user, invalidate } = await openEditor();
    const save = screen.getByRole("button", { name: "Save changes" });

    expect(save).toBeDisabled();

    await user.click(screen.getByLabelText("Status"));
    await user.click(await screen.findByRole("option", { name: "Suspended" }));
    await user.click(save);

    await vi.waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Edit track" })).not.toBeInTheDocument()
    );
    expect(api.bodies("PATCH /admin/tracks/t1")).toEqual([{ status: "SUSPENDED" }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "tracks"] });
  });

  it("needs a name and a description", async () => {
    mockBackend();
    const { user } = await openEditor();

    await user.clear(screen.getByLabelText(/Track name/));
    await user.clear(screen.getByLabelText(/Description/));

    expect(screen.getByText("Track name is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("explains a duplicate name", async () => {
    mockBackend({ "PATCH /admin/tracks/t1": reply(409) });
    const { user } = await openEditor();

    await user.type(screen.getByLabelText(/Track name/), " 2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A track with this name already exists. Choose a different name."
    );
  });

  it("says when the track can't be loaded", async () => {
    mockApi({
      "GET /auth/get-session": { user: { id: "me", role: "SUPERADMIN" }, session: {} },
      "GET /admin/tracks/t1": reply(404),
    });
    const { user } = renderWithClient(<EditTrackDialog trackId="t1" trackName="Frontend" />);
    const trigger = screen.getByRole("button", { name: "Edit Frontend" });
    await vi.waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This track no longer exists."
    );
  });
});
