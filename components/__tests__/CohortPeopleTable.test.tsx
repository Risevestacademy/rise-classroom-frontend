import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { CohortPeopleTable } from "@/components/cohorts/CohortPeopleTable";
import { CohortStudentsTable } from "@/components/cohorts/CohortStudentsTable";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

beforeEach(() => window.history.replaceState(null, "", "/"));

const student = {
  id: "u1",
  name: "Ada Obi",
  email: "ada@example.com",
  role: "STUDENT",
  status: "ACTIVE",
  onboardingStatus: "COMPLETED",
};

describe("CohortStudentsTable", () => {
  it("resends invites to the ticked students who haven't finished onboarding", async () => {
    const invited = { ...student, id: "u2", name: "Bola Ade", email: "bola@example.com", onboardingStatus: "INVITED" };
    const api = mockApi({
      "GET /auth/get-session": { user: { id: "me", role: "SUPERADMIN" }, session: {} },
      "GET /admin/users": envelope({ items: [student, invited], page: 1, limit: 10, total: 2, totalPages: 1 }),
      "POST /admin/users/u2/resend-invite": envelope({}),
    });
    const { user } = renderWithClient(
      <CohortStudentsTable cohortId="c1" title="2 students" columns={[]} filters={[]} />,
    );

    await user.click(await screen.findByRole("checkbox", { name: "Select all" }));
    await user.click(await screen.findByRole("button", { name: "Resend invite (1)" }));

    expect(await screen.findByText("Resent 1 invite")).toBeInTheDocument();
    expect(api.bodies("POST /admin/users/u2/resend-invite")).toHaveLength(1);
    expect(api.bodies("POST /admin/users/u1/resend-invite")).toHaveLength(0);
  });

  it("asks the API for the page and rows per page", async () => {
    const { urls } = mockApi({
      "GET /admin/users": envelope({
        items: [student],
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      }),
    });
    const { user } = renderWithClient(
      <CohortStudentsTable
        cohortId="c1"
        title="25 students"
        columns={[]}
        filters={[]}
      />,
    );

    expect(await screen.findByText("Ada Obi")).toBeInTheDocument();
    const first = urls("GET /admin/users")[0].searchParams;
    expect(first.get("role")).toBe("STUDENT");
    expect(first.get("cohortId")).toBe("c1");
    expect(first.get("page")).toBe("1");
    expect(first.get("limit")).toBe("10");

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(urls("GET /admin/users").at(-1)?.searchParams.get("page")).toBe("2"),
    );
    expect(window.location.search).toBe("?page=2");
  });

  it("starts on the page and page size in the URL", async () => {
    window.history.replaceState(null, "", "/?page=2&size=20");
    const { urls } = mockApi({
      "GET /admin/users": envelope({
        items: [student],
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      }),
    });
    renderWithClient(
      <CohortStudentsTable
        cohortId="c1"
        title="45 students"
        columns={[]}
        filters={[]}
      />,
    );

    expect(await screen.findByText("Ada Obi")).toBeInTheDocument();
    const first = urls("GET /admin/users")[0].searchParams;
    expect(first.get("page")).toBe("2");
    expect(first.get("limit")).toBe("20");
  });
});

describe("CohortPeopleTable", () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: `s${index + 1}`,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
  }));

  it("pages through a list it already has, and restarts on search", async () => {
    const { user } = renderWithClient(
      <CohortPeopleTable
        title="12 Instructors"
        noun={{ singular: "instructor", plural: "instructors" }}
        personHeader="Instructors"
        rows={rows}
        columns={[]}
      />,
    );

    expect(screen.getByText("Person 10")).toBeInTheDocument();
    expect(screen.queryByText("Person 11")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Person 11")).toBeInTheDocument();
    expect(screen.queryByText("Person 1")).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "Person 3");
    expect(screen.getByText("Person 3")).toBeInTheDocument();
    // One match fits on a page, so the pagination goes away.
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  function renderSelectable() {
    return renderWithClient(
      <CohortPeopleTable
        title="12 Instructors"
        noun={{ singular: "instructor", plural: "instructors" }}
        personHeader="Instructors"
        rows={rows}
        columns={[{ header: "Track", width: "w-40", cell: () => <b>Design</b> }]}
      />,
    );
  }

  it("shows what can be done once rows are ticked, and clears with Escape", async () => {
    const { user } = renderSelectable();
    expect(screen.queryByRole("region", { name: "Selected rows" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select Person 1" }));
    expect(screen.getByRole("region", { name: "Selected rows" })).toHaveTextContent(
      "1instructor selected",
    );

    await user.click(screen.getByRole("checkbox", { name: "Select Person 2" }));
    expect(screen.getByText("instructors selected")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Selected rows" })).not.toBeInTheDocument();
  });

  it("keeps rows ticked on other pages and copies their emails", async () => {
    const { user } = renderSelectable();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    await user.click(screen.getByRole("checkbox", { name: "Select Person 1" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Person 11" }));
    await user.click(screen.getByRole("button", { name: "Copy emails" }));

    expect(writeText).toHaveBeenCalledWith("person1@example.com, person11@example.com");
    expect(await screen.findByText("Copied 2 emails")).toBeInTheDocument();
  });

  it("selects the whole page from the header, then clears", async () => {
    const { user } = renderSelectable();

    await user.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(screen.getByRole("region", { name: "Selected rows" })).toHaveTextContent("10");

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByRole("region", { name: "Selected rows" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select all" })).not.toBeChecked();
  });
});
