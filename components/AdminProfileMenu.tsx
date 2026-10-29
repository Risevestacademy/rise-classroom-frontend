"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";

import {
  AlertCircle,
  CustomerService01,
  Happy,
  HelpCircle,
  Logout01,
  Settings01,
  User,
} from "@/assets/icons";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import type { FeedbackKind } from "@/lib/feedback";
import { sessionQuery } from "@/lib/session-query";
import { useSignOut } from "@/lib/use-sign-out";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

const roleLabels: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  INSTRUCTOR: "Instructor",
  MENTOR: "Mentor",
  STUDENT: "Student",
};

const itemClass =
  "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-neutral-800 outline-none transition-colors data-[highlighted]:bg-neutral-100";

const popupClass =
  "origin-[var(--transform-origin)] rounded-3xl border border-neutral-100 bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.08)] outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const feedbackItems: {
  kind: FeedbackKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { kind: "problem", label: "Report a problem", icon: AlertCircle },
  { kind: "improvement", label: "Suggest an improvement", icon: Lightbulb },
  { kind: "experience", label: "Share your experience", icon: Happy },
];

/**
 * The signed-in admin in the top nav. Clicking opens the account menu, which
 * holds the only sign-out action in the admin area and the feedback forms.
 */
export function AdminProfileMenu() {
  const { data: session, isPending } = useQuery(sessionQuery());
  const signOut = useSignOut();
  // The dialog lives outside the menu, which unmounts when it closes.
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const user = session?.user;
  const name = user?.displayName ?? user?.name ?? "Account";
  const avatar = (
    <PersonAvatar name={name} src={user?.image} colorKey={user?.id} size={36} />
  );

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          disabled={isPending}
          className="flex items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
        >
          {isPending ? (
            <Skeleton className="size-[36px] rounded-full" />
          ) : (
            avatar
          )}
          {isPending ? (
            <div className="hidden flex-col gap-1 sm:flex">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ) : (
            <div className="hidden flex-col sm:flex">
              <span className="font-work text-sm font-medium tracking-[-0.14px] text-text-primary">
                {name}
              </span>
              <span className="font-work text-[13px] leading-[18px] text-text-secondary">
                {user ? roleLabels[user.role] : "Not signed in"}
              </span>
            </div>
          )}
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={8}
            className="z-50"
          >
            <Menu.Popup className={cn("w-72", popupClass)}>
              <div className="mb-2 flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-work text-sm font-medium text-neutral-800">
                    {name}
                  </span>
                  {user?.email && (
                    <span className="mt-0.5 truncate font-work text-sm text-neutral-400">
                      {user.email}
                    </span>
                  )}
                </div>
                {avatar}
              </div>

              <MenuLink href="/admin/profile" icon={User}>
                Profile
              </MenuLink>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger
                  openOnHover
                  className={cn(itemClass, "data-popup-open:bg-neutral-100")}
                >
                  <HelpCircle className="h-5 w-5 shrink-0" />
                  Help &amp; Feedback
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner
                    side="left"
                    align="start"
                    sideOffset={12}
                    className="z-50"
                  >
                    <Menu.Popup className={cn("w-64", popupClass)}>
              
                      <MenuLink href="#" icon={CustomerService01}>
                        Help center
                      </MenuLink>
                      {feedbackItems.map(({ kind, label, icon: Icon }) => (
                        <Menu.Item
                          key={kind}
                          onClick={() => setFeedbackKind(kind)}
                          className={itemClass}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {label}
                        </Menu.Item>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
              <MenuLink href="/admin/settings" icon={Settings01}>
                Settings
              </MenuLink>

              <Menu.Separator className="my-2 h-px bg-neutral-200" />

              <Menu.Item
                closeOnClick={false}
                disabled={signOut.isPending}
                onClick={() => signOut.mutate()}
                className={cn(
                  itemClass,
                  "text-text-error data-[disabled]:opacity-50 data-[highlighted]:bg-surface-error-badge",
                )}
              >
                <Logout01 className="h-5 w-5 shrink-0" />
                {signOut.isPending ? "Signing out…" : "Sign out"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <FeedbackDialog
        kind={feedbackKind}
        onOpenChange={(open) => {
          if (!open) setFeedbackKind(null);
        }}
        onSubmitted={() => {
          setFeedbackKind(null);
          setShowThanks(true);
        }}
      />

      {showThanks && (
        <SuccessToast
          title="Thanks for your feedback"
          message="We read every message and use it to improve Rise Classroom."
          onDismiss={() => setShowThanks(false)}
        />
      )}
    </>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Menu.LinkItem render={<Link href={href} />} className={itemClass}>
      <Icon className="h-5 w-5 shrink-0" />
      {children}
    </Menu.LinkItem>
  );
}
