"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";

import {
  AlertCircle,
  Calendar03,
  Cancel01,
  CallEnd,
  CheckmarkCircle03,
  SquareLockPassword,
  UserRemove01,
  WifiOff01,
} from "@/assets/icons";
import { ApiError } from "@/lib/api";
import { fetchJoinCredentials, type JoinBlock, type JoinCredentials } from "@/lib/live-room";
import { getSessionEntry, roomAccess, startLiveSession, type RoomAccess } from "@/lib/live-sessions";
import { cn } from "@/lib/utils";
import { PreJoinScreen, readSavedChoices, type DeviceChoices } from "./PreJoinScreen";
import { RoomStage, Spinner } from "./RoomStage";
import { roomButton, RoomStatus } from "./RoomStatus";

type Ending = "left" | "you_ended" | "host_ended" | "removed" | "elsewhere" | "connection_lost";

type Stage =
  | { name: "prejoin"; joining: boolean }
  | { name: "connecting" }
  | { name: "room"; credentials: JoinCredentials; access: RoomAccess; choices: DeviceChoices; tries: number }
  /** Dropped without leaving, e.g. the phone paused the page; rejoins once it's back on screen. */
  | { name: "reconnecting"; access: RoomAccess; choices: DeviceChoices; tries: number }
  | { name: "ended"; ending: Ending }
  | { name: "error"; message: string };

const endingFor = (reason?: DisconnectReason): Ending => {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
      return "left";
    case DisconnectReason.ROOM_DELETED:
    case DisconnectReason.ROOM_CLOSED:
      return "host_ended";
    case DisconnectReason.PARTICIPANT_REMOVED:
      return "removed";
    case DisconnectReason.DUPLICATE_IDENTITY:
      return "elsewhere";
    default:
      return "connection_lost";
  }
};

/** Rejoin attempts in a row before giving up and offering the Rejoin button. */
const MAX_TRIES = 3;

type Media = Pick<DeviceChoices, "audioEnabled" | "videoEnabled">;

