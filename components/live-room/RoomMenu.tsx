import * as React from "react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// The shared dropdown menu, dressed for the dark room.

const item =
  "gap-2.5 rounded-lg px-3 py-2 text-sm text-room-text-strong focus:bg-room-control focus:text-white not-data-[variant=destructive]:focus:**:text-white data-[variant=destructive]:text-[#ff8a80] data-[variant=destructive]:focus:bg-room-leave/20 data-[variant=destructive]:focus:text-[#ffb4ab] [&_svg]:size-[18px] [&_svg]:text-room-text-muted";

export function RoomMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      className={cn(
        "min-w-0 rounded-xl bg-room-bar p-1.5 text-room-text-strong shadow-[0_8px_24px_rgb(0_0_0/0.5)] ring-1 ring-white/10",
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
  return <DropdownMenuRadioItem className={cn(item, "pr-9 [&_svg]:text-room-active", className)} {...props} />;
}

export function RoomMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={cn("px-3 pt-2 pb-1 text-xs text-room-text-muted", className)} {...props} />;
}

export function RoomMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return <DropdownMenuSeparator className={cn("mx-0 my-1.5 bg-white/10", className)} {...props} />;
}
