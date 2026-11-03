"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";

import { MoreVertical } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUpdateUserErrorMessage,
  updateUser,
  type AdminUser,
} from "@/lib/admin";
import { cn } from "@/lib/utils";
import { sessionQuery } from "@/lib/session-query";

export function UserMoreActions({ user }: { user: AdminUser }) {
  const { data: session } = useQuery(sessionQuery());
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const canManage = session?.user.role === "SUPERADMIN";
  const isSelf = session?.user.id === user.id;
  const alreadySuspended = user.status === "SUSPENDED";

  const actionHint = !canManage
    ? "Only super admins can do this"
    : isSelf && !alreadySuspended
      ? "You can't suspend your own account"
      : undefined;

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label="More actions"
          render={
            <Button
              variant="tertiary"
              size="medium"
              className="w-10 px-0 text-icon-primary"
            />
          }
        >
          <MoreVertical className="size-5" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup className="z-50 w-52 rounded-lg border border-neutral-200 bg-neutral-0 py-1 text-sm shadow-lg outline-none">
              <Menu.Item
                disabled={Boolean(actionHint)}
                title={actionHint}
                onClick={() => setConfirmOpen(true)}
                className={cn(
                  "block cursor-pointer px-3 py-2 outline-none hover:bg-neutral-50 data-[highlighted]:bg-neutral-50 data-[disabled]:cursor-not-allowed data-[disabled]:text-neutral-300",
                  alreadySuspended
                    ? "text-neutral-700"
                    : "text-semantic-text-error",
                )}
              >
                {alreadySuspended ? "Reactivate user" : "Suspend user"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <SuspendUserDialog
        user={user}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  );
}

function SuspendUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-130">
        {open && <SuspendUserForm user={user} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function SuspendUserForm({
  user,
  onOpenChange,
}: {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const reactivating = user.status === "SUSPENDED";
  const name = user.displayName ?? user.name;

  const suspend = useMutation({
    mutationFn: () =>
      updateUser(user.id, { status: reactivating ? "ACTIVE" : "SUSPENDED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onOpenChange(false);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{reactivating ? "Reactivate user" : "Suspend user"}</DialogTitle>
        <DialogDescription>
          {reactivating
            ? `Reactivate ${name}? They'll be able to sign in again.`
            : `Suspend ${name}? This signs them out everywhere.`}
        </DialogDescription>
      </DialogHeader>

      {suspend.isError && (
        <p className="mt-4 text-sm text-semantic-text-error">
          {getUpdateUserErrorMessage(suspend.error)}
        </p>
      )}

      <DialogFooter className="mt-6 sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          disabled={suspend.isPending}
          onClick={() => suspend.mutate()}
        >
          {suspend.isPending
            ? reactivating
              ? "Reactivating…"
              : "Suspending…"
            : reactivating
              ? "Reactivate user"
              : "Suspend user"}
        </Button>
      </DialogFooter>
    </>
  );
}