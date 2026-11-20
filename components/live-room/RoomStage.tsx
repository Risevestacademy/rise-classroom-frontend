"use client";

import * as React from "react";
import {
  isTrackReference,
  RoomAudioRenderer,
  StartAudio,
  useChat,
  useConnectionQualityIndicator,
  useConnectionState,
  useDataChannel,
  useIsRecording,
  useLocalParticipant,
  useParticipantAttributes,
  useParticipants,
  useTracks,
  VideoTrack,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionQuality, ConnectionState, Track, type Participant } from "livekit-client";

import { AlertCircle, Message01, UserMultiple, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  endSessionForAll,
  FEEDBACK_ATTRIBUTE,
  HAND_ATTRIBUTE,
  muteEveryone,
  REACTIONS_TOPIC,
  removeParticipant,
  ROLE_ATTRIBUTE,
  setParticipantMuted,
  setScreenShareAllowed,
  turnOffAllCameras,
  type Feedback,
} from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { ControlBar } from "./ControlBar";
import { displayName, OthersTile, ParticipantTile } from "./ParticipantTile";
import { ChatPanel, ParticipantsPanel, type PanelTab } from "./SidePanel";

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
  const feedback = (attributes?.[FEEDBACK_ATTRIBUTE] || undefined) as Feedback | undefined;

  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const screen = useTracks([Track.Source.ScreenShare]).filter(isTrackReference)[0];

  const [panel, setPanel] = React.useState<PanelTab | null>(null);
  const [pinned, setPinned] = React.useState<string | null>(null);
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

  const setOwnAttribute = (key: string, value: string, failure: string) =>
    localParticipant.setAttributes({ [key]: value }).catch(() => notify("error", failure));

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

  const host = participants.find((participant) => participant.attributes[ROLE_ATTRIBUTE] === "host");
  const pinnedRef = pinned ? cameras.find((ref) => ref.participant.identity === pinned) : undefined;
  const weakConnection = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RoomAudioRenderer />

      <RoomHeading
        title={title}
        host={host}
        count={participants.length}
        panel={panel}
        unreadChat={unreadChat}
        onPanel={togglePanel}
      />

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

      <div className="flex min-h-0 flex-1 gap-6 px-4 sm:px-10">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Gallery
            tiles={cameras}
            screen={screen}
            pinned={pinnedRef}
            featured={host?.identity}
            onOthers={() => showPanel("participants")}
          />
        </main>

        {panel === "participants" && (
          <ParticipantsPanel
            participants={participants}
            isHost={isHost}
            pinned={pinned}
            onClose={() => showPanel(null)}
            onPin={setPinned}
            onSetMuted={(participant, muted) =>
              hostAction(
                () => setParticipantMuted(sessionId, participant.identity, muted),
                `Couldn't ${muted ? "mute" : "unmute"} ${displayName(participant)}.`,
              )
            }
            onRemove={(participant) =>
              hostAction(() => removeParticipant(sessionId, participant.identity), `Couldn't remove ${displayName(participant)}.`)
            }
            onMuteAll={() => hostAction(() => muteEveryone(sessionId), "Couldn't mute everyone.")}
            onCamerasOff={() => hostAction(() => turnOffAllCameras(sessionId), "Couldn't turn off everyone's camera.")}
            onDisableScreenShare={() =>
              hostAction(() => setScreenShareAllowed(sessionId, false), "Couldn't turn off screen sharing.")
            }
          />
        )}
        {panel === "chat" && (
          <ChatPanel messages={chatMessages} onSend={send} sending={isSending} onClose={() => showPanel(null)} />
        )}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[120px] z-20 h-0">
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
        feedback={feedback}
        isHost={isHost}
        canShareScreen={typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia)}
        onToggleMic={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => {})}
        onToggleCamera={() => localParticipant.setCameraEnabled(!isCameraEnabled).catch(() => {})}
        onToggleShare={toggleShare}
        onToggleHand={() =>
          setOwnAttribute(HAND_ATTRIBUTE, handRaised ? "" : String(Date.now()), "Couldn't raise your hand. Try again.")
        }
        onReact={react}
        onFeedback={(next) => setOwnAttribute(FEEDBACK_ATTRIBUTE, next ?? "", "Couldn't send your feedback. Try again.")}
        onLeave={onLeave}
        onEndForAll={() => {
          onEndedForAll();
          hostAction(() => endSessionForAll(sessionId), "Couldn't end the session for everyone.");
        }}
      />
    </div>
  );
}

