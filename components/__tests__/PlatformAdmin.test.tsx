import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { OnboardingRequests } from "@/app/platform-admin/onboarding-requests/OnboardingRequests";
import { PlatformAdminDashboard } from "@/app/platform-admin/dashboard/PlatformAdminDashboard";
import { UserQuestion } from "@/assets/icons";
import { AppSidebar } from "@/components/AppSidebar";
import { PlatformAdminSidebar } from "@/components/PlatformAdminSidebar";
import { SidebarNavProvider } from "@/components/SidebarNavContext";
import { mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/platform-admin/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

/* The top nav brings the session's profile menu along; it doesn't matter here. */
vi.mock("@/components/platform-admin/PlatformTopNav", () => ({
  PlatformTopNav: () => null,
}));

/* These screens only have development samples for now, so each test picks its own. */
const sample = vi.hoisted(() => ({
  academies: [] as unknown[],
  requests: [] as unknown[],
  activity: [] as unknown[],
}));
vi.mock("@/lib/platform-sample-data", () => ({
  get platformAcademies() {
    return sample.academies;
  },
  get onboardingRequests() {
    return sample.requests;
  },
  get platformActivity() {
    return sample.activity;
  },
}));

beforeEach(() => {
  sample.academies = [];
  sample.requests = [];
  sample.activity = [];
});

function academy(
  id: string,
  name: string,
  createdAt: string,
  {
    onboardingStatus = "COMPLETED",
    status = "ACTIVE",
  }: { onboardingStatus?: "INVITED" | "COMPLETED"; status?: string } = {},
) {
  return {
    id,
    name,
    slug: id,
    status,
    createdAt,
    updatedAt: createdAt,
    counts: { users: 1, cohorts: 0, tracks: 0 },
    admins: [
      {
        id: `admin-${id}`,
        email: `${id}@example.com`,
        firstName: "Tobi",
        lastName: name,
        status: "ACTIVE",
        onboardingStatus,
      },
    ],
  };
}

const riseAcademy = academy("a2", "Rise Academy", "2026-10-01T09:00:00.000Z");
const designLab = academy("a1", "Design Lab", "2026-09-01T09:00:00.000Z");
const pixelAcademy = academy("a3", "Pixel Academy", "2026-10-05T09:00:00.000Z", {
  onboardingStatus: "INVITED",
});
const closedAcademy = academy("a4", "Closed Academy", "2026-08-01T09:00:00.000Z", {
  status: "SUSPENDED",
});

function renderDashboard() {
  const api = mockApi({});
  const view = renderWithClient(<PlatformAdminDashboard />);
  return { ...view, api };
}

const metric = (title: string) =>
  screen.getByText(title).parentElement as HTMLElement;

describe("program admin dashboard", () => {
  it("shows the empty state with no figures when there's nothing yet", () => {
    renderDashboard();

    expect(screen.getByText("You're Good!")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("--")).toBeInTheDocument();
    expect(within(metric("Pending Request")).getByText("--")).toBeInTheDocument();
    expect(screen.queryByText("Recently created Academies")).not.toBeInTheDocument();
  });

  it("works out the figures from each academy's admins", () => {
    sample.academies = [riseAcademy, designLab, pixelAcademy, closedAcademy];
    renderDashboard();

    expect(within(metric("Total Academies")).getByText("4")).toBeInTheDocument();
    /* Suspended academies count towards the total only. */
    expect(within(metric("Active academies")).getByText("2")).toBeInTheDocument();
    expect(within(metric("Awaiting set-up")).getByText("1")).toBeInTheDocument();
  });

  it("lists academies still waiting on their admin, with resending turned off", () => {
    sample.academies = [pixelAcademy, designLab];
    renderDashboard();

    const row = screen.getByText("Pixel Academy").closest("li") as HTMLElement;
    expect(within(row).getByText("Approved Oct 5, 2026")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Resend email" })).toBeDisabled();
  });

  it("lists finished academies with their super admin, and actions turned off", () => {
    sample.academies = [pixelAcademy, riseAcademy, designLab];
    renderDashboard();

    const row = screen.getByRole("cell", { name: "Rise Academy" }).closest("tr") as HTMLElement;
    expect(within(row).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(row).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(row).getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Rise Academy actions" })).toBeDisabled();
    expect(screen.queryByRole("cell", { name: "Pixel Academy" })).not.toBeInTheDocument();
  });

  it("keeps the cards, with short messages, when only requests and activity are missing", () => {
    sample.academies = [designLab];
    renderDashboard();

    expect(screen.getByRole("cell", { name: "Design Lab" })).toBeInTheDocument();
    expect(screen.getByText("No onboarding requests to review.")).toBeInTheDocument();
    expect(screen.getByText("No activity to show yet.")).toBeInTheDocument();
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
  });

  it("shows requests and activity once there are some", () => {
    sample.requests = [
      { id: "1", academy: "Dogg Inc", submittedAt: "2026-10-27T09:00:00.000Z", status: "NEW" },
      { id: "2", academy: "Codehub", submittedAt: "2026-10-21T09:00:00.000Z", status: "PENDING" },
    ];
    sample.activity = [
      { items: [{ time: "10:24 AM", title: "New application received", detail: "Dogg Inc" }] },
    ];
    renderDashboard();

    const row = screen.getByRole("cell", { name: "Dogg Inc" }).closest("tr") as HTMLElement;
    expect(within(row).getByText("New")).toBeInTheDocument();
    expect(within(row).getByText("Oct 27, 2026")).toBeInTheDocument();
    expect(within(metric("Pending Request")).getByText("2")).toBeInTheDocument();
    expect(screen.getByText("New application received")).toBeInTheDocument();
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
  });

  it("makes no academy requests", () => {
    const { api } = renderDashboard();

    expect(api.urls("GET /platform/organizations")).toEqual([]);
  });
});

describe("onboarding requests page", () => {
  it("shows the empty state", () => {
    mockApi({});
    renderWithClient(<OnboardingRequests />);

    expect(screen.getByText("You're Good!")).toBeInTheDocument();
    expect(within(metric("Total Requests")).getByText("--")).toBeInTheDocument();
    expect(within(metric("New Requests")).getByText("--")).toBeInTheDocument();
    expect(within(metric("Awaiting set-up")).getByText("--")).toBeInTheDocument();
  });

  it("lists requests instead once there are some", () => {
    sample.academies = [pixelAcademy];
    sample.requests = [
      { id: "1", academy: "Dogg Inc", submittedAt: "2026-10-27T09:00:00.000Z", status: "NEW" },
    ];
    mockApi({});
    renderWithClient(<OnboardingRequests />);

    expect(screen.getByRole("cell", { name: "Dogg Inc" })).toBeInTheDocument();
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
    expect(within(metric("New Requests")).getByText("1")).toBeInTheDocument();
    expect(within(metric("Awaiting set-up")).getByText("1")).toBeInTheDocument();
  });
});

describe("program admin sidebar", () => {
  function renderSidebar() {
    mockApi({});
    return renderWithClient(
      <SidebarNavProvider>
        <PlatformAdminSidebar />
      </SidebarNavProvider>,
    );
  }

  it("links to every page in the design", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/platform-admin/dashboard",
    );
    expect(screen.getByRole("link", { name: "Onboarding Requests" })).toHaveAttribute(
      "href",
      "/platform-admin/onboarding-requests",
    );
    expect(screen.getByRole("link", { name: "Academies" })).toHaveAttribute(
      "href",
      "/platform-admin/academies",
    );
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute(
      "href",
      "/platform-admin/feedback",
    );
  });

  it("has no count on Onboarding Requests when there's nothing new", () => {
    renderSidebar();

    expect(screen.queryByLabelText(/new$/)).not.toBeInTheDocument();
  });

  it("shows a red count on an item that has one, and hides the user menu when asked", () => {
    mockApi({});
    renderWithClient(
      <SidebarNavProvider>
        <AppSidebar
          homeHref="/platform-admin/dashboard"
          showUserMenu={false}
          sections={[
            {
              label: "Overview",
              items: [
                {
                  title: "Onboarding Requests",
                  href: "/platform-admin/onboarding-requests",
                  icon: UserQuestion,
                  badge: 2,
                },
              ],
            },
          ]}
        />
      </SidebarNavProvider>,
    );

    expect(screen.getByLabelText("2 new")).toHaveTextContent("2");
    expect(screen.queryByText("Not signed in")).not.toBeInTheDocument();
  });
});
