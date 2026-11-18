import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { MoreInfo } from "@/app/apply/more-info/MoreInfo";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const search = vi.hoisted(() => ({ value: "token=abc123" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
}));

const detailsRoute = "POST /organization-applications/details";
const resubmitRoute = "POST /organization-applications/resubmit";

const application = {
  id: "app-1",
  fullName: "Ada Okafor",
  email: "ada@brightfuture.academy",
  academyName: "Bright Future Academy",
  website: "https://brightfuture.academy",
  learningSpaceType: "BOOTCAMP",
  estimatedLearners: "FROM_51_TO_200",
  status: "INFO_REQUESTED",
  infoRequest: {
    message: "Could you share your planned course list?",
    requestedAt: "2026-11-01T09:00:00.000Z",
  },
};

function renderMoreInfo(routes: Parameters<typeof mockApi>[0], query = "token=abc123") {
  search.value = query;
  const api = mockApi(routes);
  return { ...renderWithClient(<MoreInfo />), api };
}

describe("more info page", () => {
  it("shows the question and the application, loaded with the link's token", async () => {
    const { api } = renderMoreInfo({ [detailsRoute]: envelope(application) });

    expect(
      await screen.findByText("Could you share your planned course list?"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toHaveValue("Ada Okafor");
    expect(screen.getByLabelText("Academy name")).toHaveValue("Bright Future Academy");
    expect(screen.getByLabelText("Website")).toHaveValue("brightfuture.academy");
    expect(screen.getByText(/ada@brightfuture\.academy/)).toBeInTheDocument();
    expect(api.bodies(detailsRoute)).toEqual([{ token: "abc123" }]);
  });

  it("sends the answer with any corrections, then says thanks", async () => {
    const { user, api } = renderMoreInfo({
      [detailsRoute]: envelope(application),
      [resubmitRoute]: envelope({ ...application, status: "NEW" }),
    });

    const send = await screen.findByRole("button", { name: "Send answer" });
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText("Your answer"), "Design and product courses.");
    await user.clear(screen.getByLabelText("Academy name"));
    await user.type(screen.getByLabelText("Academy name"), "Bright Future");
    await user.click(send);

    expect(await screen.findByText("Thanks, we've got your answer")).toBeInTheDocument();
    expect(api.bodies(resubmitRoute)).toEqual([
      {
        token: "abc123",
        response: "Design and product courses.",
        fullName: "Ada Okafor",
        academyName: "Bright Future",
        website: "brightfuture.academy",
        learningSpaceType: "BOOTCAMP",
        estimatedLearners: "FROM_51_TO_200",
      },
    ]);
  });

  it("won't send a single-word name", async () => {
    const { user, api } = renderMoreInfo({ [detailsRoute]: envelope(application) });

    await user.type(await screen.findByLabelText("Your answer"), "Here you go.");
    await user.clear(screen.getByLabelText("Full Name"));
    await user.type(screen.getByLabelText("Full Name"), "Ada");
    await user.click(screen.getByRole("button", { name: "Send answer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter your first and last name",
    );
    expect(api.bodies(resubmitRoute)).toEqual([]);
  });

  it("keeps the form and says why when sending fails", async () => {
    const { user } = renderMoreInfo({
      [detailsRoute]: envelope(application),
      [resubmitRoute]: reply(410, { success: false, message: "Expired" }),
    });

    await user.type(await screen.findByLabelText("Your answer"), "Here you go.");
    await user.click(screen.getByRole("button", { name: "Send answer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This link has expired");
    expect(screen.getByLabelText("Your answer")).toHaveValue("Here you go.");
  });

  it("explains an expired link instead of showing the form", async () => {
    renderMoreInfo({ [detailsRoute]: reply(410, { success: false, message: "Expired" }) });

    expect(await screen.findByText("We can't open this link")).toBeInTheDocument();
    expect(screen.getByText(/This link has expired/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Your answer")).not.toBeInTheDocument();
  });

  it("explains a link that was already used", async () => {
    renderMoreInfo({ [detailsRoute]: reply(404, { success: false, message: "Not found" }) });

    expect(await screen.findByText(/isn't valid any more/)).toBeInTheDocument();
  });

  it("asks for nothing when the link has no token", () => {
    const { api } = renderMoreInfo({}, "");

    expect(screen.getByText("This link isn't complete")).toBeInTheDocument();
    expect(api.fetchMock).not.toHaveBeenCalled();
  });
});
