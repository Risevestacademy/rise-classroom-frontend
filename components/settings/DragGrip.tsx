import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

/* The handle an item is dragged by. Takes `handleProps` from `useDragReorder`. */
export function DragGrip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      {...props}
      aria-hidden
      className={cn(
        "flex shrink-0 cursor-grab items-center justify-center text-icon-primary active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="size-5" />
    </span>
  );
}
