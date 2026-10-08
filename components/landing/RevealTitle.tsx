import * as React from "react";

/**
 * A title split into words that rise out of a mask one after another. The
 * landing page's render loop moves each `[data-word]` as you scroll.
 */
export function RevealTitle({ text }: { text: string }) {
  return text.split(" ").map((word, k) => (
    <React.Fragment key={k}>
      <span className="inline-block overflow-hidden pb-[0.08em] align-top">
        <span data-word className="inline-block will-change-transform">
          {word}
        </span>
      </span>{" "}
    </React.Fragment>
  ));
}
