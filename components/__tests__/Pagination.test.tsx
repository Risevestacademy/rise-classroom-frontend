import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { Pagination } from "@/components/ui/pagination";
import { renderWithClient } from "@/test/utils";

function setup(page: number, totalPages: number, disabled = false) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  const view = renderWithClient(
    <Pagination
      page={page}
      totalPages={totalPages}
      pageSize={10}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      disabled={disabled}
    />,
  );
  return { ...view, onPageChange, onPageSizeChange };
}

function pageNumbers() {
  return screen.getByRole("list").textContent;
}

describe("Pagination", () => {
  it("shows the first and last three pages, like the design", () => {
    setup(1, 10);

    expect(pageNumbers()).toBe("123...8910");
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps the current page in view", () => {
    setup(5, 10);
    expect(pageNumbers()).toBe("456...8910");
  });

  it("drops the ellipsis when no pages are hidden", () => {
    setup(9, 10);
    expect(pageNumbers()).toBe("5678910");
  });

  it("moves with the buttons and page numbers", async () => {
    const { user, onPageChange } = setup(5, 10);

    await user.click(screen.getByRole("button", { name: "First page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(10);
    await user.click(screen.getByRole("button", { name: "9" }));
    expect(onPageChange).toHaveBeenLastCalledWith(9);
  });

  it("goes to a typed page and restores an invalid one", async () => {
    const { user, onPageChange } = setup(2, 10);
    const input = screen.getByLabelText("Page");

    await user.clear(input);
    await user.type(input, "7{Enter}");
    expect(onPageChange).toHaveBeenCalledWith(7);

    onPageChange.mockClear();
    await user.clear(input);
    await user.type(input, "99{Enter}");
    expect(onPageChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("2");
  });

  it("changes the rows per page", async () => {
    const { user, onPageSizeChange } = setup(1, 10);

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    await user.click(await screen.findByRole("option", { name: "50" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables what can't be used at either end", () => {
    setup(1, 1);

    for (const name of ["First page", "Previous page", "Next page", "Last page"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });
});
