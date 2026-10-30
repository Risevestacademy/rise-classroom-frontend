import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { CalendarFilterDialog } from "@/components/calendar/CalendarFilterDialog";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
} from "@/components/cohorts/PeopleFilterDialog";
import { CurriculumFilterDialog } from "@/features/curriculum/components/CurriculumFilterDialog";
import { noFilters } from "@/lib/calendar";
import { noCurriculumFilters } from "@/features/curriculum/types";
import { tracks } from "@/test/fixtures";
import { envelope, mockApi, renderWithClient } from "@/test/utils";

type Person = { track: string; status: string };

const peopleFilters: PeopleFilter<Person>[] = [
  {
    key: "track",
    title: "Track",
    allLabel: "All tracks",
    options: [
      { value: "fe", label: "Frontend" },
      { value: "be", label: "Backend" },
    ],
    values: (person) => [person.track],
  },
  {
    key: "status",
    title: "Account status",
    allLabel: "All statuses",
    options: [
      { value: "ACTIVE", label: "Active" },
      { value: "SUSPENDED", label: "Suspended" },
    ],
    values: (person) => [person.status],
  },
];

function renderPeopleFilter(props: Partial<React.ComponentProps<typeof PeopleFilterDialog<Person>>> = {}) {
  const onApply = vi.fn();
  const onOpenChange = vi.fn();
  const view = renderWithClient(
    <PeopleFilterDialog
      open
      onOpenChange={onOpenChange}
      filters={peopleFilters}
      value={{}}
      onApply={onApply}
      {...props}
    />
  );
  return { ...view, onApply, onOpenChange };
}

describe("PeopleFilterDialog", () => {
  it("applies the picked options and closes", async () => {
    const { user, onApply, onOpenChange } = renderPeopleFilter();

    await user.click(screen.getByRole("checkbox", { name: "Frontend" }));
    await user.click(screen.getByRole("checkbox", { name: "Backend" }));
    await user.click(screen.getByRole("checkbox", { name: "Suspended" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({ track: ["fe", "be"], status: ["SUSPENDED"] });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("treats \"All\" as clearing the section", async () => {
    const { user, onApply } = renderPeopleFilter({ value: { track: ["fe"] } });

    expect(screen.getByRole("checkbox", { name: "All tracks" })).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "All tracks" }));
    expect(screen.getByRole("checkbox", { name: "Frontend" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({ track: [] });
  });

  it("keeps one option per section in single-select mode", async () => {
    const { user, onApply } = renderPeopleFilter({ singleSelect: true });

    await user.click(screen.getByRole("checkbox", { name: "Frontend" }));
    await user.click(screen.getByRole("checkbox", { name: "Backend" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({ track: ["be"] });
  });

  it("clears everything", async () => {
    const { user, onApply } = renderPeopleFilter({
      value: { track: ["fe"], status: ["ACTIVE"] },
    });

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({});
  });

  it("discards unapplied changes when cancelled", async () => {
    const { user, onApply, onOpenChange } = renderPeopleFilter();

    await user.click(screen.getByRole("checkbox", { name: "Frontend" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("matches rows on any picked value, across every section", () => {
    const ada = { track: "fe", status: "ACTIVE" };
    const tunde = { track: "be", status: "SUSPENDED" };

    expect(matchesPeopleFilters(ada, peopleFilters, {})).toBe(true);
    expect(matchesPeopleFilters(ada, peopleFilters, { track: ["fe", "be"] })).toBe(true);
    expect(
      matchesPeopleFilters(tunde, peopleFilters, { track: ["be"], status: ["ACTIVE"] })
    ).toBe(false);
  });
});

describe("CalendarFilterDialog", () => {
  it("filters by content type and track", async () => {
    mockApi({ "GET /admin/tracks": envelope(tracks) });
    const onApply = vi.fn();
    const { user } = renderWithClient(
      <CalendarFilterDialog open onOpenChange={vi.fn()} value={noFilters} onApply={onApply} />
    );

    await user.click(screen.getByRole("checkbox", { name: /Tasks/ }));
    await user.click(await screen.findByRole("checkbox", { name: "Backend" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({ kinds: ["task"], trackIds: ["track-2"] });
  });

  it("clears everything", async () => {
    mockApi({ "GET /admin/tracks": envelope(tracks) });
    const onApply = vi.fn();
    const { user } = renderWithClient(
      <CalendarFilterDialog
        open
        onOpenChange={vi.fn()}
        value={{ kinds: ["event"], trackIds: ["track-1"] }}
        onApply={onApply}
      />
    );

    await screen.findByRole("checkbox", { name: "Frontend" });
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(noFilters);
  });
});

describe("CurriculumFilterDialog", () => {
  it("filters by status and track", async () => {
    const api = mockApi({ "GET /admin/tracks": envelope(tracks) });
    const onApply = vi.fn();
    const { user } = renderWithClient(
      <CurriculumFilterDialog
        open
        onOpenChange={vi.fn()}
        value={noCurriculumFilters}
        onApply={onApply}
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "Draft" }));
    await user.click(await screen.findByRole("checkbox", { name: "Frontend" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith({ statuses: ["DRAFT"], trackIds: ["track-1"] });
    expect(api.urls("GET /admin/tracks")[0].searchParams.get("status")).toBe("ACTIVE");
  });

  it("treats \"All\" as clearing the section", async () => {
    mockApi({ "GET /admin/tracks": envelope(tracks) });
    const onApply = vi.fn();
    const { user } = renderWithClient(
      <CurriculumFilterDialog
        open
        onOpenChange={vi.fn()}
        value={{ statuses: ["PUBLISHED"], trackIds: ["track-2"] }}
        onApply={onApply}
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "All" }));
    await user.click(await screen.findByRole("checkbox", { name: "All tracks" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onApply).toHaveBeenCalledWith(noCurriculumFilters);
  });
});