/** Cells in the gallery before the rest collapse into "+N Others". */
const GALLERY_CELLS = 12;
/** Cells beside the stage when a screen or a pinned person takes the big spot. */
const SIDE_CELLS = 4;

/**
 * The tiles, laid out as in the design: one row for up to four people, a big
 * tile beside smaller ones for five or six, then two rows of six. A screen
 * share or a pinned person takes the big spot, with the rest beside it.
 */
function Gallery({
  tiles,
  screen,
  pinned,
  featured,
  onOthers,
}: {
  tiles: TrackReferenceOrPlaceholder[];
  screen?: TrackReference;
  pinned?: TrackReferenceOrPlaceholder;
  featured?: string;
  onOthers: () => void;
}) {
  const stage = screen ?? pinned;

  if (stage) {
    const rest = screen ? tiles : tiles.filter((ref) => ref !== pinned);
    const { shown, hidden } = fit(rest, SIDE_CELLS);
    return (
      <ul className="grid min-h-0 flex-1 auto-rows-[minmax(160px,1fr)] grid-cols-2 gap-2 overflow-y-auto lg:grid-cols-6 lg:grid-rows-2 lg:overflow-hidden">
        <li className={cn("col-span-2 min-h-[220px] lg:row-span-2", rest.length ? "lg:col-span-4" : "lg:col-span-6")}>
          {screen ? (
            <section
              aria-label={`${displayName(screen.participant)} is presenting`}
              className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-room-screen"
            >
              <VideoTrack trackRef={screen} className="size-full object-contain" />
            </section>
          ) : (
            <ParticipantTile trackRef={pinned!} pinned className="size-full" />
          )}
        </li>
        {shown.map((ref) => (
          <li key={ref.participant.identity} className="min-h-0">
            <ParticipantTile
              trackRef={ref}
              presenting={ref.participant === screen?.participant}
              className="size-full"
            />
          </li>
        ))}
        {hidden.length > 0 && (
          <li className="min-h-0">
            <OthersTile participants={hidden} onClick={onOthers} className="size-full" />
          </li>
        )}
      </ul>
    );
  }

  const ordered = featured
    ? [...tiles].sort((a, b) => Number(b.participant.identity === featured) - Number(a.participant.identity === featured))
    : tiles;
  const { shown, hidden } = fit(ordered, GALLERY_CELLS);
  const layout = galleryLayout(shown.length + (hidden.length ? 1 : 0));

  return (
    <ul className={cn("grid min-h-0 flex-1 auto-rows-[minmax(180px,1fr)] grid-cols-2 gap-2 overflow-y-auto lg:overflow-hidden", layout.grid)}>
      {shown.map((ref, index) => (
        <li key={ref.participant.identity} className={cn("min-h-0", layout.cell(index), shown.length === 1 && "col-span-2")}>
          <ParticipantTile trackRef={ref} className="size-full" />
        </li>
      ))}
      {hidden.length > 0 && (
        <li className="min-h-0">
          <OthersTile participants={hidden} onClick={onOthers} className="size-full" />
        </li>
      )}
    </ul>
  );
}

/** Up to `cells` tiles; past that, one cell goes to "+N Others". */
function fit<T extends { participant: Participant }>(refs: T[], cells: number) {
  if (refs.length <= cells) return { shown: refs, hidden: [] as Participant[] };
  return { shown: refs.slice(0, cells - 1), hidden: refs.slice(cells - 1).map((ref) => ref.participant) };
}

