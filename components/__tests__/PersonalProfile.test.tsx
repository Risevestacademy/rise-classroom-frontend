import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { PersonalProfile } from "@/components/profile/PersonalProfile";
import { SettingsProvider } from "@/components/settings/SettingsContext";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const me = {
  id: "admin-1",
  firstName: "Ada",
  lastName: "Obi",
  displayName: null,
  phoneNumber: null,
  location: null,
  description: null,
  email: "ada@example.com",
  image: null,
  role: "SUPERADMIN",
  status: "ACTIVE",
  onboardedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  organization: null,
  memberships: [],
};

function mockBackend(routes: Record<string, unknown> = {}, role = "SUPERADMIN") {
  return mockApi({
    "GET /auth/get-session": { user: { id: me.id, role }, session: {} },
    "GET /me": envelope({ ...me, role }),
    ...routes,
  });
}

async function openEditor() {
  const view = renderWithClient(
    <SettingsProvider>
      <PersonalProfile />
    </SettingsProvider>,
  );
  await view.user.click(
    await screen.findByRole("button", { name: "Edit personal profile" }),
  );
  return view;
}

describe("PersonalProfile", () => {
  it("lets a super admin change their name and email", async () => {
    const api = mockBackend({
      "PATCH /admin/users/admin-1": envelope({ user: {}, emailSent: true }),
    });
    const { user } = await openEditor();

    const firstName = await screen.findByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "Adaeze");
    const email = screen.getByLabelText("Email address");
    await user.clear(email);
    await user.type(email, "adaeze@example.com");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.bodies("PATCH /admin/users/admin-1")).toEqual([
      { firstName: "Adaeze", email: "adaeze@example.com" },
    ]);
    expect(api.bodies("PATCH /me")).toHaveLength(0);
  });

  it("explains when the email is taken", async () => {
    mockBackend({ "PATCH /admin/users/admin-1": reply(409, { message: "taken" }) });
    const { user } = await openEditor();

    const email = await screen.findByLabelText("Email address");
    await user.clear(email);
    await user.type(email, "taken@example.com");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(
      await screen.findByText("Another account already uses this email address."),
    ).toBeInTheDocument();
  });

  it("keeps the name locked for other roles", async () => {
    mockBackend({}, "MENTOR");
    await openEditor();

    expect(await screen.findByLabelText("Full name")).toHaveAttribute("readonly");
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });
});
