export function Notice({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-6 shadow-sm">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-350" />
      <div>
        <p className="text-sm font-medium text-neutral-800">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{message}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
