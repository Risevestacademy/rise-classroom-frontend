"use client";

import { useState } from "react";
import { ExternalLink, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDuration,
  getVideoSource,
  type LessonRecording,
} from "@/lib/student-lessons";

const frame = "aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-800";

export function LessonVideo({
  recordings,
  emptyMessage = "No recording for this lesson yet",
}: {
  recordings: LessonRecording[];
  emptyMessage?: string;
}) {
  const [selected, setSelected] = useState(0);
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

  return (
    <div className="flex flex-col gap-3">
      {source.type === "iframe" ? (
        <iframe
          key={recording.id}
          src={source.src}
          title={recording.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={frame}
        />
      ) : source.type === "file" ? (
        <video
          key={recording.id}
          src={source.src}
          controls
          preload="metadata"
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

      {recordings.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {recordings.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={index === selected}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                index === selected
                  ? "border-brand-primary bg-surface-brand text-brand-primary"
                  : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100",
              )}
            >
              {item.title} · {formatDuration(item.durationSec)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
