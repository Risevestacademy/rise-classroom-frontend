import { AccessToken } from "livekit-server-sdk";
import type { NextRequest } from "next/server";

import { getServerSession } from "@/lib/session.server";

// PENDING-BACKEND: stands in for `POST /live-sessions/:id/join` until the
// backend issues tokens. Never runs in production builds, so the LiveKit
// secret stays in .env.local and never needs to reach Vercel.
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

  const room = request.nextUrl.searchParams.get("session");
  if (!room) {
    return Response.json({ message: "Missing session." }, { status: 400 });
  }

  // The backend will make the session's assigned instructor or mentor the
  // host; here anyone who isn't a student is, so host controls can be tried.
  const host = session.user.role !== "STUDENT";

  // A tab-specific suffix lets one account join from two tabs while testing.
  const tab = request.nextUrl.searchParams.get("tab") ?? "";
  const token = new AccessToken(apiKey, apiSecret, {
    identity: tab ? `${session.user.id}:${tab}` : session.user.id,
    name: session.user.name,
    attributes: { role: host ? "host" : "participant" },
    ttl: "2h",
  });
  token.addGrant({
    room,
    roomJoin: true,
    roomAdmin: host,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Lets people raise and lower their hand through their own attributes.
    canUpdateOwnMetadata: true,
  });

  return Response.json({ url, token: await token.toJwt() });
}
