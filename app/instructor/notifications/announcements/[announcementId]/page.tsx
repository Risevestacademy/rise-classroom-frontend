"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Download,
  FileText,
  Megaphone,
} from "lucide-react";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  instructorAnnouncements,
  instructorNotificationRoleLabels,
  markInstructorAnnouncementRead,
} from "@/lib/instructor-notifications";
import { formatFileSize } from "@/lib/utils";

const NOTIFICATIONS_PATH = "/instructor/notifications";

export default function InstructorAnnouncementPage() {
  const { announcementId } = useParams<{ announcementId: string }>();
  const announcement = instructorAnnouncements.find(
    (item) => item.id === announcementId,
  );

  React.useEffect(() => {
    if (instructorAnnouncements.some((item) => item.id === announcementId)) {
      markInstructorAnnouncementRead(announcementId);
    }
  }, [announcementId]);

  return (
    <>
      <InstructorNavbar
        breadcrumb={[
          "Communication",
          { label: "Notifications", href: NOTIFICATIONS_PATH },
        ]}
      />
      <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 p-6">
        <div className="mx-auto flex w-full max-w-[650px] flex-col gap-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-neutral-500"
          >
            <Link
              href={NOTIFICATIONS_PATH}
              aria-label="Back to notifications"
              className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link href={NOTIFICATIONS_PATH} className="hover:text-neutral-800">
              Notifications
            </Link>
            <ChevronLeft className="size-3 rotate-180" />
            <Link
              href={NOTIFICATIONS_PATH}
              className="hover:text-neutral-800"
            >
              Announcements
            </Link>
            <ChevronLeft className="size-3 rotate-180" />
            <span className="font-medium text-neutral-800">Announcement</span>
          </nav>

          {announcement ? (
            <article className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-8">
              <h1 className="text-2xl font-medium text-neutral-800">
                {announcement.title}
              </h1>

              <div className="mt-6 flex items-center gap-3 border-b border-neutral-200 pb-6">
                <PersonAvatar
                  name={announcement.sender.name}
                  size={40}
                  colorKey={announcement.sender.id}
                  className="bg-neutral-100 text-neutral-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-800">
                    {announcement.sender.name}
                  </p>
                  <p className="font-work text-xs text-neutral-500">
                    {instructorNotificationRoleLabels[announcement.sender.role]}
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
                {announcement.body
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>

              {announcement.attachments.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm text-neutral-800">
                    {announcement.attachments.length === 1
                      ? "Attached file"
                      : "Attached files"}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {announcement.attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center gap-4 rounded-xl bg-neutral-100 px-5 py-4"
                      >
                        <span className="relative flex size-10 shrink-0 items-center justify-center text-neutral-400">
                          <FileText className="size-9" strokeWidth={1.25} />
                          {file.mimeType === "application/pdf" && (
                            <span className="absolute bottom-0.5 -left-1 rounded-sm bg-text-error px-1 text-[9px] font-bold text-white">
                              PDF
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-neutral-800">
                            {file.name}
                          </p>
                          <p className="font-work text-xs text-neutral-500">
                            {fileLabel(file)}
                          </p>
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
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-100 px-6 py-10 text-center">
              <Megaphone className="mb-2 size-5 text-neutral-800" />
              <p className="text-base text-neutral-800">
                This announcement is no longer available
              </p>
              <p className="max-w-72 font-work text-sm text-neutral-500">
                It may have been removed by the sender.
              </p>
              <Link
                href={NOTIFICATIONS_PATH}
                className="mt-3 flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-800 hover:bg-neutral-50"
              >
                Back to notifications
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function fileLabel(
  file: (typeof instructorAnnouncements)[number]["attachments"][number],
) {
  const extension =
    file.mimeType === "application/pdf"
      ? "PDF"
      : (file.name.split(".").pop() ?? "File").toUpperCase();
  return file.size === null
    ? extension
    : `${extension} · ${formatFileSize(file.size)}`;
}

function formatDateTime(date: string) {
  const value = new Date(date);
  return `${value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}