/** A live session from the door to the exit: who can join, the device check, the call, and how it ended. */
export function LiveRoom({
  sessionId,
  title,
  when,
  block,
  starts = false,
  access,
  autoJoin = false,
  userName,
  userKey,
  homeHref,
}: {
  sessionId: string;
  title: string;
  /** "Wed, September 24 9:00 PM" */
  when: string;
  block?: JoinBlock;
  /** The host starts the session for everyone by going in. */
  starts?: boolean;
  /** What the backend lets this person do in the room. */
  access: RoomAccess;
  /** They've already checked their devices, so skip straight to connecting. */
  autoJoin?: boolean;
  userName: string;
  userKey: string;
  /** Where Back goes when the room was opened directly, e.g. from a link. */
  homeHref: string;
}) {
  const router = useRouter();
  const [stage, setStage] = React.useState<Stage>(autoJoin && !block ? { name: "connecting" } : { name: "prejoin", joining: false });
  const endedByMe = React.useRef(false);
  // Set when they press Leave or end the session, so that drop isn't rejoined.
  const leaving = React.useRef(false);
  // Their microphone and camera as they last had them on screen, to rejoin the same way.
  const media = React.useRef<Media | null>(null);

  async function connect(choices: DeviceChoices) {
    try {
      const entered = await enter(sessionId, starts, access);
      endedByMe.current = false;
      leaving.current = false;
      media.current = null;
      setStage({ name: "room", ...entered, choices, tries: 0 });
    } catch (error) {
      setStage({ name: "error", message: (error as Error).message });
    }
  }

  // Joins once per visit. The page's props change after the host starts the
  // session (it's live now), and joining again would replace this tab's
  // connection, which LiveKit reports as "joined from somewhere else".
  const autoJoined = React.useRef(false);
  React.useEffect(() => {
    if (!autoJoin || block || autoJoined.current) return;
    autoJoined.current = true;
    enter(sessionId, starts, access)
      .then((entered) => setStage({ name: "room", ...entered, choices: readSavedChoices(), tries: 0 }))
      .catch((error: Error) => setStage({ name: "error", message: error.message }));
  }, [autoJoin, block, sessionId, starts, access]);

  // Rejoins once the page is on screen and online again, waiting a little longer after each failed try.
  const reconnecting = stage.name === "reconnecting" ? stage : null;
  React.useEffect(() => {
    if (!reconnecting) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const attempt = () => {
      if (timer || document.visibilityState !== "visible" || !navigator.onLine) return;
      timer = setTimeout(async () => {
        try {
          const entered = await enter(sessionId, false, reconnecting.access);
          if (!cancelled) setStage({ name: "room", ...entered, choices: reconnecting.choices, tries: reconnecting.tries + 1 });
        } catch {
          if (!cancelled) setStage(failedTry(reconnecting));
        }
      }, reconnecting.tries * 2000);
    };
    attempt();
    document.addEventListener("visibilitychange", attempt);
    window.addEventListener("online", attempt);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", attempt);
      window.removeEventListener("online", attempt);
    };
  }, [reconnecting, sessionId]);

  // Always the live sessions lobby: going back in history would land on the device check.
  const back = () => router.push(homeHref);

  function join(choices: DeviceChoices) {
    setStage({ name: "prejoin", joining: true });
    void connect(choices);
  }

  // Coming from the device check page, rejoining skips it with the same devices.
  function rejoin() {
    leaving.current = false;
    if (!autoJoin) return setStage({ name: "prejoin", joining: false });
    setStage({ name: "connecting" });
    void connect(readSavedChoices());
  }

  function leave() {
    leaving.current = true;
    setStage({ name: "ended", ending: "left" });
  }

  const backButton = (
    <button type="button" onClick={back} className={roomButton.secondary}>
      Back to live sessions
    </button>
  );
  const rejoinButton = (label = "Rejoin") => (
    <button type="button" onClick={rejoin} className={roomButton.primary}>
      {label}
    </button>
  );

  return (
    // Chat and names are masked from Clarity's session recordings.
    <div
      data-clarity-mask="true"
      className={cn(
        "flex h-dvh min-w-0 flex-1 flex-col overflow-hidden",
        (stage.name === "room" || stage.name === "connecting") && !block
          ? "bg-room-canvas text-room-text"
          : "bg-surface-background text-text-primary",
      )}
    >
      {block ? (
        <Blocked block={block} title={title} when={when} actions={backButton} />
      ) : stage.name === "prejoin" ? (
        <PreJoinScreen
          title={title}
          when={when}
          userName={userName}
          userKey={userKey}
          joining={stage.joining}
          starts={starts}
          onJoin={join}
        />
      ) : stage.name === "connecting" ? (
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4">
          <Spinner className="size-8 text-room-active" />
          <p className="text-base text-room-text">Joining {title}…</p>
        </div>
      ) : stage.name === "room" ? (
        <LiveKitRoom
          serverUrl={stage.credentials.url}
          token={stage.credentials.token}
          connect
          // The SDK would hang up whenever a phone hides the page; RoomKeeper only does when it closes.
          options={{ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: false }}
          audio={stage.choices.audioEnabled ? { deviceId: stage.choices.audioDeviceId || undefined } : false}
          video={stage.choices.videoEnabled ? { deviceId: stage.choices.videoDeviceId || undefined } : false}
          onConnected={() => setStage((current) => (current.name === "room" ? { ...current, tries: 0 } : current))}
          onDisconnected={(reason) => {
            if (leaving.current) return;
            const ending = endedByMe.current ? "you_ended" : endingFor(reason);
            // Anything short of a real ending (the host closing the room, being
            // removed, joining elsewhere) is a drop, so they're brought back.
            if (ending === "left" || ending === "connection_lost") {
              setStage({ name: "reconnecting", access: stage.access, choices: { ...stage.choices, ...media.current }, tries: stage.tries });
            } else setStage({ name: "ended", ending });
          }}
          onError={(error) => setStage(stage.tries > 0 ? failedTry(stage) : { name: "error", message: error.message })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <RoomKeeper onMedia={(on) => (media.current = on)} />
          <RoomStage
            sessionId={sessionId}
            title={title}
            access={stage.access}
            onLeave={leave}
            onEndedForAll={() => {
              leaving.current = true;
              endedByMe.current = true;
              setStage({ name: "ended", ending: "you_ended" });
            }}
            onHostEnded={() => setStage({ name: "ended", ending: "host_ended" })}
          />
        </LiveKitRoom>
      ) : stage.name === "reconnecting" ? (
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Spinner className="size-8 text-room-active" />
          <p className="text-base text-room-text">Reconnecting you to {title}…</p>
          <button type="button" onClick={leave} className={roomButton.secondary}>
            Leave
          </button>
        </div>
      ) : stage.name === "ended" ? (
        <Ended ending={stage.ending} title={title} backButton={backButton} rejoinButton={rejoinButton} />
      ) : (
        <RoomStatus
          tone="error"
          icon={<AlertCircle />}
          title="We couldn't connect you"
          actions={
            <>
              {backButton}
              {rejoinButton("Try again")}
            </>
          }
        >
          {stage.message} Check your internet connection and try again.
        </RoomStatus>
      )}
    </div>
  );
}

/** One more failed rejoin: try again, or after a few, say the connection was lost. */
const failedTry = ({ access, choices, tries }: { access: RoomAccess; choices: DeviceChoices; tries: number }): Stage =>
  tries + 1 >= MAX_TRIES ? { name: "ended", ending: "connection_lost" } : { name: "reconnecting", access, choices, tries: tries + 1 };

/**
 * Notes their microphone and camera while the page is on screen (a phone turns
 * the camera off in the background, which shouldn't count), and leaves the
 * call properly when the tab is closed or reloaded.
 */
