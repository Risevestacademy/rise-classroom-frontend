import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { RolePermissions } from "@/components/settings/RolePermissions";
import { SystemPreferencePage } from "@/components/settings/SystemPreferencePages";
import { findAcademyRole } from "@/lib/role-permissions";
import { findSystemPreferencePage } from "@/lib/system-preferences";

function renderRole(slug: string) {
  render(<RolePermissions role={findAcademyRole(slug)!} />);
  return userEvent.setup();
}

function renderPreferences(slug: string) {
  render(<SystemPreferencePage page={findSystemPreferencePage(slug)!} />);
  return userEvent.setup();
}

describe("RolePermissions", () => {
  it("shows a role's permissions as the design sets them", () => {
    renderRole("mentor");

    expect(
      screen.getByRole("heading", { name: "Roles & Permissions / Mentor" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Mentorship" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Reports" })).not.toBeChecked();
  });

  it("switches a permission on and off", async () => {
    const user = renderRole("student");
    const reports = screen.getByRole("switch", { name: "Reports" });

    await user.click(reports);
    expect(reports).toBeChecked();
    await user.click(reports);
    expect(reports).not.toBeChecked();
  });

  it("keeps every super admin permission on", () => {
    renderRole("super-admin");

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(8);
    for (const item of switches) {
      expect(item).toBeChecked();
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });
});

describe("NotificationSettings", () => {
  it("stops an event's recipients being changed while it's off", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings />);

    const recipients = screen.getByRole("combobox", {
      name: 'Who receives "New assignments"',
    });
    expect(recipients).toHaveTextContent("Students");
    expect(recipients).not.toHaveAttribute("data-disabled");

    await user.click(screen.getByRole("switch", { name: "New assignments" }));
    expect(recipients).toHaveAttribute("data-disabled");
  });
});

describe("SystemPreferencePage", () => {
  it("only offers a default duration with a default deadline", async () => {
    const user = renderPreferences("assignment-submissions");
    const duration = screen.getByRole("combobox", { name: "Default duration" });
    expect(duration).toHaveAttribute("data-disabled");

    await user.click(
      screen.getByRole("radio", {
        name: /Use a default deadline for all assignments/,
      }),
    );
    expect(duration).not.toHaveAttribute("data-disabled");
  });

  it("hides the late submission rules when they're turned off", async () => {
    const user = renderPreferences("assignment-submissions");
    expect(screen.getByRole("combobox", { name: "Penalty" })).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Late submissions" }));
    expect(
      screen.queryByRole("combobox", { name: "Late submission policy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Maximum resubmissions" }),
    ).toBeInTheDocument();
  });

  it("ticks the assessment types the design does", async () => {
    const user = renderPreferences("grading-assessment");
    const quizzes = screen.getByRole("checkbox", { name: /Quizzes/ });

    expect(screen.getByRole("checkbox", { name: /Projects/ })).toBeChecked();
    expect(quizzes).not.toBeChecked();
    await user.click(quizzes);
    expect(quizzes).toBeChecked();
  });

  it("says so when a page isn't designed yet", () => {
    renderPreferences("storage-usage");
    expect(
      screen.getByText("These settings aren't available yet."),
    ).toBeInTheDocument();
  });
});
