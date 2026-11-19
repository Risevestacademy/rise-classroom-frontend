import { cn } from "@/lib/utils";

/* Simple outlined shapes, like the ones on a geometry set. Each drifts at its
   own speed (data-drift) as the page scrolls. */
const SHAPES = {
  circle: <circle cx="20" cy="20" r="16" />,
  square: <rect x="6" y="6" width="28" height="28" rx="4" />,
  triangle: <path d="M20 5L36 33H4Z" />,
  zigzag: <path d="M2 26L10 14L18 26L26 14L34 26L38 20" />,
  arc: <path d="M4 32A16 16 0 0 1 36 32" />,
};

export type LineShape = {
  shape: keyof typeof SHAPES;
  className: string;
  drift: number;
};

export function LineShapes({ shapes }: { shapes: LineShape[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {shapes.map((item, index) => (
        <svg
          key={index}
          data-drift={item.drift}
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("absolute size-10", item.className)}
        >
          {SHAPES[item.shape]}
        </svg>
      ))}
    </div>
  );
}
