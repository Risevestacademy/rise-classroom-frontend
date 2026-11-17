"use client";

import * as React from "react";
import {
  RoomAudioRenderer,
  StartAudio,
  useChat,
  useConnectionQualityIndicator,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useParticipantAttributes,
  useParticipants,
  useTracks,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { ConnectionQuality, ConnectionState, Track, type Participant } from "livekit-client";

import { AlertCircle, ComputerScreenShare, UserMultiple, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  endSessionForAll,
  HAND_ATTRIBUTE,
  muteParticipant,
  REACTIONS_TOPIC,
  removeParticipant,
  ROLE_ATTRIBUTE,
} from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { ControlBar } from "./ControlBar";
import { displayName, OthersTile, ParticipantTile } from "./ParticipantTile";
import { SidePanel, type PanelTab } from "./SidePanel";

/** Tiles shown before the rest collapse into "+N Others", as in the design. */
const MAX_TILES = 9;

type Notice = { id: number; tone: "info" | "warning" | "error"; message: string };
type Reaction = { id: number; emoji: string; name: string; left: number };

const clockFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });

/** Everything inside a connected room. */
export function RoomStage({
  sessionId,
  title,
  onLeave,
  onEndedForAll,
}: {
  sessionId: string;
  title: string;
  onLeave: () => void;
  /** Called just before the host ends the session, so the exit screen can say so. */
  onEndedForAll: () => void;
}) {
  const connection = useConnectionState();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, lastMicrophoneError, lastCameraError } =
    useLocalParticipant();
  const { quality } = useConnectionQualityIndicator({ participant: localParticipant });
  const { attributes } = useParticipantAttributes({ participant: localParticipant });
  const isHost = attributes?.[ROLE_ATTRIBUTE] === "host";
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);

  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const screens = useTracks([Track.Source.ScreenShare]).filter(isTrackReference);
  const screen = screens[0];

  const [panel, setPanel] = React.useState<PanelTab | null>(null);
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [reactions, setReactions] = React.useState<Reaction[]>([]);
  const { chatMessages, send, isSending } = useChat();
  const [seenMessages, setSeenMessages] = React.useState(0);

  const notify = React.useCallback((tone: Notice["tone"], message: string) => {
    const id = Date.now() + Math.random();
    setNotices((current) => [...current.filter((notice) => notice.message !== message), { id, tone, message }]);
    setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 5000);
  }, []);

  const showReaction = React.useCallback((emoji: string, name: string) => {
    const id = Date.now() + Math.random();
    setReactions((current) => [...current.slice(-20), { id, emoji, name, left: 4 + Math.random() * 18 }]);
    setTimeout(() => setReactions((current) => current.filter((reaction) => reaction.id !== id)), 4000);
  }, []);

  const { send: sendData } = useDataChannel(REACTIONS_TOPIC, (message) => {
    const emoji = new TextDecoder().decode(message.payload);
    showReaction(emoji, message.from ? displayName(message.from) : "Someone");
  });

  const chatOpen = panel === "chat";
  const unreadChat = !chatOpen && chatMessages.length > seenMessages;

  // Opening or closing the chat counts everything in it as read.
  const showPanel = (next: PanelTab | null) => {
    if (chatOpen || next === "chat") setSeenMessages(chatMessages.length);
    setPanel(next);
  };
  const togglePanel = (tab: PanelTab) => showPanel(panel === tab ? null : tab);

  async function toggleShare() {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
    } catch (error) {
      // Closing the browser's picker isn't a failure.
      if ((error as Error).name !== "NotAllowedError") notify("error", "Couldn't share your screen. Try again.");
    }
  }

  async function react(emoji: string) {
    showReaction(emoji, "You");
    await sendData(new TextEncoder().encode(emoji), { reliable: false, topic: REACTIONS_TOPIC }).catch(() => {});
  }

  async function hostAction(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
    } catch {
      notify("error", failure);
    }
  }

  if (connection === ConnectionState.Connecting || connection === ConnectionState.Disconnected) {
    return (
      <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4">
        <Spinner className="size-8 text-room-active" />
        <p className="text-base text-room-text">Joining {title}…</p>
      </div>
    );
  }

  const ordered = orderTiles(cameras, screen?.participant);
  const visible = ordered.length > MAX_TILES + 1 ? ordered.slice(0, MAX_TILES) : ordered;
  const hidden = ordered.slice(visible.length).map((ref) => ref.participant);
  const raisedHands = participants.filter((participant) => participant.attributes[HAND_ATTRIBUTE]).length;
  const weakConnection = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RoomAudioRenderer />

      <RoomHeading title={title} participants={participants} onPeople={() => togglePanel("participants")} />

      <div className="absolute inset-x-0 top-4 z-30 flex flex-col items-center gap-2 px-4">
        {connection === ConnectionState.Reconnecting && (
          <Banner tone="warning" icon={<Spinner />}>
            Reconnecting… your connection dropped. Hold on while we get you back in.
          </Banner>
        )}
        {connection === ConnectionState.Connected && weakConnection && (
          <Banner tone="warning" icon={<WifiOff01 />}>
            Your connection is weak, so others may not see or hear you clearly.
            {isCameraEnabled && (
              <button
                type="button"
                onClick={() => localParticipant.setCameraEnabled(false)}
                className="ml-2 cursor-pointer font-semibold underline underline-offset-2"
              >
                Turn off camera
              </button>
            )}
          </Banner>
        )}
        <StartAudio
          label="Your browser paused the sound. Click to hear the session."
          className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-medium text-text-brand shadow-lg"
        />
        {lastMicrophoneError && !isMicrophoneEnabled && (
          <Banner tone="error" icon={<AlertCircle />}>
            {microphoneProblem(lastMicrophoneError)}
          </Banner>
        )}
        {lastCameraError && !isCameraEnabled && (
          <Banner tone="error" icon={<AlertCircle />}>
            {cameraProblem(lastCameraError)}
          </Banner>
        )}
        {notices.map((notice) => (
          <Banner key={notice.id} tone={notice.tone} icon={<AlertCircle />}>
            {notice.message}
          </Banner>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-4 sm:px-8">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {screen ? (
            <>
              <section aria-label={`${displayName(screen.participant)} is presenting`} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[21px] bg-black">
                <VideoTrack trackRef={screen} className="size-full object-contain" />
                <p className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-2 text-sm font-medium text-white backdrop-blur-md">
                  <ComputerScreenShare className="size-4" />
                  {screen.participant.isLocal ? "You are presenting" : `${displayName(screen.participant)} is presenting`}
                </p>
                {screen.participant.isLocal && (
                  <button type="button" onClick={toggleShare} className="absolute right-3 bottom-3 cursor-pointer rounded-full bg-room-leave px-4 py-2 text-sm font-medium text-white hover:bg-room-leave-hover">
                    Stop presenting
                  </button>
                )}
              </section>
              <ul className="flex shrink-0 gap-3 overflow-x-auto pb-1">
                {ordered.map((ref) => (
                  <li key={ref.participant.identity} className="shrink-0">
                    <ParticipantTile trackRef={ref} compact className="h-[120px] w-[160px]" />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="grid min-h-0 flex-1 auto-rows-[minmax(0,279px)] grid-cols-2 content-start gap-3 overflow-y-auto sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:content-center lg:justify-center lg:grid-cols-[repeat(auto-fit,200px)]">
              {visible.map((ref) => (
                <li key={ref.participant.identity} className="min-h-0">
                  <ParticipantTile trackRef={ref} className="aspect-[200/279] h-full w-full max-sm:aspect-[3/4]" />
                </li>
              ))}
              {hidden.length > 0 && (
                <li className="min-h-0">
                  <OthersTile participants={hidden} onClick={() => showPanel("participants")} className="aspect-[200/279] h-full w-full max-sm:aspect-[3/4]" />
                </li>
              )}
            </ul>
          )}
        </main>

        {panel && (
          <SidePanel
            tab={panel}
            onTabChange={showPanel}
            onClose={() => showPanel(null)}
            title={title}
            participants={participants}
            messages={chatMessages}
            onSend={send}
            sending={isSending}
            isHost={isHost}
            onMute={(participant) =>
              hostAction(() => muteParticipant(sessionId, participant.identity), `Couldn't mute ${displayName(participant)}.`)
            }
            onRemove={(participant) =>
              hostAction(() => removeParticipant(sessionId, participant.identity), `Couldn't remove ${displayName(participant)}.`)
            }
          />
        )}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[96px] z-20 h-0">
        {reactions.map((reaction) => (
          <span
            key={reaction.id}
            className="absolute bottom-0 flex flex-col items-center gap-1"
            style={{ left: `${reaction.left}%`, animation: "room-reaction 4s ease-out forwards" }}
          >
            <span className="text-4xl">{reaction.emoji}</span>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{reaction.name}</span>
          </span>
        ))}
      </div>

      <ControlBar
        micOn={isMicrophoneEnabled}
        cameraOn={isCameraEnabled}
        sharing={isScreenShareEnabled}
        handRaised={handRaised}
        isHost={isHost}
        panel={panel}
        unreadChat={unreadChat}
        raisedHands={raisedHands}
        canShareScreen={typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia)}
        onToggleMic={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => {})}
        onToggleCamera={() => localParticipant.setCameraEnabled(!isCameraEnabled).catch(() => {})}
        onToggleShare={toggleShare}
        onToggleHand={() =>
          localParticipant
            .setAttributes({ [HAND_ATTRIBUTE]: handRaised ? "" : String(Date.now()) })
            .catch(() => notify("error", "Couldn't raise your hand. Try again."))
        }
        onReact={react}
        onPanel={togglePanel}
        onCopyLink={() =>
          navigator.clipboard
            .writeText(window.location.href)
            .then(() => notify("info", "Session link copied."))
            .catch(() => notify("error", "Couldn't copy the link."))
        }
        onLeave={onLeave}
        onEndForAll={() => {
          onEndedForAll();
          hostAction(() => endSessionForAll(sessionId), "Couldn't end the session for everyone.");
        }}
      />
    </div>
  );
}

