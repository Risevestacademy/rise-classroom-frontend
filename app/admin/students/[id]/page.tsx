"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarDays,
  Layers,
  Mail,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { adminQueries, assignmentsFor, type AdminUser } from "@/lib/admin";
import { formatDate, getStudentStatus } from "../student-display";

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const studentQuery = useQuery(adminQueries.user(id));

  // A missing user, or a user who isn't a student, gets the normal 404 page.
  const isNotFound =
    (studentQuery.error instanceof ApiError &&
      studentQuery.error.status === 404) ||
    (studentQuery.data !== undefined && studentQuery.data.role !== "STUDENT");
  if (isNotFound) notFound();

  const student = studentQuery.data;
  const name = student ? (student.displayName ?? student.name) : "";

  return (
    <>
      <AdminTopNav
        breadcrumb={
          student ? ["People", "Students", name] : ["People", "Students"]
        }
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {studentQuery.isPending && <DetailsSkeleton />}

        {studentQuery.isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <UserRound className="h-12 w-12 text-neutral-300" />
            <p className="font-semibold text-neutral-900">
              Couldn&apos;t load this student
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              {studentQuery.error.message}
            </p>
          </div>
        )}

        {student && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-3">
              <ProfileCard student={student} name={name} />
              <EnrollmentCard student={student} />
            </div>
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
              <AccountCard student={student} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-neutral-300 bg-white p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}

function ProfileCard({ student, name }: { student: AdminUser; name: string }) {
  const { tracks, cohorts } = assignmentsFor(student);
  const status = getStudentStatus(student);

  const details = [
    { icon: Mail, value: student.email },
    {
      icon: CalendarDays,
      value: student.onboardedAt
        ? `Joined ${formatDate(student.onboardedAt)}`
        : `Invited ${formatDate(student.createdAt)}`,
    },
  ];

  return (
    <Card>
      <div className="flex items-center gap-4">
        <InitialsAvatar name={student.name} className="h-20 w-20 text-2xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-neutral-900">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {tracks.map((track) => (
              <Badge key={track} variant="light" status="info" size="lg">
                {track}
              </Badge>
            ))}
            <Badge variant="light" status={status.badge} size="lg">
              {status.label}
            </Badge>
            {cohorts.map((cohort) => (
              <Badge key={cohort} variant="light" status="neutral" size="lg">
                {cohort}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {details.map(({ icon: Icon, value }) => (
          <p
            key={value}
            className="flex min-w-0 items-center gap-3 text-sm text-neutral-700"
          >
            <Icon className="h-5 w-5 shrink-0 text-neutral-500" />
            <span className="truncate">{value}</span>
          </p>
        ))}
      </div>
    </Card>
  );
}

function EnrollmentCard({ student }: { student: AdminUser }) {
  const memberships = student.studentProfile ?? [];

  return (
    <Card>
      <CardHeader
        title="Enrollment"
        subtitle="The cohorts and tracks this student belongs to"
      />

      {memberships.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">
          This student isn&apos;t enrolled in a cohort yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {memberships.map((membership, index) => (
            <li
              key={membership.cohort?.id ?? index}
              className="rounded-lg border border-neutral-200 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                  <Layers className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {membership.cohort?.name ?? "Unknown cohort"}
                  </p>
                  {membership.cohort?.year && (
                    <p className="text-sm text-neutral-500">
                      Year {membership.cohort.year}
                    </p>
                  )}
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {(membership.enrollment ?? []).map((enrollment, trackIndex) => (
                  <li
                    key={enrollment.track?.id ?? trackIndex}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-neutral-700">
                      {enrollment.track?.name ?? "Unknown track"}
                    </span>
                    <Badge variant="light" status="neutral">
                      {formatEnrollmentStatus(enrollment.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Turns API values like "ENROLLED" into "Enrolled". */
function formatEnrollmentStatus(value: string) {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function AccountCard({ student }: { student: AdminUser }) {
  const rows = [
    {
      label: "Onboarding",
      value:
        student.onboardingStatus === "COMPLETED"
          ? "Completed"
          : "Invitation pending",
    },
    { label: "Invited on", value: formatDate(student.createdAt) },
    {
      label: "Joined on",
      value: student.onboardedAt ? formatDate(student.onboardedAt) : "--",
    },
    {
      label: "Account",
      value: student.status === "SUSPENDED" ? "Suspended" : "Active",
    },
  ];

  return (
    <Card>
      <CardHeader title="Account" subtitle="Sign-up and access details" />

      <dl className="mt-6 space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="font-medium text-neutral-900">{row.value}</dd>
          </div>
        ))}
        {student.emailVerified !== undefined && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-neutral-500">Email</dt>
            <dd className="flex items-center gap-1.5 font-medium text-neutral-900">
              {student.emailVerified && (
                <BadgeCheck className="h-4 w-4 text-semantic-text-success" />
              )}
              {student.emailVerified ? "Verified" : "Not verified"}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="flex flex-col gap-4 xl:col-span-3">
        <Card>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-6 w-64" />
            </div>
          </div>
          <Skeleton className="mt-6 h-4 w-full max-w-md" />
        </Card>
        <Card>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-6 h-24 w-full" />
        </Card>
      </div>
      <div className="xl:col-span-2">
        <Card>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-6 h-32 w-full" />
        </Card>
      </div>
    </div>
  );
}
