import * as React from "react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// The shared dropdown menu, dressed as the design's dark context menu.

const item =
  "gap-3 rounded-lg px-2 py-[5px] text-sm font-medium text-white focus:bg-white/10 focus:text-white not-data-[variant=destructive]:focus:**:text-white data-[variant=destructive]:text-room-danger data-[variant=destructive]:focus:bg-room-danger/10 data-[variant=destructive]:focus:text-room-danger [&_svg]:size-[18px] data-[variant=destructive]:*:[svg]:text-room-danger";

export function RoomMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      className={cn(
        "min-w-0 rounded-2xl border border-room-menu-border bg-room-menu p-2 text-white shadow-[0_8px_24px_rgb(0_0_0/0.5)] ring-0",
        className,
      )}
      {...props}
    />
  );
}

export function RoomMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuItem>) {
  return <DropdownMenuItem className={cn(item, className)} {...props} />;
}

export function RoomMenuRadioItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuRadioItem>) {
  return <DropdownMenuRadioItem className={cn(item, "pr-8 [&_svg]:text-room-active", className)} {...props} />;
}

export function RoomMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={cn("px-2 pt-2 pb-1 text-xs text-room-text-muted", className)} {...props} />;
}

export function RoomMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return <DropdownMenuSeparator className={cn("mx-0 my-1.5 bg-white/10", className)} {...props} />;
}
