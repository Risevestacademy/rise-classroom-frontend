import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Card } from "./shared";

/*
 * Loading versions of the profile sections. Each keeps the real section's
 * card, grid and spacing, so the page doesn't jump when the data arrives.
 * Fixed titles are shown as text; anything from the API is a bar.
 */

const cardShadow = "shadow-[0_1px_3px_rgb(0_0_0/0.15)]";

function range(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

/** A card title (fixed text) with an optional subtitle bar and action. */
function HeaderSkeleton({
  title,
  subtitle = false,
  action,
  size = "h3",
}: {
  title: string;
  subtitle?: boolean;
  /** Classes for the action's box, e.g. "h-8 w-20". */
  action?: string;
  size?: "h3" | "h4";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          className={cn(
            "font-semibold text-text-primary",
            size === "h3" ? "text-xl" : "text-lg/6",
          )}
        >
          {title}
        </h2>
        {subtitle && <Skeleton className="h-5 w-64 max-w-full" />}
      </div>
      {action && <Skeleton className={cn("shrink-0 rounded-lg", action)} />}
    </div>
  );
}

function BadgesSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-7 w-20 rounded-full" />
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-24 rounded-full" />
    </div>
  );
}

/** The person's avatar, name and badges, with Message and ⋮ beside them. */
function PersonHeaderSkeleton({
  avatar,
  nameClassName,
  subtitle = false,
}: {
  avatar: string;
  nameClassName: string;
  subtitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className={cn("shrink-0 rounded-full", avatar)} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className={nameClassName} />
            {subtitle && <Skeleton className="h-5 w-24" />}
          </div>
          <BadgesSkeleton />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Skeleton className="h-10 w-[110px] rounded-lg" />
        <Skeleton className="size-10 rounded-lg" />
      </div>
    </div>
  );
}

function ListRowSkeleton({ trailing }: { trailing: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className={cn("shrink-0", trailing)} />
    </li>
  );
}

