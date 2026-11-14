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

type User = ReturnType<typeof renderWithClient>["user"];

/* Opens a date field's picker on this month, steps to the date's month, picks it and applies. */
async function pickDate(user: User, field: RegExp, date: Date) {
  const now = new Date();
  await user.click(screen.getByLabelText(field));
  const months =
    (date.getFullYear() - now.getFullYear()) * 12 + date.getMonth() - now.getMonth();
  for (let i = 0; i < months; i++) {
    await user.click(await screen.findByRole("button", { name: "Next month" }));
  }
  await user.click(await screen.findByRole("button", { name: date.toDateString() }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
}

async function fillForm(
  user: User,
  { name = "Cohort 5", start = new Date(2027, 1, 1), end = new Date(2027, 6, 31) } = {}
) {
  await user.clear(screen.getByLabelText(/Cohort name/));
  await user.type(screen.getByLabelText(/Cohort name/), name);
  await pickDate(user, /Start date/, start);
  await pickDate(user, /End date/, end);
}

describe("Create cohort", () => {
  it("only allows creating once the name and both dates are set", async () => {
    mockApi({});
    const { user } = renderWithClient(<CreateCohortPage />);
    const submit = screen.getByRole("button", { name: "Create cohort" });

    expect(submit).toBeDisabled();

    await pickDate(user, /Start date/, new Date(2027, 1, 1));
    expect(submit).toBeDisabled();

    await pickDate(user, /End date/, new Date(2027, 6, 31));
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
