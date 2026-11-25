"use client";

import * as React from "react";
import {
  isTrackReference,
  useConnectionQualityIndicator,
  useIsMuted,
  useIsSpeaking,
  useMultibandTrackVolume,
  useParticipantAttributes,
  useParticipantTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionQuality, Track, type Participant } from "livekit-client";

import { ComputerScreenShare, MicOff02, Pin, WavingHand02, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { AVATAR_ATTRIBUTE, feedbackFor, FEEDBACK_ATTRIBUTE, HAND_ATTRIBUTE } from "@/lib/live-room";
import { cn } from "@/lib/utils";

export const displayName = (participant: Participant) =>
  participant.name || participant.identity;

/** Their profile photo, if they have one. */
export const avatarOf = (participant: Participant) => participant.attributes[AVATAR_ATTRIBUTE] || undefined;

/** One person in the call: their camera, or their avatar on their colour. */
export function ParticipantTile({
  trackRef,
  presenting = false,
  pinned = false,
  fit = "cover",
  className,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  /** They're sharing their screen, which shows on the stage. */
  presenting?: boolean;
  pinned?: boolean;
  /** "contain" shows the whole camera picture, for a tile far wider than it. */
  fit?: "cover" | "contain";
  className?: string;
}) {
  const { participant } = trackRef;
  const name = displayName(participant);
  const cameraOff = useIsMuted(trackRef);
  const micOff = useIsMuted({ participant, source: Track.Source.Microphone });
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const { attributes } = useParticipantAttributes({ participant });
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);
  const feedback = feedbackFor(attributes?.[FEEDBACK_ATTRIBUTE]);
  const photo = attributes?.[AVATAR_ATTRIBUTE] || undefined;
  const weakSignal = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <article
      aria-label={name}
      className={cn(
        "relative isolate flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-room-tile [container-type:size]",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:ring-2 after:ring-room-speaking after:transition-opacity after:duration-200 after:ring-inset",
        speaking ? "after:opacity-100" : "after:opacity-0",
        className,
      )}
    >
      {isTrackReference(trackRef) && !cameraOff ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            "absolute inset-0 -z-10 size-full",
            fit === "contain" ? "object-contain" : "object-cover",
            participant.isLocal && "-scale-x-100",
          )}
        />
      ) : (
        <>
          {photo && (
            // The tile takes its colour from their photo: the same picture, blurred and dimmed.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              aria-hidden
              onError={(event) => (event.currentTarget.hidden = true)}
              className="absolute inset-0 -z-10 size-full scale-125 object-cover blur-2xl brightness-50 saturate-150"
            />
          )}
          <PersonAvatar
            name={name}
            src={photo}
            colorKey={participant.identity}
            size={80}
            // Grows with the tile: small in the filmstrip, larger alone on the stage.
            className="size-[clamp(36px,34cqmin,112px)] text-[length:clamp(14px,12cqmin,36px)] leading-none"
          />
        </>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        {pinned && (
          <Badge label="Pinned" className="bg-black/50 text-white">
            <Pin />
          </Badge>
        )}
        {weakSignal && (
          <Badge label="Weak connection" className="bg-warning-surface text-icon-warning">
            <WifiOff01 />
          </Badge>
        )}
        {feedback && (
          <span
            key={feedback.label}
            role="img"
            aria-label={feedback.label}
            title={feedback.label}
            className={cn("flex size-6 items-center justify-center rounded-full bg-black/50 text-sm", popIn)}
          >
            {feedback.emoji}
          </span>
        )}
        {handRaised && (
          <Badge label="Hand raised" className="bg-room-active text-text-brand">
            <WavingHand02 />
          </Badge>
        )}
      </div>

      <p className="absolute right-2 bottom-2 left-2 flex">
        <span className="flex h-7 min-w-0 items-center gap-1.5 rounded-lg bg-black/55 pr-2.5 pl-0.5 text-[13px] font-medium text-white backdrop-blur-sm">
          {micOff ? (
            <span role="img" aria-label="Muted" title="Muted" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-room-off text-room-off-text [&_svg]:size-3.5">
              <MicOff02 />
            </span>
          ) : (
            <span
              role="img"
              aria-label={speaking ? "Speaking" : "Unmuted"}
              title={speaking ? "Speaking" : "Unmuted"}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors [&_svg]:size-4",
                speaking ? "bg-room-speaking text-room-canvas" : "text-white",
              )}
            >
              <VoiceBars participant={participant} speaking={speaking} />
            </span>
          )}
          {presenting && (
            <span role="img" aria-label="Presenting" title="Presenting" className="flex shrink-0 [&_svg]:size-4">
              <ComputerScreenShare />
            </span>
          )}
          <span className="truncate">
            {name}
            {participant.isLocal && " (You)"}
          </span>
        </span>
      </p>
    </article>
  );
}