/** Day groups on the grey line, as in `ActivityTimeline`. */
export function TimelineSkeleton({
  groups = 2,
  items = 3,
}: {
  groups?: number;
  items?: number;
}) {
  return (
    <div className="flex flex-col gap-4 p-2.5">
      {range(groups).map((group) => (
        <div key={group} className="flex flex-col gap-8">
          <Skeleton className="h-5 w-20" />
          <ol className="relative ml-[22px] flex flex-col gap-[38px] border-l-2 border-border-strong pl-4">
            {range(items).map((item) => (
              <li key={item} className="relative flex flex-col gap-1">
                <span className="absolute top-1 -left-[21px] size-2 rounded-full bg-border-strong" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-56 max-w-full" />
                <Skeleton className="h-4 w-36" />
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function AttendanceGridSkeleton({ size }: { size: "small" | "large" }) {
  const large = size === "large";
  return (
    <div
      className={cn(
        "grid w-fit",
        large
          ? "grid-cols-[repeat(7,30px)] grid-rows-[28px] auto-rows-[30px] gap-2"
          : "grid-cols-[repeat(7,20px)] grid-rows-[18px] auto-rows-[20px] gap-2",
      )}
    >
      {range(7).map((day) => (
        <Skeleton key={`day-${day}`} className="mx-auto h-3 w-3" />
      ))}
      {range(35).map((cell) => (
        <Skeleton key={cell} className="rounded-md" />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Overview */

/** The compact profile shown above every tab but the Overview. */
export function ProfileSummarySkeleton() {
  return (
    <div className="mt-6 flex w-full max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)] sm:w-fit">
      <Skeleton className="size-[60px] shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <BadgesSkeleton />
      </div>
    </div>
  );
}

/** `subtitle` adds the line under the name that mentors have. */
export function ProfileCardSkeleton({ subtitle = false }: { subtitle?: boolean }) {
  return (
    <Card>
      <PersonHeaderSkeleton
        avatar="size-[80px]"
        nameClassName="h-8 w-48"
        subtitle={subtitle}
      />
      <div className="grid w-fit max-w-full grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[auto_auto]">
        {range(4).map((item) => (
          <div key={item} className="flex items-center gap-2 p-2">
            <Skeleton className="size-6 shrink-0 rounded-md" />
            <Skeleton className="h-5 w-44" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MentorCardSkeleton() {
  return (
    <Card className="gap-4">
      <HeaderSkeleton title="Mentor" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-[60px] shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-[110px] shrink-0 rounded-lg" />
      </div>
      <div className="flex items-start gap-2 p-2">
        <Skeleton className="size-6 shrink-0 rounded-md" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </Card>
  );
}

export function ProgressCardSkeleton() {
  return (
    <Card>
      <HeaderSkeleton title="Current Progress" subtitle action="h-8 w-24" />
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
        <Skeleton className="size-[180px] shrink-0 rounded-full" />
        <ul className="flex w-full min-w-0 flex-1 flex-col gap-2">
          {range(5).map((row) => (
            <li
              key={row}
              className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,148px)_auto] items-center gap-3"
            >
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-2 rounded-full" />
              <Skeleton className="h-5 w-[29px]" />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function DeadlinesCardSkeleton() {
  return (
    <Card>
      <HeaderSkeleton title="Upcoming Deadlines" action="h-8 w-16" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-12" />
        <ul className="flex flex-col gap-6">
          {range(3).map((row) => (
            <ListRowSkeleton key={row} trailing="h-6 w-20 rounded-full" />
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function AttendanceCardSkeleton() {
  return (
    <Card>
      <HeaderSkeleton
        title="Live sessions attendance"
        subtitle
        action="h-8 w-28"
      />
      <div className="flex items-end justify-between gap-6">
        <AttendanceGridSkeleton size="small" />
        <ul className="flex w-[88px] shrink-0 flex-col gap-2">
          {range(3).map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-4 w-14" />
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-3 rounded-lg border border-border-default p-3">
        {range(3).map((stat) => (
          <div
            key={stat}
            className="flex flex-col items-center gap-1 border-r border-border-default p-2.5 last:border-r-0"
          >
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RecentActivitiesSkeleton({ title }: { title: string }) {
  return (
    <Card className="gap-4">
      <HeaderSkeleton title={title} />
      <TimelineSkeleton />
    </Card>
  );
}

export function OverviewNotesSkeleton() {
  return (
    <Card className="gap-4">
      <HeaderSkeleton title="Notes" action="h-8 w-16" />
      <ul className="flex flex-col gap-4">
        {range(2).map((note) => (
          <li key={note} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex max-w-[316px] min-w-0 flex-1 items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function StudentOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCardSkeleton />
        <MentorCardSkeleton />
        <ProgressCardSkeleton />
        <DeadlinesCardSkeleton />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <AttendanceCardSkeleton />
        <RecentActivitiesSkeleton title="Recent Activites" />
        <OverviewNotesSkeleton />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Tabs */

/** A list of selectable rows (modules, weeks) down the left of a tab. */
function SideListCardSkeleton({
  title,
  rows,
}: {
  title?: string;
  rows: number;
}) {
  return (
    <Card className="gap-3">
      {title ? (
        <>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-lg/6 font-semibold text-text-primary">
              {title}
            </h2>
            <Skeleton className="h-4 w-28" />
          </div>
          <div aria-hidden className="h-2" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-2 rounded-full" />
        </>
      )}
      <ul className="flex flex-col">
        {range(rows).map((row) => (
          <li
            key={row}
            className="flex items-center justify-between gap-3 border-b border-border-default p-2 last:border-b-0"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-5 w-12 shrink-0" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ProgressTabSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,309fr)_minmax(0,811fr)]">
      <SideListCardSkeleton rows={6} />
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="gap-3">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-[449px] min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-5 w-20" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-1 md:w-[191px]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-2 flex-1 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </Card>
        <section
          className={cn(
            "flex flex-col gap-3 rounded-xl bg-surface-subtle p-6",
            cardShadow,
          )}
        >
          <HeaderSkeleton size="h4" title="Learning items" />
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {range(6).map((item) => (
              <li
                key={item}
                className={cn(
                  "flex min-h-[208px] flex-col justify-between gap-4 rounded-xl bg-surface-default p-4",
                  cardShadow,
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="size-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function ControlTowerTabSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,391fr)_minmax(0,721fr)]">
      <SideListCardSkeleton title="Weekly check-ins" rows={6} />
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </Card>
        <Card className="gap-3">
          <div className="flex items-start justify-between gap-4 border-b border-border-default pb-3">
            <HeaderSkeleton size="h4" title="Student responses" subtitle />
            <Skeleton className="h-5 w-24 shrink-0" />
          </div>
          {range(4).map((question) => (
            <div key={question} className="flex flex-col gap-1">
              <Skeleton className="my-0.5 h-5 w-64 max-w-full" />
              <Skeleton className="h-[100px] rounded-xl" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/** The Activity card: Export, filter pills and the timeline. */
export function ActivityCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-4", className)}>
      <HeaderSkeleton title="Activity" subtitle action="h-8 w-24" />
      <div className="flex flex-wrap gap-2">
        {range(5).map((pill) => (
          <Skeleton key={pill} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <TimelineSkeleton />
    </Card>
  );
}

export function ActivityTabSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,730fr)_minmax(0,383fr)]">
      <ActivityCardSkeleton />
      <section
        className={cn("flex flex-col gap-3 rounded-xl bg-brand-100 p-6", cardShadow)}
      >
        <h2 className="text-lg/6 font-semibold text-text-primary">
          Activity at a glance
        </h2>
        <div aria-hidden className="h-2" />
        <div className="flex flex-col gap-8">
          {range(3).map((row) => (
            <div key={row} className="flex justify-between gap-4">
              {range(2).map((metric) => (
                <div
                  key={metric}
                  className={cn(
                    "flex flex-col gap-3",
                    metric === 0 ? "w-[115px]" : "w-[78px]",
                  )}
                >
                  <Skeleton className="h-4 w-full bg-white/60" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-12 bg-white/60" />
                    <Skeleton className="h-4 w-full bg-white/60" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AttendanceTabSkeleton() {
  return (
    <Card className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderSkeleton title="Attendance" subtitle />
        <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg sm:w-40 sm:flex-none" />
          <Skeleton className="size-10 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-5 sm:overflow-x-auto">
        {range(3).map((month) => (
          <div
            key={month}
            className={cn(
              "w-full min-w-0 flex-col gap-4 sm:flex sm:w-[258px] sm:shrink-0",
              // One month fits on a phone, as in the real tab.
              month === 0 ? "flex" : "hidden",
            )}
          >
            <Skeleton className="h-6 w-24" />
            <AttendanceGridSkeleton size="large" />
          </div>
        ))}
      </div>
      <div className="h-px bg-border-default" />
      <ul className="flex flex-wrap gap-3">
        {range(4).map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-5 w-20" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AssignmentsTabSkeleton() {
  const columns = ["w-[296px]", "w-[254px]", "w-[161px]", "w-[135px]", "w-[159px]", "flex-1"];
  return (
    <Card className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderSkeleton title="Assignments" subtitle />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg sm:w-[281px] sm:flex-none" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[960px] flex-col gap-2">
          <Skeleton className="h-11 rounded-t-lg rounded-b-none" />
          <ul className="flex flex-col gap-4">
            {range(5).map((row) => (
              <li
                key={row}
                className="flex h-[68px] items-center border-b border-border-default"
              >
                {columns.map((column, index) => (
                  <div key={column} className={cn("flex flex-col gap-1 p-3", column)}>
                    <Skeleton
                      className={cn(
                        "h-5",
                        index === 3 ? "w-20 rounded-full" : index === 5 ? "size-6" : "w-3/4",
                      )}
                    />
                    {index < 2 && <Skeleton className="h-4 w-1/2" />}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function MentorshipTabSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <HeaderSkeleton title="Assigned mentor" />
        <PersonHeaderSkeleton
          avatar="size-[80px]"
          nameClassName="h-7 w-48"
          subtitle
        />
      </Card>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,836fr)_minmax(0,284fr)]">
        <Card>
          <HeaderSkeleton title="Mentorship sessions" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {range(3).map((stat) => (
              <Skeleton key={stat} className="min-h-[120px] rounded-xl" />
            ))}
          </div>
        </Card>
        <Card className="gap-3">
          <HeaderSkeleton size="h4" title="Upcoming session" />
          <div aria-hidden className="h-2" />
          <ul className="flex flex-col gap-3">
            {range(3).map((session) => (
              <li key={session} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function NotesTabSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,799fr)_minmax(0,321fr)]">
      <ul className="flex min-w-0 flex-col gap-4">
        {range(3).map((note) => (
          <li
            key={note}
            className={cn(
              "flex flex-col gap-3 rounded-lg bg-surface-default p-5",
              cardShadow,
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <span aria-hidden className="mx-2.5 h-[38px] w-px bg-border-default" />
              <Skeleton className="h-4 w-20" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="h-[104px] rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ Mentor */

/** Rows of the Assigned students card while the mentees load. */
export function MenteeRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {range(rows).map((row) => (
        <li
          key={row}
          className="flex min-h-[68px] items-center justify-between gap-4 pl-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-44" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-6 sm:gap-20">
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex w-[152px] flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 rounded-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function UpcomingSessionsSkeleton() {
  return (
    <Card className="gap-3">
      <HeaderSkeleton size="h4" title="Upcoming sessions" action="h-8 w-16" />
      <ul className="flex flex-col gap-3">
        {range(3).map((session) => (
          <li
            key={session}
            className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MentorOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCardSkeleton subtitle />
        <Card>
          <HeaderSkeleton title="Assigned students" action="h-8 w-16" />
          <MenteeRowsSkeleton />
        </Card>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <UpcomingSessionsSkeleton />
        <RecentActivitiesSkeleton title="Recent Activities" />
      </div>
    </div>
  );
}

/** Table rows for the mentor's Students tab, matching its five columns. */
export function MenteeTableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {range(rows).map((row) => (
        <tr key={row} className="h-[69px] border-b border-border-default">
          <td className="pl-3">
            <Skeleton className="size-4 rounded-sm" />
          </td>
          <td className="px-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </td>
          <td className="px-2.5">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="px-2.5 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-9" />
              <Skeleton className="h-2 w-[150px] rounded-full" />
            </div>
          </td>
          <td className="px-2.5">
            <Skeleton className="size-6" />
          </td>
        </tr>
      ))}
    </>
  );
}
