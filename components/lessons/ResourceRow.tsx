import {
  Download,
  ExternalLink,
  FileText,
  Link2,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { describeResource, toHttpUrl } from "@/lib/student-lessons";

/* A link or file in a student list: lesson resources, assignment attachments,
   and handed-in work. `detail` replaces the "PDF · host" line when given. */
export function ResourceRow({
  resource,
  detail,
}: {
  resource: { title: string; url: string };
  detail?: string;
}) {
  const href = toHttpUrl(resource.url);
  const info = describeResource(resource.url);
  const Icon = info.isFile ? FileText : info.kind === "Video" ? Video : Link2;
  const Action = info.isFile ? Download : ExternalLink;

  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">
          {resource.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-400">
          {detail ?? [info.kind, info.host].filter(Boolean).join(" · ")}
        </p>
      </div>
      {href && <Action className="h-4 w-4 shrink-0 text-neutral-400" />}
    </>
  );

  const className = "flex items-center gap-3 rounded-xl px-3 py-3";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className, "hover:bg-white")}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
