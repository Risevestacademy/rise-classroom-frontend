"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Users,
  Layers,
  HelpCircle,
  Video,
  FileClock,
  Calendar,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { instructorQueries, type WeeklyTaskStatus } from "@/lib/instructor";
import { sessionQuery } from "@/lib/session-query";

const metrics = [
  {
    label: "Pending reviews",
    value: "2",
    icon: Users,
    iconBg: "bg-semantic-surface-info-badge",
    iconColor: "text-semantic-text-info",
  },
  {
    label: "Upcoming content",
    value: "3",
    icon: Layers,
    iconBg: "bg-success-50",
    iconColor: "text-success-500",
  },
  {
    label: "Student questions",
    value: "1",
    icon: HelpCircle,
    iconBg: "bg-primary-50",
    iconColor: "text-primary-500",
  },
  {
    label: "Live sessions today",
    value: "0",
    icon: Video,
    iconBg: "bg-semantic-surface-error-badge",
    iconColor: "text-semantic-text-error",
  },
];

const tracks = [
  {
    title: "Product Design",
    studentsCount: 50,
    modulesCount: 4,
    progressPercent: 68,
    nextModule: "User Research (Module 3)",
  },
];

const upcomingItems = [
  {
    type: "Assignment deadline",
    title: "User Research Report",
    course: "Product Design",
    badge: "Today 11:59PM",
    badgeStyle:
      "bg-semantic-surface-error-badge text-semantic-text-error border-semantic-border-error",
  },
  {
    type: "Content to publish",
    title: "Design Systems",
    course: "Product Design",
    badge: "Tomorrow 10:00AM",
    badgeStyle:
      "bg-semantic-surface-warning-badge text-semantic-text-warning border-semantic-border-warning",
  },
  {
    type: "Assignment review",
    title: "UI Design Portfolio",
    course: "Product Design",
    badge: "Oct 2",
    badgeStyle: "bg-neutral-200 text-neutral-600 border-neutral-300",
  },
];

const recentActivities = [
  {
    title: "Michael Taiwo submitted an assignment",
    meta: "Design Thinking • 2h ago",
    badge: "Review",
    badgeStyle:
      "bg-semantic-surface-warning-badge text-semantic-text-warning border-semantic-border-warning",
  },
  {
    title: "Aisha Bello received feedback",
    meta: "Product Design • 4h ago",
    badge: "Sent",
    badgeStyle:
      "bg-semantic-surface-success-badge text-semantic-text-success border-semantic-border-success",
  },
  {
    title: "New student joined",
    meta: "Product Design • 5h ago",
    badge: "New",
    badgeStyle:
      "bg-semantic-surface-info-badge text-semantic-text-info border-semantic-border-info",
  },
];

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardOverview() {
   const session = useQuery(sessionQuery());
  const myTracks = useQuery(instructorQueries.myTracks());
   const instructorName = session.data?.user.firstName ?? "Instructor";

  return (
    <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {greeting()}, {instructorName}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Here's what's happening in your tracks today.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <div id="cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex items-start gap-3 rounded-xl border border-neutral-300 bg-neutral-50 h-21 p-4 shadow-xs"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  metric.iconBg
                )}
              >
                <Icon className={cn("h-4 w-4", metric.iconColor)} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-600">
                  {metric.label}
                </span>
                <span className="text-xl font-bold text-neutral-900 mt-1">
                  {metric.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-neutral-900">My Tracks</h2>
          <p className="text-xs text-neutral-500">
            Overall progress across the tracks you teach
          </p>
        </div>

        {tracks && tracks.length > 0 ? (
          <div className="space-y-4">
            {tracks.map((track, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-300 p-5 space-y-4 bg-white"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {track.studentsCount} students • {track.modulesCount} modules
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${track.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800">
                      {track.progressPercent}% complete
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600">
                  <span className="font-medium text-neutral-900">Next:</span>{" "}
                  {track.nextModule}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 mb-3">
              <FileClock className="h-7 w-7 text-[#0D6D78]" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">
              No tracks assigned yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mt-1">
              Once an admin assigns you a track, it will show up here.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-semantic-surface-error-badge text-semantic-text-error">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Upcoming</h2>
              <p className="text-xs text-neutral-500">
                Items that may need your attention
              </p>
            </div>
          </div>

          {upcomingItems && upcomingItems.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {upcomingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-neutral-900">
                      {item.type} <span className="font-normal text-neutral-400">•</span> {item.title}
                    </p>
                    <p className="text-xs text-neutral-500">{item.course}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                      item.badgeStyle
                    )}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 mb-3">
                <FileClock className="h-7 w-7 text-[#0D6D78]" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Nothing coming up
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">
                Deadlines, content to publish and live sessions appear here.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Recent Activities
              </h2>
              <p className="text-xs text-neutral-500">What's coming up next</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 hover:underline">
              <span>Schedule an activity</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentActivities && recentActivities.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {recentActivities.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-neutral-900">
                      {act.title}
                    </p>
                    <p className="text-xs text-neutral-500">{act.meta}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                      act.badgeStyle
                    )}
                  >
                    {act.badge}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 mb-3">
                <Calendar className="h-7 w-7 text-[#0D6D78]" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                No activity yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">
                Submissions, questions and new students appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}