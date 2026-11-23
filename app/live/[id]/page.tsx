import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EntryUnavailable, liveSessionMetadata, loadSessionEntry } from "@/components/live-room/LivePages";
import { LiveRoom } from "@/components/live-room/LiveRoom";
import { roomButton } from "@/components/live-room/RoomStatus";
import { landingPathFor } from "@/lib/auth";
import { entrySession, joinBlockFor, roomAccess, sessionWhen } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ready?: string }>;
};

export const generateMetadata = ({ params }: Props): Promise<Metadata> => liveSessionMetadata(params);

/**
 * One room per session for every role. What each person may do in it comes
 * from the backend's entry details. `?ready=1` means they've just checked
 * their devices, so it goes straight in.
 */
export default async function LiveRoomPage({ params, searchParams }: Props) {
  const [{ id }, { ready }] = await Promise.all([params, searchParams]);

  // `undefined` when the backend is slow to answer: only a definite
  // "signed out" sends them to sign-in.
  const auth = await getServerSession().catch(() => undefined);
  if (auth === null) redirect(`/sign-in?${new URLSearchParams({ next: `/live/${id}` })}`);
  const homeHref = auth ? landingPathFor(auth.user) : "/";

  const entry = await loadSessionEntry(id);
  if (!entry) {
    return (
      <main className="flex h-dvh flex-col bg-surface-background">
        <EntryUnavailable
          actions={
            <Link href={homeHref} className={roomButton.secondary}>
              Back to dashboard
            </Link>
          }
        />
      </main>
    );
  }

  const session = entrySession(entry);

  return (
    <LiveRoom
      sessionId={session.id}
      title={session.title}
      when={sessionWhen(session)}
      block={joinBlockFor(entry)}
      starts={entry.join.blockedReason === "NOT_STARTED"}
      access={roomAccess(entry)}
      autoJoin={ready === "1"}
      userName={auth?.user.name ?? ""}
      userKey={auth?.user.id ?? id}
      homeHref={homeHref}
    />
  );
}
