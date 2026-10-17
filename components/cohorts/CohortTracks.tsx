import {
  AlertCircle,
  HelpCircle,
  MoreHorizontal,
  MoreVertical,
  Track,
} from "@/assets/icons";
import { Badge } from "@/components/ui/badge";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";
import type { CohortTrack } from "@/lib/cohorts";
import { cn } from "@/lib/utils";

const progressBar: Record<TrackKey, string> = {
  design: "bg-brand-primary",
  frontend: "bg-text-success",
  backend: "bg-[#932a6e]",
  mobile: "bg-[#7038b8]",
};

export function CohortTracks({ tracks }: { tracks: CohortTrack[] }) {
  return (
    <div className="relative mt-6">
      <ul className="grid gap-4 lg:grid-cols-2 xl:max-w-[950px]">
        {tracks.map((track) => (
          <li
            key={track.id}
            className="rounded-3xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]"
          >
            <div className="flex items-center justify-between">
              <Badge
                variant="light"
                status={track.active ? "success" : "neutral"}
                size="lg"
                className="font-work font-normal"
              >
                {track.active ? "Active" : "Suspended"}
              </Badge>
              <button
                type="button"
                aria-label={`${track.name} options`}
                className="flex size-8 items-center justify-center text-text-primary"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-text-primary">
              {track.name}
            </h3>
            <p className="mt-[3px] font-work text-sm text-text-secondary">
              {track.students} students
            </p>

            <div className="mt-[15px] flex gap-6">
              <TrackStat
                icon={<Track className="size-6 text-text-primary" />}
                value={track.onTrack}
                label="on track"
                tone="text-text-primary"
                labelTone="text-text-secondary"
              />
              <TrackStat
                icon={<AlertCircle className="size-6 text-text-warning" />}
                value={track.atRisk}
                label="At risk"
                tone="text-text-warning"
              />
              <TrackStat
                icon={<HelpCircle className="size-6 text-text-error" />}
                value={track.needsAttention}
                label="Needs attention"
                tone="text-text-error"
              />
            </div>

            <p className="mt-3.5 text-xs font-medium text-text-primary">
              {track.progress}% Complete
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className={cn("h-full rounded-full", progressBar[track.track])}
                style={{ width: `${track.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="More options"
        className="absolute top-[448px] left-[1030px] hidden size-10 items-center justify-center rounded-lg bg-white text-text-primary xl:flex"
      >
        <MoreVertical className="size-5" />
      </button>
    </div>
  );
}

function TrackStat({
  icon,
  value,
  label,
  tone,
  labelTone = tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: string;
  labelTone?: string;
}) {
  return (
    <div className="grid min-w-[85px] grid-cols-[24px_auto] gap-x-3 first:min-w-[97px]">
      {icon}
      <p className={cn("text-lg font-semibold", tone)}>{value}</p>
      <p className={cn("col-start-2 font-work text-sm", labelTone)}>{label}</p>
    </div>
  );
}
