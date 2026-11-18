import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SignUpPage from "@/app/sign-up/page";
import { renderWithClient } from "@/test/utils";

const stepOne = "Step 1 of 2: About you";
const stepTwo = "Step 2 of 2: Your learning space";

async function fillStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("e.g Ada Okafor"), "Ada Okafor");
  await user.type(screen.getByPlaceholderText("rise@email.com"), "ada@example.com");
}

describe("sign-up steps", () => {
  it("won't open step two from its tab until step one is valid", async () => {
    const user = userEvent.setup();
    renderWithClient(<SignUpPage />);

    await user.click(screen.getByRole("button", { name: stepTwo }));

    expect(screen.getByText("Let’s get to know you.")).toBeInTheDocument();
    expect(
      screen.getByText("Please enter your first and last name"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: stepOne })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("moves between the steps with the tabs and keeps what was typed", async () => {
    const user = userEvent.setup();
    renderWithClient(<SignUpPage />);
    await fillStepOne(user);

    await user.click(screen.getByRole("button", { name: stepTwo }));
    expect(
      screen.getByText("Tell us about your learning space."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: stepTwo })).toHaveAttribute(
      "aria-current",
      "step",
    );

    await user.click(screen.getByRole("button", { name: stepOne }));
    expect(screen.getByText("Let’s get to know you.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g Ada Okafor")).toHaveValue(
      "Ada Okafor",
    );
  });
});
