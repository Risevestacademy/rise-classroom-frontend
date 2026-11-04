import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Loading versions of the cohort detail tabs. Each keeps the real tab's
 * cards, grids and spacing; fixed headings stay as text.
 */

const cardClass = "rounded-xl bg-white shadow-[0_2px_4px_rgb(17_24_25/0.06)]";

function range(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

/** The icon, label, number and note cards on the Overview. */
function StatCardSkeleton() {
  return (
    <div className={cn(cardClass, "flex h-40 gap-3 p-5")}>
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-1 h-8 w-14" />
        <Skeleton className="mt-2 h-4 w-32 max-w-full" />
      </div>
    </div>
  );
}

export function CohortOverviewSkeleton() {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {range(4).map((card) => (
          <StatCardSkeleton key={card} />
        ))}
      </div>

      <h2 className="mt-[21px] text-xl font-semibold text-text-primary">
        Cohort health
      </h2>
      <p className="mt-[3px] font-work text-sm text-text-secondary">
        A snapshot of student engagement performance and wellbeing
      </p>
      <section className={cn(cardClass, "mt-4 p-6 pb-10 xl:max-w-[1126px]")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
          <Skeleton className="mx-auto h-[150px] w-[200px] shrink-0 rounded-t-full lg:mx-0 lg:mt-[5px] lg:ml-[6px]" />
          <div className="min-w-0 flex-1 lg:ml-[26px]">
            <div className="grid gap-4 md:grid-cols-3">
              {range(3).map((card) => (
                <StatCardSkeleton key={card} />
              ))}
            </div>
            <Skeleton className="mt-2 h-7 w-full max-w-[460px] rounded" />
          </div>
        </div>
      </section>

      <div className="mt-7 grid gap-4 lg:grid-cols-[487px_451px]">
        <section className={cn(cardClass, "p-6")}>
          <h2 className="text-lg leading-6 font-semibold text-text-primary">
            Completion rate by track
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {range(4).map((row) => (
              <li key={row} className="flex h-8 items-center">
                <Skeleton className="size-8 shrink-0 rounded-md" />
                <Skeleton className="ml-3 h-5 w-[140px] shrink-0" />
                <span className="ml-[34px] flex-1">
                  <Skeleton className="h-2 rounded-full" />
                </span>
                <Skeleton className="ml-3.5 h-5 w-8 shrink-0" />
              </li>
            ))}
          </ul>
        </section>
        <section className={cn(cardClass, "bg-brand-50 p-6 pb-7")}>
          <h2 className="text-lg leading-6 font-semibold text-text-primary">
            Engagement over time
          </h2>
          <div className="mt-3 flex h-[170px] items-end gap-3">
            {[60, 90, 45, 120, 75, 100].map((height, index) => (
              <div
                key={index}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <Skeleton className="w-full rounded" style={{ height }} />
                <Skeleton className="mt-[5px] h-4 w-6" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function CohortTracksSkeleton() {
  return (
    <ul className="mt-6 grid gap-4 lg:grid-cols-2 xl:max-w-[950px]">
      {range(4).map((track) => (
        <li
          key={track}
          className="rounded-3xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="size-6" />
          </div>
          <Skeleton className="mt-3 h-7 w-40" />
          <Skeleton className="mt-[3px] h-5 w-24" />
          <div className="mt-[15px] flex gap-6">
            {range(3).map((stat) => (
              <div
                key={stat}
                className="grid min-w-[85px] grid-cols-[24px_auto] gap-x-3 gap-y-1"
              >
                <Skeleton className="size-6" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="col-start-2 h-5 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3.5 h-4 w-24" />
          <Skeleton className="mt-1 h-2 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/** Loading rows with the same cells as a people table row. */
export function PeopleRowsSkeleton({ columns }: { columns: number }) {
  return range(5).map((row) => (
    <tr key={row} className="h-[85px] border-b border-neutral-200">
      <td className="pl-3.5">
        <Skeleton className="size-4 rounded-sm" />
      </td>
      <td className="px-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-44" />
          </div>
        </div>
      </td>
      {range(columns).map((column) => (
        <td key={column} className="px-3">
          <Skeleton className="h-5 w-24" />
        </td>
      ))}
      <td className="px-3">
        <Skeleton className="size-6" />
      </td>
    </tr>
  ));
}

/** A people tab while its cohort loads: the toolbar, headers and rows. */
export function PeopleTableSkeleton({
  personHeader,
  headers,
}: {
  personHeader: string;
  headers: readonly { header: string; width: string }[];
}) {
  return (
    <section className="relative mt-6">
      <div className="flex flex-col gap-3 bg-white px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <Skeleton className="h-7 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg sm:w-[281px] sm:flex-none" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-lg" />
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed text-left">
          <thead className="bg-neutral-100 text-sm font-medium text-text-primary uppercase">
            <tr className="h-11">
              <th className="w-[69px] border-r border-neutral-200 pl-3.5" />
              <th className="w-[319px] border-r border-neutral-200 px-3 font-medium">
                {personHeader}
              </th>
              {headers.map((column) => (
                <th
                  key={column.header}
                  className={cn(
                    "border-r border-neutral-200 px-3 font-medium last:border-r-0",
                    column.width,
                  )}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-[82px] px-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <PeopleRowsSkeleton columns={headers.length} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FieldSkeleton({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-work text-sm font-medium text-text-primary">{label}</p>
      <Skeleton className={cn("rounded-lg", tall ? "h-[100px]" : "h-11")} />
    </div>
  );
}

/** The settings form while the cohort loads, field for field. */
export function CohortSettingsSkeleton() {
  return (
    <div className="mt-6 flex min-w-0 flex-col xl:w-[694px]">
      <section className={cn(cardClass, "p-6 pb-7")}>
        <h2 className="text-lg leading-6 font-semibold text-text-primary">
          Basic Information
        </h2>
        <div className="mt-[18px] flex flex-col gap-[18px]">
          <FieldSkeleton label="Cohort name" />
          <FieldSkeleton label="Description" tall />
          <div className="grid gap-[18px] sm:grid-cols-3 sm:gap-2">
            <FieldSkeleton label="Start date" />
            <FieldSkeleton label="End date" />
            <FieldSkeleton label="Duration" />
          </div>
          <FieldSkeleton label="Cohort status" />
        </div>
      </section>
    </div>
  );
}
