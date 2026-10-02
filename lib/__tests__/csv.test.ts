import { describe, expect, it } from "vitest";
import { parseInstructorCsv } from "@/components/InviteInstructorDialog";

describe("parseInstructorCsv", () => {
  it("reads a headered CSV", () => {
    const { rows, skipped } = parseInstructorCsv(
      "firstName,lastName,email\nAda,Obi,ada.obi@rise.edu\nTega,Briggs,tega@rise.edu"
    );
    expect(skipped).toBe(0);
    expect(rows).toEqual([
      { firstName: "Ada", lastName: "Obi", email: "ada.obi@rise.edu" },
      { firstName: "Tega", lastName: "Briggs", email: "tega@rise.edu" },
    ]);
  });

  it("matches columns by header name whatever the order", () => {
    const { rows } = parseInstructorCsv(
      "email,lastName,firstName\nada@rise.edu,Obi,Ada"
    );
    expect(rows[0]).toEqual({ firstName: "Ada", lastName: "Obi", email: "ada@rise.edu" });
  });

  it("splits a single name column", () => {
    const { rows } = parseInstructorCsv("name,email\nAda Obi,ada@rise.edu");
    expect(rows[0].firstName).toBe("Ada");
    expect(rows[0].lastName).toBe("Obi");
  });

  it("falls back to column order with no header", () => {
    const { rows } = parseInstructorCsv("Ada,Obi,ada@rise.edu");
    expect(rows[0]).toEqual({ firstName: "Ada", lastName: "Obi", email: "ada@rise.edu" });
  });

  it("skips rows without a usable email and counts them", () => {
    const { rows, skipped } = parseInstructorCsv(
      "firstName,lastName,email\nAda,Obi,ada@rise.edu\nBad,Row,not-an-email\n,,"
    );
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  it("always supplies both names, since the API requires them", () => {
    const { rows } = parseInstructorCsv("email\nada.obi@rise.edu");
    expect(rows[0].firstName).toBe("ada.obi");
    expect(rows[0].lastName).toBe("ada.obi");
  });

  it("strips quotes and ignores blank lines", () => {
    const { rows } = parseInstructorCsv(
      'firstName,lastName,email\n"Ada","Obi","ada@rise.edu"\n\n'
    );
    expect(rows[0]).toEqual({ firstName: "Ada", lastName: "Obi", email: "ada@rise.edu" });
  });
});
