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

const applicationsRoute = "GET /platform/organization-applications";
const organizationsRoute = "GET /platform/organizations";

/* An application as the API lists it, still waiting to be reviewed. */
function application(id: string, academyName: string, createdAt: string) {
  return {
    id: `app-${id}`,
    fullName: `Tobi ${academyName}`,
    email: `${id}@example.com`,
    academyName,
    website: null as string | null,
    learningSpaceType: "BOOTCAMP",
    estimatedLearners: "FROM_51_TO_200",
    status: "NEW",
    reviewedAt: null as string | null,
    createdAt,
    updatedAt: createdAt,
    organization: null as null | {
      id: string;
      name: string;
      slug: string;
      admin: Record<string, unknown>;
    },
    /* Not part of the application: its organisation's status, which the
       organisations list reports. */
    organizationStatus: "ACTIVE",
  };
}

type Application = ReturnType<typeof application>;

/* An approved application, which is what makes an academy. */
function academy(
  id: string,
  name: string,
  createdAt: string,
  {
    onboardingStatus = "COMPLETED",
    status = "ACTIVE",
  }: { onboardingStatus?: "INVITED" | "COMPLETED"; status?: string } = {},
): Application {
  return {
    ...application(id, name, createdAt),
    status: "APPROVED",
    reviewedAt: createdAt,
    organization: {
      id,
      name,
      slug: name.toLowerCase().replace(/ /g, "-"),
      admin: {
        id: `admin-${id}`,
        name: `Tobi ${name}`,
        email: `${id}@example.com`,
        onboardingStatus,
        onboardedAt: null,
        lastActiveAt: null,
      },
    },
    organizationStatus: status,
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
const newRequest = application("r1", "Bright Future", "2026-10-10T09:00:00.000Z");

const page = <T,>(items: T[]) => ({
  items,
  page: 1,
  limit: 50,
  total: items.length,
  totalPages: 1,
});

/* The organisation an approved application made, as the organisations list
   returns it. */
function organizationOf(item: Application) {
  return {
    ...item.organization,
    status: item.organizationStatus,
    createdAt: item.reviewedAt,
    updatedAt: item.reviewedAt,
    counts: { users: 1, cohorts: 0, tracks: 0 },
  };
}

/* The applications list, filtered by its `status` query like the API's, and
   the organisations the approved ones made. Pass a function to read the latest
   state. */
function academyRoutes(items: Application[] | (() => Application[])) {
  const read = typeof items === "function" ? items : () => items;
  return {
    [organizationsRoute]: () =>
      envelope({
        ...page(read().filter((item) => item.organization).map(organizationOf)),
        summary: { total: 0, active: 0, suspended: 0 },
      }),
    [applicationsRoute]: (_body: unknown, url: URL) => {
      const status = url.searchParams.get("status");
      return envelope(
        page(read().filter((item) => !status || item.status === status)),
      );
    },
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

/* Titles are paragraphs; "Awaiting set-up" is also a status badge's text. */
const metric = (title: string) =>
  screen.getByText(title, { selector: "p" }).parentElement as HTMLElement;

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

  it("lists academies still waiting on their admin", async () => {
    renderDashboard(academyRoutes([designLab, pixelAcademy]));

    const name = await screen.findByText("Pixel Academy");
    const row = name.closest("li") as HTMLElement;
    expect(within(row).getByText("Approved Oct 5, 2026")).toBeInTheDocument();
    /* expect(within(row).getByRole("button", { name: "Resend email" })).toBeDisabled(); */
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

  it("counts and previews the requests still waiting on a decision", async () => {
    renderDashboard(academyRoutes([designLab, newRequest]));

    const name = await screen.findByText("Bright Future");
    const row = name.closest("li") as HTMLElement;
    expect(row).toHaveTextContent("Tobi Bright Future · Applied Oct 10, 2026");
    expect(within(row).getByText("New")).toBeInTheDocument();
    expect(within(metric("Pending Request")).getByText("1")).toBeInTheDocument();
    /* An application isn't an academy until it's approved. */
    expect(within(metric("Total Academies")).getByText("1")).toBeInTheDocument();
  });

  it("still lists academies when their applications can't be read", async () => {
    renderDashboard({
      ...academyRoutes([designLab]),
      [applicationsRoute]: reply(500, { success: false, message: "Down" }),
    });

    expect(await screen.findByRole("cell", { name: "Design Lab" })).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("1")).toBeInTheDocument();
  });

  it("keeps the cards, with short messages, when only requests and activity are missing", async () => {
    renderDashboard(academyRoutes([designLab]));

    expect(await screen.findByRole("cell", { name: "Design Lab" })).toBeInTheDocument();
    expect(screen.getByText("No onboarding requests to review.")).toBeInTheDocument();
    /* expect(screen.getByText("No activity to show yet.")).toBeInTheDocument(); */
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
  });

  it("offers a retry rather than the empty state when the academies fail to load", async () => {
    const { user, api } = renderDashboard({
      [applicationsRoute]: reply(500, { success: false, message: "Down" }),
      [organizationsRoute]: reply(500, { success: false, message: "Down" }),
    });

    const retries = await screen.findAllByRole("button", { name: "Try again" });
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
    expect(screen.getAllByText("Couldn't load this figure.")).toHaveLength(4);

    /* The academies and the requests each asked once; one retry asks again. */
    await user.click(retries[0]);
    await vi.waitFor(() => expect(api.urls(applicationsRoute)).toHaveLength(3));
  });

  it("asks before suspending an academy, then refreshes it", async () => {
    let current = designLab;
    const { user, api } = renderDashboard({
      ...academyRoutes(() => [current]),
      "PATCH /platform/organizations/a1": () => {
        current = { ...designLab, organizationStatus: "SUSPENDED" };
        return envelope({ status: "SUSPENDED" });
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
  function renderRequests(routes: Parameters<typeof mockApi>[0]) {
    const api = mockApi(routes);
    return { ...renderWithClient(<OnboardingRequests />), api };
  }

  const requestRow = async (name: string) =>
    (await screen.findByRole("button", { name })).closest("tr") as HTMLElement;

  it("shows the empty state when no one has applied", async () => {
    renderRequests(academyRoutes([]));

    expect(await screen.findByText("You're Good!")).toBeInTheDocument();
    expect(within(metric("Total Requests")).getByText("--")).toBeInTheDocument();
    expect(within(metric("New Requests")).getByText("--")).toBeInTheDocument();
  });

  it("lists every application with its status and the totals", async () => {
    renderRequests(academyRoutes([newRequest, pixelAcademy, designLab]));

    const row = await requestRow("Bright Future");
    expect(within(row).getByText("Tobi Bright Future")).toBeInTheDocument();
    expect(within(row).getByText("r1@example.com")).toBeInTheDocument();
    expect(within(row).getByText("New")).toBeInTheDocument();
    expect(within(row).getByText("Oct 10, 2026")).toBeInTheDocument();
    expect(within(await requestRow("Design Lab")).getByText("Approved")).toBeInTheDocument();
    /* Approved, but its super admin hasn't finished setting up. */
    expect(
      within(await requestRow("Pixel Academy")).getByText("Awaiting set-up"),
    ).toBeInTheDocument();

    expect(within(metric("Total Requests")).getByText("3")).toBeInTheDocument();
    expect(within(metric("New Requests")).getByText("1")).toBeInTheDocument();
    expect(await within(metric("Awaiting set-up")).findByText("1")).toBeInTheDocument();
  });

  it("filters the applications by status with the tabs", async () => {
    const { user } = renderRequests(academyRoutes([newRequest, designLab]));
    await requestRow("Bright Future");
    expect(screen.getByText("2 requests")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All requests" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "New" }));
    expect(screen.getByRole("button", { name: "Bright Future" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Design Lab" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Approved" }));
    expect(screen.queryByRole("button", { name: "Bright Future" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Design Lab" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Declined" }));
    expect(screen.getByText("No requests with this status.")).toBeInTheDocument();
  });

  it("only offers a decision on applications still in review", async () => {
    const { user } = renderRequests(academyRoutes([newRequest, designLab]));

    await user.click(await screen.findByRole("button", { name: "Design Lab actions" }));
    expect(await screen.findByRole("menuitem", { name: "View details" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("asks before approving, then shows the application as approved", async () => {
    let current: Application[] = [newRequest];
    const { user, api } = renderRequests({
      ...academyRoutes(() => current),
      "POST /platform/organization-applications/app-r1/approve": () => {
        current = [{ ...newRequest, status: "APPROVED" }];
        return envelope({ application: current[0] });
      },
    });

    await user.click(await screen.findByRole("button", { name: "Bright Future actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Approve" }));
    const confirm = await screen.findByRole("dialog", { name: "Approve this application?" });
    expect(confirm).toHaveTextContent("emails Tobi Bright Future a link");
    expect(api.bodies("POST /platform/organization-applications/app-r1/approve")).toEqual([]);

    await user.click(within(confirm).getByRole("button", { name: "Approve application" }));

    expect(await within(await requestRow("Bright Future")).findByText("Approved")).toBeInTheDocument();
    expect(api.bodies("POST /platform/organization-applications/app-r1/approve")).toEqual([{}]);
  });

  it("asks a new applicant a question, then waits on their answer", async () => {
    let current: Application[] = [newRequest];
    const { user, api } = renderRequests({
      ...academyRoutes(() => current),
      "POST /platform/organization-applications/app-r1/request-info": () => {
        current = [{ ...newRequest, status: "INFO_REQUESTED" }];
        return envelope({ application: current[0], emailSent: true });
      },
    });

    await user.click(await screen.findByRole("button", { name: "Bright Future actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Request more info" }));
    const confirm = await screen.findByRole("dialog", { name: "Ask for more information?" });
    const send = within(confirm).getByRole("button", { name: "Send question" });
    expect(send).toBeDisabled();

    await user.type(within(confirm).getByLabelText("Your question"), "Which courses will you run?");
    await user.click(send);

    expect(
      await within(await requestRow("Bright Future")).findByText("Pending"),
    ).toBeInTheDocument();
    expect(api.bodies("POST /platform/organization-applications/app-r1/request-info")).toEqual([
      { message: "Which courses will you run?" },
    ]);

    /* One question at a time, but a decision can still be made. */
    await user.click(screen.getByRole("button", { name: "Bright Future actions" }));
    expect(await screen.findByRole("menuitem", { name: "Approve" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Request more info" })).not.toBeInTheDocument();
  });

  it("needs a reason to decline, and sends it", async () => {
    let current: Application[] = [newRequest];
    const { user, api } = renderRequests({
      ...academyRoutes(() => current),
      "POST /platform/organization-applications/app-r1/decline": () => {
        current = [{ ...newRequest, status: "DECLINED" }];
        return envelope(current[0]);
      },
    });

    await user.click(await screen.findByRole("button", { name: "Bright Future actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Decline" }));
    const confirm = await screen.findByRole("dialog", { name: "Decline this application?" });
    const decline = within(confirm).getByRole("button", { name: "Decline application" });
    expect(decline).toBeDisabled();

    await user.type(within(confirm).getByLabelText("Reason for declining"), "No active cohort yet");
    await user.click(decline);

    expect(await within(await requestRow("Bright Future")).findByText("Declined")).toBeInTheDocument();
    expect(api.bodies("POST /platform/organization-applications/app-r1/decline")).toEqual([
      { reason: "No active cohort yet" },
    ]);
  });

  it("shows why a decision failed and keeps the dialog open", async () => {
    const { user } = renderRequests({
      ...academyRoutes([newRequest]),
      "POST /platform/organization-applications/app-r1/approve": reply(409, {
        success: false,
        message: "A user with this email already exists",
      }),
    });

    await user.click(await screen.findByRole("button", { name: "Bright Future actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Approve" }));
    await user.click(await screen.findByRole("button", { name: "Approve application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A user with this email already exists");
  });

  it("opens an application's details with its history, and decides from there", async () => {
    const { user } = renderRequests({
      ...academyRoutes([{ ...newRequest, website: "https://brightfuture.academy" }]),
      "GET /platform/organization-applications/app-r1": envelope({
        ...newRequest,
        reviewedBy: null,
        events: [
          {
            id: "e1",
            type: "SUBMITTED",
            message: null,
            createdAt: "2026-10-10T09:00:00.000Z",
            actor: null,
          },
        ],
      }),
    });

    await user.click(await screen.findByRole("button", { name: "Bright Future" }));

    const panel = await screen.findByRole("dialog", { name: "Application details" });
    expect(within(panel).getByText("Website").nextSibling).toHaveTextContent("https://brightfuture.academy");
    expect(within(panel).getByText("Learning space type").nextSibling).toHaveTextContent("Bootcamp");
    expect(within(panel).getByText("Estimated learners").nextSibling).toHaveTextContent("51-200 learners");
    expect(await within(panel).findByText("Application submitted")).toBeInTheDocument();
    expect(within(panel).getByText("Oct 10, 2026 · Applicant")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("dialog", { name: "Approve this application?" })).toBeInTheDocument();
  });

  it("offers a retry when the requests fail to load", async () => {
    renderRequests({
      [applicationsRoute]: reply(500, { success: false, message: "Down" }),
    });

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("You're Good!")).not.toBeInTheDocument();
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

  it("counts the new requests beside Onboarding Requests", async () => {
    mockApi(academyRoutes([newRequest, designLab]));
    renderWithClient(
      <SidebarNavProvider>
        <PlatformAdminSidebar />
      </SidebarNavProvider>,
    );

    expect(await screen.findByLabelText("1 new")).toHaveTextContent("1");
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

  it("shows the empty state until an application is approved", async () => {
    renderAcademies(academyRoutes([newRequest]));

    expect(await screen.findByText("Nothing to see here yet!")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("--")).toBeInTheDocument();
    expect(screen.queryByText("All academies")).not.toBeInTheDocument();
  });

  it("lists every academy, with their totals", async () => {
    renderAcademies(academyRoutes([designLab, riseAcademy, pixelAcademy, closedAcademy]));

    const row = await rowFor("Rise Academy");
    expect(within(row).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(row).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).getByText("Oct 1, 2026")).toBeInTheDocument();
    expect(within(await rowFor("Closed Academy")).getByText("Suspended")).toBeInTheDocument();

    /* Its super admin was invited but hasn't finished setting up. */
    const pixel = await rowFor("Pixel Academy");
    expect(within(pixel).getByText("Awaiting set-up")).toBeInTheDocument();
    expect(within(pixel).getByText("Tobi Pixel Academy")).toBeInTheDocument();
    expect(within(pixel).getByText("a3@example.com")).toBeInTheDocument();

    expect(screen.getByText("4 Academies")).toBeInTheDocument();
    expect(within(metric("Total Academies")).getByText("4")).toBeInTheDocument();
    expect(within(metric("Active Academies")).getByText("2")).toBeInTheDocument();
    expect(within(metric("Suspended Academies")).getByText("1")).toBeInTheDocument();
  });

  it("filters to the academies awaiting set-up", async () => {
    const { user } = renderAcademies(academyRoutes([designLab, pixelAcademy]));
    await rowFor("Design Lab");

    await user.click(screen.getByRole("button", { name: "Filter" }));
    await user.click(await screen.findByRole("checkbox", { name: "Awaiting set-up" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(await screen.findByRole("button", { name: "Pixel Academy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Design Lab" })).not.toBeInTheDocument();
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

  it("opens an academy's details, with what was never given shown as --", async () => {
    const { user } = renderAcademies(academyRoutes([riseAcademy]));

    await user.click(await screen.findByRole("button", { name: "Rise Academy" }));

    const panel = await screen.findByRole("dialog", { name: "Academy details" });
    expect(within(panel).getByText("Tobi Rise Academy")).toBeInTheDocument();
    expect(within(panel).getByText("a2@example.com")).toBeInTheDocument();
    expect(within(panel).getByText("Date created").nextSibling).toHaveTextContent("Oct 1, 2026");
    expect(within(panel).getByText("Date applied").nextSibling).toHaveTextContent("Oct 1, 2026");
    expect(within(panel).getByText("Website").nextSibling).toHaveTextContent("--");
    expect(within(panel).getByText("Last active").nextSibling).toHaveTextContent("--");
    expect(within(panel).getByText("Learning space type").nextSibling).toHaveTextContent("Bootcamp");
    expect(within(panel).getByRole("button", { name: "Suspend academy" })).toBeInTheDocument();
  });

  it("suspends from the details panel and shows the new status there", async () => {
    let current = riseAcademy;
    const { user, api } = renderAcademies({
      ...academyRoutes(() => [current]),
      "PATCH /platform/organizations/a2": () => {
        current = { ...riseAcademy, organizationStatus: "SUSPENDED" };
        return envelope({ status: "SUSPENDED" });
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
      ...academyRoutes([]),
      [organizationsRoute]: reply(500, { success: false, message: "Down" }),
    });

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("Nothing to see here yet!")).not.toBeInTheDocument();
  });
});
