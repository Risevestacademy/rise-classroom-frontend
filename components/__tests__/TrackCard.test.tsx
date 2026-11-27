import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TrackCard } from "@/components/tracks/TrackCard";

const stats = [
  { icon: null, value: 2, label: "Instructors", tone: "" },
  { icon: null, value: 52, label: "Lessons", tone: "" },
  { icon: null, value: 3, label: "Pending invites", tone: "" },
];

describe("TrackCard", () => {
  it("shows the track's status, students, figures and progress, and links to it", () => {
    render(
      <TrackCard
        name="Backend"
        active
        students={33}
        stats={stats}
        progress={42}
        colorKey="backend"
        href="/admin/tracks/t1"
      />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Backend" })).toHaveAttribute(
      "href",
      "/admin/tracks/t1",
    );
    expect(screen.getByText("33 students")).toBeInTheDocument();
    expect(screen.getByText("Pending invites")).toBeInTheDocument();
    expect(screen.getByText("42% Complete")).toBeInTheDocument();
  });

  it("says so when progress couldn't be loaded", () => {
    render(
      <TrackCard
        name="Design"
        active={false}
        students={1}
        stats={stats}
        progress={undefined}
        colorKey="design"
      />,
    );

    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText("1 student")).toBeInTheDocument();
    expect(screen.getByText("Progress couldn't be loaded")).toBeInTheDocument();
  });
});
