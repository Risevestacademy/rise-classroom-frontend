import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { makeCohort } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// The top nav brings the session and cohort picker along; neither matters here.
vi.mock("@/components/AdminTopNav", () => ({ AdminTopNav: () => null }));

const { default: CreateCohortPage } = await import("@/app/admin/cohorts/create/page");

async function fillForm(
  user: ReturnType<typeof renderWithClient>["user"],
  { name = "Cohort 5", start = "01/02/2027", end = "31/07/2027" } = {}
) {
  await user.clear(screen.getByLabelText(/Cohort name/));
  await user.type(screen.getByLabelText(/Cohort name/), name);
  await user.type(screen.getByLabelText(/Start date/), start);
  await user.type(screen.getByLabelText(/End date/), end);
}

describe("Create cohort", () => {
  it("only allows creating once the name and both dates are valid", async () => {
    mockApi({});
    const { user } = renderWithClient(<CreateCohortPage />);
    const submit = screen.getByRole("button", { name: "Create cohort" });

    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/Start date/), "31/02/2027");
    await user.type(screen.getByLabelText(/End date/), "31/07/2027");
    expect(submit).toBeDisabled();

    await user.clear(screen.getByLabelText(/Start date/));
    await user.type(screen.getByLabelText(/Start date/), "01/02/2027");
    expect(submit).toBeEnabled();

    await user.clear(screen.getByLabelText(/Cohort name/));
    expect(submit).toBeDisabled();
  });

  it("shows the duration between the dates", async () => {
    mockApi({});
    const { user } = renderWithClient(<CreateCohortPage />);

    await fillForm(user);

    expect(screen.getByText("6 months")).toBeInTheDocument();
  });

  it("creates the cohort and returns to the list", async () => {
    const api = mockApi({
      "POST /admin/cohorts": envelope(makeCohort({ id: "new", name: "Cohort 5" })),
    });
    const { user, invalidate } = renderWithClient(<CreateCohortPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create cohort" }));

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith("/admin/cohorts?created=Cohort%205")
    );
    expect(api.bodies("POST /admin/cohorts")).toEqual([
      {
        name: "Cohort 5",
        year: "2027",
        startDate: "2027-02-01",
        endDate: "2027-07-31",
      },
    ]);
    expect(api.fetchMock).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "cohorts"] });
  });

  // The API creates every cohort as ongoing, so a completed one takes a
  // second request.
  it("marks the cohort completed after creating it", async () => {
    const api = mockApi({
      "POST /admin/cohorts": envelope(makeCohort({ id: "new", name: "Cohort 5" })),
      "PATCH /admin/cohorts/new": envelope(makeCohort({ id: "new", status: "COMPLETED" })),
    });
    const { user } = renderWithClient(<CreateCohortPage />);

    await fillForm(user);
    await user.selectOptions(screen.getByLabelText(/Cohort status/), "Completed");
    await user.click(screen.getByRole("button", { name: "Create cohort" }));

    await vi.waitFor(() =>
      expect(api.bodies("PATCH /admin/cohorts/new")).toEqual([{ status: "COMPLETED" }])
    );
  });

  it("explains a duplicate name and stays on the form", async () => {
    mockApi({ "POST /admin/cohorts": reply(409, { message: "Conflict" }) });
    push.mockClear();
    const { user } = renderWithClient(<CreateCohortPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create cohort" }));

    expect(
      await screen.findByText("A cohort with this name already exists. Choose a different name.")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create cohort" })).toBeEnabled();
  });

  it("disables the button while creating", async () => {
    mockApi({ "POST /admin/cohorts": () => new Promise(() => {}) });
    const { user } = renderWithClient(<CreateCohortPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create cohort" }));

    expect(await screen.findByRole("button", { name: "Creating…" })).toBeDisabled();
  });
});
