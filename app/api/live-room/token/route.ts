import { AccessToken, TrackSource } from "livekit-server-sdk";
import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api";
import { getLiveSession, getSessionEntry } from "@/lib/live-sessions";
import { getServerSession } from "@/lib/session.server";

const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Admin",
  SUPERADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  MENTOR: "Mentor",
};

// PENDING-BACKEND: the backend's entry details decide who may join and with
// what powers, but don't include a LiveKit token yet, so this signs one from
// them. Never runs in production builds, so the LiveKit secret stays in
// .env.local and never needs to reach Vercel.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    return Response.json(
      { message: "Set NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local." },
      { status: 503 },
    );
  }

  const session = await getServerSession().catch(() => null);
  if (!session?.user) return new Response(null, { status: 401 });

  const id = request.nextUrl.searchParams.get("session");
  if (!id) {
    return Response.json({ message: "Missing session." }, { status: 400 });
  }

  const cookie = request.headers.get("cookie") ?? undefined;
  let entry, room;
  try {
    [entry, { roomName: room }] = await Promise.all([getSessionEntry(id, { cookie }), getLiveSession(id, { cookie })]);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    return Response.json({ message: "Couldn't check whether you can join this session." }, { status });
  }
  if (!entry.permissions.canJoin) {
    return Response.json({ message: "This session isn't open to you right now." }, { status: 403 });
  }

  const host = entry.permissions.canModerate;
  const sources = [TrackSource.MICROPHONE, TrackSource.CAMERA];
  if (entry.permissions.canShareScreen) sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);

  // A tab-specific suffix lets one account join from two tabs while testing.
  const tab = request.nextUrl.searchParams.get("tab") ?? "";
  const token = new AccessToken(apiKey, apiSecret, {
    identity: tab ? `${session.user.id}:${tab}` : session.user.id,
    name: session.user.name,
    attributes: { role: host ? "host" : "participant", label: roleLabels[session.user.role] ?? "" },
    ttl: "2h",
  });
  token.addGrant({
    room,
    roomJoin: true,
    roomAdmin: host,
    canPublish: entry.permissions.canPublishMedia,
    canPublishSources: sources,
    canSubscribe: true,
    canPublishData: true,
    // Lets people raise and lower their hand through their own attributes.
    canUpdateOwnMetadata: true,
  });

  return Response.json({ url, token: await token.toJwt() });
}
