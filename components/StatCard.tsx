import { Skeleton } from "@/components/ui/skeleton";

/** A white card with a label over a large number, as on the mentor screens. */
export function StatCard({
  title,
  value,
  loading = false,
}: {
  title: string;
  value: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-[120px] flex-col gap-1 rounded-xl bg-surface-default p-5 pb-11 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="text-2xl leading-8 font-semibold text-black">{value}</p>
      )}
    </div>
  );
}
