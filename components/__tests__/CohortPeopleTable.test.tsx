import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { CohortPeopleTable } from "@/components/cohorts/CohortPeopleTable";
import { CohortStudentsTable } from "@/components/cohorts/CohortStudentsTable";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

const student = {
  id: "u1",
  name: "Ada Obi",
  email: "ada@example.com",
  role: "STUDENT",
  status: "ACTIVE",
  onboardingStatus: "COMPLETED",
};

describe("CohortStudentsTable", () => {
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
    expect(screen.getByLabelText("Page")).toHaveValue("1");
  });
});
