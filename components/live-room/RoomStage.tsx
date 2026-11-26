"use client";

import * as React from "react";
import {
  isTrackReference,
  RoomAudioRenderer,
  StartAudio,
  useConnectionQualityIndicator,
  useConnectionState,
  useDataChannel,
  useIsRecording,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useParticipantAttributes,
  useParticipants,
  useTracks,
  VideoTrack,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { useQuery } from "@tanstack/react-query";
import { ConnectionQuality, ConnectionState, LocalVideoTrack, Track, VideoPresets, type Participant } from "livekit-client";

import { AlertCircle, ComputerScreenShare, Message01, UserMultiple, WifiOff01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  AVATAR_ATTRIBUTE,
  endSessionForAll,
  FEEDBACK_ATTRIBUTE,
  HAND_ATTRIBUTE,
  LABEL_ATTRIBUTE,
  latestSettings,
  mayShareScreen,
  muteEveryone,
  parseSessionSettings,
  REACTIONS_TOPIC,
  recordingProblem,
  removeParticipant,
  ROLE_ATTRIBUTE,
  roleLabel,
  muteParticipant,
  SESSION_TOPIC,
  setScreenShare,
  SETTINGS_ATTRIBUTE,
  startRecording,
  turnOffAllCameras,
  type Feedback,
  type SessionSettings,
} from "@/lib/live-room";
import { ApiError } from "@/lib/api";
import { getSessionEntry, personName, type RoomAccess } from "@/lib/live-sessions";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";
import { ControlBar } from "./ControlBar";
import { avatarOf, displayName, OthersTile, ParticipantTile } from "./ParticipantTile";
import { mentions } from "./mentions";
import { RaisedHandsCard, useRaisedHands } from "./RaisedHands";
import { playCue, useRoomSounds } from "./room-sounds";
import { useFloatingVideo } from "./FloatingVideo";
import { SessionSettingsDialog, type SectionId } from "./SessionSettings";
import { useRoomShortcuts } from "./shortcuts";
import { useSessionChat } from "./useSessionChat";
import { ChatPanel, ParticipantsPanel, type PanelTab } from "./SidePanel";

type Notice = { id: number; tone: "info" | "warning" | "error"; message: string };
type Reaction = { id: number; emoji: string; name: string; left: number };

const SESSION_ENDED = "ended";
const raisedNow = () => String(Date.now());

/** A photo link short enough to pass round the room; an embedded image isn't. */
const shareablePhoto = (image?: string | null) => (image && /^https?:\/\//.test(image) && image.length <= 1024 ? image : "");

const clockFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });

