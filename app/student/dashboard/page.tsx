"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  Video,
  ArrowRight,
  ExternalLink,
  Radar,
} from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";

/**
 * Replicates the "Home WIP" Figma screen (node 1832-4938), the only student
 * home design that exists, adapted for desktop. There is no `/student/*` API
 * yet, so the lesson/class content below is static placeholder data. The
 * "Your Week" Control Tower teaser only becomes visible in Figma once the
 * date-picker overlay (node 857-9831) is opened over this same screen.
 */

const lesson = {
  track: "Design Systems",
  lesson: "Buttons & Text Input",
  week: "Week 30 · Lesson 4",
  progress: 70,
};

const upcomingClass = {
  title: "Rise Academy Live Class",
  date: "Wednesday, Sep 24, 2026",
  time: "6PM – 8PM",
  location: "Rise Campus",
  link: "meet.google.com/eda/kxy-zyz",
};

export default function StudentDashboardPage() {
  const session = useQuery(sessionQuery());
  const user = session.data?.user;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={{
              name: user?.name ?? "Account",
              avatar: user?.image ?? "/default-avatar.png",
            }}
            isLoading={session.isPending}
          />
          <div>
            {session.isPending ? (
              <>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-neutral-900">
                  {user?.displayName ?? user?.name ?? "Student"}
                </p>
                {/* Mocked — students have no enrolled-track field yet. */}
                <p className="text-sm font-medium text-primary-500">
                  Product Design
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Calendar"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:text-neutral-700"
          >
            <Calendar className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:text-neutral-700"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Continue Learning
          </h2>

          <div className="flex flex-col gap-3 rounded-2xl bg-neutral-200 p-4">
            <div className="relative h-[90px] overflow-hidden rounded-lg bg-[#E8F5F6] p-4">
              <span className="absolute top-3 left-6 h-12 w-12 rounded-full bg-primary-200/60" />
              <span className="absolute -top-4 left-14 h-16 w-16 rounded-full bg-primary-300/50" />
              <span className="absolute right-6 bottom-0 h-14 w-14 rounded-full bg-primary-300/40" />
              <p className="relative text-lg font-bold text-neutral-900">
                {lesson.track}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-900">
                {lesson.lesson}
              </p>
              <p className="text-xs text-neutral-500">{lesson.week}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-2 flex-1 rounded-full bg-neutral-300">
                <div
                  className="h-2 rounded-full bg-semantic-text-success"
                  style={{ width: `${lesson.progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-neutral-700">
                {lesson.progress}% Complete
              </span>
              <button
                type="button"
                aria-label="Continue lesson"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Upcoming
          </h2>

          <div className="flex flex-col gap-3 rounded-lg bg-neutral-200 p-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {upcomingClass.title}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {upcomingClass.date}
              </p>
              <p className="text-xs text-neutral-500">{upcomingClass.time}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Video className="h-4 w-4 shrink-0 text-neutral-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {upcomingClass.location}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-neutral-500">
                    {upcomingClass.link}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-white"
              >
                Join
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Your Week
        </h2>

        <Link
          href="/student/control-tower"
          className="flex items-center justify-between gap-4 rounded-lg border border-neutral-300 bg-white p-4 hover:bg-neutral-200/60"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5F6] text-primary-500">
              <Radar className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Control Tower
              </p>
              <p className="text-xs text-neutral-500">
                Set your goals, track your progress, and reflect on your
                week.
              </p>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
