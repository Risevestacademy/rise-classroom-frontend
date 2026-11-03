"use client";

import Link from "next/link";

import {
  Calendar03,
  CancelCircle,
  CheckmarkCircle03,
  Message01,
  MoreVertical,
} from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/lib/admin";
// PENDING-BACKEND: there are no mentorship sessions yet, so the session totals
// and upcoming sessions are the design's sample data.
import { mentorship } from "@/app/admin/students/[id]/profile-data";
import { BrandBadge, Card, CardHeader } from "./shared";

// Each session total sits on its own tint, as on the design's canvas.
const sessionStats = [
  {
    title: "Total sessions",
    value: mentorship.sessions.total,
    icon: Calendar03,
    className: "bg-surface-info-badge text-icon-info",
  },
  {
    title: "Attended",
    value: mentorship.sessions.attended,
    icon: CheckmarkCircle03,
    className: "bg-surface-success-badge text-icon-success",
  },
  {
    title: "Missed",
    value: mentorship.sessions.missed,
    icon: CancelCircle,
    className: "bg-surface-error-badge text-icon-error",
  },
];

/**
 * The student's mentor, from the student record. A mentorship is made within
 * the student's cohort and track, so those are the student's.
 */
export function MentorshipTab({
  mentor,
  track,
  cohort,
}: {
  mentor: AdminUser["mentor"];
  track?: string;
  cohort?: string;
}) {
  if (!mentor) {
    return (
      <Card>
        <CardHeader title="Assigned mentor" />
        <p className="font-work text-sm text-text-muted">
          No mentor assigned yet.
        </p>
      </Card>
    );
  }

  const name = mentor.displayName ?? mentor.name;
  const suspended = mentor.status === "SUSPENDED";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Assigned mentor" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <PersonAvatar
              name={name}
              src={mentor.image}
              colorKey={mentor.id}
              size={80}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-col">
                <Link
                  href={`/admin/mentors/${mentor.id}`}
                  className="truncate text-xl font-semibold text-text-primary hover:underline"
                >
                  {name}
                </Link>
                {/* PENDING-BACKEND: the API has no job title for a mentor. */}
                <p className="truncate font-work text-sm text-text-secondary">
                  --
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {track && (
                  <BrandBadge size="lg" className="text-text-info">
                    {track}
                  </BrandBadge>
                )}
                <BrandBadge
                  size="lg"
                  className={suspended ? "text-text-error" : "text-text-success"}
                >
                  {suspended ? "Suspended" : "Active"}
                </BrandBadge>
                {cohort && (
                  <BrandBadge size="lg" className="text-text-info">
                    {cohort}
                  </BrandBadge>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* PENDING-BACKEND: there's no messaging yet. */}
            <Button variant="tertiary" size="medium">
              <Message01 className="size-[18px]" />
              Message
            </Button>
            {/* The design has no menu for this button yet. */}
            <Button
              variant="tertiary"
              size="medium"
              aria-label="More actions"
              className="w-10 px-0 text-icon-primary"
            >
              <MoreVertical className="size-5" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,836fr)_minmax(0,284fr)]">
        <Card>
          <CardHeader title="Mentorship sessions" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sessionStats.map(({ title, value, icon: Icon, className }) => (
              <div
                key={title}
                className={`flex min-h-[120px] items-start gap-3 rounded-xl p-5 shadow-[0_1px_3px_rgb(0_0_0/0.15)] ${className}`}
              >
                <Icon className="size-8 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-text-primary">
                    {title}
                  </p>
                  <p className="text-2xl leading-8 font-semibold text-black">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-3">
          <CardHeader size="h4" title="Upcoming session" />
          <div aria-hidden className="h-2" />
          <ul className="flex flex-col gap-3">
            {mentorship.upcoming.map((session, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-brand text-icon-info">
                  <Calendar03 className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1 font-work">
                  <p className="text-sm font-medium text-text-primary">
                    {session.date}
                  </p>
                  <p className="text-[13px]/[18px] text-text-secondary">
                    {session.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
