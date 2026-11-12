import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { Academies } from "@/app/platform-admin/academies/Academies";
import { OnboardingRequests } from "@/app/platform-admin/onboarding-requests/OnboardingRequests";
import { PlatformAdminDashboard } from "@/app/platform-admin/dashboard/PlatformAdminDashboard";
import { UserQuestion } from "@/assets/icons";
import { AppSidebar } from "@/components/AppSidebar";
import { PlatformAdminSidebar } from "@/components/PlatformAdminSidebar";
import { SidebarNavProvider } from "@/components/SidebarNavContext";
import { sessionQuery } from "@/lib/session-query";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/platform-admin/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

/* The top nav brings the session's profile menu along; it doesn't matter here. */
vi.mock("@/components/platform-admin/PlatformTopNav", () => ({
  PlatformTopNav: () => null,
}));

type AdminOverrides = { onboardingStatus?: "INVITED" | "COMPLETED" };

function academy(
  id: string,
  name: string,
  createdAt: string,
  { onboardingStatus = "COMPLETED", status = "ACTIVE" }: AdminOverrides & { status?: string } = {},
) {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/ /g, "-"),
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

const designLab = academy("a1", "Design Lab", "2026-09-01T09:00:00.000Z");
const riseAcademy = academy("a2", "Rise Academy", "2026-10-01T09:00:00.000Z");
const pixelAcademy = academy("a3", "Pixel Academy", "2026-10-05T09:00:00.000Z", {
  onboardingStatus: "INVITED",
});
const closedAcademy = academy("a4", "Closed Academy", "2026-08-01T09:00:00.000Z", {
  status: "SUSPENDED",
});

function academyRoutes(academies: ReturnType<typeof academy>[]) {
  return {
    "GET /platform/organizations": envelope(
      academies.map((item) => ({ ...item, admins: undefined })),
    ),
    ...Object.fromEntries(
      academies.map((item) => [`GET /platform/organizations/${item.id}`, envelope(item)]),
    ),
  };
}

function renderDashboard(routes: Parameters<typeof mockApi>[0]) {
  const api = mockApi(routes);
  const view = renderWithClient(<PlatformAdminDashboard />);
  view.client.setQueryData(sessionQuery().queryKey, {
    user: { firstName: "Juma" },
  } as never);
  return { ...view, api };
}

const metric = (title: string) =>
  screen.getByText(title).parentElement as HTMLElement;

