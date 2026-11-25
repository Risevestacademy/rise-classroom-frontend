import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Participant } from "livekit-client";

import { insertMention, mentionMatches, mentionQuery, mentions, splitMentions } from "@/components/live-room/mentions";
import { RaisedHandsCard } from "@/components/live-room/RaisedHands";

const person = (identity: string, name: string, isLocal = false) =>
  ({ identity, name, isLocal, attributes: {} }) as unknown as Participant;

describe("@mentions", () => {
  const people = [
    { id: "1", name: "Ada Obi" },
    { id: "2", name: "Tola Ade" },
    { id: "3", name: "Adaeze Nwosu" },
  ];

  it("finds the @ being typed and suggests people, best matches first", () => {
    expect(mentionQuery("Hi @Ad", 6)).toEqual({ start: 3, query: "Ad" });
    expect(mentionQuery("email@ad", 8)).toBeNull();
    expect(mentionMatches(people, "ad").map((p) => p.name)).toEqual(["Ada Obi", "Adaeze Nwosu", "Tola Ade"]);
  });

  it("puts the full name in and moves the caret after it", () => {
    expect(insertMention("Hi @Ad thanks", 3, 6, "Ada Obi")).toEqual({ text: "Hi @Ada Obi  thanks", caret: 12 });
  });

  it("picks out whole names only, and says who was tagged", () => {
    const names = people.map((p) => p.name);
    expect(splitMentions("@Ada Obi and @Adaeze Nwosu, see this", names)).toEqual([
      { text: "@Ada Obi", mention: "Ada Obi" },
      { text: " and " },
      { text: "@Adaeze Nwosu", mention: "Adaeze Nwosu" },
      { text: ", see this" },
    ]);
    expect(mentions("thanks @ada obi!", "Ada Obi")).toBe(true);
    expect(mentions("thanks @Adaeze", "Ada")).toBe(false);
  });
});

describe("RaisedHandsCard", () => {
  it("says who raised their hand", () => {
    render(<RaisedHandsCard hands={[{ participant: person("1", "Ada Obi"), since: 1 }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Ada Obi raised their hand");
  });

  it("folds a queue into a hand and a count, and opens it in the order hands went up", async () => {
    const user = userEvent.setup();
    const hands = [
      { participant: person("2", "Tola Ade"), since: 2 },
      { participant: person("me", "Me", true), since: 3 },
    ];
    render(<RaisedHandsCard hands={[{ participant: person("1", "Ada Obi"), since: 1 }, ...hands]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "3 raised hands, show the queue" }));
    expect(screen.getByRole("status")).toHaveTextContent("3 raised hands");
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    ["Ada Obi", "Tola Ade", "You"].forEach((name, index) => expect(rows[index]).toHaveTextContent(name));

    await user.click(screen.getByRole("button", { name: "Hide the queue" }));
    expect(screen.getByRole("button", { name: "3 raised hands, show the queue" })).toBeInTheDocument();
  });

  it("hides one person's card when dismissed, until someone new raises theirs", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RaisedHandsCard hands={[{ participant: person("1", "Ada Obi"), since: 1 }]} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("region", { name: "Raised hands" })).not.toBeInTheDocument();

    rerender(<RaisedHandsCard hands={[{ participant: person("4", "Kemi Bello"), since: 4 }]} />);
    expect(screen.getByRole("region", { name: "Raised hands" })).toBeInTheDocument();
  });

  it("stays hidden when only your own hand is up", () => {
    render(<RaisedHandsCard hands={[{ participant: person("me", "Me", true), since: 1 }]} />);
    expect(screen.queryByRole("region", { name: "Raised hands" })).not.toBeInTheDocument();
  });
});
