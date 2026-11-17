"use client";

import * as React from "react";
import {
  useConnectionQualityIndicator,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  useParticipantAttributes,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionQuality, Track, type Participant } from "livekit-client";

import { AudioLines, MicOff02, WavingHand02, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { HAND_ATTRIBUTE, ROLE_ATTRIBUTE } from "@/lib/live-room";
import { cn } from "@/lib/utils";

/** The tile backgrounds from the design; each person keeps theirs. */
const gradients = [
  "from-[#5a6e75] to-[#06283a]",
  "from-[#845400] to-[#483411]",
  "from-[#60481f] to-[#4a3c20]",
  "from-[#988af8] to-[#504a77]",
  "from-[#06b4f2] to-[#00455d]",
];

export function gradientFor(key: string) {
  let total = 0;
  for (const char of key) total += char.charCodeAt(0);
  return gradients[total % gradients.length];
}

export const displayName = (participant: Participant) =>
  participant.name || participant.identity;

/** One person in the call: their camera, or their avatar on their colour. */
export function ParticipantTile({
  trackRef,
  compact = false,
  className,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  /** The smaller tiles beside a screen share. */
  compact?: boolean;
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
  const host = attributes?.[ROLE_ATTRIBUTE] === "host";
  const weakSignal = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <article
      aria-label={name}
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden rounded-[21px] bg-linear-to-b transition-shadow",
        gradientFor(participant.identity),
        speaking && "ring-2 ring-room-active",
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
          size={compact ? 48 : 80}
          className={cn(!compact && "max-sm:size-[56px] max-sm:text-lg")}
        />
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {weakSignal && (
          <Badge label="Weak connection" className="bg-warning-surface text-icon-warning">
            <WifiOff01 />
          </Badge>
        )}
        {handRaised && (
          <Badge label="Hand raised" className="bg-brand-700 text-white">
            <WavingHand02 />
          </Badge>
        )}
        {micOff ? (
          <Badge label="Muted" className="bg-neutral-600 text-white">
            <MicOff02 />
          </Badge>
        ) : (
          speaking && (
            <Badge label="Speaking" className="border border-info-border bg-info-text text-white">
              <AudioLines />
            </Badge>
          )
        )}
      </div>

      <p
        className={cn(
          "absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] items-center gap-1.5 rounded-full bg-white/10 font-medium text-white backdrop-blur-md",
          compact ? "bottom-2 left-2 px-2 py-1 text-xs" : "px-2.5 py-2 text-sm/5",
        )}
      >
        <span className="truncate">
          {name}
          {participant.isLocal && " (You)"}
        </span>
        {host && <span className="shrink-0 text-xs text-room-active">Host</span>}
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
      className={cn("flex size-6 items-center justify-center rounded-full [&_svg]:size-3.5", className)}
    >
      {children}
    </span>
  );
}

/** The last grid cell when there are more people than fit: a cluster of avatars and a count. */
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
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[21px] bg-linear-to-b from-[#60481f] to-[#4a3c20] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white",
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
            className="ring-[1.5px] ring-room-canvas"
          />
        ))}
      </span>
      <span className="rounded-full bg-black px-2.5 py-2 text-sm/5 font-medium text-white">
        +{participants.length} {participants.length === 1 ? "Other" : "Others"}
      </span>
    </button>
  );
}