/** Desktop grid classes for a number of cells; phones always get two columns. */
function galleryLayout(count: number): { grid: string; cell: (index: number) => string } {
  const none = () => "";
  if (count <= 4) return { grid: ["lg:grid-cols-1", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"][count] + " lg:grid-rows-1", cell: none };
  if (count === 5) return { grid: "lg:grid-cols-4 lg:grid-rows-2", cell: (index) => (index === 0 ? "col-span-2 lg:row-span-2" : "") };
  if (count === 6)
    return {
      grid: "lg:grid-cols-6 lg:grid-rows-2",
      cell: (index) => (index === 0 ? "col-span-2 lg:col-span-3 lg:row-span-2" : index === 5 ? "lg:col-span-2" : ""),
    };
  return { grid: "lg:grid-cols-6 lg:grid-rows-2", cell: none };
}

function RoomHeading({
  title,
  host,
  count,
  panel,
  unreadChat,
  onPanel,
}: {
  title: string;
  host?: Participant;
  count: number;
  panel: PanelTab | null;
  unreadChat: boolean;
  onPanel: (tab: PanelTab) => void;
}) {
  const now = useClock();
  const recordingFor = useRecordingTime();

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-4 pt-6 pb-6 sm:px-10 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:pb-10">
      <div className="min-w-0">
        <p className="text-lg/6 font-semibold text-neutral-350">{now && clockFormat.format(now)}</p>
        <h1 className="truncate text-xl/7 font-semibold text-white sm:text-2xl/8">{title}</h1>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        {host && (
          <p className="flex h-11 items-center gap-2 rounded-full bg-white/10 py-2 pr-4 pl-2 text-sm font-medium text-white">
            <PersonAvatar name={displayName(host)} colorKey={host.identity} size={24} className="size-7" />
            {displayName(host)}
          </p>
        )}
        {recordingFor !== null && (
          <p role="status" className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium text-white">
            <span aria-hidden className="size-4 rounded-full border-[1.5px] border-white bg-text-error" />
            <span className="sr-only">Recording</span>
            {formatDuration(recordingFor)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          aria-pressed={panel === "participants"}
          onClick={() => onPanel("participants")}
          className={cn(
            "flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-white transition-colors",
            panel === "participants" ? "bg-room-tile-blue" : "bg-white/10 hover:bg-white/15",
          )}
        >
          <UserMultiple className="size-4" />
          {count}
          <span className="max-sm:sr-only">{count === 1 ? "Participant" : "Participants"}</span>
        </button>
        <button
          type="button"
          aria-pressed={panel === "chat"}
          aria-label={unreadChat ? "Chat, new messages" : "Chat"}
          onClick={() => onPanel("chat")}
          className={cn(
            "relative flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-white transition-colors",
            panel === "chat" ? "bg-room-tile-blue" : "bg-room-pill hover:bg-white/15",
          )}
        >
          <Message01 className="size-[18px]" />
          <span className="max-sm:sr-only">Chat</span>
          {unreadChat && <span className="absolute top-2 right-2 size-2 rounded-full bg-room-active ring-2 ring-room-pill" />}
        </button>
      </div>
    </header>
  );
}

const subscribeEvery = (ms: number) => (onChange: () => void) => {
  const timer = setInterval(onChange, ms);
  return () => clearInterval(timer);
};
const subscribeToMinutes = subscribeEvery(15_000);
const subscribeToSeconds = subscribeEvery(1_000);
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const currentSecond = () => Math.floor(Date.now() / 1_000) * 1_000;

/** The time of day, kept to the minute. `null` on the server so it doesn't render a stale time. */
function useClock() {
  const minute = React.useSyncExternalStore(subscribeToMinutes, currentMinute, () => null);
  return minute === null ? null : new Date(minute);
}

/** How long the room has been recording, in ms, or `null` when it isn't. */
function useRecordingTime() {
  const recording = useIsRecording();
  const now = React.useSyncExternalStore(subscribeToSeconds, currentSecond, () => 0);
  const [since, setSince] = React.useState<number | null>(null);
  if (recording && since === null && now) setSince(now);
  if (!recording && since !== null) setSince(null);
  return since === null ? null : Math.max(0, now - since);
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
};

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