describe("program admin dashboard", () => {
  it("shows the empty state with no figures when there's nothing yet", async () => {
    renderDashboard(academyRoutes([]));

    expect(await screen.findByText("You're Good!")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("--")).toBeInTheDocument();
    expect(within(metric("Pending Request")).getByText("--")).toBeInTheDocument();
    expect(screen.queryByText("Recently created Academies")).not.toBeInTheDocument();
  });

  it("works out the figures from each academy's admins", async () => {
    renderDashboard(academyRoutes([designLab, riseAcademy, pixelAcademy, closedAcademy]));

    await screen.findByRole("cell", { name: "Rise Academy" });
    expect(within(metric("Total Academies")).getByText("4")).toBeInTheDocument();
    /* Suspended academies count towards the total only. */
    expect(within(metric("Active academies")).getByText("2")).toBeInTheDocument();
    expect(within(metric("Awaiting set-up")).getByText("1")).toBeInTheDocument();
  });

  it("lists academies still waiting on their admin, with resending turned off", async () => {
    renderDashboard(academyRoutes([designLab, pixelAcademy]));

    const name = await screen.findByText("Pixel Academy");
    const row = name.closest("li") as HTMLElement;
    expect(within(row).getByText("Approved Oct 5, 2026")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Resend email" })).toBeDisabled();
  });

  it("lists finished academies newest first, with their super admin", async () => {
    renderDashboard(academyRoutes([designLab, riseAcademy, pixelAcademy]));

    const rise = await screen.findByRole("cell", { name: "Rise Academy" });
    const rows = screen
      .getAllByRole("row")
      .map((row) => within(row).queryAllByRole("cell")[0]?.textContent);
    expect(rows.filter(Boolean)).toEqual(["Rise Academy", "Design Lab"]);

    const row = rise.closest("tr") as HTMLElement;
    expect(within(row).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(row).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(row).getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Pixel Academy" })).not.toBeInTheDocument();
  });

  it("keeps the cards, with short messages, when only requests and activity are missing", async () => {
    renderDashboard(academyRoutes([designLab]));

    expect(await screen.findByRole("cell", { name: "Design Lab" })).toBeInTheDocument();
    expect(screen.getByText("No onboarding requests to review.")).toBeInTheDocument();
    expect(screen.getByText("No activity to show yet.")).toBeInTheDocument();
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
  });

  it("offers a retry rather than the empty state when the academies fail to load", async () => {
    const { user, api } = renderDashboard({
      "GET /platform/organizations": reply(500, { success: false, message: "Down" }),
    });

    const retries = await screen.findAllByRole("button", { name: "Try again" });
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
    expect(screen.getAllByText("Couldn't load this figure.")).toHaveLength(3);

    await user.click(retries[0]);
    await vi.waitFor(() =>
      expect(api.urls("GET /platform/organizations")).toHaveLength(2),
    );
  });

  it("asks before suspending an academy, then refreshes it", async () => {
    const suspended = { ...designLab, status: "SUSPENDED" };
    let current = designLab;
    const { user, api } = renderDashboard({
      "GET /platform/organizations": () => envelope([{ ...current, admins: undefined }]),
      "GET /platform/organizations/a1": () => envelope(current),
      "PATCH /platform/organizations/a1": () => {
        current = suspended;
        return envelope(suspended);
      },
    });

    await user.click(await screen.findByRole("button", { name: "Design Lab actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Suspend academy" }));
    expect(api.bodies("PATCH /platform/organizations/a1")).toEqual([]);

    await user.click(await screen.findByRole("button", { name: "Suspend academy" }));

    expect(await screen.findByText("Suspended")).toBeInTheDocument();
    expect(api.bodies("PATCH /platform/organizations/a1")).toEqual([{ status: "SUSPENDED" }]);
  });

  it("shows why suspending failed and keeps the dialog open", async () => {
    const { user } = renderDashboard({
      ...academyRoutes([designLab]),
      "PATCH /platform/organizations/a1": reply(403, { success: false, message: "Not allowed" }),
    });

    await user.click(await screen.findByRole("button", { name: "Design Lab actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Suspend academy" }));
    await user.click(await screen.findByRole("button", { name: "Suspend academy" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Not allowed");
    expect(screen.getByRole("button", { name: "Suspend academy" })).toBeEnabled();
  });
});

describe("onboarding requests page", () => {
  it("shows the empty state, with only awaiting set-up counted", async () => {
    mockApi(academyRoutes([pixelAcademy, designLab]));
    renderWithClient(<OnboardingRequests />);

    expect(screen.getByText("You're Good!")).toBeInTheDocument();
    expect(within(metric("Total Requests")).getByText("--")).toBeInTheDocument();
    expect(within(metric("New Requests")).getByText("--")).toBeInTheDocument();
    expect(await within(metric("Awaiting set-up")).findByText("1")).toBeInTheDocument();
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

describe("academies page", () => {
  function renderAcademies(routes: Parameters<typeof mockApi>[0]) {
    const api = mockApi(routes);
    return { ...renderWithClient(<Academies />), api };
  }

  const rowFor = async (name: string) =>
    (await screen.findByRole("button", { name })).closest("tr") as HTMLElement;

  it("shows the empty state until an academy finishes its setup", async () => {
    renderAcademies(academyRoutes([pixelAcademy]));

    expect(await screen.findByText("Nothing to see here yet!")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("--")).toBeInTheDocument();
    expect(screen.queryByText("All academies")).not.toBeInTheDocument();
  });

  it("lists academies that finished setup, with their totals", async () => {
    renderAcademies(academyRoutes([designLab, riseAcademy, pixelAcademy, closedAcademy]));

    const row = await rowFor("Rise Academy");
    expect(within(row).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(row).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(within(await rowFor("Closed Academy")).getByText("Suspended")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pixel Academy" })).not.toBeInTheDocument();

    expect(screen.getByText("3 Academies")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("3")).toBeInTheDocument();
    expect(within(metric("Active Academies")).getByText("2")).toBeInTheDocument();
    expect(within(metric("Suspended Academies")).getByText("1")).toBeInTheDocument();
  });

  it("searches by academy name or admin email", async () => {
    const { user } = renderAcademies(academyRoutes([designLab, riseAcademy]));
    const search = await screen.findByPlaceholderText("Search by name or email");
    await rowFor("Rise Academy");

    await user.type(search, "a1@example");
    expect(screen.getByRole("button", { name: "Design Lab" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rise Academy" })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "nowhere");
    expect(screen.getByText("No academies match your search.")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const { user } = renderAcademies(academyRoutes([designLab, closedAcademy]));
    await rowFor("Design Lab");

    await user.click(screen.getByRole("button", { name: "Filter" }));
    await user.click(await screen.findByRole("checkbox", { name: "Suspended" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(await screen.findByRole("button", { name: "Closed Academy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Design Lab" })).not.toBeInTheDocument();
  });

  it("pages through more academies than fit on one page", async () => {
    const many = Array.from({ length: 12 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return academy(`m${index}`, `Academy ${day}`, `2026-09-${day}T09:00:00.000Z`);
    });
    const { user } = renderAcademies(academyRoutes(many));

    await rowFor("Academy 12");
    expect(screen.queryByRole("button", { name: "Academy 02" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(await screen.findByRole("button", { name: "Academy 02" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Academy 12" })).not.toBeInTheDocument();
  });

  it("opens an academy's details, with what the API lacks shown as --", async () => {
    const { user } = renderAcademies(academyRoutes([riseAcademy]));

    await user.click(await screen.findByRole("button", { name: "Rise Academy" }));

    const panel = await screen.findByRole("dialog", { name: "Academy details" });
    expect(within(panel).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(panel).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(panel).getByText("Date created").nextSibling).toHaveTextContent("Oct 1, 2026");
    expect(within(panel).getByText("Website").nextSibling).toHaveTextContent("--");
    expect(within(panel).getByRole("button", { name: "Suspend academy" })).toBeInTheDocument();
  });

  it("suspends from the details panel and shows the new status there", async () => {
    let current = riseAcademy;
    const { user, api } = renderAcademies({
      "GET /platform/organizations": () => envelope([{ ...current, admins: undefined }]),
      "GET /platform/organizations/a2": () => envelope(current),
      "PATCH /platform/organizations/a2": () => {
        current = { ...riseAcademy, status: "SUSPENDED" };
        return envelope(current);
      },
    });

    await user.click(await screen.findByRole("button", { name: "Rise Academy" }));
    const panel = await screen.findByRole("dialog", { name: "Academy details" });
    await user.click(within(panel).getByRole("button", { name: "Suspend academy" }));

    const confirm = await screen.findByRole("dialog", { name: "Suspend this academy?" });
    expect(confirm).toHaveTextContent("Suspending Rise Academy will restrict access");
    await user.click(within(confirm).getByRole("button", { name: "Suspend academy" }));

    expect(
      await within(panel).findByRole("button", { name: "Reactivate academy" }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Suspended")).toBeInTheDocument();
    expect(api.bodies("PATCH /platform/organizations/a2")).toEqual([{ status: "SUSPENDED" }]);
  });

  it("offers a retry when the academies fail to load", async () => {
    renderAcademies({
      "GET /platform/organizations": reply(500, { success: false, message: "Down" }),
    });

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("Nothing to see here yet!")).not.toBeInTheDocument();
  });
});
