"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Megaphone, WifiOff } from "lucide-react";

import { Crumbs } from "@/components/control-tower/ControlTowerParts";
import { NoticeBox } from "@/components/notifications/NotificationParts";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ANNOUNCEMENTS_PATH,
  NOTIFICATIONS_PATH,
  formatDateTime,
  senderRoleLabels,
  studentNotificationQueries,
  useAnnouncements,
  type Announcement,
  type AnnouncementAttachment,
} from "@/lib/student-notifications";
import { formatFileSize } from "@/lib/utils";

export default function AnnouncementPage() {
  const { announcementId } = useParams<{ announcementId: string }>();
  const query = useQuery(studentNotificationQueries.announcement(announcementId));
  const { markRead } = useAnnouncements();

  const announcement = query.data;
  React.useEffect(() => {
    if (announcement && !announcement.isRead) markRead(announcement.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per announcement
  }, [announcement?.id]);

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <Crumbs
        backHref={ANNOUNCEMENTS_PATH}
        trail={[
          { label: "Notifications", href: NOTIFICATIONS_PATH },
          { label: "Announcements", href: ANNOUNCEMENTS_PATH },
          { label: "Announcement" },
        ]}
      />

      {query.isPending ? (
        <AnnouncementSkeleton />
      ) : query.isError ? (
        <NoticeBox
          icon={WifiOff}
          title="Couldn't load this announcement"
          description="Check your internet connection and try again."
          action={
            <Button variant="secondary" className="bg-white" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : announcement ? (
        <AnnouncementCard announcement={announcement} />
      ) : (
        <NoticeBox
          icon={Megaphone}
          title="This announcement is no longer available"
          description="It may have been removed by the sender."
          action={
            <Link
              href={ANNOUNCEMENTS_PATH}
              className="flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-800 hover:bg-neutral-50"
            >
              Back to announcements
            </Link>
          }
        />
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const paragraphs = announcement.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-8">
      <h1 className="text-2xl font-medium text-neutral-800">{announcement.title}</h1>

      <div className="mt-6 flex items-center gap-3 border-b border-neutral-200 pb-6">
        <PersonAvatar
          name={announcement.sender.name}
          size={40}
          className="bg-neutral-100 text-neutral-800"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-neutral-800">{announcement.sender.name}</p>
          <p className="font-work text-xs text-neutral-500">
            {senderRoleLabels[announcement.sender.role]}
          </p>
        </div>
        <time
          dateTime={announcement.createdAt}
          className="shrink-0 font-work text-xs text-neutral-500"
        >
          {formatDateTime(announcement.createdAt)}
        </time>
      </div>

      <div className="mt-6 space-y-4 font-work text-sm leading-6 whitespace-pre-line text-neutral-800">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {announcement.attachments.length > 0 && (
        <div className="mt-8">
          <p className="text-sm text-neutral-800">
            {announcement.attachments.length === 1 ? "Attached file" : "Attached files"}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {announcement.attachments.map((file) => (
              <AttachmentItem key={file.id} file={file} />
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function fileLabel(file: AnnouncementAttachment) {
  const extension =
    file.mimeType === "application/pdf"
      ? "PDF"
      : (file.name.split(".").pop() ?? "File").toUpperCase();
  return file.size === null ? extension : `${extension} · ${formatFileSize(file.size)}`;
}

function AttachmentItem({ file }: { file: AnnouncementAttachment }) {
  const isPdf = file.mimeType === "application/pdf";
  return (
    <li className="flex items-center gap-4 rounded-xl bg-neutral-100 px-5 py-4">
      <span className="relative flex size-10 shrink-0 items-center justify-center text-neutral-400">
        <FileText className="size-9" strokeWidth={1.25} />
        {isPdf && (
          <span className="absolute bottom-0.5 -left-1 rounded-sm bg-text-error px-1 text-[9px] font-bold text-white">
            PDF
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-800">{file.name}</p>
        <p className="font-work text-xs text-neutral-500">{fileLabel(file)}</p>
      </div>
      <a
        href={file.url}
        download
        target="_blank"
        rel="noreferrer"
        aria-label={`Download ${file.name}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-800"
      >
        <Download className="size-4" />
      </a>
    </li>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-8" aria-busy>
      <Skeleton className="h-7 w-2/3" />
      <div className="mt-6 flex items-center gap-3 border-b border-neutral-200 pb-6">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}
