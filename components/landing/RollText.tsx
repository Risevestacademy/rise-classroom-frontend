import type { CSSProperties } from "react";

/**
 * Link/button label whose letters roll up to a copy of themselves on hover.
 * The label is in the DOM once, for screen readers and find-in-page; the
 * rolling letters are drawn by CSS (`data-char`), so they aren't text nodes
 * that get read or copied one by one.
 */
export function RollText({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="roll-text">
        {Array.from(children).map((char, index) => (
          <span
            key={index}
            data-char={char === " " ? " " : char}
            style={{ "--i": index } as CSSProperties}
          />
        ))}
      </span>
    </>
  );
}
