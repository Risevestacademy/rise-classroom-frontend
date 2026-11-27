import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { InvitePeople } from "@/components/live-room/InvitePeople";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const users = envelope({
  items: [
    { id: "u-1", name: "Ada Obi", email: "ada@example.com", role: "INSTRUCTOR" },
    { id: "u-2", name: "Tola Ade", email: "tola@example.com", role: "STUDENT" },
  ],
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
});

describe("InvitePeople", () => {
  it("leaves out people already in the call and invites the ones picked", async () => {
    mockApi({ "GET /admin/users": users });
    const onInvite = vi.fn(async () => {});
    const { user } = renderWithClient(
      <InvitePeople inRoom={new Set(["u-1"])} onInvite={onInvite} onBack={() => {}} />,
    );

    const tola = await screen.findByRole("checkbox", { name: /Tola Ade/ });
    expect(screen.queryByText("Ada Obi")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite people" })).toBeDisabled();

    await user.click(tola);
    await user.click(screen.getByRole("button", { name: "Invite Tola Ade" }));

    expect(onInvite).toHaveBeenCalledWith([{ id: "u-2", name: "Tola Ade", email: "tola@example.com" }]);
  });
});
