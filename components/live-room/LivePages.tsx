import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AlertCircle } from "@/assets/icons";
import { ApiError } from "@/lib/api";
import { entrySession, getSessionEntry, joinBlockFor, sessionWhen, type SessionEntry } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";
import { DeviceCheck } from "./DeviceCheck";
import { JoinHub } from "./JoinHub";
import { Blocked } from "./LiveRoom";
import { roomButton, RoomStatus } from "./RoomStatus";

// The live session pages every role shares. Each role mounts them at
// `/<role>/live` and `/<role>/live/<id>`, inside its own layout, passing its
// own top nav (or none, where the layout already has one).

/**
 * The signed-in user's entry details for a session. Shows the not-found page
 * when they can't see it (the API answers 404, or 400 for a malformed id);
 * `null` when the backend couldn't be reached.
 */
export async function loadSessionEntry(id: string): Promise<SessionEntry | null> {
  const cookie = (await headers()).get("cookie") ?? undefined;
  try {
    return await getSessionEntry(id, { cookie });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    return null;
  }
}

export async function liveSessionMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const entry = await loadSessionEntry((await params).id);
  return { title: entry?.session.title ?? "Live session" };
}

/** Join with a link, or pick one of the week's sessions. */
export function LiveJoinPage({ topNav, basePath }: { topNav?: ReactNode; basePath: string }) {
  const now = new Date();

  return (
    <>
      {topNav}
      {/* Staff can go in early to start a session; students wait for it to go live. */}
      <JoinHub
        serverNow={now.getTime()}
        deviceCheckPath={`${basePath}/live`}
        early={basePath !== "/student"}
      />
    </>
  );
}

/** Shown when the backend can't say whether someone may join. */
export function EntryUnavailable({ actions }: { actions: ReactNode }) {
  return (
    <RoomStatus icon={<AlertCircle />} tone="error" title="We couldn't load this session" actions={actions}>
      Our servers took too long to answer. Check your internet connection, then try again.
    </RoomStatus>
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
  const [entry, auth] = await Promise.all([loadSessionEntry(id), getServerSession().catch(() => null)]);
  const back = (
    <Link href={`${basePath}/live`} className={roomButton.secondary}>
      Back to live sessions
    </Link>
  );

  if (!entry) {
    return (
      <>
        {topNav}
        <EntryUnavailable actions={back} />
      </>
    );
  }

  const session = entrySession(entry);
  const block = joinBlockFor(entry);

  return (
    <>
      {topNav}
      {block ? (
        <Blocked block={block} title={session.title} when={sessionWhen(session)} actions={back} />
      ) : (
        <DeviceCheck
          sessionId={session.id}
          title={session.title}
          when={sessionWhen(session)}
          starts={entry.join.blockedReason === "NOT_STARTED"}
          userName={auth?.user.name ?? ""}
          userKey={auth?.user.id ?? session.id}
        />
      )}
    </>
  );
}
