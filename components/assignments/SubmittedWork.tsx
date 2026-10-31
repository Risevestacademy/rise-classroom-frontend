import { ResourceRow } from "@/components/lessons/ResourceRow";
import { formatFileSize } from "@/lib/utils";
import type { SubmittedWork as Work } from "@/features/curriculum/types";

/* What a student handed in: a link, a file or written text. */
export function SubmittedWork({ work }: { work: Work }) {
  if (work.submissionType === "TEXT") {
    return work.textContent ? (
      <p className="rounded-2xl bg-neutral-100 p-4 text-sm whitespace-pre-wrap text-neutral-700">
        {work.textContent}
      </p>
    ) : (
      <Empty />
    );
  }

  if (work.submissionType === "LINK") {
    return work.linkUrl ? (
      <div className="rounded-2xl bg-neutral-100 p-2">
        <ResourceRow resource={{ title: work.linkUrl, url: work.linkUrl }} />
      </div>
    ) : (
      <Empty />
    );
  }

  return work.fileUrl ? (
    <div className="rounded-2xl bg-neutral-100 p-2">
      <ResourceRow
        resource={{ title: work.fileName || "Submitted file", url: work.fileUrl }}
        detail={
          work.fileSizeBytes != null
            ? formatFileSize(work.fileSizeBytes)
            : undefined
        }
      />
    </div>
  ) : (
    <Empty />
  );
}

function Empty() {
  return <p className="text-sm text-neutral-400">Nothing has been added yet.</p>;
}
