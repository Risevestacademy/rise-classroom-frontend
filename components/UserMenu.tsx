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
  MENTOR: "Mentor",
  STUDENT: "Student",
};

/**
 * The signed-in user's card at the foot of a sidebar. Clicking it opens a menu
 * with the sign-out action, unless `withMenu` is off (the admin area signs out
 * from the top nav instead).
 */
export function UserMenu({
  variant = "muted",
  subtitle = "role",
  withMenu = true,
}: {
  /**
   * `muted` sits on a white sidebar; `card` sits on a grey footer; `plain` is
   * flat with no background or chevron.
   */
  variant?: "muted" | "card" | "plain" | "plain-white";
  /** What to show under the name: the user's role (default) or their email. */
  subtitle?: "role" | "email";
  withMenu?: boolean;
}) {
  const { data: session, isPending } = useQuery(sessionQuery());
  const signOut = useSignOut();
  const user = session?.user;

  const details = (
    <>
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
            <span className="truncate text-sm font-bold text-neutral-800">
              {user?.displayName ?? user?.name ?? "Account"}
            </span>
            <span className="mt-0.5 truncate text-xs text-neutral-400">
              {user
                ? subtitle === "email" && user.email
                  ? user.email
                  : roleLabels[user.role]
                : "Not signed in"}
            </span>
          </>
        )}
      </div>
    </>
  );

  if (!withMenu) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3",
          variant === "card"
            ? "rounded-2xl bg-white p-3 shadow-sm"
            : variant === "plain"
              ? "rounded-xl p-2"
              : variant === "plain-white"
                ? "rounded-xl p-2"
                : "rounded-2xl bg-neutral-50 p-3"
        )}
      >
        {details}
      </div>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={isPending}
        className={cn(
          "flex w-full items-center gap-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary",
          variant === "card"
            ? "rounded-2xl bg-white p-3 shadow-sm hover:bg-neutral-0 data-[popup-open]:bg-neutral-0"
            : variant === "plain"
              ? "rounded-xl p-2 hover:bg-neutral-100 data-[popup-open]:bg-neutral-100"
              : variant === "plain-white"
                ? "rounded-xl p-2 bg-white hover:bg-white data-[popup-open]:bg-white"
                : "rounded-2xl bg-neutral-50 p-3 hover:bg-neutral-100 data-[popup-open]:bg-neutral-100"
        )}
      >
        {details}
        {variant !== "plain" && (
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-300" />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-[var(--anchor-width)] rounded-xl border border-neutral-200 bg-white p-1 shadow-lg outline-none">
            {user?.email && (
              <p className="truncate px-3 pt-2 pb-1.5 text-xs text-neutral-400">
                {user.email}
              </p>
            )}
            <Menu.Item
              closeOnClick={false}
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-error outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-error-badge"
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