/**
 * Presenters, then raised hands, then everyone in join order. Once there are
 * more people than tiles, recent speakers move up so they stay visible.
 */
function orderTiles<T extends { participant: Participant }>(refs: T[], presenter?: Participant) {
  const overflowing = refs.length > MAX_TILES + 1;
  const rank = (participant: Participant) =>
    participant === presenter ? 3 : participant.attributes[HAND_ATTRIBUTE] ? 2 : participant.isLocal ? 1 : 0;
  return [...refs].sort((a, b) => {
    const byRank = rank(b.participant) - rank(a.participant);
    if (byRank || !overflowing) return byRank;
    return (b.participant.lastSpokeAt?.getTime() ?? 0) - (a.participant.lastSpokeAt?.getTime() ?? 0);
  });
}

function RoomHeading({
  title,
  participants,
  onPeople,
}: {
  title: string;
  participants: Participant[];
  onPeople: () => void;
}) {
  const now = useClock();

  return (
    <header className="flex items-end justify-between gap-4 px-4 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8">
      <div className="min-w-0">
        <p className="text-lg/6 font-semibold text-neutral-350">{now && clockFormat.format(now)}</p>
        <h1 className="truncate text-xl/7 font-semibold text-white sm:text-2xl/8">{title}</h1>
      </div>
      <button
        type="button"
        onClick={onPeople}
        aria-label={`${participants.length} in this session`}
        className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-room-bar py-1 pr-3 pl-1 text-sm text-white transition-colors hover:bg-room-control"
      >
        <span className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <PersonAvatar
              key={participant.identity}
              name={displayName(participant)}
              colorKey={participant.identity}
              size={24}
              className="ring-2 ring-room-bar"
            />
          ))}
        </span>
        <UserMultiple className="size-4 text-room-text-muted sm:hidden" />
        {participants.length}
      </button>
    </header>
  );
}

