"use client";

import * as React from "react";
import {
  isTrackReference,
  useConnectionQualityIndicator,
  useIsMuted,
  useIsSpeaking,
  useParticipantAttributes,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionQuality, Track, type Participant } from "livekit-client";

import { AudioLines, MicOff02, Pin, WavingHand02, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { feedbackFor, FEEDBACK_ATTRIBUTE, HAND_ATTRIBUTE } from "@/lib/live-room";
import { cn } from "@/lib/utils";

/** The tile colours from the design; each person keeps theirs. */
const tileColors = ["bg-room-tile-blue", "bg-room-tile-slate", "bg-room-tile-teal"];

export function tileColorFor(key: string) {
  let total = 0;
  for (const char of key) total += char.charCodeAt(0);
  return tileColors[total % tileColors.length];
}

export const displayName = (participant: Participant) =>
  participant.name || participant.identity;

/** One person in the call: their camera, or their avatar on their colour. */
export function ParticipantTile({
  trackRef,
  presenting = false,
  pinned = false,
  className,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  /** They're sharing their screen, which shows on the stage. */
  presenting?: boolean;
  pinned?: boolean;
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
  const weakSignal = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <article
      aria-label={name}
      className={cn(
        "@container relative isolate flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl transition-shadow",
        tileColorFor(participant.identity),
        speaking && "ring-2 ring-info-border",
        className,
      )}
    >
      {isTrackReference(trackRef) && !cameraOff ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn("absolute inset-0 -z-10 size-full object-cover", participant.isLocal && "-scale-x-100")}
        />
      ) : (
        <PersonAvatar
          name={name}
          colorKey={participant.identity}
          size={80}
          className="size-[82px] max-sm:size-[56px] max-sm:text-lg"
        />
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {presenting && <span className="text-sm text-white">(Sharing screen)</span>}
        {pinned && (
          <Badge label="Pinned" className="bg-room-control text-white">
            <Pin />
          </Badge>
        )}
        {weakSignal && (
          <Badge label="Weak connection" className="bg-warning-surface text-icon-warning">
            <WifiOff01 />
          </Badge>
        )}
        {feedback && (
          <span role="img" aria-label={feedback.label} title={feedback.label} className="flex size-6 items-center justify-center rounded-full bg-black/40 text-sm">
            {feedback.emoji}
          </span>
        )}
        {handRaised && (
          <Badge label="Hand raised" className="bg-room-active text-text-brand">
            <WavingHand02 />
          </Badge>
        )}
        {micOff ? (
          <Badge label="Muted" className="bg-room-control text-white">
            <MicOff02 />
          </Badge>
        ) : (
          <Badge label={speaking ? "Speaking" : "Unmuted"} className="border border-info-border bg-info-text text-white">
            <AudioLines className={cn(!speaking && "opacity-60")} />
          </Badge>
        )}
      </div>

      <p className="absolute inset-x-3 bottom-3 flex justify-center">
        <span className="truncate rounded-full bg-white/10 px-2 py-2 text-sm/5 font-medium text-white backdrop-blur-md">
          {name}
          {participant.isLocal && " (You)"}
        </span>
      </p>
    </article>
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
      className={cn(
        "flex min-h-0 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl bg-room-tile-others transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white",
        className,
      )}
    >
      <span className="flex max-w-[96px] flex-wrap justify-center -space-x-2 gap-y-1">
        {participants.slice(0, 8).map((participant) => (
          <PersonAvatar
            key={participant.identity}
            name={displayName(participant)}
            colorKey={participant.identity}
            size={24}
            className="ring-[1.5px] ring-room-tile-others"
          />
        ))}
      </span>
      <span className="rounded-full bg-black px-2.5 py-2 text-sm/5 font-medium text-white">
        +{participants.length} {participants.length === 1 ? "Other" : "Others"}
      </span>
    </button>
  );
}
