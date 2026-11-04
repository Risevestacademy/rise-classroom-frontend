import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { AddNoteDialog } from "@/components/student-profile/AddNoteDialog";
import { MessageButton } from "@/components/student-profile/shared";
import { renderWithClient } from "@/test/utils";

describe("AddNoteDialog", () => {
  it("needs a title and a note, and starts empty each time", async () => {
    const { user } = renderWithClient(<AddNoteDialog />);

    await user.click(screen.getByRole("button", { name: "Add Note" }));
    const submit = screen.getByRole("button", { name: "Add note" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: /title/i }), "API");
    expect(submit).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /note/i }), "Help");
    expect(submit).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Note" }));
    expect(screen.getByRole("textbox", { name: /title/i })).toHaveValue("");
  });
});

describe("MessageButton", () => {
  it("opens an email to the person", () => {
    renderWithClient(<MessageButton email="ada@example.com" />);
    expect(screen.getByRole("link", { name: "Message" })).toHaveAttribute(
      "href",
      "mailto:ada@example.com",
    );
  });
});
