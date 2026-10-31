"use client";

import * as React from "react";
import Link from "next/link";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { AppTopNav } from "@/components/AppTopNav";
import { PersonAvatar } from "@/components/PersonAvatar";
import { CheckInsView } from "@/components/control-tower/CheckIns";
import { GoalsAndKpis } from "@/components/control-tower/GoalsAndKpis";
import { Card, CardHeader } from "@/components/student-profile/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  controlTowerKeys,
  controlTowerQueries,
  reviewWeeklyMetric,
  summarizeKpis,
  type WeeklyMetric,
  type WeeklyMetricReview,
} from "@/lib/control-tower";

const listHref = "/mentor/students";

export default function MenteePage({
  params,
}: {
  params: Promise<{ studentProfileId: string }>;
}) {
  const { studentProfileId } = React.use(params);
  const menteesQuery = useQuery(controlTowerQueries.mentees());
  const metricsQuery = useQuery(controlTowerQueries.weeklyMetrics(studentProfileId));
  const goalsQuery = useQuery(controlTowerQueries.goals(studentProfileId));
  const kpisQuery = useQuery(controlTowerQueries.kpis(studentProfileId));

  const mentee = menteesQuery.data?.find(
    (item) => item.student.id === studentProfileId,
  );
  const name = mentee?.student.user.name ?? "Student";
  const firstName = name.split(" ")[0];
  const pending = menteesQuery.isPending || metricsQuery.isPending;
  const error = menteesQuery.error ?? metricsQuery.error;

  return (
    <>
      <AppTopNav
        basePath="/mentor"
        breadcrumb={[
          "Overview",
          { label: "My students", href: listHref },
          ...(mentee ? [{ label: name, href: `${listHref}/${studentProfileId}` }] : []),
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <Link
            href={listHref}
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            My students
          </Link>

          {pending ? (
            <MenteeSkeleton />
          ) : error ? (
            <Card>
              <p role="alert" className="font-work text-sm text-text-error">
                Couldn&apos;t load this student&apos;s Control Tower. {error.message}
              </p>
            </Card>
          ) : !mentee ? (
            <Card>
              <p className="font-work text-sm text-text-secondary">
                This student isn&apos;t one of your mentees.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <PersonAvatar name={name} colorKey={studentProfileId} size={48} />
                <div className="min-w-0">
                  <h1 className="text-2xl leading-8 font-semibold text-text-primary">
                    {name}
                  </h1>
                  <p className="font-work text-sm text-text-secondary">
                    {[mentee.student.user.email, mentee.student.cohort?.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <CheckInsView
                firstName={firstName}
                cohort={mentee.student.cohort?.name}
                weeks={metricsQuery.data ?? []}
                side={
                  goalsQuery.isPending || kpisQuery.isPending ? (
                    <Skeleton className="h-48 w-full rounded-xl" />
                  ) : (
                    <GoalsAndKpis
                      studentProfileId={studentProfileId}
                      goals={goalsQuery.data ?? []}
                      kpis={
                        kpisQuery.data ??
                        (goalsQuery.data ?? []).flatMap((goal) => goal.kpis ?? [])
                      }
                      summary={kpisQuery.data ? summarizeKpis(kpisQuery.data) : undefined}
                      /* Goals and KPIs are the student's to set; mentors only read them. */
                      editable={false}
                      queryKey={controlTowerKeys.goalsAndKpis(studentProfileId)}
                    />
                  )
                }
                review={(week) => (
                  <WeekReview
                    key={`${week.id}-${week.updatedAt}`}
                    week={week}
                    firstName={firstName}
                    studentProfileId={studentProfileId}
                  />
                )}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}

/* The mentor's notes on one week, and the button that moves it on:
   submitted → reviewed → completed. */
function WeekReview({
  week,
  firstName,
  studentProfileId,
}: {
  week: WeeklyMetric;
  firstName: string;
  studentProfileId: string;
}) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = React.useState(week.mentorMeetingOutcome ?? "");
  const [feedback, setFeedback] = React.useState(week.mentorFeedback ?? "");

  const review = useMutation({
    mutationFn: (input: WeeklyMetricReview) => reviewWeeklyMetric(week.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: controlTowerKeys.weeklyMetrics(studentProfileId),
      });
      queryClient.invalidateQueries({ queryKey: controlTowerKeys.mentees() });
    },
  });

  const notes = {
    ...(outcome.trim() && { mentorMeetingOutcome: outcome.trim() }),
    ...(feedback.trim() && { mentorFeedback: feedback.trim() }),
  };
  const changed =
    outcome.trim() !== (week.mentorMeetingOutcome ?? "").trim() ||
    feedback.trim() !== (week.mentorFeedback ?? "").trim();

  if (week.status === "DRAFT") {
    return (
      <Card className="gap-3">
        <CardHeader size="h4" title="Your review" />
        <p className="font-work text-sm text-text-secondary">
          {firstName} hasn&apos;t submitted this week yet. You can review it once
          they do.
        </p>
      </Card>
    );
  }

  if (week.status === "COMPLETED") {
    return (
      <Card className="gap-3">
        <CardHeader size="h4" title="Your review" subtitle="This week is completed." />
        <ReadOnlyNote label="What came out of your meeting?" value={week.mentorMeetingOutcome} />
        <ReadOnlyNote label="Feedback for the student" value={week.mentorFeedback} />
      </Card>
    );
  }

  const submitted = week.status === "SUBMITTED";

  return (
    <Card className="gap-4">
      <CardHeader
        size="h4"
        title="Your review"
        subtitle={
          submitted
            ? `Add notes from your check-in with ${firstName}, then mark the week as reviewed.`
            : `${firstName} can see your notes. Mark the week as completed when you're done with it.`
        }
      />

      <Field.Root className="flex w-full flex-col">
        <Label>What came out of your meeting?</Label>
        <div className="mt-1.5">
          <Textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder={`Example: We broke ${firstName}'s portfolio goal into three case studies`}
            className="min-h-24"
          />
        </div>
      </Field.Root>

      <Field.Root className="flex w-full flex-col">
        <Label>Feedback for the student</Label>
        <div className="mt-1.5">
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="What they're doing well, and what to focus on next"
            className="min-h-24"
          />
        </div>
      </Field.Root>

      {review.isError && (
        <p role="alert" className="font-work text-sm text-text-error">
          {review.error.message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {submitted ? (
          <Button
            size="medium"
            disabled={review.isPending}
            onClick={() => review.mutate({ status: "REVIEWED", ...notes })}
          >
            {review.isPending ? "Saving…" : "Mark as reviewed"}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="medium"
              disabled={!changed || review.isPending}
              onClick={() => review.mutate({ status: "REVIEWED", ...notes })}
            >
              Save notes
            </Button>
            <Button
              size="medium"
              disabled={review.isPending}
              onClick={() => review.mutate({ status: "COMPLETED", ...notes })}
            >
              {review.isPending ? "Saving…" : "Mark as completed"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function ReadOnlyNote({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="py-0.5 text-sm font-medium text-text-primary">{label}</p>
      <p className="rounded-xl bg-surface-subtle p-3 font-work text-[13px]/[18px] whitespace-pre-line text-text-primary">
        {value?.trim() || "--"}
      </p>
    </div>
  );
}

function MenteeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,391fr)_minmax(0,721fr)]">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    </div>
  );
}
