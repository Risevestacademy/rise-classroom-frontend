import { Info } from "lucide-react";

export function InfoNote({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-100 bg-surface-brand p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-neutral-800">
        <Info className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <div className="mt-2 flex flex-col gap-1 pl-6 text-xs leading-5 text-neutral-500">
        {children}
      </div>
    </section>
  );
}
