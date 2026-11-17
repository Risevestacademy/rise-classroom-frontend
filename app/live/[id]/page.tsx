import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LiveRoom } from "@/components/live-room/LiveRoom";
import { landingPathFor } from "@/lib/auth";
import type { JoinBlock } from "@/lib/live-room";
import { sampleSessions, sessionDate, sessionTime, type LiveSession } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";

type Props = { params: Promise<{ id: string }> };

// PENDING-BACKEND: the session and its `canJoin` come from
// `GET /live-sessions/:id` once it exists; the sample status stands in.
const findSession = (id: string) => sampleSessions.find((session) => session.id === id);

const blockFor = (session: LiveSession): JoinBlock | undefined =>
  session.status === "upcoming" ? "too_early" : session.status === "completed" ? "ended" : undefined;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: findSession((await params).id)?.title ?? "Live session" };
}

/**
 * One room per session for every role. What each person may do in it (host
 * controls or not) is carried by the join token the backend signs.
 */
export default async function LiveRoomPage({ params }: Props) {
  const { id } = await params;
  const session = findSession(id);
  if (!session) notFound();

  const auth = await getServerSession().catch(() => null);
  if (!auth?.user) redirect(`/sign-in?${new URLSearchParams({ next: `/live/${id}` })}`);

  return (
    <LiveRoom
      sessionId={session.id}
      title={session.title}
      when={`${sessionDate(session.date)} · ${sessionTime(session)}`}
      block={blockFor(session)}
      userName={auth.user.name}
      userKey={auth.user.id}
      homeHref={landingPathFor(auth.user)}
    />
  );
}
