"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { EditUserDialog } from "@/components/EditUserDialog";
import {
  getResendInviteErrorMessage,
  resendInvite,
  type AdminUser,
} from "@/lib/admin";
import { sessionQuery } from "@/lib/session-query";

export function UserRowActions({ user }: { user: AdminUser }) {
  const { data: session } = useQuery(sessionQuery());
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const canManage = session?.user.role === "SUPERADMIN";
  const canResend = user.onboardingStatus === "INVITED";
  const isSelf = session?.user.id === user.id;

  const resend = useMutation({
    mutationFn: () => resendInvite(user.id),
  });

  function handleMenuOpenChange(open: boolean) {
    if (open) resend.reset();
    setMenuOpen(open);
  }

  const resendLabel = resend.isPending
    ? "Sending…"
    : resend.isSuccess
      ? "Invite resent"
      : resend.isError
        ? getResendInviteErrorMessage(resend.error)
        : "Resend invite";

  const restrictedHint = canManage ? undefined : "Only super admins can do this";

  return (
    <div
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
    >
      <Menu.Root open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <Menu.Trigger
          aria-label="Row actions"
          className="text-neutral-400 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup className="z-50 w-52 rounded-lg border border-neutral-200 bg-neutral-0 py-1 text-sm shadow-lg outline-none">
              <Menu.Item
                disabled={!canManage}
                title={restrictedHint}
                onClick={() => setEditOpen(true)}
                className="block cursor-pointer px-3 py-2 text-neutral-700 outline-none hover:bg-neutral-50 data-[highlighted]:bg-neutral-50 data-[disabled]:cursor-not-allowed data-[disabled]:text-neutral-300"
              >
                Edit user
              </Menu.Item>

              <Menu.Item
                disabled={!canManage || !canResend || resend.isPending}
                closeOnClick={false}
                title={
                  !canManage
                    ? restrictedHint
                    : canResend
                      ? undefined
                      : "This person has already finished onboarding"
                }
                onClick={() => resend.mutate()}
                className={cn(
                  "block cursor-pointer px-3 py-2 whitespace-normal outline-none hover:bg-neutral-50 data-[highlighted]:bg-neutral-50 data-[disabled]:cursor-not-allowed data-[disabled]:text-neutral-300",
                  resend.isError ? "text-semantic-text-error" : "text-neutral-700",
                  resend.isSuccess && "text-semantic-text-success",
                )}
              >
                {resendLabel}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <EditUserDialog
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
        isSelf={isSelf}
      />
    </div>
  );
}
