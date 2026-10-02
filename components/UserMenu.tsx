"use client";

import { Menu } from "@base-ui/react/menu";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";
import { useSignOut } from "@/lib/use-sign-out";
import type { Role } from "@/lib/auth";

const roleLabels: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

/**
 * The signed-in user's card at the foot of a sidebar. Clicking it opens a menu
 * with the sign-out action.
 */
export function UserMenu({
  variant = "muted",
}: {
  /** `muted` sits on a white sidebar; `card` sits on a grey footer. */
  variant?: "muted" | "card";
}) {
  const { data: session, isPending } = useQuery(sessionQuery());
  const signOut = useSignOut();
  const user = session?.user;

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={isPending}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500",
          variant === "card"
            ? "bg-white shadow-sm hover:bg-neutral-50 data-[popup-open]:bg-neutral-50"
            : "bg-neutral-100 hover:bg-neutral-200 data-[popup-open]:bg-neutral-200"
        )}
      >
        <UserAvatar
          user={{
            name: user?.name ?? "Account",
            avatar: user?.image ?? "/default-avatar.png",
          }}
          isLoading={isPending}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {isPending ? (
            <>
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="mt-1.5 h-2 w-14 rounded-full" />
            </>
          ) : (
            <>
              <span className="truncate text-sm font-bold text-neutral-900">
                {user?.displayName ?? user?.name ?? "Account"}
              </span>
              <span className="mt-0.5 truncate text-xs text-neutral-500">
                {user ? roleLabels[user.role] : "Not signed in"}
              </span>
            </>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-neutral-300 bg-white p-1 shadow-lg outline-none">
            {user?.email && (
              <p className="truncate px-3 pt-2 pb-1.5 text-xs text-neutral-500">
                {user.email}
              </p>
            )}
            <Menu.Item
              closeOnClick={false}
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-semantic-text-error outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-semantic-surface-error-badge"
            >
              <LogOut className="h-4 w-4" />
              {signOut.isPending ? "Logging out…" : "Log out"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
