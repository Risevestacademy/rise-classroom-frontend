import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import StudentProfilePage from "@/app/student/profile/page";
import EditProfilePage from "@/app/student/profile/edit/page";
import { isValidPhoneNumber } from "@/lib/profile";
import { envelope, mockApi, renderWithClient, reply } from "@/test/utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const me = {
  id: "u1",
  firstName: "Aishat",
  lastName: "Lawal",
  displayName: null,
  phoneNumber: "+2348012345678",
  location: null,
  description: null,
  email: "aishat@example.com",
  image: null,
  role: "STUDENT",
  status: "ACTIVE",
  onboardedAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  organization: { id: "o1", name: "Rise" },
  memberships: [
    {
      cohort: { id: "c1", name: "Rise Cohort 4" },
      track: { id: "t1", name: "Product Design" },
    },
  ],
};

describe("isValidPhoneNumber", () => {
  it("accepts 7 to 15 digits with formatting stripped", () => {
    expect(isValidPhoneNumber("+234 801 234 5678")).toBe(true);
    expect(isValidPhoneNumber("(0801) 234-5678")).toBe(true);
  });

  it("rejects too few digits or letters", () => {
    expect(isValidPhoneNumber("+234 801")).toBe(false);
    expect(isValidPhoneNumber("0801abc5678")).toBe(false);
  });
});

describe("student profile page", () => {
  it("shows the student's details, track, cohort and mentor", async () => {
    mockApi({
      "GET /me": envelope(me),
      "GET /students/me/mentor": envelope({
        id: "m1",
        active: true,
        assignedAt: "2026-09-02T00:00:00.000Z",
        mentor: { id: "u9", name: "Amara Obi", email: "amara@example.com", role: "MENTOR" },
      }),
    });
    renderWithClient(<StudentProfilePage />);

    // No display name yet, so the heading falls back to the full name.
    expect(await screen.findAllByText("Aishat Lawal")).toHaveLength(2);
    expect(screen.getByText("Product Design")).toBeInTheDocument();
    expect(screen.getByText("Rise Cohort 4")).toBeInTheDocument();
    expect(screen.getByText("aishat@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Amara Obi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit profile/ })).toHaveAttribute(
      "href",
      "/student/profile/edit",
    );
  });

  it("shows the display name as the heading and the full name below", async () => {
    mockApi({
      "GET /me": envelope({ ...me, displayName: "Shatty" }),
      "GET /students/me/mentor": envelope(null),
    });
    renderWithClient(<StudentProfilePage />);

    expect(await screen.findByText("Shatty")).toBeInTheDocument();
    expect(screen.getByText("Aishat Lawal")).toBeInTheDocument();
  });

  it("changes the photo to a preset avatar", async () => {
    const api = mockApi({
      "GET /me": envelope(me),
      "GET /students/me/mentor": envelope(null),
      "GET /avatars/illustration-james-brown.png": "png",
      "PATCH /me": () => envelope({ ...me, image: "/avatars/illustration-james-brown.png" }),
    });
    const { user } = renderWithClient(<StudentProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Change photo" }));
    const dialog = await screen.findByRole("dialog", { name: "Change photo" });
    expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Avatar 1" }));
    await user.click(within(dialog).getByRole("button", { name: "Update" }));

    await vi.waitFor(() => {
      const [body] = api.bodies("PATCH /me") as FormData[];
      expect(body.get("image")).toBeInstanceOf(File);
    });
    expect(await screen.findByText("Photo updated")).toBeInTheDocument();
  });

  it("says when no mentor is assigned", async () => {
    mockApi({
      "GET /me": envelope(me),
      "GET /students/me/mentor": reply(404, { success: false, message: "Not found" }),
    });
    renderWithClient(<StudentProfilePage />);

    expect(await screen.findByText("Not assigned yet")).toBeInTheDocument();
  });

  it("asks before logging out", async () => {
    mockApi({ "GET /me": envelope(me), "GET /students/me/mentor": envelope(null) });
    const { user } = renderWithClient(<StudentProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("dialog", { name: "Log out?" })).toBeInTheDocument();
  });
});

describe("edit profile page", () => {
  it("blocks an invalid phone number", async () => {
    const api = mockApi({ "GET /me": envelope(me) });
    const { user } = renderWithClient(<EditProfilePage />);

    const phone = await screen.findByLabelText(/Phone number/);
    await user.clear(phone);
    await user.type(phone, "+234 801");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Enter a valid phone number")).toBeInTheDocument();
    expect(api.bodies("PATCH /me")).toHaveLength(0);
  });

  it("saves only the fields that changed", async () => {
    const api = mockApi({
      "GET /me": envelope(me),
      "PATCH /me": (body: unknown) =>
        envelope({ ...me, ...Object.fromEntries(body as FormData) }),
    });
    const { user } = renderWithClient(<EditProfilePage />);

    const name = await screen.findByLabelText(/Display name/);
    await user.clear(name);
    await user.type(name, "Aishat L.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await vi.waitFor(() =>
      expect(
        api.bodies("PATCH /me").map((body) => Object.fromEntries(body as FormData)),
      ).toEqual([{ displayName: "Aishat L." }]),
    );
    expect(push).toHaveBeenCalledWith("/student/profile?updated=1");
  });

  it("keeps full name, email and track read-only", async () => {
    mockApi({ "GET /me": envelope(me) });
    renderWithClient(<EditProfilePage />);

    expect(await screen.findByLabelText("Full name")).toHaveValue("Aishat Lawal");
    expect(screen.getByLabelText("Full name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/Display name/)).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Track")).toHaveValue("Product Design");
  });
});
