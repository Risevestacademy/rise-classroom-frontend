import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon className="h-16 w-16 text-brand-primary" strokeWidth={1.5} />
      <p className="mt-2 text-xl font-bold text-neutral-800">{title}</p>
      <p className="max-w-96 text-sm text-neutral-500">{description}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}
