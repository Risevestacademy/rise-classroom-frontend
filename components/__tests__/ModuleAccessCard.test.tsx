import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { ModuleAccessCard } from "@/features/curriculum/components/ModuleAccessCard";
import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import type { ModuleAccessRecord, ModuleStatus } from "@/features/curriculum/types";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const unlockRoute = "POST /instructor/topics/m1/unlock-all";
const lessonsRoute = "GET /instructor/topics/m1/lessons";
const lessonUnlock = (enrollmentId: string, lessonId: string) =>
  `PATCH /instructor/enrollments/${enrollmentId}/lessons/${lessonId}/unlock`;

/* Unlocking also opens every lesson for every student, so those routes come along. */
function unlockRoutes(record: ModuleAccessRecord, lessonIds = ["l1", "l2"]) {
  return {
    [unlockRoute]: envelope(record),
    [lessonsRoute]: envelope(lessonIds.map((id) => ({ id, topicId: "m1", title: id }))),
    ...Object.fromEntries(
      record.statuses.flatMap((status) =>
        lessonIds.map((id) => [lessonUnlock(status.enrollmentId, id), envelope({})]),
      ),
    ),
  };
}

/* The reply for a track of `open + waiting` students, `waiting` of them held back by prerequisites. */
function accessReply(unlocked: boolean, open: number, waiting = 0): ModuleAccessRecord {
  const statuses = Array.from({ length: open + waiting }, (_, index) => ({
    enrollmentId: `e${index}`,
    topicId: "m1",
    instructorUnlocked: unlocked,
    unlocked: unlocked && index < open,
  }));
  return { topicId: "m1", trackId: "track-1", enrollmentCount: statuses.length, statuses };
}

function renderCard(status: ModuleStatus = "PUBLISHED") {
  return renderWithClient(
    <CurriculumScopeProvider role="instructor">
      <ModuleAccessCard moduleId="m1" moduleStatus={status} />
    </CurriculumScopeProvider>,
  );
}

describe("ModuleAccessCard", () => {
  it("offers both actions before anything has changed", () => {
    mockApi({});
    renderCard();

    expect(screen.getByRole("button", { name: "Unlock for students" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lock" })).toBeEnabled();
    expect(screen.queryByText("Unlocked")).not.toBeInTheDocument();
  });

  it("unlocks the module for the whole track", async () => {
    const api = mockApi(unlockRoutes(accessReply(true, 12)));
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Unlock for students" }));

    expect(await screen.findByText("Unlocked for all 12 students.")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
    expect(api.bodies(unlockRoute)).toEqual([{ unlocked: true }]);
    expect(screen.queryByRole("button", { name: "Unlock for students" })).not.toBeInTheDocument();
  });

  it("opens each lesson for each student after the module", async () => {
    const api = mockApi(unlockRoutes(accessReply(true, 2)));
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Unlock for students" }));
    await screen.findByText("Unlocked for all 2 students.");

    for (const enrollmentId of ["e0", "e1"]) {
      for (const lessonId of ["l1", "l2"]) {
        expect(api.bodies(lessonUnlock(enrollmentId, lessonId))).toEqual([{ unlocked: true }]);
      }
    }
  });

  it("locks only the module, which closes its lessons too", async () => {
    const api = mockApi({ [unlockRoute]: envelope(accessReply(false, 2)) });
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Lock" }));
    await user.click(await screen.findByRole("button", { name: "Yes, lock it" }));
    await screen.findByText("Locked for all 2 students.");

    expect(api.fetchMock).toHaveBeenCalledOnce();
  });

  it("says how many students still wait on earlier modules", async () => {
    mockApi(unlockRoutes(accessReply(true, 9, 3)));
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Unlock for students" }));

    expect(
      await screen.findByText(
        "Unlocked for 12 students. 3 will get in once they finish the modules before this one.",
      ),
    ).toBeInTheDocument();
  });

  it("asks before locking, then locks", async () => {
    const api = mockApi({ [unlockRoute]: envelope(accessReply(false, 12)) });
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Lock" }));
    expect(api.bodies(unlockRoute)).toEqual([]);

    await user.click(await screen.findByRole("button", { name: "Yes, lock it" }));

    expect(await screen.findByText("Locked for all 12 students.")).toBeInTheDocument();
    expect(api.bodies(unlockRoute)).toEqual([{ unlocked: false }]);
    expect(screen.getByRole("button", { name: "Unlock for students" })).toBeInTheDocument();
  });

  it("can cancel locking", async () => {
    const api = mockApi({});
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Lock" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(api.fetchMock).not.toHaveBeenCalled();
  });

  it("shows the error when unlocking fails", async () => {
    mockApi({ [unlockRoute]: reply(403, { success: false, message: "Not your track" }) });
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Unlock for students" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Not your track");
    expect(screen.getByRole("button", { name: "Unlock for students" })).toBeEnabled();
  });

  it("warns that a draft stays hidden even when unlocked", () => {
    mockApi({});
    renderCard("DRAFT");
    expect(screen.getByText(/This module is a draft/)).toBeInTheDocument();
  });

  it("explains an empty track", async () => {
    mockApi(unlockRoutes(accessReply(true, 0)));
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Unlock for students" }));

    expect(await screen.findByText("No students are enrolled on this track yet.")).toBeInTheDocument();
  });
});
