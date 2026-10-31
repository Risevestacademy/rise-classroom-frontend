import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { cohort, tracks } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

function mockBackend({
  cohorts = [cohort],
  trackList = tracks,
  invite = envelope({ outcome: "invited", emailSent: true }) as unknown,
} = {}) {
  return mockApi({
    "GET /admin/cohorts": envelope(cohorts),
    "GET /admin/tracks": envelope(trackList),
    "POST /admin/users": invite,
    "POST /admin/users/bulk": envelope({
      summary: { total: 2, invited: 2, failed: 0, emailsNotSent: 0 },
      results: [],
    }),
  });
}

async function openDialog(ui = <InviteInstructorDialog />, trigger = "Invite Instructors") {
  const view = renderWithClient(ui);
  await view.user.click(screen.getByRole("button", { name: trigger }));
  return view;
}

async function reachReview(user: Awaited<ReturnType<typeof openDialog>>["user"]) {
  await user.click(await screen.findByRole("button", { name: /Invite Individually/ }));
  await user.type(screen.getByLabelText(/Email Address/), "grace@example.com");
  await user.type(screen.getByLabelText(/First name/), "Grace");
  await user.type(screen.getByLabelText(/Last name/), "Hopper");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByDisplayValue("Cohort 4");
  await user.click(screen.getByRole("button", { name: "Next" }));
}

describe("InviteInstructorDialog", () => {
  it("won't continue without an email address", async () => {
    mockBackend();
    const { user } = await openDialog();

    await user.click(await screen.findByRole("button", { name: /Invite Individually/ }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.type(screen.getByLabelText(/Email Address/), "grace@example.com");
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("invites an instructor to the selected cohort and chosen track", async () => {
    const api = mockBackend();
    const { user, invalidate } = await openDialog();

    await user.click(await screen.findByRole("button", { name: /Invite Individually/ }));
    await user.type(screen.getByLabelText(/Email Address/), "grace@example.com");
    await user.type(screen.getByLabelText(/First name/), "Grace");
    await user.type(screen.getByLabelText(/Last name/), "Hopper");
    await user.click(screen.getByRole("button", { name: "Next" }));

    await screen.findByDisplayValue("Cohort 4");
    await user.selectOptions(screen.getByRole("combobox"), "Backend");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Invitation sent!")).toBeInTheDocument();
    expect(api.bodies("POST /admin/users")).toEqual([
      {
        cohortId: "cohort-1",
        trackId: "track-2",
        role: "INSTRUCTOR",
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
      },
    ]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] });
  });

  it("fills in missing names from the email, since the API needs both", async () => {
    const api = mockBackend();
    const { user } = await openDialog();

    await user.click(await screen.findByRole("button", { name: /Invite Individually/ }));
    await user.type(screen.getByLabelText(/Email Address/), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByDisplayValue("Cohort 4");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    await screen.findByText("Invitation sent!");
    expect(api.bodies("POST /admin/users")[0]).toMatchObject({
      firstName: "grace",
      lastName: "Instructor",
    });
  });

  it("invites mentors with the mentor role", async () => {
    const api = mockBackend();
    const { user } = await openDialog(
      <InviteInstructorDialog role="MENTOR" />,
      "Invite Mentors"
    );

    expect(screen.getByRole("heading", { name: "Invite Mentors" })).toBeInTheDocument();
    await reachReview(user);
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    await screen.findByText("Invitation sent!");
    expect(api.bodies("POST /admin/users")[0]).toMatchObject({ role: "MENTOR" });
    expect(screen.getByRole("button", { name: "View mentors" })).toBeInTheDocument();
  });

  it("shows the error and lets the admin try again", async () => {
    mockBackend({ invite: reply(409, { message: "User already exists" }) });
    const { user } = await openDialog();

    await reachReview(user);
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("User already exists");
    expect(screen.getByRole("button", { name: "Send Invitation" })).toBeEnabled();
  });

  it("disables sending while the invite is in flight", async () => {
    mockBackend({ invite: () => new Promise(() => {}) });
    const { user } = await openDialog();

    await reachReview(user);
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("blocks inviting until the program has a track", async () => {
    mockBackend({ trackList: [] });
    await openDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "your program doesn't have an active track yet"
    );
    expect(screen.getByRole("button", { name: /Invite Individually/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Upload file/ })).toBeDisabled();
  });

  it("invites the selected rows from an uploaded file", async () => {
    const api = mockBackend();
    const { user } = await openDialog();

    await user.click(await screen.findByRole("button", { name: /Upload file/ }));
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(
      input,
      new File(
        ["name,email\nGrace Hopper,grace@example.com\nAlan Turing,alan@example.com"],
        "instructors.csv",
        { type: "text/csv" }
      )
    );

    await user.click(await screen.findByRole("button", { name: "Include alan@example.com" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByDisplayValue("Cohort 4");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Invitation sent!")).toBeInTheDocument();
    expect(api.bodies("POST /admin/users/bulk")).toEqual([
      {
        users: [
          {
            firstName: "Grace",
            lastName: "Hopper",
            email: "grace@example.com",
            cohortId: "cohort-1",
            trackId: "track-1",
            role: "INSTRUCTOR",
          },
        ],
      },
    ]);
  });
});