/** Everything inside a connected room. */
export function RoomStage({
  sessionId,
  title,
  access,
  onLeave,
  onEndedForAll,
  onHostEnded,
}: {
  sessionId: string;
  title: string;
  access: RoomAccess;
  onLeave: () => void;
  /** The host ended the session for everyone; they leave the room. */
  onEndedForAll: () => void;
  /** Someone else ended it; everyone else leaves too. */
  onHostEnded: () => void;
}) {
  const connection = useConnectionState();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, lastMicrophoneError, lastCameraError } =
    useLocalParticipant();
  const { quality } = useConnectionQualityIndicator({ participant: localParticipant });
  const { attributes } = useParticipantAttributes({ participant: localParticipant });
  // Host controls follow what the backend lets this person do.
  const isHost = access.canModerate;

  const photo = shareablePhoto(useQuery(sessionQuery()).data?.user.image);

  // The backend's token carries no attributes, so say who we are once in:
  // the host pill, the participants list and everyone's tiles read these.
  React.useEffect(() => {
    if (connection !== ConnectionState.Connected) return;
    const role = roomRoles[access.sessionRole];
    const label = roleLabel(access.platformRole);
    const current = localParticipant.attributes;
    if (current[ROLE_ATTRIBUTE] === role && current[LABEL_ATTRIBUTE] === label && (current[AVATAR_ATTRIBUTE] ?? "") === photo) return;
    localParticipant
      .setAttributes({ [ROLE_ATTRIBUTE]: role, [LABEL_ATTRIBUTE]: label, [AVATAR_ATTRIBUTE]: photo })
      .catch(() => {});
  }, [connection, localParticipant, access.sessionRole, access.platformRole, photo]);
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);
  const raisedHands = useRaisedHands();
  const feedback = (attributes?.[FEEDBACK_ATTRIBUTE] || undefined) as Feedback | undefined;
  const sessionSettings = useSessionSettings(sessionId, isHost);
  const { settings, setSettings, blocked } = sessionSettings;
  const recording = useRoomRecording(sessionId, isHost && settings.autoRecord, connection === ConnectionState.Connected);
  const permissions = useLocalParticipantPermissions();

  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const screen = useTracks([Track.Source.ScreenShare]).filter(isTrackReference)[0];

  const [panel, setPanel] = React.useState<PanelTab | null>(null);
  const [pinned, setPinned] = React.useState<string | null>(null);
  const host = participants.find((participant) => participant.attributes[ROLE_ATTRIBUTE] === "host");
  const floating = useFloatingVideo({ pinned, host: host?.identity });
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [reactions, setReactions] = React.useState<Reaction[]>([]);
  const [settingsOpen, setSettingsOpen] = React.useState<SectionId | true | false>(false);
  const [seenMessages, setSeenMessages] = React.useState(0);
  const [announcement, setAnnouncement] = React.useState("");
  const shownPanel = usePresence(panel);
  const panelNow = React.useRef(panel);
  React.useEffect(() => {
    panelNow.current = panel;
  }, [panel]);

  useRoomSounds({ hands: isHost });

  const notify = React.useCallback((tone: Notice["tone"], message: string) => {
    const id = Date.now() + Math.random();
    setNotices((current) => [...current.filter((notice) => notice.message !== message), { id, tone, message }]);
    setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 5000);
  }, []);

  // Someone tagging you with "@" gets a notice, wherever you are in the room.
  const chat = useSessionChat(sessionId, access.canReadChat, (message) => {
    if (message.sender.id === access.userId) return;
    if (mentions(message.body, localParticipant.name ?? "")) {
      notify("info", `${personName(message.sender) || "Someone"} mentioned you in the chat.`);
      playCue("mention");
    } else if (panelNow.current !== "chat") {
      playCue("message");
    }
  }, { id: access.userId, name: localParticipant.name ?? "", image: photo || null });
  const chatMessages = chat.messages;

  const showReaction = React.useCallback((emoji: string, name: string) => {
    const id = Date.now() + Math.random();
    setReactions((current) => [...current.slice(-20), { id, emoji, name, left: 4 + Math.random() * 18 }]);
    setTimeout(() => setReactions((current) => current.filter((reaction) => reaction.id !== id)), 4000);
  }, []);

  useEnforcedSettings(sessionSettings, notify);
  useScreenShareRights(sessionId, isHost, settings.screenShare, notify);

  const { send: sendData } = useDataChannel(REACTIONS_TOPIC, (message) => {
    const emoji = new TextDecoder().decode(message.payload);
    showReaction(emoji, message.from ? displayName(message.from) : "Someone");
  });

  // PENDING-BACKEND: ending a session doesn't close the LiveKit room yet, so
  // the host tells everyone here. Each person checks with the backend before
  // leaving, so nobody else can end it for the room.
  const { send: sendSessionSignal } = useDataChannel(SESSION_TOPIC, (message) => {
    if (new TextDecoder().decode(message.payload) !== SESSION_ENDED) return;
    getSessionEntry(sessionId)
      .then((entry) => entry.join.blockedReason === "ENDED" && onHostEnded())
      .catch(() => {});
  });

  async function endForEveryone() {
    try {
      await endSessionForAll(sessionId);
    } catch {
      notify("error", "Couldn't end the session for everyone. Try again.");
      return;
    }
    await sendSessionSignal(new TextEncoder().encode(SESSION_ENDED), { reliable: true, topic: SESSION_TOPIC }).catch(
      () => {},
    );
    onEndedForAll();
  }

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

  const toggleMic = () => {
    if (!isMicrophoneEnabled && blocked.microphone) return notify("info", "The host has turned off microphones.");
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => {});
  };
  const toggleCamera = () => {
    if (!isCameraEnabled && blocked.camera) return notify("info", "The host has turned off cameras.");
    localParticipant.setCameraEnabled(!isCameraEnabled, cameraCapture(settings.videoQuality)).catch(() => {});
  };
  const toggleHand = () => {
    if (!handRaised && blocked.handRaising) return notify("info", "The host has turned off hand raising.");
    setOwnAttribute(HAND_ATTRIBUTE, handRaised ? "" : raisedNow(), "Couldn't raise your hand. Try again.");
  };
  const canShareScreen =
    mayShareScreen(permissions, access.canShareScreen) &&
    !blocked.screenShare &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getDisplayMedia);

  // Said out loud for screen readers, since the key press doesn't move focus to the control.
  useRoomShortcuts({
    mic: () => {
      toggleMic();
      if (isMicrophoneEnabled || !blocked.microphone) setAnnouncement(isMicrophoneEnabled ? "Microphone off" : "Microphone on");
    },
    camera: () => {
      toggleCamera();
      if (isCameraEnabled || !blocked.camera) setAnnouncement(isCameraEnabled ? "Camera off" : "Camera on");
    },
    share: canShareScreen ? () => void toggleShare() : undefined,
    hand: () => {
      toggleHand();
      if (handRaised || !blocked.handRaising) setAnnouncement(handRaised ? "Hand lowered" : "Hand raised");
    },
    chat: () => togglePanel("chat"),
    participants: () => togglePanel("participants"),
    help: () => setSettingsOpen("shortcuts"),
  });

  async function react(emoji: string) {
    showReaction(emoji, "You");
    await sendData(new TextEncoder().encode(emoji), { reliable: false, topic: REACTIONS_TOPIC }).catch(() => {});
  }

  const setOwnAttribute = (key: string, value: string, failure: string) =>
    localParticipant.setAttributes({ [key]: value }).catch(() => notify("error", failure));

  async function hostAction(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
    } catch (error) {
      // The backend says why, e.g. "That participant isn't in the session right now".
      const reason = error instanceof ApiError && error.status < 500 ? error.message : "";
      notify("error", reason || failure);
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

  const pinnedRef = pinned ? cameras.find((ref) => ref.participant.identity === pinned) : undefined;
  const weakConnection = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RoomAudioRenderer />
      {floating.element}
      <p role="status" className="sr-only">
        {announcement}
      </p>

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

      <div className="flex min-h-0 flex-1 gap-4 px-4 sm:px-6">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <RaisedHandsCard hands={raisedHands} className="absolute top-2 left-2 z-20" />
          <Gallery
            tiles={cameras}
            screen={screen}
            pinned={pinnedRef}
            featured={host?.identity}
            onOthers={() => showPanel("participants")}
            onStopShare={() => void toggleShare()}
          />
        </main>

        {shownPanel.tab === "participants" && (
          <ParticipantsPanel
            participants={participants}
            isHost={isHost}
            pinned={pinned}
            opening={shownPanel.opening}
            leaving={shownPanel.leaving}
            onClose={() => showPanel(null)}
            onPin={setPinned}
            onMute={(participant) =>
              hostAction(() => muteParticipant(sessionId, participant.identity), `Couldn't mute ${displayName(participant)}.`)
            }
            onStopShare={(participant) =>
              hostAction(
                () => setScreenShare(sessionId, participant.identity, "stop"),
                `Couldn't stop ${displayName(participant)}'s screen share.`,
              )
            }
            onRemove={(participant) =>
              hostAction(() => removeParticipant(sessionId, participant.identity), `Couldn't remove ${displayName(participant)}.`)
            }
            onMuteAll={() => hostAction(() => muteEveryone(sessionId), "Couldn't mute everyone.")}
            onCamerasOff={() => hostAction(() => turnOffAllCameras(sessionId), "Couldn't turn off everyone's camera.")}
            onDisableScreenShare={() => setSettings({ ...settings, screenShare: false })}
          />
        )}
        {shownPanel.tab === "chat" && (
          <ChatPanel
            opening={shownPanel.opening}
            leaving={shownPanel.leaving}
            messages={chatMessages}
            userId={access.userId}
            loading={chat.loading}
            onSend={(message) =>
              chat.send(message).catch((error) => {
                notify("error", "Couldn't send your message. Try again.");
                throw error;
              })
            }
            canSend={access.canSendChat && !blocked.chat}
            blockedReason={blocked.chat ? "The host has turned off chat" : "You can't send messages in this session"}
            maxLength={access.chatMaxLength}
            people={participants
              .filter((participant) => !participant.isLocal)
              .map((participant) => ({ id: participant.identity, name: displayName(participant) }))}
            selfName={localParticipant.name ?? ""}
            onClose={() => showPanel(null)}
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
        status={<RecordingTimer />}
        micOn={isMicrophoneEnabled}
        cameraOn={isCameraEnabled}
        sharing={isScreenShareEnabled}
        handRaised={handRaised}
        feedback={feedback}
        isHost={isHost}
        canShareScreen={canShareScreen}
        floating={
          floating.supported
            ? {
                open: floating.open,
                available: floating.available,
                onToggle: () => void floating.toggle().catch(() => notify("error", "Couldn't open the floating window. Try again.")),
              }
            : undefined
        }
        blocked={blocked}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleShare={toggleShare}
        onToggleHand={toggleHand}
        onReact={react}
        onFeedback={(next) => setOwnAttribute(FEEDBACK_ATTRIBUTE, next ?? "", "Couldn't send your feedback. Try again.")}
        onOpenSettings={() => setSettingsOpen(true)}
        onLeave={onLeave}
        onEndForAll={() => void endForEveryone()}
      />

      <SessionSettingsDialog
        open={settingsOpen !== false}
        section={typeof settingsOpen === "string" ? settingsOpen : undefined}
        onOpenChange={setSettingsOpen}
        isHost={isHost}
        settings={settings}
        onChange={(patch) => setSettings({ ...settings, ...patch })}
        recording={isHost ? recording : undefined}
      />
    </div>
  );
}

const qualityPresets = { high: VideoPresets.h720, standard: VideoPresets.h360, low: VideoPresets.h180 };

/** Capture options for the host's "Default video quality". */
const cameraCapture = (quality: SessionSettings["videoQuality"]) =>
  quality === "auto" ? undefined : { resolution: qualityPresets[quality].resolution };

const savedSettingsKey = (sessionId: string) => `rise-live-room-settings:${sessionId}`;

type Blocked = Partial<Record<"microphone" | "camera" | "screenShare" | "chat" | "reactions" | "handRaising", boolean>>;

/** The role each person shares in the room, which the host pill and settings read. */
const roomRoles = { HOST: "host", MODERATOR: "moderator", PARTICIPANT: "participant" } as const;
const leaderRoles = new Set<string>([roomRoles.HOST, roomRoles.MODERATOR]);

/**
 * The Session settings. Hosts and moderators keep theirs on this browser and
 * share them through their `settings` attribute; the room follows whoever
 * changed them last. Hosts and moderators aren't held back by them.
 */
function useSessionSettings(sessionId: string, isHost: boolean) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [own, setOwn] = React.useState(() => parseSessionSettings(localStorage.getItem(savedSettingsKey(sessionId)) ?? undefined));

  const shared = JSON.stringify(own);
  React.useEffect(() => {
    if (!isHost || localParticipant.attributes[SETTINGS_ATTRIBUTE] === shared) return;
    localParticipant.setAttributes({ [SETTINGS_ATTRIBUTE]: shared }).catch(() => {});
  }, [isHost, localParticipant, shared]);

  const fromLeaders = participants
    .filter((participant) => !participant.isLocal && leaderRoles.has(participant.attributes[ROLE_ATTRIBUTE]))
    .map((participant) => participant.attributes[SETTINGS_ATTRIBUTE])
    .filter((value): value is string => Boolean(value));
  // Your own come last, so they win until someone changes theirs.
  const settings = latestSettings([...fromLeaders.map(parseSessionSettings), ...(isHost ? [own] : [])]);
  const blocked: Blocked = isHost
    ? {}
    : {
        microphone: !settings.microphone,
        camera: !settings.camera,
        screenShare: !settings.screenShare,
        chat: !settings.chat,
        reactions: !settings.reactions,
        handRaising: !settings.handRaising,
      };

  const setSettings = (next: SessionSettings) => {
    const stamped = { ...next, updatedAt: Date.now() };
    setOwn(stamped);
    localStorage.setItem(savedSettingsKey(sessionId), JSON.stringify(stamped));
  };

  return { settings, setSettings, blocked, hostShared: fromLeaders.length > 0 };
}

