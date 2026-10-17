import type { CSSProperties } from "react";

/**
 * Link/button label whose letters roll up to a copy of themselves on hover.
 * The visible letters are decorative; screen readers get the plain label.
 */
export function RollText({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="roll-text">
        {Array.from(children).map((char, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties}>
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </>
  );
}
