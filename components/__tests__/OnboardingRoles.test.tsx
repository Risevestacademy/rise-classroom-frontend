import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import OnboardingInvitePage from "@/app/onboarding/page";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { onboardingCopy } from "@/lib/onboarding";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("token=abc"),
}));

function renderInvite(role: string) {
  mockApi({
    "POST /onboarding/details": envelope({
      firstName: "Tobi",
      lastName: "Adeyemi",
      email: "tobi@example.com",
      role,
      memberships: [],
    }),
  });
  return renderWithClient(
    <OnboardingProvider>
      <OnboardingInvitePage />
    </OnboardingProvider>,
  );
}

describe("onboarding invite page", () => {
  it("opens for a new academy's super admin", async () => {
    renderInvite("SUPERADMIN");

    expect(
      await screen.findByRole("heading", {
        name: "Hi Tobi, you've been invited to Rise Classroom as an academy admin",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Continue").closest("a")).toHaveAttribute(
      "href",
      "/onboarding/create-account?token=abc",
    );
  });

  it("still opens for the other roles", async () => {
    renderInvite("STUDENT");

    expect(
      await screen.findByRole("heading", {
        name: "Hi Tobi, you've been invited to Rise Classroom",
      }),
    ).toBeInTheDocument();
  });

  it("explains itself instead of crashing on a role it doesn't know", async () => {
    renderInvite("PLATFORM_ADMIN");

    expect(
      await screen.findByRole("heading", { name: "We can't open this invitation" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/can't be set up here/)).toBeInTheDocument();
  });

  it("doesn't tell a super admin to wait for a program admin", () => {
    expect(onboardingCopy.SUPERADMIN.unassignedMessage).not.toMatch(/program admin/i);
    expect(onboardingCopy.STUDENT.unassignedMessage).toMatch(/program admin/i);
  });
});
