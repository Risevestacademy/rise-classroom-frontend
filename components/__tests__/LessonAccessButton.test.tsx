import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { LessonAccessButton } from "@/features/curriculum/components/LessonAccessButton";
import { CurriculumScopeProvider } from "@/features/curriculum/scope";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

function renderButton(unlocked: boolean, moduleUnlocked = true) {
  return renderWithClient(
    <CurriculumScopeProvider role="admin">
      <LessonAccessButton
        curriculumId="c1"
        moduleId="m1"
        lessonId="l1"
        lessonName="lesson 1"
        unlocked={unlocked}
        moduleUnlocked={moduleUnlocked}
      />
    </CurriculumScopeProvider>,
  );
}

describe("LessonAccessButton", () => {
  it("unlocks a locked lesson for the cohort", async () => {
    const api = mockApi({ "POST /admin/lessons/l1/unlock": envelope({}) });
    const { user } = renderButton(false);

    await user.click(screen.getByRole("button", { name: "Locked. Unlock lesson 1" }));

    await vi.waitFor(() => expect(api.bodies("POST /admin/lessons/l1/unlock")).toHaveLength(1));
  });

  it("locks an unlocked lesson", async () => {
    const api = mockApi({ "POST /admin/lessons/l1/lock": envelope({}) });
    const { user } = renderButton(true);

    await user.click(screen.getByRole("button", { name: "Unlocked. Lock lesson 1" }));

    await vi.waitFor(() => expect(api.bodies("POST /admin/lessons/l1/lock")).toHaveLength(1));
  });

  it("stays locked until the module is unlocked", () => {
    mockApi({});
    renderButton(false, false);

    const button = screen.getByRole("button", { name: "Locked. Unlock lesson 1" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Unlock the module first");
  });

  it("shows why the API refused", async () => {
    mockApi({
      "POST /admin/lessons/l1/unlock": reply(409, {
        success: false,
        error: { message: "Unlock the parent topic before unlocking this lesson" },
      }),
    });
    const { user } = renderButton(false);

    await user.click(screen.getByRole("button", { name: "Locked. Unlock lesson 1" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
