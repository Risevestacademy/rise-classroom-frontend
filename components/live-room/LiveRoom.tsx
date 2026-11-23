"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom } from "@livekit/components-react";
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
  | { name: "room"; credentials: JoinCredentials; access: RoomAccess; choices: DeviceChoices }
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

  async function connect(choices: DeviceChoices) {
    try {
      const entered = await enter(sessionId, starts, access);
      endedByMe.current = false;
      setStage({ name: "room", ...entered, choices });
    } catch (error) {
      setStage({ name: "error", message: (error as Error).message });
    }
  }

  React.useEffect(() => {
    if (!autoJoin || block) return;
    let cancelled = false;
    enter(sessionId, starts, access)
      .then((entered) => !cancelled && setStage({ name: "room", ...entered, choices: readSavedChoices() }))
      .catch((error: Error) => !cancelled && setStage({ name: "error", message: error.message }));
    return () => {
      cancelled = true;
    };
  }, [autoJoin, block, sessionId, starts, access]);

  const back = () => (window.history.length > 1 ? router.back() : router.push(homeHref));

  function join(choices: DeviceChoices) {
    setStage({ name: "prejoin", joining: true });
    void connect(choices);
  }

  // Coming from the device check page, rejoining skips it with the same devices.
  function rejoin() {
    if (!autoJoin) return setStage({ name: "prejoin", joining: false });
    setStage({ name: "connecting" });
    void connect(readSavedChoices());
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
          options={{ adaptiveStream: true, dynacast: true }}
          audio={stage.choices.audioEnabled ? { deviceId: stage.choices.audioDeviceId || undefined } : false}
          video={stage.choices.videoEnabled ? { deviceId: stage.choices.videoDeviceId || undefined } : false}
          onDisconnected={(reason) =>
            setStage({ name: "ended", ending: endedByMe.current ? "you_ended" : endingFor(reason) })
          }
          onError={(error) => setStage({ name: "error", message: error.message })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <RoomStage
            sessionId={sessionId}
            title={title}
            access={stage.access}
            onLeave={() => setStage({ name: "ended", ending: "left" })}
            onEndedForAll={() => {
              endedByMe.current = true;
            }}
          />
        </LiveKitRoom>
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
