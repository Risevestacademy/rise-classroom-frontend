import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";

import { InviteStudentDialog } from "@/components/InviteStudentDialog";
import { cohort, tracks } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

function mockBackend(invite: unknown = envelope({ outcome: "invited", emailSent: true })) {
  return mockApi({
    "GET /admin/cohorts": envelope([cohort]),
    "GET /admin/tracks": envelope(tracks),
    "POST /admin/users": invite,
  });
}

async function openSingleForm() {
  const view = renderWithClient(<InviteStudentDialog />);
  await view.user.click(screen.getByRole("button", { name: "Invite students" }));
  await view.user.click(screen.getByRole("button", { name: /Invite Individually/ }));
  return view;
}

async function fillDetails(user: Awaited<ReturnType<typeof openSingleForm>>["user"]) {
  await user.type(screen.getByLabelText(/Email Address/), "  ada@example.com ");
  await user.type(screen.getByLabelText(/First name/), "Ada");
  await user.type(screen.getByLabelText(/Last name/), "Obi");
  await user.click(screen.getByRole("button", { name: "Next" }));
}

describe("InviteStudentDialog", () => {
  it("asks for every detail before moving on", async () => {
    mockBackend();
    const { user } = await openSingleForm();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("First name is required.")).toBeInTheDocument();
    expect(screen.getByText("Last name is required.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Invite a student" })).toBeInTheDocument();
  });

  it("rejects an invalid email", async () => {
    mockBackend();
    const { user } = await openSingleForm();

    await user.type(screen.getByLabelText(/Email Address/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Please input valid email address.")).toBeInTheDocument();
  });

  it("invites a student to the selected cohort and chosen track", async () => {
    const api = mockBackend();
    const { user, invalidate } = await openSingleForm();

    await fillDetails(user);

    expect(await screen.findByDisplayValue("Cohort 4")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Track/), "Backend");
    await user.click(screen.getByRole("button", { name: "Next" }));

    const review = screen.getByRole("dialog");
    expect(within(review).getByText("Ada Obi")).toBeInTheDocument();
    expect(within(review).getByText("ada@example.com")).toBeInTheDocument();
    expect(within(review).getByText("Backend")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Invitation sent!")).toBeInTheDocument();
    expect(api.bodies("POST /admin/users")).toEqual([
      {
        cohortId: "cohort-1",
        trackId: "track-2",
        role: "STUDENT",
        firstName: "Ada",
        lastName: "Obi",
        email: "ada@example.com",
      },
    ]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "cohorts"] });
  });

  it("says so when the student was added but the email didn't send", async () => {
    mockBackend(envelope({ outcome: "invited", emailSent: false }));
    const { user } = await openSingleForm();

    await fillDetails(user);
    await screen.findByDisplayValue("Cohort 4");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Student added")).toBeInTheDocument();
    expect(screen.getByText(/the invitation email failed to send/)).toBeInTheDocument();
  });

  it("explains a duplicate email and stays on the review step", async () => {
    mockBackend(reply(409, { message: "Conflict" }));
    const { user } = await openSingleForm();

    await fillDetails(user);
    await screen.findByDisplayValue("Cohort 4");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone with this email already has an account."
    );
    expect(screen.getByRole("button", { name: "Send Invitation" })).toBeEnabled();
  });

  it("disables sending while the invite is in flight", async () => {
    mockBackend(() => new Promise(() => {}));
    const { user } = await openSingleForm();

    await fillDetails(user);
    await screen.findByDisplayValue("Cohort 4");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("starts over after closing", async () => {
    mockBackend();
    const { user } = await openSingleForm();

    await user.type(screen.getByLabelText(/Email Address/), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Invite students" }));

    expect(screen.getByRole("heading", { name: "Invite Students" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Invite Individually/ }));
    expect(screen.getByLabelText(/Email Address/)).toHaveValue("");
  });

  describe("bulk upload", () => {
    const csv = [
      "First name,Last name,Email",
      "Ada,Obi,ada@example.com",
      "Tunde,Bello,tunde@example.com",
      "No,Email,",
    ].join("\n");

    async function uploadFile(file: File) {
      const view = renderWithClient(<InviteStudentDialog />);
      await view.user.click(screen.getByRole("button", { name: "Invite students" }));
      await view.user.click(screen.getByRole("button", { name: /Upload file/ }));
      const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
      await view.user.upload(input, file);
      return view;
    }

    it("reads the file, skips rows without an email, and invites the selected students", async () => {
      const api = mockApi({
        "GET /admin/cohorts": envelope([cohort]),
        "GET /admin/tracks": envelope(tracks),
        "POST /admin/users/bulk": envelope({
          summary: { total: 1, invited: 1, failed: 0, emailsNotSent: 0 },
          results: [{ index: 0, email: "ada@example.com", outcome: "invited" }],
        }),
      });
      const { user } = await uploadFile(
        new File([csv], "students.csv", { type: "text/csv" })
      );

      expect(await screen.findByText("2 students found")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(screen.getByText(/1 row was skipped/)).toBeInTheDocument();
      await user.click(screen.getByRole("checkbox", { name: "Select Tunde Bello" }));
      expect(screen.getByText("1 selected")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next" }));

      await screen.findByDisplayValue("Cohort 4");
      await user.click(screen.getByRole("button", { name: "Send invitation" }));

      expect(await screen.findByText("Invitations sent!")).toBeInTheDocument();
      expect(api.bodies("POST /admin/users/bulk")).toEqual([
        {
          users: [
            {
              firstName: "Ada",
              lastName: "Obi",
              email: "ada@example.com",
              cohortId: "cohort-1",
              trackId: "track-1",
              role: "STUDENT",
            },
          ],
        },
      ]);
    });

    it("reports the rows the backend couldn't invite", async () => {
      mockApi({
        "GET /admin/cohorts": envelope([cohort]),
        "GET /admin/tracks": envelope(tracks),
        "POST /admin/users/bulk": envelope({
          summary: { total: 2, invited: 1, failed: 1, emailsNotSent: 0 },
          results: [
            { index: 0, email: "ada@example.com", outcome: "invited" },
            { index: 1, email: "tunde@example.com", outcome: "failed", error: "Already exists" },
          ],
        }),
      });
      const { user } = await uploadFile(
        new File([csv], "students.csv", { type: "text/csv" })
      );

      await screen.findByText("2 students found");
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByDisplayValue("Cohort 4");
      await user.click(screen.getByRole("button", { name: "Send invitation" }));

      expect(await screen.findByText("Some invitations sent")).toBeInTheDocument();
      expect(screen.getByText("Already exists")).toBeInTheDocument();
    });

    // The file picker filters by type, but drag & drop doesn't.
    it("refuses a dropped file that isn't a spreadsheet", async () => {
      mockBackend();
      const { user } = renderWithClient(<InviteStudentDialog />);
      await user.click(screen.getByRole("button", { name: "Invite students" }));
      await user.click(screen.getByRole("button", { name: /Upload file/ }));

      fireEvent.drop(screen.getByText("Choose a file or drag & drop it here."), {
        dataTransfer: {
          files: [new File(["hello"], "notes.txt", { type: "text/plain" })],
        },
      });

      expect(
        await screen.findByText("Only CSV or Excel (.xlsx) files are supported")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("refuses a file with no valid emails", async () => {
      mockBackend();
      await uploadFile(
        new File(["First name,Last name,Email\nAda,Obi,"], "students.csv", {
          type: "text/csv",
        })
      );

      expect(
        await screen.findByText("No rows with a valid email address were found.")
      ).toBeInTheDocument();
    });
  });
});
