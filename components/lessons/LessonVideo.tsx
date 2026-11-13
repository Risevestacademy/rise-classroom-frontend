"use client";

import { useState } from "react";
import { ExternalLink, Play, Video, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDuration,
  getVideoSource,
  videoThumbnail,
  type LessonRecording,
} from "@/lib/student-lessons";

const frame = "aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-800";

/* `label` and `caption` name a recording in the picker; they default to its title and length. */
export type VideoItem = LessonRecording & { label?: string; caption?: string };

function itemLabel(item: VideoItem) {
  return item.label ?? item.title;
}

function itemCaption(item: VideoItem) {
  return item.caption ?? (item.durationSec ? formatDuration(item.durationSec) : "");
}

export function LessonVideo({
  recordings,
  emptyMessage = "No recording for this lesson yet",
}: {
  recordings: VideoItem[];
  emptyMessage?: string;
}) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const recording = recordings[selected] ?? recordings[0];

  if (!recording) {
    return (
      <div className={cn(frame, "flex items-center justify-center")}>
        <div className="flex flex-col items-center gap-2 text-neutral-350">
          <Video className="h-8 w-8" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const source = getVideoSource(recording.url);
  const caption = [itemLabel(recording), itemCaption(recording)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-3">
      {failed ? (
        <div className={cn(frame, "flex items-center justify-center p-6")}>
          <div className="flex flex-col items-center gap-1 text-center text-white">
            <WifiOff className="mb-2 h-6 w-6 text-neutral-350" />
            <p className="text-sm font-medium">Couldn&apos;t play the recording</p>
            <p className="text-xs text-neutral-350">
              Check your internet connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setAttempt((value) => value + 1);
              }}
              className="mt-3 h-8 rounded-lg bg-white px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Try again
            </button>
          </div>
        </div>
      ) : source.type === "iframe" ? (
        <iframe
          key={`${recording.id}-${attempt}`}
          src={source.src}
          title={recording.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={frame}
        />
      ) : source.type === "file" ? (
        <video
          key={`${recording.id}-${attempt}`}
          src={source.src}
          controls
          preload="metadata"
          onError={() => setFailed(true)}
          className={frame}
        />
      ) : (
        <div className={cn(frame, "flex items-center justify-center")}>
          <a
            href={source.src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-300 px-5 text-sm font-medium text-brand-primary hover:bg-brand-200"
          >
            Open recording
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {caption && <p className="text-xs text-neutral-500 lg:hidden">{caption}</p>}

      {recordings.length > 1 && (
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {recordings.map((item, index) => {
            const thumbnail = videoThumbnail(item.url);
            const active = index === selected;
            return (
              <li key={item.id} className="w-[152px] shrink-0 sm:w-[168px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(index);
                    setFailed(false);
                  }}
                  aria-pressed={active}
                  aria-label={`Play ${itemLabel(item)}`}
                  className="group block w-full text-left"
                >
                  <span
                    className={cn(
                      "relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-neutral-800 ring-2 ring-offset-2 ring-offset-neutral-50 transition",
                      active ? "ring-brand-primary" : "ring-transparent group-hover:ring-neutral-200",
                    )}
                  >
                    {thumbnail && (
                      // A still from the video host, shown as it is.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800/70 text-white">
                      <Play className="h-3 w-3 fill-current" />
                    </span>
                  </span>
                  <span className="mt-2 block truncate text-xs font-medium text-neutral-800">
                    {itemLabel(item)}
                  </span>
                  {itemCaption(item) && (
                    <span className="block truncate text-xs text-neutral-400">
                      {itemCaption(item)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
