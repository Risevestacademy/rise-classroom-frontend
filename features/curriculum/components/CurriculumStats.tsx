import { BookOpen, GraduationCap, NotebookPen } from "lucide-react";
import { cn } from "cn";

export function CurriculumStats({
  totalModules,
  totalLessons,
  totalAssignments,
  className,
}: {
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
  className?: string;
}) {
  const stats = [
    {
      label: "Total modules",
      value: totalModules,
      icon: BookOpen,
      iconClassName: "bg-surface-brand text-brand-primary",
    },
    {
      label: "Total Lessons",
      value: totalLessons,
      icon: GraduationCap,
      iconClassName: "bg-surface-info-badge text-text-info",
    },
    {
      label: "Total Assignments",
      value: totalAssignments,
      icon: NotebookPen,
      iconClassName: "bg-surface-success-badge text-text-success",
    },
  ];

  return (
    <div className={cn("flex flex-wrap gap-x-8 gap-y-4", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              stat.iconClassName,
            )}
          >
            <stat.icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-0.5 text-lg font-bold text-neutral-800">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
