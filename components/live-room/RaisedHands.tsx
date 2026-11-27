"use client";

import * as React from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type Participant } from "livekit-client";

import { ArrowDown01, Cancel01, WavingHand02 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { HAND_ATTRIBUTE } from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { avatarOf, displayName } from "./ParticipantTile";

export type RaisedHand = { participant: Participant; since: number };

const raisedSince = (participant: Participant) => Number(participant.attributes[HAND_ATTRIBUTE] || 0);

/** Everyone with a hand up, the first to raise it first. */
export function useRaisedHands(): RaisedHand[] {
  const room = useRoomContext();
  const read = React.useCallback(
    () =>
      [room.localParticipant, ...room.remoteParticipants.values()]
        .filter((participant) => raisedSince(participant) > 0)
        .map((participant) => ({ participant, since: raisedSince(participant) }))
        .sort((a, b) => a.since - b.since),
    [room],
  );
  const [hands, setHands] = React.useState(read);

  React.useEffect(() => {
    const update = () => setHands(read());
    update();
    const events = [
      RoomEvent.ParticipantAttributesChanged,
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
    ] as const;
    events.forEach((event) => room.on(event, update));
    return () => {
      events.forEach((event) => room.off(event, update));
    };
  }, [room, read]);

  return hands;
}

/**
 * Who has a hand up. One person gets a card with their name; once there's a
 * queue it folds into a hand and a count, and clicking that opens the queue in
 * the order hands went up. Dismissing the card hides it until someone else
 * raises theirs.
 */
export function RaisedHandsCard({ hands, className }: { hands: RaisedHand[]; className?: string }) {
  // The newest raise that's been dismissed; a later one brings the card back.
  const [dismissedAt, setDismissedAt] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const latest = hands.reduce((newest, hand) => Math.max(newest, hand.since), 0);

  // Your own hand alone shows on the hand button already.
  if (hands.every((hand) => hand.participant.isLocal)) return null;

  const [first] = hands;
  const many = hands.length > 1;
  const name = (participant: Participant) => (participant.isLocal ? "You" : displayName(participant));
  const count = `${hands.length} raised hands`;

  if (!many && latest <= dismissedAt) return null;

  if (many && !open) {
    return (
      <section aria-label="Raised hands" className={className}>
        <button
          // A new hand in the queue pops it again.
          key={latest}
          type="button"
          aria-expanded={false}
          aria-label={`${count}, show the queue`}
          title="Show the queue"
          onClick={() => setOpen(true)}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-room-menu-border bg-room-menu py-1 pr-3.5 pl-1 text-sm font-semibold text-white tabular-nums shadow-[0_8px_24px_rgb(0_0_0/0.5)] transition-[background-color,scale] hover:bg-room-control-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-75 motion-safe:duration-300 motion-safe:active:scale-95"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-room-active text-text-brand">
            <WavingHand02 className="size-[18px]" />
          </span>
          {hands.length}
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label="Raised hands"
      className={cn(
        "w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border border-room-menu-border bg-room-menu text-white shadow-[0_8px_24px_rgb(0_0_0/0.5)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300",
        className,
      )}
    >
      <div role="status" className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-room-active text-text-brand">
          <WavingHand02 className="size-[18px]" />
        </span>
        <p className="min-w-0 flex-1 text-sm/5">
          {many ? (
            <span className="font-medium">{count}</span>
          ) : (
            <>
              <span className="font-medium">{name(first.participant)}</span>{" "}
              {first.participant.isLocal ? "raised your hand" : "raised their hand"}
            </>
          )}
        </p>
        {many ? (
          <button
            type="button"
            aria-label="Hide the queue"
            aria-expanded
            onClick={() => setOpen(false)}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-room-text-muted hover:bg-white/10 hover:text-white"
          >
            <ArrowDown01 className="size-5 rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissedAt(latest)}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-room-text-muted hover:bg-white/10 hover:text-white"
          >
            <Cancel01 className="size-4" />
          </button>
        )}
      </div>
      {many && (
        <ol className="flex max-h-[220px] flex-col gap-1 overflow-y-auto border-t border-room-menu-border px-2 py-2">
          {hands.map(({ participant }, index) => (
            <li
              key={participant.identity}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
            >
              <span className="w-4 shrink-0 text-center text-xs text-room-text-muted">{index + 1}</span>
              <PersonAvatar
                name={displayName(participant)}
                src={avatarOf(participant)}
                colorKey={participant.identity}
                size={24}
                className="size-7"
              />
              <span className="min-w-0 flex-1 truncate text-sm">{name(participant)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
