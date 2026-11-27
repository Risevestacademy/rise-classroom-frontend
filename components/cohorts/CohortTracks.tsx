import { AlertCircle, HelpCircle, MoreVertical, Track } from "@/assets/icons";
import { TrackCard } from "@/components/tracks/TrackCard";
import type { CohortTrack } from "@/lib/cohorts";

export function CohortTracks({ tracks }: { tracks: CohortTrack[] }) {
  return (
    <div className="relative mt-6">
      <ul className="grid gap-4 lg:grid-cols-2 xl:max-w-[950px]">
        {tracks.map((track) => (
          <li key={track.id}>
            <TrackCard
              name={track.name}
              active={track.active}
              students={track.students}
              colorKey={track.track}
              progress={track.progress}
              href={`/admin/tracks/${track.id}`}
              stats={[
                {
                  icon: <Track className="size-6 text-text-primary" />,
                  value: track.onTrack,
                  label: "on track",
                  tone: "text-text-primary",
                  labelTone: "text-text-secondary",
                },
                {
                  icon: <AlertCircle className="size-6 text-text-warning" />,
                  value: track.atRisk,
                  label: "At risk",
                  tone: "text-text-warning",
                },
                {
                  icon: <HelpCircle className="size-6 text-text-error" />,
                  value: track.needsAttention,
                  label: "Needs attention",
                  tone: "text-text-error",
                },
              ]}
            />
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
