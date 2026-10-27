"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";

import { MoreHorizontal, MoreVertical } from "@/assets/icons";
import { EditUserDialog } from "@/components/EditUserDialog";
import { buttonVariants } from "@/components/ui/button";
import { getUpdateUserErrorMessage, updateUser } from "@/lib/admin";
import type { Mentor } from "@/lib/mentors";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

const itemClass =
  "flex cursor-pointer p-2 text-text-primary outline-none data-highlighted:bg-neutral-200 data-[disabled]:cursor-not-allowed data-[disabled]:text-text-muted";

/**
 * The mentor actions menu: the "…" on a mentors list row, or the "⋮" button
 * on the mentor profile, which leaves out View profile. PENDING-BACKEND:
 * assigning students has no picker design and there's no delete endpoint,
 * so those items don't do anything yet.
 */
export function MentorActionsMenu({
  mentor,
  placement = "row",
}: {
  mentor: Mentor;
  placement?: "row" | "profile";
}) {
  const queryClient = useQueryClient();
  const { data: session } = useQuery(sessionQuery());
  const [editOpen, setEditOpen] = React.useState(false);
  const canManage = session?.user.role === "SUPERADMIN";

  // Suspending the account is how a mentor is deactivated; Edit mentor can
  // set them back to active.
  const deactivate = useMutation({
    mutationFn: () => updateUser(mentor.id, { status: "SUSPENDED" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <>
      <Menu.Root onOpenChange={(open) => open && deactivate.reset()}>
        <Menu.Trigger
          aria-label={`${mentor.name} actions`}
          className={
            placement === "row"
              ? "flex size-8 items-center justify-center text-text-primary"
              : cn(
                  buttonVariants({ variant: "tertiary", size: "medium" }),
                  "w-10 cursor-pointer px-0 text-icon-primary",
                )
          }
        >
          {placement === "row" ? (
            <MoreHorizontal className="size-6" />
          ) : (
            <MoreVertical className="size-5" />
          )}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4} className="z-50">
            <Menu.Popup className="flex flex-col gap-3 bg-surface-subtle p-2.5 font-work text-sm shadow-[0_1px_3px_rgb(0_0_0/0.15)] outline-none">
              {placement === "row" && (
                <Menu.LinkItem
                  className={itemClass}
                  render={<Link href={`/admin/mentors/${mentor.id}`} />}
                >
                  View profile
                </Menu.LinkItem>
              )}
              <Menu.Item
                disabled={!canManage}
                onClick={() => setEditOpen(true)}
                className={itemClass}
              >
                Edit mentor
              </Menu.Item>
              <Menu.Item className={itemClass}>Assign students</Menu.Item>
              <Menu.Item
                disabled={
                  !canManage ||
                  mentor.status === "inactive" ||
                  deactivate.isPending
                }
                closeOnClick={false}
                onClick={() => deactivate.mutate()}
                className={cn(itemClass, deactivate.isError && "text-text-error")}
              >
                {deactivate.isPending
                  ? "Deactivating…"
                  : deactivate.isError
                    ? getUpdateUserErrorMessage(deactivate.error)
                    : "Deactivate mentor"}
              </Menu.Item>
              <Menu.Item className="flex cursor-pointer p-2 text-text-error outline-none data-highlighted:bg-neutral-200">
                Delete mentor
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <EditUserDialog
        user={mentor.user}
        open={editOpen}
        onOpenChange={setEditOpen}
        isSelf={session?.user.id === mentor.id}
      />
    </>
  );
}
