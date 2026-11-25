"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Mail,
  Phone,
  SquarePen,
  UserRound,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import { LoadErrorPanel } from "@/components/control-tower/ControlTowerParts";
import {
  EDIT_PROFILE_PATH,
  HELP_PATH,
  LogOutDialog,
  NOTIFICATION_SETTINGS_PATH,
  PROFILE_PATH,
  SectionCard,
} from "@/components/student-settings/ProfileParts";
import { ProfilePhoto } from "@/components/student-settings/ChangePhotoDialog";
import {
  currentMembership,
  displayNameOf,
  fullNameOf,
  profileQueries,
  type MyProfile,
} from "@/lib/profile";

const links = [
  {
    href: EDIT_PROFILE_PATH,
    icon: SquarePen,
    title: "Edit profile",
    description: "Update your display name and phone number",
  },
  {
    href: NOTIFICATION_SETTINGS_PATH,
    icon: Bell,
    title: "Notification settings",
    description: "Choose what you want to be notified about",
  },
  {
    href: HELP_PATH,
    icon: CircleHelp,
    title: "Help and support",
    description: "Answers to common questions",
  },
];

export default function StudentProfilePage() {
  const profile = useQuery(profileQueries.me());
  const [logOutOpen, setLogOutOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your account, mentor group and attendance
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {profile.isPending ? (
            <ProfileSummarySkeleton />
          ) : profile.error || !profile.data ? (
            <LoadErrorPanel
              title="Couldn’t load your profile"
              onRetry={() => profile.refetch()}
            />
          ) : (
            <ProfileSummary profile={profile.data} />
          )}
          <AttendanceCard />
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard className="overflow-hidden">
            <ul className="divide-y divide-neutral-200">
              {links.map(({ href, icon: Icon, title, description }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-neutral-800">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {description}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <Button
            variant="secondary"
            size="medium"
            className="w-full bg-white text-neutral-800"
            onClick={() => setLogOutOpen(true)}
          >
            <LogOut />
            Log out
          </Button>
        </div>
      </div>

      <LogOutDialog open={logOutOpen} onOpenChange={setLogOutOpen} />
      <React.Suspense>
        <UpdatedToast />
      </React.Suspense>
    </div>
  );
}

/** Confirms a save from the edit page, which sends the student back with `?updated=1`. */
function UpdatedToast() {
  const router = useRouter();
  const updated = useSearchParams().get("updated") === "1";
  const dismiss = React.useCallback(() => router.replace(PROFILE_PATH), [router]);

  if (!updated) return null;
  return (
    <SuccessToast
      tone="success"
      title="Profile updated"
      message="Your changes have been saved."
      onDismiss={dismiss}
    />
  );
}

function ProfileSummary({ profile }: { profile: MyProfile }) {
  const mentor = useQuery(profileQueries.mentor());
  const name = displayNameOf(profile);
  const membership = currentMembership(profile);
  const [photoSaved, setPhotoSaved] = React.useState(false);

  const mentorValue = mentor.isPending ? (
    <Skeleton className="mt-1 h-4 w-20" />
  ) : mentor.error ? (
    "Couldn’t load your mentor"
  ) : mentor.data ? (
    mentor.data.mentor.name
  ) : (
    "Not assigned yet"
  );

  return (
    <>
      <SectionCard className="flex items-center gap-4 p-4 sm:p-5">
        <ProfilePhoto profile={profile} onSaved={() => setPhotoSaved(true)} />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-neutral-800">{name}</p>
          {membership && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {membership.track && (
                <Badge variant="light" status="info" size="sm">
                  {membership.track.name}
                </Badge>
              )}
              {membership.cohort && (
                <span className="text-xs text-neutral-500">{membership.cohort.name}</span>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="flex flex-col gap-4 p-4 sm:p-5">
        <DetailRow icon={UserRound} label="Full name" value={fullNameOf(profile)} />
        <DetailRow icon={Mail} label="Email" value={profile.email} />
        <DetailRow icon={Phone} label="Phone" value={profile.phoneNumber || "Not added"} />
        <DetailRow icon={Users} label="Mentor" value={mentorValue} />
      </SectionCard>

      {photoSaved && (
        <SuccessToast
          tone="success"
          title="Photo updated"
          message="Your new profile photo has been saved."
          onDismiss={() => setPhotoSaved(false)}
        />
      )}
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        <div className="truncate text-sm font-medium text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

/*
 * PENDING-BACKEND: the API has no attendance endpoint for students yet, so
 * the card says so instead of showing a made-up percentage. When it lands,
 * show `attended / total` here with the progress bar from the design.
 */
function AttendanceCard() {
  return (
    <SectionCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">Attendance</p>
        <span className="text-sm font-semibold text-neutral-400">—</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-neutral-100" />
      <p className="mt-2 text-xs text-neutral-500">
        Your attendance will show here once your live classes are tracked.
      </p>
    </SectionCard>
  );
}

function ProfileSummarySkeleton() {
  return (
    <>
      <SectionCard className="flex items-center gap-4 p-4 sm:p-5">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </SectionCard>
      <SectionCard className="flex flex-col gap-4 p-4 sm:p-5">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </SectionCard>
    </>
  );
}