/**
 * Participants can't share their screen until a host allows it, so while
 * "Allow screen sharing" is on, hosts and moderators allow everyone in the
 * room, late joiners too; turning it off blocks them again.
 */
function useScreenShareRights(
  sessionId: string,
  isHost: boolean,
  allowed: boolean,
  notify: (tone: Notice["tone"], message: string) => void,
) {
  const participants = useParticipants();
  const [applied, setApplied] = React.useState<Record<string, boolean>>({});
  const pending = participants
    .filter((participant) => !participant.isLocal && participant.attributes[ROLE_ATTRIBUTE] === roomRoles.PARTICIPANT)
    .map((participant) => participant.identity)
    .filter((identity) => applied[identity] !== allowed)
    .join(",");

  React.useEffect(() => {
    if (!isHost || !pending) return;
    const identities = pending.split(",");
    Promise.allSettled(
      identities.map((identity) => setScreenShare(sessionId, identity, allowed ? "allow" : "block")),
    ).then((results) => {
      const done = identities.filter((_, index) => results[index].status === "fulfilled");
      setApplied((current) => ({ ...current, ...Object.fromEntries(done.map((identity) => [identity, allowed])) }));
      if (done.length < identities.length) {
        notify("error", allowed ? "Couldn't let everyone share their screen." : "Couldn't turn off screen sharing for everyone.");
      }
    });
  }, [isHost, pending, allowed, sessionId, notify]);
}