// A badge that appears with a little bounce.
const popIn = "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in-0 motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)]";

const reducedMotion = {
  subscribe(onChange: () => void) {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

// The voice's range, about 90 Hz to 3.5 kHz, in three bands (LiveKit's default listens far higher).
const voiceBands = { bands: 3, loPass: 4, hiPass: 150, updateInterval: 50 };

/**
 * LiveKit gives each band as the square root of its level in decibels, so
 * anything audible sits between about 0.6 and 0.9. This turns it back into
 * 0 for background hum (-70 dB) up to 1 for a raised voice (-25 dB).
 */
const loudness = (band: number) => (band > 0 ? Math.min(1, Math.max(0, ((band * band - 1) * 100 + 70) / 45)) : 0);

/** Three bars, out of a 12-unit square: tall in the middle, as in the design. */
const bars = [3, 6, 9];
const stillHeights = [5, 9, 5];

/**
 * The unmuted badge's bars. While someone talks they jump with how loud they
 * are (low pitches in the middle, higher ones either side); when they're
 * quiet it's a flat line.
 */
function VoiceBars({ participant, speaking }: { participant: Participant; speaking: boolean }) {
  const [mic] = useParticipantTracks([Track.Source.Microphone], participant.identity);
  const still = React.useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => true);
  const live = speaking && !still;
  // Measuring only while they talk keeps a full room cheap.
  const bands = useMultibandTrackVolume(live ? mic : undefined, voiceBands);
  const [peaks, setPeaks] = React.useState([0.1, 0.1, 0.1]);

  if (!speaking) {
    return (
      <svg viewBox="0 0 12 12" aria-hidden>
        <rect x={2} y={5.25} width={8} height={1.5} rx={0.75} fill="currentColor" />
      </svg>
    );
  }

  // Each band is measured against its own recent peak, so a quiet mic, and the
  // naturally quieter high pitches, move their bars as much as a loud voice.
  const levels = bands.map(loudness);
  const nextPeaks = peaks.map((peak, index) => Math.max(levels[index] ?? 0, peak * 0.97, 0.1));
  if (live && nextPeaks.some((peak, index) => Math.abs(peak - peaks[index]) > 0.005)) setPeaks(nextPeaks);
  const share = (index: number) => Math.min(1, (levels[index] ?? 0) / nextPeaks[index]);
  // The outer bars also follow the middle one a little, so they never sit still while someone talks.
  const outer = (index: number) => 2 + Math.max(share(index), share(0) * 0.6) * 9;
  const heights = live ? [outer(1), 2 + share(0) * 9, outer(2)] : stillHeights;

  return (
    <svg viewBox="0 0 12 12" aria-hidden>
      {heights.map((barHeight, index) => (
        <rect
          key={index}
          x={bars[index] - 1}
          y={6 - barHeight / 2}
          width={2}
          height={barHeight}
          rx={1}
          fill="currentColor"
          className="transition-[y,height] duration-75 ease-out"
        />
      ))}
    </svg>
  );
}

function Badge({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("flex size-6 items-center justify-center rounded-full [&_svg]:size-3", className)}
    >
      {children}
    </span>
  );
}

/** The last cell when there are more people than fit: a cluster of avatars and a count. */
export function OthersTile({
  participants,
  onClick,
  className,
}: {
  participants: Participant[];
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${participants.length} more ${participants.length === 1 ? "person" : "people"}, show participants`}
      className={cn(
        "flex min-h-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-room-tile transition-colors hover:bg-room-tile-hover focus-visible:outline-2 focus-visible:outline-white",
        className,
      )}
    >
      <span className="flex -space-x-2">
        {participants.slice(0, 3).map((participant) => (
          <PersonAvatar
            key={participant.identity}
            name={displayName(participant)}
            src={avatarOf(participant)}
            colorKey={participant.identity}
            size={36}
            className="ring-2 ring-room-tile"
          />
        ))}
      </span>
      <span className="text-sm font-medium text-white">+{participants.length} more</span>
    </button>
  );
}
