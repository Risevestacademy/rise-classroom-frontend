/** Empty state for a cohort tab, styled after the "No cohort yet" design. */
export function CohortEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 pt-24 pb-16 text-center">
      <Icon className="size-[84px] text-brand-primary" />
      <p className="mt-[17px] text-2xl font-semibold text-text-primary">
        {title}
      </p>
      <p className="mt-0.5 max-w-[372px] font-work text-sm text-text-secondary">
        {description}
      </p>
      {action && <div className="mt-[23px]">{action}</div>}
    </div>
  );
}