/**
 * Applies the room's settings to this person: turns off what the host just
 * disallowed, follows the "on entry" choices once, and captures the camera at
 * the chosen quality.
 */
function useEnforcedSettings(
  { settings, blocked, hostShared }: Pick<ReturnType<typeof useSessionSettings>, "settings" | "blocked" | "hostShared">,
  notify: (tone: Notice["tone"], message: string) => void,
) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const { attributes } = useParticipantAttributes({ participant: localParticipant });
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);
  const entryApplied = React.useRef(false);

  React.useEffect(() => {
    if (!blocked.microphone || !isMicrophoneEnabled) return;
    localParticipant.setMicrophoneEnabled(false).catch(() => {});
    notify("info", "The host has turned off microphones.");
  }, [blocked.microphone, isMicrophoneEnabled, localParticipant, notify]);

  React.useEffect(() => {
    if (!blocked.camera || !isCameraEnabled) return;
    localParticipant.setCameraEnabled(false).catch(() => {});
    notify("info", "The host has turned off cameras.");
  }, [blocked.camera, isCameraEnabled, localParticipant, notify]);

  React.useEffect(() => {
    if (!blocked.screenShare || !isScreenShareEnabled) return;
    localParticipant.setScreenShareEnabled(false).catch(() => {});
    notify("info", "The host has turned off screen sharing.");
  }, [blocked.screenShare, isScreenShareEnabled, localParticipant, notify]);

  React.useEffect(() => {
    if (blocked.handRaising && handRaised) localParticipant.setAttributes({ [HAND_ATTRIBUTE]: "" }).catch(() => {});
  }, [blocked.handRaising, handRaised, localParticipant]);

  // The "on entry" choices apply once, when the host's settings first arrive.
  React.useEffect(() => {
    if (!hostShared || entryApplied.current) return;
    entryApplied.current = true;
    if (settings.muteOnEntry) localParticipant.setMicrophoneEnabled(false).catch(() => {});
    if (settings.camerasOffOnEntry) localParticipant.setCameraEnabled(false).catch(() => {});
  }, [hostShared, settings.muteOnEntry, settings.camerasOffOnEntry, localParticipant]);

  React.useEffect(() => {
    const camera = localParticipant.getTrackPublication(Track.Source.Camera)?.track;
    if (!isCameraEnabled || !(camera instanceof LocalVideoTrack)) return;
    camera.restartTrack(cameraCapture(settings.videoQuality)).catch(() => {});
  }, [settings.videoQuality, isCameraEnabled, localParticipant]);
}

