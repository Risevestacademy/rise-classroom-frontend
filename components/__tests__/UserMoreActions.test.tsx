import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { UserMoreActions } from "@/components/student-profile/UserMoreAction";
import { makeUser } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

describe("UserMoreActions", () => {
  it("lets a super admin edit a student's name and email", async () => {
    const api = mockApi({
      "GET /auth/get-session": { user: { id: "admin-1", role: "SUPERADMIN" }, session: {} },
      "PATCH /admin/users/user-1": (body: object) =>
        envelope({ user: makeUser(body), emailSent: true }),
    });
    const { user } = renderWithClient(<UserMoreActions user={makeUser()} />);

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const edit = await screen.findByRole("menuitem", { name: "Edit user" });
    await vi.waitFor(() => expect(edit).not.toHaveAttribute("aria-disabled", "true"));
    await user.click(edit);

    const email = await screen.findByLabelText(/Email/);
    await user.clear(email);
    await user.type(email, "new@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("We sent a notice to new@example.com.")).toBeInTheDocument();
    expect(api.bodies("PATCH /admin/users/user-1")).toEqual([{ email: "new@example.com" }]);
  });

  it("only lets super admins edit", async () => {
    mockApi({ "GET /auth/get-session": { user: { id: "x", role: "INSTRUCTOR" }, session: {} } });
    const { user } = renderWithClient(<UserMoreActions user={makeUser()} />);

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const edit = await screen.findByRole("menuitem", { name: "Edit user" });
    await vi.waitFor(() => expect(edit).toHaveAttribute("title", "Only super admins can do this"));
  });
});
