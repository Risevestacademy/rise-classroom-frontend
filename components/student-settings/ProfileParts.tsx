"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSignOut } from "@/lib/use-sign-out";

export const PROFILE_PATH = "/student/profile";
export const EDIT_PROFILE_PATH = `${PROFILE_PATH}/edit`;
export const NOTIFICATION_SETTINGS_PATH = `${PROFILE_PATH}/notifications`;
export const HELP_PATH = `${PROFILE_PATH}/help`;

/** The narrow centred column the profile sub-pages sit in. */
export function ProfileColumn({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-150 flex-col gap-6">{children}</div>;
}

/** Back button, "Profile > <page>" trail, then the page title. */
export function ProfileSubpageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Profile" className="flex items-center gap-3 text-sm">
        <Link
          href={PROFILE_PATH}
          aria-label="Back to profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <ol className="flex min-w-0 items-center gap-2">
          <li>
            <Link href={PROFILE_PATH} className="text-neutral-500 hover:text-neutral-800">
              Profile
            </Link>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
            <span aria-current="page" className="truncate text-neutral-800">
              {title}
            </span>
          </li>
        </ol>
      </nav>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function LogOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const signOut = useSignOut();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="flex w-[370px] flex-col sm:p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-800">
          <LogOut className="h-4 w-4" />
        </span>
        <DialogTitle className="mt-5 text-base font-semibold">Log out?</DialogTitle>
        <DialogDescription className="mt-1 text-neutral-500">
          You&apos;ll need to sign in again to get back to your classes.
        </DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <DialogClose
            render={
              <Button variant="secondary" size="medium" className="text-neutral-800" />
            }
          >
            Cancel
          </DialogClose>
          <Button
            size="medium"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            {signOut.isPending ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