const GAP = 8;
const tileIn = "motion-safe:animate-[room-tile-in_320ms_cubic-bezier(0.2,0,0,1)]";

/**
 * The open side panel, kept a moment after it closes so it can slide away.
 * `opening` is only set when it opens from nothing, not when switching tabs.
 */
function usePresence(tab: PanelTab | null) {
  const [shown, setShown] = React.useState<{ tab: PanelTab | null; opening: boolean }>({ tab, opening: false });
  if (tab !== null && tab !== shown.tab) setShown({ tab, opening: shown.tab === null });
  React.useEffect(() => {
    if (tab !== null) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setShown({ tab: null, opening: false }), still ? 0 : 200);
    return () => clearTimeout(timer);
  }, [tab]);
  return { ...shown, leaving: tab === null && shown.tab !== null };
}

/** The size of an element, kept up to date as it resizes. */
function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * The column count that gives `count` tiles the most room. Tiles stretch
 * between the two shapes to fill the space, then stop so cameras stay framed.
 */
function bestGrid(count: number, width: number, height: number, [narrowest, widest]: readonly [number, number]) {
  let best = { columns: 1, width: 0, height: 0 };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const cellWidth = (width - GAP * (columns - 1)) / columns;
    const cellHeight = (height - GAP * (rows - 1)) / rows;
    const tileWidth = Math.floor(Math.min(cellWidth, cellHeight * widest));
    const tileHeight = Math.floor(Math.min(cellHeight, tileWidth / narrowest));
    if (tileWidth * tileHeight > best.width * best.height) best = { columns, width: tileWidth, height: tileHeight };
  }
  return best;
}

