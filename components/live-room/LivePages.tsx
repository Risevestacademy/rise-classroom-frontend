import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Calendar03, CheckmarkCircle03 } from "@/assets/icons";
import { joinBlockFor, sampleSessionsAround, sessionWhen } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";
import { DeviceCheck } from "./DeviceCheck";
import { JoinHub } from "./JoinHub";
import { roomButton, RoomStatus } from "./RoomStatus";

// The live session pages every role shares. Each role mounts them at
// `/<role>/live` and `/<role>/live/<id>`, inside its own layout, passing its
// own top nav (or none, where the layout already has one).

// PENDING-BACKEND: sessions come from `GET /live-sessions`, scoped to the
// signed-in user, and `canJoin` from `GET /live-sessions/:id`.
const findSession = (id: string) => sampleSessionsAround(new Date()).find((session) => session.id === id);

export async function liveSessionMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  return { title: findSession((await params).id)?.title ?? "Live session" };
}

/** Join with a link, or pick one of the week's sessions. */
export function LiveJoinPage({ topNav, basePath }: { topNav?: ReactNode; basePath: string }) {
  const now = new Date();

  return (
    <>
      {topNav}
      <JoinHub sessions={sampleSessionsAround(now)} serverNow={now.getTime()} deviceCheckPath={`${basePath}/live`} />
    </>
  );
}

/** Check camera and microphone before going into a session's room. */
export async function LiveDeviceCheckPage({
  id,
  topNav,
  basePath,
}: {
  id: string;
  topNav?: ReactNode;
  basePath: string;
}) {
  const session = findSession(id);
  if (!session) notFound();

  const auth = await getServerSession().catch(() => null);
  const block = joinBlockFor(session);
  const when = sessionWhen(session);
  const back = (
    <Link href={`${basePath}/live`} className={roomButton.secondary}>
      Back to live sessions
    </Link>
  );

  return (
    <>
      {topNav}
      {block === "too_early" ? (
        <RoomStatus icon={<Calendar03 />} tone="info" title="This session hasn't started yet" actions={back}>
          <span className="font-semibold text-text-primary">{session.title}</span> is on {when}. Come back when it
          starts and you&apos;ll be able to join from here.
        </RoomStatus>
      ) : block ? (
        <RoomStatus icon={<CheckmarkCircle03 />} title="This session has ended" actions={back}>
          <span className="font-semibold text-text-primary">{session.title}</span> is over. The recording will
          appear in Live sessions once it&apos;s ready.
        </RoomStatus>
      ) : (
        <DeviceCheck
          sessionId={session.id}
          title={session.title}
          when={when}
          userName={auth?.user.name ?? ""}
          userKey={auth?.user.id ?? session.id}
        />
      )}
    </>
  );
}
