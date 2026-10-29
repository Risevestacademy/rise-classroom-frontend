import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  isPending = false,
  isError = false,
  description,
  footer,
  icon: Icon,
  iconClassName,
  className,
}: {
  title: string;
  value?: number | string;
  isPending?: boolean;
  isError?: boolean;
  description?: string;
  footer?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 gap-3 rounded-xl bg-surface-default p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.15)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          {isPending ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl leading-8 font-semibold text-text-primary">
              {isError ? "—" : (value ?? 0)}
            </p>
          )}
        </div>
        <div>
          {isPending ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p className="font-work text-[13px] leading-[18px] text-text-secondary">
              {isError ? "Couldn't load this figure." : description}
            </p>
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}
