import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";
import {
  hasFirstAndLastName,
  signUpErrorMessage,
  submitSignUpApplication,
  type SignUpApplication,
} from "@/lib/sign-up";
import { envelope, mockApi, reply } from "@/test/utils";

const route = "POST /organization-applications";

const application: SignUpApplication = {
  fullName: "Ada Okafor",
  email: "ada@brightfuture.academy",
  academyName: "Bright Future Academy",
  website: "brightfuture.academy",
  learningSpaceType: "BOOTCAMP",
  learnerCount: "FROM_51_TO_200",
};

describe("submitSignUpApplication", () => {
  it("sends the application in the API's words", async () => {
    const api = mockApi({ [route]: reply(201, envelope({ id: "1" })) });

    await submitSignUpApplication(application);

    expect(api.bodies(route)).toEqual([
      {
        fullName: "Ada Okafor",
        email: "ada@brightfuture.academy",
        academyName: "Bright Future Academy",
        website: "brightfuture.academy",
        learningSpaceType: "BOOTCAMP",
        estimatedLearners: "FROM_51_TO_200",
      },
    ]);
  });

  it("leaves the website out when none was given", async () => {
    const api = mockApi({ [route]: reply(201, envelope({ id: "1" })) });

    await submitSignUpApplication({ ...application, website: "" });

    expect(api.bodies(route)[0]).not.toHaveProperty("website");
  });

  it("fails when the API turns the application down", async () => {
    mockApi({ [route]: reply(409, { success: false, message: "Taken" }) });

    await expect(submitSignUpApplication(application)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("signUpErrorMessage", () => {
  const failure = (status: number, message = "") =>
    new ApiError(status, message, null);

  it("explains an email that's already in use", () => {
    expect(signUpErrorMessage(failure(409))).toMatch(/already has an account/);
  });

  it("explains the hourly limit", () => {
    expect(signUpErrorMessage(failure(429))).toMatch(/try again in an hour/);
  });

  it("passes on what the API found wrong with the form", () => {
    expect(signUpErrorMessage(failure(400, "website must be a URL"))).toBe(
      "website must be a URL",
    );
  });

  it("falls back to a plain message for anything else", () => {
    expect(signUpErrorMessage(new TypeError("offline"))).toBe(
      "We couldn't send your application. Please try again.",
    );
  });
});

describe("hasFirstAndLastName", () => {
  it("needs at least two words", () => {
    expect(hasFirstAndLastName("Ada")).toBe(false);
    expect(hasFirstAndLastName("  Ada  ")).toBe(false);
    expect(hasFirstAndLastName("Ada Ngozi Okafor")).toBe(true);
  });
});
