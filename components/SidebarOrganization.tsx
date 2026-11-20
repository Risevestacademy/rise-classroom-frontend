"use client";

import { useQuery } from "@tanstack/react-query";

import { PersonAvatar } from "@/components/PersonAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";

/**
 * The signed-in user's organisation at the foot of a sidebar. The session has
 * no logo yet, so the avatar shows the organisation's initials.
 */
export function SidebarOrganization() {
  const { data: session, isPending } = useQuery(sessionQuery());
  const name = session?.user.organizationName;

  if (!isPending && !name) return null;

  return (
    <div className="mx-6 mb-3 flex items-center gap-3 border-t border-border-default bg-surface-default p-2">
      {isPending ? (
        <>
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </>
      ) : (
        <>
          <PersonAvatar
            name={name!}
            colorKey={session?.user.organizationId ?? undefined}
            size={40}
          />
          <span className="truncate text-sm/5 font-medium tracking-[-0.14px] text-text-primary">
            {name}
          </span>
        </>
      )}
    </div>
  );
}