/** Up to `cells` tiles; past that, the last cell goes to "+N more". */
function fit<T extends { participant: Participant }>(refs: T[], cells: number) {
  if (refs.length <= cells) return { shown: refs, hidden: [] as Participant[] };
  const room = Math.max(0, cells - 1);
  return { shown: refs.slice(0, room), hidden: refs.slice(room).map((ref) => ref.participant) };
}

/**
 * Everyone as equal tiles, as large as the stage allows, or a screen share
 * or pinned person on the stage with everyone else in a filmstrip.
 */
function Gallery({
  tiles,
  screen,
  pinned,
  featured,
  onOthers,
  onStopShare,
}: {
  tiles: TrackReferenceOrPlaceholder[];
  screen?: TrackReference;
  pinned?: TrackReferenceOrPlaceholder;
  featured?: string;
  onOthers: () => void;
  onStopShare: () => void;
}) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const ordered = featured
    ? [...tiles].sort((a, b) => Number(b.participant.identity === featured) - Number(a.participant.identity === featured))
    : tiles;
  const measured = width > 0 && height > 0;

  return (
    <div ref={ref} className="relative min-h-0 flex-1">
      {measured && screen && (
        <StageLayout
          width={width}
          height={height}
          stage={<ScreenStage screen={screen} onStopShare={onStopShare} />}
          rest={ordered}
          presenter={screen.participant}
          onOthers={onOthers}
        />
      )}
      {measured && !screen && pinned && (
        <StageLayout
          width={width}
          height={height}
          stage={<ParticipantTile trackRef={pinned} pinned fit="contain" className="size-full" />}
          rest={ordered.filter((tile) => tile !== pinned)}
          onOthers={onOthers}
        />
      )}
      {measured && !screen && !pinned && <GridLayout width={width} height={height} tiles={ordered} onOthers={onOthers} />}
    </div>
  );
}

/** People only fold into "+N more" once tiles would get too small to read. */
function GridLayout({
  width,
  height,
  tiles,
  onOthers,
}: {
  width: number;
  height: number;
  tiles: TrackReferenceOrPlaceholder[];
  onOthers: () => void;
}) {
  // Phones get squarer tiles so a column of people still fills the screen.
  const shapes = width < 640 ? ([0.75, 1.4] as const) : ([4 / 3, 2] as const);
  const minimum = width < 640 ? 120 : 200;
  let cells = tiles.length;
  while (cells > 2 && bestGrid(cells, width, height, shapes).width < minimum) cells--;
  const { shown, hidden } = fit(tiles, cells);
  const grid = bestGrid(shown.length + (hidden.length ? 1 : 0), width, height, shapes);
  const tile = { width: grid.width, height: grid.height };

  return (
    <ul
      className="mx-auto flex h-full flex-wrap content-center justify-center gap-2"
      style={{ width: grid.columns * grid.width + (grid.columns - 1) * GAP }}
    >
      {shown.map((ref) => (
        <li key={ref.participant.identity} style={tile} className={tileIn}>
          <ParticipantTile trackRef={ref} className="size-full" />
        </li>
      ))}
      {hidden.length > 0 && (
        <li style={tile}>
          <OthersTile participants={hidden} onClick={onOthers} className="size-full" />
        </li>
      )}
    </ul>
  );
}

