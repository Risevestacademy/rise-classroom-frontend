import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LiveRoom } from "@/components/live-room/LiveRoom";
import { landingPathFor } from "@/lib/auth";
import { joinBlockFor, sampleSessionsAround, sessionWhen } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ready?: string }>;
};

// PENDING-BACKEND: the session and its `canJoin` come from
// `GET /live-sessions/:id` once it exists; the sample status stands in.
const findSession = (id: string) => sampleSessionsAround(new Date()).find((session) => session.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: findSession((await params).id)?.title ?? "Live session" };
}

/**
 * One room per session for every role. What each person may do in it (host
 * controls or not) is carried by the join token the backend signs.
 * `?ready=1` means they've just checked their devices, so it goes straight in.
 */
export default async function LiveRoomPage({ params, searchParams }: Props) {
  const [{ id }, { ready }] = await Promise.all([params, searchParams]);
  const session = findSession(id);
  if (!session) notFound();

  // `undefined` when the backend is slow to answer: the token route checks
  // the session again, so only a definite "signed out" sends them to sign-in.
  const auth = await getServerSession().catch(() => undefined);
  if (auth === null) redirect(`/sign-in?${new URLSearchParams({ next: `/live/${id}` })}`);

  return (
    <LiveRoom
      sessionId={session.id}
      title={session.title}
      when={sessionWhen(session)}
      block={joinBlockFor(session)}
      autoJoin={ready === "1"}
      userName={auth?.user.name ?? ""}
      userKey={auth?.user.id ?? id}
      homeHref={auth ? landingPathFor(auth.user) : "/"}
    />
  );
}
