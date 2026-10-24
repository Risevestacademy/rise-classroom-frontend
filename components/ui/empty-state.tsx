import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

const tileTones = {
  brand: "bg-surface-brand text-brand-primary",
  success: "bg-surface-success-badge text-text-success",
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Shows a small icon inside a tinted circle instead of a large bare icon. */
  tone?: keyof typeof tileTones;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {tone ? (
        <span
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full",
            tileTones[tone],
          )}
        >
          <Icon className="h-8 w-8" strokeWidth={1.5} />
        </span>
      ) : (
        <Icon className="h-16 w-16 text-brand-primary" strokeWidth={1.5} />
      )}
      <p
        className={cn(
          "mt-2 font-bold text-neutral-800",
          tone ? "text-lg" : "text-xl",
        )}
      >
        {title}
      </p>
      <p className="max-w-96 text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