/**
 * The stage takes most of the space; everyone else sits in a filmstrip beside
 * it on wide screens and beneath it on narrow ones.
 */
function StageLayout({
  width,
  height,
  stage,
  rest,
  presenter,
  onOthers,
}: {
  width: number;
  height: number;
  stage: React.ReactNode;
  rest: TrackReferenceOrPlaceholder[];
  presenter?: Participant;
  onOthers: () => void;
}) {
  const side = width >= 768;
  const count = rest.length;
  // Tiles shrink so everyone fits, down to a size that's still readable.
  const share = (space: number, largest: number, smallest: number) =>
    Math.floor(Math.max(smallest, Math.min(largest, (space - GAP * (count - 1)) / Math.max(1, count))));
  let strip = { width: 0, height: 0, cells: 0 };
  if (count && side) {
    const tileHeight = share(height, Math.min(158, (Math.max(180, width * 0.2) * 9) / 16), 96);
    strip = { width: Math.round((tileHeight * 16) / 9), height: tileHeight, cells: Math.floor((height + GAP) / (tileHeight + GAP)) };
  } else if (count) {
    const tileHeight = Math.round(Math.min(110, height * 0.22));
    const tileWidth = share(width, Math.round((tileHeight * 4) / 3), Math.round(tileHeight * 0.8));
    strip = { width: tileWidth, height: tileHeight, cells: Math.floor((width + GAP) / (tileWidth + GAP)) };
  }
  strip.cells = Math.max(1, strip.cells);
  const { shown, hidden } = fit(rest, strip.cells);
  const tile = { width: strip.width, height: strip.height };

  return (
    <div className={cn("flex size-full gap-2", !side && "flex-col")}>
      <div className="min-h-0 min-w-0 flex-1">{stage}</div>
      {rest.length > 0 && (
        <ul aria-label="Participants" className={cn("flex shrink-0 justify-center gap-2", side && "flex-col")}>
          {shown.map((ref) => (
            <li key={ref.participant.identity} style={tile} className={tileIn}>
              <ParticipantTile trackRef={ref} presenting={ref.participant === presenter} className="size-full" />
            </li>
          ))}
          {hidden.length > 0 && (
            <li style={tile}>
              <OthersTile participants={hidden} onClick={onOthers} className="size-full" />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Someone's shared screen. Presenters see a note instead of their own screen,
 * which would otherwise repeat inside itself when they share this tab.
 */
function ScreenStage({ screen, onStopShare }: { screen: TrackReference; onStopShare: () => void }) {
  const own = screen.participant.isLocal;
  const [preview, setPreview] = React.useState(false);
  const name = displayName(screen.participant);
  const showScreen = !own || preview;

  return (
    <section
      aria-label={own ? "You're presenting" : `${name} is presenting`}
      className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-room-screen"
    >
      {showScreen ? (
        <VideoTrack trackRef={screen} className="size-full object-contain" />
      ) : (
        <div className="flex max-w-[360px] flex-col items-center gap-4 p-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-room-active text-text-brand [&_svg]:size-6">
            <ComputerScreenShare />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-white">You&apos;re presenting to everyone</p>
            <p className="text-sm text-room-text-muted">Your screen is hidden here so it doesn&apos;t repeat inside itself.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onStopShare} className={stageButton.primary}>
              Stop presenting
            </button>
            <button type="button" onClick={() => setPreview(true)} className={stageButton.secondary}>
              Show preview
            </button>
          </div>
        </div>
      )}
      {showScreen && (
        <p className="absolute bottom-3 left-3 flex h-8 items-center gap-2 rounded-lg bg-black/60 pr-3 pl-2 text-[13px] font-medium text-white backdrop-blur-sm [&_svg]:size-4">
          <ComputerScreenShare />
          {own ? "Your screen" : `${name} is presenting`}
          {own && (
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="ml-1 cursor-pointer text-room-active underline-offset-2 hover:underline"
            >
              Hide
            </button>
          )}
        </p>
      )}
    </section>
  );
}

const stageButton = {
  primary:
    "h-10 cursor-pointer rounded-full bg-room-active px-4 text-sm font-medium text-text-brand transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  secondary:
    "h-10 cursor-pointer rounded-full bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
};

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

  return (
    <header className="flex items-center gap-4 px-4 pt-4 pb-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg/7 font-semibold text-white sm:text-xl/7">{title}</h1>
        <p className="flex min-w-0 items-center gap-2 text-sm/5 text-room-text-muted">
          {now && <span className="shrink-0">{clockFormat.format(now)}</span>}
          {host && (
            <>
              <span aria-hidden>·</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <PersonAvatar name={displayName(host)} src={avatarOf(host)} colorKey={host.identity} size={20} />
                <span className="truncate">
                  Hosted by <span className="text-room-text">{host.isLocal ? "you" : displayName(host)}</span>
                </span>
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <RecordingTimer className="sm:hidden" />
        <button
          type="button"
          aria-pressed={panel === "participants"}
          onClick={() => onPanel("participants")}
          className={cn(headerButton, panel === "participants" ? "bg-room-active text-text-brand" : "bg-white/10 text-white hover:bg-white/15")}
        >
          <UserMultiple className="size-4" />
          {count}
          <span className="max-md:sr-only">{count === 1 ? "Participant" : "Participants"}</span>
        </button>
        <button
          type="button"
          aria-pressed={panel === "chat"}
          aria-label={unreadChat ? "Chat, new messages" : "Chat"}
          onClick={() => onPanel("chat")}
          className={cn(headerButton, "relative", panel === "chat" ? "bg-room-active text-text-brand" : "bg-white/10 text-white hover:bg-white/15")}
        >
          <Message01 className="size-[18px]" />
          <span className="max-md:sr-only">Chat</span>
          {unreadChat && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-room-leave ring-2 ring-room-canvas motion-safe:animate-in motion-safe:zoom-in-0 motion-safe:duration-300" />
          )}
        </button>
      </div>
    </header>
  );
}

const headerButton =
  "flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium transition-[background-color,color,scale] duration-150 motion-safe:active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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

const AUTO_RECORD_TRIES = 3;
const AUTO_RECORD_RETRY_MS = 15_000;

/**
 * Starting the server recording: on its own when auto-record is on, trying a
 * few times in case the media server is slow, or from the settings. It runs
 * until the session ends.
 */
function useRoomRecording(sessionId: string, auto: boolean, connected: boolean) {
  const active = useIsRecording();
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [started, setStarted] = React.useState(false);
  const [autoTries, setAutoTries] = React.useState(0);

  const start = React.useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      await startRecording(sessionId);
      setStarted(true);
    } catch (problem) {
      // Already recording is fine.
      if (problem instanceof ApiError && problem.status === 409) setStarted(true);
      else setError(recordingProblem(problem));
    } finally {
      setStarting(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    if (!auto || !connected || active || started || autoTries >= AUTO_RECORD_TRIES) return;
    const timer = setTimeout(
      () => {
        setAutoTries((tries) => tries + 1);
        void start();
      },
      autoTries === 0 ? 0 : AUTO_RECORD_RETRY_MS,
    );
    return () => clearTimeout(timer);
  }, [auto, connected, active, started, autoTries, start]);

  return { active, starting: starting && !active, error: active ? null : error, start };
}

/** The recording pill: in the header on phones, at the left of the call controls from `sm` up. */
function RecordingTimer({ className }: { className?: string }) {
  const recordingFor = useRecordingTime();
  if (recordingFor === null) return null;
  return (
    <p
      role="status"
      className={cn(
        "flex h-10 items-center gap-2 rounded-full bg-white/10 pr-3 pl-2 text-sm font-medium text-white tabular-nums motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 sm:h-11 sm:pr-4",
        className,
      )}
    >
      <span aria-hidden className="m-1 size-4 rounded-full border-[1.5px] border-white bg-[#c62828]" />
      <span>
        <span className="sr-only">Recording </span>
        {formatDuration(recordingFor)}
      </span>
    </p>
  );
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
        "flex max-w-[560px] items-center gap-2.5 rounded-xl border px-4 py-2.5 font-work text-sm shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300 [&_svg]:size-[18px] [&_svg]:shrink-0",
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
