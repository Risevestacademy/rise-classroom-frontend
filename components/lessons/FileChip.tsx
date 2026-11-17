import { FileText, Link2 } from "lucide-react";

import { cn, formatFileSize } from "@/lib/utils";
import { isApiFilePath } from "@/lib/api";
import { describeResource, resourceHref } from "@/lib/student-lessons";

/* A resource or attachment as a small pill: file name and size. A link opens in a
   new tab; a file uploaded to the API downloads. */
export function FileChip({
  title,
  url,
  type,
  sizeBytes,
  className,
}: {
  title: string;
  url: string;
  type?: Parameters<typeof describeResource>[1];
  sizeBytes?: number | null;
  className?: string;
}) {
  const href = resourceHref(url);
  const info = describeResource(url, type, title);
  const isUpload = isApiFilePath(url);
  const Icon = info.isFile ? FileText : Link2;
  const size = sizeBytes ? formatFileSize(sizeBytes) : null;

  const content = (
    <>
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          info.isFile ? "text-text-error" : "text-neutral-400",
        )}
      />
      <span className="truncate font-medium text-neutral-700">{title}</span>
      {size && <span className="shrink-0 text-neutral-400">{size}</span>}
    </>
  );

  const base = cn(
    "inline-flex max-w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs",
    className,
  );
  return href ? (
    <a
      href={href}
      {...(isUpload
        ? { download: title }
        : { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(base, "hover:bg-neutral-100")}
    >
      {content}
    </a>
  ) : (
    <span className={base}>{content}</span>
  );
}
