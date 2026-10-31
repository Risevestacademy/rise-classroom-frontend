import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { UserRowActions } from "@/components/UserRowActions";
import type { AdminUser } from "@/lib/admin";
import { makeUser } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const admin = { id: "admin-1", role: "SUPERADMIN" };

function mockBackend(routes: Record<string, unknown> = {}, sessionUser: object = admin) {
  return mockApi({
    "GET /auth/get-session": { user: sessionUser, session: {} },
    ...routes,
  });
}

async function openMenu(user: AdminUser = makeUser()) {
  const view = renderWithClient(<UserRowActions user={user} />);
  await view.user.click(screen.getByRole("button", { name: "Row actions" }));
  return view;
}

async function openEditor(user: AdminUser = makeUser()) {
  const view = await openMenu(user);
  const edit = await screen.findByRole("menuitem", { name: "Edit user" });
  await vi.waitFor(() => expect(edit).not.toHaveAttribute("aria-disabled", "true"));
  await view.user.click(edit);
  await screen.findByRole("heading", { name: "Edit user" });
  return view;
}

describe("UserRowActions", () => {
  it("only lets super admins edit or resend", async () => {
    mockBackend({}, { id: "x", role: "INSTRUCTOR" });
    await openMenu(makeUser({ onboardingStatus: "INVITED" }));

    const edit = await screen.findByRole("menuitem", { name: "Edit user" });
    await vi.waitFor(() => expect(edit).toHaveAttribute("title", "Only super admins can do this"));
    expect(edit).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Resend invite" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("can't resend to someone who has finished onboarding", async () => {
    mockBackend();
    await openMenu(makeUser({ onboardingStatus: "COMPLETED" }));

    const resend = await screen.findByRole("menuitem", { name: "Resend invite" });
    await vi.waitFor(() =>
      expect(resend).toHaveAttribute("title", "This person has already finished onboarding")
    );
    expect(resend).toHaveAttribute("aria-disabled", "true");
  });

  it("resends an invite and confirms it", async () => {
    const api = mockBackend({ "POST /admin/users/user-1/resend-invite": envelope({}) });
    const { user } = await openMenu(makeUser({ onboardingStatus: "INVITED" }));

    const resend = await screen.findByRole("menuitem", { name: "Resend invite" });
    await vi.waitFor(() => expect(resend).not.toHaveAttribute("aria-disabled", "true"));
    await user.click(resend);

    expect(await screen.findByRole("menuitem", { name: "Invite resent" })).toBeInTheDocument();
    expect(api.bodies("POST /admin/users/user-1/resend-invite")).toHaveLength(1);
  });

  it("says when the invite email couldn't be sent", async () => {
    mockBackend({ "POST /admin/users/user-1/resend-invite": reply(502) });
    const { user } = await openMenu(makeUser({ onboardingStatus: "INVITED" }));

    const resend = await screen.findByRole("menuitem", { name: "Resend invite" });
    await vi.waitFor(() => expect(resend).not.toHaveAttribute("aria-disabled", "true"));
    await user.click(resend);

    expect(
      await screen.findByRole("menuitem", { name: "We couldn't send the email. Please try again." })
    ).toBeInTheDocument();
  });

  describe("edit user", () => {
    it("only saves once something changed, and sends just the changes", async () => {
      const api = mockBackend({
        "PATCH /admin/users/user-1": envelope({
          user: makeUser({ lastName: "Okafor" }),
          emailSent: false,
        }),
      });
      const { user, invalidate } = await openEditor();
      const save = screen.getByRole("button", { name: "Save changes" });

      expect(save).toBeDisabled();

      await user.clear(screen.getByLabelText(/Last name/));
      await user.type(screen.getByLabelText(/Last name/), " Okafor ");
      await user.click(save);

      expect(await screen.findByText("Changes saved")).toBeInTheDocument();
      expect(screen.getByText("Your changes are live.")).toBeInTheDocument();
      expect(api.bodies("PATCH /admin/users/user-1")).toEqual([{ lastName: "Okafor" }]);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "users"] });
    });

    it("needs both names", async () => {
      mockBackend();
      const { user } = await openEditor();

      await user.clear(screen.getByLabelText(/First name/));

      expect(screen.getByText("First name is required.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    it("checks a new email address", async () => {
      mockBackend();
      const { user } = await openEditor();

      await user.clear(screen.getByLabelText(/Email/));
      await user.type(screen.getByLabelText(/Email/), "not-an-email");

      expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    it("tells the admin an invited user gets a fresh link at their new address", async () => {
      mockBackend({
        "PATCH /admin/users/user-1": envelope({
          user: makeUser({ email: "new@example.com" }),
          emailSent: true,
        }),
      });
      const { user } = await openEditor(makeUser({ onboardingStatus: "INVITED" }));

      await user.clear(screen.getByLabelText(/Email/));
      await user.type(screen.getByLabelText(/Email/), "new@example.com");
      expect(
        screen.getByText("They'll get a fresh onboarding link at this address.")
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        await screen.findByText("We sent a fresh onboarding link to new@example.com.")
      ).toBeInTheDocument();
    });

    it("suspends a user", async () => {
      const api = mockBackend({
        "PATCH /admin/users/user-1": envelope({ user: makeUser({ status: "SUSPENDED" }) }),
      });
      const { user } = await openEditor();

      await user.click(screen.getByLabelText("Status"));
      await user.click(await screen.findByRole("option", { name: "Suspended" }));
      expect(screen.getByText("Suspending signs them out everywhere.")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await screen.findByText("Changes saved");
      expect(api.bodies("PATCH /admin/users/user-1")).toEqual([{ status: "SUSPENDED" }]);
    });

    it("won't let admins suspend themselves", async () => {
      mockBackend({}, { id: "user-1", role: "SUPERADMIN" });
      const { user } = await openEditor(makeUser({ role: "SUPERADMIN" }));

      expect(screen.getByText("You can't suspend your own account.")).toBeInTheDocument();
      await user.click(screen.getByLabelText("Status"));
      expect(await screen.findByRole("option", { name: "Suspended" })).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });

    it("explains an email that's already taken", async () => {
      mockBackend({ "PATCH /admin/users/user-1": reply(409, { message: "Conflict" }) });
      const { user } = await openEditor();

      await user.clear(screen.getByLabelText(/Email/));
      await user.type(screen.getByLabelText(/Email/), "taken@example.com");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        await screen.findByText("Another account already uses this email address.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });
  });
});