const subscribeToClock = (onChange: () => void) => {
  const timer = setInterval(onChange, 15_000);
  return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** The time of day, kept to the minute. `null` on the server so it doesn't render a stale time. */
function useClock() {
  const minute = React.useSyncExternalStore(subscribeToClock, currentMinute, () => null);
  return minute === null ? null : new Date(minute);
}

const bannerTones = {
  info: "bg-info-surface text-text-info border-info-border",
  warning: "bg-warning-surface text-text-warning border-warning-border",
  error: "bg-error-surface text-text-error border-error-border",
};

function Banner({ tone, icon, children }: { tone: keyof typeof bannerTones; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex max-w-[560px] items-center gap-2.5 rounded-xl border px-4 py-2.5 font-work text-sm shadow-lg [&_svg]:size-[18px] [&_svg]:shrink-0",
        bannerTones[tone],
      )}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    />
  );
}

export function microphoneProblem(error: Error) {
  if (error.name === "NotAllowedError") return "Your browser is blocking the microphone. Allow it in the address bar, then try again.";
  if (error.name === "NotFoundError") return "We couldn't find a microphone. Plug one in, then try again.";
  if (error.name === "NotReadableError") return "Another app is using your microphone. Close it, then try again.";
  return "Couldn't turn on your microphone.";
}

export function cameraProblem(error: Error) {
  if (error.name === "NotAllowedError") return "Your browser is blocking the camera. Allow it in the address bar, then try again.";
  if (error.name === "NotFoundError") return "We couldn't find a camera. Plug one in, then try again.";
  if (error.name === "NotReadableError") return "Another app is using your camera. Close it, then try again.";
  return "Couldn't turn on your camera.";
}