function RoomKeeper({ onMedia }: { onMedia: (media: Media) => void }) {
  const room = useRoomContext();
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  React.useEffect(() => {
    if (document.visibilityState === "visible") onMedia({ audioEnabled: isMicrophoneEnabled, videoEnabled: isCameraEnabled });
  }, [onMedia, isMicrophoneEnabled, isCameraEnabled]);

  React.useEffect(() => {
    const close = () => void room.disconnect();
    window.addEventListener("beforeunload", close);
    return () => window.removeEventListener("beforeunload", close);
  }, [room]);

  return null;
}

/**
 * Starts the session first when the host is the one going in (already live is
 * fine), then gets a token. Permissions are read again once it's live, since
 * the backend grants none before then.
 */
async function enter(sessionId: string, starts: boolean, access: RoomAccess) {
  if (!starts) return { credentials: await fetchJoinCredentials(sessionId), access };
  await startLiveSession(sessionId).catch((error) => {
    if (!(error instanceof ApiError && error.status === 409)) throw new Error("We couldn't start the session.");
  });
  const [credentials, entry] = await Promise.all([fetchJoinCredentials(sessionId), getSessionEntry(sessionId)]);
  return { credentials, access: roomAccess(entry) };
}

export function Blocked({
  block,
  title,
  when,
  actions,
}: {
  block: JoinBlock;
  title: string;
  when: string;
  actions: React.ReactNode;
}) {
  const screens = {
    too_early: {
      icon: <Calendar03 />,
      tone: "info",
      heading: "This session hasn't started yet",
      body: (
        <>
          <span className="font-semibold text-text-primary">{title}</span> is on {when}. Come back
          when it starts and you&apos;ll be able to join from here.
        </>
      ),
    },
    ended: {
      icon: <CheckmarkCircle03 />,
      tone: "neutral",
      heading: "This session has ended",
      body: (
        <>
          <span className="font-semibold text-text-primary">{title}</span> is over. The recording
          will appear in Live sessions once it&apos;s ready.
        </>
      ),
    },
    cancelled: {
      icon: <Cancel01 />,
      tone: "warning",
      heading: "This session was cancelled",
      body: (
        <>
          <span className="font-semibold text-text-primary">{title}</span> on {when} won&apos;t be
          going ahead. Check your calendar for the next one.
        </>
      ),
    },
    removed: {
      icon: <UserRemove01 />,
      tone: "warning",
      heading: "You were removed from this session",
      body: (
        <>
          The host removed you from <span className="font-semibold text-text-primary">{title}</span>. If
          you think that&apos;s a mistake, contact them or your admin.
        </>
      ),
    },
    not_eligible: {
      icon: <SquareLockPassword />,
      tone: "warning",
      heading: "You're not on the list for this session",
      body: "Only people in this session's cohort or mentorship group can join. If you think that's wrong, contact your admin.",
    },
  } as const;
  const screen = screens[block];

  return (
    <RoomStatus icon={screen.icon} tone={screen.tone} title={screen.heading} actions={actions}>
      {screen.body}
    </RoomStatus>
  );
}

function Ended({
  ending,
  title,
  backButton,
  rejoinButton,
}: {
  ending: Ending;
  title: string;
  backButton: React.ReactNode;
  rejoinButton: (label?: string) => React.ReactNode;
}) {
  switch (ending) {
    case "left":
      return (
        <RoomStatus icon={<CallEnd />} title="You left the session" actions={<>{backButton}{rejoinButton()}</>}>
          {title} is still going. You can rejoin while it&apos;s live.
        </RoomStatus>
      );
    case "you_ended":
      return (
        <RoomStatus icon={<CheckmarkCircle03 />} tone="info" title="You ended the session for everyone" actions={backButton}>
          The recording and attendance will appear in Live sessions once they&apos;re ready.
        </RoomStatus>
      );
    case "host_ended":
      return (
        <RoomStatus icon={<CheckmarkCircle03 />} tone="info" title="The host ended the session" actions={backButton}>
          Thanks for joining {title}. The recording will appear in Live sessions once it&apos;s ready.
        </RoomStatus>
      );
    case "removed":
      return (
        <RoomStatus icon={<UserRemove01 />} tone="warning" title="You were removed from this session" actions={backButton}>
          The host removed you from {title}. If you think that&apos;s a mistake, contact them or your admin.
        </RoomStatus>
      );
    case "elsewhere":
      return (
        <RoomStatus icon={<AlertCircle />} tone="info" title="You joined from somewhere else" actions={<>{backButton}{rejoinButton("Use this tab instead")}</>}>
          You&apos;re in {title} on another tab or device, so we disconnected you here.
        </RoomStatus>
      );
    case "connection_lost":
      return (
        <RoomStatus icon={<WifiOff01 />} tone="error" title="You lost connection" actions={<>{backButton}{rejoinButton()}</>}>
          We couldn&apos;t reconnect you to {title}. Check your internet connection, then rejoin.
        </RoomStatus>
      );
  }
}
