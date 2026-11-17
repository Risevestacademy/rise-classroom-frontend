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
import { fetchJoinCredentials, type JoinBlock, type JoinCredentials } from "@/lib/live-room";
import { PreJoinScreen, type DeviceChoices } from "./PreJoinScreen";
import { RoomStage } from "./RoomStage";
import { roomButton, RoomStatus } from "./RoomStatus";

type Ending = "left" | "you_ended" | "host_ended" | "removed" | "elsewhere" | "connection_lost";

type Stage =
  | { name: "prejoin"; joining: boolean }
  | { name: "room"; credentials: JoinCredentials; choices: DeviceChoices }
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
  userName,
  userKey,
  homeHref,
}: {
  sessionId: string;
  title: string;
  /** "Sat, Nov 14 2026 · 7:00 PM - 8:00 PM" */
  when: string;
  block?: JoinBlock;
  userName: string;
  userKey: string;
  /** Where Back goes when the room was opened directly, e.g. from a link. */
  homeHref: string;
}) {
  const router = useRouter();
  const [stage, setStage] = React.useState<Stage>({ name: "prejoin", joining: false });
  const endedByMe = React.useRef(false);

  const back = () => (window.history.length > 1 ? router.back() : router.push(homeHref));
  const rejoin = () => setStage({ name: "prejoin", joining: false });

  async function join(choices: DeviceChoices) {
    setStage({ name: "prejoin", joining: true });
    try {
      const credentials = await fetchJoinCredentials(sessionId);
      endedByMe.current = false;
      setStage({ name: "room", credentials, choices });
    } catch (error) {
      setStage({ name: "error", message: (error as Error).message });
    }
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
    <div data-clarity-mask="true" className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-room-canvas text-room-text">
      {block ? (
        <Blocked block={block} title={title} when={when} actions={backButton} />
      ) : stage.name === "prejoin" ? (
        <PreJoinScreen
          title={title}
          when={when}
          userName={userName}
          userKey={userKey}
          joining={stage.joining}
          onJoin={join}
        />
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

function Blocked({
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
          <span className="font-semibold text-room-text-strong">{title}</span> is on {when}. Come back
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
          <span className="font-semibold text-room-text-strong">{title}</span> is over. The recording
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
          <span className="font-semibold text-room-text-strong">{title}</span> on {when} won&apos;t be
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
